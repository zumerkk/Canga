const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const AnnualLeave = require('../models/AnnualLeave');
const mongoose = require('mongoose');

// Her request'i log'la
router.use((req, res, next) => {
  console.log(`📆 AnnualLeave API Request: ${req.method} ${req.originalUrl} [Client IP: ${req.ip}]`);
  next();
});

// Route yönetiminde yardımcı hata yakalama fonksiyonu
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(err => {
    console.error(`❌ AnnualLeave Route Error: ${err.message}`, err.stack);
    res.status(200).json({
      success: false,
      message: err.message || 'İşlem sırasında bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
};



// 📊 Tüm çalışanların izin durumlarını getir
router.get('/', async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Tüm çalışanları çek
    const employees = await Employee.find({ 
      durum: 'AKTIF' // Sadece aktif çalışanlar
    }).select('_id adSoyad dogumTarihi iseGirisTarihi employeeId departman');

    // İzin kayıtlarını al
    const leaveRecords = await AnnualLeave.find({
      'leaveByYear.year': currentYear
    }).lean();

    // Map oluştur (hızlı lookup için)
    const leaveMap = leaveRecords.reduce((acc, record) => {
      acc[record.employeeId.toString()] = record;
      return acc;
    }, {});

    // Sonuç listesi oluştur
    const result = await Promise.all(employees.map(async (employee) => {
      const empId = employee._id.toString();
      const leaveRecord = leaveMap[empId];
      
      // Yaş hesapla
      const birthDate = employee.dogumTarihi ? new Date(employee.dogumTarihi) : null;
      const age = birthDate ? calculateAge(birthDate) : null;
      
      // İşe başlangıçtan bu yana geçen süre
      const hireDate = employee.iseGirisTarihi ? new Date(employee.iseGirisTarihi) : null;
      const yearsOfService = hireDate ? calculateYearsOfService(hireDate) : null;
      
      // Bu yıla ait izin kaydı
      const currentYearLeave = leaveRecord?.leaveByYear.find(l => l.year === currentYear) || { entitled: 0, used: 0, leaveRequests: [] };
      
      // Son 5 yıldaki izin geçmişini topla
      const leaveHistory = {};
      for (let i = 0; i < 5; i++) {
        const year = currentYear - i;
        const yearLeave = leaveRecord?.leaveByYear.find(l => l.year === year);
        leaveHistory[year] = yearLeave?.used || 0;
      }

      return {
        _id: employee._id,
        employeeId: employee.employeeId,
        adSoyad: employee.adSoyad,
        dogumTarihi: employee.dogumTarihi,
        iseGirisTarihi: employee.iseGirisTarihi,
        departman: employee.departman,
        yas: age,
        hizmetYili: yearsOfService,
        izinBilgileri: {
          hakEdilen: currentYearLeave.entitled,
          kullanilan: currentYearLeave.used,
          kalan: (currentYearLeave.entitled || 0) - (currentYearLeave.used || 0),
          leaveRequests: currentYearLeave.leaveRequests || []
        },
        izinGecmisi: leaveHistory
      };
    }));

    res.json({
      success: true,
      data: result,
      year: currentYear,
      total: result.length
    });

  } catch (error) {
    console.error('❌ İzin listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin bilgileri getirilemedi',
      error: error.message
    });
  }
});

// 📋 Tüm izin taleplerini getir
router.get('/requests', async (req, res) => {
  try {
    const { status, employeeId, year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    console.log(`📊 İzin talepleri istendi: year=${year}, currentYear=${currentYear}, path=${req.originalUrl}`);

    // Filtreleme koşulları
    const matchConditions = {};
    
    if (employeeId) {
      matchConditions.employeeId = mongoose.Types.ObjectId.isValid(employeeId) ? 
        new mongoose.Types.ObjectId(employeeId) : employeeId;
    }

    // İzin kayıtlarını al ve çalışan bilgileriyle birleştir
    try {
      const leaveRecords = await AnnualLeave.aggregate([
        { $match: matchConditions },
        { $unwind: { path: "$leaveByYear", preserveNullAndEmptyArrays: false } },
        { $match: { 'leaveByYear.year': currentYear } },
        { $unwind: { path: "$leaveByYear.leaveRequests", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: '$leaveByYear.leaveRequests._id',
            employeeId: '$employeeId',
            employeeName: '$employee.adSoyad',
            department: '$employee.departman',
            startDate: '$leaveByYear.leaveRequests.startDate',
            endDate: '$leaveByYear.leaveRequests.endDate',
            days: '$leaveByYear.leaveRequests.days',
            status: '$leaveByYear.leaveRequests.status',
            notes: '$leaveByYear.leaveRequests.notes',
            createdAt: '$leaveByYear.leaveRequests.createdAt',
            year: '$leaveByYear.year'
          }
        },
        { $sort: { createdAt: -1 } }
      ]);

      console.log(`📊 İzin talepleri bulundu: ${leaveRecords?.length || 0} talep`);
      
      // Status filtresi uygula
      let filteredRequests = leaveRecords ? leaveRecords.filter(req => req._id) : [];
      
      if (status && filteredRequests.length > 0) {
        filteredRequests = filteredRequests.filter(req => req.status === status);
      }

      return res.json({
        success: true,
        message: filteredRequests.length > 0 
          ? `${filteredRequests.length} izin talebi bulundu` 
          : `${currentYear} yılına ait izin talebi bulunamadı`,
        data: filteredRequests || [],
        total: filteredRequests.length,
        year: currentYear
      });
    } catch (aggregateError) {
      console.error('📊 Aggregation hatası:', aggregateError);
      
      // Aggregation hata verirse boş sonuç dön
      return res.json({
        success: true,
        message: `${currentYear} yılına ait izin talebi bulunamadı (veri yok)`,
        data: [],
        total: 0,
        year: currentYear,
        debug: process.env.NODE_ENV === 'development' ? aggregateError.message : null
      });
    }
  } catch (error) {
    console.error('❌ İzin talepleri listesi hatası:', error);
    // 500 yerine 200 ile hata mesajı dönelim ki frontend'de daha iyi işlenebilsin
    return res.status(200).json({
      success: false,
      message: 'İzin talepleri getirilemedi: ' + error.message,
      error: error.message,
      data: [],
      total: 0
    });
  }
});

// 📆 Belirli bir çalışanın izin detaylarını getir
router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Çalışan bilgilerini getir
    const employee = await Employee.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(employeeId) ? employeeId : null },
        { employeeId: employeeId }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı'
      });
    }

    // İzin kaydını getir
    const leaveRecord = await AnnualLeave.findOne({
      employeeId: employee._id
    }).lean();

    // Eğer kayıt yoksa hesapla ve oluştur
    if (!leaveRecord) {
      const calculatedLeave = await calculateEmployeeLeave(employee);
      
      return res.json({
        success: true,
        data: {
          employee: {
            _id: employee._id,
            adSoyad: employee.adSoyad,
            dogumTarihi: employee.dogumTarihi,
            iseGirisTarihi: employee.iseGirisTarihi,
            employeeId: employee.employeeId,
            yas: calculateAge(employee.dogumTarihi),
            hizmetYili: calculateYearsOfService(employee.iseGirisTarihi)
          },
          leaveRecord: calculatedLeave
        }
      });
    }

    res.json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          adSoyad: employee.adSoyad,
          dogumTarihi: employee.dogumTarihi,
          iseGirisTarihi: employee.iseGirisTarihi,
          employeeId: employee.employeeId,
          yas: calculateAge(employee.dogumTarihi),
          hizmetYili: calculateYearsOfService(employee.iseGirisTarihi)
        },
        leaveRecord: leaveRecord
      }
    });

  } catch (error) {
    console.error('❌ Çalışan izin detayları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin detayları getirilemedi',
      error: error.message
    });
  }
});

// 🔄 Tüm çalışanların izin durumlarını hesapla ve güncelle
router.post('/calculate', async (req, res) => {
  try {
    // Aktif çalışanları getir
    const employees = await Employee.find({ durum: 'AKTIF' });
    console.log(`📊 ${employees.length} çalışan için izin hesaplaması yapılıyor...`);

    const results = {
      success: 0,
      failed: 0,
      details: []
    };

    // Her çalışan için izin hesapla
    for (const employee of employees) {
      try {
        await calculateAndSaveEmployeeLeave(employee);
        results.success++;
        results.details.push({
          employeeId: employee.employeeId,
          adSoyad: employee.adSoyad,
          status: 'success'
        });
      } catch (error) {
        console.error(`❌ ${employee.adSoyad} için izin hesaplama hatası:`, error);
        results.failed++;
        results.details.push({
          employeeId: employee.employeeId,
          adSoyad: employee.adSoyad,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `${results.success} çalışan için izin hesaplandı, ${results.failed} hata`,
      data: results
    });

  } catch (error) {
    console.error('❌ Toplu izin hesaplama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin hesaplaması yapılamadı',
      error: error.message
    });
  }
});

// 📝 İzin kullanımı ekle
router.post('/:employeeId/use', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, days, startDate, endDate, notes } = req.body;

    if (!days || days <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli gün sayısı girilmelidir'
      });
    }

    // Çalışan bilgilerini getir
    const employee = await Employee.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(employeeId) ? employeeId : null },
        { employeeId: employeeId }
      ]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı'
      });
    }

    // İzin kaydını getir veya oluştur
    let leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
    
    if (!leaveRecord) {
      // İzin kaydı yoksa hesapla ve oluştur
      const calculatedLeave = await calculateEmployeeLeave(employee);
      
      leaveRecord = new AnnualLeave({
        employeeId: employee._id,
        leaveByYear: calculatedLeave.leaveByYear,
        totalLeaveStats: calculatedLeave.totalLeaveStats
      });
    }

    // Yıla ait izin kaydı var mı kontrol et
    const currentYear = parseInt(year) || new Date().getFullYear();
    let yearlyLeave = leaveRecord.leaveByYear.find(leave => leave.year === currentYear);
    
    if (!yearlyLeave) {
      // Yıla ait izin kaydı yoksa oluştur
      const entitledDays = calculateEntitledLeaveDays(employee, currentYear);
      
      yearlyLeave = {
        year: currentYear,
        entitled: entitledDays,
        used: 0,
        entitlementDate: new Date(currentYear, 0, 1), // 1 Ocak
        leaveRequests: []
      };
      
      leaveRecord.leaveByYear.push(yearlyLeave);
    }

    // İzin talebi ekle
    const leaveRequest = {
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(),
      days: days,
      status: 'ONAYLANDI', // Varsayılan olarak onaylandı kabul ediyoruz
      notes: notes || ''
    };

    yearlyLeave.leaveRequests.push(leaveRequest);
    
    // Kullanılan izin günlerini güncelle
    yearlyLeave.used += days;
    
    // Toplam istatistikleri güncelle
    leaveRecord.totalLeaveStats.totalUsed += days;
    leaveRecord.totalLeaveStats.remaining = 
      leaveRecord.totalLeaveStats.totalEntitled - leaveRecord.totalLeaveStats.totalUsed;
    
    // Son hesaplama tarihini güncelle
    leaveRecord.lastCalculationDate = new Date();
    
    // Kaydet
    await leaveRecord.save();

    res.json({
      success: true,
      message: `${employee.adSoyad} için ${days} gün izin kullanımı eklendi`,
      data: leaveRecord
    });

  } catch (error) {
    console.error('❌ İzin kullanımı ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin kullanımı eklenemedi',
      error: error.message
    });
  }
});

// 📝 İzin talebi oluştur
router.post('/request', async (req, res) => {
  try {
    const { employeeId, startDate, endDate, days, notes } = req.body;

    if (!employeeId || !startDate || !endDate || !days) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik'
      });
    }

    // Çalışan bilgilerini getir
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı'
      });
    }

    // İzin kaydını getir veya oluştur
    let leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
    
    if (!leaveRecord) {
      const calculatedLeave = await calculateEmployeeLeave(employee);
      leaveRecord = new AnnualLeave({
        employeeId: employee._id,
        leaveByYear: calculatedLeave.leaveByYear,
        totalLeaveStats: calculatedLeave.totalLeaveStats
      });
    }

    // Bu yılın izin kaydını bul
    const currentYear = new Date().getFullYear();
    let yearlyLeave = leaveRecord.leaveByYear.find(leave => leave.year === currentYear);
    
    if (!yearlyLeave) {
      const entitledDays = calculateEntitledLeaveDays(employee, currentYear);
      yearlyLeave = {
        year: currentYear,
        entitled: entitledDays,
        used: 0,
        entitlementDate: new Date(currentYear, 0, 1),
        leaveRequests: []
      };
      leaveRecord.leaveByYear.push(yearlyLeave);
    }

    // Kalan izin kontrolü
    const remainingLeave = yearlyLeave.entitled - yearlyLeave.used;
    if (days > remainingLeave) {
      return res.status(400).json({
        success: false,
        message: `Yetersiz izin hakkı. Kalan izin: ${remainingLeave} gün`
      });
    }

    // İzin talebi oluştur
    const leaveRequest = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days: parseInt(days),
      status: 'ONAYLANDI',
      notes: notes || '',
      requestDate: new Date()
    };

    yearlyLeave.leaveRequests.push(leaveRequest);
    yearlyLeave.used += parseInt(days);
    
    // Toplam istatistikleri güncelle
    leaveRecord.totalLeaveStats.totalUsed += parseInt(days);
    leaveRecord.totalLeaveStats.remaining = 
      leaveRecord.totalLeaveStats.totalEntitled - leaveRecord.totalLeaveStats.totalUsed;
    
    leaveRecord.lastCalculationDate = new Date();
    await leaveRecord.save();

    res.json({
      success: true,
      message: 'İzin talebi başarıyla oluşturuldu',
      data: leaveRequest
    });

  } catch (error) {
    console.error('❌ İzin talebi oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin talebi oluşturulamadı',
      error: error.message
    });
  }
});

// 📝 İzin talebini düzenle
router.put('/:employeeId/edit-request/:requestId', async (req, res) => {
  try {
    const { employeeId, requestId } = req.params;
    const { startDate, endDate, days, notes } = req.body;

    // Çalışanı bul
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı'
      });
    }

    // İzin kaydını bul
    const leaveRecord = await AnnualLeave.findOne({ employeeId });
    if (!leaveRecord) {
      return res.status(404).json({
        success: false,
        message: 'İzin kaydı bulunamadı'
      });
    }

    // İzin talebini bul ve güncelle
    const currentYear = new Date(startDate).getFullYear();
    const yearRecord = leaveRecord.leaveByYear.find(y => y.year === currentYear);
    
    if (!yearRecord) {
      return res.status(404).json({
        success: false,
        message: 'Bu yıla ait izin kaydı bulunamadı'
      });
    }

    const request = yearRecord.leaveRequests.id(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'İzin talebi bulunamadı'
      });
    }

    // Kalan izin kontrolü
    const oldDays = request.days;
    const remainingDays = yearRecord.entitled - (yearRecord.used - oldDays);
    if (days > remainingDays) {
      return res.status(400).json({
        success: false,
        message: `Yetersiz izin hakkı. Kalan izin: ${remainingDays} gün`
      });
    }

    // İzin talebini güncelle
    request.startDate = new Date(startDate);
    request.endDate = new Date(endDate);
    request.days = days;
    request.notes = notes;

    // Kullanılan izin günlerini güncelle
    yearRecord.used = yearRecord.used - oldDays + days;
    leaveRecord.totalLeaveStats.totalUsed = leaveRecord.totalLeaveStats.totalUsed - oldDays + days;
    leaveRecord.totalLeaveStats.remaining = leaveRecord.totalLeaveStats.totalEntitled - leaveRecord.totalLeaveStats.totalUsed;

    // Son güncelleme tarihini güncelle
    leaveRecord.lastCalculationDate = new Date();

    // Kaydet
    await leaveRecord.save();

    res.json({
      success: true,
      message: 'İzin talebi güncellendi',
      data: leaveRecord
    });

  } catch (error) {
    console.error('❌ İzin düzenleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin talebi güncellenemedi',
      error: error.message
    });
  }
});

// 🗑️ İzin talebini sil
router.delete('/:employeeId/delete-request/:requestId', async (req, res) => {
  try {
    const { employeeId, requestId } = req.params;

    // Çalışanı bul
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı'
      });
    }

    // İzin kaydını bul
    const leaveRecord = await AnnualLeave.findOne({ employeeId });
    if (!leaveRecord) {
      return res.status(404).json({
        success: false,
        message: 'İzin kaydı bulunamadı'
      });
    }

    // İzin talebini bul
    const currentYear = new Date().getFullYear();
    const yearRecord = leaveRecord.leaveByYear.find(y => y.year === currentYear);
    
    if (!yearRecord) {
      return res.status(404).json({
        success: false,
        message: 'Bu yıla ait izin kaydı bulunamadı'
      });
    }

    const request = yearRecord.leaveRequests.id(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'İzin talebi bulunamadı'
      });
    }

    // Kullanılan izin günlerini güncelle
    yearRecord.used -= request.days;
    leaveRecord.totalLeaveStats.totalUsed -= request.days;
    leaveRecord.totalLeaveStats.remaining = leaveRecord.totalLeaveStats.totalEntitled - leaveRecord.totalLeaveStats.totalUsed;

    // İzin talebini sil
    yearRecord.leaveRequests.pull(requestId);

    // Kaydet
    await leaveRecord.save();

    res.json({
      success: true,
      message: 'İzin talebi silindi',
      data: leaveRecord
    });

  } catch (error) {
    console.error('❌ İzin silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin talebi silinemedi',
      error: error.message
    });
  }
});

// 📋 Tüm izin taleplerini getir
router.get('/requests', async (req, res) => {
  try {
    const { status, employeeId, year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    console.log(`📊 İzin talepleri istendi: year=${year}, currentYear=${currentYear}, path=${req.originalUrl}`);

    // Filtreleme koşulları
    const matchConditions = {};
    
    if (employeeId) {
      matchConditions.employeeId = mongoose.Types.ObjectId.isValid(employeeId) ? 
        new mongoose.Types.ObjectId(employeeId) : employeeId;
    }

    // İzin kayıtlarını al ve çalışan bilgileriyle birleştir
    try {
      const leaveRecords = await AnnualLeave.aggregate([
        { $match: matchConditions },
        { $unwind: { path: "$leaveByYear", preserveNullAndEmptyArrays: false } },
        { $match: { 'leaveByYear.year': currentYear } },
        { $unwind: { path: "$leaveByYear.leaveRequests", preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'employees',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: '$leaveByYear.leaveRequests._id',
            employeeId: '$employeeId',
            employeeName: '$employee.adSoyad',
            department: '$employee.departman',
            startDate: '$leaveByYear.leaveRequests.startDate',
            endDate: '$leaveByYear.leaveRequests.endDate',
            days: '$leaveByYear.leaveRequests.days',
            status: '$leaveByYear.leaveRequests.status',
            notes: '$leaveByYear.leaveRequests.notes',
            createdAt: '$leaveByYear.leaveRequests.createdAt',
            year: '$leaveByYear.year'
          }
        },
        { $sort: { createdAt: -1 } }
      ]);

      console.log(`📊 İzin talepleri bulundu: ${leaveRecords?.length || 0} talep`);
      
      // Status filtresi uygula
      let filteredRequests = leaveRecords ? leaveRecords.filter(req => req._id) : [];
      
      if (status && filteredRequests.length > 0) {
        filteredRequests = filteredRequests.filter(req => req.status === status);
      }

      return res.json({
        success: true,
        message: filteredRequests.length > 0 
          ? `${filteredRequests.length} izin talebi bulundu` 
          : `${currentYear} yılına ait izin talebi bulunamadı`,
        data: filteredRequests || [],
        total: filteredRequests.length,
        year: currentYear
      });
    } catch (aggregateError) {
      console.error('📊 Aggregation hatası:', aggregateError);
      
      // Aggregation hata verirse boş sonuç dön
      return res.json({
        success: true,
        message: `${currentYear} yılına ait izin talebi bulunamadı (veri yok)`,
        data: [],
        total: 0,
        year: currentYear,
        debug: process.env.NODE_ENV === 'development' ? aggregateError.message : null
      });
    }
  } catch (error) {
    console.error('❌ İzin talepleri listesi hatası:', error);
    // 500 yerine 200 ile hata mesajı dönelim ki frontend'de daha iyi işlenebilsin
    return res.status(200).json({
      success: false,
      message: 'İzin talepleri getirilemedi: ' + error.message,
      error: error.message,
      data: [],
      total: 0
    });
  }
});

// 📊 Genel izin istatistikleri
router.get('/stats/overview', async (req, res) => {
  try {
    // İzin kullanım istatistikleri
    const stats = {
      totalEmployees: await Employee.countDocuments({ durum: 'AKTIF' }),
      employeesWithLeave: await AnnualLeave.countDocuments(),
      totalLeaveDays: 0,
      usedLeaveDays: 0,
      remainingLeaveDays: 0,
      currentYearStats: {
        entitled: 0,
        used: 0,
        remaining: 0
      }
    };

    // Toplam izin günleri
    const leaveAggregation = await AnnualLeave.aggregate([
      {
        $group: {
          _id: null,
          totalEntitled: { $sum: '$totalLeaveStats.totalEntitled' },
          totalUsed: { $sum: '$totalLeaveStats.totalUsed' },
          totalRemaining: { $sum: '$totalLeaveStats.remaining' }
        }
      }
    ]);

    if (leaveAggregation.length > 0) {
      stats.totalLeaveDays = leaveAggregation[0].totalEntitled || 0;
      stats.usedLeaveDays = leaveAggregation[0].totalUsed || 0;
      stats.remainingLeaveDays = leaveAggregation[0].totalRemaining || 0;
    }

    // Bu yılın istatistikleri
    const currentYear = new Date().getFullYear();
    const currentYearAggregation = await AnnualLeave.aggregate([
      { $unwind: '$leaveByYear' },
      { $match: { 'leaveByYear.year': currentYear } },
      {
        $group: {
          _id: null,
          entitled: { $sum: '$leaveByYear.entitled' },
          used: { $sum: '$leaveByYear.used' },
        }
      }
    ]);

    if (currentYearAggregation.length > 0) {
      stats.currentYearStats.entitled = currentYearAggregation[0].entitled || 0;
      stats.currentYearStats.used = currentYearAggregation[0].used || 0;
      stats.currentYearStats.remaining = stats.currentYearStats.entitled - stats.currentYearStats.used;
    }

    res.json({
      success: true,
      data: stats,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ İzin istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin istatistikleri getirilemedi',
      error: error.message
    });
  }
});

// YARDIMCI FONKSİYONLAR

// 🧮 Yaş hesaplama
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// 🧮 Hizmet yılı hesaplama
function calculateYearsOfService(hireDate) {
  if (!hireDate) return null;
  
  const today = new Date();
  const hire = new Date(hireDate);
  
  // Geçersiz tarih kontrolü
  if (hire > today) {
    return 0; // Gelecek tarih ise 0 döndür
  }
  
  // Şirket kuruluş yılı 2014 - bundan önce işe giriş olamaz
  const companyFoundingYear = 2014;
  if (hire.getFullYear() < companyFoundingYear) {
    // Eğer işe giriş tarihi 2014'ten önceyse, 2014'e ayarla
    hire.setFullYear(companyFoundingYear);
  }
  
  let years = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
    years--;
  }
  
  // Negatif değer kontrolü
  return Math.max(0, years);
}

// 🧮 Hak edilen izin günlerini hesapla
function calculateEntitledLeaveDays(employee, year) {
  if (!employee.dogumTarihi || !employee.iseGirisTarihi) {
    return 0;
  }
  
  const birthDate = new Date(employee.dogumTarihi);
  const hireDate = new Date(employee.iseGirisTarihi);
  const checkDate = new Date(year, 0, 1); // Yılın 1 Ocak'ı
  
  // Yaş ve hizmet yılı hesapla
  const age = checkDate.getFullYear() - birthDate.getFullYear();
  let yearsOfService = checkDate.getFullYear() - hireDate.getFullYear();
  
  // İşe giriş yılındaysak tam yıl saymayalım
  if (checkDate.getFullYear() === hireDate.getFullYear()) {
    return 0; // İlk yılda henüz izin hak edilmez
  }
  
  // İşe giriş ayına göre yıl ayarlaması
  const monthDiff = checkDate.getMonth() - hireDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && checkDate.getDate() < hireDate.getDate())) {
    yearsOfService--;
  }
  
  // İzin kuralları:
  // 1. 50 yaş üzeri çalışanlar ilk yıldan itibaren 20 gün izin hak ederler
  // 2. 50 yaş altı çalışanlar ilk 5 yıl 14 gün, sonrasında 20 gün izin hak ederler
  if (age >= 50) {
    return yearsOfService > 0 ? 20 : 0;
  } else {
    if (yearsOfService <= 0) {
      return 0; // Henüz 1 yılını doldurmadı
    } else if (yearsOfService <= 5) {
      return 14; // İlk 5 yıl
    } else {
      return 20; // 5 yıldan sonra
    }
  }
}

// 🧮 Çalışan izin hesaplaması
async function calculateEmployeeLeave(employee) {
  const currentYear = new Date().getFullYear();
  
  // En fazla 15 yıl geriye git
  const startYear = Math.max(
    employee.iseGirisTarihi ? new Date(employee.iseGirisTarihi).getFullYear() : currentYear,
    currentYear - 15
  );
  
  const leaveByYear = [];
  let totalEntitled = 0;
  let totalUsed = 0;
  
  // Her yıl için izin hesapla
  for (let year = startYear; year <= currentYear; year++) {
    const entitledDays = calculateEntitledLeaveDays(employee, year);
    
    if (entitledDays > 0) {
      leaveByYear.push({
        year,
        entitled: entitledDays,
        used: 0, // İlk hesaplamada kullanım 0
        entitlementDate: new Date(year, 0, 1), // 1 Ocak
        leaveRequests: []
      });
      
      totalEntitled += entitledDays;
    }
  }
  
  return {
    leaveByYear,
    totalLeaveStats: {
      totalEntitled,
      totalUsed,
      remaining: totalEntitled - totalUsed
    }
  };
}

// 🧮 Çalışan izin hesaplaması ve kaydetme
async function calculateAndSaveEmployeeLeave(employee) {
  // Mevcut izin kaydını kontrol et
  let leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
  
  if (!leaveRecord) {
    // Yeni kayıt oluştur
    const calculatedLeave = await calculateEmployeeLeave(employee);
    
    leaveRecord = new AnnualLeave({
      employeeId: employee._id,
      leaveByYear: calculatedLeave.leaveByYear,
      totalLeaveStats: calculatedLeave.totalLeaveStats,
      lastCalculationDate: new Date()
    });
  } else {
    // Var olan kaydı güncelle
    const currentYear = new Date().getFullYear();
    
    // Bu yılın kaydı var mı kontrol et
    let currentYearRecord = leaveRecord.leaveByYear.find(record => record.year === currentYear);
    
    if (!currentYearRecord) {
      // Bu yılın kaydı yoksa ekle
      const entitledDays = calculateEntitledLeaveDays(employee, currentYear);
      
      if (entitledDays > 0) {
        currentYearRecord = {
          year: currentYear,
          entitled: entitledDays,
          used: 0,
          entitlementDate: new Date(currentYear, 0, 1),
          leaveRequests: []
        };
        
        leaveRecord.leaveByYear.push(currentYearRecord);
        
        // Toplam izin günlerini güncelle
        leaveRecord.totalLeaveStats.totalEntitled += entitledDays;
        leaveRecord.totalLeaveStats.remaining = 
          leaveRecord.totalLeaveStats.totalEntitled - leaveRecord.totalLeaveStats.totalUsed;
      }
    }
    
    leaveRecord.lastCalculationDate = new Date();
  }
  
  // Kaydet
  await leaveRecord.save();
  return leaveRecord;
}

module.exports = router;
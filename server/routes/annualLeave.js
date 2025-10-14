const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const AnnualLeave = require('../models/AnnualLeave');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');

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



// Yardımcı: Belirtilen yıl için TR resmi tatillerinin basit listesi (sabit tarihli)
function getTurkishPublicHolidays(year) {
  // Not: Dini bayramlar (Ramazan/Kurban) değişken tarihlidir ve burada kapsanmamıştır.
  // Gerekirse .env veya DB üzerinden dinamik liste eklenebilir.
  const fixedDates = [
    `${year}-01-01`, // Yılbaşı
    `${year}-04-23`, // Ulusal Egemenlik ve Çocuk Bayramı
    `${year}-05-01`, // Emek ve Dayanışma Günü
    `${year}-05-19`, // Atatürk'ü Anma, Gençlik ve Spor Bayramı
    `${year}-07-15`, // Demokrasi ve Milli Birlik Günü
    `${year}-08-30`, // Zafer Bayramı
    `${year}-10-29`  // Cumhuriyet Bayramı
  ];
  return new Set(fixedDates);
}

// Yardımcı: İki tarih (dahil) arasındaki izin gün sayısını, Pazar ve resmi tatilleri hariç tutarak hesaplar
function calculateLeaveDaysExcludingSundaysAndHolidays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end < start) return 0;

  const holidays = getTurkishPublicHolidays(start.getFullYear());
  if (end.getFullYear() !== start.getFullYear()) {
    // Yıl sonunu aşan taleplerde ikinci yılın sabit tatillerini de ekle
    const nextYearHolidays = getTurkishPublicHolidays(end.getFullYear());
    nextYearHolidays.forEach(d => holidays.add(d));
  }

  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    const isSunday = current.getDay() === 0; // 0 = Pazar
    const iso = current.toISOString().slice(0, 10);
    const isHoliday = holidays.has(iso);
    if (!isSunday && !isHoliday) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// Yardımcı: Belirli bir yıl için önceki yıllardan devreden toplam hakedişi hesapla
// NOT: Negatif değerler de dahil edilir (fazla kullanım durumu)
function calculateCarryover(leaveRecord, currentYear) {
  if (!leaveRecord || !Array.isArray(leaveRecord.leaveByYear)) return 0;
  
  // Önceki yılların toplam kalanını hesapla (pozitif veya negatif olabilir)
  return leaveRecord.leaveByYear
    .filter(y => y.year < currentYear)
    .reduce((sum, y) => {
      // Kalan = Hak edilen - Kullanılan (negatif olabilir)
      const remaining = (y.entitled || 0) - (y.used || 0);
      return sum + remaining;
    }, 0);
}

// Yardımcı: Devirden tüketim yap (en eski yıldan başlayarak), tüketilen gün sayısını döndür
function consumeCarryover(leaveRecord, currentYear, daysToConsume) {
  if (!leaveRecord || !Array.isArray(leaveRecord.leaveByYear) || daysToConsume <= 0) return 0;
  let remaining = daysToConsume;
  // En eski yıldan bugüne sırala
  const sorted = [...leaveRecord.leaveByYear]
    .filter(y => y.year < currentYear)
    .sort((a, b) => a.year - b.year);
  for (const y of sorted) {
    const available = Math.max(0, (y.entitled || 0) - (y.used || 0));
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    y.used = (y.used || 0) + take;
    remaining -= take;
    if (remaining <= 0) break;
  }
  return daysToConsume - remaining; // tüketilen miktar
}

// Yardımcı: Devirden iade et (kullanılmış günleri geri aç). Önce mevcut yıl kaydından iade, sonra geçmiş yıllardan yeniye doğru iade
function freeCarryover(leaveRecord, currentYear, daysToFree) {
  if (!leaveRecord || !Array.isArray(leaveRecord.leaveByYear) || daysToFree <= 0) return 0;
  let remaining = daysToFree;
  // Önce mevcut yıl
  const current = leaveRecord.leaveByYear.find(y => y.year === currentYear);
  if (current) {
    const canFree = Math.min(current.used || 0, remaining);
    current.used = (current.used || 0) - canFree;
    remaining -= canFree;
  }
  if (remaining <= 0) return daysToFree;
  // Sonra geçmiş yıllardan yeniye doğru (tersten) iade
  const sorted = [...leaveRecord.leaveByYear]
    .filter(y => y.year < currentYear)
    .sort((a, b) => b.year - a.year);
  for (const y of sorted) {
    const canFree = Math.min(y.used || 0, remaining);
    y.used = (y.used || 0) - canFree;
    remaining -= canFree;
    if (remaining <= 0) break;
  }
  return daysToFree - remaining; // iade edilen miktar
}

// 📊 Tüm çalışanların izin durumlarını getir
router.get('/', async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Tüm çalışanları çek (Stajyer ve Çıraklar hariç)
    const employees = await Employee.find({ 
      durum: 'AKTIF', // Sadece aktif çalışanlar
      $and: [
        {
          $or: [
            { pozisyon: { $exists: false } }, // Pozisyon alanı yoksa dahil et
            { pozisyon: { $not: { $regex: /(stajyer|çırak|stajer)/i } } } // Pozisyonunda stajyer/çırak olmayanlar
          ]
        },
        {
          $or: [
            { departman: { $exists: false } }, // Departman alanı yoksa dahil et
            { departman: { $not: { $regex: /(stajyer|çırak|stajer)/i } } } // Departmanında stajyer/çırak olmayanlar
          ]
        }
      ]
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
      // Kural gereği olması gereken hakedişi hesapla (DB'deki eski değer 14 ise 20 ile override edelim)
      const computedEntitled = calculateEntitledLeaveDays(employee, currentYear) || 0;
      const effectiveEntitled = computedEntitled > 0 ? computedEntitled : (currentYearLeave.entitled || 0);
      // Devir kalanını hesapla (pozitif veya negatif olabilir)
      const carryover = calculateCarryover(leaveRecord, currentYear);
      
      // 2017'den bugüne tüm yılların izin geçmişini topla
      const leaveHistory = {};
      const startHistoryYear = 2017;
      for (let year = startHistoryYear; year <= currentYear; year++) {
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
          hakEdilen: effectiveEntitled,
          kullanilan: currentYearLeave.used || 0,
          carryover: carryover,
          kalan: effectiveEntitled + carryover - (currentYearLeave.used || 0),
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
        const leaveRecord = await calculateAndSaveEmployeeLeave(employee);
        // Güncel yıl entitled değeri kural değişmişse güncelle
        const currentYear = new Date().getFullYear();
        const currentYearRecord = leaveRecord.leaveByYear.find(y => y.year === currentYear);
        if (currentYearRecord) {
          const shouldBe = calculateEntitledLeaveDays(employee, currentYear) || 0;
          if (shouldBe > 0 && currentYearRecord.entitled !== shouldBe) {
            // Toplam istatistikleri düzelt
            const delta = shouldBe - (currentYearRecord.entitled || 0);
            currentYearRecord.entitled = shouldBe;
            leaveRecord.totalLeaveStats.totalEntitled = (leaveRecord.totalLeaveStats.totalEntitled || 0) + delta;
            leaveRecord.totalLeaveStats.remaining = (leaveRecord.totalLeaveStats.totalEntitled || 0) - (leaveRecord.totalLeaveStats.totalUsed || 0);
            await leaveRecord.save();
          }
        }
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
    const currentYear = parseInt(year) || (startDate ? new Date(startDate).getFullYear() : new Date().getFullYear());
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

    // Gün sayısını Pazar ve resmi tatilleri düşerek hesapla (tarih verildiyse)
    let computedDays = days;
    if (startDate && endDate) {
      computedDays = calculateLeaveDaysExcludingSundaysAndHolidays(startDate, endDate);
      if (!computedDays || computedDays <= 0) {
        return res.status(400).json({ success: false, message: 'Geçerli tarih aralığı bulunamadı' });
      }
    }

    // Devir hesapla ve kalan kullanılabilir hakkı kontrol et
    const carryover = calculateCarryover(leaveRecord, currentYear);
    const available = (yearlyLeave.entitled || 0) + carryover - (yearlyLeave.used || 0);
    
    // UYARI: Negatif devire izin ver, ancak kullanıcıyı bilgilendir
    let warningMessage = null;
    if (computedDays > available) {
      const negativeAmount = computedDays - available;
      warningMessage = `DİKKAT: Bu izin kullanımı ile ${negativeAmount} gün negatif devir oluşacak. Bu miktar sonraki yılın hakkından düşülecektir.`;
    }

    // İzin kullanımını kaydet - Negatife düşebilir
    // NOT: Negatif devir durumunda consumeCarryover kullanmıyoruz
    const positiveCarryover = Math.max(0, carryover);
    const usedFromCarryover = Math.min(positiveCarryover, computedDays);
    const usedFromCurrent = computedDays - usedFromCarryover;
    
    // Önce pozitif devirden tüket
    if (usedFromCarryover > 0) {
      consumeCarryover(leaveRecord, currentYear, usedFromCarryover);
    }

    // İzin talebi ekle
    const leaveRequest = {
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(),
      days: computedDays,
      status: 'ONAYLANDI',
      notes: notes || '',
      type: 'NORMAL',
      deductedFromYear: undefined,
      createdAt: new Date(),
    };

    yearlyLeave.leaveRequests.push(leaveRequest);

    // Kullanılan izin günlerini güncelle
    yearlyLeave.used += computedDays;
    
    // Toplam istatistikleri güncelle
    leaveRecord.totalLeaveStats.totalUsed += computedDays;
    leaveRecord.totalLeaveStats.remaining = 
      leaveRecord.totalLeaveStats.totalEntitled - leaveRecord.totalLeaveStats.totalUsed;
    
    // Son hesaplama tarihini güncelle
    leaveRecord.lastCalculationDate = new Date();
    
    // Kaydet
    await leaveRecord.save();

    res.json({
      success: true,
      message: `${employee.adSoyad} için ${computedDays} gün izin kullanımı eklendi${warningMessage ? '. ' + warningMessage : ''}`,
      warning: warningMessage,
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

    // Gün sayısını Pazar ve resmi tatilleri düşerek hesapla
    const computedDays = calculateLeaveDaysExcludingSundaysAndHolidays(startDate, endDate);
    if (!computedDays || computedDays <= 0) {
      return res.status(400).json({ success: false, message: 'Geçerli tarih aralığı bulunamadı' });
    }

    // Devir hesapla ve kalan kullanılabilir hakkı kontrol et
    const carryover = calculateCarryover(leaveRecord, currentYear);
    const available = (yearlyLeave.entitled || 0) + carryover - (yearlyLeave.used || 0);
    if (computedDays > available) {
      return res.status(400).json({
        success: false,
        message: `Yetersiz izin hakkı. Kalan izin: ${available} gün (devir dahil)`
      });
    }

    // Devirden tüket
    const usedFromCarryover = consumeCarryover(leaveRecord, currentYear, computedDays);
    const usedFromCurrent = computedDays - usedFromCarryover;

    // İzin talebi oluştur
    const leaveRequest = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days: computedDays,
      status: 'ONAYLANDI',
      notes: notes || '',
      type: 'NORMAL',
      deductedFromYear: undefined,
      requestDate: new Date(),
      createdAt: new Date()
    };

    yearlyLeave.leaveRequests.push(leaveRequest);
    yearlyLeave.used += usedFromCurrent;
    
    // Toplam istatistikleri güncelle
    leaveRecord.totalLeaveStats.totalUsed += computedDays;
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

// 📝 ÖZEL İZİN: Gelecek yıldan düşecek şekilde izin talebi oluştur
router.post('/request/special', async (req, res) => {
  try {
    const { employeeId, startDate, endDate, days, notes } = req.body;

    if (!employeeId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Gerekli alanlar eksik' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Çalışan bulunamadı' });

    let leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
    if (!leaveRecord) {
      const calculatedLeave = await calculateEmployeeLeave(employee);
      leaveRecord = new AnnualLeave({
        employeeId: employee._id,
        leaveByYear: calculatedLeave.leaveByYear,
        totalLeaveStats: calculatedLeave.totalLeaveStats
      });
    }

    // Gün sayısı pazar/resmi tatil hariç hesap
    const computedDays = calculateLeaveDaysExcludingSundaysAndHolidays(startDate, endDate);
    if (!computedDays || computedDays <= 0) {
      return res.status(400).json({ success: false, message: 'Geçerli tarih aralığı bulunamadı' });
    }

    const currentYear = new Date().getFullYear();
    const targetYear = currentYear + 1; // gelecek yıldan düş

    // Cari yıl kaydı olsun ki UI akmasın
    let currentYearLeave = leaveRecord.leaveByYear.find(y => y.year === currentYear);
    if (!currentYearLeave) {
      const entitledDays = calculateEntitledLeaveDays(employee, currentYear);
      currentYearLeave = { year: currentYear, entitled: entitledDays, used: 0, entitlementDate: new Date(currentYear,0,1), leaveRequests: [] };
      leaveRecord.leaveByYear.push(currentYearLeave);
    }

    // Hedef yıl kaydı oluştur/garanti et
    let nextYearLeave = leaveRecord.leaveByYear.find(y => y.year === targetYear);
    if (!nextYearLeave) {
      const entitledNext = calculateEntitledLeaveDays(employee, targetYear);
      nextYearLeave = { year: targetYear, entitled: entitledNext, used: 0, entitlementDate: new Date(targetYear,0,1), leaveRequests: [] };
      leaveRecord.leaveByYear.push(nextYearLeave);
      // toplam entitled istatistiğini güncelle
      leaveRecord.totalLeaveStats.totalEntitled = (leaveRecord.totalLeaveStats.totalEntitled || 0) + (entitledNext || 0);
      leaveRecord.totalLeaveStats.remaining = (leaveRecord.totalLeaveStats.totalEntitled || 0) - (leaveRecord.totalLeaveStats.totalUsed || 0);
    }

    // ÖZEL talebi cari yıl kaydına ekle, ancak kullanımı gelecek yıldan düş
    const leaveRequest = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days: computedDays,
      type: 'OZEL',
      deductedFromYear: targetYear,
      status: 'ONAYLANDI',
      notes: notes || '',
      requestDate: new Date(),
      createdAt: new Date()
    };
    currentYearLeave.leaveRequests.push(leaveRequest);

    // Kullanımı gelecek yıldan düş
    // Önce devir varsa (targetYear öncesi yıllar), devirden tüket, kalanı targetYear'dan düş
    const usedFromCarry = consumeCarryover(leaveRecord, targetYear, computedDays);
    const usedFromTarget = computedDays - usedFromCarry;
    nextYearLeave.used = (nextYearLeave.used || 0) + usedFromTarget;

    // Toplam used istatistiği değişmez (yıllar toplamı aynı kalır), sadece year bazında kaydettik
    leaveRecord.totalLeaveStats.totalUsed = (leaveRecord.totalLeaveStats.totalUsed || 0) + 0; // no-op
    leaveRecord.totalLeaveStats.remaining = (leaveRecord.totalLeaveStats.totalEntitled || 0) - (leaveRecord.totalLeaveStats.totalUsed || 0);
    leaveRecord.lastCalculationDate = new Date();
    await leaveRecord.save();

    return res.json({
      success: true,
      message: `Özel izin oluşturuldu. Bu izin ${targetYear} yılı hakkından düşülecektir.`,
      data: leaveRequest
    });
  } catch (error) {
    console.error('❌ Özel izin oluşturma hatası:', error);
    return res.status(500).json({ success: false, message: 'Özel izin oluşturulamadı', error: error.message });
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
    const leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
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

    // Yeni gün sayısını tarih aralığına göre Pazar/resmi tatiller hariç hesapla
    const computedDays = calculateLeaveDaysExcludingSundaysAndHolidays(startDate, endDate);
    if (!computedDays || computedDays <= 0) {
      return res.status(400).json({ success: false, message: 'Geçerli tarih aralığı bulunamadı' });
    }

    // Eski talebin günlerini iade et (önce mevcut yıl, sonra devirden geri aç)
    const oldDays = request.days;
    freeCarryover(leaveRecord, currentYear, oldDays);

    // Yeni toplam kullanılabilir hakkı kontrol et (devir dahil)
    const carryover = calculateCarryover(leaveRecord, currentYear);
    const available = (yearRecord.entitled || 0) + carryover - (yearRecord.used || 0);
    if (computedDays > available) {
      return res.status(400).json({
        success: false,
        message: `Yetersiz izin hakkı. Kalan izin: ${available} gün (devir dahil)`
      });
    }

    // Devirden tüket ve mevcut yıla yaz
    const usedFromCarryover = consumeCarryover(leaveRecord, currentYear, computedDays);
    const usedFromCurrent = computedDays - usedFromCarryover;

    // İzin talebini güncelle
    request.startDate = new Date(startDate);
    request.endDate = new Date(endDate);
    request.days = computedDays;
    request.notes = notes;

    // Kullanılan izin günlerini güncelle (eski iade edildi, yenisini yaz)
    yearRecord.used = (yearRecord.used || 0) + usedFromCurrent;
    leaveRecord.totalLeaveStats.totalUsed = (leaveRecord.totalLeaveStats.totalUsed || 0) - oldDays + computedDays;
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
    const leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
    if (!leaveRecord) {
      return res.status(404).json({
        success: false,
        message: 'İzin kaydı bulunamadı'
      });
    }

    // İzin talebini bulacağı yıl kaydını saptayın
    let yearRecord = null;
    for (const y of leaveRecord.leaveByYear) {
      const r = y.leaveRequests.id(requestId);
      if (r) {
        yearRecord = y;
        break;
      }
    }
    const currentYear = yearRecord ? yearRecord.year : new Date().getFullYear();
    
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

    // Kullanılan izin günlerini güncelle ve devirleri iade et
    freeCarryover(leaveRecord, currentYear, request.days);
    leaveRecord.totalLeaveStats.totalUsed = Math.max(0, (leaveRecord.totalLeaveStats.totalUsed || 0) - request.days);
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
  // Politika: İlgili yılda tamamlanacak hizmet yılına göre hakediş belirlenir
  // Bu nedenle kontrol tarihini yıl sonu (31 Aralık) alıyoruz
  const checkDate = new Date(year, 11, 31);
  
  // Yaş hesabı (doğum tarihini ay/gün bazında dikkate al)
  let age = checkDate.getFullYear() - birthDate.getFullYear();
  const ageMonthDiff = checkDate.getMonth() - birthDate.getMonth();
  if (ageMonthDiff < 0 || (ageMonthDiff === 0 && checkDate.getDate() < birthDate.getDate())) {
    age--;
  }

  // Hizmet yılı (işe giriş ay/gününü dikkate al)
  let yearsOfService = checkDate.getFullYear() - hireDate.getFullYear();
  const monthDiff = checkDate.getMonth() - hireDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && checkDate.getDate() < hireDate.getDate())) {
    yearsOfService--;
  }

  // İşe giriş yılı ise (ilk yıl) hakediş yok
  if (checkDate.getFullYear() === hireDate.getFullYear()) {
    return 0;
  }
  
  // YENİ İZİN KURALLARI:
  // 1. 50 yaş altı + 5 yıldan az = 14 gün
  // 2. 50 yaş altı + 5 yıl ve üzeri = 20 gün  
  // 3. 50 yaş ve üzeri = 20 gün (hizmet yılı fark etmez)
  if (age >= 50) {
    return yearsOfService > 0 ? 20 : 0; // 50+ yaş kuralı
  } else {
    if (yearsOfService <= 0) {
      return 0; // Henüz 1 yılını doldurmadı
    } else if (yearsOfService < 5) {
      return 14; // 50 yaş altı + 5 yıl altı kuralı
    } else {
      return 20; // 50 yaş altı + 5+ yıl kuralı
    }
  }
}

// 🧮 Çalışan izin hesaplaması
async function calculateEmployeeLeave(employee) {
  const currentYear = new Date().getFullYear();
  
  // 2017'den (veya işe giriş yılından) itibaren hesapla
  const startYear = Math.max(
    employee.iseGirisTarihi ? new Date(employee.iseGirisTarihi).getFullYear() : currentYear,
    2017
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
    const startYear = Math.max(
      employee.iseGirisTarihi ? new Date(employee.iseGirisTarihi).getFullYear() : currentYear,
      2017
    );
    // Eksik yılları ekle (entitlement kurala göre)
    for (let year = startYear; year <= currentYear; year++) {
      let record = leaveRecord.leaveByYear.find(r => r.year === year);
      if (!record) {
        const entitledDays = calculateEntitledLeaveDays(employee, year) || 0;
        if (entitledDays > 0) {
          leaveRecord.leaveByYear.push({
            year,
            entitled: entitledDays,
            used: 0,
            entitlementDate: new Date(year, 0, 1),
            leaveRequests: []
          });
          leaveRecord.totalLeaveStats.totalEntitled = (leaveRecord.totalLeaveStats.totalEntitled || 0) + entitledDays;
          leaveRecord.totalLeaveStats.remaining = (leaveRecord.totalLeaveStats.totalEntitled || 0) - (leaveRecord.totalLeaveStats.totalUsed || 0);
        }
      }
    }
    
    // Bu yılın kaydı var mı kontrol et
    let currentYearRecord = leaveRecord.leaveByYear.find(record => record.year === currentYear);
    
    if (!currentYearRecord) {
      // Bu yılın kaydı yoksa ekle
      const entitledDays = calculateEntitledLeaveDays(employee, currentYear);
      
      if (entitledDays > 0) {
        // Önceki yılların devir kalanını hesapla (pozitif veya negatif)
        const previousCarryover = calculateCarryover(leaveRecord, currentYear);
        
        // Eğer önceki yıllardan negatif kalan varsa, bu yılın hakedişinden düş
        let effectiveEntitled = entitledDays;
        let autoUsed = 0; // Negatif devir nedeniyle otomatik kullanım
        
        if (previousCarryover < 0) {
          // Negatif devir varsa, bu yıldan otomatik olarak düş
          autoUsed = Math.min(Math.abs(previousCarryover), effectiveEntitled);
        }
        
        currentYearRecord = {
          year: currentYear,
          entitled: entitledDays,
          used: autoUsed, // Negatif devirden dolayı otomatik kullanım
          entitlementDate: new Date(currentYear, 0, 1),
          leaveRequests: autoUsed > 0 ? [{
            startDate: new Date(currentYear, 0, 1),
            endDate: new Date(currentYear, 0, 1),
            days: autoUsed,
            type: 'DEVIR_DUSUMU',
            status: 'ONAYLANDI',
            notes: `Önceki yıllardan ${Math.abs(previousCarryover)} gün negatif devir nedeniyle otomatik düşüldü`,
            createdAt: new Date()
          }] : []
        };
        
        leaveRecord.leaveByYear.push(currentYearRecord);
        
        // Toplam izin günlerini güncelle
        leaveRecord.totalLeaveStats.totalEntitled += entitledDays;
        leaveRecord.totalLeaveStats.totalUsed += autoUsed;
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

// 📊 PROFESYONEL EXCEL EXPORT ENDPOİNTİ
router.post('/export/excel', async (req, res) => {
  try {
    console.log('📊 Yıllık İzin Excel export başlatıldı');
    
    const { year, exportedBy } = req.body;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Tüm aktif çalışanları ve izin bilgilerini getir
    const employees = await Employee.find({ 
      durum: 'AKTIF' 
    }).select('_id adSoyad dogumTarihi iseGirisTarihi employeeId departman pozisyon');

    const leaveRecords = await AnnualLeave.find({
      'leaveByYear.year': currentYear
    }).lean();

    const leaveMap = leaveRecords.reduce((acc, record) => {
      acc[record.employeeId.toString()] = record;
      return acc;
    }, {});

    // Excel verilerini hazırla
    const excelData = await Promise.all(employees.map(async (employee) => {
      const empId = employee._id.toString();
      const leaveRecord = leaveMap[empId];
      
      const birthDate = employee.dogumTarihi ? new Date(employee.dogumTarihi) : null;
      const age = birthDate ? calculateAge(birthDate) : null;
      
      const hireDate = employee.iseGirisTarihi ? new Date(employee.iseGirisTarihi) : null;
      const yearsOfService = hireDate ? calculateYearsOfService(hireDate) : null;
      
      const currentYearLeave = leaveRecord?.leaveByYear.find(l => l.year === currentYear) || { entitled: 0, used: 0, leaveRequests: [] };
      const carryover = calculateCarryover(leaveRecord, currentYear);
      
      return {
        employeeId: employee.employeeId || '',
        adSoyad: employee.adSoyad || '',
        departman: employee.departman || '',
        pozisyon: employee.pozisyon || '',
        yas: age || 0,
        hizmetYili: yearsOfService || 0,
        hakEdilen: (currentYearLeave.entitled || 0) + carryover,
        kullanilan: (currentYearLeave.used || 0),
        kalan: (currentYearLeave.entitled || 0) + carryover - (currentYearLeave.used || 0),
        iseGirisTarihi: hireDate ? hireDate.toLocaleDateString('tr-TR') : '',
        dogumTarihi: birthDate ? birthDate.toLocaleDateString('tr-TR') : ''
      };
    }));

    console.log(`📋 İşlenecek çalışan sayısı: ${excelData.length}`);

    // Excel dosyası oluştur
    const workbook = new ExcelJS.Workbook();
    
    // Workbook metadata
    workbook.creator = 'Canga Vardiya Sistemi';
    workbook.lastModifiedBy = exportedBy || 'Sistem';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const worksheet = workbook.addWorksheet('Yıllık İzin Raporu');

    // Excel başlık bölümü
    let currentRow = 1;
    
    // Ana başlık
    worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const mainTitle = worksheet.getCell(`A${currentRow}`);
    mainTitle.value = '🏢 ÇANGA SAVUNMA ENDÜSTRİSİ LTD.ŞTİ.';
    mainTitle.font = { size: 20, bold: true, color: { argb: 'FF1976D2' } };
    mainTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    mainTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    worksheet.getRow(currentRow).height = 35;
    currentRow++;
    
    // Alt başlık
    worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const subTitle = worksheet.getCell(`A${currentRow}`);
    subTitle.value = `📅 ${currentYear} YILI YILLIK İZİN DURUMU RAPORU`;
    subTitle.font = { size: 16, bold: true, color: { argb: 'FF424242' } };
    subTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    subTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    worksheet.getRow(currentRow).height = 30;
    currentRow++;
    
    // Bilgi satırı
    worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const infoRow = worksheet.getCell(`A${currentRow}`);
    const exportDate = new Date().toLocaleDateString('tr-TR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
    const totalEmployees = excelData.length;
    const totalEntitled = excelData.reduce((sum, emp) => sum + emp.hakEdilen, 0);
    const totalUsed = excelData.reduce((sum, emp) => sum + emp.kullanilan, 0);
    const totalRemaining = excelData.reduce((sum, emp) => sum + emp.kalan, 0);
    
    infoRow.value = `📊 Rapor Tarihi: ${exportDate} | 👥 Toplam Çalışan: ${totalEmployees} | 📈 Toplam Hak Edilen: ${totalEntitled} gün | 📉 Toplam Kullanılan: ${totalUsed} gün | 📋 Toplam Kalan: ${totalRemaining} gün`;
    infoRow.font = { size: 10, color: { argb: 'FF666666' } };
    infoRow.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(currentRow).height = 25;
    currentRow += 2;

    // Özet istatistikler bölümü
    worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const statsTitle = worksheet.getCell(`A${currentRow}`);
    statsTitle.value = '📊 ÖZET İSTATİSTİKLER';
    statsTitle.font = { size: 14, bold: true, color: { argb: 'FF1976D2' } };
    statsTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    statsTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBBDEFB' } };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // İstatistik kartları
    const statsData = [
      { label: '👥 Toplam Aktif Çalışan', value: totalEmployees, color: 'FF4CAF50' },
      { label: '📈 Toplam Hak Edilen İzin', value: `${totalEntitled} gün`, color: 'FF2196F3' },
      { label: '📉 Toplam Kullanılan İzin', value: `${totalUsed} gün`, color: 'FFFF9800' },
      { label: '📋 Toplam Kalan İzin', value: `${totalRemaining} gün`, color: 'FF9C27B0' }
    ];

    statsData.forEach((stat, index) => {
      const col = String.fromCharCode(65 + (index * 3)); // A, D, G, J
      worksheet.mergeCells(`${col}${currentRow}:${String.fromCharCode(col.charCodeAt(0) + 2)}${currentRow}`);
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.value = `${stat.label}: ${stat.value}`;
      cell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stat.color } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    worksheet.getRow(currentRow).height = 25;
    currentRow += 2;

    // Tablo başlık satırı
    const headers = [
      'Sıra',
      'Sicil No',
      'Ad Soyad', 
      'Departman',
      'Pozisyon',
      'Yaş',
      'Hizmet Yılı',
      'Hak Edilen İzin',
      'Kullanılan İzin',
      'Kalan İzin',
      'İşe Giriş Tarihi',
      'Doğum Tarihi'
    ];

    const headerRow = worksheet.addRow(headers);

    // Header stilini ayarla
    headerRow.eachCell((cell, index) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF424242' } },
        left: { style: 'thin', color: { argb: 'FF424242' } },
        bottom: { style: 'medium', color: { argb: 'FF424242' } },
        right: { style: 'thin', color: { argb: 'FF424242' } }
      };
    });
    worksheet.getRow(currentRow + 1).height = 30;

    // Çalışan verilerini ekle
    excelData.forEach((employee, index) => {
      const row = worksheet.addRow([
        index + 1,
        employee.employeeId,
        employee.adSoyad,
        employee.departman,
        employee.pozisyon,
        employee.yas,
        employee.hizmetYili,
        employee.hakEdilen,
        employee.kullanilan,
        employee.kalan,
        employee.iseGirisTarihi,
        employee.dogumTarihi
      ]);

      // Satır stilini ayarla
      row.eachCell((cell, colIndex) => {
        // Zebrali renklendirme
        const bgColor = index % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
        
        // Kalan izin durumuna göre renklendirme
        if (colIndex === 9) { // Kalan İzin sütunu
          if (employee.kalan < 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } }; // Açık kırmızı
            cell.font = { color: { argb: 'FFD32F2F' }, bold: true };
          } else if (employee.kalan > 15) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } }; // Açık yeşil
            cell.font = { color: { argb: 'FF388E3C' }, bold: true };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          }
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }
        
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        
        // Sayısal değerler için format
        if ([6, 7, 8, 9, 10].includes(colIndex)) {
          cell.numFmt = '0';
        }
      });
      
      row.height = 25;
    });

    // Sütun genişliklerini ayarla
    const columnWidths = [8, 12, 25, 20, 20, 8, 12, 15, 15, 12, 15, 15];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    // Sayfa düzeni
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.7, right: 0.7,
        top: 0.75, bottom: 0.75,
        header: 0.3, footer: 0.3
      }
    };

    // Excel dosyasını buffer olarak oluştur
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Response headers
    const fileName = `Yillik_Izin_Raporu_${currentYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    console.log(`✅ Excel dosyası oluşturuldu: ${fileName}`);
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Excel export hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Excel dosyası oluşturulamadı',
      error: error.message
    });
  }
});

// 📋 İZİN TALEPLERİ PROFESYONEL EXCEL EXPORT
router.post('/export/leave-requests', async (req, res) => {
  try {
    console.log('📋 İzin Talepleri Excel export başlatıldı');
    
    const { year, status, exportedBy } = req.body;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    
    // İzin taleplerini al
    const matchConditions = {};
    if (status && status !== 'ALL') {
      matchConditions['leaveByYear.leaveRequests.status'] = status;
    }

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
          employeeCode: '$employee.employeeId',
          department: '$employee.departman',
          position: '$employee.pozisyon',
          location: '$employee.lokasyon',
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

    console.log(`📊 ${leaveRecords.length} izin talebi bulundu`);

    // Excel dosyası oluştur
    const workbook = new ExcelJS.Workbook();
    
    // Workbook metadata
    workbook.creator = 'Canga Vardiya Sistemi';
    workbook.lastModifiedBy = exportedBy || 'Sistem';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const worksheet = workbook.addWorksheet('İzin Talepleri');

    // Excel başlık bölümü
    let currentRow = 1;
    
    // Ana başlık
    worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const mainTitle = worksheet.getCell(`A${currentRow}`);
    mainTitle.value = 'ÇANGA SAVUNMA ENDÜSTRİSİ LTD.ŞTİ.';
    mainTitle.font = { size: 18, bold: true, color: { argb: 'FF2C5AA0' } };
    mainTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    mainTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F4FD' } };
    worksheet.getRow(currentRow).height = 30;
    currentRow++;
    
    // Alt başlık
    worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const subTitle = worksheet.getCell(`A${currentRow}`);
    subTitle.value = `${currentYear} YILI İZİN TALEPLERİ RAPORU`;
    subTitle.font = { size: 14, bold: true, color: { argb: 'FF34495E' } };
    subTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    subTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;
    
    // Bilgi satırı
    worksheet.mergeCells(`A${currentRow}:L${currentRow}`);
    const infoRow = worksheet.getCell(`A${currentRow}`);
    const exportDate = new Date().toLocaleDateString('tr-TR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
    const totalRequests = leaveRecords.length;
    const totalDays = leaveRecords.reduce((sum, req) => sum + (req.days || 0), 0);
    const approvedCount = leaveRecords.filter(req => req.status === 'ONAYLANDI').length;
    const pendingCount = leaveRecords.filter(req => req.status === 'ONAY_BEKLIYOR').length;
    
    infoRow.value = `Rapor Tarihi: ${exportDate} | Toplam Talep: ${totalRequests} | Toplam Gün: ${totalDays} | Onaylanan: ${approvedCount} | Bekleyen: ${pendingCount}`;
    infoRow.font = { size: 10, color: { argb: 'FF666666' } };
    infoRow.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(currentRow).height = 20;
    currentRow += 2;

    // Özet istatistikler bölümü
    const statsData = [
      { label: 'Toplam Talep', value: totalRequests, color: 'FF2196F3' },
      { label: 'Onaylanan', value: approvedCount, color: 'FF4CAF50' },
      { label: 'Bekleyen', value: pendingCount, color: 'FFFF9800' },
      { label: 'Toplam Gün', value: totalDays, color: 'FF9C27B0' }
    ];

    statsData.forEach((stat, index) => {
      const col = String.fromCharCode(65 + (index * 3)); // A, D, G, J
      worksheet.mergeCells(`${col}${currentRow}:${String.fromCharCode(col.charCodeAt(0) + 2)}${currentRow}`);
      const cell = worksheet.getCell(`${col}${currentRow}`);
      cell.value = `${stat.label}: ${stat.value}`;
      cell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stat.color } };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    worksheet.getRow(currentRow).height = 25;
    currentRow += 2;

    // Tablo başlık satırı
    const headers = [
      'Sıra',
      'Sicil No',
      'Ad Soyad', 
      'Departman',
      'Pozisyon',
      'Lokasyon',
      'Başlangıç Tarihi',
      'Bitiş Tarihi',
      'Gün Sayısı',
      'Durum',
      'Talep Tarihi',
      'Notlar'
    ];

    const headerRow = worksheet.addRow(headers);

    // Header stilini ayarla
    headerRow.eachCell((cell, index) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C5AA0' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF424242' } },
        left: { style: 'thin', color: { argb: 'FF424242' } },
        bottom: { style: 'medium', color: { argb: 'FF424242' } },
        right: { style: 'thin', color: { argb: 'FF424242' } }
      };
    });
    worksheet.getRow(currentRow + 1).height = 30;

    // İzin talepleri verilerini ekle
    leaveRecords.forEach((request, index) => {
      const statusText = {
        'ONAY_BEKLIYOR': 'Onay Bekliyor',
        'ONAYLANDI': 'Onaylandı',
        'REDDEDILDI': 'Reddedildi',
        'IPTAL_EDILDI': 'İptal Edildi'
      };

      const row = worksheet.addRow([
        index + 1,
        request.employeeCode || '',
        request.employeeName || '',
        request.department || '',
        request.position || '',
        request.location || '',
        request.startDate ? new Date(request.startDate).toLocaleDateString('tr-TR') : '',
        request.endDate ? new Date(request.endDate).toLocaleDateString('tr-TR') : '',
        request.days || 0,
        statusText[request.status] || request.status,
        request.createdAt ? new Date(request.createdAt).toLocaleDateString('tr-TR') : '',
        request.notes || ''
      ]);

      // Satır stilini ayarla
      row.eachCell((cell, colIndex) => {
        // Zebrali renklendirme
        const bgColor = index % 2 === 0 ? 'FFFAFAFA' : 'FFFFFFFF';
        
        // Durum sütununa göre renklendirme
        if (colIndex === 10) { // Durum sütunu
          if (request.status === 'ONAYLANDI') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } }; // Açık yeşil
            cell.font = { color: { argb: 'FF388E3C' }, bold: true };
          } else if (request.status === 'REDDEDILDI') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } }; // Açık kırmızı
            cell.font = { color: { argb: 'FFD32F2F' }, bold: true };
          } else if (request.status === 'ONAY_BEKLIYOR') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } }; // Açık turuncu
            cell.font = { color: { argb: 'FFF57C00' }, bold: true };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          }
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }
        
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        
        // Sayısal değerler için format
        if (colIndex === 9) { // Gün sayısı
          cell.numFmt = '0';
        }
      });
      
      row.height = 25;
    });

    // Sütun genişliklerini ayarla
    const columnWidths = [8, 12, 25, 20, 20, 12, 15, 15, 10, 15, 15, 30];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    // Sayfa düzeni
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.7, right: 0.7,
        top: 0.75, bottom: 0.75,
        header: 0.3, footer: 0.3
      }
    };

    // Excel dosyasını buffer olarak oluştur
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Response headers
    const fileName = `Izin_Talepleri_${currentYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    console.log(`✅ İzin Talepleri Excel dosyası oluşturuldu: ${fileName}`);
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ İzin Talepleri Excel export hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin Talepleri Excel dosyası oluşturulamadı',
      error: error.message
    });
  }
});

// 📊 Profesyonel Excel Raporu Export
router.post('/export-excel', async (req, res) => {
  try {
    console.log('📊 Excel export talebi alındı');
    
    const reportData = req.body;
    
    // Excel workbook oluştur
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CANGA MAKİNA Yıllık İzin Sistemi';
    workbook.created = new Date();
    
    // Ana rapor sayfası
    const worksheet = workbook.addWorksheet('Yıllık İzin Raporu');
    
    // Sayfa ayarları
    worksheet.pageSetup.orientation = 'landscape';
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.margins = {
      left: 0.7, right: 0.7, top: 0.75, bottom: 0.75,
      header: 0.3, footer: 0.3
    };
    
    // 🎨 BAŞLIK BÖLÜMÜ
    // Logo ve başlık alanı (A1:N4)
    worksheet.mergeCells('A1:N4');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = reportData.title;
    titleCell.font = { 
      name: 'Calibri', 
      size: 20, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    titleCell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2C5AA0' } // Canga mavi rengi
    };
    titleCell.border = {
      top: { style: 'thick', color: { argb: '1e3f73' } },
      left: { style: 'thick', color: { argb: '1e3f73' } },
      bottom: { style: 'thick', color: { argb: '1e3f73' } },
      right: { style: 'thick', color: { argb: '1e3f73' } }
    };
    
    // 📊 ÖZET İSTATİSTİKLER BÖLÜMÜ (Satır 6)
    worksheet.getCell('A6').value = 'Rapor Tarihi:';
    worksheet.getCell('B6').value = reportData.generatedDate;
    worksheet.getCell('D6').value = 'Rapor Dönemi:';
    worksheet.getCell('E6').value = reportData.reportPeriod;
    
    worksheet.getCell('A7').value = 'Toplam Çalışan:';
    worksheet.getCell('B7').value = reportData.totalEmployees;
    worksheet.getCell('D7').value = 'Toplam Kullanılan İzin:';
    worksheet.getCell('E7').value = reportData.totalLeaveUsed + ' gün';
    
    worksheet.getCell('A8').value = 'Toplam Hak Edilen İzin:';
    worksheet.getCell('B8').value = reportData.totalLeaveEntitled + ' gün';
    worksheet.getCell('D8').value = 'Ortalama İzin/Kişi:';
    worksheet.getCell('E8').value = reportData.avgLeavePerEmployee + ' gün';
    
    // Özet alanını formatla
    ['A6', 'A7', 'A8', 'D6', 'D7', 'D8'].forEach(cellAddr => {
      const cell = worksheet.getCell(cellAddr);
      cell.font = { bold: true, color: { argb: '2C5AA0' } };
    });
    
    ['B6', 'B7', 'B8', 'E6', 'E7', 'E8'].forEach(cellAddr => {
      const cell = worksheet.getCell(cellAddr);
      cell.font = { bold: true };
    });
    
    // 📋 TABLO BAŞLIKLARI (Satır 10)
    const headers = [
      'No', 'Çalışan Adı', 'Çalışan ID', 'İşe Giriş', 'Çalışma Yılı',
      'Toplam Kullanılan', 'Toplam Hak Edilen', 'Kalan',
      '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'
    ];
    
    const headerRow = worksheet.getRow(10);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { 
        bold: true, 
        color: { argb: 'FFFFFF' },
        size: 12
      };
      cell.alignment = { 
        horizontal: 'center', 
        vertical: 'middle' 
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
    });
    
    // Alt başlık satırı (K/H açıklaması)
    const subHeaderRow = worksheet.getRow(11);
    for (let i = 1; i <= 8; i++) {
      subHeaderRow.getCell(i).value = '';
    }
    for (let i = 9; i <= 16; i++) {
      const cell = subHeaderRow.getCell(i);
      cell.value = 'K / H';
      cell.font = { 
        italic: true, 
        size: 10, 
        color: { argb: 'FFFFFF' } 
      };
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '70AD47' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      };
    }
    
    // 👥 ÇALIŞAN VERİLERİ
    reportData.employees.forEach((employee, index) => {
      const rowIndex = 12 + index;
      const row = worksheet.getRow(rowIndex);
      
      // Temel bilgiler
      row.getCell(1).value = index + 1; // No
      row.getCell(2).value = employee.adSoyad;
      row.getCell(3).value = employee.employeeId;
      row.getCell(4).value = employee.iseGirisTarihi;
      row.getCell(5).value = employee.calismaYili + ' yıl';
      row.getCell(6).value = employee.toplamKullanilan;
      row.getCell(7).value = employee.toplamHakEdilen;
      row.getCell(8).value = employee.kalan;
      
      // Yıllık detaylar (2017-2024)
      employee.yearlyData.slice(0, 8).forEach((yearData, yearIndex) => {
        const cell = row.getCell(9 + yearIndex);
        if (yearData.used > 0 || yearData.entitled > 0) {
          cell.value = `${yearData.used} / ${yearData.entitled}`;
        } else {
          cell.value = '-';
        }
        cell.alignment = { horizontal: 'center' };
      });
      
      // Satır formatlaması
      for (let col = 1; col <= 16; col++) {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        };
        
        // Alternatif satır renklendirme
        if (index % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F2F2F2' }
          };
        }
        
        // Kalan izin renklendirmesi
        if (col === 8) { // Kalan sütunu
          const remaining = employee.kalan;
          if (remaining < 0) {
            cell.font = { color: { argb: 'C5504B' }, bold: true }; // Kırmızı
          } else if (remaining > 10) {
            cell.font = { color: { argb: '70AD47' }, bold: true }; // Yeşil
          } else if (remaining > 0) {
            cell.font = { color: { argb: 'D68910' }, bold: true }; // Turuncu
          }
        }
      }
      
      // Çalışan adı sütunu formatı
      row.getCell(2).font = { bold: true };
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    });
    
    // Sütun genişlikleri
    worksheet.getColumn(1).width = 5;   // No
    worksheet.getColumn(2).width = 25;  // Çalışan Adı
    worksheet.getColumn(3).width = 12;  // Çalışan ID
    worksheet.getColumn(4).width = 12;  // İşe Giriş
    worksheet.getColumn(5).width = 12;  // Çalışma Yılı
    worksheet.getColumn(6).width = 12;  // Toplam Kullanılan
    worksheet.getColumn(7).width = 12;  // Toplam Hak Edilen
    worksheet.getColumn(8).width = 10;  // Kalan
    
    // Yıl sütunları
    for (let i = 9; i <= 16; i++) {
      worksheet.getColumn(i).width = 10;
    }
    
    // 📈 FOOTER BİLGİLERİ
    const lastRow = 12 + reportData.employees.length + 2;
    worksheet.mergeCells(`A${lastRow}:P${lastRow}`);
    const footerCell = worksheet.getCell(`A${lastRow}`);
    footerCell.value = `Bu rapor ${reportData.generatedDate} tarihinde CANGA MAKİNA Yıllık İzin Sistemi tarafından otomatik olarak oluşturulmuştur.`;
    footerCell.font = { 
      italic: true, 
      size: 10, 
      color: { argb: '7F7F7F' } 
    };
    footerCell.alignment = { horizontal: 'center' };
    
    // 🎨 LEGEND / AÇIKLAMALAR SAYFASI
    const legendSheet = workbook.addWorksheet('Açıklamalar');
    
    legendSheet.mergeCells('A1:E1');
    legendSheet.getCell('A1').value = 'Rapor Açıklamaları ve Kısaltmalar';
    legendSheet.getCell('A1').font = { size: 16, bold: true, color: { argb: '2C5AA0' } };
    legendSheet.getCell('A1').alignment = { horizontal: 'center' };
    
    const legendData = [
      ['K / H', 'Kullanılan İzin / Hak Edilen İzin'],
      ['Çalışma Yılı', 'İşe giriş tarihinden itibaren geçen süre'],
      ['Kalan İzin', 'Hak edilen - Kullanılan izin farkı'],
      ['', ''],
      ['İzin Hakkı Hesaplama (Türk İş Kanunu):', ''],
      ['1-5 yıl çalışma', '14 gün yıllık izin'],
      ['5-15 yıl çalışma', '20 gün yıllık izin'],
      ['15+ yıl çalışma', '26 gün yıllık izin'],
      ['', ''],
      ['Renk Kodları:', ''],
      ['Yeşil', 'Kalan izin 10+ gün (İyi durum)'],
      ['Turuncu', 'Kalan izin 1-10 gün (Dikkat)'],
      ['Kırmızı', 'Kalan izin eksi (Fazla kullanım)']
    ];
    
    legendData.forEach((row, index) => {
      const rowNum = index + 3;
      legendSheet.getCell(`A${rowNum}`).value = row[0];
      legendSheet.getCell(`B${rowNum}`).value = row[1];
      
      if (row[0] && !row[1]) {
        legendSheet.getCell(`A${rowNum}`).font = { bold: true, color: { argb: '2C5AA0' } };
      }
    });
    
    legendSheet.getColumn('A').width = 20;
    legendSheet.getColumn('B').width = 35;
    
    // Excel dosyasını buffer olarak oluştur
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Canga_Yillik_Izin_Raporu_${new Date().toISOString().slice(0,10)}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Dosyayı gönder
    res.send(buffer);
    
    console.log('✅ Excel raporu başarıyla oluşturuldu ve gönderildi');
    
  } catch (error) {
    console.error('❌ Excel export hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Excel raporu oluşturulamadı',
      error: error.message
    });
  }
});

// 🧹 İşten ayrılan çalışanların izin kayıtlarını temizle
router.post('/cleanup-former-employees', asyncHandler(async (req, res) => {
  const { cleanupFormerEmployeeLeaves, validateDataConsistency } = require('../scripts/cleanupFormerEmployeeLeaves');
  
  try {
    console.log('🧹 İşten ayrılan çalışanların izin kayıtları temizleniyor...');
    
    // Önce veri tutarlılığını kontrol et
    const consistencyReport = await validateDataConsistency();
    
    let cleanupReport = null;
    
    // Eğer tutarsızlık varsa temizlik yap
    if (!consistencyReport.isConsistent) {
      console.log('⚠️ Veri tutarsızlığı tespit edildi, temizlik başlatılıyor...');
      cleanupReport = await cleanupFormerEmployeeLeaves();
      
      // Temizlik sonrası tekrar kontrol et
      console.log('🔄 Temizlik sonrası veri tutarlılığı kontrol ediliyor...');
      const postCleanupReport = await validateDataConsistency();
      
      res.json({
        success: true,
        message: 'İşten ayrılan çalışanların izin kayıtları başarıyla temizlendi',
        data: {
          beforeCleanup: consistencyReport,
          cleanupResult: cleanupReport,
          afterCleanup: postCleanupReport
        }
      });
    } else {
      console.log('✅ Veri tutarlılığı sağlanmış, temizlik gerekmiyor');
      res.json({
        success: true,
        message: 'Veri tutarlılığı sağlanmış, temizlik gerekmiyor',
        data: {
          consistencyReport: consistencyReport,
          cleanupPerformed: false
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Temizlik işlemi sırasında hata:', error);
    res.status(500).json({
      success: false,
      message: 'Temizlik işlemi sırasında hata oluştu',
      error: error.message
    });
  }
}));

// 🔍 Veri tutarlılığı kontrolü endpoint
router.get('/data-consistency-check', asyncHandler(async (req, res) => {
  const { validateDataConsistency } = require('../scripts/cleanupFormerEmployeeLeaves');
  
  try {
    console.log('🔍 Veri tutarlılığı kontrol ediliyor...');
    
    const report = await validateDataConsistency();
    
    res.json({
      success: true,
      message: 'Veri tutarlılığı kontrolü tamamlandı',
      data: report
    });
    
  } catch (error) {
    console.error('❌ Veri tutarlılığı kontrolü sırasında hata:', error);
    res.status(500).json({
      success: false,
      message: 'Veri tutarlılığı kontrolü sırasında hata oluştu',
      error: error.message
    });
  }
}));

module.exports = router;
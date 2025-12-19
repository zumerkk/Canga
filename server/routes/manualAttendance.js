const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const moment = require('moment');
require('moment/locale/tr');

moment.locale('tr');

/**
 * 📋 MANUEL YOKLAMA GİRİŞ API'leri
 * 
 * QR/İmza sistemi çalışmadığında kağıtla alınan verileri sisteme girmek için
 * Profesyonel manuel giriş sistemi
 */

// ============================================
// 1. MANUEL GİRİŞ KAYDI OLUŞTUR
// ============================================

/**
 * POST /api/manual-attendance/entry
 * Manuel giriş veya çıkış kaydı oluştur
 */
router.post('/entry', async (req, res) => {
  try {
    const {
      employeeId,
      date,           // YYYY-MM-DD formatında tarih
      checkInTime,    // HH:mm formatında giriş saati
      checkOutTime,   // HH:mm formatında çıkış saati (opsiyonel)
      branch,         // MERKEZ veya IŞIL
      reason,         // Manuel giriş sebebi
      notes,          // Ek notlar
      // 🆕 Manuel Fazla Mesai Bilgileri
      manualOvertimeMinutes,  // Dakika cinsinden manuel fazla mesai
      manualOvertimeReason,   // Fazla mesai sebebi
      manualOvertimeNotes     // Fazla mesai notu
    } = req.body;

    // Validasyonlar
    if (!employeeId) {
      return res.status(400).json({
        error: 'Çalışan seçilmedi',
        field: 'employeeId'
      });
    }

    if (!date) {
      return res.status(400).json({
        error: 'Tarih seçilmedi',
        field: 'date'
      });
    }

    if (!checkInTime) {
      return res.status(400).json({
        error: 'Giriş saati girilmedi',
        field: 'checkInTime'
      });
    }

    // Çalışan kontrolü
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Çalışan bulunamadı' });
    }

    // Tarih ve saat parse
    const targetDate = moment(date).startOf('day').toDate();
    
    // Giriş saati oluştur
    const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);
    const checkInDateTime = moment(date)
      .hour(checkInHour)
      .minute(checkInMinute)
      .second(0)
      .toDate();

    // Çıkış saati oluştur (varsa)
    let checkOutDateTime = null;
    if (checkOutTime) {
      const [checkOutHour, checkOutMinute] = checkOutTime.split(':').map(Number);
      checkOutDateTime = moment(date)
        .hour(checkOutHour)
        .minute(checkOutMinute)
        .second(0)
        .toDate();
    }

    // Mevcut kayıt var mı kontrol et
    let attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: targetDate
    });

    const isNewRecord = !attendance;

    if (attendance) {
      // Mevcut kayıt var - güncelle
      // Düzeltme geçmişine ekle
      if (attendance.checkIn?.time) {
        attendance.corrections.push({
          field: 'checkIn',
          oldValue: attendance.checkIn.time,
          newValue: checkInDateTime,
          reason: reason || 'Manuel düzeltme',
          correctedAt: new Date()
        });
      }

      if (checkOutDateTime && attendance.checkOut?.time) {
        attendance.corrections.push({
          field: 'checkOut',
          oldValue: attendance.checkOut.time,
          newValue: checkOutDateTime,
          reason: reason || 'Manuel düzeltme',
          correctedAt: new Date()
        });
      }
    } else {
      // Yeni kayıt oluştur
      attendance = new Attendance({
        employeeId: employee._id,
        date: targetDate
      });
    }

    // Giriş bilgilerini güncelle
    attendance.checkIn = {
      time: checkInDateTime,
      method: 'MANUAL',
      location: employee.lokasyon || 'MERKEZ',
      branch: branch || 'MERKEZ'
    };

    // Çıkış bilgilerini güncelle (varsa)
    if (checkOutDateTime) {
      attendance.checkOut = {
        time: checkOutDateTime,
        method: 'MANUAL',
        location: employee.lokasyon || 'MERKEZ',
        branch: branch || attendance.checkIn.branch
      };
      attendance.status = 'NORMAL';
      attendance.needsCorrection = false;
    } else {
      attendance.status = 'INCOMPLETE';
      attendance.needsCorrection = true;
    }

    // Manuel giriş anomalisi ekle
    attendance.anomalies.push({
      type: 'MANUAL_OVERRIDE',
      description: `Manuel yoklama girişi - Sebep: ${reason || 'Belirtilmedi'}${notes ? ` - Not: ${notes}` : ''}`,
      severity: 'INFO',
      detectedAt: new Date()
    });

    // 🆕 Manuel Fazla Mesai Bilgilerini Ekle
    if (manualOvertimeMinutes && manualOvertimeMinutes > 0) {
      attendance.manualOvertimeMinutes = parseInt(manualOvertimeMinutes);
      attendance.manualOvertimeReason = manualOvertimeReason || 'DIGER';
      attendance.manualOvertimeNotes = manualOvertimeNotes || '';
      attendance.manualOvertimeAddedAt = new Date();
      
      // Manuel fazla mesai için özel anomali ekle
      const overtimeReasonLabels = {
        'YEMEK_MOLASI_YOK': 'Yemeğe çıkmadan çalıştı',
        'HAFTA_SONU_CALISMA': 'Hafta sonu çalışma',
        'TATIL_CALISMA': 'Resmi tatil çalışma',
        'GECE_MESAI': 'Gece mesaisi',
        'ACIL_IS': 'Acil iş',
        'PROJE_TESLIM': 'Proje teslimi',
        'BAKIM_ONARIM': 'Bakım/Onarım',
        'EGITIM': 'Eğitim',
        'TOPLANTI': 'Toplantı',
        'DIGER': 'Diğer'
      };
      
      const reasonLabel = overtimeReasonLabels[manualOvertimeReason] || manualOvertimeReason || 'Belirtilmedi';
      const hours = Math.floor(manualOvertimeMinutes / 60);
      const mins = manualOvertimeMinutes % 60;
      const durationStr = hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
      
      attendance.anomalies.push({
        type: 'MANUAL_OVERRIDE',
        description: `🕐 Manuel Fazla Mesai: ${durationStr} - Sebep: ${reasonLabel}${manualOvertimeNotes ? ` - Not: ${manualOvertimeNotes}` : ''}`,
        severity: 'INFO',
        detectedAt: new Date()
      });
    }

    // Notları güncelle
    const manualNote = `[📝 Manuel Giriş: ${moment().format('DD.MM.YYYY HH:mm')} - ${reason || 'Kağıt kayıttan aktarım'}]`;
    attendance.notes = attendance.notes 
      ? `${attendance.notes} ${manualNote}` 
      : manualNote;

    if (notes) {
      attendance.notes += ` ${notes}`;
    }
    
    // 🆕 Manuel fazla mesai notunu ekle
    if (manualOvertimeMinutes && manualOvertimeMinutes > 0) {
      const hours = Math.floor(manualOvertimeMinutes / 60);
      const mins = manualOvertimeMinutes % 60;
      const durationStr = hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
      attendance.notes += ` [🕐 Manuel F.Mesai: ${durationStr}]`;
    }

    await attendance.save();

    // Populate ile döndür
    await attendance.populate('employeeId', 'adSoyad tcNo employeeId pozisyon departman lokasyon profilePhoto');

    res.status(isNewRecord ? 201 : 200).json({
      success: true,
      message: isNewRecord 
        ? `${employee.adSoyad} için manuel kayıt oluşturuldu` 
        : `${employee.adSoyad} için kayıt güncellendi`,
      isNew: isNewRecord,
      attendance
    });

  } catch (error) {
    console.error('Manuel giriş hatası:', error);
    res.status(500).json({
      error: 'Manuel giriş kaydedilirken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 2. TOPLU MANUEL GİRİŞ
// ============================================

/**
 * POST /api/manual-attendance/bulk-entry
 * Birden fazla çalışan için toplu manuel giriş
 */
router.post('/bulk-entry', async (req, res) => {
  try {
    const { entries, defaultBranch, defaultReason } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Giriş listesi boş' });
    }

    const results = {
      success: [],
      errors: []
    };

    for (const entry of entries) {
      try {
        const { employeeId, date, checkInTime, checkOutTime, branch, reason } = entry;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
          results.errors.push({
            employeeId,
            error: 'Çalışan bulunamadı'
          });
          continue;
        }

        const targetDate = moment(date).startOf('day').toDate();
        
        const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);
        const checkInDateTime = moment(date)
          .hour(checkInHour)
          .minute(checkInMinute)
          .second(0)
          .toDate();

        let checkOutDateTime = null;
        if (checkOutTime) {
          const [checkOutHour, checkOutMinute] = checkOutTime.split(':').map(Number);
          checkOutDateTime = moment(date)
            .hour(checkOutHour)
            .minute(checkOutMinute)
            .second(0)
            .toDate();
        }

        let attendance = await Attendance.findOne({
          employeeId: employeeId,
          date: targetDate
        });

        if (!attendance) {
          attendance = new Attendance({
            employeeId: employee._id,
            date: targetDate
          });
        }

        attendance.checkIn = {
          time: checkInDateTime,
          method: 'MANUAL',
          location: employee.lokasyon || 'MERKEZ',
          branch: branch || defaultBranch || 'MERKEZ'
        };

        if (checkOutDateTime) {
          attendance.checkOut = {
            time: checkOutDateTime,
            method: 'MANUAL',
            location: employee.lokasyon || 'MERKEZ',
            branch: branch || defaultBranch || 'MERKEZ'
          };
          attendance.status = 'NORMAL';
          attendance.needsCorrection = false;
        } else {
          attendance.status = 'INCOMPLETE';
          attendance.needsCorrection = true;
        }

        attendance.anomalies.push({
          type: 'MANUAL_OVERRIDE',
          description: `Toplu manuel giriş - ${reason || defaultReason || 'Kağıt kayıttan aktarım'}`,
          severity: 'INFO',
          detectedAt: new Date()
        });

        attendance.notes = `[📝 Toplu Manuel Giriş: ${moment().format('DD.MM.YYYY HH:mm')}]`;

        await attendance.save();

        results.success.push({
          employeeId: employee._id,
          adSoyad: employee.adSoyad,
          date,
          checkInTime,
          checkOutTime
        });

      } catch (err) {
        results.errors.push({
          employeeId: entry.employeeId,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `${results.success.length} kayıt başarılı, ${results.errors.length} hata`,
      results
    });

  } catch (error) {
    console.error('Toplu manuel giriş hatası:', error);
    res.status(500).json({
      error: 'Toplu giriş kaydedilirken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 3. ÇIKIŞ SAATI GÜNCELLE
// ============================================

/**
 * PUT /api/manual-attendance/:id/checkout
 * Mevcut kaydın çıkış saatini ekle/güncelle
 */
router.put('/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;
    const { checkOutTime, reason } = req.body;

    if (!checkOutTime) {
      return res.status(400).json({ error: 'Çıkış saati gerekli' });
    }

    const attendance = await Attendance.findById(id).populate('employeeId');
    if (!attendance) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    // Çıkış saatini oluştur
    const [hour, minute] = checkOutTime.split(':').map(Number);
    const checkOutDateTime = moment(attendance.date)
      .hour(hour)
      .minute(minute)
      .second(0)
      .toDate();

    // Düzeltme geçmişine ekle
    if (attendance.checkOut?.time) {
      attendance.corrections.push({
        field: 'checkOut',
        oldValue: attendance.checkOut.time,
        newValue: checkOutDateTime,
        reason: reason || 'Manuel çıkış ekleme/düzeltme',
        correctedAt: new Date()
      });
    }

    // Çıkış bilgilerini güncelle
    attendance.checkOut = {
      time: checkOutDateTime,
      method: 'MANUAL',
      location: attendance.checkIn?.location || 'MERKEZ',
      branch: attendance.checkIn?.branch || 'MERKEZ'
    };

    attendance.status = 'NORMAL';
    attendance.needsCorrection = false;

    attendance.anomalies.push({
      type: 'MANUAL_OVERRIDE',
      description: `Manuel çıkış eklendi - ${reason || 'Sonradan ekleme'}`,
      severity: 'INFO',
      detectedAt: new Date()
    });

    await attendance.save();

    res.json({
      success: true,
      message: `${attendance.employeeId.adSoyad} için çıkış kaydedildi`,
      attendance,
      workDuration: attendance.workDurationFormatted
    });

  } catch (error) {
    console.error('Çıkış güncelleme hatası:', error);
    res.status(500).json({
      error: 'Çıkış güncellenirken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 3.5 MANUEL FAZLA MESAİ GÜNCELLE
// ============================================

/**
 * PUT /api/manual-attendance/:id/manual-overtime
 * Mevcut kaydın manuel fazla mesai bilgisini ekle/güncelle
 */
router.put('/:id/manual-overtime', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      manualOvertimeMinutes, 
      manualOvertimeReason, 
      manualOvertimeNotes 
    } = req.body;

    const attendance = await Attendance.findById(id).populate('employeeId');
    if (!attendance) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    // Önceki değeri kaydet (düzeltme geçmişi için)
    const previousOvertime = attendance.manualOvertimeMinutes || 0;

    // Düzeltme geçmişine ekle
    if (previousOvertime !== (manualOvertimeMinutes || 0)) {
      attendance.corrections.push({
        field: 'manualOvertimeMinutes',
        oldValue: previousOvertime,
        newValue: manualOvertimeMinutes || 0,
        reason: `Manuel fazla mesai ${previousOvertime > 0 ? 'güncellendi' : 'eklendi'} - ${manualOvertimeReason || 'Belirtilmedi'}`,
        correctedAt: new Date()
      });
    }

    // Manuel fazla mesai bilgilerini güncelle
    attendance.manualOvertimeMinutes = parseInt(manualOvertimeMinutes) || 0;
    attendance.manualOvertimeReason = manualOvertimeReason || null;
    attendance.manualOvertimeNotes = manualOvertimeNotes || null;
    attendance.manualOvertimeAddedAt = new Date();

    // Anomali ekle
    if (manualOvertimeMinutes && manualOvertimeMinutes > 0) {
      const overtimeReasonLabels = {
        'YEMEK_MOLASI_YOK': 'Yemeğe çıkmadan çalıştı',
        'HAFTA_SONU_CALISMA': 'Hafta sonu çalışma',
        'TATIL_CALISMA': 'Resmi tatil çalışma',
        'GECE_MESAI': 'Gece mesaisi',
        'ACIL_IS': 'Acil iş',
        'PROJE_TESLIM': 'Proje teslimi',
        'BAKIM_ONARIM': 'Bakım/Onarım',
        'EGITIM': 'Eğitim',
        'TOPLANTI': 'Toplantı',
        'DIGER': 'Diğer'
      };
      
      const reasonLabel = overtimeReasonLabels[manualOvertimeReason] || manualOvertimeReason || 'Belirtilmedi';
      const hours = Math.floor(manualOvertimeMinutes / 60);
      const mins = manualOvertimeMinutes % 60;
      const durationStr = hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;

      attendance.anomalies.push({
        type: 'MANUAL_OVERRIDE',
        description: `🕐 Manuel Fazla Mesai ${previousOvertime > 0 ? 'Güncellendi' : 'Eklendi'}: ${durationStr} - Sebep: ${reasonLabel}`,
        severity: 'INFO',
        detectedAt: new Date()
      });
    }

    await attendance.save();

    const hours = Math.floor((manualOvertimeMinutes || 0) / 60);
    const mins = (manualOvertimeMinutes || 0) % 60;
    const durationStr = hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;

    res.json({
      success: true,
      message: manualOvertimeMinutes > 0 
        ? `${attendance.employeeId.adSoyad} için ${durationStr} manuel fazla mesai ${previousOvertime > 0 ? 'güncellendi' : 'eklendi'}`
        : `${attendance.employeeId.adSoyad} için manuel fazla mesai kaldırıldı`,
      attendance,
      manualOvertimeMinutes: attendance.manualOvertimeMinutes,
      totalOvertimeMinutes: (attendance.overtimeMinutes || 0) + (attendance.manualOvertimeMinutes || 0)
    });

  } catch (error) {
    console.error('Manuel fazla mesai güncelleme hatası:', error);
    res.status(500).json({
      error: 'Manuel fazla mesai güncellenirken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 4. MANUEL KAYIT SİL
// ============================================

/**
 * DELETE /api/manual-attendance/:id
 * Manuel kaydı sil (sadece MANUAL method ile oluşturulmuşları)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const attendance = await Attendance.findById(id).populate('employeeId');
    if (!attendance) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    // Sadece MANUAL kayıtları silinebilir güvenlik için
    if (attendance.checkIn?.method !== 'MANUAL' && attendance.checkOut?.method !== 'MANUAL') {
      return res.status(403).json({
        error: 'Sadece manuel girilen kayıtlar silinebilir',
        method: attendance.checkIn?.method
      });
    }

    const employeeName = attendance.employeeId?.adSoyad || 'Bilinmeyen';
    const recordDate = moment(attendance.date).format('DD.MM.YYYY');

    await Attendance.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `${employeeName} - ${recordDate} kaydı silindi`,
      reason: reason || 'Manuel silme'
    });

  } catch (error) {
    console.error('Kayıt silme hatası:', error);
    res.status(500).json({
      error: 'Kayıt silinirken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 5. BUGÜNKÜ MANUEL GİRİŞLER
// ============================================

/**
 * GET /api/manual-attendance/today
 * Bugün manuel girilen kayıtları getir
 */
router.get('/today', async (req, res) => {
  try {
    const { branch } = req.query;

    const today = moment().startOf('day').toDate();
    
    const query = {
      date: today,
      $or: [
        { 'checkIn.method': 'MANUAL' },
        { 'checkOut.method': 'MANUAL' }
      ]
    };

    if (branch && branch !== 'TÜM') {
      query['checkIn.branch'] = branch;
    }

    const records = await Attendance.find(query)
      .populate('employeeId', 'adSoyad tcNo employeeId pozisyon departman lokasyon profilePhoto')
      .sort({ 'checkIn.time': -1 });

    // Şu an içeride olanlar (giriş var, çıkış yok)
    const currentlyInside = records.filter(r => r.checkIn?.time && !r.checkOut?.time);
    
    // Çıkış yapmış olanlar
    const checkedOut = records.filter(r => r.checkIn?.time && r.checkOut?.time);

    res.json({
      success: true,
      date: today,
      stats: {
        total: records.length,
        currentlyInside: currentlyInside.length,
        checkedOut: checkedOut.length
      },
      currentlyInside,
      checkedOut,
      allRecords: records
    });

  } catch (error) {
    console.error('Bugünkü kayıtlar hatası:', error);
    res.status(500).json({
      error: 'Kayıtlar alınırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 6. TARİHE GÖRE MANUEL KAYITLAR
// ============================================

/**
 * GET /api/manual-attendance/by-date?date=2025-12-16&branch=MERKEZ
 * Belirli tarihin manuel kayıtlarını getir
 */
router.get('/by-date', async (req, res) => {
  try {
    const { date, branch, includeAll } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Tarih parametresi gerekli' });
    }

    const targetDate = moment(date).startOf('day').toDate();
    
    // includeAll true ise tüm kayıtları getir, değilse sadece manuel olanları
    const query = {
      date: targetDate
    };

    if (includeAll !== 'true') {
      query.$or = [
        { 'checkIn.method': 'MANUAL' },
        { 'checkOut.method': 'MANUAL' }
      ];
    }

    if (branch && branch !== 'TÜM') {
      query['checkIn.branch'] = branch;
    }

    const records = await Attendance.find(query)
      .populate('employeeId', 'adSoyad tcNo employeeId pozisyon departman lokasyon profilePhoto')
      .sort({ 'checkIn.time': -1 });

    // Şu an içeride olanlar
    const currentlyInside = records.filter(r => r.checkIn?.time && !r.checkOut?.time);
    const checkedOut = records.filter(r => r.checkIn?.time && r.checkOut?.time);

    res.json({
      success: true,
      date: targetDate,
      stats: {
        total: records.length,
        currentlyInside: currentlyInside.length,
        checkedOut: checkedOut.length,
        manual: records.filter(r => r.checkIn?.method === 'MANUAL' || r.checkOut?.method === 'MANUAL').length
      },
      currentlyInside,
      checkedOut,
      allRecords: records
    });

  } catch (error) {
    console.error('Tarihe göre kayıtlar hatası:', error);
    res.status(500).json({
      error: 'Kayıtlar alınırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 7. ÇALIŞAN ARA (Autocomplete)
// ============================================

/**
 * GET /api/manual-attendance/search-employees?q=ahmet
 * Çalışan arama (isim, TC, sicil no)
 */
router.get('/search-employees', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.json({ employees: [] });
    }

    const { EMPLOYEE_STATUS } = require('../constants/employee.constants');

    const employees = await Employee.find({
      durum: EMPLOYEE_STATUS.ACTIVE,
      $or: [
        { adSoyad: { $regex: q, $options: 'i' } },
        { tcNo: { $regex: q } },
        { employeeId: { $regex: q, $options: 'i' } }
      ]
    })
    .select('adSoyad tcNo employeeId pozisyon departman lokasyon profilePhoto')
    .limit(parseInt(limit))
    .sort({ adSoyad: 1 });

    res.json({
      success: true,
      count: employees.length,
      employees
    });

  } catch (error) {
    console.error('Çalışan arama hatası:', error);
    res.status(500).json({
      error: 'Arama yapılırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 8. ÇALIŞANIN GÜN İÇİNDEKİ DURUMU
// ============================================

/**
 * GET /api/manual-attendance/employee-status/:employeeId?date=2025-12-16
 * Çalışanın belirli gündeki durumunu getir
 */
router.get('/employee-status/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;

    const targetDate = date 
      ? moment(date).startOf('day').toDate()
      : moment().startOf('day').toDate();

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Çalışan bulunamadı' });
    }

    const attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: targetDate
    });

    const status = {
      hasRecord: !!attendance,
      hasCheckIn: !!attendance?.checkIn?.time,
      hasCheckOut: !!attendance?.checkOut?.time,
      checkInTime: attendance?.checkIn?.time,
      checkOutTime: attendance?.checkOut?.time,
      checkInMethod: attendance?.checkIn?.method,
      checkOutMethod: attendance?.checkOut?.method,
      branch: attendance?.checkIn?.branch,
      workDuration: attendance?.workDurationFormatted,
      status: attendance?.status,
      canAddCheckIn: !attendance?.checkIn?.time,
      canAddCheckOut: attendance?.checkIn?.time && !attendance?.checkOut?.time,
      isCurrentlyInside: attendance?.checkIn?.time && !attendance?.checkOut?.time
    };

    res.json({
      success: true,
      employee: {
        _id: employee._id,
        adSoyad: employee.adSoyad,
        tcNo: employee.tcNo,
        pozisyon: employee.pozisyon,
        lokasyon: employee.lokasyon
      },
      date: targetDate,
      status,
      attendance: attendance || null
    });

  } catch (error) {
    console.error('Çalışan durumu hatası:', error);
    res.status(500).json({
      error: 'Durum alınırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 9. MANUEL GİRİŞ İSTATİSTİKLERİ
// ============================================

/**
 * GET /api/manual-attendance/stats?startDate=2025-12-01&endDate=2025-12-31
 * Manuel giriş istatistikleri
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate 
      ? moment(startDate).startOf('day').toDate()
      : moment().subtract(30, 'days').startOf('day').toDate();
    
    const end = endDate
      ? moment(endDate).endOf('day').toDate()
      : moment().endOf('day').toDate();

    const manualRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
      $or: [
        { 'checkIn.method': 'MANUAL' },
        { 'checkOut.method': 'MANUAL' }
      ]
    }).populate('employeeId', 'adSoyad departman');

    // Günlük dağılım
    const dailyStats = {};
    manualRecords.forEach(record => {
      const day = moment(record.date).format('YYYY-MM-DD');
      if (!dailyStats[day]) {
        dailyStats[day] = { total: 0, incomplete: 0 };
      }
      dailyStats[day].total++;
      if (!record.checkOut?.time) {
        dailyStats[day].incomplete++;
      }
    });

    // Departman dağılımı
    const deptStats = {};
    manualRecords.forEach(record => {
      const dept = record.employeeId?.departman || 'Belirtilmemiş';
      if (!deptStats[dept]) {
        deptStats[dept] = 0;
      }
      deptStats[dept]++;
    });

    res.json({
      success: true,
      period: { start, end },
      summary: {
        totalManualRecords: manualRecords.length,
        incompleteRecords: manualRecords.filter(r => !r.checkOut?.time).length,
        uniqueEmployees: [...new Set(manualRecords.map(r => r.employeeId?._id?.toString()))].length
      },
      dailyStats,
      departmentStats: deptStats
    });

  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({
      error: 'İstatistikler alınırken hata oluştu',
      details: error.message
    });
  }
});

module.exports = router;


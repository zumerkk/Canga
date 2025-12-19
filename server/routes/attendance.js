const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const XLSX = require('xlsx');
const moment = require('moment');
const multer = require('multer');

// Multer setup - memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * 🎯 ATTENDANCE ROUTES - Giriş-Çıkış Takip API'leri
 */

// ============================================
// 1. GİRİŞ KAYDI (Check-in)
// ============================================

/**
 * POST /api/attendance/check-in
 * Çalışan giriş kaydı oluştur
 */
router.post('/check-in', async (req, res) => {
  try {
    const {
      employeeId,
      method,
      location,
      branch,
      deviceId,
      signature,
      photo,
      coordinates,
      ipAddress,
      additionalData, // 🆕 Kiosk/Yardımlı giriş için ek veriler
      time // 🆕 Özel zaman (yardımlı giriş için)
    } = req.body;

    // Çalışan kontrolü
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Çalışan bulunamadı' });
    }

    // Bugünkü tarih
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugün zaten giriş var mı kontrol et
    const existingAttendance = await Attendance.findOne({
      employeeId: employeeId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn?.time) {
      return res.status(400).json({
        error: 'Bu çalışan için bugün zaten giriş kaydı var',
        existing: existingAttendance
      });
    }

    // Vardiya planı kontrol et (varsa)
    const todayShift = await Shift.findOne({
      'shifts.employees.employeeId': employeeId,
      'startDate': { $lte: today },
      'endDate': { $gte: today }
    });

    let expectedCheckIn = null;
    if (todayShift) {
      // Vardiya başlangıç saatini al
      const employeeShift = todayShift.shifts.find(s =>
        s.employees.some(e => e.employeeId.toString() === employeeId)
      );
      if (employeeShift?.timeSlot) {
        const [startTime] = employeeShift.timeSlot.split('-');
        expectedCheckIn = moment(today).set({
          hour: parseInt(startTime.split(':')[0]),
          minute: parseInt(startTime.split(':')[1])
        }).toDate();
      }
    }

    // 🆕 Giriş zamanını belirle (özel zaman veya şimdiki zaman)
    const checkInTime = time ? new Date(time) : new Date();

    // Yeni kayıt oluştur
    const attendance = new Attendance({
      employeeId,
      date: today,
      checkIn: {
        time: checkInTime,
        method,
        location,
        branch: branch || 'MERKEZ', // 🆕 Şube bilgisi
        deviceId,
        signature,
        photo,
        coordinates,
        ipAddress: ipAddress || req.ip
      },
      expectedCheckIn,
      shiftId: todayShift?._id
    });

    // 🆕 Ek veriler varsa kaydet (Kiosk/Yardımlı giriş bilgileri)
    if (additionalData) {
      const anomalyType = additionalData.entryMethod === 'ASSISTED' 
        ? 'ASSISTED_ENTRY' 
        : 'KIOSK_ENTRY';
      
      attendance.anomalies.push({
        type: anomalyType,
        description: buildAdditionalDataDescription(additionalData),
        severity: 'INFO',
        detectedAt: new Date()
      });

      // 🆕 İmzasız giriş kontrolü
      if (additionalData.hasSignature === false) {
        attendance.anomalies.push({
          type: 'NO_SIGNATURE',
          description: `İmzasız giriş - TC: ${additionalData.tcNo || employee.tcNo}, Sicil: ${additionalData.employeeCode || '-'}`,
          severity: 'WARNING',
          detectedAt: new Date()
        });
        
        // İmzasız girişlerde düzeltme gerekli işaretle (admin görebilsin)
        attendance.needsCorrection = true;
        attendance.notes = (attendance.notes || '') + 
          ` [⚠️ İMZASIZ GİRİŞ - TC: ${additionalData.tcNo || employee.tcNo}]`;
      }

      // Geç kalma sebebi varsa not olarak ekle
      if (additionalData.lateReason) {
        attendance.notes = (attendance.notes || '') + 
          ` [Geç kalma sebebi: ${getLateReasonLabel(additionalData.lateReason)}]`;
      }

      // Yardımlı giriş ise özel not
      if (additionalData.assistedBy) {
        attendance.notes = (attendance.notes || '') + 
          ` [Yardımlı giriş: ${additionalData.assistedByName || 'Yönetici'} tarafından, Sebep: ${getAssistedReasonLabel(additionalData.assistedReason)}]`;
      }
    }

    await attendance.save();

    // Populate ile döndür
    await attendance.populate('employeeId', 'adSoyad tcNo employeeId pozisyon departman lokasyon profilePhoto');

    res.status(201).json({
      success: true,
      message: `${employee.adSoyad} giriş kaydı oluşturuldu`,
      attendance,
      entryMethod: additionalData?.entryMethod || 'STANDARD'
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      error: 'Giriş kaydı oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// 🆕 Yardımcı fonksiyonlar
function buildAdditionalDataDescription(data) {
  const parts = [];
  
  if (data.entryMethod === 'KIOSK') {
    parts.push('Kiosk terminali üzerinden giriş');
    if (data.kioskId) parts.push(`Kiosk: ${data.kioskId}`);
  } else if (data.entryMethod === 'ASSISTED') {
    parts.push(`Yardımlı giriş (${data.assistedByName || 'Yönetici'})`);
    if (data.assistedReason) parts.push(`Sebep: ${getAssistedReasonLabel(data.assistedReason)}`);
  }
  
  if (data.lateReason) {
    parts.push(`Geç kalma: ${getLateReasonLabel(data.lateReason)}`);
  }
  
  if (data.notes) {
    parts.push(`Not: ${data.notes}`);
  }
  
  return parts.join(' | ') || 'Ek bilgi mevcut';
}

function getLateReasonLabel(reason) {
  const labels = {
    'TRAFFIC': 'Trafik',
    'HEALTH': 'Sağlık sorunu',
    'FAMILY': 'Ailevi sebepler',
    'TRANSPORT': 'Ulaşım problemi',
    'WEATHER': 'Hava koşulları',
    'OTHER': 'Diğer'
  };
  return labels[reason] || reason;
}

function getAssistedReasonLabel(reason) {
  const labels = {
    'ELDERLY': 'Yaşlı çalışan',
    'NO_PHONE': 'Telefon yok/bozuk',
    'TECH_DIFFICULTY': 'Teknoloji zorluğu',
    'EMERGENCY': 'Acil durum',
    'FORGOT_CARD': 'Kart unutuldu',
    'GROUP_ENTRY': 'Toplu giriş',
    'OTHER': 'Diğer'
  };
  return labels[reason] || reason;
}

function getEarlyLeaveReasonLabel(reason) {
  const labels = {
    'HEALTH': 'Sağlık sorunu',
    'FAMILY': 'Ailevi acil durum',
    'APPOINTMENT': 'Randevu',
    'PERMISSION': 'İzinli',
    'OTHER': 'Diğer'
  };
  return labels[reason] || reason;
}

// ============================================
// 2. ÇIKIŞ KAYDI (Check-out)
// ============================================

/**
 * POST /api/attendance/check-out
 * Çalışan çıkış kaydı oluştur
 */
router.post('/check-out', async (req, res) => {
  try {
    const {
      employeeId,
      method,
      location,
      branch,
      deviceId,
      signature,
      photo,
      coordinates,
      ipAddress,
      additionalData, // 🆕 Kiosk/Yardımlı çıkış için ek veriler
      time // 🆕 Özel zaman (yardımlı çıkış için)
    } = req.body;

    // Bugünkü kayıt
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        error: 'Bugün için giriş kaydı bulunamadı. Önce giriş yapmalısınız.'
      });
    }

    if (attendance.checkOut?.time) {
      return res.status(400).json({
        error: 'Bu çalışan için bugün zaten çıkış kaydı var'
      });
    }

    // 🆕 Çıkış zamanını belirle (özel zaman veya şimdiki zaman)
    const checkOutTime = time ? new Date(time) : new Date();

    // Çıkış bilgilerini ekle
    attendance.checkOut = {
      time: checkOutTime,
      method,
      location,
      branch: branch || attendance.checkIn?.branch || 'MERKEZ', // 🆕 Şube bilgisi
      deviceId,
      signature,
      photo,
      coordinates,
      ipAddress: ipAddress || req.ip
    };

    // 🆕 Ek veriler varsa kaydet (Kiosk/Yardımlı çıkış bilgileri)
    if (additionalData) {
      const anomalyType = additionalData.entryMethod === 'ASSISTED' 
        ? 'ASSISTED_EXIT' 
        : 'KIOSK_EXIT';
      
      attendance.anomalies.push({
        type: anomalyType,
        description: buildCheckoutDescription(additionalData),
        severity: 'INFO',
        detectedAt: new Date()
      });

      // 🆕 İmzasız çıkış kontrolü
      if (additionalData.hasSignature === false) {
        attendance.anomalies.push({
          type: 'NO_SIGNATURE',
          description: `İmzasız çıkış - TC: ${additionalData.tcNo || '-'}, Sicil: ${additionalData.employeeCode || '-'}`,
          severity: 'WARNING',
          detectedAt: new Date()
        });
        
        // İmzasız çıkışta düzeltme gerekli işaretle
        attendance.needsCorrection = true;
        attendance.notes = (attendance.notes || '') + 
          ` [⚠️ İMZASIZ ÇIKIŞ - TC: ${additionalData.tcNo || '-'}]`;
      }

      // Erken çıkış sebebi varsa not olarak ekle
      if (additionalData.earlyLeaveReason) {
        attendance.notes = (attendance.notes || '') + 
          ` [Erken çıkış sebebi: ${getEarlyLeaveReasonLabel(additionalData.earlyLeaveReason)}]`;
      }

      // Yardımlı çıkış ise özel not
      if (additionalData.assistedBy) {
        attendance.notes = (attendance.notes || '') + 
          ` [Yardımlı çıkış: ${additionalData.assistedByName || 'Yönetici'} tarafından, Sebep: ${getAssistedReasonLabel(additionalData.assistedReason)}]`;
      }
    }

    await attendance.save();
    await attendance.populate('employeeId', 'adSoyad tcNo employeeId pozisyon departman lokasyon profilePhoto');

    res.json({
      success: true,
      message: `${attendance.employeeId.adSoyad} çıkış kaydı oluşturuldu`,
      attendance,
      entryMethod: additionalData?.entryMethod || 'STANDARD',
      workDuration: attendance.workDurationFormatted
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      error: 'Çıkış kaydı oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// 🆕 Çıkış için açıklama oluştur
function buildCheckoutDescription(data) {
  const parts = [];
  
  if (data.entryMethod === 'KIOSK') {
    parts.push('Kiosk terminali üzerinden çıkış');
    if (data.kioskId) parts.push(`Kiosk: ${data.kioskId}`);
  } else if (data.entryMethod === 'ASSISTED') {
    parts.push(`Yardımlı çıkış (${data.assistedByName || 'Yönetici'})`);
    if (data.assistedReason) parts.push(`Sebep: ${getAssistedReasonLabel(data.assistedReason)}`);
  }
  
  if (data.earlyLeaveReason) {
    parts.push(`Erken çıkış: ${getEarlyLeaveReasonLabel(data.earlyLeaveReason)}`);
  }
  
  if (data.notes) {
    parts.push(`Not: ${data.notes}`);
  }
  
  return parts.join(' | ') || 'Ek bilgi mevcut';
}

// ============================================
// 3. GÜNLÜK KAYITLAR
// ============================================

/**
 * GET /api/attendance/daily?date=2025-11-10&location=MERKEZ
 * Belirli bir günün kayıtlarını getir
 */
router.get('/daily', async (req, res) => {
  try {
    const { date, location } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Tarih parametresi gerekli' });
    }

    const targetDate = new Date(date);
    const records = await Attendance.getDailyRecords(targetDate, location);

    // İstatistikler
    const stats = {
      total: records.length,
      present: records.filter(r => r.checkIn?.time && r.checkOut?.time).length,
      incomplete: records.filter(r => r.status === 'INCOMPLETE').length,
      late: records.filter(r => r.status === 'LATE').length,
      earlyLeave: records.filter(r => r.status === 'EARLY_LEAVE').length,
      absent: records.filter(r => r.status === 'ABSENT').length
    };

    res.json({
      success: true,
      date: targetDate,
      location: location || 'TÜM LOKASYONLAR',
      stats,
      records
    });

  } catch (error) {
    console.error('Daily records error:', error);
    res.status(500).json({ error: 'Günlük kayıtlar alınırken hata oluştu' });
  }
});

// ============================================
// 4. AYLIK RAPOR
// ============================================

/**
 * GET /api/attendance/monthly-report/:employeeId?year=2025&month=11
 * Bir çalışanın aylık raporu
 */
router.get('/monthly-report/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Yıl ve ay parametreleri gerekli' });
    }

    const records = await Attendance.getMonthlyReport(
      employeeId,
      parseInt(year),
      parseInt(month)
    );

    // İstatistikler hesapla
    const stats = {
      totalDays: records.length,
      presentDays: records.filter(r => r.checkIn?.time && r.checkOut?.time).length,
      absentDays: records.filter(r => r.status === 'ABSENT').length,
      lateDays: records.filter(r => r.status === 'LATE').length,
      totalWorkMinutes: records.reduce((sum, r) => sum + (r.netWorkDuration || 0), 0),
      totalOvertimeMinutes: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0),
      averageDailyHours: 0
    };

    if (stats.presentDays > 0) {
      stats.averageDailyHours = (stats.totalWorkMinutes / stats.presentDays / 60).toFixed(2);
    }

    // Çalışan bilgisi
    const employee = await Employee.findById(employeeId);

    res.json({
      success: true,
      employee: {
        _id: employee._id,
        adSoyad: employee.adSoyad,
        tcNo: employee.tcNo,
        pozisyon: employee.pozisyon,
        lokasyon: employee.lokasyon
      },
      period: {
        year: parseInt(year),
        month: parseInt(month)
      },
      stats,
      records
    });

  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ error: 'Aylık rapor oluşturulurken hata oluştu' });
  }
});

// ============================================
// 5. EKSİK KAYITLAR
// ============================================

/**
 * GET /api/attendance/missing-records?date=2025-11-10
 * Eksik giriş/çıkış kayıtlarını listele
 */
router.get('/missing-records', async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Tarih parametresi gerekli' });
    }

    const targetDate = new Date(date);
    const missingRecords = await Attendance.findMissingRecords(targetDate);

    res.json({
      success: true,
      date: targetDate,
      count: missingRecords.length,
      records: missingRecords
    });

  } catch (error) {
    console.error('Missing records error:', error);
    res.status(500).json({ error: 'Eksik kayıtlar alınırken hata oluştu' });
  }
});

// ============================================
// 6. EXCEL İMPORT (Kart Okuyucu)
// ============================================

/**
 * POST /api/attendance/import-excel
 * Kart okuyucu Excel dosyasını import et
 */
router.post('/import-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel dosyası yükleyin' });
    }

    const workbook = XLSX.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let imported = 0;
    let errors = [];
    let warnings = [];

    for (let row of data) {
      try {
        // Excel'den veri parse et
        // NOT: Sütun isimleri Excel'e göre değişir!
        const employeeName = row['AD SOYAD'] || row['İsim'] || row['Name'];
        const tcNo = row['TC NO'] || row['TC'];
        const checkInTime = row['GİRİŞ'] || row['Check In'];
        const checkOutTime = row['ÇIKIŞ'] || row['Check Out'];
        const dateStr = row['TARİH'] || row['Date'];

        if (!employeeName || !dateStr) {
          warnings.push(`Satır atlandı: Eksik veri - ${JSON.stringify(row)}`);
          continue;
        }

        // Çalışan bul
        let employee = null;
        if (tcNo) {
          employee = await Employee.findOne({ tcNo: tcNo });
        }

        if (!employee) {
          // İsme göre ara (fuzzy match)
          employee = await Employee.findOne({
            adSoyad: { $regex: employeeName, $options: 'i' }
          });
        }

        if (!employee) {
          warnings.push(`Çalışan bulunamadı: ${employeeName}`);
          continue;
        }

        // Tarih parse
        const date = moment(dateStr, ['DD.MM.YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).toDate();
        date.setHours(0, 0, 0, 0);

        // Mevcut kayıt var mı?
        let attendance = await Attendance.findOne({
          employeeId: employee._id,
          date: date
        });

        if (!attendance) {
          attendance = new Attendance({
            employeeId: employee._id,
            date: date
          });
        }

        // Giriş saati
        if (checkInTime) {
          const checkInMoment = moment(checkInTime, ['HH:mm', 'HH:mm:ss']);
          attendance.checkIn = {
            time: moment(date).set({
              hour: checkInMoment.hour(),
              minute: checkInMoment.minute()
            }).toDate(),
            method: 'EXCEL_IMPORT',
            location: employee.lokasyon || 'MERKEZ'
          };

          // ±1 dakika düzeltme
          const minutes = checkInMoment.minute();
          if (minutes === 59 || minutes === 58) {
            attendance.checkIn.time = moment(attendance.checkIn.time)
              .add(1, 'minute')
              .seconds(0)
              .toDate();
            
            attendance.anomalies.push({
              type: 'TIME_CORRECTION',
              description: `Giriş saati ${checkInMoment.format('HH:mm')} → ${moment(attendance.checkIn.time).format('HH:mm')} düzeltildi`,
              severity: 'INFO'
            });
          }
        }

        // Çıkış saati
        if (checkOutTime) {
          const checkOutMoment = moment(checkOutTime, ['HH:mm', 'HH:mm:ss']);
          attendance.checkOut = {
            time: moment(date).set({
              hour: checkOutMoment.hour(),
              minute: checkOutMoment.minute()
            }).toDate(),
            method: 'EXCEL_IMPORT',
            location: employee.lokasyon || 'MERKEZ'
          };

          // ±1 dakika düzeltme
          const minutes = checkOutMoment.minute();
          if (minutes === 59 || minutes === 58 || minutes === 1 || minutes === 2) {
            const roundedMinute = minutes >= 58 ? 0 : 30; // 30'a da yuvarla
            attendance.checkOut.time = moment(attendance.checkOut.time)
              .minutes(roundedMinute)
              .seconds(0)
              .toDate();
            
            attendance.anomalies.push({
              type: 'TIME_CORRECTION',
              description: `Çıkış saati ${checkOutMoment.format('HH:mm')} → ${moment(attendance.checkOut.time).format('HH:mm')} düzeltildi`,
              severity: 'INFO'
            });
          }
        }

        // Excel'den geldiğini işaretle
        attendance.anomalies.push({
          type: 'DATA_IMPORTED',
          description: 'Veri kart okuyucu Excel\'den import edildi',
          severity: 'INFO'
        });

        await attendance.save();
        imported++;

      } catch (err) {
        errors.push(`Satır işlenirken hata: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `${imported} kayıt başarıyla import edildi`,
      stats: {
        total: data.length,
        imported,
        errors: errors.length,
        warnings: warnings.length
      },
      errors,
      warnings
    });

  } catch (error) {
    console.error('Excel import error:', error);
    res.status(500).json({
      error: 'Excel import edilirken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 7. BORDRO EXPORT
// ============================================

/**
 * GET /api/attendance/payroll-export?year=2025&month=11&location=MERKEZ
 * Bordro için Excel export
 */
router.get('/payroll-export', async (req, res) => {
  try {
    const { year, month, location } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Yıl ve ay parametreleri gerekli' });
    }

    // Ay başı ve sonu
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Tüm çalışanları al
    const query = location ? { lokasyon: location, durum: 'AKTIF' } : { durum: 'AKTIF' };
    const employees = await Employee.find(query);

    // Her çalışan için aylık özet
    const payrollData = [];

    for (let employee of employees) {
      const records = await Attendance.find({
        employeeId: employee._id,
        date: { $gte: startDate, $lte: endDate }
      });

      const totalWorkMinutes = records.reduce((sum, r) => sum + (r.netWorkDuration || 0), 0);
      const totalOvertimeMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);
      const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
      const presentDays = records.filter(r => r.checkIn?.time && r.checkOut?.time).length;

      payrollData.push({
        'AD SOYAD': employee.adSoyad,
        'TC NO': employee.tcNo,
        'POZİSYON': employee.pozisyon,
        'LOKASYON': employee.lokasyon,
        'ÇALIŞILAN GÜN': presentDays,
        'TOPLAM SAAT': (totalWorkMinutes / 60).toFixed(2),
        'FAZLA MESAİ (SAAT)': (totalOvertimeMinutes / 60).toFixed(2),
        'GEÇ KALMA (DAKİKA)': totalLateMinutes,
        'DEVAMSIZLIK': records.filter(r => r.status === 'ABSENT').length
      });
    }

    // Excel oluştur
    const worksheet = XLSX.utils.json_to_sheet(payrollData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bordro');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=bordro_${year}_${month}.xlsx`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Payroll export error:', error);
    res.status(500).json({ error: 'Bordro export edilirken hata oluştu' });
  }
});

// ============================================
// 8. MANUEL DÜZELTME
// ============================================

/**
 * PUT /api/attendance/:id/correct
 * Giriş-çıkış kaydını manuel düzelt
 */
router.put('/:id/correct', async (req, res) => {
  try {
    const { id } = req.params;
    const { checkInTime, checkOutTime, reason, userId } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    // Düzeltme geçmişine ekle
    if (checkInTime && checkInTime !== attendance.checkIn?.time?.toISOString()) {
      attendance.corrections.push({
        field: 'checkIn',
        oldValue: attendance.checkIn?.time,
        newValue: new Date(checkInTime),
        reason,
        correctedBy: userId
      });
      attendance.checkIn.time = new Date(checkInTime);
    }

    if (checkOutTime && checkOutTime !== attendance.checkOut?.time?.toISOString()) {
      attendance.corrections.push({
        field: 'checkOut',
        oldValue: attendance.checkOut?.time,
        newValue: new Date(checkOutTime),
        reason,
        correctedBy: userId
      });
      attendance.checkOut.time = new Date(checkOutTime);
    }

    attendance.anomalies.push({
      type: 'MANUAL_OVERRIDE',
      description: `Manuel düzeltme yapıldı: ${reason}`,
      severity: 'INFO'
    });

    attendance.needsCorrection = false;
    attendance.verified = true;
    attendance.verifiedBy = userId;
    attendance.verifiedAt = new Date();

    await attendance.save();

    res.json({
      success: true,
      message: 'Kayıt başarıyla düzeltildi',
      attendance
    });

  } catch (error) {
    console.error('Correction error:', error);
    res.status(500).json({ error: 'Düzeltme yapılırken hata oluştu' });
  }
});

// ============================================
// 9. CANLI İSTATİSTİKLER
// ============================================

/**
 * GET /api/attendance/live-stats?location=MERKEZ
 * Anlık istatistikler (Dashboard için)
 */
router.get('/live-stats', async (req, res) => {
  try {
    const { location, branch } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query = { date: today };
    if (location && location !== 'TÜM') {
      query['checkIn.location'] = location;
    }
    if (branch && branch !== 'TÜM') {
      query['checkIn.branch'] = branch;
    }

    const records = await Attendance.find(query);

    // Tüm aktif çalışan sayısı - EMPLOYEE_STATUS constant kullan
    const { EMPLOYEE_STATUS } = require('../constants/employee.constants');
    const totalQuery = { durum: EMPLOYEE_STATUS.ACTIVE };
    if (location && location !== 'TÜM') {
      totalQuery.lokasyon = location;
    }
    
    const totalEmployees = await Employee.countDocuments(totalQuery);

    // Bugün kaydı olan benzersiz çalışan sayısı (aynı çalışanın birden fazla kaydı olabilir)
    const uniqueEmployeeIds = new Set(records.map(r => r.employeeId?.toString()).filter(Boolean));
    const totalCameToWork = uniqueEmployeeIds.size;

    // 🆕 Detaylı istatistikler
    const stats = {
      totalEmployees,
      present: records.filter(r => r.checkIn?.time && !r.checkOut?.time).length, // Şu an içeride
      checkedOut: records.filter(r => r.checkIn?.time && r.checkOut?.time).length, // Çıkmış
      absent: totalEmployees - totalCameToWork, // Hiç gelmemiş
      
      // 🚨 GEÇ KALMA İSTATİSTİKLERİ
      late: records.filter(r => r.isLate === true || r.status === 'LATE' || r.status === 'SHORT_SHIFT').length,
      lateDetails: records.filter(r => r.isLate === true).map(r => ({
        employeeId: r.employeeId,
        lateMinutes: r.lateMinutes,
        checkInTime: r.checkIn?.time
      })),
      
      // 🚨 ERKEN ÇIKIŞ İSTATİSTİKLERİ
      earlyLeave: records.filter(r => r.isEarlyLeave === true || r.status === 'EARLY_LEAVE' || r.status === 'SHORT_SHIFT').length,
      earlyLeaveDetails: records.filter(r => r.isEarlyLeave === true).map(r => ({
        employeeId: r.employeeId,
        earlyLeaveMinutes: r.earlyLeaveMinutes,
        checkOutTime: r.checkOut?.time
      })),
      
      // 🆕 EKSİK ÇALIŞMA (Hem geç gelip hem erken çıkanlar)
      shortShift: records.filter(r => r.isShortShift === true || r.status === 'SHORT_SHIFT').length,
      shortShiftDetails: records.filter(r => r.isShortShift === true || r.status === 'SHORT_SHIFT').map(r => ({
        employeeId: r.employeeId,
        lateMinutes: r.lateMinutes,
        earlyLeaveMinutes: r.earlyLeaveMinutes,
        totalMissing: (r.lateMinutes || 0) + (r.earlyLeaveMinutes || 0),
        checkInTime: r.checkIn?.time,
        checkOutTime: r.checkOut?.time
      })),
      
      incomplete: records.filter(r => r.status === 'INCOMPLETE').length, // Çıkış yapmamış
      noLocation: records.filter(r => !r.checkIn?.coordinates?.latitude).length // GPS'siz giriş
    };

    // Son 10 aktivite
    const recentActivity = await Attendance.find(query)
      .populate('employeeId', 'adSoyad employeeId profilePhoto pozisyon departman lokasyon')
      .sort({ 'checkIn.time': -1 })
      .limit(10);

    res.json({
      success: true,
      timestamp: new Date(),
      location: location || 'TÜM LOKASYONLAR',
      branch: branch || 'TÜM ŞUBELER',
      stats,
      recentActivity
    });

  } catch (error) {
    console.error('Live stats error:', error);
    res.status(500).json({ error: 'İstatistikler alınırken hata oluştu' });
  }
});

// ============================================
// 10. TARİH ARALIĞI KAYITLARI
// ============================================

/**
 * GET /api/attendance/date-range?startDate=2025-12-01&endDate=2025-12-19&branch=MERKEZ
 * Belirli bir tarih aralığındaki kayıtları getir (İK Paneli için)
 */
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate, branch, location } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate ve endDate parametreleri gerekli' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Query oluştur
    const query = {
      date: {
        $gte: start,
        $lte: end
      }
    };

    // Şube filtresi
    if (branch && branch !== 'TÜM') {
      query['checkIn.branch'] = branch;
    }

    // Lokasyon filtresi
    if (location && location !== 'TÜM') {
      query['checkIn.location'] = location;
    }

    // Kayıtları getir
    const records = await Attendance.find(query)
      .populate('employeeId', 'adSoyad tcNo employeeId pozisyon departman lokasyon profilePhoto')
      .sort({ date: -1, 'checkIn.time': -1 });

    // İstatistikler
    const uniqueEmployeeIds = new Set(
      records.filter(r => r.employeeId?._id).map(r => r.employeeId._id.toString())
    );

    const stats = {
      totalRecords: records.length,
      uniqueEmployees: uniqueEmployeeIds.size,
      completed: records.filter(r => r.checkIn?.time && r.checkOut?.time).length,
      incomplete: records.filter(r => r.checkIn?.time && !r.checkOut?.time).length,
      late: records.filter(r => r.isLate === true || r.status === 'LATE' || r.status === 'SHORT_SHIFT').length,
      earlyLeave: records.filter(r => r.isEarlyLeave === true || r.status === 'EARLY_LEAVE' || r.status === 'SHORT_SHIFT').length,
      shortShift: records.filter(r => r.isShortShift === true || r.status === 'SHORT_SHIFT').length,
      totalWorkMinutes: records.reduce((sum, r) => sum + (r.workDuration || 0), 0),
      totalOvertimeMinutes: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0) + (r.manualOvertimeMinutes || 0), 0),
      totalLateMinutes: records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0),
      totalEarlyLeaveMinutes: records.reduce((sum, r) => sum + (r.earlyLeaveMinutes || 0), 0)
    };

    res.json({
      success: true,
      period: {
        startDate: start,
        endDate: end
      },
      branch: branch || 'TÜM ŞUBELER',
      stats,
      records
    });

  } catch (error) {
    console.error('Date range records error:', error);
    res.status(500).json({ error: 'Tarih aralığı kayıtları alınırken hata oluştu' });
  }
});

module.exports = router;


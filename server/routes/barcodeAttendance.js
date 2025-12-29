const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const fraudService = require('../services/fraudDetectionService');

/**
 * 📊 BARKOD TABANLI GİRİŞ-ÇIKIŞ SİSTEMİ
 * 
 * Fabrika giriş kapısındaki barkod okuyucular için
 * Hızlı, güvenli ve doğrulanabilir giriş-çıkış
 * 
 * Desteklenen Barkod Formatları:
 * 1. Sicil No: "MK0042"
 * 2. TC Son 6 Hane: "123456"
 * 3. Tam TC: "12345678901"
 * 4. Custom Format: "CANGA-123456-MK0042"
 */

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

/**
 * Türkçe karakterleri ASCII'ye dönüştür
 * Barkod kartlarında Türkçe karakterler ASCII'ye dönüştürülüyor
 * Bu fonksiyon ters dönüşüm için kullanılır
 */
const turkishToAscii = (str) => {
  if (!str) return '';
  return str
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');
};

/**
 * ASCII'den Türkçe'ye olası eşleşmeleri oluştur (regex için)
 * Örn: "OA" -> "[OÖ]A" regex pattern
 */
const createTurkishRegex = (asciiStr) => {
  if (!asciiStr) return '';
  return asciiStr
    .replace(/G/g, '[GĞ]')
    .replace(/U/g, '[UÜ]')
    .replace(/S/g, '[SŞ]')
    .replace(/I/g, '[Iİı]')
    .replace(/O/g, '[OÖ]')
    .replace(/C/g, '[CÇ]');
};

/**
 * Barkod değerinden çalışanı bul
 */
const findEmployeeByBarcode = async (barcode) => {
  if (!barcode) return null;
  
  const cleanBarcode = barcode.trim().toUpperCase();
  const asciiBarcode = turkishToAscii(cleanBarcode);
  
  // 1. Custom format: CANGA-XXXXXX
  if (cleanBarcode.startsWith('CANGA-')) {
    const parts = cleanBarcode.split('-');
    if (parts.length >= 2) {
      const codePart = parts.slice(1).join('-'); // CANGA- sonrasındaki her şey
      // Recursive çağrı ile kodu ara
      return findEmployeeByBarcode(codePart);
    }
  }
  
  // 2. TC formatı: TC123456 (TC + son 6 hane)
  if (cleanBarcode.startsWith('TC') && cleanBarcode.length >= 8) {
    const tcPart = cleanBarcode.slice(2); // TC'yi çıkar
    const employee = await Employee.findOne({
      tcNo: { $regex: tcPart + '$' },
      durum: 'AKTIF'
    });
    if (employee) return employee;
  }
  
  // 3. ID formatı: ID12345678 (MongoDB _id son 8 karakter)
  if (cleanBarcode.startsWith('ID') && cleanBarcode.length >= 10) {
    const idPart = cleanBarcode.slice(2).toLowerCase(); // ID'yi çıkar
    const employee = await Employee.findOne({
      _id: { $regex: idPart + '$', $options: 'i' },
      durum: 'AKTIF'
    });
    if (employee) return employee;
  }
  
  // 4. Sicil No ile ara (örn: MK0042, CW0001)
  // Önce direkt eşleşme dene
  let employee = await Employee.findOne({ 
    employeeId: cleanBarcode,
    durum: 'AKTIF'
  });
  if (employee) return employee;
  
  // 4b. Türkçe karakter dönüşümü ile ara (OA0111 -> ÖA0111)
  // Barkod kartlarında Türkçe karakterler ASCII'ye dönüştürülüyor
  const turkishPattern = createTurkishRegex(asciiBarcode);
  if (turkishPattern !== asciiBarcode) {
    employee = await Employee.findOne({
      employeeId: { $regex: `^${turkishPattern}$`, $options: 'i' },
      durum: 'AKTIF'
    });
    if (employee) return employee;
  }
  
  // 5. Tam TC No ile ara (11 haneli)
  if (cleanBarcode.length === 11 && /^\d+$/.test(cleanBarcode)) {
    employee = await Employee.findOne({ 
      tcNo: cleanBarcode,
      durum: 'AKTIF'
    });
    if (employee) return employee;
  }
  
  // 6. TC son 4-6 hanesi ile ara (sadece rakamlardan oluşuyorsa)
  if (cleanBarcode.length >= 4 && cleanBarcode.length <= 6 && /^\d+$/.test(cleanBarcode)) {
    employee = await Employee.findOne({
      tcNo: { $regex: cleanBarcode + '$' },
      durum: 'AKTIF'
    });
    if (employee) return employee;
  }
  
  // 7. Barkod ID alanı ile ara (varsa)
  employee = await Employee.findOne({
    barcodeId: cleanBarcode,
    durum: 'AKTIF'
  });
  if (employee) return employee;
  
  // 7b. Barkod ID'de Türkçe karakter dönüşümü ile ara
  if (turkishPattern !== asciiBarcode) {
    employee = await Employee.findOne({
      barcodeId: { $regex: `^${turkishPattern}$`, $options: 'i' },
      durum: 'AKTIF'
    });
    if (employee) return employee;
  }
  
  // 8. Son çare: Tüm aktif çalışanların employeeId'lerini ASCII'ye çevirip karşılaştır
  const allEmployees = await Employee.find({ durum: 'AKTIF' }).select('employeeId barcodeId');
  for (const emp of allEmployees) {
    const empIdAscii = turkishToAscii(emp.employeeId || '').toUpperCase();
    const barcodeIdAscii = turkishToAscii(emp.barcodeId || '').toUpperCase();
    
    if (empIdAscii === asciiBarcode || barcodeIdAscii === asciiBarcode) {
      // Tam çalışan bilgisini getir
      return await Employee.findById(emp._id);
    }
  }
  
  return null;
};

/**
 * Bugünkü durumu kontrol et
 */
const getTodayStatus = async (employeeId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const attendance = await Attendance.findOne({
    employeeId: employeeId,
    date: today
  });
  
  return {
    hasCheckedIn: !!(attendance && attendance.checkIn?.time),
    hasCheckedOut: !!(attendance && attendance.checkOut?.time),
    checkInTime: attendance?.checkIn?.time,
    checkOutTime: attendance?.checkOut?.time,
    attendance: attendance
  };
};

// ============================================
// 1. BARKOD TARAMA - ANA ENDPOINT
// ============================================

/**
 * POST /api/barcode/scan
 * Barkod okuyucudan gelen veriyi işler ve otomatik giriş/çıkış yapar
 */
router.post('/scan', async (req, res) => {
  try {
    const { 
      barcode, 
      branch = 'MERKEZ',
      deviceId,
      coordinates 
    } = req.body;
    
    // Validasyon
    if (!barcode) {
      return res.status(400).json({
        success: false,
        error: 'Barkod değeri gerekli',
        errorCode: 'BARCODE_REQUIRED'
      });
    }
    
    // Çalışanı bul
    const employee = await findEmployeeByBarcode(barcode);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Çalışan bulunamadı',
        errorCode: 'EMPLOYEE_NOT_FOUND',
        barcode: barcode,
        hint: 'Barkod formatını kontrol edin veya IT departmanına başvurun'
      });
    }
    
    // Bugünkü durumu kontrol et
    const status = await getTodayStatus(employee._id);
    
    // Aksiyon tipi belirle - Barkod sisteminde kısıtlama yok
    let actionType;
    if (!status.hasCheckedIn) {
      actionType = 'CHECK_IN';
    } else if (!status.hasCheckedOut) {
      actionType = 'CHECK_OUT';
    } else {
      // Zaten giriş-çıkış yapıldıysa yeni giriş başlat (mesai değişikliği, fazla mesai vb.)
      actionType = 'CHECK_IN';
    }
    
    // NOT: Barkod sisteminde fraud kontrolü devre dışı - fabrika ortamı için esnek
    
    // Bugünkü tarih
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // GİRİŞ KAYDI
    if (actionType === 'CHECK_IN') {
      let attendance = status.attendance;
      
      // Yeni kayıt veya mevcut kaydı sıfırla (döngüsel giriş-çıkış için)
      if (!attendance) {
        attendance = new Attendance({
          employeeId: employee._id,
          date: today
        });
      } else if (status.hasCheckedOut) {
        // Zaten çıkış yapılmışsa, çıkışı temizle ve yeni giriş yap
        attendance.checkOut = undefined;
        attendance.anomalies = []; // Eski uyarıları temizle
      }
      
      attendance.checkIn = {
        time: new Date(),
        method: 'CARD', // Barkod = Kart okuyucu
        location: employee.lokasyon || 'MERKEZ',
        branch: branch,
        deviceId: deviceId || 'BARCODE_TERMINAL',
        coordinates: coordinates,
        ipAddress: req.ip || req.connection?.remoteAddress
      };
      
      await attendance.save();
      
      // Geç kalma hesapla (08:00 mesai başlangıcına göre)
      const checkInTime = new Date(attendance.checkIn.time);
      const shiftStart = new Date(checkInTime);
      shiftStart.setHours(8, 0, 0, 0); // 08:00 mesai başlangıcı
      
      let lateInfo = null;
      if (checkInTime > shiftStart) {
        const lateMs = checkInTime - shiftStart;
        const lateMinutes = Math.floor(lateMs / (1000 * 60));
        const lateHours = Math.floor(lateMinutes / 60);
        const remainingMinutes = lateMinutes % 60;
        
        if (lateMinutes > 0) {
          lateInfo = {
            isLate: true,
            lateMinutes: lateMinutes,
            lateFormatted: lateHours > 0 
              ? `${lateHours} saat ${remainingMinutes} dakika geç` 
              : `${lateMinutes} dakika geç`
          };
        }
      }
      
      return res.json({
        success: true,
        actionType: 'CHECK_IN',
        message: `✅ Giriş Başarılı`,
        employee: {
          _id: employee._id,
          adSoyad: employee.adSoyad,
          lokasyon: employee.lokasyon,
          profilePhoto: employee.profilePhoto
        },
        time: attendance.checkIn.time,
        branch: branch,
        lateInfo: lateInfo,
        displayMessage: lateInfo 
          ? `Hoş geldiniz, ${employee.adSoyad}! (${lateInfo.lateFormatted})`
          : `Hoş geldiniz, ${employee.adSoyad}!`
      });
    }
    
    // ÇIKIŞ KAYDI
    if (actionType === 'CHECK_OUT') {
      const attendance = status.attendance;
      
      // Şube kontrolü kaldırıldı - esnek çalışma
      
      attendance.checkOut = {
        time: new Date(),
        method: 'CARD',
        location: employee.lokasyon || 'MERKEZ',
        branch: branch,
        deviceId: deviceId || 'BARCODE_TERMINAL',
        coordinates: coordinates,
        ipAddress: req.ip || req.connection?.remoteAddress
      };
      
      await attendance.save();
      
      // Çalışma süresi
      let workDuration = '-';
      try {
        workDuration = attendance.workDurationFormatted || '-';
      } catch (e) {}
      
      return res.json({
        success: true,
        actionType: 'CHECK_OUT',
        message: `👋 Çıkış Başarılı`,
        employee: {
          _id: employee._id,
          adSoyad: employee.adSoyad,
          lokasyon: employee.lokasyon,
          profilePhoto: employee.profilePhoto
        },
        time: attendance.checkOut.time,
        checkInTime: attendance.checkIn.time,
        workDuration: workDuration,
        branch: branch,
        displayMessage: `Güle güle, ${employee.adSoyad}! Çalışma: ${workDuration}`
      });
    }
    
  } catch (error) {
    console.error('Barcode scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Sistem hatası',
      errorCode: 'SYSTEM_ERROR',
      details: error.message
    });
  }
});

// ============================================
// 2. ÇALIŞAN DURUMU SORGULA
// ============================================

/**
 * GET /api/barcode/status/:barcode
 * Çalışanın bugünkü giriş-çıkış durumunu sorgula
 */
router.get('/status/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    const employee = await findEmployeeByBarcode(barcode);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Çalışan bulunamadı'
      });
    }
    
    const status = await getTodayStatus(employee._id);
    
    res.json({
      success: true,
      employee: {
        _id: employee._id,
        adSoyad: employee.adSoyad,
        pozisyon: employee.pozisyon,
        departman: employee.departman,
        lokasyon: employee.lokasyon,
        profilePhoto: employee.profilePhoto,
        employeeId: employee.employeeId
      },
      status: {
        hasCheckedIn: status.hasCheckedIn,
        hasCheckedOut: status.hasCheckedOut,
        checkInTime: status.checkInTime,
        checkOutTime: status.checkOutTime,
        nextAction: status.hasCheckedOut ? 'COMPLETED' : (status.hasCheckedIn ? 'CHECK_OUT' : 'CHECK_IN')
      },
      today: new Date()
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Durum sorgulanamadı'
    });
  }
});

// ============================================
// 3. BARKOD DOĞRULA (ÖN KONTROL)
// ============================================

/**
 * POST /api/barcode/validate
 * Barkodun geçerli bir çalışana ait olup olmadığını kontrol et
 */
router.post('/validate', async (req, res) => {
  try {
    const { barcode } = req.body;
    
    if (!barcode) {
      return res.status(400).json({
        valid: false,
        error: 'Barkod değeri gerekli'
      });
    }
    
    const employee = await findEmployeeByBarcode(barcode);
    
    if (!employee) {
      return res.json({
        valid: false,
        error: 'Tanınmayan barkod'
      });
    }
    
    res.json({
      valid: true,
      employee: {
        _id: employee._id,
        adSoyad: employee.adSoyad,
        employeeId: employee.employeeId
      }
    });
    
  } catch (error) {
    console.error('Validate error:', error);
    res.status(500).json({
      valid: false,
      error: 'Doğrulama hatası'
    });
  }
});

// ============================================
// 4. GÜNLÜK İSTATİSTİKLER
// ============================================

/**
 * GET /api/barcode/daily-stats
 * Bugünkü barkod giriş-çıkış istatistikleri
 */
router.get('/daily-stats', async (req, res) => {
  try {
    const { branch } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Sorgu
    const query = {
      date: { $gte: today, $lt: tomorrow },
      'checkIn.method': 'CARD'
    };
    
    if (branch) {
      query['checkIn.branch'] = branch;
    }
    
    const records = await Attendance.find(query)
      .populate('employeeId', 'adSoyad pozisyon departman')
      .sort({ 'checkIn.time': -1 })
      .limit(100);
    
    // İstatistikler
    const stats = {
      totalCheckIns: records.length,
      totalCheckOuts: records.filter(r => r.checkOut?.time).length,
      currentlyInside: records.filter(r => r.checkIn?.time && !r.checkOut?.time).length,
      lateArrivals: records.filter(r => r.isLate).length
    };
    
    // Son 10 işlem
    const recentActions = records.slice(0, 10).map(r => ({
      employee: r.employeeId?.adSoyad,
      pozisyon: r.employeeId?.pozisyon,
      checkIn: r.checkIn?.time,
      checkOut: r.checkOut?.time,
      status: r.status
    }));
    
    res.json({
      success: true,
      date: today,
      stats,
      recentActions
    });
    
  } catch (error) {
    console.error('Daily stats error:', error);
    res.status(500).json({
      success: false,
      error: 'İstatistikler alınamadı'
    });
  }
});

// ============================================
// 5. BARKOD KART BİLGİLERİ OLUŞTUR
// ============================================

/**
 * GET /api/barcode/card-info/:employeeId
 * Çalışan için barkod kart bilgilerini oluştur
 */
router.get('/card-info/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Çalışan bulunamadı'
      });
    }
    
    // Barkod değeri oluştur
    const tcLast6 = employee.tcNo ? employee.tcNo.slice(-6) : '000000';
    const sicilNo = employee.employeeId || 'XX0000';
    
    const barcodeValue = `CANGA-${tcLast6}-${sicilNo}`;
    const simpleBarcodeValue = sicilNo; // Alternatif basit format
    
    res.json({
      success: true,
      employee: {
        _id: employee._id,
        adSoyad: employee.adSoyad,
        pozisyon: employee.pozisyon,
        departman: employee.departman,
        lokasyon: employee.lokasyon,
        profilePhoto: employee.profilePhoto,
        employeeId: employee.employeeId,
        tcNo: employee.tcNo
      },
      barcode: {
        full: barcodeValue,
        simple: simpleBarcodeValue,
        format: 'CODE128'
      }
    });
    
  } catch (error) {
    console.error('Card info error:', error);
    res.status(500).json({
      success: false,
      error: 'Kart bilgileri alınamadı'
    });
  }
});

// ============================================
// 6. TOPLU KART BİLGİLERİ
// ============================================

/**
 * POST /api/barcode/bulk-card-info
 * Birden fazla çalışan için kart bilgileri
 */
router.post('/bulk-card-info', async (req, res) => {
  try {
    const { employeeIds, department, location, all } = req.body;
    
    let query = { durum: 'AKTIF' };
    
    if (employeeIds && employeeIds.length > 0) {
      query._id = { $in: employeeIds };
    } else if (department) {
      query.departman = department;
    } else if (location) {
      query.lokasyon = location;
    } else if (!all) {
      return res.status(400).json({
        success: false,
        error: 'employeeIds, department, location veya all parametrelerinden biri gerekli'
      });
    }
    
    const employees = await Employee.find(query)
      .sort({ adSoyad: 1 })
      .limit(500);
    
    const cards = employees.map(emp => {
      // Benzersiz barkod değeri oluştur
      let barcodeSimple;
      if (emp.employeeId && emp.employeeId !== 'XX0000') {
        barcodeSimple = emp.employeeId;
      } else if (emp.tcNo && emp.tcNo.length >= 6) {
        barcodeSimple = 'TC' + emp.tcNo.slice(-6);
      } else if (emp._id) {
        barcodeSimple = 'ID' + emp._id.toString().slice(-8).toUpperCase();
      } else {
        barcodeSimple = 'ERR' + Math.random().toString(36).slice(-5).toUpperCase();
      }
      
      return {
        _id: emp._id,
        adSoyad: emp.adSoyad,
        pozisyon: emp.pozisyon,
        departman: emp.departman,
        lokasyon: emp.lokasyon,
        profilePhoto: emp.profilePhoto,
        tcNo: emp.tcNo,
        employeeId: emp.employeeId,
        dogumTarihi: emp.dogumTarihi,
        iseGirisTarihi: emp.iseGirisTarihi,
        barcode: {
          full: `CANGA-${barcodeSimple}`,
          simple: barcodeSimple
        }
      };
    });
    
    res.json({
      success: true,
      count: cards.length,
      cards
    });
    
  } catch (error) {
    console.error('Bulk card info error:', error);
    res.status(500).json({
      success: false,
      error: 'Kart bilgileri alınamadı'
    });
  }
});

module.exports = router;


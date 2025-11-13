const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const AttendanceToken = require('../models/AttendanceToken');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

/**
 * 📱 ATTENDANCE QR CODE ROUTES
 * QR kod tabanlı giriş-çıkış sistemi
 */

// ============================================
// 1. QR KOD OLUŞTUR (Çalışan için)
// ============================================

/**
 * POST /api/attendance-qr/generate
 * Çalışan için giriş veya çıkış QR kodu oluştur
 */
router.post('/generate', async (req, res) => {
  try {
    const { employeeId, type, location } = req.body;
    
    // ✅ VALIDATION - employeeId
    if (!employeeId) {
      return res.status(400).json({ 
        error: 'employeeId gerekli',
        required: ['employeeId', 'type']
      });
    }
    
    // ✅ VALIDATION - type
    if (!type) {
      return res.status(400).json({ 
        error: 'type gerekli',
        validValues: ['CHECK_IN', 'CHECK_OUT']
      });
    }
    
    if (!['CHECK_IN', 'CHECK_OUT'].includes(type)) {
      return res.status(400).json({ 
        error: 'type CHECK_IN veya CHECK_OUT olmalı',
        received: type,
        validValues: ['CHECK_IN', 'CHECK_OUT']
      });
    }
    
    // ✅ VALIDATION - location (optional)
    const validLocations = ['MERKEZ', 'İŞL', 'OSB', 'İŞIL'];
    if (location && !validLocations.includes(location)) {
      return res.status(400).json({ 
        error: 'location geçersiz',
        received: location,
        validValues: validLocations
      });
    }
    
    // Çalışan kontrolü
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        error: 'Çalışan bulunamadı',
        employeeId: employeeId
      });
    }
    
    // Bugün zaten giriş/çıkış var mı kontrol et
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      employeeId: employeeId,
      date: today
    });
    
    // GİRİŞ kontrolü
    if (type === 'CHECK_IN') {
      if (existingAttendance && existingAttendance.checkIn?.time) {
        return res.status(400).json({
          error: 'Bu çalışan bugün zaten giriş yapmış',
          checkInTime: existingAttendance.checkIn.time
        });
      }
    }
    
    // ÇIKIŞ kontrolü
    if (type === 'CHECK_OUT') {
      if (!existingAttendance || !existingAttendance.checkIn?.time) {
        return res.status(400).json({
          error: 'Önce giriş yapmalısınız'
        });
      }
      
      if (existingAttendance.checkOut?.time) {
        return res.status(400).json({
          error: 'Bu çalışan bugün zaten çıkış yapmış',
          checkOutTime: existingAttendance.checkOut.time
        });
      }
    }
    
    // Token oluştur (2 dakika geçerli)
    const token = await AttendanceToken.generateToken(
      employeeId,
      type,
      location || employee.lokasyon,
      2 // 2 dakika
    );
    
    // URL oluştur
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const signatureUrl = `${baseUrl}/imza/${token.token}`;
    
    // QR kod oluştur
    const qrCodeDataUrl = await QRCode.toDataURL(signatureUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });
    
    res.json({
      success: true,
      employee: {
        _id: employee._id,
        adSoyad: employee.adSoyad,
        pozisyon: employee.pozisyon,
        lokasyon: employee.lokasyon
      },
      token: {
        id: token._id,
        type: token.type,
        expiresAt: token.expiresAt,
        expiresIn: Math.floor((token.expiresAt - new Date()) / 1000) // saniye
      },
      qrCode: qrCodeDataUrl,
      url: signatureUrl
    });
    
  } catch (error) {
    console.error('QR generate error:', error);
    res.status(500).json({
      error: 'QR kod oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 2. TOPLU QR KOD OLUŞTUR
// ============================================

/**
 * POST /api/attendance-qr/generate-bulk
 * Birden fazla çalışan için QR kod oluştur
 */
router.post('/generate-bulk', async (req, res) => {
  try {
    const { employeeIds, type, location } = req.body;
    
    // ✅ VALIDATION - employeeIds
    if (!employeeIds) {
      return res.status(400).json({ 
        error: 'employeeIds gerekli',
        required: ['employeeIds', 'type']
      });
    }
    
    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({ 
        error: 'employeeIds array tipinde olmalı',
        received: typeof employeeIds
      });
    }
    
    if (employeeIds.length === 0) {
      return res.status(400).json({ 
        error: 'employeeIds boş olmamalı, en az 1 çalışan ID gerekli'
      });
    }
    
    // ✅ VALIDATION - type
    if (!type) {
      return res.status(400).json({ 
        error: 'type gerekli',
        validValues: ['CHECK_IN', 'CHECK_OUT']
      });
    }
    
    if (!['CHECK_IN', 'CHECK_OUT'].includes(type)) {
      return res.status(400).json({ 
        error: 'type CHECK_IN veya CHECK_OUT olmalı',
        received: type,
        validValues: ['CHECK_IN', 'CHECK_OUT']
      });
    }
    
    // ✅ VALIDATION - location (optional but if provided, must be valid)
    const validLocations = ['MERKEZ', 'İŞL', 'OSB', 'İŞIL'];
    if (location && !validLocations.includes(location)) {
      return res.status(400).json({ 
        error: 'location geçersiz',
        received: location,
        validValues: validLocations
      });
    }
    
    // ✅ VALIDATION - employeeIds count limit
    if (employeeIds.length > 100) {
      return res.status(400).json({ 
        error: 'Tek seferde maksimum 100 çalışan için QR oluşturulabilir',
        received: employeeIds.length,
        maxAllowed: 100
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const employeeId of employeeIds) {
      try {
        const employee = await Employee.findById(employeeId);
        if (!employee) {
          errors.push({ employeeId, error: 'Çalışan bulunamadı' });
          continue;
        }
        
        const token = await AttendanceToken.generateToken(
          employeeId,
          type,
          location || employee.lokasyon,
          2
        );
        
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const signatureUrl = `${baseUrl}/imza/${token.token}`;
        const qrCodeDataUrl = await QRCode.toDataURL(signatureUrl, { width: 200 });
        
        results.push({
          employeeId: employee._id,
          adSoyad: employee.adSoyad,
          qrCode: qrCodeDataUrl,
          url: signatureUrl,
          expiresAt: token.expiresAt
        });
        
      } catch (err) {
        errors.push({ employeeId, error: err.message });
      }
    }
    
    res.json({
      success: true,
      total: employeeIds.length,
      generated: results.length,
      results,
      errors
    });
    
  } catch (error) {
    console.error('Bulk QR generate error:', error);
    res.status(500).json({ error: 'Toplu QR kod oluşturulurken hata oluştu' });
  }
});

// ============================================
// 3. İMZA SAYFASI BİLGİLERİ (Token ile)
// ============================================

/**
 * GET /api/attendance-qr/signature/:token
 * Token bilgilerini getir (imza sayfası için)
 */
router.get('/signature/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Token'ı bul
    const attendanceToken = await AttendanceToken.findOne({ token, status: 'ACTIVE' })
      .populate('employeeId', 'adSoyad tcNo pozisyon lokasyon profilePhoto');
    
    if (!attendanceToken) {
      return res.status(404).json({
        error: 'Token geçersiz veya kullanılmış',
        message: 'Bu QR kod artık geçerli değil. Lütfen yeni bir QR kod alın.'
      });
    }
    
    // Süre kontrolü
    if (new Date() > attendanceToken.expiresAt) {
      attendanceToken.status = 'EXPIRED';
      await attendanceToken.save();
      
      return res.status(410).json({
        error: 'Token süresi dolmuş',
        message: 'QR kodun süresi dolmuş. Lütfen yeni bir QR kod alın.'
      });
    }
    
    // Kalan süre
    const remainingSeconds = Math.floor((attendanceToken.expiresAt - new Date()) / 1000);
    
    res.json({
      success: true,
      token: {
        type: attendanceToken.type,
        location: attendanceToken.location,
        expiresAt: attendanceToken.expiresAt,
        remainingSeconds
      },
      employee: {
        _id: attendanceToken.employeeId._id,
        adSoyad: attendanceToken.employeeId.adSoyad,
        pozisyon: attendanceToken.employeeId.pozisyon,
        lokasyon: attendanceToken.employeeId.lokasyon,
        profilePhoto: attendanceToken.employeeId.profilePhoto
      },
      currentTime: new Date()
    });
    
  } catch (error) {
    console.error('Get signature info error:', error);
    res.status(500).json({ error: 'Token bilgileri alınırken hata oluştu' });
  }
});

// ============================================
// 4. İMZA İLE GİRİŞ/ÇIKIŞ KAYDET
// ============================================

/**
 * POST /api/attendance-qr/submit-signature
 * İmza ile giriş veya çıkış kaydı oluştur
 */
router.post('/submit-signature', async (req, res) => {
  try {
    const {
      token,
      signature,
      coordinates
    } = req.body;
    
    // ✅ VALIDATION
    if (!token) {
      return res.status(400).json({
        error: 'token gerekli',
        required: ['token', 'signature']
      });
    }
    
    if (!signature) {
      return res.status(400).json({
        error: 'signature (imza) gerekli',
        hint: 'Canvas.toDataURL() ile oluşturulan base64 image data'
      });
    }
    
    // Signature format validation
    if (typeof signature !== 'string' || !signature.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'signature geçersiz format',
        expected: 'data:image/png;base64,...',
        received: typeof signature
      });
    }
    
    // Token'ı doğrula ve kullan
    const validation = await AttendanceToken.validateAndUse(
      token,
      req.ip,
      req.get('user-agent'),
      coordinates
    );
    
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
    }
    
    const attendanceToken = validation.token;
    const employee = attendanceToken.employeeId;
    
    // Bugünkü tarih
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // GİRİŞ KAYDI
    if (attendanceToken.type === 'CHECK_IN') {
      // Mevcut kayıt var mı?
      let attendance = await Attendance.findOne({
        employeeId: employee._id,
        date: today
      });
      
      if (attendance && attendance.checkIn?.time) {
        return res.status(400).json({
          error: 'Bugün zaten giriş kaydınız var'
        });
      }
      
      if (!attendance) {
        attendance = new Attendance({
          employeeId: employee._id,
          date: today
        });
      }
      
      attendance.checkIn = {
        time: new Date(),
        method: 'MOBILE',
        location: attendanceToken.location,
        signature: signature,
        coordinates: coordinates,
        ipAddress: req.ip,
        deviceId: req.get('user-agent')
      };
      
      await attendance.save();
      
      return res.json({
        success: true,
        message: `${employee.adSoyad} - Giriş kaydedildi`,
        type: 'CHECK_IN',
        time: attendance.checkIn.time,
        employee: {
          adSoyad: employee.adSoyad,
          pozisyon: employee.pozisyon
        }
      });
    }
    
    // ÇIKIŞ KAYDI
    if (attendanceToken.type === 'CHECK_OUT') {
      const attendance = await Attendance.findOne({
        employeeId: employee._id,
        date: today
      });
      
      if (!attendance || !attendance.checkIn?.time) {
        return res.status(400).json({
          error: 'Önce giriş yapmalısınız'
        });
      }
      
      if (attendance.checkOut?.time) {
        return res.status(400).json({
          error: 'Bugün zaten çıkış kaydınız var'
        });
      }
      
      attendance.checkOut = {
        time: new Date(),
        method: 'MOBILE',
        location: attendanceToken.location,
        signature: signature,
        coordinates: coordinates,
        ipAddress: req.ip,
        deviceId: req.get('user-agent')
      };
      
      await attendance.save();
      
      return res.json({
        success: true,
        message: `${employee.adSoyad} - Çıkış kaydedildi`,
        type: 'CHECK_OUT',
        time: attendance.checkOut.time,
        workDuration: attendance.workDurationFormatted,
        employee: {
          adSoyad: employee.adSoyad,
          pozisyon: employee.pozisyon
        }
      });
    }
    
  } catch (error) {
    console.error('Submit signature error:', error);
    res.status(500).json({
      error: 'İmza kaydedilirken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 5. ÇALIŞAN İÇİN AKTİF TOKEN KONTROL
// ============================================

/**
 * GET /api/attendance-qr/active-token/:employeeId
 * Çalışanın aktif token'ı var mı?
 */
router.get('/active-token/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const activeToken = await AttendanceToken.findOne({
      employeeId: employeeId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() }
    });
    
    if (!activeToken) {
      return res.json({
        hasActiveToken: false
      });
    }
    
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const signatureUrl = `${baseUrl}/imza/${activeToken.token}`;
    
    res.json({
      hasActiveToken: true,
      token: {
        type: activeToken.type,
        expiresAt: activeToken.expiresAt,
        remainingSeconds: Math.floor((activeToken.expiresAt - new Date()) / 1000)
      },
      url: signatureUrl
    });
    
  } catch (error) {
    console.error('Active token check error:', error);
    res.status(500).json({ error: 'Token kontrolü yapılırken hata oluştu' });
  }
});

// ============================================
// 6. SÜRESİ DOLMUŞ TOKENLARI TEMİZLE
// ============================================

/**
 * POST /api/attendance-qr/cleanup
 * Süresi dolmuş tokenları temizle (cron job için)
 */
router.post('/cleanup', async (req, res) => {
  try {
    const count = await AttendanceToken.cleanupExpired();
    
    res.json({
      success: true,
      message: `${count} adet süresi dolmuş token temizlendi`
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Temizleme yapılırken hata oluştu' });
  }
});

// ============================================
// 7. BUGÜNKÜ GİRİŞ-ÇIKIŞ DURUMU
// ============================================

/**
 * GET /api/attendance-qr/today-status/:employeeId
 * Bugün giriş/çıkış yaptı mı?
 */
router.get('/today-status/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      employeeId: employeeId,
      date: today
    });
    
    const status = {
      hasCheckedIn: !!(attendance && attendance.checkIn?.time),
      hasCheckedOut: !!(attendance && attendance.checkOut?.time),
      checkInTime: attendance?.checkIn?.time,
      checkOutTime: attendance?.checkOut?.time,
      canCheckIn: true,
      canCheckOut: false
    };
    
    // Giriş yaptıysa, giriş yapamaz
    if (status.hasCheckedIn) {
      status.canCheckIn = false;
    }
    
    // Giriş yaptıysa ve çıkış yapmadıysa, çıkış yapabilir
    if (status.hasCheckedIn && !status.hasCheckedOut) {
      status.canCheckOut = true;
    }
    
    res.json({
      success: true,
      employeeId,
      today: today,
      status
    });
    
  } catch (error) {
    console.error('Today status error:', error);
    res.status(500).json({ error: 'Durum kontrolü yapılırken hata oluştu' });
  }
});

module.exports = router;



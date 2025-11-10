const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const SystemQRToken = require('../models/SystemQRToken');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

/**
 * 🏢 SYSTEM QR CODE ROUTES
 * Paylaşılan QR kod sistemi - Herkes kullanabilir
 */

// ============================================
// 1. SİSTEM QR KOD OLUŞTUR
// ============================================

router.post('/generate-system-qr', async (req, res) => {
  try {
    const { type = 'BOTH', location = 'ALL', description, expiryHours = 24 } = req.body;
    
    // Token oluştur (24 saat geçerli)
    const token = await SystemQRToken.generateSystemToken(
      type,
      location,
      description || 'Günlük Giriş-Çıkış Sistem QR',
      expiryHours
    );
    
    // URL oluştur
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const systemUrl = `${baseUrl}/sistem-imza/${token.token}`;
    
    // QR kod oluştur
    const qrCodeDataUrl = await QRCode.toDataURL(systemUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2
    });
    
    res.json({
      success: true,
      token: {
        id: token._id,
        type: token.type,
        location: token.location,
        expiresAt: token.expiresAt,
        expiresIn: Math.floor((token.expiresAt - new Date()) / 1000) // saniye
      },
      qrCode: qrCodeDataUrl,
      url: systemUrl,
      message: `Sistem QR kodu ${expiryHours} saat geçerli olacak şekilde oluşturuldu`
    });
    
  } catch (error) {
    console.error('System QR generate error:', error);
    res.status(500).json({
      error: 'Sistem QR kodu oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 2. SİSTEM QR BİLGİLERİ
// ============================================

router.get('/system-signature/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Token'ı doğrula
    const validation = await SystemQRToken.validateSystemToken(token);
    
    if (!validation.valid) {
      return res.status(404).json({
        error: validation.error
      });
    }
    
    const systemToken = validation.token;
    
    // Kalan süre
    const remainingSeconds = Math.floor((systemToken.expiresAt - new Date()) / 1000);
    
    res.json({
      success: true,
      token: {
        type: systemToken.type,
        location: systemToken.location,
        expiresAt: systemToken.expiresAt,
        remainingSeconds,
        description: systemToken.description
      },
      usage: {
        totalCheckIns: systemToken.usageStats.totalCheckIns,
        totalCheckOuts: systemToken.usageStats.totalCheckOuts,
        uniqueUsers: systemToken.usageStats.uniqueUsers.length
      },
      currentTime: new Date()
    });
    
  } catch (error) {
    console.error('Get system signature info error:', error);
    res.status(500).json({ error: 'Token bilgileri alınırken hata oluştu' });
  }
});

// ============================================
// 3. SİSTEM QR İLE İMZA
// ============================================

router.post('/submit-system-signature', async (req, res) => {
  try {
    const {
      token,
      employeeId,
      actionType, // 'CHECK_IN' veya 'CHECK_OUT'
      signature,
      coordinates
    } = req.body;
    
    if (!token || !employeeId || !actionType || !signature) {
      return res.status(400).json({
        error: 'Token, çalışan, işlem tipi ve imza gerekli'
      });
    }
    
    // Token'ı doğrula
    const validation = await SystemQRToken.validateSystemToken(token);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
    }
    
    // Çalışan kontrolü
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        error: 'Çalışan bulunamadı'
      });
    }
    
    // Bugünkü tarih
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // GİRİŞ KAYDI
    if (actionType === 'CHECK_IN') {
      // Bugün zaten giriş var mı?
      let attendance = await Attendance.findOne({
        employeeId: employeeId,
        date: today
      });
      
      if (attendance && attendance.checkIn?.time) {
        return res.status(400).json({
          error: 'Bugün zaten giriş yapmışsınız',
          checkInTime: attendance.checkIn.time
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
        location: validation.token.location !== 'ALL' ? validation.token.location : employee.lokasyon,
        signature: signature,
        coordinates: coordinates,
        ipAddress: req.ip,
        deviceId: req.get('user-agent')
      };
      
      await attendance.save();
      
      // Kullanım istatistiklerini güncelle
      await SystemQRToken.recordUsage(token, employeeId, 'CHECK_IN');
      
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
    if (actionType === 'CHECK_OUT') {
      const attendance = await Attendance.findOne({
        employeeId: employeeId,
        date: today
      });
      
      if (!attendance || !attendance.checkIn?.time) {
        return res.status(400).json({
          error: 'Önce giriş yapmalısınız'
        });
      }
      
      if (attendance.checkOut?.time) {
        return res.status(400).json({
          error: 'Bugün zaten çıkış yapmışsınız',
          checkOutTime: attendance.checkOut.time
        });
      }
      
      attendance.checkOut = {
        time: new Date(),
        method: 'MOBILE',
        location: validation.token.location !== 'ALL' ? validation.token.location : employee.lokasyon,
        signature: signature,
        coordinates: coordinates,
        ipAddress: req.ip,
        deviceId: req.get('user-agent')
      };
      
      await attendance.save();
      
      // Kullanım istatistiklerini güncelle
      await SystemQRToken.recordUsage(token, employeeId, 'CHECK_OUT');
      
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
    console.error('Submit system signature error:', error);
    res.status(500).json({
      error: 'İmza kaydedilirken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 4. AKTİF SİSTEM QR'LARI LİSTELE
// ============================================

router.get('/active-system-qrs', async (req, res) => {
  try {
    const activeQRs = await SystemQRToken.find({
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: activeQRs.length,
      qrs: activeQRs
    });
    
  } catch (error) {
    console.error('List system QRs error:', error);
    res.status(500).json({ error: 'Liste alınırken hata oluştu' });
  }
});

// ============================================
// 5. SİSTEM QR İPTAL ET
// ============================================

router.delete('/cancel-system-qr/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    const systemToken = await SystemQRToken.findById(tokenId);
    
    if (!systemToken) {
      return res.status(404).json({ error: 'Token bulunamadı' });
    }
    
    systemToken.status = 'CANCELLED';
    await systemToken.save();
    
    res.json({
      success: true,
      message: 'Sistem QR kodu iptal edildi'
    });
    
  } catch (error) {
    console.error('Cancel system QR error:', error);
    res.status(500).json({ error: 'Token iptal edilirken hata oluştu' });
  }
});

module.exports = router;


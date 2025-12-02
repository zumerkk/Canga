const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const SystemQRToken = require('../models/SystemQRToken');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const {
  checkLocationWithinFactory,
  createLocationAnomaly
} = require('../utils/locationHelper');
const { analyzeAnomaly, generateSummary } = require('../services/aiAnomalyAnalyzer');
const fraudService = require('../services/fraudDetectionService');

/**
 * 🏢 SYSTEM QR CODE ROUTES
 * Paylaşılan QR kod sistemi - Herkes kullanabilir
 * 
 * 🛡️ GÜVENLİK ÖZELLİKLERİ:
 * - Fraud Detection (Buddy Punching, Time Manipulation, Location Spoofing)
 * - Rate Limiting
 * - Real-time Anomaly Alerts
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
    
    // ✅ COMPREHENSIVE VALIDATION
    if (!token) {
      return res.status(400).json({
        error: 'token gerekli',
        required: ['token', 'employeeId', 'actionType', 'signature']
      });
    }
    
    if (!employeeId) {
      return res.status(400).json({
        error: 'employeeId gerekli',
        required: ['token', 'employeeId', 'actionType', 'signature']
      });
    }
    
    if (!actionType) {
      return res.status(400).json({
        error: 'actionType gerekli',
        validValues: ['CHECK_IN', 'CHECK_OUT']
      });
    }
    
    if (!['CHECK_IN', 'CHECK_OUT'].includes(actionType)) {
      return res.status(400).json({
        error: 'actionType CHECK_IN veya CHECK_OUT olmalı',
        received: actionType,
        validValues: ['CHECK_IN', 'CHECK_OUT']
      });
    }
    
    if (!signature) {
      return res.status(400).json({
        error: 'signature (imza) gerekli',
        hint: 'Base64 encoded image data bekleniyor'
      });
    }
    
    // Signature format validation
    if (!signature.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'signature geçersiz format',
        expected: 'data:image/png;base64,...',
        hint: 'Canvas.toDataURL() kullanın'
      });
    }
    
    // 📍 KONUM KONTROLÜ (Opsiyonel)
    // GPS koordinatları varsa validate et, yoksa devam et
    if (coordinates) {
      if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
        return res.status(400).json({
          error: 'coordinates geçersiz format',
          expected: '{ latitude: number, longitude: number }',
          hint: 'GPS koordinatları sayı tipinde olmalı'
        });
      }
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
    
    // 🛡️ FRAUD DETECTION - Sahtecilik Kontrolü
    const fraudCheck = await fraudService.runFraudChecks({
      employeeId: employeeId,
      actionType: actionType,
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
      deviceId: req.get('user-agent') || 'unknown',
      coordinates: coordinates,
      clientTimestamp: req.body.clientTimestamp, // Optional: client'dan gelen zaman
      shiftInfo: null // TODO: Vardiya bilgisi eklenebilir
    });
    
    // Fraud Alerts'i logla
    if (fraudCheck.alerts.length > 0) {
      console.warn('🚨 FRAUD ALERTS:', {
        employee: employee.adSoyad,
        actionType,
        alertCount: fraudCheck.alerts.length,
        riskScore: fraudCheck.riskScore,
        alerts: fraudCheck.alerts.map(a => ({
          type: a.type,
          level: a.level.level,
          message: a.message
        }))
      });
    }
    
    // CRITICAL veya HIGH seviyede fraud varsa işlemi durdur
    const criticalAlerts = fraudCheck.alerts.filter(a => a.level.priority <= 1);
    if (criticalAlerts.length > 0) {
      return res.status(403).json({
        error: 'Güvenlik kontrolünden geçemedi',
        reason: criticalAlerts[0].message,
        recommendation: criticalAlerts[0].recommendation,
        riskScore: fraudCheck.riskScore,
        alertId: criticalAlerts[0].id
      });
    }
    
    // Bugünkü tarih
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // GİRİŞ KAYDI
    if (actionType === 'CHECK_IN') {
      // 📍 Konum kontrolü yap
      const locationCheck = checkLocationWithinFactory(coordinates);
      
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
        ipAddress: req.ip || req.connection?.remoteAddress,
        deviceId: req.get('user-agent')
      };
      
      // 🛡️ Fraud uyarılarını kaydet (HIGH ve MEDIUM seviye)
      if (fraudCheck.alerts.length > 0) {
        const highMediumAlerts = fraudCheck.alerts.filter(a => a.level.priority <= 3);
        for (const alert of highMediumAlerts) {
          attendance.anomalies.push({
            type: alert.type,
            description: `${alert.message} - ${alert.recommendation}`,
            severity: alert.level.level === 'HIGH' ? 'ERROR' : 'WARNING',
            detectedAt: alert.createdAt
          });
        }
        
        // Risk skoru yüksekse düzeltme gerekli işaretle
        if (fraudCheck.riskScore >= 30) {
          attendance.needsCorrection = true;
          attendance.notes = (attendance.notes || '') + 
            ` [Otomatik: Risk skoru ${fraudCheck.riskScore} - Manuel doğrulama gerekli]`;
        }
      }
      
      // Konum anomalisi varsa kaydet
      if (!locationCheck.isWithinBounds) {
        const anomaly = createLocationAnomaly(locationCheck, employee);
        if (anomaly) {
          attendance.anomalies.push(anomaly);
          
          // Loglama
          console.warn('⚠️ KONUM ANOMALİSİ:', {
            employee: employee.adSoyad,
            distance: locationCheck.distanceText,
            severity: anomaly.severity,
            timestamp: new Date()
          });
          
          // 🤖 AI ANALİZİ BAŞLAT (5km+ için, async - background)
          if (anomaly.aiAnalysisRequired) {
            // Background'da çalıştır, response'u bekleme
            analyzeAnomaly({
              employee: {
                adSoyad: employee.adSoyad,
                employeeId: employee.employeeId,
                departman: employee.departman,
                pozisyon: employee.pozisyon,
                lokasyon: employee.lokasyon
              },
              distance: locationCheck.distance,
              distanceText: locationCheck.distanceText,
              timestamp: new Date(),
              userLocation: locationCheck.userLocation,
              factoryLocation: locationCheck.factory
            }).then(aiResults => {
              // AI sonuçlarını anomaliye ekle
              const anomalyIndex = attendance.anomalies.length - 1;
              attendance.anomalies[anomalyIndex].aiAnalysis = {
                groq: aiResults.groq,
                summary: generateSummary(aiResults),
                analyzedAt: aiResults.analyzedAt
              };
              return attendance.save();
            }).then(() => {
              console.log('✅ AI Analizi tamamlandı ve kaydedildi');
            }).catch(err => {
              console.error('❌ AI Analizi hatası:', err.message);
            });
          }
        }
      }
      
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
        },
        location: {
          isWithinFactory: locationCheck.isWithinBounds,
          distance: locationCheck.distanceText,
          message: locationCheck.message
        }
      });
    }
    
    // ÇIKIŞ KAYDI
    if (actionType === 'CHECK_OUT') {
      // 📍 Konum kontrolü yap
      const locationCheck = checkLocationWithinFactory(coordinates);
      
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
        ipAddress: req.ip || req.connection?.remoteAddress,
        deviceId: req.get('user-agent')
      };
      
      // 🛡️ Fraud uyarılarını kaydet (HIGH ve MEDIUM seviye)
      if (fraudCheck.alerts.length > 0) {
        const highMediumAlerts = fraudCheck.alerts.filter(a => a.level.priority <= 3);
        for (const alert of highMediumAlerts) {
          attendance.anomalies.push({
            type: alert.type,
            description: `${alert.message} - ${alert.recommendation}`,
            severity: alert.level.level === 'HIGH' ? 'ERROR' : 'WARNING',
            detectedAt: alert.createdAt
          });
        }
        
        if (fraudCheck.riskScore >= 30) {
          attendance.needsCorrection = true;
          attendance.notes = (attendance.notes || '') + 
            ` [Otomatik: Çıkış - Risk skoru ${fraudCheck.riskScore}]`;
        }
      }
      
      // Konum anomalisi varsa kaydet
      if (!locationCheck.isWithinBounds) {
        const anomaly = createLocationAnomaly(locationCheck, employee);
        if (anomaly) {
          attendance.anomalies.push(anomaly);
          
          // Loglama
          console.warn('⚠️ KONUM ANOMALİSİ (ÇIKIŞ):', {
            employee: employee.adSoyad,
            distance: locationCheck.distanceText,
            severity: anomaly.severity,
            timestamp: new Date()
          });
          
          // 🤖 AI ANALİZİ BAŞLAT (5km+ için, async - background)
          if (anomaly.aiAnalysisRequired) {
            analyzeAnomaly({
              employee: {
                adSoyad: employee.adSoyad,
                employeeId: employee.employeeId,
                departman: employee.departman,
                pozisyon: employee.pozisyon,
                lokasyon: employee.lokasyon
              },
              distance: locationCheck.distance,
              distanceText: locationCheck.distanceText,
              timestamp: new Date(),
              userLocation: locationCheck.userLocation,
              factoryLocation: locationCheck.factory
            }).then(aiResults => {
              const anomalyIndex = attendance.anomalies.length - 1;
              attendance.anomalies[anomalyIndex].aiAnalysis = {
                groq: aiResults.groq,
                summary: generateSummary(aiResults),
                analyzedAt: aiResults.analyzedAt
              };
              return attendance.save();
            }).then(() => {
              console.log('✅ AI Analizi (ÇIKIŞ) tamamlandı ve kaydedildi');
            }).catch(err => {
              console.error('❌ AI Analizi (ÇIKIŞ) hatası:', err.message);
            });
          }
        }
      }
      
      await attendance.save();
      
      // Kullanım istatistiklerini güncelle
      await SystemQRToken.recordUsage(token, employeeId, 'CHECK_OUT');
      
      // workDurationFormatted için güvenli kontrol
      let workDurationText = '-';
      try {
        workDurationText = attendance.workDurationFormatted || '-';
      } catch (err) {
        console.error('WorkDuration format error:', err);
      }
      
      return res.json({
        success: true,
        message: `${employee.adSoyad} - Çıkış kaydedildi`,
        type: 'CHECK_OUT',
        time: attendance.checkOut.time,
        workDuration: workDurationText,
        employee: {
          adSoyad: employee.adSoyad,
          pozisyon: employee.pozisyon
        },
        location: {
          isWithinFactory: locationCheck.isWithinBounds,
          distance: locationCheck.distanceText,
          message: locationCheck.message
        }
      });
    }
    
  } catch (error) {
    console.error('Submit system signature error:', error);
    console.error('Error Stack:', error.stack);
    console.error('Request Body:', {
      token: req.body.token ? 'TOKEN_EXISTS' : 'NO_TOKEN',
      employeeId: req.body.employeeId,
      actionType: req.body.actionType,
      hasSignature: !!req.body.signature,
      hasCoordinates: !!req.body.coordinates
    });
    
    res.status(500).json({
      error: 'İmza kaydedilirken hata oluştu',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// ============================================
// 6. 🛡️ FRAUD ALERTS - GÜVENLİK UYARILARI
// ============================================

/**
 * Aktif fraud uyarılarını listele
 */
router.get('/fraud-alerts', async (req, res) => {
  try {
    const { level, type, limit = 50 } = req.query;
    
    const alerts = fraudService.getActiveAlerts({
      minLevel: level,
      type: type,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
    
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({ error: 'Uyarılar alınırken hata oluştu' });
  }
});

/**
 * Fraud uyarısını onayla (acknowledge)
 */
router.post('/fraud-alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const success = fraudService.acknowledgeAlert(alertId);
    
    if (!success) {
      return res.status(404).json({ error: 'Uyarı bulunamadı' });
    }
    
    res.json({
      success: true,
      message: 'Uyarı onaylandı'
    });
    
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Uyarı onaylanırken hata oluştu' });
  }
});

/**
 * Günlük fraud özeti
 */
router.get('/fraud-summary', async (req, res) => {
  try {
    const summary = fraudService.getDailySummary();
    
    res.json({
      success: true,
      summary
    });
    
  } catch (error) {
    console.error('Get fraud summary error:', error);
    res.status(500).json({ error: 'Özet alınırken hata oluştu' });
  }
});

/**
 * Eksik çıkış kontrolü (Manuel tetikleme)
 */
router.get('/check-missing-checkouts', async (req, res) => {
  try {
    const alerts = await fraudService.checkMissingCheckouts();
    
    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
    
  } catch (error) {
    console.error('Check missing checkouts error:', error);
    res.status(500).json({ error: 'Kontrol yapılırken hata oluştu' });
  }
});

// ============================================
// 7. 📊 DETAYLI GÜVENLİK İSTATİSTİKLERİ
// ============================================

/**
 * Güvenlik dashboard istatistikleri
 */
router.get('/security-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Bugünkü anomalili kayıtlar
    const anomalyRecords = await Attendance.find({
      date: today,
      'anomalies.0': { $exists: true }
    }).populate('employeeId', 'adSoyad pozisyon lokasyon');
    
    // Konum eksik kayıtlar
    const noLocationRecords = await Attendance.find({
      date: today,
      'checkIn.time': { $exists: true },
      'checkIn.coordinates': { $exists: false }
    }).populate('employeeId', 'adSoyad pozisyon');
    
    // Düzeltme gereken kayıtlar
    const needsCorrectionRecords = await Attendance.find({
      date: today,
      needsCorrection: true
    }).populate('employeeId', 'adSoyad pozisyon');
    
    // Fraud özeti
    const fraudSummary = fraudService.getDailySummary();
    
    res.json({
      success: true,
      stats: {
        anomalyCount: anomalyRecords.length,
        noLocationCount: noLocationRecords.length,
        needsCorrectionCount: needsCorrectionRecords.length,
        fraudSummary
      },
      details: {
        anomalyRecords: anomalyRecords.map(r => ({
          _id: r._id,
          employee: r.employeeId?.adSoyad,
          anomalyCount: r.anomalies.length,
          anomalies: r.anomalies.map(a => ({
            type: a.type,
            severity: a.severity,
            description: a.description
          }))
        })),
        noLocationRecords: noLocationRecords.map(r => ({
          _id: r._id,
          employee: r.employeeId?.adSoyad,
          checkInTime: r.checkIn?.time
        })),
        needsCorrectionRecords: needsCorrectionRecords.map(r => ({
          _id: r._id,
          employee: r.employeeId?.adSoyad,
          notes: r.notes
        }))
      },
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Security stats error:', error);
    res.status(500).json({ error: 'İstatistikler alınırken hata oluştu' });
  }
});

module.exports = router;


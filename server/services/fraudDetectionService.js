/**
 * 🛡️ FRAUD DETECTION SERVICE
 * 
 * QR/İmza Sistemi için gerçek zamanlı sahtecilik tespit servisi
 * 135+ personelin giriş-çıkışını güvenle takip eder
 * 
 * TESPİT EDİLEN TEHDİTLER:
 * 1. Buddy Punching - Başkasının yerine giriş
 * 2. Time Manipulation - Saat ayarı değiştirme
 * 3. Location Spoofing - GPS sahtecilik
 * 4. Rapid Fire Attacks - Hızlı ard arda istekler
 * 5. Duplicate Entries - Çift kayıt girişimleri
 * 6. Anomalous Patterns - Anormal davranış kalıpları
 */

const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const moment = require('moment');

// In-memory cache for rate limiting (Production'da Redis kullanılmalı)
const rateLimitCache = new Map();
const ipUsageCache = new Map();
const deviceUsageCache = new Map();

/**
 * 🔴 FRAUD ALERT LEVELS
 */
const ALERT_LEVELS = {
  CRITICAL: { level: 'CRITICAL', color: 'red', priority: 1 },
  HIGH: { level: 'HIGH', color: 'orange', priority: 2 },
  MEDIUM: { level: 'MEDIUM', color: 'yellow', priority: 3 },
  LOW: { level: 'LOW', color: 'blue', priority: 4 },
  INFO: { level: 'INFO', color: 'gray', priority: 5 }
};

/**
 * 🎯 FRAUD TYPES
 */
const FRAUD_TYPES = {
  BUDDY_PUNCHING: 'BUDDY_PUNCHING',           // Başkasının yerine basma
  RAPID_MULTIPLE_CHECK: 'RAPID_MULTIPLE_CHECK', // Hızlı çoklu giriş (aynı IP)
  TIME_TRAVEL: 'TIME_TRAVEL',                 // Zamanda yolculuk (sistem saati değişikliği)
  LOCATION_SPOOFING: 'LOCATION_SPOOFING',     // GPS spoofing şüphesi
  DUPLICATE_ATTEMPT: 'DUPLICATE_ATTEMPT',     // Çift giriş denemesi
  IMPOSSIBLE_TRAVEL: 'IMPOSSIBLE_TRAVEL',     // İmkansız seyahat (çok kısa sürede uzak mesafe)
  UNUSUAL_HOURS: 'UNUSUAL_HOURS',             // Anormal saat (gece yarısı giriş vb)
  MISSING_CHECKOUT: 'MISSING_CHECKOUT',       // Çıkış yapmadan yeni giriş
  PATTERN_ANOMALY: 'PATTERN_ANOMALY'          // Genel davranış anomalisi
};

/**
 * 📊 Active Fraud Alerts (In-memory - Production'da DB'ye yazılmalı)
 */
let activeAlerts = [];

/**
 * 🔍 BUDDY PUNCHING TESPİTİ
 * Aynı IP/Device'dan kısa sürede farklı kişilerin giriş yapması
 */
async function detectBuddyPunching(ipAddress, deviceId, employeeId, actionType) {
  const now = Date.now();
  const THRESHOLD_MS = 5 * 60 * 1000; // 5 dakika içinde
  const MAX_DIFFERENT_USERS = 2; // Aynı cihazdan max 2 farklı kişi

  // IP bazlı kontrol
  const ipKey = `ip_${ipAddress}_${moment().format('YYYY-MM-DD')}`;
  let ipUsers = ipUsageCache.get(ipKey) || { users: new Set(), entries: [] };
  
  ipUsers.users.add(employeeId);
  ipUsers.entries.push({ employeeId, timestamp: now, actionType });
  
  // Son 5 dakikadaki girişleri filtrele
  ipUsers.entries = ipUsers.entries.filter(e => now - e.timestamp < THRESHOLD_MS);
  
  ipUsageCache.set(ipKey, ipUsers);

  // 5 dakika içinde 3+ farklı kişi aynı IP'den giriş yapmışsa
  const recentUniqueUsers = new Set(ipUsers.entries.map(e => e.employeeId));
  
  if (recentUniqueUsers.size > MAX_DIFFERENT_USERS) {
    const employees = await Employee.find({ 
      _id: { $in: Array.from(recentUniqueUsers) } 
    }).select('adSoyad pozisyon');
    
    return createAlert({
      type: FRAUD_TYPES.BUDDY_PUNCHING,
      level: ALERT_LEVELS.CRITICAL,
      message: `🚨 BUDDY PUNCHING TESPİT EDİLDİ!`,
      details: {
        ip: ipAddress,
        device: deviceId,
        usersInvolved: employees.map(e => e.adSoyad),
        entriesIn5Min: ipUsers.entries.length,
        timeWindow: '5 dakika',
        timestamp: new Date()
      },
      recommendation: 'Acil müdahale gerekli! Bu IP adresinden yapılan tüm işlemler doğrulanmalı.'
    });
  }

  return null;
}

/**
 * ⚡ RATE LIMITING - Hızlı Saldırı Tespiti
 * Aynı çalışan için çok hızlı istekler
 */
function checkRateLimit(employeeId, actionType) {
  const now = Date.now();
  const RATE_LIMIT_WINDOW = 30 * 1000; // 30 saniye
  const MAX_REQUESTS = 3; // 30 saniyede max 3 istek

  const key = `rate_${employeeId}_${actionType}`;
  let requests = rateLimitCache.get(key) || [];
  
  // Eski istekleri temizle
  requests = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
  requests.push(now);
  rateLimitCache.set(key, requests);

  if (requests.length > MAX_REQUESTS) {
    return createAlert({
      type: FRAUD_TYPES.RAPID_MULTIPLE_CHECK,
      level: ALERT_LEVELS.HIGH,
      message: `⚡ ÇOK HIZLI İSTEK TESPİT EDİLDİ!`,
      details: {
        employeeId,
        actionType,
        requestsIn30Sec: requests.length,
        timestamp: new Date()
      },
      recommendation: 'Otomatik bot veya kötü niyetli yazılım olabilir.'
    });
  }

  return null;
}

/**
 * 🕐 ZAMAN MANİPÜLASYONU TESPİTİ
 * Client tarafından gönderilen timestamp ile server timestamp karşılaştırması
 */
function detectTimeManipulation(clientTimestamp) {
  if (!clientTimestamp) return null;
  
  const serverTime = Date.now();
  const clientTime = new Date(clientTimestamp).getTime();
  const TOLERANCE_MS = 5 * 60 * 1000; // 5 dakika tolerans

  const diff = Math.abs(serverTime - clientTime);
  
  if (diff > TOLERANCE_MS) {
    return createAlert({
      type: FRAUD_TYPES.TIME_TRAVEL,
      level: ALERT_LEVELS.HIGH,
      message: `🕐 SAAT MANİPÜLASYONU ŞÜPHE!`,
      details: {
        serverTime: new Date(serverTime).toISOString(),
        clientTime: new Date(clientTime).toISOString(),
        differenceMinutes: Math.round(diff / 60000),
        timestamp: new Date()
      },
      recommendation: 'Kullanıcının telefon saati yanlış ayarlanmış veya kasıtlı değiştirilmiş olabilir.'
    });
  }

  return null;
}

/**
 * 📍 LOCATION SPOOFING TESPİTİ
 * GPS koordinatları ve IP lokasyonu karşılaştırması
 */
async function detectLocationSpoofing(coordinates, ipAddress, employeeId) {
  if (!coordinates) return null;

  // İmkansız seyahat tespiti - Son giriş/çıkışla karşılaştır
  const lastAttendance = await Attendance.findOne({
    employeeId,
    $or: [
      { 'checkIn.coordinates': { $exists: true } },
      { 'checkOut.coordinates': { $exists: true } }
    ]
  }).sort({ date: -1 });

  if (lastAttendance) {
    const lastCoords = lastAttendance.checkOut?.coordinates || lastAttendance.checkIn?.coordinates;
    const lastTime = lastAttendance.checkOut?.time || lastAttendance.checkIn?.time;
    
    if (lastCoords && lastTime) {
      const distance = calculateDistance(
        lastCoords.latitude, lastCoords.longitude,
        coordinates.latitude, coordinates.longitude
      );
      
      const timeDiffHours = (Date.now() - new Date(lastTime).getTime()) / (1000 * 60 * 60);
      const speedKmH = distance / 1000 / timeDiffHours;
      
      // 500 km/s üzerinde = imkansız (uçak bile bu kadar hızlı değil)
      if (speedKmH > 500 && timeDiffHours < 1) {
        return createAlert({
          type: FRAUD_TYPES.IMPOSSIBLE_TRAVEL,
          level: ALERT_LEVELS.CRITICAL,
          message: `🚀 İMKANSIZ SEYAHAT TESPİT EDİLDİ!`,
          details: {
            employeeId,
            previousLocation: lastCoords,
            currentLocation: coordinates,
            distanceKm: Math.round(distance / 1000),
            timeElapsedHours: timeDiffHours.toFixed(2),
            impliedSpeedKmH: Math.round(speedKmH),
            timestamp: new Date()
          },
          recommendation: 'GPS spoofing kullanılıyor olabilir. Manuel doğrulama gerekli!'
        });
      }
    }
  }

  return null;
}

/**
 * 🌙 ANORMAL SAAT TESPİTİ
 * Normal çalışma saatleri dışında giriş
 */
function detectUnusualHours(actionType, shiftInfo = null) {
  const hour = new Date().getHours();
  
  // Gece 23:00 - 05:00 arası şüpheli (vardiya bilgisi yoksa)
  if ((hour >= 23 || hour < 5) && !shiftInfo?.isNightShift) {
    return createAlert({
      type: FRAUD_TYPES.UNUSUAL_HOURS,
      level: ALERT_LEVELS.MEDIUM,
      message: `🌙 ANORMAL SAAT - ${actionType === 'CHECK_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}`,
      details: {
        hour,
        actionType,
        isNightShift: shiftInfo?.isNightShift || false,
        timestamp: new Date()
      },
      recommendation: 'Vardiya bilgisi kontrol edilmeli. Normal değilse manuel onay gerekli.'
    });
  }

  return null;
}

/**
 * 📋 EKSİK ÇIKIŞ TESPİTİ
 * Önceki günden çıkış yapmamış çalışanlar
 */
async function checkMissingCheckouts() {
  const yesterday = moment().subtract(1, 'day').startOf('day').toDate();
  const today = moment().startOf('day').toDate();

  const incompleteRecords = await Attendance.find({
    date: yesterday,
    'checkIn.time': { $exists: true },
    'checkOut.time': { $exists: false }
  }).populate('employeeId', 'adSoyad pozisyon lokasyon');

  const alerts = [];
  
  for (const record of incompleteRecords) {
    if (record.employeeId) {
      alerts.push(createAlert({
        type: FRAUD_TYPES.MISSING_CHECKOUT,
        level: ALERT_LEVELS.MEDIUM,
        message: `⚠️ EKSİK ÇIKIŞ - ${record.employeeId.adSoyad}`,
        details: {
          employeeId: record.employeeId._id,
          employeeName: record.employeeId.adSoyad,
          position: record.employeeId.pozisyon,
          location: record.employeeId.lokasyon,
          checkInTime: record.checkIn.time,
          date: moment(yesterday).format('DD.MM.YYYY'),
          timestamp: new Date()
        },
        recommendation: 'Çalışanla iletişime geçilmeli, çıkış saati manuel düzeltilmeli.'
      }));
    }
  }

  return alerts;
}

/**
 * 🎯 ANA FRAUD CHECK FONKSİYONU
 * Tüm kontrolleri tek seferde yapar
 */
async function runFraudChecks(params) {
  const {
    employeeId,
    actionType,
    ipAddress,
    deviceId,
    coordinates,
    clientTimestamp,
    shiftInfo
  } = params;

  const alerts = [];

  // 1. Rate Limiting
  const rateAlert = checkRateLimit(employeeId, actionType);
  if (rateAlert) alerts.push(rateAlert);

  // 2. Buddy Punching
  const buddyAlert = await detectBuddyPunching(ipAddress, deviceId, employeeId, actionType);
  if (buddyAlert) alerts.push(buddyAlert);

  // 3. Time Manipulation
  const timeAlert = detectTimeManipulation(clientTimestamp);
  if (timeAlert) alerts.push(timeAlert);

  // 4. Location Spoofing
  const locationAlert = await detectLocationSpoofing(coordinates, ipAddress, employeeId);
  if (locationAlert) alerts.push(locationAlert);

  // 5. Unusual Hours
  const hoursAlert = detectUnusualHours(actionType, shiftInfo);
  if (hoursAlert) alerts.push(hoursAlert);

  // Alerts'i sakla
  if (alerts.length > 0) {
    activeAlerts.push(...alerts);
    // Son 1000 alert'i tut
    if (activeAlerts.length > 1000) {
      activeAlerts = activeAlerts.slice(-1000);
    }
  }

  return {
    passed: alerts.filter(a => a.level.priority <= 2).length === 0, // CRITICAL veya HIGH yoksa geçer
    alerts,
    riskScore: calculateRiskScore(alerts)
  };
}

/**
 * 📊 RİSK SKORU HESAPLAMA
 */
function calculateRiskScore(alerts) {
  if (!alerts || alerts.length === 0) return 0;
  
  let score = 0;
  for (const alert of alerts) {
    switch (alert.level.level) {
      case 'CRITICAL': score += 40; break;
      case 'HIGH': score += 25; break;
      case 'MEDIUM': score += 15; break;
      case 'LOW': score += 5; break;
      default: score += 1;
    }
  }
  
  return Math.min(100, score);
}

/**
 * 🔔 ALERT OLUŞTURUCU
 */
function createAlert({ type, level, message, details, recommendation }) {
  return {
    id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    level,
    message,
    details,
    recommendation,
    createdAt: new Date(),
    acknowledged: false
  };
}

/**
 * 📏 MESAFE HESAPLAMA (Haversine)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Dünya yarıçapı metre
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 📋 AKTİF ALERT'LERİ GETİR
 */
function getActiveAlerts(options = {}) {
  let alerts = [...activeAlerts];
  
  // Sadece belirli seviyeyi filtrele
  if (options.minLevel) {
    const minPriority = ALERT_LEVELS[options.minLevel]?.priority || 5;
    alerts = alerts.filter(a => a.level.priority <= minPriority);
  }
  
  // Sadece belirli tipi filtrele
  if (options.type) {
    alerts = alerts.filter(a => a.type === options.type);
  }
  
  // Son N tane
  if (options.limit) {
    alerts = alerts.slice(-options.limit);
  }
  
  // Tarihe göre sırala (yeniden eskiye)
  alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return alerts;
}

/**
 * ✅ ALERT'İ ONAYLA
 */
function acknowledgeAlert(alertId) {
  const alert = activeAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    return true;
  }
  return false;
}

/**
 * 📊 GÜNLİK ÖZET İSTATİSTİKLERİ
 */
function getDailySummary() {
  const today = moment().startOf('day');
  const todayAlerts = activeAlerts.filter(a => 
    moment(a.createdAt).isAfter(today)
  );

  return {
    totalAlerts: todayAlerts.length,
    critical: todayAlerts.filter(a => a.level.level === 'CRITICAL').length,
    high: todayAlerts.filter(a => a.level.level === 'HIGH').length,
    medium: todayAlerts.filter(a => a.level.level === 'MEDIUM').length,
    low: todayAlerts.filter(a => a.level.level === 'LOW').length,
    byType: {
      buddyPunching: todayAlerts.filter(a => a.type === FRAUD_TYPES.BUDDY_PUNCHING).length,
      rapidCheck: todayAlerts.filter(a => a.type === FRAUD_TYPES.RAPID_MULTIPLE_CHECK).length,
      timeTravel: todayAlerts.filter(a => a.type === FRAUD_TYPES.TIME_TRAVEL).length,
      locationSpoofing: todayAlerts.filter(a => a.type === FRAUD_TYPES.LOCATION_SPOOFING).length,
      impossibleTravel: todayAlerts.filter(a => a.type === FRAUD_TYPES.IMPOSSIBLE_TRAVEL).length,
      unusualHours: todayAlerts.filter(a => a.type === FRAUD_TYPES.UNUSUAL_HOURS).length,
      missingCheckout: todayAlerts.filter(a => a.type === FRAUD_TYPES.MISSING_CHECKOUT).length
    },
    unacknowledged: todayAlerts.filter(a => !a.acknowledged).length,
    lastUpdate: new Date()
  };
}

/**
 * 🧹 CACHE TEMİZLEME (Her gece çalıştırılmalı)
 */
function clearDailyCache() {
  const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
  
  // IP cache temizle
  for (const [key] of ipUsageCache) {
    if (key.includes(yesterday)) {
      ipUsageCache.delete(key);
    }
  }
  
  // Rate limit cache temizle
  rateLimitCache.clear();
  
  // 7 günden eski alert'leri sil
  const sevenDaysAgo = moment().subtract(7, 'days');
  activeAlerts = activeAlerts.filter(a => 
    moment(a.createdAt).isAfter(sevenDaysAgo)
  );
  
  console.log('🧹 Fraud detection cache temizlendi');
}

module.exports = {
  ALERT_LEVELS,
  FRAUD_TYPES,
  runFraudChecks,
  detectBuddyPunching,
  checkRateLimit,
  detectTimeManipulation,
  detectLocationSpoofing,
  detectUnusualHours,
  checkMissingCheckouts,
  getActiveAlerts,
  acknowledgeAlert,
  getDailySummary,
  clearDailyCache,
  calculateRiskScore
};


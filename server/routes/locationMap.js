const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { FACTORY_LOCATION } = require('../utils/locationHelper');

/**
 * 🗺️ KONUM HARİTASI API
 * Giriş-çıkış konumlarını haritada göstermek için
 */

// ============================================
// 1. TÜM KONUM VERİLERİNİ GETİR
// ============================================

router.get('/all-locations', async (req, res) => {
  try {
    const { startDate, endDate, employeeId, limit = 1000 } = req.query;
    
    // Filtre oluştur
    const filter = {
      $or: [
        { 'checkIn.coordinates': { $exists: true } },
        { 'checkOut.coordinates': { $exists: true } }
      ]
    };
    
    // Tarih filtresi
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Çalışan filtresi
    if (employeeId) {
      filter.employeeId = employeeId;
    }
    
    // Verileri çek
    const attendances = await Attendance.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('employeeId', 'adSoyad employeeId departman pozisyon lokasyon profilePhoto');
    
    // Harita için format düzenle
    const locations = [];
    
    for (const att of attendances) {
      const employee = att.employeeId;
      
      // Giriş konumu
      if (att.checkIn?.coordinates) {
        locations.push({
          type: 'CHECK_IN',
          employee: {
            id: employee._id,
            name: employee.adSoyad,
            employeeId: employee.employeeId,
            departman: employee.departman,
            pozisyon: employee.pozisyon,
            profilePhoto: employee.profilePhoto
          },
          coordinates: att.checkIn.coordinates,
          timestamp: att.checkIn.time,
          date: att.date,
          method: att.checkIn.method,
          hasAnomaly: att.anomalies && att.anomalies.length > 0
        });
      }
      
      // Çıkış konumu
      if (att.checkOut?.coordinates) {
        locations.push({
          type: 'CHECK_OUT',
          employee: {
            id: employee._id,
            name: employee.adSoyad,
            employeeId: employee.employeeId,
            departman: employee.departman,
            pozisyon: employee.pozisyon,
            profilePhoto: employee.profilePhoto
          },
          coordinates: att.checkOut.coordinates,
          timestamp: att.checkOut.time,
          date: att.date,
          method: att.checkOut.method,
          hasAnomaly: att.anomalies && att.anomalies.length > 0
        });
      }
    }
    
    res.json({
      success: true,
      count: locations.length,
      factory: FACTORY_LOCATION,
      locations
    });
    
  } catch (error) {
    console.error('Location map error:', error);
    res.status(500).json({
      error: 'Konum verileri alınırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 2. HEAT MAP VERİLERİ (YOĞUNLUK ANALİZİ)
// ============================================

router.get('/heatmap-data', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {
      $or: [
        { 'checkIn.coordinates': { $exists: true } },
        { 'checkOut.coordinates': { $exists: true } }
      ]
    };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    const attendances = await Attendance.find(filter);
    
    // Koordinatları topla (yoğunluk için)
    const heatmapPoints = [];
    
    for (const att of attendances) {
      if (att.checkIn?.coordinates) {
        heatmapPoints.push({
          lat: att.checkIn.coordinates.latitude,
          lng: att.checkIn.coordinates.longitude,
          intensity: 1
        });
      }
      
      if (att.checkOut?.coordinates) {
        heatmapPoints.push({
          lat: att.checkOut.coordinates.latitude,
          lng: att.checkOut.coordinates.longitude,
          intensity: 1
        });
      }
    }
    
    res.json({
      success: true,
      count: heatmapPoints.length,
      factory: FACTORY_LOCATION,
      heatmapPoints
    });
    
  } catch (error) {
    console.error('Heatmap data error:', error);
    res.status(500).json({
      error: 'Heat map verileri alınırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 3. ANOMALİ KONUMLARI
// ============================================

router.get('/anomaly-locations', async (req, res) => {
  try {
    const { startDate, endDate, severityLevel } = req.query;
    
    const filter = {
      'anomalies.0': { $exists: true } // En az 1 anomali var
    };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    const attendances = await Attendance.find(filter)
      .populate('employeeId', 'adSoyad employeeId departman pozisyon')
      .sort({ date: -1 })
      .limit(500);
    
    const anomalies = [];
    
    for (const att of attendances) {
      for (const anomaly of att.anomalies) {
        if (anomaly.type === 'LOCATION_OUT_OF_BOUNDS') {
          // Severity filtresi
          if (severityLevel && anomaly.severity !== severityLevel) {
            continue;
          }
          
          anomalies.push({
            employee: {
              name: att.employeeId.adSoyad,
              employeeId: att.employeeId.employeeId,
              departman: att.employeeId.departman
            },
            anomaly: {
              type: anomaly.type,
              severity: anomaly.severity,
              description: anomaly.description,
              timestamp: anomaly.timestamp || att.date
            },
            location: anomaly.details?.userLocation,
            distance: anomaly.details?.distanceText,
            aiAnalysis: anomaly.aiAnalysis?.summary,
            date: att.date
          });
        }
      }
    }
    
    res.json({
      success: true,
      count: anomalies.length,
      factory: FACTORY_LOCATION,
      anomalies
    });
    
  } catch (error) {
    console.error('Anomaly locations error:', error);
    res.status(500).json({
      error: 'Anomali verileri alınırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 4. İSTATİSTİKLER
// ============================================

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    // Bugünkü istatistikler
    const todayCount = await Attendance.countDocuments({
      date: { $gte: today },
      $or: [
        { 'checkIn.coordinates': { $exists: true } },
        { 'checkOut.coordinates': { $exists: true } }
      ]
    });
    
    // Aylık istatistikler
    const monthlyCount = await Attendance.countDocuments({
      date: { $gte: thisMonth },
      $or: [
        { 'checkIn.coordinates': { $exists: true } },
        { 'checkOut.coordinates': { $exists: true } }
      ]
    });
    
    // Anomali sayıları
    const anomalyCount = await Attendance.countDocuments({
      'anomalies.type': 'LOCATION_OUT_OF_BOUNDS'
    });
    
    const criticalAnomalies = await Attendance.countDocuments({
      'anomalies.type': 'LOCATION_OUT_OF_BOUNDS',
      'anomalies.severity': 'ERROR'
    });
    
    res.json({
      success: true,
      stats: {
        today: todayCount,
        thisMonth: monthlyCount,
        totalAnomalies: anomalyCount,
        criticalAnomalies: criticalAnomalies
      },
      factory: FACTORY_LOCATION
    });
    
  } catch (error) {
    console.error('Location stats error:', error);
    res.status(500).json({
      error: 'İstatistikler alınırken hata oluştu',
      details: error.message
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const moment = require('moment');
const dailyReportService = require('../services/dailyReportService');

// Auth middleware - JWT token kontrolü ile güncellendi
const authMiddleware = async (req, res, next) => {
  try {
    // Token kontrolü - Authorization header'dan al
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      // Token yoksa da devam et (geçici olarak izin ver)
      console.log('No token provided, allowing access temporarily');
      next();
      return;
    }

    // Token varsa decode et
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret');
      req.user = decoded;
    } catch (err) {
      console.log('Token validation failed:', err.message);
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next(); // Hata olsa bile şimdilik devam et
  }
};

// Lazy load models
const getModels = () => {
  return {
    Attendance: require('../models/Attendance'),
    Employee: require('../models/Employee'),
    SystemQRToken: require('../models/SystemQRToken'),
    AttendanceToken: require('../models/AttendanceToken')
  };
};

/**
 * 📊 RAPORLAMA API'LERİ
 * Günlük, haftalık ve aylık raporlar için endpoint'ler
 */

// Günlük rapor üret (manuel tetikleme)
router.post('/generate-daily-report', authMiddleware, async (req, res) => {
  try {
    const { date } = req.body;
    const reportDate = date ? new Date(date) : new Date();
    
    const report = await dailyReportService.generateDailyReport(reportDate);
    
    res.json({
      success: true,
      message: 'Günlük rapor başarıyla oluşturuldu',
      report
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({
      success: false,
      error: 'Rapor oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// Haftalık rapor üret
router.post('/generate-weekly-report', authMiddleware, async (req, res) => {
  try {
    const { startDate } = req.body;
    const start = startDate ? new Date(startDate) : moment().startOf('week').toDate();
    
    const report = await dailyReportService.generateWeeklyReport(start);
    
    res.json({
      success: true,
      message: 'Haftalık rapor başarıyla oluşturuldu',
      report
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({
      success: false,
      error: 'Rapor oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// Aylık rapor üret
router.post('/generate-monthly-report', authMiddleware, async (req, res) => {
  try {
    const { year, month } = req.body;
    const reportYear = year || moment().year();
    const reportMonth = month || (moment().month() + 1);
    
    const report = await dailyReportService.generateMonthlyReport(reportYear, reportMonth);
    
    res.json({
      success: true,
      message: 'Aylık rapor başarıyla oluşturuldu',
      report
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({
      success: false,
      error: 'Rapor oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// Devam raporu - Günlük/Haftalık/Aylık (gerçek verilerle güncellendi)
router.get('/attendance-report', authMiddleware, async (req, res) => {
  try {
    // Use lazy loaded models
    const { Attendance, Employee } = getModels();
    
    const { 
      startDate, 
      endDate, 
      location = 'ALL', 
      department = 'ALL',
      reportType = 'daily' 
    } = req.query;
    
    // Tarih aralığını ayarla
    const start = moment(startDate).startOf('day').toDate();
    const end = moment(endDate).endOf('day').toDate();
    
    // Filtreleme kriterleri
    let query = {
      date: { $gte: start, $lte: end }
    };
    
    // Lokasyon filtresi
    if (location !== 'ALL') {
      query['$or'] = [
        { 'checkIn.location': location },
        { 'checkOut.location': location }
      ];
    }
    
    // Kayıtları çek
    const attendanceRecords = await Attendance.find(query)
      .populate('employeeId', 'adSoyad sicilNo departman pozisyon lokasyon')
      .sort({ date: -1, 'checkIn.time': -1 })
      .lean();
    
    // Departman filtresi (populate sonrası)
    let filteredRecords = attendanceRecords;
    if (department !== 'ALL') {
      filteredRecords = attendanceRecords.filter(record => 
        record.employeeId && record.employeeId.departman === department
      );
    }
    
    // Çalışan listesi
    const employeeQuery = {};
    if (location !== 'ALL') {
      employeeQuery.lokasyon = location;
    }
    if (department !== 'ALL') {
      employeeQuery.departman = department;
    }
    
    const employees = await Employee.find({
      ...employeeQuery,
      durum: 'Çalışıyor'
    });
    
    // İstatistikleri hesapla
    const totalCheckIns = filteredRecords.filter(r => r.checkIn?.time).length;
    const totalCheckOuts = filteredRecords.filter(r => r.checkOut?.time).length;
    const totalLate = filteredRecords.filter(r => r.lateMinutes > 0).length;
    const totalEarly = filteredRecords.filter(r => r.earlyLeaveMinutes > 0).length;
    const attendanceRate = employees.length > 0 
      ? Math.round((totalCheckIns / employees.length) * 100) 
      : 0;
    
    // Format response for ReportingDashboard
    res.json({
      reportType,
      period: { start: startDate, end: endDate },
      totalEmployees: employees.length,
      totalRecords: filteredRecords.length,
      totalCheckIns,
      totalCheckOuts,
      totalAbsents: employees.length - totalCheckIns,
      totalLate,
      totalEarly,
      attendanceRate,
      punctualityRate: totalCheckIns > 0
        ? Math.round(((totalCheckIns - totalLate) / totalCheckIns) * 100)
        : 0,
      avgWorkHours: 0,
      totalOvertime: 0,
      avgLateMinutes: 0,
      dailyStats: [],
      locationStats: {},
      departmentStats: {},
      anomalies: {},
      records: filteredRecords.map(record => ({
        _id: record._id,
        date: record.date,
        employee: record.employeeId,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        workDuration: record.workDuration,
        overtimeMinutes: record.overtimeMinutes,
        lateMinutes: record.lateMinutes,
        earlyLeaveMinutes: record.earlyLeaveMinutes,
        status: record.status,
        anomalies: record.anomalies,
        notes: record.notes
      }))
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Rapor oluşturulurken hata',
      error: error.message
    });
  }
});

// Çalışan bazlı rapor
router.get('/employee-report/:employeeId', authMiddleware, async (req, res) => {
  try {
    const { Attendance, Employee } = getModels();
    
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    
    const employee = await Employee.findById(employeeId).lean();
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Çalışan bulunamadı'
      });
    }
    
    const start = moment(startDate).startOf('day').toDate();
    const end = moment(endDate).endOf('day').toDate();
    
    const records = await Attendance.find({
      employeeId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 }).lean();
    
    res.json({
      success: true,
      data: {
        employee,
        records,
        summary: {
          totalDays: records.length,
          dateRange: { start, end }
        }
      }
    });
  } catch (error) {
    console.error('Employee report error:', error);
    res.status(500).json({
      success: false,
      message: 'Çalışan raporu oluşturulurken hata',
      error: error.message
    });
  }
});

// Health check for reports
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Reports API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

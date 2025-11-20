const express = require('express');
const router = express.Router();
const attendanceAI = require('../services/attendanceAI');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const moment = require('moment');

/**
 * 🤖 ATTENDANCE AI ROUTES
 * AI destekli giriş-çıkış analiz servisleri
 */

// ============================================
// 1. EXCEL İMPORT AI ANALİZİ
// ============================================

router.post('/analyze-excel', async (req, res) => {
  try {
    const { excelData } = req.body;

    if (!excelData || !Array.isArray(excelData)) {
      return res.status(400).json({ error: 'Excel verisi gerekli (array)' });
    }

    const analysis = await attendanceAI.analyzeExcelImport(excelData);

    res.json({
      success: true,
      analysis,
      message: 'Excel AI analizi tamamlandı'
    });

  } catch (error) {
    console.error('AI Excel analysis error:', error);
    res.status(500).json({
      error: 'AI analizi yapılırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 2. ANOMALİ TESPİTİ
// ============================================

router.get('/detect-anomalies', async (req, res) => {
  try {
    const { date, location } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const query = { date: targetDate };
    if (location) {
      query['checkIn.location'] = location;
    }

    const records = await Attendance.find(query)
      .populate('employeeId', 'adSoyad pozisyon departman');

    const anomalies = await attendanceAI.detectAnomalies(records);

    res.json({
      success: true,
      date: targetDate,
      recordCount: records.length,
      anomalies,
      message: `${anomalies?.anomaliler?.length || 0} anomali tespit edildi`
    });

  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({
      error: 'Anomali tespiti yapılırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 3. FRAUD DETECTION
// ============================================

router.get('/detect-fraud', async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Son 7 gün
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.date = { $gte: sevenDaysAgo };
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const records = await Attendance.find(query)
      .populate('employeeId', 'adSoyad pozisyon');

    const fraudAnalysis = await attendanceAI.detectFraud(records);

    res.json({
      success: true,
      period: {
        start: query.date.$gte,
        end: query.date.$lte
      },
      recordCount: records.length,
      fraudAnalysis,
      message: `${fraudAnalysis?.fraud_bulgulari?.length || 0} şüpheli durum tespit edildi`
    });

  } catch (error) {
    console.error('Fraud detection error:', error);
    res.status(500).json({
      error: 'Fraud detection yapılırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 4. AYLIK AI INSIGHTS
// ============================================

router.get('/monthly-insights', async (req, res) => {
  try {
    const { year, month } = req.query;

    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    // Ay başı ve sonu
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    // Tüm kayıtları al
    const records = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate('employeeId');

    // İstatistikleri hesapla
    const monthData = {
      totalEmployees: await Employee.countDocuments({ durum: 'AKTIF' }),
      averageAttendance: (records.length / 30).toFixed(1),
      totalLateArrivals: records.filter(r => r.status === 'LATE').length,
      totalAbsences: records.filter(r => r.status === 'ABSENT').length,
      totalOvertime: records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0),
      topLateEmployees: records
        .filter(r => r.lateMinutes > 0)
        .sort((a, b) => b.lateMinutes - a.lateMinutes)
        .slice(0, 5)
        .map(r => ({ isim: r.employeeId?.adSoyad, toplam_gec_kalma: r.lateMinutes })),
      dailyTrends: records.reduce((acc, r) => {
        const day = moment(r.date).format('YYYY-MM-DD');
        if (!acc[day]) acc[day] = { katilim: 0, gec_kalma: 0 };
        acc[day].katilim++;
        if (r.status === 'LATE') acc[day].gec_kalma++;
        return acc;
      }, {})
    };

    const insights = await attendanceAI.generateMonthlyInsights(monthData);

    res.json({
      success: true,
      period: {
        year: targetYear,
        month: targetMonth
      },
      stats: monthData,
      aiInsights: insights,
      message: 'AI insights oluşturuldu'
    });

  } catch (error) {
    console.error('Monthly insights error:', error);
    res.status(500).json({
      error: 'Monthly insights oluşturulurken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 5. NLP SEARCH (AKILLI SÜRÜM)
// ============================================

router.post('/nlp-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Arama sorgusu gerekli' });
    }

    // 1. AI Servisinden Yapılandırılmış Filtreyi Al
    const searchResult = await attendanceAI.nlpSearch(query);

    // 2. Filtreyi MongoDB Sorgusuna Çevir
    const dbQuery = {};

    if (searchResult.filtre) {
      const { startDate, endDate, status, employeeName, location, department } = searchResult.filtre;

      // Tarih Filtresi
      if (startDate && endDate) {
        dbQuery.date = {
          $gte: new Date(startDate),
          $lte: new Date(`${endDate}T23:59:59.999Z`)
        };
      }

      // Durum Filtresi
      if (status) {
        dbQuery.status = status;
      }
      
      // Lokasyon Filtresi
      if (location) {
        dbQuery['checkIn.location'] = location;
      }
    }

    // 3. Sorguyu Çalıştır
    // İsim/Departman araması için populate yapmamız gerekecek, o yüzden önce temel sorguyu yapıp sonra filtreleyeceğiz
    // veya eğer isim varsa önce employee ID'lerini bulacağız.

    let employeeIds = [];
    if (searchResult.filtre && (searchResult.filtre.employeeName || searchResult.filtre.department)) {
      const empQuery = {};
      
      if (searchResult.filtre.employeeName) {
        empQuery.adSoyad = { $regex: searchResult.filtre.employeeName, $options: 'i' };
      }
      
      if (searchResult.filtre.department) {
        empQuery.departman = { $regex: searchResult.filtre.department, $options: 'i' };
      }
      
      const employees = await Employee.find(empQuery).select('_id');
      employeeIds = employees.map(e => e._id);
      
      if (employeeIds.length > 0) {
        dbQuery.employeeId = { $in: employeeIds };
      } else {
        // İsim eşleşmediyse boş sonuç dönmeli
        return res.json({
          success: true,
          query: query,
          understood: searchResult.anlasildi,
          explanation: searchResult.aciklama || "Kriterlere uygun çalışan bulunamadı.",
          filter: searchResult.filtre,
          results: [],
          totalFound: 0,
          message: "Sonuç bulunamadı"
        });
      }
    }

    // Veritabanı Sorgusu
    const records = await Attendance.find(dbQuery)
      .populate('employeeId', 'adSoyad pozisyon departman lokasyon')
      .sort({ date: -1 });

    // 4. Sonuçları Dön
    res.json({
      success: true,
      query: query,
      understood: searchResult.anlasildi,
      explanation: searchResult.aciklama,
      filter: searchResult.filtre,
      results: records.slice(0, 50), // İlk 50 sonuç
      totalFound: records.length,
      message: `"${query}" sorgusu analiz edildi`
    });

  } catch (error) {
    console.error('NLP search error:', error);
    res.status(500).json({
      error: 'NLP arama yapılırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 6. ÇALIŞAN PATTERN ANALİZİ
// ============================================

router.get('/employee-pattern/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const pattern = await attendanceAI.analyzeEmployeePattern(employeeId);

    res.json({
      success: true,
      employeeId,
      pattern,
      message: 'Çalışan pattern analizi tamamlandı'
    });

  } catch (error) {
    console.error('Employee pattern error:', error);
    res.status(500).json({
      error: 'Pattern analizi yapılırken hata oluştu',
      details: error.message
    });
  }
});

// ============================================
// 7. DEVAMSIZLIK TAHMİNİ
// ============================================

router.get('/predict-absences', async (req, res) => {
  try {
    // Tüm aktif çalışanların son 30 gün verileri
    const employees = await Employee.find({ durum: 'AKTIF' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const employeeHistory = await Promise.all(
      employees.map(async (emp) => {
        const records = await Attendance.find({
          employeeId: emp._id,
          date: { $gte: thirtyDaysAgo }
        });

        return {
          calisan: emp.adSoyad,
          pozisyon: emp.pozisyon,
          son_30_gun: {
            katilim: records.length,
            gec_kalma: records.filter(r => r.status === 'LATE').length,
            devamsizlik: 30 - records.length
          }
        };
      })
    );

    const prediction = await attendanceAI.predictAbsences(employeeHistory);

    res.json({
      success: true,
      prediction,
      message: 'Yarın için devamsızlık tahmini oluşturuldu'
    });

  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      error: 'Tahmin yapılırken hata oluştu',
      details: error.message
    });
  }
});

module.exports = router;
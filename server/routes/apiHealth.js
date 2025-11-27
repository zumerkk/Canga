/**
 * 🔍 API HEALTH CHECK ROUTES
 * Groq API bağlantısını test etmek için endpoint'ler
 */

const express = require('express');
const router = express.Router();
const apiHealthChecker = require('../services/apiHealthChecker');

/**
 * GET /api/health/check
 * Groq API'yi test et ve sonuçları döndür
 */
router.get('/check', async (req, res) => {
  try {
    const healthReport = await apiHealthChecker.checkAllAPIs();
    
    // Groq çalışıyorsa sistem fonksiyonel
    const isHealthy = healthReport.summary.healthy > 0;
    
    res.status(200).json({
      success: isHealthy,
      ...healthReport
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check sırasında hata oluştu',
      details: error.message
    });
  }
});

/**
 * GET /api/health/check/groq
 * Groq API'yi test et
 */
router.get('/check/groq', async (req, res) => {
  try {
    const result = await apiHealthChecker.checkGroqAPI();
    
    const statusCode = result.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: statusCode === 200,
      api: 'groq',
      ...result
    });
  } catch (error) {
    console.error('Groq health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Groq health check sırasında hata oluştu',
      details: error.message
    });
  }
});

/**
 * GET /api/health/performance
 * Performans testi yap
 */
router.get('/performance', async (req, res) => {
  try {
    const iterations = parseInt(req.query.iterations) || 5;
    
    if (iterations > 20) {
      return res.status(400).json({
        success: false,
        error: 'Maksimum 20 iterasyon yapılabilir'
      });
    }

    const performanceResults = await apiHealthChecker.performanceTest(iterations);
    
    res.json({
      success: true,
      iterations,
      results: performanceResults
    });
  } catch (error) {
    console.error('Performance test error:', error);
    res.status(500).json({
      success: false,
      error: 'Performans testi sırasında hata oluştu',
      details: error.message
    });
  }
});

/**
 * GET /api/health/status
 * Son health check sonuçlarını döndür (cache'den)
 */
router.get('/status', (req, res) => {
  try {
    const status = apiHealthChecker.healthStatus;
    
    const hasRecentCheck = status.groq.lastCheck;
    
    if (!hasRecentCheck) {
      return res.status(404).json({
        success: false,
        message: 'Henüz health check yapılmamış. /api/health/check endpoint\'ini kullanın.'
      });
    }

    const isHealthy = status.groq.status === 'healthy';

    res.json({
      success: true,
      summary: {
        total: 1,
        healthy: isHealthy ? 1 : 0,
        unhealthy: isHealthy ? 0 : 1,
        healthScore: isHealthy ? '100%' : '0%'
      },
      apis: status,
      note: 'Bu veriler en son health check\'ten alınmıştır. Güncel test için /api/health/check kullanın.'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Status kontrolü sırasında hata oluştu',
      details: error.message
    });
  }
});

module.exports = router;

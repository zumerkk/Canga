/**
 * 🔍 API HEALTH CHECK ROUTES
 * API bağlantılarını test etmek için endpoint'ler
 */

const express = require('express');
const router = express.Router();
const apiHealthChecker = require('../services/apiHealthChecker');

/**
 * GET /api/health/check
 * Tüm API'leri test et ve sonuçları döndür
 */
router.get('/check', async (req, res) => {
  try {
    const healthReport = await apiHealthChecker.checkAllAPIs();
    
    // Always return 200 with the actual health data
    // The frontend will interpret the health data accordingly
    // At least one working API means the system is functional
    const atLeastOneHealthy = healthReport.summary.healthy > 0;
    
    res.status(200).json({
      success: atLeastOneHealthy,
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
 * GET /api/health/check/gemini
 * Sadece Gemini API'yi test et
 */
router.get('/check/gemini', async (req, res) => {
  try {
    const result = await apiHealthChecker.checkGeminiAPI();
    
    const statusCode = result.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: statusCode === 200,
      api: 'gemini',
      ...result
    });
  } catch (error) {
    console.error('Gemini health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Gemini health check sırasında hata oluştu',
      details: error.message
    });
  }
});

/**
 * GET /api/health/check/groq
 * Sadece Groq API'yi test et
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
 * GET /api/health/check/openrouter
 * Sadece OpenRouter API'yi test et
 */
router.get('/check/openrouter', async (req, res) => {
  try {
    const result = await apiHealthChecker.checkOpenRouterAPI();
    
    const statusCode = result.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: statusCode === 200,
      api: 'openrouter',
      ...result
    });
  } catch (error) {
    console.error('OpenRouter health check error:', error);
    res.status(500).json({
      success: false,
      error: 'OpenRouter health check sırasında hata oluştu',
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
    
    const hasRecentCheck = status.gemini.lastCheck || status.groq.lastCheck;
    
    if (!hasRecentCheck) {
      return res.status(404).json({
        success: false,
        message: 'Henüz health check yapılmamış. /api/health/check endpoint\'ini kullanın.'
      });
    }

    const healthyCount = [status.gemini, status.groq, status.openrouter].filter(s => s.status === 'healthy').length;
    const totalAPIs = 3;

    res.json({
      success: true,
      summary: {
        total: totalAPIs,
        healthy: healthyCount,
        unhealthy: totalAPIs - healthyCount,
        healthScore: `${((healthyCount / totalAPIs) * 100).toFixed(0)}%`
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


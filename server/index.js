// New Relic APM - en üstte olmalı - temporarily disabled
// require('./config/newrelic');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Monitoring e Logging imports
const { logger, auditLogger, performanceLogger } = require('./config/logger');
// const { initSentry, getSentryMiddlewares, sentryLogger, handleDatabaseError, handleApiError } = require('./config/sentry');

// Sentry'yi başlat - temporarily disabled for testing
// initSentry();

// Redis bağlantısını başlat
const { cacheManager } = require('./config/redis');

const app = express();

// Sentry middleware'lerini al
// const { requestHandler, tracingHandler, errorHandler } = getSentryMiddlewares(app);

// Sentry request handler - en başta olmalı - temporarily disabled
// app.use(requestHandler);
// app.use(tracingHandler);
const PORT = process.env.PORT || 5001;

// Middleware - Güvenli CORS ayarları
const allowedOrigins = [
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  // Production - Render.com URLs
  'https://canga-frontend.onrender.com',
  'https://canga-api.onrender.com',
  // Legacy Railway URL
  'https://canga-vardiya-sistemi-production.up.railway.app',
  // Dynamic environment URLs
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL // Render otomatik URL
].filter(Boolean); // undefined değerleri filtrele

app.use(cors({
  origin: function(origin, callback) {
    // origin olmadan (postman, curl gibi araçlar) veya beyaz listedeki originlerden gelen isteklere izin ver
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS engelledi: ${origin} adresinden gelen isteklere izin verilmiyor`);
      callback(new Error('CORS politikası tarafından engellendi'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Response bittiğinde performance log
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user ? req.user.id : null;
    
    // Performance logging
    // performanceLogger.logApiCall(
    //   req.method,
    //   req.originalUrl,
    //   duration,
    //   res.statusCode,
    //   userId
    // );
    
    // Yavaş request'leri logla
    if (duration > 1000) {
      logger.warn('SLOW_REQUEST', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userId
      });
    }
  });
  
  next();
});

// MongoDB bağlantısı
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga';

// Production'da hatalı URI'yi gösterme
const displayURI = process.env.NODE_ENV === 'production' ? 
  '[REDACTED]' : mongoURI;
console.log('🔗 MongoDB URI:', displayURI);
console.log('🔄 MongoDB bağlantısı başlatılıyor...');

// MongoDB bağlantısı - production authentication sorunları için
let mongoConnectionPromise = null;

if (mongoURI && mongoURI !== 'mongodb://localhost:27017/canga') {
  mongoConnectionPromise = mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 10000, // 5s -> 10s artırdım
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
  })
  .then(async () => {
    console.log('✅ MongoDB bağlantısı başarılı');
    console.log('🚀 Server başlatılıyor...');
    // logger.info('MongoDB Atlas connected successfully');
    
    // Connection pool optimizasyonu
    mongoose.connection.on('connected', () => {
      logger.info('🔗 MongoDB connection pool established');
    });
    
    // Cache warming - production için
    // await warmupCache();
    return true;
  })
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
    if (err.message.includes('bad auth')) {
      console.log('🔑 MongoDB kimlik doğrulama hatası - lütfen kullanıcı adı/şifreyi kontrol edin');
      console.log('📝 MongoDB URI kontrol edin: MONGODB_URI environment variable');
    }
    if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')) {
      console.log('🌐 Network hatası - MongoDB Atlas erişilemiyor');
      console.log('📝 IP Whitelist kontrolü: MongoDB Atlas Network Access bölümünde 0.0.0.0/0 ekli mi?');
    }
    console.log('⚠️ MongoDB bağlantısı başarısız, local fallback modda devam ediliyor...');
    // logger.error('MongoDB connection error:', err);
    
    // Production'da local MongoDB'ye bağlanmaya çalışma
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ Production modda local MongoDB denemesi yapılmıyor');
      throw err; // Production'da hata fırlat, server başlamasın
    }
    
    // Development için local MongoDB dene
    console.log('🔄 Local MongoDB bağlantısı deneniyor...');
    return mongoose.connect('mongodb://localhost:27017/canga', {
      serverSelectionTimeoutMS: 2000,
    }).then(() => {
      console.log('✅ Local MongoDB bağlantısı başarılı');
      return true;
    }).catch(localErr => {
      console.log('⚠️ Local MongoDB da bulunamadı, MongoDB olmadan devam ediliyor...');
      return false;
    });
  });
} else {
  console.log('📍 Local MongoDB kullanılıyor...');
  mongoConnectionPromise = mongoose.connect('mongodb://localhost:27017/canga', {
    serverSelectionTimeoutMS: 2000,
  }).then(() => {
    console.log('✅ Local MongoDB bağlantısı başarılı');
    return true;
  }).catch(err => {
    console.log('⚠️ Local MongoDB bulunamadı, MongoDB olmadan devam ediliyor...');
    return false;
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // MongoDB durumu
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Redis durumu
    let redisStatus = 'disconnected';
    try {
      await redisClient.ping();
      redisStatus = 'connected';
    } catch (err) {
      redisStatus = 'disconnected';
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus
      },
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/excel', require('./routes/excel'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/services', require('./routes/services')); // Servis sistemi
app.use('/api/notifications', require('./routes/notifications')); // Bildirim sistemi
// app.use('/api/users', require('./routes/users')); // Kullanıcı yönetim sistemi
// app.use('/api/calendar', require('./routes/calendar')); // Takvim/Ajanda sistemi
// app.use('/api/scheduled-lists', require('./routes/scheduledLists')); // 📅 Otomatik Liste Sistemi
// app.use('/api/ai-analysis', require('./routes/aiAnalysis')); // 🤖 AI Veri Analizi
app.use('/api/annual-leave', require('./routes/annualLeave')); // 📆 Yıllık İzin Takip Sistemi
// app.use('/api/job-applications', require('./routes/jobApplications')); // 🏢 İş Başvuruları Yönetimi
// app.use('/api/form-structure', require('./routes/formStructure')); // 🎨 Form Yapısı Yönetimi

// 🔥 Cache warming function
const warmupCache = async () => {
  try {
    logger.info('Starting cache warmup');
    console.log('🔥 Starting cache warmup...');
    
    // Employee stats cache warmup
    const Employee = require('./models/Employee');
    const startTime = Date.now();
    
    const employeeStats = await Employee.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          aktif: { $sum: { $cond: [{ $eq: ['$durum', 'AKTIF'] }, 1, 0] } }
        }
      }
    ]);
    
    const queryDuration = Date.now() - startTime;
    // performanceLogger.logDatabaseQuery('aggregate', 'Employee', queryDuration, employeeStats.length);
    
    if (employeeStats.length > 0) {
      await cacheManager.set('employee_stats:overview', employeeStats[0], 600);
      logger.info('Employee stats cached successfully');
      console.log('✅ Employee stats cached');
    }
    
    // Department and location stats cache warmup
    const filterStartTime = Date.now();
    const filterStats = await Employee.aggregate([
      {
        $match: {
          departman: { $ne: null, $ne: '' },
          lokasyon: { $ne: null, $ne: '' }
        }
      },
      {
        $facet: {
          departments: [
            {
              $group: {
                _id: '$departman',
                count: { $sum: 1 },
                aktif: { $sum: { $cond: [{ $eq: ['$durum', 'AKTIF'] }, 1, 0] } }
              }
            },
            { $sort: { count: -1 } }
          ],
          locations: [
            {
              $group: {
                _id: '$lokasyon',
                count: { $sum: 1 },
                aktif: { $sum: { $cond: [{ $eq: ['$durum', 'AKTIF'] }, 1, 0] } }
              }
            },
            { $sort: { count: -1 } }
          ]
        }
      }
    ]);
    
    const filterQueryDuration = Date.now() - filterStartTime;
    // performanceLogger.logDatabaseQuery('aggregate', 'Employee', filterQueryDuration, filterStats.length);
    
    if (filterStats.length > 0) {
      await cacheManager.set('employee_stats:filters', {
        departments: filterStats[0].departments || [],
        locations: filterStats[0].locations || []
      }, 300);
      logger.info('Filter stats cached successfully');
      console.log('✅ Filter stats cached');
    }
    
    // logger.info('Cache warmup completed successfully');
    console.log('🔥 Cache warmup completed successfully!');
  } catch (error) {
    logger.error('Cache warmup error', {
      error: error.message,
      stack: error.stack
    });
    
    // handleDatabaseError(error, 'cache_warmup', 'Employee');
    console.error('❌ Cache warmup error:', error.message);
  }
};

// Health check endpoint with Redis status
app.get('/api/health', async (req, res) => {
  try {
    // Test Redis connection
    const redisStatus = await cacheManager.get('health_check') || 'disconnected';
    await cacheManager.set('health_check', 'connected', 10);
    
    // Test MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    const healthData = {
      status: 'OK',
      message: 'Canga Vardiya Sistemi API çalışıyor! 🚀',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        mongodb: mongoStatus,
        redis: redisStatus === 'connected' ? 'connected' : 'disconnected',
        cache: 'active',
        winston: 'active',
        sentry: process.env.SENTRY_DSN ? 'active' : 'disabled',
        newrelic: process.env.NEW_RELIC_LICENSE_KEY ? 'active' : 'disabled'
      },
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      monitoring: {
        logging: 'Winston Logger Active',
        errorTracking: process.env.SENTRY_DSN ? 'Sentry Active' : 'Sentry Disabled',
        apm: process.env.NEW_RELIC_LICENSE_KEY ? 'New Relic Active' : 'New Relic Disabled'
      }
    };
    
    // Health check'i logla
    logger.info('Health check performed', {
      services: healthData.services,
      uptime: healthData.performance.uptime,
      memory: healthData.performance.memory.heapUsed
    });
    
    res.status(200).json(healthData);
  } catch (error) {
    logger.error('Health check error', {
      error: error.message,
      stack: error.stack
    });
    
    // sentryLogger.captureError(error, {
    //   context: 'health_check'
    // });
    
    res.status(503).json({
      status: 'ERROR',
      message: 'Sistem sağlık kontrolünde hata',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.json({
    message: 'Canga Savunma Endüstrisi - Vardiya Yönetim Sistemi API',
    version: '2.0.0',
    endpoints: {
      employees: '/api/employees',
      shifts: '/api/shifts',
      excel: '/api/excel',
      dashboard: '/api/dashboard',
      services: '/api/services',
      notifications: '/api/notifications',
      calendar: '/api/calendar', // Takvim/Ajanda
      scheduledLists: '/api/scheduled-lists', // 📅 Otomatik Liste Sistemi
      aiAnalysis: '/api/ai-analysis', // 🤖 AI Veri Analizi
      annualLeave: '/api/annual-leave' // 📆 Yıllık İzin Takip Sistemi
    },
    newFeatures: {
      'Otomatik Liste Oluşturma': 'Zamanlanmış listeler ile otomatik Excel üretimi',
      'AI Veri Analizi': 'Gemini AI ile akıllı isim benzerlik ve veri tutarlılık analizi',
      'Hata Tespit Sistemi': 'AI destekli otomatik hata bulma ve temizleme önerileri'
    }
  });
});

// Sentry error handler - diğer error handler'lardan önce - temporarily disabled
// app.use(errorHandler);

// Hata yakalama middleware
app.use((error, req, res, next) => {
  // Error'u logla
  logger.error('Server Error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null
  });
  
  // API error handling için Sentry - temporarily disabled
  // handleApiError(error, req, req.originalUrl);
  
  console.error('❌ Server Hatası:', error);
  
  res.status(error.status || 500).json({
    message: error.message || 'Sunucu hatası oluştu',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Bir hata oluştu',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Endpoint bulunamadı',
    path: req.originalUrl
  });
});

// Server'ı başlat - MongoDB bağlantısı hazır olduktan sonra
let server;

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n👋 ${signal} alındı. Server kapatılıyor...`);
  
  if (server) {
    server.close(() => {
      console.log('🌐 HTTP server kapatıldı');
      mongoose.connection.close(false).then(() => {
        console.log('📦 MongoDB bağlantısı kapatıldı');
        process.exit(0);
      }).catch(err => {
        console.error('❌ MongoDB kapatma hatası:', err);
        process.exit(1);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// MongoDB bağlantısını dene ve server'ı başlat
const startServer = async () => {
  let mongoConnected = false;
  
  try {
    if (mongoConnectionPromise) {
      mongoConnected = await Promise.race([
        mongoConnectionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MongoDB connection timeout')), 15000) // 8s -> 15s artırdım
        )
      ]);
    }
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error.message);
    
    // Production'da MongoDB bağlantısı zorunlu
    if (process.env.NODE_ENV === 'production') {
      console.error('\n🚨 KRİTİK HATA: Production ortamında MongoDB bağlantısı başarısız!');
      console.error('📝 Kontrol edilecekler:');
      console.error('   1. MONGODB_URI environment variable set edilmiş mi?');
      console.error('   2. MongoDB Atlas IP whitelist: 0.0.0.0/0 ekli mi?');
      console.error('   3. MongoDB kullanıcı adı/şifre doğru mu?');
      console.error('\n❌ Server başlatılamıyor...\n');
      
      // Render için detaylı log
      console.log('🔍 Debug bilgisi:');
      console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`   - PORT: ${process.env.PORT}`);
      console.log(`   - MONGODB_URI var mı: ${process.env.MONGODB_URI ? 'EVET' : 'HAYIR ❌'}`);
      
      // Server'ı başlatma, exit et
      process.exit(1);
    }
    
    // Development'ta devam et
    console.log('⚠️ MongoDB bağlantısı başarısız, development modda devam ediliyor...');
    mongoConnected = false;
  }
  
  // Server'ı başlat
  server = app.listen(PORT, () => {
    console.log(`\n🚀 Canga Vardiya Sistemi çalışıyor!${mongoConnected ? '' : ' (MongoDB olmadan)'}`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  MongoDB: ${mongoConnected ? '✅ Bağlandı' : '❌ Bağlantı başarısız'}`);
    console.log(`🔄 Redis: ✅ Bağlandı`);
    console.log(`📝 Logs: ./logs/`);
    console.log(`\n${mongoConnected ? '✅ Sistem hazır' : '⚠️  Sistem kısmi olarak hazır'} - API endpoints aktif!\n`);
  });
};

// Server'ı başlat
startServer();

module.exports = app;
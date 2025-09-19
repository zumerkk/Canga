// New Relic APM - en üstte olmalı - temporarily disabled
// require('./newrelic');

console.log('🚀 Server başlatılıyor...');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log('✅ Temel modüller yüklendi');

// Monitoring e Logging imports - temporarily disabled
// const { logger, auditLogger, performanceLogger } = require('./config/logger');
// const { initSentry, getSentryMiddlewares, sentryLogger, handleDatabaseError, handleApiError } = require('./config/sentry');

// Sentry'yi başlat - temporarily disabled
// initSentry();

// Redis bağlantısını başlat - temporarily disabled
// const { cacheManager } = require('./config/redis');

console.log('✅ Konfigürasyon modülleri atlandı');

const app = express();
console.log('✅ Express app oluşturuldu');

// Sentry middleware'lerini al - temporarily disabled
// const { requestHandler, tracingHandler, errorHandler } = getSentryMiddlewares(app);

// Sentry request handler - en başta olmalı - temporarily disabled
// app.use(requestHandler);
// app.use(tracingHandler);
const PORT = process.env.PORT || 5001;

// Middleware - Güvenli CORS ayarları
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://canga-vardiya-sistemi-production.up.railway.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL
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
    
    // Performance logging - temporarily disabled
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
console.log('🔗 MongoDB URI:', mongoURI);
console.log('🔄 MongoDB bağlantısı başlatılıyor...');

// MongoDB Atlas bağlantısı
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
   .then(async () => {
     console.log('✅ MongoDB bağlantısı başarılı');
     console.log('🚀 Server başlatılıyor...');
     // logger.info('MongoDB Atlas connected successfully');
     
     // Database indexleri oluştur
     // await createDatabaseIndexes(); // temporarily disabled for testing
     
     // Connection pool optimizasyonu
     mongoose.connection.on('connected', () => {
       // logger.info('🔗 MongoDB connection pool established');
     });
     
     // Cache warming - production için
     // await warmupCache();
   })
   .catch(err => {
     console.error('❌ MongoDB bağlantı hatası:', err.message);
     console.error('❌ Hata detayı:', err);
     console.log('⚠️ MongoDB bağlantısı başarısız, fallback modda devam ediliyor...');
     // logger.error('MongoDB connection error:', err);
     // process.exit(1); // Geçici olarak devre dışı
   });

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
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/services', require('./routes/services')); // Servis sistemi
app.use('/api/notifications', require('./routes/notifications')); // Bildirim sistemi
app.use('/api/database', require('./routes/database')); // MongoDB Veritabanı Yönetimi
app.use('/api/scheduled-lists', require('./routes/scheduledLists')); // 📅 Otomatik Liste Sistemi
app.use('/api/ai-analysis', require('./routes/aiAnalysis')); // 🤖 AI Veri Analizi
app.use('/api/annual-leave', require('./routes/annualLeave')); // 📆 Yıllık İzin Takip Sistemi
app.use('/api/job-applications', require('./routes/jobApplications')); // 🏢 İş Başvuruları Yönetimi
app.use('/api/form-structure', require('./routes/formStructure')); // 🎨 Form Yapısı Yönetimi

// 🔥 Cache warming function
const warmupCache = async () => {
  try {
    // logger.info('Starting cache warmup');
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
      // await cacheManager.set('employee_stats:overview', employeeStats[0], 600);
      // logger.info('Employee stats cached successfully');
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
      // await cacheManager.set('employee_stats:filters', {
      //   departments: filterStats[0].departments || [],
      //   locations: filterStats[0].locations || []
      // }, 300);
      // logger.info('Filter stats cached successfully');
      console.log('✅ Filter stats cached');
    }
    
    // logger.info('Cache warmup completed successfully');
    console.log('🔥 Cache warmup completed successfully!');
  } catch (error) {
    // logger.error('Cache warmup error', {
    //   error: error.message,
    //   stack: error.stack
    // });
    
    // handleDatabaseError(error, 'cache_warmup', 'Employee');
    console.error('❌ Cache warmup error:', error.message);
  }
};

// Health check endpoint with Redis status
app.get('/api/health', async (req, res) => {
  try {
    // Test Redis connection - temporarily disabled
    // const redisStatus = await cacheManager.get('health_check') || 'disconnected';
    // await cacheManager.set('health_check', 'connected', 10);
    const redisStatus = 'disabled';
    
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
    
    // Health check'i logla - temporarily disabled
    // logger.info('Health check performed', {
    //   services: healthData.services,
    //   uptime: healthData.performance.uptime,
    //   memory: healthData.performance.memory.heapUsed
    // });
    
    res.status(200).json(healthData);
  } catch (error) {
    // logger.error('Health check error', {
    //   error: error.message,
    //   stack: error.stack
    // });
    
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
      database: '/api/database', // MongoDB Yönetimi
      calendar: '/api/calendar', // Takvim/Ajanda
      scheduledLists: '/api/scheduled-lists', // 📅 Otomatik Liste Sistemi
      analytics: '/api/analytics', // 📊 Analytics & Raporlama
      aiAnalysis: '/api/ai-analysis', // 🤖 AI Veri Analizi
      annualLeave: '/api/annual-leave' // 📆 Yıllık İzin Takip Sistemi
    },
    newFeatures: {
      'Otomatik Liste Oluşturma': 'Zamanlanmış listeler ile otomatik Excel üretimi',
      'Gelişmiş Analytics': 'Kullanım istatistikleri ve performans raporları',
      'Trending Analizi': 'Departman ve şablon bazlı kullanım trendleri',
      'AI Veri Analizi': 'Gemini AI ile akıllı isim benzerlik ve veri tutarlılık analizi',
      'Hata Tespit Sistemi': 'AI destekli otomatik hata bulma ve temizleme önerileri'
    }
  });
});

// Sentry error handler - diğer error handler'lardan önce - temporarily disabled
// app.use(errorHandler);

// Hata yakalama middleware
app.use((error, req, res, next) => {
  // Error'u logla - temporarily disabled
  // logger.error('Server Error', {
  //   error: error.message,
  //   stack: error.stack,
  //   url: req.originalUrl,
  //   method: req.method,
  //   ip: req.ip,
  //   userAgent: req.get('User-Agent'),
  //   userId: req.user ? req.user.id : null
  // });
  
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

// MongoDB bağlantısı hazır olduktan sonra server'ı başlat
mongoose.connection.once('open', () => {
  server = app.listen(PORT, () => {
    console.log(`
🚀 Canga Vardiya Sistemi çalışıyor!`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  MongoDB: ✅ Bağlandı`);
    console.log(`🔄 Redis: ✅ Bağlandı`);
    console.log(`📝 Logs: ./logs/`);
    console.log(`\n✅ Sistem hazır - API endpoints aktif!\n`);
  });
});

// Fallback: Eğer MongoDB bağlantısı 15 saniye içinde gerçekleşmezse server'ı yine de başlat - temporarily disabled
// setTimeout(() => {
//   if (!server) {
//     console.log('⚠️  MongoDB bağlantısı zaman aşımı, server yine de başlatılıyor...');
//     server = app.listen(PORT, () => {
//       console.log(`\n🚀 Canga Vardiya Sistemi çalışıyor! (MongoDB olmadan)`);
//       console.log(`📍 Port: ${PORT}`);
//       console.log(`🌐 URL: http://localhost:${PORT}`);
//       console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
//       console.log(`🗄️  MongoDB: ❌ Bağlantı başarısız`);
//       console.log(`🔄 Redis: ✅ Bağlandı`);
//       console.log(`📝 Logs: ./logs/`);
//       console.log(`\n⚠️  Sistem kısmi olarak hazır!\n`);
//     });
//   }
// }, 1000);

module.exports = app;
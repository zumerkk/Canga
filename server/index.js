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

// CORS debug modu (isteğe bağlı): DEBUG_CORS=true
const isCorsDebug = process.env.DEBUG_CORS === 'true';

// Başlangıçta whitelist'i tek sefer logla (development)
if (process.env.NODE_ENV !== 'production') {
  console.log('📋 İzin verilen originler:', allowedOrigins);
}

app.use(cors({
  origin: function(origin, callback) {
    if (isCorsDebug) {
      console.log(`🔍 CORS kontrol: origin = ${origin}`);
    }

    // origin olmadan (postman, curl gibi araçlar) veya beyaz listedeki originlerden gelen isteklere izin ver
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      if (isCorsDebug) {
        console.log(`✅ CORS izin verildi: ${origin}`);
      }
      callback(null, true);
    } else {
      // Render preview URL'leri için özel kontrol
      // onrender.com ile biten ve canga içeren tüm subdomainlere izin ver
      if (origin.endsWith('.onrender.com') && (origin.includes('canga') || origin.includes('frontend'))) {
          console.log(`✅ CORS izin verildi (Render Subdomain): ${origin}`);
          return callback(null, true);
      }

      // Engelleneni uyarı seviyesinde tek satır logla
      console.warn(`⚠️ CORS reddedildi: ${origin}`);
      // Test için geçici olarak tüm originlere izin veriliyorsa .env ile aç-kapa
      const allowAll = process.env.CORS_ALLOW_ALL === 'true';
      if (allowAll) {
        if (isCorsDebug) console.log('🔧 CORS_ALLOW_ALL etkin: geçici izin verildi');
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Origin not allowed'), false);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Base64 fotoğraflar için limit artırıldı
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 📷 Static dosya servisi - Employee fotoğrafları için
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    // logger.info('MongoDB Atlas connected successfully');
    
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

// Health check endpoint - basit versiyon
app.get('/health', async (req, res) => {
  try {
    // MongoDB durumu
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus
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
console.log('📦 Route yükleme başlıyor...');
console.log('📦 Loading users route...');
app.use('/api/users', require('./routes/users'));
console.log('📦 Loading employees route...');
app.use('/api/employees', require('./routes/employees'));
console.log('📦 Loading shifts route...');
app.use('/api/shifts', require('./routes/shifts'));
console.log('📦 Loading excel route...');
app.use('/api/excel', require('./routes/excel'));
console.log('📦 Loading dashboard route...');
app.use('/api/dashboard', require('./routes/dashboard'));
console.log('📦 Loading calendar route...');
app.use('/api/calendar', require('./routes/calendar'));
console.log('📦 Loading services route...');
app.use('/api/services', require('./routes/services')); // Servis sistemi
console.log('📦 Loading notifications route...');
app.use('/api/notifications', require('./routes/notifications')); // Bildirim sistemi
console.log('📦 Loading attendance route...');
app.use('/api/attendance', require('./routes/attendance')); // 🕐 Giriş-Çıkış Takip Sistemi
console.log('📦 Loading attendance-qr route...');
app.use('/api/attendance-qr', require('./routes/attendanceQR')); // 📱 QR Kod Tabanlı İmza Sistemi
console.log('📦 Loading system-qr route...');
app.use('/api/system-qr', require('./routes/systemQR')); // 🏢 Sistem QR Kod (Paylaşılan)
console.log('📦 Loading location-map route...');
app.use('/api/location-map', require('./routes/locationMap')); // 🗺️ Konum Haritası API
console.log('📦 Loading reports route...');
app.use('/api/reports', require('./routes/reports')); // 📊 Gelişmiş Raporlama Sistemi (Optimized)

// 🤖 AI routes - optional (eğer AI keys yoksa disable olacak)
console.log('📦 Loading AI routes...');
try {
  const attendanceAIRoute = require('./routes/attendanceAI');
  app.use('/api/attendance-ai', attendanceAIRoute);
  console.log('✅ AI servisleri yüklendi');
} catch (error) {
  console.warn('⚠️ AI servisleri yüklenemedi (API keys eksik olabilir):', error.message);
  // AI olmadan devam et
}
// app.use('/api/users', require('./routes/users')); // Kullanıcı yönetim sistemi
// app.use('/api/calendar', require('./routes/calendar')); // Takvim/Ajanda sistemi
// app.use('/api/scheduled-lists', require('./routes/scheduledLists')); // 📅 Otomatik Liste Sistemi
// app.use('/api/ai-analysis', require('./routes/aiAnalysis')); // 🤖 AI Veri Analizi
console.log('📦 Loading annual-leave route...');
app.use('/api/annual-leave', require('./routes/annualLeave')); // 📆 Yıllık İzin Takip Sistemi
console.log('📦 Loading job-applications route...');
app.use('/api/job-applications', require('./routes/jobApplications')); // 🏢 İş Başvuruları Yönetimi
console.log('📦 Loading form-structure route...');
app.use('/api/form-structure', require('./routes/formStructure')); // 🎨 Form Yapısı Yönetimi
console.log('📦 Loading quick-route route...');
app.use('/api/quick-route', require('./routes/quickRoute')); // 🚌 Hızlı Güzergah Oluşturucu
console.log('📦 Loading API health check route...');
app.use('/api/health', require('./routes/apiHealth')); // 🔍 API Health Check Sistemi
console.log('📦 Loading manual-applications route...');
app.use('/api/manual-applications', require('./routes/manualApplications')); // 📋 Elle Girilen Başvurular
console.log('📦 Loading live-stream route...');
app.use('/api/live-stream', require('./routes/liveStream')); // 🔴 Real-time SSE Stream
console.log('📦 Loading manual-attendance route...');
app.use('/api/manual-attendance', require('./routes/manualAttendance')); // 📝 Manuel Yoklama Girişi
console.log('📦 Loading barcode-attendance route...');
app.use('/api/barcode', require('./routes/barcodeAttendance')); // 📊 Barkod Tabanlı Giriş-Çıkış
console.log('📦 Loading leave-management route...');
app.use('/api/leave-management', require('./routes/leaveManagement')); // 📄 İzin Yönetim Sistemi
console.log('✅ Tüm route\'lar yüklendi!');

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
      annualLeave: '/api/annual-leave', // 📆 Yıllık İzin Takip Sistemi
      quickRoute: '/api/quick-route' // 🚌 Hızlı Güzergah Oluşturucu
    },
    newFeatures: {
      'Otomatik Liste Oluşturma': 'Zamanlanmış listeler ile otomatik Excel üretimi',
      'AI Veri Analizi': 'Groq AI ile akıllı isim benzerlik ve veri tutarlılık analizi',
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
  console.log('\n\n========================================');
  console.log('🔧 startServer() BAŞLADI');
  console.log('========================================\n');
  
  let mongoConnected = false;
  
  try {
    console.log('🔍 MongoDB promise kontrol ediliyor...');
    console.log('   mongoConnectionPromise:', mongoConnectionPromise ? 'VAR' : 'YOK');
    
    if (mongoConnectionPromise) {
      console.log('⏳ MongoDB bağlantısı bekleniyor (max 8 saniye)...');
      const startTime = Date.now();
      
      mongoConnected = await Promise.race([
        mongoConnectionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('MongoDB connection timeout')), 8000)
        )
      ]);
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ MongoDB bağlantı durumu: ${mongoConnected} (${elapsed}ms)`);
    } else {
      console.log('⚠️ mongoConnectionPromise bulunamadı - local development mode');
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
  
  console.log('🚀 app.listen() çağrılıyor...');
  console.log(`📍 Dinlenecek PORT: ${PORT}`);
  console.log(`📍 Dinlenecek HOST: 0.0.0.0`);
  
  // Server'ı başlat - Port çakışması durumunda otomatik alternatif port dene
  const HOST = '0.0.0.0';
  let currentPort = parseInt(PORT);
  const maxPortAttempts = 10; // Maksimum 10 port dene
  let portFound = false;
  
  // Port bulma fonksiyonu
  const tryStartServer = (port) => {
    return new Promise((resolve, reject) => {
      const testServer = app.listen(port, HOST, () => {
        // Port başarıyla dinleniyor
        server = testServer;
        resolve(port);
      });
      
      testServer.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          testServer.close();
          reject(new Error('PORT_IN_USE'));
        } else {
          testServer.close();
          reject(error);
        }
      });
    });
  };
  
  // Portları dene
  for (let attempt = 0; attempt < maxPortAttempts; attempt++) {
    try {
      const usedPort = await tryStartServer(currentPort);
      portFound = true;
      currentPort = usedPort;
      break;
    } catch (error) {
      if (error.message === 'PORT_IN_USE') {
        if (attempt < maxPortAttempts - 1) {
          console.log(`⚠️ Port ${currentPort} kullanımda, ${currentPort + 1} deneniyor...`);
          currentPort++;
        } else {
          console.error(`❌ ${maxPortAttempts} port denendi ama hiçbiri kullanılabilir değil!`);
          process.exit(1);
        }
      } else {
        console.error('❌ Kritik hata - app.listen() çağrısı başarısız:', error);
        process.exit(1);
      }
    }
  }
  
  if (!portFound) {
    console.error(`❌ Port bulunamadı!`);
    process.exit(1);
  }
  
  // Port başarıyla bulundu ve server başlatıldı
  if (currentPort !== parseInt(PORT)) {
    console.log(`✅ Port ${PORT} kullanımdaydı, alternatif port ${currentPort} kullanılıyor`);
  }
  
  console.log(`\n🚀 Canga Vardiya Sistemi çalışıyor!${mongoConnected ? '' : ' (MongoDB olmadan)'}`);
  console.log(`📍 Port: ${currentPort}`);
  console.log(`📍 Host: ${HOST}`);
  console.log(`🌐 URL: http://localhost:${currentPort}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  MongoDB: ${mongoConnected ? '✅ Bağlandı' : '❌ Bağlantı başarısız'}`);
  console.log(`📝 Logs: ./logs/`);
  
  // Cron job'ları başlat
  if (mongoConnected) {
    try {
      const cronJobs = require('./services/cronJobs');
      cronJobs.startAllJobs();
      console.log(`⏰ Cron jobs: ✅ Başlatıldı`);
    } catch (cronError) {
      console.error('⚠️ Cron job başlatma hatası:', cronError.message);
    }
  }
  
  console.log(`\n${mongoConnected ? '✅ Sistem hazır' : '⚠️  Sistem kısmi olarak hazır'} - API endpoints aktif!\n`);
};

// Server'ı başlat
console.log('📌 index.js son satır: startServer() çağrılıyor...');
console.log('📌 Ortam: NODE_ENV=' + (process.env.NODE_ENV || 'development'));
console.log('📌 PORT=' + (process.env.PORT || '5001'));

// Render için: Hemen server'ı başlat, MongoDB'yi bekle
startServer().catch((error) => {
  console.error('❌ FATAL: startServer() fonksiyonu hata verdi:', error);
  console.error('❌ Stack:', error.stack);
  // Production'da crash olsa bile port dinlemeyi dene
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Yine de server başlatılmaya çalışılıyor...');
    try {
      const fallbackPort = process.env.PORT || 5001;
      app.listen(fallbackPort, '0.0.0.0', () => {
        console.log(`🚨 FALLBACK: Server ${fallbackPort} portunda çalışıyor (limited functionality)`);
      });
    } catch (e) {
      console.error('❌ Fallback server da başlatılamadı:', e);
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
});

module.exports = app;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Redis bağlantısını başlat
const { cacheManager } = require('./config/redis');

const app = express();
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

// MongoDB bağlantısı - Geliştirme için localhost kullan
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga';

console.log('📍 MongoDB bağlantı adresi:', mongoURI.replace(/\/\/.*@/, '//***:***@'));

// 🚀 Database optimization ve indexing
const createDatabaseIndexes = async () => {
  try {
    console.log('🔧 Creating database indexes for performance...');

    // Employee indexes for faster queries
    await require('./models/Employee').collection.createIndex({ 
      status: 1, 
      department: 1 
    }, { name: 'employee_status_dept_idx' });

    await require('./models/Employee').collection.createIndex({ 
      location: 1, 
      status: 1 
    }, { name: 'employee_location_status_idx' });

    await require('./models/Employee').collection.createIndex({ 
      fullName: 'text', 
      firstName: 'text', 
      lastName: 'text',
      employeeId: 'text' 
    }, { name: 'employee_search_idx' });

    // Shift indexes for faster queries
    await require('./models/Shift').collection.createIndex({ 
      status: 1, 
      location: 1 
    }, { name: 'shift_status_location_idx' });

    await require('./models/Shift').collection.createIndex({ 
      startDate: 1, 
      endDate: 1 
    }, { name: 'shift_dates_idx' });

    await require('./models/Shift').collection.createIndex({ 
      createdAt: -1 
    }, { name: 'shift_created_idx' });

    // User indexes
    await require('./models/User').collection.createIndex({ 
      email: 1 
    }, { unique: true, name: 'user_email_unique_idx' });

    // General performance indexes
    await require('./models/Notification').collection.createIndex({ 
      createdAt: -1 
    }, { name: 'notification_created_idx' });

    await require('./models/SystemLog').collection.createIndex({ 
      timestamp: -1 
    }, { name: 'system_log_timestamp_idx' });

    console.log('✅ Database indexes created successfully!');
  } catch (error) {
    console.warn('⚠️ Index creation warning (may already exist):', error.message);
  }
};

// MongoDB Atlas bağlantısı - Gelişmiş konfigürasyon
mongoose.connect(mongoURI, {
  bufferCommands: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(async () => {
    console.log('✅ MongoDB Atlas connected successfully');
    
    // 🚀 Performance optimization
    await createDatabaseIndexes();
    
    // Connection pool optimization
    mongoose.connection.db.admin().command({ 
      setParameter: 1, 
      maxTimeMSForReadOperations: 30000  // 30 second timeout
    }).catch(err => console.log('Connection optimization note:', err.message));
    
    // 🔥 Start cache warming after database is ready
    setTimeout(async () => {
      await warmupCache();
    }, 2000); // 2 saniye bekle, database tamamen hazır olsun
    
    console.log('📊 Database ready for high-performance queries!');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('💡 MongoDB bağlantı detayları:', {
      uri: mongoURI ? mongoURI.replace(/\/\/.*@/, '//***:***@') : 'undefined',
      nodeEnv: process.env.NODE_ENV,
      error: err.message
    });
    process.exit(1);
  });

// Routes - API endpoints
app.use('/api/employees', require('./routes/employees'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/excel', require('./routes/excel'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/services', require('./routes/services')); // Servis sistemi
app.use('/api/notifications', require('./routes/notifications')); // Bildirim sistemi
app.use('/api/users', require('./routes/users')); // Kullanıcı yönetim sistemi
app.use('/api/database', require('./routes/database')); // MongoDB Veritabanı Yönetimi
app.use('/api/calendar', require('./routes/calendar')); // Takvim/Ajanda sistemi
app.use('/api/scheduled-lists', require('./routes/scheduledLists')); // 📅 Otomatik Liste Sistemi
app.use('/api/analytics', require('./routes/analytics')); // 📊 Analytics & Raporlama
app.use('/api/ai-analysis', require('./routes/aiAnalysis')); // 🤖 AI Veri Analizi
app.use('/api/annual-leave', require('./routes/annualLeave')); // 📆 Yıllık İzin Takip Sistemi
app.use('/api/job-applications', require('./routes/jobApplications')); // 🏢 İş Başvuruları Yönetimi
app.use('/api/form-structure', require('./routes/formStructure')); // 🎨 Form Yapısı Yönetimi

// 🔥 Cache warming function
const warmupCache = async () => {
  try {
    console.log('🔥 Starting cache warmup...');
    
    // Employee stats cache warmup
    const Employee = require('./models/Employee');
    const employeeStats = await Employee.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          aktif: { $sum: { $cond: [{ $eq: ['$durum', 'AKTIF'] }, 1, 0] } }
        }
      }
    ]);
    
    if (employeeStats.length > 0) {
      await cacheManager.set('employee_stats:overview', employeeStats[0], 600);
      console.log('✅ Employee stats cached');
    }
    
    // Department and location stats cache warmup
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
    
    if (filterStats.length > 0) {
      await cacheManager.set('employee_stats:filters', {
        departments: filterStats[0].departments || [],
        locations: filterStats[0].locations || []
      }, 300);
      console.log('✅ Filter stats cached');
    }
    
    console.log('🔥 Cache warmup completed successfully!');
  } catch (error) {
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
    
    res.status(200).json({
      status: 'OK',
      message: 'Canga Vardiya Sistemi API çalışıyor! 🚀',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        mongodb: mongoStatus,
        redis: redisStatus === 'connected' ? 'connected' : 'disconnected',
        cache: 'active'
      },
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  } catch (error) {
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

// Hata yakalama middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Hatası:', error);
  res.status(500).json({
    message: 'Sunucu hatası oluştu',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Bir hata oluştu'
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
🚀 Canga Vardiya Sistemi Backend çalışıyor!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📝 API Docs: http://localhost:${PORT}/
🔧 Health Check: http://localhost:${PORT}/api/health
🔗 MongoDB: ✅ Connected and Ready
    `);
  });
});

// Fallback - 15 saniye sonra yine de başlat (timeout için)
setTimeout(() => {
  if (!server) {
    console.log('⚠️ MongoDB timeout - Server fallback mode başlatılıyor...');
    server = app.listen(PORT, () => {
      console.log(`
🚀 Canga Backend (Fallback Mode)
📡 Port: ${PORT}
⚠️ MongoDB: Bağlantı bekleniyor...
      `);
    });
  }
}, 15000);

module.exports = app;
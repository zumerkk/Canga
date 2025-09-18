const { cacheManager, createCacheKey } = require('../config/redis');

// Cache middleware factory
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 3600, // 1 saat default
    keyGenerator = null,
    skipCache = false,
    invalidatePatterns = []
  } = options;

  return async (req, res, next) => {
    // Cache'i atla
    if (skipCache || req.method !== 'GET') {
      return next();
    }

    try {
      // Cache key oluştur
      let cacheKey;
      if (keyGenerator && typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        // Default key generator
        const baseKey = req.route.path.replace(/[^a-zA-Z0-9]/g, '_');
        const queryString = Object.keys(req.query).length > 0 
          ? JSON.stringify(req.query) 
          : '';
        cacheKey = createCacheKey('api', baseKey, Buffer.from(queryString).toString('base64'));
      }

      // Cache'den veri al
      const cachedData = await cacheManager.get(cacheKey);
      
      if (cachedData) {
        console.log(`🎯 Cache hit: ${cacheKey}`);
        return res.json({
          ...cachedData,
          _cached: true,
          _cacheKey: cacheKey
        });
      }

      console.log(`💾 Cache miss: ${cacheKey}`);

      // Response'u intercept et
      const originalJson = res.json;
      res.json = function(data) {
        // Sadece başarılı response'ları cache'le
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheManager.set(cacheKey, data, ttl)
            .then(() => console.log(`✅ Cached: ${cacheKey}`))
            .catch(err => console.error('Cache save hatası:', err));
        }
        
        // Original response'u gönder
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware hatası:', error);
      next(); // Cache hatası olsa bile devam et
    }
  };
};

// Specific cache middleware'ler
const employeeCache = cacheMiddleware({
  ttl: 1800, // 30 dakika
  keyGenerator: (req) => {
    const { page, limit, search, department, status } = req.query;
    return createCacheKey('employees', page || '1', limit || '10', search || '', department || '', status || '');
  }
});

const shiftCache = cacheMiddleware({
  ttl: 900, // 15 dakika
  keyGenerator: (req) => {
    const { startDate, endDate, location, status } = req.query;
    return createCacheKey('shifts', startDate || '', endDate || '', location || '', status || '');
  }
});

const dashboardCache = cacheMiddleware({
  ttl: 600, // 10 dakika
  keyGenerator: (req) => {
    const { period, department } = req.query;
    return createCacheKey('dashboard', period || 'week', department || 'all');
  }
});

const analyticsCache = cacheMiddleware({
  ttl: 3600, // 1 saat
  keyGenerator: (req) => {
    const { startDate, endDate, type } = req.query;
    return createCacheKey('analytics', type || 'general', startDate || '', endDate || '');
  }
});

// Cache invalidation middleware
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    // Response'u intercept et
    const originalJson = res.json;
    const originalSend = res.send;
    
    const handleResponse = function(data) {
      // Sadece başarılı response'larda cache'i invalidate et
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const { invalidateCache: invalidateCacheHelper } = require('../config/redis');
        invalidateCacheHelper(patterns)
          .catch(err => console.error('Cache invalidation hatası:', err));
      }
      return data;
    };

    res.json = function(data) {
      handleResponse(data);
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      handleResponse(data);
      return originalSend.call(this, data);
    };

    next();
  };
};

// Cache warming - Sık kullanılan verileri önceden cache'le
const warmCache = async () => {
  try {
    console.log('🔥 Cache warming başlatılıyor...');
    
    // Burada sık kullanılan endpoint'leri çağırarak cache'i doldurabilirsiniz
    // Örnek: Dashboard verileri, aktif çalışanlar, etc.
    
    console.log('✅ Cache warming tamamlandı');
  } catch (error) {
    console.error('Cache warming hatası:', error);
  }
};

// Cache health check
const cacheHealthCheck = async () => {
  try {
    const testKey = createCacheKey('health', 'test');
    await cacheManager.set(testKey, { status: 'ok' }, 60);
    const result = await cacheManager.get(testKey);
    await cacheManager.del(testKey);
    
    return result && result.status === 'ok';
  } catch (error) {
    console.error('Cache health check hatası:', error);
    return false;
  }
};

module.exports = {
  cacheMiddleware,
  employeeCache,
  shiftCache,
  dashboardCache,
  analyticsCache,
  invalidateCache,
  warmCache,
  cacheHealthCheck
};
const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

// Redis konfigürasyonu
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: false, // ✅ Otomatik bağlantı etkin
  keepAlive: 30000,
  connectTimeout: 5000, // ✅ 10s -> 5s (daha hızlı timeout)
  commandTimeout: 3000, // ✅ 5s -> 3s
  enableOfflineQueue: false,
  reconnectOnError: null,
  retryStrategy: (times) => {
    // ✅ 3 denemeden sonra bağlantıyı kes
    if (times > 3) {
      console.log('⚠️ Redis bağlantısı başarısız, cache devre dışı');
      return null; // Bağlantıyı kes
    }
    return Math.min(times * 50, 2000); // Retry delay
  }
};

// Redis client oluştur - Eğer Redis yoksa sistem çalışmaya devam edecek
let redis;
let redisAvailable = false;

try {
  redis = new Redis(redisConfig);
  
  // Redis bağlantısını kontrol et
  redis.on('ready', () => {
    redisAvailable = true;
    console.log('✅ Redis hazır ve bağlandı');
  });
  
  redis.on('error', (err) => {
    redisAvailable = false;
    // Sadece critical hataları logla (connection hatalarını değil)
    if (!err.message.includes('ECONNREFUSED') && !err.message.includes('ETIMEDOUT')) {
      console.log('⚠️ Redis hatası:', err.message);
    }
  });

  redis.on('close', () => {
    redisAvailable = false;
    console.log('⚠️ Redis bağlantısı kapandı, cache devre dışı');
  });

  // ✅ Redis bağlantısı başarısız olursa sessizce ignore et
  redis.on('connect', () => {
    console.log('🔄 Redis bağlantısı kuruluyor...');
  });

} catch (error) {
  console.log('⚠️ Redis başlatılamadı, sistem cache olmadan çalışacak:', error.message);
  redis = null;
}


// Cache helper fonksiyonları
class CacheManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.defaultTTL = 3600; // 1 saat
  }

  // Cache'e veri kaydet
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.redis || !redisAvailable) {
      return false; // Redis yoksa false dön
    }
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set hatası:', error);
      return false;
    }
  }

  // Cache'den veri al
  async get(key) {
    if (!this.redis || !redisAvailable) {
      return null; // Redis yoksa null dön
    }
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get hatası:', error);
      return null;
    }
  }

  // Cache'den veri sil
  async del(key) {
    if (!this.redis || !redisAvailable) {
      return false;
    }
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete hatası:', error);
      return false;
    }
  }

  // Pattern ile cache temizle
  async delPattern(pattern) {
    if (!this.redis || !redisAvailable) {
      return false;
    }
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache pattern delete hatası:', error);
      return false;
    }
  }

  // Cache'in var olup olmadığını kontrol et
  async exists(key) {
    if (!this.redis || !redisAvailable) {
      return false;
    }
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists hatası:', error);
      return false;
    }
  }

  // TTL ayarla
  async expire(key, ttl) {
    if (!this.redis || !redisAvailable) {
      return false;
    }
    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache expire hatası:', error);
      return false;
    }
  }

  // Cache istatistikleri
  async getStats() {
    if (!this.redis || !redisAvailable) {
      return null;
    }
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      return {
        memory: info,
        keyspace: keyspace
      };
    } catch (error) {
      console.error('Cache stats hatası:', error);
      return null;
    }
  }

  // Cache temizle
  async flush() {
    if (!this.redis || !redisAvailable) {
      return false;
    }
    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush hatası:', error);
      return false;
    }
  }
}

// Cache manager instance
const cacheManager = new CacheManager(redis);

// Cache key oluşturucu
const createCacheKey = (prefix, ...parts) => {
  return `canga:${prefix}:${parts.join(':')}`;
};

// Cache invalidation helper
const invalidateCache = async (patterns) => {
  try {
    // String ise array'e çevir
    const patternArray = Array.isArray(patterns) ? patterns : [patterns];
    for (const pattern of patternArray) {
      await cacheManager.delPattern(pattern);
    }
    console.log('🗑️ Cache invalidated:', patternArray);
  } catch (error) {
    console.error('Cache invalidation hatası:', error);
  }
};

module.exports = {
  redis,
  cacheManager,
  createCacheKey,
  invalidateCache
};
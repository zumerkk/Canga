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
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000
};

// Redis client oluştur
const redis = new Redis(redisConfig);

// Bağlantı event'leri
redis.on('connect', () => {
  console.log('🔗 Redis bağlantısı kuruldu');
});

redis.on('ready', () => {
  console.log('✅ Redis hazır');
});

redis.on('error', (err) => {
  console.error('❌ Redis hatası:', err.message);
});

redis.on('close', () => {
  console.log('🔌 Redis bağlantısı kapandı');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis yeniden bağlanıyor...');
});

// Cache helper fonksiyonları
class CacheManager {
  constructor(redisClient) {
    this.redis = redisClient;
    this.defaultTTL = 3600; // 1 saat
  }

  // Cache'e veri kaydet
  async set(key, value, ttl = this.defaultTTL) {
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
    for (const pattern of patterns) {
      await cacheManager.delPattern(pattern);
    }
    console.log('🗑️ Cache invalidated:', patterns);
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
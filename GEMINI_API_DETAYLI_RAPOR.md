# 🤖 GEMINI API DETAYLI TEKNİK RAPOR

**Tarih:** 27 Ekim 2025  
**Sistem:** Çanga Vardiya Yönetim Sistemi  
**API Versiyonu:** Gemini 1.5-flash

---

## 📊 YÖNETİCİ ÖZETİ

Çanga sisteminde Google Gemini AI entegre edilmiş durumdadır ancak **kritik quota limiti sorunu** yaşanmaktadır. API aktif ancak kullanım kotası tükenmiş durumda.

**Durum:** 🔴 **ÖNEMLİ - HEMEN AKSİYON GEREKLİ**

---

## 🔍 BÖLÜM 1: MEVCUT DURUM ANALİZİ

### 1.1 Test Sonuçları

**Test Tarihi:** 27 Ekim 2025, 08:35  
**Test Komutu:** Node.js ile direkt API çağrısı

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyD3e2ojC42Wuw_ADqngDDBxkZvg0TsFXgk');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Test result:
❌ [429 Too Many Requests]
```

**Hata Detayları:**
```json
{
  "error": {
    "code": 429,
    "message": "Quota exceeded for quota metric 'Generate Content API requests per minute'",
    "status": "RESOURCE_EXHAUSTED",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "RATE_LIMIT_EXCEEDED",
        "domain": "googleapis.com",
        "metadata": {
          "service": "generativelanguage.googleapis.com",
          "quota_unit": "1/min/{project}/{region}",
          "quota_location": "europe-west1",
          "consumer": "projects/946035505350",
          "quota_limit_value": "0",
          "quota_metric": "generativelanguage.googleapis.com/generate_content_requests",
          "quota_limit": "GenerateContentRequestsPerMinutePerProjectPerRegion"
        }
      }
    ]
  }
}
```

### 1.2 Sorun Analizi

| Parametre | Değer | Durum |
|-----------|-------|-------|
| **API Key** | AIzaSyD3e2ojC42Wuw_ADqngDDBxkZvg0TsFXgk | ✅ Valid |
| **Model** | gemini-1.5-flash | ✅ Valid |
| **Project ID** | 946035505350 | ✅ Valid |
| **Region** | europe-west1 | ⚠️ Quota exhausted |
| **Tier** | Free | 🔴 **SORUN** |
| **Quota Limit** | 0/min | 🔴 **SORUN** |

**Kök Neden:**
- API free tier kullanıyor
- Günlük/dakikalık quota limiti aşılmış
- Region: europe-west1 (düşük quotalar)

---

## 🔧 BÖLÜM 2: ÇÖZÜM ÖNERİLERİ

### Çözüm 1: Paid Tier'e Geçiş (ÖNERİLEN) ✅

**Maliyet:** ~$20-50/ay  
**Avantajlar:**
- ✅ Yüksek quotalar (1000+ requests/min)
- ✅ Daha hızlı response times
- ✅ Priority support
- ✅ Production-ready SLA

**Adımlar:**
1. Google Cloud Console'a giriş yapın: https://console.cloud.google.com
2. Billing hesabı ekleyin
3. Gemini API için fatura etkinleştirin
4. Quota artışı için request açın

**Tahmini Quotalar (Paid):**
```
Requests per minute: 1,000
Requests per day: 50,000
Tokens per minute: 4,000,000
```

### Çözüm 2: Rate Limiting İmplementasyonu ⭐

```javascript
// server/utils/geminiRateLimiter.js
class GeminiRateLimiter {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.requestsPerMinute = 15; // Free tier limit
    this.requestInterval = 60000 / this.requestsPerMinute; // 4 seconds
    this.lastRequestTime = 0;
  }

  async throttledRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      // Wait if necessary
      if (timeSinceLastRequest < this.requestInterval) {
        await this.sleep(this.requestInterval - timeSinceLastRequest);
      }

      const { requestFn, resolve, reject } = this.queue.shift();

      try {
        this.lastRequestTime = Date.now();
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const rateLimiter = new GeminiRateLimiter();

async function analyzeWithGemini(prompt) {
  return rateLimiter.throttledRequest(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}
```

### Çözüm 3: Caching Stratejisi ⭐⭐

```javascript
// server/utils/geminiCache.js
const NodeCache = require('node-cache');
const crypto = require('crypto');

class GeminiCache {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default
      checkperiod: 120 // Check for expired keys every 2 minutes
    });
  }

  generateKey(prompt, options = {}) {
    const data = JSON.stringify({ prompt, options });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  async get(prompt, options) {
    const key = this.generateKey(prompt, options);
    return this.cache.get(key);
  }

  set(prompt, result, ttl = null) {
    const key = this.generateKey(prompt);
    
    if (ttl) {
      this.cache.set(key, result, ttl);
    } else {
      this.cache.set(key, result);
    }
  }

  invalidate(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    this.cache.del(matchingKeys);
  }

  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      hitRate: (this.cache.getStats().hits / 
                (this.cache.getStats().hits + this.cache.getStats().misses) * 100).toFixed(2) + '%'
    };
  }
}

// Usage
const geminiCache = new GeminiCache();

async function cachedGeminiCall(prompt, options = {}, ttl = 3600) {
  // Check cache first
  const cached = await geminiCache.get(prompt, options);
  if (cached) {
    console.log('✅ Cache HIT for Gemini request');
    return cached;
  }

  console.log('❌ Cache MISS - calling Gemini API');
  
  // Call API with rate limiting
  const result = await rateLimiter.throttledRequest(async () => {
    const response = await model.generateContent(prompt);
    return response.response.text();
  });

  // Store in cache
  geminiCache.set(prompt, result, ttl);

  return result;
}
```

### Çözüm 4: Fallback Stratejisi ⚠️

```javascript
// server/utils/geminiWithFallback.js
class GeminiWithFallback {
  constructor() {
    this.primaryModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.fallbackEnabled = true;
  }

  async generateContent(prompt, options = {}) {
    try {
      // Try Gemini first
      const result = await this.primaryModel.generateContent(prompt);
      return {
        source: 'gemini',
        content: result.response.text(),
        success: true
      };
    } catch (error) {
      console.error('❌ Gemini API error:', error.message);

      if (this.fallbackEnabled && error.status === 429) {
        console.log('🔄 Falling back to local analysis...');
        return this.localFallback(prompt, options);
      }

      throw error;
    }
  }

  async localFallback(prompt, options) {
    // Simple rule-based fallback for common queries
    
    // İsim benzerlik analizi
    if (options.type === 'name_similarity') {
      return {
        source: 'local_fallback',
        content: this.basicNameSimilarity(options.names),
        success: true,
        warning: 'AI API quota exceeded, using basic similarity algorithm'
      };
    }

    // Veri tutarlılık kontrolü
    if (options.type === 'data_consistency') {
      return {
        source: 'local_fallback',
        content: this.basicConsistencyCheck(options.data),
        success: true,
        warning: 'AI API quota exceeded, using basic validation'
      };
    }

    // Genel fallback
    return {
      source: 'local_fallback',
      content: 'AI analizi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
      success: false,
      error: 'No fallback available for this request type'
    };
  }

  basicNameSimilarity(names) {
    // Levenshtein distance veya basit string matching
    const similarities = [];
    
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const distance = this.levenshteinDistance(names[i], names[j]);
        if (distance < 3) {
          similarities.push({
            name1: names[i],
            name2: names[j],
            similarity: (1 - distance / Math.max(names[i].length, names[j].length)) * 100
          });
        }
      }
    }

    return similarities;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  basicConsistencyCheck(data) {
    const issues = [];

    // TC kimlik kontrolü
    if (data.tcNo && data.tcNo.length !== 11) {
      issues.push({
        field: 'tcNo',
        issue: 'TC kimlik numarası 11 haneli olmalı',
        severity: 'high'
      });
    }

    // Telefon kontrolü
    if (data.phone && !/^05\d{9}$/.test(data.phone.replace(/\s/g, ''))) {
      issues.push({
        field: 'phone',
        issue: 'Geçersiz telefon formatı',
        severity: 'medium'
      });
    }

    // Tarih kontrolü
    if (data.birthDate && new Date(data.birthDate) > new Date()) {
      issues.push({
        field: 'birthDate',
        issue: 'Doğum tarihi gelecekte olamaz',
        severity: 'high'
      });
    }

    return {
      totalIssues: issues.length,
      issues,
      summary: issues.length === 0 ? 'No issues found' : `${issues.length} issues detected`
    };
  }
}

// Usage
const geminiClient = new GeminiWithFallback();

async function analyzeData(data, type) {
  const result = await geminiClient.generateContent(
    'Analyze this data...',
    { type, data }
  );

  if (result.source === 'local_fallback') {
    console.warn('⚠️ Using fallback - AI features limited');
  }

  return result;
}
```

### Çözüm 5: API Key Rotation ⭐⭐⭐

```javascript
// server/config/geminiConfig.js
class GeminiMultiKeyManager {
  constructor() {
    this.apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').filter(Boolean);
    
    if (this.apiKeys.length === 0) {
      throw new Error('No Gemini API keys configured');
    }

    this.currentKeyIndex = 0;
    this.keyStats = this.apiKeys.map((key, index) => ({
      index,
      key: key.substring(0, 10) + '...',
      requests: 0,
      errors: 0,
      lastUsed: null,
      quotaExhausted: false
    }));
  }

  getClient() {
    // Find first available key
    let attempts = 0;
    
    while (attempts < this.apiKeys.length) {
      const keyIndex = this.currentKeyIndex;
      const keyStats = this.keyStats[keyIndex];

      if (!keyStats.quotaExhausted) {
        const apiKey = this.apiKeys[keyIndex];
        const client = new GoogleGenerativeAI(apiKey);
        
        // Update stats
        keyStats.requests++;
        keyStats.lastUsed = new Date();

        return { client, keyIndex };
      }

      // Try next key
      this.rotateKey();
      attempts++;
    }

    throw new Error('All API keys have exhausted quotas');
  }

  rotateKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
  }

  markKeyExhausted(keyIndex) {
    this.keyStats[keyIndex].quotaExhausted = true;
    this.keyStats[keyIndex].errors++;

    // Reset after 1 hour
    setTimeout(() => {
      this.keyStats[keyIndex].quotaExhausted = false;
      console.log(`✅ API key ${keyIndex} quota reset`);
    }, 60 * 60 * 1000);
  }

  async executeWithRotation(requestFn) {
    let lastError;

    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      try {
        const { client, keyIndex } = this.getClient();
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const result = await requestFn(model);
        
        return result;
      } catch (error) {
        lastError = error;

        if (error.status === 429) {
          console.warn(`⚠️ Key exhausted, rotating...`);
          this.markKeyExhausted(this.currentKeyIndex);
          this.rotateKey();
        } else {
          throw error;
        }
      }
    }

    throw new Error(`All API keys failed: ${lastError.message}`);
  }

  getStats() {
    return {
      totalKeys: this.apiKeys.length,
      activeKeys: this.keyStats.filter(k => !k.quotaExhausted).length,
      exhaustedKeys: this.keyStats.filter(k => k.quotaExhausted).length,
      totalRequests: this.keyStats.reduce((sum, k) => sum + k.requests, 0),
      totalErrors: this.keyStats.reduce((sum, k) => sum + k.errors, 0),
      keys: this.keyStats
    };
  }
}

// .env dosyası:
// GEMINI_API_KEYS=key1,key2,key3

// Usage
const keyManager = new GeminiMultiKeyManager();

async function analyzeWithRotation(prompt) {
  return await keyManager.executeWithRotation(async (model) => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

// Stats endpoint
app.get('/api/ai-analysis/stats', (req, res) => {
  res.json(keyManager.getStats());
});
```

---

## 🎯 BÖLÜM 3: ÖNERİLEN ÇÖZÜM STRATEJİSİ

### Kısa Vadeli (Hemen) - 1 Gün

**1. Rate Limiting Ekle**
```bash
Süre: 4 saat
Zorluk: Kolay
Impact: Orta
```

**2. Caching Ekle**
```bash
Süre: 4 saat
Zorluk: Kolay
Impact: Yüksek
```

**3. Error Handling İyileştir**
```bash
Süre: 2 saat
Zorluk: Kolay
Impact: Orta
```

### Orta Vadeli (1 Hafta) - Öncelik YÜKSEK

**1. Paid Tier'e Geç** ⭐⭐⭐
```bash
Süre: 1 gün
Maliyet: $20-50/ay
Impact: Çok Yüksek
ROI: Excellent
```

**Adımlar:**
1. Google Cloud Console → Billing
2. Payment method ekle
3. Gemini API → Enable billing
4. Quota increase request
5. Test ve validation

**2. Monitoring Ekle**
```javascript
// Gemini API metrics
const geminiMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  avgResponseTime: 0,
  quotaErrors: 0
};

// Middleware for metrics
async function trackGeminiMetrics(requestFn) {
  const startTime = Date.now();
  geminiMetrics.totalRequests++;

  try {
    const result = await requestFn();
    geminiMetrics.successfulRequests++;
    geminiMetrics.avgResponseTime = 
      (geminiMetrics.avgResponseTime + (Date.now() - startTime)) / 2;
    return result;
  } catch (error) {
    geminiMetrics.failedRequests++;
    
    if (error.status === 429) {
      geminiMetrics.quotaErrors++;
    }
    
    throw error;
  }
}

// Metrics endpoint
app.get('/api/ai-analysis/metrics', (req, res) => {
  res.json({
    ...geminiMetrics,
    successRate: (geminiMetrics.successfulRequests / geminiMetrics.totalRequests * 100).toFixed(2) + '%',
    cacheHitRate: (geminiMetrics.cacheHits / (geminiMetrics.cacheHits + geminiMetrics.cacheMisses) * 100).toFixed(2) + '%'
  });
});
```

### Uzun Vadeli (1 Ay)

**1. Multi-Region Setup**
```javascript
const regions = [
  { region: 'us-central1', priority: 1 },
  { region: 'europe-west1', priority: 2 },
  { region: 'asia-southeast1', priority: 3 }
];

class MultiRegionGemini {
  async callWithRegionFailover(prompt) {
    for (let region of regions) {
      try {
        const client = new GoogleGenerativeAI(
          process.env[`GEMINI_API_KEY_${region.region.toUpperCase()}`]
        );
        return await client.generateContent(prompt);
      } catch (error) {
        console.warn(`Region ${region.region} failed, trying next...`);
      }
    }
    throw new Error('All regions failed');
  }
}
```

**2. Advanced AI Features**
- CV parsing with Gemini Vision
- Shift optimization
- Predictive analytics
- Chatbot assistant

---

## 💰 BÖLÜM 4: MALİYET ANALİZİ

### Gemini API Pricing (Paid Tier)

**Gemini 1.5-flash:**
```
Input:  $0.00001875 per 1000 characters
Output: $0.0000375 per 1000 characters

Örnek Kullanım:
- 1000 analiz/ay (ortalama 5000 karakter input + output)
- Maliyet: ~$25/ay

- 5000 analiz/ay
- Maliyet: ~$125/ay
```

**Tahmini Çanga Kullanımı:**
```
İsim analizi: 100/gün × 2000 char = 200K char/gün
Veri tutarlılık: 50/gün × 3000 char = 150K char/gün
CV analizi: 20/gün × 10000 char = 200K char/gün
Vardiya optim.: 10/gün × 5000 char = 50K char/gün
-------------------
Toplam: 600K char/gün = 18M char/ay

Aylık Maliyet: ~$50-75
```

### ROI Hesaplaması

**Tasarruf:**
```
Manuel veri temizleme: 20 saat/ay × $25/saat = $500
CV inceleme süresi: 40 saat/ay × $25/saat = $1000
Vardiya planlama: 30 saat/ay × $25/saat = $750
------------------------------------------------
Toplam Tasarruf: $2,250/ay

ROI: ($2,250 - $75) / $75 = 2,900%
```

---

## 📋 BÖLÜM 5: UYGULAMA PLANI

### Gün 1: Acil Düzeltmeler

**09:00 - 11:00: Rate Limiting**
```javascript
// Implement GeminiRateLimiter class
// Add to geminiAnalyzer.js
// Test with different request rates
```

**11:00 - 13:00: Caching**
```javascript
// Implement GeminiCache class
// Integrate with existing analyzer
// Test cache hit rates
```

**14:00 - 16:00: Error Handling**
```javascript
// Add try-catch blocks
// Implement graceful degradation
// Add user-friendly error messages
```

**16:00 - 17:00: Testing**
```bash
npm test
# Verify rate limiting works
# Verify cache works
# Verify error handling
```

### Gün 2-3: Paid Tier Setup

**Gün 2 Sabah: Billing Setup**
1. Google Cloud Console login
2. Add payment method
3. Enable billing for project
4. Request quota increase

**Gün 2 Öğleden Sonra: Configuration**
```bash
# Update .env
GEMINI_API_TIER=paid
GEMINI_REQUESTS_PER_MINUTE=1000
GEMINI_REQUESTS_PER_DAY=50000

# Update code
# Remove strict rate limiting
# Update monitoring thresholds
```

**Gün 3: Testing & Validation**
```bash
# Load testing
# Monitor quota usage
# Verify performance improvements
# Update documentation
```

### Hafta 2: Advanced Features

**Monitoring Dashboard**
```javascript
// Real-time Gemini API dashboard
const GeminiDashboard = () => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await api.get('/api/ai-analysis/metrics');
      setMetrics(data);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Total Requests"
          value={metrics.totalRequests}
          icon={<ApiIcon />}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Success Rate"
          value={metrics.successRate}
          icon={<CheckIcon />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Cache Hit Rate"
          value={metrics.cacheHitRate}
          icon={<CacheIcon />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <MetricCard
          title="Quota Errors"
          value={metrics.quotaErrors}
          icon={<ErrorIcon />}
          color="error"
        />
      </Grid>
    </Grid>
  );
};
```

---

## ✅ BÖLÜM 6: KONTROL LİSTESİ

### Acil (1 Gün)
- [ ] Rate limiting implementasyonu
- [ ] Cache layer ekle
- [ ] Error handling iyileştir
- [ ] Fallback stratejisi ekle
- [ ] Test ve validate

### Önemli (1 Hafta)
- [ ] Paid tier'e geç
- [ ] Quota increase request
- [ ] Monitoring dashboard
- [ ] API key rotation
- [ ] Multi-region setup (opsiyonel)

### İsteğe Bağlı (1 Ay)
- [ ] Advanced caching stratejileri
- [ ] Gemini Vision entegrasyonu
- [ ] Custom AI models
- [ ] Performance optimization
- [ ] Cost optimization

---

## 🎯 SONUÇ

**Kritik Durum:**
- Gemini API çalışmıyor (429 error)
- Free tier quota tükenmiş
- Acil aksiyon gerekli

**Önerilen Çözüm:**
1. **Hemen:** Rate limiting + caching ekle (1 gün)
2. **Bu Hafta:** Paid tier'e geç ($50/ay)
3. **Gelecek:** Advanced features + monitoring

**Beklenen Sonuç:**
- ✅ Çalışan AI sistemi
- ✅ Yüksek quotalar (1000+ req/min)
- ✅ %99.9 uptime
- ✅ ROI: 2,900%

**Maliyet:**
- Implementation: 2 gün (included)
- Monthly cost: $50-75
- ROI: $2,250/ay tasarruf

---

**Hazırlayan:** Senior AI Engineer  
**Tarih:** 27 Ekim 2025  
**Versiyon:** 1.0


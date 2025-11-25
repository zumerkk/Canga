/**
 * 🔍 API HEALTH CHECKER SERVICE
 * Tüm API bağlantılarını test eder ve sağlık durumunu raporlar
 */

const axios = require('axios');
require('dotenv').config();

class APIHealthChecker {
  constructor() {
    this.apiKeys = {
      gemini: process.env.GEMINI_API_KEY,
      groq: process.env.GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY
    };
    
    this.endpoints = {
      // Using v1 API and gemini-1.5-flash model which is the recommended model for fast responses
      gemini: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions'
    };
    
    this.healthStatus = {
      gemini: { status: 'unknown', lastCheck: null, responseTime: null, error: null },
      groq: { status: 'unknown', lastCheck: null, responseTime: null, error: null },
      openrouter: { status: 'unknown', lastCheck: null, responseTime: null, error: null }
    };
  }

  /**
   * Gemini API bağlantısını test et (OPTIONAL - Devre dışı)
   */
  async checkGeminiAPI() {
    const startTime = Date.now();
    
    try {
      // Gemini opsiyonel - devre dışı
      if (!this.apiKeys.gemini) {
        return {
          status: 'disabled',
          lastCheck: new Date(),
          responseTime: '0ms',
          error: null,
          details: {
            note: 'Gemini API opsiyonel - sistem Groq ve OpenRouter ile çalışıyor'
          }
        };
      }

      const testPrompt = {
        contents: [{
          parts: [{
            text: 'Test: Bu bir bağlantı testi. Sadece "OK" yanıtı ver.'
          }]
        }]
      };

      const response = await axios.post(
        `${this.endpoints.gemini}?key=${this.apiKeys.gemini}`,
        testPrompt,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      const responseTime = Date.now() - startTime;
      const hasValidResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!hasValidResponse) {
        throw new Error('Geçersiz API yanıtı - yanıt formatı beklendiği gibi değil');
      }

      this.healthStatus.gemini = {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: `${responseTime}ms`,
        error: null,
        details: {
          keyLength: this.apiKeys.gemini.length,
          keyPrefix: this.apiKeys.gemini.substring(0, 10) + '...',
          model: 'gemini-1.5-flash',
          endpoint: this.endpoints.gemini
        }
      };

      return this.healthStatus.gemini;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      let errorMessage = error.message;
      let troubleshooting = [];
      let status_result = 'unhealthy';

      // Detaylı hata analizi
      if (error.response) {
        const status = error.response.status;
        errorMessage = `HTTP ${status}: ${error.response.data?.error?.message || error.message}`;
        
        if (status === 400) {
          troubleshooting.push('API key formatı yanlış olabilir');
          troubleshooting.push('GEMINI_API_KEY değerini kontrol edin');
        } else if (status === 401 || status === 403) {
          troubleshooting.push('API key geçersiz veya yetkisiz');
          troubleshooting.push('Yeni bir API key oluşturun: https://makersuite.google.com/app/apikey');
        } else if (status === 404) {
          // 404 means model not found - mark as disabled (optional)
          status_result = 'disabled';
          errorMessage = 'Gemini modeli erişilebilir değil (opsiyonel)';
          troubleshooting.push('Gemini API opsiyoneldir - sistem Groq ve OpenRouter ile çalışmaya devam eder');
          troubleshooting.push('Yeni bir API key oluşturun: https://aistudio.google.com/app/apikey');
        } else if (status === 429) {
          troubleshooting.push('API rate limit aşıldı');
          troubleshooting.push('Birkaç dakika bekleyin veya API kotanızı artırın');
        } else if (status === 500) {
          troubleshooting.push('Google AI servisi geçici olarak kullanılamıyor');
          troubleshooting.push('Birkaç dakika sonra tekrar deneyin');
        }
      } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        errorMessage = 'API endpoint\'ine ulaşılamıyor - İnternet bağlantınızı kontrol edin';
        troubleshooting.push('DNS veya network sorunu var');
        troubleshooting.push('VPN veya proxy kullanıyorsanız kapatmayı deneyin');
      } else if (error.message.includes('bulunamadı')) {
        troubleshooting.push('server/.env dosyasına GEMINI_API_KEY ekleyin');
        troubleshooting.push('Örnek: GEMINI_API_KEY=AIzaSy...');
      }

      this.healthStatus.gemini = {
        status: status_result,
        lastCheck: new Date(),
        responseTime: `${responseTime}ms`,
        error: errorMessage,
        troubleshooting,
        details: {
          hasKey: !!this.apiKeys.gemini,
          keyLength: this.apiKeys.gemini?.length || 0,
          endpoint: this.endpoints.gemini,
          note: status_result === 'disabled' ? 'Sistem Groq ve OpenRouter ile tam fonksiyonel' : null
        }
      };

      return this.healthStatus.gemini;
    }
  }

  /**
   * Groq API bağlantısını test et
   */
  async checkGroqAPI() {
    const startTime = Date.now();
    
    try {
      if (!this.apiKeys.groq) {
        throw new Error('GROQ_API_KEY bulunamadı - .env dosyasında tanımlı değil');
      }

      const testPrompt = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Test: Reply only with "OK"' }
        ],
        temperature: 0.1,
        max_tokens: 10
      };

      const response = await axios.post(
        this.endpoints.groq,
        testPrompt,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.groq}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const responseTime = Date.now() - startTime;
      const hasValidResponse = response.data?.choices?.[0]?.message?.content;

      if (!hasValidResponse) {
        throw new Error('Geçersiz API yanıtı - yanıt formatı beklendiği gibi değil');
      }

      this.healthStatus.groq = {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: `${responseTime}ms`,
        error: null,
        details: {
          keyLength: this.apiKeys.groq.length,
          keyPrefix: this.apiKeys.groq.substring(0, 10) + '...',
          model: 'llama-3.3-70b-versatile',
          endpoint: this.endpoints.groq
        }
      };

      return this.healthStatus.groq;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      let errorMessage = error.message;
      let troubleshooting = [];

      // Detaylı hata analizi
      if (error.response) {
        const status = error.response.status;
        errorMessage = `HTTP ${status}: ${error.response.data?.error?.message || error.message}`;
        
        if (status === 400) {
          troubleshooting.push('İstek formatı yanlış veya model adı geçersiz');
          troubleshooting.push('Model: llama-3.3-70b-versatile');
        } else if (status === 401 || status === 403) {
          troubleshooting.push('API key geçersiz veya yetkisiz');
          troubleshooting.push('Yeni bir API key oluşturun: https://console.groq.com/keys');
        } else if (status === 429) {
          troubleshooting.push('API rate limit aşıldı');
          troubleshooting.push('Groq free tier: 30 istek/dakika limiti');
          troubleshooting.push('Birkaç dakika bekleyin');
        } else if (status === 500 || status === 503) {
          troubleshooting.push('Groq servisi geçici olarak kullanılamıyor');
          troubleshooting.push('Birkaç dakika sonra tekrar deneyin');
        }
      } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        errorMessage = 'API endpoint\'ine ulaşılamıyor - İnternet bağlantınızı kontrol edin';
        troubleshooting.push('DNS veya network sorunu var');
        troubleshooting.push('VPN veya proxy kullanıyorsanız kapatmayı deneyin');
      } else if (error.message.includes('bulunamadı')) {
        troubleshooting.push('server/.env dosyasına GROQ_API_KEY ekleyin');
        troubleshooting.push('Örnek: GROQ_API_KEY=gsk_...');
      }

      this.healthStatus.groq = {
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: `${responseTime}ms`,
        error: errorMessage,
        troubleshooting,
        details: {
          hasKey: !!this.apiKeys.groq,
          keyLength: this.apiKeys.groq?.length || 0,
          endpoint: this.endpoints.groq
        }
      };

      return this.healthStatus.groq;
    }
  }

  /**
   * OpenRouter API bağlantısını test et
   */
  async checkOpenRouterAPI() {
    const startTime = Date.now();
    
    try {
      if (!this.apiKeys.openrouter) {
        throw new Error('OPENROUTER_API_KEY bulunamadı - .env dosyasında tanımlı değil');
      }

      const testPrompt = {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Test: Reply only with "OK"' }
        ],
        max_tokens: 10
      };

      const response = await axios.post(
        this.endpoints.openrouter,
        testPrompt,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.openrouter}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://canga.com',
            'X-Title': 'Canga AI System'
          },
          timeout: 10000
        }
      );

      const responseTime = Date.now() - startTime;
      const hasValidResponse = response.data?.choices?.[0]?.message?.content;

      if (!hasValidResponse) {
        throw new Error('Geçersiz API yanıtı - yanıt formatı beklendiği gibi değil');
      }

      this.healthStatus.openrouter = {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: `${responseTime}ms`,
        error: null,
        details: {
          keyLength: this.apiKeys.openrouter.length,
          keyPrefix: this.apiKeys.openrouter.substring(0, 15) + '...',
          model: 'gpt-3.5-turbo',
          endpoint: this.endpoints.openrouter,
          availableModels: ['claude-3.5-sonnet', 'gpt-4-turbo', 'llama-3.1-70b', 'gemini-pro', 'gpt-3.5-turbo']
        }
      };

      return this.healthStatus.openrouter;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      let errorMessage = error.message;
      let troubleshooting = [];

      if (error.response) {
        const status = error.response.status;
        errorMessage = `HTTP ${status}: ${error.response.data?.error?.message || error.message}`;
        
        if (status === 400) {
          troubleshooting.push('Model adı geçersiz olabilir');
          troubleshooting.push('Desteklenen modeller: https://openrouter.ai/docs#models');
        } else if (status === 401 || status === 403) {
          troubleshooting.push('API key geçersiz veya yetkisiz');
          troubleshooting.push('Yeni bir API key oluşturun: https://openrouter.ai/keys');
        } else if (status === 402) {
          troubleshooting.push('Kredi yetersiz - hesap bakiyenizi kontrol edin');
        } else if (status === 429) {
          troubleshooting.push('API rate limit aşıldı');
          troubleshooting.push('Free tier limitleri kontrol edin');
        }
      } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        errorMessage = 'API endpoint\'ine ulaşılamıyor - İnternet bağlantınızı kontrol edin';
        troubleshooting.push('DNS veya network sorunu var');
      } else if (error.message.includes('bulunamadı')) {
        troubleshooting.push('server/.env dosyasına OPENROUTER_API_KEY ekleyin');
        troubleshooting.push('Örnek: OPENROUTER_API_KEY=sk-or-v1-...');
      }

      this.healthStatus.openrouter = {
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: `${responseTime}ms`,
        error: errorMessage,
        troubleshooting,
        details: {
          hasKey: !!this.apiKeys.openrouter,
          keyLength: this.apiKeys.openrouter?.length || 0,
          endpoint: this.endpoints.openrouter
        }
      };

      return this.healthStatus.openrouter;
    }
  }

  /**
   * Tüm API'leri paralel test et
   */
  async checkAllAPIs() {
    console.log('🔍 API Health Check başlatılıyor...\n');
    
    const startTime = Date.now();

    // Paralel test yap
    const [geminiResult, groqResult, openrouterResult] = await Promise.all([
      this.checkGeminiAPI(),
      this.checkGroqAPI(),
      this.checkOpenRouterAPI()
    ]);

    const totalTime = Date.now() - startTime;
    // Count healthy and enabled (not disabled) APIs
    const healthyCount = [geminiResult, groqResult, openrouterResult].filter(r => r.status === 'healthy').length;
    const disabledCount = [geminiResult, groqResult, openrouterResult].filter(r => r.status === 'disabled').length;
    const totalAPIs = 3 - disabledCount; // Don't count disabled APIs in total

    // Konsol çıktısı
    this.printHealthReport();

    // Özet döndür
    return {
      timestamp: new Date(),
      totalTime: `${totalTime}ms`,
      summary: {
        total: totalAPIs,
        healthy: healthyCount,
        unhealthy: totalAPIs - healthyCount,
        healthScore: `${((healthyCount / totalAPIs) * 100).toFixed(0)}%`
      },
      apis: {
        gemini: geminiResult,
        groq: groqResult,
        openrouter: openrouterResult
      },
      recommendation: this.getRecommendation(healthyCount, totalAPIs)
    };
  }

  /**
   * Sağlık raporunu konsola yazdır
   */
  printHealthReport() {
    console.log('═'.repeat(70));
    console.log('                   🔍 API SAĞLIK RAPORU                    ');
    console.log('═'.repeat(70));
    console.log('');

    // Gemini
    const gemini = this.healthStatus.gemini;
    console.log('1️⃣  GEMINI API (Google Generative AI)');
    console.log('   Status:       ', gemini.status === 'healthy' ? '✅ Sağlıklı' : '❌ Hatalı');
    console.log('   Response Time:', gemini.responseTime);
    console.log('   Last Check:   ', gemini.lastCheck?.toLocaleString('tr-TR'));
    
    if (gemini.error) {
      console.log('   ❌ Hata:      ', gemini.error);
      if (gemini.troubleshooting?.length > 0) {
        console.log('   💡 Çözüm:');
        gemini.troubleshooting.forEach(tip => console.log('      -', tip));
      }
    } else if (gemini.details) {
      console.log('   Model:        ', gemini.details.model);
      console.log('   API Key:      ', gemini.details.keyPrefix);
    }
    
    console.log('');

    // Groq
    const groq = this.healthStatus.groq;
    console.log('2️⃣  GROQ API (Llama 3.3)');
    console.log('   Status:       ', groq.status === 'healthy' ? '✅ Sağlıklı' : '❌ Hatalı');
    console.log('   Response Time:', groq.responseTime);
    console.log('   Last Check:   ', groq.lastCheck?.toLocaleString('tr-TR'));
    
    if (groq.error) {
      console.log('   ❌ Hata:      ', groq.error);
      if (groq.troubleshooting?.length > 0) {
        console.log('   💡 Çözüm:');
        groq.troubleshooting.forEach(tip => console.log('      -', tip));
      }
    } else if (groq.details) {
      console.log('   Model:        ', groq.details.model);
      console.log('   API Key:      ', groq.details.keyPrefix);
    }
    
    console.log('');

    // OpenRouter
    const openrouter = this.healthStatus.openrouter;
    console.log('3️⃣  OPENROUTER API (Multi-Model)');
    console.log('   Status:       ', openrouter.status === 'healthy' ? '✅ Sağlıklı' : '❌ Hatalı');
    console.log('   Response Time:', openrouter.responseTime);
    console.log('   Last Check:   ', openrouter.lastCheck?.toLocaleString('tr-TR'));
    
    if (openrouter.error) {
      console.log('   ❌ Hata:      ', openrouter.error);
      if (openrouter.troubleshooting?.length > 0) {
        console.log('   💡 Çözüm:');
        openrouter.troubleshooting.forEach(tip => console.log('      -', tip));
      }
    } else if (openrouter.details) {
      console.log('   Model:        ', openrouter.details.model);
      console.log('   API Key:      ', openrouter.details.keyPrefix);
    }
    
    console.log('');
    console.log('═'.repeat(70));
  }

  /**
   * Genel öneri oluştur
   */
  getRecommendation(healthyCount, totalAPIs) {
    // Groq ve OpenRouter çalışıyorsa sistem tam fonksiyonel
    const groqHealthy = this.healthStatus.groq?.status === 'healthy';
    const openrouterHealthy = this.healthStatus.openrouter?.status === 'healthy';
    
    if (groqHealthy && openrouterHealthy) {
      return '✅ Primary AI servisleri çalışıyor. Sistem tam fonksiyonel!';
    } else if (groqHealthy || openrouterHealthy) {
      return '⚠️ Tek AI servisi çalışıyor. Fallback mekanizması yok ama sistem kullanılabilir.';
    } else {
      return '❌ Hiçbir AI servisi çalışmıyor. Lütfen API key\'leri kontrol edin.';
    }
  }

  /**
   * Performans testi yap (çoklu istek)
   */
  async performanceTest(iterations = 5) {
    console.log(`\n🚀 Performans Testi Başlatılıyor (${iterations} iterasyon)...\n`);
    
    const results = {
      gemini: { times: [], avgTime: 0, successRate: 0 },
      groq: { times: [], avgTime: 0, successRate: 0 },
      openrouter: { times: [], avgTime: 0, successRate: 0 }
    };

    for (let i = 0; i < iterations; i++) {
      console.log(`   İterasyon ${i + 1}/${iterations}...`);
      
      const [gemini, groq, openrouter] = await Promise.all([
        this.checkGeminiAPI(),
        this.checkGroqAPI(),
        this.checkOpenRouterAPI()
      ]);

      if (gemini.responseTime) {
        results.gemini.times.push(parseInt(gemini.responseTime));
      }
      if (groq.responseTime) {
        results.groq.times.push(parseInt(groq.responseTime));
      }
      if (openrouter.responseTime) {
        results.openrouter.times.push(parseInt(openrouter.responseTime));
      }
    }

    // Ortalama hesapla
    results.gemini.avgTime = results.gemini.times.length > 0 
      ? (results.gemini.times.reduce((a, b) => a + b, 0) / results.gemini.times.length).toFixed(0)
      : 0;
    results.gemini.successRate = ((results.gemini.times.length / iterations) * 100).toFixed(0);

    results.groq.avgTime = results.groq.times.length > 0 
      ? (results.groq.times.reduce((a, b) => a + b, 0) / results.groq.times.length).toFixed(0)
      : 0;
    results.groq.successRate = ((results.groq.times.length / iterations) * 100).toFixed(0);

    results.openrouter.avgTime = results.openrouter.times.length > 0 
      ? (results.openrouter.times.reduce((a, b) => a + b, 0) / results.openrouter.times.length).toFixed(0)
      : 0;
    results.openrouter.successRate = ((results.openrouter.times.length / iterations) * 100).toFixed(0);

    console.log('\n📊 Performans Sonuçları:');
    console.log('   Gemini:     ', `${results.gemini.avgTime}ms ortalama`, `(${results.gemini.successRate}% başarı)`);
    console.log('   Groq:       ', `${results.groq.avgTime}ms ortalama`, `(${results.groq.successRate}% başarı)`);
    console.log('   OpenRouter: ', `${results.openrouter.avgTime}ms ortalama`, `(${results.openrouter.successRate}% başarı)`);
    console.log('');

    return results;
  }
}

// Singleton instance
const apiHealthChecker = new APIHealthChecker();

module.exports = apiHealthChecker;


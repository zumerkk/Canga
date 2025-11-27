/**
 * 🔍 API HEALTH CHECKER SERVICE
 * Groq API bağlantısını test eder ve sağlık durumunu raporlar
 */

const axios = require('axios');
require('dotenv').config();

class APIHealthChecker {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    
    this.healthStatus = {
      groq: { status: 'unknown', lastCheck: null, responseTime: null, error: null }
    };
  }

  /**
   * Groq API bağlantısını test et
   */
  async checkGroqAPI() {
    const startTime = Date.now();
    
    try {
      if (!this.apiKey) {
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
        this.endpoint,
        testPrompt,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
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
          keyLength: this.apiKey.length,
          keyPrefix: this.apiKey.substring(0, 10) + '...',
          model: 'llama-3.3-70b-versatile',
          endpoint: this.endpoint
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
          hasKey: !!this.apiKey,
          keyLength: this.apiKey?.length || 0,
          endpoint: this.endpoint
        }
      };

      return this.healthStatus.groq;
    }
  }

  /**
   * Tüm API'leri test et (sadece Groq)
   */
  async checkAllAPIs() {
    console.log('🔍 API Health Check başlatılıyor...\n');
    
    const startTime = Date.now();

    // Groq test
    const groqResult = await this.checkGroqAPI();

    const totalTime = Date.now() - startTime;
    const healthyCount = groqResult.status === 'healthy' ? 1 : 0;

    // Konsol çıktısı
    this.printHealthReport();

    // Özet döndür
    return {
      timestamp: new Date(),
      totalTime: `${totalTime}ms`,
      summary: {
        total: 1,
        healthy: healthyCount,
        unhealthy: 1 - healthyCount,
        healthScore: `${healthyCount * 100}%`
      },
      apis: {
        groq: groqResult
      },
      recommendation: this.getRecommendation(healthyCount)
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

    // Groq
    const groq = this.healthStatus.groq;
    console.log('🤖 GROQ API (Llama 3.3)');
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
    console.log('═'.repeat(70));
  }

  /**
   * Genel öneri oluştur
   */
  getRecommendation(healthyCount) {
    if (healthyCount === 1) {
      return '✅ Groq AI servisi çalışıyor. Sistem tam fonksiyonel!';
    } else {
      return '❌ Groq AI servisi çalışmıyor. Lütfen GROQ_API_KEY\'i kontrol edin.';
    }
  }

  /**
   * Performans testi yap (çoklu istek)
   */
  async performanceTest(iterations = 5) {
    console.log(`\n🚀 Performans Testi Başlatılıyor (${iterations} iterasyon)...\n`);
    
    const results = {
      groq: { times: [], avgTime: 0, successRate: 0 }
    };

    for (let i = 0; i < iterations; i++) {
      console.log(`   İterasyon ${i + 1}/${iterations}...`);
      
      const groq = await this.checkGroqAPI();

      if (groq.responseTime) {
        results.groq.times.push(parseInt(groq.responseTime));
      }
    }

    // Ortalama hesapla
    results.groq.avgTime = results.groq.times.length > 0 
      ? (results.groq.times.reduce((a, b) => a + b, 0) / results.groq.times.length).toFixed(0)
      : 0;
    results.groq.successRate = ((results.groq.times.length / iterations) * 100).toFixed(0);

    console.log('\n📊 Performans Sonuçları:');
    console.log('   Groq:       ', `${results.groq.avgTime}ms ortalama`, `(${results.groq.successRate}% başarı)`);
    console.log('');

    return results;
  }
}

// Singleton instance
const apiHealthChecker = new APIHealthChecker();

module.exports = apiHealthChecker;

/**
 * 🤖 AI CONFIGURATION - Gemini & Groq
 * 
 * Multi-AI sistem: Gemini + Groq birlikte çalışır
 * Fallback mekanizması, rate limiting, caching
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

// API Keys - Environment'dan al
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// API keys kontrolü
const hasApiKeys = GEMINI_API_KEY && GROQ_API_KEY;

if (!hasApiKeys) {
  console.warn('⚠️ AI API keys not found in environment variables! AI features will be disabled.');
  console.warn('   Set GEMINI_API_KEY and GROQ_API_KEY environment variables to enable AI.');
}

// Gemini setup - sadece key varsa
let genAI = null;
let geminiModel = null;

if (GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',  // GÜNCEL MODEL
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    console.log('✅ Gemini AI initialized successfully (gemini-1.5-flash)');
  } catch (error) {
    console.error('⚠️ Gemini AI initialization failed:', error.message);
  }
}

// Groq setup - sadece key varsa
let groq = null;

if (GROQ_API_KEY) {
  try {
    groq = new Groq({
      apiKey: GROQ_API_KEY
    });
    console.log('✅ Groq AI initialized successfully');
  } catch (error) {
    console.error('⚠️ Groq AI initialization failed:', error.message);
  }
}

// Rate limiting state
let lastGeminiCall = 0;
let lastGroqCall = 0;
const MIN_INTERVAL_MS = 1000; // 1 saniye minimum

// Simple cache
const cache = new Map();
const CACHE_TTL = 3600000; // 1 saat

/**
 * Multi-AI Client - Gemini + Groq birlikte
 */
class MultiAIClient {
  constructor() {
    this.preferredProvider = 'groq'; // GROQ VARSAYILAN (Daha hızlı ve stabil)
    this.requestCount = { gemini: 0, groq: 0 };
    this.errorCount = { gemini: 0, groq: 0 };
  }

  /**
   * Akıllı AI çağrısı - En uygun provider'ı seçer
   */
  async generate(prompt, options = {}) {
    // API keys yoksa hata dön
    if (!hasApiKeys) {
      throw new Error('AI API keys not configured. Please set GEMINI_API_KEY and GROQ_API_KEY environment variables.');
    }
    
    const {
      useCache = true,
      forceProvider = null,
      taskType = 'general', // 'analysis', 'generation', 'classification', 'vision'
      maxTokens = 2048
    } = options;

    // Cache kontrolü
    if (useCache) {
      const cached = this.getFromCache(prompt);
      if (cached) {
        console.log('🎯 AI Cache hit');
        return cached;
      }
    }

    // Provider seçimi
    const provider = forceProvider || this.selectBestProvider(taskType);

    try {
      let result;

      if (provider === 'gemini') {
        result = await this.callGemini(prompt, maxTokens);
      } else {
        result = await this.callGroq(prompt, maxTokens);
      }

      // Cache'e kaydet
      if (useCache) {
        this.saveToCache(prompt, result);
      }

      return result;

    } catch (error) {
      console.error(`❌ ${provider} error:`, error.message);
      this.errorCount[provider]++;

      // Fallback dene
      const fallbackProvider = provider === 'gemini' ? 'groq' : 'gemini';
      console.log(`🔄 Trying fallback: ${fallbackProvider}`);

      try {
        const fallbackResult = fallbackProvider === 'gemini' 
          ? await this.callGemini(prompt, maxTokens)
          : await this.callGroq(prompt, maxTokens);

        return fallbackResult;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        throw new Error('All AI providers failed');
      }
    }
  }

  /**
   * Gemini API çağrısı
   */
  async callGemini(prompt, maxTokens) {
    if (!geminiModel) {
      throw new Error('Gemini API not initialized');
    }
    
    // Rate limiting
    await this.waitForRateLimit('gemini');

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();

    this.requestCount.gemini++;
    lastGeminiCall = Date.now();

    return {
      provider: 'gemini',
      content: text,
      model: 'gemini-pro',
      timestamp: new Date()
    };
  }

  /**
   * Groq API çağrısı
   */
  async callGroq(prompt, maxTokens) {
    if (!groq) {
      throw new Error('Groq API not initialized');
    }
    
    // Rate limiting
    await this.waitForRateLimit('groq');

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile', // GÜNCEL MODEL
      temperature: 0.7,
      max_tokens: maxTokens
    });

    this.requestCount.groq++;
    lastGroqCall = Date.now();

    return {
      provider: 'groq',
      content: completion.choices[0]?.message?.content || '',
      model: 'llama-3.3-70b-versatile',
      timestamp: new Date()
    };
  }

  /**
   * En uygun provider'ı seç
   */
  selectBestProvider(taskType) {
    // Vision için kesinlikle Gemini
    if (taskType === 'vision') {
      return 'gemini'; 
    }

    // Hata oranına göre dinamik geçiş
    if (this.errorCount.gemini > this.errorCount.groq + 5) {
      return 'groq';
    }
    if (this.errorCount.groq > this.errorCount.gemini + 5) {
      return 'gemini';
    }
    
    // Varsayılan olarak Groq (Daha hızlı ve güvenilir)
    return 'groq';
  }

  /**
   * Rate limiting
   */
  async waitForRateLimit(provider) {
    const lastCall = provider === 'gemini' ? lastGeminiCall : lastGroqCall;
    const timeSince = Date.now() - lastCall;

    if (timeSince < MIN_INTERVAL_MS) {
      const waitTime = MIN_INTERVAL_MS - timeSince;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Cache yönetimi
   */
  getFromCache(prompt) {
    const key = this.hashPrompt(prompt);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    return null;
  }

  saveToCache(prompt, result) {
    const key = this.hashPrompt(prompt);
    cache.set(key, {
      result,
      timestamp: Date.now()
    });

    // Cache cleanup
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
  }

  hashPrompt(prompt) {
    // Simple hash
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * İstatistikler
   */
  getStats() {
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      cacheSize: cache.size,
      preferredProvider: this.preferredProvider
    };
  }
}

// Singleton instance
const aiClient = new MultiAIClient();

module.exports = {
  aiClient,
  geminiModel,
  groq,
  GEMINI_API_KEY,
  GROQ_API_KEY
};

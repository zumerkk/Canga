/**
 * 🤖 AI CLIENT CONFIGURATION
 * Multi-provider AI client with fallback support
 * Supports: Gemini (Google), Groq (Llama), OpenRouter (Multi-model)
 */

const axios = require('axios');
require('dotenv').config();

class AIClient {
  constructor() {
    this.providers = {
      gemini: {
        name: 'Gemini',
        apiKey: process.env.GEMINI_API_KEY,
        // Using v1 API and gemini-1.5-flash which is recommended for fast responses
        endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
        model: 'gemini-1.5-flash',
        enabled: !!process.env.GEMINI_API_KEY
      },
      groq: {
        name: 'Groq',
        apiKey: process.env.GROQ_API_KEY,
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        enabled: !!process.env.GROQ_API_KEY
      },
      openrouter: {
        name: 'OpenRouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'openai/gpt-3.5-turbo',
        enabled: !!process.env.OPENROUTER_API_KEY
      }
    };

    // Provider priority for different task types
    this.taskProviders = {
      analysis: ['groq', 'openrouter', 'gemini'],  // Groq is fast for analysis
      generation: ['groq', 'openrouter', 'gemini'],
      default: ['groq', 'openrouter', 'gemini']
    };

    this.logProviderStatus();
  }

  logProviderStatus() {
    console.log('🤖 AI Client initialized:');
    Object.entries(this.providers).forEach(([key, provider]) => {
      const status = provider.enabled ? '✅ Enabled' : '❌ Disabled (no API key)';
      console.log(`   ${provider.name}: ${status}`);
    });
  }

  /**
   * Generate content using AI with automatic fallback
   * @param {string} prompt - The prompt to send
   * @param {object} options - Options: taskType, forceProvider, maxTokens
   * @returns {Promise<{content: string, provider: string}>}
   */
  async generate(prompt, options = {}) {
    const { taskType = 'default', forceProvider = null, maxTokens = 1024 } = options;

    // If a specific provider is forced, try only that one
    if (forceProvider && this.providers[forceProvider]?.enabled) {
      return this.callProvider(forceProvider, prompt, maxTokens);
    }

    // Get provider list for task type
    const providerOrder = this.taskProviders[taskType] || this.taskProviders.default;
    
    // Filter to only enabled providers
    const enabledProviders = providerOrder.filter(p => this.providers[p]?.enabled);

    if (enabledProviders.length === 0) {
      throw new Error('Hiçbir AI servisi yapılandırılmamış. .env dosyasında API key\'lerini kontrol edin.');
    }

    // Try each provider in order until one succeeds
    let lastError = null;
    for (const providerKey of enabledProviders) {
      try {
        console.log(`🤖 Trying AI provider: ${this.providers[providerKey].name}`);
        const result = await this.callProvider(providerKey, prompt, maxTokens);
        console.log(`✅ AI response from: ${this.providers[providerKey].name}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ ${this.providers[providerKey].name} failed:`, error.message);
        lastError = error;
        // Continue to next provider
      }
    }

    // All providers failed
    throw lastError || new Error('Tüm AI servisleri başarısız oldu');
  }

  /**
   * Call a specific provider
   * @param {string} providerKey - Provider key (gemini, groq, openrouter)
   * @param {string} prompt - The prompt
   * @param {number} maxTokens - Max tokens for response
   * @returns {Promise<{content: string, provider: string}>}
   */
  async callProvider(providerKey, prompt, maxTokens) {
    const provider = this.providers[providerKey];
    
    if (!provider || !provider.enabled) {
      throw new Error(`Provider ${providerKey} is not enabled`);
    }

    switch (providerKey) {
      case 'gemini':
        return this.callGemini(prompt, maxTokens);
      case 'groq':
        return this.callGroq(prompt, maxTokens);
      case 'openrouter':
        return this.callOpenRouter(prompt, maxTokens);
      default:
        throw new Error(`Unknown provider: ${providerKey}`);
    }
  }

  /**
   * Call Gemini API
   */
  async callGemini(prompt, maxTokens) {
    const provider = this.providers.gemini;
    
    const response = await axios.post(
      `${provider.endpoint}?key=${provider.apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('Gemini: Geçersiz yanıt formatı');
    }

    return { content, provider: 'gemini' };
  }

  /**
   * Call Groq API
   */
  async callGroq(prompt, maxTokens) {
    const provider = this.providers.groq;
    
    const response = await axios.post(
      provider.endpoint,
      {
        model: provider.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Groq: Geçersiz yanıt formatı');
    }

    return { content, provider: 'groq' };
  }

  /**
   * Call OpenRouter API
   */
  async callOpenRouter(prompt, maxTokens) {
    const provider = this.providers.openrouter;
    
    const response = await axios.post(
      provider.endpoint,
      {
        model: provider.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://canga.com',
          'X-Title': 'Canga AI System'
        },
        timeout: 30000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('OpenRouter: Geçersiz yanıt formatı');
    }

    return { content, provider: 'openrouter' };
  }

  /**
   * Check if any AI provider is available
   */
  isAvailable() {
    return Object.values(this.providers).some(p => p.enabled);
  }

  /**
   * Get list of enabled providers
   */
  getEnabledProviders() {
    return Object.entries(this.providers)
      .filter(([_, p]) => p.enabled)
      .map(([key, p]) => ({ key, name: p.name, model: p.model }));
  }
}

// Singleton instance
const aiClient = new AIClient();

module.exports = { aiClient, AIClient };


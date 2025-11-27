/**
 * 🤖 AI CLIENT CONFIGURATION
 * Single-provider AI client - Only Groq (Llama)
 */

const axios = require('axios');
require('dotenv').config();

class AIClient {
  constructor() {
    this.provider = {
      name: 'Groq',
      apiKey: process.env.GROQ_API_KEY,
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.3-70b-versatile',
      enabled: !!process.env.GROQ_API_KEY
    };

    this.logProviderStatus();
  }

  logProviderStatus() {
    console.log('🤖 AI Client initialized:');
    const status = this.provider.enabled ? '✅ Enabled' : '❌ Disabled (no API key)';
    console.log(`   ${this.provider.name}: ${status}`);
  }

  /**
   * Generate content using Groq AI
   * @param {string} prompt - The prompt to send
   * @param {object} options - Options: maxTokens
   * @returns {Promise<{content: string, provider: string}>}
   */
  async generate(prompt, options = {}) {
    const { maxTokens = 1024 } = options;

    if (!this.provider.enabled) {
      throw new Error('GROQ_API_KEY tanımlı değil. .env dosyasında API key\'i kontrol edin.');
    }

    return this.callGroq(prompt, maxTokens);
  }

  /**
   * Call Groq API
   */
  async callGroq(prompt, maxTokens) {
    console.log(`🤖 AI request to: ${this.provider.name}`);
    
    const response = await axios.post(
      this.provider.endpoint,
      {
        model: this.provider.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${this.provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Groq: Geçersiz yanıt formatı');
    }

    console.log(`✅ AI response from: ${this.provider.name}`);
    return { content, provider: 'groq' };
  }

  /**
   * Check if AI provider is available
   */
  isAvailable() {
    return this.provider.enabled;
  }

  /**
   * Get provider info
   */
  getProviderInfo() {
    return {
      key: 'groq',
      name: this.provider.name,
      model: this.provider.model,
      enabled: this.provider.enabled
    };
  }
}

// Singleton instance
const aiClient = new AIClient();

module.exports = { aiClient, AIClient };

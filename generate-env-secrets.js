#!/usr/bin/env node
/**
 * 🔐 Canga Vardiya Sistemi - Environment Secrets Generator
 * 
 * Bu script deployment için gerekli güvenli secret key'leri oluşturur
 * 
 * Kullanım: node generate-env-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 CANGA VARDİYA SİSTEMİ - ENV SECRETS GENERATOR\n');

// JWT Secret oluştur (32 byte)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('✅ JWT_SECRET:');
console.log(`   ${jwtSecret}\n`);

// Session Secret oluştur (16 byte)  
const sessionSecret = crypto.randomBytes(16).toString('hex');
console.log('🔑 SESSION_SECRET (isteğe bağlı):');
console.log(`   ${sessionSecret}\n`);

// API Key oluştur (24 byte)
const apiKey = crypto.randomBytes(24).toString('hex');
console.log('🗝️  API_KEY (internal kullanım):');
console.log(`   ${apiKey}\n`);

console.log('📋 RENDER.COM DEPLOYMENT İÇİN ENVIRONMENT VARIABLES:');
console.log('=' .repeat(60));

const envVars = {
  // Kritik değişkenler
  'NODE_ENV': 'production',
  'PORT': '5000',
  'JWT_SECRET': jwtSecret,
  'JWT_EXPIRE': '30d',
  'MONGODB_URI': '[MONGODB_ATLAS_CONNECTION_STRING_BURAYA]',
  
  // İsteğe bağlı
  'LOG_LEVEL': 'info',
  'REDIS_HOST': 'localhost',
  'REDIS_PORT': '6379',
  'GOOGLE_AI_API_KEY': '[GOOGLE_AI_KEY_BURAYA]'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n⚠️  ÖNEMLİ NOTLAR:');
console.log('1. MONGODB_URI: MongoDB Atlas dashboard\'dan connection string alın');
console.log('2. GOOGLE_AI_API_KEY: Google AI Studio\'dan API key alın (isteğe bağlı)');
console.log('3. Bu değerleri Render.com dashboard\'da Environment Variables bölümüne girin');
console.log('4. JWT_SECRET ve MONGODB_URI\'yi asla GitHub\'a push etmeyin!\n');

console.log('🚀 Bu değerlerle Render.com deployment\'a hazırsınız!\n');

#!/usr/bin/env node
/**
 * 🔍 AI API KEY KONTROL ARACI
 * 
 * Bu script AI API key'lerinin varlığını ve geçerliliğini kontrol eder.
 */

require('dotenv').config();

console.log('🔍 AI API KEY KONTROLÜ');
console.log('=' .repeat(50));

// Gemini API Key Kontrolü
const geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey) {
  console.log('✅ GEMINI_API_KEY bulundu');
  console.log(`   Uzunluk: ${geminiKey.length} karakter`);
  console.log(`   İlk 10 karakter: ${geminiKey.substring(0, 10)}...`);
} else {
  console.log('❌ GEMINI_API_KEY bulunamadı!');
  console.log('   Lütfen .env dosyasına GEMINI_API_KEY ekleyin.');
  console.log('   Örnek: GEMINI_API_KEY=AIzaSy...');
}

console.log('');

// Groq API Key Kontrolü
const groqKey = process.env.GROQ_API_KEY;
if (groqKey) {
  console.log('✅ GROQ_API_KEY bulundu');
  console.log(`   Uzunluk: ${groqKey.length} karakter`);
  console.log(`   İlk 10 karakter: ${groqKey.substring(0, 10)}...`);
} else {
  console.log('❌ GROQ_API_KEY bulunamadı!');
  console.log('   Lütfen .env dosyasına GROQ_API_KEY ekleyin.');
  console.log('   Örnek: GROQ_API_KEY=gsk_...');
}

console.log('');
console.log('=' .repeat(50));

// Her iki key de varsa test yapabiliriz
if (geminiKey && groqKey) {
  console.log('✅ Her iki API key de mevcut!');
  console.log('');
  console.log('📌 Test için şu komutu çalıştırabilirsiniz:');
  console.log('   node test-ai-connection.js');
} else {
  console.log('⚠️  Eksik API key\'ler var!');
  console.log('');
  console.log('📝 API Key\'leri nasıl alabilirsiniz:');
  console.log('');
  console.log('1. GEMINI API KEY:');
  console.log('   → https://makersuite.google.com/app/apikey');
  console.log('   → Google hesabınızla giriş yapın');
  console.log('   → "Get API Key" butonuna tıklayın');
  console.log('');
  console.log('2. GROQ API KEY:');
  console.log('   → https://console.groq.com/keys');
  console.log('   → Hesap oluşturun veya giriş yapın');
  console.log('   → "Create API Key" butonuna tıklayın');
  console.log('');
  console.log('3. Key\'leri .env dosyasına ekleyin:');
  console.log('   → server/.env dosyasını açın');
  console.log('   → Şu satırları ekleyin:');
  console.log('     GEMINI_API_KEY=your_gemini_key_here');
  console.log('     GROQ_API_KEY=your_groq_key_here');
}

console.log('');


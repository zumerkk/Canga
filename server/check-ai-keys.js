#!/usr/bin/env node
/**
 * 🔑 GROQ API KEY CHECK SCRIPT
 * Groq API key'inin yapılandırmasını kontrol eder
 */

require('dotenv').config();

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║                 🔑 GROQ API KEY KONTROL                          ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
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
console.log('─'.repeat(70));
console.log('');

// Sonuç
if (groqKey) {
  console.log('✅ AI SERVİSİ KULLANILABILIR');
  console.log('');
  console.log('   AI özellikleri (anomali tespiti, NLP arama, vb.) aktif.');
  console.log('');
  console.log('📌 Groq (Llama 3.3) - Primary AI Provider');
  console.log('   Model: llama-3.3-70b-versatile');
  console.log('   Endpoint: https://api.groq.com/openai/v1/chat/completions');
} else {
  console.log('⚠️  GROQ API KEY TANIMLANMALI');
  console.log('');
  console.log('AI özellikleri çalışmayacaktır.');
  console.log('');
  console.log('🔧 NASIL API KEY ALINIR:');
  console.log('');
  console.log('1. GROQ API KEY:');
  console.log('   → https://console.groq.com/keys adresine gidin');
  console.log('   → Yeni API key oluşturun');
  console.log('   → .env dosyasına ekleyin:');
  console.log('     GROQ_API_KEY=gsk_xxxx...');
}

console.log('');
console.log('═'.repeat(70));
console.log('');

#!/usr/bin/env node
/**
 * 🧪 API HEALTH TEST SCRIPT
 * Groq API bağlantısını test eder ve detaylı rapor sunar
 */

const apiHealthChecker = require('../services/apiHealthChecker');

// ANSI renk kodları
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function runTests() {
  console.log(colors.cyan + colors.bright);
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           🔬 CANGA AI API HEALTH CHECK & TEST SUITE            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  console.log('');

  try {
    // 1. Temel Health Check
    console.log(colors.bright + '📋 1. TEMEL SAĞLIK KONTROLÜ' + colors.reset);
    console.log('─'.repeat(70));
    const healthReport = await apiHealthChecker.checkAllAPIs();
    console.log('');
    
    // 2. Performans Testi
    if (healthReport.summary.healthy > 0) {
      console.log(colors.bright + '⚡ 2. PERFORMANS TESTİ' + colors.reset);
      console.log('─'.repeat(70));
      const perfResults = await apiHealthChecker.performanceTest(3);
      console.log('');
    } else {
      console.log(colors.yellow + '⚠️  Performans testi atlandı (sağlıklı API yok)' + colors.reset);
      console.log('');
    }

    // 3. Özet Rapor
    console.log(colors.bright + '📊 3. ÖZET RAPOR' + colors.reset);
    console.log('─'.repeat(70));
    console.log('');
    
    // Groq kontrolü
    const groqHealthy = healthReport.apis.groq?.status === 'healthy';
    
    if (groqHealthy) {
      console.log(colors.green + '✅ GROQ AI SERVİSİ TAM OPERASYONEL' + colors.reset);
      console.log('');
      console.log('   • Groq API:       ' + colors.green + '✓ Çalışıyor (Primary)' + colors.reset);
      console.log('');
      console.log(colors.green + '🎯 QR İmza Yönetimi AI Asistanı tam fonksiyonel!' + colors.reset);
    } else {
      console.log(colors.red + '❌ KRİTİK - GROQ AI SERVİSİ KULLANILAMAZ' + colors.reset);
      console.log('');
      console.log('   • Groq API:       ' + colors.red + '✗ Kullanılamıyor' + colors.reset);
      console.log('');
      console.log(colors.red + '⚠️  AI özellikleri devre dışı kalacaktır!' + colors.reset);
      console.log('');
      console.log(colors.bright + '🔧 ÇÖZÜM ÖNERİLERİ:' + colors.reset);
      console.log('');
      console.log('   1. API key\'in doğru olduğundan emin olun:');
      console.log('      → server/.env dosyasını kontrol edin');
      console.log('      → GROQ_API_KEY=gsk_...');
      console.log('');
      console.log('   2. Yeni API key oluşturun:');
      console.log('      → Groq: https://console.groq.com/keys');
      console.log('');
      console.log('   3. İnternet bağlantınızı kontrol edin');
      console.log('      → VPN/Proxy kullanıyorsanız kapatmayı deneyin');
      console.log('');
    }

    console.log('─'.repeat(70));
    console.log('');
    console.log(colors.cyan + '📌 Sağlık Skoru: ' + healthReport.summary.healthScore + colors.reset);
    console.log(colors.cyan + '⏱️  Toplam Test Süresi: ' + healthReport.totalTime + colors.reset);
    console.log('');
    console.log(colors.bright + '✨ Test tamamlandı!' + colors.reset);
    console.log('');

    // Exit code'u başarı durumuna göre ayarla
    process.exit(healthReport.summary.healthy === 0 ? 1 : 0);

  } catch (error) {
    console.error('');
    console.error(colors.red + '❌ Test sırasında kritik hata oluştu:' + colors.reset);
    console.error(colors.red + error.message + colors.reset);
    console.error('');
    console.error(colors.yellow + 'Stack trace:' + colors.reset);
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

// Script'i çalıştır
if (require.main === module) {
  runTests();
}

module.exports = runTests;

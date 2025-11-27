#!/usr/bin/env node
/**
 * 🔍 ENVIRONMENT VARIABLES VALIDATOR
 * .env dosyasındaki tüm gerekli değişkenleri kontrol eder
 */

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

// Gerekli environment variables
const requiredVars = [
  {
    name: 'MONGODB_URI',
    description: 'MongoDB bağlantı string\'i',
    critical: true,
    example: 'mongodb+srv://user:pass@cluster.mongodb.net/dbname'
  },
  {
    name: 'JWT_SECRET',
    description: 'JWT token güvenlik anahtarı',
    critical: true,
    example: 'your_super_secret_key_here_min_32_chars'
  },
  {
    name: 'GROQ_API_KEY',
    description: 'Groq AI API key (Llama 3.3 modeli)',
    critical: false,
    example: 'gsk_...',
    link: 'https://console.groq.com/keys'
  },
  {
    name: 'NODE_ENV',
    description: 'Çalışma ortamı (development/production)',
    critical: false,
    example: 'development',
    default: 'development'
  },
  {
    name: 'PORT',
    description: 'Server port numarası',
    critical: false,
    example: '5001',
    default: '5001'
  }
];

function validateEnvironment() {
  console.log(colors.cyan + colors.bright);
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║              🔍 ENVIRONMENT VARIABLES VALIDATOR                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  console.log('');

  let hasErrors = false;
  let hasWarnings = false;
  let validCount = 0;

  console.log(colors.bright + '📋 KONTROL SONUÇLARI:' + colors.reset);
  console.log('─'.repeat(70));
  console.log('');

  requiredVars.forEach((varConfig, index) => {
    const value = process.env[varConfig.name];
    const hasValue = !!value;
    const hasDefault = !!varConfig.default;

    console.log(`${index + 1}. ${colors.bright}${varConfig.name}${colors.reset}`);
    console.log(`   ${colors.cyan}Açıklama:${colors.reset} ${varConfig.description}`);

    if (hasValue) {
      // Değer var
      const displayValue = value.length > 50 ? value.substring(0, 30) + '...' : value;
      const maskedValue = ['KEY', 'SECRET', 'PASSWORD', 'TOKEN'].some(s => varConfig.name.includes(s))
        ? value.substring(0, 10) + '...'
        : displayValue;

      console.log(`   ${colors.green}✓ Durum:${colors.reset} Tanımlı (${maskedValue})`);
      
      // Değer uzunluk kontrolü
      if (varConfig.name.includes('SECRET') && value.length < 32) {
        console.log(`   ${colors.yellow}⚠ Uyarı:${colors.reset} Secret çok kısa (min 32 karakter önerilir)`);
        hasWarnings = true;
      }

      validCount++;
    } else if (hasDefault) {
      // Default değer var
      console.log(`   ${colors.yellow}○ Durum:${colors.reset} Default kullanılıyor (${varConfig.default})`);
      validCount++;
    } else {
      // Değer yok
      if (varConfig.critical) {
        console.log(`   ${colors.red}✗ Durum:${colors.reset} KRİTİK - Tanımlı değil!`);
        hasErrors = true;
      } else {
        console.log(`   ${colors.yellow}✗ Durum:${colors.reset} Opsiyonel - Tanımlı değil`);
        hasWarnings = true;
      }
      
      console.log(`   ${colors.cyan}Örnek:${colors.reset} ${varConfig.example}`);
      if (varConfig.link) {
        console.log(`   ${colors.cyan}Link:${colors.reset} ${varConfig.link}`);
      }
    }

    console.log('');
  });

  console.log('─'.repeat(70));
  console.log('');

  // Özet
  console.log(colors.bright + '📊 ÖZET:' + colors.reset);
  console.log('');
  console.log(`   Toplam Değişken:     ${requiredVars.length}`);
  console.log(`   Geçerli:             ${colors.green}${validCount}${colors.reset}`);
  console.log(`   Kritik Eksik:        ${hasErrors ? colors.red : colors.green}${hasErrors ? 'VAR' : 'YOK'}${colors.reset}`);
  console.log(`   Uyarı:               ${hasWarnings ? colors.yellow : colors.green}${hasWarnings ? 'VAR' : 'YOK'}${colors.reset}`);
  console.log('');

  if (hasErrors) {
    console.log(colors.red + colors.bright + '❌ KRİTİK HATALAR VAR!' + colors.reset);
    console.log('');
    console.log('Kritik değişkenler tanımlanmadan sistem başlatılamaz.');
    console.log('');
    console.log(colors.bright + '🔧 ÇÖZÜM:' + colors.reset);
    console.log('');
    console.log('1. server/.env dosyasını oluşturun veya düzenleyin');
    console.log('2. Eksik değişkenleri yukarıdaki örneklere göre ekleyin');
    console.log('3. Bu scripti tekrar çalıştırın: npm run validate-env');
    console.log('');
    process.exit(1);
  } else if (hasWarnings) {
    console.log(colors.yellow + '⚠️  UYARILAR VAR' + colors.reset);
    console.log('');
    console.log('Sistem çalışabilir ama bazı özellikler eksik olabilir.');
    console.log('');
    console.log(colors.green + '✅ Kritik hatalar yok - sistem başlatılabilir.' + colors.reset);
    console.log('');
    process.exit(0);
  } else {
    console.log(colors.green + colors.bright + '✅ TÜM KONTROLLER BAŞARILI!' + colors.reset);
    console.log('');
    console.log('Environment variables tam ve doğru yapılandırılmış.');
    console.log('Sistem sorunsuz başlatılabilir.');
    console.log('');
    process.exit(0);
  }
}

// Script'i çalıştır
if (require.main === module) {
  validateEnvironment();
}

module.exports = validateEnvironment;

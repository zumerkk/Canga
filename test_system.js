const axios = require('axios');

// Renk kodları
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log('\n' + BOLD + BLUE + '═══════════════════════════════════════════════════════════════' + RESET);
console.log(BOLD + '           🧪 ÇANGA SİSTEM DETAYLI TEST RAPORU' + RESET);
console.log(BOLD + BLUE + '═══════════════════════════════════════════════════════════════' + RESET + '\n');

async function testSystem() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // 1. BACKEND SERVİS TESTİ
  console.log(BOLD + '1️⃣  BACKEND SERVİS TESTİ' + RESET);
  try {
    const response = await axios.get('http://localhost:5001/api/dashboard/stats', { timeout: 5000 });
    if (response.data.success) {
      console.log(GREEN + '   ✅ Backend çalışıyor' + RESET);
      console.log(`   📊 Toplam Çalışan: ${response.data.data.totalEmployees}`);
      results.passed++;
    }
  } catch (error) {
    console.log(RED + '   ❌ Backend çalışmıyor!' + RESET);
    console.log(`   Hata: ${error.message}`);
    results.failed++;
  }
  console.log('');

  // 2. FRONTEND SERVİS TESTİ
  console.log(BOLD + '2️⃣  FRONTEND SERVİS TESTİ' + RESET);
  try {
    const response = await axios.get('http://localhost:3000', { timeout: 5000 });
    if (response.status === 200) {
      console.log(GREEN + '   ✅ Frontend çalışıyor' + RESET);
      console.log(`   📄 Status: ${response.status} OK`);
      results.passed++;
    }
  } catch (error) {
    console.log(RED + '   ❌ Frontend çalışmıyor!' + RESET);
    console.log(`   Hata: ${error.message}`);
    results.failed++;
  }
  console.log('');

  // 3. KONUM HARİTASI API TESTİ
  console.log(BOLD + '3️⃣  KONUM HARİTASI API TESTLERİ' + RESET);
  
  // 3.1 Stats endpoint
  try {
    const response = await axios.get('http://localhost:5001/api/location-map/stats', { timeout: 5000 });
    if (response.data.success) {
      console.log(GREEN + '   ✅ /api/location-map/stats - Çalışıyor' + RESET);
      console.log(`      • Bugün: ${response.data.stats.today} kayıt`);
      console.log(`      • Bu ay: ${response.data.stats.thisMonth} kayıt`);
      console.log(`      • Anomali: ${response.data.stats.totalAnomalies} adet`);
      console.log(`      • Kritik: ${response.data.stats.criticalAnomalies} adet`);
      results.passed++;
    }
  } catch (error) {
    console.log(RED + '   ❌ Stats endpoint hatası' + RESET);
    results.failed++;
  }

  // 3.2 All locations endpoint
  try {
    const response = await axios.get('http://localhost:5001/api/location-map/all-locations?limit=5', { timeout: 5000 });
    if (response.data.success) {
      console.log(GREEN + '   ✅ /api/location-map/all-locations - Çalışıyor' + RESET);
      console.log(`      • Toplam konum: ${response.data.count}`);
      console.log(`      • Fabrika: ${response.data.factory.address.substring(0, 40)}...`);
      console.log(`      • Koordinat: ${response.data.factory.latitude}, ${response.data.factory.longitude}`);
      console.log(`      • Yarıçap: ${response.data.factory.radius}m`);
      
      if (response.data.locations.length > 0) {
        const loc = response.data.locations[0];
        console.log(`      • Örnek kayıt: ${loc.employee.name} - ${loc.type}`);
      }
      results.passed++;
    }
  } catch (error) {
    console.log(RED + '   ❌ All locations endpoint hatası' + RESET);
    results.failed++;
  }

  // 3.3 Anomaly locations endpoint
  try {
    const response = await axios.get('http://localhost:5001/api/location-map/anomaly-locations', { timeout: 5000 });
    if (response.data.success) {
      console.log(GREEN + '   ✅ /api/location-map/anomaly-locations - Çalışıyor' + RESET);
      console.log(`      • Anomali sayısı: ${response.data.count}`);
      results.passed++;
    }
  } catch (error) {
    console.log(RED + '   ❌ Anomaly locations endpoint hatası' + RESET);
    results.failed++;
  }

  // 3.4 Heatmap data endpoint
  try {
    const response = await axios.get('http://localhost:5001/api/location-map/heatmap-data', { timeout: 5000 });
    if (response.data.success) {
      console.log(GREEN + '   ✅ /api/location-map/heatmap-data - Çalışıyor' + RESET);
      console.log(`      • Heat point: ${response.data.count} nokta`);
      results.passed++;
    }
  } catch (error) {
    console.log(RED + '   ❌ Heatmap endpoint hatası' + RESET);
    results.failed++;
  }
  console.log('');

  // 4. AI SERVİS KONTROLÜ
  console.log(BOLD + '4️⃣  AI ANOMALİ ANALİZ SERVİSİ' + RESET);
  const hasGemini = process.env.GEMINI_API_KEY ? true : false;
  const hasGroq = process.env.GROQ_API_KEY ? true : false;
  
  if (hasGemini) {
    console.log(GREEN + '   ✅ GEMINI_API_KEY: Mevcut' + RESET);
    results.passed++;
  } else {
    console.log(YELLOW + '   ⚠️  GEMINI_API_KEY: Yok (AI analizi yapılmayacak)' + RESET);
    results.warnings++;
  }
  
  if (hasGroq) {
    console.log(GREEN + '   ✅ GROQ_API_KEY: Mevcut' + RESET);
    results.passed++;
  } else {
    console.log(YELLOW + '   ⚠️  GROQ_API_KEY: Yok (AI analizi yapılmayacak)' + RESET);
    results.warnings++;
  }
  
  if (!hasGemini && !hasGroq) {
    console.log('');
    console.log(YELLOW + '   💡 AI Key\'leri eklemek için:' + RESET);
    console.log('      1. https://makersuite.google.com/app/apikey (Gemini)');
    console.log('      2. https://console.groq.com/keys (Groq)');
    console.log('      3. server/.env dosyasına ekleyin');
  }
  console.log('');

  // 5. KONUM KONTROL SİSTEMİ
  console.log(BOLD + '5️⃣  KONUM KONTROL SİSTEMİ' + RESET);
  try {
    const { FACTORY_LOCATION, checkLocationWithinFactory } = require('./server/utils/locationHelper');
    console.log(GREEN + '   ✅ locationHelper.js - Yüklendi' + RESET);
    console.log(`   🏭 Fabrika Koordinatları:`);
    console.log(`      • Lat: ${FACTORY_LOCATION.latitude}°N`);
    console.log(`      • Lng: ${FACTORY_LOCATION.longitude}°E`);
    console.log(`      • Yarıçap: ${FACTORY_LOCATION.radius}m (${FACTORY_LOCATION.radius/1000}km)`);
    
    // Test konumu (Ankara - fabrika dışı)
    const testLocation = { latitude: 39.9, longitude: 32.9 };
    const testResult = checkLocationWithinFactory(testLocation);
    console.log(`\n   🧪 Test Konumu (Ankara yakını):`);
    console.log(`      • Mesafe: ${testResult.distanceText}`);
    console.log(`      • Sınırlar içinde: ${testResult.isWithinBounds ? 'Evet ✅' : 'Hayır ❌'}`);
    
    results.passed++;
  } catch (error) {
    console.log(RED + '   ❌ locationHelper.js yüklenemedi' + RESET);
    console.log(`   Hata: ${error.message}`);
    results.failed++;
  }
  console.log('');

  // 6. NPM PAKET KONTROLÜ
  console.log(BOLD + '6️⃣  FRONTEND PAKET KONTROLÜ' + RESET);
  try {
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('./client/package.json', 'utf8'));
    
    const requiredPackages = ['leaflet', 'react-leaflet', 'leaflet.heat'];
    let allInstalled = true;
    
    for (const pkg of requiredPackages) {
      if (packageJson.dependencies[pkg]) {
        console.log(GREEN + `   ✅ ${pkg}: ${packageJson.dependencies[pkg]}` + RESET);
        results.passed++;
      } else {
        console.log(RED + `   ❌ ${pkg}: Yüklü değil!` + RESET);
        allInstalled = false;
        results.failed++;
      }
    }
  } catch (error) {
    console.log(RED + '   ❌ package.json okunamadı' + RESET);
    results.failed++;
  }
  console.log('');

  // 7. DOSYA KONTROLÜ
  console.log(BOLD + '7️⃣  YENİ DOSYALARIN VARLIĞI' + RESET);
  const fs = require('fs');
  const files = [
    { path: './server/services/aiAnomalyAnalyzer.js', name: 'AI Anomaly Analyzer' },
    { path: './server/routes/locationMap.js', name: 'Location Map Routes' },
    { path: './server/utils/locationHelper.js', name: 'Location Helper' },
    { path: './client/src/components/LocationMap.js', name: 'Location Map Component' },
    { path: './client/public/_redirects', name: 'Render.com Redirects' }
  ];
  
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const stats = fs.statSync(file.path);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(GREEN + `   ✅ ${file.name}` + RESET);
      console.log(`      📄 ${file.path} (${sizeKB} KB)`);
      results.passed++;
    } else {
      console.log(RED + `   ❌ ${file.name} - Bulunamadı!` + RESET);
      results.failed++;
    }
  }
  console.log('');

  // ÖZET RAPOR
  console.log(BOLD + BLUE + '═══════════════════════════════════════════════════════════════' + RESET);
  console.log(BOLD + '                    📊 TEST SONUÇLARI' + RESET);
  console.log(BOLD + BLUE + '═══════════════════════════════════════════════════════════════' + RESET);
  console.log('');
  console.log(GREEN + `   ✅ Başarılı Testler: ${results.passed}` + RESET);
  if (results.failed > 0) {
    console.log(RED + `   ❌ Başarısız Testler: ${results.failed}` + RESET);
  }
  if (results.warnings > 0) {
    console.log(YELLOW + `   ⚠️  Uyarılar: ${results.warnings}` + RESET);
  }
  
  const total = results.passed + results.failed + results.warnings;
  const successRate = ((results.passed / total) * 100).toFixed(1);
  console.log('');
  console.log(BOLD + `   📈 Başarı Oranı: ${successRate}%` + RESET);
  console.log('');
  
  if (results.failed === 0) {
    console.log(GREEN + BOLD + '   🎉 TÜM TESTLER BAŞARILI!' + RESET);
    console.log(GREEN + '   ✨ Sistem tam olarak çalışıyor!' + RESET);
  } else {
    console.log(RED + '   ⚠️  Bazı testler başarısız!' + RESET);
    console.log('   Lütfen yukarıdaki hataları inceleyin.');
  }
  
  console.log('');
  console.log(BOLD + BLUE + '═══════════════════════════════════════════════════════════════' + RESET);
  console.log('');
}

testSystem().catch(console.error);


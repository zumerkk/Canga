const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const ROUTE_DIR = process.argv[2] || '/Users/zumerkekillioglu/Downloads/PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)';

const tidy = (s='') => (s||'').toString().replace(/\s+/g,' ').trim();

// Route name mapping
const routeNameMap = {
  'DİSPANSER': 'DİSPANSER SERVİS GÜZERGAHI',
  'ÇARŞI MERKEZ': 'ÇARŞI MERKEZ SERVİS GÜZERGAHI',
  'SANAYİ MAHALLESİ': 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI',
  'ÇALILIÖZ MAHALLESİ': 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI',
  'OSMANGAZİ-KARŞIYAKA MAHALLESİ': 'OSMANGAZİ-KARŞIYAKA MAHALLESİ',
  'KENDİ ARACI İLE GELENLER': 'KENDİ ARACI İLE GELENLER'
};

function parseRouteCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l => l.split(';'));

  // Route name from file and first row
  const fileName = path.basename(filePath).toUpperCase();
  const firstRowTitle = tidy(rows[0]?.[0] || '').toUpperCase();
  
  let routeName = '';
  if (fileName.includes('DİSPANSER') || firstRowTitle.includes('DİSPANSER')) {
    routeName = routeNameMap['DİSPANSER'];
  } else if (fileName.includes('ÇARŞI') || firstRowTitle.includes('ÇARŞI')) {
    routeName = routeNameMap['ÇARŞI MERKEZ'];
  } else if (fileName.includes('SANAYİ') || firstRowTitle.includes('SANAYİ')) {
    routeName = routeNameMap['SANAYİ MAHALLESİ'];
  } else if (fileName.includes('OSM') || firstRowTitle.includes('OSMANGAZİ')) {
    routeName = routeNameMap['OSMANGAZİ-KARŞIYAKA MAHALLESİ'];
  } else if (fileName.includes('ÇALILIÖZ') || firstRowTitle.includes('ÇALILIÖZ')) {
    routeName = routeNameMap['ÇALILIÖZ MAHALLESİ'];
  } else if (fileName.includes('KENDI') || fileName.includes('KENDİ') || firstRowTitle.includes('KENDİ')) {
    routeName = routeNameMap['KENDİ ARACI İLE GELENLER'];
  }

  const stops = [];
  const passengers = [];

  // Parse CSV structure
  if (routeName === 'KENDİ ARACI İLE GELENLER') {
    // KENDİ dosyası: sadece isimler
    for (let i = 1; i < rows.length; i++) {
      const name = tidy(rows[i][0] || '');
      if (!name) continue;
      passengers.push({ fullName: name, stopName: 'KENDİ ARACI', orderNumber: 0 });
    }
  } else {
    // Diğer rotalar: stops + passengers
    for (let i = 2; i < rows.length; i++) {
      const c0 = tidy(rows[i][0] || '');
      const c1 = tidy(rows[i][1] || '');
      const c2 = tidy(rows[i][2] || '');

      // Stop row: sadece ilk kolon dolu
      if (c0 && !c1 && !c2 && !c0.includes('SERVİS GÜZERGAHI')) {
        stops.push({ name: c0, order: stops.length + 1 });
        continue;
      }

      // Passenger row: Ad;Durak;Sıra
      if (c0 && c1 && /^\d+$/.test(c2)) {
        passengers.push({ fullName: c0, stopName: c1, orderNumber: Number(c2) });
      }
    }
  }

  return { routeName, stops, passengers };
}

async function validateServiceData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  
  console.log('🔍 Servis verilerini doğruluyorum...\n');
  
  // 1) Veritabanından mevcut veriler
  const dbRoutes = await ServiceRoute.find({ status: 'AKTIF' }).lean();
  const dbEmployees = await Employee.find({ durum: 'AKTIF' }).lean();
  
  console.log(`📊 DB'de ${dbRoutes.length} aktif güzergah, ${dbEmployees.length} aktif çalışan\n`);
  
  // 2) CSV dosyalarını parse et
  const csvFiles = fs.readdirSync(ROUTE_DIR).filter(f => f.endsWith('.csv') && !f.includes('Canga_Calisanlar'));
  const csvData = [];
  
  for (const file of csvFiles) {
    if (file.includes('GENEL LİSTE') || file.includes('Sayfa1')) continue; // Skip non-route files
    
    const filePath = path.join(ROUTE_DIR, file);
    const data = parseRouteCsv(filePath);
    csvData.push({ file, ...data });
  }
  
  console.log('📋 CSV Güzergahları:');
  csvData.forEach(csv => {
    console.log(`   ${csv.routeName}: ${csv.stops.length} durak, ${csv.passengers.length} yolcu`);
  });
  console.log('');
  
  // 3) Güzergah karşılaştırması
  const routeIssues = [];
  
  for (const csv of csvData) {
    const dbRoute = dbRoutes.find(r => r.routeName === csv.routeName);
    
    if (!dbRoute) {
      routeIssues.push({
        type: 'MISSING_ROUTE',
        routeName: csv.routeName,
        issue: 'CSV\'de var ama DB\'de yok',
        csvStops: csv.stops.length,
        csvPassengers: csv.passengers.length
      });
      continue;
    }
    
    // Durak sayısı kontrolü
    if (dbRoute.stops.length !== csv.stops.length) {
      routeIssues.push({
        type: 'STOP_COUNT_MISMATCH',
        routeName: csv.routeName,
        dbStops: dbRoute.stops.length,
        csvStops: csv.stops.length,
        issue: `Durak sayısı uyuşmuyor: DB=${dbRoute.stops.length}, CSV=${csv.stops.length}`
      });
    }
    
    // Durak isimleri kontrolü
    const dbStopNames = new Set(dbRoute.stops.map(s => s.name.toUpperCase()));
    const csvStopNames = new Set(csv.stops.map(s => s.name.toUpperCase()));
    
    const missingInDb = csv.stops.filter(s => !dbStopNames.has(s.name.toUpperCase()));
    const extraInDb = dbRoute.stops.filter(s => !csvStopNames.has(s.name.toUpperCase()));
    
    if (missingInDb.length > 0 || extraInDb.length > 0) {
      routeIssues.push({
        type: 'STOP_NAME_MISMATCH',
        routeName: csv.routeName,
        missingInDb: missingInDb.map(s => s.name),
        extraInDb: extraInDb.map(s => s.name),
        issue: 'Durak isimleri uyuşmuyor'
      });
    }
  }
  
  // 4) Yolcu karşılaştırması
  const passengerIssues = [];
  
  for (const csv of csvData) {
    const dbPassengers = dbEmployees.filter(emp => 
      emp.servisGuzergahi === csv.routeName || emp.serviceInfo?.routeName === csv.routeName
    );
    
    console.log(`🔍 ${csv.routeName}:`);
    console.log(`   CSV: ${csv.passengers.length} yolcu`);
    console.log(`   DB: ${dbPassengers.length} yolcu`);
    
    if (dbPassengers.length !== csv.passengers.length) {
      passengerIssues.push({
        type: 'PASSENGER_COUNT_MISMATCH',
        routeName: csv.routeName,
        dbCount: dbPassengers.length,
        csvCount: csv.passengers.length,
        difference: dbPassengers.length - csv.passengers.length
      });
    }
    
    // İsim bazında karşılaştırma
    const csvNames = new Set(csv.passengers.map(p => p.fullName.toUpperCase()));
    const dbNames = new Set(dbPassengers.map(p => (p.adSoyad || p.fullName || '').toUpperCase()));
    
    const missingInDb = csv.passengers.filter(p => !dbNames.has(p.fullName.toUpperCase()));
    const extraInDb = dbPassengers.filter(p => !csvNames.has((p.adSoyad || p.fullName || '').toUpperCase()));
    
    if (missingInDb.length > 0) {
      passengerIssues.push({
        type: 'PASSENGERS_MISSING_IN_DB',
        routeName: csv.routeName,
        missing: missingInDb.map(p => ({ name: p.fullName, stop: p.stopName }))
      });
    }
    
    if (extraInDb.length > 0) {
      passengerIssues.push({
        type: 'EXTRA_PASSENGERS_IN_DB',
        routeName: csv.routeName,
        extra: extraInDb.map(p => ({ 
          name: p.adSoyad || p.fullName, 
          id: p.employeeId,
          stop: p.durak || p.serviceInfo?.stopName 
        }))
      });
    }
  }
  
  // 5) DB'de route tanımsız çalışanlar
  const employeesWithoutRoute = dbEmployees.filter(emp => 
    !emp.servisGuzergahi && !emp.serviceInfo?.routeName
  );
  
  // 6) Rapor oluştur
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      dbRoutes: dbRoutes.length,
      csvRoutes: csvData.length,
      dbEmployees: dbEmployees.length,
      csvTotalPassengers: csvData.reduce((sum, csv) => sum + csv.passengers.length, 0),
      routeIssues: routeIssues.length,
      passengerIssues: passengerIssues.length,
      employeesWithoutRoute: employeesWithoutRoute.length
    },
    routeIssues,
    passengerIssues,
    employeesWithoutRoute: employeesWithoutRoute.map(emp => ({
      id: emp.employeeId,
      name: emp.adSoyad || emp.fullName,
      location: emp.lokasyon || emp.location
    })),
    recommendations: []
  };
  
  // 7) Öneriler oluştur
  if (routeIssues.length > 0) {
    report.recommendations.push({
      type: 'FIX_ROUTE_ISSUES',
      description: 'Güzergah tutarsızlıkları düzeltilmeli',
      count: routeIssues.length
    });
  }
  
  if (passengerIssues.length > 0) {
    report.recommendations.push({
      type: 'FIX_PASSENGER_ASSIGNMENTS',
      description: 'Yolcu atamaları düzeltilmeli',
      count: passengerIssues.length
    });
  }
  
  if (employeesWithoutRoute.length > 0) {
    report.recommendations.push({
      type: 'ASSIGN_ROUTES',
      description: 'Güzergahsız çalışanlara rota atanmalı',
      count: employeesWithoutRoute.length
    });
  }
  
  // 8) Raporu kaydet
  const reportPath = path.resolve(__dirname, 'service_validation_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  // 9) Konsol çıktısı
  console.log('📊 DOĞRULAMA SONUÇLARI:');
  console.log('=' * 50);
  console.log(`🚌 Güzergah sorunları: ${routeIssues.length}`);
  console.log(`👥 Yolcu sorunları: ${passengerIssues.length}`);
  console.log(`❓ Güzergahsız çalışan: ${employeesWithoutRoute.length}`);
  
  if (routeIssues.length > 0) {
    console.log('\n⚠️  GÜZERGAH SORUNLARI:');
    routeIssues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue.routeName}: ${issue.issue}`);
    });
  }
  
  if (passengerIssues.length > 0) {
    console.log('\n⚠️  YOLCU SORUNLARI:');
    passengerIssues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. ${issue.routeName}: ${issue.type}`);
      if (issue.dbCount !== undefined) {
        console.log(`      DB: ${issue.dbCount}, CSV: ${issue.csvCount}`);
      }
    });
  }
  
  if (employeesWithoutRoute.length > 0) {
    console.log('\n❓ GÜZERGAHSIZ ÇALIŞANLAR:');
    employeesWithoutRoute.slice(0, 10).forEach((emp, idx) => {
      console.log(`   ${idx + 1}. ${emp.name} (${emp.id}) - ${emp.location}`);
    });
    if (employeesWithoutRoute.length > 10) {
      console.log(`   ... ve ${employeesWithoutRoute.length - 10} kişi daha`);
    }
  }
  
  console.log(`\n📄 Detaylı rapor: ${reportPath}`);
  
  await mongoose.disconnect();
  return report;
}

if (require.main === module) {
  validateServiceData().catch(err => {
    console.error('❌ Hata:', err);
    mongoose.disconnect();
  });
}

module.exports = { validateServiceData };

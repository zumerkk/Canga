#!/usr/bin/env node

/**
 * 🚌 TÜM SERVİS ROTALARINI VE ÇALIŞAN DURAK BİLGİLERİNİ GÜNCELLEME SCRİPTİ
 * 
 * Bu script şunları yapar:
 * 1. CSV dosyalarından servis güzergahları ve durak bilgilerini okur
 * 2. ServiceRoute koleksiyonunu günceller (stops array)
 * 3. Employee koleksiyonunda servisGuzergahi ve durak bilgilerini günceller
 * 4. Eşleşmeyen kayıtları rapor eder
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Models
const Employee = require('../models/Employee');
const ServiceRoute = require('../models/ServiceRoute');

// 📋 Servis güzergahları ve CSV dosyaları mapping
const ROUTE_MAPPINGS = [
  {
    routeName: 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI',
    csvFile: 'ÇALILIÖZ-Tablo 1.csv',
    routeCode: 'ÇALLIÖZ'
  },
  {
    routeName: 'DİSPANSER SERVİS GÜZERGAHI',
    csvFile: 'DİSPANSER-Tablo 1.csv',
    routeCode: 'DİSPANSER'
  },
  {
    routeName: 'KARŞIYAKA SERVİS GÜZERGAHI',
    csvFile: 'KARŞIYAKA-Tablo 1.csv',
    routeCode: 'KARŞIYAKA'
  },
  {
    routeName: 'NENE HATUN CAD. SERVİS GÜZERGAHI',
    csvFile: 'NENE HATUN CAD.-Tablo 1.csv',
    routeCode: 'NENE HATUN'
  },
  {
    routeName: 'OSMANGAZİ SERVİS GÜZERGAHI',
    csvFile: 'OSM ÇARŞI MRK-Tablo 1.csv',
    routeCode: 'OSMANGAZİ'
  },
  {
    routeName: 'SANAYİ SERVİS GÜZERGAHI',
    csvFile: 'SANAYİ-Tablo 1.csv',
    routeCode: 'SANAYİ'
  }
];

// CSV dosyalarının bulunduğu klasör
const CSV_FOLDER = path.join(__dirname, '..', '..', 'PERSONEL SERVİS DURAK ÇİZELGESİ 22.09');

/**
 * CSV dosyasını okur ve parse eder
 */
function readCsvFile(filename) {
  const filePath = path.join(CSV_FOLDER, filename);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV dosyası bulunamadı: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const passengers = [];
  const stops = new Set();
  
  for (const line of lines) {
    // CSV formatı: Sıra;İsim;Durak;Telefon
    const parts = line.split(';').map(p => p.trim());
    
    if (parts.length < 3) continue;
    
    const [siraNo, isim, durak, telefon] = parts;
    
    // Sıra numarasını kontrol et (sayı olmalı)
    if (!/^\d+$/.test(siraNo)) continue;
    
    if (isim && durak) {
      passengers.push({
        siraNo: parseInt(siraNo),
        isim: isim.toUpperCase().trim(),
        durak: durak.trim(),
        telefon: telefon ? telefon.trim() : ''
      });
      
      stops.add(durak.trim());
    }
  }
  
  return {
    passengers,
    stops: Array.from(stops).sort()
  };
}

/**
 * İsim eşleştirme fonksiyonu - Türkçe karakterleri normalize eder
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toUpperCase()
    .trim()
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '')  // Parantezleri kaldır
    .replace(/\(ÇIRAK\)/gi, '')
    .replace(/\(STAJYER\)/gi, '')
    .replace(/ÇIRAK/gi, '')
    .replace(/STAJYER/gi, '');
}

/**
 * İki ismin birbirine benzeyip benzemediğini kontrol eder
 */
function namesMatch(name1, name2) {
  const n1 = normalizeText(name1);
  const n2 = normalizeText(name2);
  
  // Tam eşleşme
  if (n1 === n2) return true;
  
  // Birinin diğerini içermesi
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // İsimleri parçalara ayır ve karşılaştır
  const parts1 = n1.split(' ').filter(p => p.length > 0);
  const parts2 = n2.split(' ').filter(p => p.length > 0);
  
  // İlk ve son isimleri karşılaştır
  if (parts1.length >= 2 && parts2.length >= 2) {
    const firstName1 = parts1[0];
    const lastName1 = parts1[parts1.length - 1];
    const firstName2 = parts2[0];
    const lastName2 = parts2[parts2.length - 1];
    
    if (firstName1 === firstName2 && lastName1 === lastName2) {
      return true;
    }
  }
  
  return false;
}

/**
 * ServiceRoute koleksiyonunu günceller
 */
async function updateServiceRoute(routeName, stops, routeCode) {
  console.log(`\n📍 ${routeName} güzergahı güncelleniyor...`);
  
  // Önce route'u bul veya oluştur
  let route = await ServiceRoute.findOne({ routeName });
  
  if (!route) {
    console.log(`   ➕ Yeni güzergah oluşturuluyor: ${routeName}`);
    route = new ServiceRoute({
      routeName,
      routeCode,
      status: 'AKTIF',
      stops: [],
      createdBy: 'CSV Import Script'
    });
  }
  
  // Durakları güncelle
  route.stops = stops.map((stopName, index) => ({
    name: stopName,
    order: index + 1
  }));
  
  await route.save();
  
  console.log(`   ✅ ${stops.length} durak güncellendi`);
  
  return route;
}

/**
 * Employee kayıtlarını günceller
 */
async function updateEmployeeRecords(routeName, passengers, route) {
  console.log(`\n👥 ${routeName} çalışanları güncelleniyor...`);
  
  const results = {
    matched: [],
    notFound: [],
    updated: 0,
    skipped: 0
  };
  
  // Tüm aktif çalışanları getir
  const allEmployees = await Employee.find({ durum: 'AKTIF' }).lean();
  
  for (const passenger of passengers) {
    // Çalışanı bul
    const matchedEmployee = allEmployees.find(emp => 
      namesMatch(emp.adSoyad, passenger.isim)
    );
    
    if (matchedEmployee) {
      // Güncelleme yap
      const updateData = {
        servisGuzergahi: routeName,
        durak: passenger.durak,
        'serviceInfo.usesService': true,
        'serviceInfo.routeName': routeName,
        'serviceInfo.stopName': passenger.durak,
        'serviceInfo.routeId': route._id,
        'serviceInfo.orderNumber': passenger.siraNo
      };
      
      // Telefon varsa güncelle
      if (passenger.telefon && !matchedEmployee.cepTelefonu) {
        updateData.cepTelefonu = passenger.telefon;
      }
      
      await Employee.updateOne(
        { _id: matchedEmployee._id },
        { $set: updateData }
      );
      
      results.matched.push({
        csvName: passenger.isim,
        dbName: matchedEmployee.adSoyad,
        stop: passenger.durak
      });
      results.updated++;
      
      console.log(`   ✅ ${matchedEmployee.adSoyad} -> ${passenger.durak}`);
    } else {
      results.notFound.push({
        name: passenger.isim,
        stop: passenger.durak,
        phone: passenger.telefon
      });
      results.skipped++;
      
      console.log(`   ⚠️  Bulunamadı: ${passenger.isim}`);
    }
  }
  
  return results;
}

/**
 * Ana işlem
 */
async function main() {
  console.log('🚀 TÜM SERVİS ROTALARI GÜNCELLEME SCRİPTİ\n');
  console.log('=' .repeat(80));
  
  try {
    // MongoDB bağlantısı
    console.log('\n📡 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB bağlantısı başarılı\n');
    
    const globalResults = {
      routes: {},
      totalMatched: 0,
      totalNotFound: 0,
      totalUpdated: 0
    };
    
    // Her bir rotayı işle
    for (const mapping of ROUTE_MAPPINGS) {
      console.log('\n' + '='.repeat(80));
      console.log(`🚌 ${mapping.routeName}`);
      console.log('='.repeat(80));
      
      try {
        // CSV dosyasını oku
        console.log(`\n📄 CSV dosyası okunuyor: ${mapping.csvFile}`);
        const csvData = readCsvFile(mapping.csvFile);
        
        console.log(`   📊 ${csvData.passengers.length} yolcu bulundu`);
        console.log(`   🚏 ${csvData.stops.length} benzersiz durak bulundu`);
        
        // ServiceRoute'u güncelle
        const route = await updateServiceRoute(
          mapping.routeName,
          csvData.stops,
          mapping.routeCode
        );
        
        // Employee kayıtlarını güncelle
        const results = await updateEmployeeRecords(
          mapping.routeName,
          csvData.passengers,
          route
        );
        
        // Sonuçları sakla
        globalResults.routes[mapping.routeName] = {
          csvFile: mapping.csvFile,
          totalPassengers: csvData.passengers.length,
          matched: results.matched.length,
          notFound: results.notFound.length,
          notFoundList: results.notFound
        };
        
        globalResults.totalMatched += results.matched.length;
        globalResults.totalNotFound += results.notFound.length;
        globalResults.totalUpdated += results.updated;
        
        console.log(`\n   📊 Özet:`);
        console.log(`   ✅ Eşleşen: ${results.matched.length}`);
        console.log(`   ⚠️  Bulunamayan: ${results.notFound.length}`);
        
      } catch (error) {
        console.error(`\n   ❌ Hata: ${error.message}`);
        globalResults.routes[mapping.routeName] = {
          error: error.message
        };
      }
    }
    
    // Genel özet
    console.log('\n' + '='.repeat(80));
    console.log('📊 GENEL ÖZET');
    console.log('='.repeat(80));
    console.log(`\n✅ Toplam güncellenen çalışan: ${globalResults.totalUpdated}`);
    console.log(`⚠️  Toplam bulunamayan çalışan: ${globalResults.totalNotFound}`);
    
    // Detaylı rapor oluştur
    const reportPath = path.join(__dirname, '..', '..', 'SERVICE_UPDATE_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(globalResults, null, 2), 'utf8');
    console.log(`\n📄 Detaylı rapor kaydedildi: ${reportPath}`);
    
    // Bulunamayan çalışanları ayrı bir dosyaya yaz
    const notFoundList = [];
    for (const [routeName, data] of Object.entries(globalResults.routes)) {
      if (data.notFoundList && data.notFoundList.length > 0) {
        notFoundList.push({
          route: routeName,
          notFound: data.notFoundList
        });
      }
    }
    
    if (notFoundList.length > 0) {
      const notFoundPath = path.join(__dirname, '..', '..', 'SERVICE_NOT_FOUND_EMPLOYEES.json');
      fs.writeFileSync(notFoundPath, JSON.stringify(notFoundList, null, 2), 'utf8');
      console.log(`⚠️  Bulunamayan çalışanlar raporu: ${notFoundPath}`);
      
      console.log('\n⚠️  BULUNAMAYAN ÇALIŞANLAR:');
      console.log('='.repeat(80));
      for (const item of notFoundList) {
        console.log(`\n📍 ${item.route}:`);
        for (const person of item.notFound) {
          console.log(`   - ${person.name} (${person.stop})`);
        }
      }
    }
    
    console.log('\n✅ Güncelleme işlemi tamamlandı!');
    
  } catch (error) {
    console.error('\n❌ Fatal hata:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 MongoDB bağlantısı kapatıldı');
  }
}

// Scripti çalıştır
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  });
}

module.exports = { main };


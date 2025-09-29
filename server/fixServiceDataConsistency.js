#!/usr/bin/env node

/**
 * 🔧 Servis Veri Tutarlılığı Düzeltme Scripti
 * 
 * Bu script CSV dosyalarındaki doğru verileri kullanarak:
 * 1. Route isimlerini standardize eder
 * 2. Stop bilgilerini CSV'den alarak günceller  
 3. Employee-route atamalarını düzeltir
 * 4. Services ve Employees sayfaları arasında senkronizasyon sağlar
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Models
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute'); 

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga_database';

// CSV dosyalarının bulunduğu dizin
const CSV_DIR = path.join(__dirname, '..', 'PERSONEL SERVİS DURAK ÇİZELGESİ 22.09');

// Route mapping - CSV'deki isimlerden standardize isimlere
const ROUTE_MAPPING = {
  'ÇALILIÖZ MAHALLESİ': 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI',
  '50. YIL BLOKLARI-DİSPANSER': '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI', 
  'ETİLER KARACALİ CADDESİ': 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI',
  'OSMANGAZİ - ÇARŞI MERKEZ': 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI',
  'BAHÇELİEVLER-KARŞIYAKA': 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI',
  'NENE HATUN CADDESİ': 'NENE HATUN CADDESİ SERVİS GÜZERGAHI',
  'KENDİ ARACI İLE GELENLER': 'KENDİ ARACI İLE GELENLER'
};

// CSV dosyası eşleştirmeleri
const CSV_FILES = {
  'ÇALILIÖZ-Tablo 1.csv': 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI',
  'DİSPANSER-Tablo 1.csv': '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI',
  'SANAYİ-Tablo 1.csv': 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI',
  'OSM ÇARŞI MRK-Tablo 1.csv': 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI',
  'KARŞIYAKA-Tablo 1.csv': 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI',
  'NENE HATUN CAD.-Tablo 1.csv': 'NENE HATUN CADDESİ SERVİS GÜZERGAHI',
  'KENDİ-Tablo 1.csv': 'KENDİ ARACI İLE GELENLER'
};

// Text normalizasyon fonksiyonu
function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .replace(/[IİıĝĞİıŞşÇçÖöÜü]/g, match => {
      const map = { 'I': 'İ', 'İ': 'İ', 'ı': 'i', 'ĝ': 'g', 'Ğ': 'G', 'ş': 'Ş', 'Ş': 'Ş', 'ç': 'Ç', 'Ç': 'Ç', 'ö': 'Ö', 'Ö': 'Ö', 'ü': 'Ü', 'Ü': 'Ü' };
      return map[match] || match;
    });
}

// CSV dosyası okuma fonksiyonu
function readCSVFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').map(line => line.split(';'));
    return lines;
  } catch (error) {
    console.error(`❌ CSV dosyası okunamadı: ${filePath}`, error);
    return [];
  }
}

// CSV'den route ve employee verilerini parse etme
function parseCSVData(lines, routeName) {
  const routeData = {
    routeName,
    originalName: '',
    departureTime: '',
    stops: [],
    employees: []
  };

  let isEmployeeSection = false;
  let stopOrder = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const firstCol = line[0]?.trim();

    if (!firstCol) continue;

    // Route orijinal adını al
    if (i === 0) {
      routeData.originalName = firstCol;
    }

    // Hareket saatini al
    if (firstCol.includes('HAREKET SAATİ')) {
      const timeMatch = firstCol.match(/(\d{2}[.:]?\d{2})/);
      if (timeMatch) {
        routeData.departureTime = timeMatch[1].replace('.', ':');
      }
    }

    // Durakları tespit et (SIRA NO'dan önceki tüm satırlar durak)
    if (firstCol === 'SIRA NO' || firstCol.includes('PERSONEL ADI')) {
      isEmployeeSection = true;
      continue;
    }

    if (!isEmployeeSection && firstCol && !firstCol.includes('SERVİS GÜZERGAHI') && !firstCol.includes('HAREKET SAATİ') && firstCol !== routeData.originalName) {
      // Stop ise ekle (boş olmayan ve route info olmayan)
      if (firstCol.length > 3) {
        routeData.stops.push({
          name: firstCol,
          order: stopOrder++
        });
      }
    }

    // Employee verilerini al
    if (isEmployeeSection && line.length >= 3) {
      const siraNo = line[0]?.trim();
      const fullName = line[1]?.trim();
      const stop = line[2]?.trim();
      const phone = line[3]?.trim();

      // Sayı ile başlayan sıra numarası var mı kontrol et
      if (/^\d+$/.test(siraNo) && fullName) {
        routeData.employees.push({
          siraNo: parseInt(siraNo),
          fullName,
          stop: stop || 'Belirsiz',
          phone: phone || '',
          route: routeName
        });
      }
    }
  }

  return routeData;
}

// Database'deki route'u güncelle
async function updateServiceRoute(routeData) {
  try {
    console.log(`🔄 Route güncelleniyor: ${routeData.routeName}`);

    // Mevcut route'u bul veya oluştur
    let route = await ServiceRoute.findOne({ routeName: routeData.routeName });
    
    if (!route) {
      route = new ServiceRoute({
        routeName: routeData.routeName,
        routeCode: generateRouteCode(routeData.routeName),
        status: 'AKTIF'
      });
    }

    // Durakları güncelle
    route.stops = routeData.stops.map(stop => ({
      name: stop.name,
      order: stop.order
    }));

    // Schedule'ı güncelle
    if (routeData.departureTime) {
      route.schedule = [{
        time: routeData.departureTime,
        isActive: true
      }];
    }

    // İstatistikleri güncelle
    route.statistics = {
      totalEmployees: routeData.employees.length,
      activeEmployees: routeData.employees.length
    };

    route.updatedBy = 'CSV Import Script';
    route.updatedAt = new Date();

    await route.save();
    console.log(`✅ Route başarıyla güncellendi: ${routeData.routeName}`);
    
    return route;
  } catch (error) {
    console.error(`❌ Route güncellenirken hata: ${routeData.routeName}`, error);
    throw error;
  }
}

// Route kodu oluştur
function generateRouteCode(routeName) {
  if (routeName.includes('NENE HATUN')) return 'NHC-01';
  if (routeName.includes('DİSPANSER')) return 'YBD-02';
  if (routeName.includes('ETİLER')) return 'EKC-03';
  if (routeName.includes('OSMANGAZİ')) return 'OCM-04';
  if (routeName.includes('ÇALLIÖZ')) return 'CAL-05';
  if (routeName.includes('KARŞIYAKA')) return 'BKM-06';
  if (routeName.includes('KENDİ ARACI')) return 'KENDI-07';
  return 'RT-' + Math.random().toString(36).substr(2, 3).toUpperCase();
}

// Employee'yi route'a ata
async function assignEmployeeToRoute(employeeData, routeId) {
  try {
    // Employee'yi isim ile bul (fuzzy matching)
    const nameRegex = new RegExp(
      normalizeText(employeeData.fullName)
        .replace(/[\s-().]/g, '.*'), 
      'i'
    );

    const employee = await Employee.findOne({
      $or: [
        { adSoyad: nameRegex },
        { fullName: nameRegex }
      ],
      durum: 'AKTIF'
    });

    if (!employee) {
      console.warn(`⚠️ Employee bulunamadı: ${employeeData.fullName}`);
      return false;
    }

    // Employee'nin service bilgilerini güncelle
    const updateData = {
      servisGuzergahi: employeeData.route,
      durak: employeeData.stop,
      serviceInfo: {
        usesService: employeeData.route !== 'KENDİ ARACI İLE GELENLER',
        routeName: employeeData.route,
        stopName: employeeData.stop,
        routeId: routeId,
        usesOwnCar: employeeData.route === 'KENDİ ARACI İLE GELENLER',
        orderNumber: employeeData.siraNo || 0
      },
      updatedAt: new Date()
    };

    // Telefon numarasını da güncelle
    if (employeeData.phone && employeeData.phone.length >= 10) {
      updateData.telefon = employeeData.phone;
    }

    await Employee.findByIdAndUpdate(employee._id, { $set: updateData });
    
    console.log(`✅ Employee güncellendi: ${employee.adSoyad || employee.fullName} → ${employeeData.route} (${employeeData.stop})`);
    return true;
  } catch (error) {
    console.error(`❌ Employee atanırken hata: ${employeeData.fullName}`, error);
    return false;
  }
}

// Ana işlem fonksiyonu
async function processCSVFile(fileName, routeName) {
  const filePath = path.join(CSV_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ CSV dosyası bulunamadı: ${filePath}`);
    return;
  }

  console.log(`\n📋 İşleniyor: ${fileName} → ${routeName}`);
  
  // CSV'yi oku ve parse et
  const lines = readCSVFile(filePath);
  const routeData = parseCSVData(lines, routeName);

  console.log(`📊 Route: ${routeData.originalName}`);
  console.log(`📊 Durak sayısı: ${routeData.stops.length}`);
  console.log(`📊 Çalışan sayısı: ${routeData.employees.length}`);
  console.log(`📊 Hareket saati: ${routeData.departureTime || 'Belirsiz'}`);

  // Route'u güncelle
  const route = await updateServiceRoute(routeData);

  // Employee'leri route'a ata
  let successCount = 0;
  for (const employeeData of routeData.employees) {
    const success = await assignEmployeeToRoute(employeeData, route._id);
    if (success) successCount++;
  }

  console.log(`✅ ${successCount}/${routeData.employees.length} çalışan başarıyla atandı`);
}

// Duplicate/inconsistent route'ları temizle
async function cleanupDuplicateRoutes() {
  console.log('\n🧹 Duplicate route\'lar temizleniyor...');
  
  try {
    // Benzer isimdeki route'ları bul ve birleştir
    const routes = await ServiceRoute.find();
    const routeGroups = {};

    routes.forEach(route => {
      const normalizedName = normalizeText(route.routeName);
      if (!routeGroups[normalizedName]) {
        routeGroups[normalizedName] = [];
      }
      routeGroups[normalizedName].push(route);
    });

    for (const [normalizedName, groupRoutes] of Object.entries(routeGroups)) {
      if (groupRoutes.length > 1) {
        console.log(`🔄 Duplicate route grubu: ${normalizedName} (${groupRoutes.length} adet)`);
        
        // En güncel/kapsamlı route'u seç
        const mainRoute = groupRoutes.reduce((prev, current) => {
          return (current.stops.length > prev.stops.length || current.updatedAt > prev.updatedAt) ? current : prev;
        });

        // Diğerlerini sil
        for (const route of groupRoutes) {
          if (route._id.toString() !== mainRoute._id.toString()) {
            console.log(`🗑️ Siliniyor: ${route.routeName} (${route._id})`);
            
            // Bu route'u kullanan employee'leri main route'a taşı
            await Employee.updateMany(
              { 'serviceInfo.routeId': route._id },
              { 
                $set: { 
                  'serviceInfo.routeId': mainRoute._id,
                  'serviceInfo.routeName': mainRoute.routeName,
                  servisGuzergahi: mainRoute.routeName
                }
              }
            );
            
            await ServiceRoute.findByIdAndDelete(route._id);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Route cleanup hatası:', error);
  }
}

// İstatistikleri yeniden hesapla
async function recalculateStatistics() {
  console.log('\n📊 İstatistikler yeniden hesaplanıyor...');
  
  const routes = await ServiceRoute.find();
  
  for (const route of routes) {
    const employeeCount = await Employee.countDocuments({
      $or: [
        { 'serviceInfo.routeId': route._id },
        { servisGuzergahi: route.routeName }
      ],
      durum: 'AKTIF'
    });

    route.statistics = {
      totalEmployees: employeeCount,
      activeEmployees: employeeCount
    };

    await route.save();
    console.log(`📊 ${route.routeName}: ${employeeCount} çalışan`);
  }
}

// Ana fonksiyon
async function main() {
  try {
    console.log('🚀 Servis Veri Tutarlılığı Düzeltme Scripti Başlatılıyor...\n');

    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı kuruldu\n');

    // Her CSV dosyasını işle
    for (const [fileName, routeName] of Object.entries(CSV_FILES)) {
      await processCSVFile(fileName, routeName);
    }

    // Cleanup ve optimization
    await cleanupDuplicateRoutes();
    await recalculateStatistics();

    console.log('\n🎉 İşlem başarıyla tamamlandı!');
    console.log('\n📋 Özet:');
    console.log('✅ Route isimleri standardize edildi');
    console.log('✅ Stop bilgileri CSV\'den güncellendi');
    console.log('✅ Employee-route atamaları düzeltildi');
    console.log('✅ Duplicate route\'lar temizlendi');
    console.log('✅ İstatistikler yeniden hesaplandı');

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
}

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = {
  main,
  processCSVFile,
  updateServiceRoute,
  assignEmployeeToRoute,
  cleanupDuplicateRoutes,
  recalculateStatistics
};

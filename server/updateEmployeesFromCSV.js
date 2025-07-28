const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// .env dosyasını yükle
dotenv.config();

// Güzergah isimlerini düzelt
const routeNameMap = {
  'Dispanser': 'DİSPANSER SERVİS GÜZERGAHI',
  'Sanayi': 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI',
  'Osmangazi-Karşıyaka Mahallesi': 'OSMANGAZİ-KARŞIYAKA MAHALLESİ',
  'Çalılıöz': 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI',
  'Çarşı Merkez': 'ÇARŞI MERKEZ SERVİS GÜZERGAHI'
};

// İsim düzeltmeleri (bazı isimler farklı yazılmış olabilir)
const nameCorrections = {
  'CEVCET ÖKSÜZ': 'CEVDET ÖKSÜZ',
  'SONER ÇETİN GÜRSOY': 'SONER GÜRSOY',
  'FURKAN KADİR EDEN': 'FURKAN KADİR ESEN'
};

async function updateEmployeesFromCSV() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // CSV dosyalarını oku
    console.log('\n📊 CSV Dosyalarını Okuyorum:');
    
    // 1. Servis güzergahları CSV'si
    const serviceRoutesCsvContent = fs.readFileSync('../guzergah_yolcu_listesi.csv', 'utf8');
    const routeRecords = parse(serviceRoutesCsvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    console.log(`✅ Servis güzergahları CSV'sinde ${routeRecords.length} yolcu var`);
    
    // 2. Kendi aracı ile gelenler CSV'si
    const ownCarCsvContent = fs.readFileSync('../kendi_araci_ile_gelenler.csv', 'utf8');
    const ownCarRecords = parse(ownCarCsvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    console.log(`✅ Kendi aracı ile gelenler CSV'sinde ${ownCarRecords.length} çalışan var`);

    // Tüm güzergahları al
    const routes = await ServiceRoute.find({ status: 'AKTIF' });
    console.log(`📋 ${routes.length} aktif servis güzergahı bulundu`);

    // Güzergah bilgilerini hazırla
    const routeInfo = {};
    for (const route of routes) {
      routeInfo[route.routeName] = {
        _id: route._id,
        stops: route.stops
      };
    }

    // Önce tüm çalışanların servis bilgilerini sıfırla
    console.log('\n🔄 Tüm çalışanların servis bilgilerini sıfırlıyorum...');
    await Employee.updateMany(
      { durum: 'AKTIF' },
      {
        $set: {
          servisGuzergahi: null,
          durak: null,
          servisKullaniyor: false,
          kendiAraci: false,
          kendiAraciNot: null,
          serviceInfo: {
            usesService: false,
            usesOwnCar: false
          }
        }
      }
    );
    console.log('✅ Tüm çalışanların servis bilgileri sıfırlandı');

    // 1. Servis kullanan çalışanları güncelle
    console.log('\n🚌 Servis kullanan çalışanları güncelliyorum...');
    let serviceUpdated = 0;
    let serviceNotFound = 0;
    let stopNotFound = 0;
    let stopsAdded = [];

    for (const record of routeRecords) {
      try {
        // CSV'den bilgileri al
        let employeeName = record["Yolcu_Adi"];
        let stopName = record["Durak"];
        let routeNameShort = record["Guzergah"];
        
        if (!employeeName || !stopName || !routeNameShort) {
          console.log('⚠️ Eksik veri:', record);
          continue;
        }
        
        employeeName = employeeName.trim();
        stopName = stopName.trim();
        routeNameShort = routeNameShort.trim();
        
        // İsim düzeltmesi varsa uygula
        if (nameCorrections[employeeName]) {
          console.log(`🔄 İsim düzeltme: ${employeeName} -> ${nameCorrections[employeeName]}`);
          employeeName = nameCorrections[employeeName];
        }
        
        // Güzergah adını tam formata çevir
        const routeName = routeNameMap[routeNameShort] || routeNameShort;
        
        if (!routeInfo[routeName]) {
          console.log(`⚠️ Güzergah bulunamadı: ${routeName}`);
          continue;
        }
        
        // Çalışanı bul (büyük/küçük harf duyarlılığını kaldır)
        const employee = await Employee.findOne({
          adSoyad: { $regex: new RegExp(`^${employeeName}$`, 'i') }
        });
        
        if (!employee) {
          console.log(`❌ Çalışan bulunamadı: ${employeeName}`);
          serviceNotFound++;
          continue;
        }
        
        // Durağı kontrol et (tam eşleşme olmayabilir)
        let matchedStop = null;
        
        // Önce tam eşleşme ara
        matchedStop = routeInfo[routeName].stops.find(stop => 
          stop.name.toUpperCase() === stopName.toUpperCase()
        );
        
        // Tam eşleşme yoksa, içeren bir durak ara
        if (!matchedStop) {
          matchedStop = routeInfo[routeName].stops.find(stop => 
            stop.name.toUpperCase().includes(stopName.toUpperCase()) || 
            stopName.toUpperCase().includes(stop.name.toUpperCase())
          );
        }
        
        // Hala bulunamadıysa ve bu durak daha önce eklenmemişse, yeni durak olarak ekle
        if (!matchedStop && !stopsAdded.includes(`${routeName}-${stopName}`)) {
          console.log(`⚠️ Durak bulunamadı: ${stopName} (${routeName} güzergahında)`);
          stopNotFound++;
          
          // En son durak sıra numarasını bul
          const lastOrderNo = Math.max(...routeInfo[routeName].stops.map(s => s.order), 0);
          
          // Yeni durak ekle
          const updatedRoute = await ServiceRoute.findByIdAndUpdate(
            routeInfo[routeName]._id,
            { 
              $push: { 
                stops: { 
                  name: stopName, 
                  order: lastOrderNo + 1 
                } 
              } 
            },
            { new: true }
          );
          
          // Güzergah bilgilerini güncelle
          routeInfo[routeName].stops = updatedRoute.stops;
          matchedStop = updatedRoute.stops.find(s => s.name === stopName);
          console.log(`✅ Yeni durak eklendi: ${stopName} (${routeName} güzergahına)`);
          
          // Eklenen durağı kaydet
          stopsAdded.push(`${routeName}-${stopName}`);
        }
        
        // Çalışanı güncelle
        await Employee.findByIdAndUpdate(
          employee._id,
          {
            servisGuzergahi: routeName,
            durak: matchedStop ? matchedStop.name : stopName,
            servisKullaniyor: true,
            lokasyon: getLokasyonFromRoute(routeName),
            serviceInfo: {
              usesService: true,
              routeName: routeName,
              stopName: matchedStop ? matchedStop.name : stopName,
              routeId: routeInfo[routeName]._id
            }
          }
        );
        
        console.log(`✅ ${employee.adSoyad}: ${routeName} güzergahına ${matchedStop ? matchedStop.name : stopName} durağıyla atandı`);
        serviceUpdated++;
        
      } catch (error) {
        console.error(`❌ Hata: ${error.message}`);
      }
    }

    console.log(`\n📊 Servis Güncelleme Sonuçları:`);
    console.log(`✅ ${serviceUpdated} çalışanın servis bilgisi güncellendi`);
    console.log(`⚠️ ${serviceNotFound} çalışan bulunamadı`);
    console.log(`⚠️ ${stopNotFound} durak bulunamadı ve yeni eklendi`);

    // 2. Kendi aracı ile gelen çalışanları güncelle
    console.log('\n🚗 Kendi aracı ile gelen çalışanları güncelliyorum...');
    let ownCarUpdated = 0;
    let ownCarNotFound = 0;

    for (const record of ownCarRecords) {
      try {
        let employeeName = record["Ad Soyad"];
        
        if (!employeeName) {
          console.log('⚠️ Eksik veri:', record);
          continue;
        }
        
        employeeName = employeeName.trim();
        
        // İsim düzeltmesi varsa uygula
        if (nameCorrections[employeeName]) {
          console.log(`🔄 İsim düzeltme: ${employeeName} -> ${nameCorrections[employeeName]}`);
          employeeName = nameCorrections[employeeName];
        }
        
        // Çalışanı bul (büyük/küçük harf duyarlılığını kaldır)
        const employee = await Employee.findOne({
          adSoyad: { $regex: new RegExp(`^${employeeName}$`, 'i') }
        });
        
        if (!employee) {
          console.log(`❌ Çalışan bulunamadı: ${employeeName}`);
          ownCarNotFound++;
          continue;
        }
        
        // Not bilgisi
        const note = record["Not"] ? record["Not"].trim() : '';
        
        // Çalışanı güncelle
        await Employee.findByIdAndUpdate(
          employee._id,
          {
            servisGuzergahi: null,
            durak: null,
            servisKullaniyor: false,
            kendiAraci: true,
            kendiAraciNot: note,
            serviceInfo: {
              usesService: false,
              usesOwnCar: true,
              ownCarNote: note
            }
          }
        );
        
        console.log(`✅ ${employee.adSoyad}: Kendi aracı ile geliyor${note ? ' (' + note + ')' : ''}`);
        ownCarUpdated++;
        
      } catch (error) {
        console.error(`❌ Hata: ${error.message}`);
      }
    }

    console.log(`\n📊 Kendi Aracı Güncelleme Sonuçları:`);
    console.log(`✅ ${ownCarUpdated} çalışanın kendi aracı bilgisi güncellendi`);
    console.log(`⚠️ ${ownCarNotFound} çalışan bulunamadı`);

    // Güncel durumu kontrol et
    const updatedServiceUsers = await Employee.countDocuments({
      servisGuzergahi: { $exists: true, $ne: null }
    });
    
    const updatedOwnCarUsers = await Employee.countDocuments({
      kendiAraci: true
    });
    
    console.log(`\n📊 Güncelleme Sonrası Durum:`);
    console.log(`✅ Servis kullanan: ${updatedServiceUsers} çalışan`);
    console.log(`✅ Kendi aracı ile gelen: ${updatedOwnCarUsers} çalışan`);
    console.log(`✅ Toplam: ${updatedServiceUsers + updatedOwnCarUsers} çalışan`);

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Güzergah adından lokasyon belirle
function getLokasyonFromRoute(routeName) {
  const routeLocationMap = {
    'DİSPANSER SERVİS GÜZERGAHI': 'MERKEZ',
    'ÇARŞI MERKEZ SERVİS GÜZERGAHI': 'MERKEZ',
    'SANAYİ MAHALLESİ SERVİS GÜZERGAHI': 'İŞL',
    'OSMANGAZİ-KARŞIYAKA MAHALLESİ': 'OSB',
    'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI': 'İŞIL'
  };
  
  return routeLocationMap[routeName] || 'MERKEZ';
}

// Script'i çalıştır
updateEmployeesFromCSV(); 
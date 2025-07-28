const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');
const fs = require('fs');

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

// İsim düzeltmeleri
const nameCorrections = {
  'CEVCET ÖKSÜZ': 'CEVDET ÖKSÜZ',
  'SONER ÇETİN GÜRSOY': 'SONER GÜRSOY',
  'FURKAN KADİR EDEN': 'FURKAN KADİR ESEN',
  'MEHMET KEMAL İNAÇ': 'MEHMET KEMAL İNANÇ',
  'MUHAMMED NAZİM GÖÇ': 'MUHAMMET NAZİM GÖÇ'
};

// İsim eşleştirme fonksiyonu - daha esnek
function findBestMatch(name, employeeList) {
  // Düzeltme varsa uygula
  if (nameCorrections[name]) {
    name = nameCorrections[name];
  }
  
  // Tam eşleşme
  const exactMatch = employeeList.find(emp => 
    emp.adSoyad.toUpperCase() === name.toUpperCase()
  );
  
  if (exactMatch) return exactMatch;
  
  // Kısmi eşleşme - isim veya soyisim
  const nameParts = name.split(' ');
  const partialMatches = employeeList.filter(emp => {
    const empNameParts = emp.adSoyad.split(' ');
    
    // İsim veya soyisim eşleşmesi
    return nameParts.some(part => 
      empNameParts.some(empPart => 
        empPart.toUpperCase() === part.toUpperCase()
      )
    );
  });
  
  if (partialMatches.length === 1) return partialMatches[0];
  
  // En iyi eşleşmeyi bul
  if (partialMatches.length > 1) {
    // En çok kelime eşleşen
    const bestMatch = partialMatches.reduce((best, current) => {
      const currentNameParts = current.adSoyad.split(' ');
      const currentMatchCount = nameParts.filter(part => 
        currentNameParts.some(currentPart => 
          currentPart.toUpperCase() === part.toUpperCase()
        )
      ).length;
      
      const bestNameParts = best ? best.adSoyad.split(' ') : [];
      const bestMatchCount = best ? nameParts.filter(part => 
        bestNameParts.some(bestPart => 
          bestPart.toUpperCase() === part.toUpperCase()
        )
      ).length : 0;
      
      return currentMatchCount > bestMatchCount ? current : best;
    }, null);
    
    return bestMatch;
  }
  
  return null;
}

async function finalUpdateEmployees() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Tüm aktif çalışanları al
    const allEmployees = await Employee.find({ durum: 'AKTIF' });
    console.log(`\n📊 Toplam ${allEmployees.length} aktif çalışan var`);

    // CSV dosyalarını oku
    console.log('\n📊 CSV Dosyalarını Okuyorum:');
    
    // 1. Servis güzergahları CSV'si
    const serviceRoutesCsvContent = fs.readFileSync('../guzergah_yolcu_listesi.csv', 'utf8');
    const serviceRoutesLines = serviceRoutesCsvContent.split('\n').filter(line => line.trim() !== '');
    const routeRecords = [];
    
    // Başlık satırını atla (ilk satır)
    for (let i = 1; i < serviceRoutesLines.length; i++) {
      const line = serviceRoutesLines[i];
      const [guzergah, yolcuAdi, durak] = line.split(',');
      
      if (guzergah && yolcuAdi && durak) {
        routeRecords.push({
          guzergah: guzergah.trim(),
          yolcuAdi: yolcuAdi.trim(),
          durak: durak.trim()
        });
      }
    }
    
    console.log(`✅ Servis güzergahları CSV'sinde ${routeRecords.length} yolcu var`);
    
    // 2. Kendi aracı ile gelenler CSV'si
    const ownCarCsvContent = fs.readFileSync('../kendi_araci_ile_gelenler.csv', 'utf8');
    const ownCarLines = ownCarCsvContent.split('\n').filter(line => line.trim() !== '');
    const ownCarRecords = [];
    
    // Başlık satırını atla (ilk satır)
    for (let i = 1; i < ownCarLines.length; i++) {
      const line = ownCarLines[i];
      const parts = line.split(',');
      
      if (parts.length >= 2) {
        const kategori = parts[0].trim();
        const adSoyad = parts[1].trim();
        const not = parts.length > 2 ? parts[2].trim() : '';
        
        ownCarRecords.push({
          kategori,
          adSoyad,
          not
        });
      }
    }
    
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
        let employeeName = record.yolcuAdi;
        let stopName = record.durak;
        let routeNameShort = record.guzergah;
        
        // Güzergah adını tam formata çevir
        const routeName = routeNameMap[routeNameShort] || routeNameShort;
        
        if (!routeInfo[routeName]) {
          console.log(`⚠️ Güzergah bulunamadı: ${routeName}`);
          continue;
        }
        
        // Çalışanı bul (esnek eşleştirme)
        const employee = findBestMatch(employeeName, allEmployees);
        
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
        
        console.log(`✅ ${employee.adSoyad} (${employeeName}): ${routeName} güzergahına ${matchedStop ? matchedStop.name : stopName} durağıyla atandı`);
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
        let employeeName = record.adSoyad;
        
        // Çalışanı bul (esnek eşleştirme)
        const employee = findBestMatch(employeeName, allEmployees);
        
        if (!employee) {
          console.log(`❌ Çalışan bulunamadı: ${employeeName}`);
          ownCarNotFound++;
          continue;
        }
        
        // Not bilgisi
        const note = record.not || '';
        
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
        
        console.log(`✅ ${employee.adSoyad} (${employeeName}): Kendi aracı ile geliyor${note ? ' (' + note + ')' : ''}`);
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
finalUpdateEmployees(); 
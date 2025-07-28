const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// .env dosyasını yükle
dotenv.config();

// CSV dosyasını oku ve parse et
const csvData = fs.readFileSync('./guzergah_yolcu_listesi.csv', 'utf8');
const records = parse(csvData, {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

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

async function updateEmployeeServices() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

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

    // CSV'deki her kayıt için çalışanı güncelle
    let updated = 0;
    let notFound = 0;
    let stopNotFound = 0;

    for (const record of records) {
      try {
        // CSV'den bilgileri al
        let employeeName = record.Yolcu_Adi.trim();
        let stopName = record.Durak.trim();
        let routeNameShort = record.Guzergah.trim();
        
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
          notFound++;
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
        
        // Hala bulunamadıysa, yeni durak olarak ekle
        if (!matchedStop) {
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
        }
        
        // Çalışanı güncelle
        await Employee.findByIdAndUpdate(
          employee._id,
          {
            servisGuzergahi: routeName,
            durak: matchedStop.name,
            servisKullaniyor: true,
            lokasyon: getLokasyonFromRoute(routeName),
            serviceInfo: {
              usesService: true,
              routeName: routeName,
              stopName: matchedStop.name,
              routeId: routeInfo[routeName]._id
            }
          }
        );
        
        console.log(`✅ ${employee.adSoyad}: ${routeName} güzergahına ${matchedStop.name} durağıyla atandı`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Hata: ${error.message}`);
      }
    }
    
    // Servis kullanmayan çalışanları işaretle
    const updatedEmployees = await Employee.find({ durum: 'AKTIF' }).select('adSoyad');
    const csvEmployeeNames = records.map(r => {
      const name = r.Yolcu_Adi.trim();
      return nameCorrections[name] || name;
    });
    
    let markedAsNonService = 0;
    
    for (const employee of updatedEmployees) {
      // CSV'de olmayan çalışanlar servis kullanmıyor olarak işaretle
      const isInCSV = csvEmployeeNames.some(name => 
        name.toUpperCase() === employee.adSoyad.toUpperCase()
      );
      
      if (!isInCSV) {
        await Employee.findByIdAndUpdate(
          employee._id,
          {
            servisGuzergahi: null,
            durak: null,
            servisKullaniyor: false,
            serviceInfo: {
              usesService: false
            }
          }
        );
        markedAsNonService++;
      }
    }

    console.log(`\n📊 SONUÇ:`);
    console.log(`✅ ${updated} çalışanın servis bilgisi güncellendi`);
    console.log(`⚠️ ${notFound} çalışan bulunamadı`);
    console.log(`⚠️ ${stopNotFound} durak bulunamadı ve yeni eklendi`);
    console.log(`ℹ️ ${markedAsNonService} çalışan servis kullanmıyor olarak işaretlendi`);

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
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
updateEmployeeServices(); 
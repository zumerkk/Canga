const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');
require('dotenv').config();

async function main() {
  try {
    // MongoDB'ye bağlan
    console.log('🔄 MongoDB bağlantısı kuruluyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');
    
    // SERVİS GÜZERGAHLARıNı GÜNCELLE
    console.log('📥 Servis güzergahları güncelleniyor...');
    
    // Mevcut servis rotalarını temizle
    await ServiceRoute.deleteMany({});
    console.log('✅ Mevcut servis rotaları temizlendi');
    
    const routeFiles = [
      { file: '../PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)/ÇALILIÖZ-Tablo 1.csv', name: 'ÇALILIÖZ MAHALLESİ' },
      { file: '../PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)/ÇARŞI MRKZ-Tablo 1.csv', name: 'ÇARŞI MERKEZ' },
      { file: '../PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)/DİSPANSER-Tablo 1.csv', name: 'DİSPANSER' },
      { file: '../PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)/KENDİ-Tablo 1.csv', name: 'KENDİ ARACI İLE GELENLER' },
      { file: '../PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)/OSM KRŞ-Tablo 1.csv', name: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ' },
      { file: '../PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)/SANAYİ-Tablo 1.csv', name: 'SANAYİ MAHALLESİ' }
    ];
    
    for (const routeFile of routeFiles) {
      const stops = [];
      const passengers = [];
      let isReadingStops = false;
      let isReadingPassengers = false;
      
      const data = fs.readFileSync(path.join(__dirname, routeFile.file), 'utf8');
      const lines = data.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(';');
        
        // Güzergah başlığını atla
        if (i === 0) continue;
        
        // FABRİKA görene kadar durakları oku
        if (parts[0] === 'FABRİKA') {
          stops.push(parts[0]);
          isReadingStops = false;
          isReadingPassengers = true;
          continue;
        }
        
        // Durakları oku
        if (parts[0] && parts[0] !== 'SERVİS GÜZERGAHI' && !parts[1] && !isReadingPassengers) {
          if (parts[0] !== routeFile.name) {
            stops.push(parts[0]);
          }
        }
        
        // Yolcuları oku
        if (isReadingPassengers && parts[0] && parts[1]) {
          passengers.push({
            name: parts[0].trim(),
            stop: parts[1].trim()
          });
        }
      }
      
      // Servis rotasını kaydet
      const newRoute = new ServiceRoute({
        routeName: routeFile.name,
        routeCode: routeFile.name.substring(0, 3).toUpperCase(),
        stops: stops.map((stop, index) => ({
          name: stop,
          order: index + 1
        })),
        status: 'AKTIF',
        statistics: {
          totalEmployees: passengers.length,
          activeEmployees: passengers.length
        }
      });
      
      await newRoute.save();
      console.log(`✅ ${routeFile.name}: ${stops.length} durak, ${passengers.length} yolcu`);
      
      // Yolcuların servis bilgilerini güncelle
      for (const passenger of passengers) {
        const updateResult = await Employee.updateOne(
          { adSoyad: passenger.name, durum: 'AKTIF' },
          { 
            $set: { 
              servisGuzergahi: routeFile.name,
              durak: passenger.stop,
              kendiAraci: routeFile.name.includes('KENDİ ARACI'),
              serviceInfo: {
                usesService: !routeFile.name.includes('KENDİ ARACI'),
                routeName: routeFile.name,
                stopName: passenger.stop,
                routeId: newRoute._id
              }
            }
          }
        );
        
        if (updateResult.modifiedCount === 0) {
          console.log(`   ⚠️ ${passenger.name} bulunamadı veya güncellenmedi`);
        }
      }
    }
    
    // İstatistikler
    console.log('\n📊 ÖZET RAPOR:');
    console.log('================');
    
    const totalActive = await Employee.countDocuments({ durum: 'AKTIF' });
    const totalFormer = await Employee.countDocuments({ durum: 'PASIF' });
    const totalRoutes = await ServiceRoute.countDocuments();
    const withService = await Employee.countDocuments({ 
      durum: 'AKTIF', 
      'serviceInfo.usesService': true 
    });
    const withOwnCar = await Employee.countDocuments({ 
      durum: 'AKTIF', 
      kendiAraci: true 
    });
    
    console.log(`✅ Toplam Aktif Çalışan: ${totalActive}`);
    console.log(`✅ Toplam İşten Ayrılan: ${totalFormer}`);
    console.log(`✅ Toplam Servis Güzergahı: ${totalRoutes}`);
    console.log(`✅ Servis Kullanan: ${withService} kişi`);
    console.log(`✅ Kendi Aracı ile Gelen: ${withOwnCar} kişi`);
    
    console.log('\n✅ SERVİS GÜZERGAHLARı BAŞARIYLA GÜNCELLENDİ!');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

main();

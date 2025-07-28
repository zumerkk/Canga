const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ServiceRoute = require('./models/ServiceRoute');
const Employee = require('./models/Employee');

// .env dosyasını yükle
dotenv.config();

async function checkRoutes() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Aktif güzergahları al
    const routes = await ServiceRoute.find({ status: 'AKTIF' });
    console.log('\n📋 Aktif güzergahlar ve durak sayıları:');
    for (const route of routes) {
      console.log(`- ${route.routeName}: ${route.stops.length} durak`);
    }

    // Her güzergahtaki yolcu sayısını bul
    console.log('\n👥 Güzergahlara göre yolcu dağılımı:');
    for (const route of routes) {
      const passengerCount = await Employee.countDocuments({ servisGuzergahi: route.routeName });
      console.log(`- ${route.routeName}: ${passengerCount} yolcu`);
    }

    // Duraklar ve yolcu sayıları
    console.log('\n🚏 Duraklara göre yolcu dağılımı:');
    for (const route of routes) {
      console.log(`\n${route.routeName}:`);
      
      // Her duraktaki yolcu sayısını bul
      for (const stop of route.stops) {
        const stopPassengerCount = await Employee.countDocuments({ 
          servisGuzergahi: route.routeName,
          durak: stop.name
        });
        
        if (stopPassengerCount > 0) {
          console.log(`  - ${stop.name}: ${stopPassengerCount} yolcu`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
checkRoutes(); 
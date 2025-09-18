const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

// .env dosyasını yükle
dotenv.config();

// Lokasyon bazlı güzergah eşleştirmeleri - Doğru güzergah isimleri
const locationRouteMapping = {
  'MERKEZ': ['DİSPANSER', 'ÇARŞI MERKEZ'],
  'İŞL': ['SANAYİ MAHALLESİ'],
  'OSB': ['OSMANGAZİ-KARŞIYAKA MAHALLESİ'],
  'İŞIL': ['ÇALILIÖZ MAHALLESİ']
};

async function updateEmployeeServiceInfo() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Tüm aktif güzergahları al
    const routes = await ServiceRoute.find({ status: 'AKTIF' });
    console.log(`📋 ${routes.length} aktif servis güzergahı bulundu`);

    // Her güzergah için durak bilgilerini hazırla
    const routeInfo = {};
    routes.forEach(route => {
      routeInfo[route.routeName] = {
        _id: route._id,
        stops: route.stops.sort((a, b) => a.order - b.order)
      };
    });

    // Tüm aktif çalışanları al
    const employees = await Employee.find({ durum: 'AKTIF' });
    console.log(`👥 ${employees.length} aktif çalışan bulundu`);
    
    let updated = 0;
    let skipped = 0;

    // Her çalışanın servis bilgisini güncelle
    for (const employee of employees) {
      try {
        // Çalışanın lokasyonuna göre uygun güzergahlar
        const lokasyon = employee.lokasyon;
        const possibleRoutes = locationRouteMapping[lokasyon] || [];

        if (possibleRoutes.length === 0) {
          console.log(`⚠️ "${employee.adSoyad}" için lokasyon "${lokasyon}" için uygun güzergah bulunamadı`);
          skipped++;
          continue;
        }

        // Bu çalışan için rastgele bir güzergah seç
        const selectedRouteName = possibleRoutes[Math.floor(Math.random() * possibleRoutes.length)];
        const selectedRoute = routeInfo[selectedRouteName];

        if (!selectedRoute) {
          console.log(`⚠️ "${selectedRouteName}" güzergahı için bilgi bulunamadı`);
          skipped++;
          continue;
        }

        // Bu güzergahtaki rastgele bir durak seç
        const randomStopIndex = Math.floor(Math.random() * selectedRoute.stops.length);
        const selectedStop = selectedRoute.stops[randomStopIndex];

        // Çalışanı güncelle
        await Employee.findByIdAndUpdate(
          employee._id,
          {
            'serviceInfo': {
              usesService: true,
              routeName: selectedRouteName,
              stopName: selectedStop.name,
              routeId: selectedRoute._id
            },
            // Geriye uyumluluk için eski alanları da güncelle
            servisGuzergahi: selectedRouteName,
            durak: selectedStop.name
          }
        );

        console.log(`✅ "${employee.adSoyad}" ${selectedRouteName} güzergahına ${selectedStop.name} durağıyla atandı`);
        updated++;
      } catch (error) {
        console.error(`❌ ${employee.adSoyad} için hata:`, error);
        skipped++;
      }
    }

    console.log(`\n📊 SONUÇ: ${updated} çalışan başarıyla atandı, ${skipped} çalışan atlanamadı`);

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
updateEmployeeServiceInfo();
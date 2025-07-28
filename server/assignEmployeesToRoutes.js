const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

// .env dosyasını yükle
dotenv.config();

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// Çalışanları güzergahlara ata
const assignEmployeesToRoutes = async () => {
  try {
    console.log('🔄 Çalışanları servis güzergahlarına atama işlemi başlatılıyor...');

    // Aktif servis güzergahlarını al
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

    // Lokasyon bazlı güzergah eşleştirme tablosu
    const locationRouteMapping = {
      'MERKEZ': ['DİSPANSER SERVİS GÜZERGAHI', 'ÇARŞI MERKEZ SERVİS GÜZERGAHI'],
      'İŞL': ['SANAYİ MAHALLESİ SERVİS GÜZERGAHI'],
      'OSB': ['OSMANGAZİ-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI'],
      'İŞIL': ['ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', 'OSMANGAZİ-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI']
    };

    // Aktif çalışanları al (servis bilgisi olmayanlar)
    const employees = await Employee.find({
      durum: 'AKTIF',
      $or: [
        { 'serviceInfo.usesService': { $ne: true } },
        { 'serviceInfo.usesService': null },
        { servisGuzergahi: { $exists: false } },
        { servisGuzergahi: null },
        { servisGuzergahi: '' }
      ]
    });

    console.log(`👥 ${employees.length} aktif çalışan atanacak`);

    // Her çalışan için lokasyonuna göre uygun güzergah seç
    let assignedCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
      try {
        // Çalışanın lokasyonuna göre olası güzergahları belirle
        const lokasyon = employee.lokasyon;
        const possibleRoutes = locationRouteMapping[lokasyon] || [];

        if (possibleRoutes.length === 0) {
          console.log(`⚠️ "${employee.adSoyad}" için lokasyon "${lokasyon}" için uygun güzergah bulunamadı`);
          continue;
        }

        // Bu çalışan için rastgele bir güzergah seç
        const selectedRouteName = possibleRoutes[Math.floor(Math.random() * possibleRoutes.length)];
        const selectedRoute = routeInfo[selectedRouteName];

        if (!selectedRoute) {
          console.log(`⚠️ "${selectedRouteName}" güzergahı için bilgi bulunamadı`);
          continue;
        }

        // Bu güzergahtaki rastgele bir durak seç
        const randomStopIndex = Math.floor(Math.random() * selectedRoute.stops.length);
        const selectedStop = selectedRoute.stops[randomStopIndex];

        // Çalışanı güncelle
        await Employee.findByIdAndUpdate(
          employee._id,
          {
            'serviceInfo.usesService': true,
            'serviceInfo.routeName': selectedRouteName,
            'serviceInfo.stopName': selectedStop.name,
            // Geriye uyumluluk için eski alanları da güncelle
            servisGuzergahi: selectedRouteName,
            durak: selectedStop.name
          }
        );

        console.log(`✅ "${employee.adSoyad}" ${selectedRouteName} güzergahına ${selectedStop.name} durağıyla atandı`);
        assignedCount++;
      } catch (error) {
        console.error(`❌ ${employee.adSoyad} için hata:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 SONUÇ: ${assignedCount} çalışan başarıyla atandı, ${errorCount} hata oluştu`);

  } catch (error) {
    console.error('❌ Genel hata:', error);
  }
};

// Ana işlem
const main = async () => {
  await connectDB();
  
  await assignEmployeesToRoutes();
  
  // Bağlantıyı kapat
  console.log('👋 İşlem tamamlandı, bağlantı kapatılıyor...');
  await mongoose.connection.close();
  console.log('✅ Bağlantı kapatıldı');
};

// Programı çalıştır
main(); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

// .env dosyasını yükle
dotenv.config();

async function checkPassengerCount() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // CSV dosyalarını oku
    console.log('\n📊 CSV Dosyalarını Kontrol Ediyorum:');
    
    // Servis güzergahları CSV'si
    let serviceRoutesCsv;
    try {
      serviceRoutesCsv = fs.readFileSync('../guzergah_yolcu_listesi.csv', 'utf8');
      const routeRecords = parse(serviceRoutesCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      console.log(`✅ Servis güzergahları CSV'sinde ${routeRecords.length} yolcu var`);
    } catch (error) {
      console.error('❌ Servis güzergahları CSV dosyası okunamadı:', error.message);
    }
    
    // Kendi aracı ile gelenler CSV'si
    let ownCarCsv;
    try {
      ownCarCsv = fs.readFileSync('../kendi_araci_ile_gelenler.csv', 'utf8');
      const ownCarRecords = parse(ownCarCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      console.log(`✅ Kendi aracı ile gelenler CSV'sinde ${ownCarRecords.length} çalışan var`);
    } catch (error) {
      console.error('❌ Kendi aracı ile gelenler CSV dosyası okunamadı:', error.message);
    }

    // Veritabanındaki servis kullanan çalışan sayısını kontrol et
    console.log('\n📊 Veritabanı Durumunu Kontrol Ediyorum:');
    
    const routePassengers = await Employee.countDocuments({
      servisGuzergahi: { $exists: true, $ne: null }
    });
    console.log(`✅ Veritabanında servis kullanan ${routePassengers} çalışan var`);
    
    // Güzergahlara göre dağılım
    const routeDistribution = await Employee.aggregate([
      { $match: { servisGuzergahi: { $exists: true, $ne: null } } },
      { $group: { _id: '$servisGuzergahi', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Güzergahlara göre yolcu dağılımı:');
    routeDistribution.forEach(route => {
      console.log(`- ${route._id}: ${route.count} yolcu`);
    });
    
    // Kendi aracı ile gelen çalışan sayısını kontrol et
    const ownCarEmployees = await Employee.countDocuments({
      servisKullaniyor: false
    });
    console.log(`\n✅ Veritabanında kendi aracı ile gelen ${ownCarEmployees} çalışan var`);
    
    // Toplam çalışan sayısı
    const totalEmployees = await Employee.countDocuments({ durum: 'AKTIF' });
    console.log(`\n📊 Toplam ${totalEmployees} aktif çalışan var`);
    
    // Servis bilgisi olmayan çalışanlar
    const employeesWithoutServiceInfo = await Employee.countDocuments({
      durum: 'AKTIF',
      $or: [
        { servisGuzergahi: { $exists: false } },
        { servisGuzergahi: null }
      ]
    });
    console.log(`❓ Servis bilgisi olmayan ${employeesWithoutServiceInfo} çalışan var`);

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
checkPassengerCount(); 
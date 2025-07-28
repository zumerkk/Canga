const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

// .env dosyasını yükle
dotenv.config();

async function checkFinalStatus() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Toplam çalışan sayısı
    const totalEmployees = await Employee.countDocuments({ durum: 'AKTIF' });
    console.log(`\n📊 Toplam ${totalEmployees} aktif çalışan var`);

    // Servis kullanan çalışan sayısı
    const serviceUsers = await Employee.countDocuments({
      durum: 'AKTIF',
      servisGuzergahi: { $exists: true, $ne: null }
    });
    console.log(`✅ ${serviceUsers} çalışan servis kullanıyor`);

    // Kendi aracı ile gelen çalışan sayısı
    const ownCarUsers = await Employee.countDocuments({
      durum: 'AKTIF',
      kendiAraci: true
    });
    console.log(`✅ ${ownCarUsers} çalışan kendi aracı ile geliyor`);

    // Ulaşım bilgisi olmayan çalışan sayısı
    const noTransportInfo = await Employee.countDocuments({
      durum: 'AKTIF',
      $and: [
        { servisGuzergahi: { $in: [null, ''] } },
        { kendiAraci: { $ne: true } }
      ]
    });
    console.log(`❓ ${noTransportInfo} çalışanın ulaşım bilgisi yok`);

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

    // Bulunamayan çalışanları tespit etmek için CSV'deki isimleri al
    const fs = require('fs');
    const serviceRoutesCsvContent = fs.readFileSync('../guzergah_yolcu_listesi.csv', 'utf8');
    const serviceRoutesLines = serviceRoutesCsvContent.split('\n').filter(line => line.trim() !== '');
    const csvEmployeeNames = [];
    
    // Başlık satırını atla (ilk satır)
    for (let i = 1; i < serviceRoutesLines.length; i++) {
      const line = serviceRoutesLines[i];
      const parts = line.split(',');
      if (parts.length >= 2) {
        csvEmployeeNames.push(parts[1].trim());
      }
    }

    // Veritabanındaki tüm çalışan isimlerini al
    const dbEmployees = await Employee.find({ durum: 'AKTIF' }).select('adSoyad');
    const dbEmployeeNames = dbEmployees.map(emp => emp.adSoyad);

    // CSV'de olup veritabanında olmayan çalışanlar
    console.log('\n❌ CSV\'de olup veritabanında bulunamayan çalışanlar:');
    const missingEmployees = csvEmployeeNames.filter(name => 
      !dbEmployeeNames.some(dbName => 
        dbName.toUpperCase() === name.toUpperCase() || 
        dbName.toUpperCase().includes(name.toUpperCase()) || 
        name.toUpperCase().includes(dbName.toUpperCase())
      )
    );
    
    if (missingEmployees.length > 0) {
      missingEmployees.forEach(name => console.log(`- ${name}`));
    } else {
      console.log('Tüm çalışanlar veritabanında bulundu');
    }

    // Servis bilgisi olmayan çalışanlar
    console.log('\n❓ Ulaşım bilgisi olmayan çalışanlar:');
    const employeesWithoutTransport = await Employee.find({
      durum: 'AKTIF',
      $and: [
        { servisGuzergahi: { $in: [null, ''] } },
        { kendiAraci: { $ne: true } }
      ]
    }).select('adSoyad departman lokasyon');
    
    if (employeesWithoutTransport.length > 0) {
      employeesWithoutTransport.forEach(emp => 
        console.log(`- ${emp.adSoyad} (${emp.departman || 'Departman yok'}, ${emp.lokasyon || 'Lokasyon yok'})`)
      );
    } else {
      console.log('Tüm çalışanların ulaşım bilgisi var');
    }

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
checkFinalStatus(); 
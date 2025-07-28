const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');

// .env dosyasını yükle
dotenv.config();

async function checkRouteDistribution() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Servis güzergahlarına göre çalışan dağılımını göster
    const routeStats = await Employee.aggregate([
      { 
        $group: { 
          _id: '$serviceInfo.routeName', 
          count: { $sum: 1 } 
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    console.log('\n📊 Servis güzergahlarına göre çalışan dağılımı:');
    console.table(routeStats);

    // Lokasyon bazlı servis güzergahı dağılımını göster
    const locationRouteStats = await Employee.aggregate([
      { 
        $group: { 
          _id: { 
            lokasyon: '$lokasyon',
            routeName: '$serviceInfo.routeName'
          }, 
          count: { $sum: 1 } 
        }
      },
      {
        $sort: { '_id.lokasyon': 1, '_id.routeName': 1 }
      }
    ]);
    console.log('\n📊 Lokasyon bazlı servis güzergahı dağılımı:');
    console.table(locationRouteStats);

    // Servis atanmamış çalışanları kontrol et
    const employeesWithoutServices = await Employee.find({ 
      $or: [
        { 'serviceInfo.routeName': { $exists: false } },
        { 'serviceInfo.routeName': null }
      ]
    }).select('adSoyad lokasyon');
    
    console.log(`\n⚠️ Servis atanmamış ${employeesWithoutServices.length} çalışan:`);
    employeesWithoutServices.forEach(emp => {
      console.log(`- ${emp.adSoyad} (${emp.lokasyon})`);
    });

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
checkRouteDistribution(); 
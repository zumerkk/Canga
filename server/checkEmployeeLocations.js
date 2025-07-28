const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

// .env dosyasını yükle
dotenv.config();

async function checkEmployeeLocations() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Lokasyon dağılımını kontrol et
    const locationStats = await Employee.aggregate([
      { $group: { _id: '$lokasyon', count: { $sum: 1 } } }
    ]);
    console.log('\n📊 Çalışan lokasyon dağılımı:');
    console.table(locationStats);

    // Servis güzergahları dağılımını kontrol et
    const serviceStats = await Employee.aggregate([
      { 
        $group: { 
          _id: { 
            routeName: '$serviceInfo.routeName', 
            lokasyon: '$lokasyon' 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { '_id.routeName': 1, '_id.lokasyon': 1 } }
    ]);
    console.log('\n📊 Çalışan servis güzergahı dağılımı (lokasyona göre):');
    console.table(serviceStats);

    // Aktif güzergahları kontrol et
    const routes = await ServiceRoute.find({ status: 'AKTIF' });
    console.log(`\n🚌 Aktif güzergahlar (${routes.length})`);
    routes.forEach(route => {
      console.log(`- ${route.routeName}`);
    });

    // MERKEZ ve İŞIL lokasyonundaki çalışanların örnekleri
    const merkezSample = await Employee.find({ lokasyon: 'MERKEZ' }).limit(3);
    console.log('\n👥 MERKEZ lokasyonundaki çalışanların örnekleri:');
    merkezSample.forEach(emp => {
      console.log(`- ${emp.adSoyad}: ${emp.serviceInfo?.routeName || 'Servis atanmamış'}`);
    });

    const isilSample = await Employee.find({ lokasyon: 'İŞIL' }).limit(3);
    console.log('\n👥 İŞIL lokasyonundaki çalışanların örnekleri:');
    isilSample.forEach(emp => {
      console.log(`- ${emp.adSoyad}: ${emp.serviceInfo?.routeName || 'Servis atanmamış'}`);
    });

    console.log('\n✅ İşlem tamamlandı.');
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
checkEmployeeLocations(); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ServiceRoute = require('./models/ServiceRoute');
const Employee = require('./models/Employee');

// .env dosyasını yükle
dotenv.config();

async function addOwnCarRoute() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Önce güzergahın var olup olmadığını kontrol et
    const existingRoute = await ServiceRoute.findOne({ routeName: 'KENDİ ARACI İLE GELENLER' });
    
    if (existingRoute) {
      console.log('⚠️ "KENDİ ARACI İLE GELENLER" güzergahı zaten mevcut.');
      return;
    }
    
    // Yeni güzergah oluştur
    const newRoute = new ServiceRoute({
      routeName: 'KENDİ ARACI İLE GELENLER',
      routeCode: 'KENDI-ARAC',
      color: '#ff9800', // Turuncu renk
      stops: [
        { name: 'KENDİ ARACI', order: 1 },
        { name: 'BAHŞILI', order: 2 },
        { name: 'YENİŞEHİR', order: 3 }
      ],
      status: 'AKTIF',
      notes: 'Kendi aracı ile gelen çalışanlar için oluşturulmuş özel güzergah'
    });
    
    // Güzergahı kaydet
    await newRoute.save();
    console.log('✅ "KENDİ ARACI İLE GELENLER" güzergahı başarıyla oluşturuldu.');
    
    // Kendi aracı ile gelen çalışanları bu güzergaha ata
    const ownCarUsers = await Employee.find({ kendiAraci: true });
    console.log(`🔍 ${ownCarUsers.length} kendi aracı ile gelen çalışan bulundu.`);
    
    let updated = 0;
    
    for (const employee of ownCarUsers) {
      // Durak adını belirle
      let stopName = 'KENDİ ARACI';
      if (employee.kendiAraciNot === 'BAHŞILI') stopName = 'BAHŞILI';
      if (employee.kendiAraciNot === 'YENİŞEHİR') stopName = 'YENİŞEHİR';
      
      // Çalışanı güncelle
      await Employee.findByIdAndUpdate(
        employee._id,
        {
          $set: {
            servisGuzergahi: 'KENDİ ARACI İLE GELENLER',
            durak: stopName,
            serviceInfo: {
              usesService: false,
              usesOwnCar: true,
              routeName: 'KENDİ ARACI İLE GELENLER',
              stopName: stopName,
              routeId: newRoute._id,
              ownCarNote: employee.kendiAraciNot
            }
          }
        }
      );
      
      console.log(`✅ ${employee.adSoyad}: KENDİ ARACI İLE GELENLER güzergahına ${stopName} durağıyla atandı`);
      updated++;
    }
    
    console.log(`\n📊 Sonuç: ${updated} çalışan KENDİ ARACI İLE GELENLER güzergahına atandı`);
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
addOwnCarRoute(); 
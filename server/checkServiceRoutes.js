const mongoose = require('mongoose');
const ServiceRoute = require('./models/ServiceRoute');
const Employee = require('./models/Employee');
require('dotenv').config();

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

// Mevcut güzergahları kontrol et
const checkCurrentRoutes = async () => {
  try {
    console.log('\n🔍 Mevcut ServiceRoute koleksiyonu kontrol ediliyor...');
    
    const routes = await ServiceRoute.find().lean();
    console.log(`📊 Toplam güzergah sayısı: ${routes.length}`);
    
    if (routes.length > 0) {
      console.log('\n📋 Mevcut güzergahlar:');
      routes.forEach((route, index) => {
        console.log(`${index + 1}. ${route.routeName} (${route.status}) - Durak sayısı: ${route.stops?.length || 0}`);
      });
    } else {
      console.log('⚠️ ServiceRoute koleksiyonunda hiç güzergah bulunamadı!');
    }
    
    // Employee verilerindeki güzergah bilgilerini kontrol et
    console.log('\n🔍 Employee verilerindeki servis güzergahları kontrol ediliyor...');
    
    const employeeRoutes = await Employee.aggregate([
      {
        $match: {
          $or: [
            { servisGuzergahi: { $exists: true, $ne: null, $ne: '' } },
            { 'serviceInfo.routeName': { $exists: true, $ne: null, $ne: '' } }
          ]
        }
      },
      {
        $group: {
          _id: {
            servisGuzergahi: '$servisGuzergahi',
            serviceInfoRoute: '$serviceInfo.routeName'
          },
          count: { $sum: 1 },
          employees: { $push: { name: '$adSoyad', durak: '$durak', stopName: '$serviceInfo.stopName' } }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log(`\n📊 Employee verilerinde ${employeeRoutes.length} farklı güzergah bulundu:`);
    employeeRoutes.forEach((route, index) => {
      const routeName = route._id.servisGuzergahi || route._id.serviceInfoRoute;
      console.log(`${index + 1}. "${routeName}" - ${route.count} çalışan`);
    });
    
    // Gerekli güzergahları listele
    const requiredRoutes = [
      'DİSPANSER',
      'SANAYİ MAHALLESİ', 
      'OSMANGAZİ-KARŞIYAKA MAHALLESİ',
      'ÇALILIÖZ MAHALLESİ',
      'ÇARŞI MERKEZ',
      'KENDİ ARACI İLE GELENLER'
    ];
    
    console.log('\n🎯 Gerekli güzergahlar:');
    const existingRouteNames = routes.map(r => r.routeName);
    
    requiredRoutes.forEach((routeName, index) => {
      const exists = existingRouteNames.includes(routeName);
      const status = exists ? '✅ Mevcut' : '❌ Eksik';
      console.log(`${index + 1}. ${routeName} - ${status}`);
    });
    
    return {
      existingRoutes: routes,
      employeeRoutes: employeeRoutes,
      requiredRoutes: requiredRoutes,
      missingRoutes: requiredRoutes.filter(name => !existingRouteNames.includes(name))
    };
    
  } catch (error) {
    console.error('❌ Güzergah kontrol hatası:', error);
    throw error;
  }
};

// Ana fonksiyon
const main = async () => {
  try {
    await connectDB();
    const result = await checkCurrentRoutes();
    
    console.log('\n📋 ÖZET:');
    console.log(`- Mevcut güzergah sayısı: ${result.existingRoutes.length}`);
    console.log(`- Eksik güzergah sayısı: ${result.missingRoutes.length}`);
    console.log(`- Employee verilerinde güzergah çeşidi: ${result.employeeRoutes.length}`);
    
    if (result.missingRoutes.length > 0) {
      console.log('\n❌ Eksik güzergahlar:');
      result.missingRoutes.forEach(route => console.log(`  - ${route}`));
    }
    
  } catch (error) {
    console.error('❌ Ana fonksiyon hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Scripti çalıştır
main();
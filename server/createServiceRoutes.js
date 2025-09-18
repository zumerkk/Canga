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

// Employee verilerinden durak bilgilerini topla
const analyzeEmployeeStops = async () => {
  try {
    console.log('🔍 Employee verilerinden durak bilgileri toplanıyor...');
    
    // DİSPANSER güzergahı için durakları topla
    const dispenserEmployees = await Employee.find({
      $or: [
        { servisGuzergahi: { $regex: /DİSPANSER/i } },
        { servisGuzergahi: { $regex: /DISPANSER/i } }
      ]
    }).select('adSoyad durak servisGuzergahi serviceInfo').lean();
    
    // OSMANGAZİ-KARŞIYAKA için durakları topla
    const osmangaziEmployees = await Employee.find({
      $or: [
        { servisGuzergahi: { $regex: /OSMANGAZİ/i } },
        { servisGuzergahi: { $regex: /KARŞIYAKA/i } }
      ]
    }).select('adSoyad durak servisGuzergahi serviceInfo').lean();
    
    // ÇALILIÖZ için durakları topla
    const caliliozEmployees = await Employee.find({
      servisGuzergahi: { $regex: /ÇALILIÖZ/i }
    }).select('adSoyad durak servisGuzergahi serviceInfo').lean();
    
    // SANAYİ için durakları topla
    const sanayiEmployees = await Employee.find({
      servisGuzergahi: { $regex: /SANAYİ/i }
    }).select('adSoyad durak servisGuzergahi serviceInfo').lean();
    
    // KENDİ ARACI için çalışanları topla
    const kendiAraciEmployees = await Employee.find({
      $or: [
        { servisGuzergahi: { $regex: /KENDİ ARACI/i } },
        { kendiAraci: true }
      ]
    }).select('adSoyad durak servisGuzergahi kendiAraci serviceInfo').lean();
    
    return {
      dispenser: dispenserEmployees,
      osmangazi: osmangaziEmployees,
      calilioz: caliliozEmployees,
      sanayi: sanayiEmployees,
      kendiAraci: kendiAraciEmployees
    };
    
  } catch (error) {
    console.error('❌ Employee analiz hatası:', error);
    throw error;
  }
};

// Durakları benzersiz hale getir ve sırala
const processStops = (employees, routeName) => {
  const stops = new Set();
  
  employees.forEach(emp => {
    if (emp.durak && emp.durak.trim()) {
      stops.add(emp.durak.trim().toUpperCase());
    }
    if (emp.serviceInfo?.stopName && emp.serviceInfo.stopName.trim()) {
      stops.add(emp.serviceInfo.stopName.trim().toUpperCase());
    }
  });
  
  // Durakları sırala ve format et
  const sortedStops = Array.from(stops).sort().map((stop, index) => ({
    name: stop,
    order: index + 1
  }));
  
  // Eğer durak yoksa varsayılan durak ekle
  if (sortedStops.length === 0) {
    sortedStops.push({ name: 'FABRİKA', order: 1 });
  }
  
  console.log(`📍 ${routeName} güzergahı için ${sortedStops.length} durak bulundu:`);
  sortedStops.forEach(stop => console.log(`  ${stop.order}. ${stop.name}`));
  
  return sortedStops;
};

// Güzergahları oluştur
const createServiceRoutes = async () => {
  try {
    console.log('\n🚌 Servis güzergahları oluşturuluyor...');
    
    // Employee verilerini analiz et
    const employeeData = await analyzeEmployeeStops();
    
    // Güzergah tanımları
    const routesToCreate = [
      {
        routeName: 'DİSPANSER',
        routeCode: 'DSP',
        color: '#1976d2',
        stops: processStops(employeeData.dispenser, 'DİSPANSER'),
        status: 'AKTIF'
      },
      {
        routeName: 'SANAYİ MAHALLESİ',
        routeCode: 'SNY',
        color: '#388e3c',
        stops: processStops(employeeData.sanayi, 'SANAYİ MAHALLESİ'),
        status: 'AKTIF'
      },
      {
        routeName: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ',
        routeCode: 'OSK',
        color: '#f57c00',
        stops: processStops(employeeData.osmangazi, 'OSMANGAZİ-KARŞIYAKA MAHALLESİ'),
        status: 'AKTIF'
      },
      {
        routeName: 'ÇALILIÖZ MAHALLESİ',
        routeCode: 'CLZ',
        color: '#7b1fa2',
        stops: processStops(employeeData.calilioz, 'ÇALILIÖZ MAHALLESİ'),
        status: 'AKTIF'
      },
      {
        routeName: 'ÇARŞI MERKEZ',
        routeCode: 'CMZ',
        color: '#d32f2f',
        stops: [
          { name: 'ÇARŞI MERKEZ', order: 1 },
          { name: 'ATATÜRK CADDESİ', order: 2 },
          { name: 'BELEDİYE MEYDANI', order: 3 },
          { name: 'FABRİKA', order: 4 }
        ],
        status: 'AKTIF'
      },
      {
        routeName: 'KENDİ ARACI İLE GELENLER',
        routeCode: 'KAR',
        color: '#455a64',
        stops: [
          { name: 'FABRİKA OTOPARK', order: 1 }
        ],
        status: 'AKTIF'
      }
    ];
    
    // Güzergahları veritabanına ekle
    const createdRoutes = [];
    
    for (const routeData of routesToCreate) {
      try {
        // Mevcut güzergahı kontrol et
        const existingRoute = await ServiceRoute.findOne({ routeName: routeData.routeName });
        
        if (existingRoute) {
          console.log(`⚠️ ${routeData.routeName} güzergahı zaten mevcut, güncelleniyor...`);
          
          const updatedRoute = await ServiceRoute.findByIdAndUpdate(
            existingRoute._id,
            {
              ...routeData,
              updatedAt: new Date(),
              updatedBy: 'System'
            },
            { new: true }
          );
          
          createdRoutes.push(updatedRoute);
          console.log(`✅ ${routeData.routeName} güzergahı güncellendi`);
        } else {
          const newRoute = new ServiceRoute({
            ...routeData,
            createdBy: 'System',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          const savedRoute = await newRoute.save();
          createdRoutes.push(savedRoute);
          console.log(`✅ ${routeData.routeName} güzergahı oluşturuldu`);
        }
        
      } catch (error) {
        console.error(`❌ ${routeData.routeName} güzergahı oluşturma hatası:`, error.message);
      }
    }
    
    console.log(`\n🎉 Toplam ${createdRoutes.length} güzergah işlendi`);
    return createdRoutes;
    
  } catch (error) {
    console.error('❌ Güzergah oluşturma hatası:', error);
    throw error;
  }
};

// Ana fonksiyon
const main = async () => {
  try {
    await connectDB();
    const routes = await createServiceRoutes();
    
    console.log('\n📋 ÖZET:');
    console.log(`✅ ${routes.length} güzergah başarıyla işlendi`);
    
    // Oluşturulan güzergahları listele
    console.log('\n📋 Oluşturulan/Güncellenen güzergahlar:');
    routes.forEach((route, index) => {
      console.log(`${index + 1}. ${route.routeName} (${route.routeCode}) - ${route.stops.length} durak`);
    });
    
  } catch (error) {
    console.error('❌ Ana fonksiyon hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Scripti çalıştır
main();
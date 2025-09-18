const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');
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

// Güzergah eşleştirme kuralları
const getRouteMapping = () => {
  return {
    'DİSPANSER': {
      keywords: ['DİSPANSER', 'DISPANSER'],
      routeName: 'DİSPANSER',
      defaultStop: 'DİSPANSER'
    },
    'SANAYİ MAHALLESİ': {
      keywords: ['SANAYİ', 'SANAYI'],
      routeName: 'SANAYİ MAHALLESİ',
      defaultStop: 'SANAYİ'
    },
    'OSMANGAZİ-KARŞIYAKA MAHALLESİ': {
      keywords: ['OSMANGAZİ', 'KARŞIYAKA', 'OSMANGAZI', 'KARSIYAKA'],
      routeName: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ',
      defaultStop: 'OSMANGAZİ'
    },
    'ÇALILIÖZ MAHALLESİ': {
      keywords: ['ÇALILIÖZ', 'CALILIOZ'],
      routeName: 'ÇALILIÖZ MAHALLESİ',
      defaultStop: 'ÇALILIÖZ'
    },
    'ÇARŞI MERKEZ': {
      keywords: ['ÇARŞI', 'MERKEZ', 'CARSI'],
      routeName: 'ÇARŞI MERKEZ',
      defaultStop: 'ÇARŞI MERKEZ'
    },
    'KENDİ ARACI İLE GELENLER': {
      keywords: ['KENDİ ARACI', 'KENDI ARACI', 'ARACI', 'ARAÇ'],
      routeName: 'KENDİ ARACI İLE GELENLER',
      defaultStop: 'FABRİKA OTOPARK'
    }
  };
};

// Çalışanın güzergahını belirle
const determineEmployeeRoute = (employee) => {
  const routeMapping = getRouteMapping();
  const servisGuzergahi = (employee.servisGuzergahi || '').toUpperCase();
  const durak = (employee.durak || '').toUpperCase();
  
  // Önce servisGuzergahi field'ına bak
  for (const [routeKey, routeInfo] of Object.entries(routeMapping)) {
    for (const keyword of routeInfo.keywords) {
      if (servisGuzergahi.includes(keyword.toUpperCase())) {
        return {
          routeName: routeInfo.routeName,
          stopName: durak || routeInfo.defaultStop,
          matchedBy: `servisGuzergahi: ${servisGuzergahi}`,
          confidence: 'high'
        };
      }
    }
  }
  
  // Sonra durak field'ına bak
  for (const [routeKey, routeInfo] of Object.entries(routeMapping)) {
    for (const keyword of routeInfo.keywords) {
      if (durak.includes(keyword.toUpperCase())) {
        return {
          routeName: routeInfo.routeName,
          stopName: durak || routeInfo.defaultStop,
          matchedBy: `durak: ${durak}`,
          confidence: 'medium'
        };
      }
    }
  }
  
  // Eğer hiçbir eşleşme yoksa, varsayılan olarak ÇARŞI MERKEZ'e ata
  return {
    routeName: 'ÇARŞI MERKEZ',
    stopName: 'ÇARŞI MERKEZ',
    matchedBy: 'default assignment',
    confidence: 'low'
  };
};

// Employee verilerini analiz et
const analyzeEmployeeData = async () => {
  try {
    console.log('🔍 Employee verileri analiz ediliyor...');
    
    // Tüm aktif çalışanları getir
    const employees = await Employee.find({
      durum: 'AKTIF'
    }).select('adSoyad servisGuzergahi durak serviceInfo').lean();
    
    console.log(`📊 Toplam ${employees.length} aktif çalışan bulundu`);
    
    const analysis = {
      total: employees.length,
      withServiceInfo: 0,
      withoutServiceInfo: 0,
      routeDistribution: {},
      assignments: []
    };
    
    // Her çalışan için güzergah belirle
    for (const employee of employees) {
      const routeAssignment = determineEmployeeRoute(employee);
      
      // İstatistikleri güncelle
      if (employee.serviceInfo?.routeName) {
        analysis.withServiceInfo++;
      } else {
        analysis.withoutServiceInfo++;
      }
      
      // Güzergah dağılımını güncelle
      if (!analysis.routeDistribution[routeAssignment.routeName]) {
        analysis.routeDistribution[routeAssignment.routeName] = 0;
      }
      analysis.routeDistribution[routeAssignment.routeName]++;
      
      // Atama bilgisini kaydet
      analysis.assignments.push({
        employeeId: employee._id,
        employeeName: employee.adSoyad,
        currentRoute: employee.serviceInfo?.routeName || 'Yok',
        suggestedRoute: routeAssignment.routeName,
        suggestedStop: routeAssignment.stopName,
        matchedBy: routeAssignment.matchedBy,
        confidence: routeAssignment.confidence,
        needsUpdate: !employee.serviceInfo?.routeName || employee.serviceInfo.routeName !== routeAssignment.routeName
      });
    }
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Employee analiz hatası:', error);
    throw error;
  }
};

// Çalışanları güzergahlara ata
const assignEmployeesToRoutes = async (analysis) => {
  try {
    console.log('\n🚌 Çalışanlar güzergahlara atanıyor...');
    
    const assignmentsToUpdate = analysis.assignments.filter(a => a.needsUpdate);
    console.log(`📝 ${assignmentsToUpdate.length} çalışan güncellenecek`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const assignment of assignmentsToUpdate) {
      try {
        await Employee.findByIdAndUpdate(
          assignment.employeeId,
          {
            'serviceInfo.usesService': true,
            'serviceInfo.routeName': assignment.suggestedRoute,
            'serviceInfo.stopName': assignment.suggestedStop,
            'serviceInfo.assignedAt': new Date(),
            'serviceInfo.assignedBy': 'AutoAssignment',
            'serviceInfo.confidence': assignment.confidence
          },
          { new: true }
        );
        
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ ${successCount} çalışan güncellendi...`);
        }
        
      } catch (error) {
        console.error(`❌ ${assignment.employeeName} güncellenemedi:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Atama Sonuçları:`);
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('❌ Atama hatası:', error);
    throw error;
  }
};

// Güzergah istatistiklerini güncelle
const updateRouteStatistics = async () => {
  try {
    console.log('\n📊 Güzergah istatistikleri güncelleniyor...');
    
    const routes = await ServiceRoute.find({ status: 'AKTIF' });
    
    for (const route of routes) {
      const passengerCount = await Employee.countDocuments({
        'serviceInfo.routeName': route.routeName,
        durum: 'AKTIF'
      });
      
      await ServiceRoute.findByIdAndUpdate(
        route._id,
        {
          'statistics.totalEmployees': passengerCount,
          'statistics.activeEmployees': passengerCount,
          'statistics.lastUpdated': new Date()
        }
      );
      
      console.log(`📈 ${route.routeName}: ${passengerCount} yolcu`);
    }
    
  } catch (error) {
    console.error('❌ İstatistik güncelleme hatası:', error);
    throw error;
  }
};

// Ana fonksiyon
const main = async () => {
  try {
    await connectDB();
    
    // 1. Employee verilerini analiz et
    console.log('🔍 1. ADIM: Employee verileri analiz ediliyor...');
    const analysis = await analyzeEmployeeData();
    
    // Analiz sonuçlarını göster
    console.log('\n📋 ANALİZ SONUÇLARI:');
    console.log(`📊 Toplam çalışan: ${analysis.total}`);
    console.log(`✅ Servis bilgisi olan: ${analysis.withServiceInfo}`);
    console.log(`❌ Servis bilgisi olmayan: ${analysis.withoutServiceInfo}`);
    
    console.log('\n📈 GÜZERGAH DAĞILIMI:');
    Object.entries(analysis.routeDistribution).forEach(([route, count]) => {
      console.log(`  ${route}: ${count} çalışan`);
    });
    
    // 2. Çalışanları güzergahlara ata
    console.log('\n🚌 2. ADIM: Çalışanlar güzergahlara atanıyor...');
    const assignmentResult = await assignEmployeesToRoutes(analysis);
    
    // 3. Güzergah istatistiklerini güncelle
    console.log('\n📊 3. ADIM: Güzergah istatistikleri güncelleniyor...');
    await updateRouteStatistics();
    
    console.log('\n🎉 TÜM İŞLEMLER TAMAMLANDI!');
    console.log(`✅ ${assignmentResult.successCount} çalışan başarıyla atandı`);
    console.log(`❌ ${assignmentResult.errorCount} çalışan atanamadı`);
    
  } catch (error) {
    console.error('❌ Ana fonksiyon hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Scripti çalıştır
main();
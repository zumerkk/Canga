const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

const MONGODB_URI = process.env.MONGODB_URI;

const verifyImportedEmployees = async () => {
  try {
    console.log('🔍 İçe aktarılan çalışanları doğrulama başlıyor...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
    
    // Güzergah isimleri
    const routeNames = [
      '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI',
      'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI',
      'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI',
      'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI',
      'NENE HATUN CADDESİ SERVİS GÜZERGAHI',
      'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI'
    ];
    
    console.log('\n📊 Güzergah bazında çalışan sayıları:');
    console.log('=' .repeat(60));
    
    let totalEmployees = 0;
    
    for (const routeName of routeNames) {
      const employees = await Employee.find({ 
        servisGuzergahi: routeName,
        durum: { $ne: 'AYRILDI' }
      }).select('adSoyad durak serviceInfo');
      
      console.log(`\n🚌 ${routeName}`);
      console.log(`👥 Çalışan sayısı: ${employees.length}`);
      
      if (employees.length > 0) {
        console.log('📋 Çalışanlar:');
        employees.forEach((emp, index) => {
          console.log(`   ${index + 1}. ${emp.adSoyad} -> ${emp.durak || 'Durak belirtilmemiş'}`);
        });
      }
      
      totalEmployees += employees.length;
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log(`📈 TOPLAM EKLENEN ÇALIŞAN SAYISI: ${totalEmployees}`);
    
    // Güzergah istatistiklerini güncelle
    console.log('\n🔄 Güzergah istatistikleri güncelleniyor...');
    
    for (const routeName of routeNames) {
      const employeeCount = await Employee.countDocuments({ 
        servisGuzergahi: routeName,
        durum: { $ne: 'AYRILDI' }
      });
      
      await ServiceRoute.updateOne(
        { routeName: routeName },
        { 
          $set: { 
            'statistics.totalEmployees': employeeCount,
            'statistics.activeEmployees': employeeCount,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ ${routeName}: ${employeeCount} çalışan`);
    }
    
    console.log('\n🎉 Doğrulama tamamlandı!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

verifyImportedEmployees();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

const analyzeCurrentEmployees = async () => {
  try {
    await connectDB();
    
    console.log('📊 Mevcut çalışanlar analiz ediliyor...\n');
    
    // Tüm çalışanları getir
    const allEmployees = await Employee.find({}).sort({ adSoyad: 1 });
    
    console.log(`📋 Toplam çalışan sayısı: ${allEmployees.length}\n`);
    
    // Durum bazında analiz
    const statusStats = await Employee.aggregate([
      {
        $group: {
          _id: '$durum',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📈 Durum bazında dağılım:');
    statusStats.forEach(stat => {
      console.log(`  ${stat._id || 'Belirtilmemiş'}: ${stat.count} kişi`);
    });
    console.log('');
    
    // Departman bazında analiz
    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$departman',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('🏢 Departman bazında dağılım:');
    departmentStats.forEach(stat => {
      console.log(`  ${stat._id || 'Belirtilmemiş'}: ${stat.count} kişi`);
    });
    console.log('');
    
    // Lokasyon bazında analiz
    const locationStats = await Employee.aggregate([
      {
        $group: {
          _id: '$lokasyon',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📍 Lokasyon bazında dağılım:');
    locationStats.forEach(stat => {
      console.log(`  ${stat._id || 'Belirtilmemiş'}: ${stat.count} kişi`);
    });
    console.log('');
    
    // Servis kullanımı analizi
    const serviceStats = await Employee.aggregate([
      {
        $group: {
          _id: {
            hasService: { $ne: ['$servisGuzergahi', null] }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('🚌 Servis kullanımı:');
    serviceStats.forEach(stat => {
      const label = stat._id.hasService ? 'Servis kullanan' : 'Servis kullanmayan';
      console.log(`  ${label}: ${stat.count} kişi`);
    });
    console.log('');
    
    // Aktif çalışanların detaylı listesi
    const activeEmployees = await Employee.find({ durum: 'AKTIF' }).sort({ adSoyad: 1 });
    
    console.log('👥 Aktif çalışanlar listesi:');
    console.log('ID\t\tAd Soyad\t\t\tDepartman\t\tLokasyon\tServis');
    console.log('─'.repeat(100));
    
    activeEmployees.forEach(emp => {
      const id = emp.employeeId || emp._id.toString().slice(-6);
      const name = (emp.adSoyad || 'Bilinmiyor').padEnd(25);
      const dept = (emp.departman || 'Bilinmiyor').padEnd(15);
      const loc = (emp.lokasyon || 'Bilinmiyor').padEnd(10);
      const service = emp.servisGuzergahi || 'Yok';
      
      console.log(`${id}\t${name}\t${dept}\t${loc}\t${service}`);
    });
    
    console.log('\n✅ Analiz tamamlandı!');
    
    // Özet bilgiler
    console.log('\n📋 ÖZET:');
    console.log(`• Toplam çalışan: ${allEmployees.length}`);
    console.log(`• Aktif çalışan: ${activeEmployees.length}`);
    console.log(`• Farklı departman sayısı: ${departmentStats.length}`);
    console.log(`• Farklı lokasyon sayısı: ${locationStats.length}`);
    
    // CSV export için veri hazırla
    const csvData = activeEmployees.map(emp => ({
      employeeId: emp.employeeId || '',
      adSoyad: emp.adSoyad || '',
      tcNo: emp.tcNo || '',
      departman: emp.departman || '',
      pozisyon: emp.pozisyon || '',
      lokasyon: emp.lokasyon || '',
      durum: emp.durum || '',
      iseGirisTarihi: emp.iseGirisTarihi || '',
      dogumTarihi: emp.dogumTarihi || '',
      servisGuzergahi: emp.servisGuzergahi || '',
      durak: emp.durak || ''
    }));
    
    // JSON olarak kaydet
    const fs = require('fs');
    fs.writeFileSync('./current_employees_analysis.json', JSON.stringify({
      summary: {
        total: allEmployees.length,
        active: activeEmployees.length,
        departments: departmentStats.length,
        locations: locationStats.length
      },
      statusBreakdown: statusStats,
      departmentBreakdown: departmentStats,
      locationBreakdown: locationStats,
      serviceBreakdown: serviceStats,
      activeEmployees: csvData
    }, null, 2));
    
    console.log('\n💾 Analiz sonuçları current_employees_analysis.json dosyasına kaydedildi');
    
  } catch (error) {
    console.error('❌ Analiz hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
analyzeCurrentEmployees();
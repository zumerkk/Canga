const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/canga', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugFormerEmployees() {
  try {
    console.log('🔍 PASIF çalışanlar detaylı analiz...');
    
    // PASIF durumundaki çalışanları say
    const pasifCount = await Employee.countDocuments({ durum: 'PASIF' });
    console.log(`📊 PASIF durumundaki çalışan sayısı: ${pasifCount}`);
    
    // İlk 10 PASIF çalışanı getir
    console.log('\n📋 İlk 10 PASIF çalışan (createdAt sıralaması):');
    const pasifEmployees = await Employee.find({ durum: 'PASIF' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('adSoyad employeeId ayrilmaTarihi createdAt durum');
    
    pasifEmployees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.adSoyad} (${emp.employeeId}) - Durum: ${emp.durum} - Ayrılma: ${emp.ayrilmaTarihi ? emp.ayrilmaTarihi.toLocaleDateString('tr-TR') : 'null'} - Oluşturulma: ${emp.createdAt.toLocaleDateString('tr-TR')}`);
    });
    
    // ayrilmaTarihi null olanları say
    const nullAyrilmaCount = await Employee.countDocuments({ 
      durum: 'PASIF', 
      ayrilmaTarihi: null 
    });
    console.log(`\n📊 ayrilmaTarihi null olan PASIF çalışan sayısı: ${nullAyrilmaCount}`);
    
    // ayrilmaTarihi null olmayanları say
    const notNullAyrilmaCount = await Employee.countDocuments({ 
      durum: 'PASIF', 
      ayrilmaTarihi: { $ne: null } 
    });
    console.log(`📊 ayrilmaTarihi null olmayan PASIF çalışan sayısı: ${notNullAyrilmaCount}`);
    
    // API endpoint'inin kullandığı sorguyu test et
    console.log('\n🔍 API endpoint sorgusu test ediliyor...');
    const filter = { durum: 'PASIF' };
    const apiResult = await Employee
      .find(filter)
      .sort({ 
        ayrilmaTarihi: -1,
        createdAt: -1
      })
      .limit(10);
    
    console.log(`📊 API sorgusu sonuç sayısı: ${apiResult.length}`);
    apiResult.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.adSoyad} (${emp.employeeId}) - Ayrılma: ${emp.ayrilmaTarihi ? emp.ayrilmaTarihi.toLocaleDateString('tr-TR') : 'null'}`);
    });
    
    // Tüm durum değerlerini kontrol et
    console.log('\n📊 Tüm durum değerleri:');
    const statusCounts = await Employee.aggregate([
      { $group: { _id: '$durum', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count}`);
    });
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugFormerEmployees();
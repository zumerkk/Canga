const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost:27017/canga', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkFormerEmployees() {
  try {
    console.log('🔍 İşten ayrılanlar kontrol ediliyor...');
    
    // PASIF durumundaki çalışanları say
    const pasifCount = await Employee.countDocuments({ durum: 'PASIF' });
    console.log(`📊 PASIF durumundaki çalışan sayısı: ${pasifCount}`);
    
    // AYRILDI durumundaki çalışanları say
    const ayrildiCount = await Employee.countDocuments({ durum: 'AYRILDI' });
    console.log(`📊 AYRILDI durumundaki çalışan sayısı: ${ayrildiCount}`);
    
    // Toplam işten ayrılan sayısı
    const totalFormerCount = await Employee.countDocuments({ 
      $or: [{ durum: 'PASIF' }, { durum: 'AYRILDI' }] 
    });
    console.log(`📊 Toplam işten ayrılan sayısı: ${totalFormerCount}`);
    
    // Son 10 PASIF çalışanı göster
    console.log('\n📋 Son 10 PASIF çalışan:');
    const pasifEmployees = await Employee.find({ durum: 'PASIF' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('adSoyad employeeId ayrilmaTarihi createdAt');
    
    pasifEmployees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.adSoyad} (${emp.employeeId}) - Ayrılma: ${emp.ayrilmaTarihi ? emp.ayrilmaTarihi.toLocaleDateString('tr-TR') : 'Belirtilmemiş'} - Oluşturulma: ${emp.createdAt.toLocaleDateString('tr-TR')}`);
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

checkFormerEmployees();
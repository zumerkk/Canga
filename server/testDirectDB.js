const mongoose = require('mongoose');
const Employee = require('./models/Employee');

async function testDirectDB() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect('mongodb+srv://thebestkekilli:2002.2002@canga.rgadvdl.mongodb.net/canga?retryWrites=true&w=majority&appName=canga');
    console.log('✅ MongoDB bağlantısı başarılı');

    // Direkt veritabanından PASIF çalışanları say
    const pasifCount = await Employee.countDocuments({ durum: 'PASIF' });
    console.log(`📊 Veritabanında PASIF çalışan sayısı: ${pasifCount}`);

    // İlk 10 PASIF çalışanı getir (API'deki gibi sıralama ile)
    const pasifEmployees = await Employee
      .find({ durum: 'PASIF' })
      .sort({ 
        ayrilmaTarihi: -1,
        createdAt: -1
      })
      .limit(10)
      .select('adSoyad employeeId ayrilmaTarihi createdAt durum');

    console.log('\n📋 İlk 10 PASIF çalışan (API sıralaması):');
    pasifEmployees.forEach((emp, index) => {
      const ayrilma = emp.ayrilmaTarihi ? emp.ayrilmaTarihi.toLocaleDateString('tr-TR') : 'Yok';
      const olusturma = emp.createdAt ? emp.createdAt.toLocaleDateString('tr-TR') : 'Yok';
      console.log(`${index + 1}. ${emp.adSoyad} (${emp.employeeId}) - Durum: ${emp.durum} - Ayrılma: ${ayrilma} - Oluşturma: ${olusturma}`);
    });

    // Tüm PASIF çalışanları getir (limit olmadan)
    const allPasifEmployees = await Employee
      .find({ durum: 'PASIF' })
      .sort({ 
        ayrilmaTarihi: -1,
        createdAt: -1
      })
      .select('adSoyad employeeId ayrilmaTarihi createdAt durum');

    console.log(`\n📊 Toplam PASIF çalışan sayısı (sorgu ile): ${allPasifEmployees.length}`);

    // Farklı durum değerlerini kontrol et
    const statusCounts = await Employee.aggregate([
      { $group: { _id: '$durum', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Tüm durum değerleri:');
    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count}`);
    });

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

testDirectDB();
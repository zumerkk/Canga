const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');

// .env dosyasını yükle
dotenv.config();

async function checkOwnCarUsers() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Kendi aracı ile gelen çalışanları bul
    const ownCarUsers = await Employee.find({ kendiAraci: true })
      .select('adSoyad kendiAraciNot')
      .sort({ adSoyad: 1 });

    console.log(`\n🚗 Kendi aracı ile gelen ${ownCarUsers.length} çalışan:`);
    ownCarUsers.forEach(user => {
      console.log(`- ${user.adSoyad}${user.kendiAraciNot ? ' (' + user.kendiAraciNot + ')' : ''}`);
    });

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
checkOwnCarUsers(); 
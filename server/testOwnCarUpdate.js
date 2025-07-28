const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');

// .env dosyasını yükle
dotenv.config();

async function testOwnCarUpdate() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Örnek bir çalışanı bul
    const testEmployee = await Employee.findOne({ adSoyad: 'Ahmet ILGIN' });
    
    if (!testEmployee) {
      console.log('❌ Test çalışanı bulunamadı');
      return;
    }
    
    console.log('\n🔍 Güncelleme öncesi çalışan bilgileri:');
    console.log(`- adSoyad: ${testEmployee.adSoyad}`);
    console.log(`- kendiAraci: ${testEmployee.kendiAraci}`);
    console.log(`- serviceInfo: ${JSON.stringify(testEmployee.serviceInfo)}`);
    
    // Çalışanı güncelle
    console.log('\n🔄 Çalışanı güncelliyorum...');
    
    const result = await Employee.updateOne(
      { _id: testEmployee._id },
      {
        $set: {
          servisGuzergahi: null,
          durak: null,
          servisKullaniyor: false,
          kendiAraci: true,
          kendiAraciNot: 'TEST',
          serviceInfo: {
            usesService: false,
            usesOwnCar: true,
            ownCarNote: 'TEST'
          }
        }
      }
    );
    
    console.log('✅ Güncelleme sonucu:', result);
    
    // Güncellenmiş çalışanı kontrol et
    const updatedEmployee = await Employee.findById(testEmployee._id);
    
    console.log('\n🔍 Güncelleme sonrası çalışan bilgileri:');
    console.log(`- adSoyad: ${updatedEmployee.adSoyad}`);
    console.log(`- kendiAraci: ${updatedEmployee.kendiAraci}`);
    console.log(`- serviceInfo: ${JSON.stringify(updatedEmployee.serviceInfo)}`);
    
    // Şema kontrolü
    console.log('\n🔍 Employee şeması:');
    const employeeSchema = Employee.schema.obj;
    console.log('- kendiAraci:', employeeSchema.kendiAraci);
    console.log('- serviceInfo:', employeeSchema.serviceInfo);
    
    // Tüm kendi aracı ile gelen çalışanları kontrol et
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
testOwnCarUpdate(); 
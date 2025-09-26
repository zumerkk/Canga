const mongoose = require('mongoose');
require('dotenv').config();

// Employee model
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, required: true },
  adSoyad: { type: String, required: true },
  tcNo: { type: String, unique: true, required: true },
  telefon: String,
  dogumTarihi: Date,
  iseGirisTarihi: Date,
  adres: String,
  departman: String,
  pozisyon: String,
  maas: Number,
  durum: { type: String, enum: ['AKTIF', 'ESKI'], default: 'AKTIF' },
  istenAyrilisTarihi: Date,
  serviceRoute: String,
  ownCar: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Employee = mongoose.model('Employee', employeeSchema);

async function checkFormerEmployeesInDB() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
    console.log('✅ MongoDB bağlantısı başarılı');

    // Tüm çalışanları kontrol et
    const totalEmployees = await Employee.countDocuments();
    console.log(`📊 Toplam çalışan sayısı: ${totalEmployees}`);

    // Aktif çalışanları kontrol et
    const activeEmployees = await Employee.countDocuments({ durum: 'AKTIF' });
    console.log(`👥 Aktif çalışan sayısı: ${activeEmployees}`);

    // İşten ayrılanları kontrol et
    const formerEmployees = await Employee.countDocuments({ durum: 'ESKI' });
    console.log(`🚪 İşten ayrılan sayısı: ${formerEmployees}`);

    // İşten ayrılanları listele
    if (formerEmployees > 0) {
      console.log('\n📋 İşten Ayrılanlar:');
      const formerList = await Employee.find({ durum: 'ESKI' })
        .select('employeeId adSoyad tcNo istenAyrilisTarihi')
        .sort({ istenAyrilisTarihi: -1 });
      
      formerList.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.adSoyad} (${emp.employeeId}) - TC: ${emp.tcNo} - Ayrılış: ${emp.istenAyrilisTarihi || 'Belirtilmemiş'}`);
      });
    } else {
      console.log('\n⚠️  Veritabanında işten ayrılan çalışan bulunamadı!');
    }

    // İşten ayrılış tarihi olan ama durum AKTIF olanları kontrol et
    const activeWithExitDate = await Employee.countDocuments({ 
      durum: 'AKTIF', 
      istenAyrilisTarihi: { $exists: true, $ne: null } 
    });
    
    if (activeWithExitDate > 0) {
      console.log(`\n⚠️  Ayrılış tarihi olan ama durumu AKTIF olan çalışan sayısı: ${activeWithExitDate}`);
      const problematicEmployees = await Employee.find({ 
        durum: 'AKTIF', 
        istenAyrilisTarihi: { $exists: true, $ne: null } 
      }).select('employeeId adSoyad istenAyrilisTarihi');
      
      problematicEmployees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.adSoyad} (${emp.employeeId}) - Ayrılış: ${emp.istenAyrilisTarihi}`);
      });
    }

    console.log('\n✅ Veritabanı kontrolü tamamlandı');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

checkFormerEmployeesInDB();
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

// İşten ayrılanları sıfırla
const resetFormerEmployees = async () => {
  try {
    console.log('🔄 Mevcut işten ayrılanlar sıfırlanıyor...');
    
    // Önce mevcut işten ayrılanları say (hem PASIF hem AYRILDI)
    const currentPasifCount = await Employee.countDocuments({ durum: 'PASIF' });
    const currentAyrildiCount = await Employee.countDocuments({ durum: 'AYRILDI' });
    const totalFormerCount = currentPasifCount + currentAyrildiCount;
    
    console.log(`📊 Mevcut PASIF çalışan sayısı: ${currentPasifCount}`);
    console.log(`📊 Mevcut AYRILDI çalışan sayısı: ${currentAyrildiCount}`);
    console.log(`📊 Toplam işten ayrılan sayısı: ${totalFormerCount}`);
    
    if (totalFormerCount === 0) {
      console.log('ℹ️ Sıfırlanacak işten ayrılan bulunamadı.');
      return;
    }
    
    // Hem PASIF hem AYRILDI durumundaki çalışanları sil
    const deleteResult = await Employee.deleteMany({ 
      durum: { $in: ['PASIF', 'AYRILDI'] } 
    });
    
    console.log(`✅ ${deleteResult.deletedCount} işten ayrılan başarıyla silindi`);
    
    // Kontrol et
    const remainingPasifCount = await Employee.countDocuments({ durum: 'PASIF' });
    const remainingAyrildiCount = await Employee.countDocuments({ durum: 'AYRILDI' });
    const remainingTotal = remainingPasifCount + remainingAyrildiCount;
    
    console.log(`📊 Kalan işten ayrılan sayısı: ${remainingTotal}`);
    
    if (remainingTotal === 0) {
      console.log('🎉 İşten ayrılanlar başarıyla sıfırlandı!');
    } else {
      console.log('⚠️ Bazı kayıtlar silinemedi, kontrol edin.');
    }
    
  } catch (error) {
    console.error('❌ İşten ayrılanları sıfırlama hatası:', error);
    throw error;
  }
};

// Ana fonksiyon
const main = async () => {
  try {
    await connectDB();
    await resetFormerEmployees();
    console.log('✅ İşlem tamamlandı');
  } catch (error) {
    console.error('❌ İşlem hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Veritabanı bağlantısı kapatıldı');
    process.exit(0);
  }
};

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = { resetFormerEmployees };
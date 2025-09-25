require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

async function deleteAllEmployees() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlantısı başarılı');

        // Silme işlemi öncesi sayım
        const beforeCount = await Employee.countDocuments();
        console.log(`📊 Silme öncesi toplam çalışan sayısı: ${beforeCount}`);

        // Onay mesajı
        console.log('⚠️  TÜM ÇALIŞAN VERİLERİ SİLİNECEK!');
        console.log('🔄 Silme işlemi başlatılıyor...');

        // Tüm çalışanları sil
        const deleteResult = await Employee.deleteMany({});
        console.log(`✅ ${deleteResult.deletedCount} çalışan kaydı silindi`);

        // Silme işlemi sonrası kontrol
        const afterCount = await Employee.countDocuments();
        console.log(`📊 Silme sonrası toplam çalışan sayısı: ${afterCount}`);

        if (afterCount === 0) {
            console.log('🎉 Tüm çalışan verileri başarıyla silindi!');
        } else {
            console.log('⚠️  Bazı kayıtlar silinemedi, kontrol edilmeli');
        }

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 MongoDB bağlantısı kapatıldı');
    }
}

// Güvenlik kontrolü
console.log('⚠️  Bu işlem TÜM ÇALIŞAN VERİLERİNİ SİLECEK!');
console.log('🔄 5 saniye içinde işlem başlayacak...');

setTimeout(() => {
    deleteAllEmployees();
}, 5000);
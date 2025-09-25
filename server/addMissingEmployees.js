require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

async function addMissingEmployees() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlantısı başarılı');

        // Eksik olan 3 çalışan
        const missingEmployees = [
            {
                adSoyad: 'Mustafa DOĞAN',
                tcNo: '51058463866',
                pozisyon: 'İMAL İŞÇİSİ', // CSV'den kontrol edilecek
                durum: 'AKTIF',
                departman: 'ÜRETİM',
                lokasyon: 'MERKEZ',
                servisGuzergahi: 'KENDİ ARACI İLE GELENLER' // Default olarak
            },
            {
                adSoyad: 'Mustafa SÜMER',
                tcNo: '56698275862',
                pozisyon: 'İMAL İŞÇİSİ', // CSV'den kontrol edilecek
                durum: 'AKTIF',
                departman: 'ÜRETİM',
                lokasyon: 'MERKEZ',
                servisGuzergahi: 'KENDİ ARACI İLE GELENLER' // Default olarak
            },
            {
                adSoyad: 'Muzaffer KIZILÇİÇEK',
                tcNo: '10512138900',
                pozisyon: 'İMAL İŞÇİSİ', // CSV'den kontrol edilecek
                durum: 'AKTIF',
                departman: 'ÜRETİM',
                lokasyon: 'MERKEZ',
                servisGuzergahi: 'KENDİ ARACI İLE GELENLER' // Default olarak
            }
        ];

        console.log('🔄 Eksik çalışanlar ekleniyor...');

        let successCount = 0;
        let failCount = 0;

        for (const empData of missingEmployees) {
            try {
                // Önce bu TC numarası ile kayıt var mı kontrol et
                const existingEmployee = await Employee.findOne({ tcNo: empData.tcNo });
                
                if (existingEmployee) {
                    console.log(`⚠️  ${empData.adSoyad} zaten sistemde mevcut (ID: ${existingEmployee.employeeId})`);
                    continue;
                }

                // Benzersiz employeeId oluştur
                const firstInitial = empData.adSoyad.split(' ')[0].charAt(0).toUpperCase();
                const lastInitial = empData.adSoyad.split(' ')[1]?.charAt(0).toUpperCase() || 'X';
                
                // Bu baş harflerle kaç tane kayıt var kontrol et
                const existingCount = await Employee.countDocuments({
                    employeeId: { $regex: `^${firstInitial}${lastInitial}` }
                });
                
                // Yeni ID oluştur
                const newEmployeeId = `${firstInitial}${lastInitial}${String(existingCount + 1).padStart(4, '0')}`;
                
                const employee = new Employee({
                    ...empData,
                    employeeId: newEmployeeId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                await employee.save();
                console.log(`✅ ${empData.adSoyad} başarıyla eklendi (ID: ${newEmployeeId})`);
                successCount++;

            } catch (error) {
                console.error(`❌ ${empData.adSoyad} eklenirken hata:`, error.message);
                failCount++;
            }
        }

        console.log(`\n📊 SONUÇ:`);
        console.log(`✅ Başarıyla eklenen: ${successCount}`);
        console.log(`❌ Hata alan: ${failCount}`);

        // Final kontrol
        const finalCount = await Employee.countDocuments();
        console.log(`🎉 Sistemdeki toplam çalışan sayısı: ${finalCount}`);

    } catch (error) {
        console.error('❌ Genel hata:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 MongoDB bağlantısı kapatıldı');
    }
}

addMissingEmployees();
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Employee = require('./models/Employee');

async function findMissingEmployees() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlantısı başarılı');

        const csvFilePath = '/Users/zumerkekillioglu/Desktop/Canga/GENEL LİSTE-Tablo 1.csv';
        const csvEmployees = [];
        
        console.log('📂 CSV dosyası okunuyor...');

        // CSV dosyasını oku
        fs.createReadStream(csvFilePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (row) => {
                // Başlık satırını atla
                if (row['S.No.'] === 'S.No.' || !row['AD - SOYAD']) {
                    return;
                }

                csvEmployees.push({
                    siraNo: row['S.No.'],
                    adSoyad: row['AD - SOYAD']?.trim(),
                    tcNo: row['TC KİMLİK NO']?.toString().trim()
                });
            })
            .on('end', async () => {
                try {
                    console.log(`📊 CSV'den okunan toplam çalışan: ${csvEmployees.length}`);

                    // Veritabanından tüm çalışanları al
                    const dbEmployees = await Employee.find({}, 'adSoyad tcNo').lean();
                    console.log(`💾 Veritabanındaki toplam çalışan: ${dbEmployees.length}`);

                    // TC numaralarına göre karşılaştır
                    const dbTcNumbers = new Set(dbEmployees.map(emp => emp.tcNo));
                    const csvTcNumbers = new Set(csvEmployees.map(emp => emp.tcNo));

                    // Eksik olanları bul
                    const missingEmployees = csvEmployees.filter(csvEmp => 
                        !dbTcNumbers.has(csvEmp.tcNo)
                    );

                    // Fazla olanları bul (veritabanında var ama CSV'de yok)
                    const extraEmployees = dbEmployees.filter(dbEmp => 
                        !csvTcNumbers.has(dbEmp.tcNo)
                    );

                    console.log('\n🔍 ANALIZ SONUÇLARI:');
                    console.log('='.repeat(50));

                    if (missingEmployees.length > 0) {
                        console.log(`\n❌ Eksik çalışanlar (${missingEmployees.length} kişi):`);
                        missingEmployees.forEach((emp, index) => {
                            console.log(`  ${index + 1}. ${emp.adSoyad} (TC: ${emp.tcNo}) - Sıra No: ${emp.siraNo}`);
                        });
                    } else {
                        console.log('\n✅ Eksik çalışan yok');
                    }

                    if (extraEmployees.length > 0) {
                        console.log(`\n➕ Fazla çalışanlar (${extraEmployees.length} kişi):`);
                        extraEmployees.forEach((emp, index) => {
                            console.log(`  ${index + 1}. ${emp.adSoyad} (TC: ${emp.tcNo})`);
                        });
                    } else {
                        console.log('\n✅ Fazla çalışan yok');
                    }

                    // Duplicate TC kontrolü
                    const csvTcCounts = {};
                    csvEmployees.forEach(emp => {
                        csvTcCounts[emp.tcNo] = (csvTcCounts[emp.tcNo] || 0) + 1;
                    });

                    const duplicateTcs = Object.entries(csvTcCounts).filter(([tc, count]) => count > 1);
                    if (duplicateTcs.length > 0) {
                        console.log(`\n🔄 CSV'de duplicate TC numaraları (${duplicateTcs.length} adet):`);
                        duplicateTcs.forEach(([tc, count]) => {
                            const duplicateEmployees = csvEmployees.filter(emp => emp.tcNo === tc);
                            console.log(`  TC: ${tc} (${count} kez tekrar ediyor):`);
                            duplicateEmployees.forEach(emp => {
                                console.log(`    - ${emp.adSoyad} (Sıra: ${emp.siraNo})`);
                            });
                        });
                    }

                    // Import sırasında hata alan kayıtları kontrol et
                    console.log('\n🔍 Import sırasında hata alabilecek durumlar:');
                    
                    // Boş TC numarası olanlar
                    const emptyTcEmployees = csvEmployees.filter(emp => !emp.tcNo || emp.tcNo.trim() === '');
                    if (emptyTcEmployees.length > 0) {
                        console.log(`\n⚠️  Boş TC numarası olan çalışanlar (${emptyTcEmployees.length} kişi):`);
                        emptyTcEmployees.forEach((emp, index) => {
                            console.log(`  ${index + 1}. ${emp.adSoyad} (Sıra: ${emp.siraNo})`);
                        });
                    }

                    // Boş isim olanlar
                    const emptyNameEmployees = csvEmployees.filter(emp => !emp.adSoyad || emp.adSoyad.trim() === '');
                    if (emptyNameEmployees.length > 0) {
                        console.log(`\n⚠️  Boş isim olan çalışanlar (${emptyNameEmployees.length} kişi):`);
                        emptyNameEmployees.forEach((emp, index) => {
                            console.log(`  ${index + 1}. Sıra No: ${emp.siraNo} (TC: ${emp.tcNo})`);
                        });
                    }

                    console.log('\n📈 ÖZET:');
                    console.log(`  CSV'deki toplam çalışan: ${csvEmployees.length}`);
                    console.log(`  Veritabanındaki toplam çalışan: ${dbEmployees.length}`);
                    console.log(`  Eksik çalışan: ${missingEmployees.length}`);
                    console.log(`  Fazla çalışan: ${extraEmployees.length}`);
                    console.log(`  Fark: ${csvEmployees.length - dbEmployees.length}`);

                } catch (error) {
                    console.error('❌ Analiz hatası:', error.message);
                } finally {
                    await mongoose.disconnect();
                    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
                }
            })
            .on('error', (error) => {
                console.error('❌ CSV okuma hatası:', error.message);
            });

    } catch (error) {
        console.error('❌ Genel hata:', error.message);
        await mongoose.disconnect();
    }
}

findMissingEmployees();
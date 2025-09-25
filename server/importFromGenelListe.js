require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Employee = require('./models/Employee');

async function importFromGenelListe() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlantısı başarılı');

        const csvFilePath = '/Users/zumerkekillioglu/Desktop/Canga/GENEL LİSTE-Tablo 1.csv';
        const employees = [];
        let processedCount = 0;
        let errorCount = 0;

        console.log('📂 CSV dosyası okunuyor...');

        // CSV dosyasını oku
        fs.createReadStream(csvFilePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (row) => {
                try {
                    // Başlık satırını atla
                    if (row['S.No.'] === 'S.No.' || !row['AD - SOYAD']) {
                        return;
                    }

                    // Tarih formatını düzenle
                    const formatDate = (dateStr) => {
                        if (!dateStr || dateStr.trim() === '') return null;
                        
                        // Farklı tarih formatlarını handle et
                        if (dateStr.includes('/')) {
                            const parts = dateStr.split('/');
                            if (parts.length === 3) {
                                // M/D/YY veya MM/DD/YYYY formatı
                                let month = parts[0].padStart(2, '0');
                                let day = parts[1].padStart(2, '0');
                                let year = parts[2];
                                
                                // 2 haneli yılı 4 haneli yap
                                if (year.length === 2) {
                                    year = parseInt(year) > 50 ? '19' + year : '20' + year;
                                }
                                
                                return new Date(`${year}-${month}-${day}`);
                            }
                        }
                        
                        return new Date(dateStr);
                    };

                    // Telefon numarasını temizle
                    const cleanPhone = (phone) => {
                        if (!phone) return '';
                        return phone.replace(/[^0-9]/g, '');
                    };

                    // Servis güzergahını normalize et
                    const normalizeServiceRoute = (route) => {
                        if (!route || route.trim() === '') return 'KENDİ ARACI İLE GELENLER';
                        
                        const routeMap = {
                            'ÇALILIÖZ': 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI',
                            'AHILI/ÇALILIÖZ': 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI',
                            'DİSPANSER': '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI',
                            'OSMANGAZİ': 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI',
                            'BAHÇELİEVLER': 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI',
                            'KARŞIYAKA': 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI',
                            'KEL MUSTAFA DURAĞI/KARŞIYAKA': 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI',
                            'ETİLER': 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI',
                            'REKTÖRLÜK': 'NENE HATUN CADDESİ SERVİS GÜZERGAHI',
                            'REKTÖRLÜK (YENİŞEHİR)': 'NENE HATUN CADDESİ SERVİS GÜZERGAHI',
                            'KENDİ ARACI İLE': 'KENDİ ARACI İLE GELENLER',
                            'KENDİ ARACI': 'KENDİ ARACI İLE GELENLER'
                        };

                        // Önce tam eşleşme ara
                        if (routeMap[route.toUpperCase()]) {
                            return routeMap[route.toUpperCase()];
                        }

                        // Kısmi eşleşme ara
                        for (const [key, value] of Object.entries(routeMap)) {
                            if (route.toUpperCase().includes(key)) {
                                return value;
                            }
                        }

                        // Eşleşme bulunamazsa "KENDİ ARACI İLE GELENLER" olarak ata
                        return 'KENDİ ARACI İLE GELENLER';
                    };

                    // Ad soyadı ayır
                    const fullName = row['AD - SOYAD']?.trim();
                    const nameParts = fullName ? fullName.split(' ') : [];
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.slice(1).join(' ') || '';

                    const employee = {
                        adSoyad: fullName,
                        firstName: firstName,
                        lastName: lastName,
                        tcNo: row['TC KİMLİK NO']?.toString().trim(),
                        cepTelefonu: cleanPhone(row['CEP NO']),
                        dogumTarihi: formatDate(row['DOĞUM TARİHİ']),
                        iseGirisTarihi: formatDate(row['İŞE GİRİŞ TARİHİ']),
                        pozisyon: row['GÖREV']?.trim(),
                        servisGuzergahi: normalizeServiceRoute(row['SERVİS BİNİŞ NOKTASI']),
                        durum: 'AKTIF',
                        departman: 'ÜRETİM',
                        lokasyon: 'MERKEZ',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    // Gerekli alanları kontrol et
                    if (employee.adSoyad && employee.tcNo && employee.pozisyon) {
                        employees.push(employee);
                        processedCount++;
                    } else {
                        console.log(`⚠️  Eksik veri: ${row['AD - SOYAD']} - TC: ${row['TC KİMLİK NO']} - Pozisyon: ${row['GÖREV']}`);
                        errorCount++;
                    }

                } catch (error) {
                    console.error(`❌ Satır işleme hatası:`, error.message);
                    errorCount++;
                }
            })
            .on('end', async () => {
                try {
                    console.log(`\n📊 İşlenen toplam satır: ${processedCount}`);
                    console.log(`❌ Hatalı satır: ${errorCount}`);
                    console.log(`✅ İmport edilecek çalışan: ${employees.length}`);

                    if (employees.length > 0) {
                        console.log('\n🔄 Veritabanına kayıt işlemi başlatılıyor...');
                        
                        // Tek tek kayıt (middleware'in çalışması için)
                        let successCount = 0;
                        let failCount = 0;
                        
                        for (let i = 0; i < employees.length; i++) {
                            try {
                                const employee = new Employee(employees[i]);
                                await employee.save();
                                successCount++;
                                
                                if ((i + 1) % 10 === 0) {
                                    console.log(`📝 ${i + 1}/${employees.length} çalışan işlendi...`);
                                }
                            } catch (error) {
                                console.error(`❌ Kayıt hatası (${employees[i].adSoyad}):`, error.message);
                                failCount++;
                            }
                        }
                        
                        console.log(`✅ ${successCount} çalışan başarıyla eklendi`);
                        if (failCount > 0) {
                            console.log(`❌ ${failCount} çalışan eklenemedi`);
                        }

                        // Servis güzergahı dağılımını göster
                        const routeDistribution = {};
                        employees.forEach(emp => {
                            routeDistribution[emp.servisGuzergahi] = (routeDistribution[emp.servisGuzergahi] || 0) + 1;
                        });

                        console.log('\n📈 Servis güzergahı dağılımı:');
                        Object.entries(routeDistribution).forEach(([route, count]) => {
                            console.log(`  ${route}: ${count} kişi`);
                        });

                        // Final kontrol
                        const finalCount = await Employee.countDocuments();
                        console.log(`\n🎉 Sistemdeki toplam çalışan sayısı: ${finalCount}`);

                    } else {
                        console.log('❌ İmport edilecek geçerli çalışan bulunamadı');
                    }

                } catch (error) {
                    console.error('❌ Veritabanı kayıt hatası:', error.message);
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

importFromGenelListe();
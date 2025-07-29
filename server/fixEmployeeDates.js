const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const Employee = require('./models/Employee');
require('dotenv').config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB bağlantısı başarılı');
  fixDates();
}).catch(err => {
  console.error('❌ MongoDB bağlantı hatası:', err);
});

// İsimleri normalize et (büyük harf, Türkçe karakter)
function normalizeName(name) {
  return name
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ü/g, 'U')
    .replace(/Ğ/g, 'G')
    .replace(/Ş/g, 'S')
    .replace(/Ç/g, 'C')
    .trim();
}

// Tarih formatını düzelt (DD.MM.YYYY -> YYYY-MM-DD)
function normalizeDate(dateStr) {
  if (!dateStr) return null;
  
  // Eğer zaten YYYY-MM-DD formatındaysa
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr.split('T')[0];
  }
  
  // DD.MM.YYYY formatını çevir
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  
  return null;
}

// Tarihleri düzelt
async function fixDates() {
  try {
    console.log('🔄 Tarih düzeltme işlemi başlıyor...');
    
    // CSV dosyasından verileri oku
    const csvData = [];
    const csvPath = path.join(__dirname, '..', 'csv exel', 'kullanici_kisisel_bilgi - Sheet1.csv');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          csvData.push({
            adSoyad: row['ADI SOYADI'],
            normalizedName: normalizeName(row['ADI SOYADI']),
            dogumTarihi: normalizeDate(row['DOĞUM TARİHİ']),
            iseGirisTarihi: normalizeDate(row['İŞE GİRİŞ TARİHİ'])
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 CSV'den ${csvData.length} kayıt okundu`);

    // İstatistikler
    const stats = {
      total: 0,
      updated: 0,
      skipped: 0,
      notFound: 0,
      errors: []
    };

    // Her çalışan için güncelleme yap
    for (const dbEmp of await Employee.find({})) {
      stats.total++;
      
      try {
        // Çalışanı bul
        const normalizedDbName = normalizeName(dbEmp.adSoyad);
        const csvEmp = csvData.find(e => normalizeName(e.adSoyad) === normalizedDbName);
        
        if (!csvEmp) {
          console.log(`⚠️ CSV'de bulunamadı: ${dbEmp.adSoyad}`);
          stats.notFound++;
          continue;
        }

        // Tarihleri kontrol et ve güncelle
        let needsUpdate = false;
        const updates = {};

        if (csvEmp.dogumTarihi && dbEmp.dogumTarihi?.toISOString().split('T')[0] !== csvEmp.dogumTarihi) {
          updates.dogumTarihi = csvEmp.dogumTarihi;
          needsUpdate = true;
        }

        if (csvEmp.iseGirisTarihi && dbEmp.iseGirisTarihi?.toISOString().split('T')[0] !== csvEmp.iseGirisTarihi) {
          updates.iseGirisTarihi = csvEmp.iseGirisTarihi;
          needsUpdate = true;
        }

        if (needsUpdate) {
          // Güncelleme yap
          await Employee.updateOne(
            { _id: dbEmp._id },
            { $set: updates }
          );
          
          console.log(`✅ Güncellendi: ${dbEmp.adSoyad}`);
          console.log('   CSV Ad Soyad:', csvEmp.adSoyad);
          console.log('   Yeni değerler:', updates);
          stats.updated++;
        } else {
          stats.skipped++;
        }

      } catch (error) {
        console.error(`❌ Hata (${dbEmp.adSoyad}):`, error.message);
        stats.errors.push({
          adSoyad: dbEmp.adSoyad,
          error: error.message
        });
      }
    }

    // Sonuç raporu
    console.log('\n📊 İŞLEM SONUÇLARI:');
    console.log(`Toplam kayıt: ${stats.total}`);
    console.log(`Güncellenen: ${stats.updated}`);
    console.log(`Atlanan: ${stats.skipped}`);
    console.log(`Bulunamayan: ${stats.notFound}`);
    console.log(`Hata: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ HATALAR:');
      stats.errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.adSoyad}: ${err.error}`);
      });
    }

    // Raporu kaydet
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      errors: stats.errors
    };

    fs.writeFileSync(
      'date_fix_report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ Rapor date_fix_report.json dosyasına kaydedildi');
    process.exit(0);

  } catch (error) {
    console.error('❌ Ana hata:', error);
    process.exit(1);
  }
} 
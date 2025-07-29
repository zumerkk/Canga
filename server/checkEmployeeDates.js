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
  checkDates();
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

// CSV'den verileri oku ve karşılaştır
async function checkDates() {
  try {
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
            dogumTarihi: row['DOĞUM TARİHİ'],
            iseGirisTarihi: row['İŞE GİRİŞ TARİHİ']
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 CSV'den ${csvData.length} kayıt okundu`);

    // Veritabanındaki tüm çalışanları getir
    const dbEmployees = await Employee.find({}).select('adSoyad dogumTarihi iseGirisTarihi');
    console.log(`📊 Veritabanında ${dbEmployees.length} çalışan bulundu`);

    // Karşılaştırma yap
    const discrepancies = [];
    let matchCount = 0;
    let mismatchCount = 0;
    let notFoundInCSV = [];

    for (const dbEmp of dbEmployees) {
      const normalizedDbName = normalizeName(dbEmp.adSoyad);
      const csvEmp = csvData.find(e => normalizeName(e.adSoyad) === normalizedDbName);
      
      if (csvEmp) {
        const dbBirthDate = dbEmp.dogumTarihi ? new Date(dbEmp.dogumTarihi).toISOString().split('T')[0] : null;
        const dbHireDate = dbEmp.iseGirisTarihi ? new Date(dbEmp.iseGirisTarihi).toISOString().split('T')[0] : null;
        
        const csvBirthDate = csvEmp.dogumTarihi ? new Date(csvEmp.dogumTarihi).toISOString().split('T')[0] : null;
        const csvHireDate = csvEmp.iseGirisTarihi ? new Date(csvEmp.iseGirisTarihi).toISOString().split('T')[0] : null;

        if (dbBirthDate !== csvBirthDate || dbHireDate !== csvHireDate) {
          discrepancies.push({
            adSoyad: dbEmp.adSoyad,
            csvAdSoyad: csvEmp.adSoyad,
            db: {
              dogumTarihi: dbBirthDate,
              iseGirisTarihi: dbHireDate
            },
            csv: {
              dogumTarihi: csvBirthDate,
              iseGirisTarihi: csvHireDate
            }
          });
          mismatchCount++;
        } else {
          matchCount++;
        }
      } else {
        notFoundInCSV.push(dbEmp.adSoyad);
      }
    }

    // Sonuçları yazdır
    console.log('\n📊 KONTROL SONUÇLARI:');
    console.log(`✅ Eşleşen kayıt sayısı: ${matchCount}`);
    console.log(`❌ Uyumsuz kayıt sayısı: ${mismatchCount}`);
    console.log(`⚠️ CSV'de bulunamayan çalışan sayısı: ${notFoundInCSV.length}`);
    
    console.log('\n🔍 UYUMSUZ KAYITLAR:');
    discrepancies.forEach((disc, index) => {
      console.log(`\n${index + 1}. ${disc.adSoyad} (CSV: ${disc.csvAdSoyad})`);
      console.log('  DB  :', disc.db);
      console.log('  CSV :', disc.csv);
    });

    if (notFoundInCSV.length > 0) {
      console.log('\n⚠️ CSV\'DE BULUNAMAYAN ÇALIŞANLAR:');
      notFoundInCSV.forEach((name, i) => {
        console.log(`${i + 1}. ${name}`);
      });
    }

    // Sonuçları dosyaya kaydet
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDbRecords: dbEmployees.length,
        totalCsvRecords: csvData.length,
        matchCount,
        mismatchCount,
        notFoundCount: notFoundInCSV.length
      },
      discrepancies,
      notFoundInCSV
    };

    fs.writeFileSync(
      'date_check_report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ Rapor date_check_report.json dosyasına kaydedildi');
    process.exit(0);

  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
} 
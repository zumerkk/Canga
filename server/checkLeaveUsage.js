const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const Employee = require('./models/Employee');
const AnnualLeave = require('./models/AnnualLeave');
require('dotenv').config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB bağlantısı başarılı');
  checkLeaveUsage();
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

// CSV'den izin kullanımlarını kontrol et
async function checkLeaveUsage() {
  try {
    console.log('🔄 İzin kullanım kontrolü başlıyor...');
    
    // CSV dosyasından verileri oku
    const csvData = [];
    const csvPath = path.join(__dirname, '..', 'csv exel', 'leave_usage.csv');
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Yıllık izin verilerini sayıya çevir
          const yearlyData = {};
          const years = Object.keys(row).filter(key => !isNaN(key));
          
          years.forEach(year => {
            const value = parseFloat(row[year]);
            if (!isNaN(value)) {
              yearlyData[year] = value;
            }
          });

          csvData.push({
            adSoyad: row['ADI SOYADI'],
            normalizedName: normalizeName(row['ADI SOYADI']),
            total: parseFloat(row['TOPLAM']) || 0,
            yearlyUsage: yearlyData
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 CSV'den ${csvData.length} kayıt okundu`);

    // Manuel alias eşleştirmeleri (CSV <> DB yazım farklarını gidermek için)
    const aliasMap = {
      'EYUP UNVANLI': 'EYYUP UNVANLI',
      'MEHMET KEMAL INANC': 'MEHMET KEMAL INAC'
    };

    // Veritabanındaki tüm çalışanları getir
    const dbEmployees = await Employee.find({}).select('_id adSoyad');
    console.log(`📊 Veritabanında ${dbEmployees.length} çalışan bulundu`);

    // İzin kayıtlarını getir
    const leaveRecords = await AnnualLeave.find({});
    console.log(`📊 Veritabanında ${leaveRecords.length} izin kaydı bulundu`);

    // Karşılaştırma yap
    const discrepancies = [];
    let matchCount = 0;
    let mismatchCount = 0;
    let notFoundInCSV = [];

    for (const dbEmp of dbEmployees) {
      let normalizedDbName = normalizeName(dbEmp.adSoyad);
      // Alias uygula
      if (aliasMap[normalizedDbName]) {
        normalizedDbName = aliasMap[normalizedDbName];
      }
      const csvEmp = csvData.find(e => normalizeName(e.adSoyad) === normalizedDbName);
      
      if (csvEmp) {
        // İzin kaydını bul
        const leaveRecord = leaveRecords.find(r => r.employeeId.toString() === dbEmp._id.toString());
        
        if (leaveRecord) {
          // Her yıl için karşılaştır
          const years = Object.keys(csvEmp.yearlyUsage);
          let hasDiscrepancy = false;
          const yearlyDiffs = {};

          years.forEach(year => {
            const csvUsage = csvEmp.yearlyUsage[year] || 0;
            const dbYear = leaveRecord.leaveByYear.find(y => y.year === parseInt(year));
            const dbUsage = dbYear ? dbYear.used : 0;

            if (csvUsage !== dbUsage) {
              hasDiscrepancy = true;
              yearlyDiffs[year] = {
                csv: csvUsage,
                db: dbUsage
              };
            }
          });

          if (hasDiscrepancy) {
            discrepancies.push({
              adSoyad: dbEmp.adSoyad,
              csvAdSoyad: csvEmp.adSoyad,
              yearlyDiffs
            });
            mismatchCount++;
          } else {
            matchCount++;
          }
        } else {
          // İzin kaydı yoksa ve CSV'de kullanım varsa
          if (Object.values(csvEmp.yearlyUsage).some(v => v > 0)) {
            discrepancies.push({
              adSoyad: dbEmp.adSoyad,
              csvAdSoyad: csvEmp.adSoyad,
              error: 'Veritabanında izin kaydı yok'
            });
            mismatchCount++;
          } else {
            matchCount++;
          }
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
      if (disc.error) {
        console.log('   Hata:', disc.error);
      } else {
        console.log('   Yıllık farklılıklar:');
        Object.entries(disc.yearlyDiffs).forEach(([year, diff]) => {
          console.log(`   ${year}: CSV=${diff.csv}, DB=${diff.db}`);
        });
      }
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
        totalDbEmployees: dbEmployees.length,
        totalCsvRecords: csvData.length,
        matchCount,
        mismatchCount,
        notFoundCount: notFoundInCSV.length
      },
      discrepancies,
      notFoundInCSV
    };

    fs.writeFileSync(
      'leave_check_report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ Rapor leave_check_report.json dosyasına kaydedildi');
    process.exit(0);

  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
} 
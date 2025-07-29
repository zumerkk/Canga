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
  fixLeaveUsage();
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

// İzin kullanımlarını düzelt
async function fixLeaveUsage() {
  try {
    console.log('🔄 İzin kullanım düzeltme işlemi başlıyor...');
    
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

    // İstatistikler
    const stats = {
      total: 0,
      updated: 0,
      created: 0,
      skipped: 0,
      errors: []
    };

    // Her çalışan için güncelleme yap
    for (const dbEmp of await Employee.find({})) {
      stats.total++;
      
      try {
        // CSV'den çalışanı bul
        const normalizedDbName = normalizeName(dbEmp.adSoyad);
        const csvEmp = csvData.find(e => normalizeName(e.adSoyad) === normalizedDbName);
        
        if (!csvEmp) {
          console.log(`⚠️ CSV'de bulunamadı: ${dbEmp.adSoyad}`);
          stats.skipped++;
          continue;
        }

        // İzin kaydını bul veya oluştur
        let leaveRecord = await AnnualLeave.findOne({ employeeId: dbEmp._id });
        let isNewRecord = false;

        if (!leaveRecord) {
          leaveRecord = new AnnualLeave({
            employeeId: dbEmp._id,
            leaveByYear: [],
            totalLeaveStats: {
              totalEntitled: 0,
              totalUsed: 0,
              remaining: 0
            }
          });
          isNewRecord = true;
        }

        // Her yıl için izin kullanımını güncelle
        let totalUsed = 0;
        const years = Object.keys(csvEmp.yearlyUsage);

        years.forEach(year => {
          const yearInt = parseInt(year);
          const usage = csvEmp.yearlyUsage[year];

          // Yıllık izin kaydını bul veya oluştur
          let yearRecord = leaveRecord.leaveByYear.find(y => y.year === yearInt);
          
          if (!yearRecord) {
            yearRecord = {
              year: yearInt,
              entitled: 0, // Hesaplanacak
              used: 0,
              entitlementDate: new Date(yearInt, 0, 1),
              leaveRequests: []
            };
            leaveRecord.leaveByYear.push(yearRecord);
          }

          // İzin kullanımını güncelle
          if (usage > 0) {
            yearRecord.used = usage;
            totalUsed += usage;

            // Tek bir izin kaydı ekle
            if (!yearRecord.leaveRequests.some(r => r.days === usage)) {
              yearRecord.leaveRequests.push({
                startDate: new Date(yearInt, 0, 1),
                endDate: new Date(yearInt, 11, 31),
                days: usage,
                status: 'ONAYLANDI',
                notes: 'CSV import'
              });
            }
          }
        });

        // Toplam istatistikleri güncelle
        leaveRecord.totalLeaveStats.totalUsed = totalUsed;
        leaveRecord.lastCalculationDate = new Date();

        // Kaydet
        await leaveRecord.save();
        
        console.log(`✅ ${isNewRecord ? 'Oluşturuldu' : 'Güncellendi'}: ${dbEmp.adSoyad}`);
        console.log('   Yıllık kullanımlar:', csvEmp.yearlyUsage);
        
        if (isNewRecord) {
          stats.created++;
        } else {
          stats.updated++;
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
    console.log(`Oluşturulan: ${stats.created}`);
    console.log(`Atlanan: ${stats.skipped}`);
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
      'leave_fix_report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ Rapor leave_fix_report.json dosyasına kaydedildi');
    process.exit(0);

  } catch (error) {
    console.error('❌ Ana hata:', error);
    process.exit(1);
  }
} 
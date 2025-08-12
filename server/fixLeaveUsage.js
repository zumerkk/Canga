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

    // CSV'yi hızlı erişim için map'le
    const csvMap = csvData.reduce((acc, row) => {
      acc[normalizeName(row.adSoyad)] = row;
      return acc;
    }, {});

    // Manuel alias eşleştirmeleri (CSV <> DB yazım farklarını gidermek için)
    // // Örn: DB: "Eyüp ÜNVANLI" → normalize: EYUP UNVANLI, CSV: "EYYUP UNVANLI" → normalize: EYYUP UNVANLI
    const manualAliases = {
      'EYUP UNVANLI': 'EYYUP UNVANLI', // Eyüp ÜNVANLI ↔ EYYUP UNVANLI
      'MEHMET KEMAL INANC': 'MEHMET KEMAL INAC' // Mehmet Kemal İNANÇ ↔ MEHMET KEMAL INAC
    };
    Object.entries(manualAliases).forEach(([dbKey, csvKey]) => {
      const dbNorm = dbKey.trim();
      const csvNorm = csvKey.trim();
      if (csvMap[csvNorm]) {
        csvMap[dbNorm] = csvMap[csvNorm];
      }
    });

    // Sadece AKTIF çalışanları hedefle (103 kişi olması bekleniyor)
    const activeEmployees = await Employee.find({ durum: 'AKTIF' }).select('_id adSoyad');
    console.log(`👥 Aktif çalışan sayısı: ${activeEmployees.length}`);

    // Her aktif çalışan için güncelleme yap
    for (const dbEmp of activeEmployees) {
      stats.total++;
      
      try {
        // CSV'den çalışanı bul
        const normalizedDbName = normalizeName(dbEmp.adSoyad);
        const csvEmp = csvMap[normalizedDbName];
        
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
        // CSV'deki tüm yılların birleşimi
        const csvYears = Object.keys(csvEmp.yearlyUsage).map(y => parseInt(y));
        const defaultYears = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
        const yearsToProcess = Array.from(new Set([...defaultYears, ...csvYears])).sort();

        let totalUsed = 0;

        yearsToProcess.forEach((yearInt) => {
          const usage = Number(csvEmp.yearlyUsage[yearInt] || 0);

          // Yıllık izin kaydını bul veya oluştur
          let yearRecord = leaveRecord.leaveByYear.find(y => y.year === yearInt);
          if (!yearRecord) {
            yearRecord = {
              year: yearInt,
              entitled: yearRecord?.entitled || 0, // varsa koru, yoksa 0 (hesaplama başka yerde)
              used: 0,
              entitlementDate: new Date(yearInt, 0, 1),
              leaveRequests: []
            };
            leaveRecord.leaveByYear.push(yearRecord);
          }

          // Önce mevcut kullanımları ve talepleri sıfırla (kaymaları temizle)
          yearRecord.used = 0;
          yearRecord.leaveRequests = [];

          // CSV kullanım değeri pozitifse set et ve tek talep oluştur
          if (usage > 0) {
            yearRecord.used = usage;
            totalUsed += usage;
            yearRecord.leaveRequests.push({
              startDate: new Date(yearInt, 0, 1),
              endDate: new Date(yearInt, 11, 31),
              days: usage,
              status: 'ONAYLANDI',
              notes: 'CSV import (otomatik düzeltme)'
            });
          }
        });

        // Toplam istatistikleri güncelle
        const totalEntitled = (leaveRecord.leaveByYear || []).reduce((sum, y) => sum + (y.entitled || 0), 0);
        leaveRecord.totalLeaveStats.totalEntitled = totalEntitled;
        leaveRecord.totalLeaveStats.totalUsed = totalUsed;
        leaveRecord.totalLeaveStats.remaining = totalEntitled - totalUsed;
        leaveRecord.lastCalculationDate = new Date();

        // Kaydet
        await leaveRecord.save();
        
        console.log(`✅ ${isNewRecord ? 'Oluşturuldu' : 'Güncellendi'}: ${dbEmp.adSoyad}`);
        console.log('   Yıllık kullanımlar:', csvEmp.yearlyUsage);

        // Murat Gürbüz özel kontrol/log
        if (normalizeName(dbEmp.adSoyad).includes('MURAT GURBUZ')) {
          const y2023 = leaveRecord.leaveByYear.find(y => y.year === 2023)?.used || 0;
          const y2024 = leaveRecord.leaveByYear.find(y => y.year === 2024)?.used || 0;
          console.log(`   🎯 Murat Gürbüz kontrol → 2023: ${y2023} gün, 2024: ${y2024} gün`);
        }
        
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
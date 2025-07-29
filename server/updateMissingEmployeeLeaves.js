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
  updateMissingEmployeeLeaves();
}).catch(err => {
  console.error('❌ MongoDB bağlantı hatası:', err);
});

// CSV'den verileri oku ve güncelle
async function updateMissingEmployeeLeaves() {
  try {
    console.log('🔄 Eksik çalışanların izin güncellemesi başlıyor...');
    
    // CSV dosyasından verileri oku
    const csvData = [];
    const csvPath = path.join(__dirname, '..', 'csv exel', 'leave_usage_Eyup_MehmetKemal.csv');
    
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
            total: parseFloat(row['TOPLAM']) || 0,
            yearlyUsage: yearlyData
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 CSV'den ${csvData.length} kayıt okundu`);

    // Her çalışan için güncelleme yap
    for (const csvEmp of csvData) {
      if (!csvEmp.adSoyad) continue;

      try {
        // Çalışanı bul
        const employee = await Employee.findOne({
          adSoyad: { $regex: new RegExp('^' + csvEmp.adSoyad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
        });

        if (!employee) {
          console.log(`❌ Çalışan bulunamadı: ${csvEmp.adSoyad}`);
          continue;
        }

        // İzin kaydını bul veya oluştur
        let leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
        let isNewRecord = false;

        if (!leaveRecord) {
          leaveRecord = new AnnualLeave({
            employeeId: employee._id,
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
                notes: 'Manuel import'
              });
            }
          }
        });

        // Toplam istatistikleri güncelle
        leaveRecord.totalLeaveStats.totalUsed = totalUsed;
        leaveRecord.lastCalculationDate = new Date();

        // Kaydet
        await leaveRecord.save();
        
        console.log(`✅ ${isNewRecord ? 'Oluşturuldu' : 'Güncellendi'}: ${employee.adSoyad}`);
        console.log('   Yıllık kullanımlar:', csvEmp.yearlyUsage);

      } catch (error) {
        console.error(`❌ Hata (${csvEmp.adSoyad}):`, error.message);
      }
    }

    console.log('\n✅ İşlem tamamlandı');
    process.exit(0);

  } catch (error) {
    console.error('❌ Ana hata:', error);
    process.exit(1);
  }
} 
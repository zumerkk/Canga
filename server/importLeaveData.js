const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
require('dotenv').config();

const Employee = require('./models/Employee');
const AnnualLeave = require('./models/AnnualLeave');

// Tarih dönüştürme fonksiyonları
function parseDate(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.toString().trim();
  if (!str) return null;
  
  // M/D/YY or M/D/YYYY format
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      
      // Handle 2-digit years
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      return new Date(year, month - 1, day);
    }
  }
  
  // DD.MM.YYYY format
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      
      // Handle 2-digit years
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      return new Date(year, month - 1, day);
    }
  }
  
  return null;
}

// İsim normalizasyonu (Türkçe karakterleri sadeleştir, büyük harfe çevir, boşlukları azalt)
function normalizeName(name) {
  if (!name) return '';
  return name
    .toString()
    .trim()
    .toUpperCase()
    .replace(/Ç/g, 'C')
    .replace(/Ğ/g, 'G')
    .replace(/İ/g, 'I')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ş/g, 'S')
    .replace(/Ü/g, 'U')
    .replace(/Â|Ä|À|Á|Ã/g, 'A')
    .replace(/Ê|Ë|È|É/g, 'E')
    .replace(/Î|Ï|Ì|Í/g, 'I')
    .replace(/Ô|Ö|Ò|Ó|Õ/g, 'O')
    .replace(/Û|Ü|Ù|Ú/g, 'U')
    .replace(/[^A-Z\s]/g, ' ') // harf dışı karakterleri boşluk yap
    .replace(/\s+/g, ' ') // fazla boşlukları teke indir
    .trim();
}

// Yaş hesaplama
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Hizmet yılı hesaplama
function calculateYearsOfService(hireDate) {
  if (!hireDate) return 0;
  
  const today = new Date();
  const hire = new Date(hireDate);
  
  if (hire > today) {
    return 0;
  }
  
  let years = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
    years--;
  }
  
  return Math.max(0, years);
}

// Hak edilen izin günlerini hesapla
function calculateEntitledLeaveDays(employee, year) {
  if (!employee.dogumTarihi || !employee.iseGirisTarihi) {
    return 0;
  }
  
  const birthDate = new Date(employee.dogumTarihi);
  const hireDate = new Date(employee.iseGirisTarihi);
  const checkDate = new Date(year, 11, 31); // Yıl sonu
  
  // Yaş hesabı
  let age = checkDate.getFullYear() - birthDate.getFullYear();
  const ageMonthDiff = checkDate.getMonth() - birthDate.getMonth();
  if (ageMonthDiff < 0 || (ageMonthDiff === 0 && checkDate.getDate() < birthDate.getDate())) {
    age--;
  }

  // Hizmet yılı
  let yearsOfService = checkDate.getFullYear() - hireDate.getFullYear();
  const monthDiff = checkDate.getMonth() - hireDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && checkDate.getDate() < hireDate.getDate())) {
    yearsOfService--;
  }

  // İşe giriş yılı ise hakediş yok
  if (checkDate.getFullYear() === hireDate.getFullYear()) {
    return 0;
  }
  
  // İZİN KURALLARI:
  // 1. 50 yaş ve üzeri = 20 gün (hizmet yılı fark etmez)
  // 2. 50 yaş altı + 5 yıldan az = 14 gün
  // 3. 50 yaş altı + 5 yıl ve üzeri = 20 gün
  if (age >= 50) {
    return yearsOfService > 0 ? 20 : 0;
  } else {
    if (yearsOfService <= 0) {
      return 0;
    } else if (yearsOfService < 5) {
      return 14;
    } else {
      return 20;
    }
  }
}

async function main() {
  try {
    console.log('🔄 MongoDB bağlantısı kuruluyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Aktif çalışanları çek ve normalize isim haritası oluştur
    const activeEmployees = await Employee.find({ durum: 'AKTIF' }).select('_id adSoyad dogumTarihi iseGirisTarihi employeeId');
    const nameMap = new Map();
    for (const emp of activeEmployees) {
      const key = normalizeName(emp.adSoyad);
      if (key) nameMap.set(key, emp);
    }

    // CSV dosyasını oku
    const csvCandidates = [
      path.join(__dirname, '../Çalışan Listesi-Tablo 1.csv'),
      path.join(__dirname, '../Çalışan Listesi-Tablo 1.csv')
    ];
    let csvPath = null;
    for (const p of csvCandidates) {
      if (fs.existsSync(p)) { csvPath = p; break; }
    }
    if (!csvPath) throw new Error('Çalışan Listesi CSV bulunamadı');

    const csvContent = fs.readFileSync(csvPath, 'utf8');

    console.log(`📋 CSV okunuyor: ${csvPath}`);
    
    const results = Papa.parse(csvContent, {
      header: false,
      delimiter: ';',
      skipEmptyLines: true
    });

    // İlk 2 satır header, sonrası data
    const data = results.data.slice(2);
    const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let matchedButNo2025Usage = 0;

    console.log(`📊 ${data.length} satır işlenecek...`);

    for (const row of data) {
      try {
        const adSoyad = (row[1] || '').toString().trim();
        if (!adSoyad) { skippedCount++; continue; }

        const norm = normalizeName(adSoyad);
        const employee = nameMap.get(norm);

        if (!employee) {
          console.log(`⚠️ Eşleşme yok: ${adSoyad}`);
          skippedCount++;
          continue;
        }

        let leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
        if (!leaveRecord) {
          leaveRecord = new AnnualLeave({
            employeeId: employee._id,
            leaveByYear: [],
            totalLeaveStats: { totalEntitled: 0, totalUsed: 0, remaining: 0 },
            lastCalculationDate: new Date()
          });
        }

        // Her yıl için izin verilerini işle
        let totalEntitled = 0;
        let totalUsed = 0;

        for (let i = 0; i < years.length; i++) {
          const year = years[i];
          const usedStr = (row[4 + i] ?? '').toString().trim();
          const used = usedStr !== '' ? (parseInt(usedStr, 10) || 0) : 0;

          const entitled = calculateEntitledLeaveDays(employee, year);

          let yearRecord = leaveRecord.leaveByYear.find(y => y.year === year);
          if (!yearRecord) {
            yearRecord = { year, entitled, used: 0, entitlementDate: new Date(year, 0, 1), leaveRequests: [] };
            leaveRecord.leaveByYear.push(yearRecord);
          } else {
            // entitlements may change based on rules
            yearRecord.entitled = entitled;
          }

          if (used > 0) {
            yearRecord.used = used;
            // Tarih aralığı verilmediği için tek günlük kayıt olarak not düşüyoruz
            yearRecord.leaveRequests.push({
              startDate: new Date(year, 0, 1),
              endDate: new Date(year, 0, 1),
              days: used,
              status: 'ONAYLANDI',
              notes: 'CSV verilerinden aktarıldı',
              type: 'NORMAL',
              createdAt: new Date()
            });
          }

          totalEntitled += entitled;
          totalUsed += (yearRecord.used || 0);
        }

        leaveRecord.totalLeaveStats.totalEntitled = totalEntitled;
        leaveRecord.totalLeaveStats.totalUsed = totalUsed;
        leaveRecord.totalLeaveStats.remaining = totalEntitled - totalUsed;
        leaveRecord.leaveByYear.sort((a, b) => a.year - b.year);
        leaveRecord.lastCalculationDate = new Date();

        await leaveRecord.save();
        processedCount++;

        const y2025 = leaveRecord.leaveByYear.find(y => y.year === 2025);
        if (!y2025 || (y2025.used || 0) === 0) matchedButNo2025Usage++;
      } catch (err) {
        console.error('❌ Satır hatası:', err.message);
        errorCount++;
      }
    }

    console.log('\n📊 İŞLEM SONUÇLARI:');
    console.log(`✅ İşlenen: ${processedCount}`);
    console.log(`⚠️ Atlanan: ${skippedCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    console.log(`ℹ️ 2025'te kullanım verisi olmayan (eşleşenlerde): ${matchedButNo2025Usage}`);

  } catch (error) {
    console.error('❌ Ana işlem hatası:', error);
  } finally {
    console.log('\n🔌 MongoDB bağlantısı kapatılıyor...');
    await mongoose.connection.close();
    console.log('✅ İşlem tamamlandı');
  }
}

// Ana fonksiyonu çalıştır
main();

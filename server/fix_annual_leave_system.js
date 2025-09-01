#!/usr/bin/env node

/**
 * 🔧 CANGA YILLIK İZİN SİSTEMİ DÜZELTİCİ
 * 
 * CSV dosyasındaki doğru verilerle veritabanındaki yıllık izin kayıtlarını düzeltir
 * Sadece aktif çalışanların verilerini günceller
 * 
 * KULLANIM:
 * node fix_annual_leave_system.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Employee = require('./models/Employee');
const AnnualLeave = require('./models/AnnualLeave');

// 📊 CSV dosyası yolu
const CSV_FILE_PATH = path.join(__dirname, '..', 'Yıllık İzinleri Hesaplama Tablosu DEĞİŞTİRİLMİŞ MUZAFFER BEY - Çalışan Listesi.csv');

// 🗓️ İzin kuralları
const LEAVE_RULES = {
  // 50 yaş altı: İlk 5 yıl 14 gün, sonrası 20 gün
  // 50 yaş üstü: Her yıl 20 gün
  calculate: (birthDate, hireDate, year) => {
    if (!birthDate || !hireDate) return 0;
    
    const birth = new Date(birthDate);
    const hire = new Date(hireDate);
    const checkDate = new Date(year, 0, 1); // Yılın 1 Ocak'ı
    
    // Yaş hesapla
    const age = checkDate.getFullYear() - birth.getFullYear();
    
    // Hizmet yılı hesapla
    let yearsOfService = checkDate.getFullYear() - hire.getFullYear();
    
    // İşe giriş yılındaysak tam yıl saymayalım
    if (checkDate.getFullYear() === hire.getFullYear()) {
      return 0; // İlk yılda henüz izin hak edilmez
    }
    
    // İşe giriş ayına göre yıl ayarlaması
    const monthDiff = checkDate.getMonth() - hire.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && checkDate.getDate() < hire.getDate())) {
      yearsOfService--;
    }
    
    // İzin kuralları
    if (age >= 50) {
      return yearsOfService > 0 ? 20 : 0;
    } else {
      if (yearsOfService <= 0) {
        return 0;
      } else if (yearsOfService <= 5) {
        return 14; // İlk 5 yıl
      } else {
        return 20; // 5 yıldan sonra
      }
    }
  }
};

/**
 * 📅 Tarihi parse et (CSV formatından)
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // MM/DD/YYYY veya DD.MM.YYYY formatlarını destekle
  try {
    const cleanDate = dateStr.trim();
    
    // DD.MM.YYYY format
    if (cleanDate.includes('.')) {
      const [day, month, year] = cleanDate.split('.');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // MM/DD/YYYY format (Excel default)
    if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/');
      if (parts.length === 3) {
        const [month, day, year] = parts;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    
    return new Date(cleanDate);
  } catch (error) {
    console.log(`⚠️ Tarih parse hatası: ${dateStr} - ${error.message}`);
    return null;
  }
}

/**
 * 📊 CSV dosyasını okur ve parse eder
 */
function parseCSV() {
  console.log('📁 CSV dosyası okunuyor:', CSV_FILE_PATH);
  
  if (!fs.existsSync(CSV_FILE_PATH)) {
    throw new Error(`CSV dosyası bulunamadı: ${CSV_FILE_PATH}`);
  }
  
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
  const lines = csvContent.split('\n');
  
  // İlk 2 satırı atla (header)
  const dataLines = lines.slice(2).filter(line => line.trim() !== '');
  
  const employees = [];
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]; // CSV'deki yıllar
  
  dataLines.forEach((line, index) => {
    const cols = line.split(',');
    
    // Boş satırları atla
    if (cols.length < 5 || !cols[1] || cols[1].trim() === '') {
      return;
    }
    
    const employee = {
      no: parseInt(cols[0]) || 0,
      adSoyad: cols[1] ? cols[1].trim() : '',
      dogumTarihi: parseDate(cols[2]),
      iseGirisTarihi: parseDate(cols[3]),
      izinKullanimlari: {}
    };
    
    // Skip if essential data is missing
    if (!employee.adSoyad || !employee.dogumTarihi || !employee.iseGirisTarihi) {
      return;
    }
    
    // İzin kullanımlarını parse et (kolon 5'ten başlayarak)
    years.forEach((year, yearIndex) => {
      const colIndex = 4 + yearIndex; // KULLANILAN İZİN GÜNLERİ TOPLAMI sütunundan sonra
      if (cols[colIndex] && cols[colIndex].trim() !== '') {
        const usedDays = parseInt(cols[colIndex].trim()) || 0;
        if (usedDays > 0) {
          employee.izinKullanimlari[year] = usedDays;
        }
      }
    });
    
    employees.push(employee);
  });
  
  console.log(`✅ ${employees.length} çalışan CSV'den parse edildi`);
  return employees;
}

/**
 * 🏭 Çalışanları veritabanına aktarır
 */
async function importEmployees(csvEmployees) {
  console.log('👥 Çalışanlar veritabanına aktarılıyor...');
  
  // Önce var olan tüm çalışanları sil
  await Employee.deleteMany({});
  console.log('🗑️ Var olan çalışanlar temizlendi');
  
  const importedEmployees = [];
  
  for (const csvEmp of csvEmployees) {
    try {
      const employee = new Employee({
        adSoyad: csvEmp.adSoyad,
        dogumTarihi: csvEmp.dogumTarihi,
        iseGirisTarihi: csvEmp.iseGirisTarihi,
        durum: 'AKTIF', // Tüm CSV'deki çalışanlar aktif
        pozisyon: 'Çalışan', // Default pozisyon
        lokasyon: 'MERKEZ' // Default lokasyon
      });
      
      await employee.save();
      importedEmployees.push(employee);
      
      console.log(`✅ ${employee.adSoyad} aktarıldı`);
    } catch (error) {
      console.error(`❌ ${csvEmp.adSoyad} aktarılamadı:`, error.message);
    }
  }
  
  console.log(`✅ ${importedEmployees.length} çalışan başarıyla aktarıldı`);
  return importedEmployees;
}

/**
 * 📆 Yıllık izin kayıtlarını düzeltir
 */
async function fixAnnualLeaveRecords(csvEmployees, dbEmployees) {
  console.log('📆 Yıllık izin kayıtları düzeltiliyor...');
  
  // Önce var olan tüm izin kayıtlarını sil
  await AnnualLeave.deleteMany({});
  console.log('🗑️ Var olan izin kayıtları temizlendi');
  
  // CSV verilerini çalışan isimlerine göre eşleştir
  const csvMap = {};
  csvEmployees.forEach(csvEmp => {
    csvMap[csvEmp.adSoyad.toUpperCase()] = csvEmp;
  });
  
  const currentYear = new Date().getFullYear();
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  
  for (const dbEmployee of dbEmployees) {
    try {
      const csvEmployee = csvMap[dbEmployee.adSoyad.toUpperCase()];
      
      if (!csvEmployee) {
        console.log(`⚠️ CSV'de bulunamadı: ${dbEmployee.adSoyad}`);
        continue;
      }
      
      console.log(`🔧 ${dbEmployee.adSoyad} için izin kayıtları oluşturuluyor...`);
      
      const leaveByYear = [];
      let totalEntitled = 0;
      let totalUsed = 0;
      
      // Her yıl için izin hesapla
      for (const year of years) {
        // Hak edilen izin günleri hesapla
        const entitledDays = LEAVE_RULES.calculate(
          dbEmployee.dogumTarihi, 
          dbEmployee.iseGirisTarihi, 
          year
        );
        
        // CSV'den kullanılan izin günleri al
        const usedDays = csvEmployee.izinKullanimlari[year] || 0;
        
        if (entitledDays > 0) {
          leaveByYear.push({
            year: year,
            entitled: entitledDays,
            used: usedDays,
            entitlementDate: new Date(year, 0, 1),
            leaveRequests: usedDays > 0 ? [{
              startDate: new Date(year, 0, 1),
              endDate: new Date(year, 0, usedDays),
              days: usedDays,
              status: 'ONAYLANDI',
              notes: `CSV'den aktarılan ${year} yılı izin kullanımı`
            }] : []
          });
          
          totalEntitled += entitledDays;
          totalUsed += usedDays;
        }
      }
      
      // İzin kaydını oluştur
      const annualLeave = new AnnualLeave({
        employeeId: dbEmployee._id,
        leaveByYear: leaveByYear,
        totalLeaveStats: {
          totalEntitled: totalEntitled,
          totalUsed: totalUsed,
          remaining: totalEntitled - totalUsed
        },
        notes: 'CSV verilerinden oluşturuldu - Kaymaları düzeltildi',
        lastCalculationDate: new Date()
      });
      
      await annualLeave.save();
      
      // Murat Gürbüz için özel log
      if (dbEmployee.adSoyad.includes('MURAT GÜRBÜZ')) {
        console.log('🎯 MURAT GÜRBÜZ İZİN DETAYLARI:');
        console.log('   - Doğum Tarihi:', dbEmployee.dogumTarihi);
        console.log('   - İşe Giriş:', dbEmployee.iseGirisTarihi);
        console.log('   - İzin Kullanımları (CSV):');
        Object.keys(csvEmployee.izinKullanimlari).forEach(year => {
          console.log(`     ${year}: ${csvEmployee.izinKullanimlari[year]} gün`);
        });
        console.log('   - Toplam Hak Edilen:', totalEntitled);
        console.log('   - Toplam Kullanılan:', totalUsed);
        console.log('   - Kalan:', totalEntitled - totalUsed);
      }
      
      console.log(`✅ ${dbEmployee.adSoyad}: ${leaveByYear.length} yıl, ${totalUsed}/${totalEntitled} gün`);
      
    } catch (error) {
      console.error(`❌ ${dbEmployee.adSoyad} izin kayıtları oluşturulamadı:`, error.message);
    }
  }
  
  console.log(`✅ Yıllık izin kayıtları başarıyla düzeltildi`);
}

/**
 * 📊 Özet rapor gösterir
 */
async function showSummary() {
  console.log('\n📊 SİSTEM ÖZETİ');
  console.log('================');
  
  const totalEmployees = await Employee.countDocuments();
  const activeEmployees = await Employee.countDocuments({ durum: 'AKTIF' });
  const leaveRecords = await AnnualLeave.countDocuments();
  
  console.log(`👥 Toplam Çalışan: ${totalEmployees}`);
  console.log(`✅ Aktif Çalışan: ${activeEmployees}`);
  console.log(`📆 İzin Kayıtları: ${leaveRecords}`);
  
  // Murat Gürbüz'ün durumunu kontrol et
  const muratGurbuz = await Employee.findOne({ adSoyad: /MURAT GÜRBÜZ/i });
  if (muratGurbuz) {
    const leaveRecord = await AnnualLeave.findOne({ employeeId: muratGurbuz._id });
    console.log('\n🎯 MURAT GÜRBÜZ DURUM KONTROLÜ:');
    console.log(`   ✅ Çalışan kaydı: Var (${muratGurbuz.adSoyad})`);
    console.log(`   📆 İzin kaydı: ${leaveRecord ? 'Var' : 'Yok'}`);
    
    if (leaveRecord) {
      console.log('   📋 Yıllık izin detayları:');
      leaveRecord.leaveByYear.forEach(yearData => {
        console.log(`     ${yearData.year}: ${yearData.used}/${yearData.entitled} gün kullanıldı`);
      });
      console.log(`   📊 Toplam: ${leaveRecord.totalLeaveStats.totalUsed}/${leaveRecord.totalLeaveStats.totalEntitled} gün`);
    }
  }
  
  console.log('\n✅ KAYMA DÜZELTMESİ TAMAMLANDI!');
  console.log('Artık CSV\'deki verilerle sistem uyumlu çalışıyor.\n');
}

/**
 * 🚀 Ana fonksiyon
 */
async function main() {
  try {
    console.log('🔧 CANGA YILLIK İZİN SİSTEMİ DÜZELTİCİ BAŞLATILIYOR...\n');
    
    // MongoDB'ye bağlan
    await mongoose.connect('mongodb://localhost:27017/canga_employee_system');
    console.log('✅ MongoDB bağlantısı kuruldu\n');
    
    // 1. CSV'yi parse et
    const csvEmployees = parseCSV();
    
    // 2. Çalışanları veritabanına aktar
    const dbEmployees = await importEmployees(csvEmployees);
    
    // 3. Yıllık izin kayıtlarını düzelt
    await fixAnnualLeaveRecords(csvEmployees, dbEmployees);
    
    // 4. Özet rapor göster
    await showSummary();
    
  } catch (error) {
    console.error('❌ HATA:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('📄 MongoDB bağlantısı kapatıldı');
    process.exit(0);
  }
}

// Scripti çalıştır
if (require.main === module) {
  main();
}

module.exports = { main, parseCSV, LEAVE_RULES };

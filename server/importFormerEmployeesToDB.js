const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Employee model
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, required: true },
  adSoyad: { type: String, required: true },
  tcNo: { type: String, unique: true, required: true },
  telefon: String,
  dogumTarihi: Date,
  iseGirisTarihi: Date,
  adres: String,
  departman: String,
  pozisyon: String,
  maas: Number,
  durum: { type: String, enum: ['AKTIF', 'PASIF', 'ESKI'], default: 'AKTIF' },
  istenAyrilisTarihi: Date,
  ayrilmaTarihi: Date,
  serviceRoute: String,
  ownCar: { type: Boolean, default: false }
}, {
  timestamps: true
});

const Employee = mongoose.model('Employee', employeeSchema);

// Tarih parse fonksiyonu
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Türkçe tarih formatları: "DD.MM.YYYY" veya "DD/MM/YYYY"
  const cleanDate = dateStr.trim().replace(/\//g, '.');
  const parts = cleanDate.split('.');
  
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript ayları 0-11 arası
    const year = parseInt(parts[2]);
    
    if (day && month >= 0 && year) {
      return new Date(year, month, day);
    }
  }
  
  return null;
}

// EmployeeId generate fonksiyonu
function generateEmployeeId(adSoyad) {
  if (!adSoyad) return 'UNKNOWN001';
  
  const parts = adSoyad.trim().split(' ');
  let initials = '';
  
  parts.forEach(part => {
    if (part.length > 0) {
      initials += part.charAt(0).toUpperCase();
    }
  });
  
  // En az 2 karakter olsun
  if (initials.length < 2) {
    initials = adSoyad.substring(0, 2).toUpperCase();
  }
  
  return initials;
}

async function importFormerEmployees() {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
    console.log('✅ MongoDB bağlantısı başarılı');

    const csvFilePath = '../İŞTEN AYRILANLAR-Tablo 1.csv';
    
    if (!fs.existsSync(csvFilePath)) {
      console.error('❌ CSV dosyası bulunamadı:', csvFilePath);
      return;
    }

    console.log('📄 CSV dosyası okunuyor...');
    
    const formerEmployees = [];
    let lineCount = 0;
    
    // Önce CSV'yi oku
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath, { encoding: 'utf8' })
        .pipe(csv({
          separator: ';',
          headers: ['istenAyrilisTarihi', 'adSoyad', 'tcNo', 'telefon', 'dogumTarihi', 'iseGirisTarihi', 'adres']
        }))
        .on('data', (row) => {
          lineCount++;
          
          // Header satırlarını atla
          if (lineCount <= 2 || !row.adSoyad || row.adSoyad.includes('AD SOY AD')) {
            return;
          }
          
          // Boş satırları atla
          if (!row.adSoyad.trim() || !row.tcNo.trim()) {
            return;
          }
          
          formerEmployees.push({
            adSoyad: row.adSoyad.trim(),
            tcNo: row.tcNo.trim(),
            telefon: row.telefon ? row.telefon.trim() : '',
            dogumTarihi: parseDate(row.dogumTarihi),
            iseGirisTarihi: parseDate(row.iseGirisTarihi),
            istenAyrilisTarihi: parseDate(row.istenAyrilisTarihi),
            adres: row.adres ? row.adres.trim() : '',
            durum: 'PASIF'
          });
        })
        .on('end', () => {
          console.log(`📊 CSV'den ${formerEmployees.length} işten ayrılan çalışan okundu`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSV okuma hatası:', error);
          reject(error);
        });
    });
    
    // Şimdi veritabanı işlemlerini yap
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const empData of formerEmployees) {
      try {
        // TC numarasına göre mevcut çalışanı kontrol et
        const existingEmployee = await Employee.findOne({ tcNo: empData.tcNo });
        
        if (existingEmployee) {
          // Mevcut çalışan varsa durumunu güncelle
          if (existingEmployee.durum === 'AKTIF') {
            existingEmployee.durum = 'PASIF';
            existingEmployee.istenAyrilisTarihi = empData.istenAyrilisTarihi;
            existingEmployee.ayrilmaTarihi = empData.istenAyrilisTarihi;
            
            await existingEmployee.save();
            console.log(`🔄 ${empData.adSoyad} durumu PASIF olarak güncellendi`);
            updatedCount++;
          } else {
            console.log(`⏭️  ${empData.adSoyad} zaten PASIF durumda`);
            skippedCount++;
          }
        } else {
          // Yeni işten ayrılan çalışan ekle
          const initials = generateEmployeeId(empData.adSoyad);
          
          // Aynı initials'a sahip çalışan sayısını bul
          const existingCount = await Employee.countDocuments({
            employeeId: { $regex: `^${initials}\\d{4}$` }
          });
          
          const employeeId = `${initials}${(existingCount + 1).toString().padStart(4, '0')}`;
          
          const newEmployee = new Employee({
            ...empData,
            employeeId: employeeId,
            departman: 'Bilinmiyor',
            pozisyon: 'Bilinmiyor'
          });
          
          await newEmployee.save();
          console.log(`✅ ${empData.adSoyad} yeni işten ayrılan olarak eklendi (${employeeId})`);
          addedCount++;
        }
        
      } catch (error) {
        console.error(`❌ ${empData.adSoyad} işlenirken hata:`, error.message);
        skippedCount++;
      }
    }
    
    // Final istatistikler
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ durum: 'AKTIF' });
    const formerEmployeesCount = await Employee.countDocuments({ durum: 'PASIF' });
    
    console.log('\n📊 İMPORT SONUÇLARI:');
    console.log(`✅ Yeni eklenen: ${addedCount}`);
    console.log(`🔄 Güncellenen: ${updatedCount}`);
    console.log(`⏭️  Atlanan: ${skippedCount}`);
    console.log(`📈 Toplam çalışan: ${totalEmployees}`);
    console.log(`👥 Aktif çalışan: ${activeEmployees}`);
    console.log(`🚪 İşten ayrılan: ${formerEmployeesCount}`);

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

importFormerEmployees();
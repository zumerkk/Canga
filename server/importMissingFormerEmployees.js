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

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const cleanDate = dateStr.trim();
  
  // MM/DD/YY formatı
  if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
    const [month, day, year] = cleanDate.split('/');
    const fullYear = parseInt(year) + 2000;
    return new Date(fullYear, parseInt(month) - 1, parseInt(day));
  }
  
  // DD.MM.YYYY formatı
  if (cleanDate.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
    const [day, month, year] = cleanDate.split('.');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return null;
}

function generateEmployeeId(adSoyad) {
  if (!adSoyad) return 'UNK0001';
  
  const words = adSoyad.trim().split(' ');
  let initials = '';
  
  for (const word of words) {
    if (word.length > 0) {
      initials += word[0].toUpperCase();
    }
  }
  
  return initials || 'UNK';
}

async function importMissingFormerEmployees() {
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
    
    // Önce CSV'yi oku - DOĞRU HEADER YAPISI
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath, { encoding: 'utf8' })
        .pipe(csv({
          separator: ';',
          headers: ['sira', 'istenAyrilisTarihi', 'adSoyad', 'tcNo', 'telefon', 'dogumTarihi', 'iseGirisTarihi', 'adres', 'col8', 'col9', 'col10', 'col11']
        }))
        .on('data', (row) => {
          lineCount++;
          
          // Header satırlarını atla
          if (lineCount <= 2 || !row.adSoyad || row.adSoyad.includes('AD SOY AD')) {
            return;
          }
          
          // Boş satırları atla
          if (!row.adSoyad || !row.adSoyad.trim() || !row.tcNo || !row.tcNo.trim()) {
            console.log(`⏭️  Satır ${lineCount}: Boş veri atlandı`);
            return;
          }
          
          formerEmployees.push({
            sira: row.sira,
            adSoyad: row.adSoyad.trim(),
            tcNo: row.tcNo.trim(),
            telefon: row.telefon ? row.telefon.trim() : '',
            dogumTarihi: parseDate(row.dogumTarihi),
            iseGirisTarihi: parseDate(row.iseGirisTarihi),
            istenAyrilisTarihi: parseDate(row.istenAyrilisTarihi),
            adres: row.adres ? row.adres.trim() : '',
            durum: 'PASIF',
            lineNumber: lineCount
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
    
    // Sadece eksik olanları import et
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let alreadyExistsCount = 0;
    
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
            alreadyExistsCount++;
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
          console.log(`✅ ${empData.adSoyad} yeni işten ayrılan olarak eklendi (${employeeId}) - Satır: ${empData.lineNumber}`);
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
    console.log(`⏭️  Zaten mevcut: ${alreadyExistsCount}`);
    console.log(`❌ Hata ile atlanan: ${skippedCount}`);
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

importMissingFormerEmployees();
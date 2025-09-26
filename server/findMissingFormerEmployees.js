const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Employee model
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  adSoyad: { type: String, required: true },
  tcNo: { type: String, required: true, unique: true },
  telefon: String,
  dogumTarihi: Date,
  iseGirisTarihi: Date,
  istenAyrilisTarihi: Date,
  ayrilmaTarihi: Date,
  adres: String,
  departman: String,
  pozisyon: String,
  durum: { type: String, enum: ['AKTIF', 'PASIF'], default: 'AKTIF' },
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

async function findMissingFormerEmployees() {
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
    
    const csvEmployees = [];
    let lineCount = 0;
    
    // CSV'yi oku
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
            console.log(`⏭️  Satır ${lineCount}: Boş veri - adSoyad: "${row.adSoyad}", tcNo: "${row.tcNo}"`);
            return;
          }
          
          csvEmployees.push({
            sira: row.sira,
            adSoyad: row.adSoyad.trim(),
            tcNo: row.tcNo.trim(),
            telefon: row.telefon ? row.telefon.trim() : '',
            dogumTarihi: parseDate(row.dogumTarihi),
            iseGirisTarihi: parseDate(row.iseGirisTarihi),
            istenAyrilisTarihi: parseDate(row.istenAyrilisTarihi),
            adres: row.adres ? row.adres.trim() : '',
            lineNumber: lineCount
          });
        })
        .on('end', () => {
          console.log(`📊 CSV'den ${csvEmployees.length} geçerli kayıt okundu (Toplam satır: ${lineCount})`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ CSV okuma hatası:', error);
          reject(error);
        });
    });
    
    // Veritabanından işten ayrılan çalışanları al
    const dbFormerEmployees = await Employee.find({ durum: 'PASIF' }).select('tcNo adSoyad employeeId');
    console.log(`🗄️  Veritabanında ${dbFormerEmployees.length} işten ayrılan çalışan bulundu`);
    
    // TC numaralarını karşılaştır
    const dbTcNumbers = new Set(dbFormerEmployees.map(emp => emp.tcNo));
    const csvTcNumbers = new Set(csvEmployees.map(emp => emp.tcNo));
    
    console.log('\n📊 KARŞILAŞTIRMA SONUÇLARI:');
    console.log(`📄 CSV'deki toplam kayıt: ${csvEmployees.length}`);
    console.log(`🗄️  Veritabanındaki işten ayrılan: ${dbFormerEmployees.length}`);
    console.log(`❌ Eksik kayıt sayısı: ${csvEmployees.length - dbFormerEmployees.length}`);
    
    // Eksik kayıtları bul
    const missingEmployees = csvEmployees.filter(csvEmp => !dbTcNumbers.has(csvEmp.tcNo));
    
    if (missingEmployees.length > 0) {
      console.log('\n🔍 EKSİK KAYITLAR:');
      missingEmployees.forEach((emp, index) => {
        console.log(`${index + 1}. Satır ${emp.lineNumber}: ${emp.adSoyad} (TC: ${emp.tcNo})`);
        console.log(`   📞 Telefon: ${emp.telefon}`);
        console.log(`   📅 İşten Ayrılış: ${emp.istenAyrilisTarihi ? emp.istenAyrilisTarihi.toLocaleDateString('tr-TR') : 'Belirtilmemiş'}`);
        console.log(`   🏠 Adres: ${emp.adres || 'Belirtilmemiş'}`);
        console.log('');
      });
      
      // Eksik kayıtları JSON dosyasına kaydet
      const reportData = {
        summary: {
          csvTotal: csvEmployees.length,
          dbTotal: dbFormerEmployees.length,
          missingCount: missingEmployees.length,
          timestamp: new Date().toISOString()
        },
        missingEmployees: missingEmployees.map(emp => ({
          lineNumber: emp.lineNumber,
          adSoyad: emp.adSoyad,
          tcNo: emp.tcNo,
          telefon: emp.telefon,
          istenAyrilisTarihi: emp.istenAyrilisTarihi,
          adres: emp.adres
        }))
      };
      
      fs.writeFileSync('missing_former_employees_report.json', JSON.stringify(reportData, null, 2));
      console.log('📄 Eksik kayıtlar raporu "missing_former_employees_report.json" dosyasına kaydedildi');
    } else {
      console.log('\n✅ Tüm CSV kayıtları veritabanında mevcut!');
    }
    
    // Ek kontroller
    console.log('\n🔍 EK KONTROLLER:');
    
    // Veritabanında olup CSV'de olmayan kayıtlar
    const extraInDb = dbFormerEmployees.filter(dbEmp => !csvTcNumbers.has(dbEmp.tcNo));
    if (extraInDb.length > 0) {
      console.log(`⚠️  Veritabanında olup CSV'de olmayan ${extraInDb.length} kayıt:`);
      extraInDb.forEach(emp => {
        console.log(`   - ${emp.adSoyad} (TC: ${emp.tcNo}, ID: ${emp.employeeId})`);
      });
    }

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
findMissingFormerEmployees();
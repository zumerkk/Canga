const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Employee = require('./models/Employee');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// Tarih parse fonksiyonu
const parseDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Farklı tarih formatlarını destekle
    let cleanDate = dateStr.trim();
    
    // DD.MM.YYYY formatı
    if (cleanDate.includes('.')) {
      const parts = cleanDate.split('.');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        cleanDate = `${month}/${day}/${year}`;
      }
    }
    
    // M/D/YYYY formatı
    const date = new Date(cleanDate);
    
    // Geçerli tarih kontrolü
    if (isNaN(date.getTime())) {
      console.warn(`⚠️ Geçersiz tarih formatı: ${dateStr}`);
      return null;
    }
    
    // Makul tarih aralığı kontrolü
    const currentYear = new Date().getFullYear();
    const year = date.getFullYear();
    
    if (year < 1900 || year > currentYear + 10) {
      console.warn(`⚠️ Makul olmayan tarih: ${dateStr} (${year})`);
      return null;
    }
    
    return date;
  } catch (error) {
    console.warn(`⚠️ Tarih parse hatası: ${dateStr}`, error.message);
    return null;
  }
};

// CSV dosyasını oku ve parse et
const readCSVFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Header'ı atla
    const dataLines = lines.slice(1);
    
    const employees = [];
    
    dataLines.forEach((line, index) => {
      try {
        // Tırnak içindeki veriyi parse et
        let cleanLine = line.trim();
        if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
          cleanLine = cleanLine.slice(1, -1); // Başındaki ve sonundaki tırnakları kaldır
        }
        
        // Virgülle ayır
        const columns = cleanLine.split(',').map(col => col.trim());
        
        if (columns.length >= 3) {
          const [no, adSoyad, dogumTarihi, iseGirisTarihi] = columns;
          
          if (adSoyad && adSoyad.trim()) {
            employees.push({
              no: no?.trim(),
              adSoyad: adSoyad?.trim(),
              dogumTarihi: parseDate(dogumTarihi?.trim()),
              iseGirisTarihi: parseDate(iseGirisTarihi?.trim())
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Satır ${index + 2} parse edilemedi:`, error.message);
      }
    });
    
    return employees;
  } catch (error) {
    console.error('❌ CSV dosyası okunamadı:', error);
    return [];
  }
};

// Çalışanları import et
const importEmployees = async () => {
  try {
    console.log('🔄 Çalışan import işlemi başlıyor...');
    
    // Mevcut çalışanları temizle (sadece test verileri varsa)
    const currentCount = await Employee.countDocuments();
    console.log(`📊 Mevcut çalışan sayısı: ${currentCount}`);
    
    if (currentCount <= 10) { // Sadece test verileri varsa temizle
      await Employee.deleteMany({});
      console.log('🗑️ Test verileri temizlendi');
    }
    
    // CSV dosyasını oku
    const csvPath = path.join(__dirname, '..', 'csv - Sayfa1.csv');
    const csvEmployees = readCSVFile(csvPath);
    
    console.log(`📊 CSV'den ${csvEmployees.length} çalışan okundu`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    for (const csvEmployee of csvEmployees) {
      try {
        // Çalışan verilerini hazırla
        const employeeData = {
          adSoyad: csvEmployee.adSoyad,
          dogumTarihi: csvEmployee.dogumTarihi,
          iseGirisTarihi: csvEmployee.iseGirisTarihi,
          pozisyon: 'Çalışan', // Varsayılan pozisyon
          lokasyon: 'MERKEZ', // Varsayılan lokasyon
          durum: 'AKTIF' // Varsayılan durum
        };
        
        // Çalışanı oluştur
        const newEmployee = new Employee(employeeData);
        await newEmployee.save();
        
        importedCount++;
        console.log(`✅ ${csvEmployee.adSoyad} import edildi`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ ${csvEmployee.adSoyad} import edilirken hata:`, error.message);
      }
    }
    
    console.log('\n📊 IMPORT RAPORU:');
    console.log(`✅ Import edilen çalışan sayısı: ${importedCount}`);
    console.log(`⚠️ Hata alan çalışan sayısı: ${errorCount}`);
    console.log(`📋 Toplam işlenen çalışan: ${csvEmployees.length}`);
    
  } catch (error) {
    console.error('❌ Import işlemi başarısız:', error);
  }
};

// Ana fonksiyon
const main = async () => {
  try {
    await connectDB();
    await importEmployees();
    console.log('\n🎉 İşlem tamamlandı!');
  } catch (error) {
    console.error('❌ Ana işlem hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Veritabanı bağlantısı kapatıldı');
    process.exit(0);
  }
};

// Scripti çalıştır
if (require.main === module) {
  main();
}

module.exports = { importEmployees, parseDate, readCSVFile };
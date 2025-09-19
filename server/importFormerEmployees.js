const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// Tarih formatını düzenle
const parseDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  try {
    // Farklı tarih formatlarını handle et
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
    
    // M/D/YY formatı
    if (cleanDate.includes('/')) {
      const parts = cleanDate.split('/');
      if (parts.length === 3 && parts[2].length === 2) {
        // YY formatını YYYY'ye çevir
        const year = parseInt(parts[2]);
        const fullYear = year > 50 ? 1900 + year : 2000 + year;
        cleanDate = `${parts[0]}/${parts[1]}/${fullYear}`;
      }
    }
    
    const date = new Date(cleanDate);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn(`Tarih parse hatası: ${dateStr}`);
    return null;
  }
};

// Employee ID oluştur
const generateEmployeeId = async () => {
  // En yüksek employeeId'yi bul
  const employees = await Employee.find({}, { employeeId: 1 }).sort({ employeeId: -1 });
  let maxId = 0;
  
  for (const emp of employees) {
    if (emp.employeeId && emp.employeeId.startsWith('EMP')) {
      const idNum = parseInt(emp.employeeId.replace('EMP', ''));
      if (!isNaN(idNum) && idNum > maxId) {
        maxId = idNum;
      }
    }
  }
  
  const nextId = maxId + 1;
  return `EMP${nextId.toString().padStart(4, '0')}`;
};

// Benzersiz Employee ID oluştur
const generateUniqueEmployeeId = async () => {
  let attempts = 0;
  const maxAttempts = 1000;
  
  while (attempts < maxAttempts) {
    const employeeId = await generateEmployeeId();
    const existing = await Employee.findOne({ employeeId });
    
    if (!existing) {
      return employeeId;
    }
    
    attempts++;
    // Eğer çakışma varsa, rastgele bir sayı ekle
    const randomSuffix = Math.floor(Math.random() * 1000);
    const uniqueId = `EMP${(parseInt(employeeId.replace('EMP', '')) + randomSuffix).toString().padStart(4, '0')}`;
    const existingUnique = await Employee.findOne({ employeeId: uniqueId });
    
    if (!existingUnique) {
      return uniqueId;
    }
  }
  
  throw new Error('Benzersiz Employee ID oluşturulamadı');
};

// CSV'yi parse et ve veritabanına ekle
const importFormerEmployees = async () => {
  const csvFilePath = '/Users/zumerkekillioglu/Desktop/Canga/İŞTEN AYRILANLAR-Tablo 1.csv';
  const employees = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';', headers: false }))
      .on('data', (row) => {
        // İlk satır header, boş satırları atla
        if (row[0] && row[0] !== '' && !isNaN(row[0]) && row[2] && row[2].trim() !== '') {
          const employee = {
            sira: row[0],
            ayrilmaTarihi: row[1],
            adSoyad: row[2],
            tcNo: row[3],
            telefon: row[4],
            dogumTarihi: row[5],
            iseGirisTarihi: row[6],
            adres: row[7] || ''
          };
          employees.push(employee);
        }
      })
      .on('end', async () => {
        try {
          console.log(`📊 CSV'den ${employees.length} çalışan okundu`);
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const emp of employees) {
            try {
              // Aynı TC numarası ile kayıt var mı kontrol et
              const existingEmployee = await Employee.findOne({ tcNo: emp.tcNo });
              
              if (existingEmployee) {
                // Mevcut çalışanı güncelle
                existingEmployee.durum = 'AYRILDI';
                existingEmployee.ayrilmaTarihi = parseDate(emp.ayrilmaTarihi);
                await existingEmployee.save();
                console.log(`🔄 Güncellendi: ${emp.adSoyad}`);
              } else {
                // Yeni çalışan ekle
                const employeeId = await generateUniqueEmployeeId();
                
                const newEmployee = new Employee({
                  employeeId: employeeId,
                  adSoyad: emp.adSoyad,
                  tcNo: emp.tcNo,
                  cepTelefonu: emp.telefon || '',
                  dogumTarihi: parseDate(emp.dogumTarihi),
                  iseGirisTarihi: parseDate(emp.iseGirisTarihi),
                  ayrilmaTarihi: parseDate(emp.ayrilmaTarihi),
                  pozisyon: 'İşçi',
                  lokasyon: 'MERKEZ',
                  durum: 'AYRILDI',
                  servisGuzergahi: emp.adres || 'Bilinmiyor'
                });
                
                await newEmployee.save();
                console.log(`✅ Eklendi: ${emp.adSoyad}`);
              }
              
              successCount++;
            } catch (error) {
              console.error(`❌ Hata (${emp.adSoyad}):`, error.message);
              errorCount++;
            }
          }
          
          console.log(`\n📊 İşlem Özeti:`);
          console.log(`✅ Başarılı: ${successCount}`);
          console.log(`❌ Hatalı: ${errorCount}`);
          console.log(`📋 Toplam: ${employees.length}`);
          
          // Kontrol et
          const totalFormerEmployees = await Employee.countDocuments({ 
            $or: [{ durum: 'PASIF' }, { durum: 'AYRILDI' }] 
          });
          console.log(`\n📊 Veritabanındaki toplam işten ayrılan sayısı: ${totalFormerEmployees}`);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Ana fonksiyon
const main = async () => {
  try {
    await connectDB();
    await importFormerEmployees();
    console.log('🎉 İşlem başarıyla tamamlandı!');
  } catch (error) {
    console.error('❌ İşlem hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Veritabanı bağlantısı kapatıldı');
    process.exit(0);
  }
};

// Script'i çalıştır
if (require.main === module) {
  main();
}

module.exports = { importFormerEmployees };
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

const checkTCNumbers = async () => {
  const csvFilePath = '/Users/zumerkekillioglu/Desktop/Canga/İŞTEN AYRILANLAR-Tablo 1.csv';
  const csvEmployees = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';', headers: false }))
      .on('data', (row) => {
        if (row[0] && row[0] !== '' && !isNaN(row[0]) && row[2] && row[2].trim() !== '') {
          csvEmployees.push({
            tc: row[3],
            name: row[2]
          });
        }
      })
      .on('end', async () => {
        try {
          console.log(`📊 CSV'den ${csvEmployees.length} çalışan okundu`);
          
          let existingCount = 0;
          let newCount = 0;
          
          for (const emp of csvEmployees) {
            const existing = await Employee.findOne({ tcNo: emp.tc });
            if (existing) {
              console.log(`✅ Mevcut: ${emp.name} (${emp.tc}) - Durum: ${existing.durum}`);
              existingCount++;
            } else {
              console.log(`❌ Yok: ${emp.name} (${emp.tc})`);
              newCount++;
            }
          }
          
          console.log(`\n📊 Özet:`);
          console.log(`✅ Veritabanında mevcut: ${existingCount}`);
          console.log(`❌ Veritabanında yok: ${newCount}`);
          console.log(`📋 Toplam CSV: ${csvEmployees.length}`);
          
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

const main = async () => {
  try {
    await connectDB();
    await checkTCNumbers();
  } catch (error) {
    console.error('❌ İşlem hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Veritabanı bağlantısı kapatıldı');
    process.exit(0);
  }
};

if (require.main === module) {
  main();
}
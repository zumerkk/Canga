require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const fs = require('fs');

async function findExtraEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Veritabanından tüm aktif çalışanları al (Stajyer ve Çırak hariç)
    const dbEmployees = await Employee.find({ 
      durum: 'AKTIF',
      departman: { $nin: ['STAJYERLİK', 'ÇIRAK LİSE'] }
    }).select('adSoyad tcNo pozisyon iseGirisTarihi cepTelefonu').lean();
    
    console.log('📊 Veritabanında AKTIF Çalışan Sayısı:', dbEmployees.length);
    
    // CSV dosyasını oku
    const csvContent = fs.readFileSync('../GENEL LİSTE-Tablo 1.csv', 'utf-8');
    const lines = csvContent.split('\n');
    const csvNames = new Set();
    
    for (let i = 11; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const fields = line.split(';');
      if (fields.length < 3) continue;
      const name = fields[2]?.trim();
      if (name && name !== 'AD - SOYAD' && name !== '') {
        csvNames.add(name);
      }
    }
    
    console.log('📋 CSV Dosyasındaki Çalışan Sayısı:', csvNames.size);
    console.log('');
    console.log('❌ FAZLA OLAN ÇALIŞANLAR (Veritabanında var ama CSV de YOK):');
    console.log('='.repeat(70));
    
    const extraEmployees = [];
    dbEmployees.forEach(emp => {
      if (!csvNames.has(emp.adSoyad)) {
        extraEmployees.push(emp);
        console.log('');
        console.log('👤 İsim:', emp.adSoyad);
        console.log('   TC No:', emp.tcNo || 'Yok');
        console.log('   Telefon:', emp.cepTelefonu || 'Yok');
        console.log('   Pozisyon:', emp.pozisyon);
        console.log('   İşe Giriş:', emp.iseGirisTarihi ? new Date(emp.iseGirisTarihi).toLocaleDateString('tr-TR') : 'Yok');
      }
    });
    
    console.log('');
    console.log('='.repeat(70));
    console.log('📊 Toplam Fazla Çalışan:', extraEmployees.length);
    console.log('');
    
    if (extraEmployees.length > 0) {
      console.log('💡 Bu çalışanları silmek ister misiniz?');
      console.log('   Silmek için aşağıdaki komutu çalıştırın:');
      console.log('');
      extraEmployees.forEach((emp, idx) => {
        console.log(`   ${idx + 1}. ${emp.adSoyad} (TC: ${emp.tcNo || 'Yok'})`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Hata:', error);
    await mongoose.connection.close();
  }
}

findExtraEmployees();



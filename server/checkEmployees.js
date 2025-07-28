const mongoose = require('mongoose');
const Employee = require('./models/Employee');

async function checkEmployees() {
  try {
    await mongoose.connect('mongodb://localhost:27017/canga-vardiya');
    console.log('Veritabanına bağlandı');
    
    const employees = await Employee.find({}).limit(20);
    console.log(`Toplam ${employees.length} çalışan bulundu`);
    
    console.log('\n=== ÇALİŞAN VERİLERİ ===');
    employees.forEach((emp, index) => {
      console.log(`${index + 1}. ${emp.adSoyad}`);
      console.log(`   Yaş: ${emp.yas || 'YOK'}`);
      console.log(`   Doğum Tarihi: ${emp.dogumTarihi ? emp.dogumTarihi.toISOString().split('T')[0] : 'YOK'}`);
      console.log(`   İşe Giriş: ${emp.iseGirisTarihi ? emp.iseGirisTarihi.toISOString().split('T')[0] : 'YOK'}`);
      console.log('   ---');
    });
    
    // Problemli kayıtları bul
    const problematicEmployees = employees.filter(emp => 
      !emp.dogumTarihi || !emp.iseGirisTarihi || emp.yas === null || emp.yas === undefined
    );
    
    console.log(`\n=== PROBLEMLİ KAYITLAR (${problematicEmployees.length}) ===`);
    problematicEmployees.forEach(emp => {
      console.log(`${emp.adSoyad}:`);
      if (!emp.dogumTarihi) console.log('  - Doğum tarihi eksik');
      if (!emp.iseGirisTarihi) console.log('  - İşe giriş tarihi eksik');
      if (emp.yas === null || emp.yas === undefined) console.log('  - Yaş hesaplanamıyor');
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkEmployees();
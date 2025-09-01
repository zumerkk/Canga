const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Son 4 fazla kayıt (analiz sonucu)
const FINAL_EXTRAS = [
  'FURKAN KADİR EDEN', // FK0002 - Furkan Kadir ESEN ile duplikat
  'MEHMET KEMAL İNAÇ', // MK0005 - Mehmet Kemal İNANÇ ile duplikat  
  'MUHAMMED NAZİM GÖÇ', // MN0002 - Muhammet Nazim GÖÇ ile duplikat
  'AKŞAM' // AW0001 - Sahte kayıt
];

async function removeFinalExtras() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  
  console.log('🗑️  Son fazla kayıtları siliyorum...\n');
  
  let removed = 0;
  const before = await Employee.countDocuments({ durum: 'AKTIF' });
  
  for (const name of FINAL_EXTRAS) {
    try {
      const employee = await Employee.findOne({ 
        adSoyad: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        durum: 'AKTIF' 
      });
      
      if (employee) {
        console.log(`❌ Siliniyor: ${employee.adSoyad} (${employee.employeeId})`);
        await employee.deleteOne();
        removed++;
      } else {
        console.log(`⚠️  Bulunamadı: ${name}`);
      }
    } catch (error) {
      console.error(`❌ Hata: ${name} silinirken: ${error.message}`);
    }
  }
  
  const after = await Employee.countDocuments({ durum: 'AKTIF' });
  
  console.log('\n📊 SİLME SONUCU:');
  console.log('=' * 30);
  console.log(`📊 Öncesi: ${before} aktif`);
  console.log(`🗑️  Silinen: ${removed}`);
  console.log(`📊 Sonrası: ${after} aktif`);
  console.log(`🎯 Hedef: 102 (98 + 4)`);
  console.log(`✅ Durum: ${after === 102 ? 'HEDEF TUTTU!' : 'Hedeften farklı'}`);
  
  await mongoose.disconnect();
  return { before, removed, after, target: 102 };
}

if (require.main === module) {
  removeFinalExtras().catch(err => {
    console.error('❌ Hata:', err);
    mongoose.disconnect();
  });
}

module.exports = { removeFinalExtras };

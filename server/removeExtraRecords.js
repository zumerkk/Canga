const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Silinecek fazla kayıtlar (ID'leriyle birlikte)
const RECORDS_TO_REMOVE = [
  { id: 'FK0002', name: 'FURKAN KADİR EDEN', reason: 'Furkan Kadir ESEN ile duplikat' },
  { id: 'MK0005', name: 'MEHMET KEMAL İNAÇ', reason: 'Mehmet Kemal İNANÇ ile duplikat' },
  { id: 'MN0002', name: 'MUHAMMED NAZİM GÖÇ', reason: 'Muhammet Nazim GÖÇ ile duplikat' },
  { id: 'AW0001', name: 'AKŞAM', reason: 'Sahte kayıt' }
];

async function removeExtraRecords() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  
  console.log('🗑️  Fazla kayıtlar siliniyor...\n');
  
  let removed = 0;
  const removalReport = [];
  
  for (const record of RECORDS_TO_REMOVE) {
    try {
      // ID ile bul ve sil
      const employee = await Employee.findOne({ 
        employeeId: record.id,
        durum: 'AKTIF' 
      });
      
      if (!employee) {
        console.log(`⚠️  Bulunamadı: ${record.name} (${record.id})`);
        removalReport.push({
          ...record,
          status: 'NOT_FOUND'
        });
        continue;
      }
      
      // Kayıt bilgilerini logla
      console.log(`❌ Siliniyor: ${employee.adSoyad} (${employee.employeeId})`);
      console.log(`   📝 Sebep: ${record.reason}`);
      console.log(`   🚌 Rota: ${employee.servisGuzergahi || 'Yok'}`);
      console.log(`   🚏 Durak: ${employee.durak || 'Yok'}`);
      
      // Sil
      await employee.deleteOne();
      removed++;
      
      removalReport.push({
        ...record,
        status: 'REMOVED',
        actualName: employee.adSoyad,
        route: employee.servisGuzergahi,
        stop: employee.durak
      });
      
      console.log('   ✅ Silindi\n');
      
    } catch (error) {
      console.error(`❌ Hata: ${record.name} silinirken: ${error.message}`);
      removalReport.push({
        ...record,
        status: 'ERROR',
        error: error.message
      });
    }
  }
  
  // Final sayım
  const finalActiveCount = await Employee.countDocuments({ durum: 'AKTIF' });
  
  console.log('📊 SİLME İŞLEMİ TAMAMLANDI');
  console.log('=' * 40);
  console.log(`🗑️  Silinen kayıt: ${removed}`);
  console.log(`👥 Final aktif çalışan: ${finalActiveCount}`);
  console.log(`🎯 Hedef: 102 (98 + 4 meşru ekleme)`);
  console.log(`📊 Durum: ${finalActiveCount === 102 ? '✅ Hedef tuttu!' : '⚠️ Hedeften farklı'}`);
  
  // Rapor kaydet
  const summary = {
    timestamp: new Date().toISOString(),
    removedCount: removed,
    finalActiveCount,
    targetCount: 102,
    isOnTarget: finalActiveCount === 102,
    removalReport
  };
  
  const summaryPath = path.resolve(__dirname, 'removal_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  
  console.log(`\n📄 Silme raporu: ${summaryPath}`);
  
  await mongoose.disconnect();
  return summary;
}

if (require.main === module) {
  removeExtraRecords().catch(err => {
    console.error('❌ Genel hata:', err);
    mongoose.disconnect();
  });
}

module.exports = { removeExtraRecords };

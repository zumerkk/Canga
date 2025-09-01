const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Şüpheli kayıtları temizle
const BLACKLIST_PATTERNS = [
  /^SABAH$/i,
  /^AKSAM$/i,
  /^16-24$/i,
  /^24-08$/i,
  /^\d+$/,
  /^[A-Z]{1,3}\d{4}$/ // ID formatındaki yanlış kayıtlar
];

// Kesin düzeltmeler
const NAME_FIXES = new Map([
  ['CEVCET ÖKSÜZ', 'Cevdet ÖKSÜZ'],
  ['FURKAN KADİR EDEN', 'Furkan Kadir ESEN'],
  ['SONER ÇETİN GÜRSOY', 'Soner GÜRSOY'],
  ['DİLARA YILDIRIM', 'Dilara Berra YILDIRIM'],
  ['MEHMET KEMAL İNAÇ', 'Mehmet Kemal İNANÇ'],
  ['MUHAMMED NAZİM GÖÇ', 'Muhammet Nazim GÖÇ'],
  ['BERKAN BULANIK (BAHŞILI)', 'Berkan BULANIK']
]);

function normalizeText(str) {
  if (!str) return '';
  return str.toString()
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isBlacklisted(name) {
  return BLACKLIST_PATTERNS.some(pattern => pattern.test(name));
}

async function finalCleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  
  console.log('🧹 Final temizlik başlıyor...');
  
  // 1) Şüpheli kayıtları bul ve temizle
  const allEmployees = await Employee.find({});
  let removedSuspicious = 0;
  let fixedNames = 0;
  let deactivatedSuspicious = 0;
  
  for (const emp of allEmployees) {
    let needsUpdate = false;
    const update = {};
    
    // Kara listedeki isimleri pasifleştir
    if (isBlacklisted(emp.adSoyad)) {
      update.durum = 'PASIF';
      needsUpdate = true;
      deactivatedSuspicious++;
      console.log(`🚫 Pasifleştirilen: ${emp.adSoyad} (ID: ${emp.employeeId})`);
    }
    
    // İsim düzeltmeleri uygula
    const fixed = NAME_FIXES.get(normalizeText(emp.adSoyad));
    if (fixed && fixed !== emp.adSoyad) {
      update.adSoyad = fixed;
      needsUpdate = true;
      fixedNames++;
      console.log(`✏️  İsim düzeltme: ${emp.adSoyad} → ${fixed}`);
    }
    
    if (needsUpdate) {
      await Employee.findByIdAndUpdate(emp._id, { $set: update });
    }
  }
  
  // 2) Gerçek duplikatları bul ve birleştir
  const activeEmployees = await Employee.find({ durum: 'AKTIF' });
  const nameGroups = new Map();
  
  activeEmployees.forEach(emp => {
    const key = normalizeText(emp.adSoyad);
    if (!nameGroups.has(key)) nameGroups.set(key, []);
    nameGroups.get(key).push(emp);
  });
  
  let mergedDuplicates = 0;
  for (const [key, group] of nameGroups.entries()) {
    if (group.length <= 1) continue;
    
    // Master seçimi: TC varsa öncelik, sonra en eski kayıt
    let master = group.find(e => e.tcNo && e.tcNo.length > 5);
    if (!master) {
      master = group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
    }
    
    console.log(`🔀 Duplikat grup birleştiriliyor: ${key} (${group.length} kayıt)`);
    
    for (const emp of group) {
      if (emp._id.equals(master._id)) continue;
      
      // Eksik bilgileri master'a taşı
      const masterUpdate = {};
      if (!master.servisGuzergahi && emp.servisGuzergahi) {
        masterUpdate.servisGuzergahi = emp.servisGuzergahi;
      }
      if (!master.durak && emp.durak) {
        masterUpdate.durak = emp.durak;
      }
      if ((!master.serviceInfo || !master.serviceInfo.stopName) && emp.serviceInfo) {
        masterUpdate.serviceInfo = emp.serviceInfo;
      }
      if (!master.lokasyon && emp.lokasyon) {
        masterUpdate.lokasyon = emp.lokasyon;
      }
      if (!master.pozisyon && emp.pozisyon) {
        masterUpdate.pozisyon = emp.pozisyon;
      }
      
      if (Object.keys(masterUpdate).length > 0) {
        await Employee.findByIdAndUpdate(master._id, { $set: masterUpdate });
      }
      
      // Duplikat kaydı sil
      await emp.deleteOne();
      mergedDuplicates++;
      console.log(`   ❌ Silinen duplikat: ${emp.adSoyad} (ID: ${emp.employeeId})`);
    }
  }
  
  // 3) Final istatistikler
  const finalCount = await Employee.countDocuments({ durum: 'AKTIF' });
  
  const summary = {
    timestamp: new Date().toISOString(),
    actions: {
      deactivatedSuspicious,
      fixedNames,
      mergedDuplicates,
      removedSuspicious
    },
    finalActiveCount: finalCount
  };
  
  fs.writeFileSync(path.resolve(__dirname, 'final_cleanup_summary.json'), JSON.stringify(summary, null, 2));
  
  console.log('\n📊 FİNAL TEMİZLİK ÖZET:');
  console.log('=' * 40);
  console.log(`🚫 Pasifleştirilen şüpheli: ${deactivatedSuspicious}`);
  console.log(`✏️  Düzeltilen isim: ${fixedNames}`);
  console.log(`🔀 Birleştirilen duplikat: ${mergedDuplicates}`);
  console.log(`👥 Final aktif çalışan: ${finalCount}`);
  
  await mongoose.disconnect();
  return summary;
}

if (require.main === module) {
  finalCleanup().catch(err => {
    console.error('❌ Hata:', err);
    mongoose.disconnect();
  });
}

module.exports = { finalCleanup };

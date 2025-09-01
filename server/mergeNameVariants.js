const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

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

// Kesin eşleştirmeler - aynı kişinin farklı yazımları
const VARIANT_GROUPS = [
  // Grup 1: Dilara varyantları
  ['DİLARA YILDIRIM', 'DILARA BERRA YILDIRIM', 'Dilara Berra YILDIRIM'],
  
  // Grup 2: Furkan varyantları  
  ['FURKAN KADİR EDEN', 'FURKAN KADIR ESEN', 'Furkan Kadir ESEN'],
  
  // Grup 3: Soner varyantları
  ['SONER ÇETİN GÜRSOY', 'SONER GÜRSOY', 'Soner GÜRSOY'],
  
  // Grup 4: Mehmet Kemal varyantları
  ['MEHMET KEMAL İNAÇ', 'MEHMET KEMAL INANÇ', 'Mehmet Kemal İNANÇ'],
  
  // Grup 5: Nazim varyantları
  ['MUHAMMED NAZİM GÖÇ', 'MUHAMMET NAZIM GÖÇ', 'Muhammet Nazim GÖÇ'],
  
  // Grup 6: Cevdet varyantları
  ['CEVCET ÖKSÜZ', 'CEVDET ÖKSÜZ', 'Cevdet ÖKSÜZ'],
  
  // Grup 7: Berkan varyantları
  ['BERKAN BULANIK (BAHŞILI)', 'BERKAN BULANIK', 'Berkan BULANIK']
];

async function findAndMergeVariants() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  
  console.log('🔍 İsim varyantları tespit ediliyor ve birleştiriliyor...\n');
  
  let totalMerged = 0;
  const mergeReport = [];
  
  for (const variants of VARIANT_GROUPS) {
    console.log(`📝 Grup analiz ediliyor: ${variants.join(' / ')}`);
    
    // Bu gruptaki tüm varyantları bul
    const foundEmployees = [];
    for (const variant of variants) {
      const employees = await Employee.find({
        adSoyad: { $regex: new RegExp(`^${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        durum: 'AKTIF'
      });
      foundEmployees.push(...employees);
    }
    
    if (foundEmployees.length <= 1) {
      console.log(`   ℹ️  Bu grup için ${foundEmployees.length} kayıt bulundu - birleştirme gerekmez\n`);
      continue;
    }
    
    // Normalize edilmiş isme göre grupla (aynı kişinin farklı yazımları)
    const normalizedGroups = new Map();
    foundEmployees.forEach(emp => {
      const baseKey = normalizeText(emp.adSoyad)
        .replace(/DILARA.*YILDIRIM/, 'DILARA_YILDIRIM')
        .replace(/FURKAN.*KADIR.*E[SN]EN/, 'FURKAN_KADIR')
        .replace(/SONER.*GUR?SOY/, 'SONER_GURSOY')
        .replace(/MEHMET.*KEMAL.*INA[NÇ]C?/, 'MEHMET_KEMAL')
        .replace(/MU?HAMM?ED.*NAZIM.*GOC/, 'NAZIM_GOC')
        .replace(/CEV[CD]ET.*OKSUZ/, 'CEVDET_OKSUZ')
        .replace(/BERKAN.*BULANIK/, 'BERKAN_BULANIK');
      
      if (!normalizedGroups.has(baseKey)) normalizedGroups.set(baseKey, []);
      normalizedGroups.get(baseKey).push(emp);
    });
    
    // Her normalize grup için birleştirme yap
    for (const [baseKey, group] of normalizedGroups.entries()) {
      if (group.length <= 1) continue;
      
      console.log(`   🔀 ${group.length} varyant birleştiriliyor:`);
      group.forEach(emp => {
        console.log(`      - ${emp.adSoyad} (${emp.employeeId})`);
      });
      
      // Master seçimi: TC varsa öncelik, sonra en detaylı kayıt, sonra en eski
      let master = group.find(e => e.tcNo && e.tcNo.length > 5);
      if (!master) {
        master = group.sort((a, b) => {
          const aScore = (a.cepTelefonu ? 1 : 0) + (a.dogumTarihi ? 1 : 0) + (a.iseGirisTarihi ? 1 : 0);
          const bScore = (b.cepTelefonu ? 1 : 0) + (b.dogumTarihi ? 1 : 0) + (b.iseGirisTarihi ? 1 : 0);
          if (aScore !== bScore) return bScore - aScore; // En detaylı
          return new Date(a.createdAt) - new Date(b.createdAt); // En eski
        })[0];
      }
      
      // En iyi isim formatını seç (Proper Case varsa öncelik)
      const bestName = group
        .map(e => e.adSoyad)
        .sort((a, b) => {
          const aProper = /^[A-ZÇĞIÖŞÜ][a-zçğıöşü]/.test(a);
          const bProper = /^[A-ZÇĞIÖŞÜ][a-zçğıöşü]/.test(b);
          if (aProper && !bProper) return -1;
          if (!aProper && bProper) return 1;
          return a.length - b.length; // Kısa olan
        })[0];
      
      console.log(`   ✅ Master: ${master.adSoyad} → ${bestName}`);
      
      // Master'ı güncelle
      const masterUpdate = { adSoyad: bestName };
      
      // Diğer kayıtlardan eksik bilgileri topla
      for (const emp of group) {
        if (emp._id.equals(master._id)) continue;
        
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
        if (!master.cepTelefonu && emp.cepTelefonu) {
          masterUpdate.cepTelefonu = emp.cepTelefonu;
        }
        if (!master.tcNo && emp.tcNo) {
          masterUpdate.tcNo = emp.tcNo;
        }
        if (!master.dogumTarihi && emp.dogumTarihi) {
          masterUpdate.dogumTarihi = emp.dogumTarihi;
        }
        if (!master.iseGirisTarihi && emp.iseGirisTarihi) {
          masterUpdate.iseGirisTarihi = emp.iseGirisTarihi;
        }
        
        // Duplikat kaydı sil
        await emp.deleteOne();
        totalMerged++;
        console.log(`      ❌ Silinen: ${emp.adSoyad} (${emp.employeeId})`);
      }
      
      // Master'ı güncelle
      await Employee.findByIdAndUpdate(master._id, { $set: masterUpdate });
      
      mergeReport.push({
        group: variants,
        masterName: bestName,
        masterId: master.employeeId,
        mergedCount: group.length - 1
      });
    }
    
    console.log('');
  }
  
  // Genel duplikat tarama (normalize sonrası aynı olan kayıtlar)
  console.log('🔍 Genel duplikat tarama yapılıyor...');
  const allActive = await Employee.find({ durum: 'AKTIF' });
  const nameMap = new Map();
  
  allActive.forEach(emp => {
    const key = normalizeText(emp.adSoyad);
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key).push(emp);
  });
  
  let generalMerged = 0;
  for (const [key, group] of nameMap.entries()) {
    if (group.length <= 1) continue;
    
    console.log(`🔀 Genel duplikat: ${key} (${group.length} kayıt)`);
    
    // TC varsa öncelik, sonra en detaylı
    let master = group.find(e => e.tcNo && e.tcNo.length > 5);
    if (!master) {
      master = group.sort((a, b) => {
        const aDetails = [a.cepTelefonu, a.dogumTarihi, a.iseGirisTarihi].filter(Boolean).length;
        const bDetails = [b.cepTelefonu, b.dogumTarihi, b.iseGirisTarihi].filter(Boolean).length;
        if (aDetails !== bDetails) return bDetails - aDetails;
        return new Date(a.createdAt) - new Date(b.createdAt);
      })[0];
    }
    
    for (const emp of group) {
      if (emp._id.equals(master._id)) continue;
      
      // Eksik bilgileri master'a aktar
      const update = {};
      if (!master.servisGuzergahi && emp.servisGuzergahi) update.servisGuzergahi = emp.servisGuzergahi;
      if (!master.durak && emp.durak) update.durak = emp.durak;
      if ((!master.serviceInfo || !master.serviceInfo.stopName) && emp.serviceInfo) update.serviceInfo = emp.serviceInfo;
      if (!master.lokasyon && emp.lokasyon) update.lokasyon = emp.lokasyon;
      if (!master.pozisyon && emp.pozisyon) update.pozisyon = emp.pozisyon;
      
      if (Object.keys(update).length > 0) {
        await Employee.findByIdAndUpdate(master._id, { $set: update });
      }
      
      await emp.deleteOne();
      generalMerged++;
      console.log(`   ❌ ${emp.adSoyad} (${emp.employeeId}) silindi`);
    }
  }
  
  const finalCount = await Employee.countDocuments({ durum: 'AKTIF' });
  
  console.log('\n📊 BİRLEŞTİRME ÖZET:');
  console.log('=' * 40);
  console.log(`🔀 Varyant grupları birleştirildi: ${mergeReport.length}`);
  console.log(`🔀 Genel duplikat birleştirildi: ${generalMerged}`);
  console.log(`👥 Final aktif çalışan sayısı: ${finalCount}`);
  
  await mongoose.disconnect();
  
  return {
    variantGroups: mergeReport.length,
    generalMerged,
    finalCount
  };
}

if (require.main === module) {
  findAndMergeVariants().catch(err => {
    console.error('❌ Hata:', err);
    mongoose.disconnect();
  });
}

module.exports = { findAndMergeVariants };

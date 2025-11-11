const mongoose = require('mongoose');
const Employee = require('./server/models/Employee');
const fs = require('fs');
require('dotenv').config();

// CSV verilerini parse et
const csvContent = fs.readFileSync('İŞTEN AYRILANLAR-Tablo 1.csv', 'utf8');
const lines = csvContent.split('\n');

const formerEmployees = [];
for (let i = 2; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line === ';;;;;;;;;;') continue;
  
  const cols = line.split(';');
  if (cols.length < 7) continue;
  
  const sira = cols[0];
  const ayrilmaTarihi = cols[1];
  const adSoyad = cols[2];
  const tcNo = cols[3];
  const telefon = cols[4];
  const dogumTarihi = cols[5];
  const iseGirisTarihi = cols[6];
  
  // Boş satırları atla
  if (!adSoyad || !tcNo || adSoyad.trim() === '' || tcNo.trim() === '') continue;
  
  // TC geçerli mi kontrol et (11 haneli sayı olmalı)
  if (!/^\d{11}$/.test(tcNo.trim())) continue;
  
  formerEmployees.push({
    sira: parseInt(sira) || 0,
    ayrilmaTarihi,
    adSoyad: adSoyad.trim(),
    tcNo: tcNo.trim(),
    telefon: telefon.trim(),
    dogumTarihi,
    iseGirisTarihi
  });
}

console.log("CSV'den " + formerEmployees.length + " gerçek işten ayrılan çalışan bulundu\n");

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Mevcut işten ayrılanları say
  const currentCount = await Employee.countDocuments({ durum: { $in: ['PASIF', 'AYRILDI'] } });
  console.log("MongoDB'de şu anda " + currentCount + " işten ayrılan kayıt var\n");
  
  // Tüm işten ayrılanları çek
  const allFormer = await Employee.find({ durum: { $in: ['PASIF', 'AYRILDI'] } })
    .select('employeeId adSoyad tcNo durum ayrilmaTarihi')
    .lean();
  
  // CSV'deki TC'leri al
  const csvTCSet = new Set(formerEmployees.map(emp => emp.tcNo));
  
  console.log('Temizlik Analizi:\n');
  
  const toDelete = [];
  for (const emp of allFormer) {
    // Bozuk kayıtları tespit et
    const isBroken = !emp.tcNo || !/^\d{11}$/.test(emp.tcNo);
    const notInCSV = emp.tcNo && !csvTCSet.has(emp.tcNo);
    
    if (isBroken || notInCSV) {
      toDelete.push(emp._id);
      console.log("  Silinecek: " + emp.adSoyad + " (TC: " + (emp.tcNo || 'YOK') + ") - Sebep: " + (isBroken ? 'Bozuk kayıt' : 'CSV listesinde yok'));
    }
  }
  
  console.log("\nToplam " + toDelete.length + " kayıt silinecek\n");
  
  // Toplu silme
  if (toDelete.length > 0) {
    const deleteResult = await Employee.deleteMany({ _id: { $in: toDelete } });
    console.log(deleteResult.deletedCount + " kayıt başarıyla silindi\n");
  }
  
  // CSV'deki kayıtları güncelle/ekle
  let updatedCount = 0;
  let addedCount = 0;
  
  const parseDateDMY = (dateStr) => {
    if (!dateStr || dateStr.trim() === '') return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [month, day, year] = parts.map(p => parseInt(p));
    if (!month || !day || !year) return null;
    const fullYear = year < 100 ? 1900 + year : year;
    return new Date(fullYear + "-" + String(month).padStart(2, '0') + "-" + String(day).padStart(2, '0'));
  };
  
  for (const csvEmp of formerEmployees) {
    const existing = await Employee.findOne({ tcNo: csvEmp.tcNo });
    
    if (existing) {
      // Mevcut kaydı güncelle
      existing.adSoyad = csvEmp.adSoyad;
      existing.cepTelefonu = csvEmp.telefon;
      existing.dogumTarihi = parseDateDMY(csvEmp.dogumTarihi);
      existing.iseGirisTarihi = parseDateDMY(csvEmp.iseGirisTarihi);
      existing.ayrilmaTarihi = parseDateDMY(csvEmp.ayrilmaTarihi) || new Date();
      existing.durum = 'AYRILDI';
      existing.ayrilmaSebebi = 'İşten ayrılma';
      
      await existing.save();
      updatedCount++;
    } else {
      // Yeni kayıt ekle
      const nameParts = csvEmp.adSoyad.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      const newEmp = new Employee({
        firstName,
        lastName,
        adSoyad: csvEmp.adSoyad,
        tcNo: csvEmp.tcNo,
        cepTelefonu: csvEmp.telefon,
        dogumTarihi: parseDateDMY(csvEmp.dogumTarihi),
        iseGirisTarihi: parseDateDMY(csvEmp.iseGirisTarihi),
        ayrilmaTarihi: parseDateDMY(csvEmp.ayrilmaTarihi) || new Date(),
        durum: 'AYRILDI',
        ayrilmaSebebi: 'İşten ayrılma',
        departman: 'Bilinmiyor',
        pozisyon: 'Bilinmiyor',
        lokasyon: 'MERKEZ'
      });
      
      await newEmp.save();
      addedCount++;
    }
  }
  
  console.log('\nSONUÇ:');
  console.log('  Güncellenen: ' + updatedCount);
  console.log('  Eklenen: ' + addedCount);
  console.log('  Silinen: ' + toDelete.length);
  
  const finalCount = await Employee.countDocuments({ durum: { $in: ['PASIF', 'AYRILDI'] } });
  console.log('\nİŞLEM TAMAMLANDI!');
  console.log("  CSV'de: " + formerEmployees.length);
  console.log("  MongoDB'de: " + finalCount);
  
  await mongoose.disconnect();
  process.exit(0);
})();

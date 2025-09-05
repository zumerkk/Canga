const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Employee = require('./models/Employee');
require('dotenv').config();

// 📊 CSV dosyasını parse et (semicolon separated)
function parseCSV(csvPath) {
  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      console.log('❌ CSV dosyası çok kısa');
      return [];
    }
    
    // İlk satır başlık
    const headers = lines[0].split(';').map(h => h.trim());
    console.log('📋 CSV başlıkları:', headers);
    
    const employees = [];
    
    // Her satırı işle
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim());
      
      if (values.length >= headers.length) {
        const employee = {};
        headers.forEach((header, index) => {
          employee[header] = values[index] || '';
        });
        employees.push(employee);
      }
    }
    
    return employees;
  } catch (error) {
    console.error('❌ CSV parse hatası:', error.message);
    return [];
  }
}

// 📅 Tarih parse et
function parseDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  
  try {
    // DD.MM.YYYY formatı
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JS ayları 0-11
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    
    return new Date(dateStr);
  } catch (error) {
    return null;
  }
}

// 📍 Lokasyon normalize et
function normalizeLokasyon(lokasyon) {
  if (!lokasyon) return 'MERKEZ';
  
  const l = lokasyon.toString().toUpperCase().trim();
  
  if (l.includes('İŞIL') || l.includes('IŞIL')) return 'İŞIL';
  if (l.includes('İŞL') || l.includes('ISL')) return 'İŞL';
  if (l.includes('OSB')) return 'OSB';
  if (l.includes('MERKEZ')) return 'MERKEZ';
  
  return 'MERKEZ'; // Varsayılan
}

// 📊 Durum normalize et  
function normalizeDurum(durum) {
  if (!durum) return 'AKTIF';
  
  const d = durum.toString().toUpperCase().trim();
  
  if (d === 'AKTIF' || d === 'AKTİF' || d.includes('AKT')) return 'AKTIF';
  if (d === 'PASIF' || d === 'PASİF' || d.includes('PAS')) return 'PASIF';
  if (d === 'İZİNLİ' || d === 'IZINLI' || d.includes('İZİN')) return 'İZİNLİ';
  if (d === 'AYRILDI' || d.includes('AYRIL')) return 'AYRILDI';
  
  return 'AKTIF'; // Varsayılan
}

// 🚀 Ana import fonksiyonu
async function importCleanCSV() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
    console.log('✅ MongoDB bağlantısı başarılı');
    
    // CSV dosyasını oku
    const csvPath = path.join(__dirname, '..', 'Canga_Calisanlar_CLEAN.csv');
    console.log('📂 CSV dosyası okunuyor:', csvPath);
    
    const csvEmployees = parseCSV(csvPath);
    console.log(`📊 CSV'den ${csvEmployees.length} çalışan okundu`);
    
    if (csvEmployees.length === 0) {
      console.log('❌ Hiç çalışan verisi bulunamadı');
      return;
    }
    
    // Mevcut çalışanları temizle
    console.log('🗑️ Mevcut çalışan verileri temizleniyor...');
    const deleteResult = await Employee.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} mevcut kayıt silindi`);
    
    let basarili = 0;
    let hatali = 0;
    const hatalar = [];
    
    // Her çalışanı import et
    for (let i = 0; i < csvEmployees.length; i++) {
      const csvEmp = csvEmployees[i];
      
      try {
        // CSV başlık yapısına göre mapla
        const employeeData = {
          employeeId: csvEmp['Çalışan ID'] || undefined,
          adSoyad: csvEmp['Ad Soyad'] || '',
          tcNo: csvEmp['TC No'] || undefined,
          cepTelefonu: csvEmp['Cep Telefonu'] || '',
          dogumTarihi: parseDate(csvEmp['Doğum Tarihi']),
          departman: csvEmp['Departman'] || '',
          pozisyon: csvEmp['Pozisyon'] || 'ÇALIŞAN',
          lokasyon: normalizeLokasyon(csvEmp['Lokasyon']),
          iseGirisTarihi: parseDate(csvEmp['İşe Giriş Tarihi']),
          durum: normalizeDurum(csvEmp['Durum']),
          servisGuzergahi: csvEmp['Servis Güzergahı'] || '',
          durak: csvEmp['Durak'] || ''
        };
        
        // Zorunlu alanları kontrol et
        if (!employeeData.adSoyad || employeeData.adSoyad.trim() === '') {
          console.log(`⚠️ Satır ${i + 1}: Ad-Soyad eksik, atlanıyor`);
          hatali++;
          continue;
        }
        
        if (!employeeData.pozisyon || employeeData.pozisyon.trim() === '') {
          employeeData.pozisyon = 'ÇALIŞAN'; // Varsayılan
        }
        
        // TC No boşsa kaldır (unique constraint hatası olmasın)
        if (!employeeData.tcNo || employeeData.tcNo.trim() === '') {
          delete employeeData.tcNo;
        }
        
        // Employee ID boşsa kaldır (otomatik oluşturulsun)
        if (!employeeData.employeeId || employeeData.employeeId.trim() === '') {
          delete employeeData.employeeId;
        }
        
        // Yeni çalışan oluştur
        const employee = new Employee(employeeData);
        await employee.save();
        
        basarili++;
        console.log(`✅ ${basarili}. ${employeeData.adSoyad} - ${employee.employeeId} - ${employeeData.durum}`);
        
      } catch (error) {
        hatali++;
        const errorMsg = `Satır ${i + 1} (${csvEmp['Ad Soyad']}): ${error.message}`;
        hatalar.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    // Rapor
    console.log('\n📊 İMPORT RAPORU:');
    console.log(`✅ Başarılı: ${basarili} çalışan`);
    console.log(`❌ Hatalı: ${hatali} çalışan`);
    console.log(`📋 Toplam işlenen: ${csvEmployees.length} çalışan`);
    
    if (hatalar.length > 0) {
      console.log('\n❌ HATALAR:');
      hatalar.forEach(hata => console.log(`  - ${hata}`));
    }
    
    // Aktif çalışan sayısını kontrol et
    const aktifSayisi = await Employee.countDocuments({ durum: 'AKTIF' });
    console.log(`\n👥 Veritabanındaki aktif çalışan sayısı: ${aktifSayisi}`);
    
    // Durum dağılımı
    const durumDagilimi = await Employee.aggregate([
      { $group: { _id: '$durum', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Durum dağılımı:');
    durumDagilimi.forEach(item => {
      console.log(`  ${item._id}: ${item.count} kişi`);
    });
    
  } catch (error) {
    console.error('❌ Import işlemi hatası:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB bağlantısı kapatıldı');
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  console.log('🚀 Çalışan verilerini CSV\'den import etme başlıyor...');
  importCleanCSV()
    .then(() => {
      console.log('\n🎉 Import işlemi tamamlandı!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal hata:', error);
      process.exit(1);
    });
}

module.exports = { importCleanCSV };

const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');
require('dotenv').config();

// Tarih dönüştürme fonksiyonu
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // MM/DD/YY formatını kontrol et
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let month = parseInt(parts[0], 10);
      let day = parseInt(parts[1], 10); 
      let year = parseInt(parts[2], 10);
      
      // 2 haneli yıl kontrolü
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }
  }
  
  // 01.01.1956 formatını kontrol et  
  if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      
      // 2 haneli yıl kontrolü
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month - 1, day);
      }
    }
  }
  
  return null;
}

// Telefon numarası temizleme
function cleanPhoneNumber(phone) {
  if (!phone || phone === 'kullanmıyor') return '';
  // Sadece rakamları al
  return phone.replace(/[^\d]/g, '').replace(/^0/, '');
}

// Lokasyon/Departman düzeltme
function fixLocation(location) {
  const locationMap = {
    'İŞL': 'İŞIL',
    'İŞİL ŞUBE': 'İŞIL',
    'IŞIL ŞUBE': 'İŞIL',
    'OSMANGAZİ': 'OSB',
    'KARŞIYAKA': 'OSB',
    'OSMANGAZİ-KARŞIYAKA': 'OSB'
  };
  
  return locationMap[location?.toUpperCase()] || location || 'MERKEZ';
}

async function main() {
  try {
    // MongoDB'ye bağlan
    console.log('🔄 MongoDB bağlantısı kuruluyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');
    
    // Mevcut veriyi temizle
    console.log('🗑️ Mevcut veriler temizleniyor...');
    await Employee.deleteMany({});
    console.log('✅ Mevcut veriler temizlendi\n');
    
    // 1. AKTİF ÇALIŞANLARI İMPORT ET
    console.log('📥 Aktif çalışanlar import ediliyor...');
    const activeEmployees = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../GENEL LİSTE-Tablo 1.csv'))
        .pipe(csv({
          separator: ';',
          headers: false
        }))
        .on('data', (row) => {
          // İlk 11 satır header, 12. satırdan itibaren veri
          // row[2]: AD-SOYAD, row[3]: TC, row[4]: CEP, row[5]: DOĞUM, row[6]: İŞE GİRİŞ, row[7]: GÖREV, row[8]: SERVİS
          
          if (!row[2] || row[2].trim() === '' || row[2] === 'AD - SOYAD') return;
          
          const nameParts = row[2].split(' ');
          let firstName = nameParts[0];
          let lastName = nameParts.slice(1).join(' ');
          
          const employee = {
            adSoyad: row[2].trim(),
            firstName: firstName,
            lastName: lastName,
            tcNo: row[3]?.trim() || '',
            cepTelefonu: cleanPhoneNumber(row[4]),
            dogumTarihi: parseDate(row[5]),
            iseGirisTarihi: parseDate(row[6]),
            pozisyon: row[7]?.trim() || '',
            servisGuzergahi: row[8]?.trim() || '',
            durak: row[8]?.trim() || '',
            lokasyon: 'MERKEZ',
            departman: row[7]?.trim() || '',
            durum: 'AKTIF',
            kendiAraci: row[8]?.toLowerCase().includes('kendi aracı') || false,
            employeeId: firstName.substring(0, 1) + lastName.substring(0, 1) + Math.floor(Math.random() * 10000)
          };
          
          // Lokasyonu pozisyona göre belirle
          if (employee.pozisyon?.toLowerCase().includes('ışıl') || 
              employee.pozisyon?.toLowerCase().includes('işil')) {
            employee.lokasyon = 'İŞIL';
          } else if (employee.servisGuzergahi?.toLowerCase().includes('osmangazi') ||
                     employee.servisGuzergahi?.toLowerCase().includes('karşıyaka')) {
            employee.lokasyon = 'OSB';
          } else if (employee.servisGuzergahi?.toLowerCase().includes('sanayi')) {
            employee.lokasyon = 'İŞL';
          }
          
          if (employee.adSoyad && employee.adSoyad !== '') {
            activeEmployees.push(employee);
          }
        })
        .on('end', () => {
          console.log(`✅ ${activeEmployees.length} aktif çalışan okundu`);
          resolve();
        })
        .on('error', reject);
    });
    
    // 2. İŞTEN AYRILANLARI İMPORT ET
    console.log('\n📥 İşten ayrılanlar import ediliyor...');
    const formerEmployees = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../İŞTEN AYRILANLAR-Tablo 1.csv'))
        .pipe(csv({
          separator: ';',
          headers: false
        }))
        .on('data', (row) => {
          // row[1]: Ayrılış Tarihi, row[2]: AD-SOYAD, row[3]: TC, row[4]: TEL
          // row[5]: DOĞUM, row[6]: İŞE GİRİŞ
          
          if (!row[2] || row[2].trim() === '' || row[2] === 'AD SOY AD') return;
          
          const nameParts = row[2].split(' ');
          let firstName = nameParts[0];
          let lastName = nameParts.slice(1).join(' ');
          
          const employee = {
            adSoyad: row[2].trim(),
            firstName: firstName,
            lastName: lastName,
            tcNo: row[3]?.trim() || '',
            cepTelefonu: cleanPhoneNumber(row[4]),
            dogumTarihi: parseDate(row[5]),
            iseGirisTarihi: parseDate(row[6]),
            ayrilmaTarihi: parseDate(row[1]),
            lokasyon: 'MERKEZ',
            pozisyon: 'Eski Çalışan', // Varsayılan pozisyon
            durum: 'PASIF',
            ayrilmaNedeni: 'İstifa/İşten Çıkarma',
            employeeId: firstName.substring(0, 1) + lastName.substring(0, 1) + Math.floor(Math.random() * 10000)
          };
          
          if (employee.adSoyad && employee.adSoyad !== '') {
            formerEmployees.push(employee);
          }
        })
        .on('end', () => {
          console.log(`✅ ${formerEmployees.length} işten ayrılan okundu`);
          resolve();
        })
        .on('error', reject);
    });
    
    // 3. VERİLERİ KAYDET
    console.log('\n💾 Veriler veritabanına kaydediliyor...');
    
    // Aktif çalışanları kaydet
    if (activeEmployees.length > 0) {
      const savedActive = await Employee.insertMany(activeEmployees);
      console.log(`✅ ${savedActive.length} aktif çalışan kaydedildi`);
    }
    
    // İşten ayrılanları kaydet
    if (formerEmployees.length > 0) {
      const savedFormer = await Employee.insertMany(formerEmployees);
      console.log(`✅ ${savedFormer.length} işten ayrılan kaydedildi`);
    }
    
    // 4. ÖZET RAPOR
    console.log('\n📊 ÖZET RAPOR:');
    console.log('================');
    const totalActive = await Employee.countDocuments({ durum: 'AKTIF' });
    const totalFormer = await Employee.countDocuments({ durum: 'PASIF' });
    
    console.log(`✅ Toplam Aktif Çalışan: ${totalActive}`);
    console.log(`✅ Toplam İşten Ayrılan: ${totalFormer}`);
    console.log(`✅ Toplam Çalışan: ${totalActive + totalFormer}`);
    
    // Lokasyon dağılımı
    const locationStats = await Employee.aggregate([
      { $match: { durum: 'AKTIF' } },
      { $group: { _id: '$lokasyon', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📍 Aktif Çalışan Lokasyon Dağılımı:');
    locationStats.forEach(stat => {
      console.log(`   ${stat._id || 'Belirsiz'}: ${stat.count} kişi`);
    });
    
    console.log('\n✅ TÜM VERİLER BAŞARIYLA İMPORT EDİLDİ!');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

main();

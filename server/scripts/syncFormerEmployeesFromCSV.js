/**
 * 📊 İŞTEN AYRILANLAR CSV'den MongoDB'ye 157 Eski Çalışan Senkronizasyonu
 * Bu script CSV dosyasındaki tüm işten ayrılanları MongoDB'ye aktarır
 * Son güncelleme: Aralık 2025 - 157 işten ayrılan
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga';

// Employee Schema
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  adSoyad: { type: String, required: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  tcNo: { type: String, trim: true, unique: true, sparse: true },
  cepTelefonu: { type: String, trim: true },
  dogumTarihi: { type: Date },
  iseGirisTarihi: { type: Date },
  ayrilmaTarihi: { type: Date },
  ayrilmaSebebi: { type: String, trim: true },
  pozisyon: { type: String, required: true, trim: true },
  departman: { type: String, trim: true },
  lokasyon: { type: String, required: true, enum: ['MERKEZ', 'İŞIL', 'OSB'] },
  servisGuzergahi: { type: String, trim: true },
  durak: { type: String, trim: true },
  adres: { type: String, trim: true },
  durum: { type: String, required: true, enum: ['AKTIF', 'PASIF', 'İZİNLİ', 'AYRILDI'], default: 'AKTIF' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Employee = mongoose.model('Employee', employeeSchema);

// 📅 Tarih parse fonksiyonu
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  dateStr = dateStr.trim();
  
  // Format: M/D/YY veya MM/DD/YY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let [month, day, year] = parts.map(p => parseInt(p, 10));
      
      // 2 haneli yılı 4 haneli yıla çevir
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      return new Date(year, month - 1, day);
    }
  }
  
  // Format: DD.MM.YYYY
  if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      let [day, month, year] = parts.map(p => parseInt(p, 10));
      
      // 2 haneli yılı 4 haneli yıla çevir
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      
      return new Date(year, month - 1, day);
    }
  }
  
  return null;
}

// 📱 Telefon numarası temizleme
function cleanPhone(phone) {
  if (!phone || phone === '') return '';
  return phone.replace(/\s+/g, ' ').trim();
}

// 🆔 Employee ID oluşturma
function generateEmployeeId(adSoyad, index) {
  const parts = adSoyad.trim().split(' ');
  const firstInitial = parts[0]?.charAt(0)?.toUpperCase() || 'X';
  const lastInitial = parts[parts.length - 1]?.charAt(0)?.toUpperCase() || 'X';
  const number = (index + 1).toString().padStart(4, '0');
  return `${firstInitial}${lastInitial}${number}-ESKİ`;
}

// 📊 CSV'yi parse et
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const employees = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Noktalı virgül ile ayır
    const parts = line.split(';');
    
    // CSV yapısı: sıra_no; ayrılma_tarihi; ad_soyad; tc_no; telefon; doğum_tarihi; işe_giriş_tarihi; adres; ...
    const siraNo = parts[0]?.trim();
    const ayrilmaTarihi = parts[1]?.trim();
    const adSoyad = parts[2]?.trim();
    const tcNo = parts[3]?.trim();
    const telefon = parts[4]?.trim();
    const dogumTarihi = parts[5]?.trim();
    const iseGirisTarihi = parts[6]?.trim();
    const adres = parts[7]?.trim();
    
    if (!adSoyad) {
      console.log(`⚠️ Satır ${i + 1} atlandı - eksik ad: ${line}`);
      continue;
    }
    
    const nameParts = adSoyad.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    employees.push({
      siraNo: parseInt(siraNo) || (i + 1),
      adSoyad,
      firstName,
      lastName,
      tcNo: tcNo || '',
      cepTelefonu: cleanPhone(telefon),
      dogumTarihi: parseDate(dogumTarihi),
      iseGirisTarihi: parseDate(iseGirisTarihi),
      ayrilmaTarihi: parseDate(ayrilmaTarihi),
      adres: adres || ''
    });
  }
  
  return employees;
}

// 🚀 Ana fonksiyon
async function syncFormerEmployees() {
  try {
    console.log('🔗 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
    
    // CSV dosyasını oku - güncellenmiş yol (pers klasörü)
    const csvPath = path.join(__dirname, '../../pers/İŞTEN AYRILANLAR-Tablo 1.csv');
    console.log(`📂 CSV dosyası okunuyor: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV dosyası bulunamadı: ${csvPath}`);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const formerEmployees = parseCSV(csvContent);
    
    console.log(`📊 CSV'den ${formerEmployees.length} işten ayrılan parse edildi`);
    
    // Mevcut PASIF/AYRILDI durumundaki çalışanları sil
    console.log('🗑️ Mevcut işten ayrılanlar siliniyor...');
    const deleteResult = await Employee.deleteMany({ durum: { $in: ['PASIF', 'AYRILDI'] } });
    console.log(`✅ ${deleteResult.deletedCount} mevcut işten ayrılan silindi`);
    
    // Yeni işten ayrılanları ekle
    console.log('📝 İşten ayrılanlar ekleniyor...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < formerEmployees.length; i++) {
      const emp = formerEmployees[i];
      
      try {
        // TC No ile mevcut kayıt kontrolü
        if (emp.tcNo) {
          const existingByTC = await Employee.findOne({ tcNo: emp.tcNo });
          if (existingByTC) {
            // Aktif çalışan mı kontrol et
            if (existingByTC.durum === 'AKTIF') {
              console.log(`⏭️ [${i + 1}/${formerEmployees.length}] ${emp.adSoyad} - Aktif çalışan olarak mevcut, atlandı`);
              successCount++; // Zaten sistemde var, başarılı say
              continue;
            } else {
              // Mükerrer işten ayrılan, atla
              console.log(`⏭️ [${i + 1}/${formerEmployees.length}] ${emp.adSoyad} - Mükerrer kayıt, atlandı`);
              successCount++;
              continue;
            }
          }
        }
        
        const employeeData = {
          employeeId: generateEmployeeId(emp.adSoyad, i),
          adSoyad: emp.adSoyad,
          firstName: emp.firstName,
          lastName: emp.lastName,
          tcNo: emp.tcNo || undefined,
          cepTelefonu: emp.cepTelefonu,
          dogumTarihi: emp.dogumTarihi,
          iseGirisTarihi: emp.iseGirisTarihi,
          ayrilmaTarihi: emp.ayrilmaTarihi,
          pozisyon: 'Eski Çalışan', // CSV'de pozisyon yok
          departman: 'ESKİ ÇALIŞANLAR',
          lokasyon: 'MERKEZ',
          durum: 'AYRILDI',
          ayrilmaSebebi: 'İşten ayrıldı',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // TC No boşsa undefined yap
        if (!employeeData.tcNo || employeeData.tcNo === '') {
          delete employeeData.tcNo;
        }
        
        const newEmployee = new Employee(employeeData);
        await newEmployee.save();
        
        successCount++;
        if (successCount <= 10 || successCount % 25 === 0) {
          console.log(`✅ [${i + 1}/${formerEmployees.length}] ${emp.adSoyad} eklendi`);
        }
        
      } catch (error) {
        errorCount++;
        errors.push({ employee: emp.adSoyad, error: error.message });
        console.error(`❌ [${i + 1}/${formerEmployees.length}] ${emp.adSoyad} eklenemedi: ${error.message}`);
      }
    }
    
    // Sonuç özeti
    console.log('\n' + '='.repeat(60));
    console.log('📊 SENKRONIZASYON SONUCU');
    console.log('='.repeat(60));
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    console.log(`📋 Toplam: ${formerEmployees.length}`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n⚠️ Hata Detayları:');
      errors.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.employee}: ${e.error}`);
      });
    }
    
    // Veritabanındaki durumu kontrol et
    const formerCount = await Employee.countDocuments({ durum: { $in: ['PASIF', 'AYRILDI'] } });
    const activeCount = await Employee.countDocuments({ durum: 'AKTIF' });
    
    console.log(`\n📈 Veritabanı Durumu:`);
    console.log(`  - Aktif çalışan: ${activeCount}`);
    console.log(`  - İşten ayrılan: ${formerCount}`);
    console.log(`  - Toplam: ${activeCount + formerCount}`);
    
    console.log('\n🎉 Senkronizasyon tamamlandı!');
    
  } catch (error) {
    console.error('❌ Senkronizasyon hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
syncFormerEmployees();


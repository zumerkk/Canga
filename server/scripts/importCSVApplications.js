/**
 * 🔄 CSV İş Başvurularını MongoDB'ye Import Et
 * 2023, 2024, 2025 yıllarının tüm başvurularını içeri aktar
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// .env dosyasını server klasöründen yükle
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ManualApplication = require('../models/ManualApplication');

// CSV dosya yolları
const CSV_FILES = {
  '2023': path.join(__dirname, '../../İŞ BAŞVURU LİSTESİ (SON)', '2023-Tablo 1.csv'),
  '2024': path.join(__dirname, '../../İŞ BAŞVURU LİSTESİ (SON)', '2024-Tablo 1.csv'),
  '2025': path.join(__dirname, '../../İŞ BAŞVURU LİSTESİ (SON)', '2025-Tablo 1.csv')
};

/**
 * CSV dosyasını parse et
 */
const parseCSVFile = (filePath, year) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  CSV dosyası bulunamadı: ${filePath}`);
      return [];
    }

    console.log(`📖 ${year} CSV dosyası okunuyor: ${filePath}`);
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    console.log(`   Toplam satır: ${lines.length}`);
    
    const applications = [];
    
    // Her satırı işle
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const columns = line.split(';').map(col => col?.trim() || '');
      
      // Boş satırları atla
      if (columns.length < 2 || !columns[0] || !columns[1]) continue;
      
      // İlk sütun tamamen sayı ise (satır numarası), atla
      if (/^\d+$/.test(columns[0])) continue;
      
      if (year === '2023') {
        // 2023 formatı: Tarih;İsim;Pozisyon;Telefon;Deneyim;Görüşme;Durum;Notlar
        const [date, fullName, position, phone, experience, interview, status, finalStatus] = columns;
        if (!fullName) continue;
        
        applications.push({
          fullName: fullName,
          position: position || 'Belirtilmemiş',
          phone: phone || '',
          year: 2023,
          applicationDate: date || '',
          experience: experience || '',
          reference: '',
          interview: interview || '',
          status: status || '',
          finalStatus: finalStatus || '',
          source: 'csv',
          createdBy: 'csv-import-2023'
        });
      } else if (year === '2024') {
        // 2024 formatı: İsim;Pozisyon;Telefon;Referans
        const [fullName, position, phone, reference] = columns;
        if (!fullName) continue;
        
        applications.push({
          fullName: fullName,
          position: position || 'Belirtilmemiş',
          phone: phone || '',
          year: 2024,
          applicationDate: '',
          experience: '',
          reference: reference || '',
          interview: '',
          status: '',
          finalStatus: '',
          source: 'csv',
          createdBy: 'csv-import-2024'
        });
      } else if (year === '2025') {
        // 2025 formatı: İsim;Pozisyon;Telefon;Referans;Boş;Boş
        const [fullName, position, phone, reference, ...rest] = columns;
        if (!fullName) continue;
        
        applications.push({
          fullName: fullName,
          position: position || 'Belirtilmemiş',
          phone: phone || '',
          year: 2025,
          applicationDate: '',
          experience: '',
          reference: reference || '',
          interview: '',
          status: '',
          finalStatus: '',
          source: 'csv',
          createdBy: 'csv-import-2025'
        });
      }
    }
    
    console.log(`   ✅ Parse edildi: ${applications.length} geçerli kayıt`);
    return applications;
  } catch (error) {
    console.error(`   ❌ CSV parse hatası (${year}):`, error.message);
    return [];
  }
};

/**
 * Ana import fonksiyonu
 */
const importCSVApplications = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 CSV İş Başvuruları Import İşlemi Başlatılıyor');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // MongoDB Bağlantısı
    console.log('📡 MongoDB\'ye bağlanılıyor...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI bulunamadı! .env dosyasını kontrol edin.');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB bağlantısı başarılı!\n');
    
    // Mevcut CSV kayıtlarını sil (tekrar import için)
    console.log('🗑️  Eski CSV kayıtları temizleniyor...');
    const deleteResult = await ManualApplication.deleteMany({ source: 'csv' });
    console.log(`   Silinen kayıt: ${deleteResult.deletedCount}\n`);
    
    let totalImported = 0;
    let totalFailed = 0;
    const stats = { 2023: 0, 2024: 0, 2025: 0 };
    
    // Her yılın CSV'sini işle
    for (const [year, filePath] of Object.entries(CSV_FILES)) {
      console.log(`\n📅 ${year} Yılı İşleniyor`);
      console.log('─────────────────────────────────────────');
      
      const applications = parseCSVFile(filePath, year);
      
      if (applications.length === 0) {
        console.log(`   ⚠️  ${year} için veri bulunamadı, atlanıyor...\n`);
        continue;
      }
      
      console.log(`   💾 ${applications.length} kayıt veritabanına ekleniyor...`);
      
      let yearSuccess = 0;
      let yearFailed = 0;
      
      for (const appData of applications) {
        try {
          const newApp = new ManualApplication(appData);
          await newApp.save();
          yearSuccess++;
        } catch (err) {
          yearFailed++;
          if (yearFailed <= 3) {
            console.log(`      ⚠️  Hata: ${appData.fullName} - ${err.message}`);
          }
        }
      }
      
      totalImported += yearSuccess;
      totalFailed += yearFailed;
      stats[year] = yearSuccess;
      
      console.log(`   ✅ ${yearSuccess} kayıt başarıyla eklendi`);
      if (yearFailed > 0) {
        console.log(`   ⚠️  ${yearFailed} kayıt eklenemedi`);
      }
    }
    
    // Özet
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 IMPORT ÖZET');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Toplam başarılı: ${totalImported}`);
    console.log(`   2023: ${stats['2023']} kayıt`);
    console.log(`   2024: ${stats['2024']} kayıt`);
    console.log(`   2025: ${stats['2025']} kayıt`);
    if (totalFailed > 0) {
      console.log(`⚠️  Toplam başarısız: ${totalFailed}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Doğrulama
    console.log('🔍 Doğrulama yapılıyor...');
    const dbCount = await ManualApplication.countDocuments({ source: 'csv' });
    console.log(`   Veritabanında CSV kaynağı kayıt: ${dbCount}`);
    
    const totalCount = await ManualApplication.countDocuments();
    console.log(`   Toplam kayıt (CSV + Manuel): ${totalCount}\n`);
    
    console.log('🎉 Import işlemi tamamlandı!\n');
    
  } catch (error) {
    console.error('\n❌ HATA:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('👋 MongoDB bağlantısı kapatıldı.\n');
    process.exit(0);
  }
};

// Script'i çalıştır
if (require.main === module) {
  importCSVApplications();
}

module.exports = { importCSVApplications };


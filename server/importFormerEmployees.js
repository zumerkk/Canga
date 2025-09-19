const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Employee modelini import et
const Employee = require('./models/Employee');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// CSV dosyasını okuma ve parse etme fonksiyonu
const parseFormerEmployeesCSV = (filePath) => {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // İlk birkaç satırı atla (boş satırlar ve başlık)
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('İŞTEN AYRILIŞ TARİHİ') || lines[i].includes('AD SOY AD')) {
        startIndex = i + 1;
        break;
      }
    }
    
    const formerEmployees = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line === ';;;;;;;;') continue;
      
      // Semicolon ile ayır
      const columns = line.split(';');
      
      // En az 3 kolon olmalı
      if (columns.length < 3) continue;
      
      const [ayrilmaTarihi, adSoyad, tcNo, dogumTarihi, iseGirisTarihi, departman, pozisyon, lokasyon, servisGuzergahi, durak, kendiAraci, ayrilmaSebebi] = columns;
      
      // Ad-soyad boş ise atla
      if (!adSoyad || adSoyad.trim() === '') continue;
      
      // Tarih formatını düzenle (DD.MM.YYYY -> YYYY-MM-DD)
      const formatDate = (dateStr) => {
        if (!dateStr || dateStr.trim() === '') return null;
        const parts = dateStr.trim().split('.');
        if (parts.length === 3) {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        return null;
      };
      
      // Lokasyon mapping
      const mapLokasyon = (lok) => {
        if (!lok) return 'MERKEZ';
        const lokUpper = lok.toUpperCase().trim();
        if (lokUpper.includes('MERKEZ')) return 'MERKEZ';
        if (lokUpper.includes('İŞL') || lokUpper.includes('ISL')) return 'İŞL';
        if (lokUpper.includes('OSB')) return 'OSB';
        if (lokUpper.includes('İŞIL') || lokUpper.includes('ISIL')) return 'İŞIL';
        return 'MERKEZ';
      };
      
      const employee = {
        adSoyad: adSoyad.trim(),
        tcNo: tcNo ? tcNo.trim() : '',
        dogumTarihi: formatDate(dogumTarihi),
        iseGirisTarihi: formatDate(iseGirisTarihi),
        ayrilmaTarihi: formatDate(ayrilmaTarihi),
        ayrilmaSebebi: ayrilmaSebebi ? ayrilmaSebebi.trim() : '',
        pozisyon: pozisyon ? pozisyon.trim() : 'Belirtilmemiş',
        lokasyon: mapLokasyon(lokasyon),
        servisGuzergahi: servisGuzergahi ? servisGuzergahi.trim() : '',
        durak: durak ? durak.trim() : '',
        kendiAraci: Boolean(kendiAraci && kendiAraci.trim() !== '' && kendiAraci.toLowerCase().includes('evet')),
        durum: 'AYRILDI',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      formerEmployees.push(employee);
    }
    
    return formerEmployees;
  } catch (error) {
    console.error('❌ CSV okuma hatası:', error);
    return [];
  }
};

// Ana import fonksiyonu
const importFormerEmployees = async () => {
  try {
    await connectDB();
    
    const csvPath = '/Users/zumerkekillioglu/Desktop/Canga/csv/İŞTEN AYRILANLAR-Tablo 1.csv';
    console.log('📄 İşten ayrılanlar CSV dosyası okunuyor:', csvPath);
    
    const formerEmployees = parseFormerEmployeesCSV(csvPath);
    console.log(`📊 Toplam ${formerEmployees.length} işten ayrılan çalışan verisi bulundu`);
    
    if (formerEmployees.length === 0) {
      console.log('⚠️ İçe aktarılacak veri bulunamadı');
      return;
    }
    
    // Mevcut işten ayrılanları temizle
    console.log('🧹 Mevcut işten ayrılan çalışanlar temizleniyor...');
    await Employee.deleteMany({ durum: 'AYRILDI' });
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    console.log('💾 İşten ayrılan çalışanlar MongoDB\'ye kaydediliyor...');
    
    for (const employeeData of formerEmployees) {
      try {
        const employee = new Employee(employeeData);
        await employee.save();
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ ${successCount} işten ayrılan çalışan kaydedildi...`);
        }
      } catch (error) {
        errorCount++;
        errors.push({
          employee: employeeData.adSoyad,
          error: error.message
        });
        console.error(`❌ Hata (${employeeData.adSoyad}):`, error.message);
      }
    }
    
    console.log('\n📈 İŞTEN AYRILANLAR İMPORT SONUÇLARI:');
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    console.log(`📊 Toplam: ${formerEmployees.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔍 HATALAR:');
      errors.forEach(err => {
        console.log(`- ${err.employee}: ${err.error}`);
      });
    }
    
    // Durum özeti
    const statusCounts = await Employee.aggregate([
      { $group: { _id: '$durum', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 GENEL DURUM ÖZETİ:');
    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count}`);
    });
    
    // Ayrılma tarihi analizi
    const ayrilmaAnalizi = await Employee.aggregate([
      { $match: { durum: 'AYRILDI', ayrilmaTarihi: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: '$ayrilmaTarihi' },
            month: { $month: '$ayrilmaTarihi' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    console.log('\n📅 SON 12 AY AYRILMA ANALİZİ:');
    ayrilmaAnalizi.forEach(item => {
      const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                         'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
      console.log(`${monthNames[item._id.month - 1]} ${item._id.year}: ${item.count} kişi`);
    });
    
  } catch (error) {
    console.error('❌ Import işlemi başarısız:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
if (require.main === module) {
  importFormerEmployees();
}

module.exports = { importFormerEmployees, parseFormerEmployeesCSV };
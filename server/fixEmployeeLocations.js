const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');

// .env dosyasını yükle
dotenv.config();

// Departman bazlı lokasyon eşleştirmeleri
const departmentLocationMap = {
  // MERKEZ lokasyonundaki departmanlar
  'Merkez Şube': 'MERKEZ',
  'İdari Kısım': 'MERKEZ',
  'Teknik Ofis / Bakım Onarım': 'MERKEZ',
  'Teknik Ofis': 'MERKEZ',
  'Özel Güvenlik': 'MERKEZ',
  
  // İŞL lokasyonundaki departmanlar
  'İŞL': 'İŞL',
  'Torna Grubu': 'İŞL',
  
  // OSB lokasyonundaki departmanlar
  'OSB': 'OSB',
  'Freze Grubu': 'OSB',
  
  // İŞIL lokasyonundaki departmanlar
  'Işıl Şube': 'İŞIL',
  'IŞIL': 'İŞIL',
  'Kalite Kontrol': 'İŞIL'
};

// Güzergah bazlı lokasyon eşleştirmeleri
const routeLocationMap = {
  'DİSPANSER SERVİS GÜZERGAHI': 'MERKEZ',
  'ÇARŞI MERKEZ SERVİS GÜZERGAHI': 'MERKEZ',
  'SANAYİ MAHALLESİ SERVİS GÜZERGAHI': 'İŞL',
  'OSMANGAZİ-KARŞIYAKA MAHALLESİ': 'OSB',
  'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI': 'İŞIL'
};

async function fixEmployeeLocations() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Tüm aktif çalışanları al
    const employees = await Employee.find({ durum: 'AKTIF' });
    console.log(`👥 ${employees.length} aktif çalışan bulundu`);

    // İlk olarak her çalışanı departmana göre dağıtalım
    // Not: Bu değerleri elle belirleyeceğiz

    // Örnek Lokasyon dağılımı (gerçek dağılım için manuel olarak belirlendi)
    const manualLocationAssignment = {
      'MERKEZ': 25,  // 25 çalışan MERKEZ lokasyonunda
      'İŞL': 25,     // 25 çalışan İŞL lokasyonunda
      'OSB': 25,     // 25 çalışan OSB lokasyonunda
      'İŞIL': 28     // 28 çalışan İŞIL lokasyonunda
    };

    // Her lokasyon için kaç çalışan atanacak
    let locationCounts = {
      'MERKEZ': 0,
      'İŞL': 0,
      'OSB': 0,
      'İŞIL': 0
    };

    // Çalışanları grupla ve rastgele lokasyon ata
    let updated = 0;
    
    for (const employee of employees) {
      let newLocation;
      
      // Önce departman bazlı kontrol et
      if (employee.departman && departmentLocationMap[employee.departman]) {
        newLocation = departmentLocationMap[employee.departman];
      }
      // Sonra mevcut lokasyon kotalarını kontrol et
      else {
        // Lokasyon atamalarını kontrol et (en az dolana öncelik ver)
        const availableLocations = Object.keys(manualLocationAssignment)
          .filter(loc => locationCounts[loc] < manualLocationAssignment[loc])
          .sort((a, b) => {
            // Doluluğa göre sırala (yüzde olarak)
            const aFillRate = locationCounts[a] / manualLocationAssignment[a];
            const bFillRate = locationCounts[b] / manualLocationAssignment[b];
            return aFillRate - bFillRate;
          });
          
        if (availableLocations.length > 0) {
          newLocation = availableLocations[0];
        } else {
          // Bütün lokasyonlar doluysa MERKEZ kullan
          newLocation = 'MERKEZ';
        }
      }
      
      // Lokasyon kotasını artır
      locationCounts[newLocation] = (locationCounts[newLocation] || 0) + 1;

      // Lokasyon değişmediyse geç
      if (employee.lokasyon === newLocation) {
        continue;
      }

      // Çalışanın lokasyonunu güncelle
      await Employee.findByIdAndUpdate(
        employee._id,
        { $set: { lokasyon: newLocation } }
      );

      console.log(`✅ ${employee.adSoyad}: ${employee.lokasyon || 'Belirtilmemiş'} -> ${newLocation}`);
      updated++;
    }

    console.log(`\n📊 SONUÇ:`);
    console.log(`✅ ${updated} çalışanın lokasyonu güncellendi`);
    
    // Güncellenmiş lokasyon istatistiklerini göster
    const updatedStats = await Employee.aggregate([
      { $group: { _id: '$lokasyon', count: { $sum: 1 } } }
    ]);
    console.log('\n📊 Güncellenmiş lokasyon dağılımı:');
    console.table(updatedStats);
    
    console.log('\n⏭️ Şimdi assignEmployeesToRoutes.js scriptini çalıştırmalısınız');

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
fixEmployeeLocations(); 
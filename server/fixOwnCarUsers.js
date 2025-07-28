const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const fs = require('fs');

// .env dosyasını yükle
dotenv.config();

async function fixOwnCarUsers() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Tüm aktif çalışanları al
    const allEmployees = await Employee.find({ durum: 'AKTIF' });
    console.log(`\n📊 Toplam ${allEmployees.length} aktif çalışan var`);

    // Kendi aracı ile gelenler CSV'si
    const ownCarCsvContent = fs.readFileSync('../kendi_araci_ile_gelenler.csv', 'utf8');
    const ownCarLines = ownCarCsvContent.split('\n').filter(line => line.trim() !== '');
    const ownCarRecords = [];
    
    // Başlık satırını atla (ilk satır)
    for (let i = 1; i < ownCarLines.length; i++) {
      const line = ownCarLines[i];
      const parts = line.split(',');
      
      if (parts.length >= 2) {
        const kategori = parts[0].trim();
        const adSoyad = parts[1].trim();
        const not = parts.length > 2 ? parts[2].trim() : '';
        
        ownCarRecords.push({
          kategori,
          adSoyad,
          not
        });
      }
    }
    
    console.log(`✅ Kendi aracı ile gelenler CSV'sinde ${ownCarRecords.length} çalışan var`);

    // Kendi aracı ile gelen çalışanları güncelle
    console.log('\n🚗 Kendi aracı ile gelen çalışanları güncelliyorum...');
    let ownCarUpdated = 0;
    let ownCarNotFound = 0;

    for (const record of ownCarRecords) {
      try {
        let employeeName = record.adSoyad;
        
        // Çalışanı bul (büyük/küçük harf duyarlılığını kaldır)
        const employee = findBestMatch(employeeName, allEmployees);
        
        if (!employee) {
          console.log(`❌ Çalışan bulunamadı: ${employeeName}`);
          ownCarNotFound++;
          continue;
        }
        
        // Not bilgisi
        const note = record.not || '';
        
        // Çalışanı güncelle - doğrudan güncelleme
        const result = await Employee.updateOne(
          { _id: employee._id },
          {
            $set: {
              servisGuzergahi: null,
              durak: null,
              servisKullaniyor: false,
              kendiAraci: true,
              kendiAraciNot: note,
              'serviceInfo.usesService': false,
              'serviceInfo.usesOwnCar': true,
              'serviceInfo.ownCarNote': note
            }
          }
        );
        
        console.log(`✅ ${employee.adSoyad} (${employeeName}): Kendi aracı ile geliyor${note ? ' (' + note + ')' : ''}`);
        ownCarUpdated++;
        
      } catch (error) {
        console.error(`❌ Hata: ${error.message}`);
      }
    }

    console.log(`\n📊 Kendi Aracı Güncelleme Sonuçları:`);
    console.log(`✅ ${ownCarUpdated} çalışanın kendi aracı bilgisi güncellendi`);
    console.log(`⚠️ ${ownCarNotFound} çalışan bulunamadı`);

    // Güncel durumu kontrol et
    const updatedServiceUsers = await Employee.countDocuments({
      servisGuzergahi: { $exists: true, $ne: null }
    });
    
    const updatedOwnCarUsers = await Employee.countDocuments({
      kendiAraci: true
    });
    
    console.log(`\n📊 Güncelleme Sonrası Durum:`);
    console.log(`✅ Servis kullanan: ${updatedServiceUsers} çalışan`);
    console.log(`✅ Kendi aracı ile gelen: ${updatedOwnCarUsers} çalışan`);
    console.log(`✅ Toplam: ${updatedServiceUsers + updatedOwnCarUsers} çalışan`);

    // Kendi aracı ile gelen çalışanları listele
    const ownCarUsers = await Employee.find({ kendiAraci: true })
      .select('adSoyad kendiAraciNot')
      .sort({ adSoyad: 1 });

    console.log(`\n🚗 Kendi aracı ile gelen ${ownCarUsers.length} çalışan:`);
    ownCarUsers.forEach(user => {
      console.log(`- ${user.adSoyad}${user.kendiAraciNot ? ' (' + user.kendiAraciNot + ')' : ''}`);
    });

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('\nMongoDB bağlantısı kapatıldı');
  }
}

// İsim eşleştirme fonksiyonu - daha esnek
function findBestMatch(name, employeeList) {
  // İsim düzeltmeleri
  const nameCorrections = {
    'MEHMET KEMAL İNAÇ': 'MEHMET KEMAL İNANÇ',
    'ÇAĞRI YILDIZ': 'Çağrı YILDIZ'
  };
  
  // Düzeltme varsa uygula
  if (nameCorrections[name]) {
    name = nameCorrections[name];
  }
  
  // Tam eşleşme
  const exactMatch = employeeList.find(emp => 
    emp.adSoyad.toUpperCase() === name.toUpperCase()
  );
  
  if (exactMatch) return exactMatch;
  
  // Kısmi eşleşme - isim veya soyisim
  const nameParts = name.split(' ');
  const partialMatches = employeeList.filter(emp => {
    const empNameParts = emp.adSoyad.split(' ');
    
    // İsim veya soyisim eşleşmesi
    return nameParts.some(part => 
      empNameParts.some(empPart => 
        empPart.toUpperCase() === part.toUpperCase()
      )
    );
  });
  
  if (partialMatches.length === 1) return partialMatches[0];
  
  // En iyi eşleşmeyi bul
  if (partialMatches.length > 1) {
    // En çok kelime eşleşen
    const bestMatch = partialMatches.reduce((best, current) => {
      const currentNameParts = current.adSoyad.split(' ');
      const currentMatchCount = nameParts.filter(part => 
        currentNameParts.some(currentPart => 
          currentPart.toUpperCase() === part.toUpperCase()
        )
      ).length;
      
      const bestNameParts = best ? best.adSoyad.split(' ') : [];
      const bestMatchCount = best ? nameParts.filter(part => 
        bestNameParts.some(bestPart => 
          bestPart.toUpperCase() === part.toUpperCase()
        )
      ).length : 0;
      
      return currentMatchCount > bestMatchCount ? current : best;
    }, null);
    
    return bestMatch;
  }
  
  return null;
}

// Script'i çalıştır
fixOwnCarUsers(); 
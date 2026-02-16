/**
 * 📊 GENEL LİSTE CSV'den MongoDB'ye 117 Çalışan Senkronizasyonu
 * Bu script CSV dosyasındaki tüm çalışanları MongoDB'ye aktarır
 * Son güncelleme: Şubat 2026 - 117 aktif çalışan
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga';

// Employee Schema (inline - modelden bağımsız çalışması için)
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, sparse: true },
  adSoyad: { type: String, required: true, trim: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  tcNo: { type: String, trim: true, unique: true, sparse: true },
  cepTelefonu: { type: String, trim: true },
  dogumTarihi: { type: Date },
  iseGirisTarihi: { type: Date },
  pozisyon: { type: String, required: true, trim: true },
  departman: { type: String, trim: true },
  lokasyon: { type: String, required: true, enum: ['MERKEZ', 'İŞIL', 'OSB'] },
  servisGuzergahi: { type: String, trim: true },
  durak: { type: String, trim: true },
  kendiAraci: { type: Boolean, default: false },
  kendiAraciNot: { type: String, trim: true },
  serviceInfo: {
    usesService: { type: Boolean, default: false },
    routeName: { type: String, trim: true },
    stopName: { type: String, trim: true },
    usesOwnCar: { type: Boolean, default: false },
    ownCarNote: { type: String, trim: true }
  },
  durum: { type: String, required: true, enum: ['AKTIF', 'PASIF', 'İZİNLİ', 'AYRILDI'], default: 'AKTIF' },
  ayrilmaTarihi: { type: Date },
  ayrilmaSebebi: { type: String, trim: true },
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
  if (!phone || phone === 'kullanmıyor') return '';
  return phone.replace(/\s+/g, ' ').trim();
}

// 🏢 Pozisyona göre departman belirleme
function getDepartment(position) {
  const positionLower = position.toLowerCase();
  
  if (positionLower.includes('torna')) return 'TORNA GRUBU';
  if (positionLower.includes('freze')) return 'FREZE GRUBU';
  if (positionLower.includes('kaynak')) return 'KAYNAK';
  if (positionLower.includes('kalite')) return 'KALİTE KONTROL';
  if (positionLower.includes('imal') || positionLower.includes('imalat')) return 'ÜRETİM';
  if (positionLower.includes('boyacı') || positionLower.includes('boya')) return 'BOYAHANE';
  if (positionLower.includes('mühendis')) return 'MÜHENDİSLİK';
  if (positionLower.includes('muhasebe')) return 'MUHASEBE';
  if (positionLower.includes('güvenlik') || positionLower.includes('bekçi')) return 'GÜVENLİK';
  if (positionLower.includes('temizlik')) return 'DESTEK HİZMETLER';
  if (positionLower.includes('lobi') || positionLower.includes('mutfak')) return 'DESTEK HİZMETLER';
  if (positionLower.includes('bilgi işlem') || positionLower.includes('bilgisayar')) return 'BİLGİ İŞLEM';
  if (positionLower.includes('depo')) return 'DEPO';
  if (positionLower.includes('lojistik')) return 'LOJİSTİK';
  if (positionLower.includes('satın alma')) return 'SATIN ALMA';
  if (positionLower.includes('idari') || positionLower.includes('müdür')) return 'İDARİ BİRİM';
  if (positionLower.includes('ustabaşı') || positionLower.includes('sorumlu')) return 'YÖNETİM';
  if (positionLower.includes('planlama')) return 'PLANLAMA';
  if (positionLower.includes('taşlama') || positionLower.includes('kumlama')) return 'ÜRETİM';
  if (positionLower.includes('elektrik') || positionLower.includes('bakım')) return 'BAKIM ONARIM';
  if (positionLower.includes('asfalt')) return 'ÜRETİM';
  
  return 'GENEL';
}

// 📍 Durak bilgisine göre lokasyon belirleme
function getLocation(durak, pozisyon) {
  if (!durak) return 'MERKEZ';
  
  const durakLower = durak.toLowerCase();
  const pozisyonLower = (pozisyon || '').toLowerCase();
  
  // IŞIL Şube göstergeleri
  if (pozisyonLower.includes('ışıl') || pozisyonLower.includes('işil')) return 'İŞIL';
  if (durakLower.includes('etiler') || durakLower.includes('etıler')) return 'İŞIL';
  if (durakLower.includes('sanayi')) return 'İŞIL';
  if (durakLower.includes('ovacık') || durakLower.includes('ovacik')) return 'İŞIL';
  
  // OSB göstergeleri
  if (durakLower.includes('osb')) return 'OSB';
  
  // MERKEZ varsayılan
  return 'MERKEZ';
}

// 🆔 Employee ID oluşturma
function generateEmployeeId(adSoyad, index) {
  const parts = adSoyad.trim().split(' ');
  const firstInitial = parts[0]?.charAt(0)?.toUpperCase() || 'X';
  const lastInitial = parts[parts.length - 1]?.charAt(0)?.toUpperCase() || 'X';
  const number = (index + 1).toString().padStart(4, '0');
  return `${firstInitial}${lastInitial}${number}`;
}

// 🚗 Kendi aracı ile mi geliyor kontrolü
function checkOwnCar(durak) {
  if (!durak) return { usesOwnCar: false, note: '' };
  
  const durakLower = durak.toLowerCase();
  if (durakLower.includes('kendi aracı') || durakLower.includes('kendi araci')) {
    return { usesOwnCar: true, note: durak };
  }
  return { usesOwnCar: false, note: '' };
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
    
    // CSV yapısı: [servis_no?];[sıra_no];[ad_soyad];[tc_no];[telefon];[dogum_tarihi];[ise_giris_tarihi];[pozisyon];[durak]
    // İlk kolon bazen boş (servis numarası), bu yüzden indeksleme değişebilir
    
    let siraNo, adSoyad, tcNo, telefon, dogumTarihi, iseGirisTarihi, pozisyon, durak;
    
    if (parts.length >= 9) {
      // İlk kolon servis numarası (boş olabilir)
      siraNo = parts[1]?.trim();
      adSoyad = parts[2]?.trim();
      tcNo = parts[3]?.trim();
      telefon = parts[4]?.trim();
      dogumTarihi = parts[5]?.trim();
      iseGirisTarihi = parts[6]?.trim();
      pozisyon = parts[7]?.trim();
      durak = parts[8]?.trim();
    } else if (parts.length >= 8) {
      siraNo = parts[0]?.trim();
      adSoyad = parts[1]?.trim();
      tcNo = parts[2]?.trim();
      telefon = parts[3]?.trim();
      dogumTarihi = parts[4]?.trim();
      iseGirisTarihi = parts[5]?.trim();
      pozisyon = parts[6]?.trim();
      durak = parts[7]?.trim();
    } else {
      console.log(`⚠️ Satır ${i + 1} atlandı - yetersiz kolon: ${line}`);
      continue;
    }
    
    if (!adSoyad || !pozisyon) {
      console.log(`⚠️ Satır ${i + 1} atlandı - eksik ad/pozisyon: ${line}`);
      continue;
    }
    
    const ownCarInfo = checkOwnCar(durak);
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
      pozisyon,
      departman: getDepartment(pozisyon),
      lokasyon: getLocation(durak, pozisyon),
      durak: durak || '',
      kendiAraci: ownCarInfo.usesOwnCar,
      kendiAraciNot: ownCarInfo.note
    });
  }
  
  return employees;
}

// 🚀 Ana fonksiyon
async function syncEmployees() {
  try {
    console.log('🔗 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
    
    // CSV dosyasını oku - güncellenmiş yol (pers klasörü)
    const csvPath = path.join(__dirname, '../../D1-PERSONEL BİLGİ DOSYASI 29.09.2022/GENEL LİSTE-Tablo 1.csv');
    console.log(`📂 CSV dosyası okunuyor: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV dosyası bulunamadı: ${csvPath}`);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const employees = parseCSV(csvContent);
    
    console.log(`📊 CSV'den ${employees.length} çalışan parse edildi`);
    
    // Mevcut çalışanları sil
    console.log('🗑️ Mevcut çalışanlar siliniyor...');
    const deleteResult = await Employee.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} mevcut çalışan silindi`);
    
    // Yeni çalışanları ekle
    console.log('📝 Yeni çalışanlar ekleniyor...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      
      try {
        const employeeData = {
          employeeId: generateEmployeeId(emp.adSoyad, i),
          adSoyad: emp.adSoyad,
          firstName: emp.firstName,
          lastName: emp.lastName,
          tcNo: emp.tcNo || undefined,
          cepTelefonu: emp.cepTelefonu,
          dogumTarihi: emp.dogumTarihi,
          iseGirisTarihi: emp.iseGirisTarihi,
          pozisyon: emp.pozisyon,
          departman: emp.departman,
          lokasyon: emp.lokasyon,
          durak: emp.durak,
          kendiAraci: emp.kendiAraci,
          kendiAraciNot: emp.kendiAraciNot,
          serviceInfo: {
            usesService: !emp.kendiAraci && emp.durak !== '',
            stopName: emp.durak,
            usesOwnCar: emp.kendiAraci,
            ownCarNote: emp.kendiAraciNot
          },
          durum: 'AKTIF',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // TC No boşsa undefined yap (unique constraint için)
        if (!employeeData.tcNo || employeeData.tcNo === '') {
          delete employeeData.tcNo;
        }
        
        const newEmployee = new Employee(employeeData);
        await newEmployee.save();
        
        successCount++;
        console.log(`✅ [${i + 1}/${employees.length}] ${emp.adSoyad} eklendi (${employeeData.employeeId})`);
        
      } catch (error) {
        errorCount++;
        errors.push({ employee: emp.adSoyad, error: error.message });
        console.error(`❌ [${i + 1}/${employees.length}] ${emp.adSoyad} eklenemedi: ${error.message}`);
      }
    }
    
    // Sonuç özeti
    console.log('\n' + '='.repeat(60));
    console.log('📊 SENKRONIZASYON SONUCU');
    console.log('='.repeat(60));
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    console.log(`📋 Toplam: ${employees.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️ Hata Detayları:');
      errors.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.employee}: ${e.error}`);
      });
    }
    
    // Veritabanındaki toplam sayıyı kontrol et
    const finalCount = await Employee.countDocuments();
    console.log(`\n📈 Veritabanındaki toplam çalışan sayısı: ${finalCount}`);
    
    // Departman bazında dağılım
    const deptStats = await Employee.aggregate([
      { $group: { _id: '$departman', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Departman Dağılımı:');
    deptStats.forEach(d => {
      console.log(`  ${d._id}: ${d.count} kişi`);
    });
    
    // Lokasyon bazında dağılım
    const locStats = await Employee.aggregate([
      { $group: { _id: '$lokasyon', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📍 Lokasyon Dağılımı:');
    locStats.forEach(l => {
      console.log(`  ${l._id}: ${l.count} kişi`);
    });
    
    console.log('\n🎉 Senkronizasyon tamamlandı!');
    
  } catch (error) {
    console.error('❌ Senkronizasyon hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
syncEmployees();


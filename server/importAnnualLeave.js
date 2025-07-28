const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');

// Environment değişkenlerini yükle
dotenv.config();

// Employee ve AnnualLeave modellerini import et
const Employee = require('./models/Employee');
const AnnualLeave = require('./models/AnnualLeave');

// MongoDB bağlantı bilgisi
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga';

console.log('🚀 Yıllık İzin verileri import işlemi başlatılıyor...');

// MongoDB'ye bağlan
mongoose.connect(mongoURI)
  .then(async () => {
    console.log('✅ MongoDB bağlantısı başarılı');
    await importLeaveData();
    console.log('✅ İşlem tamamlandı');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err);
    process.exit(1);
  });

// İzin verilerini import et
async function importLeaveData() {
  try {
    // Öncelikle CSV dosyasını dene (en doğru veriler burada)
    let filePath = path.resolve(__dirname, '../Yıllık İzinleri Hesaplama Tablosu DEĞİŞTİRİLMİŞ MUZAFFER BEY - Çalışan Listesi.csv');
    console.log('📄 Ana CSV dosyası okunuyor:', filePath);
    
    // Ana CSV dosyası yoksa alternatif dosyaları kontrol et
    if (!fs.existsSync(filePath)) {
      console.log('⚠️ Ana CSV dosyası bulunamadı, alternatif dosyalar kontrol ediliyor...');
      
      // TSV dosyasını dene
      const tsvPath = path.resolve(__dirname, '../izinler.tsv');
      if (fs.existsSync(tsvPath)) {
        console.log('✅ TSV dosyası bulundu:', tsvPath);
        filePath = tsvPath;
      } else {
        // TXT dosyasını dene
        const txtPath = path.resolve(__dirname, '../izinler.txt');
        if (fs.existsSync(txtPath)) {
          console.log('✅ TXT dosyası bulundu:', txtPath);
          filePath = txtPath;
        } else {
          console.error('❌ İzin verileri içeren dosya bulunamadı!');
          return;
        }
      }
    }
    
    // Dosyayı satır satır oku
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    const leaveData = [];
    let headers = [];
    let lineCount = 0;
    let isCSVFile = filePath.endsWith('.csv');
    
    // Satırları işle
    for await (const line of rl) {
      lineCount++;
      
      // CSV dosyası için özel işlem (ilk satır genel başlık, ikinci satır yıl başlıkları)
      if (isCSVFile && lineCount === 1) {
        // CSV'nin ilk satırını atla (genel başlık satırı)
        continue;
      }
      
      // Başlık satırı (CSV için 2. satır, diğerleri için 1. satır)
      if ((isCSVFile && lineCount === 2) || (!isCSVFile && lineCount === 1)) {
        // Hem tab hem virgülle ayırma denemesi
        if (line.includes('\t')) {
          headers = line.split('\t');
        } else if (line.includes(',')) {
          headers = line.split(',');
        } else {
          headers = line.split(/\s+/); // Çoklu boşluk karakteriyle ayır
        }
        
        // Başlıkları temizle (yıl sütunları hariç)
        for (let i = 0; i < headers.length; i++) {
          headers[i] = headers[i].trim();
        }
        
        console.log('📋 Bulunan sütun başlıkları:', headers);
        continue;
      }
      
      // Veri satırları - ayraç algıla
      let values;
      if (line.includes('\t')) {
        values = line.split('\t');
      } else if (line.includes(',')) {
        values = line.split(',');
      } else {
        values = line.split(/\s+/); // Çoklu boşluk karakteriyle ayır
      }
      
      // Boş satırları atla
      if (values.length < 4 || !values[1] || values[1].trim() === '') continue;
      
      const employeeData = {
        no: values[0],
        adSoyad: values[1].trim(),
        dogumTarihi: parseDate(values[2]),
        iseGirisTarihi: parseDate(values[3]),
        izinVerileri: {}
      };
      
      // Yıllara göre izin verilerini ekle (4. indeksten sonrası yıllık izin bilgileri)
      for (let i = 4; i < values.length && i < headers.length; i++) {
        const year = headers[i];
        
        // Yıl değeri mi kontrol et
        if (year && year.match(/^\d{4}$/)) {
          const usedDaysStr = values[i] ? values[i].trim() : '';
          const usedDays = usedDaysStr !== '' ? parseInt(usedDaysStr) : 0;
          
          if (!isNaN(usedDays)) {
            employeeData.izinVerileri[year] = usedDays;
          }
        }
      }
      
      leaveData.push(employeeData);
    }
    
    console.log(`📊 Toplam ${leaveData.length} çalışanın izin verileri okundu`);
    
    // Her çalışan için veritabanını güncelle
    let successCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;
    
    // Çalışanları bir kerede al
    const allEmployees = await Employee.find({});
    console.log(`📋 Veritabanında ${allEmployees.length} çalışan bulundu`);
    
    for (const data of leaveData) {
      try {
        // Çalışanı bul - önce tam ad ile sonra benzer ad ile
        let employee = allEmployees.find(e => 
          e.adSoyad && e.adSoyad.toUpperCase() === data.adSoyad.toUpperCase()
        );
        
        // Tam eşleşme yoksa benzerleri kontrol et
        if (!employee) {
          employee = allEmployees.find(e => {
            if (!e.adSoyad) return false;
            // İsim ve soyisim parçalarını karşılaştır
            const nameParts1 = e.adSoyad.toUpperCase().split(' ');
            const nameParts2 = data.adSoyad.toUpperCase().split(' ');
            
            // En az bir isim parçası eşleşmeli
            for (const part1 of nameParts1) {
              for (const part2 of nameParts2) {
                if (part1 === part2 && part1.length > 2) return true;
              }
            }
            return false;
          });
        }
        
        if (!employee) {
          // Adı kullanarak doğrudan veritabanında ara
          employee = await Employee.findOne({ 
            $text: { $search: data.adSoyad.split(' ').join(' ') } 
          });
        }
        
        if (!employee) {
          notFoundCount++;
          console.warn(`⚠️ Çalışan bulunamadı: ${data.adSoyad}`);
          continue;
        }
        
        // İzin kayıtlarını bul veya oluştur
        let leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
        
        if (!leaveRecord) {
          leaveRecord = new AnnualLeave({
            employeeId: employee._id,
            leaveByYear: [],
            totalLeaveStats: {
              totalEntitled: 0,
              totalUsed: 0,
              remaining: 0
            }
          });
        }
        
        // Her yıl için izin bilgilerini güncelle
        let totalUsed = 0;
        let totalEntitled = 0;
        
        // Yılları sırala
        const years = Object.keys(data.izinVerileri).sort();
        
        for (const year of years) {
          const usedDays = data.izinVerileri[year] || 0;
          const yearNum = parseInt(year);
          
          // Hak kazanılan izin günü hesapla
          const entitledDays = calculateEntitledDays(data.dogumTarihi, data.iseGirisTarihi, yearNum);
          
          // Yıl kaydını bul veya oluştur
          let yearRecord = leaveRecord.leaveByYear.find(y => y.year === yearNum);
          
          if (!yearRecord) {
            // Yeni yıl kaydı ekle
            yearRecord = {
              year: yearNum,
              entitled: entitledDays,
              used: usedDays,
              entitlementDate: new Date(yearNum, 0, 1), // 1 Ocak
              leaveRequests: []
            };
            leaveRecord.leaveByYear.push(yearRecord);
          } else {
            // Mevcut kaydı güncelle
            yearRecord.entitled = entitledDays;
            yearRecord.used = usedDays;
          }
          
          // Eğer izin kullanımı varsa request ekle
          if (usedDays > 0 && yearRecord.leaveRequests.length === 0) {
            yearRecord.leaveRequests.push({
              startDate: new Date(yearNum, 5, 1), // 1 Haziran (tarih bilgisi olmadığı için varsayılan)
              endDate: new Date(yearNum, 5, usedDays), 
              days: usedDays,
              status: 'ONAYLANDI',
              notes: 'İzinler dosyasından aktarıldı'
            });
          }
          
          totalEntitled += entitledDays;
          totalUsed += usedDays;
        }
        
        // Toplam istatistikleri güncelle
        leaveRecord.totalLeaveStats.totalEntitled = totalEntitled;
        leaveRecord.totalLeaveStats.totalUsed = totalUsed;
        leaveRecord.totalLeaveStats.remaining = Math.max(0, totalEntitled - totalUsed);
        leaveRecord.lastCalculationDate = new Date();
        
        // Kaydı güncelle
        await leaveRecord.save();
        
        console.log(`✅ ${data.adSoyad} için izin verileri güncellendi - Hak: ${totalEntitled}, Kullanılan: ${totalUsed}, Kalan: ${leaveRecord.totalLeaveStats.remaining}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Hata: ${data.adSoyad} için izin verileri güncellenemedi:`, error);
        errorCount++;
      }
    }
    
    console.log(`
📊 İmport İşlemi Sonuçları:
✅ Başarılı: ${successCount} çalışan
⚠️ Bulunamadı: ${notFoundCount} çalışan
❌ Hatalı: ${errorCount} çalışan
⏱️ Toplam: ${leaveData.length} çalışan
    `);
    
  } catch (error) {
    console.error('❌ Import işleminde hata:', error);
  }
}

// İzin hak ediş hesaplaması
function calculateEntitledDays(birthDateStr, hireDateStr, year) {
  try {
    if (!birthDateStr || !hireDateStr) return 0;
    
    const birthDate = new Date(birthDateStr);
    let hireDate = new Date(hireDateStr);
    
    // Geçersiz tarihler için 0 dön
    if (isNaN(birthDate) || isNaN(hireDate)) return 0;
    
    // Şirket 2014'te kuruldu - bu tarihten önceki işe giriş tarihleri hatalı
    const companyFoundingYear = 2014;
    if (hireDate.getFullYear() < companyFoundingYear) {
      console.warn(`⚠️ Hatalı işe giriş tarihi düzeltiliyor: ${hireDateStr} -> ${companyFoundingYear}`);
      hireDate = new Date(companyFoundingYear, 0, 1); // 1 Ocak 2014
    }
    
    // Hesaplama yılında çalışan yaşı
    const age = year - birthDate.getFullYear();
    
    // İşe giriş yılından hesaplama yılına kadar geçen yıl
    let yearsOfService = year - hireDate.getFullYear();
    
    // İşe giriş yılını hesaba kat
    if (year === hireDate.getFullYear()) {
      // İşe giriş yılında, işe giriş ayına göre hesapla
      const hireMonth = hireDate.getMonth();
      if (hireMonth < 6) { // Haziran öncesi
        yearsOfService = 1; // Kısmi izin hakkı
      } else {
        yearsOfService = 0; // İzin hakkı yok
      }
    }
    
    // İzin kuralları
    if (yearsOfService <= 0) {
      // Henüz izin hakkı kazanmamış çalışan
      return 0;
    } else if (age >= 50) {
      // 50 yaş ve üzeri - 20 gün
      return 20;
    } else if (yearsOfService <= 5) {
      // 1-5 yıl arası - 14 gün
      return 14;
    } else {
      // 5 yıldan fazla - 20 gün
      return 20;
    }
  } catch (error) {
    console.error('İzin hesaplama hatası:', error);
    return 0;
  }
}

// Tarih formatını parse et (farklı formatları destekler)
function parseDate(dateStr) {
  if (!dateStr) return null;
  dateStr = dateStr.trim();
  
  // Boş string kontrolü
  if (dateStr === '') return null;
  
  try {
    // DD.MM.YYYY formatı (Türkçe format)
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    
    // MM/DD/YYYY formatı (Excel formatı)
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        
        // Geçerli tarih kontrolü
        const testDate = new Date(year, month - 1, day);
        if (!isNaN(testDate.getTime()) && 
            testDate.getFullYear() == year && 
            testDate.getMonth() == month - 1 && 
            testDate.getDate() == day) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    // ISO formatı veya geçerli JavaScript Date nesnesi oluşturan herhangi bir format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error(`Tarih ayrıştırma hatası: ${dateStr}`, e);
  }
  
  return null;
}
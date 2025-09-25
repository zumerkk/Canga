const mongoose = require('mongoose');
const fs = require('fs');
const Employee = require('./models/Employee');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// CSV dosyasını parse et
const parseCSV = (filePath) => {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(';');
    
    const employees = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      if (values.length >= 8) {
        const employee = {
          siraNo: values[0]?.trim(),
          adSoyad: values[1]?.trim(),
          tcNo: values[2]?.trim(),
          cepNo: values[3]?.trim(),
          dogumTarihi: values[4]?.trim(),
          iseGirisTarihi: values[5]?.trim(),
          gorev: values[6]?.trim(),
          servisBinisNoktasi: values[7]?.trim()
        };
        
        // TC kimlik numarası kontrolü
        if (employee.tcNo && employee.tcNo.length === 11 && /^\d+$/.test(employee.tcNo)) {
          employees.push(employee);
        } else {
          console.log(`⚠️  Geçersiz TC No: ${employee.adSoyad} - ${employee.tcNo}`);
        }
      }
    }
    
    return employees;
  } catch (error) {
    console.error('❌ CSV okuma hatası:', error);
    return [];
  }
};

// Tarih formatını düzenle
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  
  // Farklı tarih formatlarını handle et
  if (dateStr.includes('/')) {
    // M/D/YY veya MM/DD/YYYY formatı
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let [month, day, year] = parts;
      
      // Yıl formatını düzenle
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      
      // YYYY-MM-DD formatına çevir
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } else if (dateStr.includes('.')) {
    // DD.MM.YYYY formatı
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return dateStr;
};

// Departman mapping
const mapDepartment = (gorev) => {
  if (!gorev) return 'GENEL ÇALIŞMA GRUBU';
  
  const gorevUpper = gorev.toUpperCase();
  
  if (gorevUpper.includes('CNC') || gorevUpper.includes('TORNA')) return 'TORNA GRUBU';
  if (gorevUpper.includes('FREZE')) return 'FREZE GRUBU';
  if (gorevUpper.includes('TESTERE')) return 'TESTERE';
  if (gorevUpper.includes('KAYNAK')) return 'KAYNAK';
  if (gorevUpper.includes('MONTAJ')) return 'MONTAJ';
  if (gorevUpper.includes('KALİTE')) return 'KALİTE KONTROL';
  if (gorevUpper.includes('BAKIM') || gorevUpper.includes('ONARIM')) return 'BAKIM VE ONARIM';
  if (gorevUpper.includes('İDARİ') || gorevUpper.includes('MÜDÜR') || gorevUpper.includes('MUHASEBE')) return 'İDARİ BİRİM';
  if (gorevUpper.includes('MÜHENDİS') || gorevUpper.includes('PLANLAMA') || gorevUpper.includes('ARGE')) return 'TEKNİK OFİS';
  if (gorevUpper.includes('STAJ')) return 'STAJYERLİK';
  if (gorevUpper.includes('ÇIRAK')) return 'ÇIRAK LİSE';
  
  return 'GENEL ÇALIŞMA GRUBU';
};

// Lokasyon belirleme
const mapLocation = (servisBinisNoktasi) => {
  if (!servisBinisNoktasi || servisBinisNoktasi.includes('KENDİ ARACI')) return 'MERKEZ';
  return 'MERKEZ'; // Şimdilik hepsi MERKEZ
};

// Servis güzergahı mapping
const mapServiceRoute = (servisBinisNoktasi) => {
  if (!servisBinisNoktasi || servisBinisNoktasi.includes('KENDİ ARACI')) {
    return 'KENDİ ARACI İLE GELENLER';
  }
  
  const nokta = servisBinisNoktasi.toUpperCase();
  
  // Yeni güzergahlara göre mapping
  if (nokta.includes('ÇALILIÖZ') || nokta.includes('AHILI')) {
    return 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI';
  }
  if (nokta.includes('DİSPANSER') || nokta.includes('50.YIL')) {
    return '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI';
  }
  if (nokta.includes('ETİLER') || nokta.includes('KESKİN') || nokta.includes('KARACALI')) {
    return 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI';
  }
  if (nokta.includes('OSMANGAZİ') || nokta.includes('ÇARŞI') || nokta.includes('SAAT KULESİ')) {
    return 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI';
  }
  if (nokta.includes('BAHÇELİEVLER') || nokta.includes('KARŞIYAKA')) {
    return 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI';
  }
  if (nokta.includes('NENE HATUN')) {
    return 'NENE HATUN CADDESİ SERVİS GÜZERGAHI';
  }
  
  // Varsayılan olarak en yakın güzergahı belirle
  return 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI';
};

const compareEmployees = async () => {
  try {
    await connectDB();
    
    console.log('📊 CSV ve Veritabanı Karşılaştırması Başlıyor...\n');
    
    // CSV dosyasını oku
    const csvEmployees = parseCSV('/Users/zumerkekillioglu/Desktop/Canga/GENEL LİSTE-Tablo 1.csv');
    console.log(`📋 CSV'den okunan çalışan sayısı: ${csvEmployees.length}\n`);
    
    // Veritabanındaki çalışanları getir
    const dbEmployees = await Employee.find({}).select('tcNo adSoyad durum');
    console.log(`💾 Veritabanındaki çalışan sayısı: ${dbEmployees.length}\n`);
    
    // TC numaralarını set'e çevir (hızlı arama için)
    const dbTCNumbers = new Set(dbEmployees.map(emp => emp.tcNo).filter(tc => tc));
    
    console.log('🔍 TC Kimlik Numarası Karşılaştırması:\n');
    
    // CSV'deki çalışanları kontrol et
    const missingEmployees = [];
    const existingEmployees = [];
    
    csvEmployees.forEach((csvEmp, index) => {
      if (dbTCNumbers.has(csvEmp.tcNo)) {
        existingEmployees.push(csvEmp);
        console.log(`✅ ${csvEmp.adSoyad} (${csvEmp.tcNo}) - Sistemde mevcut`);
      } else {
        missingEmployees.push(csvEmp);
        console.log(`❌ ${csvEmp.adSoyad} (${csvEmp.tcNo}) - Sistemde YOK`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 KARŞILAŞTIRMA SONUÇLARI:');
    console.log('='.repeat(80));
    console.log(`📋 CSV'deki toplam çalışan: ${csvEmployees.length}`);
    console.log(`✅ Sistemde mevcut olan: ${existingEmployees.length}`);
    console.log(`❌ Sistemde eksik olan: ${missingEmployees.length}`);
    console.log('='.repeat(80));
    
    if (missingEmployees.length > 0) {
      console.log('\n🚨 SİSTEMDE EKSİK OLAN ÇALIŞANLAR:');
      console.log('─'.repeat(100));
      console.log('Sıra\tAd Soyad\t\t\tTC Kimlik No\tGörev\t\t\tServis Noktası');
      console.log('─'.repeat(100));
      
      missingEmployees.forEach((emp, index) => {
        const name = emp.adSoyad.padEnd(25);
        const gorev = (emp.gorev || '').padEnd(20);
        const servis = emp.servisBinisNoktasi || '';
        console.log(`${(index + 1).toString().padStart(3)}\t${name}\t${emp.tcNo}\t${gorev}\t${servis}`);
      });
      
      // Eksik çalışanları sisteme ekleme için hazırla
      const employeesToAdd = missingEmployees.map((csvEmp, index) => ({
        employeeId: `CSV-${(index + 1).toString().padStart(3, '0')}`,
        adSoyad: csvEmp.adSoyad,
        tcNo: csvEmp.tcNo,
        cepTelefonu: csvEmp.cepNo,
        dogumTarihi: formatDate(csvEmp.dogumTarihi),
        iseGirisTarihi: formatDate(csvEmp.iseGirisTarihi),
        departman: mapDepartment(csvEmp.gorev),
        pozisyon: csvEmp.gorev,
        lokasyon: mapLocation(csvEmp.servisBinisNoktasi),
        durum: 'AKTIF',
        servisGuzergahi: mapServiceRoute(csvEmp.servisBinisNoktasi),
        durak: csvEmp.servisBinisNoktasi,
        csvData: csvEmp // Orijinal CSV verisi
      }));
      
      // JSON dosyasına kaydet
      const reportData = {
        summary: {
          csvTotal: csvEmployees.length,
          existingInDB: existingEmployees.length,
          missingInDB: missingEmployees.length,
          comparisonDate: new Date().toISOString()
        },
        missingEmployees: employeesToAdd,
        existingEmployees: existingEmployees.map(emp => ({
          adSoyad: emp.adSoyad,
          tcNo: emp.tcNo,
          gorev: emp.gorev
        }))
      };
      
      fs.writeFileSync('./employee_comparison_report.json', JSON.stringify(reportData, null, 2));
      console.log('\n💾 Karşılaştırma raporu employee_comparison_report.json dosyasına kaydedildi');
      
      console.log('\n🎯 SONRAKİ ADIMLAR:');
      console.log('1. Eksik çalışanların listesini gözden geçirin');
      console.log('2. Onayınızla birlikte eksik çalışanları sisteme ekleyebilirim');
      console.log('3. Servis güzergahı atamaları kontrol edilebilir');
      
    } else {
      console.log('\n🎉 Tebrikler! CSV\'deki tüm çalışanlar sistemde mevcut.');
    }
    
  } catch (error) {
    console.error('❌ Karşılaştırma hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
compareEmployees();
const mongoose = require('mongoose');
const fs = require('fs');
const Employee = require('./models/Employee');
const AnnualLeave = require('./models/AnnualLeave');

// Tarih parse fonksiyonu
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Farklı tarih formatlarını destekle
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // M/D/YYYY veya MM/DD/YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // D.M.YYYY veya DD.MM.YYYY
    /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
  ];
  
  for (let format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let day, month, year;
      if (dateStr.includes('/')) {
        // Amerikan formatı M/D/YYYY
        month = parseInt(match[1]);
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else {
        // Türk formatı D.M.YYYY
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      }
      
      // Geçerli tarih kontrolü
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2030) {
        return new Date(year, month - 1, day);
      }
    }
  }
  
  return null;
}

// CSV okuma fonksiyonu
function parseCSV(content) {
  const lines = content.split('\n');
  const employees = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === '""') continue;
    
    // Tırnak işaretlerini kaldır ve virgülle böl
    let cleanLine = line;
    if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
      cleanLine = cleanLine.slice(1, -1);
    }
    
    const fields = cleanLine.split(',');
    
    if (fields.length >= 3) {
      const [no, name, birthDate, startDate] = fields;
      if (name && name.trim() !== '') {
        employees.push({
          no: parseInt(no) || 0,
          name: name.trim(),
          birthDate: parseDate(birthDate ? birthDate.trim() : ''),
          startDate: parseDate(startDate ? startDate.trim() : '')
        });
      }
    }
  }
  
  return employees;
}

// TSV okuma fonksiyonu
function parseTSV(content) {
  const lines = content.split('\n');
  const leaveData = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = line.split('\t');
    if (fields.length >= 4) {
      const [no, name, birthDate, startDate, ...years] = fields;
      if (name && name !== '') {
        const leaveByYear = {};
        const yearHeaders = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029'];
        
        for (let j = 0; j < yearHeaders.length && j < years.length; j++) {
          const usedDays = parseInt(years[j]) || 0;
          if (usedDays > 0) {
            leaveByYear[yearHeaders[j]] = {
              year: parseInt(yearHeaders[j]),
              entitled: usedDays <= 14 ? 14 : (usedDays <= 20 ? 20 : usedDays),
              used: usedDays,
              remaining: Math.max(0, (usedDays <= 14 ? 14 : (usedDays <= 20 ? 20 : usedDays)) - usedDays)
            };
          }
        }
        
        leaveData.push({
          no: parseInt(no) || 0,
          name: name,
          birthDate: parseDate(birthDate),
          startDate: parseDate(startDate),
          leaveByYear: leaveByYear
        });
      }
    }
  }
  
  return leaveData;
}

async function updateEmployeeDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/canga-vardiya');
    console.log('Veritabanına bağlandı');
    
    // Mevcut çalışanları temizle
    await Employee.deleteMany({});
    await AnnualLeave.deleteMany({});
    console.log('Mevcut veriler temizlendi');
    
    // CSV dosyasını oku
    const csvContent = fs.readFileSync('/Users/zumerkekillioglu/Downloads/y/Canga/Canga/csv - Sayfa1.csv', 'utf8');
    const employees = parseCSV(csvContent);
    console.log(`CSV'den ${employees.length} çalışan okundu`);
    
    // TSV dosyasını oku (izin verileri için)
    const tsvContent = fs.readFileSync('/Users/zumerkekillioglu/Downloads/y/Canga/Canga/izinler.tsv', 'utf8');
    const leaveData = parseTSV(tsvContent);
    console.log(`TSV'den ${leaveData.length} çalışanın izin verisi okundu`);
    
    // Çalışanları veritabanına ekle
    let successCount = 0;
    let errorCount = 0;
    
    for (const emp of employees) {
      try {
        // TC No oluştur (rastgele)
        const tcNo = '1' + Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        
        const employee = new Employee({
          adSoyad: emp.name,
          tcNo: tcNo,
          cepTelefonu: '05' + Math.floor(Math.random() * 900000000 + 100000000).toString(),
          dogumTarihi: emp.birthDate,
          iseGirisTarihi: emp.startDate || new Date('2014-01-01'), // Eğer tarih yoksa 2014'e set et
          pozisyon: 'Çalışan',
          lokasyon: 'MERKEZ',
          durum: 'AKTIF'
        });
        
        await employee.save();
        
        // İzin verilerini ekle
        const empLeaveData = leaveData.find(l => l.name === emp.name);
        if (empLeaveData && Object.keys(empLeaveData.leaveByYear).length > 0) {
          const annualLeave = new AnnualLeave({
            employeeId: employee._id,
            leaveByYear: empLeaveData.leaveByYear,
            totalLeaveStats: {
              totalEntitled: Object.values(empLeaveData.leaveByYear).reduce((sum, year) => sum + year.entitled, 0),
              totalUsed: Object.values(empLeaveData.leaveByYear).reduce((sum, year) => sum + year.used, 0),
              totalRemaining: Object.values(empLeaveData.leaveByYear).reduce((sum, year) => sum + year.remaining, 0)
            }
          });
          
          await annualLeave.save();
        }
        
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`${successCount} çalışan başarıyla eklendi...`);
        }
      } catch (error) {
        console.error(`${emp.name} eklenirken hata:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n=== SONUÇ ===`);
    console.log(`Başarıyla eklenen: ${successCount}`);
    console.log(`Hata olan: ${errorCount}`);
    
    // Problemli kayıtları kontrol et
    const allEmployees = await Employee.find({});
    const problematic = allEmployees.filter(emp => 
      !emp.dogumTarihi || !emp.iseGirisTarihi || emp.yas === null || emp.yas === undefined
    );
    
    console.log(`\n=== PROBLEMLİ KAYITLAR (${problematic.length}) ===`);
    problematic.forEach(emp => {
      console.log(`${emp.adSoyad}:`);
      if (!emp.dogumTarihi) console.log('  - Doğum tarihi eksik');
      if (!emp.iseGirisTarihi) console.log('  - İşe giriş tarihi eksik');
      if (emp.yas === null || emp.yas === undefined) console.log('  - Yaş hesaplanamıyor');
    });
    
    // Erdem Kamil Yıldırım'ı özel olarak kontrol et
    const erdem = await Employee.findOne({ adSoyad: /ERDEM.*YILDIRIM/i });
    if (erdem) {
      console.log(`\n=== ERDEM KAMİL YILDIRIM KONTROL ===`);
      console.log(`Ad Soyad: ${erdem.adSoyad}`);
      console.log(`Yaş: ${erdem.yas}`);
      console.log(`Doğum Tarihi: ${erdem.dogumTarihi ? erdem.dogumTarihi.toISOString().split('T')[0] : 'YOK'}`);
      console.log(`İşe Giriş: ${erdem.iseGirisTarihi ? erdem.iseGirisTarihi.toISOString().split('T')[0] : 'YOK'}`);
    }
    
  } catch (error) {
    console.error('Genel hata:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateEmployeeDatabase();
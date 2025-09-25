const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Employee model import
const Employee = require('./models/Employee');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// CSV dosyasını okuma fonksiyonu
const readFormerEmployeesCSV = () => {
  const csvPath = path.join(__dirname, '..', 'İŞTEN AYRILANLAR-Tablo 1.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  
  const formerEmployees = [];
  
  // Header satırlarını atla (ilk 2 satır)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(';;;')) continue;
    
    const columns = line.split(';');
    if (columns.length >= 4 && columns[2] && columns[3]) {
      const employee = {
        siraNo: columns[0],
        ayrilistarihi: columns[1],
        adSoyad: columns[2].trim(),
        tcNo: columns[3].trim(),
        telefon: columns[4] || '',
        dogumTarihi: columns[5] || '',
        iseGirisTarihi: columns[6] || '',
        adres: columns[7] || ''
      };
      
      // TC numarası geçerli ise ekle
      if (employee.tcNo && employee.tcNo.length >= 10) {
        formerEmployees.push(employee);
      }
    }
  }
  
  return formerEmployees;
};

// Ana analiz fonksiyonu
const analyzeConflicts = async () => {
  try {
    await connectDB();
    
    console.log('📊 İşten ayrılanlar ve aktif çalışanlar çakışma analizi başlıyor...\n');
    
    // 1. İşten ayrılanları CSV'den oku
    const formerEmployees = readFormerEmployeesCSV();
    console.log(`📋 İşten ayrılanlar CSV'sinde ${formerEmployees.length} kayıt bulundu`);
    
    // 2. Aktif çalışanları veritabanından çek
    const activeEmployees = await Employee.find({ durum: 'AKTIF' }).select('adSoyad tcNo employeeId');
    console.log(`👥 Veritabanında ${activeEmployees.length} aktif çalışan bulundu\n`);
    
    // 3. TC numarası bazında çakışma analizi
    const conflicts = [];
    const activeEmployeeTCs = new Set(activeEmployees.map(emp => emp.tcNo));
    
    formerEmployees.forEach(formerEmp => {
      if (activeEmployeeTCs.has(formerEmp.tcNo)) {
        // Aktif çalışan bilgisini bul
        const activeEmp = activeEmployees.find(emp => emp.tcNo === formerEmp.tcNo);
        conflicts.push({
          tcNo: formerEmp.tcNo,
          formerEmployee: {
            adSoyad: formerEmp.adSoyad,
            ayrilistarihi: formerEmp.ayrilistarihi,
            siraNo: formerEmp.siraNo
          },
          activeEmployee: {
            adSoyad: activeEmp.adSoyad,
            employeeId: activeEmp.employeeId
          }
        });
      }
    });
    
    console.log('🔍 ÇAKIŞMA ANALİZİ SONUÇLARI:');
    console.log('=' * 50);
    
    if (conflicts.length === 0) {
      console.log('✅ Hiçbir çakışma bulunamadı. Tüm işten ayrılanlar gerçekten ayrılmış durumda.');
    } else {
      console.log(`⚠️  ${conflicts.length} çakışma tespit edildi:\n`);
      
      conflicts.forEach((conflict, index) => {
        console.log(`${index + 1}. ÇAKIŞMA:`);
        console.log(`   TC No: ${conflict.tcNo}`);
        console.log(`   İşten Ayrılan: ${conflict.formerEmployee.adSoyad} (Ayrılış: ${conflict.formerEmployee.ayrilistarihi})`);
        console.log(`   Aktif Çalışan: ${conflict.activeEmployee.adSoyad} (ID: ${conflict.activeEmployee.employeeId})`);
        console.log('');
      });
      
      // Sadullah AKBAYIR'ı özel olarak kontrol et
      const sadullahConflict = conflicts.find(c => 
        c.formerEmployee.adSoyad.includes('Sadullah') || 
        c.formerEmployee.adSoyad.includes('AKBAYIR')
      );
      
      if (sadullahConflict) {
        console.log('🎯 Sadullah AKBAYIR çakışması tespit edildi:');
        console.log(`   TC: ${sadullahConflict.tcNo}`);
        console.log(`   Ayrılış tarihi: ${sadullahConflict.formerEmployee.ayrilistarihi}`);
        console.log(`   Şu anda aktif: ${sadullahConflict.activeEmployee.adSoyad}\n`);
      }
    }
    
    // 4. Çakışan TC numaralarını dosyaya kaydet
    if (conflicts.length > 0) {
      const conflictTCs = conflicts.map(c => c.tcNo);
      const reportData = {
        analysisDate: new Date().toISOString(),
        totalConflicts: conflicts.length,
        conflictingTCs: conflictTCs,
        detailedConflicts: conflicts
      };
      
      const reportPath = path.join(__dirname, 'former_employees_conflict_report.json');
      fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
      console.log(`📄 Detaylı rapor kaydedildi: ${reportPath}`);
    }
    
    console.log('\n📊 ÖZET:');
    console.log(`   İşten ayrılanlar: ${formerEmployees.length}`);
    console.log(`   Aktif çalışanlar: ${activeEmployees.length}`);
    console.log(`   Çakışan kayıtlar: ${conflicts.length}`);
    
    return conflicts;
    
  } catch (error) {
    console.error('❌ Analiz hatası:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
if (require.main === module) {
  analyzeConflicts();
}

module.exports = { analyzeConflicts };
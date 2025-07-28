const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Employee = require('../models/Employee');
const AnnualLeave = require('../models/AnnualLeave');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/canga', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// Yaş hesaplama fonksiyonu
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// Hizmet yılı hesaplama fonksiyonu
function calculateYearsOfService(hireDate) {
  if (!hireDate) return null;
  
  const today = new Date();
  const hire = new Date(hireDate);
  
  let years = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
    years--;
  }
  
  return years;
}

// İzin hesaplama fonksiyonu
function calculateEntitledLeaveDays(employee, year) {
  if (!employee.dogumTarihi || !employee.iseGirisTarihi) {
    return 0;
  }
  
  const birthDate = new Date(employee.dogumTarihi);
  const hireDate = new Date(employee.iseGirisTarihi);
  const checkDate = new Date(year, 0, 1);
  
  const age = checkDate.getFullYear() - birthDate.getFullYear();
  let yearsOfService = checkDate.getFullYear() - hireDate.getFullYear();
  
  if (checkDate.getFullYear() === hireDate.getFullYear()) {
    return 0;
  }
  
  const monthDiff = checkDate.getMonth() - hireDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && checkDate.getDate() < hireDate.getDate())) {
    yearsOfService--;
  }
  
  // İzin kuralları
  if (age >= 50) {
    return yearsOfService > 0 ? 20 : 0;
  } else {
    if (yearsOfService <= 0) {
      return 0;
    } else if (yearsOfService <= 5) {
      return 14;
    } else {
      return 20;
    }
  }
}

// CSV dosyasını oku ve veritabanına kaydet
const importCSVData = async () => {
  try {
    console.log('📊 CSV verilerini içe aktarma başlıyor...');
    
    // CSV dosyası yolu (proje kök dizininde olduğunu varsayıyoruz)
    const csvFilePath = path.join(__dirname, '../../data/employees.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.log('⚠️  CSV dosyası bulunamadı. Örnek veri oluşturuluyor...');
      await createSampleData();
      return;
    }
    
    const employees = [];
    
    // CSV dosyasını oku
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          employees.push(row);
        })
        .on('end', () => {
          console.log(`📄 ${employees.length} çalışan verisi okundu`);
          resolve();
        })
        .on('error', reject);
    });
    
    // Veritabanını temizle
    await Employee.deleteMany({});
    await AnnualLeave.deleteMany({});
    console.log('🗑️  Mevcut veriler temizlendi');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Her çalışan için işlem yap
    for (const empData of employees) {
      try {
        // Çalışan kaydı oluştur
        const employee = new Employee({
          employeeId: empData.employeeId || `EMP${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
          adSoyad: empData.adSoyad || empData.name || 'İsimsiz Çalışan',
          dogumTarihi: empData.dogumTarihi ? new Date(empData.dogumTarihi) : new Date('1980-01-01'),
          iseGirisTarihi: empData.iseGirisTarihi ? new Date(empData.iseGirisTarihi) : new Date('2020-01-01'),
          departman: empData.departman || 'Genel',
          durum: 'AKTIF'
        });
        
        await employee.save();
        
        // İzin hesaplaması yap
        const currentYear = new Date().getFullYear();
        const leaveByYear = [];
        let totalEntitled = 0;
        
        // Son 5 yıl için izin hesapla
        for (let year = currentYear - 4; year <= currentYear; year++) {
          const entitledDays = calculateEntitledLeaveDays(employee, year);
          
          if (entitledDays > 0) {
            // Rastgele kullanılan izin (0 ile hak edilen arasında)
            const usedDays = Math.floor(Math.random() * (entitledDays + 1));
            
            leaveByYear.push({
              year,
              entitled: entitledDays,
              used: usedDays,
              entitlementDate: new Date(year, 0, 1),
              leaveRequests: usedDays > 0 ? [{
                startDate: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                endDate: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                days: usedDays,
                status: 'ONAYLANDI',
                notes: 'Otomatik oluşturulan izin kaydı'
              }] : []
            });
            
            totalEntitled += entitledDays;
          }
        }
        
        // İzin kaydı oluştur
        const totalUsed = leaveByYear.reduce((sum, year) => sum + year.used, 0);
        
        const annualLeave = new AnnualLeave({
          employeeId: employee._id,
          leaveByYear,
          totalLeaveStats: {
            totalEntitled,
            totalUsed,
            remaining: totalEntitled - totalUsed
          },
          lastCalculationDate: new Date()
        });
        
        await annualLeave.save();
        
        successCount++;
        console.log(`✅ ${employee.adSoyad} - İzin kaydı oluşturuldu`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ ${empData.adSoyad || 'Bilinmeyen'} için hata:`, error.message);
      }
    }
    
    console.log(`\n📊 İçe aktarma tamamlandı:`);
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ CSV içe aktarma hatası:', error);
  }
};

// Örnek veri oluştur
const createSampleData = async () => {
  try {
    console.log('📝 Örnek veri oluşturuluyor...');
    
    // Mevcut verileri temizle
    await Employee.deleteMany({});
    await AnnualLeave.deleteMany({});
    
    const sampleEmployees = [
      {
        employeeId: 'EMP001',
        adSoyad: 'Ahmet Yılmaz',
        tcNo: '12345678901',
        cepTelefonu: '05551234567',
        dogumTarihi: new Date('1975-03-15'),
        iseGirisTarihi: new Date('2015-01-10'),
        departman: 'Bilgi İşlem',
        pozisyon: 'Yazılım Uzmanı',
        lokasyon: 'MERKEZ'
      },
      {
        employeeId: 'EMP002',
        adSoyad: 'Fatma Kaya',
        tcNo: '12345678902',
        cepTelefonu: '05551234568',
        dogumTarihi: new Date('1985-07-22'),
        iseGirisTarihi: new Date('2018-05-15'),
        departman: 'İnsan Kaynakları',
        pozisyon: 'İK Uzmanı',
        lokasyon: 'MERKEZ'
      },
      {
        employeeId: 'EMP003',
        adSoyad: 'Mehmet Demir',
        tcNo: '12345678903',
        cepTelefonu: '05551234569',
        dogumTarihi: new Date('1970-11-08'),
        iseGirisTarihi: new Date('2010-03-01'),
        departman: 'Muhasebe',
        pozisyon: 'Muhasebe Uzmanı',
        lokasyon: 'MERKEZ'
      },
      {
        employeeId: 'EMP004',
        adSoyad: 'Ayşe Şahin',
        tcNo: '12345678904',
        cepTelefonu: '05551234570',
        dogumTarihi: new Date('1990-02-14'),
        iseGirisTarihi: new Date('2020-09-01'),
        departman: 'Pazarlama',
        pozisyon: 'Pazarlama Uzmanı',
        lokasyon: 'İŞL'
      },
      {
        employeeId: 'EMP005',
        adSoyad: 'Ali Özkan',
        tcNo: '12345678905',
        cepTelefonu: '05551234571',
        dogumTarihi: new Date('1965-12-25'),
        iseGirisTarihi: new Date('2005-06-15'),
        departman: 'Üretim',
        pozisyon: 'Üretim Operatörü',
        lokasyon: 'OSB'
      }
    ];
    
    let successCount = 0;
    
    for (const empData of sampleEmployees) {
      try {
        // Çalışan oluştur
        const employee = new Employee({
          ...empData,
          durum: 'AKTIF'
        });
        
        await employee.save();
        
        // İzin hesaplaması
        const currentYear = new Date().getFullYear();
        const leaveByYear = [];
        let totalEntitled = 0;
        
        for (let year = currentYear - 4; year <= currentYear; year++) {
          const entitledDays = calculateEntitledLeaveDays(employee, year);
          
          if (entitledDays > 0) {
            const usedDays = Math.floor(Math.random() * (entitledDays + 1));
            
            leaveByYear.push({
              year,
              entitled: entitledDays,
              used: usedDays,
              entitlementDate: new Date(year, 0, 1),
              leaveRequests: usedDays > 0 ? [{
                startDate: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                endDate: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                days: usedDays,
                status: 'ONAYLANDI',
                notes: 'Örnek izin kaydı'
              }] : []
            });
            
            totalEntitled += entitledDays;
          }
        }
        
        const totalUsed = leaveByYear.reduce((sum, year) => sum + year.used, 0);
        
        const annualLeave = new AnnualLeave({
          employeeId: employee._id,
          leaveByYear,
          totalLeaveStats: {
            totalEntitled,
            totalUsed,
            remaining: totalEntitled - totalUsed
          },
          lastCalculationDate: new Date()
        });
        
        await annualLeave.save();
        
        successCount++;
        console.log(`✅ ${employee.adSoyad} - Örnek veri oluşturuldu`);
        
      } catch (error) {
        console.error(`❌ ${empData.adSoyad} için hata:`, error.message);
      }
    }
    
    console.log(`\n📊 Örnek veri oluşturma tamamlandı: ${successCount} çalışan`);
    
  } catch (error) {
    console.error('❌ Örnek veri oluşturma hatası:', error);
  }
};

// Script çalıştır
const main = async () => {
  await connectDB();
  await importCSVData();
  
  console.log('\n🎉 İşlem tamamlandı!');
  process.exit(0);
};

// Eğer bu dosya doğrudan çalıştırılıyorsa
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  });
}

module.exports = { importCSVData, createSampleData };
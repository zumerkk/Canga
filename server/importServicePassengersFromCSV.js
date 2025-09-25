const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

// MongoDB bağlantısı
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thebestkekilli:2002.2002@canga.rgadvdl.mongodb.net/canga?retryWrites=true&w=majority&appName=canga';

// CSV dosyalarının bulunduğu klasör
const CSV_FOLDER = path.join(__dirname, '..', 'serviscsv');

// CSV dosyalarından çalışan verilerini parse et
const parseCSVFile = (filePath, routeName) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const employees = [];
  let isEmployeeSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Çalışan listesi başlangıcını bul
    if (line.includes('PERSONEL İSİM SOYİSİM') || line.includes('PERSONEL İSİM SOYİSİM')) {
      isEmployeeSection = true;
      continue;
    }
    
    // Çalışan verilerini parse et
    if (isEmployeeSection && line) {
      const parts = line.split(';');
      if (parts.length >= 3) {
        const fullName = parts[0]?.trim();
        const stopName = parts[1]?.trim();
        const orderNumber = parts[2]?.trim();
        
        // Boş veya geçersiz kayıtları atla
        if (fullName && fullName !== '-' && fullName !== 'PERSONEL İSİM SOYİSİM') {
          employees.push({
            fullName,
            stopName: stopName === '-' ? '' : stopName,
            orderNumber: parseInt(orderNumber) || 0,
            routeName
          });
        }
      }
    }
  }
  
  return employees;
};

// Ana fonksiyon
const importServicePassengers = async () => {
  try {
    console.log('🚌 CSV dosyalarından servis yolcularını içe aktarma başlıyor...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
    
    // CSV dosyaları ve karşılık gelen güzergah isimleri
    const csvFiles = [
      {
        file: '50.YIL BLOKLARI - DİSPANSER-Tablo 1.csv',
        routeName: '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI'
      },
      {
        file: 'Bahçelievler-Karşıyaka-Tablo 1.csv',
        routeName: 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI'
      },
      {
        file: 'Çallıöz Mahallesi-Tablo 1.csv',
        routeName: 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI'
      },
      {
        file: 'ETİLER KARACALİ CADDESİ-Tablo 1.csv',
        routeName: 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI'
      },
      {
        file: 'nenehatun.csv',
        routeName: 'NENE HATUN CADDESİ SERVİS GÜZERGAHI'
      },
      {
        file: 'OSMANGAZİ - ÇARŞI MERKEZ-Tablo 1.csv',
        routeName: 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI'
      }
    ];
    
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    // Her CSV dosyasını işle
    for (const csvFile of csvFiles) {
      const filePath = path.join(CSV_FOLDER, csvFile.file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Dosya bulunamadı: ${csvFile.file}`);
        continue;
      }
      
      console.log(`\n📄 İşleniyor: ${csvFile.file}`);
      console.log(`🚌 Güzergah: ${csvFile.routeName}`);
      
      // Güzergahı bul
      const route = await ServiceRoute.findOne({ routeName: csvFile.routeName });
      if (!route) {
        console.log(`❌ Güzergah bulunamadı: ${csvFile.routeName}`);
        continue;
      }
      
      // CSV'den çalışanları parse et
      const employees = parseCSVFile(filePath, csvFile.routeName);
      console.log(`👥 Bulunan çalışan sayısı: ${employees.length}`);
      
      // Her çalışanı işle
      for (const empData of employees) {
        try {
          totalProcessed++;
          
          // Çalışanı ada göre ara (tam eşleşme)
          let employee = await Employee.findOne({ 
            adSoyad: empData.fullName,
            durum: { $ne: 'AYRILDI' }
          });
          
          if (employee) {
            // Mevcut çalışanı güncelle
            employee.servisGuzergahi = empData.routeName;
            employee.durak = empData.stopName;
            employee.serviceInfo = {
              usesService: true,
              routeName: empData.routeName,
              stopName: empData.stopName,
              routeId: route._id,
              orderNumber: empData.orderNumber,
              usesOwnCar: false
            };
            employee.updatedAt = new Date();
            
            await employee.save();
            totalUpdated++;
            console.log(`✅ Güncellendi: ${empData.fullName} -> ${empData.stopName}`);
            
          } else {
            // Yeni çalışan oluştur
            const newEmployee = new Employee({
              adSoyad: empData.fullName,
              pozisyon: 'Çalışan', // Varsayılan pozisyon
              lokasyon: 'MERKEZ', // Varsayılan lokasyon
              departman: 'GENEL', // Varsayılan departman
              servisGuzergahi: empData.routeName,
              durak: empData.stopName,
              serviceInfo: {
                usesService: true,
                routeName: empData.routeName,
                stopName: empData.stopName,
                routeId: route._id,
                orderNumber: empData.orderNumber,
                usesOwnCar: false
              },
              durum: 'AKTIF'
            });
            
            await newEmployee.save();
            totalCreated++;
            console.log(`🆕 Oluşturuldu: ${empData.fullName} -> ${empData.stopName}`);
          }
          
        } catch (error) {
          totalErrors++;
          console.error(`❌ Hata (${empData.fullName}):`, error.message);
        }
      }
    }
    
    console.log(`\n📊 İçe aktarma tamamlandı!`);
    console.log(`📈 Toplam işlenen: ${totalProcessed}`);
    console.log(`🆕 Yeni oluşturulan: ${totalCreated}`);
    console.log(`✅ Güncellenen: ${totalUpdated}`);
    console.log(`❌ Hata sayısı: ${totalErrors}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Genel hata:', error);
    process.exit(1);
  }
};

// Scripti çalıştır
importServicePassengers();
require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// MongoDB Bağlantı Bilgileri
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://thebestkekilli:2002.2002@canga.rgadvdl.mongodb.net/canga?retryWrites=true&w=majority&appName=canga';

// Test Verisi Ayarları
const TARGET_DATE = new Date('2025-11-19T00:00:00.000Z');
const RECORD_COUNT = 25;

// Rastgele Yardımcı Fonksiyonlar
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const LOCATIONS = ['MERKEZ', 'İŞL', 'OSB', 'İŞIL'];
const METHODS = ['MOBILE', 'CARD', 'TABLET'];

// Senaryo Oluşturma
const createScenario = (persona) => {
  // Base tarih: 19 Kasım 2025
  const baseDate = new Date(TARGET_DATE);
  
  const checkIn = new Date(baseDate);
  const checkOut = new Date(baseDate);
  let status = 'NORMAL';
  let isMissingCheckout = false;

  switch (persona) {
    case 'NORMAL':
      // 07:40 - 07:59 arası giriş
      checkIn.setHours(7, getRandomInt(40, 59), 0);
      // 18:00 - 18:15 arası çıkış
      checkOut.setHours(18, getRandomInt(0, 15), 0);
      break;

    case 'LATE':
      // 08:10 - 09:30 arası giriş
      checkIn.setHours(8, getRandomInt(10, 59), 0);
      // 18:00 - 18:30 arası çıkış
      checkOut.setHours(18, getRandomInt(0, 30), 0);
      status = 'LATE';
      break;

    case 'EARLY_LEAVE':
      // 07:50 - 08:00 arası giriş
      checkIn.setHours(7, getRandomInt(50, 59), 0);
      // 16:00 - 17:30 arası çıkış
      checkOut.setHours(16, getRandomInt(0, 59), 0); // 16:xx veya 17:xx olması için basit mantık
      if (Math.random() > 0.5) checkOut.setHours(17, getRandomInt(0, 30), 0);
      status = 'EARLY_LEAVE';
      break;

    case 'MISSING_CHECKOUT':
      // 07:50 - 08:05 arası giriş
      checkIn.setHours(7, getRandomInt(50, 59), 0);
      if (Math.random() > 0.7) checkIn.setHours(8, getRandomInt(0, 5), 0);
      isMissingCheckout = true;
      status = 'INCOMPLETE';
      break;

    case 'OVERTIME':
      // 07:45 - 08:00 arası giriş
      checkIn.setHours(7, getRandomInt(45, 59), 0);
      // 19:30 - 21:00 arası çıkış
      checkOut.setHours(19, getRandomInt(30, 59), 0);
      if (Math.random() > 0.5) checkOut.setHours(20, getRandomInt(0, 59), 0);
      break;
      
    case 'SCATTERED': // Karışık saatler (şüpheli durumlar için)
       checkIn.setHours(getRandomInt(6, 10), getRandomInt(0,59));
       checkOut.setHours(getRandomInt(15, 20), getRandomInt(0,59));
       break;
  }

  return { checkIn, checkOut, status, isMissingCheckout };
};

const generateData = async () => {
  try {
    console.log('🔌 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Bağlantı başarılı.');

    // Aktif çalışanları bul
    console.log('👥 Aktif çalışanlar getiriliyor...');
    const employees = await Employee.find({ durum: 'AKTIF' }).limit(RECORD_COUNT);

    if (employees.length === 0) {
      console.error('❌ Hiç aktif çalışan bulunamadı! Lütfen önce çalışan ekleyin.');
      process.exit(1);
    }

    console.log(`📝 ${employees.length} çalışan için kayıt oluşturuluyor (Tarih: 19.11.2025)...`);

    const attendanceRecords = [];
    
    // Senaryo havuzu (25 kişi için dağılım)
    const scenarios = [
        ...Array(10).fill('NORMAL'),
        ...Array(5).fill('LATE'),
        ...Array(3).fill('EARLY_LEAVE'),
        ...Array(3).fill('MISSING_CHECKOUT'),
        ...Array(2).fill('OVERTIME'),
        ...Array(2).fill('SCATTERED')
    ];

    // Karıştır
    scenarios.sort(() => Math.random() - 0.5);

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const scenarioType = scenarios[i] || 'NORMAL';
      const { checkIn, checkOut, status, isMissingCheckout } = createScenario(scenarioType);

      const method = getRandomElement(METHODS);
      const location = emp.lokasyon || getRandomElement(LOCATIONS);

      const record = {
        employeeId: emp._id,
        date: TARGET_DATE,
        checkIn: {
          time: checkIn,
          method: method,
          location: location,
          deviceId: 'TEST_SCRIPT_DEV',
          ipAddress: '127.0.0.1'
        },
        status: status
      };

      if (!isMissingCheckout) {
        record.checkOut = {
          time: checkOut,
          method: method, // Genelde aynı yöntemle çıkarlar
          location: location,
          deviceId: 'TEST_SCRIPT_DEV'
        };
      }
      
      // Model'in pre-save hook'u hesaplamaları yapacak (workDuration vb.)
      attendanceRecords.push(record);
    }

    // Önce temizle (Duplicate olmasın diye o günkü kayıtları siliyoruz)
    await Attendance.deleteMany({ 
        date: { 
            $gte: TARGET_DATE, 
            $lt: new Date(TARGET_DATE.getTime() + 24 * 60 * 60 * 1000) 
        },
        employeeId: { $in: employees.map(e => e._id) }
    });
    
    console.log('🧹 Eski test verileri temizlendi (varsa).');

    // Toplu Kayıt (Tek tek save yaparak pre-save hook'ların çalışmasını sağlıyoruz)
    console.log('💾 Kayıtlar veritabanına işleniyor...');
    let savedCount = 0;
    for (const recordData of attendanceRecords) {
        const att = new Attendance(recordData);
        // Beklenen mesai saatlerini ekleyelim ki hesaplamalar doğru çalışsın
        const expectedIn = new Date(recordData.date);
        expectedIn.setHours(8, 0, 0);
        const expectedOut = new Date(recordData.date);
        expectedOut.setHours(18, 0, 0);
        
        att.expectedCheckIn = expectedIn;
        att.expectedCheckOut = expectedOut;
        
        await att.save();
        savedCount++;
    }

    console.log(`✅ ${savedCount} adet giriş-çıkış kaydı başarıyla oluşturuldu!`);
    console.log('🤖 AI analizi için hazır.');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Bağlantı kapatıldı.');
    process.exit(0);
  }
};

generateData();
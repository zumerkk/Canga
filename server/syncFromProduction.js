const mongoose = require('mongoose');
const axios = require('axios');
const Employee = require('./models/Employee');
require('dotenv').config();

// 🌐 Production API'sından veri çek ve localhost'a senkronize et
async function syncFromProduction() {
  try {
    console.log('🔄 Production server\'dan veri senkronizasyonu başlıyor...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
    console.log('✅ MongoDB bağlantısı başarılı');
    
    // 1️⃣ Aktif çalışanları çek
    console.log('📥 Aktif çalışanlar çekiliyor...');
    const activeResponse = await axios.get('https://canga-api.onrender.com/api/employees?limit=1000', {
      timeout: 30000
    });
    
    let activeEmployees = [];
    if (activeResponse.data.success && activeResponse.data.data) {
      activeEmployees = activeResponse.data.data;
      console.log(`✅ ${activeEmployees.length} aktif çalışan alındı`);
    } else {
      console.log('⚠️ Aktif çalışan verisi alınamadı');
    }
    
    // 2️⃣ İşten ayrılanları çek
    console.log('📥 İşten ayrılanlar çekiliyor...');
    let formerEmployees = [];
    try {
      const formerResponse = await axios.get('https://canga-api.onrender.com/api/employees/former?limit=500', {
        timeout: 30000
      });
      
      if (formerResponse.data.success && formerResponse.data.data) {
        formerEmployees = formerResponse.data.data;
        console.log(`✅ ${formerEmployees.length} işten ayrılan alındı`);
      }
    } catch (formerError) {
      console.log('⚠️ İşten ayrılanlar alınamadı, devam ediliyor...');
    }
    
    // 3️⃣ Tüm veriyi birleştir
    const allEmployees = [...activeEmployees, ...formerEmployees];
    console.log(`📊 Toplam ${allEmployees.length} çalışan (Aktif: ${activeEmployees.length}, Ayrılan: ${formerEmployees.length})`);
    
    if (allEmployees.length === 0) {
      console.log('❌ Hiç veri alınamadı!');
      return;
    }
    
    // 4️⃣ Mevcut verileri temizle
    console.log('🗑️ Mevcut veriler temizleniyor...');
    const deleteResult = await Employee.deleteMany({});
    console.log(`✅ ${deleteResult.deletedCount} mevcut kayıt silindi`);
    
    // 5️⃣ Yeni verileri kaydet
    let basarili = 0;
    let hatali = 0;
    const hatalar = [];
    
    for (let i = 0; i < allEmployees.length; i++) {
      const emp = allEmployees[i];
      
      try {
        // Production formatından localhost formatına dönüştür
        const employeeData = {
          employeeId: emp.employeeId || emp._id?.substr(-6) || `EMP${i.toString().padStart(3, '0')}`,
          adSoyad: emp.adSoyad || emp.name || emp.firstName + ' ' + emp.lastName || '',
          tcNo: emp.tcNo || undefined,
          cepTelefonu: emp.cepTelefonu || emp.phone || '',
          dogumTarihi: emp.dogumTarihi ? new Date(emp.dogumTarihi) : null,
          departman: emp.departman || emp.department || '',
          pozisyon: emp.pozisyon || emp.position || 'ÇALIŞAN',
          lokasyon: normalizeLokasyon(emp.lokasyon || emp.location),
          iseGirisTarihi: emp.iseGirisTarihi ? new Date(emp.iseGirisTarihi) : null,
          ayrilmaTarihi: emp.ayrilmaTarihi ? new Date(emp.ayrilmaTarihi) : null,
          ayrilmaSebebi: emp.ayrilmaSebebi || '',
          durum: emp.durum || emp.status || (emp.ayrilmaTarihi ? 'AYRILDI' : 'AKTIF'),
          servisGuzergahi: emp.servisGuzergahi || emp.serviceRoute || '',
          durak: emp.durak || emp.serviceStop || ''
        };
        
        // Zorunlu alanları kontrol et
        if (!employeeData.adSoyad || employeeData.adSoyad.trim() === '') {
          console.log(`⚠️ ${i + 1}. kayıt: Ad-Soyad eksik, atlanıyor`);
          hatali++;
          continue;
        }
        
        // TC No boşsa kaldır
        if (!employeeData.tcNo || employeeData.tcNo.trim() === '') {
          delete employeeData.tcNo;
        }
        
        // Yeni çalışan oluştur
        const employee = new Employee(employeeData);
        await employee.save();
        
        basarili++;
        const durumEmoji = employeeData.durum === 'AKTIF' ? '✅' : '❌';
        console.log(`${durumEmoji} ${basarili}. ${employeeData.adSoyad} - ${employeeData.durum}`);
        
      } catch (error) {
        hatali++;
        const errorMsg = `${i + 1}. kayıt (${emp.adSoyad || emp.name || 'İsimsiz'}): ${error.message}`;
        hatalar.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
    
    // 6️⃣ Rapor
    console.log('\n📊 SENKRONİZASYON RAPORU:');
    console.log(`✅ Başarılı: ${basarili} çalışan`);
    console.log(`❌ Hatalı: ${hatali} çalışan`);
    console.log(`📋 Toplam işlenen: ${allEmployees.length} çalışan`);
    
    // Durum dağılımı
    const durumDagilimi = await Employee.aggregate([
      { $group: { _id: '$durum', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Final durum dağılımı:');
    durumDagilimi.forEach(item => {
      console.log(`  ${item._id}: ${item.count} kişi`);
    });
    
    if (hatalar.length > 0) {
      console.log('\n❌ HATALAR:');
      hatalar.slice(0, 10).forEach(hata => console.log(`  - ${hata}`));
      if (hatalar.length > 10) {
        console.log(`  ... ve ${hatalar.length - 10} hata daha`);
      }
    }
    
  } catch (error) {
    console.error('❌ Senkronizasyon hatası:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB bağlantısı kapatıldı');
  }
}

// 📍 Lokasyon normalize et
function normalizeLokasyon(lokasyon) {
  if (!lokasyon) return 'MERKEZ';
  
  const l = lokasyon.toString().toUpperCase().trim();
  
  if (l.includes('İŞIL') || l.includes('IŞIL') || l.includes('ISIL')) return 'İŞIL';
  if (l.includes('İŞL') || l.includes('ISL')) return 'İŞL';
  if (l.includes('OSB')) return 'OSB';
  if (l.includes('MERKEZ')) return 'MERKEZ';
  
  return 'MERKEZ'; // Varsayılan
}

// Script çalıştırıldığında
if (require.main === module) {
  console.log('🚀 Production\'dan localhost\'a veri senkronizasyonu başlıyor...');
  syncFromProduction()
    .then(() => {
      console.log('\n🎉 Senkronizasyon tamamlandı!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal hata:', error);
      process.exit(1);
    });
}

module.exports = { syncFromProduction };

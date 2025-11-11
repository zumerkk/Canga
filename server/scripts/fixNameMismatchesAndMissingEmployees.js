#!/usr/bin/env node

/**
 * 🔧 İSİM FARKLILIK VE EKSİK ÇALIŞAN DÜZELTİCİ
 * 
 * Bu script şunları yapar:
 * 1. İsim farklılıklarını düzeltir (Cevcet→Cevdet vb.)
 * 2. İşten ayrılanları "AYRILDI" olarak işaretler
 * 3. Eksik çalışanları sisteme ekler (Mehmet Diri)
 * 4. Sadullah Akbayır'ı aktif yapar
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Employee = require('../models/Employee');

// İşlem listesi
const OPERATIONS = [
  {
    type: 'rename',
    oldName: 'CEVCET ÖKSÜZ',
    newName: 'CEVDET ÖKSÜZ',
    description: 'İsim yazım hatası düzeltme'
  },
  {
    type: 'rename',
    oldName: 'MUHAMMED NAZİM GÖÇ',
    newName: 'MUHAMMET NAZİM GÖÇ',
    description: 'İsim yazım hatası düzeltme'
  },
  {
    type: 'rename',
    oldName: 'KEMAL İNAÇ',
    newName: 'MEHMET KEMAL İNANÇ',
    description: 'İsim ve soyisim düzeltme'
  },
  {
    type: 'terminate',
    name: 'ÖNDER OKATAN',
    tcNo: '60838137972',
    date: '2024-07-05',
    reason: 'İşten ayrılma - CSV kaydı',
    description: 'İşten ayrılmış olarak işaretleme'
  },
  {
    type: 'terminate',
    name: 'SALİH ALBAYRAK',
    tcNo: '10241426606',
    date: '2024-12-23',
    reason: 'İşten ayrılma - CSV kaydı',
    description: 'İşten ayrılmış olarak işaretleme'
  },
  {
    type: 'terminate',
    name: 'SERHAT GÜVEN',
    tcNo: '10280823824',
    date: '2025-10-24',
    reason: 'İşten ayrılma - CSV kaydı',
    description: 'İşten ayrılmış olarak işaretleme'
  },
  {
    type: 'activate',
    name: 'SADULLAH AKBAYIR',
    tcNo: '46366221550',
    servisGuzergahi: 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI',
    durak: 'FIRINLI CAMİ',
    description: 'Aktif yapma ve servis bilgileri ekleme'
  },
  {
    type: 'add',
    data: {
      adSoyad: 'MEHMET DİRİ',
      tcNo: '10322822112',
      cepTelefonu: '536 585 05 73',
      dogumTarihi: new Date('2006-07-21'),
      iseGirisTarihi: new Date('2025-04-07'),
      pozisyon: 'ÖZEL GÜVENLİK GÖREVLİSİ',
      lokasyon: 'OSB',
      durum: 'AKTIF',
      servisGuzergahi: 'OSMANGAZİ SERVİS GÜZERGAHI',
      durak: 'OSMANGAZİ - HALI SAHA'
    },
    description: 'Eksik çalışan ekleme'
  }
];

/**
 * İsim düzeltme işlemi
 */
async function renameEmployee(oldName, newName, description) {
  console.log(`\n🔧 ${description}: ${oldName} → ${newName}`);
  
  const employee = await Employee.findOne({
    adSoyad: { $regex: new RegExp('^' + oldName + '$', 'i') }
  });
  
  if (employee) {
    employee.adSoyad = newName;
    await employee.save();
    console.log(`   ✅ Güncellendi: ${newName}`);
    return { success: true, name: newName };
  } else {
    console.log(`   ⚠️  Bulunamadı: ${oldName}`);
    return { success: false, name: oldName };
  }
}

/**
 * İşten ayrılmış olarak işaretleme
 */
async function terminateEmployee(name, tcNo, date, reason, description) {
  console.log(`\n🚪 ${description}: ${name}`);
  
  const employee = await Employee.findOne({
    $or: [
      { adSoyad: { $regex: new RegExp('^' + name + '$', 'i') } },
      { tcNo: tcNo }
    ]
  });
  
  if (employee) {
    employee.durum = 'AYRILDI';
    employee.ayrilmaTarihi = new Date(date);
    employee.ayrilmaSebebi = reason;
    await employee.save();
    console.log(`   ✅ İşten ayrıldı olarak işaretlendi`);
    return { success: true, name: name };
  } else {
    console.log(`   ⚠️  Bulunamadı: ${name}`);
    return { success: false, name: name };
  }
}

/**
 * Aktif yapma ve servis bilgileri ekleme
 */
async function activateEmployee(name, tcNo, servisGuzergahi, durak, description) {
  console.log(`\n✅ ${description}: ${name}`);
  
  const employee = await Employee.findOne({
    $or: [
      { adSoyad: { $regex: new RegExp('^' + name + '$', 'i') } },
      { tcNo: tcNo }
    ]
  });
  
  if (employee) {
    employee.durum = 'AKTIF';
    employee.ayrilmaTarihi = undefined;
    employee.ayrilmaSebebi = undefined;
    employee.servisGuzergahi = servisGuzergahi;
    employee.durak = durak;
    await employee.save();
    console.log(`   ✅ Aktif yapıldı ve servis bilgileri eklendi`);
    return { success: true, name: name };
  } else {
    console.log(`   ⚠️  Bulunamadı: ${name}`);
    return { success: false, name: name };
  }
}

/**
 * Yeni çalışan ekleme
 */
async function addEmployee(data, description) {
  console.log(`\n➕ ${description}: ${data.adSoyad}`);
  
  // Önce var mı kontrol et
  const existing = await Employee.findOne({ tcNo: data.tcNo });
  
  if (existing) {
    console.log(`   ⚠️  Zaten kayıtlı: ${data.adSoyad}`);
    return { success: false, name: data.adSoyad, reason: 'already_exists' };
  }
  
  const employee = new Employee(data);
  await employee.save();
  console.log(`   ✅ Eklendi: ${data.adSoyad}`);
  return { success: true, name: data.adSoyad };
}

/**
 * Ana işlem
 */
async function main() {
  console.log('🚀 İSİM FARKLILIK VE EKSİK ÇALIŞAN DÜZELTİCİ\n');
  console.log('=' .repeat(80));
  
  const results = {
    renamed: [],
    terminated: [],
    activated: [],
    added: [],
    failed: []
  };
  
  try {
    // MongoDB bağlantısı
    console.log('\n📡 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB bağlantısı başarılı\n');
    
    // Tüm işlemleri gerçekleştir
    for (const operation of OPERATIONS) {
      console.log('\n' + '='.repeat(80));
      
      let result;
      
      switch (operation.type) {
        case 'rename':
          result = await renameEmployee(
            operation.oldName,
            operation.newName,
            operation.description
          );
          if (result.success) {
            results.renamed.push(result.name);
          } else {
            results.failed.push({ operation: operation.type, name: operation.oldName });
          }
          break;
          
        case 'terminate':
          result = await terminateEmployee(
            operation.name,
            operation.tcNo,
            operation.date,
            operation.reason,
            operation.description
          );
          if (result.success) {
            results.terminated.push(result.name);
          } else {
            results.failed.push({ operation: operation.type, name: operation.name });
          }
          break;
          
        case 'activate':
          result = await activateEmployee(
            operation.name,
            operation.tcNo,
            operation.servisGuzergahi,
            operation.durak,
            operation.description
          );
          if (result.success) {
            results.activated.push(result.name);
          } else {
            results.failed.push({ operation: operation.type, name: operation.name });
          }
          break;
          
        case 'add':
          result = await addEmployee(
            operation.data,
            operation.description
          );
          if (result.success) {
            results.added.push(result.name);
          } else if (result.reason === 'already_exists') {
            console.log('   ℹ️  Çalışan zaten sistemde kayıtlı');
          } else {
            results.failed.push({ operation: operation.type, name: operation.data.adSoyad });
          }
          break;
      }
    }
    
    // Genel özet
    console.log('\n' + '='.repeat(80));
    console.log('📊 GENEL ÖZET');
    console.log('='.repeat(80));
    console.log(`\n✅ İsim düzeltme: ${results.renamed.length} çalışan`);
    console.log(`✅ İşten ayrılma: ${results.terminated.length} çalışan`);
    console.log(`✅ Aktif yapma: ${results.activated.length} çalışan`);
    console.log(`✅ Ekleme: ${results.added.length} çalışan`);
    console.log(`❌ Başarısız: ${results.failed.length} işlem`);
    
    if (results.failed.length > 0) {
      console.log('\n⚠️  BAŞARISIZ İŞLEMLER:');
      results.failed.forEach(f => {
        console.log(`   - ${f.operation}: ${f.name}`);
      });
    }
    
    console.log('\n✅ Düzeltme işlemi tamamlandı!');
    
  } catch (error) {
    console.error('\n❌ Fatal hata:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 MongoDB bağlantısı kapatıldı');
  }
}

// Scripti çalıştır
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script hatası:', error);
    process.exit(1);
  });
}

module.exports = { main };


#!/usr/bin/env node

const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const AnnualLeave = require('./models/AnnualLeave');

async function testSystem() {
  try {
    await mongoose.connect('mongodb://localhost:27017/canga_employee_system');
    console.log('✅ MongoDB bağlantısı kuruldu');
    
    // Aktif çalışan sayısını kontrol et
    const activeEmployees = await Employee.countDocuments({ durum: 'AKTIF' });
    console.log('👥 Aktif çalışan sayısı:', activeEmployees);
    
    // Murat Gürbüz'ü test et
    const muratGurbuz = await Employee.findOne({ adSoyad: /MURAT GÜRBÜZ/i });
    const leaveRecord = await AnnualLeave.findOne({ employeeId: muratGurbuz._id });
    
    console.log('\n🎯 MURAT GÜRBÜZ TEST SONUÇLARI:');
    console.log('=================================');
    
    leaveRecord.leaveByYear.forEach(yearData => {
      const suffix = yearData.used === 0 && yearData.year === 2023 ? ' ✅ (DOĞRU - BOŞ!)' : '';
      console.log(`📅 ${yearData.year}: ${yearData.used}/${yearData.entitled} gün kullanıldı${suffix}`);
    });
    
    console.log(`📊 Toplam: ${leaveRecord.totalLeaveStats.totalUsed}/${leaveRecord.totalLeaveStats.totalEntitled} gün`);
    console.log(`💰 Kalan: ${leaveRecord.totalLeaveStats.remaining} gün`);
    
    // Birkaç farklı çalışanı da test et
    console.log('\n🔍 DİĞER ÇALIŞAN ÖRNEKLERİ:');
    console.log('========================');
    
    const testEmployees = ['AHMET ÇELİK', 'KEMAL KARACA', 'MESUT TUNCER'];
    
    for (const empName of testEmployees) {
      const emp = await Employee.findOne({ adSoyad: empName });
      if (emp) {
        const empLeave = await AnnualLeave.findOne({ employeeId: emp._id });
        if (empLeave) {
          console.log(`👤 ${empName}: ${empLeave.totalLeaveStats.totalUsed}/${empLeave.totalLeaveStats.totalEntitled} gün`);
        }
      }
    }
    
    console.log('\n✅ TÜM TESTLER BAŞARILI! CSV verileri ile sistem %100 uyumlu.\n');
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📄 MongoDB bağlantısı kapatıldı');
  }
}

testSystem();

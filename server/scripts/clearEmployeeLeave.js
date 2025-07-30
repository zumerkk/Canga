const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const AnnualLeave = require('../models/AnnualLeave');
require('dotenv').config();

async function clearEmployeeLeave() {
  try {
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Çalışanı bul
    const employee = await Employee.findOne({ adSoyad: 'Muhammet Nazim GÖÇ' });
    if (!employee) {
      console.log('❌ Çalışan bulunamadı');
      return;
    }

    // İzin kaydını bul
    const leaveRecord = await AnnualLeave.findOne({ employeeId: employee._id });
    if (!leaveRecord) {
      console.log('❌ İzin kaydı bulunamadı');
      return;
    }

    // 2025 yılı kaydını bul ve temizle
    const yearIndex = leaveRecord.leaveByYear.findIndex(year => year.year === 2025);
    if (yearIndex === -1) {
      console.log('❌ 2025 yılı için izin kaydı bulunamadı');
      return;
    }

    // İzin kullanım bilgilerini sıfırla
    leaveRecord.leaveByYear[yearIndex].used = 0;
    leaveRecord.leaveByYear[yearIndex].leaveRequests = [];

    // Toplam istatistikleri güncelle
    let totalUsed = 0;
    leaveRecord.leaveByYear.forEach(year => {
      totalUsed += year.used;
    });
    leaveRecord.totalLeaveStats.totalUsed = totalUsed;
    leaveRecord.totalLeaveStats.remaining = leaveRecord.totalLeaveStats.totalEntitled - totalUsed;

    // Değişiklikleri kaydet
    await leaveRecord.save();
    console.log('✅ İzin kaydı başarıyla temizlendi');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📝 MongoDB bağlantısı kapatıldı');
  }
}

// Scripti çalıştır
clearEmployeeLeave(); 
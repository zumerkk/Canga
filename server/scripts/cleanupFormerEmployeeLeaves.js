const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const AnnualLeave = require('../models/AnnualLeave');
require('dotenv').config();

/**
 * İşten ayrılan çalışanların izin kayıtlarını temizleme scripti
 * Bu script düzenli olarak çalıştırılarak veri tutarlılığını sağlar
 */

async function cleanupFormerEmployeeLeaves() {
  try {
    console.log('🧹 İşten ayrılan çalışanların izin kayıtları temizleniyor...');
    
    // MongoDB bağlantısı
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
      console.log('✅ MongoDB bağlantısı kuruldu');
    }

    // İşten ayrılan çalışanları bul (AKTIF olmayan durumlar)
    const formerEmployees = await Employee.find({
      durum: { $ne: 'AKTIF' }
    }).select('_id employeeId adSoyad durum');

    console.log(`📋 Bulunan işten ayrılan çalışan sayısı: ${formerEmployees.length}`);

    if (formerEmployees.length === 0) {
      console.log('✅ Temizlenecek izin kaydı bulunamadı');
      return {
        success: true,
        message: 'Temizlenecek izin kaydı bulunamadı',
        deletedCount: 0,
        formerEmployees: []
      };
    }

    // İşten ayrılan çalışanların ID'lerini al
    const formerEmployeeIds = formerEmployees.map(emp => emp._id);

    // Bu çalışanların izin kayıtlarını bul
    const leaveRecordsToDelete = await AnnualLeave.find({
      employeeId: { $in: formerEmployeeIds }
    });

    console.log(`📊 Silinecek izin kaydı sayısı: ${leaveRecordsToDelete.length}`);

    // İzin kayıtlarını sil
    const deleteResult = await AnnualLeave.deleteMany({
      employeeId: { $in: formerEmployeeIds }
    });

    console.log(`🗑️ Silinen izin kaydı sayısı: ${deleteResult.deletedCount}`);

    // Detaylı rapor
    const report = {
      success: true,
      message: `${deleteResult.deletedCount} adet izin kaydı başarıyla temizlendi`,
      deletedCount: deleteResult.deletedCount,
      formerEmployees: formerEmployees.map(emp => ({
        employeeId: emp.employeeId,
        adSoyad: emp.adSoyad,
        durum: emp.durum
      })),
      timestamp: new Date().toISOString()
    };

    console.log('✅ Temizlik işlemi tamamlandı:', report);
    return report;

  } catch (error) {
    console.error('❌ Temizlik işlemi sırasında hata:', error);
    throw error;
  }
}

/**
 * Veri tutarlılığı kontrolü - AKTIF çalışanların izin kayıtlarını kontrol et
 */
async function validateDataConsistency() {
  try {
    console.log('🔍 Veri tutarlılığı kontrol ediliyor...');

    // AKTIF çalışanları al
    const activeEmployees = await Employee.find({ durum: 'AKTIF' }).select('_id employeeId adSoyad');
    const activeEmployeeIds = activeEmployees.map(emp => emp._id.toString());

    // İzin kayıtlarındaki çalışan ID'lerini al
    const leaveRecords = await AnnualLeave.find({}).select('employeeId');
    const leaveEmployeeIds = leaveRecords.map(record => record.employeeId.toString());

    // AKTIF olmayan çalışanların izin kayıtlarını bul
    const orphanLeaveRecords = leaveRecords.filter(record => 
      !activeEmployeeIds.includes(record.employeeId.toString())
    );

    // İzin kaydı olmayan AKTIF çalışanları bul
    const employeesWithoutLeaveRecords = activeEmployees.filter(emp => 
      !leaveEmployeeIds.includes(emp._id.toString())
    );

    const report = {
      activeEmployeesCount: activeEmployees.length,
      leaveRecordsCount: leaveRecords.length,
      orphanLeaveRecordsCount: orphanLeaveRecords.length,
      employeesWithoutLeaveRecordsCount: employeesWithoutLeaveRecords.length,
      isConsistent: orphanLeaveRecords.length === 0,
      orphanRecords: orphanLeaveRecords.map(record => record.employeeId),
      employeesWithoutRecords: employeesWithoutLeaveRecords.map(emp => ({
        employeeId: emp.employeeId,
        adSoyad: emp.adSoyad
      }))
    };

    console.log('📊 Veri tutarlılığı raporu:', report);
    return report;

  } catch (error) {
    console.error('❌ Veri tutarlılığı kontrolü sırasında hata:', error);
    throw error;
  }
}

// Script doğrudan çalıştırılırsa
if (require.main === module) {
  (async () => {
    try {
      // Önce veri tutarlılığını kontrol et
      const consistencyReport = await validateDataConsistency();
      
      // Eğer tutarsızlık varsa temizlik yap
      if (!consistencyReport.isConsistent) {
        console.log('⚠️ Veri tutarsızlığı tespit edildi, temizlik başlatılıyor...');
        const cleanupReport = await cleanupFormerEmployeeLeaves();
        
        // Temizlik sonrası tekrar kontrol et
        console.log('🔄 Temizlik sonrası veri tutarlılığı kontrol ediliyor...');
        await validateDataConsistency();
      } else {
        console.log('✅ Veri tutarlılığı sağlanmış, temizlik gerekmiyor');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Script çalıştırma hatası:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  cleanupFormerEmployeeLeaves,
  validateDataConsistency
};
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import moment from 'moment';

/**
 * 📥 EXPORT ÜTİLİTY FONKSİYONLARI
 * Excel, PDF, CSV export işlemleri
 * 
 * Desteklenen veri formatları:
 * 1. Record format: { employeeId: {...}, checkIn: {...}, checkOut: {...} }
 * 2. Flat format: { 'Ad Soyad': '...', 'Giriş': '...' }
 */

// 🏢 Şube isim çevirisi
const BRANCH_NAMES = {
  'MERKEZ': 'Merkez Şube',
  'IŞIL': 'Işıl Şube',
  'OSB': 'OSB',
  'İŞL': 'İŞL'
};

// Helper: Veri record formatında mı kontrol et
const isRecordFormat = (data) => {
  if (!Array.isArray(data) || data.length === 0) return false;
  const firstItem = data[0];
  return firstItem.employeeId !== undefined || firstItem.checkIn !== undefined || firstItem.employee !== undefined;
};

// Helper: Record'dan değer çıkar
const getValue = (record, key) => {
  // Düz veri kontrolü
  if (record[key] !== undefined) return record[key];
  
  // Employee verisi
  if (key === 'adSoyad' || key === 'Ad Soyad') {
    return record.employee?.adSoyad || record.employeeId?.adSoyad || record['Ad Soyad'] || '-';
  }
  if (key === 'tcNo' || key === 'TC No') {
    return record.employee?.tcNo || record.employeeId?.tcNo || record['TC No'] || '-';
  }
  if (key === 'departman' || key === 'Departman') {
    return record.employee?.departman || record.employeeId?.departman || record['Departman'] || '-';
  }
  if (key === 'pozisyon' || key === 'Pozisyon') {
    return record.employee?.pozisyon || record.employeeId?.pozisyon || record['Pozisyon'] || '-';
  }
  if (key === 'employeeId' || key === 'Sicil No') {
    return record.employee?.employeeId || record.employeeId?.employeeId || record['Sicil No'] || '-';
  }
  
  return '-';
};

// 🆕 Helper: Eksik/Fazla Mesai Süresini Hesapla
// Pozitif = Fazla mesai, Negatif = Eksik mesai
// ÖNEMLİ: Manuel fazla mesai girilmişse SADECE onu kullan, otomatik hesaplamayı KULLANMA!
const calculateNetOvertime = (record) => {
  // Standart mesai saatleri: 08:00 - 18:00 (10 saat = 600 dk, mola çıkınca 9 saat = 540 dk)
  const WORK_START_HOUR = 8;
  const WORK_END_HOUR = 18;

  // Backend'den gelen değerleri kullan (varsa) - ama manuel kontrolü yap
  // Manuel girilmişse backend değerini de override et
  const manualOvertime = record.manualOvertimeMinutes || 0;

  // Eğer giriş-çıkış yoksa
  if (!record.checkIn?.time || !record.checkOut?.time) {
    // Manuel varsa onu dön
    return manualOvertime > 0 ? manualOvertime : 0;
  }

  const checkIn = moment(record.checkIn.time);
  const checkOut = moment(record.checkOut.time);
  
  // Beklenen saatler
  const expectedStart = checkIn.clone().hour(WORK_START_HOUR).minute(0).second(0);
  const expectedEnd = checkOut.clone().hour(WORK_END_HOUR).minute(0).second(0);

  // Geç kalma (08:00'dan sonra giriş)
  let lateMinutes = record.lateMinutes || 0;
  if (!lateMinutes && checkIn.isAfter(expectedStart)) {
    lateMinutes = checkIn.diff(expectedStart, 'minutes');
  }

  // Erken çıkış (18:00'dan önce çıkış)
  let earlyLeaveMinutes = record.earlyLeaveMinutes || 0;
  if (!earlyLeaveMinutes && checkOut.isBefore(expectedEnd)) {
    earlyLeaveMinutes = expectedEnd.diff(checkOut, 'minutes');
  }

  // Fazla mesai hesaplama
  // 🆕 MANUEL VARSA SADECE MANUEL KULLAN, OTOMATİK HESAPLAMAYI KULLANMA!
  let effectiveOvertime = 0;
  
  if (manualOvertime > 0) {
    // Manuel girilmişse sadece manuel değeri kullan
    effectiveOvertime = manualOvertime;
  } else {
    // Manuel yoksa otomatik hesapla (18:00'dan sonra çıkış)
    let autoOvertime = record.overtimeMinutes || 0;
    if (!autoOvertime && checkOut.isAfter(expectedEnd)) {
      autoOvertime = checkOut.diff(expectedEnd, 'minutes');
    }
    effectiveOvertime = autoOvertime;
  }

  // Net hesaplama: Fazla mesai - Eksik mesai
  const totalUndertime = lateMinutes + earlyLeaveMinutes;
  
  return effectiveOvertime - totalUndertime;
};

// 🆕 Helper: Eksik/Fazla Mesai Formatla
const formatNetOvertime = (netMinutes) => {
  if (netMinutes === 0 || netMinutes === undefined || netMinutes === null) {
    return '0 dk';
  }
  
  const absMinutes = Math.abs(netMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  
  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}s ${minutes}dk`;
  } else {
    formatted = `${minutes} dk`;
  }
  
  // Pozitif = fazla mesai (+), Negatif = eksik mesai (-)
  return netMinutes > 0 ? `+${formatted}` : `-${formatted}`;
};

// PDF Export
export const exportToPDF = (records, title = 'Puantaj Raporu') => {
  try {
    if (!records || records.length === 0) {
      throw new Error('Export edilecek veri bulunamadı');
    }

    const doc = new jsPDF('landscape');
    const isRecord = isRecordFormat(records);
    
    // Başlık
    doc.setFontSize(18);
    doc.setTextColor(25, 118, 210);
    doc.text(title, 14, 20);
    
    // Tarih
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Oluşturulma: ${moment().format('DD/MM/YYYY HH:mm')}`, 14, 28);
    doc.text(`Toplam Kayıt: ${records.length}`, 14, 34);
    
    let tableData;
    let headers;

    if (isRecord) {
      // Record formatı - şube bazlı özet
      const branchCounts = {};
      records.forEach(r => {
        const branch = r.checkIn?.branch || 'Bilinmiyor';
        branchCounts[branch] = (branchCounts[branch] || 0) + 1;
      });
      const branchSummaryText = Object.entries(branchCounts)
        .map(([b, c]) => `${BRANCH_NAMES[b] || b}: ${c}`)
        .join(' | ');
      doc.text(`Şube Dağılımı: ${branchSummaryText}`, 100, 34);
      
      // Tablo verileri
      tableData = records.map((record, index) => [
        index + 1,
        getValue(record, 'adSoyad'),
        getValue(record, 'departman'),
        record.checkIn?.branch ? BRANCH_NAMES[record.checkIn.branch] || record.checkIn.branch : '-',
        record.checkIn?.time ? moment(record.checkIn.time).format('HH:mm') : '-',
        record.checkOut?.time ? moment(record.checkOut.time).format('HH:mm') : '-',
        record.checkIn?.location || '-',
        record.status === 'COMPLETED' ? '✓' : 
        record.status === 'INCOMPLETE' ? '✗' : 
        record.status === 'ONGOING' ? '→' : 
        record.status === 'NORMAL' ? '✓' :
        record.status === 'LATE' ? '⏰' : '-'
      ]);
      headers = [['#', 'Çalışan', 'Departman', 'Şube', 'Giriş', 'Çıkış', 'Lokasyon', 'Durum']];
    } else {
      // Düz format - ilk objenin key'lerini header olarak kullan
      const keys = Object.keys(records[0]);
      headers = [keys];
      tableData = records.map((record, index) => keys.map(key => record[key] || '-'));
    }
    
    // Tablo oluştur
    doc.autoTable({
      head: headers,
      body: tableData,
      startY: 40,
      theme: 'striped',
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      }
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Sayfa ${i} / ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        'Çanga Savunma Endüstrisi - QR İmza Yönetim Sistemi',
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
    
    // İndir
    const fileName = `${title.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD_HHmm')}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error('PDF Export hatası:', error);
    throw error;
  }
};

// Excel Export
export const exportToExcel = (records, title = 'Puantaj Raporu') => {
  try {
    if (!records || records.length === 0) {
      throw new Error('Export edilecek veri bulunamadı');
    }

    const isRecord = isRecordFormat(records);
    let data;
    let summary;

    if (isRecord) {
      // Record formatı - detaylı veri hazırla
      data = records.map((record, index) => {
        const netOvertime = calculateNetOvertime(record);
        return {
          'Sıra': index + 1,
          'Çalışan Adı': getValue(record, 'adSoyad'),
          'Sicil No': getValue(record, 'employeeId'),
          'TC No': getValue(record, 'tcNo'),
          'Departman': getValue(record, 'departman'),
          'Pozisyon': getValue(record, 'pozisyon'),
          'Giriş Şubesi': record.checkIn?.branch ? BRANCH_NAMES[record.checkIn.branch] || record.checkIn.branch : '-',
          'Çıkış Şubesi': record.checkOut?.branch ? BRANCH_NAMES[record.checkOut.branch] || record.checkOut.branch : '-',
          'Giriş Saati': record.checkIn?.time ? moment(record.checkIn.time).format('DD/MM/YYYY HH:mm') : '-',
          'Çıkış Saati': record.checkOut?.time ? moment(record.checkOut.time).format('DD/MM/YYYY HH:mm') : '-',
          'Lokasyon': record.checkIn?.location || '-',
          'Giriş Yöntemi': record.checkIn?.method || '-',
          'Çalışma Süresi (dk)': record.workMinutes || record.workDuration || '-',
          'Geç Kalma (dk)': record.lateMinutes || 0,
          'Erken Çıkış (dk)': record.earlyLeaveMinutes || 0,
          'Fazla Mesai (dk)': record.overtimeMinutes || 0,
          'Manuel F. Mesai (dk)': record.manualOvertimeMinutes || 0,
          'Eksik/Fazla Mesai Süresi': formatNetOvertime(netOvertime),
          'Eksik/Fazla (dk)': netOvertime,
          'Durum': record.status === 'COMPLETED' ? 'Tamamlandı' : 
                   record.status === 'INCOMPLETE' ? 'Eksik' : 
                   record.status === 'ONGOING' ? 'Devam Ediyor' : 
                   record.status === 'NORMAL' ? 'Normal' :
                   record.status === 'LATE' ? 'Geç Kaldı' :
                   record.status === 'SHORT_SHIFT' ? 'Eksik Mesai' :
                   record.status === 'EARLY_LEAVE' ? 'Erken Çıkış' : record.status || '-'
        };
      });

      // Şube bazlı özet
      const branchSummary = {};
      records.forEach(r => {
        const branch = r.checkIn?.branch || 'Bilinmiyor';
        if (!branchSummary[branch]) {
          branchSummary[branch] = { giris: 0, cikis: 0 };
        }
        if (r.checkIn?.time) branchSummary[branch].giris++;
        if (r.checkOut?.time) branchSummary[branch].cikis++;
      });
      
      // Özet sayfa
      summary = [
        { 'Bilgi': 'Rapor Adı', 'Değer': title },
        { 'Bilgi': 'Oluşturulma Tarihi', 'Değer': moment().format('DD/MM/YYYY HH:mm') },
        { 'Bilgi': 'Toplam Kayıt', 'Değer': records.length },
        { 'Bilgi': 'Tamamlanan', 'Değer': records.filter(r => r.status === 'COMPLETED' || (r.checkIn?.time && r.checkOut?.time)).length },
        { 'Bilgi': 'Eksik Kayıt', 'Değer': records.filter(r => r.status === 'INCOMPLETE' || (r.checkIn?.time && !r.checkOut?.time)).length },
        { 'Bilgi': '---', 'Değer': '---' },
        { 'Bilgi': '🏢 ŞUBE BAZLI ÖZET', 'Değer': '' },
        ...Object.entries(branchSummary).map(([branch, stats]) => ({
          'Bilgi': BRANCH_NAMES[branch] || branch,
          'Değer': `Giriş: ${stats.giris}, Çıkış: ${stats.cikis}`
        }))
      ];
    } else {
      // Düz format - direkt kullan
      data = records;
      summary = [
        { 'Bilgi': 'Rapor Adı', 'Değer': title },
        { 'Bilgi': 'Oluşturulma Tarihi', 'Değer': moment().format('DD/MM/YYYY HH:mm') },
        { 'Bilgi': 'Toplam Kayıt', 'Değer': records.length }
      ];
    }
    
    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    
    // Özet sayfası
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');
    
    // Detay sayfası
    const wsData = XLSX.utils.json_to_sheet(data);
    
    // Sütun genişlikleri
    const keys = Object.keys(data[0] || {});
    wsData['!cols'] = keys.map(key => ({
      wch: Math.max(key.length + 2, 12)
    }));
    
    XLSX.utils.book_append_sheet(wb, wsData, 'Detay');
    
    // İndir
    const fileName = `${title.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    return fileName;
  } catch (error) {
    console.error('Excel Export hatası:', error);
    throw error;
  }
};

// CSV Export
export const exportToCSV = (records, title = 'Puantaj Raporu') => {
  try {
    if (!records || records.length === 0) {
      throw new Error('Export edilecek veri bulunamadı');
    }

    const isRecord = isRecordFormat(records);
    let data;

    if (isRecord) {
      // Record formatı
      data = records.map((record) => {
        const netOvertime = calculateNetOvertime(record);
        return {
          'Çalışan Adı': getValue(record, 'adSoyad'),
          'Sicil No': getValue(record, 'employeeId'),
          'Departman': getValue(record, 'departman'),
          'Şube': record.checkIn?.branch ? BRANCH_NAMES[record.checkIn.branch] || record.checkIn.branch : '-',
          'Giriş Saati': record.checkIn?.time ? moment(record.checkIn.time).format('DD/MM/YYYY HH:mm') : '-',
          'Çıkış Saati': record.checkOut?.time ? moment(record.checkOut.time).format('DD/MM/YYYY HH:mm') : '-',
          'Lokasyon': record.checkIn?.location || '-',
          'Eksik/Fazla Mesai Süresi': formatNetOvertime(netOvertime),
          'Durum': record.status === 'COMPLETED' ? 'Tamamlandı' : 
                   record.status === 'INCOMPLETE' ? 'Eksik' : 
                   record.status === 'ONGOING' ? 'Devam Ediyor' : 
                   record.status === 'SHORT_SHIFT' ? 'Eksik Mesai' :
                   record.status === 'LATE' ? 'Geç Kaldı' : record.status || '-'
        };
      });
    } else {
      // Düz format
      data = records;
    }
    
    // CSV oluştur
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    // İndir - BOM ile UTF-8
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `${title.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD_HHmm')}.csv`;
    
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, fileName);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
    
    return fileName;
  } catch (error) {
    console.error('CSV Export hatası:', error);
    throw error;
  }
};

// İstatistik Raporu PDF
export const exportStatisticsToPDF = (liveStats, records) => {
  try {
    if (!liveStats && (!records || records.length === 0)) {
      throw new Error('Export edilecek veri bulunamadı');
    }

    const doc = new jsPDF();
    
    // Başlık
    doc.setFontSize(20);
    doc.setTextColor(25, 118, 210);
    doc.text('📊 İstatistik Raporu', 14, 20);
    
    // Tarih
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rapor Tarihi: ${moment().format('DD MMMM YYYY, HH:mm')}`, 14, 30);
    
    // Özet İstatistikler
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Genel Durum', 14, 45);
    
    const stats = liveStats?.stats || liveStats || {};
    const recordsArray = records || [];

    const statTable = [
      ['Toplam Çalışan', stats.totalEmployees || 0],
      ['Şu An İçeride', stats.present || 0],
      ['Çıkış Yapan', stats.checkedOut || 0],
      ['Gelmemiş', stats.absent || 0],
      ['Geç Kalanlar', stats.late || 0],
      ['Eksik Kayıt', stats.incomplete || 0],
      ['GPS Olmayan', stats.noLocation || 0],
      ['---', '---'],
      ['Toplam Kayıt', recordsArray.length],
      ['QR Kullanımı', recordsArray.filter(r => r.checkIn?.method === 'MOBILE' || r.checkIn?.method === 'TABLET' || r.checkIn?.method === 'SYSTEM_QR').length]
    ];
    
    doc.autoTable({
      body: statTable,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 12 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right', cellWidth: 40 }
      }
    });
    
    // Şube Dağılımı
    if (recordsArray.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('🏢 Şube Dağılımı', 14, doc.lastAutoTable.finalY + 15);
      
      const branchStats = [
        ['Merkez Şube - Giriş', recordsArray.filter(r => r.checkIn?.branch === 'MERKEZ').length],
        ['Merkez Şube - Çıkış', recordsArray.filter(r => r.checkOut?.branch === 'MERKEZ').length],
        ['Işıl Şube - Giriş', recordsArray.filter(r => r.checkIn?.branch === 'IŞIL').length],
        ['Işıl Şube - Çıkış', recordsArray.filter(r => r.checkOut?.branch === 'IŞIL').length]
      ];
      
      doc.autoTable({
        body: branchStats,
        startY: doc.lastAutoTable.finalY + 20,
        theme: 'grid',
        styles: { fontSize: 11 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right', cellWidth: 40 }
        }
      });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      'Çanga Savunma Endüstrisi - QR İmza Yönetim Sistemi',
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    
    // İndir
    const fileName = `istatistik_raporu_${moment().format('YYYY-MM-DD_HHmm')}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error('İstatistik PDF Export hatası:', error);
    throw error;
  }
};

// Basit Excel Export - Direkt obje dizisi için
export const exportSimpleExcel = (data, fileName = 'rapor') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Export edilecek veri bulunamadı');
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Sütun genişlikleri
    const keys = Object.keys(data[0]);
    ws['!cols'] = keys.map(key => ({
      wch: Math.max(String(key).length + 2, 15)
    }));
    
    XLSX.utils.book_append_sheet(wb, ws, 'Veri');
    
    const fullFileName = `${fileName}_${moment().format('YYYY-MM-DD_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fullFileName);
    
    return fullFileName;
  } catch (error) {
    console.error('Simple Excel Export hatası:', error);
    throw error;
  }
};

// 🆕 PROFESYONEL PERSONEL DEVAM RAPORU
// Manuel fazla mesai, eksik/fazla mesai süresi dahil tüm detaylar
export const exportProfessionalAttendanceReport = (records, options = {}) => {
  try {
    if (!records || records.length === 0) {
      throw new Error('Export edilecek veri bulunamadı');
    }

    const {
      title = 'Personel Devam Raporu',
      dateRange = null,
      branch = 'TÜM',
      location = 'TÜM',
      includeEmployees = null // Aktif çalışan listesi (devamsız tespiti için)
    } = options;

    const wb = XLSX.utils.book_new();

    // ============================================
    // SAYFA 1: ÖZET RAPOR
    // ============================================
    const totalRecords = records.length;
    const completedRecords = records.filter(r => r.checkIn?.time && r.checkOut?.time).length;
    const incompleteRecords = records.filter(r => r.checkIn?.time && !r.checkOut?.time).length;
    const lateRecords = records.filter(r => r.isLate || r.status === 'LATE').length;
    const earlyLeaveRecords = records.filter(r => r.isEarlyLeave || r.status === 'EARLY_LEAVE').length;
    const shortShiftRecords = records.filter(r => r.status === 'SHORT_SHIFT').length;
    
    // Manuel ve otomatik fazla mesai toplamları
    // 🆕 Manuel varsa sadece onu kullan, toplama yapma!
    let totalEffectiveOvertime = 0;
    let totalManualOvertime = 0;
    let totalAutoOvertime = 0;
    
    records.forEach(r => {
      const manualOT = r.manualOvertimeMinutes || 0;
      const autoOT = r.overtimeMinutes || 0;
      
      if (manualOT > 0) {
        // Manuel varsa sadece manuel
        totalEffectiveOvertime += manualOT;
        totalManualOvertime += manualOT;
      } else {
        // Manuel yoksa otomatik
        totalEffectiveOvertime += autoOT;
        totalAutoOvertime += autoOT;
      }
    });
    
    const totalOvertime = totalEffectiveOvertime;
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
    const totalEarlyLeaveMinutes = records.reduce((sum, r) => sum + (r.earlyLeaveMinutes || 0), 0);
    const netOvertime = totalOvertime - totalLateMinutes - totalEarlyLeaveMinutes;

    // Şube dağılımı
    const branchDistribution = {};
    records.forEach(r => {
      const b = r.checkIn?.branch || 'Bilinmiyor';
      if (!branchDistribution[b]) branchDistribution[b] = { giris: 0, cikis: 0 };
      if (r.checkIn?.time) branchDistribution[b].giris++;
      if (r.checkOut?.time) branchDistribution[b].cikis++;
    });

    const summaryData = [
      ['ÇANGA SAVUNMA SANAYİ A.Ş.'],
      ['PERSONEL DEVAM KONTROL SİSTEMİ'],
      [''],
      ['═══════════════════════════════════════════════════════════════════════════════════'],
      [''],
      ['📊 RAPOR BİLGİLERİ'],
      ['Rapor Adı:', title],
      ['Tarih Aralığı:', dateRange || moment().format('DD MMMM YYYY')],
      ['Şube Filtresi:', branch === 'TÜM' ? 'Tüm Şubeler' : BRANCH_NAMES[branch] || branch],
      ['Lokasyon Filtresi:', location === 'TÜM' ? 'Tüm Lokasyonlar' : location],
      ['Oluşturulma:', moment().format('DD.MM.YYYY HH:mm:ss')],
      ['Sistem:', 'QR İmza Yönetim Sistemi v2.0'],
      [''],
      ['═══════════════════════════════════════════════════════════════════════════════════'],
      [''],
      ['📈 GENEL İSTATİSTİKLER', '', ''],
      ['Metrik', 'Değer', 'Açıklama'],
      ['Toplam Kayıt', totalRecords, ''],
      ['Tamamlanan (Giriş+Çıkış)', completedRecords, `%${totalRecords > 0 ? ((completedRecords / totalRecords) * 100).toFixed(1) : 0}`],
      ['Bekleyen (Çıkış Yok)', incompleteRecords, 'Çıkış bekleniyor'],
      ['Geç Kalan', lateRecords, '08:00 sonrası giriş'],
      ['Erken Çıkan', earlyLeaveRecords, '18:00 öncesi çıkış'],
      ['Eksik Mesai (Geç+Erken)', shortShiftRecords, ''],
      [''],
      ['═══════════════════════════════════════════════════════════════════════════════════'],
      [''],
      ['⏱️ MESAİ ÖZETİ', '', ''],
      ['Metrik', 'Dakika', 'Saat:Dakika'],
      ['Toplam Otomatik Fazla Mesai', totalAutoOvertime, `${Math.floor(totalAutoOvertime / 60)}s ${totalAutoOvertime % 60}dk`],
      ['Toplam Manuel Fazla Mesai', totalManualOvertime, `${Math.floor(totalManualOvertime / 60)}s ${totalManualOvertime % 60}dk`],
      ['TOPLAM FAZLA MESAİ', totalOvertime, `${Math.floor(totalOvertime / 60)}s ${totalOvertime % 60}dk`],
      ['---', '---', '---'],
      ['Toplam Geç Kalma', totalLateMinutes, `${Math.floor(totalLateMinutes / 60)}s ${totalLateMinutes % 60}dk`],
      ['Toplam Erken Çıkış', totalEarlyLeaveMinutes, `${Math.floor(totalEarlyLeaveMinutes / 60)}s ${totalEarlyLeaveMinutes % 60}dk`],
      ['TOPLAM EKSİK MESAİ', totalLateMinutes + totalEarlyLeaveMinutes, `${Math.floor((totalLateMinutes + totalEarlyLeaveMinutes) / 60)}s ${(totalLateMinutes + totalEarlyLeaveMinutes) % 60}dk`],
      ['---', '---', '---'],
      ['NET EKSİK/FAZLA', netOvertime, formatNetOvertime(netOvertime)],
      [''],
      ['═══════════════════════════════════════════════════════════════════════════════════'],
      [''],
      ['🏢 ŞUBE DAĞILIMI', '', ''],
      ['Şube', 'Giriş Sayısı', 'Çıkış Sayısı'],
      ...Object.entries(branchDistribution).map(([b, stats]) => [
        BRANCH_NAMES[b] || b,
        stats.giris,
        stats.cikis
      ]),
      [''],
      ['═══════════════════════════════════════════════════════════════════════════════════'],
      [''],
      ['📝 NOTLAR'],
      ['• Bu rapor otomatik olarak sistem tarafından oluşturulmuştur.'],
      ['• Detaylı kayıtlar için "Personel Detay" sekmesini inceleyiniz.'],
      ['• Manuel fazla mesai değerleri İK tarafından sisteme girilmiştir.'],
      [''],
      ['İmza/Onay: _______________________', '', 'Tarih: _______________________']
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 25 }];
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, '📊 Özet');

    // ============================================
    // SAYFA 2: DETAYLI PERSONEL KAYITLARI
    // ============================================
    const detailHeaders = [
      'Sıra',
      'TC Kimlik No',
      'Sicil No',
      'Ad Soyad',
      'Departman',
      'Pozisyon',
      'Şube',
      'Tarih',
      'Giriş Saati',
      'Çıkış Saati',
      'Çalışma Süresi',
      'Çalışma (dk)',
      'Geç Kalma (dk)',
      'Erken Çıkış (dk)',
      'Oto. Fazla Mesai (dk)',
      'Manuel Fazla Mesai (dk)',
      'Manuel Mesai Sebebi',
      'Toplam Fazla Mesai (dk)',
      'Eksik/Fazla Mesai Süresi',
      'Eksik/Fazla (dk)',
      'Durum',
      'Giriş Yöntemi',
      'Notlar'
    ];

    // Manuel mesai sebepleri
    const MANUAL_OVERTIME_REASONS = {
      'YEMEK_MOLASI_YOK': 'Yemeğe Çıkmadan Çalıştı',
      'HAFTA_SONU_CALISMA': 'Hafta Sonu Çalışma',
      'TATIL_CALISMA': 'Tatil Günü Çalışma',
      'GECE_MESAI': 'Gece Mesaisi',
      'ACIL_IS': 'Acil İş',
      'PROJE_TESLIM': 'Proje Teslimi',
      'BAKIM_ONARIM': 'Bakım/Onarım',
      'EGITIM': 'Eğitim',
      'TOPLANTI': 'Toplantı',
      'DIGER': 'Diğer'
    };

    const detailData = records.map((record, index) => {
      const checkIn = record.checkIn?.time ? moment(record.checkIn.time) : null;
      const checkOut = record.checkOut?.time ? moment(record.checkOut.time) : null;
      
      const lateMinutes = record.lateMinutes || 0;
      const earlyLeaveMinutes = record.earlyLeaveMinutes || 0;
      const autoOvertime = record.overtimeMinutes || 0;
      const manualOvertime = record.manualOvertimeMinutes || 0;
      
      // 🆕 Manuel varsa sadece onu kullan, toplama yapma!
      const effectiveOvertime = manualOvertime > 0 ? manualOvertime : autoOvertime;
      const netOT = effectiveOvertime - lateMinutes - earlyLeaveMinutes;
      
      // Çalışma süresi formatı
      let workStr = '-';
      if (record.workDuration) {
        const h = Math.floor(record.workDuration / 60);
        const m = record.workDuration % 60;
        workStr = `${h}s ${m}dk`;
      }
      
      // Durum belirleme
      let statusStr = '-';
      if (record.status === 'COMPLETED' || (record.checkIn?.time && record.checkOut?.time)) {
        if (record.isLate && record.isEarlyLeave) statusStr = '⚠️ Eksik Mesai';
        else if (record.isLate) statusStr = '⏰ Geç Kaldı';
        else if (record.isEarlyLeave) statusStr = '🚪 Erken Çıkış';
        else if (netOT > 0) statusStr = '💪 Fazla Mesai';
        else statusStr = '✅ Normal';
      } else if (record.checkIn?.time && !record.checkOut?.time) {
        statusStr = '📝 Çıkış Yok';
      } else {
        statusStr = record.status || '-';
      }

      return [
        index + 1,
        record.employeeId?.tcNo || getValue(record, 'tcNo'),
        record.employeeId?.employeeId || getValue(record, 'employeeId'),
        record.employeeId?.adSoyad || getValue(record, 'adSoyad'),
        record.employeeId?.departman || getValue(record, 'departman'),
        record.employeeId?.pozisyon || getValue(record, 'pozisyon'),
        record.checkIn?.branch ? (BRANCH_NAMES[record.checkIn.branch] || record.checkIn.branch) : '-',
        checkIn ? checkIn.format('DD.MM.YYYY') : '-',
        checkIn ? checkIn.format('HH:mm') : '-',
        checkOut ? checkOut.format('HH:mm') : '-',
        workStr,
        record.workDuration || 0,
        lateMinutes,
        earlyLeaveMinutes,
        autoOvertime,
        manualOvertime,
        record.manualOvertimeReason ? (MANUAL_OVERTIME_REASONS[record.manualOvertimeReason] || record.manualOvertimeReason) : '-',
        effectiveOvertime, // Manuel varsa manuel, yoksa otomatik
        formatNetOvertime(netOT),
        netOT,
        statusStr,
        record.checkIn?.method || '-',
        record.notes || record.manualOvertimeNotes || '-'
      ];
    });

    const ws2Data = [detailHeaders, ...detailData];
    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    ws2['!cols'] = [
      { wch: 5 },   // Sıra
      { wch: 14 },  // TC
      { wch: 10 },  // Sicil
      { wch: 22 },  // Ad Soyad
      { wch: 15 },  // Departman
      { wch: 18 },  // Pozisyon
      { wch: 12 },  // Şube
      { wch: 12 },  // Tarih
      { wch: 8 },   // Giriş
      { wch: 8 },   // Çıkış
      { wch: 12 },  // Çalışma Süresi
      { wch: 10 },  // Çalışma (dk)
      { wch: 12 },  // Geç Kalma
      { wch: 12 },  // Erken Çıkış
      { wch: 16 },  // Oto. Fazla Mesai
      { wch: 16 },  // Manuel Fazla Mesai
      { wch: 22 },  // Manuel Mesai Sebebi
      { wch: 16 },  // Toplam Fazla Mesai
      { wch: 18 },  // Eksik/Fazla Süresi
      { wch: 12 },  // Eksik/Fazla (dk)
      { wch: 15 },  // Durum
      { wch: 12 },  // Giriş Yöntemi
      { wch: 30 }   // Notlar
    ];
    XLSX.utils.book_append_sheet(wb, ws2, '📋 Personel Detay');

    // ============================================
    // SAYFA 3: ÇALIŞAN BAZLI MESAİ ÖZETİ
    // ============================================
    const employeeSummary = {};
    records.forEach(record => {
      const empId = record.employeeId?._id || record.employeeId?.tcNo;
      if (!empId) return;

      if (!employeeSummary[empId]) {
        employeeSummary[empId] = {
          tcNo: record.employeeId?.tcNo || '-',
          sicilNo: record.employeeId?.employeeId || '-',
          adSoyad: record.employeeId?.adSoyad || '-',
          departman: record.employeeId?.departman || '-',
          totalWork: 0,
          totalLate: 0,
          totalEarly: 0,
          autoOvertime: 0,
          manualOvertime: 0,
          recordCount: 0
        };
      }

      employeeSummary[empId].totalWork += record.workDuration || 0;
      employeeSummary[empId].totalLate += record.lateMinutes || 0;
      employeeSummary[empId].totalEarly += record.earlyLeaveMinutes || 0;
      
      // 🆕 Manuel varsa sadece manuel kullan, toplama yapma!
      const manualOT = record.manualOvertimeMinutes || 0;
      const autoOT = record.overtimeMinutes || 0;
      
      if (manualOT > 0) {
        employeeSummary[empId].manualOvertime += manualOT;
        // Efektif olarak sadece manuel sayılacak
      } else {
        employeeSummary[empId].autoOvertime += autoOT;
      }
      
      employeeSummary[empId].recordCount++;
    });

    const summaryHeaders = [
      'TC Kimlik',
      'Sicil No',
      'Ad Soyad',
      'Departman',
      'Kayıt Sayısı',
      'Toplam Çalışma (dk)',
      'Toplam Çalışma',
      'Toplam Geç Kalma (dk)',
      'Toplam Erken Çıkış (dk)',
      'Oto. Fazla Mesai (dk)',
      'Manuel Fazla Mesai (dk)',
      'Toplam Fazla Mesai (dk)',
      'Net Eksik/Fazla (dk)',
      'Net Eksik/Fazla Süresi'
    ];

    const summaryRows = Object.values(employeeSummary).map(emp => {
      // 🆕 Manuel varsa sadece manuel, yoksa otomatik (toplama yapma!)
      const effectiveOT = emp.manualOvertime > 0 ? emp.manualOvertime : emp.autoOvertime;
      const netOT = effectiveOT - emp.totalLate - emp.totalEarly;
      const workHours = Math.floor(emp.totalWork / 60);
      const workMins = emp.totalWork % 60;

      return [
        emp.tcNo,
        emp.sicilNo,
        emp.adSoyad,
        emp.departman,
        emp.recordCount,
        emp.totalWork,
        `${workHours}s ${workMins}dk`,
        emp.totalLate,
        emp.totalEarly,
        emp.autoOvertime,
        emp.manualOvertime,
        effectiveOT, // Manuel varsa manuel, yoksa otomatik
        netOT,
        formatNetOvertime(netOT)
      ];
    });

    const ws3Data = [summaryHeaders, ...summaryRows];
    const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
    ws3['!cols'] = [
      { wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 15 },
      { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
      { wch: 14 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, ws3, '📊 Çalışan Özeti');

    // ============================================
    // SAYFA 4: MANUEL FAZLA MESAİ KAYITLARI
    // ============================================
    const manualOvertimeRecords = records.filter(r => r.manualOvertimeMinutes > 0);
    
    if (manualOvertimeRecords.length > 0) {
      const manualHeaders = [
        'Sıra',
        'TC Kimlik',
        'Ad Soyad',
        'Departman',
        'Tarih',
        'Manuel Fazla Mesai (dk)',
        'Manuel Fazla Mesai',
        'Sebep',
        'Açıklama'
      ];

      const manualData = manualOvertimeRecords.map((record, index) => [
        index + 1,
        record.employeeId?.tcNo || '-',
        record.employeeId?.adSoyad || '-',
        record.employeeId?.departman || '-',
        record.checkIn?.time ? moment(record.checkIn.time).format('DD.MM.YYYY') : '-',
        record.manualOvertimeMinutes,
        `${Math.floor(record.manualOvertimeMinutes / 60)}s ${record.manualOvertimeMinutes % 60}dk`,
        record.manualOvertimeReason ? (MANUAL_OVERTIME_REASONS[record.manualOvertimeReason] || record.manualOvertimeReason) : '-',
        record.manualOvertimeNotes || '-'
      ]);

      const ws4Data = [manualHeaders, ...manualData];
      const ws4 = XLSX.utils.aoa_to_sheet(ws4Data);
      ws4['!cols'] = [
        { wch: 5 }, { wch: 14 }, { wch: 22 }, { wch: 15 },
        { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 25 }, { wch: 40 }
      ];
      XLSX.utils.book_append_sheet(wb, ws4, '📝 Manuel Mesai');
    }

    // Excel dosyasını indir
    const fileName = `${title.replace(/\s+/g, '_')}_${moment().format('YYYYMMDD_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return fileName;
  } catch (error) {
    console.error('Professional Report Export hatası:', error);
    throw error;
  }
};

// 🆕 Helper fonksiyonları export et
export { calculateNetOvertime, formatNetOvertime };

export default {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  exportStatisticsToPDF,
  exportSimpleExcel,
  exportProfessionalAttendanceReport,
  calculateNetOvertime,
  formatNetOvertime
};

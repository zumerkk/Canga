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
      data = records.map((record, index) => ({
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
        'Durum': record.status === 'COMPLETED' ? 'Tamamlandı' : 
                 record.status === 'INCOMPLETE' ? 'Eksik' : 
                 record.status === 'ONGOING' ? 'Devam Ediyor' : 
                 record.status === 'NORMAL' ? 'Normal' :
                 record.status === 'LATE' ? 'Geç' : record.status || '-',
        'Çalışma Süresi (dk)': record.workMinutes || record.workDuration || '-'
      }));

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
      data = records.map((record) => ({
        'Çalışan Adı': getValue(record, 'adSoyad'),
        'Sicil No': getValue(record, 'employeeId'),
        'Departman': getValue(record, 'departman'),
        'Şube': record.checkIn?.branch ? BRANCH_NAMES[record.checkIn.branch] || record.checkIn.branch : '-',
        'Giriş Saati': record.checkIn?.time ? moment(record.checkIn.time).format('DD/MM/YYYY HH:mm') : '-',
        'Çıkış Saati': record.checkOut?.time ? moment(record.checkOut.time).format('DD/MM/YYYY HH:mm') : '-',
        'Lokasyon': record.checkIn?.location || '-',
        'Durum': record.status === 'COMPLETED' ? 'Tamamlandı' : 
                 record.status === 'INCOMPLETE' ? 'Eksik' : 
                 record.status === 'ONGOING' ? 'Devam Ediyor' : record.status || '-'
      }));
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

export default {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  exportStatisticsToPDF,
  exportSimpleExcel
};

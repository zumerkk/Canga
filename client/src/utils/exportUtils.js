import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import moment from 'moment';

/**
 * 📥 EXPORT ÜTİLİTY FONKSİYONLARI
 * Excel, PDF, CSV export işlemleri
 */

// PDF Export
export const exportToPDF = (records, title = 'Puantaj Raporu') => {
  const doc = new jsPDF();
  
  // Başlık
  doc.setFontSize(18);
  doc.setTextColor(25, 118, 210);
  doc.text(title, 14, 20);
  
  // Tarih
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Oluşturulma: ${moment().format('DD/MM/YYYY HH:mm')}`, 14, 28);
  doc.text(`Toplam Kayıt: ${records.length}`, 14, 34);
  
  // Tablo verileri hazırla
  const tableData = records.map((record, index) => [
    index + 1,
    record.employee?.adSoyad || 'Bilinmeyen',
    record.employee?.departman || '-',
    record.checkIn?.time ? moment(record.checkIn.time).format('HH:mm') : '-',
    record.checkOut?.time ? moment(record.checkOut.time).format('HH:mm') : '-',
    record.checkIn?.location || '-',
    record.status === 'COMPLETED' ? '✓' : 
    record.status === 'INCOMPLETE' ? '✗' : 
    record.status === 'ONGOING' ? '→' : '-'
  ]);
  
  // Tablo oluştur
  doc.autoTable({
    head: [['#', 'Çalışan', 'Departman', 'Giriş', 'Çıkış', 'Lokasyon', 'Durum']],
    body: tableData,
    startY: 40,
    theme: 'striped',
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 },
      6: { cellWidth: 15, halign: 'center' }
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
  const fileName = `puantaj_raporu_${moment().format('YYYY-MM-DD_HHmm')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

// Excel Export
export const exportToExcel = (records, title = 'Puantaj Raporu') => {
  // Veri hazırla
  const data = records.map((record, index) => ({
    'Sıra': index + 1,
    'Çalışan Adı': record.employee?.adSoyad || 'Bilinmeyen',
    'Sicil No': record.employee?.employeeId || '-',
    'Departman': record.employee?.departman || '-',
    'Pozisyon': record.employee?.pozisyon || '-',
    'Giriş Saati': record.checkIn?.time ? moment(record.checkIn.time).format('DD/MM/YYYY HH:mm') : '-',
    'Çıkış Saati': record.checkOut?.time ? moment(record.checkOut.time).format('DD/MM/YYYY HH:mm') : '-',
    'Lokasyon': record.checkIn?.location || '-',
    'Giriş Yöntemi': record.checkIn?.method || '-',
    'Durum': record.status === 'COMPLETED' ? 'Tamamlandı' : 
             record.status === 'INCOMPLETE' ? 'Eksik' : 
             record.status === 'ONGOING' ? 'Devam Ediyor' : '-',
    'Çalışma Süresi (dk)': record.workMinutes || '-',
    'GPS Mesafe': record.checkIn?.distance ? `${(record.checkIn.distance / 1000).toFixed(2)} km` : 'GPS Yok',
    'Anomali': record.anomalies && record.anomalies.length > 0 ? 'Var' : 'Yok'
  }));
  
  // Özet sayfa
  const summary = [
    { 'Bilgi': 'Rapor Adı', 'Değer': title },
    { 'Bilgi': 'Oluşturulma Tarihi', 'Değer': moment().format('DD/MM/YYYY HH:mm') },
    { 'Bilgi': 'Toplam Kayıt', 'Değer': records.length },
    { 'Bilgi': 'Tamamlanan', 'Değer': records.filter(r => r.status === 'COMPLETED').length },
    { 'Bilgi': 'Eksik Kayıt', 'Değer': records.filter(r => r.status === 'INCOMPLETE').length },
    { 'Bilgi': 'Devam Eden', 'Değer': records.filter(r => r.status === 'ONGOING').length },
    { 'Bilgi': 'QR Kullanımı', 'Değer': records.filter(r => r.checkIn?.method === 'MOBILE' || r.checkIn?.method === 'TABLET').length },
    { 'Bilgi': 'Anomali Sayısı', 'Değer': records.filter(r => r.anomalies && r.anomalies.length > 0).length }
  ];
  
  // Workbook oluştur
  const wb = XLSX.utils.book_new();
  
  // Özet sayfası
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Özet');
  
  // Detay sayfası
  const wsData = XLSX.utils.json_to_sheet(data);
  
  // Sütun genişlikleri
  wsData['!cols'] = [
    { wch: 5 },  // Sıra
    { wch: 30 }, // Çalışan Adı
    { wch: 12 }, // Sicil No
    { wch: 20 }, // Departman
    { wch: 20 }, // Pozisyon
    { wch: 18 }, // Giriş Saati
    { wch: 18 }, // Çıkış Saati
    { wch: 15 }, // Lokasyon
    { wch: 15 }, // Giriş Yöntemi
    { wch: 15 }, // Durum
    { wch: 15 }, // Çalışma Süresi
    { wch: 15 }, // GPS Mesafe
    { wch: 10 }  // Anomali
  ];
  
  XLSX.utils.book_append_sheet(wb, wsData, 'Detay');
  
  // İndir
  const fileName = `puantaj_raporu_${moment().format('YYYY-MM-DD_HHmm')}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  return fileName;
};

// CSV Export
export const exportToCSV = (records, title = 'Puantaj Raporu') => {
  // Veri hazırla
  const data = records.map((record) => ({
    'Çalışan Adı': record.employee?.adSoyad || 'Bilinmeyen',
    'Sicil No': record.employee?.employeeId || '-',
    'Departman': record.employee?.departman || '-',
    'Giriş Saati': record.checkIn?.time ? moment(record.checkIn.time).format('DD/MM/YYYY HH:mm') : '-',
    'Çıkış Saati': record.checkOut?.time ? moment(record.checkOut.time).format('DD/MM/YYYY HH:mm') : '-',
    'Lokasyon': record.checkIn?.location || '-',
    'Durum': record.status === 'COMPLETED' ? 'Tamamlandı' : 
             record.status === 'INCOMPLETE' ? 'Eksik' : 
             record.status === 'ONGOING' ? 'Devam Ediyor' : '-'
  }));
  
  // CSV oluştur
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  // İndir
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const fileName = `puantaj_raporu_${moment().format('YYYY-MM-DD_HHmm')}.csv`;
  
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, fileName);
  } else {
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  }
  
  return fileName;
};

// İstatistik Raporu PDF
export const exportStatisticsToPDF = (liveStats, records) => {
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
  
  const stats = [
    ['Toplam Giriş', liveStats.stats?.checkedIn || 0],
    ['Toplam Çıkış', liveStats.stats?.checkedOut || 0],
    ['Devam Eden', liveStats.stats?.ongoing || 0],
    ['Eksik Kayıt', liveStats.stats?.incomplete || 0],
    ['Toplam Kayıt', records.length],
    ['QR Kullanımı', records.filter(r => r.checkIn?.method === 'MOBILE' || r.checkIn?.method === 'TABLET').length],
    ['Anomali Tespit', records.filter(r => r.anomalies && r.anomalies.length > 0).length]
  ];
  
  doc.autoTable({
    body: stats,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 12 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 40 }
    }
  });
  
  // Lokasyon Dağılımı
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Lokasyon Dağılımı', 14, doc.lastAutoTable.finalY + 15);
  
  const locationStats = [
    ['MERKEZ', records.filter(r => r.checkIn?.location === 'MERKEZ').length],
    ['İŞL', records.filter(r => r.checkIn?.location === 'İŞL').length],
    ['OSB', records.filter(r => r.checkIn?.location === 'OSB').length],
    ['İŞIL', records.filter(r => r.checkIn?.location === 'İŞIL').length]
  ];
  
  doc.autoTable({
    body: locationStats,
    startY: doc.lastAutoTable.finalY + 20,
    theme: 'grid',
    styles: { fontSize: 12 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 40 }
    }
  });
  
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
};

export default {
  exportToPDF,
  exportToExcel,
  exportToCSV,
  exportStatisticsToPDF
};


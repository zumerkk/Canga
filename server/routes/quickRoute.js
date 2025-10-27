const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// 📊 Excel Export - Güzergah Listesi
router.post('/export/excel', async (req, res) => {
  try {
    const { employees, routeInfo } = req.body;

    if (!employees || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Çalışan listesi boş olamaz'
      });
    }

    // Excel workbook oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Servis Güzergahı');

    // Sayfa ayarları
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      margins: {
        left: 0.5, right: 0.5,
        top: 0.75, bottom: 0.75,
        header: 0.3, footer: 0.3
      }
    };

    // Kolon genişlikleri
    worksheet.columns = [
      { width: 5 },   // No
      { width: 25 },  // Ad Soyad
      { width: 20 },  // Departman
      { width: 25 },  // Güzergah
      { width: 20 }   // Durak
    ];

    // 🎨 Başlık - Firma Adı
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'ÇANGA SAVUNMA ENDÜSTRİ LTD.ŞTİ.';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1976d2' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' }
    };
    worksheet.getRow(1).height = 30;

    // 📋 Alt Başlık - Liste Başlığı
    worksheet.mergeCells('A2:E2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = routeInfo.title || 'Servis Güzergah Listesi';
    subtitleCell.font = { size: 14, bold: true };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    subtitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' }
    };
    worksheet.getRow(2).height = 25;

    // 📅 Bilgi Satırı 1 - Tarih ve Lokasyon
    worksheet.mergeCells('A3:E3');
    const infoCell1 = worksheet.getCell('A3');
    const dateStr = new Date(routeInfo.date).toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    infoCell1.value = `📅 ${dateStr} | 📍 ${routeInfo.location}`;
    infoCell1.font = { size: 11, bold: true };
    infoCell1.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(3).height = 20;

    // ⏰ Bilgi Satırı 2 - Vardiya ve Hareket Saati
    worksheet.mergeCells('A4:E4');
    const infoCell2 = worksheet.getCell('A4');
    infoCell2.value = `⏰ Vardiya: ${routeInfo.timeSlot}${routeInfo.shiftTime ? ` | 🚌 Hareket: ${routeInfo.shiftTime}` : ''}`;
    infoCell2.font = { size: 11, bold: true };
    infoCell2.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(4).height = 20;

    // 🚗 Araç Bilgileri (varsa)
    if (routeInfo.driverName || routeInfo.busPlate) {
      worksheet.mergeCells('A5:E5');
      const vehicleCell = worksheet.getCell('A5');
      let vehicleInfo = '🚗 ';
      if (routeInfo.driverName) vehicleInfo += `Şoför: ${routeInfo.driverName}`;
      if (routeInfo.driverPhone) vehicleInfo += ` (${routeInfo.driverPhone})`;
      if (routeInfo.busPlate) vehicleInfo += ` | 🚌 Plaka: ${routeInfo.busPlate}`;
      vehicleCell.value = vehicleInfo;
      vehicleCell.font = { size: 10, bold: true, color: { argb: 'FF2e7d32' } };
      vehicleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      vehicleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F5E9' }
      };
      worksheet.getRow(5).height = 20;
    }

    // 📍 İlk Durak (varsa)
    const currentRow = routeInfo.driverName || routeInfo.busPlate ? 6 : 5;
    if (routeInfo.firstStop) {
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const firstStopCell = worksheet.getCell(`A${currentRow}`);
      firstStopCell.value = `📍 İlk Durak: ${routeInfo.firstStop}`;
      firstStopCell.font = { size: 11, bold: true, color: { argb: 'FFff6f00' } };
      firstStopCell.alignment = { vertical: 'middle', horizontal: 'center' };
      firstStopCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3E0' }
      };
      worksheet.getRow(currentRow).height = 22;
    }

    // Boş satır
    const headerRowNum = currentRow + (routeInfo.firstStop ? 2 : 1);

    // 📊 Tablo Başlıkları
    const headerRow = worksheet.getRow(headerRowNum);
    headerRow.values = ['No', 'Ad Soyad', 'Departman', 'Güzergah', 'Durak'];
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1976d2' }
    };
    headerRow.height = 25;

    // Başlık border
    ['A', 'B', 'C', 'D', 'E'].forEach(col => {
      const cell = worksheet.getCell(`${col}${headerRowNum}`);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Güzergaha göre grupla
    const groupedByRoute = employees.reduce((acc, emp) => {
      const route = emp.servisGuzergahi || emp.serviceInfo?.routeName || 'Belirsiz';
      if (!acc[route]) {
        acc[route] = [];
      }
      acc[route].push(emp);
      return acc;
    }, {});

    // 📝 Çalışan verilerini ekle
    let currentDataRow = headerRowNum + 1;
    let counter = 1;

    Object.entries(groupedByRoute).forEach(([route, emps], groupIndex) => {
      // Güzergah başlığı
      worksheet.mergeCells(`A${currentDataRow}:E${currentDataRow}`);
      const routeHeaderCell = worksheet.getCell(`A${currentDataRow}`);
      routeHeaderCell.value = `🚌 ${route} (${emps.length} kişi)`;
      routeHeaderCell.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      routeHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      routeHeaderCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF455a64' }
      };
      worksheet.getRow(currentDataRow).height = 22;
      currentDataRow++;

      // Çalışanları ekle
      emps.forEach((emp, index) => {
        const row = worksheet.getRow(currentDataRow);
        row.values = [
          counter,
          `${emp.ad || ''} ${emp.soyad || ''}`,
          emp.departman || '',
          route,
          emp.durak || emp.serviceInfo?.stopName || 'Belirsiz'
        ];
        
        row.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        row.height = 20;

        // Zebra stripes
        const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';
        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
          const cell = worksheet.getCell(`${col}${currentDataRow}`);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });

        counter++;
        currentDataRow++;
      });

      // Grup arası boşluk
      currentDataRow++;
    });

    // 📝 Notlar (varsa)
    if (routeInfo.notes) {
      currentDataRow += 1;
      worksheet.mergeCells(`A${currentDataRow}:E${currentDataRow + 1}`);
      const notesCell = worksheet.getCell(`A${currentDataRow}`);
      notesCell.value = `📝 Notlar:\n${routeInfo.notes}`;
      notesCell.font = { size: 10, italic: true };
      notesCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 };
      notesCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF9C4' }
      };
      worksheet.getRow(currentDataRow).height = 40;
    }

    // 📅 Alt Bilgi
    const footerRow = currentDataRow + 2;
    worksheet.mergeCells(`A${footerRow}:E${footerRow}`);
    const footerCell = worksheet.getCell(`A${footerRow}`);
    footerCell.value = `Bu belge ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.`;
    footerCell.font = { size: 9, italic: true, color: { argb: 'FF757575' } };
    footerCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Excel dosyasını gönder
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=guzergah_listesi.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Excel export hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Excel dosyası oluşturulamadı',
      error: error.message
    });
  }
});

// 📄 PDF Export - Güzergah Listesi
router.post('/export/pdf', async (req, res) => {
  try {
    const { employees, routeInfo } = req.body;

    if (!employees || employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Çalışan listesi boş olamaz'
      });
    }

    // PDF oluştur
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Header ayarla
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=guzergah_listesi.pdf');

    // PDF stream'i yanıta bağla
    doc.pipe(res);

    // 🎨 Başlık
    doc.fontSize(18)
       .fillColor('#1976d2')
       .text('ÇANGA SAVUNMA ENDÜSTRİ LTD.ŞTİ.', {
         align: 'center'
       });

    doc.moveDown(0.5);

    doc.fontSize(14)
       .fillColor('#000000')
       .text(routeInfo.title || 'Servis Güzergah Listesi', {
         align: 'center'
       });

    doc.moveDown(0.5);

    // 📅 Bilgiler
    const dateStr = new Date(routeInfo.date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    doc.fontSize(11)
       .fillColor('#666666')
       .text(`📅 ${dateStr} | 📍 ${routeInfo.location}`, {
         align: 'center'
       });

    doc.text(`⏰ Vardiya: ${routeInfo.timeSlot}${routeInfo.shiftTime ? ` | 🚌 Hareket: ${routeInfo.shiftTime}` : ''}`, {
      align: 'center'
    });

    // 🚗 Araç Bilgileri
    if (routeInfo.driverName || routeInfo.busPlate) {
      doc.moveDown(0.3);
      let vehicleInfo = '🚗 ';
      if (routeInfo.driverName) vehicleInfo += `Şoför: ${routeInfo.driverName}`;
      if (routeInfo.driverPhone) vehicleInfo += ` (${routeInfo.driverPhone})`;
      if (routeInfo.busPlate) vehicleInfo += ` | 🚌 Plaka: ${routeInfo.busPlate}`;
      
      doc.fillColor('#2e7d32')
         .text(vehicleInfo, {
           align: 'center'
         });
    }

    // 📍 İlk Durak
    if (routeInfo.firstStop) {
      doc.moveDown(0.3);
      doc.fillColor('#ff6f00')
         .text(`📍 İlk Durak: ${routeInfo.firstStop}`, {
           align: 'center'
         });
    }

    doc.moveDown(1);

    // Çizgi
    doc.moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .strokeColor('#1976d2')
       .lineWidth(2)
       .stroke();

    doc.moveDown(0.5);

    // Güzergaha göre grupla
    const groupedByRoute = employees.reduce((acc, emp) => {
      const route = emp.servisGuzergahi || emp.serviceInfo?.routeName || 'Belirsiz';
      if (!acc[route]) {
        acc[route] = [];
      }
      acc[route].push(emp);
      return acc;
    }, {});

    // 📝 Çalışan listesi
    let counter = 1;
    Object.entries(groupedByRoute).forEach(([route, emps], groupIndex) => {
      // Yeni sayfa gerekirse
      if (doc.y > 700) {
        doc.addPage();
      }

      // Güzergah başlığı
      doc.fontSize(12)
         .fillColor('#FFFFFF')
         .rect(50, doc.y, 495, 25)
         .fill('#455a64')
         .fillColor('#FFFFFF')
         .text(`🚌 ${route} (${emps.length} kişi)`, 55, doc.y - 18);

      doc.moveDown(1.5);

      // Çalışanlar
      emps.forEach((emp) => {
        // Sayfa kontrolü
        if (doc.y > 720) {
          doc.addPage();
        }

        doc.fontSize(10)
           .fillColor('#000000')
           .text(`${counter}. ${emp.ad || ''} ${emp.soyad || ''}`, 60, doc.y, {
             continued: true,
             width: 200
           })
           .text(`${emp.durak || emp.serviceInfo?.stopName || 'Belirsiz'}`, {
             align: 'right'
           });

        counter++;
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);
    });

    // 📝 Notlar
    if (routeInfo.notes) {
      doc.moveDown(1);
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`📝 Notlar: ${routeInfo.notes}`, {
           width: 495
         });
    }

    // 📅 Alt Bilgi
    doc.moveDown(2);
    doc.fontSize(9)
       .fillColor('#999999')
       .text(`Bu belge ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.`, {
         align: 'center'
       });

    // PDF'i sonlandır
    doc.end();

  } catch (error) {
    console.error('PDF export hatası:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'PDF dosyası oluşturulamadı',
        error: error.message
      });
    }
  }
});

// 📊 Excel Export - MANUEL Güzergah (Profesyonel Format)
router.post('/export/excel-manual', async (req, res) => {
  try {
    const { manualData } = req.body;

    if (!manualData) {
      return res.status(400).json({
        success: false,
        message: 'Manuel veri bulunamadı'
      });
    }

    // Excel workbook oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Servis Güzergahı');

    // Sayfa ayarları
    worksheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      margins: {
        left: 0.5, right: 0.5,
        top: 0.75, bottom: 0.75
      }
    };

    // Kolon genişlikleri - Profesyonel tablo yapısı
    worksheet.columns = [
      { width: 8 },   // No
      { width: 35 }   // Durak Adı
    ];

    let currentRow = 1;

    // 🏢 Firma Header
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const companyCell = worksheet.getCell(`A${currentRow}`);
    companyCell.value = 'ÇANGA SAVUNMA SANAYİ';
    companyCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    companyCell.alignment = { vertical: 'middle', horizontal: 'center' };
    companyCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1e3a8a' }
    };
    worksheet.getRow(currentRow).height = 35;
    currentRow++;

    // 📋 Alt Başlık
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const subtitleCell = worksheet.getCell(`A${currentRow}`);
    subtitleCell.value = 'Servis Güzergah Çizelgesi';
    subtitleCell.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    subtitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3b82f6' }
    };
    worksheet.getRow(currentRow).height = 28;
    currentRow++;

    // Boş satır
    currentRow++;

    // 📅 Ana Başlık
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const mainTitleCell = worksheet.getCell(`A${currentRow}`);
    mainTitleCell.value = manualData.mainTitle;
    mainTitleCell.font = { size: 13, bold: true, color: { argb: 'FF1e3a8a' } };
    mainTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    mainTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFe0f2fe' }
    };
    mainTitleCell.border = {
      left: { style: 'thick', color: { argb: 'FF3b82f6' } },
      right: { style: 'thin', color: { argb: 'FFe0f2fe' } },
      top: { style: 'thin', color: { argb: 'FFe0f2fe' } },
      bottom: { style: 'thin', color: { argb: 'FFe0f2fe' } }
    };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Boş satır
    currentRow++;

    // ⏰ Hareket Saati
    const timeCell = worksheet.getCell(`A${currentRow}`);
    timeCell.value = '⏰ Hareket Saati';
    timeCell.font = { size: 10, bold: true, color: { argb: 'FF92400e' } };
    timeCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    timeCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFfef3c7' }
    };
    timeCell.border = {
      left: { style: 'thick', color: { argb: 'FFf59e0b' } },
      right: { style: 'thin', color: { argb: 'FFf59e0b' } },
      top: { style: 'thin', color: { argb: 'FFf59e0b' } },
      bottom: { style: 'thin', color: { argb: 'FFf59e0b' } }
    };

    const timeValueCell = worksheet.getCell(`B${currentRow}`);
    timeValueCell.value = manualData.departureTime;
    timeValueCell.font = { size: 14, bold: true, color: { argb: 'FF78350f' } };
    timeValueCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    timeValueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFfef3c7' }
    };
    timeValueCell.border = {
      right: { style: 'thin', color: { argb: 'FFf59e0b' } },
      top: { style: 'thin', color: { argb: 'FFf59e0b' } },
      bottom: { style: 'thin', color: { argb: 'FFf59e0b' } }
    };
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // 📍 İlk Durak
    const firstStopLabelCell = worksheet.getCell(`A${currentRow}`);
    firstStopLabelCell.value = '📍 İlk Durak';
    firstStopLabelCell.font = { size: 10, bold: true, color: { argb: 'FF1e3a8a' } };
    firstStopLabelCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    firstStopLabelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFdbeafe' }
    };
    firstStopLabelCell.border = {
      left: { style: 'thick', color: { argb: 'FF3b82f6' } },
      right: { style: 'thin', color: { argb: 'FF3b82f6' } },
      top: { style: 'thin', color: { argb: 'FF3b82f6' } },
      bottom: { style: 'thin', color: { argb: 'FF3b82f6' } }
    };

    const firstStopValueCell = worksheet.getCell(`B${currentRow}`);
    firstStopValueCell.value = manualData.firstStop;
    firstStopValueCell.font = { size: 11, bold: true, color: { argb: 'FF1e40af' } };
    firstStopValueCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    firstStopValueCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFdbeafe' }
    };
    firstStopValueCell.border = {
      right: { style: 'thin', color: { argb: 'FF3b82f6' } },
      top: { style: 'thin', color: { argb: 'FF3b82f6' } },
      bottom: { style: 'thin', color: { argb: 'FF3b82f6' } }
    };
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // Boş satır
    currentRow++;

    // 🚌 Duraklar Başlığı
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const stopsHeaderCell = worksheet.getCell(`A${currentRow}`);
    stopsHeaderCell.value = '🚌 GÜZERGAH DURAKLARI';
    stopsHeaderCell.font = { size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    stopsHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    stopsHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1e3a8a' }
    };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Tablo Başlıkları
    const headerNo = worksheet.getCell(`A${currentRow}`);
    headerNo.value = 'No';
    headerNo.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerNo.alignment = { vertical: 'middle', horizontal: 'center' };
    headerNo.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3b82f6' }
    };
    headerNo.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };

    const headerName = worksheet.getCell(`B${currentRow}`);
    headerName.value = 'Durak Adı';
    headerName.font = { size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    headerName.alignment = { vertical: 'middle', horizontal: 'center' };
    headerName.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3b82f6' }
    };
    headerName.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // Durakları Listele
    manualData.stops.forEach((stop, index) => {
      const noCell = worksheet.getCell(`A${currentRow}`);
      noCell.value = index + 1;
      noCell.font = { size: 10, bold: true, color: { argb: 'FF1e3a8a' } };
      noCell.alignment = { vertical: 'middle', horizontal: 'center' };
      const bgColor = index % 2 === 0 ? 'FFf8fafc' : 'FFFFFFFF';
      noCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      noCell.border = {
        top: { style: 'thin', color: { argb: 'FFe2e8f0' } },
        left: { style: 'thin', color: { argb: 'FFe2e8f0' } },
        bottom: { style: 'thin', color: { argb: 'FFe2e8f0' } },
        right: { style: 'thin', color: { argb: 'FFe2e8f0' } }
      };

      const stopCell = worksheet.getCell(`B${currentRow}`);
      stopCell.value = stop;
      stopCell.font = { size: 10, color: { argb: 'FF1e293b' } };
      stopCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      stopCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      stopCell.border = {
        top: { style: 'thin', color: { argb: 'FFe2e8f0' } },
        left: { style: 'thin', color: { argb: 'FFe2e8f0' } },
        bottom: { style: 'thin', color: { argb: 'FFe2e8f0' } },
        right: { style: 'thin', color: { argb: 'FFe2e8f0' } }
      };

      worksheet.getRow(currentRow).height = 20;
      currentRow++;
    });

    // Boş satır
    currentRow++;

    // 🚗 Şoför Bilgileri Başlığı
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const driverHeaderCell = worksheet.getCell(`A${currentRow}`);
    driverHeaderCell.value = '🚗 ŞOFÖR BİLGİLERİ';
    driverHeaderCell.font = { size: 11, bold: true, color: { argb: 'FF78350f' } };
    driverHeaderCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    driverHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFfde68a' }
    };
    driverHeaderCell.border = {
      top: { style: 'thick', color: { argb: 'FFfbbf24' } },
      left: { style: 'thick', color: { argb: 'FFfbbf24' } },
      right: { style: 'thick', color: { argb: 'FFfbbf24' } },
      bottom: { style: 'thin', color: { argb: 'FFfbbf24' } }
    };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Şoför Adı
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const driverNameCell = worksheet.getCell(`A${currentRow}`);
    driverNameCell.value = `👤 ${manualData.driverName}`;
    driverNameCell.font = { size: 11, bold: true, color: { argb: 'FF78350f' } };
    driverNameCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    driverNameCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFfef3c7' }
    };
    driverNameCell.border = {
      left: { style: 'thick', color: { argb: 'FFfbbf24' } },
      right: { style: 'thick', color: { argb: 'FFfbbf24' } },
      top: { style: 'thin', color: { argb: 'FFfbbf24' } },
      bottom: { style: 'thin', color: { argb: 'FFfbbf24' } }
    };
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // Telefon 1
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const phone1Cell = worksheet.getCell(`A${currentRow}`);
    phone1Cell.value = `📞 ${manualData.driverPhone1}`;
    phone1Cell.font = { size: 11, bold: true, color: { argb: 'FF78350f' } };
    phone1Cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    phone1Cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFfef3c7' }
    };
    phone1Cell.border = {
      left: { style: 'thick', color: { argb: 'FFfbbf24' } },
      right: { style: 'thick', color: { argb: 'FFfbbf24' } },
      top: { style: 'thin', color: { argb: 'FFfbbf24' } },
      bottom: { style: 'thin', color: { argb: 'FFfbbf24' } }
    };
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // Telefon 2 / Plaka
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const phone2Cell = worksheet.getCell(`A${currentRow}`);
    phone2Cell.value = `🚗 ${manualData.driverPhone2}`;
    phone2Cell.font = { size: 11, bold: true, color: { argb: 'FF78350f' } };
    phone2Cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    phone2Cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFfef3c7' }
    };
    phone2Cell.border = {
      left: { style: 'thick', color: { argb: 'FFfbbf24' } },
      right: { style: 'thick', color: { argb: 'FFfbbf24' } },
      top: { style: 'thin', color: { argb: 'FFfbbf24' } },
      bottom: { style: 'thick', color: { argb: 'FFfbbf24' } }
    };
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // 📝 Notlar (varsa)
    if (manualData.notes) {
      currentRow += 2;
      worksheet.mergeCells(`A${currentRow}:B${currentRow + 1}`);
      const notesCell = worksheet.getCell(`A${currentRow}`);
      notesCell.value = `📝 Notlar:\n${manualData.notes}`;
      notesCell.font = { size: 10, italic: true, color: { argb: 'FF475569' } };
      notesCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 };
      notesCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFf1f5f9' }
      };
      notesCell.border = {
        left: { style: 'thick', color: { argb: 'FF64748b' } },
        right: { style: 'thin', color: { argb: 'FF64748b' } },
        top: { style: 'thin', color: { argb: 'FF64748b' } },
        bottom: { style: 'thin', color: { argb: 'FF64748b' } }
      };
      worksheet.getRow(currentRow).height = 40;
      currentRow += 2;
    }

    // Alt Bilgi
    currentRow += 2;
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    const footerCell = worksheet.getCell(`A${currentRow}`);
    footerCell.value = `Bu belge otomatik olarak oluşturulmuştur. ${new Date().toLocaleString('tr-TR')}`;
    footerCell.font = { size: 9, italic: true, color: { argb: 'FF64748b' } };
    footerCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Excel dosyasını gönder
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=profesyonel_guzergah.xlsx');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Manuel Excel export hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Excel dosyası oluşturulamadı',
      error: error.message
    });
  }
});

// 📄 PDF Export - MANUEL Güzergah (WhatsApp Formatı)
router.post('/export/pdf-manual', async (req, res) => {
  try {
    const { manualData } = req.body;

    if (!manualData) {
      return res.status(400).json({
        success: false,
        message: 'Manuel veri bulunamadı'
      });
    }

    // PDF oluştur - WhatsApp tarzı koyu tema
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 40,
        bottom: 40,
        left: 40,
        right: 40
      }
    });

    // Header ayarla
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=manuel_guzergah.pdf');

    // PDF stream'i yanıta bağla
    doc.pipe(res);

    // 🎨 Koyu arka plan (WhatsApp tarzı)
    doc.rect(0, 0, 595, 842).fill('#1a1a2e');

    // 🎨 Ana Başlık
    doc.fontSize(16)
       .fillColor('#10b981')
       .text(manualData.mainTitle, 50, 50);

    doc.moveDown(0.8);

    // 📅 Tarih ve Vardiya
    const dateStr = new Date(manualData.date).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    doc.fontSize(13)
       .fillColor('#FFFFFF')
       .text(`${dateStr} Pazartesi ${manualData.shiftTitle}`);

    doc.moveDown(0.5);

    // 🚌 Servis Başlığı
    doc.fontSize(13)
       .fillColor('#FFFFFF')
       .text(manualData.serviceTitle);

    doc.moveDown(0.5);

    // ⏰ Hareket Saati
    doc.fontSize(12)
       .fillColor('#FFFFFF')
       .text(`Hareket saati `, { continued: true })
       .font('Helvetica-Bold')
       .text(manualData.departureTime);

    doc.font('Helvetica');
    doc.moveDown(0.3);

    // 📍 İlk Durak
    doc.fontSize(12)
       .fillColor('#FFFFFF')
       .text(`İlk Durak `, { continued: true })
       .font('Helvetica-Bold')
       .text(manualData.firstStop);

    doc.font('Helvetica');
    doc.moveDown(1);

    // 📍 Duraklar - WhatsApp ok işaretleri
    manualData.stops.forEach((stop) => {
      // Ok ikonu (mavi daire)
      doc.circle(60, doc.y + 6, 8)
         .fill('#4a9eff');

      // Durak adı
      doc.fontSize(11)
         .fillColor('#FFFFFF')
         .text(stop, 80, doc.y);

      doc.moveDown(0.5);
    });

    doc.moveDown(1);

    // 🚗 Şoför Bilgileri
    doc.fontSize(12)
       .fillColor('#FFFFFF')
       .text('şofõr ', { continued: true })
       .font('Helvetica-Bold')
       .text(manualData.driverName);

    doc.font('Helvetica');
    doc.moveDown(0.5);

    // 📞 Telefon 1
    doc.fontSize(13)
       .fillColor('#10b981')
       .font('Helvetica-Bold')
       .text(manualData.driverPhone1);

    doc.moveDown(0.3);

    // 📞 Telefon 2
    doc.fontSize(13)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text(manualData.driverPhone2);

    doc.font('Helvetica');

    // 📝 Notlar (varsa)
    if (manualData.notes) {
      doc.moveDown(2);
      doc.fontSize(10)
         .fillColor('#999999')
         .text(manualData.notes, {
           width: 515
         });
    }

    // 🕐 Zaman Damgası
    doc.fontSize(9)
       .fillColor('#666666')
       .text(
         new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
         0,
         800,
         {
           width: 545,
           align: 'right'
         }
       );

    // PDF'i sonlandır
    doc.end();

  } catch (error) {
    console.error('Manuel PDF export hatası:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'PDF dosyası oluşturulamadı',
        error: error.message
      });
    }
  }
});

module.exports = router;


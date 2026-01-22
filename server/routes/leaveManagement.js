/**
 * İzin Yönetim Sistemi API Routes
 * Toplu/tekli izin girişi ve dilekçe PDF oluşturma
 * Orijinal formlarla birebir aynı
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Employee modelini import et
const Employee = require('../models/Employee');

// Türkçe karakterleri ASCII'ye çevir (PDFKit varsayılan fontları için)
function turkishToAscii(text) {
  if (!text) return '';
  return text
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C');
}

// Supervisor modelini import et
const Supervisor = require('../models/Supervisor');

// LeaveRecord Schema
let LeaveRecord;
try {
  LeaveRecord = mongoose.model('LeaveRecord');
} catch {
  const LeaveRecordSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: {
      type: String,
      enum: ['YILLIK_IZIN', 'IDARI_IZIN', 'GUNLUK_UCRETSIZ', 'SAATLIK_UCRETSIZ'],
      required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    returnDate: { type: Date },
    days: { type: Number, default: 0 },
    hours: { type: Number, default: 0 },
    startTime: { type: String },
    endTime: { type: String },
    reason: { type: String },
    supervisor: { type: String },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor' }, // Bölüm sorumlusu referansı
    requestDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING'
    },
    templateType: { type: String, enum: ['ESKI_TIP', 'YENI_TIP'], default: 'ESKI_TIP' },
    processedDate: { type: Date },
    processedStamp: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  LeaveRecord = mongoose.model('LeaveRecord', LeaveRecordSchema);
}

/**
 * Toplu izin kaydı oluştur
 */
router.post('/bulk-create', async (req, res) => {
  try {
    const { entries } = req.body;
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir izin girişi gereklidir'
      });
    }

    const savedRecords = [];
    
    for (const entry of entries) {
      if (!entry.employeeId || !entry.startDate || !entry.endDate) {
        continue;
      }

      const newRecord = new LeaveRecord({
        employeeId: entry.employeeId,
        leaveType: entry.leaveType || 'YILLIK_IZIN',
        startDate: new Date(entry.startDate),
        endDate: new Date(entry.endDate),
        returnDate: entry.returnDate ? new Date(entry.returnDate) : null,
        days: entry.days || 0,
        hours: entry.hours || 0,
        startTime: entry.startTime || '',
        endTime: entry.endTime || '',
        reason: entry.reason || '',
        supervisor: entry.supervisor || entry.supervisorName || '',
        supervisorId: entry.supervisorId || null,
        requestDate: entry.requestDate ? new Date(entry.requestDate) : new Date(),
        status: entry.status || 'PENDING'
      });

      await newRecord.save();
      savedRecords.push(newRecord);
    }

    res.json({
      success: true,
      message: `${savedRecords.length} izin kaydı başarıyla oluşturuldu`,
      savedCount: savedRecords.length,
      data: savedRecords
    });

  } catch (error) {
    console.error('Toplu izin kaydetme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin kaydetme hatası: ' + error.message
    });
  }
});

/**
 * İzin listesi getir
 */
router.get('/list', async (req, res) => {
  try {
    const { month, year, employeeId, status } = req.query;
    
    let filter = {};
    
    if (month) {
      const [y, m] = month.split('-');
      const startOfMonth = new Date(parseInt(y), parseInt(m) - 1, 1);
      const endOfMonth = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59);
      filter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    }
    
    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1);
      const endOfYear = new Date(parseInt(year), 11, 31, 23, 59, 59);
      filter.startDate = { $gte: startOfYear, $lte: endOfYear };
    }
    
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const leaves = await LeaveRecord.find(filter)
      .populate('employeeId', 'adSoyad employeeId departman pozisyon telefon tcKimlikNo gorevi')
      .sort({ createdAt: -1 })
      .lean();

    // employeeId null ise veritabanından çalışan bilgisini al
    for (let leave of leaves) {
      if (!leave.employeeId || typeof leave.employeeId === 'string') {
        try {
          const emp = await Employee.findById(leave.employeeId).lean();
          if (emp) {
            leave.employeeId = emp;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    res.json({
      success: true,
      data: leaves,
      count: leaves.length
    });

  } catch (error) {
    console.error('İzin listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin listesi alınamadı: ' + error.message
    });
  }
});

/**
 * Dilekçe PDF oluştur - A5 boyutunda, orijinal formla birebir aynı
 */
router.post('/print', async (req, res) => {
  try {
    const { leaveIds, templateType = 'ESKI_TIP' } = req.body;
    
    if (!leaveIds || !Array.isArray(leaveIds) || leaveIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir izin seçilmelidir'
      });
    }

    const leaves = await LeaveRecord.find({ _id: { $in: leaveIds } })
      .populate('employeeId', 'adSoyad employeeId departman pozisyon cepTelefonu tcNo gorevi')
      .populate('supervisorId', 'name department position signature signatureDate')
      .lean();

    if (leaves.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'İzin kayıtları bulunamadı'
      });
    }

    // A5 boyutları
    const A5_WIDTH = 419.53;
    const A5_HEIGHT = 595.28;

    const doc = new PDFDocument({
      size: [A5_WIDTH, A5_HEIGHT],
      layout: templateType === 'YENI_TIP' ? 'landscape' : 'portrait',
      margins: { top: 15, bottom: 15, left: 15, right: 15 },
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="izin_dilekceleri_${Date.now()}.pdf"`);
    
    doc.pipe(res);

    // Logo path
    const logoPath = path.join(__dirname, '../../client/public/canga-logo.png');
    let logoExists = false;
    try {
      logoExists = fs.existsSync(logoPath);
    } catch (e) {
      logoExists = false;
    }

    for (let i = 0; i < leaves.length; i++) {
      const leave = leaves[i];
      let employee = leave.employeeId || {};
      
      // Eğer employee populate edilmemişse (sadece ID ise), manuel olarak çek
      if (!employee.adSoyad && leave.employeeId) {
        try {
          const empId = typeof leave.employeeId === 'string' ? leave.employeeId : leave.employeeId._id || leave.employeeId;
          const emp = await Employee.findById(empId).select('adSoyad tcNo cepTelefonu gorevi pozisyon').lean();
          if (emp) {
            employee = emp;
          }
        } catch (e) {
          console.error('Employee bilgisi alınamadı:', e);
        }
      }
      
      if (i > 0) {
        doc.addPage();
      }

      // Supervisor bilgisini al (populate edilmiş olarak gelir)
      let supervisorData = null;
      if (leave.supervisorId && typeof leave.supervisorId === 'object') {
        // Populate edilmiş - doğrudan kullan
        supervisorData = leave.supervisorId;
      } else if (leave.supervisorId) {
        // ObjectId olarak kalmış - manuel çek
        try {
          supervisorData = await Supervisor.findById(leave.supervisorId)
            .select('name department position signature signatureDate')
            .lean();
        } catch (e) {
          console.error('Supervisor bilgisi alınamadı:', e);
        }
      }
      
      if (templateType === 'ESKI_TIP') {
        generateOldTypeTemplate(doc, leave, employee, logoPath, logoExists, supervisorData);
      } else {
        generateNewTypeTemplate(doc, leave, employee, logoPath, logoExists, supervisorData);
      }
    }

    doc.end();

  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'PDF oluşturma hatası: ' + error.message
    });
  }
});

/**
 * ESKİ TİP - Dikey (Portrait) A5
 * Orijinal formla birebir aynı - siyah beyaz basit çizgiler
 */
function generateOldTypeTemplate(doc, leave, employee, logoPath, logoExists, supervisorData = null) {
  const pageWidth = doc.page.width - 30;
  const startX = 15;
  let y = 15;
  
  // Çizgi kalınlığı
  doc.lineWidth(0.75);
  doc.strokeColor('#000000');
  doc.fillColor('#000000');

  // === HEADER ===
  const headerHeight = 50;
  
  // Dış çerçeve
  doc.rect(startX, y, pageWidth, headerHeight).stroke();
  
  // Logo kutusu (sol) - 75px genişlik
  doc.rect(startX, y, 75, headerHeight).stroke();
  
  // Logo ekle (renkli)
  if (logoExists) {
    try {
      doc.image(logoPath, startX + 5, y + 5, { width: 65, height: 40 });
    } catch (e) {
      doc.font('Helvetica-Bold').fontSize(12).text('CANGA', startX + 12, y + 12);
      doc.font('Helvetica').fontSize(6).text('SAVUNMA ENDUSTRI', startX + 5, y + 28);
    }
  } else {
    doc.font('Helvetica-Bold').fontSize(12).text('CANGA', startX + 12, y + 12);
    doc.font('Helvetica').fontSize(6).text('SAVUNMA ENDUSTRI', startX + 5, y + 28);
  }
  
  // Başlık bölümü (orta)
  const titleStartX = startX + 75;
  const titleWidth = pageWidth - 150;
  doc.rect(titleStartX, y, titleWidth, headerHeight).stroke();
  
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('PERSONEL', titleStartX, y + 12, { width: titleWidth, align: 'center' });
  doc.text('IZIN TALEP FORMU', titleStartX, y + 26, { width: titleWidth, align: 'center' });
  
  // Doküman No bölümü (sağ)
  const docInfoX = startX + pageWidth - 75;
  doc.rect(docInfoX, y, 75, 25).stroke();
  doc.rect(docInfoX, y + 25, 75, 25).stroke();
  
  doc.font('Helvetica').fontSize(7);
  doc.text('Dokuman No', docInfoX + 5, y + 4);
  doc.font('Helvetica-Bold').text('F-22', docInfoX + 50, y + 4);
  
  doc.font('Helvetica').text('Rev.Tarihi/No', docInfoX + 5, y + 29);
  doc.font('Helvetica-Bold').fontSize(6).text('03.03.2021/02', docInfoX + 5, y + 39);
  
  y += headerHeight;
  
  // === PERSONELİN BAŞLIĞI ===
  const sectionHeaderHeight = 18;
  doc.rect(startX, y, pageWidth, sectionHeaderHeight).stroke();
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('PERSONELIN', startX, y + 4, { width: pageWidth, align: 'center' });
  y += sectionHeaderHeight;
  
  // === PERSONEL BİLGİLERİ ===
  const labelWidth = 110;
  const rowHeight = 22;
  
  const personalFields = [
    { label: 'ADI VE SOYADI', value: turkishToAscii(employee.adSoyad) || '' },
    { label: 'T.C. KIMLIK NUMARASI', value: employee.tcNo || employee.tcKimlikNo || '' },
    { label: 'GOREVI', value: turkishToAscii(employee.gorevi || employee.pozisyon) || '' },
    { label: 'TELEFON', value: employee.cepTelefonu || employee.telefon || '' },
  ];
  
  personalFields.forEach(field => {
    doc.rect(startX, y, pageWidth, rowHeight).stroke();
    doc.rect(startX, y, labelWidth, rowHeight).stroke();
    
    doc.font('Helvetica').fontSize(8);
    doc.text(field.label, startX + 4, y + 6);
    doc.text(':', startX + labelWidth + 4, y + 6);
    
    // Değer için kullanılabilir genişlik
    const valueWidth = pageWidth - labelWidth - 20;
    const valueText = field.value || '';
    
    // Uzun metinler için font boyutunu küçült
    let fontSize = 8;
    if (valueText.length > 30) fontSize = 7;
    if (valueText.length > 40) fontSize = 6;
    if (valueText.length > 50) fontSize = 5;
    
    doc.font('Helvetica-Bold').fontSize(fontSize);
    doc.text(valueText, startX + labelWidth + 12, y + 4, { 
      width: valueWidth, 
      height: rowHeight - 6,
      ellipsis: true,
      lineBreak: true
    });
    
    y += rowHeight;
  });
  
  // Açıklama satırı (daha yüksek)
  const descRowHeight = 32;
  doc.rect(startX, y, pageWidth, descRowHeight).stroke();
  doc.rect(startX, y, labelWidth, descRowHeight).stroke();
  
  doc.font('Helvetica').fontSize(8);
  doc.text('ACIKLAMA', startX + 4, y + 4);
  doc.fontSize(6).text('(IZIN KULLANMA NEDENI)', startX + 4, y + 14);
  doc.fontSize(8).text(':', startX + labelWidth + 4, y + 10);
  doc.font('Helvetica').text(turkishToAscii(leave.reason) || '', startX + labelWidth + 12, y + 10, { width: pageWidth - labelWidth - 20 });
  y += descRowHeight;
  
  // İmza satırları
  // İzin Alan Personel İmza
  doc.rect(startX, y, pageWidth, rowHeight + 4).stroke();
  doc.rect(startX, y, labelWidth, rowHeight + 4).stroke();
  doc.font('Helvetica').fontSize(8);
  doc.text('IZIN ALAN PERSONEL', startX + 4, y + 4);
  doc.fontSize(6).text('IMZA', startX + 4, y + 14);
  doc.fontSize(8).text(':', startX + labelWidth + 4, y + 8);
  y += rowHeight + 4;
  
  // Bölüm Sorumlusu İmza - İmza resmi ekle
  const supervisorRowHeight = rowHeight + 8;
  doc.rect(startX, y, pageWidth, supervisorRowHeight).stroke();
  doc.rect(startX, y, labelWidth, supervisorRowHeight).stroke();
  doc.font('Helvetica').fontSize(8);
  doc.text('BOLUM SORUMLUSU', startX + 4, y + 4);
  doc.fontSize(6).text('IMZA', startX + 4, y + 14);
  doc.fontSize(8).text(':', startX + labelWidth + 4, y + 10);
  
  // Supervisor adı
  const supervisorName = supervisorData?.name || leave.supervisor || '';
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text(turkishToAscii(supervisorName), startX + labelWidth + 12, y + 4);
  
  // Supervisor imzası varsa ekle
  if (supervisorData?.signature) {
    try {
      const signatureBuffer = Buffer.from(supervisorData.signature.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      doc.image(signatureBuffer, startX + labelWidth + 12, y + 12, { 
        width: 80, 
        height: 20,
        fit: [80, 20]
      });
    } catch (sigErr) {
      console.error('İmza eklenemedi:', sigErr);
    }
  }
  
  y += supervisorRowHeight;
  
  // === İZİN BİLGİLERİ BAŞLIĞI ===
  doc.rect(startX, y, pageWidth, sectionHeaderHeight).stroke();
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('IZIN BILGILERI', startX, y + 4, { width: pageWidth, align: 'center' });
  y += sectionHeaderHeight;
  
  // === 3 SÜTUNLU İZİN TABLOSU ===
  const colWidth = pageWidth / 3;
  const colHeaderHeight = 22;
  
  // Sütun başlıkları
  const columns = ['YILLIK IZIN', 'GUNLUK (UCRETSIZ)', 'SAATLIK (UCRETSIZ)'];
  columns.forEach((col, idx) => {
    doc.rect(startX + colWidth * idx, y, colWidth, colHeaderHeight).stroke();
    doc.font('Helvetica-Bold').fontSize(7);
    doc.text(col, startX + colWidth * idx + 2, y + 7, { width: colWidth - 4, align: 'center' });
  });
  y += colHeaderHeight;
  
  // Tarih satırları
  const dateRows = [
    { label: 'BASLANGIC TARIHI', hourLabel: 'BASLANGIC SAATI' },
    { label: 'BITIS TARIHI', hourLabel: 'BITIS SAATI' },
    { label: 'ISE BASLAMA TARIHI', hourLabel: 'ISE BASLAMA SAATI' },
    { label: 'IZIN SURESI (GUN)', hourLabel: 'IZIN SURESI (SAAT)' },
  ];
  
  const infoRowHeight = 28;
  
  dateRows.forEach((row, rowIdx) => {
    // Yıllık İzin sütunu
    doc.rect(startX, y, colWidth, infoRowHeight).stroke();
    doc.font('Helvetica').fontSize(6);
    doc.text(row.label, startX + 3, y + 3);
    
    if (leave.leaveType === 'YILLIK_IZIN' || leave.leaveType === 'IDARI_IZIN') {
      doc.font('Helvetica-Bold').fontSize(9);
      if (rowIdx === 0) doc.text(formatDate(leave.startDate), startX + 3, y + 14);
      else if (rowIdx === 1) doc.text(formatDate(leave.endDate), startX + 3, y + 14);
      else if (rowIdx === 2) doc.text(formatDate(leave.returnDate), startX + 3, y + 14);
      else if (rowIdx === 3) doc.text((leave.days || 0) + ' GUN', startX + 3, y + 14);
    } else {
      doc.font('Helvetica').fontSize(7);
      if (rowIdx === 3) doc.text('............GUN', startX + 3, y + 14);
      else doc.text('........../........../202....', startX + 3, y + 14);
    }
    
    // Günlük Ücretsiz sütunu
    doc.rect(startX + colWidth, y, colWidth, infoRowHeight).stroke();
    doc.font('Helvetica').fontSize(6);
    doc.text(row.label, startX + colWidth + 3, y + 3);
    
    if (leave.leaveType === 'GUNLUK_UCRETSIZ') {
      doc.font('Helvetica-Bold').fontSize(9);
      if (rowIdx === 0) doc.text(formatDate(leave.startDate), startX + colWidth + 3, y + 14);
      else if (rowIdx === 1) doc.text(formatDate(leave.endDate), startX + colWidth + 3, y + 14);
      else if (rowIdx === 2) doc.text(formatDate(leave.returnDate), startX + colWidth + 3, y + 14);
      else if (rowIdx === 3) doc.text((leave.days || 0) + ' GUN', startX + colWidth + 3, y + 14);
    } else {
      doc.font('Helvetica').fontSize(7);
      if (rowIdx === 3) doc.text('............GUN', startX + colWidth + 3, y + 14);
      else doc.text('........../........../202....', startX + colWidth + 3, y + 14);
    }
    
    // Saatlik Ücretsiz sütunu
    doc.rect(startX + colWidth * 2, y, colWidth, infoRowHeight).stroke();
    doc.font('Helvetica').fontSize(6);
    doc.text(row.hourLabel, startX + colWidth * 2 + 3, y + 3);
    
    if (leave.leaveType === 'SAATLIK_UCRETSIZ') {
      doc.font('Helvetica-Bold').fontSize(9);
      if (rowIdx === 0) doc.text(leave.startTime || '', startX + colWidth * 2 + 3, y + 14);
      else if (rowIdx === 1) doc.text(leave.endTime || '', startX + colWidth * 2 + 3, y + 14);
      else if (rowIdx === 2) doc.text(leave.startTime || '', startX + colWidth * 2 + 3, y + 14);
      else if (rowIdx === 3) doc.text((leave.hours || 0) + ' SAAT', startX + colWidth * 2 + 3, y + 14);
    } else {
      doc.font('Helvetica').fontSize(7);
      if (rowIdx === 3) doc.text('............SAAT', startX + colWidth * 2 + 3, y + 14);
      else doc.text('............:............', startX + colWidth * 2 + 3, y + 14);
    }
    
    y += infoRowHeight;
  });
  
  // İşleme alındı damgası
  if (leave.processedDate || leave.status === 'APPROVED') {
    const stampX = startX + pageWidth - 90;
    const stampY = 85;
    
    doc.strokeColor('#CC0000').fillColor('#CC0000');
    doc.lineWidth(1.5);
    doc.rect(stampX, stampY, 85, 40).stroke();
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('ISLEME ALINDI', stampX + 5, stampY + 6, { width: 75, align: 'center' });
    doc.font('Helvetica').fontSize(7);
    doc.text('TARIH', stampX + 5, stampY + 18, { width: 75, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text(formatDate(leave.processedDate || new Date()), stampX + 5, stampY + 28, { width: 75, align: 'center' });
    doc.strokeColor('#000000').fillColor('#000000');
  }
}

/**
 * YENİ TİP - Yatay (Landscape) A5
 * Orijinal formla birebir aynı
 */
function generateNewTypeTemplate(doc, leave, employee, logoPath, logoExists, supervisorData = null) {
  const pageWidth = doc.page.width - 30;
  const pageHeight = doc.page.height - 30;
  const startX = 15;
  let y = 15;
  
  doc.lineWidth(0.75);
  doc.strokeColor('#000000');
  doc.fillColor('#000000');

  // === HEADER (Yatay) ===
  const headerHeight = 42;
  
  // Dış çerçeve
  doc.rect(startX, y, pageWidth, headerHeight).stroke();
  
  // Logo kutusu - 65px
  doc.rect(startX, y, 65, headerHeight).stroke();
  
  if (logoExists) {
    try {
      doc.image(logoPath, startX + 4, y + 4, { width: 57, height: 34 });
    } catch (e) {
      doc.font('Helvetica-Bold').fontSize(10).text('CANGA', startX + 8, y + 10);
      doc.font('Helvetica').fontSize(5).text('SAVUNMA ENDUSTRI', startX + 3, y + 24);
    }
  } else {
    doc.font('Helvetica-Bold').fontSize(10).text('CANGA', startX + 8, y + 10);
    doc.font('Helvetica').fontSize(5).text('SAVUNMA ENDUSTRI', startX + 3, y + 24);
  }
  
  // Başlık
  const titleStartX = startX + 65;
  const titleWidth = pageWidth - 130;
  doc.rect(titleStartX, y, titleWidth, headerHeight).stroke();
  
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('PERSONEL IZIN TALEP FORMU', titleStartX, y + 14, { width: titleWidth, align: 'center' });
  
  // Doküman bilgileri
  const docInfoX = startX + pageWidth - 65;
  doc.rect(docInfoX, y, 65, 21).stroke();
  doc.rect(docInfoX, y + 21, 65, 21).stroke();
  
  doc.font('Helvetica').fontSize(6);
  doc.text('Dokuman No', docInfoX + 3, y + 3);
  doc.font('Helvetica-Bold').text('F-22', docInfoX + 45, y + 3);
  
  doc.font('Helvetica').text('Rev.Tarihi/No', docInfoX + 3, y + 24);
  doc.font('Helvetica-Bold').fontSize(5).text('03.03.2021/02', docInfoX + 3, y + 33);
  
  y += headerHeight;
  
  // === ANA İÇERİK - 2 sütunlu ===
  const leftColWidth = pageWidth * 0.40;
  const rightColWidth = pageWidth * 0.60;
  
  // Sol sütun başlığı - PERSONELİN
  const sectionHeaderHeight = 16;
  doc.rect(startX, y, leftColWidth, sectionHeaderHeight).stroke();
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('PERSONELIN', startX, y + 4, { width: leftColWidth, align: 'center' });
  
  // Sağ sütun başlığı - İZİN BİLGİLERİ
  doc.rect(startX + leftColWidth, y, rightColWidth, sectionHeaderHeight).stroke();
  doc.text('IZIN BILGILERI', startX + leftColWidth, y + 4, { width: rightColWidth, align: 'center' });
  
  y += sectionHeaderHeight;
  
  // === SOL SÜTUN - PERSONEL BİLGİLERİ ===
  const labelWidth = 85;
  const leftRowHeight = 20;
  
  // Supervisor bilgisi al
  const supervisorName = supervisorData?.name || leave.supervisor || '';
  
  const personalFields = [
    { label: 'ADI VE SOYADI', value: turkishToAscii(employee.adSoyad) || '' },
    { label: 'T.C. KIMLIK NUMARASI', value: employee.tcNo || employee.tcKimlikNo || '' },
    { label: 'GOREVI', value: turkishToAscii(employee.gorevi || employee.pozisyon) || '' },
    { label: 'ACIKLAMA\n(IZIN KULLANMA NEDENI)', value: turkishToAscii(leave.reason) || '' },
    { label: 'IZIN ALAN PERSONEL\nIMZA', value: '' },
    { label: 'BOLUM SORUMLUSU\nIMZA', value: turkishToAscii(supervisorName), hasSignature: !!supervisorData?.signature },
  ];
  
  let leftY = y;
  personalFields.forEach((field, idx) => {
    const rowH = idx === 3 ? leftRowHeight + 4 : (idx === 5 ? leftRowHeight + 8 : leftRowHeight);
    doc.rect(startX, leftY, leftColWidth, rowH).stroke();
    doc.rect(startX, leftY, labelWidth, rowH).stroke();
    
    const lines = field.label.split('\n');
    doc.font('Helvetica').fontSize(6);
    doc.text(lines[0], startX + 3, leftY + 3);
    if (lines[1]) {
      doc.fontSize(5).text(lines[1], startX + 3, leftY + 11);
    }
    
    doc.fontSize(6).text(':', startX + labelWidth + 2, leftY + rowH/2 - 3);
    
    // Değer için kullanılabilir genişlik
    const valueWidth = leftColWidth - labelWidth - 12;
    const valueText = field.value || '';
    
    // Uzun metinler için font boyutunu küçült
    let fontSize = 7;
    if (valueText.length > 25) fontSize = 6;
    if (valueText.length > 35) fontSize = 5;
    if (valueText.length > 45) fontSize = 4.5;
    
    doc.font('Helvetica-Bold').fontSize(fontSize);
    doc.text(valueText, startX + labelWidth + 8, leftY + 3, { 
      width: valueWidth, 
      height: rowH - 6,
      ellipsis: true,
      lineBreak: true
    });
    
    // Bölüm sorumlusu imzası varsa ekle
    if (idx === 5 && supervisorData?.signature) {
      try {
        const signatureBuffer = Buffer.from(supervisorData.signature.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        doc.image(signatureBuffer, startX + labelWidth + 8, leftY + 12, { 
          width: 60, 
          height: 15,
          fit: [60, 15]
        });
      } catch (sigErr) {
        console.error('İmza eklenemedi:', sigErr);
      }
    }
    
    leftY += rowH;
  });
  
  // === SAĞ SÜTUN - İZİN BİLGİLERİ ===
  const rightStartX = startX + leftColWidth;
  const infoColWidth = rightColWidth / 4;
  
  // Alt başlıklar
  const subHeaders = ['IZIN TALEP\nTARIHI', 'IDARI/YILLIK\nIZIN', 'GUNLUK\n(UCRETSIZ)', 'SAATLIK\n(UCRETSIZ)'];
  const subHeaderHeight = 22;
  
  subHeaders.forEach((header, idx) => {
    doc.rect(rightStartX + infoColWidth * idx, y, infoColWidth, subHeaderHeight).stroke();
    doc.font('Helvetica-Bold').fontSize(5);
    const lines = header.split('\n');
    doc.text(lines[0], rightStartX + infoColWidth * idx + 2, y + 4, { width: infoColWidth - 4, align: 'center' });
    if (lines[1]) {
      doc.text(lines[1], rightStartX + infoColWidth * idx + 2, y + 12, { width: infoColWidth - 4, align: 'center' });
    }
  });
  
  let rightY = y + subHeaderHeight;
  
  // Tarih satırları
  const dateLabels = ['BASLANGIC TARIHI', 'BITIS TARIHI', 'ISE BASLAMA TARIHI', 'IZIN SURESI'];
  const hourLabels = ['BASLANGIC SAATI', 'BITIS SAATI', 'ISE BASLAMA SAATI', 'IZIN SURESI'];
  
  const infoRowHeight = 26;
  
  dateLabels.forEach((label, rowIdx) => {
    // İzin Talep Tarihi sütunu
    doc.rect(rightStartX, rightY, infoColWidth, infoRowHeight).stroke();
    if (rowIdx === 0) {
      doc.font('Helvetica').fontSize(6);
      doc.text('........../........../202....', rightStartX + 3, rightY + infoRowHeight/2 - 3);
    }
    
    // İdari/Yıllık İzin sütunu
    doc.rect(rightStartX + infoColWidth, rightY, infoColWidth, infoRowHeight).stroke();
    doc.font('Helvetica').fontSize(5);
    doc.text(label, rightStartX + infoColWidth + 2, rightY + 2);
    
    if (leave.leaveType === 'YILLIK_IZIN' || leave.leaveType === 'IDARI_IZIN') {
      doc.font('Helvetica-Bold').fontSize(8);
      if (rowIdx === 0) doc.text(formatDate(leave.startDate), rightStartX + infoColWidth + 2, rightY + 12);
      else if (rowIdx === 1) doc.text(formatDate(leave.endDate), rightStartX + infoColWidth + 2, rightY + 12);
      else if (rowIdx === 2) doc.text(formatDate(leave.returnDate), rightStartX + infoColWidth + 2, rightY + 12);
      else if (rowIdx === 3) doc.text((leave.days || 0) + ' GUN', rightStartX + infoColWidth + 2, rightY + 12);
    }
    
    // Günlük Ücretsiz sütunu
    doc.rect(rightStartX + infoColWidth * 2, rightY, infoColWidth, infoRowHeight).stroke();
    doc.font('Helvetica').fontSize(5);
    doc.text(label, rightStartX + infoColWidth * 2 + 2, rightY + 2);
    
    if (leave.leaveType === 'GUNLUK_UCRETSIZ') {
      doc.font('Helvetica-Bold').fontSize(8);
      if (rowIdx === 0) doc.text(formatDate(leave.startDate), rightStartX + infoColWidth * 2 + 2, rightY + 12);
      else if (rowIdx === 1) doc.text(formatDate(leave.endDate), rightStartX + infoColWidth * 2 + 2, rightY + 12);
      else if (rowIdx === 2) doc.text(formatDate(leave.returnDate), rightStartX + infoColWidth * 2 + 2, rightY + 12);
      else if (rowIdx === 3) doc.text((leave.days || 0) + ' GUN', rightStartX + infoColWidth * 2 + 2, rightY + 12);
    }
    
    // Saatlik Ücretsiz sütunu
    doc.rect(rightStartX + infoColWidth * 3, rightY, infoColWidth, infoRowHeight).stroke();
    doc.font('Helvetica').fontSize(5);
    doc.text(hourLabels[rowIdx], rightStartX + infoColWidth * 3 + 2, rightY + 2);
    
    if (leave.leaveType === 'SAATLIK_UCRETSIZ') {
      doc.font('Helvetica-Bold').fontSize(8);
      if (rowIdx === 0) doc.text(leave.startTime || '', rightStartX + infoColWidth * 3 + 2, rightY + 12);
      else if (rowIdx === 1) doc.text(leave.endTime || '', rightStartX + infoColWidth * 3 + 2, rightY + 12);
      else if (rowIdx === 2) doc.text(leave.startTime || '', rightStartX + infoColWidth * 3 + 2, rightY + 12);
      else if (rowIdx === 3) doc.text((leave.hours || 0) + ' SAAT', rightStartX + infoColWidth * 3 + 2, rightY + 12);
    }
    
    rightY += infoRowHeight;
  });
  
  // İşleme alındı damgası
  if (leave.processedDate || leave.status === 'APPROVED') {
    const stampX = startX + pageWidth - 75;
    const stampY = rightY + 10;
    
    doc.strokeColor('#CC0000').fillColor('#CC0000');
    doc.lineWidth(1.5);
    doc.rect(stampX, stampY, 70, 35).stroke();
    doc.font('Helvetica-Bold').fontSize(7);
    doc.text('ISLEME ALINDI', stampX + 3, stampY + 5, { width: 64, align: 'center' });
    doc.font('Helvetica').fontSize(6);
    doc.text('TARIH', stampX + 3, stampY + 15, { width: 64, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(7);
    doc.text(formatDate(leave.processedDate || new Date()), stampX + 3, stampY + 24, { width: 64, align: 'center' });
  }
}

/**
 * Tarih formatla
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * İzin sil
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await LeaveRecord.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'İzin kaydı bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: 'İzin kaydı silindi'
    });
    
  } catch (error) {
    console.error('İzin silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin silme hatası: ' + error.message
    });
  }
});

/**
 * İzin güncelle
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    updateData.updatedAt = new Date();
    
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.returnDate) updateData.returnDate = new Date(updateData.returnDate);
    
    const updated = await LeaveRecord.findByIdAndUpdate(id, updateData, { new: true })
      .populate('employeeId', 'adSoyad employeeId departman pozisyon telefon tcKimlikNo');
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'İzin kaydı bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: 'İzin kaydı güncellendi',
      data: updated
    });
    
  } catch (error) {
    console.error('İzin güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin güncelleme hatası: ' + error.message
    });
  }
});

/**
 * İzin durumunu güncelle
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri'
      });
    }
    
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    if (status === 'APPROVED') {
      updateData.processedDate = new Date();
    }
    
    const updated = await LeaveRecord.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'İzin kaydı bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: `İzin durumu "${status}" olarak güncellendi`,
      data: updated
    });
    
  } catch (error) {
    console.error('İzin durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin durumu güncelleme hatası: ' + error.message
    });
  }
});

/**
 * Tekli izin getir
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const leave = await LeaveRecord.findById(id)
      .populate('employeeId', 'adSoyad employeeId departman pozisyon telefon tcKimlikNo');
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'İzin kaydı bulunamadı'
      });
    }
    
    res.json({
      success: true,
      data: leave
    });
    
  } catch (error) {
    console.error('İzin getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İzin getirme hatası: ' + error.message
    });
  }
});

module.exports = router;

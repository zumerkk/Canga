/**
 * 📋 Manuel Başvuru Listesi API
 * CRUD işlemleri + CSV import + Profesyonel Excel export
 * Çanga Savunma İK Yönetim Sistemi
 */

const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const ManualApplication = require('../models/ManualApplication');

// CSV'ler artık MongoDB'ye import edildi, direkt DB'den okunuyor

/**
 * Pozisyon kategorileme
 */
const categorizePosition = (position) => {
  const pos = (position || '').toUpperCase();
  
  if (pos.includes('CNC') || pos.includes('TORNA') || pos.includes('FREZE') || pos.includes('OPERATÖR')) {
    return 'CNC/Torna Operatörü';
  }
  if (pos.includes('KAYNAK') || pos.includes('ARGON')) return 'Kaynakçı';
  if (pos.includes('MÜHENDİS')) {
    if (pos.includes('MAKİNE') || pos.includes('MAKİNA')) return 'Makine Mühendisi';
    if (pos.includes('ELEKTRİK') || pos.includes('ELEKTRONİK')) return 'Elektrik/Elektronik Mühendisi';
    if (pos.includes('ENDÜSTRİ')) return 'Endüstri Mühendisi';
    return 'Mühendis';
  }
  if (pos.includes('GÜVENLİK')) return 'Güvenlik Görevlisi';
  if (pos.includes('BAKIM') || pos.includes('ONARIM')) return 'Bakım-Onarım';
  if (pos.includes('ELEKTRİK')) return 'Elektrikçi';
  if (pos.includes('MUHASEBE') || pos.includes('İDARİ') || pos.includes('İNSAN KAYNAK')) return 'İdari/Muhasebe';
  if (pos.includes('VASIFSIZ') || pos.includes('GENEL') || pos.includes('BEDEN') || pos.includes('İŞÇİ') || pos.includes('ÜRETİM')) return 'Genel/Üretim';
  if (pos.includes('KALİTE')) return 'Kalite Kontrol';
  if (pos.includes('FORKLİFT')) return 'Forklift Operatörü';
  if (pos.includes('BOYA')) return 'Boyacı';
  if (pos.includes('TEMİZLİK')) return 'Temizlik';
  if (pos.includes('STAJYER') || pos.includes('ÇIRAK')) return 'Stajyer/Çırak';
  
  return 'Diğer';
};

/**
 * GET /api/manual-applications
 * Tüm başvuruları getir (MongoDB'den - CSV'ler zaten import edildi)
 */
router.get('/', async (req, res) => {
  try {
    const { year, position, search, page = 1, limit = 50 } = req.query;
    
    let allApplications = [];
    
    // Database'den oku (CSV'ler zaten import edildi)
    try {
      const dbQuery = { isDeleted: { $ne: true } };
      if (year) dbQuery.year = parseInt(year);
      
      const dbApplications = await ManualApplication.find(dbQuery).lean();
      
      // DB kayıtlarını formata çevir
      allApplications = dbApplications.map(app => ({
        id: app.applicationId || app._id.toString(),
        _id: app._id,
        year: app.year,
        applicationDate: app.applicationDate || '',
        fullName: app.fullName || '',
        position: app.position || 'Belirtilmemiş',
        phone: app.phone || '',
        experience: app.experience || '',
        interview: app.interview || '',
        status: app.status || '',
        finalStatus: app.finalStatus || '',
        reference: app.reference || '',
        email: app.email || '',
        address: app.address || '',
        education: app.education || '',
        notes: app.notes || '',
        source: app.source || 'manual',
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }));
    } catch (dbError) {
      console.error('❌ DB okuma hatası:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Veritabanı bağlantı hatası',
        error: dbError.message
      });
    }
    
    // Pozisyon kategorisi ekle
    allApplications = allApplications.map(app => ({
      ...app,
      positionCategory: categorizePosition(app.position)
    }));
    
    // Arama filtresi
    if (search) {
      const searchLower = search.toLowerCase();
      allApplications = allApplications.filter(app => 
        app.fullName.toLowerCase().includes(searchLower) ||
        app.position.toLowerCase().includes(searchLower) ||
        app.phone.includes(search) ||
        app.reference.toLowerCase().includes(searchLower)
      );
    }
    
    // Pozisyon filtresi
    if (position && position !== 'all') {
      allApplications = allApplications.filter(app => 
        app.positionCategory === position
      );
    }
    
    // Yıla göre sırala (en yeni önce)
    allApplications.sort((a, b) => b.year - a.year);
    
    // İstatistikler
    const stats = {
      total: allApplications.length,
      byYear: {
        2023: allApplications.filter(a => a.year === 2023).length,
        2024: allApplications.filter(a => a.year === 2024).length,
        2025: allApplications.filter(a => a.year === 2025).length
      },
      byCategory: {}
    };
    
    allApplications.forEach(app => {
      if (!stats.byCategory[app.positionCategory]) {
        stats.byCategory[app.positionCategory] = 0;
      }
      stats.byCategory[app.positionCategory]++;
    });
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedApplications = allApplications.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        applications: paginatedApplications,
        pagination: {
          total: allApplications.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(allApplications.length / parseInt(limit))
        },
        stats
      }
    });
    
  } catch (error) {
    console.error('❌ Manuel başvuru listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru listesi alınamadı',
      error: error.message
    });
  }
});

/**
 * GET /api/manual-applications/:id
 * Tek başvuru detayı
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // DB'de ara (CSV'ler zaten import edildi)
    let application = await ManualApplication.findOne({
      $or: [
        { applicationId: id },
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
      ],
      isDeleted: { $ne: true }
    });
    
    if (application) {
      return res.json({
        success: true,
        data: application
      });
    }
    
    res.status(404).json({
      success: false,
      message: 'Başvuru bulunamadı'
    });
    
  } catch (error) {
    console.error('❌ Başvuru detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru detayı alınamadı',
      error: error.message
    });
  }
});

/**
 * POST /api/manual-applications
 * Yeni başvuru ekle
 */
router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      phone,
      position,
      year,
      applicationDate,
      experience,
      reference,
      interview,
      status,
      finalStatus,
      email,
      address,
      education,
      notes
    } = req.body;
    
    // Validasyon
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Ad soyad zorunludur'
      });
    }
    
    if (!position || !position.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pozisyon zorunludur'
      });
    }
    
    if (!year || year < 2000 || year > 2099) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir yıl giriniz (2000-2099)'
      });
    }
    
    const newApplication = new ManualApplication({
      fullName: fullName.trim(),
      phone: phone?.trim() || '',
      position: position.trim(),
      year: parseInt(year),
      applicationDate: applicationDate?.trim() || '',
      experience: experience?.trim() || '',
      reference: reference?.trim() || '',
      interview: interview?.trim() || '',
      status: status?.trim() || '',
      finalStatus: finalStatus?.trim() || '',
      email: email?.trim() || '',
      address: address?.trim() || '',
      education: education?.trim() || '',
      notes: notes?.trim() || '',
      source: 'manual',
      createdBy: req.body.createdBy || 'admin'
    });
    
    await newApplication.save();
    
    console.log(`✅ Yeni başvuru eklendi: ${newApplication.fullName} (${newApplication.applicationId})`);
    
    res.status(201).json({
      success: true,
      message: 'Başvuru başarıyla eklendi',
      data: newApplication
    });
    
  } catch (error) {
    console.error('❌ Başvuru ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru eklenemedi',
      error: error.message
    });
  }
});

/**
 * PUT /api/manual-applications/:id
 * Başvuru güncelle
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Güncelleme tarihi ve kullanıcı
    updateData.updatedBy = req.body.updatedBy || 'admin';
    
    // Pozisyon değiştiyse kategoriyi güncelle
    if (updateData.position) {
      updateData.positionCategory = categorizePosition(updateData.position);
    }
    
    // DB'de güncelle
    const application = await ManualApplication.findOneAndUpdate(
      {
        $or: [
          { applicationId: id },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
        ],
        isDeleted: { $ne: true }
      },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Başvuru bulunamadı'
      });
    }
    
    console.log(`✅ Başvuru güncellendi: ${application.fullName}`);
    
    res.json({
      success: true,
      message: 'Başvuru başarıyla güncellendi',
      data: application
    });
    
  } catch (error) {
    console.error('❌ Başvuru güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru güncellenemedi',
      error: error.message
    });
  }
});

/**
 * DELETE /api/manual-applications/:id
 * Başvuru sil (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await ManualApplication.findOneAndUpdate(
      {
        $or: [
          { applicationId: id },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }
        ],
        isDeleted: { $ne: true }
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.body.deletedBy || 'admin'
      },
      { new: true }
    );
    
    if (!application) {
      // CSV kaydını silme işlemi yapılamaz, sadece bilgilendir
      return res.status(400).json({
        success: false,
        message: 'CSV kayıtları silinemez. Sadece manuel eklenen kayıtlar silinebilir.'
      });
    }
    
    console.log(`🗑️ Başvuru silindi: ${application.fullName} (${id})`);
    
    res.json({
      success: true,
      message: 'Başvuru başarıyla silindi'
    });
    
  } catch (error) {
    console.error('❌ Başvuru silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru silinemedi',
      error: error.message
    });
  }
});

/**
 * POST /api/manual-applications/bulk
 * Toplu başvuru ekle
 */
router.post('/bulk', async (req, res) => {
  try {
    const { applications } = req.body;
    
    if (!applications || !Array.isArray(applications) || applications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Eklenecek başvuru listesi boş'
      });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const app of applications) {
      try {
        const newApp = new ManualApplication({
          fullName: app.fullName?.trim() || 'İsimsiz',
          phone: app.phone?.trim() || '',
          position: app.position?.trim() || 'Belirtilmemiş',
          year: parseInt(app.year) || new Date().getFullYear(),
          applicationDate: app.applicationDate?.trim() || '',
          experience: app.experience?.trim() || '',
          reference: app.reference?.trim() || '',
          source: 'import',
          createdBy: req.body.createdBy || 'bulk-import'
        });
        
        await newApp.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          application: app.fullName || 'Bilinmeyen',
          error: err.message
        });
      }
    }
    
    console.log(`📦 Toplu import: ${results.success} başarılı, ${results.failed} başarısız`);
    
    res.json({
      success: true,
      message: `${results.success} başvuru eklendi, ${results.failed} başarısız`,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Toplu ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Toplu ekleme başarısız',
      error: error.message
    });
  }
});

/**
 * GET /api/manual-applications/export/excel
 * 🏆 Profesyonel Excel Export - Çanga Savunma Kalitesi
 */
router.get('/export/excel', async (req, res) => {
  try {
    const { year } = req.query;
    
    // DB'den verileri çek (CSV'ler zaten import edildi)
    let allApplications = [];
    
    try {
      const dbQuery = { isDeleted: { $ne: true } };
      if (year) dbQuery.year = parseInt(year);
      
      const dbApplications = await ManualApplication.find(dbQuery).lean();
      
      allApplications = dbApplications.map(app => ({
        year: app.year,
        applicationDate: app.applicationDate || '',
        fullName: app.fullName || '',
        position: app.position || '',
        phone: app.phone || '',
        experience: app.experience || '',
        reference: app.reference || '',
        interview: app.interview || '',
        status: app.status || '',
        finalStatus: app.finalStatus || '',
        email: app.email || '',
        source: app.source || 'manual'
      }));
    } catch (dbError) {
      console.error('❌ DB okuma hatası:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Veritabanı bağlantı hatası',
        error: dbError.message
      });
    }
    
    // Pozisyon kategorisi ekle
    allApplications = allApplications.map(app => ({
      ...app,
      positionCategory: categorizePosition(app.position)
    }));
    
    // Excel oluştur
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Çanga Savunma İK Sistemi';
    workbook.lastModifiedBy = 'Çanga HR System';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = false;
    
    // ═══════════════════════════════════════════════════════════════
    // 📊 ANA VERİ SAYFASI
    // ═══════════════════════════════════════════════════════════════
    const mainSheet = workbook.addWorksheet('Başvuru Listesi', {
      properties: { tabColor: { argb: '667EEA' } },
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
      }
    });
    
    // 🏢 BAŞLIK BÖLÜMÜ
    mainSheet.mergeCells('A1:K1');
    const headerCell = mainSheet.getCell('A1');
    headerCell.value = '⬢ ÇANGA SAVUNMA SANAYİ A.Ş.';
    headerCell.font = { name: 'Arial Black', size: 22, bold: true, color: { argb: '1A1A2E' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: 'F8FAFC' } },
        { position: 1, color: { argb: 'E2E8F0' } }
      ]
    };
    mainSheet.getRow(1).height = 45;
    
    // Alt başlık
    mainSheet.mergeCells('A2:K2');
    const subHeaderCell = mainSheet.getCell('A2');
    subHeaderCell.value = '📋 İNSAN KAYNAKLARI - İŞ BAŞVURU ARŞİVİ';
    subHeaderCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: '667EEA' } };
    subHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    mainSheet.getRow(2).height = 30;
    
    // Rapor bilgisi
    mainSheet.mergeCells('A3:K3');
    const infoCell = mainSheet.getCell('A3');
    const dateStr = new Date().toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const yearText = year ? year : '2023-2025';
    infoCell.value = `📅 Rapor Tarihi: ${dateStr} | 📊 Toplam Kayıt: ${allApplications.length.toLocaleString('tr-TR')} | 🗓️ Dönem: ${yearText}`;
    infoCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: '64748B' } };
    infoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
    mainSheet.getRow(3).height = 25;
    
    // Boş satır
    mainSheet.getRow(4).height = 10;
    
    // 📋 KOLON BAŞLIKLARI
    const headers = [
      { header: '#', key: 'no', width: 6 },
      { header: 'YIL', key: 'year', width: 8 },
      { header: 'AD SOYAD', key: 'fullName', width: 28 },
      { header: 'POZİSYON', key: 'position', width: 30 },
      { header: 'KATEGORİ', key: 'category', width: 22 },
      { header: 'TELEFON', key: 'phone', width: 18 },
      { header: 'DENEYİM', key: 'experience', width: 15 },
      { header: 'REFERANS', key: 'reference', width: 20 },
      { header: 'DURUM', key: 'status', width: 15 },
      { header: 'TARİH', key: 'date', width: 14 },
      { header: 'KAYNAK', key: 'source', width: 10 }
    ];
    
    mainSheet.columns = headers;
    
    // Başlık satırı (5. satır)
    const headerRow = mainSheet.getRow(5);
    headerRow.values = ['#', 'YIL', 'AD SOYAD', 'POZİSYON', 'KATEGORİ', 'TELEFON', 'DENEYİM', 'REFERANS', 'DURUM', 'TARİH', 'KAYNAK'];
    headerRow.height = 35;
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    
    // Başlık arka plan gradient efekti
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'gradient',
        gradient: 'angle',
        degree: 0,
        stops: [
          { position: 0, color: { argb: '667EEA' } },
          { position: 1, color: { argb: '764BA2' } }
        ]
      };
      cell.border = {
        top: { style: 'thin', color: { argb: '5B6EE1' } },
        bottom: { style: 'medium', color: { argb: '5B6EE1' } },
        left: { style: 'thin', color: { argb: '5B6EE1' } },
        right: { style: 'thin', color: { argb: '5B6EE1' } }
      };
    });
    
    // 📊 VERİ SATIRLARI
    let rowNum = 6;
    allApplications.forEach((app, index) => {
      const row = mainSheet.getRow(rowNum);
      row.values = [
        index + 1,
        app.year,
        app.fullName || '-',
        app.position || '-',
        app.positionCategory || '-',
        app.phone || '-',
        app.experience || '-',
        app.reference || '-',
        app.status || app.finalStatus || '-',
        app.applicationDate || '-',
        app.source === 'csv' ? 'Arşiv' : 'Manuel'
      ];
      
      row.height = 24;
      row.font = { name: 'Arial', size: 10 };
      row.alignment = { vertical: 'middle' };
      
      // Zebra efekti
      const bgColor = index % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
      
      row.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
        
        // Yıl sütunu renklendirme
        if (colNumber === 2) {
          const yearColors = {
            2023: '667EEA',
            2024: 'F59E0B',
            2025: '10B981'
          };
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: yearColors[app.year] || '64748B' } };
        }
        
        // Numara sütunu
        if (colNumber === 1) {
          cell.font = { name: 'Arial', size: 9, color: { argb: '94A3B8' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        
        // Kategori sütunu
        if (colNumber === 5) {
          cell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };
        }
      });
      
      rowNum++;
    });
    
    // Alt bilgi satırı
    rowNum++;
    mainSheet.mergeCells(`A${rowNum}:K${rowNum}`);
    const footerCell = mainSheet.getCell(`A${rowNum}`);
    footerCell.value = `© ${new Date().getFullYear()} Çanga Savunma Sanayi A.Ş. - Tüm Hakları Saklıdır | Bu rapor otomatik olarak oluşturulmuştur.`;
    footerCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '94A3B8' } };
    footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
    mainSheet.getRow(rowNum).height = 25;
    
    // ═══════════════════════════════════════════════════════════════
    // 📈 İSTATİSTİK SAYFASI
    // ═══════════════════════════════════════════════════════════════
    const statsSheet = workbook.addWorksheet('İstatistikler', {
      properties: { tabColor: { argb: '10B981' } }
    });
    
    // Başlık
    statsSheet.mergeCells('A1:D1');
    const statsHeader = statsSheet.getCell('A1');
    statsHeader.value = '📊 BAŞVURU İSTATİSTİKLERİ';
    statsHeader.font = { name: 'Arial Black', size: 18, bold: true, color: { argb: '1A1A2E' } };
    statsHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    statsHeader.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: 'ECFDF5' } },
        { position: 1, color: { argb: 'D1FAE5' } }
      ]
    };
    statsSheet.getRow(1).height = 40;
    
    // Yıl bazlı istatistikler
    statsSheet.getRow(3).values = ['YIL', 'BAŞVURU SAYISI', 'YÜZDE', 'GRAFİK'];
    statsSheet.getRow(3).font = { bold: true, color: { argb: 'FFFFFF' } };
    statsSheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
    statsSheet.getRow(3).alignment = { horizontal: 'center', vertical: 'middle' };
    statsSheet.getRow(3).height = 28;
    
    const yearStats = [
      { year: 2023, count: allApplications.filter(a => a.year === 2023).length },
      { year: 2024, count: allApplications.filter(a => a.year === 2024).length },
      { year: 2025, count: allApplications.filter(a => a.year === 2025).length }
    ];
    
    yearStats.forEach((stat, idx) => {
      const row = statsSheet.getRow(4 + idx);
      const percentage = allApplications.length > 0 
        ? ((stat.count / allApplications.length) * 100).toFixed(1) 
        : 0;
      const barLength = Math.round(percentage / 5);
      
      row.values = [
        stat.year,
        stat.count.toLocaleString('tr-TR'),
        `%${percentage}`,
        '█'.repeat(barLength) + '░'.repeat(20 - barLength)
      ];
      row.height = 25;
      row.font = { name: 'Arial', size: 11 };
      row.alignment = { vertical: 'middle' };
      
      const bgColor = idx % 2 === 0 ? 'FFFFFF' : 'F0FDF4';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
      });
    });
    
    // Toplam satırı
    const totalRow = statsSheet.getRow(7);
    totalRow.values = [
      'TOPLAM',
      allApplications.length.toLocaleString('tr-TR'),
      '%100',
      '████████████████████'
    ];
    totalRow.font = { name: 'Arial', size: 12, bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'ECFDF5' } };
    totalRow.height = 30;
    totalRow.eachCell(cell => {
      cell.border = {
        top: { style: 'medium', color: { argb: '10B981' } },
        bottom: { style: 'medium', color: { argb: '10B981' } },
        left: { style: 'thin', color: { argb: '10B981' } },
        right: { style: 'thin', color: { argb: '10B981' } }
      };
    });
    
    // Kategori istatistikleri
    statsSheet.getRow(9).values = ['📂 KATEGORİ DAĞILIMI'];
    statsSheet.mergeCells('A9:D9');
    statsSheet.getCell('A9').font = { name: 'Arial', size: 14, bold: true, color: { argb: '667EEA' } };
    statsSheet.getCell('A9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'EEF2FF' } };
    statsSheet.getRow(9).height = 32;
    
    statsSheet.getRow(10).values = ['KATEGORİ', 'SAYI', 'YÜZDE', 'GRAFİK'];
    statsSheet.getRow(10).font = { bold: true, color: { argb: 'FFFFFF' } };
    statsSheet.getRow(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '667EEA' } };
    statsSheet.getRow(10).alignment = { horizontal: 'center', vertical: 'middle' };
    statsSheet.getRow(10).height = 28;
    
    // Kategori hesapla
    const categoryStats = {};
    allApplications.forEach(app => {
      const cat = app.positionCategory || 'Diğer';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });
    
    const sortedCategories = Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1]);
    
    sortedCategories.forEach(([category, count], idx) => {
      const row = statsSheet.getRow(11 + idx);
      const percentage = allApplications.length > 0 
        ? ((count / allApplications.length) * 100).toFixed(1) 
        : 0;
      const barLength = Math.round(percentage / 5);
      
      row.values = [
        category,
        count.toLocaleString('tr-TR'),
        `%${percentage}`,
        '█'.repeat(barLength) + '░'.repeat(20 - barLength)
      ];
      row.height = 22;
      row.font = { name: 'Arial', size: 10 };
      
      const bgColor = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } }
        };
      });
    });
    
    // Sütun genişlikleri
    statsSheet.columns = [
      { width: 30 },
      { width: 18 },
      { width: 12 },
      { width: 25 }
    ];
    
    // Freeze panes
    mainSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];
    
    // Excel dosyasını oluştur
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Dosya adı
    const fileYearPart = year ? year : 'Tum_Yillar';
    const fileName = `Canga_Basvuru_Arsivi_${fileYearPart}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    console.log(`📊 Excel export: ${allApplications.length} kayıt - ${fileName}`);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Excel export hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Excel export başarısız',
      error: error.message
    });
  }
});

/**
 * GET /api/manual-applications/stats
 * İstatistikleri getir
 */
router.get('/stats/summary', async (req, res) => {
  try {
    let allApplications = [];
    
    // DB'den çek (CSV'ler zaten import edildi)
    try {
      const dbApplications = await ManualApplication.find({ isDeleted: { $ne: true } }).lean();
      allApplications = dbApplications.map(app => ({
        year: app.year,
        position: app.position
      }));
    } catch (e) {
      console.error('❌ DB okuma hatası:', e.message);
      return res.status(500).json({
        success: false,
        message: 'İstatistikler alınamadı',
        error: e.message
      });
    }
    
    allApplications = allApplications.map(app => ({
      ...app,
      positionCategory: categorizePosition(app.position)
    }));
    
    const stats = {
      total: allApplications.length,
      byYear: {
        2023: allApplications.filter(a => a.year === 2023).length,
        2024: allApplications.filter(a => a.year === 2024).length,
        2025: allApplications.filter(a => a.year === 2025).length
      },
      byCategory: {},
      topPositions: [],
      recentApplications: allApplications.slice(-10).reverse()
    };
    
    allApplications.forEach(app => {
      if (!stats.byCategory[app.positionCategory]) {
        stats.byCategory[app.positionCategory] = 0;
      }
      stats.byCategory[app.positionCategory]++;
    });
    
    const categoryEntries = Object.entries(stats.byCategory);
    categoryEntries.sort((a, b) => b[1] - a[1]);
    stats.topPositions = categoryEntries.slice(0, 10).map(([name, count]) => ({ name, count }));
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ İstatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınamadı',
      error: error.message
    });
  }
});

/**
 * GET /api/manual-applications/categories
 * Kategorileri getir
 */
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      'CNC/Torna Operatörü',
      'Kaynakçı',
      'Makine Mühendisi',
      'Elektrik/Elektronik Mühendisi',
      'Endüstri Mühendisi',
      'Mühendis',
      'Güvenlik Görevlisi',
      'Bakım-Onarım',
      'Elektrikçi',
      'İdari/Muhasebe',
      'Genel/Üretim',
      'Kalite Kontrol',
      'Forklift Operatörü',
      'Boyacı',
      'Temizlik',
      'Stajyer/Çırak',
      'Diğer'
    ];
    
    res.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kategoriler alınamadı'
    });
  }
});

module.exports = router;

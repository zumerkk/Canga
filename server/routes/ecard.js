const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const crypto = require('crypto');

// E-Kart için benzersiz token oluştur (güvenlik için)
const generateECardToken = (employeeId, secret = 'CANGA_ECARD_2024') => {
  const hash = crypto.createHmac('sha256', secret)
    .update(employeeId.toString())
    .digest('hex')
    .substring(0, 12);
  return hash;
};

// Token doğrula
const verifyECardToken = (employeeId, token, secret = 'CANGA_ECARD_2024') => {
  const expectedToken = generateECardToken(employeeId, secret);
  return token === expectedToken;
};

/**
 * POST /api/e-card/generate-links
 * Seçili çalışanlar için e-kart linklerini oluştur
 * ⚠️ Bu route /:employeeId/:token'dan ÖNCE gelmeli!
 */
router.post('/generate-links', async (req, res) => {
  try {
    const { employeeIds } = req.body;
    
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'employeeIds gerekli'
      });
    }
    
    // Max 50 kişi
    if (employeeIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Aynı anda en fazla 50 kişi için e-kart oluşturulabilir'
      });
    }
    
    const employees = await Employee.find({
      _id: { $in: employeeIds },
      durum: 'AKTIF'
    }).select('employeeId adSoyad departman cepTelefonu');
    
    const links = employees.map(emp => {
      const token = generateECardToken(emp._id.toString());
      return {
        _id: emp._id,
        employeeId: emp.employeeId,
        adSoyad: emp.adSoyad,
        departman: emp.departman,
        cepTelefonu: emp.cepTelefonu,
        token,
        // Frontend URL oluştur
        ecardUrl: `/e-card/${emp._id}/${token}`
      };
    });
    
    res.json({
      success: true,
      count: links.length,
      links
    });
    
  } catch (error) {
    console.error('E-Card links generation error:', error);
    res.status(500).json({
      success: false,
      error: 'E-kart linkleri oluşturulamadı'
    });
  }
});

/**
 * GET /api/e-card/single/:employeeId
 * Tek bir çalışan için e-kart linki oluştur (admin için)
 * ⚠️ Bu route /:employeeId/:token'dan ÖNCE gelmeli!
 */
router.get('/single/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await Employee.findById(employeeId)
      .select('employeeId adSoyad departman cepTelefonu durum');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Çalışan bulunamadı'
      });
    }
    
    if (employee.durum !== 'AKTIF') {
      return res.status(400).json({
        success: false,
        error: 'Sadece aktif çalışanlar için e-kart oluşturulabilir'
      });
    }
    
    const token = generateECardToken(employeeId);
    
    res.json({
      success: true,
      link: {
        _id: employee._id,
        employeeId: employee.employeeId,
        adSoyad: employee.adSoyad,
        departman: employee.departman,
        cepTelefonu: employee.cepTelefonu,
        token,
        ecardUrl: `/e-card/${employeeId}/${token}`
      }
    });
    
  } catch (error) {
    console.error('E-Card single link error:', error);
    res.status(500).json({
      success: false,
      error: 'E-kart linki oluşturulamadı'
    });
  }
});

/**
 * GET /api/e-card/:employeeId/:token
 * Herkese açık E-Kart verisi (güvenlik için token gerekli)
 * 📱 Bu route en sonda olmalı (catch-all pattern)
 */
router.get('/:employeeId/:token', async (req, res) => {
  try {
    const { employeeId, token } = req.params;
    
    // Token doğrulama
    if (!verifyECardToken(employeeId, token)) {
      return res.status(403).json({
        success: false,
        error: 'Geçersiz e-kart bağlantısı'
      });
    }
    
    const employee = await Employee.findById(employeeId)
      .select('employeeId adSoyad pozisyon departman lokasyon tcNo profilePhoto iseGirisTarihi durum');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Çalışan bulunamadı'
      });
    }
    
    // Sadece aktif çalışanların e-kartlarını göster
    if (employee.durum !== 'AKTIF') {
      return res.status(403).json({
        success: false,
        error: 'Bu e-kart artık geçerli değil'
      });
    }
    
    // Barkod değeri oluştur
    let barcodeValue;
    if (employee.employeeId && employee.employeeId !== 'XX0000') {
      barcodeValue = employee.employeeId;
    } else if (employee.tcNo && employee.tcNo.length >= 6) {
      barcodeValue = 'TC' + employee.tcNo.slice(-6);
    } else {
      barcodeValue = 'ID' + employee._id.toString().slice(-8).toUpperCase();
    }
    
    res.json({
      success: true,
      ecard: {
        _id: employee._id,
        employeeId: employee.employeeId,
        adSoyad: employee.adSoyad,
        pozisyon: employee.pozisyon,
        departman: employee.departman,
        lokasyon: employee.lokasyon,
        profilePhoto: employee.profilePhoto,
        iseGirisTarihi: employee.iseGirisTarihi,
        barcode: {
          full: `CANGA-${barcodeValue}`,
          simple: barcodeValue
        }
      }
    });
    
  } catch (error) {
    console.error('E-Card fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'E-kart bilgileri alınamadı'
    });
  }
});

module.exports = router;

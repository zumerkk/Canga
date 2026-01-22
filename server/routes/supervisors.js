/**
 * Bölüm Sorumluları Yönetim API Routes
 * Admin panelinden CRUD işlemleri ve imza yönetimi
 */

const express = require('express');
const router = express.Router();
const Supervisor = require('../models/Supervisor');
const User = require('../models/User');

// Auth middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const { adminpassword } = req.headers;
    
    if (adminpassword === '28150503' || adminpassword === 'CANGA2025') {
      req.user = { role: 'SUPER_ADMIN' };
      return next();
    }
    
    if (adminpassword) {
      const user = await User.findByPassword(adminpassword);
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Yetkisiz erişim' 
    });
  } catch (error) {
    console.error('Auth hatası:', error);
    res.status(500).json({ success: false, message: 'Yetki kontrolü hatası' });
  }
};

// Sadece SUPER_ADMIN kontrolü
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      success: false, 
      message: 'Bu işlem için admin yetkisi gerekli' 
    });
  }
  next();
};

/**
 * 📋 TÜM BÖLÜM SORUMLULARINI GETİR
 * GET /api/supervisors
 */
router.get('/', async (req, res) => {
  try {
    const { activeOnly, department } = req.query;
    
    let filter = {};
    if (activeOnly === 'true') filter.isActive = true;
    if (department) filter.department = department;
    
    const supervisors = await Supervisor.find(filter)
      .select('-password') // Şifreyi gizle
      .sort({ name: 1 })
      .lean();
    
    // İmza bilgisini sadeleştir
    const result = supervisors.map(sup => ({
      ...sup,
      hasSignature: !!sup.signature,
      signature: undefined // Listeleme için imzayı gönderme
    }));
    
    res.json({
      success: true,
      data: result,
      count: result.length
    });
    
  } catch (error) {
    console.error('Bölüm sorumluları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bölüm sorumluları alınamadı: ' + error.message
    });
  }
});

/**
 * 📋 AKTİF BÖLÜM SORUMLULARI LİSTESİ (İzin Yönetimi için)
 * İmza bilgisi dahil
 * GET /api/supervisors/active-list
 */
router.get('/active-list', async (req, res) => {
  try {
    const supervisors = await Supervisor.find({ isActive: true })
      .select('name department position signature signatureDate tcNo phone')
      .sort({ name: 1 })
      .lean();
    
    res.json({
      success: true,
      data: supervisors,
      count: supervisors.length
    });
    
  } catch (error) {
    console.error('Aktif bölüm sorumluları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Liste alınamadı: ' + error.message
    });
  }
});

/**
 * 👤 TEK BÖLÜM SORUMLUSU GETİR
 * GET /api/supervisors/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const supervisor = await Supervisor.findById(id)
      .select('-password')
      .lean();
    
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Bölüm sorumlusu bulunamadı'
      });
    }
    
    res.json({
      success: true,
      data: supervisor
    });
    
  } catch (error) {
    console.error('Bölüm sorumlusu getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bölüm sorumlusu alınamadı: ' + error.message
    });
  }
});

/**
 * ➕ YENİ BÖLÜM SORUMLUSU EKLE
 * POST /api/supervisors
 */
router.post('/', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      tcNo,
      phone,
      email,
      department,
      position,
      signature,
      password,
      responsibleDepartments,
      notes,
      employeeId  // Çalışan listesinden seçildiyse
    } = req.body;
    
    // Zorunlu alanlar
    if (!name || !tcNo || !department) {
      return res.status(400).json({
        success: false,
        message: 'Ad, TC No ve Bölüm zorunludur'
      });
    }
    
    // TC No benzersizlik kontrolü
    const existingTc = await Supervisor.findOne({ tcNo });
    if (existingTc) {
      return res.status(400).json({
        success: false,
        message: 'Bu TC No ile kayıtlı bölüm sorumlusu var'
      });
    }
    
    // Şifre benzersizlik kontrolü
    if (password) {
      const existingPassword = await Supervisor.findOne({ password });
      const userWithPassword = await User.findOne({ password });
      
      if (existingPassword || userWithPassword) {
        return res.status(400).json({
          success: false,
          message: 'Bu şifre zaten kullanılıyor'
        });
      }
    }
    
    const newSupervisor = new Supervisor({
      name,
      tcNo,
      phone,
      email,
      department,
      position: position || 'Bölüm Sorumlusu',
      signature,
      signatureDate: signature ? new Date() : null,
      password,
      responsibleDepartments: responsibleDepartments || [department],
      notes,
      employeeId: employeeId || null,  // Çalışan referansı
      createdBy: 'ADMIN'
    });
    
    await newSupervisor.save();
    
    res.status(201).json({
      success: true,
      message: 'Bölüm sorumlusu başarıyla eklendi',
      data: newSupervisor.toJSON()
    });
    
  } catch (error) {
    console.error('Bölüm sorumlusu ekleme hatası:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu bilgilerle kayıtlı bölüm sorumlusu zaten var'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Bölüm sorumlusu eklenemedi: ' + error.message
    });
  }
});

/**
 * ✏️ BÖLÜM SORUMLUSUNU GÜNCELLE
 * PUT /api/supervisors/:id
 */
router.put('/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Şifre güncelleniyorsa benzersizlik kontrolü
    if (updates.password) {
      const existingPassword = await Supervisor.findOne({ 
        password: updates.password,
        _id: { $ne: id }
      });
      const userWithPassword = await User.findOne({ password: updates.password });
      
      if (existingPassword || userWithPassword) {
        return res.status(400).json({
          success: false,
          message: 'Bu şifre zaten kullanılıyor'
        });
      }
    }
    
    // İmza güncelleniyorsa tarihi de güncelle
    if (updates.signature) {
      updates.signatureDate = new Date();
    }
    
    updates.updatedAt = new Date();
    
    const updated = await Supervisor.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Bölüm sorumlusu bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: 'Bölüm sorumlusu güncellendi',
      data: updated
    });
    
  } catch (error) {
    console.error('Güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Güncelleme hatası: ' + error.message
    });
  }
});

/**
 * 🖊️ İMZA GÜNCELLE
 * PUT /api/supervisors/:id/signature
 */
router.put('/:id/signature', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { signature } = req.body;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'İmza verisi gerekli'
      });
    }
    
    const updated = await Supervisor.findByIdAndUpdate(
      id,
      {
        signature,
        signatureDate: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Bölüm sorumlusu bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: 'İmza başarıyla kaydedildi',
      data: {
        _id: updated._id,
        name: updated.name,
        signatureDate: updated.signatureDate,
        hasSignature: true
      }
    });
    
  } catch (error) {
    console.error('İmza güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İmza kaydedilemedi: ' + error.message
    });
  }
});

/**
 * 🗑️ İMZA SİL
 * DELETE /api/supervisors/:id/signature
 */
router.delete('/:id/signature', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const updated = await Supervisor.findByIdAndUpdate(
      id,
      {
        signature: null,
        signatureDate: null,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Bölüm sorumlusu bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: 'İmza silindi'
    });
    
  } catch (error) {
    console.error('İmza silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İmza silinemedi: ' + error.message
    });
  }
});

/**
 * 🔄 BÖLÜM SORUMLUSUNU AKTİF/PASİF YAP
 * PATCH /api/supervisors/:id/toggle-status
 */
router.patch('/:id/toggle-status', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const supervisor = await Supervisor.findById(id);
    if (!supervisor) {
      return res.status(404).json({
        success: false,
        message: 'Bölüm sorumlusu bulunamadı'
      });
    }
    
    supervisor.isActive = !supervisor.isActive;
    supervisor.updatedAt = new Date();
    await supervisor.save();
    
    res.json({
      success: true,
      message: `Bölüm sorumlusu ${supervisor.isActive ? 'aktif' : 'pasif'} edildi`,
      data: { isActive: supervisor.isActive }
    });
    
  } catch (error) {
    console.error('Durum değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Durum değiştirilemedi: ' + error.message
    });
  }
});

/**
 * 🗑️ BÖLÜM SORUMLUSUNU SİL
 * DELETE /api/supervisors/:id
 */
router.delete('/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Supervisor.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Bölüm sorumlusu bulunamadı'
      });
    }
    
    res.json({
      success: true,
      message: 'Bölüm sorumlusu silindi'
    });
    
  } catch (error) {
    console.error('Silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Silme hatası: ' + error.message
    });
  }
});

/**
 * 🔐 BÖLÜM SORUMLUSU GİRİŞİ
 * POST /api/supervisors/login
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Şifre gerekli'
      });
    }
    
    const supervisor = await Supervisor.findByPassword(password);
    
    if (!supervisor) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz şifre'
      });
    }
    
    // Giriş kaydı
    await supervisor.recordLogin();
    
    res.json({
      success: true,
      message: 'Giriş başarılı',
      user: {
        id: supervisor._id,
        name: supervisor.name,
        department: supervisor.department,
        position: supervisor.position,
        role: 'SUPERVISOR',
        supervisorId: supervisor._id,
        isActive: supervisor.isActive,
        lastLogin: supervisor.lastLogin
      }
    });
    
  } catch (error) {
    console.error('Supervisor login hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş hatası: ' + error.message
    });
  }
});

/**
 * 📊 İSTATİSTİKLER
 * GET /api/supervisors/stats
 */
router.get('/stats/overview', authenticateAdmin, async (req, res) => {
  try {
    const total = await Supervisor.countDocuments();
    const active = await Supervisor.countDocuments({ isActive: true });
    const withSignature = await Supervisor.countDocuments({ 
      isActive: true, 
      signature: { $ne: null } 
    });
    const withPassword = await Supervisor.countDocuments({ 
      isActive: true, 
      password: { $ne: null } 
    });
    
    const byDepartment = await Supervisor.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        total,
        active,
        withSignature,
        withPassword,
        byDepartment
      }
    });
    
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistik alınamadı: ' + error.message
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');

// 📋 Tüm iş başvurularını getir (İK için)
router.get('/', async (req, res) => {
  try {
    console.log('📋 İş başvuruları getiriliyor...');
    
    const { status, page = 1, limit = 20, search } = req.query;
    
    // Filtre oluştur
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { 'personalInfo.name': { $regex: search, $options: 'i' } },
        { 'personalInfo.surname': { $regex: search, $options: 'i' } },
        { applicationId: { $regex: search, $options: 'i' } }
      ];
    }

    // Sayfalama hesapla
    const skip = (page - 1) * limit;
    
    // Başvuruları getir
    const applications = await JobApplication.find(filter)
      .sort({ submittedAt: -1 }) // En yeni başta
      .skip(skip)
      .limit(parseInt(limit));

    // Toplam sayı
    const total = await JobApplication.countDocuments(filter);

    console.log(`✅ ${applications.length} başvuru getirildi (${total} toplam)`);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: skip + applications.length < total,
          hasPrev: page > 1
        },
        count: total
      }
    });

  } catch (error) {
    console.error('❌ İş başvuruları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İş başvuruları getirilemedi',
      error: error.message
    });
  }
});

// 📝 Yeni iş başvurusu oluştur
router.post('/', async (req, res) => {
  try {
    console.log('📝 Yeni iş başvurusu oluşturuluyor...');
    
    const applicationData = req.body;
    
    // Application ID oluştur (eğer yoksa)
    if (!applicationData.applicationId) {
      applicationData.applicationId = `JOB-${Date.now()}`;
    }

    // Varsayılan durum
    if (!applicationData.status) {
      applicationData.status = 'pending';
    }

    // Yeni başvuru oluştur
    const newApplication = new JobApplication(applicationData);
    const savedApplication = await newApplication.save();

    console.log(`✅ Başvuru oluşturuldu: ${savedApplication.applicationId}`);

    res.status(201).json({
      success: true,
      message: 'İş başvurusu başarıyla alındı',
      data: savedApplication
    });

  } catch (error) {
    console.error('❌ İş başvurusu oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İş başvurusu oluşturulamadı',
      error: error.message
    });
  }
});

// 👁️ Belirli bir başvuruyu getir
router.get('/:id', async (req, res) => {
  try {
    console.log(`👁️ Başvuru detayı getiriliyor: ${req.params.id}`);
    
    const application = await JobApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Başvuru bulunamadı'
      });
    }

    console.log(`✅ Başvuru detayı getirildi: ${application.applicationId}`);

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('❌ Başvuru detayı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru detayı getirilemedi',
      error: error.message
    });
  }
});

// ✏️ Başvuru durumunu güncelle (İK için)
router.put('/:id/status', async (req, res) => {
  try {
    console.log(`✏️ Başvuru durumu güncelleniyor: ${req.params.id}`);
    
    const { status, notes, reviewedBy } = req.body;
    
    // Geçerli durumları kontrol et
    const validStatuses = ['pending', 'reviewing', 'interview', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum değeri'
      });
    }

    // Başvuruyu güncelle
    const updatedApplication = await JobApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        reviewedBy,
        reviewedAt: new Date(),
        lastUpdatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Başvuru bulunamadı'
      });
    }

    console.log(`✅ Başvuru durumu güncellendi: ${updatedApplication.applicationId} -> ${status}`);

    res.json({
      success: true,
      message: 'Başvuru durumu başarıyla güncellendi',
      data: updatedApplication
    });

  } catch (error) {
    console.error('❌ Başvuru durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Başvuru durumu güncellenemedi',
      error: error.message
    });
  }
});

// 🗑️ Başvuruyu sil (sadece admin)
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🗑️ Başvuru siliniyor: ${req.params.id}`);
    
    const deletedApplication = await JobApplication.findByIdAndDelete(req.params.id);
    
    if (!deletedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Başvuru bulunamadı'
      });
    }

    console.log(`✅ Başvuru silindi: ${deletedApplication.applicationId}`);

    res.json({
      success: true,
      message: 'Başvuru başarıyla silindi',
      data: deletedApplication
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

// 📊 İş başvuruları istatistikleri (İK için)
router.get('/stats/overview', async (req, res) => {
  try {
    console.log('📊 İş başvuruları istatistikleri getiriliyor...');
    
    // Durum bazında sayılar
    const statusStats = await JobApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Aylık başvuru sayıları (son 6 ay)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await JobApplication.aggregate([
      {
        $match: {
          submittedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Toplam sayılar
    const totalApplications = await JobApplication.countDocuments();
    const pendingCount = await JobApplication.countDocuments({ status: 'pending' });
    const approvedCount = await JobApplication.countDocuments({ status: 'approved' });

    console.log(`✅ İstatistikler: ${totalApplications} toplam, ${pendingCount} bekliyor`);

    res.json({
      success: true,
      data: {
        total: totalApplications,
        pending: pendingCount,
        approved: approvedCount,
        statusStats,
        monthlyStats
      }
    });

  } catch (error) {
    console.error('❌ İstatistik getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler getirilemedi',
      error: error.message
    });
  }
});

// 🧹 Test başvurularını toplu silme
router.delete('/bulk/test-data', async (req, res) => {
  try {
    console.log('🧹 Test başvuruları siliniyor...');
    
    // TEST- ile başlayan veya JOB-TEST içeren başvuruları bul ve sil
    const result = await JobApplication.deleteMany({
      $or: [
        { applicationId: { $regex: /^TEST-/i } },
        { applicationId: { $regex: /TEST/i } },
        { 'personalInfo.name': { $regex: /test/i } },
        { submittedBy: 'TEST' }
      ]
    });

    console.log(`✅ ${result.deletedCount} test başvurusu silindi`);

    res.json({
      success: true,
      message: `${result.deletedCount} test başvurusu başarıyla silindi`,
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('❌ Test başvuruları silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Test başvuruları silinemedi',
      error: error.message
    });
  }
});

module.exports = router;

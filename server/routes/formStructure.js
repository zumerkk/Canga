const express = require('express');
const router = express.Router();
const FormStructure = require('../models/FormStructure');

// 📋 Form yapısını getir
router.get('/', async (req, res) => {
  try {
    console.log('📋 Form yapısı getiriliyor...');
    
    // En güncel form yapısını getir
    let formStructure = await FormStructure.findOne().sort({ updatedAt: -1 });
    
    if (!formStructure) {
      // Varsayılan form yapısını oluştur
      formStructure = await FormStructure.create(getDefaultFormStructure());
      console.log('✅ Varsayılan form yapısı oluşturuldu');
    }

    console.log(`✅ Form yapısı getirildi: ${formStructure.title}`);

    res.json({
      success: true,
      data: formStructure
    });

  } catch (error) {
    console.error('❌ Form yapısı getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Form yapısı getirilemedi',
      error: error.message
    });
  }
});

// 📝 Form yapısını güncelle/oluştur
router.post('/', async (req, res) => {
  try {
    console.log('📝 Form yapısı güncelleniyor...');
    
    const { structure, updatedBy } = req.body;
    
    if (!structure) {
      return res.status(400).json({
        success: false,
        message: 'Form yapısı verisi gereklidir'
      });
    }

    // Mevcut form yapısını sil ve yenisini oluştur (sadece bir tane olsun)
    await FormStructure.deleteMany({});
    
    const newFormStructure = await FormStructure.create({
      ...structure,
      updatedBy: updatedBy || 'SYSTEM',
      version: Date.now() // Versiyon kontrolü için
    });

    console.log(`✅ Form yapısı güncellendi: ${newFormStructure.title}`);

    res.json({
      success: true,
      message: 'Form yapısı başarıyla güncellendi',
      data: newFormStructure
    });

  } catch (error) {
    console.error('❌ Form yapısı güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Form yapısı güncellenemedi',
      error: error.message
    });
  }
});

// 📊 Form yapısı versiyonlarını listele
router.get('/versions', async (req, res) => {
  try {
    console.log('📊 Form yapısı versiyonları getiriliyor...');
    
    const versions = await FormStructure.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title updatedBy updatedAt version');

    console.log(`✅ ${versions.length} versiyon getirildi`);

    res.json({
      success: true,
      data: versions
    });

  } catch (error) {
    console.error('❌ Form versiyonları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Form versiyonları getirilemedi',
      error: error.message
    });
  }
});

// 🔄 Belirli bir versiyonu geri yükle
router.post('/restore/:version', async (req, res) => {
  try {
    console.log(`🔄 Form yapısı geri yükleniyor: ${req.params.version}`);
    
    const targetVersion = await FormStructure.findOne({ version: req.params.version });
    
    if (!targetVersion) {
      return res.status(404).json({
        success: false,
        message: 'Belirtilen versiyon bulunamadı'
      });
    }

    // Mevcut aktif versiyonu sil ve hedef versiyonu kopyala
    await FormStructure.deleteMany({ active: true });
    
    const restoredStructure = await FormStructure.create({
      ...targetVersion.toObject(),
      _id: undefined, // Yeni ID oluştur
      active: true,
      restoredAt: new Date(),
      restoredBy: req.body.restoredBy || 'SYSTEM',
      version: Date.now() // Yeni versiyon
    });

    console.log(`✅ Form yapısı geri yüklendi: ${restoredStructure.title}`);

    res.json({
      success: true,
      message: 'Form yapısı başarıyla geri yüklendi',
      data: restoredStructure
    });

  } catch (error) {
    console.error('❌ Form yapısı geri yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Form yapısı geri yüklenemedi',
      error: error.message
    });
  }
});

// Varsayılan form yapısı
function getDefaultFormStructure() {
  return {
    title: 'İş Başvuru Formu',
    description: 'Çanga Savunma Endüstrisi A.Ş. İş Başvuru Sistemi',
    active: true,
    sections: [
      {
        id: 'personal',
        title: 'A. KİŞİSEL BİLGİLER',
        icon: 'person',
        active: true,
        order: 1,
        fields: [
          { 
            name: 'name', 
            label: 'Adınız', 
            type: 'text', 
            required: true, 
            order: 1,
            validation: { minLength: 2, maxLength: 50 }
          },
          { 
            name: 'surname', 
            label: 'Soyadınız', 
            type: 'text', 
            required: true, 
            order: 2,
            validation: { minLength: 2, maxLength: 50 }
          },
          { 
            name: 'email', 
            label: 'E-posta Adresiniz', 
            type: 'email', 
            required: true, 
            order: 3,
            validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
          },
          { 
            name: 'phoneMobile', 
            label: 'Cep Telefonu', 
            type: 'tel', 
            required: true, 
            order: 4,
            placeholder: '0532 123 45 67',
            validation: { pattern: '^[0-9]{10,11}$' }
          },
          { 
            name: 'gender', 
            label: 'Cinsiyetiniz', 
            type: 'radio', 
            required: true, 
            order: 5,
            options: ['Erkek', 'Bayan'] 
          },
          { 
            name: 'address', 
            label: 'İkametgâh Adresiniz', 
            type: 'textarea', 
            required: true, 
            order: 6,
            placeholder: 'Tam adresinizi yazınız...'
          },
          { 
            name: 'nationality', 
            label: 'Uyruğunuz', 
            type: 'text', 
            required: false, 
            order: 7,
            defaultValue: 'TC'
          },
          { 
            name: 'phoneHome', 
            label: 'Ev Telefonu', 
            type: 'tel', 
            required: false, 
            order: 8,
            placeholder: '0212 123 45 67'
          },
          { 
            name: 'militaryStatus', 
            label: 'Askerlik Durumu', 
            type: 'radio', 
            required: false, 
            order: 9,
            options: ['Tecilli', 'Muaf', 'Yapıldı', 'Muafiyet'] 
          },
          { 
            name: 'drivingLicense', 
            label: 'Sürücü Belgesi', 
            type: 'radio', 
            required: false, 
            order: 10,
            options: ['B', 'C', 'D', 'E', 'F', 'Yok'] 
          },
          { 
            name: 'maritalStatus', 
            label: 'Medeni Durum', 
            type: 'radio', 
            required: false, 
            order: 11,
            options: ['Evli', 'Bekar'] 
          }
        ]
      },
      {
        id: 'family',
        title: 'B. AİLE BİLGİLERİ',
        icon: 'family',
        active: true,
        order: 2,
        fields: [
          { 
            name: 'spouseName', 
            label: 'Eş Adı Soyadı', 
            type: 'text', 
            required: false, 
            order: 1 
          },
          { 
            name: 'spouseProfession', 
            label: 'Eş Mesleği', 
            type: 'text', 
            required: false, 
            order: 2 
          },
          { 
            name: 'spouseAge', 
            label: 'Eş Yaşı', 
            type: 'number', 
            required: false, 
            order: 3 
          }
        ]
      },
      {
        id: 'education',
        title: 'C. EĞİTİM BİLGİLERİ',
        icon: 'school',
        active: true,
        order: 3,
        fields: [
          { 
            name: 'schoolName', 
            label: 'Okul Adı', 
            type: 'text', 
            required: true, 
            order: 1 
          },
          { 
            name: 'department', 
            label: 'Bölüm/Alan', 
            type: 'text', 
            required: true, 
            order: 2 
          },
          { 
            name: 'startDate', 
            label: 'Başlangıç Tarihi', 
            type: 'date', 
            required: false, 
            order: 3 
          },
          { 
            name: 'endDate', 
            label: 'Bitiş Tarihi', 
            type: 'date', 
            required: false, 
            order: 4 
          },
          { 
            name: 'degreeReceived', 
            label: 'Mezuniyet Derecesi', 
            type: 'select', 
            required: false, 
            order: 5,
            options: ['Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora'] 
          }
        ]
      },
      {
        id: 'computer',
        title: 'D. BİLGİSAYAR BİLGİSİ',
        icon: 'computer',
        active: true,
        order: 4,
        fields: [
          { 
            name: 'program', 
            label: 'Program/Yazılım Adı', 
            type: 'text', 
            required: false, 
            order: 1 
          },
          { 
            name: 'skillLevel', 
            label: 'Kullanım Seviyesi', 
            type: 'radio', 
            required: false, 
            order: 2,
            options: ['Az', 'Orta', 'İyi', 'Çok İyi'] 
          }
        ]
      },
      {
        id: 'experience',
        title: 'E. İŞ TÜCRÜBESİ',
        icon: 'work',
        active: true,
        order: 5,
        fields: [
          { 
            name: 'companyName', 
            label: 'Firma/Kurum Adı', 
            type: 'text', 
            required: false, 
            order: 1 
          },
          { 
            name: 'position', 
            label: 'Göreviniz', 
            type: 'text', 
            required: false, 
            order: 2 
          },
          { 
            name: 'startDate', 
            label: 'Giriş Tarihi', 
            type: 'date', 
            required: false, 
            order: 3 
          },
          { 
            name: 'endDate', 
            label: 'Çıkış Tarihi', 
            type: 'date', 
            required: false, 
            order: 4 
          },
          { 
            name: 'reasonForLeaving', 
            label: 'Ayrılma Sebebi', 
            type: 'text', 
            required: false, 
            order: 5 
          },
          { 
            name: 'salaryReceived', 
            label: 'Aldığınız Ücret (Net/₺)', 
            type: 'text', 
            required: false, 
            order: 6 
          }
        ]
      },
      {
        id: 'other',
        title: 'F. DİĞER BİLGİLER',
        icon: 'description',
        active: true,
        order: 6,
        fields: [
          { 
            name: 'healthProblem', 
            label: 'Sağlık probleminiz var mı?', 
            type: 'radio', 
            required: false, 
            order: 1,
            options: ['Hayır', 'Evet'] 
          },
          { 
            name: 'healthDetails', 
            label: 'Sağlık problemi detayları', 
            type: 'textarea', 
            required: false, 
            order: 2 
          },
          { 
            name: 'conviction', 
            label: 'Mahkûmiyet durumunuz var mı?', 
            type: 'radio', 
            required: false, 
            order: 3,
            options: ['Hayır', 'Evet'] 
          },
          { 
            name: 'convictionDetails', 
            label: 'Mahkûmiyet detayları', 
            type: 'textarea', 
            required: false, 
            order: 4 
          },
          { 
            name: 'phonePermission', 
            label: 'Telefon ile aranmaya izin veriyorum', 
            type: 'checkbox', 
            required: false, 
            order: 5 
          }
        ]
      },
      {
        id: 'references',
        title: 'G. REFERANSLAR',
        icon: 'contact_phone',
        active: true,
        order: 7,
        fields: [
          { 
            name: 'referenceName', 
            label: 'Referans Adı Soyadı', 
            type: 'text', 
            required: false, 
            order: 1 
          },
          { 
            name: 'referenceCompany', 
            label: 'Çalıştığı Kurum', 
            type: 'text', 
            required: false, 
            order: 2 
          },
          { 
            name: 'referencePosition', 
            label: 'Görevi', 
            type: 'text', 
            required: false, 
            order: 3 
          },
          { 
            name: 'referencePhone', 
            label: 'Telefon Numarası', 
            type: 'tel', 
            required: false, 
            order: 4 
          }
        ]
      }
    ],
    settings: {
      allowAnonymous: true,
      requireEmailVerification: false,
      autoSaveEnabled: true,
      maxFileSize: '5MB',
      allowedFileTypes: ['pdf', 'doc', 'docx'],
      captchaEnabled: false,
      duplicateSubmissionCheck: true
    },
    styling: {
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Roboto'
    }
  };
}

module.exports = router;

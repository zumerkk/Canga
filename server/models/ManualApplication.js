/**
 * 📋 Manuel Başvuru Modeli
 * Arşiv başvuruları ve manuel eklenen kayıtlar için
 */

const mongoose = require('mongoose');

const manualApplicationSchema = new mongoose.Schema({
  // Benzersiz başvuru ID
  applicationId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `MAN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    }
  },

  // Temel Bilgiler
  fullName: {
    type: String,
    required: [true, 'Ad soyad zorunludur'],
    trim: true,
    minlength: [2, 'Ad soyad en az 2 karakter olmalı'],
    maxlength: [100, 'Ad soyad en fazla 100 karakter olabilir']
  },

  // Telefon
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Boş olabilir veya format kontrolü
        if (!v) return true;
        return /^[\d\s\+\-\(\)]+$/.test(v);
      },
      message: 'Geçersiz telefon formatı'
    }
  },

  // Pozisyon
  position: {
    type: String,
    required: [true, 'Pozisyon zorunludur'],
    trim: true
  },

  // Pozisyon Kategorisi (otomatik belirlenir)
  positionCategory: {
    type: String,
    enum: [
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
    ],
    default: 'Diğer'
  },

  // Başvuru Yılı
  year: {
    type: Number,
    required: [true, 'Yıl zorunludur'],
    min: [2000, 'Yıl 2000\'den küçük olamaz'],
    max: [2099, 'Yıl 2099\'dan büyük olamaz']
  },

  // Başvuru Tarihi
  applicationDate: {
    type: String,
    trim: true
  },

  // Deneyim
  experience: {
    type: String,
    trim: true
  },

  // Referans
  reference: {
    type: String,
    trim: true
  },

  // Görüşme bilgisi (2023 verisi için)
  interview: {
    type: String,
    trim: true
  },

  // Durum
  status: {
    type: String,
    trim: true
  },

  // Son durum
  finalStatus: {
    type: String,
    trim: true
  },

  // E-posta
  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Adres
  address: {
    type: String,
    trim: true
  },

  // Eğitim durumu
  education: {
    type: String,
    trim: true
  },

  // Notlar
  notes: {
    type: String,
    trim: true
  },

  // Kaynak
  source: {
    type: String,
    enum: ['csv', 'manual', 'form', 'import'],
    default: 'manual'
  },

  // Ekleyen kullanıcı
  createdBy: {
    type: String,
    default: 'system'
  },

  // Güncelleyen kullanıcı
  updatedBy: {
    type: String
  },

  // Silinme durumu (soft delete)
  isDeleted: {
    type: Boolean,
    default: false
  },

  deletedAt: {
    type: Date
  },

  deletedBy: {
    type: String
  }

}, {
  timestamps: true,
  collection: 'manualapplications'
});

// İndeksler
manualApplicationSchema.index({ applicationId: 1 });
manualApplicationSchema.index({ year: 1 });
manualApplicationSchema.index({ positionCategory: 1 });
manualApplicationSchema.index({ fullName: 'text', position: 'text', reference: 'text' });
manualApplicationSchema.index({ isDeleted: 1 });
manualApplicationSchema.index({ createdAt: -1 });

// Pozisyon kategorisini otomatik belirle
manualApplicationSchema.pre('save', function(next) {
  if (this.position) {
    this.positionCategory = categorizePosition(this.position);
  }
  next();
});

// Pozisyon kategorileme fonksiyonu
function categorizePosition(position) {
  const pos = (position || '').toUpperCase();
  
  if (pos.includes('CNC') || pos.includes('TORNA') || pos.includes('FREZE') || pos.includes('OPERATÖR')) {
    return 'CNC/Torna Operatörü';
  }
  if (pos.includes('KAYNAK') || pos.includes('ARGON')) {
    return 'Kaynakçı';
  }
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
}

// Static metodlar
manualApplicationSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byYear2023: { $sum: { $cond: [{ $eq: ['$year', 2023] }, 1, 0] } },
        byYear2024: { $sum: { $cond: [{ $eq: ['$year', 2024] }, 1, 0] } },
        byYear2025: { $sum: { $cond: [{ $eq: ['$year', 2025] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || { total: 0, byYear2023: 0, byYear2024: 0, byYear2025: 0 };
};

manualApplicationSchema.statics.getCategoryStats = async function() {
  const stats = await this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$positionCategory',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  return stats.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});
};

const ManualApplication = mongoose.model('ManualApplication', manualApplicationSchema);

module.exports = ManualApplication;


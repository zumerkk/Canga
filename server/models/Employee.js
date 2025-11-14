const mongoose = require('mongoose');

// 👥 Çalışan Modeli - Excel dosyasındaki kolonlara göre tasarlandı
const employeeSchema = new mongoose.Schema({
  // 🆔 Sistem Bilgileri - Otomatik oluşturulan ID
  employeeId: {
    type: String,
    unique: true,
    required: false // Middleware'de oluşturulacağı için false
  },
  
  // 👤 AD_SOYAD - Excel'deki ilk kolon
  adSoyad: {
    type: String,
    required: true,
    trim: true
  },
  
  // Ad ve soyadı ayrık olarak da tutuyoruz (sistem içi kullanım için)
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  
  // 🆔 TC_NO - Excel'deki ikinci kolon
  tcNo: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Boş değerlerde unique constraint uygulanmaz
  },
  
  // 📱 CEP_TELEFONU - Excel'deki üçüncü kolon
  cepTelefonu: {
    type: String,
    trim: true
  },
  
  // 📅 DOGUM_TARIHI - Excel'deki dördüncü kolon
  dogumTarihi: {
    type: Date
  },
  

  
  // 🏭 İŞE_FABRİKA - Excel'deki altıncı kolon
  iseFabrika: {
    type: String,
    trim: true
  },
  
  // 💼 POZISYON - Excel'deki yedinci kolon
  pozisyon: {
    type: String,
    required: true,
    trim: true
  },
  
  // 🎓 DEPARTMAN - Tüm departmanlar için (enum kaldırıldı - esneklik için)
  departman: {
    type: String,
    trim: true
    // Enum kaldırıldı - dinamik departman ekleme için esneklik sağlandı
  },
  
  // 👨‍💼 SUPERVISOR - Stajyer/Çırak sorumlusu
  supervisor: {
    type: String,
    trim: true
  },
  
  // 📍 LOKASYON - Excel'deki sekizinci kolon (Standartlaştırılmış)
  lokasyon: {
    type: String,
    required: true,
    enum: ['MERKEZ', 'İŞIL', 'OSB'] // Tutarlı yazım: İŞIL (Türkçe İ ile)
  },
  
  // 📅 İŞE_GİRİŞ_TARİHİ - Excel'deki dokuzuncu kolon
  iseGirisTarihi: {
    type: Date
  },

  // 📅 İŞTEN_AYRILMA_TARİHİ - İşten ayrılma tarihi (AYRILDI durumunda)
  ayrilmaTarihi: {
    type: Date,
    required: false // Sadece işten ayrılanlar için
  },

  // 📝 AYRILMA_SEBEBİ - İşten ayrılma sebebi (AYRILDI durumunda)
  ayrilmaSebebi: {
    type: String,
    trim: true,
    required: false // İsteğe bağlı
  },
  
  // 🚌 SERVIS_GUZERGAHI - Excel'deki onuncu kolon
  servisGuzergahi: {
    type: String,
    trim: true
  },
  
  // 🚏 DURAK - Excel'deki on birinci kolon
  durak: {
    type: String,
    trim: true
  },
  
  // 🚗 KENDİ ARACI - Kendi aracı ile geliyor mu
  kendiAraci: {
    type: Boolean,
    default: false
  },
  
  // 📝 KENDİ ARACI NOT - Kendi aracı ile ilgili notlar
  kendiAraciNot: {
    type: String,
    trim: true
  },
  
  // 🚌 SERVİS BİLGİLERİ - Detaylı servis bilgileri
  serviceInfo: {
    usesService: {
      type: Boolean,
      default: false
    },
    routeName: {
      type: String,
      trim: true
    },
    stopName: {
      type: String,
      trim: true
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceRoute'
    },
    usesOwnCar: {
      type: Boolean,
      default: false
    },
    ownCarNote: {
      type: String,
      trim: true
    }
  },
  
  // 📊 DURUM - Excel'deki on ikinci kolon
  durum: {
    type: String,
    required: true,
    enum: ['AKTIF', 'PASIF', 'İZİNLİ', 'AYRILDI'],
    default: 'AKTIF'
  },
  
  // ⏰ Sistem Tarihleri
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 🔧 Middleware - Kayıt öncesi işlemler
employeeSchema.pre('save', async function(next) {
  try {
    // Ad soyadı ayrıştır
    if (this.adSoyad && !this.firstName && !this.lastName) {
      const nameParts = this.adSoyad.trim().split(' ');
      this.firstName = nameParts[0] || '';
      this.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Çalışan ID otomatik oluştur (eğer yoksa)
    if (!this.employeeId) {
      const firstInitial = this.firstName?.charAt(0)?.toUpperCase() || 'C';
      const lastInitial = this.lastName?.charAt(0)?.toUpperCase() || 'W';
      
      // Son kullanılan ID'yi bul
      const lastEmployee = await this.constructor.findOne(
        { employeeId: { $regex: `^${firstInitial}${lastInitial}` } },
        {},
        { sort: { createdAt: -1 } }
      );
      
      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeId) {
        const match = lastEmployee.employeeId.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // 4 haneli numara ile ID oluştur
      const paddedNumber = nextNumber.toString().padStart(4, '0');
      this.employeeId = `${firstInitial}${lastInitial}${paddedNumber}`;
    }
    
    // Durum değişikliği kontrolü - İşten ayrılan çalışanlar için ayrılma tarihi
    if (this.isModified('durum')) {
      if (this.durum === 'AYRILDI' && !this.ayrilmaTarihi) {
        this.ayrilmaTarihi = new Date();
      }
      
      // İşten ayrılan çalışanların izin kayıtlarını temizleme işareti
      if (this.durum !== 'AKTIF') {
        this._shouldCleanupLeaveRecords = true;
      }
    }
    
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// 🧹 Kayıt sonrası işlemler - İzin kayıtlarını temizle
employeeSchema.post('save', async function(doc) {
  try {
    // Eğer çalışan işten ayrıldıysa izin kayıtlarını temizle
    if (doc._shouldCleanupLeaveRecords && doc.durum !== 'AKTIF') {
      const AnnualLeave = require('./AnnualLeave');
      
      console.log(`🧹 ${doc.adSoyad} (${doc.employeeId}) çalışanının izin kayıtları temizleniyor...`);
      
      const deleteResult = await AnnualLeave.deleteMany({
        employeeId: doc._id
      });
      
      console.log(`✅ ${deleteResult.deletedCount} adet izin kaydı temizlendi`);
      
      // İşaret bayrağını temizle
      delete doc._shouldCleanupLeaveRecords;
    }
  } catch (error) {
    console.error('❌ İzin kayıtları temizleme hatası:', error);
  }
});

// 🚀 Performans Index'leri - Optimize edilmiş ve tekrarsız
// Compound index - sık kullanılan filtreleme kombinasyonları için
employeeSchema.index({ durum: 1, departman: 1, lokasyon: 1 });

// Text index - arama işlemleri için
employeeSchema.index({ adSoyad: 'text', pozisyon: 'text' });

// Unique index'ler - veri bütünlüğü ve hızlı lookup için
employeeSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
employeeSchema.index({ tcNo: 1 }, { unique: true, sparse: true });

// Tarih index'leri - tarih bazlı sorgular için
employeeSchema.index({ iseGirisTarihi: 1 });
employeeSchema.index({ ayrilmaTarihi: 1 });
employeeSchema.index({ createdAt: 1 });

// Servis bilgileri için index
employeeSchema.index({ servisGuzergahi: 1 });
employeeSchema.index({ 'serviceInfo.routeId': 1 });

// 🎯 Static Methods - Filtreleme yardımcıları
employeeSchema.statics.findByFilters = function(filters = {}) {
  const query = {};
  
  // Temel filtreler
  if (filters.departman) query.departman = filters.departman;
  if (filters.lokasyon) query.lokasyon = filters.lokasyon;
  if (filters.durum) query.durum = filters.durum;
  if (filters.servisGuzergahi) query.servisGuzergahi = filters.servisGuzergahi;
  
  // Arama
  if (filters.search) {
    query.$or = [
      { adSoyad: { $regex: filters.search, $options: 'i' } },
      { employeeId: { $regex: filters.search, $options: 'i' } },
      { tcNo: { $regex: filters.search, $options: 'i' } },
      { pozisyon: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query);
};

// 📈 Virtual - Yaş hesaplama
employeeSchema.virtual('yas').get(function() {
  if (!this.dogumTarihi) return null;
  const today = new Date();
  const birthDate = new Date(this.dogumTarihi);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// 📈 Virtual - Servis kullanıyor mu
employeeSchema.virtual('servisKullaniyor').get(function() {
  return !!(this.servisGuzergahi && this.servisGuzergahi !== '');
});

// JSON çıktısında virtual field'ları dahil et
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
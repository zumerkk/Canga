const mongoose = require('mongoose');

/**
 * 📋 ATTENDANCE MODEL - Giriş-Çıkış Takip Sistemi
 * 
 * Bu model çalışanların günlük giriş-çıkış kayıtlarını tutar.
 * Kart okuyucu, tablet kiosk, mobil app veya manuel giriş desteklenir.
 */

const attendanceSchema = new mongoose.Schema({
  // Çalışan referansı
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // Kayıt tarihi (sadece tarih, saat ayrı tutulur)
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // GİRİŞ BİLGİLERİ
  checkIn: {
    // Giriş zamanı (tam tarih-saat)
    time: {
      type: Date,
      required: true
    },
    
    // Giriş yöntemi
    method: {
      type: String,
      enum: ['CARD', 'TABLET', 'MOBILE', 'MANUAL', 'EXCEL_IMPORT'],
      required: true
    },
    
    // Lokasyon
    location: {
      type: String,
      enum: ['MERKEZ', 'İŞL', 'OSB', 'İŞIL'],
      required: true
    },
    
    // Cihaz ID (tablet, kart okuyucu)
    deviceId: String,
    
    // Dijital imza (manuel giriş için)
    signature: String,
    
    // Fotoğraf (opsiyonel)
    photo: String,
    
    // GPS koordinatları (mobil için)
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    
    // IP adresi
    ipAddress: String,
    
    // Kaydı yapan kullanıcı (manuel için)
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // ÇIKIŞ BİLGİLERİ
  checkOut: {
    time: Date,
    method: {
      type: String,
      enum: ['CARD', 'TABLET', 'MOBILE', 'MANUAL', 'EXCEL_IMPORT']
    },
    location: String,
    deviceId: String,
    signature: String,
    photo: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    ipAddress: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // HESAPLANAN BİLGİLER
  workDuration: {
    type: Number, // dakika cinsinden
    default: 0
  },
  
  // Fazla mesai (dakika)
  overtimeMinutes: {
    type: Number,
    default: 0
  },
  
  // Eksik mesai (dakika)
  underTimeMinutes: {
    type: Number,
    default: 0
  },
  
  // Mola süresi (dakika)
  breakTime: {
    type: Number,
    default: 60 // Varsayılan 1 saat
  },
  
  // Net çalışma süresi (mola düşülmüş)
  netWorkDuration: {
    type: Number,
    default: 0
  },
  
  // VARDİYA BİLGİLERİ
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift'
  },
  
  // Beklenen giriş saati (vardiya planından)
  expectedCheckIn: Date,
  
  // Beklenen çıkış saati
  expectedCheckOut: Date,
  
  // DURUM
  status: {
    type: String,
    enum: [
      'NORMAL',        // Normal mesai
      'LATE',          // Geç geldi
      'EARLY_LEAVE',   // Erken çıktı
      'ABSENT',        // Gelmedi
      'HOLIDAY',       // Tatil
      'LEAVE',         // İzinli
      'SICK_LEAVE',    // Hastalık izni
      'WEEKEND',       // Hafta sonu
      'INCOMPLETE'     // Eksik kayıt (sadece giriş veya çıkış var)
    ],
    default: 'NORMAL'
  },
  
  // GEÇ KALMA BİLGİSİ
  lateMinutes: {
    type: Number,
    default: 0
  },
  
  // ERKEN ÇIKMA BİLGİSİ
  earlyLeaveMinutes: {
    type: Number,
    default: 0
  },
  
  // ANOMALİLER ve UYARILAR
  anomalies: [{
    type: {
      type: String,
      enum: [
        'DUPLICATE_ENTRY',      // Çift giriş
        'MISSING_CHECK_OUT',    // Çıkış eksik
        'MISSING_CHECK_IN',     // Giriş eksik
        'LATE_ARRIVAL',         // Geç geldi
        'EARLY_DEPARTURE',      // Erken çıktı
        'UNUSUAL_HOURS',        // Anormal saat
        'LOCATION_MISMATCH',    // Lokasyon uyuşmazlığı
        'LOCATION_OUT_OF_BOUNDS', // Fabrika dışından giriş/çıkış
        'TIME_CORRECTION',      // Saat düzeltildi (±1 dk)
        'MANUAL_OVERRIDE',      // Manuel müdahale
        'DATA_IMPORTED'         // Excel'den import edildi
      ]
    },
    description: String,
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'ERROR'],
      default: 'INFO'
    },
    detectedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // ONAY DURUMU
  verified: {
    type: Boolean,
    default: false
  },
  
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  verifiedAt: Date,
  
  // Düzeltme gerekiyor mu?
  needsCorrection: {
    type: Boolean,
    default: false
  },
  
  // Notlar
  notes: {
    type: String,
    trim: true
  },
  
  // Düzeltme geçmişi
  corrections: [{
    field: String, // 'checkIn', 'checkOut' vb.
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    reason: String,
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    correctedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Meta bilgiler
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// İndeksler - Performans için
attendanceSchema.index({ employeeId: 1, date: -1 });
attendanceSchema.index({ date: 1, status: 1 });
attendanceSchema.index({ 'checkIn.location': 1, date: 1 });
attendanceSchema.index({ verified: 1, needsCorrection: 1 });

// Middleware - Güncelleme zamanı
attendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware - Hesaplamalar
attendanceSchema.pre('save', function(next) {
  // Sadece check-in ve check-out varsa hesapla
  if (this.checkIn?.time && this.checkOut?.time) {
    // Toplam çalışma süresi (dakika)
    const diffMs = this.checkOut.time - this.checkIn.time;
    this.workDuration = Math.floor(diffMs / (1000 * 60));
    
    // Net çalışma süresi (mola düşülmüş)
    this.netWorkDuration = this.workDuration - this.breakTime;
    
    // Geç kalma kontrolü
    if (this.expectedCheckIn && this.checkIn.time > this.expectedCheckIn) {
      this.lateMinutes = Math.floor((this.checkIn.time - this.expectedCheckIn) / (1000 * 60));
      
      if (this.lateMinutes > 5) { // 5 dakikadan fazla geç
        this.status = 'LATE';
        
        // Anomali ekle
        this.anomalies.push({
          type: 'LATE_ARRIVAL',
          description: `${this.lateMinutes} dakika geç geldi`,
          severity: this.lateMinutes > 30 ? 'ERROR' : 'WARNING'
        });
      }
    }
    
    // Erken çıkma kontrolü
    if (this.expectedCheckOut && this.checkOut.time < this.expectedCheckOut) {
      this.earlyLeaveMinutes = Math.floor((this.expectedCheckOut - this.checkOut.time) / (1000 * 60));
      
      if (this.earlyLeaveMinutes > 5) {
        this.status = 'EARLY_LEAVE';
        
        this.anomalies.push({
          type: 'EARLY_DEPARTURE',
          description: `${this.earlyLeaveMinutes} dakika erken çıktı`,
          severity: this.earlyLeaveMinutes > 30 ? 'ERROR' : 'WARNING'
        });
      }
    }
    
    // Fazla mesai hesaplama
    if (this.expectedCheckOut && this.netWorkDuration > 0) {
      const expectedMinutes = Math.floor((this.expectedCheckOut - this.expectedCheckIn) / (1000 * 60));
      const expectedNet = expectedMinutes - this.breakTime;
      
      if (this.netWorkDuration > expectedNet) {
        this.overtimeMinutes = this.netWorkDuration - expectedNet;
      } else if (this.netWorkDuration < expectedNet) {
        this.underTimeMinutes = expectedNet - this.netWorkDuration;
      }
    }
    
  } else if (this.checkIn?.time && !this.checkOut?.time) {
    // Sadece giriş var
    this.status = 'INCOMPLETE';
    this.needsCorrection = true;
    
    this.anomalies.push({
      type: 'MISSING_CHECK_OUT',
      description: 'Çıkış kaydı eksik',
      severity: 'WARNING'
    });
  }
  
  next();
});

// Virtual - İnsan okunabilir format
attendanceSchema.virtual('checkInFormatted').get(function() {
  if (!this.checkIn?.time) return '-';
  return new Date(this.checkIn.time).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

attendanceSchema.virtual('checkOutFormatted').get(function() {
  if (!this.checkOut?.time) return '-';
  return new Date(this.checkOut.time).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

attendanceSchema.virtual('workDurationFormatted').get(function() {
  if (!this.workDuration) return '-';
  const hours = Math.floor(this.workDuration / 60);
  const minutes = this.workDuration % 60;
  return `${hours}s ${minutes}dk`;
});

// Virtual'ları JSON'da göster
attendanceSchema.set('toJSON', { virtuals: true });
attendanceSchema.set('toObject', { virtuals: true });

// Statik metodlar

/**
 * Günlük kayıtları getir
 */
attendanceSchema.statics.getDailyRecords = async function(date, location = null) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const query = {
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  };
  
  if (location) {
    query['checkIn.location'] = location;
  }
  
  return this.find(query)
    .populate('employeeId', 'adSoyad tcNo pozisyon lokasyon profilePhoto')
    .populate('shiftId', 'title')
    .sort({ 'checkIn.time': -1 });
};

/**
 * Eksik kayıtları bul
 */
attendanceSchema.statics.findMissingRecords = async function(date) {
  return this.find({
    date: date,
    $or: [
      { 'checkIn.time': { $exists: false } },
      { 'checkOut.time': { $exists: false } }
    ]
  }).populate('employeeId');
};

/**
 * Aylık özet rapor
 */
attendanceSchema.statics.getMonthlyReport = async function(employeeId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.find({
    employeeId: employeeId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;


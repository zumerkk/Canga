const mongoose = require('mongoose');

/**
 * 📋 ATTENDANCE MODEL - Giriş-Çıkış Takip Sistemi
 * 
 * Bu model çalışanların günlük giriş-çıkış kayıtlarını tutar.
 * Kart okuyucu, tablet kiosk, mobil app veya manuel giriş desteklenir.
 */

// 🕐 VARSAYILAN MESAİ SAATLERİ
const DEFAULT_WORK_HOURS = {
  START_HOUR: 8,    // 08:00 - Mesai başlangıcı
  START_MINUTE: 0,
  END_HOUR: 18,     // 18:00 - Mesai bitişi
  END_MINUTE: 0,
  TOLERANCE_MINUTES: 5  // 5 dakika tolerans
};

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
    
    // 🏢 ŞUBE - Giriş yapılan şube (Merkez veya Işıl)
    branch: {
      type: String,
      enum: ['MERKEZ', 'IŞIL']
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
    // 🏢 ŞUBE - Çıkış yapılan şube (Merkez veya Işıl)
    branch: {
      type: String,
      enum: ['MERKEZ', 'IŞIL']
    },
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
  
  // 🆕 Manuel Fazla Mesai (dakika) - İK tarafından manuel eklenen
  // Örn: Yemeğe çıkmadan çalışma, tatil günü çalışma vb.
  manualOvertimeMinutes: {
    type: Number,
    default: 0
  },
  
  // 🆕 Manuel Fazla Mesai Sebebi
  manualOvertimeReason: {
    type: String,
    enum: [
      'YEMEK_MOLASI_YOK',      // Yemeğe çıkmadan çalıştı
      'HAFTA_SONU_CALISMA',    // Hafta sonu çalışma
      'TATIL_CALISMA',         // Resmi tatil çalışma
      'GECE_MESAI',            // Gece mesaisi
      'ACIL_IS',               // Acil iş
      'PROJE_TESLIM',          // Proje teslimi
      'BAKIM_ONARIM',          // Bakım onarım
      'EGITIM',                // Eğitim
      'TOPLANTI',              // Toplantı
      'DIGER'                  // Diğer
    ]
  },
  
  // 🆕 Manuel Fazla Mesai Notu
  manualOvertimeNotes: {
    type: String,
    trim: true
  },
  
  // 🆕 Manuel Fazla Mesai Ekleyen
  manualOvertimeAddedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 🆕 Manuel Fazla Mesai Eklenme Tarihi
  manualOvertimeAddedAt: {
    type: Date
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
      'SHORT_SHIFT',   // 🆕 Eksik çalışma (hem geç geldi hem erken çıktı)
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
  
  // 🆕 BAYRAKLAR - Kolay filtreleme için
  isLate: {
    type: Boolean,
    default: false
  },
  
  isEarlyLeave: {
    type: Boolean,
    default: false
  },
  
  isShortShift: {
    type: Boolean,
    default: false
  },
  
  // ANOMALİLER ve UYARILAR
  anomalies: [{
    type: {
      type: String,
      enum: [
        // Temel Anomaliler
        'DUPLICATE_ENTRY',        // Çift giriş
        'MISSING_CHECK_OUT',      // Çıkış eksik
        'MISSING_CHECK_IN',       // Giriş eksik
        'LATE_ARRIVAL',           // Geç geldi
        'EARLY_DEPARTURE',        // Erken çıktı
        'UNUSUAL_HOURS',          // Anormal saat
        'LOCATION_MISMATCH',      // Lokasyon uyuşmazlığı
        'LOCATION_OUT_OF_BOUNDS', // Fabrika dışından giriş/çıkış
        'TIME_CORRECTION',        // Saat düzeltildi (±1 dk)
        'MANUAL_OVERRIDE',        // Manuel müdahale
        'DATA_IMPORTED',          // Excel'den import edildi
        
        // 🏢 Şube Anomalileri
        'BRANCH_MISMATCH',        // Farklı şubeden çıkış denemesi
        
        // 🛡️ Fraud Detection Anomalileri
        'BUDDY_PUNCHING',         // Başkasının yerine basma
        'RAPID_MULTIPLE_CHECK',   // Hızlı çoklu giriş (aynı IP)
        'TIME_TRAVEL',            // Zamanda yolculuk (saat değişikliği)
        'LOCATION_SPOOFING',      // GPS spoofing şüphesi
        'DUPLICATE_ATTEMPT',      // Çift giriş denemesi
        'IMPOSSIBLE_TRAVEL',      // İmkansız seyahat (çok hızlı hareket)
        'PATTERN_ANOMALY',        // Genel davranış anomalisi
        'MISSING_CHECKOUT',       // Çıkış yapmadan yeni giriş
        
        // 🖥️ Kiosk ve Yardımlı Giriş Anomalileri
        'KIOSK_ENTRY',            // Kiosk terminal üzerinden giriş
        'KIOSK_EXIT',             // Kiosk terminal üzerinden çıkış
        'ASSISTED_ENTRY',         // Yardımlı giriş (başkası adına)
        'ASSISTED_EXIT',          // Yardımlı çıkış (başkası adına)
        'NO_SIGNATURE'            // 🆕 İmzasız giriş/çıkış
      ]
    },
    description: String,
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'],
      default: 'INFO'
    },
    detectedAt: {
      type: Date,
      default: Date.now
    },
    // 🛡️ Fraud için ek bilgiler
    fraudDetails: {
      alertId: String,
      riskScore: Number,
      recommendation: String,
      acknowledged: { type: Boolean, default: false },
      acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      acknowledgedAt: Date
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
attendanceSchema.index({ 'checkIn.branch': 1, date: 1 }); // 🏢 Şube indeksi
attendanceSchema.index({ verified: 1, needsCorrection: 1 });
attendanceSchema.index({ isLate: 1, date: 1 }); // 🆕 Geç kalanlar indeksi
attendanceSchema.index({ isEarlyLeave: 1, date: 1 }); // 🆕 Erken çıkanlar indeksi
attendanceSchema.index({ isShortShift: 1, date: 1 }); // 🆕 Eksik çalışanlar indeksi

// Middleware - Güncelleme zamanı
attendanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware - Hesaplamalar
attendanceSchema.pre('save', function(next) {
  // Bayrakları sıfırla
  this.isLate = false;
  this.isEarlyLeave = false;
  this.isShortShift = false;
  this.lateMinutes = 0;
  this.earlyLeaveMinutes = 0;
  
  // Sadece check-in ve check-out varsa hesapla
  if (this.checkIn?.time && this.checkOut?.time) {
    // Toplam çalışma süresi (dakika)
    const diffMs = this.checkOut.time - this.checkIn.time;
    this.workDuration = Math.floor(diffMs / (1000 * 60));
    
    // Net çalışma süresi (mola düşülmüş)
    this.netWorkDuration = this.workDuration - this.breakTime;
    
    // 🕐 VARSAYILAN MESAİ SAATLERİNİ HESAPLA (08:00 - 18:00)
    const checkInDate = new Date(this.checkIn.time);
    const recordDate = new Date(this.date);
    
    // Beklenen giriş saatini ayarla (vardiya planı yoksa 08:00 kullan)
    const effectiveExpectedCheckIn = this.expectedCheckIn || new Date(
      recordDate.getFullYear(),
      recordDate.getMonth(),
      recordDate.getDate(),
      DEFAULT_WORK_HOURS.START_HOUR,
      DEFAULT_WORK_HOURS.START_MINUTE,
      0
    );
    
    // Beklenen çıkış saatini ayarla (vardiya planı yoksa 18:00 kullan)
    const effectiveExpectedCheckOut = this.expectedCheckOut || new Date(
      recordDate.getFullYear(),
      recordDate.getMonth(),
      recordDate.getDate(),
      DEFAULT_WORK_HOURS.END_HOUR,
      DEFAULT_WORK_HOURS.END_MINUTE,
      0
    );
    
    // 🚨 GEÇ KALMA KONTROLÜ (08:00'dan sonra giriş)
    if (this.checkIn.time > effectiveExpectedCheckIn) {
      this.lateMinutes = Math.floor((this.checkIn.time - effectiveExpectedCheckIn) / (1000 * 60));
      
      if (this.lateMinutes > DEFAULT_WORK_HOURS.TOLERANCE_MINUTES) {
        this.isLate = true;
        
        // Mevcut anomalide LATE_ARRIVAL var mı kontrol et
        const hasLateAnomaly = this.anomalies.some(a => a.type === 'LATE_ARRIVAL');
        if (!hasLateAnomaly) {
          this.anomalies.push({
            type: 'LATE_ARRIVAL',
            description: `${this.lateMinutes} dakika geç geldi (Giriş: ${checkInDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})})`,
            severity: this.lateMinutes > 30 ? 'ERROR' : 'WARNING',
            detectedAt: new Date()
          });
        }
      }
    }
    
    // 🚨 ERKEN ÇIKIŞ KONTROLÜ (18:00'dan önce çıkış)
    const checkOutDate = new Date(this.checkOut.time);
    if (this.checkOut.time < effectiveExpectedCheckOut) {
      this.earlyLeaveMinutes = Math.floor((effectiveExpectedCheckOut - this.checkOut.time) / (1000 * 60));
      
      if (this.earlyLeaveMinutes > DEFAULT_WORK_HOURS.TOLERANCE_MINUTES) {
        this.isEarlyLeave = true;
        
        // Mevcut anomalide EARLY_DEPARTURE var mı kontrol et
        const hasEarlyAnomaly = this.anomalies.some(a => a.type === 'EARLY_DEPARTURE');
        if (!hasEarlyAnomaly) {
          this.anomalies.push({
            type: 'EARLY_DEPARTURE',
            description: `${this.earlyLeaveMinutes} dakika erken çıktı (Çıkış: ${checkOutDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})})`,
            severity: this.earlyLeaveMinutes > 30 ? 'ERROR' : 'WARNING',
            detectedAt: new Date()
          });
        }
      }
    }
    
    // 🆕 STATUS BELİRLEME - ÖNCELİK SIRASI
    // Erken çıkış varsa = EKSİK MESAİ (geç kalma olsun veya olmasın)
    // Sadece geç kalma varsa (erken çıkış yok) = GEÇ KALDI
    
    if (this.isEarlyLeave) {
      // Erken çıkış var = EKSİK MESAİ (08:00'da gelse bile 18:00'dan önce çıkınca eksik)
      this.status = 'SHORT_SHIFT';
      this.isShortShift = true;
      
      // Toplam eksik süre hesapla
      const totalMissing = (this.lateMinutes || 0) + (this.earlyLeaveMinutes || 0);
      
      // Mevcut anomalide SHORT_SHIFT var mı kontrol et
      const hasShortShiftAnomaly = this.anomalies.some(a => a.type === 'PATTERN_ANOMALY' && a.description?.includes('Eksik mesai'));
      if (!hasShortShiftAnomaly) {
        let description = `Eksik mesai: `;
        if (this.isLate && this.lateMinutes > 0) {
          description += `${this.lateMinutes} dk geç giriş + `;
        }
        description += `${this.earlyLeaveMinutes} dk erken çıkış = ${totalMissing} dk eksik`;
        
        this.anomalies.push({
          type: 'PATTERN_ANOMALY',
          description: description,
          severity: 'ERROR',
          detectedAt: new Date()
        });
      }
    } else if (this.isLate) {
      // Sadece geç kaldı, erken çıkış yok
      this.status = 'LATE';
    } else {
      this.status = 'NORMAL';
    }
    
    // Fazla mesai hesaplama
    if (this.netWorkDuration > 0) {
      const expectedMinutes = Math.floor((effectiveExpectedCheckOut - effectiveExpectedCheckIn) / (1000 * 60));
      const expectedNet = expectedMinutes - this.breakTime;
      
      if (this.netWorkDuration > expectedNet) {
        this.overtimeMinutes = this.netWorkDuration - expectedNet;
      } else if (this.netWorkDuration < expectedNet) {
        this.underTimeMinutes = expectedNet - this.netWorkDuration;
      }
    }
    
  } else if (this.checkIn?.time && !this.checkOut?.time) {
    // Sadece giriş var - çıkış eksik
    this.status = 'INCOMPLETE';
    this.needsCorrection = true;
    
    // 🕐 Sadece giriş varsa bile geç kalma kontrolü yap
    const checkInDate = new Date(this.checkIn.time);
    const recordDate = new Date(this.date);
    
    const effectiveExpectedCheckIn = this.expectedCheckIn || new Date(
      recordDate.getFullYear(),
      recordDate.getMonth(),
      recordDate.getDate(),
      DEFAULT_WORK_HOURS.START_HOUR,
      DEFAULT_WORK_HOURS.START_MINUTE,
      0
    );
    
    if (this.checkIn.time > effectiveExpectedCheckIn) {
      this.lateMinutes = Math.floor((this.checkIn.time - effectiveExpectedCheckIn) / (1000 * 60));
      
      if (this.lateMinutes > DEFAULT_WORK_HOURS.TOLERANCE_MINUTES) {
        this.isLate = true;
        
        const hasLateAnomaly = this.anomalies.some(a => a.type === 'LATE_ARRIVAL');
        if (!hasLateAnomaly) {
          this.anomalies.push({
            type: 'LATE_ARRIVAL',
            description: `${this.lateMinutes} dakika geç geldi (Giriş: ${checkInDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})})`,
            severity: this.lateMinutes > 30 ? 'ERROR' : 'WARNING',
            detectedAt: new Date()
          });
        }
      }
    }
    
    // Çıkış eksik anomalisi
    const hasMissingCheckout = this.anomalies.some(a => a.type === 'MISSING_CHECK_OUT');
    if (!hasMissingCheckout) {
      this.anomalies.push({
        type: 'MISSING_CHECK_OUT',
        description: 'Çıkış kaydı eksik',
        severity: 'WARNING',
        detectedAt: new Date()
      });
    }
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

// 🆕 Toplam Fazla Mesai (otomatik + manuel)
attendanceSchema.virtual('totalOvertimeMinutes').get(function() {
  return (this.overtimeMinutes || 0) + (this.manualOvertimeMinutes || 0);
});

// 🆕 Eksik/Fazla Mesai Süresi Hesaplama
// Pozitif = Fazla mesai, Negatif = Eksik mesai
attendanceSchema.virtual('netOvertimeMinutes').get(function() {
  const totalOvertime = (this.overtimeMinutes || 0) + (this.manualOvertimeMinutes || 0);
  const totalUndertime = (this.lateMinutes || 0) + (this.earlyLeaveMinutes || 0);
  return totalOvertime - totalUndertime;
});

// 🆕 Eksik/Fazla Mesai Süresi Formatlanmış
attendanceSchema.virtual('netOvertimeFormatted').get(function() {
  const net = this.netOvertimeMinutes;
  if (net === 0 || net === undefined) return '0 dk';
  
  const absMinutes = Math.abs(net);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  
  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}s ${minutes}dk`;
  } else {
    formatted = `${minutes}dk`;
  }
  
  // Negatif = eksik mesai, Pozitif = fazla mesai
  return net > 0 ? `+${formatted}` : `-${formatted}`;
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
    .populate('employeeId', 'adSoyad tcNo employeeId pozisyon departman lokasyon profilePhoto')
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
module.exports.DEFAULT_WORK_HOURS = DEFAULT_WORK_HOURS;


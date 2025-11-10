const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * 🎫 ATTENDANCE TOKEN MODEL
 * 
 * QR kod tabanlı giriş-çıkış için güvenli token sistemi
 * Her token tek kullanımlık ve zaman sınırlı
 */

const attendanceTokenSchema = new mongoose.Schema({
  // Çalışan referansı
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // Unique token (URL'de kullanılacak)
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Token tipi
  type: {
    type: String,
    enum: ['CHECK_IN', 'CHECK_OUT'],
    required: true
  },
  
  // Token durumu
  status: {
    type: String,
    enum: ['ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  
  // Geçerlilik süresi
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Kullanım bilgileri
  usedAt: Date,
  usedIp: String,
  usedDevice: String,
  
  // Lokasyon
  location: {
    type: String,
    enum: ['MERKEZ', 'İŞL', 'OSB', 'İŞIL'],
    required: true
  },
  
  // GPS koordinatları (kullanım anında)
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  
  // Oluşturulma bilgileri
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// İndeksler
attendanceTokenSchema.index({ token: 1, status: 1 });
attendanceTokenSchema.index({ employeeId: 1, type: 1, status: 1 });
attendanceTokenSchema.index({ expiresAt: 1 });

// Statik metodlar

/**
 * Yeni token oluştur
 */
attendanceTokenSchema.statics.generateToken = async function(employeeId, type, location, expiryMinutes = 2) {
  // Random token oluştur
  const token = crypto.randomBytes(32).toString('hex');
  
  // Geçerlilik süresi
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);
  
  // Mevcut aktif tokenları iptal et (aynı tip için)
  await this.updateMany(
    {
      employeeId: employeeId,
      type: type,
      status: 'ACTIVE'
    },
    {
      status: 'CANCELLED'
    }
  );
  
  // Yeni token oluştur
  const attendanceToken = await this.create({
    employeeId,
    token,
    type,
    location,
    expiresAt
  });
  
  return attendanceToken;
};

/**
 * Token'ı doğrula ve kullan
 */
attendanceTokenSchema.statics.validateAndUse = async function(token, ipAddress, device, coordinates) {
  const attendanceToken = await this.findOne({ token, status: 'ACTIVE' })
    .populate('employeeId', 'adSoyad tcNo pozisyon lokasyon profilePhoto');
  
  if (!attendanceToken) {
    return {
      valid: false,
      error: 'Token geçersiz veya kullanılmış'
    };
  }
  
  // Süre kontrolü
  if (new Date() > attendanceToken.expiresAt) {
    attendanceToken.status = 'EXPIRED';
    await attendanceToken.save();
    
    return {
      valid: false,
      error: 'Token süresi dolmuş. Yeni QR kod alın.'
    };
  }
  
  // Token'ı kullanıldı olarak işaretle
  attendanceToken.status = 'USED';
  attendanceToken.usedAt = new Date();
  attendanceToken.usedIp = ipAddress;
  attendanceToken.usedDevice = device;
  attendanceToken.coordinates = coordinates;
  await attendanceToken.save();
  
  return {
    valid: true,
    token: attendanceToken
  };
};

/**
 * Süresi dolmuş tokenları temizle
 */
attendanceTokenSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      status: 'ACTIVE',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'EXPIRED'
    }
  );
  
  return result.modifiedCount;
};

const AttendanceToken = mongoose.model('AttendanceToken', attendanceTokenSchema);

module.exports = AttendanceToken;


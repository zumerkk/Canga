const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * 🏢 SYSTEM QR TOKEN MODEL
 * 
 * Tüm çalışanların kullanabileceği paylaşılan QR kod sistemi
 * Her token 24 saat geçerlidir ve çok sayıda kullanım yapılabilir
 */

const systemQRTokenSchema = new mongoose.Schema({
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
    enum: ['CHECK_IN', 'CHECK_OUT', 'BOTH'], // BOTH: Her ikisi için de kullanılabilir
    required: true
  },
  
  // 🏢 ŞUBE - Merkez ve Işıl şubeleri
  branch: {
    type: String,
    enum: ['MERKEZ', 'IŞIL'],
    required: true,
    default: 'MERKEZ'
  },
  
  // Lokasyon (eski alan, geriye uyumluluk için tutuldu)
  location: {
    type: String,
    enum: ['MERKEZ', 'İŞL', 'OSB', 'İŞIL', 'ALL'],
    default: 'ALL'
  },
  
  // Token durumu
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  
  // Geçerlilik süresi (24 saat)
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Kullanım istatistikleri
  usageStats: {
    totalCheckIns: {
      type: Number,
      default: 0
    },
    totalCheckOuts: {
      type: Number,
      default: 0
    },
    uniqueUsers: [{
      employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      checkInCount: Number,
      checkOutCount: Number,
      lastUsed: Date,
      branch: String // 🏢 Hangi şubeden giriş yaptığı
    }]
  },
  
  // Oluşturulma bilgileri
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Notlar
  description: String
});

// İndeksler
systemQRTokenSchema.index({ token: 1, status: 1 });
systemQRTokenSchema.index({ expiresAt: 1 });
systemQRTokenSchema.index({ status: 1, expiresAt: 1 });
systemQRTokenSchema.index({ branch: 1, status: 1 }); // 🏢 Şube indeksi

// Statik metodlar
systemQRTokenSchema.statics.generateSystemToken = async function(type, location, description, expiryHours = 24, branch = 'MERKEZ') {
  // Random token oluştur
  const token = crypto.randomBytes(32).toString('hex');
  
  // Geçerlilik süresi (24 saat)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);
  
  // Yeni token oluştur
  const systemToken = await this.create({
    token,
    type,
    location,
    branch, // 🏢 Şube bilgisi eklendi
    expiresAt,
    description
  });
  
  return systemToken;
};

systemQRTokenSchema.statics.validateSystemToken = async function(token) {
  const systemToken = await this.findOne({ token, status: 'ACTIVE' });
  
  if (!systemToken) {
    return {
      valid: false,
      error: 'Token geçersiz veya iptal edilmiş'
    };
  }
  
  // Süre kontrolü
  if (new Date() > systemToken.expiresAt) {
    systemToken.status = 'EXPIRED';
    await systemToken.save();
    
    return {
      valid: false,
      error: 'Token süresi dolmuş. Yeni sistem QR kodu alın.'
    };
  }
  
  return {
    valid: true,
    token: systemToken,
    branch: systemToken.branch // 🏢 Şube bilgisi döndür
  };
};

systemQRTokenSchema.statics.recordUsage = async function(token, employeeId, actionType) {
  const systemToken = await this.findOne({ token });
  
  if (!systemToken) return;
  
  // Kullanım istatistiklerini güncelle
  if (actionType === 'CHECK_IN') {
    systemToken.usageStats.totalCheckIns += 1;
  } else if (actionType === 'CHECK_OUT') {
    systemToken.usageStats.totalCheckOuts += 1;
  }
  
  // Unique user tracking
  const userIndex = systemToken.usageStats.uniqueUsers.findIndex(
    u => u.employeeId.toString() === employeeId.toString()
  );
  
  if (userIndex === -1) {
    systemToken.usageStats.uniqueUsers.push({
      employeeId,
      checkInCount: actionType === 'CHECK_IN' ? 1 : 0,
      checkOutCount: actionType === 'CHECK_OUT' ? 1 : 0,
      lastUsed: new Date(),
      branch: systemToken.branch // 🏢 Şube bilgisi
    });
  } else {
    if (actionType === 'CHECK_IN') {
      systemToken.usageStats.uniqueUsers[userIndex].checkInCount += 1;
    } else {
      systemToken.usageStats.uniqueUsers[userIndex].checkOutCount += 1;
    }
    systemToken.usageStats.uniqueUsers[userIndex].lastUsed = new Date();
    systemToken.usageStats.uniqueUsers[userIndex].branch = systemToken.branch;
  }
  
  await systemToken.save();
};

const SystemQRToken = mongoose.model('SystemQRToken', systemQRTokenSchema);

module.exports = SystemQRToken;


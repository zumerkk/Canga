const mongoose = require('mongoose');

/**
 * Bölüm Sorumlusu (Supervisor) Model
 * İmza ve kişisel bilgiler ile birlikte saklanır
 */
const supervisorSchema = new mongoose.Schema({
  // Temel bilgiler
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  tcNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  phone: {
    type: String,
    trim: true
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Bölüm bilgileri
  department: {
    type: String,
    required: true,
    trim: true
  },
  
  position: {
    type: String,
    default: 'Bölüm Sorumlusu',
    trim: true
  },
  
  // İmza - Base64 formatında saklanacak
  signature: {
    type: String, // Base64 encoded PNG/JPEG
    default: null
  },
  
  signatureDate: {
    type: Date,
    default: null
  },
  
  // Çalışan referansı (eğer çalışan listesinden seçildiyse)
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  
  // Sistem giriş bilgileri
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // İlişkilendirilmiş kullanıcı hesabı
  },
  
  password: {
    type: String,
    unique: true,
    sparse: true // Null değerler için index oluşturmaz
  },
  
  // Durum
  isActive: {
    type: Boolean,
    default: true
  },
  
  // İzin onay yetkisi
  canApproveLeave: {
    type: Boolean,
    default: true
  },
  
  // Sorumlu olduğu departmanlar (birden fazla olabilir)
  responsibleDepartments: [{
    type: String,
    trim: true
  }],
  
  // Notlar
  notes: {
    type: String,
    trim: true
  },
  
  // Son giriş bilgileri
  lastLogin: {
    type: Date,
    default: null
  },
  
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Oluşturan
  createdBy: {
    type: String,
    default: 'ADMIN'
  }
}, {
  timestamps: true,
  collection: 'supervisors'
});

// İndeksler
supervisorSchema.index({ name: 1 });
supervisorSchema.index({ department: 1 });
supervisorSchema.index({ isActive: 1 });
supervisorSchema.index({ password: 1 }, { sparse: true });

// Şifre ile bölüm sorumlusu bulma
supervisorSchema.statics.findByPassword = function(password) {
  return this.findOne({ password, isActive: true });
};

// Giriş kaydı
supervisorSchema.methods.recordLogin = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// JSON çıktısında hassas bilgileri gizle
supervisorSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  // İmza çok büyükse özet bilgi döndür
  if (obj.signature && obj.signature.length > 100) {
    obj.hasSignature = true;
    obj.signaturePreview = obj.signature.substring(0, 50) + '...';
  }
  return obj;
};

// Tam bilgi döndür (imza dahil)
supervisorSchema.methods.toFullJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const Supervisor = mongoose.model('Supervisor', supervisorSchema);

module.exports = Supervisor;


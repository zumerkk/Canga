const mongoose = require('mongoose');

// 🏢 İş Başvurusu Schema - Formdaki tüm alanları kapsıyor
const jobApplicationSchema = new mongoose.Schema({
  // Unique application ID
  applicationId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `JOB-${Date.now()}`;
    }
  },

  // A. KİŞİSEL BİLGİLER
  personalInfo: {
    name: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
    email: { type: String, trim: true }, // E-posta adresi
    gender: { type: String, enum: ['Erkek', 'Bayan'], required: true },
    nationality: { type: String, default: 'TC' },
    birthPlace: { type: String }, // Doğum Yeri - PDF'den eklendi
    birthDate: { type: Date }, // Doğum Tarihi - PDF'den eklendi
    address: { type: String, required: true },
    phoneHome: { type: String },
    phoneMobile: { type: String, required: true },
    militaryStatus: { type: String, enum: ['Tecilli', 'Muaf', 'Muafiyet', 'Yapıldı'] },
    militaryDate: { type: Date },
    militaryExemption: { type: String },
    maritalStatus: { type: String, enum: ['Evli', 'Bekar'] },
    smoking: { type: Boolean, default: false },
    drivingLicense: {
      B: { type: Boolean, default: false },
      C: { type: Boolean, default: false },
      D: { type: Boolean, default: false },
      none: { type: Boolean, default: true }
    } // PDF'deki detaylı sürücü belgesi seçenekleri
  },

  // B. AİLE BİLGİLERİ
  familyInfo: {
    spouse: {
      name: { type: String },
      profession: { type: String },
      age: { type: Number },
      educationLevel: { type: String } // PDF'den eklendi - Öğrenim Durumu
    },
    children: [{
      name: { type: String },
      profession: { type: String },
      age: { type: Number },
      educationLevel: { type: String } // PDF'den eklendi - Öğrenim Durumu
    }]
  },

  // C. EĞİTİM BİLGİLERİ
  educationInfo: [{
    schoolName: { type: String, required: true },
    department: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    degreeReceived: { type: String }
  }],

  // D. BİLGİSAYAR BİLGİSİ
  computerSkills: [{
    program: { type: String, required: true },
    level: { 
      type: String, 
      enum: ['Az', 'Orta', 'İyi', 'Çok İyi'],
      default: 'Az'
    }
  }],

  // E. İŞ TÜCRÜBESİ
  workExperience: [{
    companyName: { type: String, required: true },
    position: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    reasonForLeaving: { type: String },
    salaryReceived: { type: String }
  }],

  // F. DİĞER BİLGİLER
  otherInfo: {
    healthProblem: { type: Boolean, default: false },
    healthDetails: { type: String },
    conviction: { type: Boolean, default: false },
    convictionDetails: { type: String },
    contactMethod: { type: String },
    phonePermission: { type: Boolean, default: false },
    // PDF'den eklendi - Size ulaşamadığımızda haber verilecek kişi
    emergencyContact: {
      name: { type: String }, // Ad-Soyadı
      relationship: { type: String }, // Yakınlığı
      phone: { type: String } // Telefonu
    }
  },

  // G. REFERANSLAR
  references: [{
    name: { type: String, required: true },
    company: { type: String },
    position: { type: String },
    phone: { type: String }
  }],

  // Başvuru Durumu ve Takip Bilgileri
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'interview', 'approved', 'rejected'],
    default: 'pending'
  },

  // İnceleme notları (İK için)
  notes: { type: String },

  // Başvuru tarihi
  submittedAt: {
    type: Date,
    default: Date.now
  },

  // Formdaki manuel başvuru tarihi
  applicationDate: { type: Date },

  // Başvurulan pozisyon
  appliedPosition: { type: String },

  // Başvuruyu yapan (guest veya user ID)
  submittedBy: {
    type: String,
    default: 'GUEST'
  },

  // İnceleyen kişi
  reviewedBy: { type: String },
  reviewedAt: { type: Date },

  // Son güncelleme
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  },

  // CV/Dosya yolu (ileride eklenebilir)
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }]

}, {
  timestamps: true, // createdAt ve updatedAt otomatik eklenir
  collection: 'jobapplications' // MongoDB collection adı
});

// İndeksler - Performans için
jobApplicationSchema.index({ applicationId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ submittedAt: -1 });
jobApplicationSchema.index({ 'personalInfo.name': 1, 'personalInfo.surname': 1 });

// Virtuals - Hesaplanan alanlar
jobApplicationSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.name} ${this.personalInfo.surname}`;
});

jobApplicationSchema.virtual('totalExperience').get(function() {
  return this.workExperience.length;
});

jobApplicationSchema.virtual('highestEducation').get(function() {
  if (this.educationInfo.length === 0) return null;
  
  // En yüksek eğitim seviyesini bul
  const educationLevels = {
    'İlkokul': 1,
    'Ortaokul': 2,
    'Lise': 3,
    'Ön Lisans': 4,
    'Lisans': 5,
    'Yüksek Lisans': 6,
    'Doktora': 7
  };

  let highest = this.educationInfo[0];
  this.educationInfo.forEach(edu => {
    if (educationLevels[edu.degreeReceived] > educationLevels[highest.degreeReceived]) {
      highest = edu;
    }
  });

  return highest;
});

// Middleware - Save öncesi
jobApplicationSchema.pre('save', function(next) {
  // Her kaydetmede lastUpdatedAt'i güncelle
  this.lastUpdatedAt = new Date();
  next();
});

// Static metodlar
jobApplicationSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ submittedAt: -1 });
};

jobApplicationSchema.statics.getApplicationStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

// Instance metodlar
jobApplicationSchema.methods.approve = function(reviewedBy, notes) {
  this.status = 'approved';
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.notes = notes;
  return this.save();
};

jobApplicationSchema.methods.reject = function(reviewedBy, notes) {
  this.status = 'rejected';
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.notes = notes;
  return this.save();
};

jobApplicationSchema.methods.setForInterview = function(reviewedBy, notes) {
  this.status = 'interview';
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.notes = notes;
  return this.save();
};

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;

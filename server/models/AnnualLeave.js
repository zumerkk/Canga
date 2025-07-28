const mongoose = require('mongoose');

// 📆 Yıllık İzin Takip Sistemi - Çalışanların yıllık izin bilgilerini saklar
const annualLeaveSchema = new mongoose.Schema({
  // Çalışan bilgisi
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  
  // İzin bilgileri - Yıl bazında
  leaveByYear: [{
    year: {
      type: Number,
      required: true
    },
    // Hak edilen izin günü
    entitled: {
      type: Number,
      default: 0
    },
    // Kullanılan izin günü
    used: {
      type: Number,
      default: 0
    },
    // İzin hak ediş tarihi
    entitlementDate: {
      type: Date
    },
    // O yıl içinde yapılan izin talepleri ve kullanımlar
    leaveRequests: [{
      startDate: Date,
      endDate: Date,
      days: Number,
      status: {
        type: String,
        enum: ['ONAY_BEKLIYOR', 'ONAYLANDI', 'REDDEDILDI', 'IPTAL_EDILDI'],
        default: 'ONAY_BEKLIYOR'
      },
      notes: String
    }]
  }],
  
  // Toplam izin bilgileri
  totalLeaveStats: {
    totalEntitled: {
      type: Number,
      default: 0
    },
    totalUsed: {
      type: Number,
      default: 0
    },
    remaining: {
      type: Number,
      default: 0
    }
  },
  
  // Notlar
  notes: String,
  
  // Son güncelleme bilgisi
  lastCalculationDate: {
    type: Date,
    default: Date.now
  },
  
  // Meta alanlar
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Güncelleme yaparken updatedAt alanını otomatik güncelle
annualLeaveSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// İndeksler
annualLeaveSchema.index({ employeeId: 1 });
annualLeaveSchema.index({ 'leaveByYear.year': 1 });

module.exports = mongoose.model('AnnualLeave', annualLeaveSchema); 
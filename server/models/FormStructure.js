const mongoose = require('mongoose');

// 🎨 Form Yapısı Schema - Dinamik form oluşturma için
const formStructureSchema = new mongoose.Schema({
  // Form meta bilgileri
  title: {
    type: String,
    required: true,
    default: 'İş Başvuru Formu'
  },
  
  description: {
    type: String,
    default: 'Çanga Savunma Endüstrisi A.Ş. İş Başvuru Sistemi'
  },

  // Form aktif mi?
  active: {
    type: Boolean,
    default: true
  },

  // Versiyon kontrolü
  version: {
    type: Number,
    default: () => Date.now()
  },

  // Form bölümleri
  sections: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: 'description'
    },
    active: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 1
    },
    description: String,
    
    // Bölüm alanları
    fields: [{
      name: {
        type: String,
        required: true
      },
      label: {
        type: String,
        required: true
      },
      type: {
        type: String,
        required: true,
        enum: [
          'text', 'email', 'tel', 'number', 'textarea', 
          'select', 'radio', 'checkbox', 'date', 'file',
          'url', 'password', 'color', 'range'
        ]
      },
      required: {
        type: Boolean,
        default: false
      },
      order: {
        type: Number,
        default: 1
      },
      placeholder: String,
      defaultValue: String,
      helpText: String,
      
      // Seçenekler (select, radio için)
      options: [String],
      
      // Validasyon kuralları
      validation: {
        minLength: Number,
        maxLength: Number,
        min: Number,
        max: Number,
        pattern: String,
        customValidation: String
      },
      
      // Conditional logic
      conditions: [{
        field: String,
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than']
        },
        value: String,
        action: {
          type: String,
          enum: ['show', 'hide', 'require', 'disable']
        }
      }],

      // Styling
      styling: {
        width: {
          type: String,
          enum: ['full', 'half', 'third', 'quarter'],
          default: 'full'
        },
        className: String
      }
    }]
  }],

  // Form genel ayarları
  settings: {
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    autoSaveEnabled: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: String,
      default: '5MB'
    },
    allowedFileTypes: {
      type: [String],
      default: ['pdf', 'doc', 'docx']
    },
    captchaEnabled: {
      type: Boolean,
      default: false
    },
    duplicateSubmissionCheck: {
      type: Boolean,
      default: true
    },
    submissionLimit: Number,
    timeLimit: Number, // Dakika cinsinden
    redirectUrl: String,
    successMessage: String,
    errorMessage: String
  },

  // Form stillemesi
  styling: {
    primaryColor: {
      type: String,
      default: '#1976d2'
    },
    secondaryColor: {
      type: String,
      default: '#dc004e'
    },
    backgroundColor: {
      type: String,
      default: '#f5f5f5'
    },
    fontFamily: {
      type: String,
      default: 'Roboto'
    },
    customCSS: String
  },

  // E-posta bildirimleri
  notifications: {
    adminEmails: [String],
    autoReplyEnabled: {
      type: Boolean,
      default: true
    },
    autoReplySubject: {
      type: String,
      default: 'İş Başvurunuz Alındı'
    },
    autoReplyMessage: {
      type: String,
      default: 'İş başvurunuz başarıyla alınmıştır. En kısa sürede size dönüş yapacağız.'
    }
  },

  // Entegrasyonlar
  integrations: {
    webhookUrl: String,
    slackChannel: String,
    teamsChannel: String,
    googleSheetsId: String,
    crmIntegration: {
      enabled: Boolean,
      type: String, // 'salesforce', 'hubspot', 'pipedrive'
      apiKey: String,
      endpoint: String
    }
  },

  // Kim tarafından oluşturuldu/güncellendi
  createdBy: {
    type: String,
    default: 'SYSTEM'
  },
  
  updatedBy: {
    type: String,
    default: 'SYSTEM'
  },

  // Geri yükleme bilgileri
  restoredAt: Date,
  restoredBy: String,

  // İstatistikler
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    lastSubmissionAt: Date,
    averageCompletionTime: Number, // Saniye cinsinden
    conversionRate: Number // %
  }

}, {
  timestamps: true, // createdAt ve updatedAt otomatik eklenir
  collection: 'formstructures'
});

// İndeksler
formStructureSchema.index({ active: 1, version: -1 });
formStructureSchema.index({ 'sections.id': 1 });
formStructureSchema.index({ updatedAt: -1 });

// Virtuals - Hesaplanan alanlar
formStructureSchema.virtual('totalFields').get(function() {
  return this.sections.reduce((total, section) => total + section.fields.length, 0);
});

formStructureSchema.virtual('requiredFields').get(function() {
  return this.sections.reduce((total, section) => 
    total + section.fields.filter(field => field.required).length, 0
  );
});

formStructureSchema.virtual('activeSections').get(function() {
  return this.sections.filter(section => section.active);
});

// Static metodlar
formStructureSchema.statics.getActiveForm = function() {
  return this.findOne({ active: true }).sort({ updatedAt: -1 });
};

formStructureSchema.statics.createBackup = async function(formId) {
  const form = await this.findById(formId);
  if (form) {
    const backup = new this({
      ...form.toObject(),
      _id: undefined,
      active: false,
      version: Date.now(),
      createdAt: new Date()
    });
    return backup.save();
  }
  return null;
};

// Instance metodlar
formStructureSchema.methods.addSection = function(sectionData) {
  this.sections.push({
    ...sectionData,
    id: sectionData.id || `section_${Date.now()}`,
    order: this.sections.length + 1
  });
  return this.save();
};

formStructureSchema.methods.removeSection = function(sectionId) {
  this.sections = this.sections.filter(section => section.id !== sectionId);
  return this.save();
};

formStructureSchema.methods.addField = function(sectionId, fieldData) {
  const section = this.sections.find(s => s.id === sectionId);
  if (section) {
    section.fields.push({
      ...fieldData,
      order: section.fields.length + 1
    });
    return this.save();
  }
  throw new Error('Section not found');
};

formStructureSchema.methods.removeField = function(sectionId, fieldName) {
  const section = this.sections.find(s => s.id === sectionId);
  if (section) {
    section.fields = section.fields.filter(field => field.name !== fieldName);
    return this.save();
  }
  throw new Error('Section not found');
};

formStructureSchema.methods.validate = function(submissionData) {
  const errors = [];
  
  this.sections.forEach(section => {
    if (!section.active) return;
    
    section.fields.forEach(field => {
      const value = submissionData[field.name];
      
      // Required field kontrolü
      if (field.required && (!value || value.trim() === '')) {
        errors.push(`${field.label} alanı zorunludur`);
      }
      
      // Email pattern kontrolü
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.label} geçerli bir e-posta adresi olmalıdır`);
        }
      }
      
      // Telefon pattern kontrolü
      if (field.type === 'tel' && value && field.validation?.pattern) {
        const phoneRegex = new RegExp(field.validation.pattern);
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          errors.push(`${field.label} geçerli bir telefon numarası olmalıdır`);
        }
      }
      
      // Minimum/Maximum length kontrolü
      if (value && field.validation) {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors.push(`${field.label} en az ${field.validation.minLength} karakter olmalıdır`);
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors.push(`${field.label} en fazla ${field.validation.maxLength} karakter olmalıdır`);
        }
      }
    });
  });
  
  return errors;
};

// Middleware - Save öncesi
formStructureSchema.pre('save', function(next) {
  // Sections ve fields'ları order'a göre sırala
  this.sections.sort((a, b) => a.order - b.order);
  this.sections.forEach(section => {
    section.fields.sort((a, b) => a.order - b.order);
  });
  next();
});

const FormStructure = mongoose.model('FormStructure', formStructureSchema);

module.exports = FormStructure;

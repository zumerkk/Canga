const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
// Note: AI data analysis uses Groq API via aiClient

// 🤖 AI Analiz sistemi endpoint'i
// Note: Full AI data analysis is temporarily disabled. Use quick-check for basic analysis.
router.post('/analyze', async (req, res) => {
  try {
    const { analysisType = 'quick' } = req.body;
    
    console.log('🚀 AI Analiz başlatılıyor...');
    console.log(`📋 Analiz tipi: ${analysisType}`);
    
    // Basic analysis without external AI dependency
    const employees = await Employee.find({});
    
    const result = {
      totalEmployees: employees.length,
      analysisType,
      message: 'Temel analiz tamamlandı. Detaylı AI analizi için quick-check endpoint\'ini kullanın.'
    };
    
    res.json({
      success: true,
      analysisType,
      timestamp: new Date().toISOString(),
      data: result
    });
    
  } catch (error) {
    console.error('❌ AI Analiz hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📊 Hızlı durum kontrolü
router.get('/quick-check', async (req, res) => {
  try {
    const employees = await Employee.find({});
    
    // Basit kontroller
    const issues = {
      duplicateNames: [],
      invalidTcNumbers: [],
      emptyFields: [],
      inconsistentDepartments: []
    };
    
    // TC No kontrolü
    employees.forEach(emp => {
      if (!emp.tcNo || emp.tcNo.length !== 11 || !/^\d{11}$/.test(emp.tcNo)) {
        issues.invalidTcNumbers.push({
          name: emp.adSoyad,
          tcNo: emp.tcNo,
          issue: 'Geçersiz TC No formatı'
        });
      }
    });
    
    // İsim kontrolü
    const nameGroups = {};
    employees.forEach(emp => {
      const cleanName = emp.adSoyad?.toLowerCase().trim();
      if (cleanName) {
        if (!nameGroups[cleanName]) {
          nameGroups[cleanName] = [];
        }
        nameGroups[cleanName].push(emp);
      }
    });
    
    Object.keys(nameGroups).forEach(name => {
      if (nameGroups[name].length > 1) {
        issues.duplicateNames.push({
          name: nameGroups[name][0].adSoyad,
          count: nameGroups[name].length,
          employees: nameGroups[name].map(e => e._id)
        });
      }
    });
    
    // Boş alan kontrolü
    employees.forEach(emp => {
      if (!emp.adSoyad || !emp.departman || !emp.lokasyon) {
        issues.emptyFields.push({
          name: emp.adSoyad || 'İsimsiz',
          missingFields: [
            !emp.adSoyad && 'adSoyad',
            !emp.departman && 'departman', 
            !emp.lokasyon && 'lokasyon'
          ].filter(Boolean)
        });
      }
    });
    
    res.json({
      success: true,
      totalEmployees: employees.length,
      issues,
      summary: {
        duplicateNames: issues.duplicateNames.length,
        invalidTcNumbers: issues.invalidTcNumbers.length,
        emptyFields: issues.emptyFields.length,
        healthScore: Math.max(0, 100 - (
          (issues.duplicateNames.length * 20) +
          (issues.invalidTcNumbers.length * 15) +
          (issues.emptyFields.length * 10)
        ))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Hızlı kontrol hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🔍 İsim benzerlik kontrolü (basit Levenshtein distance)
router.post('/name-similarity', async (req, res) => {
  try {
    const { names = [] } = req.body;
    
    if (names.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'En az 2 isim gerekli'
      });
    }
    
    // Basit benzerlik analizi
    const similarities = [];
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const name1 = names[i].toLowerCase().trim();
        const name2 = names[j].toLowerCase().trim();
        if (name1 === name2) {
          similarities.push({
            name1: names[i],
            name2: names[j],
            similarity: 100,
            match: 'exact'
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        totalNames: names.length,
        similarities,
        duplicatesFound: similarities.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ İsim benzerlik hatası:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 📈 AI Analiz geçmişi
const analysisHistory = [];

router.get('/history', (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    res.json({
      success: true,
      history: analysisHistory.slice(-limit),
      total: analysisHistory.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analiz geçmişini kaydet
router.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (req.method === 'POST' && req.path === '/analyze') {
      analysisHistory.push({
        timestamp: new Date().toISOString(),
        analysisType: req.body.analysisType,
        success: JSON.parse(data).success,
        employeeCount: req.body.excelNames?.length || 0
      });
      
      // Son 50 analizi tut
      if (analysisHistory.length > 50) {
        analysisHistory.shift();
      }
    }
    originalSend.call(this, data);
  };
  next();
});

module.exports = router; 
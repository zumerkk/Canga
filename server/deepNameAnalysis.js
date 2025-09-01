const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

// Levenshtein distance hesaplama (yazım hatası tespit için)
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Türkçe karakterleri normalize et
function normalizeText(str) {
  if (!str) return '';
  return str.toString()
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Ses benzerliği (Soundex benzeri - Türkçe uyarlamalı)
function soundexTr(str) {
  const normalized = normalizeText(str);
  if (!normalized) return '';
  
  let soundex = normalized.charAt(0);
  const consonants = normalized.slice(1)
    .replace(/[AEIOUY]/g, '')
    .replace(/[BP]/g, '1')
    .replace(/[FVCKGJQSXZ]/g, '2')
    .replace(/[DT]/g, '3')
    .replace(/[LMN]/g, '4')
    .replace(/[R]/g, '5')
    .replace(/(.)\1+/g, '$1'); // remove duplicates
  
  return (soundex + consonants + '000').slice(0, 4);
}

// CSV parse
function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(';');
  const rows = lines.slice(1).map(l => l.split(';'));
  
  const nameIdx = header.findIndex(h => /ad\s*soyad/i.test(h));
  const statusIdx = header.findIndex(h => /durum/i.test(h));
  const idIdx = header.findIndex(h => /çalışan\s*id/i.test(h));
  
  return rows.map(r => ({
    id: r[idIdx] || '',
    name: r[nameIdx] || '',
    status: r[statusIdx] || '',
    normalized: normalizeText(r[nameIdx] || ''),
    soundex: soundexTr(r[nameIdx] || '')
  })).filter(item => item.name && item.name.length > 2);
}

// İsim parçalarını ayır
function parseNameParts(fullName) {
  const parts = normalizeText(fullName).split(' ').filter(Boolean);
  return {
    firstName: parts[0] || '',
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1] || '',
    initials: parts.map(p => p.charAt(0)).join(''),
    wordCount: parts.length
  };
}

async function analyzeDatabase() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  
  // DB'deki tüm kayıtları al
  const employees = await Employee.find({}).select('employeeId adSoyad durum tcNo');
  
  await mongoose.disconnect();
  return employees;
}

function findSimilarities(items) {
  const similarities = [];
  const processed = new Set();
  
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      
      const key = [a.normalized, b.normalized].sort().join('|');
      if (processed.has(key)) continue;
      processed.add(key);
      
      // Aynı isim (normalize sonrası)
      if (a.normalized === b.normalized) {
        similarities.push({
          type: 'EXACT_MATCH',
          confidence: 1.0,
          nameA: a.name,
          nameB: b.name,
          idA: a.id,
          idB: b.id,
          reason: 'Normalize sonrası aynı'
        });
        continue;
      }
      
      // Soundex benzerliği
      if (a.soundex === b.soundex && a.soundex !== '' && a.soundex !== '000') {
        similarities.push({
          type: 'SOUNDEX_MATCH',
          confidence: 0.9,
          nameA: a.name,
          nameB: b.name,
          idA: a.id,
          idB: b.id,
          reason: `Ses benzerliği: ${a.soundex}`
        });
        continue;
      }
      
      // Levenshtein distance (yazım hatası)
      const distance = levenshtein(a.normalized, b.normalized);
      const maxLen = Math.max(a.normalized.length, b.normalized.length);
      const similarity = 1 - (distance / maxLen);
      
      if (similarity > 0.85 && distance <= 3) {
        similarities.push({
          type: 'TYPO_SIMILAR',
          confidence: similarity,
          nameA: a.name,
          nameB: b.name,
          idA: a.id,
          idB: b.id,
          distance,
          reason: `${distance} karakter farkı`
        });
        continue;
      }
      
      // İsim parçası analizi
      const partsA = parseNameParts(a.name);
      const partsB = parseNameParts(b.name);
      
      // Aynı soyad, farklı ad
      if (partsA.lastName === partsB.lastName && partsA.firstName !== partsB.firstName && partsA.lastName.length > 2) {
        similarities.push({
          type: 'SAME_LASTNAME',
          confidence: 0.7,
          nameA: a.name,
          nameB: b.name,
          idA: a.id,
          idB: b.id,
          reason: `Aynı soyad: ${partsA.lastName}`
        });
        continue;
      }
      
      // İlk harfler aynı (baş harfler)
      if (partsA.initials === partsB.initials && partsA.initials.length > 2) {
        similarities.push({
          type: 'SAME_INITIALS',
          confidence: 0.6,
          nameA: a.name,
          nameB: b.name,
          idA: a.id,
          idB: b.id,
          reason: `Aynı baş harfler: ${partsA.initials}`
        });
        continue;
      }
      
      // Tek isim vs çift isim (birinin kısaltılmış versiyonu)
      if (Math.abs(partsA.wordCount - partsB.wordCount) >= 1) {
        const shorter = partsA.wordCount < partsB.wordCount ? a : b;
        const longer = partsA.wordCount < partsB.wordCount ? b : a;
        
        if (longer.normalized.includes(shorter.normalized) || shorter.normalized.includes(longer.normalized)) {
          similarities.push({
            type: 'PARTIAL_MATCH',
            confidence: 0.8,
            nameA: a.name,
            nameB: b.name,
            idA: a.id,
            idB: b.id,
            reason: `Biri diğerinin parçası`
          });
        }
      }
    }
  }
  
  return similarities.sort((a, b) => b.confidence - a.confidence);
}

// İstatistikler
function generateStats(items, similarities) {
  const stats = {
    totalItems: items.length,
    uniqueNormalized: new Set(items.map(i => i.normalized)).size,
    uniqueSoundex: new Set(items.map(i => i.soundex).filter(s => s && s !== '000')).size,
    duplicateGroups: {},
    suspiciousPatterns: [],
    wordCountDistribution: {}
  };
  
  // Kelime sayısı dağılımı
  items.forEach(item => {
    const wordCount = normalizeText(item.name).split(' ').length;
    stats.wordCountDistribution[wordCount] = (stats.wordCountDistribution[wordCount] || 0) + 1;
  });
  
  // Şüpheli desenler
  items.forEach(item => {
    const normalized = item.normalized;
    
    // Çok kısa isimler
    if (normalized.length < 3) {
      stats.suspiciousPatterns.push({
        type: 'TOO_SHORT',
        name: item.name,
        id: item.id,
        reason: 'Çok kısa isim'
      });
    }
    
    // Sayı içeren isimler
    if (/\d/.test(normalized)) {
      stats.suspiciousPatterns.push({
        type: 'CONTAINS_NUMBERS',
        name: item.name,
        id: item.id,
        reason: 'Sayı içeriyor'
      });
    }
    
    // Özel karakterler
    if (/[^\w\s]/g.test(item.name)) {
      stats.suspiciousPatterns.push({
        type: 'SPECIAL_CHARS',
        name: item.name,
        id: item.id,
        reason: 'Özel karakter içeriyor'
      });
    }
    
    // Tek kelime isimler
    if (normalizeText(item.name).split(' ').length === 1) {
      stats.suspiciousPatterns.push({
        type: 'SINGLE_WORD',
        name: item.name,
        id: item.id,
        reason: 'Tek kelime'
      });
    }
  });
  
  return stats;
}

async function main() {
  console.log('🔍 Derinlemesine isim analizi başlıyor...');
  
  // 1) Veritabanından kayıtları al
  const dbEmployees = await analyzeDatabase();
  const dbItems = dbEmployees.map(emp => ({
    id: emp.employeeId || emp._id.toString(),
    name: emp.adSoyad || '',
    status: emp.durum || '',
    source: 'DATABASE',
    tcNo: emp.tcNo || '',
    normalized: normalizeText(emp.adSoyad || ''),
    soundex: soundexTr(emp.adSoyad || '')
  })).filter(item => item.name && item.name.length > 2);
  
  // 2) CSV'lerden kayıtları al
  const cleanedCsv = process.argv[2] || '/Users/zumerkekillioglu/Downloads/y/Canga/Canga_Calisanlar_01-09-2025 (2)_CLEANED.csv';
  const leftCsv = process.argv[3] || '/Users/zumerkekillioglu/Downloads/y/Canga/Canga_Isten_Ayrilanlar_01-09-2025.csv';
  
  let csvItems = [];
  if (fs.existsSync(cleanedCsv)) {
    csvItems = parseCsv(cleanedCsv).map(item => ({ ...item, source: 'CSV_ACTIVE' }));
  }
  
  let leftItems = [];
  if (fs.existsSync(leftCsv)) {
    leftItems = parseCsv(leftCsv).map(item => ({ ...item, source: 'CSV_LEFT' }));
  }
  
  // 3) Tüm kayıtları birleştir
  const allItems = [...dbItems, ...csvItems, ...leftItems];
  console.log(`📊 Toplam analiz edilecek kayıt: ${allItems.length}`);
  console.log(`   - Veritabanı: ${dbItems.length}`);
  console.log(`   - Aktif CSV: ${csvItems.length}`);
  console.log(`   - Ayrılan CSV: ${leftItems.length}`);
  
  // 4) Benzerlik analizi
  const similarities = findSimilarities(allItems);
  
  // 5) İstatistikler
  const stats = generateStats(allItems, similarities);
  
  // 6) Rapor oluştur
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRecords: allItems.length,
      dbRecords: dbItems.length,
      csvActiveRecords: csvItems.length,
      csvLeftRecords: leftItems.length,
      similarityMatches: similarities.length,
      suspiciousPatterns: stats.suspiciousPatterns.length
    },
    statistics: stats,
    similarities: similarities,
    recommendations: []
  };
  
  // 7) Öneriler oluştur
  const exactMatches = similarities.filter(s => s.type === 'EXACT_MATCH');
  const typoMatches = similarities.filter(s => s.type === 'TYPO_SIMILAR');
  const partialMatches = similarities.filter(s => s.type === 'PARTIAL_MATCH');
  
  if (exactMatches.length > 0) {
    report.recommendations.push({
      type: 'MERGE_EXACT_DUPLICATES',
      count: exactMatches.length,
      description: 'Bu kayıtlar tamamen aynı isimde - birleştirilebilir',
      items: exactMatches.slice(0, 10) // İlk 10'unu göster
    });
  }
  
  if (typoMatches.length > 0) {
    report.recommendations.push({
      type: 'FIX_TYPOS',
      count: typoMatches.length,
      description: 'Bu kayıtlar yazım hatası içerebilir - kontrol edilmeli',
      items: typoMatches.slice(0, 10)
    });
  }
  
  if (partialMatches.length > 0) {
    report.recommendations.push({
      type: 'CHECK_PARTIAL_MATCHES',
      count: partialMatches.length,
      description: 'Bu kayıtlar aynı kişinin farklı yazımları olabilir',
      items: partialMatches.slice(0, 10)
    });
  }
  
  // 8) Raporu kaydet
  const reportPath = path.resolve(__dirname, 'deep_name_analysis_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  // 9) Özet yazdır
  console.log('\n📋 ANALİZ SONUÇLARI:');
  console.log('=' * 50);
  console.log(`✅ Toplam kayıt: ${report.summary.totalRecords}`);
  console.log(`🔍 Benzerlik eşleşmesi: ${report.summary.similarityMatches}`);
  console.log(`⚠️  Şüpheli desen: ${report.summary.suspiciousPatterns}`);
  
  console.log('\n📊 BENZERLIK TİPLERİ:');
  const typeCounts = {};
  similarities.forEach(s => {
    typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
  });
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} adet`);
  });
  
  console.log('\n⚠️  ŞÜPHELİ DESENLER:');
  const patternCounts = {};
  stats.suspiciousPatterns.forEach(p => {
    patternCounts[p.type] = (patternCounts[p.type] || 0) + 1;
  });
  Object.entries(patternCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} adet`);
  });
  
  if (similarities.length > 0) {
    console.log('\n🔍 EN YÜKSEK BENZERLİKLER (İlk 5):');
    similarities.slice(0, 5).forEach((s, idx) => {
      console.log(`   ${idx + 1}. ${s.nameA} ↔ ${s.nameB} (${s.confidence.toFixed(3)}) - ${s.reason}`);
    });
  }
  
  console.log(`\n📄 Detaylı rapor: ${reportPath}`);
  
  return report;
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Hata:', err);
    mongoose.disconnect();
  });
}

module.exports = { main, analyzeDatabase, findSimilarities };

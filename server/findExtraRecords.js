const fs = require('fs');
const path = require('path');

// Dosya yolları
const CURRENT = process.argv[2] || '/Users/zumerkekillioglu/Downloads/PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)/Canga_Calisanlar_01-09-2025 (3).csv';
const BASELINE = '/Users/zumerkekillioglu/Downloads/y/Canga/Canga_Calisanlar_01-09-2025.csv';
const LEFT = '/Users/zumerkekillioglu/Downloads/y/Canga/Canga_Isten_Ayrilanlar_01-09-2025.csv';

const tidy = (s='') => (s||'').toString().replace(/\s+/g,' ').trim();
const normalizeText = (str) => {
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
};

// Levenshtein distance
function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Dosya bulunamadı: ${filePath}`);
    return [];
  }
  
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  
  // Header'ı bul (bazen ilk satır başlık değil)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (/ad\s*soyad/i.test(lines[i])) {
      headerIdx = i;
      break;
    }
  }
  
  const header = lines[headerIdx].split(';');
  const rows = lines.slice(headerIdx + 1).map(l => l.split(';'));
  
  const nameIdx = header.findIndex(h => /ad\s*soyad/i.test(h));
  const idIdx = header.findIndex(h => /çalışan\s*id/i.test(h));
  const statusIdx = header.findIndex(h => /durum/i.test(h));
  const routeIdx = header.findIndex(h => /servis.*güzergah/i.test(h));
  const stopIdx = header.findIndex(h => /durak/i.test(h));
  
  return rows.map(r => ({
    id: tidy(r[idIdx] || ''),
    name: tidy(r[nameIdx] || ''),
    status: tidy(r[statusIdx] || ''),
    route: tidy(r[routeIdx] || ''),
    stop: tidy(r[stopIdx] || ''),
    normalized: normalizeText(r[nameIdx] || ''),
    raw: r
  })).filter(item => item.name && item.name.length > 2);
}

function findSimilar(name, list, threshold = 0.85) {
  const normalized = normalizeText(name);
  const similar = [];
  
  for (const item of list) {
    if (item.normalized === normalized) {
      similar.push({ ...item, similarity: 1.0, reason: 'Exact match' });
      continue;
    }
    
    // Levenshtein similarity
    const distance = levenshtein(normalized, item.normalized);
    const maxLen = Math.max(normalized.length, item.normalized.length);
    const similarity = 1 - (distance / maxLen);
    
    if (similarity >= threshold) {
      similar.push({ ...item, similarity, reason: `${distance} karakter farkı` });
    }
    
    // Partial match (biri diğerinin parçası)
    if (normalized.includes(item.normalized) || item.normalized.includes(normalized)) {
      similar.push({ ...item, similarity: 0.9, reason: 'Partial match' });
    }
  }
  
  return similar.sort((a, b) => b.similarity - a.similarity);
}

function main() {
  console.log('🔍 Fazla kayıtları tespit ediyorum...\n');
  
  const baseline = parseCsv(BASELINE).filter(e => e.status === 'AKTIF');
  const left = parseCsv(LEFT).filter(e => e.status === 'AYRILDI');
  const current = parseCsv(CURRENT).filter(e => e.status === 'AKTIF');
  
  console.log(`📊 Baseline (orijinal): ${baseline.length} aktif`);
  console.log(`📊 Ayrılanlar: ${left.length} kişi`);
  console.log(`📊 Current (şu anki): ${current.length} aktif`);
  console.log(`📈 Fark: +${current.length - baseline.length} kişi\n`);
  
  // Baseline + ayrılanlar setini oluştur
  const baselineSet = new Set(baseline.map(e => e.normalized));
  const leftSet = new Set(left.map(e => e.normalized));
  
  // Meşru yeni eklemeler
  const LEGITIMATE_ADDITIONS = new Set([
    normalizeText('ALİ AKSAKAL'),
    normalizeText('MEHMET DİRİ'),
    normalizeText('HASAN BASRİ ERTEKİN'),
    normalizeText('FARUK YEŞİLYURT')
  ]);
  
  console.log('🎯 Meşru yeni eklemeler:');
  LEGITIMATE_ADDITIONS.forEach(name => console.log(`   - ${name}`));
  console.log('');
  
  // Current'ta olup baseline'da olmayan kayıtları bul
  const extraRecords = [];
  const legitimateAdded = [];
  const suspiciousAdded = [];
  
  for (const emp of current) {
    if (baselineSet.has(emp.normalized)) continue; // Baseline'da var
    
    if (LEGITIMATE_ADDITIONS.has(emp.normalized)) {
      legitimateAdded.push(emp);
      continue;
    }
    
    // Ayrılanlar listesinde var mı kontrol et
    if (leftSet.has(emp.normalized)) {
      extraRecords.push({
        ...emp,
        issue: 'RESIGNED_BUT_ACTIVE',
        reason: 'İşten ayrılanlar listesinde ama hâlâ aktif'
      });
      continue;
    }
    
    // Baseline'da benzer isim var mı?
    const similarInBaseline = findSimilar(emp.name, baseline, 0.8);
    if (similarInBaseline.length > 0) {
      extraRecords.push({
        ...emp,
        issue: 'POSSIBLE_DUPLICATE',
        reason: 'Baseline\'da benzer isim var',
        similar: similarInBaseline[0]
      });
      continue;
    }
    
    // Ayrılanlar listesinde benzer isim var mı?
    const similarInLeft = findSimilar(emp.name, left, 0.8);
    if (similarInLeft.length > 0) {
      extraRecords.push({
        ...emp,
        issue: 'SIMILAR_TO_RESIGNED',
        reason: 'Ayrılanlar listesinde benzer isim var',
        similar: similarInLeft[0]
      });
      continue;
    }
    
    suspiciousAdded.push({
      ...emp,
      issue: 'UNEXPECTED_ADDITION',
      reason: 'Beklenmeyen ekleme - nereden geldi?'
    });
  }
  
  console.log('✅ MEŞRU YENİ EKLEMELER:');
  console.log('=' * 40);
  legitimateAdded.forEach((emp, idx) => {
    console.log(`${idx + 1}. ${emp.name} (${emp.id})`);
    console.log(`   🚌 ${emp.route}`);
    console.log(`   🚏 ${emp.stop}\n`);
  });
  
  console.log('⚠️  PROBLEMLİ KAYITLAR:');
  console.log('=' * 40);
  extraRecords.forEach((emp, idx) => {
    console.log(`${idx + 1}. ${emp.name} (${emp.id})`);
    console.log(`   🚨 Problem: ${emp.issue}`);
    console.log(`   📝 Sebep: ${emp.reason}`);
    if (emp.similar) {
      console.log(`   🔄 Benzer: ${emp.similar.name} (similarity: ${emp.similar.similarity.toFixed(3)})`);
    }
    console.log('');
  });
  
  console.log('❓ ŞÜPHELİ EKLEMELERr:');
  console.log('=' * 40);
  suspiciousAdded.forEach((emp, idx) => {
    console.log(`${idx + 1}. ${emp.name} (${emp.id})`);
    console.log(`   ❓ ${emp.reason}`);
    console.log('');
  });
  
  // Rapor kaydet
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      baselineCount: baseline.length,
      currentCount: current.length,
      leftCount: left.length,
      difference: current.length - baseline.length,
      legitimateAdditions: legitimateAdded.length,
      problematicRecords: extraRecords.length,
      suspiciousAdditions: suspiciousAdded.length
    },
    legitimateAdded,
    extraRecords,
    suspiciousAdded
  };
  
  const reportPath = path.resolve(__dirname, 'extra_records_analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log(`\n📄 Detaylı rapor: ${reportPath}`);
  console.log(`\n📊 ÖZET:`);
  console.log(`   ✅ Meşru ekleme: ${legitimateAdded.length}`);
  console.log(`   ⚠️  Problemli: ${extraRecords.length}`);
  console.log(`   ❓ Şüpheli: ${suspiciousAdded.length}`);
  console.log(`   📈 Toplam fazla: ${extraRecords.length + suspiciousAdded.length}`);
  
  return report;
}

if (require.main === module) {
  main();
}

module.exports = { main };

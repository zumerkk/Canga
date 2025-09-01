const fs = require('fs');
const path = require('path');

// Dosya yolları
const BASELINE = process.argv[2] || '/Users/zumerkekillioglu/Downloads/y/Canga/Canga_Calisanlar_01-09-2025.csv';
const CURRENT = process.argv[3] || '/Users/zumerkekillioglu/Downloads/y/Canga/Canga_Calisanlar_CLEAN.csv';

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

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Dosya bulunamadı: ${filePath}`);
    return [];
  }
  
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(';');
  const rows = lines.slice(1).map(l => l.split(';'));
  
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
    normalized: normalizeText(r[nameIdx] || '')
  })).filter(item => item.name && item.status === 'AKTIF');
}

function main() {
  console.log('🔍 Yeni eklenen çalışanları tespit ediyorum...\n');
  
  const baseline = parseCsv(BASELINE);
  const current = parseCsv(CURRENT);
  
  console.log(`📊 Baseline (eski liste): ${baseline.length} aktif çalışan`);
  console.log(`📊 Current (yeni liste): ${current.length} aktif çalışan`);
  console.log(`📈 Fark: +${current.length - baseline.length} kişi\n`);
  
  // Baseline'daki isimleri set'e al
  const baselineSet = new Set(baseline.map(e => e.normalized));
  
  // Current'ta olup baseline'da olmayan kayıtları bul
  const newEmployees = current.filter(emp => !baselineSet.has(emp.normalized));
  
  console.log('🆕 YENİ EKLENEN ÇALIŞANLAR:');
  console.log('=' * 50);
  
  if (newEmployees.length === 0) {
    console.log('✅ Yeni eklenen çalışan bulunamadı.');
  } else {
    newEmployees.forEach((emp, idx) => {
      console.log(`${idx + 1}. ${emp.name}`);
      console.log(`   📋 ID: ${emp.id}`);
      console.log(`   🚌 Rota: ${emp.route || 'Atanmamış'}`);
      console.log(`   🚏 Durak: ${emp.stop || 'Atanmamış'}`);
      console.log('');
    });
  }
  
  // Detaylı rapor kaydet
  const report = {
    timestamp: new Date().toISOString(),
    baseline: {
      file: BASELINE,
      count: baseline.length
    },
    current: {
      file: CURRENT,
      count: current.length
    },
    difference: current.length - baseline.length,
    newEmployees: newEmployees.map(emp => ({
      id: emp.id,
      name: emp.name,
      route: emp.route,
      stop: emp.stop,
      addedReason: 'Route CSV\'lerinden otomatik eklendi'
    }))
  };
  
  const reportPath = path.resolve(__dirname, 'new_employees_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  
  console.log(`📄 Detaylı rapor: ${reportPath}`);
  console.log(`\n📋 ÖZET: ${newEmployees.length} yeni çalışan eklendi`);
  
  return newEmployees;
}

if (require.main === module) {
  main();
}

module.exports = { main };

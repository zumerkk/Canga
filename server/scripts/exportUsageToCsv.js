// Export 2017–2025 per-year used leave to CSV, overwriting the given file
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function main() {
  const targetCsv = process.argv[2] || path.join(process.cwd(), 'Çalışan Listesi-Tablo 1.csv');
  const startYear = 2017;
  const endYear = 2025;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga-vardiya';
  await mongoose.connect(uri);

  const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');
  const AnnualLeave = mongoose.model('AnnualLeave', new mongoose.Schema({}, { strict: false }), 'annualleaves');

  const activeEmployees = await Employee.find({}).select('_id adSoyad dogumTarihi iseGirisTarihi employeeId').lean();

  // Build leave map for speed
  const leaves = await AnnualLeave.find({}).select('employeeId leaveByYear').lean();
  const leaveMap = new Map();
  for (const lr of leaves) leaveMap.set(String(lr.employeeId), lr);

  // Header rows, matching the original structure: first row titles, second row years
  const yearCols = Array.from({ length: endYear - startYear + 1 }, (_, i) => (startYear + i).toString());
  const header1 = ['No', 'ADI SOYADI', 'DOĞUM TARİHİ', 'İŞE GİRİŞ TARİHİ', 'KULLANILAN İZİN GÜNLERİ TOPLAMI', ...Array(yearCols.length).fill('')].join(';');
  const header2 = ['','','','','', ...yearCols].join(';');

  const lines = [header1, header2];

  let rowNo = 1;
  for (const emp of activeEmployees) {
    const lr = leaveMap.get(String(emp._id));
    const usageByYear = {};
    for (let y = startYear; y <= endYear; y++) usageByYear[y] = 0;
    if (lr && Array.isArray(lr.leaveByYear)) {
      for (const y of lr.leaveByYear) {
        if (y && typeof y.year === 'number' && y.year >= startYear && y.year <= endYear) {
          usageByYear[y.year] = y.used || 0;
        }
      }
    }

    const totalUsed = Object.values(usageByYear).reduce((a, b) => a + (b || 0), 0);
    const birth = emp.dogumTarihi ? new Date(emp.dogumTarihi).toLocaleDateString('tr-TR') : '';
    const hire = emp.iseGirisTarihi ? new Date(emp.iseGirisTarihi).toLocaleDateString('tr-TR') : '';

    const row = [
      rowNo,
      (emp.adSoyad || '').toUpperCase(),
      birth,
      hire,
      totalUsed,
      ...yearCols.map(y => usageByYear[parseInt(y,10)] || 0)
    ].join(';');
    lines.push(row);
    rowNo++;
  }

  // Backup then write
  const backupPath = targetCsv.replace(/\.csv$/i, `_${new Date().toISOString().slice(0,10)}_BACKUP.csv`);
  try {
    if (fs.existsSync(targetCsv)) fs.copyFileSync(targetCsv, backupPath);
  } catch {}
  fs.writeFileSync(targetCsv, lines.join('\n'), 'utf8');
  console.log('✅ CSV yazıldı:', targetCsv);
  console.log('📦 Yedek:', backupPath);

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(err => { console.error('❌ Export hatası:', err); process.exit(1); });
}

module.exports = { main };



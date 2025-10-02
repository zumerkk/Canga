/*
 * Import used annual leave days from CSV and reconcile with DB
 * CSV format (semicolon-separated):
 * No;ADI SOYADI;DOĞUM TARİHİ;İŞE GİRİŞ TARİHİ;KULLANILAN İZİN GÜNLERİ TOPLAMI;2017;2018;...;2026
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Lazy models
let Employee, AnnualLeave;

const EXPECTED_YEAR_START = 2017;
const EXPECTED_YEAR_END = 2026;

function parseDateLike(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (!s || s === '0') return null;
  // Try locale formats like 3/22/69 or 04.06.2024
  const d = new Date(s);
  if (!isNaN(d)) return d;
  // Try DD.MM.YYYY
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10) - 1;
    let yyyy = parseInt(m[3], 10);
    if (yyyy < 100) yyyy += 1900; // crude fallback
    const val = new Date(yyyy, mm, dd);
    if (!isNaN(val)) return val;
  }
  return null;
}

function stripDiacritics(str) {
  try {
    return str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  } catch {
    return str;
  }
}

function normalizeName(name) {
  const s = String(name || '').replace(/\s+/g, ' ').trim();
  const upper = s.toUpperCase();
  return stripDiacritics(upper);
}

function dateEq(a, b, toleranceDays = 3) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da) || isNaN(db)) return false;
  const diff = Math.abs(da.getTime() - db.getTime());
  return diff <= toleranceDays * 24 * 60 * 60 * 1000;
}

function buildDiacriticInsensitivePattern(str) {
  const map = {
    'A': '[AÂÄA]', 'B': 'B', 'C': '[CÇ]', 'Ç': '[CÇ]',
    'D': 'D', 'E': '[EÊËE]', 'F': 'F', 'G': '[GĞ]', 'Ğ': '[GĞ]',
    'H': 'H', 'I': '[IİIıi]', 'İ': '[IİIıi]', 'J': 'J', 'K': 'K',
    'L': 'L', 'M': 'M', 'N': 'N', 'O': '[OÖÔO]', 'Ö': '[OÖÔO]',
    'P': 'P', 'R': 'R', 'S': '[SŞ]', 'Ş': '[SŞ]', 'T': 'T',
    'U': '[UÜÛU]', 'Ü': '[UÜÛU]', 'V': 'V', 'Y': 'Y', 'Z': 'Z',
    'Q': 'Q', 'X': 'X',
  };
  const up = String(str || '').toUpperCase();
  let out = '';
  for (const ch of up) {
    if (/[A-ZÇĞİÖŞÜ]/.test(ch)) out += map[ch] || ch;
    else if (ch === ' ') out += '\\s+';
    else out += ch.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }
  return out;
}

async function loadCsvRows(csvPath) {
  const rows = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath, { encoding: 'utf8' })
  });

  for await (const line of rl) {
    if (!line || !line.trim()) continue;
    const parts = line.split(';');
    rows.push(parts);
  }
  return rows;
}

function extractYearColumns(headerRow) {
  const yearToIndex = {};
  for (let i = 0; i < headerRow.length; i++) {
    const cell = headerRow[i].trim();
    const year = parseInt(cell, 10);
    if (!isNaN(year) && year >= EXPECTED_YEAR_START && year <= EXPECTED_YEAR_END) {
      yearToIndex[year] = i;
    }
  }
  return yearToIndex;
}

function getUsedFromRow(row, yearToIndex, year) {
  const idx = yearToIndex[year];
  if (typeof idx !== 'number') return 0;
  const raw = (row[idx] || '').toString().trim().replace(',', '.');
  if (!raw) return 0;
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : Math.round(n);
}

function calculateEntitledForYear(emp, year) {
  if (!emp.dogumTarihi || !emp.iseGirisTarihi) return 0;
  const birthDate = new Date(emp.dogumTarihi);
  const hireDate = new Date(emp.iseGirisTarihi);
  const checkDate = new Date(year, 11, 31);

  let age = checkDate.getFullYear() - birthDate.getFullYear();
  const ageMonthDiff = checkDate.getMonth() - birthDate.getMonth();
  if (ageMonthDiff < 0 || (ageMonthDiff === 0 && checkDate.getDate() < birthDate.getDate())) age--;

  let yos = checkDate.getFullYear() - hireDate.getFullYear();
  const md = checkDate.getMonth() - hireDate.getMonth();
  if (md < 0 || (md === 0 && checkDate.getDate() < hireDate.getDate())) yos--;

  if (checkDate.getFullYear() === hireDate.getFullYear()) return 0;
  if (age >= 50) return yos > 0 ? 20 : 0;
  if (yos <= 0) return 0;
  if (yos < 5) return 14;
  return 20;
}

async function upsertEmployeeUsed(csvRow, yearToIndex, report, employeesByNormName) {
  const rawName = (csvRow[1] || '').toString();
  const name = normalizeName(rawName);
  const birth = parseDateLike(csvRow[2]);
  const hire = parseDateLike(csvRow[3]);

  const Emp = Employee;
  const AL = AnnualLeave;

  const candidates = employeesByNormName.get(name) || [];
  let emp = null;
  if (candidates.length === 1) {
    emp = candidates[0];
  } else if (candidates.length > 1) {
    // disambiguate by dates
    emp = candidates.find(e => dateEq(e.dogumTarihi, birth, 15)) ||
          candidates.find(e => dateEq(e.iseGirisTarihi, hire, 60)) ||
          candidates[0];
  } else {
    // try looser matching by tokens
    const tokens = name.split(' ').filter(Boolean);
    const first = tokens[0];
    const last = tokens[tokens.length - 1];
    const more = employeesByNormName.get(first) || [];
    const filtered = more.filter(e => normalizeName(e.adSoyad).includes(last));
    if (filtered.length > 0) emp = filtered[0];
  }

  if (!emp) {
    // Fallback regex search (diacritic-insensitive, case-insensitive)
    const pattern = buildDiacriticInsensitivePattern(rawName);
    const regex = new RegExp('^' + pattern + '$', 'i');
    const found = await Emp.find({ adSoyad: regex }).limit(3).lean();
    if (found && found.length > 0) {
      emp = found[0];
    } else {
      report.missingEmployees.push({ name: rawName });
      return;
    }
  }

  let leaveRecord = await AL.findOne({ employeeId: emp._id });
  if (!leaveRecord) {
    leaveRecord = new AL({ employeeId: emp._id, leaveByYear: [], totalLeaveStats: { totalEntitled: 0, totalUsed: 0, remaining: 0 } });
  }

  const years = Object.keys(yearToIndex).map(y => parseInt(y, 10)).sort((a, b) => a - b);
  for (const year of years) {
    const used = getUsedFromRow(csvRow, yearToIndex, year);
    const entitled = calculateEntitledForYear(emp, year);

    let y = leaveRecord.leaveByYear.find(l => l.year === year);
    if (!y) {
      y = { year, entitled, used: 0, entitlementDate: new Date(year, 0, 1), leaveRequests: [] };
      leaveRecord.leaveByYear.push(y);
    }

    // Update entitled to rule-based value if needed
    if ((y.entitled || 0) !== entitled) y.entitled = entitled;

    // Rebuild leaveRequests for CSV-driven year (remove previous CSV-imported entries)
    y.leaveRequests = (y.leaveRequests || []).filter(r => r.type !== 'CSV_IMPORT');
    if (used > 0) {
      y.leaveRequests.push({
        startDate: new Date(year, 11, 31),
        endDate: new Date(year, 11, 31),
        days: used,
        type: 'CSV_IMPORT',
        status: 'ONAYLANDI',
        notes: 'CSV verisinden aktarıldı',
        createdAt: new Date()
      });
    }
    y.used = used; // authoritatively set from CSV
  }

  // Recalculate totals
  let totalEntitled = 0;
  let totalUsed = 0;
  for (const y of leaveRecord.leaveByYear) {
    totalEntitled += y.entitled || 0;
    totalUsed += y.used || 0;
  }
  leaveRecord.totalLeaveStats = { totalEntitled, totalUsed, remaining: totalEntitled - totalUsed };
  leaveRecord.lastCalculationDate = new Date();
  await leaveRecord.save();

  report.updated.push({ employeeId: emp.employeeId, name: emp.adSoyad });
}

async function main() {
  const csvPath = process.argv[2] || path.join(process.cwd(), 'Çalışan Listesi-Tablo 1.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV bulunamadı:', csvPath);
    process.exit(1);
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga-vardiya';
  await mongoose.connect(MONGODB_URI);

  // init models lazily to avoid schema duplication
  Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');
  AnnualLeave = mongoose.model('AnnualLeave', new mongoose.Schema({}, { strict: false }), 'annualleaves');

  const rows = await loadCsvRows(csvPath);
  if (rows.length < 3) {
    console.error('CSV beklenen formatta değil (çok az satır).');
    process.exit(1);
  }

  // The provided CSV has first row titles, second row year headers
  const header = rows[1];
  const yearToIndex = extractYearColumns(header);

  const report = { updated: [], missingEmployees: [], errors: [] };

  // Build fast lookup by normalized name
  const allEmployees = await Employee.find({}).select('_id adSoyad dogumTarihi iseGirisTarihi employeeId durum').lean();
  const employeesByNormName = new Map();
  for (const e of allEmployees) {
    const key = normalizeName(e.adSoyad);
    if (!employeesByNormName.has(key)) employeesByNormName.set(key, []);
    employeesByNormName.get(key).push(e);
  }

  // Data rows start at 3rd line in given CSV; guard against trailing empty lines
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    // Stop if row is just separators
    if (!row || row.every(c => !c || !String(c).trim())) continue;
    if (!row[1]) continue; // no name
    try {
      await upsertEmployeeUsed(row, yearToIndex, report, employeesByNormName);
    } catch (e) {
      report.errors.push({ row: i + 1, name: row[1], error: e.message });
    }
  }

  const outPath = path.join(process.cwd(), 'csv', `used_leave_import_report_${new Date().toISOString().slice(0,10)}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('✅ Import tamamlandı:', {
    updated: report.updated.length,
    missingEmployees: report.missingEmployees.length,
    errors: report.errors.length,
    report: outPath
  });

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Import hatası:', err);
    process.exit(1);
  });
}

module.exports = { main };



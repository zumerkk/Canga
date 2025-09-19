const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const mongoose = require('mongoose');
require('dotenv').config();
const Employee = require('../models/Employee');

function normalizeName(name) {
  if (!name) return '';
  return name
    .toString()
    .trim()
    .toUpperCase()
    .replace(/Ç/g, 'C')
    .replace(/Ğ/g, 'G')
    .replace(/İ/g, 'I')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ş/g, 'S')
    .replace(/Ü/g, 'U')
    .replace(/Â|Ä|À|Á|Ã/g, 'A')
    .replace(/Ê|Ë|È|É/g, 'E')
    .replace(/Î|Ï|Ì|Í/g, 'I')
    .replace(/Ô|Ö|Ò|Ó|Õ/g, 'O')
    .replace(/Û|Ü|Ù|Ú/g, 'U')
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = [];
  for (let i = 0; i <= bn; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= an; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[bn][an];
}

function similarityScore(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen; // 0..1
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const activeEmployees = await Employee.find({ durum: 'AKTIF' }).select('adSoyad');
    const employeeNames = activeEmployees.map(e => e.adSoyad);

    const csvCandidates = [
      path.join(__dirname, '../../Çalışan Listesi-Tablo 1.csv'),
      path.join(__dirname, '../../Çalışan Listesi-Tablo 1.csv')
    ];
    let csvPath = null;
    for (const p of csvCandidates) { if (fs.existsSync(p)) { csvPath = p; break; } }
    if (!csvPath) throw new Error('CSV bulunamadı');

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const parsed = Papa.parse(csvContent, { header: false, delimiter: ';', skipEmptyLines: true });
    const rows = parsed.data.slice(2); // başlıkları atla

    const unmatched = [];
    for (const row of rows) {
      const name = (row[1] || '').toString().trim();
      if (!name) continue;
      const found = employeeNames.some(n => normalizeName(n) === normalizeName(name));
      if (!found) {
        // en iyi 3 benzer ad
        const scored = employeeNames.map(n => ({ name: n, score: similarityScore(name, n) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        unmatched.push({ csvName: name, suggestions: scored });
      }
    }

    const outPath = path.join(__dirname, '../../unmatched_names_report.json');
    fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), unmatched }, null, 2), 'utf8');
    console.log(`✅ Rapor oluşturuldu: ${outPath}`);
    console.log(`Toplam eşleşmeyen: ${unmatched.length}`);

  } catch (err) {
    console.error('Rapor hatası:', err);
  } finally {
    await mongoose.connection.close();
  }
}

main();

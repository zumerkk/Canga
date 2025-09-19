const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const Employee = require('./models/Employee');

function parseDate(s) {
  if (!s) return null;
  const t = s.toString().trim();
  if (!t) return null;
  if (t.includes('/')) {
    const [m, d, y] = t.split('/');
    const yy = parseInt(y, 10);
    const fullY = yy < 100 ? (yy > 50 ? 1900 + yy : 2000 + yy) : yy;
    return new Date(fullY, parseInt(m, 10) - 1, parseInt(d, 10));
  }
  if (t.includes('.')) {
    const [dd, mm, yy] = t.split('.');
    const fullY = parseInt(yy, 10) < 100 ? (parseInt(yy, 10) > 50 ? 1900 + parseInt(yy, 10) : 2000 + parseInt(yy, 10)) : parseInt(yy, 10);
    return new Date(fullY, parseInt(mm, 10) - 1, parseInt(dd, 10));
  }
  const dt = new Date(t);
  return isNaN(dt.getTime()) ? null : dt;
}

function cleanTc(tc) {
  if (!tc) return '';
  return tc.toString().replace(/[^\d]/g, '');
}

async function readFormerCsv(csvPathAbs) {
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPathAbs)
      .pipe(csv({ separator: ';', headers: false }))
      .on('data', (r) => rows.push(r))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function main() {
  const csvAbs = path.join(__dirname, '../İŞTEN AYRILANLAR-Tablo 1.csv');
  await mongoose.connect(process.env.MONGODB_URI);

  try {
    const raw = await readFormerCsv(csvAbs);

    // CSV columns: [No, Ayrılış Tarihi, AD SOY AD, T.C., TEL, Doğum, İşe giriş, Adres ...]
    const wanted = [];
    for (const r of raw) {
      const name = (r[2] || r['2'] || '').toString().trim();
      if (!name || name === 'AD SOY AD') continue;
      const ayrilis = parseDate(r[1] || r['1']);
      const tc = cleanTc(r[3] || r['3']);
      const dogum = parseDate(r[5] || r['5']);
      const iseGiris = parseDate(r[6] || r['6']);
      wanted.push({ name, tc, ayrilis, dogum, iseGiris });
    }

    // Dedupe by TC first, fallback by name
    const byTc = new Map();
    const byName = new Map();
    for (const w of wanted) {
      if (w.tc) {
        byTc.set(w.tc, w);
      } else {
        byName.set(w.name.toUpperCase(), w);
      }
    }

    // Build target set of ObjectIds to mark PASIF and update fields
    const processedIds = new Set();
    let upserts = 0;
    let updates = 0;

    // 1) Try TC matches
    for (const [tc, w] of byTc.entries()) {
      const emp = await Employee.findOne({ tcNo: tc });
      if (emp) {
        emp.durum = 'PASIF';
        if (w.ayrilis) emp.ayrilmaTarihi = w.ayrilis;
        if (!emp.pozisyon) emp.pozisyon = 'Eski Çalışan';
        await emp.save();
        processedIds.add(emp._id.toString());
        updates++;
      } else {
        // Create minimal record if no employee with this TC exists
        const [first, ...rest] = w.name.split(' ');
        const created = await Employee.create({
          adSoyad: w.name,
          firstName: first || w.name,
          lastName: rest.join(' '),
          tcNo: tc,
          dogumTarihi: w.dogum || null,
          iseGirisTarihi: w.iseGiris || null,
          ayrilmaTarihi: w.ayrilis || null,
          durum: 'PASIF',
          pozisyon: 'Eski Çalışan',
          lokasyon: 'MERKEZ'
        });
        processedIds.add(created._id.toString());
        upserts++;
      }
    }

    // 2) Name-only matches for those without TC
    for (const [key, w] of byName.entries()) {
      const emp = await Employee.findOne({ adSoyad: new RegExp('^' + key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') });
      if (emp) {
        emp.durum = 'PASIF';
        if (w.ayrilis) emp.ayrilmaTarihi = w.ayrilis;
        if (!emp.pozisyon) emp.pozisyon = 'Eski Çalışan';
        await emp.save();
        processedIds.add(emp._id.toString());
        updates++;
      } else {
        const [first, ...rest] = w.name.split(' ');
        const created = await Employee.create({
          adSoyad: w.name,
          firstName: first || w.name,
          lastName: rest.join(' '),
          tcNo: '',
          dogumTarihi: w.dogum || null,
          iseGirisTarihi: w.iseGiris || null,
          ayrilmaTarihi: w.ayrilis || null,
          durum: 'PASIF',
          pozisyon: 'Eski Çalışan',
          lokasyon: 'MERKEZ'
        });
        processedIds.add(created._id.toString());
        upserts++;
      }
    }

    // 3) Optional: Reactivate PASIF not in CSV (set to AKTIF)
    const csvNamesUpper = new Set(wanted.map(w => w.name.toUpperCase()))
    const csvTcs = new Set(wanted.filter(w => w.tc).map(w => w.tc));
    const pasifList = await Employee.find({ durum: 'PASIF' }, { adSoyad: 1, tcNo: 1 });
    let reactivated = 0;
    for (const e of pasifList) {
      const inCsv = (e.tcNo && csvTcs.has(e.tcNo)) || (e.adSoyad && csvNamesUpper.has(e.adSoyad.toUpperCase()));
      if (!inCsv) {
        // Keep as PASIF if you prefer; user asked to rebuild per CSV: mark others AKTIF
        e.durum = 'AKTIF';
        await e.save();
        reactivated++;
      }
    }

    console.log(`✔ Former rebuilt from CSV. Updates: ${updates}, Inserts: ${upserts}, Reactivated: ${reactivated}`);
  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

main();

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASELINE = process.argv[2] || path.resolve(__dirname, '../Canga_Calisanlar_01-09-2025.csv');
const LEFT = process.argv[3] || path.resolve(__dirname, '../Canga_Isten_Ayrilanlar_01-09-2025.csv');
const CURRENT = process.argv[4] || path.resolve(__dirname, '../PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)/Canga_Calisanlar_01-09-2025 (1).csv');

const tidy = (s='') => (s||'').toString().replace(/\s+/g,' ').trim();
const toUpperTr = (s='') => tidy(s).replace(/i̇/g,'i').replace(/İ/g,'I').replace(/ı/g,'I').toUpperCase();
const normalizeName = (s='') => toUpperTr(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'');

const NAME_BLACKLIST = new Set(['SABAH','AKŞAM','16-24','24-08']);

function parseEmployeesCsv(file) {
  const lines = fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l=>l.split(';'));
  rows.shift();
  const list = [];
  for (const r of rows) {
    const id = tidy(r[0]||'');
    const fullName = tidy(r[1]||'');
    const status = tidy(r[9]||'');
    if (!fullName) continue;
    list.push({ id, fullName, status, key: normalizeName(fullName) });
  }
  return list;
}

function groupByKey(list) {
  const map = new Map();
  for (const item of list) {
    const arr = map.get(item.key) || [];
    arr.push(item);
    map.set(item.key, arr);
  }
  return map;
}

async function audit() {
  const baseline = parseEmployeesCsv(BASELINE).filter(e=>e.status==='AKTIF');
  const left = parseEmployeesCsv(LEFT).filter(e=>e.status==='AYRILDI');
  const current = parseEmployeesCsv(CURRENT).filter(e=>e.status==='AKTIF');

  const leftSet = new Set(left.map(e=>e.key));
  const baseSet = new Set(baseline.map(e=>e.key));
  const curSet = new Set(current.map(e=>e.key));

  const suspiciousAdded = current.filter(e=>!baseSet.has(e.key) && !NAME_BLACKLIST.has(e.key));
  const blacklisted = current.filter(e=>NAME_BLACKLIST.has(e.key));
  const duplicates = [...groupByKey(current).entries()].filter(([k,v])=>v.length>1).map(([k,v])=>({ key:k, count:v.length, ids:v.map(x=>x.id), names:v.map(x=>x.fullName) }));
  const shouldBeRemoved = current.filter(e=>leftSet.has(e.key));

  const summary = {
    baselineCount: baseline.length,
    currentCount: current.length,
    diff: current.length - baseline.length,
    suspiciousAddedCount: suspiciousAdded.length,
    blacklistedCount: blacklisted.length,
    duplicateGroups: duplicates.length,
    resignedStillActiveCount: shouldBeRemoved.length
  };

  const report = { summary, suspiciousAdded, blacklisted, duplicates, shouldBeRemoved };
  fs.writeFileSync(path.resolve(__dirname,'employee_audit_report.json'), JSON.stringify(report, null, 2));
  console.log('📝 audit -> server/employee_audit_report.json');
  return report;
}

async function cleanDatabase(report) {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');

  let removed = 0; let deactivated = 0;

  // 1) Kara listedekileri PASIF yap
  for (const e of report.blacklisted) {
    const res = await Employee.updateMany({ adSoyad: { $regex: new RegExp(`^${e.fullName}$`,'i') } }, { $set: { durum: 'PASIF' } });
    deactivated += res.modifiedCount || 0;
  }

  // 2) Ayrılanlar hâlâ aktifse PASIF yap
  for (const e of report.shouldBeRemoved) {
    const res = await Employee.updateMany({ adSoyad: { $regex: new RegExp(`^${e.fullName}$`,'i') } }, { $set: { durum: 'AYRILDI' } });
    deactivated += res.modifiedCount || 0;
  }

  // 3) DB içi isim duplikeleri: en eski kaydı bırak, diğerlerinin servis bilgisini taşı ve sil
  for (const g of report.duplicates) {
    const docs = await Employee.find({ adSoyad: { $regex: new RegExp(`^${g.names[0]}$`, 'i') } }).sort({ createdAt: 1 });
    if (docs.length <= 1) continue;
    const master = docs[0];
    for (let i = 1; i < docs.length; i++) {
      const d = docs[i];
      // servis bilgisini birleştir
      if (d.serviceInfo && (!master.serviceInfo || !master.serviceInfo.stopName)) {
        master.serviceInfo = d.serviceInfo;
        master.servisGuzergahi = d.servisGuzergahi || master.servisGuzergahi;
        master.durak = d.durak || master.durak;
      }
      await d.deleteOne();
      removed++;
    }
    await master.save();
  }

  await mongoose.disconnect();
  fs.writeFileSync(path.resolve(__dirname,'employee_clean_summary.json'), JSON.stringify({ removed, deactivated }, null, 2));
  console.log('🧹 clean -> server/employee_clean_summary.json');
}

async function main() {
  const report = await audit();
  await cleanDatabase(report);
}

if (require.main === module) {
  main().catch(err=>{ console.error(err); });
}



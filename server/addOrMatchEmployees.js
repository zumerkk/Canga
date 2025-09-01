const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const EMP_FILE = process.argv[2] || path.resolve(__dirname, '../Canga_Calisanlar_01-09-2025.csv');
const LEFT_FILE = process.argv[3] || path.resolve(__dirname, '../Canga_Isten_Ayrilanlar_01-09-2025.csv');
const ROUTE_DIR = process.argv[4] || '/Users/zumerkekillioglu/Downloads/PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga';

const tidy = (s='') => (s||'').toString().replace(/\s+/g,' ').trim();
const toUpperTr = (s='') => tidy(s).replace(/i̇/g,'i').replace(/İ/g,'I').replace(/ı/g,'I').toUpperCase();
const normalizeName = (s='') => toUpperTr(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'');

const nameCorrections = new Map([
  ['CEVCET ÖKSÜZ','CEVDET ÖKSÜZ'],
  ['FURKAN KADİR EDEN','FURKAN KADİR ESEN'],
  ['SONER ÇETİN GÜRSOY','SONER GÜRSOY'],
  ['DİLARA YILDIRIM','DİLARA BERRA YILDIRIM'],
  ['MEHMET KEMAL İNAÇ','MEHMET KEMAL İNANÇ'],
  ['MUHAMMED NAZİM GÖÇ','MUHAMMET NAZIM GÖÇ'],
  ['BERKAN BULANIK (BAHŞILI)','BERKAN BULANIK']
]);

function parseLeftCsv(file) {
  if (!fs.existsSync(file)) return new Set();
  const lines = fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l=>l.split(';'));
  // find header row index
  const hdrIdx = rows.findIndex(r=>/Ad Soyad/i.test(r.join(';')));
  const set = new Set();
  for (let i = hdrIdx+1; i < rows.length; i++) {
    const name = tidy(rows[i][1]||'');
    if (!name) continue;
    set.add(normalizeName(name));
  }
  return set;
}

function parseRouteCsv(filePath) {
  const raw = fs.readFileSync(filePath,'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l=>l.split(';'));
  const base = path.basename(filePath).toUpperCase();
  let routeName = '';
  if (base.includes('DİSPANSER') || base.includes('DİSPANSER')) routeName = 'DİSPANSER SERVİS GÜZERGAHI';
  else if (base.includes('ÇARŞI') || base.includes('ÇARŞI')) routeName = 'ÇARŞI MERKEZ SERVİS GÜZERGAHI';
  else if (base.includes('SANAYİ') || base.includes('SANAYİ')) routeName = 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI';
  else if (base.includes('OSM')) routeName = 'OSMANGAZİ-KARŞIYAKA MAHALLESİ';
  else if (base.includes('ÇALILIÖZ') || base.includes('ÇALILIÖZ')) routeName = 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI';
  else if (base.includes('KENDI') || base.includes('KENDİ')) routeName = 'KENDİ ARACI İLE GELENLER';

  const passengers = [];
  if (/KEND[Iİ]/i.test(routeName)) {
    for (let i=1;i<rows.length;i++) {
      const fullName = tidy(rows[i][0]||'');
      if (!fullName) continue;
      passengers.push({ fullName, stop: 'KENDİ ARACI' });
    }
  } else {
    for (let i=0;i<rows.length;i++) {
      const c0 = tidy(rows[i][0]||'');
      const c1 = tidy(rows[i][1]||'');
      const c2 = tidy(rows[i][2]||'');
      if (c0 && c1 && /^(\d+)$/.test(c2)) passengers.push({ fullName: c0, stop: c1 });
    }
  }
  return { routeName, passengers };
}

async function ensureEmployee(fullName, routeName, stopName) {
  const corrected = nameCorrections.get(toUpperTr(fullName)) || fullName;
  const key = normalizeName(corrected);
  const leftSet = global._leftSet;
  if (leftSet && leftSet.has(key)) return { action: 'skipped_resigned', name: corrected };

  let emp = await Employee.findOne({ adSoyad: { $regex: new RegExp(`^${corrected}$`, 'i') } });
  if (!emp) {
    emp = new Employee({
      adSoyad: corrected,
      pozisyon: 'İMAL İŞÇİSİ',
      lokasyon: routeName.includes('SANAYİ') ? 'İŞL' : routeName.includes('OSMANGAZİ') ? 'OSB' : routeName.includes('ÇALILIÖZ') ? 'İŞIL' : 'MERKEZ',
      durum: 'AKTIF'
    });
    await emp.save();
  }
  const stopNorm = /KEND[Iİ]\s*ARACI/i.test(stopName) ? 'KENDİ ARACI' : stopName;
  await Employee.findByIdAndUpdate(emp._id, {
    $set: {
      servisGuzergahi: routeName,
      durak: stopNorm,
      serviceInfo: { usesService: routeName !== 'KENDİ ARACI İLE GELENLER', routeName, stopName: stopNorm }
    }
  });
  return { action: 'ensured', name: emp.adSoyad, routeName, stop: stopNorm };
}

async function main() {
  await mongoose.connect(MONGO_URI);

  global._leftSet = parseLeftCsv(LEFT_FILE);

  const files = fs.readdirSync(ROUTE_DIR).filter(f=>f.endsWith('.csv'));
  const actions = [];
  for (const f of files) {
    const { routeName, passengers } = parseRouteCsv(path.join(ROUTE_DIR, f));
    for (const p of passengers) {
      actions.push(await ensureEmployee(p.fullName, routeName, p.stop));
    }
  }

  fs.writeFileSync(path.resolve(__dirname,'addOrMatchEmployees_report.json'), JSON.stringify(actions, null, 2));
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(err => { console.error(err); mongoose.disconnect(); });
}

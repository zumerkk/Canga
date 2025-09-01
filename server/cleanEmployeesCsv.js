const fs = require('fs');
const path = require('path');

// Kullanım: node server/cleanEmployeesCsv.js "/abs/path/Canga_Calisanlar_01-09-2025 (2).csv"

const INPUT = process.argv[2];
if (!INPUT) {
  console.error('Lütfen temizlenecek CSV dosyasının tam yolunu verin.');
  process.exit(1);
}

const BLACKLIST = new Set(['SABAH','AKŞAM','16-24','24-08']);

const tidy = (s='') => (s||'').toString().replace(/\s+/g,' ').trim();
const toUpperTr = (s='') => tidy(s).replace(/i̇/g,'i').replace(/İ/g,'I').replace(/ı/g,'I').toUpperCase();
const normalizeName = (s='') => toUpperTr(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'');

const NAME_FIX = new Map([
  ['CEVCET ÖKSÜZ','Cevdet ÖKSÜZ'],
  ['FURKAN KADİR EDEN','Furkan Kadir ESEN'],
  ['SONER ÇETİN GÜRSOY','Soner GÜRSOY'],
  ['DİLARA YILDIRIM','Dilara Berra YILDIRIM'],
  ['MEHMET KEMAL İNAÇ','Mehmet Kemal İNANÇ'],
  ['MUHAMMED NAZİM GÖÇ','Muhammet Nazim GÖÇ'],
  ['BERKAN BULANIK (BAHŞILI)','Berkan BULANIK']
]);

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath,'utf8');
  const lines = raw.split(/\r?\n/);
  const header = lines[0];
  const rows = lines.slice(1).filter(Boolean).map(l=>l.split(';'));
  return { header, rows };
}

function writeCsv(filePath, header, rows) {
  const text = [header, ...rows.map(r=>r.join(';'))].join('\n');
  fs.writeFileSync(filePath, text, 'utf8');
}

function main() {
  const { header, rows } = parseCsv(INPUT);
  const idx = {
    id: 0,
    name: 1,
    status: 9,
    route: 10,
    stop: 11
  };

  const seen = new Map();
  const out = [];
  let removedBlacklist = 0;
  let fixedNames = 0;
  let deduped = 0;

  for (const r of rows) {
    const rawName = tidy(r[idx.name]||'');
    const key = normalizeName(rawName);
    if (!rawName) continue;
    if (BLACKLIST.has(key)) { removedBlacklist++; continue; }

    const fixed = NAME_FIX.get(toUpperTr(rawName)) || rawName;
    if (fixed !== rawName) { r[idx.name] = fixed; fixedNames++; }

    // Durak normalizasyonu (kendi aracı varyantı)
    const stop = toUpperTr(tidy(r[idx.stop]||''));
    if (/KEND[Iİ]\s*ARACI/.test(stop) || /^1\./.test(stop)) r[idx.stop] = 'KENDİ ARACI';

    const normKey = normalizeName(r[idx.name]);
    if (seen.has(normKey)) {
      // Önce TC dolu olanı, yoksa ilk geleni koru
      const prev = seen.get(normKey);
      const curHasTc = tidy(r[2]||'').length>0;
      const prevHasTc = tidy(prev[2]||'').length>0;
      if (curHasTc && !prevHasTc) {
        seen.set(normKey, r);
      }
      deduped++;
      continue;
    }
    seen.set(normKey, r);
  }

  for (const r of seen.values()) out.push(r);

  const outPath = path.join(path.dirname(INPUT), path.basename(INPUT).replace(/\.csv$/i,'_CLEANED.csv'));
  writeCsv(outPath, header, out);
  fs.writeFileSync(path.join(path.dirname(INPUT),'_clean_stats.json'), JSON.stringify({ total: rows.length, kept: out.length, removedBlacklist, fixedNames, deduped }, null, 2));
  console.log('🧹 Cleaned CSV ->', outPath);
}

main();



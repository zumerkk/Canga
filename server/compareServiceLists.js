const fs = require('fs');
const path = require('path');

// Girdiler
const EMP_FILE = process.argv[2] || path.resolve(__dirname, '../Canga_Calisanlar_01-09-2025.csv');
const ROUTE_DIR = process.argv[3] || '/Users/zumerkekillioglu/Downloads/PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)';

// Yardımcılar
const tidy = (s = '') => (s || '').toString().replace(/\s+/g, ' ').trim();
const toUpperTr = (s = '') => tidy(s)
  .replace(/i̇/g, 'i')
  .replace(/İ/g, 'I')
  .replace(/ı/g, 'I')
  .toUpperCase()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const normalizeName = (s = '') => toUpperTr(s)
  .replace(/\./g, '')
  .replace(/\(/g, '(')
  .replace(/\)/g, ')')
  .replace(/\s+/g, ' ') // tek boşluk
  .trim();

// İsim düzeltmeleri (analiz sırasında eşleme için)
const nameCorrections = new Map([
  ['CEVCET ÖKSÜZ', 'CEVDET ÖKSÜZ'],
  ['FURKAN KADİR EDEN', 'FURKAN KADİR ESEN'],
  ['SONER ÇETİN GÜRSOY', 'SONER GÜRSOY'],
  ['DİLARA YILDIRIM', 'DİLARA BERRA YILDIRIM'],
  ['MEHMET KEMAL İNAÇ', 'MEHMET KEMAL İNANÇ'],
  ['MUHAMMED NAZİM GÖÇ', 'MUHAMMET NAZIM GÖÇ'],
  ['BERKAN BULANIK (BAHŞILI)', 'BERKAN BULANIK'],
  ['SONER ÇETİN GÜRSOY', 'SONER GÜRSOY']
]);

const routeNameMap = {
  'DİSPANSER': 'DİSPANSER SERVİS GÜZERGAHI',
  'ÇARŞI MERKEZ': 'ÇARŞI MERKEZ SERVİS GÜZERGAHI',
  'SANAYİ MAHALLESİ': 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI',
  'ÇALILIÖZ MAHALLESİ': 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI',
  'OSMANGAZİ-KARŞIYAKA MAHALLESİ': 'OSMANGAZİ-KARŞIYAKA MAHALLESİ',
  'KENDİ ARACI İLE GELENLER': 'KENDİ ARACI İLE GELENLER'
};

const routeFileToName = (file) => {
  const base = path.basename(file).toUpperCase();
  if (base.includes('DİSPANSER') || base.includes('DİSPANSER')) return routeNameMap['DİSPANSER'];
  if (base.includes('ÇARŞI') || base.includes('ÇARŞI')) return routeNameMap['ÇARŞI MERKEZ'];
  if (base.includes('SANAYİ') || base.includes('SANAYİ')) return routeNameMap['SANAYİ MAHALLESİ'];
  if (base.includes('OSM')) return routeNameMap['OSMANGAZİ-KARŞIYAKA MAHALLESİ'];
  if (base.includes('ÇALILIÖZ') || base.includes('ÇALILIÖZ')) return routeNameMap['ÇALILIÖZ MAHALLESİ'];
  if (base.includes('KENDI') || base.includes('KENDİ')) return routeNameMap['KENDİ ARACI İLE GELENLER'];
  return tidy(base);
};

function parseEmployeesCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l => l.split(';'));
  const header = rows.shift();

  const idx = {
    id: header.findIndex(h => /çalışan id|calisan id|id/i.test(h)),
    fullName: header.findIndex(h => /ad soyad|ad\s*soyad/i.test(h)),
    status: header.findIndex(h => /durum/i.test(h)),
    route: header.findIndex(h => /servis.*güzergah/i.test(h)),
    stop: header.findIndex(h => /durak/i.test(h))
  };

  const list = [];
  for (const r of rows) {
    const status = tidy(r[idx.status] || '');
    if (status !== 'AKTIF') continue;
    const rawName = tidy(r[idx.fullName] || '');
    const corrected = nameCorrections.get(toUpperTr(rawName)) || rawName;
    list.push({
      id: tidy(r[idx.id] || ''),
      fullName: corrected,
      key: normalizeName(corrected),
      route: tidy(r[idx.route] || ''),
      stop: tidy(r[idx.stop] || '')
    });
  }
  return list;
}

function parseRouteCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l => l.split(';'));

  const routeName = routeFileToName(filePath);
  const passengers = [];

  // KENDİ dosyası: tek kolon isimler
  if (/KEND[Iİ]/i.test(routeName)) {
    for (let i = 1; i < rows.length; i++) {
      const name = tidy(rows[i][0] || '');
      if (!name) continue;
      passengers.push({ fullName: name, stop: 'KENDİ ARACI', order: 0 });
    }
    return { routeName, passengers };
  }

  // Diğer rotalar: alt blokta Ad;Durak;Sıra
  for (let i = 0; i < rows.length; i++) {
    const c0 = tidy(rows[i][0] || '');
    const c1 = tidy(rows[i][1] || '');
    const c2 = tidy(rows[i][2] || '');
    if (c0 && c1 && /^(\d+)$/.test(c2)) {
      const corrected = nameCorrections.get(toUpperTr(c0)) || c0;
      let stopNorm = toUpperTr(c1);
      if (/(^|\s)KEND[Iİ]\s*ARACI/.test(stopNorm)) c1 = 'KENDİ ARACI';
      passengers.push({ fullName: corrected, stop: c1, order: Number(c2) });
    }
  }
  return { routeName, passengers };
}

function writeCsv(filePath, rows) {
  const header = ['Type', 'EmployeeID', 'FullName', 'FromEmployeesRoute', 'FromEmployeesStop', 'FromRoute', 'FromRouteStop', 'RouteFile'];
  const text = [header.join(';'), ...rows.map(r => header.map(h => tidy(r[h] ?? '')).join(';'))].join('\n');
  fs.writeFileSync(filePath, text, 'utf8');
}

function main() {
  const employees = parseEmployeesCsv(EMP_FILE);
  const empMap = new Map();
  employees.forEach(e => empMap.set(e.key, e));

  const files = fs.readdirSync(ROUTE_DIR).filter(f => f.endsWith('.csv'));

  const report = {
    employeesTotal: employees.length,
    routes: {},
    missingFromEmployees: [],
    employeesNotInRoutes: [],
    mismatchedStopOrRoute: [],
    duplicatesInRoutes: []
  };

  const csvRows = [];

  // 1) Rota CSV → Çalışan listesinde olmayanlar
  for (const f of files) {
    const filePath = path.join(ROUTE_DIR, f);
    const { routeName, passengers } = parseRouteCsv(filePath);
    const seen = new Set();
    let dupCount = 0;

    passengers.forEach(p => {
      const key = normalizeName(p.fullName);
      if (seen.has(key)) {
        dupCount++;
        report.duplicatesInRoutes.push({ routeName, fullName: p.fullName, file: f });
      }
      seen.add(key);

      if (!empMap.has(key)) {
        report.missingFromEmployees.push({ routeName, fullName: p.fullName, stop: p.stop, file: f });
        csvRows.push({
          Type: 'MissingInEmployees', EmployeeID: '', FullName: p.fullName,
          FromEmployeesRoute: '', FromEmployeesStop: '',
          FromRoute: routeName, FromRouteStop: p.stop, RouteFile: f
        });
      }
    });

    report.routes[routeName] = { file: f, passengers: passengers.length, duplicates: dupCount };
  }

  // 2) Çalışan CSV → Bulunduğu rota CSV’de olmayanlar veya durak uyumsuzluğu
  // Route adı bilinen (boş olmayan) çalışanları kontrol et
  const normalizedRouteSet = new Set(Object.values(routeNameMap));
  const routeFileIndex = new Map();
  files.forEach(f => {
    const rn = routeFileToName(f);
    routeFileIndex.set(rn, f);
  });

  // Route CSV yolcu setleri
  const routePassengerSets = new Map();
  for (const f of files) {
    const { routeName, passengers } = parseRouteCsv(path.join(ROUTE_DIR, f));
    const set = new Map();
    passengers.forEach(p => set.set(normalizeName(p.fullName), p));
    routePassengerSets.set(routeName, set);
  }

  employees.forEach(e => {
    const routeName = tidy(e.route);
    if (!routeName || !normalizedRouteSet.has(routeName)) return; // servise kaydı boşsa atla

    const set = routePassengerSets.get(routeName);
    if (!set) {
      report.employeesNotInRoutes.push({ fullName: e.fullName, employeeId: e.id, routeName, stop: e.stop, reason: 'RouteCSVNotFound' });
      csvRows.push({ Type: 'RouteCSVNotFound', EmployeeID: e.id, FullName: e.fullName, FromEmployeesRoute: routeName, FromEmployeesStop: e.stop, FromRoute: '', FromRouteStop: '', RouteFile: '' });
      return;
    }

    const p = set.get(e.key);
    if (!p) {
      report.employeesNotInRoutes.push({ fullName: e.fullName, employeeId: e.id, routeName, stop: e.stop });
      csvRows.push({ Type: 'NotInRouteList', EmployeeID: e.id, FullName: e.fullName, FromEmployeesRoute: routeName, FromEmployeesStop: e.stop, FromRoute: routeName, FromRouteStop: '', RouteFile: routeFileIndex.get(routeName) || '' });
      return;
    }

    // Durak uyuşmazlığı kontrolü (içerme toleransı)
    const empStop = toUpperTr(e.stop);
    const routeStop = toUpperTr(p.stop);
    const match = empStop && routeStop && (empStop === routeStop || empStop.includes(routeStop) || routeStop.includes(empStop));
    if (!match) {
      report.mismatchedStopOrRoute.push({ fullName: e.fullName, employeeId: e.id, routeName, employeeStop: e.stop, routeStop: p.stop });
      csvRows.push({ Type: 'StopMismatch', EmployeeID: e.id, FullName: e.fullName, FromEmployeesRoute: routeName, FromEmployeesStop: e.stop, FromRoute: routeName, FromRouteStop: p.stop, RouteFile: routeFileIndex.get(routeName) || '' });
    }
  });

  // Yazdır
  const outJson = path.resolve(__dirname, 'service_compare_report.json');
  const outCsv = path.resolve(__dirname, 'service_compare_report.csv');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2), 'utf8');
  writeCsv(outCsv, csvRows);
  console.log(`\n📝 Raporlar hazır:\n- ${outJson}\n- ${outCsv}`);
}

if (require.main === module) {
  main();
}



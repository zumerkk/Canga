const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

// .env yükle (server klasöründen)
dotenv.config({ path: path.resolve(__dirname, '.env') });

// --- KULLANICI DİZİNİ: Gönderdiğin CSV klasörü ---
// Not: İstediğinde bu yolu argümanla da geçebilirsin: `node server/updateServicesFromFolder.js "/abs/path"`
const INPUT_DIR = process.argv[2] || '/Users/zumerkekillioglu/Downloads/PERSONEL SERVİS DURAK ÇİZELGESİ 22 08 2024 (2)';

// MongoDB URI (ENV yoksa local)
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/canga';

// Route adlarını tekilleştirme
const routeNameMap = {
  'DİSPANSER': 'DİSPANSER SERVİS GÜZERGAHI',
  'ÇARŞI MERKEZ': 'ÇARŞI MERKEZ SERVİS GÜZERGAHI',
  'SANAYİ MAHALLESİ': 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI',
  'ÇALILIÖZ MAHALLESİ': 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI',
  'OSMANGAZİ-KARŞIYAKA MAHALLESİ': 'OSMANGAZİ-KARŞIYAKA MAHALLESİ',
  'KENDİ ARACI İLE GELENLER': 'KENDİ ARACI İLE GELENLER'
};

// Lokasyon eşlemesi (Employee.lokasyon için)
const routeLocationMap = {
  'DİSPANSER SERVİS GÜZERGAHI': 'MERKEZ',
  'ÇARŞI MERKEZ SERVİS GÜZERGAHI': 'MERKEZ',
  'SANAYİ MAHALLESİ SERVİS GÜZERGAHI': 'İŞL',
  'OSMANGAZİ-KARŞIYAKA MAHALLESİ': 'OSB',
  'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI': 'İŞIL'
};

// İsim düzeltmeleri
const nameCorrections = {
  'CEVCET ÖKSÜZ': 'CEVDET ÖKSÜZ',
  'FURKAN KADİR EDEN': 'FURKAN KADİR ESEN',
  'SONER ÇETİN GÜRSOY': 'SONER GÜRSOY',
  'DİLARA YILDIRIM': 'DİLARA BERRA YILDIRIM',
  'MEHMET KEMAL İNAÇ': 'MEHMET KEMAL İNANÇ',
  'MUHAMMED NAZİM GÖÇ': 'MUHAMMET NAZIM GÖÇ',
  'BERKAN BULANIK (BAHŞILI)': 'BERKAN BULANIK'
};

function normalizeText(s = '') {
  return s.replace(/\s+/g, ' ').trim();
}

function isNumeric(val) {
  return /^\d+$/.test(String(val || '').trim());
}

// CSV dosyasını tek tek satır analiz ederek parse et
function parseRouteCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l !== '');
  const rows = lines.map(l => l.split(';'));

  const baseTitle = normalizeText(rows[0]?.[0] || '');
  const baseRouteName = baseTitle;
  const routeName = routeNameMap[baseRouteName] || baseRouteName;

  const stops = [];
  const passengers = [];

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i];
    const c0 = normalizeText(r[0] || '');
    const c1 = normalizeText(r[1] || '');
    const c2 = normalizeText(r[2] || '');

    // Üst bloktaki durak satırları: sadece ilk kolon dolu, diğerleri boş
    if (c0 && !c1 && !c2 && c0.toUpperCase() !== 'SERVİS GÜZERGAHI') {
      stops.push({ name: c0 });
      continue;
    }

    // Yolcu satırı: Ad Soyad;Durak;SıraNo
    if (c0 && c1 && isNumeric(c2)) {
      passengers.push({ fullName: c0, stopName: c1, orderNumber: Number(c2) });
      continue;
    }
  }

  // Duraklara sırayı ver
  const orderedStops = stops.map((s, idx) => ({ name: s.name, order: idx + 1 }));
  return { routeName, baseRouteName, stops: orderedStops, passengers };
}

async function ensureOwnCarRoute() {
  let route = await ServiceRoute.findOne({ routeName: 'KENDİ ARACI İLE GELENLER' });
  if (!route) {
    route = new ServiceRoute({
      routeName: 'KENDİ ARACI İLE GELENLER',
      routeCode: 'KENDI-ARAC',
      color: '#ff9800',
      stops: [
        { name: 'KENDİ ARACI', order: 1 },
        { name: 'BAHŞILI', order: 2 },
        { name: 'YENİŞEHİR', order: 3 }
      ],
      status: 'AKTIF'
    });
    await route.save();
  }
  return route;
}

async function upsertServiceRoute(routeName, stops) {
  // Basit bir kod üretici (Türkçe karakterleri sadeleştirir)
  const toAscii = (s = '') => normalizeText(s)
    .replace(/İ/g, 'I').replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g').replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o').replace(/Ç/g, 'C').replace(/ç/g, 'c');
  const base = toAscii(routeName).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const routeCode = base.toUpperCase().slice(0, 24);

  const route = await ServiceRoute.findOneAndUpdate(
    { routeName },
    { 
      $set: { stops, status: 'AKTIF' },
      $setOnInsert: { routeName, routeCode }
    },
    { new: true, upsert: true }
  );
  return route;
}

async function assignEmployeeToRoute(fullName, routeName, stopName, routeId, orderNumber) {
  // İsim düzeltme uygula
  const corrected = nameCorrections[fullName] || fullName;
  const regex = new RegExp(`^${normalizeText(corrected).replace(/[-/()]/g, r => `\\${r}`)}$`, 'i');
  const employee = await Employee.findOne({ adSoyad: { $regex: regex }, durum: 'AKTIF' });

  if (!employee) {
    return { found: false };
  }

  const lokasyon = routeLocationMap[routeName] || employee.lokasyon;

  // Durak normalizasyonu (kendi aracı varyantları vb.)
  const normalizedStop = (() => {
    const s = normalizeText(stopName).toUpperCase();
    if (/(^|\s)KEND[Iİ]\s*ARACI/.test(s)) return 'KENDİ ARACI';
    if (/BAH[ŞS]ILI/i.test(s)) return 'BAHŞILI';
    if (/YEN[Iİ][ŞS]EH[Iİ]R/i.test(s)) return 'YENİŞEHİR';
    return stopName;
  })();

  await Employee.findByIdAndUpdate(
    employee._id,
    {
      $set: {
        servisGuzergahi: routeName,
        durak: normalizedStop,
        lokasyon,
        serviceInfo: {
          usesService: true,
          routeName,
          stopName: normalizedStop,
          routeId,
          orderNumber: Number(orderNumber) || 0,
          usesOwnCar: false
        }
      }
    }
  );

  return { found: true, employeeName: employee.adSoyad };
}

async function processOwnCarCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l !== '');
  const rows = lines.map(l => l.split(';'));

  const route = await ensureOwnCarRoute();

  let updated = 0; let missing = 0;

  for (let i = 1; i < rows.length; i++) {
    const name = normalizeText(rows[i][0] || '');
    if (!name) continue;

    const corrected = nameCorrections[name] || name;
    const regex = new RegExp(`^${corrected.replace(/[-/()]/g, r => `\\${r}`)}$`, 'i');
    const emp = await Employee.findOne({ adSoyad: { $regex: regex }, durum: 'AKTIF' });
    if (!emp) { missing++; continue; }

    await Employee.findByIdAndUpdate(emp._id, {
      $set: {
        servisGuzergahi: 'KENDİ ARACI İLE GELENLER',
        durak: 'KENDİ ARACI',
        serviceInfo: {
          usesService: false,
          usesOwnCar: true,
          routeName: 'KENDİ ARACI İLE GELENLER',
          stopName: 'KENDİ ARACI',
          routeId: route._id,
          orderNumber: 0
        }
      }
    });
    updated++;
  }

  return { updated, missing };
}

async function main() {
  const report = {
    startedAt: new Date().toISOString(),
    dir: INPUT_DIR,
    routes: {},
    ownCar: null
  };

  await mongoose.connect(MONGO_URI);

  try {
    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.csv'));

    for (const fileName of files) {
      const filePath = path.join(INPUT_DIR, fileName);

      // KENDİ aracı dosyası ayrı akış
      if (/kendi/i.test(fileName)) {
        const own = await processOwnCarCsv(filePath);
        report.ownCar = own;
        continue;
      }

      const { routeName, stops, passengers } = parseRouteCsv(filePath);

      // Güzergahı güncelle/ oluştur
      const route = await upsertServiceRoute(routeName, stops);

      let updated = 0; let missing = 0;
      for (const p of passengers) {
        const res = await assignEmployeeToRoute(p.fullName, routeName, p.stopName, route._id, p.orderNumber);
        if (res.found) updated++; else missing++;
      }

      report.routes[routeName] = {
        file: fileName,
        stops: stops.length,
        passengers: passengers.length,
        updated,
        missing
      };
    }

  } finally {
    report.finishedAt = new Date().toISOString();
    try {
      const outPath = path.resolve(__dirname, 'correct_import_report.json');
      fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
      console.log(`\n📄 Rapor yazıldı: ${outPath}`);
    } catch (e) {
      console.warn('Rapor yazılırken hata:', e.message);
    }
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Genel hata:', err);
    mongoose.connection.close();
  });
}



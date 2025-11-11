#!/usr/bin/env node

/**
 * 🔄 GENEL LİSTE -> MongoDB Senkronizasyon Scripti (v2)
 *
 * - CSV dosyasındaki 123 aktif çalışanı baz alır
 * - TC numarasına göre güvenli şekilde upsert yapar
 * - Kayıtları günceller, eksik olanları oluşturur
 * - CSV'de yer almayan aktif çalışanları PASIF durumuna çeker
 * - Servis güzergahı, departman ve servis bilgilerini normalize eder
 *
 * Kullanım:
 *   MONGODB_URI="mongodb+srv://..." node server/scripts/syncEmployeesFromGenelListeV2.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Employee = require('../models/Employee');
const ServiceRoute = require('../models/ServiceRoute');

const CSV_PATH = path.join(__dirname, '..', '..', 'GENEL LİSTE-Tablo 1.csv');
const DEFAULT_ROUTE = 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI';
const DEFAULT_LOCATION = 'MERKEZ';

const STOP_TO_ROUTE = new Map([
  ['AHILI/ÇALILIÖZ', 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI'],
  ['ÇALILIÖZ', 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI'],
  ['ÇULUYOLU BİM MARKET', 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI'],
  ['ÇOCUK ŞUBE KARŞISI', 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI'],
  ['ÇORBACI ALİ DAYI', 'OSMANGAZİ - ÇARŞI MERKEZ SERVİS GÜZERGAHI'],
  ['DİSPANSER', '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI'],
  ['ETİLER', 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI'],
  ['ETİLER A101', 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI'],
  ['KESKİN', 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI'],
  ['FIRINLI CAMİİ', DEFAULT_ROUTE],
  ['GÜL PASTANESİ', DEFAULT_ROUTE],
  ['HALI SAHA', DEFAULT_ROUTE],
  ['KAHVELER', 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI'],
  ['KALETEPE', DEFAULT_ROUTE],
  ['KARŞIYAKA', 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI'],
  ['ORTAKLAR MARKET', 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI'],
  ['BAĞDAT KÖPRÜ', DEFAULT_ROUTE],
  ['BAĞDAT KÖPRÜ BENZİNLİK', DEFAULT_ROUTE],
  ['BAHÇELİEVLER', 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI'],
  ['NOKTA A101', DEFAULT_ROUTE],
  ['SANAYİ', DEFAULT_ROUTE],
  ['OSMANGAZİ', DEFAULT_ROUTE],
  ['OVACIK', DEFAULT_ROUTE],
  ['REKTÖRLÜK', DEFAULT_ROUTE],
  ['REKTÖRLÜK (YENİŞEHİR)', DEFAULT_ROUTE],
  ['SAAT KULESİ', DEFAULT_ROUTE],
  ['SAATLİ KULE', DEFAULT_ROUTE],
  ['ŞADIRVAN', '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI'],
  ['VALİLİK', DEFAULT_ROUTE],
  ['YAYLACIK', DEFAULT_ROUTE],
  ['CEYARİN BENZİNLİK', DEFAULT_ROUTE],
  ['ADLİYE ÖNÜ', DEFAULT_ROUTE],
  ['PODYUM KAVŞAK', DEFAULT_ROUTE],
  ['PODYUM KAVŞAK/YENİŞEHİR', DEFAULT_ROUTE],
  ['GO BENZİNLİK', DEFAULT_ROUTE],
  ['TANDIRLIK', DEFAULT_ROUTE],
  ['SELİMÖZER', DEFAULT_ROUTE],
  ['KEL MUSTAFA DURAĞI/KARŞIYAKA', 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI'],
  ['BAHŞILI/KENDİ ARACI', 'KENDİ ARACI İLE GELENLER'],
  ['KENDİ ARACI İLE', 'KENDİ ARACI İLE GELENLER'],
  ['KENDİ ARACI İLE/OSMANGAZİ', 'KENDİ ARACI İLE GELENLER'],
  ['GO BENZİNLİK', DEFAULT_ROUTE],
  ['PODYUM KAVŞAK', DEFAULT_ROUTE],
  ['NENE HATUN CAD', DEFAULT_ROUTE],
  ['NENE HATUN CAD.', DEFAULT_ROUTE]
]);

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV dosyası bulunamadı: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const records = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const parts = line.split(';');
    if (parts.length < 9) continue;

    const adSoyad = parts[2]?.trim();
    if (!adSoyad || adSoyad === 'AD - SOYAD') continue;

    records.push({
      adSoyad,
      tcNo: (parts[3] || '').trim(),
      cepTelefonu: normalizePhone(parts[4]),
      dogumTarihi: parseDate(parts[5]),
      iseGirisTarihi: parseDate(parts[6]),
      pozisyon: (parts[7] || '').trim(),
      servisBinisNoktasi: (parts[8] || '').trim()
    });
  }

  return records;
}

function normalizePhone(value) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

function parseDate(value) {
  if (!value) return undefined;
  const raw = value.trim();
  if (!raw) return undefined;

  if (raw.includes('/')) {
    const parts = raw.split('/').map(s => s.trim());
    if (parts.length === 3) {
      let [a, b, c] = parts;
      if (c.length === 2) {
        const yearNum = parseInt(c, 10);
        c = yearNum >= 50 ? `19${c}` : `20${c}`;
      }
      let month = parseInt(a, 10);
      let day = parseInt(b, 10);
      if (month > 12 && day <= 12) {
        [day, month] = [month, day];
      }
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(parseInt(c, 10))) {
        return new Date(`${c}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
    }
  }

  if (raw.includes('.')) {
    const parts = raw.split('.').map(s => s.trim());
    if (parts.length === 3) {
      let [day, month, year] = parts;
      if (year.length === 2) {
        const yearNum = parseInt(year, 10);
        year = yearNum >= 50 ? `19${year}` : `20${year}`;
      }
      return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function splitName(fullName) {
  const tokens = fullName.trim().split(/\s+/);
  const firstName = tokens[0] || '';
  const lastName = tokens.slice(1).join(' ') || '';
  return { firstName, lastName };
}

function determineRoute(stopRaw) {
  if (!stopRaw) return DEFAULT_ROUTE;
  const normalized = stopRaw.trim().toUpperCase();
  if (STOP_TO_ROUTE.has(normalized)) {
    return STOP_TO_ROUTE.get(normalized);
  }
  if (normalized.includes('KENDİ ARACI')) {
    return 'KENDİ ARACI İLE GELENLER';
  }
  if (normalized.includes('ÇALILI')) {
    return 'ÇALLIÖZ MAHALLESİ SERVİS GÜZERGAHI';
  }
  if (normalized.includes('DİSPANSER') || normalized.includes('ŞADIRVAN')) {
    return '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI';
  }
  if (normalized.includes('ETİLER') || normalized.includes('KESKİN')) {
    return 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI';
  }
  if (normalized.includes('KARŞIYAKA') || normalized.includes('BAHÇELİEVLER')) {
    return 'BAHÇELİEVLER-KARŞIYAKA MAHALLESİ SERVİS GÜZERGAHI';
  }
  return DEFAULT_ROUTE;
}

function determineDepartment(pozisyon) {
  if (!pozisyon) return 'ÜRETİM';
  const upper = pozisyon.toUpperCase();

  if (upper.includes('CNC') || upper.includes('TORNA') || upper.includes('FREZE') || upper.includes('İMAL') || upper.includes('BOYACI') || upper.includes('TAŞLAMA') || upper.includes('KUMLAMA')) {
    return 'ÜRETİM';
  }
  if (upper.includes('KALİTE') || upper.includes('KONTROL')) {
    return 'KALITE';
  }
  if (upper.includes('MUHASEBE')) {
    return 'MUHASEBE';
  }
  if (upper.includes('SATIN ALMA') || upper.includes('SATIŞ')) {
    return 'SATIŞ';
  }
  if (upper.includes('LOJ') || upper.includes('DEPO')) {
    return 'LOJISTIK';
  }
  if (upper.includes('BİLGİ') || upper.includes('BILGI')) {
    return 'BİLGİ İŞLEM';
  }
  if (upper.includes('MÜHENDİS') || upper.includes('PLANLAMA') || upper.includes('AR-GE') || upper.includes('ARGE')) {
    return 'AR-GE';
  }
  if (upper.includes('GÜVENLİK') || upper.includes('BEKÇİ')) {
    return 'GENEL';
  }
  if (upper.includes('TEMİZLİK') || upper.includes('MUTFAK') || upper.includes('LOBİ') || upper.includes('ASPHALT') || upper.includes('ASFALT')) {
    return 'GENEL';
  }
  return 'ÜRETİM';
}

async function main() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga';

  console.log('🔌 MongoDB bağlantısı kuruluyor...');
  await mongoose.connect(mongoURI);
  console.log('✅ MongoDB bağlantısı başarılı\n');

  console.log('📥 CSV okunuyor:', CSV_PATH);
  const csvEmployees = parseCsv(CSV_PATH);
  console.log(`🔎 CSV kayıt sayısı: ${csvEmployees.length}\n`);

  const serviceRoutes = await ServiceRoute.find({}).select('routeName').lean();
  const routeIndex = new Map(serviceRoutes.map(route => [route.routeName.trim().toUpperCase(), route]));

  const stats = {
    created: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    autoPasif: 0
  };

  const processedTCs = new Set();

  for (const record of csvEmployees) {
    if (!record.tcNo || record.tcNo.length < 5) {
      console.warn(`⚠️ TC numarası eksik, atlanıyor: ${record.adSoyad}`);
      stats.errors += 1;
      continue;
    }

    const tcNo = record.tcNo.trim();
    processedTCs.add(tcNo);

    const { firstName, lastName } = splitName(record.adSoyad);
    const routeName = determineRoute(record.servisBinisNoktasi);
    const department = determineDepartment(record.pozisyon);
    const isOwnCar = routeName === 'KENDİ ARACI İLE GELENLER';
    const routeDoc = routeIndex.get(routeName.toUpperCase());

    const serviceInfo = {
      usesService: !isOwnCar,
      routeName,
      stopName: record.servisBinisNoktasi || null,
      usesOwnCar: isOwnCar
    };

    if (routeDoc) {
      serviceInfo.routeId = routeDoc._id;
    } else {
      console.warn(`⚠️ Servis güzergahı veritabanında bulunamadı: ${routeName}`);
    }

    const update = {
      adSoyad: record.adSoyad,
      firstName,
      lastName,
      tcNo,
      cepTelefonu: record.cepTelefonu,
      dogumTarihi: record.dogumTarihi,
      iseGirisTarihi: record.iseGirisTarihi,
      pozisyon: record.pozisyon || 'ÇALIŞAN',
      departman: department,
      lokasyon: DEFAULT_LOCATION,
      durum: 'AKTIF',
      servisGuzergahi: routeName,
      durak: record.servisBinisNoktasi || null,
      serviceInfo,
      kendiAraci: isOwnCar,
      updatedAt: new Date()
    };

    try {
      const existing = await Employee.findOne({ tcNo });

      if (existing) {
        await Employee.updateOne({ _id: existing._id }, { $set: update });
        stats.updated += 1;
      } else {
        const employee = new Employee({
          ...update,
          createdAt: new Date()
        });
        await employee.save();
        stats.created += 1;
      }
    } catch (error) {
      console.error(`❌ Kayıt işlenemedi (${record.adSoyad}): ${error.message}`);
      stats.errors += 1;
    }
  }

  console.log('\n🧹 CSV dışındaki aktif çalışanlar PASIF yapılıyor...');
  const autoPasifResult = await Employee.updateMany(
    {
      durum: 'AKTIF',
      tcNo: { $nin: Array.from(processedTCs) }
    },
    {
      $set: {
        durum: 'PASIF',
        ayrilmaTarihi: new Date(),
        ayrilmaSebebi: 'GENEL LİSTE senkronizasyonu - listede yok'
      }
    }
  );
  stats.autoPasif = autoPasifResult.modifiedCount || 0;

  const totalActive = await Employee.countDocuments({ durum: 'AKTIF' });
  const totalEmployees = await Employee.countDocuments({});

  console.log('\n📊 SENKRONİZASYON ÖZETİ');
  console.log('────────────────────────────');
  console.log(`➕ Yeni kayıtlar        : ${stats.created}`);
  console.log(`🔄 Güncellenen kayıtlar : ${stats.updated}`);
  console.log(`🧹 PASIF yapılanlar     : ${stats.autoPasif}`);
  console.log(`⚠️ Hatalar              : ${stats.errors}`);
  console.log('────────────────────────────');
  console.log(`👥 Aktif çalışan sayısı : ${totalActive}`);
  console.log(`📦 Toplam çalışan sayısı: ${totalEmployees}`);

  await mongoose.disconnect();
  console.log('\n✅ MongoDB bağlantısı kapatıldı');
}

main().catch(err => {
  console.error('❌ Kritik hata:', err);
  mongoose.disconnect();
  process.exit(1);
});


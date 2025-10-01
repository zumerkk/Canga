#!/usr/bin/env node

/**
 * 50.YIL BLOKLARI - DİSPANSER güzergahını tekil olarak CSV'den günceller
 * - CSV: PERSONEL SERVİS DURAK ÇİZELGESİ 22.09/DİSPANSER-Tablo 1.csv
 * - Güzergah: "50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI"
 * - Durakları ve hareket saatini CSV'den alır
 * - Yolcu listesini CSV ile birebir eşitler (olmayanı çıkarır, eksik olanı ekler)
 * - Eşleşmeyen isimleri raporlar
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const ServiceRoute = require('../models/ServiceRoute');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga_database';
const ROUTE_NAME = '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI';
const CSV_PATH = path.join(__dirname, '..', '..', 'PERSONEL SERVİS DURAK ÇİZELGESİ 22.09', 'DİSPANSER-Tablo 1.csv');

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.split(';').map(c => c.trim()))
}

function extractFromCsv(rows) {
  const result = { routeOriginal: '', departure: '', stops: [], passengers: [] };
  let inPassengers = false;
  let stopOrder = 1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const first = row[0] || '';
    if (i === 0) result.routeOriginal = first;
    if (/HAREKET SAATİ/i.test(first)) {
      const m = first.match(/(\d{2})[.:](\d{2})/);
      if (m) result.departure = `${m[1]}:${m[2]}`;
    }
    if (/^SIRA NO/i.test(first)) { inPassengers = true; continue; }

    if (!inPassengers) {
      if (first && !/SERVİS GÜZERGAHI/i.test(first) && !/HAREKET SAATİ/i.test(first) && first !== result.routeOriginal) {
        result.stops.push({ name: first, order: stopOrder++ });
      }
    } else {
      // passengers
      const sira = row[0];
      const name = row[1];
      const stop = row[2];
      const phone = row[3];
      if (/^\d+$/.test((sira||'').trim()) && name) {
        result.passengers.push({ sira: parseInt(sira, 10), name: name.trim(), stop: (stop||'').trim(), phone: (phone||'').trim() });
      }
    }
  }
  return result;
}

function normalizeName(s) {
  return (s || '')
    .replace(/\([^)]*\)/g, '') // remove parentheses
    .replace(/\s+-\s*TORUN$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

const NAME_FIX = {
  'CEVCET ÖKSÜZ': 'CEVDET ÖKSÜZ'
};

async function upsertRoute(stops, departure) {
  let route = await ServiceRoute.findOne({ routeName: ROUTE_NAME });
  if (!route) {
    route = new ServiceRoute({ routeName: ROUTE_NAME, status: 'AKTIF' });
  }
  route.stops = stops.map(s => ({ name: s.name, order: s.order }));
  route.schedule = departure ? [{ time: departure, isActive: true }] : route.schedule;
  route.updatedBy = 'updateDispanserFromCSV';
  route.updatedAt = new Date();
  await route.save();
  return route;
}

function sanitizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  // return last 10 or 11 digits commonly used in TR
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

async function findEmployee(csvName, csvPhone) {
  // 1) Try by phone first
  const phone = sanitizePhone(csvPhone);
  if (phone) {
    // exact or ends-with match on possible fields
    const phoneRegex = new RegExp(`${phone}$`);
    let byPhone = await Employee.findOne({
      $or: [
        { telefon: phone },
        { cepTelefonu: phone },
        { phone: phone },
        { telefon: phoneRegex },
        { cepTelefonu: phoneRegex },
        { phone: phoneRegex }
      ],
      durum: 'AKTIF'
    });
    if (byPhone) return byPhone;
  }

  // 2) Fallback to name matching (robust)
  const fixed = NAME_FIX[(csvName||'').toUpperCase()] || csvName || '';
  const norm = normalizeName(fixed);
  // Try exact regex on normalized target fields
  const rx = new RegExp(`^${norm.replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`)}$`, 'i');
  let emp = await Employee.findOne({ adSoyad: rx, durum: 'AKTIF' });
  if (!emp) emp = await Employee.findOne({ fullName: rx, durum: 'AKTIF' });
  if (emp) return emp;

  // Fallback loose search (ignore multiple spaces and hyphens)
  const loose = new RegExp(normalizeName(norm).replace(/\s+/g, '.*'));
  emp = await Employee.findOne({ adSoyad: loose, durum: 'AKTIF' });
  if (!emp) emp = await Employee.findOne({ fullName: loose, durum: 'AKTIF' });
  if (emp) return emp;

  // Final fallback: raw name contains search (no normalization)
  const rawRx = new RegExp(csvName.replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`), 'i');
  emp = await Employee.findOne({ adSoyad: rawRx, durum: 'AKTIF' });
  if (!emp) emp = await Employee.findOne({ fullName: rawRx, durum: 'AKTIF' });
  return emp;
}

async function assignEmployees(route, csvPassengers, csvStops) {
  const routeId = route._id;
  const notFound = [];

  // Build map stopName->order for consistent order assignment
  const stopOrderMap = new Map(csvStops.map(s => [s.name.toUpperCase(), s.order]));

  // Assign per CSV
  const assignedIds = new Set();
  for (const p of csvPassengers) {
    const emp = await findEmployee(p.name, p.phone);
    if (!emp) { notFound.push(p.name); continue; }
    assignedIds.add(String(emp._id));
    const stopOrder = stopOrderMap.get((p.stop||'').toUpperCase()) || 0;
    const update = {
      'serviceInfo.usesService': true,
      'serviceInfo.routeName': ROUTE_NAME,
      'serviceInfo.stopName': p.stop,
      'serviceInfo.routeId': routeId,
      'serviceInfo.stopOrder': stopOrder,
      servisGuzergahi: ROUTE_NAME,
      durak: p.stop,
      updatedAt: new Date()
    };
    if (p.phone && p.phone.replace(/\D/g, '').length >= 10) update.telefon = p.phone;
    await Employee.findByIdAndUpdate(emp._id, { $set: update });
  }

  // Unassign extras not in CSV but currently assigned to this route
  const extras = await Employee.find({
    $or: [
      { 'serviceInfo.routeId': routeId },
      { servisGuzergahi: ROUTE_NAME }
    ],
    durum: 'AKTIF'
  }).select('_id adSoyad fullName');

  let removed = [];
  for (const e of extras) {
    if (!assignedIds.has(String(e._id))) {
      removed.push(e.adSoyad || e.fullName);
      await Employee.findByIdAndUpdate(e._id, {
        $set: {
          'serviceInfo.usesService': false,
          'serviceInfo.routeName': null,
          'serviceInfo.stopName': null,
          'serviceInfo.routeId': null,
          'serviceInfo.stopOrder': null,
          servisGuzergahi: null,
          durak: null,
          updatedAt: new Date()
        }
      });
    }
  }

  return { notFound, removed };
}

async function main() {
  try {
    console.log('🚀 Dispanser güncelleme başlıyor...');
    if (!fs.existsSync(CSV_PATH)) {
      console.error('❌ CSV bulunamadı:', CSV_PATH);
      process.exit(1);
    }
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı kuruldu');

    const rows = readCsv(CSV_PATH);
    const data = extractFromCsv(rows);
    console.log(`📋 CSV: ${data.routeOriginal}, Saat: ${data.departure}, Durak: ${data.stops.length}, Yolcu: ${data.passengers.length}`);

    const route = await upsertRoute(data.stops, data.departure);
    console.log('✅ Route güncellendi:', ROUTE_NAME);

    const { notFound, removed } = await assignEmployees(route, data.passengers, data.stops);

    console.log('✅ Atama tamamlandı');
    console.log('— Çıkarılan (CSV dışı) yolcular:', removed.length);
    removed.forEach(n => console.log('   •', n));
    console.log('— Eşleşmeyen CSV yolcuları:', notFound.length);
    notFound.forEach(n => console.log('   •', n));

    // Özet dosyası
    const report = { route: ROUTE_NAME, removed, notFound, timestamp: new Date().toISOString() };
    const out = path.join(__dirname, '..', 'dispanser_update_report.json');
    fs.writeFileSync(out, JSON.stringify(report, null, 2), 'utf8');
    console.log('📝 Rapor yazıldı:', out);
  } catch (err) {
    console.error('❌ Hata:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB bağlantısı kapatıldı');
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };



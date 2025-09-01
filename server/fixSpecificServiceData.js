const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

// .env'i server klasöründen yükle
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga';

function isOwnCarStop(value = '') {
  const s = (value || '').toString().toUpperCase();
  return /KEND[Iİ]\s*ARACI/.test(s) || /^1\./.test(s);
}

async function normalizeOwnCarStops() {
  const cursor = Employee.find({ durum: 'AKTIF' }).cursor();
  let updated = 0;
  for await (const e of cursor) {
    let changed = false;
    const usesOwnCarRoute = e.servisGuzergahi === 'KENDİ ARACI İLE GELENLER' || e?.serviceInfo?.routeName === 'KENDİ ARACI İLE GELENLER';
    if (usesOwnCarRoute) {
      if (isOwnCarStop(e.durak)) { e.durak = 'KENDİ ARACI'; changed = true; }
      if (isOwnCarStop(e?.serviceInfo?.stopName)) {
        e.serviceInfo = { ...(e.serviceInfo || {}), stopName: 'KENDİ ARACI' };
        changed = true;
      }
    }
    if (changed) { await e.save(); updated++; }
  }
  return updated;
}

async function setSpecificStops() {
  const updates = [];

  // Kemalettin GÜLEŞEN → RASATTEPE KÖPRÜ
  updates.push(Employee.findOneAndUpdate(
    { adSoyad: { $regex: /^KEMALETT[İI]N GÜLE[ŞS]EN$/i }, durum: 'AKTIF' },
    { $set: { durak: 'RASATTEPE KÖPRÜ', 'serviceInfo.stopName': 'RASATTEPE KÖPRÜ' } },
    { new: true }
  ));

  // İbrahim ÜÇER → VALİLİK ÖNÜ
  updates.push(Employee.findOneAndUpdate(
    { adSoyad: { $regex: /^[İI]BRAH[İI]M ÜÇER$/i }, durum: 'AKTIF' },
    { $set: { durak: 'VALİLİK ÖNÜ', 'serviceInfo.stopName': 'VALİLİK ÖNÜ' } },
    { new: true }
  ));

  const [kemRes, iboRes] = await Promise.all(updates);
  return {
    kemalettinUpdated: !!kemRes,
    ibrahimUpdated: !!iboRes
  };
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('🔌 MongoDB bağlı');
  const ownCarFixed = await normalizeOwnCarStops();
  const special = await setSpecificStops();
  console.log(`✅ KENDİ ARACI stop normalize: ${ownCarFixed}`);
  console.log(`✅ Kemalettin set: ${special.kemalettinUpdated}, İbrahim set: ${special.ibrahimUpdated}`);
  await mongoose.disconnect();
  console.log('🔌 MongoDB kapandı');
}

if (require.main === module) {
  main().catch(err => { console.error('❌ Hata:', err); mongoose.disconnect(); });
}



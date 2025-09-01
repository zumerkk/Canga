const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const tidy = (s='') => (s||'').toString().replace(/\s+/g,' ').trim();
const toUpperTr = (s='') => tidy(s).replace(/i̇/g,'i').replace(/İ/g,'I').replace(/ı/g,'I').toUpperCase();
const normalizeName = (s='') => toUpperTr(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  const employees = await Employee.find({});

  const groups = new Map();
  for (const e of employees) {
    const key = normalizeName(e.adSoyad);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }

  let removed = 0; let merged = 0;
  for (const [key, list] of groups.entries()) {
    if (list.length <= 1) continue;

    // Master seçimi: tcNo varsa öncelik, sonra earliest createdAt
    let master = list.find(x => !!x.tcNo);
    if (!master) master = list.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt))[0];

    for (const d of list) {
      if (d._id.equals(master._id)) continue;
      // Eksik alanları master'a taşı
      const update = {};
      if ((!master.servisGuzergahi || !master.durak) && (d.servisGuzergahi || d.durak)) {
        update.servisGuzergahi = master.servisGuzergahi || d.servisGuzergahi || undefined;
        update.durak = master.durak || d.durak || undefined;
      }
      if ((!master.serviceInfo || !master.serviceInfo.stopName) && d.serviceInfo) {
        update.serviceInfo = d.serviceInfo;
      }
      if (!master.lokasyon && d.lokasyon) update.lokasyon = d.lokasyon;
      if (!master.pozisyon && d.pozisyon) update.pozisyon = d.pozisyon;
      if (Object.keys(update).length) {
        await Employee.updateOne({ _id: master._id }, { $set: update });
        merged++;
      }
      await d.deleteOne();
      removed++;
    }
  }

  await mongoose.disconnect();
  console.log(JSON.stringify({ removed, merged }, null, 2));
}

if (require.main === module) {
  main().catch(err => { console.error(err); mongoose.disconnect(); });
}



const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  const emps = await Employee.find({ durum: 'AKTIF' }).sort({ adSoyad: 1 });
  const header = ['Çalışan ID','Ad Soyad','TC No','Cep Telefonu','Doğum Tarihi','Departman','Pozisyon','Lokasyon','İşe Giriş Tarihi','Durum','Servis Güzergahı','Durak'];
  const rows = [header.join(';')];
  for (const e of emps) {
    rows.push([
      e.employeeId || '',
      e.adSoyad || '',
      e.tcNo || '',
      e.cepTelefonu || '',
      e.dogumTarihi ? new Date(e.dogumTarihi).toLocaleDateString('tr-TR') : '',
      e.departman || '',
      e.pozisyon || '',
      e.lokasyon || '',
      e.iseGirisTarihi ? new Date(e.iseGirisTarihi).toLocaleDateString('tr-TR') : '',
      e.durum || '',
      e.servisGuzergahi || e.serviceInfo?.routeName || '',
      e.durak || e.serviceInfo?.stopName || ''
    ].join(';'));
  }
  const out = path.resolve(__dirname, '../Canga_Calisanlar_CLEAN.csv');
  fs.writeFileSync(out, rows.join('\n'), 'utf8');
  console.log('📤 Export ->', out, '| Count:', emps.length);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(err => { console.error(err); mongoose.disconnect(); });
}



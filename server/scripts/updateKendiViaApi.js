#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API = process.env.API_URL || 'http://localhost:5001';
const ADMIN_PASS = process.env.ADMIN_PASS || '28150503';
const ROUTE_NAME = 'KENDİ ARACI İLE GELENLER';
const DEFAULT_STOP = 'KENDİ ARACI PARK ALANI';
const CSV_PATH = path.join(__dirname, '..', '..', 'PERSONEL SERVİS DURAK ÇİZELGESİ 22.09', 'KENDİ-Tablo 1.csv');

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.split(';').map(c => c.trim()));
}

function parseCsv(rows){
  const names = [];
  for (let i=1;i<rows.length;i++){
    const name = rows[i][0] || rows[i][1];
    if (name && !/KENDİ ARACI İLE GELENLER/i.test(name)) names.push(name);
  }
  return names;
}

function normalize(s){ return (s||'').replace(/\s+/g,' ').trim().toUpperCase(); }

async function findEmployeeByName(name) {
  const res = await fetch(`${API}/api/employees?search=${encodeURIComponent(name)}&limit=10`, { headers: { adminpassword: ADMIN_PASS } });
  const json = await res.json();
  if (!json.success) return null;
  const targetNorm = normalize(name);
  return (json.data||[]).find(e => normalize(e.adSoyad) === targetNorm) || (json.data||[])[0] || null;
}

async function updateEmployeeService(employeeId) {
  const res = await fetch(`${API}/api/services/${employeeId}/service`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', adminpassword: ADMIN_PASS },
    body: JSON.stringify({ routeName: ROUTE_NAME, stopName: DEFAULT_STOP, usesService: true })
  });
  const json = await res.json();
  return json.success;
}

async function main(){
  console.log('🚀 KENDİ ARACI API updater starting...');
  const rows = readCsv(CSV_PATH);
  const names = parseCsv(rows);
  const notFound = [];
  const updatedNames = [];
  let updated = 0;

  for (const name of names){
    const emp = await findEmployeeByName(name);
    if (!emp) { notFound.push(name); continue; }
    const ok = await updateEmployeeService(emp._id);
    if (ok) { updated++; updatedNames.push(name); } else notFound.push(name);
  }

  console.log(`✅ Updated: ${updated}/${names.length}`);
  console.log(`❗ Not found: ${notFound.length}`);
  notFound.forEach(n => console.log('   •', n));

  const report = { route: ROUTE_NAME, stop: DEFAULT_STOP, updated, total: names.length, updatedNames, notFound };
  fs.writeFileSync(path.join(__dirname, '..', 'kendi_update_report.json'), JSON.stringify(report, null, 2));
}

if (require.main === module){ main().catch(e=>{console.error('❌ Error:', e); process.exit(1);}); }

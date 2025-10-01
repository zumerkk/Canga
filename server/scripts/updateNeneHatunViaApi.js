#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API = process.env.API_URL || 'http://localhost:5001';
const ADMIN_PASS = process.env.ADMIN_PASS || '28150503';
const ROUTE_NAME = 'NENE HATUN CADDESİ SERVİS GÜZERGAHI';
const CSV_PATH = path.join(__dirname, '..', '..', 'PERSONEL SERVİS DURAK ÇİZELGESİ 22.09', 'NENE HATUN CAD.-Tablo 1.csv');

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.split(';').map(c => c.trim()));
}

function parseCsv(rows) {
  const passengers = [];
  let inPassengers = false;
  for (const row of rows) {
    const first = row[0] || '';
    if (/^SIRA NO/i.test(first)) { inPassengers = true; continue; }
    if (!inPassengers) continue;
    const sira = row[0];
    const name = row[1];
    const stop = row[2];
    if (/^\d+$/.test((sira||'').trim()) && name) passengers.push({ name, stop });
  }
  return passengers;
}

function normalize(s){ return (s||'').replace(/\s+/g,' ').trim().toUpperCase(); }

async function findEmployeeByName(name) {
  const res = await fetch(`${API}/api/employees?search=${encodeURIComponent(name)}&limit=10`, { headers: { adminpassword: ADMIN_PASS } });
  const json = await res.json();
  if (!json.success) return null;
  const targetNorm = normalize(name);
  return (json.data||[]).find(e => normalize(e.adSoyad) === targetNorm) || (json.data||[])[0] || null;
}

async function updateEmployeeService(employeeId, stopName) {
  const res = await fetch(`${API}/api/services/${employeeId}/service`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', adminpassword: ADMIN_PASS },
    body: JSON.stringify({ routeName: ROUTE_NAME, stopName, usesService: true })
  });
  const json = await res.json();
  return json.success;
}

async function main(){
  console.log('🚀 NENE HATUN API updater starting...');
  const rows = readCsv(CSV_PATH);
  const passengers = parseCsv(rows);
  const notFound = [];
  const updatedNames = [];
  let updated = 0;

  for (const p of passengers) {
    const emp = await findEmployeeByName(p.name);
    if (!emp) { notFound.push(p.name); continue; }
    const ok = await updateEmployeeService(emp._id, p.stop || 'FABRİKA');
    if (ok) { updated++; updatedNames.push(p.name); } else notFound.push(p.name);
  }

  console.log(`✅ Updated: ${updated}/${passengers.length}`);
  console.log(`❗ Not found: ${notFound.length}`);
  notFound.forEach(n => console.log('   •', n));

  const report = { route: ROUTE_NAME, updated, total: passengers.length, updatedNames, notFound };
  fs.writeFileSync(path.join(__dirname, '..', 'nenehatun_update_report.json'), JSON.stringify(report, null, 2));
}

if (require.main === module) { main().catch(e=>{console.error('❌ Error:', e); process.exit(1);}); }



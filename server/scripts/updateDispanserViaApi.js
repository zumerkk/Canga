#!/usr/bin/env node

// Update Dispanser passengers using the HTTP API to guarantee UI sync

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API = process.env.API_URL || 'http://localhost:5001';
const ADMIN_PASS = process.env.ADMIN_PASS || '28150503';
const ROUTE_NAME = '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI';
const CSV_PATH = path.join(__dirname, '..', '..', 'PERSONEL SERVİS DURAK ÇİZELGESİ 22.09', 'DİSPANSER-Tablo 1.csv');

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
    if (/^\d+$/.test((sira||'').trim()) && name) {
      passengers.push({ name, stop });
    }
  }
  return passengers;
}

function normalize(s){ return (s||'').replace(/\s+/g,' ').trim().toUpperCase(); }

async function findEmployeeByName(name) {
  const url = `${API}/api/employees?search=${encodeURIComponent(name)}&limit=10`;
  const res = await fetch(url, { headers: { adminpassword: ADMIN_PASS } });
  const json = await res.json();
  if (!json.success) return null;
  const targetNorm = normalize(name);
  const match = (json.data||[]).find(e => normalize(e.adSoyad) === targetNorm);
  return match || null;
}

async function updateEmployeeService(employeeId, stopName) {
  const url = `${API}/api/services/${employeeId}/service`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      adminpassword: ADMIN_PASS
    },
    body: JSON.stringify({ routeName: ROUTE_NAME, stopName, usesService: true })
  });
  const json = await res.json();
  return json.success;
}

async function main(){
  console.log('🚀 Dispanser API updater starting...');
  const rows = readCsv(CSV_PATH);
  const passengers = parseCsv(rows);
  const notFound = [];
  let updated = 0;

  for (const p of passengers) {
    const emp = await findEmployeeByName(p.name);
    if (!emp) { notFound.push(p.name); continue; }
    const ok = await updateEmployeeService(emp._id, p.stop || 'FABRİKA');
    if (ok) updated++;
    else notFound.push(p.name);
  }

  console.log(`✅ Updated: ${updated}/${passengers.length}`);
  console.log(`❗ Not found: ${notFound.length}`);
  notFound.forEach(n => console.log('   •', n));
}

if (require.main === module) {
  main().catch(err => { console.error('❌ Error:', err); process.exit(1); });
}



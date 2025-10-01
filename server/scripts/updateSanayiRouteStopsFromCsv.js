#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API = process.env.API_URL || 'http://localhost:5001';
const ADMIN_PASS = process.env.ADMIN_PASS || '28150503';
const ROUTE_NAME = 'ETİLER KARACALİ CADDESİ SERVİS GÜZERGAHI';
const CSV_PATH = path.join(__dirname, '..', '..', 'PERSONEL SERVİS DURAK ÇİZELGESİ 22.09', 'SANAYİ-Tablo 1.csv');

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.split(';').map(c => c.trim()));
}

function parseStops(rows){
  const stops = [];
  let inPassengers = false;
  for (const row of rows){
    const first = row[0] || '';
    if (/^SIRA NO/i.test(first)){ inPassengers = true; continue; }
    if (!inPassengers){
      if (first && !/SERVİS GÜZERGAHI/i.test(first) && !/HAREKET SAATİ/i.test(first) && !/ETİLER KARACALİ CAD/i.test(first)){
        stops.push(first);
      }
    }
  }
  return stops;
}

async function getRoute(){
  const res = await fetch(`${API}/api/services/routes`, { headers: { adminpassword: ADMIN_PASS } });
  const j = await res.json();
  if (!j.success) throw new Error('routes fetch failed');
  return (j.data||[]).find(r => r.routeName === ROUTE_NAME) || null;
}

async function updateRoute(routeId, stops){
  const payload = { stops: stops.map((name, i) => ({ name, order: i+1 })) };
  const res = await fetch(`${API}/api/services/routes/${routeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', adminpassword: ADMIN_PASS },
    body: JSON.stringify(payload)
  });
  const j = await res.json();
  return j.success;
}

async function main(){
  console.log('🚀 SANAYİ route stop updater starting...');
  const rows = readCsv(CSV_PATH);
  const stops = parseStops(rows);
  const route = await getRoute();
  if (!route) throw new Error('Route not found');
  const ok = await updateRoute(route._id, stops);
  console.log('✅ Route stops updated:', ok, 'count:', stops.length);
}

if (require.main === module){ main().catch(e=>{console.error('❌ Error:', e); process.exit(1);}); }

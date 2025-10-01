#!/usr/bin/env node

// Force-update Dispanser passenger stop names to match CSV exactly

const fetch = require('node-fetch');

const API = process.env.API_URL || 'http://localhost:5001';
const ADMIN_PASS = process.env.ADMIN_PASS || '28150503';
const ROUTE_NAME = '50.YIL BLOKLARI - DİSPANSER SERVİS GÜZERGAHI';

const mapping = [
  ['Ali GÜRBÜZ', 'ŞADIRVAN (PERŞEMBE PAZARI)'],
  ['Ali SAVAŞ', 'KALE OKULU'],
  ['Ali SAVAŞ - TORUN', 'KALE OKULU'],
  ['Arif ÖZEL (ÇIRAK)', 'DİSPANSER ÜST GEÇİT'],
  ['Berat AKTAŞ', 'PLEVNE CAD.'],
  ['Celal GÜLŞEN', 'DİSPANSER ÜST GEÇİT'],
  ['Cevdet ÖKSÜZ', 'PLEVNE CAD.'],
  ['Efe Talha ERDAL', 'NACİYE PEHLİVANLI'],
  ['Elvan Taha Türe (ÇIRAK)', 'PLEVNE CAD.'],
  ['Erdal YAKUT', 'GÜL PASTANESİ'],
  ['Eyüp TORUN', '50.YIL BLOKLARI'],
  ['Kemalettin GÜLEŞEN', 'ŞADIRVAN (PERŞEMBE PAZARI)'],
  ['Muhammed Nazim GÖÇ', 'AYBİMAŞ'],
  ['Murat ÇAVDAR', 'ŞADIRVAN (PERŞEMBE PAZARI)'],
  ['Mehmet KARACA', 'DİSPANSER ÜST GEÇİT'],
  ['Mustafa BIYIK', 'OPET BENZİNLİK'],
  ['Özkan AYDIN', 'AYBİMAŞ'],
  ['İbrahim VARLIOĞLU', 'KALE OKULU'],
  ['Halil İbrahim GÜRBÜZ (ÇIRAK)', 'ŞADIRVAN (PERŞEMBE PAZARI)']
];

function norm(s){return (s||'').replace(/\s+/g,' ').trim().toUpperCase();}

async function findEmployee(name){
  const res = await fetch(`${API}/api/employees?search=${encodeURIComponent(name)}&limit=10`, {
    headers: { adminpassword: ADMIN_PASS }
  });
  const j = await res.json();
  if (!j.success) return null;
  const target = norm(name);
  return (j.data||[]).find(e => norm(e.adSoyad) === target) || (j.data||[])[0] || null;
}

async function updateService(id, stop){
  const res = await fetch(`${API}/api/services/${id}/service`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', adminpassword: ADMIN_PASS },
    body: JSON.stringify({ routeName: ROUTE_NAME, stopName: stop, usesService: true })
  });
  const j = await res.json();
  return j.success;
}

async function main(){
  let ok=0, miss=[];
  for (const [name, stop] of mapping){
    const emp = await findEmployee(name);
    if (!emp){ miss.push(name); continue; }
    const success = await updateService(emp._id, stop);
    if (success) ok++; else miss.push(name);
  }
  console.log('Updated:', ok, 'Missing:', miss.length);
  if (miss.length) console.log('Missing list =>', miss.join(', '));
}

if (require.main === module){
  main().catch(e=>{console.error(e);process.exit(1);});
}



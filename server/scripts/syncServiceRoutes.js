/**
 * 🚌 Servis Güzergahları ve Çalışan Senkronizasyonu
 * CSV dosyalarından MongoDB'ye güzergahları ve yolcu atamalarını senkronize eder
 * 
 * CSV Dosyaları:
 * - ÇALILIÖZ-Tablo 1.csv (20 personel)
 * - DİSPANSER-Tablo 1.csv (24 personel)
 * - KARŞIYAKA-Tablo 1.csv (20 personel)
 * - NENE HATUN CAD.-Tablo 1.csv (17 personel)
 * - OSM ÇARŞI MRK-Tablo 1.csv (20 personel)
 * - SANAYİ-Tablo 1.csv (25 personel)
 * - Sayfa4-Tablo 1.csv (13 kişi - kendi aracı ile gelenler)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Mongoose modelleri
const ServiceRoute = require('../models/ServiceRoute');
const Employee = require('../models/Employee');

// CSV dizini
const CSV_DIR = path.join(__dirname, '../../PERSONEL SERVİS DURAK ÇİZELGESİ 22.09');

// Güzergah renkleri
const ROUTE_COLORS = {
  'ÇALILIÖZ': '#F44336',      // Kırmızı
  'DİSPANSER': '#2196F3',     // Mavi
  'KARŞIYAKA': '#4CAF50',     // Yeşil
  'NENE HATUN': '#FF9800',    // Turuncu
  'OSMANGAZİ': '#9C27B0',     // Mor
  'SANAYİ': '#00BCD4',        // Cyan
  'KENDİ ARACI': '#607D8B'    // Gri
};

// CSV dosyası okuma
function readCSV(filename) {
  const filepath = path.join(CSV_DIR, filename);
  console.log(`📖 Okunan dosya: ${filepath}`);
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Dosya bulunamadı: ${filepath}`);
    return [];
  }
  
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');
  return lines;
}

// Güzergah durakları çıkarma (satır 1-12 arası genelde)
function extractStops(lines, startLine = 4) {
  const stops = [];
  for (let i = startLine - 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(';');
    const firstPart = parts[0]?.trim();
    
    // "SIRA NO" veya sayıyla başlayan satır personel listesinin başlangıcı
    if (firstPart === 'SIRA NO' || /^\d+$/.test(firstPart)) {
      break;
    }
    
    // Boş satır veya başlık satırını atla
    if (!firstPart || firstPart.includes('MAHALLESİ') || firstPart.includes('GÜZERGAHI') || 
        firstPart.includes('HAREKET SAATİ') || firstPart.includes('SERVİS')) {
      continue;
    }
    
    stops.push({
      name: firstPart,
      order: stops.length + 1
    });
  }
  return stops;
}

// Personel listesi çıkarma
function extractPersonnel(lines) {
  const personnel = [];
  let inPersonnelSection = false;
  
  for (const line of lines) {
    const parts = line.split(';');
    const firstPart = parts[0]?.trim();
    
    // "SIRA NO" başlık satırı - personel listesi başlıyor
    if (firstPart === 'SIRA NO') {
      inPersonnelSection = true;
      continue;
    }
    
    // Personel satırı (sıra numarası ile başlar)
    if (inPersonnelSection && /^\d+$/.test(firstPart)) {
      const siraNo = parseInt(firstPart);
      const adSoyad = parts[1]?.trim();
      const guzergah = parts[2]?.trim();
      const telefon = parts[3]?.trim();
      
      if (adSoyad) {
        personnel.push({
          siraNo,
          adSoyad: normalizeAdSoyad(adSoyad),
          durak: guzergah || '',
          telefon: telefon || ''
        });
      }
    }
  }
  
  return personnel;
}

// Ad soyad normalize etme
function normalizeAdSoyad(name) {
  if (!name) return '';
  
  // Fazla boşlukları temizle
  let normalized = name.trim().replace(/\s+/g, ' ');
  
  // Parantez içindeki bilgileri temizle (ÇIRAK, STAJYER vb.)
  normalized = normalized.replace(/\s*\([^)]*\)\s*/g, '').trim();
  
  // " - " ile ayrılmış ekleri temizle (örn: ALİ SAVAŞ - TORUN)
  normalized = normalized.replace(/\s*-\s*[A-ZÜÖÇŞİĞa-züöçşığ]+$/g, '').trim();
  
  return normalized.toUpperCase();
}

// Türkçe karakterleri normalize et (arama için)
function normalizeForSearch(name) {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/ı/g, 'I')
    .replace(/ğ/g, 'G')
    .replace(/ü/g, 'U')
    .replace(/ş/g, 'S')
    .replace(/ö/g, 'O')
    .replace(/ç/g, 'C')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kendi aracı ile gelenleri çıkarma
function extractOwnCarUsers(lines) {
  const users = [];
  
  for (const line of lines) {
    const parts = line.split(';');
    const adSoyad = parts[0]?.trim();
    
    if (adSoyad && !adSoyad.includes(';;;;')) {
      users.push(normalizeAdSoyad(adSoyad));
    }
  }
  
  return users;
}

// MongoDB'ye bağlan
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  console.log('🔌 MongoDB\'ye bağlanılıyor...');
  await mongoose.connect(uri);
  console.log('✅ MongoDB bağlantısı başarılı!');
}

// Ana senkronizasyon fonksiyonu
async function syncAll() {
  try {
    await connectDB();
    
    console.log('\n' + '='.repeat(80));
    console.log('🚌 SERVİS GÜZERGAHLARı VE YOLCU SENKRONİZASYONU');
    console.log('='.repeat(80));
    
    // ============================================
    // ADIM 1: Mevcut güzergahları temizle
    // ============================================
    console.log('\n📋 ADIM 1: Mevcut güzergahlar temizleniyor...');
    const deleteResult = await ServiceRoute.deleteMany({});
    console.log(`   ✅ ${deleteResult.deletedCount} güzergah silindi`);
    
    // ============================================
    // ADIM 2: Güzergahları oluştur
    // ============================================
    console.log('\n📋 ADIM 2: Güzergahlar oluşturuluyor...\n');
    
    const routes = [];
    
    // 1. ÇALILIÖZ
    const caliliozLines = readCSV('ÇALILIÖZ-Tablo 1.csv');
    const caliliozStops = [
      { name: 'ÇOCUK ŞUBE (ESKİ BÖLGE TRAFİK) ALTI NAR MARKET', order: 1 },
      { name: 'TAÇ MAHAL DÜĞÜN SALONU', order: 2 },
      { name: 'SÜMEZE PİDE', order: 3 },
      { name: 'ÇALILIÖZ KÖPRÜ ALTI', order: 4 },
      { name: 'FIRINLI CAMİ', order: 5 },
      { name: 'VALİLİK ARKA GİRİŞ KAPISI ÖNÜ', order: 6 },
      { name: 'ESKİ REKTÖRLÜK', order: 7 },
      { name: 'BAĞDAT KÖPRÜ', order: 8 },
      { name: 'FABRİKA', order: 9 }
    ];
    const caliliozPersonnel = extractPersonnel(caliliozLines);
    routes.push({
      routeName: 'ÇALILIÖZ MAHALLESİ',
      routeCode: 'CLZ-01',
      color: ROUTE_COLORS['ÇALILIÖZ'],
      stops: caliliozStops,
      schedule: [{ time: '07:25', isActive: true }],
      personnel: caliliozPersonnel
    });
    console.log(`   🚌 ÇALILIÖZ: ${caliliozStops.length} durak, ${caliliozPersonnel.length} yolcu`);
    
    // 2. DİSPANSER
    const dispanserLines = readCSV('DİSPANSER-Tablo 1.csv');
    const dispanserStops = [
      { name: '50.YIL BLOKLARI', order: 1 },
      { name: 'KALE OKULU', order: 2 },
      { name: 'DİSPANSER', order: 3 },
      { name: 'ŞADIRVAN (PERŞEMBE PAZARI)', order: 4 },
      { name: 'MOTOSİKLET TAMİRCİLERİ', order: 5 },
      { name: 'GÜL PASTANESİ', order: 6 },
      { name: 'BELEDİYE OTOBÜS DURAKLARI', order: 7 },
      { name: 'TİCARET ODASI', order: 8 },
      { name: 'PTT', order: 9 },
      { name: 'ESKİ REKTÖRLÜK', order: 10 },
      { name: 'BAĞDAT KÖPRÜ', order: 11 },
      { name: 'FABRİKA', order: 12 }
    ];
    const dispanserPersonnel = extractPersonnel(dispanserLines);
    routes.push({
      routeName: '50.YIL BLOKLARI-DİSPANSER',
      routeCode: 'DSP-01',
      color: ROUTE_COLORS['DİSPANSER'],
      stops: dispanserStops,
      schedule: [{ time: '07:15', isActive: true }],
      personnel: dispanserPersonnel
    });
    console.log(`   🚌 DİSPANSER: ${dispanserStops.length} durak, ${dispanserPersonnel.length} yolcu`);
    
    // 3. KARŞIYAKA
    const karsiyakaLines = readCSV('KARŞIYAKA-Tablo 1.csv');
    const karsiyakaStops = [
      { name: 'BAHÇELİEVLER ESKİ TERMİNAL GİRİŞİ', order: 1 },
      { name: 'AYBİMAŞ', order: 2 },
      { name: 'BAHÇELİEVLER SAĞLIK OCAĞI', order: 3 },
      { name: 'ORTAKLAR MARKET', order: 4 },
      { name: 'YUVA TOKİ', order: 5 },
      { name: 'ÇULU YOLU', order: 6 },
      { name: 'SALI PAZARI (KARŞIYAKA)', order: 7 },
      { name: 'LAÇİN BLOKLARI', order: 8 },
      { name: 'KAHVELER (KARŞIYAKA)', order: 9 },
      { name: 'AHILLI BİLET GİŞESİ', order: 10 },
      { name: 'ŞEMA KOLEJİ', order: 11 },
      { name: 'FABRİKA', order: 12 }
    ];
    const karsiyakaPersonnel = extractPersonnel(karsiyakaLines);
    routes.push({
      routeName: 'BAHÇELİEVLER-KARŞIYAKA',
      routeCode: 'KRS-01',
      color: ROUTE_COLORS['KARŞIYAKA'],
      stops: karsiyakaStops,
      schedule: [{ time: '07:20', isActive: true }],
      personnel: karsiyakaPersonnel
    });
    console.log(`   🚌 KARŞIYAKA: ${karsiyakaStops.length} durak, ${karsiyakaPersonnel.length} yolcu`);
    
    // 4. NENE HATUN CAD.
    const nenehatunLines = readCSV('NENE HATUN CAD.-Tablo 1.csv');
    const nenehatunStops = [
      { name: 'SAAT KULESİ-TAKSİ DURAĞI', order: 1 },
      { name: 'NENE HATUN CAD.', order: 2 },
      { name: 'İSTANBUL EKMEK FIRINI', order: 3 },
      { name: 'PLEVNE MAH.', order: 4 },
      { name: 'ESKİ REKTÖRLÜK', order: 5 },
      { name: 'BAĞDAT KÖPRÜ', order: 6 },
      { name: 'FABRİKA', order: 7 }
    ];
    const nenehatunPersonnel = extractPersonnel(nenehatunLines);
    routes.push({
      routeName: 'NENE HATUN CADDESİ',
      routeCode: 'NHC-01',
      color: ROUTE_COLORS['NENE HATUN'],
      stops: nenehatunStops,
      schedule: [{ time: '07:25', isActive: true }],
      personnel: nenehatunPersonnel
    });
    console.log(`   🚌 NENE HATUN: ${nenehatunStops.length} durak, ${nenehatunPersonnel.length} yolcu`);
    
    // 5. OSMANGAZİ-ÇARŞI MERKEZ
    const osmgaziLines = readCSV('OSM ÇARŞI MRK-Tablo 1.csv');
    const osmgaziStops = [
      { name: 'MERSAN', order: 1 },
      { name: 'ERGENEKON SİTESİ', order: 2 },
      { name: 'TRAFİK EĞİTİM YOLU', order: 3 },
      { name: 'HALI SAHA', order: 4 },
      { name: 'TOPRAK YEMEK', order: 5 },
      { name: 'BAŞPINAR İTFAİYE KARŞISI', order: 6 },
      { name: 'S-OİL BENZİNLİK', order: 7 },
      { name: 'AYTEMİZ BENZİNLİK', order: 8 },
      { name: 'SANAYİ DEMİRCİLER', order: 9 },
      { name: 'İŞKUR', order: 10 },
      { name: 'ES BENZİNLİK (KIRGAZ)', order: 11 },
      { name: 'BELEDİYE TERMİNAL', order: 12 },
      { name: 'PTT', order: 13 },
      { name: 'İSTASYON', order: 14 },
      { name: 'ESKİ REKTÖRLÜK', order: 15 },
      { name: 'BAĞDAT KÖPRÜ', order: 16 },
      { name: 'FABRİKA', order: 17 }
    ];
    const osmgaziPersonnel = extractPersonnel(osmgaziLines);
    routes.push({
      routeName: 'OSMANGAZİ-ÇARŞI MERKEZ',
      routeCode: 'OSM-01',
      color: ROUTE_COLORS['OSMANGAZİ'],
      stops: osmgaziStops,
      schedule: [{ time: '07:15', isActive: true }],
      personnel: osmgaziPersonnel
    });
    console.log(`   🚌 OSMANGAZİ: ${osmgaziStops.length} durak, ${osmgaziPersonnel.length} yolcu`);
    
    // 6. SANAYİ (ETİLER KARACALİ CADDESİ)
    const sanayiLines = readCSV('SANAYİ-Tablo 1.csv');
    const sanayiStops = [
      { name: 'PAZARTESİ PAZARI', order: 1 },
      { name: 'ETİLER MAHALLESİ', order: 2 },
      { name: 'ÇORBACI ALİ DAYI', order: 3 },
      { name: 'NOKTA A101', order: 4 },
      { name: 'ÇALILIÖZ KÖPRÜ ÜSTÜ', order: 5 },
      { name: 'ÇOCUK ŞUBE (ESKİ BÖLGE TRAFİK) KARŞISI', order: 6 },
      { name: 'ESKİ HİLAL HASTANESİ ÖNÜ', order: 7 },
      { name: 'PODİUM AVM KAVŞAK', order: 8 },
      { name: 'MEZARLIKLAR', order: 9 },
      { name: 'BAĞDAT KÖPRÜ', order: 10 },
      { name: 'FABRİKA', order: 11 }
    ];
    const sanayiPersonnel = extractPersonnel(sanayiLines);
    routes.push({
      routeName: 'ETİLER-SANAYİ',
      routeCode: 'SNY-01',
      color: ROUTE_COLORS['SANAYİ'],
      stops: sanayiStops,
      schedule: [{ time: '07:20', isActive: true }],
      personnel: sanayiPersonnel
    });
    console.log(`   🚌 SANAYİ: ${sanayiStops.length} durak, ${sanayiPersonnel.length} yolcu`);
    
    // 7. KENDİ ARACI İLE GELENLER (Sayfa4)
    const kendiAraciLines = readCSV('Sayfa4-Tablo 1.csv');
    const kendiAraciUsers = extractOwnCarUsers(kendiAraciLines);
    routes.push({
      routeName: 'KENDİ ARACI İLE GELENLER',
      routeCode: 'OWN-01',
      color: ROUTE_COLORS['KENDİ ARACI'],
      stops: [{ name: 'KENDİ ARACI', order: 1 }],
      schedule: [],
      personnel: kendiAraciUsers.map((name, i) => ({ siraNo: i + 1, adSoyad: name, durak: 'KENDİ ARACI', telefon: '' }))
    });
    console.log(`   🚗 KENDİ ARACI: ${kendiAraciUsers.length} kişi`);
    
    // Güzergahları MongoDB'ye kaydet
    console.log('\n📋 ADIM 3: Güzergahlar MongoDB\'ye kaydediliyor...\n');
    
    for (const route of routes) {
      const newRoute = new ServiceRoute({
        routeName: route.routeName,
        routeCode: route.routeCode,
        color: route.color,
        stops: route.stops,
        schedule: route.schedule,
        status: 'AKTIF',
        statistics: {
          totalEmployees: route.personnel.length,
          activeEmployees: route.personnel.length
        },
        notes: `CSV'den import edildi - ${new Date().toLocaleDateString('tr-TR')}`,
        createdBy: 'System - CSV Import'
      });
      
      await newRoute.save();
      console.log(`   ✅ ${route.routeName} kaydedildi (${route.personnel.length} yolcu)`);
    }
    
    // ============================================
    // ADIM 4: Çalışanları güzergahlara ata
    // ============================================
    console.log('\n📋 ADIM 4: Çalışanlar güzergahlara atanıyor...\n');
    
    let totalAssigned = 0;
    let notFound = [];
    
    for (const route of routes) {
      const isOwnCar = route.routeName === 'KENDİ ARACI İLE GELENLER';
      
      for (const person of route.personnel) {
        // Çalışanı bul - Türkçe karakter normalize ederek
        const searchName = person.adSoyad;
        const normalizedSearch = normalizeForSearch(searchName);
        
        // Önce direkt arama
        let employee = await Employee.findOne({
          adSoyad: { $regex: new RegExp(`^${searchName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          durum: 'AKTIF'
        });
        
        // Bulunamazsa tüm çalışanlardan normalize karşılaştırma yap
        if (!employee) {
          const allActiveEmployees = await Employee.find({ durum: 'AKTIF' }).lean();
          for (const emp of allActiveEmployees) {
            const normalizedDb = normalizeForSearch(emp.adSoyad);
            if (normalizedDb === normalizedSearch || 
                normalizedDb.includes(normalizedSearch) || 
                normalizedSearch.includes(normalizedDb)) {
              employee = emp;
              break;
            }
          }
        }
        
        if (employee) {
          // Güncelle
          const updateData = {
            servisGuzergahi: route.routeName,
            durak: person.durak || route.stops[0]?.name || '',
            kendiAraci: isOwnCar,
            'serviceInfo.usesService': !isOwnCar,
            'serviceInfo.routeName': route.routeName,
            'serviceInfo.stopName': person.durak || route.stops[0]?.name || '',
            'serviceInfo.usesOwnCar': isOwnCar
          };
          
          await Employee.findByIdAndUpdate(employee._id, updateData);
          totalAssigned++;
          console.log(`   ✅ ${person.adSoyad} → ${route.routeName} (${person.durak || 'Durak yok'})`);
        } else {
          notFound.push({ name: person.adSoyad, route: route.routeName });
          console.log(`   ❌ ${person.adSoyad} - Çalışan bulunamadı`);
        }
      }
    }
    
    // ============================================
    // ÖZET
    // ============================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 SENKRONİZASYON ÖZETİ');
    console.log('='.repeat(80));
    console.log(`✅ Toplam güzergah: ${routes.length}`);
    console.log(`✅ Toplam durak: ${routes.reduce((sum, r) => sum + r.stops.length, 0)}`);
    console.log(`✅ Atanan çalışan: ${totalAssigned}`);
    console.log(`❌ Bulunamayan: ${notFound.length}`);
    
    if (notFound.length > 0) {
      console.log('\n📋 BULUNAMAYAN ÇALIŞANLAR:');
      notFound.forEach(nf => {
        console.log(`   - ${nf.name} (${nf.route})`);
      });
    }
    
    // Doğrulama
    console.log('\n📋 DOĞRULAMA:');
    const totalRoutes = await ServiceRoute.countDocuments();
    const serviceUsers = await Employee.countDocuments({ 
      servisGuzergahi: { $exists: true, $ne: null, $ne: '' },
      durum: 'AKTIF'
    });
    const ownCarUsers = await Employee.countDocuments({ 
      kendiAraci: true,
      durum: 'AKTIF'
    });
    
    console.log(`   📊 DB'deki güzergah sayısı: ${totalRoutes}`);
    console.log(`   👥 Servis kullanan çalışan: ${serviceUsers}`);
    console.log(`   🚗 Kendi aracı ile gelen: ${ownCarUsers}`);
    
    console.log('\n✅ Senkronizasyon tamamlandı!');
    
  } catch (error) {
    console.error('❌ Senkronizasyon hatası:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı.');
  }
}

// Script'i çalıştır
syncAll();


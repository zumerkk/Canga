const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Employee = require('./models/Employee');
const ServiceRoute = require('./models/ServiceRoute');

// .env dosyasını yükle
dotenv.config();

// Manuel olarak CSV verilerini işleyelim
const employeeData = [
  // Dispanser Güzergahı
  { name: 'ALİ GÜRBÜZ', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'ŞADIRVAN (PERŞEMBE PAZARI)' },
  { name: 'ALİ SAVAŞ', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  { name: 'BERAT ÖZDEN', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'SAAT KULESİ' },
  { name: 'CEVDET ÖKSÜZ', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  { name: 'ERDAL YAKUT', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'GÜL PASTANESİ' },
  { name: 'EYÜP TORUN', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  { name: 'İBRAHİM VARLIOĞLU', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  { name: 'MUHAMMED SEFA PEHLİVANLI', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'MURAT ÇAVDAR', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'ŞADIRVAN (PERŞEMBE PAZARI)' },
  { name: 'MUSTAFA BIYIK', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  { name: 'ÖZKAN AYDIN', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  { name: 'CELAL GÜLŞEN', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  { name: 'MUHAMMED NAZİM GÖÇ', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  { name: 'TUNCAY TEKİN', route: 'DİSPANSER SERVİS GÜZERGAHI', stop: 'DİSPANSER ÜST GEÇİT' },
  
  // Sanayi Güzergahı
  { name: 'ALİ ŞIH YORULMAZ', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ÇORBACI ALİ DAYI' },
  { name: 'AHMET DURAN TUNA', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'NOKTA A-101/DOĞTAŞ' },
  { name: 'HAYATİ SÖZDİNLER', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ÇORBACI ALİ DAYI' },
  { name: 'HAYDAR ACAR', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'RASATTEPE KÖPRÜ' },
  { name: 'GÜLNUR AĞIRMAN', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ÇORBACI ALİ DAYI' },
  { name: 'İSMET BAŞER', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'KEMALETTİN GÜLEŞEN', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'BAHÇELİEVLER' },
  { name: 'MACİT USLU', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ÇORBACI ALİ DAYI' },
  { name: 'MUSTAFA SÜMER', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'RASATTEPE KÖPRÜ' },
  { name: 'NİYAZİ YURTSEVEN', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'NOKTA A-101' },
  { name: 'BERAT AKTAŞ', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'NOKTA A-101' },
  { name: 'NURİ ÖZKAN', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ÇORBACI ALİ DAYI' },
  { name: 'MUSTAFA BAŞKAYA', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ÇORBACI ALİ DAYI' },
  { name: 'MUZAFFER KIZILÇİÇEK', route: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI', stop: 'MEZARLIK PEYZAJ ÖNÜ' },
  
  // Osmangazi-Karşıyaka Mahallesi Güzergahı
  { name: 'ASIM DEMET', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'SALI PAZARI' },
  { name: 'İLYAS CURTAY', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'POLAT ERCAN', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'EMRE DEMİRCİ', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'KEL MUSTAFA DURAĞI' },
  { name: 'MUSTAFA SAMURKOLLU', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'SAAT KULESİ' },
  { name: 'SEFA ÖZTÜRK', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'BAHÇELİEVLER' },
  { name: 'SALİH GÖZÜAK', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'SELİM ALSAÇ', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'BAHÇELİEVLER GÜLENLER MARKET' },
  { name: 'ÜMİT SAZAK', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'ÜMİT TORUN', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'KEMAL KARACA', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'BAHÇELİEVLER' },
  { name: 'YAŞAR ÇETİN', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'BAHÇELİEVLER SAĞLIK OCAĞI' },
  { name: 'MUSTAFA DOĞAN', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'YUVA TOKİ' },
  { name: 'CİHAN ÇELEBİ', route: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ', stop: 'ÇULLU YOLU BİM MARKET' },
  
  // Çalılıöz Güzergahı
  { name: 'AHMET ÇANGA', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'FIRINLI CAMİ' },
  { name: 'AHMET ŞAHİN', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'SAAT KULESİ' },
  { name: 'ALİ ÇAVUŞ BAŞTUĞ', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'FIRINLI CAMİ' },
  { name: 'ALİ ÖKSÜZ', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'SAAT KULESİ' },
  { name: 'AYNUR AYTEKİN', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ÇALLIÖZ KÖPRÜ (ALT YOL)' },
  { name: 'CELAL BARAN', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ÇALLIÖZ KÖPRÜ (ALT YOL)' },
  { name: 'LEVENT DURMAZ', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'METİN ARSLAN', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'NAR MARKET' },
  { name: 'MUSA DOĞU', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'FIRINLI CAMİ' },
  { name: 'ÖMER FİLİZ', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'SAAT KULESİ' },
  { name: 'SADULLAH AKBAYIR', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'SAAT KULESİ' },
  { name: 'EYÜP ÜNVANLI', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'FIRINLI CAMİ' },
  { name: 'OSMAN ÖZKILIÇ', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'VALİLİK' },
  { name: 'UĞUR ALBAYRAK', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'SAAT KULESİ' },
  { name: 'BERAT SUSAR', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'VALİLİK ARKASI' },
  { name: 'HULUSİ EREN CAN', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'VALİLİK ARKASI' },
  { name: 'İBRAHİM ÜÇER', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'ES BENZİNLİK' },
  { name: 'SONER GÜRSOY', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'VALİLİK ARKASI' },
  { name: 'ABBAS CAN ÖNGER', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'BAĞDAT BENZİNLİK' },
  { name: 'MEHMET ALİ ÖZÇELİK', route: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI', stop: 'SAAT KULESİ' },
  
  // Çarşı Merkez Güzergahı
  { name: 'AHMET ÇELİK', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'S-OİL BENZİNLİK' },
  { name: 'BİRKAN ŞEKER', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'KAHVELER (KARŞIYAKA)' },
  { name: 'HİLMİ SORGUN', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'S-OİL BENZİNLİK' },
  { name: 'EMİR KAAN BAŞER', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'BAŞPINAR' },
  { name: 'MESUT TUNCER', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'HALI SAHA' },
  { name: 'ALPEREN TOZLU', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'HALI SAHA' },
  { name: 'VEYSEL EMRE TOZLU', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'HALI SAHA' },
  { name: 'HAKAN AKPINAR', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'HALI SAHA' },
  { name: 'MUHAMMED ZÜMER KEKİLLİOĞLU', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'HALI SAHA' },
  { name: 'MİNE KARAOĞLU', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'ESKİ REKTÖRLÜK' },
  { name: 'FURKAN KADİR ESEN', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'REKTÖRLÜK' },
  { name: 'YUSUF GÜRBÜZ', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'ES BENZİNLİK' },
  { name: 'MEHMET ERTAŞ', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'ESKİ REKTÖRLÜK' },
  { name: 'HÜDAGÜL DEĞİRMENCİ', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'ESKİ REKTÖRLÜK' },
  { name: 'YASİN SAYGILI', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'ESKİ REKTÖRLÜK/ GÜNDOĞDU OSMANGAZİ' },
  { name: 'ÇAĞRI YILDIZ', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'BAĞDAT KÖPRÜ' },
  { name: 'CEMAL ERAKSOY', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'YENİMAHALLE GO BENZİNLİK' },
  { name: 'AZİZ BUĞRA KARA', route: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI', stop: 'BAĞDAT KÖPRÜ VE ÜZERİ' }
];

async function updateEmployeeServices() {
  try {
    // MongoDB'ye bağlan
    console.log('MongoDB bağlantısı yapılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Tüm güzergahları al
    const routes = await ServiceRoute.find({ status: 'AKTIF' });
    console.log(`📋 ${routes.length} aktif servis güzergahı bulundu`);

    // Güzergah bilgilerini hazırla
    const routeInfo = {};
    for (const route of routes) {
      routeInfo[route.routeName] = {
        _id: route._id,
        stops: route.stops
      };
    }

    // Her çalışan için güncelleme yap
    let updated = 0;
    let notFound = 0;
    let stopNotFound = 0;
    let stopsAdded = [];

    for (const data of employeeData) {
      try {
        // Çalışanı bul (büyük/küçük harf duyarlılığını kaldır)
        const employee = await Employee.findOne({
          adSoyad: { $regex: new RegExp(`^${data.name}$`, 'i') }
        });
        
        if (!employee) {
          console.log(`❌ Çalışan bulunamadı: ${data.name}`);
          notFound++;
          continue;
        }

        // Güzergahı kontrol et
        if (!routeInfo[data.route]) {
          console.log(`⚠️ Güzergah bulunamadı: ${data.route}`);
          continue;
        }

        // Durağı kontrol et
        let matchedStop = null;
        
        // Önce tam eşleşme ara
        matchedStop = routeInfo[data.route].stops.find(stop => 
          stop.name.toUpperCase() === data.stop.toUpperCase()
        );
        
        // Tam eşleşme yoksa, içeren bir durak ara
        if (!matchedStop) {
          matchedStop = routeInfo[data.route].stops.find(stop => 
            stop.name.toUpperCase().includes(data.stop.toUpperCase()) || 
            data.stop.toUpperCase().includes(stop.name.toUpperCase())
          );
        }
        
        // Hala bulunamadıysa ve bu durak daha önce eklenmemişse, yeni durak olarak ekle
        if (!matchedStop && !stopsAdded.includes(`${data.route}-${data.stop}`)) {
          console.log(`⚠️ Durak bulunamadı: ${data.stop} (${data.route} güzergahında)`);
          stopNotFound++;
          
          // En son durak sıra numarasını bul
          const lastOrderNo = Math.max(...routeInfo[data.route].stops.map(s => s.order), 0);
          
          // Yeni durak ekle
          const updatedRoute = await ServiceRoute.findByIdAndUpdate(
            routeInfo[data.route]._id,
            { 
              $push: { 
                stops: { 
                  name: data.stop, 
                  order: lastOrderNo + 1 
                } 
              } 
            },
            { new: true }
          );
          
          // Güzergah bilgilerini güncelle
          routeInfo[data.route].stops = updatedRoute.stops;
          matchedStop = updatedRoute.stops.find(s => s.name === data.stop);
          console.log(`✅ Yeni durak eklendi: ${data.stop} (${data.route} güzergahına)`);
          
          // Eklenen durağı kaydet
          stopsAdded.push(`${data.route}-${data.stop}`);
        }
        
        // Çalışanı güncelle
        await Employee.findByIdAndUpdate(
          employee._id,
          {
            servisGuzergahi: data.route,
            durak: matchedStop ? matchedStop.name : data.stop,
            servisKullaniyor: true,
            lokasyon: getLokasyonFromRoute(data.route),
            serviceInfo: {
              usesService: true,
              routeName: data.route,
              stopName: matchedStop ? matchedStop.name : data.stop,
              routeId: routeInfo[data.route]._id
            }
          }
        );
        
        console.log(`✅ ${employee.adSoyad}: ${data.route} güzergahına ${matchedStop ? matchedStop.name : data.stop} durağıyla atandı`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Hata: ${error.message}`);
      }
    }
    
    // Servis kullanmayan çalışanları işaretle
    const updatedEmployees = await Employee.find({ durum: 'AKTIF' }).select('adSoyad');
    const employeeNames = employeeData.map(data => data.name);
    
    let markedAsNonService = 0;
    
    for (const employee of updatedEmployees) {
      // Listede olmayan çalışanlar servis kullanmıyor olarak işaretle
      const isInList = employeeNames.some(name => 
        name.toUpperCase() === employee.adSoyad.toUpperCase()
      );
      
      if (!isInList) {
        await Employee.findByIdAndUpdate(
          employee._id,
          {
            servisGuzergahi: null,
            durak: null,
            servisKullaniyor: false,
            serviceInfo: {
              usesService: false
            }
          }
        );
        markedAsNonService++;
      }
    }

    console.log(`\n📊 SONUÇ:`);
    console.log(`✅ ${updated} çalışanın servis bilgisi güncellendi`);
    console.log(`⚠️ ${notFound} çalışan bulunamadı`);
    console.log(`⚠️ ${stopNotFound} durak bulunamadı ve yeni eklendi`);
    console.log(`ℹ️ ${markedAsNonService} çalışan servis kullanmıyor olarak işaretlendi`);

  } catch (error) {
    console.error('❌ Genel hata:', error);
  } finally {
    // Bağlantıyı kapat
    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  }
}

// Güzergah adından lokasyon belirle
function getLokasyonFromRoute(routeName) {
  const routeLocationMap = {
    'DİSPANSER SERVİS GÜZERGAHI': 'MERKEZ',
    'ÇARŞI MERKEZ SERVİS GÜZERGAHI': 'MERKEZ',
    'SANAYİ MAHALLESİ SERVİS GÜZERGAHI': 'İŞL',
    'OSMANGAZİ-KARŞIYAKA MAHALLESİ': 'OSB',
    'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI': 'İŞIL'
  };
  
  return routeLocationMap[routeName] || 'MERKEZ';
}

// Script'i çalıştır
updateEmployeeServices(); 
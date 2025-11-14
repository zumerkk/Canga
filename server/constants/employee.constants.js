/**
 * 🎯 Çalışan Sistemi Constants
 * Tüm sabit değerler burada merkezi olarak yönetilir
 */

// 📊 Durum Değerleri
const EMPLOYEE_STATUS = {
  ACTIVE: 'AKTIF',
  PASSIVE: 'PASIF',
  ON_LEAVE: 'İZİNLİ',
  TERMINATED: 'AYRILDI'
};

// 📍 Lokasyon Değerleri (Standartlaştırılmış)
const LOCATIONS = {
  MERKEZ: 'MERKEZ',
  ISIL: 'İŞIL',  // Türkçe İ karakteri ile standart
  OSB: 'OSB'
};

// 🏢 Departman Değerleri (Genişletilmiş)
const DEPARTMENTS = {
  // Üretim Departmanları
  TORNA_GRUBU: 'TORNA GRUBU',
  FREZE_GRUBU: 'FREZE GRUBU',
  TESTERE: 'TESTERE',
  KAYNAK: 'KAYNAK',
  MONTAJ: 'MONTAJ',
  
  // İdari Departmanlar
  IDARI_BIRIM: 'İDARİ BİRİM',
  TEKNIK_OFIS: 'TEKNİK OFİS',
  KALITE_KONTROL: 'KALİTE KONTROL',
  BAKIM_ONARIM: 'BAKIM VE ONARIM',
  PLANLAMA: 'PLANLAMA',
  INSAN_KAYNAKLARI: 'İNSAN KAYNAKLARI',
  MUHASEBE: 'MUHASEBE',
  SATIS: 'SATIŞ',
  LOJISTIK: 'LOJISTIK',
  AR_GE: 'AR-GE',
  BILGI_ISLEM: 'BİLGİ İŞLEM',
  DEPO: 'DEPO',
  
  // Özel Departmanlar
  GENEL_CALISMA: 'GENEL ÇALIŞMA GRUBU',
  STAJYERLIK: 'STAJYERLİK',
  CIRAK_LISE: 'ÇIRAK LİSE',
  GENEL: 'GENEL',
  DIGER: 'DİĞER'
};

// 🔢 Sayfalama Varsayılan Değerleri
const PAGINATION = {
  DEFAULT_LIMIT: 1000,
  MIN_LIMIT: 1,
  MAX_LIMIT: 5000,
  DEFAULT_PAGE: 1
};

// ⏱️ Cache Süreleri (saniye cinsinden)
const CACHE_TTL = {
  EMPLOYEE_LIST: 300,      // 5 dakika
  EMPLOYEE_STATS: 600,     // 10 dakika
  FILTER_STATS: 300,       // 5 dakika
  DEPARTMENTS: 1800,       // 30 dakika
  LOCATIONS: 1800          // 30 dakika
};

// 🆔 Employee ID Ayarları
const EMPLOYEE_ID = {
  PREFIX_LENGTH: 2,        // İsim baş harfleri
  NUMBER_LENGTH: 4,        // Numara uzunluğu
  NUMBER_PAD_CHAR: '0'     // Padding karakteri
};

// 🚌 Servis Güzergahları
const SERVICE_ROUTES = {
  DISPANSER: 'DİSPANSER SERVİS GÜZERGAHI',
  SANAYI: 'SANAYİ MAHALLESİ SERVİS GÜZERGAHI',
  OSMANGAZI: 'OSMANGAZİ-KARŞIYAKA MAHALLESİ',
  CALILIOZ: 'ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI',
  CARSI_MERKEZ: 'ÇARŞI MERKEZ SERVİS GÜZERGAHI'
};

// 🗺️ Servis Güzergahı -> Lokasyon Mapping
const ROUTE_TO_LOCATION = {
  [SERVICE_ROUTES.DISPANSER]: LOCATIONS.MERKEZ,
  [SERVICE_ROUTES.CARSI_MERKEZ]: LOCATIONS.MERKEZ,
  [SERVICE_ROUTES.SANAYI]: LOCATIONS.ISIL,
  [SERVICE_ROUTES.OSMANGAZI]: LOCATIONS.ISIL,
  [SERVICE_ROUTES.CALILIOZ]: LOCATIONS.ISIL
};

// 💼 Pozisyon -> Departman Mapping
const POSITION_TO_DEPARTMENT = {
  'CNC TORNA OPERATÖRÜ': DEPARTMENTS.TORNA_GRUBU,
  'CNC FREZE OPERATÖRÜ': DEPARTMENTS.FREZE_GRUBU,
  'TORNACI': DEPARTMENTS.TORNA_GRUBU,
  'AutoForm Editörü': DEPARTMENTS.TEKNIK_OFIS,
  'BİL İŞLEM': DEPARTMENTS.TEKNIK_OFIS,
  'KALİTE KONTROL OPERATÖRÜ': DEPARTMENTS.KALITE_KONTROL,
  'KAYNAKÇI': DEPARTMENTS.KAYNAK,
  'MAL İŞÇİSİ': DEPARTMENTS.GENEL_CALISMA,
  'EMİL': DEPARTMENTS.GENEL_CALISMA,
  'MUTAT. OPERATÖRÜ': DEPARTMENTS.MONTAJ,
  'SERİGRAFİ ANE ANA MEKİNİSTİ': DEPARTMENTS.TEKNIK_OFIS,
  'SERİGRAF METİNİNİ': DEPARTMENTS.TEKNIK_OFIS,
  'İKİ AMBAR EMİNİ': DEPARTMENTS.DEPO,
  'İKİ - GÜDE SORUMLUSU': DEPARTMENTS.KALITE_KONTROL,
  'SİL GÜDE USTABAŞI': DEPARTMENTS.KALITE_KONTROL,
  'ÖZEL GÜVENLİK': DEPARTMENTS.IDARI_BIRIM,
  'İDARE': DEPARTMENTS.IDARI_BIRIM,
  'KAL MUSTAFA DURAĞI': DEPARTMENTS.KALITE_KONTROL
};

// 🚫 Hariç Tutulacak İsimler (Import işlemlerinde)
const EXCLUDED_NAMES = [
  'Ahmet ÇANGA',
  'Muhammed Zümer KEKİLLİOĞLU'
];

module.exports = {
  EMPLOYEE_STATUS,
  LOCATIONS,
  DEPARTMENTS,
  PAGINATION,
  CACHE_TTL,
  EMPLOYEE_ID,
  SERVICE_ROUTES,
  ROUTE_TO_LOCATION,
  POSITION_TO_DEPARTMENT,
  EXCLUDED_NAMES
};


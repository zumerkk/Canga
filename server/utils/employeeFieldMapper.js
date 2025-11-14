/**
 * 🔄 Çalışan Field Mapping Utilities
 * Türkçe ↔ İngilizce field dönüşümleri
 */

/**
 * Frontend'den gelen İngilizce field'ları MongoDB Türkçe field'larına çevir
 * @param {Object} frontendData - Frontend'den gelen data
 * @returns {Object} MongoDB için Türkçe field'lı data
 */
const mapFrontendToBackend = (frontendData) => {
  const mapped = {};
  
  // İsim bilgileri
  if (frontendData.firstName || frontendData.lastName) {
    mapped.firstName = frontendData.firstName;
    mapped.lastName = frontendData.lastName;
    mapped.adSoyad = `${frontendData.firstName || ''} ${frontendData.lastName || ''}`.trim();
  } else if (frontendData.adSoyad) {
    mapped.adSoyad = frontendData.adSoyad;
  }
  
  // Departman
  if (frontendData.department) {
    mapped.departman = frontendData.department;
  } else if (frontendData.departman) {
    mapped.departman = frontendData.departman;
  }
  
  // Lokasyon
  if (frontendData.location) {
    // "MERKEZ ŞUBE" -> "MERKEZ" şeklinde temizle
    mapped.lokasyon = frontendData.location
      .replace(' ŞUBE', '')
      .replace('IŞIL', 'İŞIL')
      .replace('MERKEZ', 'MERKEZ');
  } else if (frontendData.lokasyon) {
    mapped.lokasyon = frontendData.lokasyon;
  }
  
  // Pozisyon
  if (frontendData.position) {
    mapped.pozisyon = frontendData.position;
  } else if (frontendData.pozisyon) {
    mapped.pozisyon = frontendData.pozisyon;
  }
  
  // Durum
  if (frontendData.status) {
    mapped.durum = frontendData.status;
  } else if (frontendData.durum) {
    mapped.durum = frontendData.durum;
  }
  
  // Tarihler
  if (frontendData.startDate) {
    mapped.iseGirisTarihi = new Date(frontendData.startDate);
  } else if (frontendData.iseGirisTarihi) {
    mapped.iseGirisTarihi = frontendData.iseGirisTarihi;
  }
  
  if (frontendData.endDate) {
    mapped.ayrilmaTarihi = new Date(frontendData.endDate);
  } else if (frontendData.ayrilmaTarihi) {
    mapped.ayrilmaTarihi = frontendData.ayrilmaTarihi;
  }
  
  // Servis bilgileri
  if (frontendData.serviceRoute) {
    mapped.servisGuzergahi = frontendData.serviceRoute;
  } else if (frontendData.servisGuzergahi) {
    mapped.servisGuzergahi = frontendData.servisGuzergahi;
  }
  
  if (frontendData.serviceStop) {
    mapped.durak = frontendData.serviceStop;
  } else if (frontendData.durak) {
    mapped.durak = frontendData.durak;
  }
  
  // Diğer alanlar
  if (frontendData.employeeId) mapped.employeeId = frontendData.employeeId;
  if (frontendData.tcNo) mapped.tcNo = frontendData.tcNo;
  if (frontendData.phone || frontendData.cepTelefonu) {
    mapped.cepTelefonu = frontendData.phone || frontendData.cepTelefonu;
  }
  if (frontendData.birthDate || frontendData.dogumTarihi) {
    mapped.dogumTarihi = frontendData.birthDate ? 
      new Date(frontendData.birthDate) : frontendData.dogumTarihi;
  }
  if (frontendData.supervisor) mapped.supervisor = frontendData.supervisor;
  
  return mapped;
};

/**
 * MongoDB'den gelen Türkçe field'ları Frontend'e İngilizce olarak çevir
 * @param {Object} backendData - MongoDB'den gelen data
 * @returns {Object} Frontend için İngilizce field'lı data
 */
const mapBackendToFrontend = (backendData) => {
  if (!backendData) return null;
  
  return {
    _id: backendData._id,
    employeeId: backendData.employeeId,
    
    // İsim bilgileri (her iki format da gönder)
    firstName: backendData.firstName || backendData.adSoyad?.split(' ')[0] || '',
    lastName: backendData.lastName || backendData.adSoyad?.split(' ').slice(1).join(' ') || '',
    fullName: backendData.adSoyad,
    adSoyad: backendData.adSoyad, // Geriye uyumluluk
    
    // İngilizce field'lar
    department: backendData.departman,
    location: backendData.lokasyon,
    position: backendData.pozisyon,
    status: backendData.durum,
    
    // Türkçe field'lar (geriye uyumluluk)
    departman: backendData.departman,
    lokasyon: backendData.lokasyon,
    pozisyon: backendData.pozisyon,
    durum: backendData.durum,
    
    // Diğer alanlar
    tcNo: backendData.tcNo,
    phone: backendData.cepTelefonu,
    cepTelefonu: backendData.cepTelefonu,
    birthDate: backendData.dogumTarihi,
    dogumTarihi: backendData.dogumTarihi,
    startDate: backendData.iseGirisTarihi,
    iseGirisTarihi: backendData.iseGirisTarihi,
    endDate: backendData.ayrilmaTarihi,
    ayrilmaTarihi: backendData.ayrilmaTarihi,
    
    // Servis bilgileri
    serviceRoute: backendData.servisGuzergahi,
    servisGuzergahi: backendData.servisGuzergahi,
    serviceStop: backendData.durak,
    durak: backendData.durak,
    serviceInfo: backendData.serviceInfo,
    
    // Supervisor (stajyer/çırak için)
    supervisor: backendData.supervisor,
    
    // Tarihler
    createdAt: backendData.createdAt,
    updatedAt: backendData.updatedAt
  };
};

/**
 * Çalışan listesini frontend formatına çevir
 * @param {Array} employees - MongoDB'den gelen çalışan listesi
 * @returns {Array} Frontend formatında çalışan listesi
 */
const mapEmployeeListToFrontend = (employees) => {
  if (!Array.isArray(employees)) return [];
  return employees.map(mapBackendToFrontend);
};

module.exports = {
  mapFrontendToBackend,
  mapBackendToFrontend,
  mapEmployeeListToFrontend
};


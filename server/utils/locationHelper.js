/**
 * 📍 KONUM YARDIMCI FONKSİYONLARI
 * GPS koordinat hesaplamaları ve konum kontrolü
 */

// Fabrika adresi koordinatları
// FABRİKALAR MAH. SİLAH İHTİSAS OSB 2. SOKAK NO: 3, 71100 Kırıkkale Merkez/Kırıkkale
const FACTORY_LOCATION = {
  latitude: 39.8467,  // Kırıkkale OSB koordinatları
  longitude: 33.5153,
  address: 'FABRİKALAR MAH. SİLAH İHTİSAS OSB 2. SOKAK NO: 3, 71100 Kırıkkale Merkez/Kırıkkale',
  radius: 1000 // 1000 metre (1 km) yarıçap - fabrika sınırları
};

/**
 * Haversine formülü ile iki GPS koordinatı arasındaki mesafe hesaplama
 * @param {number} lat1 - İlk nokta latitude
 * @param {number} lon1 - İlk nokta longitude
 * @param {number} lat2 - İkinci nokta latitude
 * @param {number} lon2 - İkinci nokta longitude
 * @returns {number} Mesafe (metre)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Dünya yarıçapı (metre)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // metre

  return Math.round(distance);
}

/**
 * Kullanıcının fabrika sınırları içinde olup olmadığını kontrol et
 * @param {object} coordinates - { latitude, longitude }
 * @returns {object} { isWithinBounds, distance, factory }
 */
function checkLocationWithinFactory(coordinates) {
  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    return {
      isWithinBounds: true, // ✅ GPS olmadığında geçerli say
      error: 'Konum bilgisi alınamadı',
      distance: 0,
      distanceText: 'GPS yok',
      factory: FACTORY_LOCATION,
      userLocation: null,
      message: '⚠️ GPS bilgisi alınamadı, manuel onay'
    };
  }

  const distance = calculateDistance(
    coordinates.latitude,
    coordinates.longitude,
    FACTORY_LOCATION.latitude,
    FACTORY_LOCATION.longitude
  );

  const isWithinBounds = distance <= FACTORY_LOCATION.radius;

  return {
    isWithinBounds,
    distance,
    distanceText: formatDistance(distance),
    factory: FACTORY_LOCATION,
    userLocation: coordinates,
    message: isWithinBounds 
      ? `✅ Fabrika sınırları içindesiniz (${formatDistance(distance)})` 
      : `❌ Fabrika sınırları dışındasınız (${formatDistance(distance)} uzakta)`
  };
}

/**
 * Mesafe formatla (metre/km)
 * @param {number} meters - Metre cinsinden mesafe
 * @returns {string} Formatlanmış mesafe
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return `${meters} metre`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Konum anomalisi oluştur (AI analizi için)
 * @param {object} locationCheck - checkLocationWithinFactory sonucu
 * @param {object} employee - Çalışan bilgileri
 * @returns {object} Anomali detayları
 */
function createLocationAnomaly(locationCheck, employee) {
  if (locationCheck.isWithinBounds) {
    return null; // Anomali yok
  }

  const severity = locationCheck.distance > 10000 ? 'ERROR' : 
                   locationCheck.distance > 5000 ? 'WARNING' : 'INFO';

  return {
    type: 'LOCATION_OUT_OF_BOUNDS',
    severity,
    description: `${employee.adSoyad} fabrika dışından giriş yaptı (${locationCheck.distanceText} uzakta)`,
    details: {
      employeeName: employee.adSoyad,
      employeeId: employee.employeeId,
      userLocation: locationCheck.userLocation,
      factoryLocation: locationCheck.factory,
      distance: locationCheck.distance,
      distanceText: locationCheck.distanceText,
      timestamp: new Date()
    },
    aiAnalysisRequired: locationCheck.distance > 5000 // 5km üzeri AI analizi
  };
}

module.exports = {
  FACTORY_LOCATION,
  calculateDistance,
  checkLocationWithinFactory,
  formatDistance,
  createLocationAnomaly
};


import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } from 'react-leaflet';
import { Box, Paper, Typography, Chip, Avatar } from '@mui/material';
import { LocationOn, CheckCircle, Warning } from '@mui/icons-material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue - Vite uyumlu
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * 🗺️ CANLI KONUM HARİTASI
 * GPS ile giriş-çıkış yapılan konumları gerçek zamanlı gösterir
 */

// Fabrika Lokasyonu (Kırıkkale OSB)
const FACTORY_LOCATION = {
  lat: 39.8467,
  lng: 33.5153,
  name: 'Çanga Savunma - Fabrika',
  radius: 1000 // 1km
};

const LiveLocationMap = ({ records = [] }) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  // Renk belirleme (fabrika içi/dışı)
  const getMarkerColor = (distance) => {
    if (!distance || distance === 0) return 'gray'; // GPS yok
    if (distance <= 1000) return 'green'; // İçeride
    if (distance <= 5000) return 'orange'; // Yakın
    return 'red'; // Uzak
  };

  // Custom marker icon
  const createCustomIcon = (color) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  // GPS koordinatı olan kayıtları filtrele
  const recordsWithGPS = records.filter(
    record => record.checkIn?.coordinates?.latitude && record.checkIn?.coordinates?.longitude
  );

  if (!mapReady) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <Typography>Harita yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, height: 500 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" display="flex" alignItems="center" gap={1}>
          <LocationOn color="primary" />
          Canlı Konum Haritası
        </Typography>
        <Box display="flex" gap={1}>
          <Chip
            icon={<CheckCircle />}
            label={`Fabrika İçi (${recordsWithGPS.filter(r => (r.checkIn?.distance || 99999) <= 1000).length})`}
            size="small"
            color="success"
          />
          <Chip
            icon={<Warning />}
            label={`Anomali (${recordsWithGPS.filter(r => (r.checkIn?.distance || 0) > 1000).length})`}
            size="small"
            color="warning"
          />
        </Box>
      </Box>

      <MapContainer
        center={[FACTORY_LOCATION.lat, FACTORY_LOCATION.lng]}
        zoom={13}
        style={{ height: 420, borderRadius: 8 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fabrika Merkez İşaretçisi */}
        <Marker
          position={[FACTORY_LOCATION.lat, FACTORY_LOCATION.lng]}
          icon={createCustomIcon('#1976d2')}
        >
          <Popup>
            <Box textAlign="center">
              <Typography variant="subtitle2" fontWeight="bold">
                🏭 {FACTORY_LOCATION.name}
              </Typography>
              <Typography variant="caption">
                Merkez Lokasyon
              </Typography>
            </Box>
          </Popup>
        </Marker>

        {/* Fabrika Yarıçapı */}
        <Circle
          center={[FACTORY_LOCATION.lat, FACTORY_LOCATION.lng]}
          radius={FACTORY_LOCATION.radius}
          pathOptions={{
            color: '#4caf50',
            fillColor: '#4caf50',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '10, 10'
          }}
        >
          <Tooltip permanent direction="top">
            <Typography variant="caption">
              Geçerli Alan (1 km)
            </Typography>
          </Tooltip>
        </Circle>

        {/* Çalışan Giriş Noktaları */}
        {recordsWithGPS.map((record, index) => {
          const lat = record.checkIn.coordinates.latitude;
          const lng = record.checkIn.coordinates.longitude;
          const distance = record.checkIn.distance || 0;
          const color = getMarkerColor(distance);

          return (
            <Marker
              key={index}
              position={[lat, lng]}
              icon={createCustomIcon(color)}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: color }}>
                      {record.employee?.adSoyad?.charAt(0) || '?'}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {record.employee?.adSoyad || 'Bilinmeyen'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" display="block">
                    📍 <strong>Mesafe:</strong> {distance > 0 ? `${(distance / 1000).toFixed(2)} km` : 'Bilinmiyor'}
                  </Typography>
                  
                  <Typography variant="caption" display="block">
                    ⏰ <strong>Saat:</strong> {new Date(record.checkIn.time).toLocaleTimeString('tr-TR')}
                  </Typography>
                  
                  <Typography variant="caption" display="block">
                    🏢 <strong>Lokasyon:</strong> {record.checkIn.location || 'Belirtilmemiş'}
                  </Typography>
                  
                  {distance > 1000 && (
                    <Chip
                      icon={<Warning />}
                      label="Anomali Tespit Edildi"
                      size="small"
                      color="warning"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* GPS olmayan kayıtlar için uyarı */}
      {records.length > recordsWithGPS.length && (
        <Box mt={2}>
          <Chip
            label={`${records.length - recordsWithGPS.length} kayıtta GPS bilgisi yok`}
            size="small"
            variant="outlined"
          />
        </Box>
      )}
    </Paper>
  );
};

export default LiveLocationMap;


import React, { useEffect } from 'react';
import { Box, Typography, Paper, Chip, Card, CardContent, Avatar } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import { LocationOn, MyLocation, Navigation } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet için custom marker ikonları
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

const MERKEZ_OFIS = {
  lat: 39.81408397827491,
  lng: 33.48881297116444,
  name: 'Canga Merkez Ofis'
};

// Özel marker ikonları
const createIcon = (color) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Mesafe hesaplama
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)} metre`;
  }
  return `${distance.toFixed(2)} km`;
};

// Konum durumu belirleme
const getLocationStatus = (distance) => {
  const distanceNum = parseFloat(distance);
  
  if (distance.includes('metre')) {
    if (distanceNum <= 500) {
      return { status: 'success', label: 'Ofis İçinde', color: '#4caf50' };
    }
    if (distanceNum <= 1000) {
      return { status: 'warning', label: 'Ofis Yakını', color: '#ff9800' };
    }
  }
  
  if (distance.includes('km')) {
    if (distanceNum <= 1) {
      return { status: 'warning', label: 'Ofis Yakını', color: '#ff9800' };
    }
    if (distanceNum <= 5) {
      return { status: 'info', label: 'Şehir İçi', color: '#2196f3' };
    }
  }
  
  return { status: 'error', label: 'Uzak Konum', color: '#f44336' };
};

const LeafletMap = ({ coordinates, employeeName = 'Personel', showDetails = true }) => {
  // Stil ekle
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container {
        height: 400px;
        width: 100%;
        border-radius: 12px;
      }
      .custom-div-icon {
        background: transparent;
        border: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <MyLocation sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Konum Bilgisi Bulunamadı
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          GPS koordinatları mevcut değil
        </Typography>
      </Paper>
    );
  }

  const personelPosition = [
    parseFloat(coordinates.latitude), 
    parseFloat(coordinates.longitude)
  ];
  const merkezPosition = [MERKEZ_OFIS.lat, MERKEZ_OFIS.lng];
  
  const distance = calculateDistance(
    MERKEZ_OFIS.lat, 
    MERKEZ_OFIS.lng,
    parseFloat(coordinates.latitude),
    parseFloat(coordinates.longitude)
  );
  
  const locationStatus = getLocationStatus(distance);

  return (
    <Box>
      {showDetails && (
        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: locationStatus.color }}>
                  <LocationOn />
                </Avatar>
                <Box>
                  <Typography variant="h6">{employeeName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Merkez Ofise Uzaklık: {distance}
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label={locationStatus.label}
                sx={{ 
                  bgcolor: locationStatus.color,
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <MapContainer 
          center={personelPosition} 
          zoom={14} 
          style={{ height: '400px', width: '100%' }}
        >
          {/* Harita Katmanı - OpenStreetMap */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Personel Konumu */}
          <Marker 
            position={personelPosition}
            icon={createIcon('#2196f3')}
          >
            <Popup>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {employeeName}
                </Typography>
                <Typography variant="caption" display="block">
                  Konum: {coordinates.latitude}, {coordinates.longitude}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Merkeze Uzaklık: {distance}
                </Typography>
              </Box>
            </Popup>
          </Marker>

          {/* Merkez Ofis */}
          <Marker 
            position={merkezPosition}
            icon={createIcon('#f44336')}
          >
            <Popup>
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {MERKEZ_OFIS.name}
                </Typography>
                <Typography variant="caption">
                  Ana Merkez
                </Typography>
              </Box>
            </Popup>
          </Marker>

          {/* Bağlantı Çizgisi */}
          <Polyline 
            positions={[personelPosition, merkezPosition]}
            color={locationStatus.color}
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />

          {/* Merkez Ofis Çevresi - 500m */}
          <Circle 
            center={merkezPosition}
            radius={500}
            color="#4caf50"
            fillColor="#4caf50"
            fillOpacity={0.1}
          />

          {/* Merkez Ofis Çevresi - 1km */}
          <Circle 
            center={merkezPosition}
            radius={1000}
            color="#ff9800"
            fillColor="#ff9800"
            fillOpacity={0.05}
          />
        </MapContainer>
      </Paper>

      {showDetails && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOn color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Enlem
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {parseFloat(coordinates.latitude).toFixed(6)}
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Navigation color="primary" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Boylam
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {parseFloat(coordinates.longitude).toFixed(6)}
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 2, flex: 1, minWidth: 200 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <MyLocation sx={{ color: locationStatus.color }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Uzaklık
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {distance}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default LeafletMap;

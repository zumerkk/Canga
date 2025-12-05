import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Refresh,
  ZoomIn,
  ZoomOut,
  MyLocation,
  Layers,
  Warning,
  CheckCircle,
  AccessTime
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * 🗺️ Attendance Map Component
 * Canlı konum haritası
 */

// Fabrika merkez koordinatları
const FACTORY_LOCATIONS = {
  MERKEZ: {
    lat: 40.0256,
    lng: 32.7356,
    name: 'Merkez Fabrika',
    radius: 300 // metre
  },
  IŞIL: {
    lat: 40.0285,
    lng: 32.7412,
    name: 'Işıl Şube',
    radius: 200
  }
};

// Custom marker icons
const createMarkerIcon = (color, status) => {
  const statusIcon = status === 'in' ? '🟢' : status === 'out' ? '🔴' : '🟡';
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">
        ${statusIcon}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Map controller component
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const AttendanceMap = ({ 
  records = [], 
  onRefresh,
  height = 500,
  showControls = true
}) => {
  const [selectedBranch, setSelectedBranch] = useState('TÜM');
  const [mapCenter, setMapCenter] = useState([40.0256, 32.7356]);
  const [mapZoom, setMapZoom] = useState(15);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Koordinatı olan kayıtları filtrele
  const mappableRecords = useMemo(() => {
    return records.filter(r => 
      (r.checkIn?.coordinates?.lat || r.checkIn?.coordinates?.latitude) && 
      (r.checkIn?.coordinates?.lng || r.checkIn?.coordinates?.longitude)
    ).map(r => ({
      ...r,
      lat: r.checkIn.coordinates.lat || r.checkIn.coordinates.latitude,
      lng: r.checkIn.coordinates.lng || r.checkIn.coordinates.longitude,
      status: r.checkOut?.time ? 'out' : 'in',
      branch: r.checkIn?.branch || 'MERKEZ'
    }));
  }, [records]);

  // Şubeye göre filtrele
  const filteredRecords = useMemo(() => {
    if (selectedBranch === 'TÜM') return mappableRecords;
    return mappableRecords.filter(r => r.branch === selectedBranch);
  }, [mappableRecords, selectedBranch]);

  // İstatistikler
  const stats = useMemo(() => {
    const inFactory = filteredRecords.filter(r => {
      const factoryLoc = FACTORY_LOCATIONS[r.branch] || FACTORY_LOCATIONS.MERKEZ;
      const distance = calculateDistance(
        r.lat, r.lng, 
        factoryLoc.lat, factoryLoc.lng
      );
      return distance <= factoryLoc.radius;
    });

    const outsideFactory = filteredRecords.length - inFactory.length;
    const currentlyIn = filteredRecords.filter(r => r.status === 'in').length;
    const checkedOut = filteredRecords.filter(r => r.status === 'out').length;

    return {
      total: filteredRecords.length,
      inFactory: inFactory.length,
      outsideFactory,
      currentlyIn,
      checkedOut
    };
  }, [filteredRecords]);

  // Merkez şubesi
  const handleCenterToBranch = (branch) => {
    const location = FACTORY_LOCATIONS[branch];
    if (location) {
      setMapCenter([location.lat, location.lng]);
      setMapZoom(16);
    }
  };

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      {showControls && (
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center"
          p={2}
          borderBottom="1px solid"
          borderColor="divider"
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight="bold">
              🗺️ Canlı Konum Haritası
            </Typography>
            <Chip 
              label={`${filteredRecords.length} konum`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <MenuItem value="TÜM">Tüm Şubeler</MenuItem>
                <MenuItem value="MERKEZ">🏭 Merkez</MenuItem>
                <MenuItem value="IŞIL">🏢 Işıl</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Merkeze git">
              <IconButton onClick={() => handleCenterToBranch('MERKEZ')} size="small">
                <MyLocation />
              </IconButton>
            </Tooltip>

            <Tooltip title="Yenile">
              <IconButton onClick={onRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Stats Bar */}
      <Box 
        display="flex" 
        gap={2} 
        p={2} 
        bgcolor="grey.50"
        flexWrap="wrap"
      >
        <StatChip 
          icon={<CheckCircle color="success" />}
          label="Fabrika İçi"
          value={stats.inFactory}
          color="success"
        />
        <StatChip 
          icon={<Warning color="warning" />}
          label="Fabrika Dışı"
          value={stats.outsideFactory}
          color="warning"
        />
        <StatChip 
          icon={<AccessTime color="info" />}
          label="Şu An İçeride"
          value={stats.currentlyIn}
          color="info"
        />
      </Box>

      {/* Map */}
      <Box sx={{ height, position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Fabrika alanları */}
          {Object.entries(FACTORY_LOCATIONS).map(([key, loc]) => (
            <Circle
              key={key}
              center={[loc.lat, loc.lng]}
              radius={loc.radius}
              pathOptions={{
                color: key === 'MERKEZ' ? '#1976d2' : '#9c27b0',
                fillColor: key === 'MERKEZ' ? '#1976d2' : '#9c27b0',
                fillOpacity: 0.1
              }}
            >
              <Popup>
                <strong>{loc.name}</strong><br />
                Yarıçap: {loc.radius}m
              </Popup>
            </Circle>
          ))}

          {/* Çalışan konumları */}
          {filteredRecords.map((record, index) => (
            <Marker
              key={record._id || index}
              position={[record.lat, record.lng]}
              icon={createMarkerIcon(
                record.status === 'in' ? '#4caf50' : '#f44336',
                record.status
              )}
            >
              <Popup>
                <Box minWidth={200}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {record.employeeId?.adSoyad || 'İsimsiz'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {record.employeeId?.pozisyon}
                  </Typography>
                  <Box mt={1}>
                    <Typography variant="caption" display="block">
                      🕐 Giriş: {new Date(record.checkIn?.time).toLocaleTimeString('tr-TR')}
                    </Typography>
                    {record.checkOut?.time && (
                      <Typography variant="caption" display="block">
                        🕐 Çıkış: {new Date(record.checkOut.time).toLocaleTimeString('tr-TR')}
                      </Typography>
                    )}
                    <Typography variant="caption" display="block">
                      🏢 Şube: {record.branch}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={record.status === 'in' ? 'İçeride' : 'Çıkış yaptı'}
                    color={record.status === 'in' ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            bgcolor: 'white',
            p: 1.5,
            borderRadius: 2,
            boxShadow: 2,
            zIndex: 1000
          }}
        >
          <Typography variant="caption" fontWeight="bold" display="block" mb={1}>
            Gösterge
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
              <Typography variant="caption">İçeride</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
              <Typography variant="caption">Çıkış yaptı</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#1976d2', opacity: 0.3 }} />
              <Typography variant="caption">Fabrika alanı</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

// Mesafe hesaplama (Haversine formülü)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // metre
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lng2-lng1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Stat Chip component
const StatChip = ({ icon, label, value, color }) => (
  <Box 
    display="flex" 
    alignItems="center" 
    gap={1}
    px={2}
    py={1}
    bgcolor="white"
    borderRadius={2}
    boxShadow={1}
  >
    {icon}
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold" color={`${color}.main`}>
        {value}
      </Typography>
    </Box>
  </Box>
);

export default AttendanceMap;

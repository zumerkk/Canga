import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Card,
  CardContent,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  LocationOn,
  Login,
  Logout,
  Warning
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../config/api';
import moment from 'moment';
import 'moment/locale/tr';

moment.locale('tr');

// Leaflet marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// 📍 Custom Marker Icons
const createCustomIcon = (type, hasAnomaly) => {
  const color = hasAnomaly ? '#f44336' : (type === 'CHECK_IN' ? '#4caf50' : '#ff9800');
  const icon = type === 'CHECK_IN' ? '🟢' : '🔴';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">
        ${icon}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Factory icon
const factoryIcon = L.divIcon({
  className: 'factory-marker',
  html: `
    <div style="
      background-color: #1976d2;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    ">
      🏭
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

// Harita merkezi ayarlama bileşeni
function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

/**
 * 🗺️ KONUM HARİTASI KOMPONENTİ
 * Leaflet.js ile giriş-çıkış konumlarını gösterir
 */
function LocationMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [locations, setLocations] = useState([]);
  const [factory, setFactory] = useState(null);
  const [stats, setStats] = useState(null);
  
  const [mapCenter, setMapCenter] = useState([39.8467, 33.5153]); // Kırıkkale OSB
  const [mapZoom, setMapZoom] = useState(12);
  
  const [viewMode, setViewMode] = useState('all'); // 'all', 'check-in', 'check-out', 'anomalies'
  const [showFactoryBounds, setShowFactoryBounds] = useState(true);
  const [showOnlyAnomalies, setShowOnlyAnomalies] = useState(false);
  
  // Veri yükleme
  useEffect(() => {
    loadMapData();
    loadStats();
  }, []);
  
  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/location-map/all-locations', {
        params: {
          limit: 1000
        }
      });
      
      setLocations(response.data.locations);
      setFactory(response.data.factory);
      
      if (response.data.factory) {
        setMapCenter([response.data.factory.latitude, response.data.factory.longitude]);
      }
      
    } catch (err) {
      console.error('Harita verileri yüklenemedi:', err);
      setError('Harita verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const response = await api.get('/api/location-map/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('İstatistikler yüklenemedi:', err);
    }
  };
  
  // Filtreli lokasyonlar
  const filteredLocations = locations.filter(loc => {
    if (showOnlyAnomalies && !loc.hasAnomaly) return false;
    
    if (viewMode === 'check-in') return loc.type === 'CHECK_IN';
    if (viewMode === 'check-out') return loc.type === 'CHECK_OUT';
    if (viewMode === 'anomalies') return loc.hasAnomaly;
    
    return true; // 'all'
  });
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" mt={2}>Harita yükleniyor...</Typography>
        </Box>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* İstatistikler */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Bugün
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.today}
                </Typography>
                <Typography variant="caption">
                  Konum kaydı
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Bu Ay
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats.thisMonth}
                </Typography>
                <Typography variant="caption">
                  Toplam kayıt
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Anomaliler
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {stats.totalAnomalies}
                </Typography>
                <Typography variant="caption">
                  Toplam
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Kritik
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="error">
                  {stats.criticalAnomalies}
                </Typography>
                <Typography variant="caption">
                  Yüksek risk
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Kontroller */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Gösterim Modu
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
              size="small"
              fullWidth
            >
              <ToggleButton value="all">
                <LocationOn sx={{ mr: 0.5 }} fontSize="small" />
                Tümü ({locations.length})
              </ToggleButton>
              <ToggleButton value="check-in">
                <Login sx={{ mr: 0.5 }} fontSize="small" />
                Giriş
              </ToggleButton>
              <ToggleButton value="check-out">
                <Logout sx={{ mr: 0.5 }} fontSize="small" />
                Çıkış
              </ToggleButton>
              <ToggleButton value="anomalies">
                <Warning sx={{ mr: 0.5 }} fontSize="small" />
                Anomaliler
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={showFactoryBounds}
                  onChange={(e) => setShowFactoryBounds(e.target.checked)}
                />
              }
              label="Fabrika sınırlarını göster"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showOnlyAnomalies}
                  onChange={(e) => setShowOnlyAnomalies(e.target.checked)}
                  color="error"
                />
              }
              label="Sadece anomaliler"
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Harita */}
      <Paper sx={{ height: '600px', overflow: 'hidden' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapCenter center={mapCenter} />
          
          {/* Fabrika Marker */}
          {factory && (
            <Marker
              position={[factory.latitude, factory.longitude]}
              icon={factoryIcon}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    🏭 ÇANGA SAVUNMAExport DEFAULTİ
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {factory.address}
                  </Typography>
                  <Chip label={`Yarıçap: ${factory.radius}m`} size="small" color="primary" sx={{ mt: 1 }} />
                </Box>
              </Popup>
            </Marker>
          )}
          
          {/* Fabrika Sınırları (Çember) */}
          {showFactoryBounds && factory && (
            <Circle
              center={[factory.latitude, factory.longitude]}
              radius={factory.radius}
              pathOptions={{
                color: '#1976d2',
                fillColor: '#1976d2',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '10, 10'
              }}
            />
          )}
          
          {/* Giriş-Çıkış Marker'ları */}
          {filteredLocations.map((loc, index) => (
            <Marker
              key={`${loc.employee.id}-${loc.type}-${index}`}
              position={[loc.coordinates.latitude, loc.coordinates.longitude]}
              icon={createCustomIcon(loc.type, loc.hasAnomaly)}
            >
              <Popup>
                <Box sx={{ minWidth: 250 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Avatar src={loc.employee.profilePhoto} sx={{ width: 40, height: 40 }}>
                      {loc.employee.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {loc.employee.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {loc.employee.employeeId} • {loc.employee.departman}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip
                    label={loc.type === 'CHECK_IN' ? '🟢 Giriş' : '🔴 Çıkış'}
                    size="small"
                    color={loc.type === 'CHECK_IN' ? 'success' : 'warning'}
                    sx={{ mr: 1, mb: 1 }}
                  />
                  
                  {loc.hasAnomaly && (
                    <Chip
                      label="⚠️ Anomali"
                      size="small"
                      color="error"
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  <Typography variant="body2" mt={1}>
                    📅 {moment(loc.timestamp).format('DD MMMM YYYY')}
                  </Typography>
                  <Typography variant="body2">
                    ⏰ {moment(loc.timestamp).format('HH:mm:ss')}
                  </Typography>
                  <Typography variant="body2">
                    📱 {loc.method}
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </Paper>
      
      {/* Bilgi */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Toplam {filteredLocations.length} konum</strong> gösteriliyor.
          {showOnlyAnomalies && ' Sadece anomaliler filtrelendi.'}
        </Typography>
      </Alert>
    </Box>
  );
}

export default LocationMap;


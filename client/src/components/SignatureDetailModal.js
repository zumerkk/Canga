import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  NavigateBefore,
  NavigateNext,
  CheckCircle,
  Cancel,
  Warning,
  Map as MapIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Fingerprint as FingerprintIcon,
  DeviceHub as DeviceHubIcon,
  Router as RouterIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/tr';
import LeafletMap from './LeafletMap';

moment.locale('tr');

// Merkez ofis koordinatları
const MERKEZ_OFIS = {
  lat: 39.81408397827491,
  lng: 33.48881297116444,
  name: 'Canga Merkez Ofis'
};

// Haversine formülü ile mesafe hesaplama
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Metre veya kilometre olarak döndür
  if (distance < 1) {
    return `${Math.round(distance * 1000)} metre`;
  }
  return `${distance.toFixed(2)} km`;
}

// Konum durumu belirleme
function getLocationStatus(distance) {
  const distanceNum = parseFloat(distance);
  
  if (distance.includes('metre')) {
    // 500 metre içinde = Yakın
    if (distanceNum <= 500) {
      return { status: 'success', label: 'Ofis İçinde', color: '#4caf50' };
    }
    // 1000 metre içinde = Normal
    if (distanceNum <= 1000) {
      return { status: 'warning', label: 'Ofis Yakını', color: '#ff9800' };
    }
  }
  
  // 1 km üzeri = Uzak
  if (distance.includes('km')) {
    if (distanceNum <= 1) {
      return { status: 'warning', label: 'Ofis Yakını', color: '#ff9800' };
    }
    if (distanceNum <= 5) {
      return { status: 'info', label: 'Şehir İçi', color: '#2196f3' };
    }
  }
  
  return { status: 'error', label: 'Uzak Konum', color: '#f44336' };
}

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default function SignatureDetailModal({ open, onClose, record }) {
  const [currentTab, setCurrentTab] = useState(0);
  
  if (!record) return null;
  
  // Personel bilgisini düzelt - employee veya employeeId olabilir
  const employee = record.employee || record.employeeId || {};
  const employeeName = employee?.adSoyad || 'Bilinmiyor';
  const employeePosition = employee?.pozisyon || '-';
  
  // İmza verisini çıkar
  const signatureData = record.checkIn?.signature || record.checkOut?.signature;
  const actionType = record.checkOut?.time ? 'checkOut' : 'checkIn';
  const actionData = record[actionType];
  
  // Koordinatları al
  const coordinates = actionData?.coordinates;
  const hasCoordinates = coordinates?.latitude && coordinates?.longitude;
  
  // Mesafe hesapla
  const distance = hasCoordinates 
    ? calculateDistance(
        MERKEZ_OFIS.lat, 
        MERKEZ_OFIS.lng,
        coordinates.latitude,
        coordinates.longitude
      )
    : null;
    
  const locationStatus = distance ? getLocationStatus(distance) : null;

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>İmza Detayları - ${employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .value { margin-left: 10px; }
            .signature { text-align: center; margin: 30px 0; }
            .signature img { max-width: 400px; border: 2px solid #ddd; padding: 10px; }
            .map-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Personel İmza Kayıt Detayları</h1>
            <p>${moment().format('DD MMMM YYYY HH:mm')}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Personel:</span>
              <span class="value">${employeeName}</span>
            </div>
            <div class="info-item">
              <span class="label">Pozisyon:</span>
              <span class="value">${employeePosition}</span>
            </div>
            <div class="info-item">
              <span class="label">İşlem:</span>
              <span class="value">${actionType === 'checkIn' ? 'Giriş' : 'Çıkış'}</span>
            </div>
            <div class="info-item">
              <span class="label">Tarih/Saat:</span>
              <span class="value">${moment(actionData?.time).format('DD.MM.YYYY HH:mm:ss')}</span>
            </div>
            <div class="info-item">
              <span class="label">Lokasyon:</span>
              <span class="value">${actionData?.location || '-'}</span>
            </div>
            <div class="info-item">
              <span class="label">Mesafe:</span>
              <span class="value">${distance || 'Bilinmiyor'}</span>
            </div>
          </div>
          
          ${hasCoordinates ? `
            <div class="map-info">
              <h3>Konum Bilgileri</h3>
              <p><strong>Koordinatlar:</strong> ${coordinates.latitude}, ${coordinates.longitude}</p>
              <p><strong>Merkez Ofise Uzaklık:</strong> ${distance}</p>
              <p><strong>Durum:</strong> ${locationStatus?.label}</p>
            </div>
          ` : ''}
          
          <div class="signature">
            <h3>İmza</h3>
            <img src="${signatureData}" alt="İmza" />
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };
  
  const handleDownload = () => {
    // İmza ve detayları PDF olarak indir
    const link = document.createElement('a');
    link.href = signatureData;
    link.download = `imza_${employeeName}_${moment(actionData?.time).format('YYYYMMDD_HHmm')}.png`;
    link.click();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #e0e0e0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'white', color: '#667eea' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {employeeName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {employeePosition}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Yazdır">
              <IconButton onClick={handlePrint} sx={{ color: 'white' }}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="İndir">
              <IconButton onClick={handleDownload} sx={{ color: 'white' }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, v) => setCurrentTab(v)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                minHeight: 60,
                fontSize: '1rem'
              }
            }}
          >
            <Tab 
              icon={<FingerprintIcon />} 
              label="İmza Detayları" 
              iconPosition="start"
            />
            <Tab 
              icon={<MapIcon />} 
              label="Konum Analizi" 
              iconPosition="start"
              disabled={!hasCoordinates}
            />
            <Tab 
              icon={<TimelineIcon />} 
              label="Teknik Detaylar" 
              iconPosition="start"
            />
            <Tab 
              icon={<AssessmentIcon />} 
              label="İstatistikler" 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* İmza Detayları Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Sol Taraf - İmza */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    <FingerprintIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Dijital İmza
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f5f5f5', 
                      borderRadius: 2,
                      textAlign: 'center'
                    }}
                  >
                    {signatureData ? (
                      <img 
                        src={signatureData} 
                        alt="İmza" 
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          background: 'white',
                          padding: '10px'
                        }}
                      />
                    ) : (
                      <Typography color="text.secondary">
                        İmza bulunamadı
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Sağ Taraf - Bilgiler */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    <TimeIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Kayıt Bilgileri
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {actionType === 'checkIn' ? 
                          <CheckCircle color="success" /> : 
                          <Cancel color="error" />
                        }
                      </ListItemIcon>
                      <ListItemText
                        primary="İşlem Tipi"
                        secondary={actionType === 'checkIn' ? 'GİRİŞ' : 'ÇIKIŞ'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <TimeIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Tarih & Saat"
                        secondary={moment(actionData?.time).format('DD MMMM YYYY, dddd - HH:mm:ss')}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Lokasyon"
                        secondary={actionData?.location || 'Belirtilmemiş'}
                      />
                    </ListItem>
                    
                    {distance && (
                      <ListItem>
                        <ListItemIcon>
                          <MyLocationIcon style={{ color: locationStatus?.color }} />
                        </ListItemIcon>
                      <ListItemText
                        primary="Merkez Ofise Uzaklık"
                        secondary={`${distance} - ${locationStatus?.label}`}
                        secondaryTypographyProps={{
                          component: 'div',
                          sx: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }
                        }}
                      />
                      </ListItem>
                    )}
                    
                    <ListItem>
                      <ListItemIcon>
                        <DeviceHubIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Kayıt Yöntemi"
                        secondary={actionData?.method || 'QR Kod'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
              
              {/* Durum Kartı */}
              <Card elevation={3} sx={{ mt: 2, bgcolor: locationStatus?.color, color: 'white' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6">
                        Konum Durumu
                      </Typography>
                      <Typography variant="h4" sx={{ mt: 1 }}>
                        {locationStatus?.label || 'Bilinmiyor'}
                      </Typography>
                    </Box>
                    <MyLocationIcon sx={{ fontSize: 48, opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Konum Analizi Tab */}
        <TabPanel value={currentTab} index={1}>
          {hasCoordinates && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {/* Konum İstatistikleri */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={3}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                      <LocationIcon color="primary" sx={{ fontSize: 32 }} />
                      <Typography variant="h6">{distance}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Merkez Ofise Uzaklık
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                      <MyLocationIcon sx={{ fontSize: 32, color: locationStatus?.color }} />
                      <Typography variant="h6">{locationStatus?.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Konum Durumu
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                      <SpeedIcon color="primary" sx={{ fontSize: 32 }} />
                      <Typography variant="h6">
                        {coordinates.latitude.toFixed(6)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enlem
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
                      <SpeedIcon color="primary" sx={{ fontSize: 32 }} />
                      <Typography variant="h6">
                        {coordinates.longitude.toFixed(6)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Boylam
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                {/* Harita */}
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      <MapIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Konum Haritası
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    
                    {/* Leaflet Harita Bileşeni */}
                    <LeafletMap 
                      coordinates={coordinates} 
                      employeeName={employeeName || 'Personel'}
                      showDetails={false}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
        
        {/* Teknik Detaylar Tab */}
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    <DeviceHubIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Cihaz Bilgileri
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Cihaz ID"
                        secondary={actionData?.deviceId || 'Bilinmiyor'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="IP Adresi"
                        secondary={actionData?.ipAddress || 'Bilinmiyor'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Kayıt Yöntemi"
                        secondary={actionData?.method || 'QR Kod'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    <RouterIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Sistem Bilgileri
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Kayıt ID"
                        secondary={record._id}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Oluşturulma"
                        secondary={moment(record.createdAt).format('DD.MM.YYYY HH:mm:ss')}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Son Güncelleme"
                        secondary={moment(record.updatedAt).format('DD.MM.YYYY HH:mm:ss')}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* İstatistikler Tab */}
        <TabPanel value={currentTab} index={3}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Personel bazlı detaylı istatistikler için raporlama sayfasını kullanınız.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" variant="caption">
                        Toplam Çalışma
                      </Typography>
                      <Typography variant="h5">
                        {record.workDuration ? 
                          `${Math.floor(record.workDuration / 60)}s ${record.workDuration % 60}dk` : 
                          '-'
                        }
                      </Typography>
                    </Box>
                    <TimeIcon color="primary" sx={{ fontSize: 32 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" variant="caption">
                        Durum
                      </Typography>
                      <Typography variant="h5">
                        {record.status || 'NORMAL'}
                      </Typography>
                    </Box>
                    <CheckCircle color="success" sx={{ fontSize: 32 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" variant="caption">
                        Anomali
                      </Typography>
                      <Typography variant="h5">
                        {record.anomalies?.length || 0}
                      </Typography>
                    </Box>
                    {record.anomalies?.length > 0 ? 
                      <Warning color="warning" sx={{ fontSize: 32 }} /> :
                      <CheckCircle color="success" sx={{ fontSize: 32 }} />
                    }
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} variant="outlined">
          Kapat
        </Button>
        <Button 
          onClick={handlePrint} 
          variant="contained"
          startIcon={<PrintIcon />}
        >
          Yazdır
        </Button>
        <Button 
          onClick={handleDownload}
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
        >
          İmzayı İndir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Paper,
  Container,
  IconButton, 
  Card,
  Stack,
  Divider,
  Chip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  FileDownload as DownloadIcon,
  Image as ImageIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  DirectionsBus as BusIcon,
  DriveEta as DriveIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-hot-toast';

function QuickRouteManual() {
  const printRef = useRef(null);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // 📋 Manuel Güzergah Bilgileri
  const [manualData, setManualData] = useState(() => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const dayName = today.toLocaleDateString('tr-TR', { weekday: 'long' });
    const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    return {
      mainTitle: `${dateStr} ${dayNameCapitalized} 16:00-24:00 Vardiya`,
      date: today.toISOString().split('T')[0],
      shiftTitle: '16:00-24:00 Vardiya',
      serviceTitle: 'Servis Güzergah ve Hareket Saati',
      departureTime: '15.20',
      firstStop: 'Ceyarın Benzinlik',
      stops: [
        'Ceyarın Benzinlik',
        'Çorbacı Ali Dayı',
        'Dispanser',
        'Nokta A101',
        'Fırınlı Camii',
        'Tandırlık',
        'Rektörlük',
        'Fabrika'
      ],
      driverName: 'Ahmet Duman',
      driverPhone1: '0 546 118 40 97',
      driverPhone2: '71 S 0097',
      notes: ''
    };
  });

  // 🆕 Yeni Durak Ekle
  const [newStop, setNewStop] = useState('');

  // 📅 Tarih değiştiğinde başlığı otomatik güncelle
  const handleDateChange = (newDate) => {
    const date = new Date(newDate);
    const dateStr = date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
    const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    setManualData(prev => ({
      ...prev,
      date: newDate,
      mainTitle: `${dateStr} ${dayNameCapitalized} ${prev.shiftTitle}`
    }));
  };

  // 🕐 Vardiya değiştiğinde başlığı otomatik güncelle
  const handleShiftChange = (newShift) => {
    const date = new Date(manualData.date);
    const dateStr = date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long' });
    const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    setManualData(prev => ({
      ...prev,
      shiftTitle: newShift,
      mainTitle: `${dateStr} ${dayNameCapitalized} ${newShift}`
    }));
  };

  const handleAddStop = () => {
    if (newStop.trim()) {
      setManualData(prev => ({
        ...prev,
        stops: [...prev.stops, newStop.trim()]
      }));
      setNewStop('');
      toast.success('Durak eklendi');
    }
  };

  const handleRemoveStop = (index) => {
    setManualData(prev => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index)
    }));
    toast.success('Durak silindi');
  };

  const handleMoveStopUp = (index) => {
    if (index === 0) return;
    const newStops = [...manualData.stops];
    [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
    setManualData(prev => ({ ...prev, stops: newStops }));
  };

  const handleMoveStopDown = (index) => {
    if (index === manualData.stops.length - 1) return;
    const newStops = [...manualData.stops];
    [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
    setManualData(prev => ({ ...prev, stops: newStops }));
  };

  // 📥 Export fonksiyonları
  const handleExcelDownload = async () => {
    setDownloadLoading(true);
    const loadingToast = toast.loading('Excel oluşturuluyor...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-route/export/excel-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualData })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Manuel_Guzergah_${manualData.date.replace(/-/g, '')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('📊 Excel dosyası indirildi!', { id: loadingToast });
      } else {
        throw new Error('Excel oluşturulamadı');
      }
    } catch (error) {
      toast.error('Excel dosyası oluşturulamadı', { id: loadingToast });
    } finally {
      setDownloadLoading(false);
    }
  };


  const handlePNGDownload = async () => {
    const loadingToast = toast.loading('Profesyonel PNG oluşturuluyor...');
    setDownloadLoading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Önizlemeyi aç ve render olmasını bekle
      setPreviewDialog(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (printRef.current) {
        const canvas = await html2canvas(printRef.current, {
          scale: 3, // Yüksek kalite için scale artırıldı
          backgroundColor: 'transparent',
          logging: false,
          useCORS: true,
          allowTaint: true,
          removeContainer: true,
          imageTimeout: 0,
          width: printRef.current.scrollWidth,
          height: printRef.current.scrollHeight
        });
        
        canvas.toBlob((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = `Guzergah_${manualData.date.replace(/-/g, '')}_${new Date().getTime()}.png`;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success('🖼️ Profesyonel PNG görseli indirildi!', { id: loadingToast });
          setPreviewDialog(false);
        }, 'image/png', 1.0); // Maksimum kalite
      }
    } catch (error) {
      console.error('PNG export hatası:', error);
      toast.error('PNG dosyası oluşturulamadı: ' + error.message, { id: loadingToast });
      setPreviewDialog(false);
    } finally {
      setDownloadLoading(false);
    }
  };


  // 🎨 Profesyonel Önizleme Şablonu
  const renderProfessionalPreview = () => {
    return (
      <Box
        ref={printRef}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 5,
          borderRadius: 3,
          minHeight: '600px',
          position: 'relative',
          fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif'
        }}
      >
        {/* Profesyonel Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'white',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}
        >
          {/* Üst Banner - Gradient */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              p: 3,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)'
              }
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 800,
                textAlign: 'center',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: '1.4rem'
              }}
            >
              🏢 ÇANGA SAVUNMA SANAYİ
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'center',
                fontWeight: 600,
                mt: 0.5,
                fontSize: '0.95rem'
              }}
            >
              Servis Güzergah Çizelgesi
            </Typography>
          </Box>

          {/* İçerik Alanı */}
          <Box sx={{ p: 4 }}>
            {/* Ana Başlık */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderLeft: '4px solid #3b82f6',
                p: 2.5,
                borderRadius: 2,
                mb: 3
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: '#1e3a8a',
                  fontWeight: 700,
                  fontSize: '1.1rem'
                }}
              >
                📅 {manualData.mainTitle}
              </Typography>
            </Box>

            {/* Bilgi Kartları */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box
                  sx={{
                    background: '#fef3c7',
                    borderLeft: '3px solid #f59e0b',
                    p: 2,
                    borderRadius: 1.5
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#92400e',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    ⏰ Hareket Saati
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#78350f',
                      fontWeight: 800,
                      fontSize: '1.3rem',
                      mt: 0.5
                    }}
                  >
                    {manualData.departureTime}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{
                    background: '#dbeafe',
                    borderLeft: '3px solid #3b82f6',
                    p: 2,
                    borderRadius: 1.5
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#1e3a8a',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    📍 İlk Durak
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#1e40af',
                      fontWeight: 700,
                      fontSize: '1rem',
                      mt: 0.5
                    }}
                  >
                    {manualData.firstStop}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Güzergah Durakları */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#1e3a8a',
                  fontWeight: 700,
                  mb: 2,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                🚌 Güzergah Durakları
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {manualData.stops.map((stop, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      background: index % 2 === 0 ? '#f8fafc' : '#ffffff',
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: '#e0f2fe',
                        borderColor: '#3b82f6'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <Typography
                        sx={{
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#1e293b',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      {stop}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 3, borderColor: '#e2e8f0' }} />

            {/* Şoför Bilgileri */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: 2,
                p: 3,
                border: '2px solid #fbbf24'
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: '#78350f',
                  fontWeight: 700,
                  mb: 2,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                🚗 Şoför Bilgileri
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ color: '#92400e', mr: 1.5, fontSize: '1.3rem' }} />
                  <Typography
                    variant="body1"
                    sx={{ color: '#78350f', fontWeight: 700, fontSize: '1.05rem' }}
                  >
                    {manualData.driverName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ color: '#92400e', mr: 1.5, fontSize: '1.3rem' }} />
                  <Typography
                    variant="body1"
                    sx={{ color: '#78350f', fontWeight: 600, fontSize: '1rem' }}
                  >
                    {manualData.driverPhone1}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DriveIcon sx={{ color: '#92400e', mr: 1.5, fontSize: '1.3rem' }} />
                  <Typography
                    variant="body1"
                    sx={{ color: '#78350f', fontWeight: 600, fontSize: '1rem' }}
                  >
                    {manualData.driverPhone2}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Notlar */}
            {manualData.notes && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  background: '#f1f5f9',
                  borderRadius: 2,
                  borderLeft: '3px solid #64748b'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#475569',
                    fontWeight: 600,
                    display: 'block',
                    mb: 1
                  }}
                >
                  📝 Notlar:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.6 }}
                >
                  {manualData.notes}
                </Typography>
              </Box>
            )}

            {/* Alt Bilgi */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                borderTop: '2px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Bu belge otomatik olarak oluşturulmuştur.
              </Typography>
              <Typography variant="caption" sx={{ color: '#3b82f6', fontWeight: 700 }}>
                {new Date().toLocaleString('tr-TR')}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Dekoratif Elemanlar */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
      </Box>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 4,
            background: alpha('#ffffff', 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#ffffff', 0.3)}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(26, 26, 46, 0.4)'
              }}
            >
              <DescriptionIcon sx={{ fontSize: 40, color: '#4ade80' }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>
                Manuel Güzergah Oluşturucu
              </Typography>
              <Typography variant="body1" sx={{ color: '#6b7280' }}>
                WhatsApp formatında özel güzergah listesi oluşturun
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Sol Panel - Form */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              {/* Genel Bilgiler */}
              <Card
                sx={{
                  background: alpha('#ffffff', 0.95),
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: `1px solid ${alpha('#ffffff', 0.3)}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha('#667eea', 0.1)}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    📋 Genel Bilgiler
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      label="Ana Başlık"
                      value={manualData.mainTitle}
                      onChange={(e) => setManualData(prev => ({ ...prev, mainTitle: e.target.value }))}
                      placeholder="27.10.2025 Pazartesi 16:00-24:00 Vardiya"
                      helperText="Tarih ve vardiya değiştirince otomatik güncellenir"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      type="date"
                      label="Tarih"
                      value={manualData.date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Vardiya Başlığı"
                      value={manualData.shiftTitle}
                      onChange={(e) => handleShiftChange(e.target.value)}
                      placeholder="16:00-24:00 Vardiya"
                      helperText="Başlık otomatik güncellenir"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Servis Başlığı"
                      value={manualData.serviceTitle}
                      onChange={(e) => setManualData(prev => ({ ...prev, serviceTitle: e.target.value }))}
                      placeholder="Servis Güzergah ve Hareket Saati"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Hareket Saati"
                      value={manualData.departureTime}
                      onChange={(e) => setManualData(prev => ({ ...prev, departureTime: e.target.value }))}
                      placeholder="15.20"
                      InputProps={{
                        startAdornment: <ScheduleIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="İlk Durak"
                      value={manualData.firstStop}
                      onChange={(e) => setManualData(prev => ({ ...prev, firstStop: e.target.value }))}
                      placeholder="Ceyarın Benzinlik"
                      InputProps={{
                        startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Stack>
                </Box>
              </Card>

              {/* Şoför Bilgileri */}
              <Card
                sx={{
                  background: alpha('#ffffff', 0.95),
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: `1px solid ${alpha('#ffffff', 0.3)}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha('#667eea', 0.1)}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    🚗 Şoför Bilgileri
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      label="Şoför Adı"
                      value={manualData.driverName}
                      onChange={(e) => setManualData(prev => ({ ...prev, driverName: e.target.value }))}
                      placeholder="Ahmet Duman"
                      InputProps={{
                        startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Telefon 1"
                      value={manualData.driverPhone1}
                      onChange={(e) => setManualData(prev => ({ ...prev, driverPhone1: e.target.value }))}
                      placeholder="0 546 118 40 97"
                      InputProps={{
                        startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Telefon 2 / Plaka"
                      value={manualData.driverPhone2}
                      onChange={(e) => setManualData(prev => ({ ...prev, driverPhone2: e.target.value }))}
                      placeholder="71 S 0097"
                      InputProps={{
                        startAdornment: <DriveIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Notlar (Opsiyonel)"
                      value={manualData.notes}
                      onChange={(e) => setManualData(prev => ({ ...prev, notes: e.target.value }))}
                      multiline
                      rows={2}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Stack>
                </Box>
              </Card>

              {/* Durak Listesi */}
              <Card
                sx={{
                  background: alpha('#ffffff', 0.95),
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: `1px solid ${alpha('#ffffff', 0.3)}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha('#667eea', 0.1)}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    📍 Duraklar
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  {/* Yeni Durak Ekle */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Yeni Durak"
                      value={newStop}
                      onChange={(e) => setNewStop(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddStop()}
                      placeholder="Durak adı girin..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddStop}
                      sx={{
                        minWidth: 56,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      }}
                    >
                      <AddIcon />
                    </Button>
                  </Box>

                  {/* Durak Listesi */}
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {manualData.stops.map((stop, index) => (
                      <ListItem
                        key={index}
                        sx={{
                          mb: 1,
                          borderRadius: 2,
                          border: `1px solid ${alpha('#667eea', 0.2)}`,
                          background: alpha('#667eea', 0.05)
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={index + 1}
                                size="small"
                                sx={{
                                  bgcolor: '#667eea',
                                  color: 'white',
                                  fontWeight: 700,
                                  minWidth: 32
                                }}
                              />
                              <Typography sx={{ fontWeight: 600 }}>{stop}</Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveStopUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleMoveStopDown(index)}
                            disabled={index === manualData.stops.length - 1}
                          >
                            <ArrowDownIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveStop(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Card>

              {/* Export Buttons */}
              <Card
                sx={{
                  background: alpha('#ffffff', 0.95),
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  border: `1px solid ${alpha('#ffffff', 0.3)}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha('#667eea', 0.1)}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    📥 Profesyonel Dışa Aktar
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.5 }}>
                    Yüksek kaliteli Excel ve PNG çıktıları
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {/* Excel Export */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleExcelDownload}
                      disabled={downloadLoading}
                      startIcon={<DownloadIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        fontWeight: 700,
                        py: 2,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: '0 12px 28px rgba(16, 185, 129, 0.5)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      📊 Excel Tablosu İndir
                    </Button>

                    {/* PNG Export */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handlePNGDownload}
                      disabled={downloadLoading}
                      startIcon={<ImageIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        fontWeight: 700,
                        py: 2,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: '0 12px 28px rgba(59, 130, 246, 0.5)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      🖼️ PNG Görsel İndir
                    </Button>

                    {/* Bilgilendirme */}
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        background: alpha('#3b82f6', 0.05),
                        border: `1px solid ${alpha('#3b82f6', 0.1)}`
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#1e40af',
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        💡 İpucu:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#475569',
                          display: 'block',
                          lineHeight: 1.5
                        }}
                      >
                        PNG görseli yüksek çözünürlükte oluşturulur ve WhatsApp, Telegram gibi platformlarda paylaşmak için idealdir.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Card>
            </Stack>
          </Grid>

          {/* Sağ Panel - Profesyonel Önizleme */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: alpha('#ffffff', 0.95),
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: `1px solid ${alpha('#ffffff', 0.3)}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: 20
              }}
            >
              <Box sx={{ p: 3, borderBottom: `1px solid ${alpha('#667eea', 0.1)}` }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                  ✨ Profesyonel Önizleme
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mt: 0.5 }}>
                  PNG çıktınız bu şekilde görünecek
                </Typography>
              </Box>
              <Box sx={{ p: 2, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
                {renderProfessionalPreview()}
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Preview Dialog */}
        <Dialog
          open={previewDialog}
          onClose={() => setPreviewDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        >
          <DialogTitle
            sx={{
              color: 'white',
              fontWeight: 700,
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            ✨ Profesyonel Önizleme - PNG Çıktısı
          </DialogTitle>
          <DialogContent sx={{ p: 3, bgcolor: 'transparent' }}>
            {renderProfessionalPreview()}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Button
              onClick={() => setPreviewDialog(false)}
              sx={{
                color: 'white',
                borderRadius: 2,
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Kapat
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default QuickRouteManual;


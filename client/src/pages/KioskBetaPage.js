import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
  Container,
  TextField,
  Autocomplete,
  IconButton,
  Grid,
  Card,
  LinearProgress,
  InputAdornment,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Badge
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  LocationOn,
  Login,
  Logout,
  MyLocation,
  Business,
  Person,
  Badge as BadgeIcon,
  Search,
  Dialpad,
  Fullscreen,
  FullscreenExit,
  ArrowBack,
  Close,
  TouchApp,
  Backspace,
  KeyboardReturn,
  Groups,
  Speed,
  FlashOn
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';
import toast from 'react-hot-toast';

moment.locale('tr');

/**
 * 🚀 KİOSK BETA MODU - Ultra Hızlı Terminal
 * 
 * Normal Kiosk'tan farkları:
 * - İmza YOK
 * - Geç kalma sebebi YOK
 * - Sadece 2 adım: İsim seç → Onayla
 * - Çok basit ve hızlı
 */

// Numpad bileşeni
const NumericKeypad = ({ value, onChange, onSubmit, onClear }) => {
  const handleKeyPress = (key) => {
    if (key === 'clear') {
      onClear();
    } else if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === 'enter') {
      onSubmit();
    } else {
      onChange(value + key);
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace']
  ];

  return (
    <Box sx={{ maxWidth: 300, mx: 'auto' }}>
      {keys.map((row, rowIndex) => (
        <Box key={rowIndex} display="flex" justifyContent="center" gap={1} mb={1}>
          {row.map((key) => (
            <Button
              key={key}
              variant={key === 'enter' ? 'contained' : 'outlined'}
              onClick={() => handleKeyPress(key)}
              sx={{
                width: 80,
                height: 60,
                fontSize: key === 'clear' || key === 'backspace' ? '0.9rem' : '1.5rem',
                fontWeight: 'bold',
                borderRadius: 2
              }}
            >
              {key === 'clear' ? 'Sil' : key === 'backspace' ? <Backspace /> : key}
            </Button>
          ))}
        </Box>
      ))}
      <Button
        variant="contained"
        color="success"
        fullWidth
        onClick={onSubmit}
        sx={{ height: 56, fontSize: '1.1rem', fontWeight: 'bold', mt: 1 }}
        startIcon={<KeyboardReturn />}
      >
        Onayla
      </Button>
    </Box>
  );
};

// Ana Kiosk Beta Bileşeni
const KioskBetaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL'den şube bilgisi al
  const defaultBranch = searchParams.get('branch') || 'MERKEZ';
  
  // Temel durumlar
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  
  // Çalışan verileri
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [todayRecords, setTodayRecords] = useState([]);
  
  // Giriş modu
  const [entryMode, setEntryMode] = useState('search'); // 'search', 'pin', 'department'
  const [pinValue, setPinValue] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
  // İşlem türü ve adımlar
  const [actionType, setActionType] = useState('CHECK_IN');
  const [step, setStep] = useState('select'); // 'select', 'confirm', 'success', 'error'
  
  // İşlem durumları
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  
  // Konum
  const [coordinates, setCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');

  // Saat güncelleme
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Veri yükleme
  useEffect(() => {
    loadData();
    requestLocation();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Çalışanları yükle
      const empResponse = await api.get('/api/employees', { 
        params: { durum: 'all', limit: 1000 } 
      });
      const empData = empResponse.data?.data || [];
      const activeEmployees = Array.isArray(empData) 
        ? empData.filter(e => e.durum === 'AKTIF')
        : [];
      setEmployees(activeEmployees);
      
      // Departmanları çıkar
      const depts = [...new Set(activeEmployees.map(e => e.departman).filter(Boolean))];
      setDepartments(depts.sort());
      
      // Bugünkü kayıtları yükle
      const recordsResponse = await api.get('/api/attendance/daily', {
        params: { date: moment().format('YYYY-MM-DD') }
      });
      setTodayRecords(recordsResponse.data?.records || []);
      
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationStatus('success');
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  // Tam ekran toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Çalışan bugün giriş yapmış mı kontrol et
  const getEmployeeStatus = useCallback((employeeId) => {
    const record = todayRecords.find(r => r.employeeId?._id === employeeId);
    if (!record) return { hasCheckedIn: false, hasCheckedOut: false };
    return {
      hasCheckedIn: !!record.checkIn?.time,
      hasCheckedOut: !!record.checkOut?.time,
      checkInTime: record.checkIn?.time,
      checkOutTime: record.checkOut?.time
    };
  }, [todayRecords]);

  // PIN ile çalışan bul
  const findEmployeeByPin = () => {
    if (!pinValue || pinValue.length < 3) {
      toast.error('En az 3 karakter girin');
      return;
    }
    
    const found = employees.find(
      e => e.tcNo?.includes(pinValue) || 
           e.employeeId?.includes(pinValue) ||
           e.sicilNo?.includes(pinValue)
    );
    
    if (found) {
      handleEmployeeSelect(found);
    } else {
      toast.error('Çalışan bulunamadı');
      setPinValue('');
    }
  };

  // Çalışan seçildiğinde - direkt onay ekranına geç
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    
    const status = getEmployeeStatus(employee._id);
    
    if (status.hasCheckedOut) {
      setError('Bugün zaten giriş ve çıkış yapmışsınız.');
      setStep('error');
      return;
    }
    
    if (status.hasCheckedIn) {
      setActionType('CHECK_OUT');
    } else {
      setActionType('CHECK_IN');
    }
    
    // Beta modda direkt onay ekranına geç
    setStep('confirm');
  };

  // Giriş/Çıkış işlemi - imzasız ve basit
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        employeeId: selectedEmployee._id,
        method: 'TABLET',
        location: selectedEmployee.lokasyon || currentBranch,
        branch: currentBranch,
        signature: null, // İmza yok
        coordinates: coordinates,
        additionalData: {
          entryMethod: 'KIOSK_BETA', // Beta mod olarak işaretle
          hasSignature: false,
          noSignatureReason: 'KIOSK_BETA_MODE',
          tcNo: selectedEmployee.tcNo,
          employeeCode: selectedEmployee.employeeId || selectedEmployee.sicilNo,
          notes: '[KIOSK BETA - Hızlı Giriş]',
          kioskId: 'KIOSK-BETA-001',
          submittedAt: new Date().toISOString()
        }
      };
      
      const endpoint = actionType === 'CHECK_IN' 
        ? '/api/attendance/check-in' 
        : '/api/attendance/check-out';
      
      const response = await api.post(endpoint, payload);
      
      setSuccessData({
        employee: selectedEmployee,
        actionType: actionType,
        time: new Date(),
        response: response.data
      });
      
      setStep('success');
      playSound(actionType === 'CHECK_IN' ? 'success' : 'checkout');
      
      // 4 saniye sonra sıfırla (Beta modda daha hızlı)
      setTimeout(() => resetForm(), 4000);
      
    } catch (err) {
      console.error('İşlem hatası:', err);
      setError(err.response?.data?.error || 'İşlem başarısız');
      setStep('error');
      playSound('error');
    } finally {
      setSubmitting(false);
    }
  };

  // Formu sıfırla
  const resetForm = () => {
    setSelectedEmployee(null);
    setStep('select');
    setEntryMode('search');
    setPinValue('');
    setSelectedDepartment(null);
    setError(null);
    setSuccessData(null);
    loadData();
  };

  // Sesli bildirim
  const playSound = (type) => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Şube renkleri - Beta için turuncu tema
  const branchColor = '#e65100'; // Turuncu - Beta vurgusu
  const branchEmoji = currentBranch === 'IŞIL' ? '🏢' : '🏭';
  const branchName = currentBranch === 'IŞIL' ? 'Işıl Şube' : 'Merkez Şube';

  // Loading
  if (loading) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ background: `linear-gradient(180deg, ${branchColor} 0%, ${branchColor}dd 100%)` }}
      >
        <Box textAlign="center" color="white">
          <CircularProgress size={60} sx={{ color: 'white', mb: 3 }} />
          <Typography variant="h5">Yükleniyor...</Typography>
        </Box>
      </Box>
    );
  }

  // ==========================================
  // BAŞARI EKRANI
  // ==========================================
  if (step === 'success' && successData) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ 
          background: actionType === 'CHECK_IN'
            ? 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)'
            : 'linear-gradient(180deg, #b71c1c 0%, #c62828 50%, #d32f2f 100%)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          <Paper sx={{ p: 6, maxWidth: 500, textAlign: 'center', borderRadius: 4, mx: 2 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle sx={{ fontSize: 120, color: 'success.main', mb: 3 }} />
            </motion.div>
            
            <Typography variant="h3" fontWeight="bold" gutterBottom color="success.main">
              {actionType === 'CHECK_IN' ? '✅ Giriş Başarılı' : '👋 Çıkış Başarılı'}
            </Typography>
            
            <Avatar 
              src={successData.employee?.profilePhoto} 
              sx={{ width: 100, height: 100, mx: 'auto', my: 3, fontSize: 40 }}
            >
              {successData.employee?.adSoyad?.charAt(0)}
            </Avatar>
            
            <Typography variant="h4" fontWeight="medium">
              {successData.employee?.adSoyad}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {successData.employee?.pozisyon}
            </Typography>
            
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 4, my: 3 }}>
              <Typography variant="h1" fontWeight="bold" color="primary.main">
                {moment(successData.time).format('HH:mm')}
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {moment(successData.time).format('DD MMMM YYYY, dddd')}
              </Typography>
            </Box>
            
            <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
              <Chip 
                label={`${branchEmoji} ${branchName}`}
                color={currentBranch === 'IŞIL' ? 'secondary' : 'primary'}
                sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}
              />
              <Chip 
                label="⚡ Beta Hızlı Giriş"
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '1rem', 
                  py: 2,
                  bgcolor: '#e65100',
                  color: 'white'
                }}
              />
            </Box>
            
            <LinearProgress sx={{ mt: 4, borderRadius: 1 }} />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Ekran otomatik kapanıyor...
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // ==========================================
  // HATA EKRANI
  // ==========================================
  if (step === 'error') {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ background: 'linear-gradient(180deg, #b71c1c 0%, #d32f2f 100%)' }}
      >
        <Paper sx={{ p: 5, maxWidth: 450, textAlign: 'center', borderRadius: 4, mx: 2 }}>
          <Cancel sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom color="error.main">
            İşlem Başarısız
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {error || 'Bir hata oluştu.'}
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={resetForm}
            sx={{ mt: 2, px: 6 }}
          >
            Tekrar Dene
          </Button>
        </Paper>
      </Box>
    );
  }

  // ==========================================
  // ONAY EKRANI (Beta'da imza yok, direkt onay)
  // ==========================================
  if (step === 'confirm' && selectedEmployee) {
    return (
      <Box 
        minHeight="100vh" 
        sx={{ 
          background: actionType === 'CHECK_IN'
            ? 'linear-gradient(180deg, #2e7d32 0%, #388e3c 100%)'
            : 'linear-gradient(180deg, #c62828 0%, #d32f2f 100%)',
          pb: 4
        }}
      >
        {/* Header */}
        <Box sx={{ pt: 3, pb: 2, px: 3, color: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h4" fontWeight="bold" letterSpacing={2}>
                ⚡ ÇANGA BETA
              </Typography>
              <Chip 
                label="Hızlı Giriş"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>
            
            <IconButton onClick={resetForm} sx={{ color: 'white' }}>
              <Close fontSize="large" />
            </IconButton>
          </Box>
          
          {/* Saat */}
          <Box textAlign="center" mt={2}>
            <Typography 
              variant="h1" 
              fontWeight="bold"
              sx={{ fontSize: { xs: '3rem', md: '4rem' }, letterSpacing: 4 }}
            >
              {moment(currentTime).format('HH:mm:ss')}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {moment(currentTime).format('DD MMMM YYYY, dddd')}
            </Typography>
          </Box>
        </Box>

        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              {/* Çalışan Bilgisi */}
              <Box 
                sx={{ 
                  background: 'white',
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <Avatar 
                  src={selectedEmployee?.profilePhoto} 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto', 
                    mb: 2, 
                    border: `4px solid ${actionType === 'CHECK_IN' ? '#4caf50' : '#f44336'}`,
                    fontSize: 48
                  }}
                >
                  {selectedEmployee?.adSoyad?.charAt(0)}
                </Avatar>
                
                <Typography variant="h3" fontWeight="bold" gutterBottom>
                  {selectedEmployee?.adSoyad}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {selectedEmployee?.pozisyon}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedEmployee?.departman} • {branchName}
                </Typography>

                <Chip
                  icon={actionType === 'CHECK_IN' ? <Login /> : <Logout />}
                  label={actionType === 'CHECK_IN' ? 'GİRİŞ YAPILIYOR' : 'ÇIKIŞ YAPILIYOR'}
                  color={actionType === 'CHECK_IN' ? 'success' : 'error'}
                  sx={{ mt: 2, fontWeight: 'bold', fontSize: '1.1rem', py: 3, px: 2 }}
                />
              </Box>

              {/* Onay Alanı */}
              <Box sx={{ p: 4, bgcolor: 'grey.50' }}>
                <Alert 
                  severity="info" 
                  icon={<FlashOn />}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="body1">
                    <strong>⚡ Beta Modu:</strong> İmza ve ek bilgi gerekmez. 
                    Sadece onaylayın!
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      onClick={resetForm}
                      sx={{ py: 2.5, fontSize: '1.1rem' }}
                      startIcon={<ArrowBack />}
                    >
                      İptal
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleSubmit}
                      disabled={submitting}
                      sx={{ 
                        py: 2.5,
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        bgcolor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                        '&:hover': {
                          bgcolor: actionType === 'CHECK_IN' ? 'success.dark' : 'error.dark'
                        }
                      }}
                      startIcon={submitting ? <CircularProgress size={24} color="inherit" /> : <CheckCircle />}
                    >
                      {submitting ? 'Kaydediliyor...' : 'ONAYLA'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    );
  }

  // ==========================================
  // ANA EKRAN - ÇALIŞAN SEÇİMİ
  // ==========================================
  return (
    <Box 
      minHeight="100vh" 
      sx={{ 
        background: `linear-gradient(180deg, ${branchColor} 0%, ${branchColor}dd 100%)`,
        pb: 4
      }}
    >
      {/* Header */}
      <Box sx={{ pt: 3, pb: 2, px: 3, color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h3" fontWeight="bold" letterSpacing={2}>
              ⚡ ÇANGA BETA
            </Typography>
            <Chip 
              label={branchName}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            <Chip 
              label="Hızlı Giriş"
              icon={<Speed sx={{ color: 'white !important' }} />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.3)', 
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              size="small"
              icon={locationStatus === 'success' ? <MyLocation /> : <LocationOn />}
              label={locationStatus === 'success' ? 'GPS ✓' : 'GPS...'}
              sx={{ 
                bgcolor: locationStatus === 'success' ? 'success.main' : 'rgba(255,255,255,0.2)', 
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
            
            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            
            <IconButton 
              onClick={() => navigate('/qr-imza-yonetimi')} 
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </Box>
        </Box>
        
        {/* Saat */}
        <Box textAlign="center" mt={2}>
          <Typography 
            variant="h1" 
            fontWeight="bold"
            sx={{ fontSize: { xs: '4rem', md: '6rem' }, letterSpacing: 4 }}
          >
            {moment(currentTime).format('HH:mm:ss')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {moment(currentTime).format('DD MMMM YYYY, dddd')}
          </Typography>
        </Box>
      </Box>

      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Beta Modu Bilgisi */}
            <Alert 
              severity="warning" 
              icon={<FlashOn />}
              sx={{ 
                borderRadius: 0,
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">
                  <strong>⚡ Beta Modu Aktif:</strong> İmza ve geç kalma sebebi gerektirmez. Sadece isim seçin ve onaylayın!
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/kiosk?branch=${currentBranch}`)}
                  variant="outlined"
                >
                  Normal Kiosk'a Geç
                </Button>
              </Box>
            </Alert>

            {/* Giriş Modu Seçimi */}
            <Box sx={{ bgcolor: 'grey.100', p: 2 }}>
              <Tabs 
                value={entryMode} 
                onChange={(_, v) => setEntryMode(v)}
                variant="fullWidth"
                sx={{
                  '& .MuiTab-root': { 
                    py: 2, 
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }
                }}
              >
                <Tab 
                  value="search" 
                  icon={<Search />} 
                  label="İsim Ara" 
                  iconPosition="start"
                />
                <Tab 
                  value="pin" 
                  icon={<Dialpad />} 
                  label="Sicil/TC No" 
                  iconPosition="start"
                />
                <Tab 
                  value="department" 
                  icon={<Groups />} 
                  label="Departman" 
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <Box sx={{ p: 4 }}>
              {/* İsim Arama Modu */}
              {entryMode === 'search' && (
                <Box>
                  <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center" mb={3}>
                    <TouchApp sx={{ mr: 1, verticalAlign: 'middle' }} />
                    İsminizi Arayın ve Seçin
                  </Typography>
                  
                  <Autocomplete
                    options={employees}
                    getOptionLabel={(o) => o.adSoyad || ''}
                    onChange={(_, v) => v && handleEmployeeSelect(v)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="İsim yazın..."
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontSize: '1.3rem',
                            py: 1
                          }
                        }}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ fontSize: 28, color: 'grey.500' }} />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const status = getEmployeeStatus(option._id);
                      const { key, ...rest } = props;
                      return (
                        <ListItem key={key} {...rest} sx={{ py: 2 }}>
                          <ListItemAvatar>
                            <Badge
                              badgeContent={status.hasCheckedIn ? (status.hasCheckedOut ? '✓✓' : '✓') : ''}
                              color={status.hasCheckedOut ? 'default' : 'success'}
                            >
                              <Avatar src={option?.profilePhoto} sx={{ width: 50, height: 50 }}>
                                {option?.adSoyad?.charAt(0)}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="h6" fontWeight="medium">
                                {option?.adSoyad}
                              </Typography>
                            }
                            secondary={`${option?.pozisyon} • ${option?.departman || '-'}`}
                          />
                          {status.hasCheckedIn && !status.hasCheckedOut && (
                            <Chip label="İçeride" color="success" size="small" />
                          )}
                          {status.hasCheckedOut && (
                            <Chip label="Çıkış yaptı" color="default" size="small" />
                          )}
                        </ListItem>
                      );
                    }}
                    noOptionsText="Sonuç yok"
                    ListboxProps={{ style: { maxHeight: 400 } }}
                  />
                </Box>
              )}

              {/* PIN/Sicil No Modu */}
              {entryMode === 'pin' && (
                <Box>
                  <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center" mb={3}>
                    <Dialpad sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Sicil veya TC Numaranızı Girin
                  </Typography>
                  
                  <TextField
                    fullWidth
                    value={pinValue}
                    placeholder="Sicil No veya TC'nin son 4 hanesi"
                    variant="outlined"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '2rem',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        letterSpacing: 8
                      },
                      '& input': {
                        textAlign: 'center'
                      }
                    }}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ fontSize: 28 }} />
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  <NumericKeypad
                    value={pinValue}
                    onChange={setPinValue}
                    onSubmit={findEmployeeByPin}
                    onClear={() => setPinValue('')}
                  />
                </Box>
              )}

              {/* Departman Modu */}
              {entryMode === 'department' && (
                <Box>
                  <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center" mb={3}>
                    <Groups sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Departmanınızı Seçin
                  </Typography>
                  
                  {!selectedDepartment ? (
                    <Grid container spacing={2}>
                      {departments.map((dept) => (
                        <Grid item xs={6} sm={4} md={3} key={dept}>
                          <Card
                            onClick={() => setSelectedDepartment(dept)}
                            sx={{
                              cursor: 'pointer',
                              p: 2,
                              textAlign: 'center',
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: 'warning.light',
                                transform: 'scale(1.02)'
                              }
                            }}
                          >
                            <Typography variant="body1" fontWeight="bold">
                              {dept}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employees.filter(e => e.departman === dept).length} kişi
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box>
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <IconButton onClick={() => setSelectedDepartment(null)}>
                          <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" fontWeight="bold">
                          {selectedDepartment}
                        </Typography>
                      </Box>
                      
                      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {employees
                          .filter(e => e.departman === selectedDepartment)
                          .map((employee) => {
                            const status = getEmployeeStatus(employee._id);
                            return (
                              <ListItemButton
                                key={employee._id}
                                onClick={() => handleEmployeeSelect(employee)}
                                sx={{ py: 2, borderRadius: 2, mb: 1 }}
                              >
                                <ListItemAvatar>
                                  <Avatar src={employee?.profilePhoto} sx={{ width: 50, height: 50 }}>
                                    {employee?.adSoyad?.charAt(0)}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={employee?.adSoyad}
                                  secondary={employee?.pozisyon}
                                />
                                {status.hasCheckedIn && !status.hasCheckedOut && (
                                  <Chip label="İçeride" color="success" size="small" />
                                )}
                                {status.hasCheckedOut && (
                                  <Chip label="Çıkış yaptı" color="default" size="small" />
                                )}
                              </ListItemButton>
                            );
                          })}
                      </List>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Alt bilgi */}
            <Box sx={{ bgcolor: 'grey.100', p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                ⚡ Beta Modu • {branchEmoji} {branchName} • Bugün: {employees.length} aktif çalışan • 
                Giriş yapan: {todayRecords.filter(r => r.checkIn?.time).length}
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>

      {/* Copyright */}
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block', 
          textAlign: 'center', 
          mt: 4, 
          color: 'rgba(255,255,255,0.6)' 
        }}
      >
        © 2025 Çanga Savunma Endüstrisi • Kiosk Terminal Beta v1.0
      </Typography>
    </Box>
  );
};

export default KioskBetaPage;


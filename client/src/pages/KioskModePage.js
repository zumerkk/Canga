import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Fade,
  Slide,
  InputAdornment,
  Divider,
  Badge,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Timer,
  LocationOn,
  Refresh,
  Login,
  Logout,
  Warning,
  MyLocation,
  Fingerprint,
  Business,
  Schedule,
  Person,
  Badge as BadgeIcon,
  Search,
  Dialpad,
  AccessTime,
  HealthAndSafety,
  Note,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  ArrowBack,
  CheckCircleOutline,
  ErrorOutline,
  Info,
  Close,
  TouchApp,
  Backspace,
  KeyboardReturn,
  Speed,
  SupervisorAccount,
  Groups
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';
import toast from 'react-hot-toast';

moment.locale('tr');

/**
 * 🖥️ KİOSK MODU - Tablet Terminal Sayfası
 * 
 * QR kod taramadan giriş-çıkış yapılabilir.
 * Yaşlı veya teknoloji becerisi düşük çalışanlar için tasarlandı.
 * 
 * Özellikler:
 * - İsim arama ile çalışan seçimi
 * - PIN/Sicil No ile hızlı giriş
 * - Departman bazlı liste görünümü
 * - Gelişmiş veri toplama (geç kalma sebebi, notlar vb.)
 * - Tam ekran modu
 * - Sesli geri bildirim
 */

// Geç kalma sebepleri
const LATE_REASONS = [
  { value: 'TRAFFIC', label: '🚗 Trafik', icon: '🚗' },
  { value: 'HEALTH', label: '🏥 Sağlık sorunu', icon: '🏥' },
  { value: 'FAMILY', label: '👨‍👩‍👧 Ailevi sebepler', icon: '👨‍👩‍👧' },
  { value: 'TRANSPORT', label: '🚌 Ulaşım problemi', icon: '🚌' },
  { value: 'WEATHER', label: '🌧️ Hava koşulları', icon: '🌧️' },
  { value: 'OTHER', label: '📝 Diğer', icon: '📝' }
];

// Çıkış sebepleri
const EARLY_LEAVE_REASONS = [
  { value: 'HEALTH', label: '🏥 Sağlık sorunu', icon: '🏥' },
  { value: 'FAMILY', label: '👨‍👩‍👧 Ailevi acil durum', icon: '👨‍👩‍👧' },
  { value: 'APPOINTMENT', label: '📅 Randevu', icon: '📅' },
  { value: 'PERMISSION', label: '✅ İzinli', icon: '✅' },
  { value: 'OTHER', label: '📝 Diğer', icon: '📝' }
];

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

// Ana Kiosk Bileşeni
const KioskModePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signaturePadRef = useRef(null);
  
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
  const [step, setStep] = useState('select'); // 'select', 'details', 'signature', 'success', 'error'
  
  // Ek bilgiler
  const [lateReason, setLateReason] = useState('');
  const [earlyLeaveReason, setEarlyLeaveReason] = useState('');
  const [notes, setNotes] = useState('');
  const [healthDeclaration, setHealthDeclaration] = useState(true);
  
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
    
    // TC No veya Sicil No ile ara
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

  // Çalışan seçildiğinde
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    
    // Bugünkü durumunu kontrol et
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
    
    setStep('details');
  };

  // İmza adımına geç
  const proceedToSignature = () => {
    // Geç kalma sebebi artık tamamen opsiyonel
    // Sadece bilgilendirme amaçlı kontrol (engellemez)
    if (actionType === 'CHECK_IN' && !lateReason) {
      const now = moment();
      const shiftStart = moment().hour(8).minute(0);
      
      // Saat 08:15'ten sonra ve sebep seçilmemişse bilgilendirme göster (ama engelleme)
      if (now.isAfter(shiftStart.add(15, 'minutes'))) {
        // Sadece konsola log, kullanıcıyı engelleme
        console.log('Geç giriş - sebep belirtilmedi');
      }
    }
    
    setStep('signature');
  };

  // İmza gönder (imzalı veya imzasız)
  const handleSubmit = async (skipSignature = false) => {
    // İmzasız giriş değilse ve imza boşsa uyar
    if (!skipSignature && signaturePadRef.current?.isEmpty()) {
      toast.error('Lütfen imza atın veya "İmzasız Devam Et" butonunu kullanın');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // İmza verisi (imzasız girişte null)
      const signatureData = skipSignature ? null : signaturePadRef.current?.toDataURL('image/png');
      const hasSignature = !skipSignature && !signaturePadRef.current?.isEmpty();
      
      const payload = {
        employeeId: selectedEmployee._id,
        method: 'TABLET',
        location: selectedEmployee.lokasyon || currentBranch,
        branch: currentBranch,
        signature: signatureData,
        coordinates: coordinates,
        additionalData: {
          entryMethod: 'KIOSK',
          hasSignature: hasSignature, // 🆕 İmza var mı?
          noSignatureReason: skipSignature ? 'KIOSK_NO_TOUCH' : undefined, // 🆕 İmzasız sebep
          tcNo: selectedEmployee.tcNo, // 🆕 TC No kaydediliyor
          employeeCode: selectedEmployee.employeeId || selectedEmployee.sicilNo, // 🆕 Sicil No
          lateReason: actionType === 'CHECK_IN' ? lateReason : undefined,
          earlyLeaveReason: actionType === 'CHECK_OUT' ? earlyLeaveReason : undefined,
          notes: skipSignature 
            ? `[İMZASIZ GİRİŞ - TC: ${selectedEmployee.tcNo}] ${notes || ''}`.trim()
            : (notes || undefined),
          healthDeclaration: healthDeclaration,
          kioskId: 'KIOSK-001',
          submittedAt: new Date().toISOString()
        }
      };
      
      // Giriş veya çıkış endpoint'ine gönder
      const endpoint = actionType === 'CHECK_IN' 
        ? '/api/attendance/check-in' 
        : '/api/attendance/check-out';
      
      const response = await api.post(endpoint, payload);
      
      setSuccessData({
        employee: selectedEmployee,
        actionType: actionType,
        time: new Date(),
        response: response.data,
        hasSignature: hasSignature // 🆕 Başarı ekranında göster
      });
      
      setStep('success');
      
      // Sesli bildirim
      playSound(actionType === 'CHECK_IN' ? 'success' : 'checkout');
      
      // 5 saniye sonra sıfırla
      setTimeout(() => resetForm(), 5000);
      
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
    setLateReason('');
    setEarlyLeaveReason('');
    setNotes('');
    setHealthDeclaration(true);
    setError(null);
    setSuccessData(null);
    signaturePadRef.current?.clear();
    
    // Kayıtları yenile
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

  // Şube renkleri
  const branchColor = currentBranch === 'IŞIL' ? '#7b1fa2' : '#1565c0';
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
              
              {/* İmzasız giriş göstergesi */}
              {!successData.hasSignature && (
                <Chip 
                  label="📝 İmzasız Giriş"
                  color="warning"
                  sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}
                />
              )}
            </Box>
            
            {/* İmzasız giriş bilgisi */}
            {!successData.hasSignature && (
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="body2">
                  TC: <strong>{successData.employee?.tcNo}</strong> ile kaydedildi
                </Typography>
              </Alert>
            )}
            
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
  // ANA EKRAN
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
              {branchEmoji} ÇANGA
            </Typography>
            <Chip 
              label={branchName}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {/* Konum durumu */}
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
            
            {/* Tam ekran */}
            <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
            
            {/* Çıkış */}
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
        {/* ADIM: ÇALIŞAN SEÇİMİ */}
        {step === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
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
                                  bgcolor: 'primary.light',
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
                  {branchEmoji} {branchName} • Bugün: {employees.length} aktif çalışan • 
                  Giriş yapan: {todayRecords.filter(r => r.checkIn?.time).length}
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* ADIM: EK BİLGİLER */}
        {step === 'details' && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
              {/* Çalışan Bilgisi */}
              <Box 
                sx={{ 
                  background: actionType === 'CHECK_IN' 
                    ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                    : 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
                  color: 'white',
                  p: 4,
                  textAlign: 'center'
                }}
              >
                <Avatar 
                  src={selectedEmployee?.profilePhoto} 
                  sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '4px solid white' }}
                >
                  {selectedEmployee?.adSoyad?.charAt(0)}
                </Avatar>
                <Typography variant="h4" fontWeight="bold">
                  {selectedEmployee?.adSoyad}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  {selectedEmployee?.pozisyon}
                </Typography>
                <Chip
                  label={actionType === 'CHECK_IN' ? '🟢 GİRİŞ YAPILIYOR' : '🔴 ÇIKIŞ YAPILIYOR'}
                  sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
                />
              </Box>

              <Box sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ek Bilgiler
                </Typography>

                <Grid container spacing={3} mt={1}>
                  {/* Geç Kalma Sebebi (Giriş için) */}
                  {actionType === 'CHECK_IN' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Geç mi kaldınız? (Opsiyonel)
                      </Typography>
                      <Grid container spacing={1}>
                        {LATE_REASONS.map((reason) => (
                          <Grid item xs={6} sm={4} key={reason.value}>
                            <Card
                              onClick={() => setLateReason(lateReason === reason.value ? '' : reason.value)}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                textAlign: 'center',
                                border: 2,
                                borderColor: lateReason === reason.value ? 'warning.main' : 'transparent',
                                bgcolor: lateReason === reason.value ? 'warning.light' : 'grey.50',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Typography variant="h4">{reason.icon}</Typography>
                              <Typography variant="body2">{reason.label.replace(reason.icon + ' ', '')}</Typography>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  )}

                  {/* Erken Çıkış Sebebi (Çıkış için) */}
                  {actionType === 'CHECK_OUT' && moment().hour() < 17 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        <Logout sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Erken mi çıkıyorsunuz? (Opsiyonel)
                      </Typography>
                      <Grid container spacing={1}>
                        {EARLY_LEAVE_REASONS.map((reason) => (
                          <Grid item xs={6} sm={4} key={reason.value}>
                            <Card
                              onClick={() => setEarlyLeaveReason(earlyLeaveReason === reason.value ? '' : reason.value)}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                textAlign: 'center',
                                border: 2,
                                borderColor: earlyLeaveReason === reason.value ? 'warning.main' : 'transparent',
                                bgcolor: earlyLeaveReason === reason.value ? 'warning.light' : 'grey.50',
                                transition: 'all 0.2s'
                              }}
                            >
                              <Typography variant="h4">{reason.icon}</Typography>
                              <Typography variant="body2">{reason.label.replace(reason.icon + ' ', '')}</Typography>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  )}

                  {/* Not */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Not (Opsiyonel)"
                      placeholder="Eklemek istediğiniz bir not var mı?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Note />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                </Grid>

                {/* Butonlar */}
                <Box display="flex" gap={2} mt={4}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={resetForm}
                    sx={{ flex: 1, py: 2 }}
                    startIcon={<ArrowBack />}
                  >
                    Geri
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={proceedToSignature}
                    sx={{ 
                      flex: 2, 
                      py: 2,
                      bgcolor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                      '&:hover': {
                        bgcolor: actionType === 'CHECK_IN' ? 'success.dark' : 'error.dark'
                      }
                    }}
                    endIcon={<Fingerprint />}
                  >
                    İmza Adımına Geç
                  </Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* ADIM: İMZA */}
        {step === 'signature' && selectedEmployee && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
              {/* Başlık */}
              <Box 
                sx={{ 
                  background: actionType === 'CHECK_IN' 
                    ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
                    : 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
                  color: 'white',
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Avatar 
                  src={selectedEmployee?.profilePhoto} 
                  sx={{ width: 60, height: 60, border: '3px solid white' }}
                >
                  {selectedEmployee?.adSoyad?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedEmployee?.adSoyad}
                  </Typography>
                  <Typography sx={{ opacity: 0.9 }}>
                    {actionType === 'CHECK_IN' ? 'Giriş İmzası' : 'Çıkış İmzası'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center">
                  <Fingerprint sx={{ mr: 1, verticalAlign: 'middle' }} />
                  İmzanızı Atın (Opsiyonel)
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    💡 <strong>Dokunmatik ekran yoksa:</strong> "İmzasız Devam Et" butonuna tıklayabilirsiniz. 
                    TC numaranız ({selectedEmployee?.tcNo}) otomatik kaydedilecektir.
                  </Typography>
                </Alert>
                
                <Box display="flex" justifyContent="flex-end" mb={1}>
                  <Button 
                    size="small" 
                    onClick={() => signaturePadRef.current?.clear()}
                    startIcon={<Refresh />}
                  >
                    Temizle
                  </Button>
                </Box>
                
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    borderWidth: 3,
                    borderColor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                    mb: 3
                  }}
                >
                  <SignatureCanvas
                    ref={signaturePadRef}
                    canvasProps={{
                      width: Math.min(window.innerWidth - 80, 700),
                      height: 200,
                      style: { 
                        display: 'block', 
                        background: '#fafafa',
                        touchAction: 'none'
                      }
                    }}
                    penColor="#333"
                    minWidth={2}
                    maxWidth={4}
                  />
                </Paper>

                {/* Butonlar */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      onClick={() => setStep('details')}
                      sx={{ py: 2 }}
                      startIcon={<ArrowBack />}
                    >
                      Geri
                    </Button>
                  </Grid>
                  
                  {/* İmzasız Devam Et Butonu */}
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      onClick={() => handleSubmit(true)}
                      disabled={submitting}
                      sx={{ 
                        py: 2,
                        borderColor: 'warning.main',
                        color: 'warning.dark',
                        '&:hover': {
                          borderColor: 'warning.dark',
                          bgcolor: 'warning.light'
                        }
                      }}
                      startIcon={<BadgeIcon />}
                    >
                      İmzasız Devam Et
                    </Button>
                  </Grid>
                  
                  {/* İmzalı Giriş Butonu */}
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => handleSubmit(false)}
                      disabled={submitting}
                      sx={{ 
                        py: 2,
                        fontSize: '1.1rem',
                        bgcolor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                        '&:hover': {
                          bgcolor: actionType === 'CHECK_IN' ? 'success.dark' : 'error.dark'
                        }
                      }}
                      startIcon={submitting ? <CircularProgress size={24} color="inherit" /> : (actionType === 'CHECK_IN' ? <Login /> : <Logout />)}
                    >
                      {submitting ? 'Kaydediliyor...' : (actionType === 'CHECK_IN' ? 'İmzalı Giriş' : 'İmzalı Çıkış')}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </motion.div>
        )}
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
        © 2025 Çanga Savunma Endüstrisi • Kiosk Terminal v1.0
      </Typography>
    </Box>
  );
};

export default KioskModePage;


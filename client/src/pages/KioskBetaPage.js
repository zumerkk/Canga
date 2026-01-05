import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  CardContent,
  LinearProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Badge,
  Fab,
  Zoom,
  Fade,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
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
  FlashOn,
  VolumeUp,
  VolumeOff,
  Help,
  Refresh,
  AccessTime,
  History,
  Star,
  Visibility,
  Phone,
  Warning,
  Info
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

moment.locale('tr');

/**
 * 🚀 ENTERPRISE KİOSK BETA - Ultra Kolay Giriş Sistemi
 * 
 * Yaşlı, acemi ve teknoloji zorluğu yaşayan kullanıcılar için:
 * - ULTRA BÜYÜK butonlar ve yazılar
 * - Sesli yönlendirme ve geri bildirim
 * - Minimalist ve sade arayüz
 * - Son giriş yapanlar hızlı listesi
 * - Otomatik reset ile geri sayım
 * - Animasyonlu başarı/hata ekranları
 * - Yardım ve acil durum butonu
 * - 2 adımlı süper basit akış
 */

// ============================================
// CONSTANTS & CONFIG
// ============================================
const CONFIG = {
  AUTO_RESET_SECONDS: 4, // 4 saniye sonra otomatik ana ekrana dön
  SEARCH_DEBOUNCE_MS: 300,
  RECENT_EMPLOYEES_COUNT: 8,
  FONT_SIZE_MEGA: '4rem',
  FONT_SIZE_LARGE: '2.5rem',
  FONT_SIZE_MEDIUM: '1.5rem',
  BUTTON_HEIGHT: 80,
  AVATAR_SIZE_LARGE: 140,
  AVATAR_SIZE_MEDIUM: 80,
};

// ============================================
// VOICE HELPER - Sesli Yönlendirme
// ============================================
const VoiceHelper = {
  enabled: true,
  
  speak(text) {
    if (!this.enabled || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to use Turkish voice if available
    const voices = window.speechSynthesis.getVoices();
    const turkishVoice = voices.find(v => v.lang.includes('tr'));
    if (turkishVoice) utterance.voice = turkishVoice;
    
    window.speechSynthesis.speak(utterance);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
};

// ============================================
// SOUND HELPER
// ============================================
const playSound = (type) => {
  try {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch (e) {}
};

// ============================================
// LARGE NUMERIC KEYPAD
// ============================================
const LargeNumericKeypad = ({ value, onChange, onSubmit, onClear }) => {
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
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace']
  ];

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
      {keys.map((row, rowIndex) => (
        <Box key={rowIndex} display="flex" justifyContent="center" gap={2} mb={2}>
          {row.map((key) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                onClick={() => handleKeyPress(key)}
                sx={{
                  width: 100,
                  height: 80,
                  fontSize: key === 'clear' || key === 'backspace' ? '1.2rem' : '2rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  bgcolor: key === 'clear' ? 'error.main' : key === 'backspace' ? 'warning.main' : 'grey.800',
                  '&:hover': {
                    bgcolor: key === 'clear' ? 'error.dark' : key === 'backspace' ? 'warning.dark' : 'grey.900',
                  }
                }}
              >
                {key === 'clear' ? 'TEMİZLE' : key === 'backspace' ? '⌫' : key}
              </Button>
            </motion.div>
          ))}
        </Box>
      ))}
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={onSubmit}
          sx={{ 
            height: 70, 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            mt: 2,
            borderRadius: 3
          }}
          startIcon={<KeyboardReturn sx={{ fontSize: 32 }} />}
        >
          ONAYLA
        </Button>
      </motion.div>
    </Box>
  );
};

// ============================================
// RECENT EMPLOYEES QUICK LIST
// ============================================
const RecentEmployeesList = ({ employees, onSelect, getStatus }) => {
  if (!employees || employees.length === 0) return null;

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom display="flex" alignItems="center" gap={1}>
        <History color="primary" />
        Son Giriş Yapanlar
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Hızlı seçim için dokunun
      </Typography>
      
      <Grid container spacing={2}>
        {employees.slice(0, CONFIG.RECENT_EMPLOYEES_COUNT).map((emp) => {
          const status = getStatus(emp._id);
          return (
            <Grid item xs={6} sm={4} md={3} key={emp._id}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Card
                  onClick={() => onSelect(emp)}
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    p: 2,
                    border: status.hasCheckedIn && !status.hasCheckedOut 
                      ? '3px solid #4caf50' 
                      : status.hasCheckedOut 
                        ? '3px solid #9e9e9e'
                        : '2px solid transparent',
                    opacity: status.hasCheckedOut ? 0.6 : 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Badge
                    badgeContent={status.hasCheckedIn ? (status.hasCheckedOut ? '✓✓' : '✓') : ''}
                    color={status.hasCheckedOut ? 'default' : 'success'}
                  >
                    <Avatar 
                      src={emp.profilePhoto}
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        mx: 'auto', 
                        mb: 1,
                        fontSize: 24,
                        bgcolor: status.hasCheckedIn ? 'success.main' : 'primary.main'
                      }}
                    >
                      {emp.adSoyad?.charAt(0)}
                    </Avatar>
                  </Badge>
                  <Typography variant="body2" fontWeight="bold" noWrap>
                    {emp.adSoyad?.split(' ')[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {emp.pozisyon?.substring(0, 15) || '-'}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

// ============================================
// COUNTDOWN TIMER - Reliable auto-reset with setInterval
// ============================================
const CountdownTimer = ({ seconds, onComplete, label }) => {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    // Reset state on mount
    hasCompletedRef.current = false;
    setRemaining(seconds);

    // Start interval
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const newValue = prev - 1;
        if (newValue <= 0 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          // Clear interval before calling onComplete
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          // Use setTimeout to ensure state updates complete
          setTimeout(() => {
            onComplete();
          }, 100);
        }
        return Math.max(0, newValue);
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [seconds, onComplete]);

  const progress = ((seconds - remaining) / seconds) * 100;

  return (
    <Box textAlign="center" mt={2}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={70}
          thickness={5}
          sx={{ color: 'rgba(255,255,255,0.2)' }}
        />
        <CircularProgress
          variant="determinate"
          value={progress}
          size={70}
          thickness={5}
          sx={{ 
            color: 'white',
            position: 'absolute',
            left: 0,
            transition: 'none' // Remove animation for accurate display
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="white">
            {remaining}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" color="white" mt={1} sx={{ opacity: 0.8 }}>
        {label}
      </Typography>
    </Box>
  );
};

// ============================================
// HELP DIALOG
// ============================================
const HelpDialog = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
      <Help sx={{ fontSize: 48, mb: 1 }} />
      <Typography variant="h5" fontWeight="bold">Yardım</Typography>
    </DialogTitle>
    <DialogContent sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        📱 Nasıl Kullanılır?
      </Typography>
      
      <Box mb={3}>
        <Typography variant="body1" paragraph>
          <strong>1️⃣ Adım:</strong> Listeden isminizi bulun veya arayın
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>2️⃣ Adım:</strong> İsminize dokunun
        </Typography>
        <Typography variant="body1" paragraph>
          <strong>3️⃣ Adım:</strong> Yeşil "ONAYLA" butonuna basın
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom fontWeight="bold">
        📞 Sorun mu yaşıyorsunuz?
      </Typography>
      <Alert severity="info" icon={<Phone />}>
        <Typography variant="body1">
          <strong>İK Departmanı:</strong> Dahili 100
        </Typography>
      </Alert>
    </DialogContent>
    <DialogActions sx={{ p: 3 }}>
      <Button 
        variant="contained" 
        onClick={onClose} 
        size="large"
        fullWidth
        sx={{ py: 2, fontSize: '1.2rem' }}
      >
        ANLADIM
      </Button>
    </DialogActions>
  </Dialog>
);

// ============================================
// MAIN COMPONENT
// ============================================
const KioskBetaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const { autoLoginForKiosk } = useAuth();
  
  // URL'den şube bilgisi
  const defaultBranch = searchParams.get('branch') || 'MERKEZ';
  
  // Core State
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Data State
  const [employees, setEmployees] = useState([]);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  
  // Mode State
  const [entryMode, setEntryMode] = useState('search'); // 'search', 'recent', 'pin'
  const [pinValue, setPinValue] = useState('');
  
  // Action State
  const [actionType, setActionType] = useState('CHECK_IN');
  const [step, setStep] = useState('select'); // 'select', 'confirm', 'success', 'error'
  
  // Processing State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  
  // Location State
  const [coordinates, setCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  
  // Dialog State
  const [helpOpen, setHelpOpen] = useState(false);

  // Branch colors
  const branchColor = '#e65100';
  const branchEmoji = currentBranch === 'IŞIL' ? '🏢' : '🏭';
  const branchName = currentBranch === 'IŞIL' ? 'Işıl Şube' : 'Merkez Şube';

  // ============================================
  // EFFECTS
  // ============================================
  
  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
    requestLocation();
    
    // Welcome message
    setTimeout(() => {
      VoiceHelper.speak('Hoş geldiniz. Giriş yapmak için isminizi arayın veya listeden seçin.');
    }, 500);

    return () => VoiceHelper.stop();
  }, []);

  // Kiosk modunda saatlik otomatik giriş
  useEffect(() => {
    // İlk yüklemede bir kez çalıştır
    if (autoLoginForKiosk) {
      autoLoginForKiosk();
    }

    // Her saatte bir otomatik giriş yap
    const interval = setInterval(() => {
      if (autoLoginForKiosk) {
        autoLoginForKiosk();
      }
    }, 3600000); // 1 saat = 3600000 ms

    return () => clearInterval(interval);
  }, [autoLoginForKiosk]);

  // Auto-focus search
  useEffect(() => {
    if (step === 'select' && entryMode === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [step, entryMode]);

  // ============================================
  // DATA FUNCTIONS
  // ============================================
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [empResponse, recordsResponse] = await Promise.all([
        api.get('/api/employees', { params: { durum: 'all', limit: 1000 } }),
        api.get('/api/attendance/daily', { params: { date: moment().format('YYYY-MM-DD') } })
      ]);
      
      const empData = empResponse.data?.data || [];
      const activeEmployees = Array.isArray(empData) 
        ? empData.filter(e => e.durum === 'AKTIF')
        : [];
      setEmployees(activeEmployees);
      
      const records = recordsResponse.data?.records || [];
      setTodayRecords(records);
      
      // Create recent employees list from today's records
      const recentIds = records
        .filter(r => r.checkIn?.time)
        .sort((a, b) => new Date(b.checkIn.time) - new Date(a.checkIn.time))
        .slice(0, 20)
        .map(r => r.employeeId?._id);
      
      const recent = activeEmployees.filter(e => recentIds.includes(e._id));
      setRecentEmployees(recent.length > 0 ? recent : activeEmployees.slice(0, CONFIG.RECENT_EMPLOYEES_COUNT));
      
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

  // ============================================
  // EMPLOYEE STATUS
  // ============================================
  
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

  // ============================================
  // HANDLERS
  // ============================================
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleVoice = () => {
    const newState = VoiceHelper.toggle();
    setVoiceEnabled(newState);
    toast.success(newState ? '🔊 Sesli yönlendirme açıldı' : '🔇 Sesli yönlendirme kapatıldı');
  };

  // Employee selection
  const handleEmployeeSelect = (employee) => {
    if (!employee) return;
    
    setSelectedEmployee(employee);
    const status = getEmployeeStatus(employee._id);
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(100);
    
    if (status.hasCheckedOut) {
      setError('Bugün zaten giriş ve çıkış yaptınız.');
      setStep('error');
      VoiceHelper.speak('Bugün zaten giriş ve çıkış yaptınız.');
      playSound('error');
      return;
    }
    
    if (status.hasCheckedIn) {
      setActionType('CHECK_OUT');
      VoiceHelper.speak(`${employee.adSoyad}. Çıkış yapmak için onaylayın.`);
    } else {
      setActionType('CHECK_IN');
      VoiceHelper.speak(`${employee.adSoyad}. Giriş yapmak için onaylayın.`);
    }
    
    setStep('confirm');
    playSound('notification');
  };

  // PIN search
  const handlePinSearch = () => {
    if (!pinValue || pinValue.length < 3) {
      toast.error('En az 3 karakter girin');
      VoiceHelper.speak('En az 3 karakter girmelisiniz.');
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
      VoiceHelper.speak('Çalışan bulunamadı. Tekrar deneyin.');
      setPinValue('');
    }
  };

  // Submit check-in/out
  const handleSubmit = async () => {
    if (!selectedEmployee) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const payload = {
        employeeId: selectedEmployee._id,
        method: 'TABLET',
        location: selectedEmployee.lokasyon || currentBranch,
        branch: currentBranch,
        signature: null,
        coordinates: coordinates,
        additionalData: {
          entryMethod: 'KIOSK_BETA_ENTERPRISE',
          hasSignature: false,
          noSignatureReason: 'KIOSK_BETA_MODE',
          tcNo: selectedEmployee.tcNo,
          employeeCode: selectedEmployee.employeeId || selectedEmployee.sicilNo,
          notes: '[KIOSK BETA ENTERPRISE - Hızlı Giriş]',
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
      
      // Success feedback
      playSound(actionType === 'CHECK_IN' ? 'success' : 'checkout');
      VoiceHelper.speak(
        actionType === 'CHECK_IN' 
          ? `${selectedEmployee.adSoyad}, giriş işleminiz başarılı. İyi çalışmalar!`
          : `${selectedEmployee.adSoyad}, çıkış işleminiz başarılı. İyi günler!`
      );
      
    } catch (err) {
      console.error('İşlem hatası:', err);
      setError(err.response?.data?.error || 'İşlem başarısız oldu');
      setStep('error');
      playSound('error');
      VoiceHelper.speak('İşlem başarısız. Lütfen tekrar deneyin veya yardım isteyin.');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedEmployee(null);
    setStep('select');
    setEntryMode('search');
    setPinValue('');
    setSearchValue('');
    setError(null);
    setSuccessData(null);
    VoiceHelper.stop();
    loadData();
  };

  // ============================================
  // LOADING SCREEN
  // ============================================
  if (loading) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ 
          background: `linear-gradient(135deg, ${branchColor} 0%, #bf360c 100%)` 
        }}
      >
        <Box textAlign="center" color="white">
          <CircularProgress size={80} sx={{ color: 'white', mb: 4 }} />
          <Typography variant="h3" fontWeight="bold">
            Yükleniyor...
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.8, mt: 2 }}>
            Lütfen bekleyin
          </Typography>
        </Box>
      </Box>
    );
  }

  // ============================================
  // SUCCESS SCREEN - Auto-redirect after 4 seconds
  // ============================================
  if (step === 'success' && successData) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        onClick={resetForm} // Tap anywhere to close faster
        sx={{ 
          background: actionType === 'CHECK_IN'
            ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)'
            : 'linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #d32f2f 100%)',
          cursor: 'pointer'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <Paper 
            onClick={(e) => e.stopPropagation()}
            sx={{ 
              p: { xs: 4, md: 6 }, 
              maxWidth: 550, 
              textAlign: 'center', 
              borderRadius: 5, 
              mx: 2,
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
            }}
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle sx={{ fontSize: 120, color: 'success.main', mb: 2 }} />
            </motion.div>
            
            {/* Success Message */}
            <Typography 
              variant="h3" 
              fontWeight="bold" 
              gutterBottom 
              color={actionType === 'CHECK_IN' ? 'success.main' : 'error.main'}
              sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' } }}
            >
              {actionType === 'CHECK_IN' ? '✅ GİRİŞ BAŞARILI!' : '👋 ÇIKIŞ BAŞARILI!'}
            </Typography>
            
            {/* Employee Info */}
            <Avatar 
              src={successData.employee?.profilePhoto} 
              sx={{ 
                width: 100, 
                height: 100, 
                mx: 'auto', 
                my: 2, 
                fontSize: 40,
                border: `4px solid ${actionType === 'CHECK_IN' ? '#4caf50' : '#f44336'}`,
              }}
            >
              {successData.employee?.adSoyad?.charAt(0)}
            </Avatar>
            
            <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              {successData.employee?.adSoyad}
            </Typography>
            
            {/* Time Box */}
            <Box 
              sx={{ 
                bgcolor: 'grey.100', 
                borderRadius: 3, 
                p: 3, 
                my: 3 
              }}
            >
              <Typography 
                variant="h2" 
                fontWeight="bold" 
                color="primary.main"
                sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, letterSpacing: 4 }}
              >
                {moment(successData.time).format('HH:mm')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {moment(successData.time).format('DD MMMM YYYY')}
              </Typography>
            </Box>
            
            {/* Branch Badge */}
            <Chip 
              label={`${branchEmoji} ${branchName}`}
              sx={{ fontWeight: 'bold', fontSize: '1rem', py: 2 }}
              color={currentBranch === 'IŞIL' ? 'secondary' : 'primary'}
            />

            {/* Countdown - Prominent */}
            <Box 
              sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                borderRadius: 3
              }}
            >
              <CountdownTimer
                seconds={CONFIG.AUTO_RESET_SECONDS}
                onComplete={resetForm}
                label="Otomatik yönlendiriliyor..."
              />
            </Box>

            {/* Quick close hint */}
            <Typography variant="caption" color="text.secondary" mt={2} display="block">
              Hemen kapatmak için ekrana dokunun
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // ============================================
  // ERROR SCREEN
  // ============================================
  if (step === 'error') {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper 
            sx={{ 
              p: { xs: 4, md: 6 }, 
              maxWidth: 500, 
              textAlign: 'center', 
              borderRadius: 4, 
              mx: 2 
            }}
          >
            <Cancel sx={{ fontSize: 120, color: 'error.main', mb: 3 }} />
            <Typography 
              variant="h3" 
              fontWeight="bold" 
              gutterBottom 
              color="error.main"
              sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}
            >
              İŞLEM BAŞARISIZ
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph sx={{ mt: 2 }}>
              {error || 'Bir hata oluştu.'}
            </Typography>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="contained" 
                size="large"
                onClick={resetForm}
                sx={{ 
                  mt: 4, 
                  py: 2.5, 
                  px: 6,
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  borderRadius: 3
                }}
                startIcon={<Refresh sx={{ fontSize: 28 }} />}
              >
                TEKRAR DENE
              </Button>
            </motion.div>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              Sorun devam ederse İK'ya başvurun: Dahili 100
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // ============================================
  // CONFIRM SCREEN
  // ============================================
  if (step === 'confirm' && selectedEmployee) {
    const isCheckIn = actionType === 'CHECK_IN';
    
    return (
      <Box 
        minHeight="100vh" 
        sx={{ 
          background: isCheckIn
            ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)'
            : 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)',
          pb: 4
        }}
      >
        {/* Header */}
        <Box sx={{ py: 3, px: 3, color: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight="bold" letterSpacing={2}>
              ⚡ ÇANGA ENTERPRISE
            </Typography>
            <IconButton onClick={resetForm} sx={{ color: 'white' }}>
              <Close sx={{ fontSize: 36 }} />
            </IconButton>
          </Box>
          
          {/* Time */}
          <Box textAlign="center" mt={2}>
            <Typography 
              sx={{ fontSize: { xs: '3.5rem', md: '5rem' }, fontWeight: 'bold', letterSpacing: 4 }}
            >
              {moment(currentTime).format('HH:mm:ss')}
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9 }}>
              {moment(currentTime).format('DD MMMM YYYY, dddd')}
            </Typography>
          </Box>
        </Box>

        <Container maxWidth="sm">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Paper 
              sx={{ 
                borderRadius: 5, 
                overflow: 'hidden', 
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)' 
              }}
            >
              {/* Employee Info */}
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <Avatar 
                  src={selectedEmployee?.profilePhoto} 
                  sx={{ 
                    width: CONFIG.AVATAR_SIZE_LARGE, 
                    height: CONFIG.AVATAR_SIZE_LARGE, 
                    mx: 'auto', 
                    mb: 3, 
                    border: `6px solid ${isCheckIn ? '#4caf50' : '#f44336'}`,
                    fontSize: 56,
                    boxShadow: `0 10px 30px ${isCheckIn ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'}`
                  }}
                >
                  {selectedEmployee?.adSoyad?.charAt(0)}
                </Avatar>
                
                <Typography 
                  variant="h3" 
                  fontWeight="bold" 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' } }}
                >
                  {selectedEmployee?.adSoyad}
                </Typography>
                <Typography variant="h5" color="text.secondary">
                  {selectedEmployee?.pozisyon}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {selectedEmployee?.departman} • {branchName}
                </Typography>

                <Chip
                  icon={isCheckIn ? <Login sx={{ fontSize: 28 }} /> : <Logout sx={{ fontSize: 28 }} />}
                  label={isCheckIn ? 'GİRİŞ YAPILIYOR' : 'ÇIKIŞ YAPILIYOR'}
                  color={isCheckIn ? 'success' : 'error'}
                  sx={{ 
                    mt: 3, 
                    fontWeight: 'bold', 
                    fontSize: '1.3rem', 
                    py: 4, 
                    px: 3,
                    '& .MuiChip-label': { px: 2 }
                  }}
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ p: 4, bgcolor: 'grey.50' }}>
                <Alert 
                  severity="info" 
                  icon={<FlashOn sx={{ fontSize: 32 }} />}
                  sx={{ mb: 4, py: 2, fontSize: '1.1rem' }}
                >
                  <Typography variant="body1" fontWeight="bold">
                    ⚡ Hızlı Mod: İmza gerekmez. Sadece onaylayın!
                  </Typography>
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        onClick={resetForm}
                        sx={{ 
                          py: 3, 
                          fontSize: '1.3rem',
                          fontWeight: 'bold',
                          borderRadius: 3,
                          borderWidth: 3,
                          '&:hover': { borderWidth: 3 }
                        }}
                        startIcon={<ArrowBack sx={{ fontSize: 32 }} />}
                      >
                        İPTAL
                      </Button>
                    </motion.div>
                  </Grid>
                  <Grid item xs={6}>
                    <motion.div 
                      whileHover={{ scale: 1.02 }} 
                      whileTap={{ scale: 0.98 }}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{ 
                          py: 3,
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          borderRadius: 3,
                          bgcolor: isCheckIn ? 'success.main' : 'error.main',
                          boxShadow: `0 8px 20px ${isCheckIn ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'}`,
                          '&:hover': {
                            bgcolor: isCheckIn ? 'success.dark' : 'error.dark',
                          }
                        }}
                        startIcon={submitting 
                          ? <CircularProgress size={28} color="inherit" /> 
                          : <CheckCircle sx={{ fontSize: 32 }} />
                        }
                      >
                        {submitting ? 'KAYDEDİLİYOR...' : 'ONAYLA'}
                      </Button>
                    </motion.div>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    );
  }

  // ============================================
  // MAIN SELECT SCREEN
  // ============================================
  return (
    <Box 
      minHeight="100vh" 
      sx={{ 
        background: `linear-gradient(135deg, ${branchColor} 0%, #bf360c 100%)`,
        pb: 4,
        position: 'relative'
      }}
    >
      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 1 }}>
        <Fab
          size="medium"
          onClick={toggleVoice}
          sx={{ bgcolor: voiceEnabled ? 'success.main' : 'grey.500', '&:hover': { bgcolor: voiceEnabled ? 'success.dark' : 'grey.600' } }}
        >
          {voiceEnabled ? <VolumeUp /> : <VolumeOff />}
        </Fab>
        <Fab
          size="medium"
          onClick={toggleFullscreen}
          sx={{ bgcolor: 'grey.800', '&:hover': { bgcolor: 'grey.900' } }}
        >
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </Fab>
        <Fab
          size="medium"
          color="primary"
          onClick={() => setHelpOpen(true)}
        >
          <Help />
        </Fab>
        <Fab
          size="medium"
          color="error"
          onClick={() => navigate('/qr-imza-yonetimi')}
        >
          <Close />
        </Fab>
      </Box>

      {/* Header */}
      <Box sx={{ pt: 4, pb: 3, px: 3, color: 'white', textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          fontWeight="bold" 
          letterSpacing={3}
          sx={{ fontSize: { xs: '2rem', md: '3rem' } }}
        >
          ⚡ ÇANGA GİRİŞ SİSTEMİ
        </Typography>
        <Box display="flex" justifyContent="center" gap={2} mt={2}>
          <Chip 
            label={branchName}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}
          />
          <Chip 
            label="Enterprise Beta"
            icon={<Speed sx={{ color: 'white !important' }} />}
            sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 'bold', fontSize: '1rem', '& .MuiChip-icon': { color: 'white' } }}
          />
          <Chip
            size="small"
            icon={locationStatus === 'success' ? <MyLocation /> : <LocationOn />}
            label={locationStatus === 'success' ? 'GPS ✓' : 'GPS...'}
            sx={{ bgcolor: locationStatus === 'success' ? 'success.main' : 'rgba(255,255,255,0.2)', color: 'white', '& .MuiChip-icon': { color: 'white' } }}
          />
        </Box>
        
        {/* Giant Clock */}
        <Typography 
          sx={{ 
            fontSize: { xs: '4rem', md: '7rem' }, 
            fontWeight: 'bold', 
            letterSpacing: 8,
            mt: 3,
            textShadow: '4px 4px 8px rgba(0,0,0,0.3)'
          }}
        >
          {moment(currentTime).format('HH:mm:ss')}
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.9 }}>
          {moment(currentTime).format('DD MMMM YYYY, dddd')}
        </Typography>
      </Box>

      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper 
            sx={{ 
              borderRadius: 5, 
              overflow: 'hidden', 
              boxShadow: '0 30px 60px rgba(0,0,0,0.4)' 
            }}
          >
            {/* Info Banner */}
            <Alert 
              severity="success" 
              icon={<FlashOn sx={{ fontSize: 32 }} />}
              sx={{ 
                borderRadius: 0,
                py: 2,
                '& .MuiAlert-message': { width: '100%', fontSize: '1.1rem' }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Typography variant="body1" fontWeight="bold">
                  ⚡ Hızlı Giriş Modu: İsminizi bulun → Seçin → Onaylayın
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/kiosk?branch=${currentBranch}`)}
                  variant="outlined"
                >
                  Detaylı Kiosk'a Geç
                </Button>
              </Box>
            </Alert>

            {/* Recent Employees */}
            {entryMode === 'search' && (
              <Box sx={{ p: 3 }}>
                <RecentEmployeesList
                  employees={recentEmployees}
                  onSelect={handleEmployeeSelect}
                  getStatus={getEmployeeStatus}
                />
              </Box>
            )}

            {/* Search Box */}
            <Box sx={{ px: 4, pb: 4 }}>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                textAlign="center" 
                mb={3}
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                gap={2}
              >
                <TouchApp sx={{ fontSize: 40 }} color="primary" />
                İSMİNİZİ ARAYIN VEYA SEÇİN
              </Typography>
              
              <Autocomplete
                options={employees}
                getOptionLabel={(o) => o.adSoyad || ''}
                inputValue={searchValue}
                onInputChange={(_, v) => setSearchValue(v)}
                onChange={(_, v) => v && handleEmployeeSelect(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={searchInputRef}
                    placeholder="İsminizi yazmaya başlayın..."
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1.5rem',
                        py: 1,
                        borderRadius: 3
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: 36, color: 'primary.main' }} />
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
                          <Avatar 
                            src={option?.profilePhoto} 
                            sx={{ 
                              width: 60, 
                              height: 60,
                              bgcolor: status.hasCheckedIn ? 'success.main' : 'primary.main'
                            }}
                          >
                            {option?.adSoyad?.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="h6" fontWeight="bold">
                            {option?.adSoyad}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body1" color="text.secondary">
                            {option?.pozisyon} • {option?.departman || '-'}
                          </Typography>
                        }
                        sx={{ ml: 2 }}
                      />
                      {status.hasCheckedIn && !status.hasCheckedOut && (
                        <Chip label="İçeride" color="success" sx={{ fontWeight: 'bold' }} />
                      )}
                      {status.hasCheckedOut && (
                        <Chip label="Çıkış yaptı" color="default" sx={{ fontWeight: 'bold' }} />
                      )}
                    </ListItem>
                  );
                }}
                noOptionsText="Sonuç bulunamadı"
                ListboxProps={{ style: { maxHeight: 400 } }}
              />

              {/* Alternative Entry */}
              <Divider sx={{ my: 4 }}>
                <Chip label="VEYA" />
              </Divider>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={() => setEntryMode(entryMode === 'pin' ? 'search' : 'pin')}
                    sx={{ 
                      py: 3, 
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      borderRadius: 3,
                      borderWidth: 2,
                      '&:hover': { borderWidth: 2 }
                    }}
                    startIcon={<Dialpad sx={{ fontSize: 32 }} />}
                  >
                    {entryMode === 'pin' ? 'ARAMAYA DÖN' : 'SİCİL/TC İLE GİRİŞ'}
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    color="secondary"
                    onClick={() => setHelpOpen(true)}
                    sx={{ 
                      py: 3, 
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      borderRadius: 3
                    }}
                    startIcon={<Help sx={{ fontSize: 32 }} />}
                  >
                    YARDIM İSTEYİN
                  </Button>
                </Grid>
              </Grid>

              {/* PIN Entry */}
              {entryMode === 'pin' && (
                <Box mt={4}>
                  <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
                    <Dialpad sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Sicil veya TC Numaranızı Girin
                  </Typography>
                  
                  <TextField
                    fullWidth
                    value={pinValue}
                    placeholder="Numara girin..."
                    variant="outlined"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '2.5rem',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        letterSpacing: 10,
                        borderRadius: 3
                      },
                      '& input': { textAlign: 'center' }
                    }}
                    InputProps={{ readOnly: true }}
                  />
                  
                  <LargeNumericKeypad
                    value={pinValue}
                    onChange={setPinValue}
                    onSubmit={handlePinSearch}
                    onClear={() => setPinValue('')}
                  />
                </Box>
              )}
            </Box>

            {/* Footer Stats */}
            <Box sx={{ bgcolor: 'grey.100', p: 3, textAlign: 'center' }}>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Chip 
                    label={`👥 ${employees.length} Çalışan`} 
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    label={`✅ ${todayRecords.filter(r => r.checkIn?.time).length} Giriş`} 
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    label={`🚪 ${todayRecords.filter(r => r.checkOut?.time).length} Çıkış`} 
                    color="error"
                    variant="outlined"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </motion.div>
      </Container>

      {/* Copyright */}
      <Typography 
        variant="body2" 
        sx={{ 
          display: 'block', 
          textAlign: 'center', 
          mt: 4, 
          color: 'rgba(255,255,255,0.7)' 
        }}
      >
        © 2025 Çanga Savunma Endüstrisi • Enterprise Kiosk Terminal v2.0
      </Typography>

      {/* Help Dialog */}
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  );
};

export default KioskBetaPage;

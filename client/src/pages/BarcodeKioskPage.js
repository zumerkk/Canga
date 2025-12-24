import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Grid,
  LinearProgress,
  Fade,
  TextField,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  QrCodeScanner,
  Login,
  Logout,
  Fullscreen,
  FullscreenExit,
  Close,
  AccessTime,
  Business,
  Person,
  TrendingUp,
  Group,
  Warning,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';
import toast from 'react-hot-toast';

moment.locale('tr');

/**
 * 📊 BARKOD KİOSK SAYFASI
 * 
 * Fabrika girişindeki barkod okuyucu terminal için
 * - Otomatik barkod algılama (USB barkod okuyucu)
 * - Hızlı giriş-çıkış
 * - Sesli geri bildirim
 * - Tam ekran modu
 */

const BarcodeKioskPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimeout = useRef(null);
  
  // URL'den şube bilgisi al
  const defaultBranch = searchParams.get('branch') || 'MERKEZ';
  
  // State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [loading, setLoading] = useState(false);
  
  // Barkod input state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScan, setLastScan] = useState(null);
  
  // İşlem sonucu
  const [result, setResult] = useState(null); // { success, data }
  const [showResult, setShowResult] = useState(false);
  
  // İstatistikler
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    totalCheckOuts: 0,
    currentlyInside: 0,
    lateArrivals: 0
  });
  const [recentActions, setRecentActions] = useState([]);
  
  // Saat güncelleme
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // İstatistikleri yükle
  useEffect(() => {
    loadStats();
    const statsInterval = setInterval(loadStats, 30000); // Her 30 saniyede güncelle
    return () => clearInterval(statsInterval);
  }, [currentBranch]);
  
  // Focus input on mount and after result
  useEffect(() => {
    focusInput();
  }, [showResult]);
  
  // Global keyboard listener for barcode scanner
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if input is focused (manual typing)
      if (document.activeElement === inputRef.current) return;
      
      // Barcode scanners typically send characters quickly followed by Enter
      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 3) {
          handleBarcodeScan(barcodeBuffer.current);
        }
        barcodeBuffer.current = '';
        return;
      }
      
      // Add character to buffer
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        
        // Clear buffer after 100ms of no input (barcode scanners are fast)
        clearTimeout(barcodeTimeout.current);
        barcodeTimeout.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100);
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);
  
  const focusInput = () => {
    setTimeout(() => {
      if (inputRef.current && !showResult) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  const loadStats = async () => {
    try {
      const response = await api.get('/api/barcode/daily-stats', {
        params: { branch: currentBranch }
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
        setRecentActions(response.data.recentActions || []);
      }
    } catch (error) {
      console.error('Stats yükleme hatası:', error);
    }
  };
  
  // Barkod tarama işlemi
  const handleBarcodeScan = async (barcode) => {
    if (!barcode || barcode.length < 3 || loading) return;
    
    const cleanBarcode = barcode.trim().toUpperCase();
    setLastScan(cleanBarcode);
    setLoading(true);
    
    try {
      const response = await api.post('/api/barcode/scan', {
        barcode: cleanBarcode,
        branch: currentBranch,
        deviceId: 'BARCODE_KIOSK_' + currentBranch
      });
      
      if (response.data.success) {
        setResult({
          success: true,
          data: response.data
        });
        playSound(response.data.actionType === 'CHECK_IN' ? 'checkin' : 'checkout');
        
        // İstatistikleri güncelle
        loadStats();
      } else {
        setResult({
          success: false,
          data: response.data
        });
        playSound('error');
      }
      
    } catch (error) {
      console.error('Barkod tarama hatası:', error);
      setResult({
        success: false,
        data: {
          error: error.response?.data?.error || 'Sistem hatası',
          errorCode: error.response?.data?.errorCode,
          hint: error.response?.data?.hint
        }
      });
      playSound('error');
    } finally {
      setLoading(false);
      setBarcodeInput('');
      setShowResult(true);
      
      // 4 saniye sonra sonucu gizle
      setTimeout(() => {
        setShowResult(false);
        setResult(null);
        focusInput();
      }, 4000);
    }
  };
  
  // Manuel input submit
  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput);
    }
  };
  
  // Sesli bildirim
  const playSound = (type) => {
    try {
      // Web Audio API ile basit ses
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'checkin') {
        oscillator.frequency.value = 880; // A5 - yüksek ton
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 1108; // C#6
        }, 100);
        setTimeout(() => oscillator.stop(), 200);
      } else if (type === 'checkout') {
        oscillator.frequency.value = 660; // E5
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 440; // A4
        }, 100);
        setTimeout(() => oscillator.stop(), 200);
      } else {
        // Error
        oscillator.frequency.value = 200;
        oscillator.type = 'square';
        gainNode.gain.value = 0.2;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
      }
    } catch (e) {
      console.log('Ses çalınamadı');
    }
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
  
  // Şube renkleri
  const branchColor = currentBranch === 'IŞIL' ? '#7b1fa2' : '#1565c0';
  const branchEmoji = currentBranch === 'IŞIL' ? '🏢' : '🏭';
  const branchName = currentBranch === 'IŞIL' ? 'Işıl Şube' : 'Merkez Şube';
  
  return (
    <Box 
      minHeight="100vh" 
      sx={{ 
        background: `linear-gradient(180deg, ${branchColor} 0%, ${branchColor}dd 100%)`,
        pb: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ pt: 2, pb: 1, px: 3, color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4" fontWeight="bold" letterSpacing={2}>
              {branchEmoji} ÇANGA PDKS
            </Typography>
            <Chip 
              label={branchName}
              icon={<Business sx={{ color: 'white !important' }} />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {/* Yenile */}
            <IconButton onClick={loadStats} sx={{ color: 'white' }}>
              <Refresh />
            </IconButton>
            
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
      </Box>
      
      {/* Saat */}
      <Box textAlign="center" sx={{ color: 'white', py: 2 }}>
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
      
      {/* Ana İçerik */}
      <Box sx={{ px: 3, maxWidth: 1400, mx: 'auto' }}>
        <Grid container spacing={3}>
          {/* Sol Panel - Barkod Tarama */}
          <Grid item xs={12} md={7}>
            <Paper 
              sx={{ 
                borderRadius: 4, 
                overflow: 'hidden',
                height: '100%',
                minHeight: 400
              }}
            >
              <AnimatePresence mode="wait">
                {showResult && result ? (
                  // SONUÇ EKRANI
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{ height: '100%' }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        background: result.success
                          ? (result.data.actionType === 'CHECK_IN'
                            ? 'linear-gradient(180deg, #1b5e20 0%, #2e7d32 100%)'
                            : 'linear-gradient(180deg, #b71c1c 0%, #c62828 100%)')
                          : 'linear-gradient(180deg, #424242 0%, #616161 100%)'
                      }}
                    >
                      {result.success ? (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                          >
                            <CheckCircle sx={{ fontSize: 120, color: 'white', mb: 2 }} />
                          </motion.div>
                          
                          <Typography variant="h2" fontWeight="bold" color="white" gutterBottom>
                            {result.data.actionType === 'CHECK_IN' ? '✅ GİRİŞ' : '👋 ÇIKIŞ'}
                          </Typography>
                          
                          <Avatar 
                            src={result.data.employee?.profilePhoto}
                            sx={{ 
                              width: 100, 
                              height: 100, 
                              mb: 2,
                              border: '4px solid white',
                              fontSize: 40
                            }}
                          >
                            {result.data.employee?.adSoyad?.charAt(0)}
                          </Avatar>
                          
                          <Typography variant="h3" fontWeight="bold" color="white">
                            {result.data.employee?.adSoyad}
                          </Typography>
                          <Typography variant="h5" color="rgba(255,255,255,0.9)">
                            {result.data.employee?.pozisyon}
                          </Typography>
                          
                          <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3, px: 4, py: 2, mt: 3 }}>
                            <Typography variant="h2" fontWeight="bold" color="white">
                              {moment(result.data.time).format('HH:mm')}
                            </Typography>
                          </Box>
                          
                          {result.data.workDuration && result.data.actionType === 'CHECK_OUT' && (
                            <Typography variant="h6" color="rgba(255,255,255,0.8)" mt={2}>
                              Çalışma Süresi: {result.data.workDuration}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <>
                          <Cancel sx={{ fontSize: 100, color: 'white', mb: 2 }} />
                          <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
                            İşlem Başarısız
                          </Typography>
                          <Typography variant="h5" color="rgba(255,255,255,0.9)" textAlign="center">
                            {result.data.error}
                          </Typography>
                          {result.data.hint && (
                            <Typography variant="body1" color="rgba(255,255,255,0.7)" mt={2}>
                              💡 {result.data.hint}
                            </Typography>
                          )}
                        </>
                      )}
                      
                      <LinearProgress 
                        sx={{ 
                          width: '100%', 
                          mt: 4, 
                          borderRadius: 1,
                          bgcolor: 'rgba(255,255,255,0.2)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'white'
                          }
                        }} 
                      />
                    </Box>
                  </motion.div>
                ) : (
                  // BARKOD BEKLEME EKRANI
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ height: '100%' }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        textAlign: 'center'
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={100} sx={{ mb: 3 }} />
                      ) : (
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.8, 1, 0.8]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          <QrCodeScanner sx={{ fontSize: 150, color: branchColor, mb: 2 }} />
                        </motion.div>
                      )}
                      
                      <Typography variant="h3" fontWeight="bold" gutterBottom>
                        {loading ? 'İşleniyor...' : 'KARTINIZI OKUTUN'}
                      </Typography>
                      
                      <Typography variant="h6" color="text.secondary" mb={4}>
                        Barkod kartınızı okuyucuya tutun
                      </Typography>
                      
                      {/* Manuel giriş alanı */}
                      <Box component="form" onSubmit={handleInputSubmit} sx={{ width: '100%', maxWidth: 400 }}>
                        <TextField
                          inputRef={inputRef}
                          fullWidth
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          placeholder="veya sicil numaranızı yazın"
                          variant="outlined"
                          autoFocus
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              fontSize: '1.5rem',
                              textAlign: 'center',
                              bgcolor: 'grey.100'
                            },
                            '& input': {
                              textAlign: 'center',
                              textTransform: 'uppercase'
                            }
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person />
                              </InputAdornment>
                            )
                          }}
                        />
                      </Box>
                      
                      {lastScan && (
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Son taranan: {lastScan}
                        </Typography>
                      )}
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Paper>
          </Grid>
          
          {/* Sağ Panel - İstatistikler */}
          <Grid item xs={12} md={5}>
            <Grid container spacing={2}>
              {/* İstatistik Kartları */}
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#e8f5e9' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Login sx={{ fontSize: 40, color: 'success.main' }} />
                    <Typography variant="h3" fontWeight="bold" color="success.main">
                      {stats.totalCheckIns}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bugün Giriş
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#ffebee' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Logout sx={{ fontSize: 40, color: 'error.main' }} />
                    <Typography variant="h3" fontWeight="bold" color="error.main">
                      {stats.totalCheckOuts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bugün Çıkış
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#e3f2fd' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Group sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Typography variant="h3" fontWeight="bold" color="primary.main">
                      {stats.currentlyInside}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Şu An İçeride
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card sx={{ bgcolor: '#fff3e0' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Warning sx={{ fontSize: 40, color: 'warning.main' }} />
                    <Typography variant="h3" fontWeight="bold" color="warning.main">
                      {stats.lateArrivals}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Geç Kalanlar
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Son İşlemler */}
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      <AccessTime sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                      Son İşlemler
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    
                    <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
                      {recentActions.length > 0 ? (
                        recentActions.map((action, index) => (
                          <ListItem key={index} sx={{ py: 0.5 }}>
                            <ListItemAvatar sx={{ minWidth: 40 }}>
                              <Badge
                                badgeContent={action.checkOut ? '✓' : ''}
                                color="success"
                              >
                                <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                  {action.employee?.charAt(0)}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="medium">
                                  {action.employee}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {action.checkIn && moment(action.checkIn).format('HH:mm')}
                                  {action.checkOut && ` → ${moment(action.checkOut).format('HH:mm')}`}
                                </Typography>
                              }
                            />
                            <Chip 
                              size="small"
                              label={action.checkOut ? 'Çıkış' : 'İçeride'}
                              color={action.checkOut ? 'default' : 'success'}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                          Henüz işlem yok
                        </Typography>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      
      {/* Footer */}
      <Typography 
        variant="caption" 
        sx={{ 
          display: 'block', 
          textAlign: 'center', 
          mt: 3, 
          color: 'rgba(255,255,255,0.6)' 
        }}
      >
        © 2025 Çanga Savunma Endüstrisi • Barkod Terminal v1.0 • {branchEmoji} {branchName}
      </Typography>
    </Box>
  );
};

export default BarcodeKioskPage;


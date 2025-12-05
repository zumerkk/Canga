import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Fade,
  Slide,
  Grow,
  IconButton,
  LinearProgress
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
  Schedule
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';

moment.locale('tr');

/**
 * 🏢 SİSTEM İMZA SAYFASI - Premium Kurumsal Tasarım
 * Çanga Savunma Vardiya Takip Sistemi
 */

const SystemSignaturePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const signaturePadRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [tokenData, setTokenData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionType, setActionType] = useState('CHECK_IN');
  
  const [submitting, setSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending'); // pending, success, error

  // Token ve çalışanları yükle
  useEffect(() => {
    loadTokenData();
    loadEmployees();
    requestLocation();
  }, [token]);
  
  // Konum al
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
      () => {
        setLocationStatus('error');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  };

  // Saat güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      if (tokenData?.expiresAt) {
        const remaining = Math.floor((new Date(tokenData.expiresAt) - new Date()) / 1000);
        setRemainingSeconds(Math.max(0, remaining));
        
        if (remaining <= 0) {
          setError('QR kodunun süresi doldu');
          clearInterval(timer);
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [tokenData]);

  const loadTokenData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/system-qr/system-signature/${token}`);
      setTokenData(response.data.token);
      setRemainingSeconds(response.data.token.remainingSeconds);
      
      if (response.data.token.type !== 'BOTH') {
        setActionType(response.data.token.type);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'QR kod geçersiz veya süresi dolmuş');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/api/employees', { params: { durum: 'all', limit: 1000 } });
      const data = response.data?.data || [];
      setEmployees(Array.isArray(data) ? data.filter(e => e.durum === 'AKTIF') : []);
    } catch {
      setEmployees([]);
    }
  };

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      setError('Lütfen isminizi seçin');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (signaturePadRef.current?.isEmpty()) {
      setError('Lütfen imza atın');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const signatureData = signaturePadRef.current.toDataURL('image/png');
      
      const payload = {
        token,
        employeeId: selectedEmployee._id,
        actionType,
        signature: signatureData
      };
      
      if (coordinates) {
        payload.coordinates = coordinates;
      }
      
      const response = await api.post('/api/system-qr/submit-system-signature', payload);
      
      if (response.data?.location) {
        setSelectedEmployee({ ...selectedEmployee, locationInfo: response.data.location });
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        window.close();
        navigate('/');
      }, 4000);
      
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.checkInBranch) {
        const data = err.response.data;
        setError(`${data.error}\n\nGiriş: ${data.checkInBranchName}\nÇıkış: ${data.attemptedBranchName}`);
      } else {
        setError(err.response?.data?.error || 'İşlem başarısız. Tekrar deneyin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Kalan süre formatı
  const formatRemaining = () => {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    return `${hours}s ${minutes}dk`;
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
        sx={{ background: 'linear-gradient(180deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Box textAlign="center" color="white">
            <Box 
              component="img" 
              src="/canga-logo.png" 
              alt="Çanga" 
              sx={{ width: 120, mb: 3, filter: 'brightness(0) invert(1)' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Typography variant="h4" fontWeight="bold" letterSpacing={4} mb={2}>
              ÇANGA
            </Typography>
            <CircularProgress size={40} sx={{ color: 'white' }} />
            <Typography variant="body2" mt={2} sx={{ opacity: 0.8 }}>
              Yükleniyor...
            </Typography>
          </Box>
        </motion.div>
      </Box>
    );
  }

  // ============================================
  // ERROR SCREEN
  // ============================================
  if (!tokenData || (error && !selectedEmployee)) {
    return (
      <Box 
        minHeight="100vh" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        sx={{ background: 'linear-gradient(180deg, #b71c1c 0%, #c62828 50%, #d32f2f 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Paper sx={{ p: 5, maxWidth: 400, textAlign: 'center', borderRadius: 4 }}>
            <Cancel sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Geçersiz QR Kod
            </Typography>
            <Typography color="text.secondary" paragraph>
              {error || 'Bu QR kodun süresi dolmuş veya geçersiz.'}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => window.close()}
              sx={{ mt: 2, px: 4 }}
            >
              Kapat
            </Button>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // ============================================
  // SUCCESS SCREEN
  // ============================================
  if (success) {
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
          <Paper sx={{ p: 5, maxWidth: 450, textAlign: 'center', borderRadius: 4 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle sx={{ fontSize: 100, color: 'success.main', mb: 2 }} />
            </motion.div>
            
            <Typography variant="h4" fontWeight="bold" gutterBottom color="success.main">
              {actionType === 'CHECK_IN' ? 'Giriş Başarılı' : 'Çıkış Başarılı'}
            </Typography>
            
            <Avatar 
              src={selectedEmployee?.profilePhoto} 
              sx={{ width: 80, height: 80, mx: 'auto', my: 3, fontSize: 32 }}
            >
              {selectedEmployee?.adSoyad?.charAt(0)}
            </Avatar>
            
            <Typography variant="h5" fontWeight="medium">
              {selectedEmployee?.adSoyad}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {selectedEmployee?.pozisyon}
            </Typography>
            
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 3, my: 3 }}>
              <Typography variant="h2" fontWeight="bold" color="primary.main">
                {moment(currentTime).format('HH:mm')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {moment(currentTime).format('DD MMMM YYYY')}
              </Typography>
            </Box>
            
            <Chip 
              label={tokenData?.branchName || tokenData?.branch} 
              color={tokenData?.branch === 'IŞIL' ? 'secondary' : 'primary'}
              icon={<Business />}
              sx={{ fontWeight: 'bold' }}
            />
            
            <LinearProgress sx={{ mt: 3, borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary" mt={1}>
              Pencere kapanıyor...
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // ============================================
  // MAIN FORM
  // ============================================
  const branchColor = tokenData?.branch === 'IŞIL' ? '#7b1fa2' : '#1565c0';

  return (
    <Box 
      minHeight="100vh" 
      sx={{ 
        background: `linear-gradient(180deg, ${branchColor} 0%, ${branchColor}dd 100%)`,
        pb: 4
      }}
    >
      {/* Header */}
      <Box sx={{ pt: 4, pb: 3, textAlign: 'center', color: 'white' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h4" fontWeight="bold" letterSpacing={3}>
            ÇANGA
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Vardiya Takip Sistemi
          </Typography>
          
          <Box display="flex" justifyContent="center" gap={1} mt={2}>
            <Chip 
              label={tokenData?.branchName || tokenData?.branch}
              icon={<Business sx={{ color: 'white !important' }} />}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
            <Chip 
              label={formatRemaining()}
              icon={<Timer sx={{ color: 'white !important' }} />}
              sx={{ 
                bgcolor: remainingSeconds < 3600 ? 'error.main' : 'rgba(255,255,255,0.2)', 
                color: 'white',
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Box>
        </motion.div>
      </Box>

      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            
            {/* Clock Section */}
            <Box sx={{ bgcolor: 'grey.50', py: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={2}>
                {moment(currentTime).format('DD MMMM YYYY, dddd')}
              </Typography>
              <Typography 
                variant="h1" 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '4rem', sm: '5rem' },
                  color: branchColor,
                  lineHeight: 1.1,
                  my: 1
                }}
              >
                {moment(currentTime).format('HH:mm:ss')}
              </Typography>
              
              {/* Location Status */}
              <Chip
                size="small"
                icon={locationStatus === 'success' ? <MyLocation /> : <LocationOn />}
                label={locationStatus === 'success' ? 'Konum Alındı' : 'Konum Bekleniyor'}
                color={locationStatus === 'success' ? 'success' : 'default'}
                variant="outlined"
              />
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Action Type Toggle */}
              {tokenData?.type === 'BOTH' && (
                <Box mb={3}>
                  <ToggleButtonGroup
                    value={actionType}
                    exclusive
                    onChange={(_, v) => v && setActionType(v)}
                    fullWidth
                    sx={{ 
                      '& .MuiToggleButton-root': { 
                        py: 2,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    <ToggleButton 
                      value="CHECK_IN"
                      sx={{ 
                        '&.Mui-selected': { 
                          bgcolor: 'success.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'success.dark' }
                        }
                      }}
                    >
                      <Login sx={{ mr: 1 }} /> GİRİŞ
                    </ToggleButton>
                    <ToggleButton 
                      value="CHECK_OUT"
                      sx={{ 
                        '&.Mui-selected': { 
                          bgcolor: 'error.main', 
                          color: 'white',
                          '&:hover': { bgcolor: 'error.dark' }
                        }
                      }}
                    >
                      <Logout sx={{ mr: 1 }} /> ÇIKIŞ
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              {/* Employee Selection */}
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight="medium">
                  Çalışan Seçin
                </Typography>
                <Autocomplete
                  options={employees}
                  getOptionLabel={(o) => o.adSoyad || ''}
                  value={selectedEmployee}
                  onChange={(_, v) => setSelectedEmployee(v)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="İsim arayın..."
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          bgcolor: 'grey.50'
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <Box component="li" key={key} {...rest} sx={{ py: 1.5 }}>
                        <Avatar src={option?.profilePhoto} sx={{ mr: 2, width: 36, height: 36 }}>
                          {option?.adSoyad?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">{option?.adSoyad}</Typography>
                          <Typography variant="caption" color="text.secondary">{option?.pozisyon}</Typography>
                        </Box>
                      </Box>
                    );
                  }}
                  noOptionsText="Sonuç yok"
                />
              </Box>

              {/* Selected Employee Preview */}
              <AnimatePresence>
                {selectedEmployee && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        mb: 3, 
                        borderRadius: 2,
                        borderColor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                        bgcolor: actionType === 'CHECK_IN' ? 'success.light' : 'error.light'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar src={selectedEmployee.profilePhoto} sx={{ width: 50, height: 50 }}>
                          {selectedEmployee.adSoyad?.charAt(0)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography fontWeight="bold">{selectedEmployee.adSoyad}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {selectedEmployee.pozisyon} • {selectedEmployee.lokasyon}
                          </Typography>
                        </Box>
                        <Chip
                          label={actionType === 'CHECK_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}
                          color={actionType === 'CHECK_IN' ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Signature Pad */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="text.secondary" fontWeight="medium">
                    <Fingerprint sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />
                    İmza
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={handleClearSignature}
                    startIcon={<Refresh />}
                  >
                    Temizle
                  </Button>
                </Box>
                
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    borderWidth: 2,
                    borderColor: 'grey.300',
                    '&:focus-within': {
                      borderColor: branchColor
                    }
                  }}
                >
                  <SignatureCanvas
                    ref={signaturePadRef}
                    canvasProps={{
                      width: Math.min(window.innerWidth - 80, 500),
                      height: 180,
                      style: { 
                        display: 'block', 
                        background: '#fafafa',
                        touchAction: 'none'
                      }
                    }}
                    penColor="#333"
                    minWidth={1.5}
                    maxWidth={3}
                  />
                </Paper>
              </Box>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSubmit}
                disabled={submitting || !selectedEmployee || remainingSeconds <= 0}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  bgcolor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                  '&:hover': {
                    bgcolor: actionType === 'CHECK_IN' ? 'success.dark' : 'error.dark'
                  }
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  <>
                    {actionType === 'CHECK_IN' ? <Login sx={{ mr: 1 }} /> : <Logout sx={{ mr: 1 }} />}
                    {actionType === 'CHECK_IN' ? 'Giriş Yap' : 'Çıkış Yap'}
                  </>
                )}
              </Button>
            </Box>

            {/* Footer Info */}
            <Box sx={{ bgcolor: 'grey.100', p: 2 }}>
              <Typography variant="caption" color="text.secondary" component="div" textAlign="center">
                {tokenData?.branch === 'IŞIL' ? '🏢' : '🏭'} {tokenData?.branchName || tokenData?.branch} Şubesi
                <br />
                Bu QR kod {moment(tokenData?.expiresAt).format('DD.MM.YYYY HH:mm')} tarihine kadar geçerli
              </Typography>
            </Box>
          </Paper>
        </motion.div>

        {/* Copyright */}
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 3, 
            color: 'rgba(255,255,255,0.7)' 
          }}
        >
          © 2025 Çanga Savunma Endüstrisi
        </Typography>
      </Container>
    </Box>
  );
};

export default SystemSignaturePage;

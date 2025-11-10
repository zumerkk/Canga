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
  Divider,
  Container,
  TextField,
  Autocomplete,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Timer,
  LocationOn,
  AccessTime,
  Refresh,
  Login,
  Logout
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';

moment.locale('tr');

/**
 * 🏢 SİSTEM İMZA SAYFASI - Paylaşılan QR Kod
 * 
 * Herkesin kullanabileceği sistem QR kodu
 * Çalışan kendi ismini seçer, imza atar
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
  
  // Çalışan seçimi
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionType, setActionType] = useState('CHECK_IN'); // CHECK_IN veya CHECK_OUT
  
  const [submitting, setSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  // Token ve çalışanları yükle
  useEffect(() => {
    loadTokenData();
    loadEmployees();
    
    // GPS konumunu al
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => console.warn('GPS alınamadı:', err)
      );
    }
  }, [token]);

  // Saat güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      if (tokenData?.expiresAt) {
        const remaining = Math.floor((new Date(tokenData.expiresAt) - new Date()) / 1000);
        setRemainingSeconds(Math.max(0, remaining));
        
        if (remaining <= 0) {
          setError('Sistem QR kodunun süresi doldu.');
          clearInterval(timer);
        }
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [tokenData]);

  const loadTokenData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/system-qr/system-signature/${token}`);
      
      setTokenData(response.data.token);
      setRemainingSeconds(response.data.token.remainingSeconds);
      
      // Token tipine göre default action belirle
      if (response.data.token.type === 'CHECK_IN') {
        setActionType('CHECK_IN');
      } else if (response.data.token.type === 'CHECK_OUT') {
        setActionType('CHECK_OUT');
      }
      // BOTH ise kullanıcı seçer
      
    } catch (err) {
      console.error('Token yükleme hatası:', err);
      setError(
        err.response?.data?.error || 
        'Sistem QR kodu geçersiz veya süresi dolmuş'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/api/employees', {
        params: { durum: 'all', limit: 1000 }
      });
      
      const employeeData = response.data?.data || [];
      const employeeArray = Array.isArray(employeeData) ? employeeData : [];
      
      // AKTIF olanları filtrele
      const activeEmployees = employeeArray.filter(emp => emp.durum === 'AKTIF');
      
      setEmployees(activeEmployees);
    } catch (error) {
      console.error('Çalışanlar yüklenemedi:', error);
      setEmployees([]);
    }
  };

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSubmit = async () => {
    // Validasyon
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
      
      // İmza verisini al
      const signatureData = signaturePadRef.current.toDataURL('image/png');
      
      // API'ye gönder
      await api.post('/api/system-qr/submit-system-signature', {
        token: token,
        employeeId: selectedEmployee._id,
        actionType: actionType,
        signature: signatureData,
        coordinates: coordinates
      });
      
      // Başarılı
      setSuccess(true);
      
      // 4 saniye sonra yönlendir
      setTimeout(() => {
        window.close();
        navigate('/');
      }, 4000);
      
    } catch (err) {
      console.error('İmza gönderme hatası:', err);
      setError(
        err.response?.data?.error || 
        'İmza kaydedilirken hata oluştu. Lütfen tekrar deneyin.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Yükleme durumu
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
        <Box textAlign="center">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" mt={3}>Yükleniyor...</Typography>
        </Box>
      </Box>
    );
  }

  // Hata durumu
  if (!tokenData || (error && !success)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Cancel sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error" fontWeight="bold">
              Geçersiz QR Kod
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button variant="contained" onClick={() => window.close()} sx={{ mt: 2 }}>
              Kapat
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Başarılı kayıt
  if (success) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
            <CheckCircle sx={{ fontSize: 100, color: 'success.main', mb: 3 }} />
            <Typography variant="h3" gutterBottom color="success.main" fontWeight="bold">
              {actionType === 'CHECK_IN' ? '✅ Giriş Kaydedildi' : '✅ Çıkış Kaydedildi'}
            </Typography>
            
            <Avatar src={selectedEmployee?.profilePhoto} sx={{ width: 100, height: 100, mx: 'auto', my: 3 }}>
              {selectedEmployee?.adSoyad?.charAt(0)}
            </Avatar>
            
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              {selectedEmployee?.adSoyad}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {selectedEmployee?.pozisyon}
            </Typography>
            
            <Box sx={{ bgcolor: 'grey.100', borderRadius: 2, p: 3, my: 3 }}>
              <Typography variant="h2" fontWeight="bold" color="primary">
                {moment(currentTime).format('HH:mm:ss')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {moment(currentTime).format('DD MMMM YYYY, dddd')}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Pencere kapanıyor...
            </Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </Paper>
        </Container>
      </Box>
    );
  }

  // İmza sayfası
  return (
    <Box
      minHeight="100vh"
      sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 4 }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
          
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h3" fontWeight="bold" gutterBottom color="primary">
              ÇANGA SAVUNMA
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Sistem Giriş-Çıkış (Paylaşılan QR)
            </Typography>
            <Chip 
              label="24 Saat Geçerli" 
              color="success" 
              sx={{ mt: 1, fontWeight: 'bold' }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Kalan Süre */}
          {remainingSeconds > 0 && (
            <Alert severity={remainingSeconds < 3600 ? 'warning' : 'info'} sx={{ mb: 3 }} icon={<Timer />}>
              <Typography variant="body2" fontWeight="medium">
                ⏰ Kalan Süre: {Math.floor(remainingSeconds / 3600)}s {Math.floor((remainingSeconds % 3600) / 60)}dk
              </Typography>
              <Typography variant="caption">
                {moment(tokenData.expiresAt).format('DD MMMM HH:mm')} tarihine kadar geçerli
              </Typography>
            </Alert>
          )}

          {/* Saat Göstergesi */}
          <Box textAlign="center" my={4}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {moment(currentTime).format('DD MMMM YYYY, dddd')}
            </Typography>
            <Typography
              variant="h1"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                my: 2
              }}
            >
              {moment(currentTime).format('HH:mm:ss')}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* İşlem Tipi Seçimi (BOTH ise) */}
          {tokenData.type === 'BOTH' && (
            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
                İşlem Seç
              </FormLabel>
              <RadioGroup
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                row
                sx={{ justifyContent: 'center' }}
              >
                <FormControlLabel
                  value="CHECK_IN"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Login color="success" />
                      <Typography variant="h6">GİRİŞ</Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="CHECK_OUT"
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Logout color="error" />
                      <Typography variant="h6">ÇIKIŞ</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          )}

          {tokenData.type !== 'BOTH' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                {tokenData.type === 'CHECK_IN' ? '🟢 GİRİŞ' : '🔴 ÇIKIŞ'}
              </Typography>
            </Alert>
          )}

          {/* Çalışan Seçimi */}
          <Box mb={3}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              İsminizi Seçin
            </Typography>
            <Autocomplete
              options={Array.isArray(employees) ? employees : []}
              getOptionLabel={(option) => `${option.adSoyad} - ${option.pozisyon}`}
              value={selectedEmployee}
              onChange={(_, value) => setSelectedEmployee(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="İsminizi arayın..."
                  fullWidth
                  variant="outlined"
                  size="large"
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar src={option?.profilePhoto} sx={{ mr: 2, width: 40, height: 40 }}>
                    {option?.adSoyad?.charAt(0) || '?'}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">{option?.adSoyad || 'Bilinmiyor'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option?.pozisyon || '-'} • {option?.lokasyon || '-'}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText="Çalışan bulunamadı"
              loading={employees.length === 0}
            />
          </Box>

          {/* Seçili Çalışan Özeti */}
          {selectedEmployee && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar src={selectedEmployee.profilePhoto} sx={{ width: 60, height: 60 }}>
                  {selectedEmployee.adSoyad.charAt(0)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight="bold">{selectedEmployee.adSoyad}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedEmployee.pozisyon}</Typography>
                  <Chip label={selectedEmployee.lokasyon} size="small" sx={{ mt: 0.5 }} />
                </Box>
                <Chip
                  label={actionType === 'CHECK_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}
                  color={actionType === 'CHECK_IN' ? 'success' : 'error'}
                  sx={{ fontSize: '1rem', fontWeight: 'bold', px: 2 }}
                />
              </Box>
            </Paper>
          )}

          <Divider sx={{ my: 3 }} />

          {/* İmza Pedi */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">İmza</Typography>
              <Button size="small" variant="outlined" onClick={handleClearSignature} startIcon={<Refresh />}>
                Temizle
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" mb={2}>
              Lütfen aşağıdaki alana parmağınızla veya kalemle imzanızı atın
            </Typography>
            
            <Paper
              variant="outlined"
              sx={{
                border: '3px solid',
                borderColor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2,
                bgcolor: '#ffffff',
                boxShadow: 2
              }}
            >
              <SignatureCanvas
                ref={signaturePadRef}
                canvasProps={{
                  width: Math.min(window.innerWidth - 120, 600),
                  height: 250,
                  style: { display: 'block', background: '#ffffff', touchAction: 'none' }
                }}
                penColor="black"
                minWidth={2}
                maxWidth={4}
              />
            </Paper>
          </Box>

          {/* Hata Mesajı */}
          {error && !loading && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Gönder Butonu */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting || remainingSeconds <= 0 || !selectedEmployee}
            sx={{
              py: 2.5,
              fontSize: '1.4rem',
              fontWeight: 'bold',
              background: actionType === 'CHECK_IN' 
                ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
              '&:hover': {
                background: actionType === 'CHECK_IN' 
                  ? 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)'
                  : 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)',
              },
              '&:disabled': { opacity: 0.6 }
            }}
          >
            {submitting ? (
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={24} sx={{ color: 'white' }} />
                Kaydediliyor...
              </Box>
            ) : (
              actionType === 'CHECK_IN' ? '✅ Giriş Yap' : '✅ Çıkış Yap'
            )}
          </Button>

          {/* Bilgi Notları */}
          <Box mt={3}>
            <Alert severity="success">
              <Typography variant="caption">
                <strong>✓</strong> Bu QR kod 24 saat geçerlidir<br />
                <strong>✓</strong> Tüm çalışanlar kullanabilir<br />
                <strong>✓</strong> Sabah giriş, akşam çıkış için aynı QR<br />
                <strong>✓</strong> Her kullanımda kendi isminizi seçin
              </Typography>
            </Alert>
          </Box>

        </Paper>

        {/* Alt Bilgi */}
        <Box textAlign="center" mt={3}>
          <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
            © 2025 Çanga Savunma Endüstrisi - Sistem Giriş-Çıkış
          </Typography>
        </Box>

      </Container>
    </Box>
  );
};

export default SystemSignaturePage;


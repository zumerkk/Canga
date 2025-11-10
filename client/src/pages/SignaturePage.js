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
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Timer,
  LocationOn,
  AccessTime,
  Refresh
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';

moment.locale('tr');

/**
 * 📝 İMZA SAYFASI - QR Kod ile Giriş/Çıkış
 * 
 * Public sayfa - Şifre gerektirmez
 * QR kod tarandıktan sonra açılır
 */

const SignaturePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const signaturePadRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [tokenData, setTokenData] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  
  const [submitting, setSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  // Token bilgilerini yükle
  useEffect(() => {
    loadTokenData();
    
    // GPS konumunu al
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          console.warn('GPS alınamadı:', err);
        }
      );
    }
  }, [token]);

  // Saat güncelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      // Kalan süreyi güncelle
      if (tokenData?.expiresAt) {
        const remaining = Math.floor((new Date(tokenData.expiresAt) - new Date()) / 1000);
        setRemainingSeconds(Math.max(0, remaining));
        
        // Süre doldu
        if (remaining <= 0) {
          setError('QR kodun süresi doldu. Lütfen yeni bir QR kod alın.');
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
      
      const response = await api.get(`/api/attendance-qr/signature/${token}`);
      
      setTokenData(response.data.token);
      setEmployee(response.data.employee);
      setRemainingSeconds(response.data.token.remainingSeconds);
      
    } catch (err) {
      console.error('Token yükleme hatası:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'QR kod geçersiz veya süresi dolmuş'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSubmit = async () => {
    // İmza kontrolü
    if (signaturePadRef.current?.isEmpty()) {
      setError('Lütfen imza atın');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // İmza verisini al (base64)
      const signatureData = signaturePadRef.current.toDataURL('image/png');
      
      // API'ye gönder
      const response = await api.post('/api/attendance-qr/submit-signature', {
        token: token,
        signature: signatureData,
        coordinates: coordinates
      });
      
      // Başarılı
      setSuccess(true);
      
      // 4 saniye sonra yönlendir
      setTimeout(() => {
        window.close(); // Eğer yeni tab'de açıldıysa kapat
        // Veya ana sayfaya yönlendir
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
      >
        <Box textAlign="center">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" mt={3} color="text.secondary">
            Yükleniyor...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Hata durumu
  if (!tokenData || (error && !success)) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Cancel sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error" fontWeight="bold">
              Geçersiz QR Kod
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.close()}
              sx={{ mt: 2 }}
            >
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
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Container maxWidth="sm">
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
            <CheckCircle sx={{ fontSize: 100, color: 'success.main', mb: 3 }} />
            <Typography variant="h3" gutterBottom color="success.main" fontWeight="bold">
              {tokenData.type === 'CHECK_IN' ? '✅ Giriş Kaydedildi' : '✅ Çıkış Kaydedildi'}
            </Typography>
            
            <Avatar
              src={employee.profilePhoto}
              sx={{ width: 100, height: 100, mx: 'auto', my: 3 }}
            >
              {employee.adSoyad.charAt(0)}
            </Avatar>
            
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              {employee.adSoyad}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {employee.pozisyon}
            </Typography>
            
            <Chip
              label={tokenData.location}
              icon={<LocationOn />}
              color="primary"
              sx={{ mb: 3 }}
            />
            
            <Box
              sx={{
                bgcolor: 'grey.100',
                borderRadius: 2,
                p: 3,
                my: 3
              }}
            >
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
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
          
          {/* Header - Logo & Başlık */}
          <Box textAlign="center" mb={4}>
            <Typography variant="h3" fontWeight="bold" gutterBottom color="primary">
              ÇANGA SAVUNMA
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Giriş-Çıkış İmza Sistemi
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Kalan Süre Uyarısı */}
          {remainingSeconds <= 60 && remainingSeconds > 0 && (
            <Alert
              severity={remainingSeconds <= 30 ? 'error' : 'warning'}
              sx={{ mb: 3 }}
              icon={<Timer />}
            >
              <Typography variant="body2" fontWeight="medium">
                ⏰ QR kodun {remainingSeconds} saniye sonra geçersiz olacak!
              </Typography>
            </Alert>
          )}

          {remainingSeconds <= 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="medium">
                ❌ QR kodun süresi doldu. Lütfen yeni bir QR kod alın.
              </Typography>
            </Alert>
          )}

          {/* Çalışan Bilgileri */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar
                src={employee.profilePhoto}
                sx={{ width: 100, height: 100, border: '4px solid', borderColor: 'primary.main' }}
              >
                {employee.adSoyad.charAt(0)}
              </Avatar>
              
              <Box flex={1}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {employee.adSoyad}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {employee.pozisyon}
                </Typography>
                
                <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                  <Chip
                    icon={<LocationOn />}
                    label={tokenData.location}
                    size="medium"
                    color="primary"
                  />
                  <Chip
                    label={tokenData.type === 'CHECK_IN' ? '🟢 GİRİŞ' : '🔴 ÇIKIŞ'}
                    size="medium"
                    color={tokenData.type === 'CHECK_IN' ? 'success' : 'error'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          <Divider sx={{ my: 3 }} />

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

          {/* İmza Pedi */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                İmza
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={handleClearSignature}
                startIcon={<Refresh />}
              >
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
                borderColor: tokenData.type === 'CHECK_IN' ? 'success.main' : 'error.main',
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
                  style: {
                    display: 'block',
                    background: '#ffffff',
                    touchAction: 'none'
                  }
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
            disabled={submitting || remainingSeconds <= 0 || loading}
            sx={{
              py: 2,
              fontSize: '1.3rem',
              fontWeight: 'bold',
              background: tokenData.type === 'CHECK_IN' 
                ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                : 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
              '&:hover': {
                background: tokenData.type === 'CHECK_IN' 
                  ? 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)'
                  : 'linear-gradient(135deg, #ef5350 0%, #f44336 100%)',
              },
              '&:disabled': {
                opacity: 0.6
              }
            }}
          >
            {submitting ? (
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={24} sx={{ color: 'white' }} />
                Kaydediliyor...
              </Box>
            ) : (
              tokenData.type === 'CHECK_IN' ? '✅ Giriş Yap' : '✅ Çıkış Yap'
            )}
          </Button>

          {/* Bilgi Notları */}
          <Box mt={3}>
            <Alert severity="info" icon={<AccessTime />}>
              <Typography variant="caption" display="block">
                <strong>Kalan Süre:</strong> {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
              </Typography>
              <Typography variant="caption">
                Bu QR kod {moment(tokenData.expiresAt).format('HH:mm:ss')} tarihinde otomatik olarak geçersiz olacaktır.
              </Typography>
            </Alert>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>✓</strong> Bu QR kod tek kullanımlıktır<br />
                <strong>✓</strong> İmzanız güvenli bir şekilde kaydedilecektir<br />
                <strong>✓</strong> Konum bilginiz (GPS) kaydedilecektir
              </Typography>
            </Alert>
          </Box>

        </Paper>

        {/* Alt Bilgi */}
        <Box textAlign="center" mt={3}>
          <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
            © 2025 Çanga Savunma Endüstrisi - Güvenli Giriş-Çıkış Sistemi
          </Typography>
        </Box>

      </Container>
    </Box>
  );
};

export default SignaturePage;

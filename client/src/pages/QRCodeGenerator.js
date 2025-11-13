import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  QrCode2,
  Download,
  Print,
  Refresh,
  CheckCircle,
  Cancel,
  AccessTime,
  ArrowBack,
  ContentCopy,
  Fullscreen
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';
import { useNavigate } from 'react-router-dom';

moment.locale('tr');

/**
 * 📱 QR KOD OLUŞTURUCU - TAM ÖZELLİKLİ
 */

const QRCodeGenerator = () => {
  const navigate = useNavigate();
  const qrImageRef = useRef(null);
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Tek çalışan modu
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]); // ✅ TOPLU MOD
  const [bulkMode, setBulkMode] = useState(false); // ✅ MOD SWITCH
  const [actionType, setActionType] = useState('CHECK_IN');
  const [location, setLocation] = useState('MERKEZ');
  
  // Oluşturulan QR kod
  const [qrCode, setQrCode] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  
  // Toplu mod
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkQRCodes, setBulkQRCodes] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Çalışan durumu
  const [todayStatus, setTodayStatus] = useState(null);
  const [hasActiveToken, setHasActiveToken] = useState(false); // ✅ DUPLICATE PREVENTION
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    showRetry: false
  });
  
  // API Connection
  const [apiConnected, setApiConnected] = useState(true);

  // Çalışanları yükle
  useEffect(() => {
    loadEmployees();
  }, []);

  // Kalan süreyi güncelle
  useEffect(() => {
    if (!expiresAt) return;
    
    const timer = setInterval(() => {
      const remaining = Math.floor((new Date(expiresAt) - new Date()) / 1000);
      setRemainingSeconds(Math.max(0, remaining));
      
      if (remaining <= 0) {
        setQrCode(null);
        setQrUrl(null);
        setExpiresAt(null);
        showSnackbar('QR kodun süresi doldu', 'warning');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiresAt]);

  const loadEmployees = async () => {
    try {
      const response = await api.get('/api/employees', {
        params: { 
          durum: 'all', // Tüm çalışanları getir, frontend'de filtreleriz
          limit: 1000 
        }
      });
      
      // API response: { success: true, data: [...], pagination: {...} }
      const employeeData = response.data?.data || response.data || [];
      
      // Ensure it's always an array
      let employeeArray = Array.isArray(employeeData) ? employeeData : [];
      
      // Frontend'de AKTIF olanları filtrele
      employeeArray = employeeArray.filter(emp => emp.durum === 'AKTIF');
      
      console.log('✅ Tüm çalışan:', employeeData.length);
      console.log('✅ Aktif çalışan:', employeeArray.length);
      setEmployees(employeeArray);
      setApiConnected(true); // ✅ API bağlantısı başarılı
      
      if (employeeArray.length === 0) {
        showSnackbar('Aktif çalışan bulunamadı. Lütfen çalışan durumlarını kontrol edin.', 'warning');
      } else {
        console.log('👥 İlk aktif çalışan:', employeeArray[0]?.adSoyad);
        showSnackbar(`${employeeArray.length} aktif çalışan yüklendi`, 'success');
      }
    } catch (error) {
      setApiConnected(false); // ❌ API bağlantısı başarısız
      showSnackbar('API bağlantı hatası: Çalışanlar yüklenemedi. Lütfen tekrar deneyin.', 'error', true);
      setEmployees([]); // Always set as empty array on error
    }
  };

  const loadTodayStatus = async (employeeId) => {
    try {
      const response = await api.get(`/api/attendance-qr/today-status/${employeeId}`);
      setTodayStatus(response.data.status);
      
      // Otomatik action type belirle
      if (response.data.status.canCheckIn && !response.data.status.canCheckOut) {
        setActionType('CHECK_IN');
      } else if (response.data.status.canCheckOut) {
        setActionType('CHECK_OUT');
      }
    } catch (error) {
      console.error('Durum yüklenemedi:', error);
      setTodayStatus(null);
    }
  };

  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    setQrCode(null);
    setQrUrl(null);
    setTodayStatus(null);
    setHasActiveToken(false); // ✅ RESET
    
    if (employee) {
      setLocation(employee.lokasyon || 'MERKEZ');
      await loadTodayStatus(employee._id);
      
      // ✅ DUPLICATE PREVENTION: Aktif token kontrolü
      const active = await checkActiveToken(employee._id);
      setHasActiveToken(active);
    }
  };

  const checkActiveToken = async (employeeId) => {
    try {
      const response = await api.get(`/api/attendance-qr/active-token/${employeeId}`);
      
      if (response.data.hasActiveToken) {
        showSnackbar(
          `Bu çalışan için zaten aktif bir QR kod var (${response.data.token.type}). Önce onu kullanın veya süresinin dolmasını bekleyin.`,
          'warning'
        );
        return true; // ✅ RETURN TRUE
      }
      return false; // ✅ RETURN FALSE
    } catch (error) {
      // Sessizce atla
      console.log('Aktif token kontrolü yapılamadı');
      return false;
    }
  };

  const handleGenerateQR = async () => {
    if (!selectedEmployee) {
      showSnackbar('Lütfen bir çalışan seçin', 'warning');
      return;
    }
    
    // Duplicate prevention check
    if (todayStatus) {
      if (actionType === 'CHECK_IN' && !todayStatus.canCheckIn) {
        showSnackbar('Bu çalışan bugün zaten giriş yapmış. Çıkış QR kodu oluşturabilirsiniz.', 'error');
        return;
      }
      if (actionType === 'CHECK_OUT' && !todayStatus.canCheckOut) {
        showSnackbar('Bu çalışan henüz giriş yapmamış. Önce giriş QR kodu oluşturun.', 'error');
        return;
      }
    }
    
    try {
      setLoading(true);
      
      const response = await api.post('/api/attendance-qr/generate', {
        employeeId: selectedEmployee._id,
        type: actionType,
        location: location
      });
      
      setQrCode(response.data.qrCode);
      setQrUrl(response.data.url);
      setExpiresAt(response.data.token.expiresAt);
      setRemainingSeconds(response.data.token.expiresIn);
      
      showSnackbar('QR kod başarıyla oluşturuldu! 2 dakika geçerli.', 'success');
      
      // QR oluşturduktan sonra sayfada kalıyoruz, yönlendirme YOK!
      // navigate() ÇAĞRISI YOK
      
    } catch (error) {
      console.error('QR kod oluşturulamadı:', error);
      const errorMsg = error.response?.data?.error || 'QR kod oluşturulamadı';
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBulk = async () => {
    // ✅ ÇOKLU SEÇİM KONTROL
    let employeeIds = [];
    
    if (bulkMode && selectedEmployees.length > 0) {
      // Toplu modda seçili çalışanlar
      employeeIds = selectedEmployees.map(e => e._id).filter(Boolean);
    } else if (Array.isArray(employees) && employees.length > 0) {
      // Normal modda ilk 50 çalışan
      employeeIds = employees.slice(0, 50).map(e => e._id).filter(Boolean);
    } else {
      showSnackbar('Lütfen çalışan seçin veya listede çalışan olduğundan emin olun', 'warning');
      return;
    }
    
    if (employeeIds.length === 0) {
      showSnackbar('Geçerli çalışan bulunamadı', 'warning');
      return;
    }
    
    try {
      setBulkLoading(true);
      
      const response = await api.post('/api/attendance-qr/generate-bulk', {
        employeeIds: employeeIds,
        type: actionType,
        location: location
      });
      
      setBulkQRCodes(response.data.results || []);
      setBulkDialog(true);
      showSnackbar(`${response.data.generated || employeeIds.length} QR kod oluşturuldu`, 'success');
      
    } catch (error) {
      console.error('Toplu QR kod oluşturulamadı:', error);
      showSnackbar(
        error.response?.data?.error || 'Toplu QR kod oluşturulamadı',
        'error'
      ); // ✅ ERROR VISIBILITY
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR_${selectedEmployee.adSoyad}_${actionType}_${moment().format('YYYYMMDD_HHmm')}.png`;
    link.click();
    
    showSnackbar('QR kod indirildi', 'success');
  };

  const handleCopyURL = () => {
    if (!qrUrl) return;
    
    navigator.clipboard.writeText(qrUrl).then(() => {
      showSnackbar('Link kopyalandı', 'success');
    });
  };

  const handlePrintBulk = () => {
    // Dialog içeriğini yazdır
    const printContent = document.getElementById('bulk-qr-print-area');
    if (!printContent) {
      showSnackbar('Yazdırılacak içerik bulunamadı', 'error');
      return;
    }
    
    // Yazdırma dialog'unu aç
    window.print();
    showSnackbar('Yazdırma dialog\'u açıldı', 'info');
  };

  const showSnackbar = (message, severity = 'success', showRetry = false) => {
    setSnackbar({ open: true, message, severity, showRetry });
  };

  const handleRetryLoad = () => {
    setSnackbar({ ...snackbar, open: false });
    loadEmployees();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/qr-imza-yonetimi')}
            sx={{ mb: 2 }}
          >
            Geri Dön
          </Button>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            QR Kod Oluşturucu
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Çalışanlar için güvenli giriş/çıkış QR kodları oluşturun
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        
        {/* Sol Taraf - Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            
            <Typography variant="h6" gutterBottom fontWeight="bold">
              QR Kod Ayarları
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* ✅ BULK MOD SWITCH */}
            <FormControlLabel
              control={
                <Switch
                  checked={bulkMode} 
                  onChange={(e) => {
                    setBulkMode(e.target.checked);
                    if (!e.target.checked) setSelectedEmployees([]);
                    if (e.target.checked) {
                      setSelectedEmployee(null);
                      setQrCode(null);
                      setQrUrl(null);
                    }
                  }}
                  color="primary"
                />
              }
              label="🔄 Toplu Mod (Çoklu Seçim)"
              sx={{ mb: 2 }}
            />
            
            {/* Çalışan Seçimi */}
            {bulkMode ? (
              <Autocomplete
                multiple  // ✅ ÇOKLU SEÇİM
                options={Array.isArray(employees) ? employees : []}
                getOptionLabel={(option) => `${option.adSoyad} - ${option.pozisyon}`}
                value={selectedEmployees}
                onChange={(_, value) => setSelectedEmployees(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Çalışanlar (Çoklu Seçim)"
                    placeholder="Çalışanları ara ve seç..."
                    fullWidth
                    margin="normal"
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Avatar src={option?.profilePhoto} sx={{ mr: 2, width: 32, height: 32 }}>
                        {option?.adSoyad?.charAt(0) || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{option?.adSoyad || 'Bilinmiyor'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option?.pozisyon || '-'} • {option?.lokasyon || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                ChipProps={{ size: 'small' }}
              />
            ) : (
              <Autocomplete
                options={Array.isArray(employees) ? employees : []}
                getOptionLabel={(option) => `${option.adSoyad} - ${option.pozisyon}`}
                value={selectedEmployee}
                onChange={(_, value) => handleEmployeeSelect(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Çalışan"
                  placeholder="Çalışan ara..."
                  fullWidth
                  margin="normal"
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <Box component="li" key={key} {...otherProps}>
                    <Avatar src={option?.profilePhoto} sx={{ mr: 2, width: 32, height: 32 }}>
                      {option?.adSoyad?.charAt(0) || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option?.adSoyad || 'Bilinmiyor'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option?.pozisyon || '-'} • {option?.lokasyon || '-'}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
              noOptionsText={employees.length === 0 ? 'Çalışan yükleniyor...' : 'Çalışan bulunamadı'}
              loading={loading}
            />
            )}

            {/* Bugünkü Durum */}
            {todayStatus && selectedEmployee && (
              <Alert
                severity={
                  todayStatus.hasCheckedIn && todayStatus.hasCheckedOut 
                    ? 'success' 
                    : todayStatus.hasCheckedIn 
                      ? 'info' 
                      : 'warning'
                }
                sx={{ mt: 2 }}
                icon={
                  todayStatus.hasCheckedIn && todayStatus.hasCheckedOut 
                    ? <CheckCircle /> 
                    : <AccessTime />
                }
              >
                {todayStatus.hasCheckedIn ? (
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      ✅ Giriş: {moment(todayStatus.checkInTime).format('HH:mm')}
                    </Typography>
                    {todayStatus.hasCheckedOut && (
                      <Typography variant="body2" fontWeight="medium">
                        ✅ Çıkış: {moment(todayStatus.checkOutTime).format('HH:mm')}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2">
                    Bugün henüz giriş yapmamış
                  </Typography>
                )}
              </Alert>
            )}

            {/* İşlem Tipi */}
            <FormControl component="fieldset" fullWidth sx={{ mt: 3 }}>
              <FormLabel component="legend" sx={{ fontWeight: 600 }}>
                İşlem Tipi
              </FormLabel>
              <RadioGroup
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                row
              >
                <FormControlLabel
                  value="CHECK_IN"
                  control={<Radio />}
                  label="Giriş"
                  disabled={todayStatus && !todayStatus.canCheckIn}
                />
                <FormControlLabel
                  value="CHECK_OUT"
                  control={<Radio />}
                  label="Çıkış"
                  disabled={todayStatus && !todayStatus.canCheckOut}
                />
              </RadioGroup>
              {todayStatus && !todayStatus.canCheckIn && actionType === 'CHECK_IN' && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Bu çalışan bugün zaten giriş yapmış. Lütfen "Çıkış" seçeneğini kullanın.
                </Alert>
              )}
              {todayStatus && !todayStatus.canCheckOut && actionType === 'CHECK_OUT' && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Bu çalışan bugün henüz giriş yapmamış. Lütfen önce "Giriş" QR kodu oluşturun.
                </Alert>
              )}
              {todayStatus && todayStatus.hasCheckedOut && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Bu çalışan bugün giriş ve çıkış işlemlerini tamamlamış.
                </Alert>
              )}
            </FormControl>

            {/* Lokasyon */}
            <FormControl component="fieldset" fullWidth sx={{ mt: 3 }}>
              <FormLabel component="legend" sx={{ fontWeight: 600 }}>
                Lokasyon
              </FormLabel>
              <RadioGroup
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                row
              >
                <FormControlLabel value="MERKEZ" control={<Radio />} label="MERKEZ" />
                <FormControlLabel value="İŞL" control={<Radio />} label="İŞL" />
                <FormControlLabel value="OSB" control={<Radio />} label="OSB" />
                <FormControlLabel value="İŞIL" control={<Radio />} label="İŞIL" />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            {/* Butonlar */}
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleGenerateQR}
                disabled={
                  bulkMode ||  // ✅ Toplu modda disable
                  !selectedEmployee || 
                  loading ||
                  hasActiveToken ||  // ✅ DUPLICATE PREVENTION
                  (todayStatus && actionType === 'CHECK_IN' && !todayStatus.canCheckIn) ||
                  (todayStatus && actionType === 'CHECK_OUT' && !todayStatus.canCheckOut)
                }
                startIcon={loading ? <CircularProgress size={20} /> : <QrCode2 />}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Oluşturuluyor...' : hasActiveToken ? 'Aktif QR Var!' : 'Tekli QR Kod Oluştur'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleGenerateBulk}
                disabled={
                  !bulkMode ||  // ✅ Toplu mod aktif değilse disable
                  bulkLoading || 
                  selectedEmployees.length === 0  // ✅ Seçili çalışan yoksa disable
                }
                startIcon={bulkLoading ? <CircularProgress size={20} /> : <Print />}
                sx={{ py: 1.5 }}
              >
                {bulkLoading ? 'Oluşturuluyor...' : `Toplu QR Oluştur (${bulkMode ? selectedEmployees.length : Array.isArray(employees) ? employees.length : 0} çalışan)`}
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="caption">
                <strong>Bilgi:</strong> QR kodlar 2 dakika geçerlidir ve tek kullanımlıktır.
              </Typography>
            </Alert>

          </Paper>
        </Grid>

        {/* Sağ Taraf - QR Kod Önizleme */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, minHeight: 600 }}>
            
            {qrCode ? (
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  QR Kod Hazır! ✅
                </Typography>

                {/* Çalışan Bilgisi */}
                {selectedEmployee && (
                  <Box mb={3}>
                    <Avatar
                      src={selectedEmployee.profilePhoto}
                      sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                    >
                      {selectedEmployee.adSoyad.charAt(0)}
                    </Avatar>
                    <Typography variant="h6">{selectedEmployee.adSoyad}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEmployee.pozisyon}
                    </Typography>
                    <Box mt={1} display="flex" gap={1} justifyContent="center">
                      <Chip
                        label={actionType === 'CHECK_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}
                        color={actionType === 'CHECK_IN' ? 'success' : 'error'}
                        size="small"
                      />
                      <Chip label={location} size="small" variant="outlined" />
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* QR Kod */}
                <Box
                  ref={qrImageRef}
                  sx={{
                    display: 'inline-block',
                    p: 3,
                    bgcolor: 'white',
                    border: '4px solid',
                    borderColor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                    borderRadius: 3,
                    boxShadow: 3
                  }}
                >
                  <img
                    src={qrCode}
                    alt="QR Code"
                    style={{
                      width: 250,
                      height: 250,
                      display: 'block'
                    }}
                  />
                </Box>

                {/* Kalan Süre */}
                <Alert
                  severity={remainingSeconds < 30 ? 'error' : remainingSeconds < 60 ? 'warning' : 'info'}
                  sx={{ mt: 3 }}
                  icon={<AccessTime />}
                >
                  <Typography variant="body2" fontWeight="medium">
                    Kalan Süre: {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
                  </Typography>
                  <Typography variant="caption">
                    {moment(expiresAt).format('HH:mm:ss')} tarihinde geçersiz olacak
                  </Typography>
                </Alert>

                {/* URL */}
                <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    QR Kod Linki:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}
                  >
                    {qrUrl}
                  </Typography>
                </Paper>

                {/* İşlem Butonları */}
                <Grid container spacing={2} mt={2}>
                  <Grid item xs={4}>
                    <Button
                      variant="contained"
                      onClick={handleDownloadQR}
                      startIcon={<Download />}
                      fullWidth
                      size="small"
                    >
                      İndir
                    </Button>
                  </Grid>
                  <Grid item xs={4}>
                    <Button
                      variant="outlined"
                      onClick={handleCopyURL}
                      startIcon={<ContentCopy />}
                      fullWidth
                      size="small"
                    >
                      Linki Kopyala
                    </Button>
                  </Grid>
                  <Grid item xs={4}>
                    <Button
                      variant="outlined"
                      onClick={handleGenerateQR}
                      startIcon={<Refresh />}
                      fullWidth
                      size="small"
                      color="warning"
                    >
                      Yenile
                    </Button>
                  </Grid>
                </Grid>

                {/* Kullanım Bilgisi */}
                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="caption">
                    <strong>Nasıl Kullanılır?</strong><br />
                    1. QR kodu telefonla tarayın<br />
                    2. İmza sayfası otomatik açılacak<br />
                    3. İmza atıp onaylayın
                  </Typography>
                </Alert>

              </Box>
            ) : (
              <Box textAlign="center" py={8}>
                <QrCode2 sx={{ fontSize: 120, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  QR Kod Oluşturun
                </Typography>
                <Typography variant="body2" color="text.disabled" mt={1}>
                  Sol taraftan çalışan seçip QR kod oluşturabilirsiniz
                </Typography>
              </Box>
            )}

          </Paper>
        </Grid>

      </Grid>

      {/* Toplu QR Kod Dialog */}
      <Dialog
        open={bulkDialog}
        onClose={() => setBulkDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Toplu QR Kodlar ({bulkQRCodes.length})
            </Typography>
            <Box>
              <Button
                startIcon={<Print />}
                onClick={handlePrintBulk}
                sx={{ mr: 1 }}
              >
                Yazdır
              </Button>
              <IconButton onClick={() => setBulkDialog(false)}>
                <Cancel />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} id="bulk-qr-print-area" className="print-area">
            {bulkQRCodes.map((item, index) => (
              <Grid item xs={6} sm={4} md={3} key={`bulk-qr-${index}`}>
                <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="body2" noWrap fontWeight="bold" mb={1}>
                      {item.adSoyad}
                    </Typography>
                    <Box
                      component="img"
                      src={item.qrCode}
                      alt={item.adSoyad}
                      sx={{ width: '100%', height: 'auto', mb: 1 }}
                    />
                    <Chip
                      label={actionType === 'CHECK_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}
                      size="small"
                      color={actionType === 'CHECK_IN' ? 'success' : 'error'}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {bulkQRCodes.length === 0 && (
            <Box textAlign="center" py={8}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar with Retry */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.showRetry ? null : 4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          action={
            snackbar.showRetry && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRetryLoad}
                startIcon={<Refresh />}
              >
                Tekrar Dene
              </Button>
            )
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* API Connection Status */}
      {!apiConnected && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'fixed', 
            top: 20, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 9999,
            minWidth: 400
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetryLoad}
              startIcon={<Refresh />}
            >
              Yeniden Yükle
            </Button>
          }
        >
          <strong>API Bağlantı Hatası:</strong> Çalışanlar yüklenemedi. Lütfen tekrar deneyin.
        </Alert>
      )}

      {/* Print Styles */}
      <style>
        {`
          @media print {
            /* Sadece print area göster */
            body * {
              visibility: hidden;
            }
            
            .print-area,
            .print-area * {
              visibility: visible;
            }
            
            #bulk-qr-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            
            /* Dialog gizle */
            .MuiDialog-root .MuiDialogTitle-root,
            .MuiDialog-root .MuiDialogActions-root {
              display: none !important;
            }
            
            /* QR card'ları düzenle */
            .print-area .MuiGrid-item {
              page-break-inside: avoid;
            }
            
            /* Sayfa kenarları */
            @page {
              margin: 1cm;
              size: A4;
            }
          }
        `}
      </style>

    </Container>
  );
};

export default QRCodeGenerator;

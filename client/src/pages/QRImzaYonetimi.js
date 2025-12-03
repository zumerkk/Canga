import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Tab,
  Tabs,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Badge,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar
} from '@mui/material';
import {
  QrCode2,
  CheckCircle,
  Cancel,
  Refresh,
  Download,
  Search,
  Edit,
  Print,
  AccessTime,
  TouchApp,
  Warning,
  Analytics as AnalyticsIcon,
  CalendarToday,
  BarChart,
  Save,
  Close,
  Visibility,
  LocationOn,
  Psychology,
  SmartToy,
  Assessment,
  Security,
  Send,
  AutoAwesome,
  TrendingUp
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';
import LiveLocationMap from '../components/LiveLocationMap';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { exportToPDF, exportToExcel, exportToCSV, exportStatisticsToPDF } from '../utils/exportUtils';
import SignatureDetailModal from '../components/SignatureDetailModal';
import ReportingDashboard from '../components/ReportingDashboard';
import AIHealthStatus from '../components/AIHealthStatus';

moment.locale('tr');

/**
 * 🎯 QR/İMZA YÖNETİMİ - TAM ÖZELLİKLİ DASHBOARD
 */

function QRImzaYonetimi() {
  const navigate = useNavigate();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Canlı istatistikler
  const [liveStats, setLiveStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Bugünkü kayıtlar
  const [todayRecords, setTodayRecords] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  
  // Raporlama
  const [reportLoading, setReportLoading] = useState(false);
  
  // Arama ve filtreleme
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('TÜM');
  const [showOnlyNoLocation, setShowOnlyNoLocation] = useState(false);
  
  // Dialog'lar
  const [editDialog, setEditDialog] = useState(false);
  const [signatureDialog, setSignatureDialog] = useState(false);
  const [systemQRDialog, setSystemQRDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    checkInTime: '',
    checkOutTime: '',
    reason: ''
  });
  
  // Sistem QR
  const [systemQR, setSystemQR] = useState(null);
  const [systemQRLoading, setSystemQRLoading] = useState(false);
  
  // 🏢 Şube seçimi için dialog
  const [branchSelectDialog, setBranchSelectDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('MERKEZ');
  
  // 🏢 Şube filtreleme
  const [filterBranch, setFilterBranch] = useState('TÜM');
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    showRetry: false
  });
  
  // API Connection Status
  const [apiConnected, setApiConnected] = useState(true);

  // AI & Risk State
  const [riskAlerts, setRiskAlerts] = useState({ anomalies: [], fraud: [], summary: null });
  const [riskLoading, setRiskLoading] = useState(false);
  
  // 🛡️ Fraud Detection State
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [securityStats, setSecurityStats] = useState(null);
  
  // AI Chat State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // İlk yükleme
  useEffect(() => {
    loadInitialData();
    
    // Her 10 saniyede bir otomatik güncelleme
    const interval = setInterval(() => {
      if (currentTab === 0) {
        loadLiveStats();
        loadTodayRecords();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentTab, filterLocation]);

  // Tab değiştiğinde veri yükle
  useEffect(() => {
    if (currentTab === 0) {
      loadTodayRecords();
    }
  }, [currentTab]);

  // Veri yükleme fonksiyonları
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLiveStats(),
        loadTodayRecords(),
        fetchRiskAlerts(),
        loadFraudAlerts(),
        loadSecurityStats()
      ]);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      showSnackbar('Veri yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 🛡️ Fraud Alert'leri yükle
  const loadFraudAlerts = async () => {
    try {
      const response = await api.get('/api/system-qr/fraud-alerts', {
        params: { level: 'MEDIUM', limit: 20 }
      });
      setFraudAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Fraud alerts yüklenemedi:', error);
    }
  };
  
  // 🛡️ Güvenlik istatistiklerini yükle
  const loadSecurityStats = async () => {
    try {
      const response = await api.get('/api/system-qr/security-stats');
      setSecurityStats(response.data.stats || null);
    } catch (error) {
      console.error('Security stats yüklenemedi:', error);
    }
  };

  const loadLiveStats = async () => {
    try {
      const params = {};
      if (filterLocation !== 'TÜM') {
        params.location = filterLocation;
      }
      
      const response = await api.get('/api/attendance/live-stats', { params });
      setLiveStats(response.data);
      setApiConnected(true); // ✅ API bağlantısı başarılı
    } catch (error) {
      setApiConnected(false); // ❌ API bağlantısı başarısız
      showSnackbar('API bağlantısı kurulamadı. Lütfen tekrar deneyin.', 'error', true);
      // İlk yüklemede hata varsa varsayılan değerler
      setLiveStats({
        stats: {
          totalEmployees: 0,
          present: 0,
          absent: 0,
          late: 0,
          incomplete: 0,
          checkedOut: 0
        },
        recentActivity: []
      });
    }
  };

  const loadTodayRecords = async () => {
    try {
      const today = moment().format('YYYY-MM-DD');
      const params = { date: today };
      if (filterLocation !== 'TÜM') {
        params.location = filterLocation;
      }
      
      const response = await api.get('/api/attendance/daily', { params });
      setTodayRecords(response.data.records || []);
      setRecentActivity(response.data.records?.slice(0, 10) || []);
    } catch (error) {
      console.error('Günlük kayıtlar yükleme hatası:', error);
      setTodayRecords([]);
    }
  };

  const fetchRiskAlerts = async () => {
    try {
      setRiskLoading(true);
      // Paralel olarak anomali ve fraud tespiti yap
      const [anomalyRes, fraudRes] = await Promise.all([
        api.get('/api/attendance-ai/detect-anomalies', { params: { date: moment().format('YYYY-MM-DD') } }),
        api.get('/api/attendance-ai/detect-fraud')
      ]);

      setRiskAlerts({
        anomalies: anomalyRes.data?.anomalies?.anomaliler || [],
        fraud: fraudRes.data?.fraudAnalysis?.fraud_bulgulari || [],
        summary: {
          anomalyCount: anomalyRes.data?.anomalies?.anomaliler?.length || 0,
          fraudCount: fraudRes.data?.fraudAnalysis?.fraud_bulgulari?.length || 0
        }
      });
    } catch (error) {
      console.error('Risk analizi hatası:', error);
      // Hata olsa bile UI'ı bozma
    } finally {
      setRiskLoading(false);
    }
  };
  
  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    
    try {
      setAiLoading(true);
      const response = await api.post('/api/attendance-ai/nlp-search', { query: aiQuery });
      setAiResponse(response.data);
    } catch (error) {
      console.error('AI Search Error:', error);
      showSnackbar('AI yanıt veremedi, lütfen tekrar deneyin.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    showSnackbar('Veriler güncellendi', 'success');
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCreateQR = () => {
    navigate('/qr-kod-olustur');
  };

  // 🏢 Şube seçim dialogunu aç
  const handleOpenBranchSelect = () => {
    setBranchSelectDialog(true);
  };
  
  // 🏢 Şube seçilince QR oluştur
  const handleCreateSystemQR = async (branch = selectedBranch) => {
    try {
      setSystemQRLoading(true);
      setBranchSelectDialog(false);
      
      const branchNames = {
        'MERKEZ': 'Merkez Şube',
        'IŞIL': 'Işıl Şube'
      };
      
      const response = await api.post('/api/system-qr/generate-system-qr', {
        type: 'BOTH', // Hem giriş hem çıkış
        location: 'ALL',
        description: `${branchNames[branch]} - Günlük Giriş-Çıkış Sistem QR`,
        expiryHours: 24,
        branch: branch // 🏢 Şube bilgisi
      });
      
      setSystemQR(response.data);
      setSystemQRDialog(true);
      showSnackbar(`${branchNames[branch]} QR kodu oluşturuldu (24 saat geçerli)`, 'success');
    } catch (error) {
      showSnackbar(
        error.response?.data?.error || 'Sistem QR kodu oluşturulamadı',
        'error'
      );
    } finally {
      setSystemQRLoading(false);
    }
  };

  const handleViewSignature = (record) => {
    // Gelişmiş detay modalını aç
    setSelectedDetailRecord(record);
    setDetailModalOpen(true);
  };

  const handleDownloadSystemQR = () => {
    if (!systemQR?.qrCode) return;
    
    const link = document.createElement('a');
    link.href = systemQR.qrCode;
    link.download = `Sistem_QR_${moment().format('YYYYMMDD')}.png`;
    link.click();
    
    showSnackbar('Sistem QR kodu indirildi', 'success');
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setEditFormData({
      checkInTime: record.checkIn?.time ? moment(record.checkIn.time).format('YYYY-MM-DDTHH:mm') : '',
      checkOutTime: record.checkOut?.time ? moment(record.checkOut.time).format('YYYY-MM-DDTHH:mm') : '',
      reason: ''
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      
      await api.put(`/api/attendance/${selectedRecord._id}/correct`, {
        checkInTime: editFormData.checkInTime ? new Date(editFormData.checkInTime).toISOString() : null,
        checkOutTime: editFormData.checkOutTime ? new Date(editFormData.checkOutTime).toISOString() : null,
        reason: editFormData.reason,
        userId: 'admin' // TODO: Gerçek user ID
      });
      
      showSnackbar('Kayıt başarıyla güncellendi', 'success');
      setEditDialog(false);
      await loadTodayRecords();
    } catch (error) {
      console.error('Kayıt güncelleme hatası:', error);
      showSnackbar('Kayıt güncellenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportType) => {
    try {
      setReportLoading(true);
      
      let url = '';
      let filename = '';
      const today = moment();
      
      switch(reportType) {
        case 'daily':
          url = '/api/attendance/daily';
          filename = `gunluk_rapor_${today.format('YYYY-MM-DD')}.xlsx`;
          break;
        case 'weekly':
          url = '/api/attendance/daily';
          filename = `haftalik_rapor_${today.format('YYYY-MM-DD')}.xlsx`;
          break;
        case 'monthly':
          url = '/api/attendance/payroll-export';
          filename = `aylik_rapor_${today.format('YYYY-MM')}.xlsx`;
          break;
        default:
          return;
      }
      
      const params = {
        year: today.year(),
        month: today.month() + 1
      };
      
      if (filterLocation !== 'TÜM') {
        params.location = filterLocation;
      }
      
      const response = await api.get(url, {
        params,
        responseType: 'blob'
      });
      
      // Blob'u indir
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      showSnackbar('Rapor başarıyla indirildi', 'success');
    } catch (error) {
      console.error('Rapor indirme hatası:', error);
      showSnackbar('Rapor indirilirken hata oluştu', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success', showRetry = false) => {
    setSnackbar({
      open: true,
      message,
      severity,
      showRetry
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRetry = () => {
    setSnackbar({ ...snackbar, open: false });
    loadInitialData(); // Verileri yeniden yükle
  };

  // Filtreleme
  const filteredRecords = todayRecords.filter(record => {
    // Lokasyon filtresi (ek güvenlik için client-side da kontrol et)
    if (filterLocation !== 'TÜM') {
      const recordLocation =
        record.checkIn?.location ||
        record.employeeId?.lokasyon ||
        record.checkOut?.location;
      if (recordLocation !== filterLocation) {
        return false;
      }
    }
    
    // 🏢 Şube filtresi
    if (filterBranch !== 'TÜM') {
      const recordBranch = record.checkIn?.branch;
      if (recordBranch !== filterBranch) {
        return false;
      }
    }

    // Arama filtresi
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        record.employeeId?.adSoyad?.toLowerCase().includes(searchLower) ||
        record.employeeId?.tcNo?.includes(searchTerm) ||
        record.employeeId?.pozisyon?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    
    // Konum yok filtresi
    if (showOnlyNoLocation) {
      return record.checkIn?.time && !record.checkIn?.coordinates;
    }
    
    return true;
  });

  // Render yardımcı fonksiyonlar
  const getStatusColor = (status) => {
    const colors = {
      'NORMAL': 'success',
      'LATE': 'warning',
      'EARLY_LEAVE': 'warning',
      'ABSENT': 'error',
      'INCOMPLETE': 'info',
      'LEAVE': 'info',
      'HOLIDAY': 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'NORMAL': 'Normal',
      'LATE': 'Geç Geldi',
      'EARLY_LEAVE': 'Erken Çıktı',
      'ABSENT': 'Devamsız',
      'INCOMPLETE': 'Eksik Kayıt',
      'LEAVE': 'İzinli',
      'HOLIDAY': 'Tatil'
    };
    return texts[status] || status;
  };

  const getMethodIcon = (method) => {
    const icons = {
      'CARD': <QrCode2 fontSize="small" />,
      'TABLET': <TouchApp fontSize="small" />,
      'MOBILE': <TouchApp fontSize="small" />,
      'MANUAL': <Edit fontSize="small" />,
      'EXCEL_IMPORT': <Download fontSize="small" />
    };
    return icons[method] || <QrCode2 fontSize="small" />;
  };

  if (loading && !liveStats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            QR/İmza Yönetim Sistemi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerçek zamanlı giriş-çıkış takip ve yönetim • Son güncelleme: {moment().format('HH:mm:ss')}
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Yenile
          </Button>
          
          {/* AI Status Indicator */}
          <Chip 
            icon={<AutoAwesome />} 
            label="AI Aktif" 
            color="primary" 
            variant="outlined" 
            sx={{ borderColor: 'primary.main', color: 'primary.main' }}
          />

          <Button
            variant="contained"
            startIcon={systemQRLoading ? <CircularProgress size={16} /> : <QrCode2 />}
            onClick={handleOpenBranchSelect}
            disabled={systemQRLoading}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF8E53 0%, #FF6B6B 100%)'
              }
            }}
          >
            🏢 Şube QR Kod (24s)
          </Button>
          <Button
            variant="contained"
            startIcon={<QrCode2 />}
            onClick={handleCreateQR}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
              }
            }}
          >
            QR Kod Oluştur
          </Button>
        </Box>
      </Box>

      {/* Tab Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem'
            }
          }}
        >
          <Tab icon={<CalendarToday />} label="Bugünkü Kayıtlar" iconPosition="start" />
          <Tab icon={<QrCode2 />} label="QR Kod Yönetimi" iconPosition="start" />
          <Tab icon={<TouchApp />} label="İmza Kayıtları" iconPosition="start" />
          <Tab icon={<BarChart />} label="Raporlama" iconPosition="start" />
          <Tab icon={<AnalyticsIcon />} label="Gelişmiş Analitik" iconPosition="start" />
          <Tab icon={<Psychology />} label="AI Asistanı" iconPosition="start" sx={{ color: '#7b1fa2' }} />
        </Tabs>
      </Paper>
      
      {/* 🛡️ GELİŞMİŞ GÜVENLİK DASHBOARD (Risk Radarı) */}
      {currentTab === 0 && (
        (riskAlerts.summary?.anomalyCount > 0 || 
         riskAlerts.summary?.fraudCount > 0 || 
         fraudAlerts.length > 0 ||
         securityStats?.anomalyCount > 0) && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            background: 'linear-gradient(to right, #fff3e0, #ffebee)', 
            border: '1px solid #ffccbc',
            borderRadius: 2
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Security color="error" />
              <Typography variant="h6" color="error.main" fontWeight="bold">
                🛡️ Güvenlik Radarı
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              {securityStats && (
                <>
                  <Chip 
                    label={`${securityStats.anomalyCount} Anomali`} 
                    size="small" 
                    color={securityStats.anomalyCount > 0 ? "warning" : "default"}
                  />
                  <Chip 
                    label={`${securityStats.needsCorrectionCount} Düzeltme`} 
                    size="small" 
                    color={securityStats.needsCorrectionCount > 0 ? "error" : "default"}
                  />
                  <Chip 
                    label={`${securityStats.noLocationCount} GPS Yok`} 
                    size="small" 
                    color={securityStats.noLocationCount > 0 ? "info" : "default"}
                  />
                </>
              )}
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            {/* AI Anomaliler */}
            {riskAlerts.anomalies.slice(0, 2).map((anomaly, idx) => (
              <Grid item xs={12} md={6} key={`anomaly-${idx}`}>
                <Alert severity="warning" icon={<Warning />}>
                  <strong>AI Anomali:</strong> {anomaly.calisan} - {anomaly.detay || anomaly.sorun}
                </Alert>
              </Grid>
            ))}
            
            {/* AI Fraud Tespitleri */}
            {riskAlerts.fraud.slice(0, 2).map((fraud, idx) => (
              <Grid item xs={12} md={6} key={`fraud-${idx}`}>
                <Alert severity="error" icon={<Security />}>
                  <strong>AI Fraud:</strong> {fraud.calisan} - {fraud.detay || 'Şüpheli işlem'}
                </Alert>
              </Grid>
            ))}
            
            {/* 🛡️ Real-time Fraud Alerts */}
            {fraudAlerts.slice(0, 3).map((alert, idx) => (
              <Grid item xs={12} key={`fraud-alert-${idx}`}>
                <Alert 
                  severity={
                    alert.level?.level === 'CRITICAL' ? 'error' : 
                    alert.level?.level === 'HIGH' ? 'error' : 
                    alert.level?.level === 'MEDIUM' ? 'warning' : 'info'
                  }
                  icon={<Security />}
                  sx={{
                    borderLeft: `4px solid ${
                      alert.level?.level === 'CRITICAL' ? '#d32f2f' :
                      alert.level?.level === 'HIGH' ? '#f57c00' :
                      alert.level?.level === 'MEDIUM' ? '#fbc02d' : '#1976d2'
                    }`
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.recommendation} • {new Date(alert.createdAt).toLocaleTimeString('tr-TR')}
                    </Typography>
                  </Box>
                </Alert>
              </Grid>
            ))}
          </Grid>
          
          {/* Düzeltme Gerektiren Kayıtlar */}
          {securityStats?.needsCorrectionCount > 0 && (
            <Alert severity="info" sx={{ mt: 2 }} icon={<Edit />}>
              <Typography variant="body2">
                <strong>{securityStats.needsCorrectionCount}</strong> kayıt manuel doğrulama bekliyor. 
                Bu kayıtları inceleyip onaylayın veya düzeltin.
              </Typography>
            </Alert>
          )}
        </Paper>
      ))}

      {/* TAB 0: Bugünkü Kayıtlar */}
      {currentTab === 0 && (
        <Box>
          {/* Canlı İstatistik Kartları */}
          {liveStats && (
            <Grid container spacing={3} mb={4}>
              {/* İçeride */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Şu An İçeride
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {liveStats.stats?.present || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          / {liveStats.stats?.totalEmployees || 0} çalışan
                        </Typography>
                      </Box>
                      <CheckCircle sx={{ fontSize: 60, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Devamsız */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Devamsız
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {liveStats.stats?.absent || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          Bugün gelmedi
                        </Typography>
                      </Box>
                      <Cancel sx={{ fontSize: 60, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Geç Kalan */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    color: '#333',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Geç Kalan
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {liveStats.stats?.late || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          Bugün
                        </Typography>
                      </Box>
                      <AccessTime sx={{ fontSize: 60, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Eksik Kayıt */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    color: '#333',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          Eksik Kayıt
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {liveStats.stats?.incomplete || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          Düzeltme gerekli
                        </Typography>
                      </Box>
                      <Warning sx={{ fontSize: 60, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Konum Belirtilmemiş */}
              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  sx={{
                    background: 'linear-gradient(135deg, #FFB75E 0%, #ED8F03 100%)',
                    color: 'white',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                  }}
                  onClick={() => setShowOnlyNoLocation(!showOnlyNoLocation)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          ⚠️ Konum Yok
                        </Typography>
                        <Typography variant="h3" fontWeight="bold">
                          {todayRecords.filter(r => r.checkIn?.time && !r.checkIn?.coordinates).length}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          İK/BİT ile görüş
                        </Typography>
                      </Box>
                      <LocationOn sx={{ fontSize: 60, opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Arama ve Filtreler */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Çalışan ara (isim, TC, pozisyon)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Lokasyon:</Typography>
                  {['TÜM', 'MERKEZ', 'İŞL', 'OSB', 'İŞIL'].map((loc) => (
                    <Chip
                      key={loc}
                      label={loc}
                      size="small"
                      onClick={() => {
                        setFilterLocation(loc);
                        setShowOnlyNoLocation(false);
                      }}
                      color={filterLocation === loc && !showOnlyNoLocation ? 'primary' : 'default'}
                      variant={filterLocation === loc && !showOnlyNoLocation ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>🏢 Giriş Şubesi:</Typography>
                  {['TÜM', 'MERKEZ', 'IŞIL'].map((branch) => (
                    <Chip
                      key={`branch-${branch}`}
                      label={branch === 'TÜM' ? 'Tümü' : branch === 'MERKEZ' ? 'Merkez' : 'Işıl'}
                      size="small"
                      onClick={() => setFilterBranch(branch)}
                      color={filterBranch === branch ? (branch === 'MERKEZ' ? 'primary' : branch === 'IŞIL' ? 'secondary' : 'default') : 'default'}
                      variant={filterBranch === branch ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
            <Box display="flex" gap={1} mt={2}>
              <Chip
                icon={<Warning />}
                label={`Konum Yok (${todayRecords.filter(r => r.checkIn?.time && !r.checkIn?.coordinates).length})`}
                onClick={() => setShowOnlyNoLocation(!showOnlyNoLocation)}
                color={showOnlyNoLocation ? 'warning' : 'default'}
                variant={showOnlyNoLocation ? 'filled' : 'outlined'}
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          </Paper>

          {/* Kayıt Listesi */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Çalışan</strong></TableCell>
                  <TableCell><strong>🏢 Şube</strong></TableCell>
                  <TableCell><strong>Giriş</strong></TableCell>
                  <TableCell><strong>Çıkış</strong></TableCell>
                  <TableCell><strong>Çalışma Süresi</strong></TableCell>
                  <TableCell><strong>Yöntem</strong></TableCell>
                  <TableCell><strong>Durum</strong></TableCell>
                  <TableCell align="center"><strong>İşlemler</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <Typography color="text.secondary">
                          {searchTerm ? 'Arama sonucu bulunamadı' : 'Bugün henüz kayıt yok'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record._id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar src={record.employeeId?.profilePhoto} sx={{ width: 40, height: 40 }}>
                            {record.employeeId?.adSoyad?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {record.employeeId?.adSoyad || 'Bilinmiyor'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {record.employeeId?.pozisyon || '-'}
                            </Typography>
                            {/* Konum Eksikliği Uyarısı */}
                            {!record.checkIn?.coordinates && record.checkIn?.time && (
                              <Box mt={0.5}>
                                <Chip
                                  icon={<Warning />}
                                  label="Konum Yok"
                                  size="small"
                                  color="warning"
                                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      {/* 🏢 Şube Kolonu */}
                      <TableCell>
                        {record.checkIn?.branch ? (
                          <Chip
                            label={record.checkIn.branch === 'MERKEZ' ? 'Merkez' : 'Işıl'}
                            size="small"
                            color={record.checkIn.branch === 'MERKEZ' ? 'primary' : 'secondary'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.checkIn?.time ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {moment(record.checkIn.time).format('HH:mm')}
                            </Typography>
                            <Chip
                              icon={getMethodIcon(record.checkIn.method)}
                              label={record.checkIn.method}
                              size="small"
                              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        ) : (
                          <Typography color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.checkOut?.time ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {moment(record.checkOut.time).format('HH:mm')}
                            </Typography>
                            <Chip
                              icon={getMethodIcon(record.checkOut.method)}
                              label={record.checkOut.method}
                              size="small"
                              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                        ) : (
                          <Typography color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.workDuration > 0 ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {Math.floor(record.workDuration / 60)}s {record.workDuration % 60}dk
                            </Typography>
                            {record.overtimeMinutes > 0 && (
                              <Typography variant="caption" color="success.main">
                                +{Math.floor(record.overtimeMinutes / 60)}s fazla
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={record.checkIn?.signature ? <TouchApp /> : <QrCode2 />}
                          label={record.checkIn?.signature ? 'İmzalı' : 'Kart'}
                          size="small"
                          color={record.checkIn?.signature ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(record.status)}
                          color={getStatusColor(record.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRecord(record)}
                            color="primary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {record.checkIn?.signature && (
                          <Tooltip title="İmzayı Görüntüle">
                            <IconButton
                              size="small"
                              onClick={() => handleViewSignature(record)}
                              color="secondary"
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Özet Bilgiler */}
          {filteredRecords.length > 0 && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="caption" color="text.secondary">Toplam Kayıt</Typography>
                  <Typography variant="h6" fontWeight="bold">{filteredRecords.length}</Typography>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="caption" color="text.secondary">Giriş Yapan</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {filteredRecords.filter(r => r.checkIn?.time).length}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="caption" color="text.secondary">Çıkış Yapan</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {filteredRecords.filter(r => r.checkOut?.time).length}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Typography variant="caption" color="text.secondary">İmzalı Kayıt</Typography>
                  <Typography variant="h6" fontWeight="bold" color="secondary.main">
                    {filteredRecords.filter(r => r.checkIn?.signature).length}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <Typography variant="caption" color="text.secondary">⚠️ Konum Belirtilmemiş</Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {filteredRecords.filter(r => r.checkIn?.time && !r.checkIn?.coordinates).length}
                  </Typography>
                  {filteredRecords.filter(r => r.checkIn?.time && !r.checkIn?.coordinates).length > 0 && (
                    <Typography variant="caption" color="warning.main" display="block">
                      İK/BİT ile görüşün
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>
      )}

      {/* TAB 1: QR Kod Yönetimi */}
      {currentTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <QrCode2 sx={{ fontSize: 120, color: 'primary.main', mb: 3 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">
                QR Kod Oluştur
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Tekli veya toplu QR kod oluşturarak giriş-çıkış işlemlerini kolaylaştırın
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<QrCode2 />}
                onClick={handleCreateQR}
                sx={{ mt: 2 }}
              >
                QR Kod Oluşturucu'ya Git
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Bugünkü İstatistikler
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Toplam Kayıt:</Typography>
                  <Typography variant="body2" fontWeight="bold">{todayRecords.length}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">QR ile Giriş:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {todayRecords.filter(r => r.checkIn?.method === 'MOBILE' || r.checkIn?.method === 'TABLET').length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Kart ile Giriş:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {todayRecords.filter(r => r.checkIn?.method === 'CARD').length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Manuel Kayıt:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    {todayRecords.filter(r => r.checkIn?.method === 'MANUAL').length}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography variant="body2" gutterBottom>QR Kullanım Oranı</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={todayRecords.length > 0 
                      ? (todayRecords.filter(r => r.checkIn?.method === 'MOBILE' || r.checkIn?.method === 'TABLET').length / todayRecords.length) * 100 
                      : 0}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {todayRecords.length > 0 
                      ? ((todayRecords.filter(r => r.checkIn?.method === 'MOBILE' || r.checkIn?.method === 'TABLET').length / todayRecords.length) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: İmza Kayıtları */}
      {currentTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            İmza ile Yapılan Kayıtlar
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            QR kod ile imza atılarak yapılan giriş-çıkış kayıtları
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Çalışan</strong></TableCell>
                  <TableCell><strong>Tarih-Saat</strong></TableCell>
                  <TableCell><strong>Tip</strong></TableCell>
                  <TableCell><strong>İmza</strong></TableCell>
                  <TableCell align="center"><strong>İşlemler</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todayRecords.filter(r => r.checkIn?.signature || r.checkOut?.signature).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box py={4}>
                        <TouchApp sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary">
                          Bugün imzalı kayıt bulunmuyor
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  todayRecords
                    .filter(r => r.checkIn?.signature || r.checkOut?.signature)
                    .map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar src={record.employeeId?.profilePhoto}>
                              {record.employeeId?.adSoyad?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {record.employeeId?.adSoyad}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {record.employeeId?.pozisyon}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {record.checkIn?.signature && (
                            <Typography variant="body2">
                              Giriş: {moment(record.checkIn.time).format('HH:mm')}
                            </Typography>
                          )}
                          {record.checkOut?.signature && (
                            <Typography variant="body2">
                              Çıkış: {moment(record.checkOut.time).format('HH:mm')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={record.checkIn?.method || record.checkOut?.method}
                            size="small"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<TouchApp />}
                            label="İmzalı"
                            size="small"
                            color="success"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="İmzayı Görüntüle">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleViewSignature(record)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {todayRecords.filter(r => r.checkIn?.signature || r.checkOut?.signature).length > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Bugün toplam {todayRecords.filter(r => r.checkIn?.signature || r.checkOut?.signature).length} adet imzalı kayıt var
            </Alert>
          )}
        </Paper>
      )}

      {/* TAB 3: Gelişmiş Raporlama */}
      {currentTab === 3 && (
        <ReportingDashboard />
      )}

      {/* ESKİ TAB 3: Raporlama - GİZLENDİ */}
      {false && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Günlük Rapor
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Bugünün detaylı giriş-çıkış raporu (Excel)
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" display="block" color="text.secondary" mb={2}>
                  • Tüm giriş-çıkış kayıtları<br />
                  • Çalışma süreleri<br />
                  • Fazla mesai hesaplamaları
                </Typography>
                <Button
                  variant="contained"
                  startIcon={reportLoading ? <CircularProgress size={16} /> : <Download />}
                  fullWidth
                  disabled={reportLoading}
                  onClick={() => handleDownloadReport('daily')}
                >
                  Excel İndir
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Haftalık Rapor
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Bu haftanın özet raporu (Excel)
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" display="block" color="text.secondary" mb={2}>
                  • Haftalık özet<br />
                  • Devamsızlık analizi<br />
                  • Geç kalma istatistikleri
                </Typography>
                <Button
                  variant="contained"
                  startIcon={reportLoading ? <CircularProgress size={16} /> : <Download />}
                  fullWidth
                  disabled={reportLoading}
                  onClick={() => handleDownloadReport('weekly')}
                >
                  Excel İndir
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Aylık Rapor (Bordro)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Bu ayın detaylı bordro raporu (Excel)
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" display="block" color="text.secondary" mb={2}>
                  • Aylık çalışma saatleri<br />
                  • Bordro hazırlığı<br />
                  • Fazla mesai toplamları
                </Typography>
                <Button
                  variant="contained"
                  startIcon={reportLoading ? <CircularProgress size={16} /> : <Download />}
                  fullWidth
                  disabled={reportLoading}
                  onClick={() => handleDownloadReport('monthly')}
                  color="success"
                >
                  Excel İndir
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Yazdırma Seçeneği */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Özel Rapor
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Başlangıç Tarihi"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    defaultValue={moment().format('YYYY-MM-DD')}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Bitiş Tarihi"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    defaultValue={moment().format('YYYY-MM-DD')}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Lokasyon</InputLabel>
                    <Select value={filterLocation} label="Lokasyon">
                      <MenuItem value="TÜM">Tümü</MenuItem>
                      <MenuItem value="MERKEZ">MERKEZ</MenuItem>
                      <MenuItem value="İŞL">İŞL</MenuItem>
                      <MenuItem value="OSB">OSB</MenuItem>
                      <MenuItem value="İŞIL">İŞIL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    fullWidth
                    sx={{ height: 56 }}
                  >
                    Rapor Oluştur
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 4: Analitik (Refactored with AdvancedAnalytics) */}
      {currentTab === 4 && (
        <Box>
          <AdvancedAnalytics 
            records={todayRecords} 
            liveStats={liveStats} 
          />
        </Box>
      )}

      {/* TAB 5: AI Asistanı (YENİ) */}
      {currentTab === 5 && (
        <Grid container spacing={3}>
          {/* AI Health Status */}
          <Grid item xs={12}>
            <AIHealthStatus />
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
              <Box mb={3} display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: '#7b1fa2', width: 56, height: 56 }}>
                  <SmartToy fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="#7b1fa2">
                    Canga AI Asistanı
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Doğal dille sorgulama yapın, rapor isteyin veya analiz talep edin.
                  </Typography>
                </Box>
              </Box>

              {/* Chat Area */}
              <Box sx={{ flexGrow: 1, mb: 3, overflowY: 'auto', maxHeight: '500px' }}>
                {!aiResponse ? (
                  <Box textAlign="center" py={5} color="text.secondary">
                    <Psychology sx={{ fontSize: 80, opacity: 0.2, mb: 2 }} />
                    <Typography variant="h6">Size nasıl yardımcı olabilirim?</Typography>
                    <Box mt={2} display="flex" justifyContent="center" gap={1} flexWrap="wrap">
                      <Chip 
                        label="Geçen hafta en çok geç kalan 5 kişi kim?" 
                        onClick={() => setAiQuery("Geçen hafta en çok geç kalan 5 kişi kim?")}
                        clickable 
                      />
                      <Chip 
                        label="Pazartesi günü devamsızlık yapanlar" 
                        onClick={() => setAiQuery("Pazartesi günü devamsızlık yapanlar")}
                        clickable 
                      />
                      <Chip 
                        label="Bugün kimler erken çıktı?" 
                        onClick={() => setAiQuery("Bugün kimler erken çıktı?")}
                        clickable 
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        bgcolor: '#f3e5f5', 
                        borderRadius: '20px 20px 20px 5px',
                        mb: 2,
                        maxWidth: '80%'
                      }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        {aiResponse.query}
                      </Typography>
                    </Paper>

                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        bgcolor: '#fff', 
                        border: '1px solid #e0e0e0',
                        borderRadius: '20px 20px 5px 20px',
                        mb: 2
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AutoAwesome color="primary" fontSize="small" />
                        <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                          AI Analizi
                        </Typography>
                      </Box>
                      <Typography paragraph>
                        {aiResponse.explanation || aiResponse.message}
                      </Typography>
                      
                      {aiResponse.filter && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="caption" fontFamily="monospace">
                            Uygulanan Filtre: {JSON.stringify(aiResponse.filter)}
                          </Typography>
                        </Alert>
                      )}

                      {aiResponse.results && aiResponse.results.length > 0 && (
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell>Çalışan</TableCell>
                                <TableCell>Tarih</TableCell>
                                <TableCell>Durum</TableCell>
                                <TableCell>Detay</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {aiResponse.results.map((row, i) => (
                                <TableRow key={i}>
                                  <TableCell>{row.employeeId?.adSoyad || 'Bilinmiyor'}</TableCell>
                                  <TableCell>{moment(row.date).format('DD.MM.YYYY')}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={getStatusText(row.status)} 
                                      size="small" 
                                      color={getStatusColor(row.status)} 
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {row.workDuration > 0 ? `${Math.floor(row.workDuration/60)}s` : '-'}
                                    {row.lateMinutes > 0 && ` (${row.lateMinutes}dk geç)`}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Paper>
                  </Box>
                )}
              </Box>

              {/* Input Area */}
              <Box display="flex" gap={2}>
                <TextField
                  fullWidth
                  placeholder="Sorgunuzu yazın..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAiSearch()}
                  disabled={aiLoading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAiSearch}
                  disabled={aiLoading || !aiQuery.trim()}
                  sx={{ 
                    minWidth: 120,
                    bgcolor: '#7b1fa2', 
                    '&:hover': { bgcolor: '#4a148c' } 
                  }}
                  endIcon={aiLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                >
                  Sor
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* AI Stats Card */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI Yetenekleri
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle fontSize="small" />
                    <Typography variant="body2">Doğal Dil İşleme (NLP)</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle fontSize="small" />
                    <Typography variant="body2">Anomali Tespiti</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle fontSize="small" />
                    <Typography variant="body2">Gelecek Tahmini (Prediction)</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircle fontSize="small" />
                    <Typography variant="body2">Otomatik Raporlama</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Prediction Card (Placeholder for future integration) */}
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TrendingUp color="primary" />
                  <Typography variant="h6">
                    Yarınki Tahmin
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  AI modellerimiz geçmiş verilere dayanarak yarın için tahminler oluşturuyor.
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" justify="space-between" mb={1}>
                  <Typography variant="body2">Beklenen Katılım:</Typography>
                  <Typography variant="body2" fontWeight="bold">%94</Typography>
                </Box>
                <LinearProgress variant="determinate" value={94} sx={{ mb: 2 }} />
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Yarın hava durumu ve geçmiş veriler analiz edilerek oluşturulmuştur.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}


      {/* Manuel Düzeltme Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Kayıt Düzeltme
            </Typography>
            <IconButton onClick={() => setEditDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <Box mb={3}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar src={selectedRecord.employeeId?.profilePhoto}>
                    {selectedRecord.employeeId?.adSoyad?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedRecord.employeeId?.adSoyad}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedRecord.employeeId?.pozisyon}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
              </Box>

              <TextField
                fullWidth
                label="Giriş Saati"
                type="datetime-local"
                value={editFormData.checkInTime}
                onChange={(e) => setEditFormData({ ...editFormData, checkInTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Çıkış Saati"
                type="datetime-local"
                value={editFormData.checkOutTime}
                onChange={(e) => setEditFormData({ ...editFormData, checkOutTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Düzeltme Sebebi"
                multiline
                rows={3}
                value={editFormData.reason}
                onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                placeholder="Düzeltme nedenini açıklayın..."
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>
            İptal
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSaveEdit}
            disabled={loading || !editFormData.reason}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* İmza Görüntüleme Dialog */}
      <Dialog
        open={signatureDialog}
        onClose={() => setSignatureDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              İmza Görüntüleme
            </Typography>
            <IconButton onClick={() => setSignatureDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              {/* Çalışan Bilgisi */}
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar src={selectedRecord.employeeId?.profilePhoto} sx={{ width: 60, height: 60 }}>
                  {selectedRecord.employeeId?.adSoyad?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="medium">
                    {selectedRecord.employeeId?.adSoyad}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRecord.employeeId?.pozisyon}
                  </Typography>
                  <Box mt={1}>
                    <Chip label={selectedRecord.checkIn?.location} size="small" sx={{ mr: 1 }} />
                    <Chip 
                      label={selectedRecord.checkIn?.method} 
                      size="small" 
                      color="primary"
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Giriş İmzası */}
              {selectedRecord.checkIn?.signature && (
                <Box mb={3}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Giriş İmzası
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Tarih: {moment(selectedRecord.checkIn.time).format('DD MMMM YYYY HH:mm')}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <img 
                      src={selectedRecord.checkIn.signature} 
                      alt="Giriş İmzası"
                      style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }}
                    />
                  </Paper>
                </Box>
              )}

              {/* Çıkış İmzası */}
              {selectedRecord.checkOut?.signature && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Çıkış İmzası
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Tarih: {moment(selectedRecord.checkOut.time).format('DD MMMM YYYY HH:mm')}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <img 
                      src={selectedRecord.checkOut.signature} 
                      alt="Çıkış İmzası"
                      style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd' }}
                    />
                  </Paper>
                </Box>
              )}

              {/* Konum Bilgisi */}
              {selectedRecord.checkIn?.coordinates && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    GPS Koordinatları: {selectedRecord.checkIn.coordinates.latitude}, {selectedRecord.checkIn.coordinates.longitude}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Sistem QR Dialog */}
      <Dialog
        open={systemQRDialog}
        onClose={() => setSystemQRDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              🏢 {systemQR?.token?.branchName || 'Şube'} - Sistem QR Kod
            </Typography>
            <IconButton onClick={() => setSystemQRDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {systemQR && (
            <Box textAlign="center">
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="medium">
                  ✅ {systemQR.token?.branchName} için Sistem QR kodu oluşturuldu!
                </Typography>
                <Typography variant="caption">
                  Bu QR kod {moment(systemQR.token.expiresAt).format('DD MMMM HH:mm')} tarihine kadar geçerlidir.
                </Typography>
              </Alert>
              
              {/* 🏢 Şube Bilgisi */}
              <Chip 
                label={`🏢 ${systemQR.token?.branchName || systemQR.token?.branch}`} 
                color="primary" 
                sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold', py: 2, px: 3 }}
              />

              <Typography variant="h6" gutterBottom>
                {systemQR.token?.branchName} Çalışanları İçin
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Sabah giriş için taratın<br />
                • Akşam çıkış için taratın<br />
                • Her kullanımda kendi isminizi seçin<br />
                • <strong>⚠️ Dikkat:</strong> Bu şubeden giriş yapanlar sadece bu şubeden çıkış yapabilir!
              </Typography>

              {/* QR Kod */}
              <Box
                sx={{
                  display: 'inline-block',
                  p: 3,
                  bgcolor: 'white',
                  border: '4px solid',
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  boxShadow: 3,
                  my: 2
                }}
              >
                <img
                  src={systemQR.qrCode}
                  alt="Sistem QR Code"
                  style={{ width: 300, height: 300, display: 'block' }}
                />
              </Box>

              {/* Kullanım Bilgisi */}
              <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                  Sistem QR Linki:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem'
                  }}
                >
                  {systemQR.url}
                </Typography>
              </Paper>

              {/* Butonlar */}
              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={handleDownloadSystemQR}
                    fullWidth
                  >
                    QR Kodu İndir
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => window.print()}
                    fullWidth
                  >
                    Yazdır
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => window.open(systemQR.url, '_blank')}
                    fullWidth
                  >
                    Linke Git →
                  </Button>
                </Grid>
              </Grid>

              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="caption">
                  <strong>Önemli:</strong> Bu QR kodu güvenli bir yere asın/yapıştırın. 
                  Tüm çalışanlar bu QR'ı kullanarak giriş-çıkış yapabilir.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSystemQRDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar with Retry */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.showRetry ? null : 4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          action={
            snackbar.showRetry && (
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRetry}
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
      
      {/* API Connection Status Banner */}
      {!apiConnected && !loading && (
        <Alert 
          severity="error" 
          sx={{ 
            position: 'fixed', 
            top: 80, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 9999,
            minWidth: 400
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetry}
              startIcon={<Refresh />}
            >
              Yeniden Dene
            </Button>
          }
        >
          <strong>API Bağlantı Hatası:</strong> Backend sunucusuyla bağlantı kurulamadı. Lütfen tekrar deneyin.
        </Alert>
      )}
      
      {/* Gelişmiş İmza Detay Modalı */}
      <SignatureDetailModal 
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        record={selectedDetailRecord}
      />
      
      {/* 🏢 ŞUBE SEÇİM DİALOGU */}
      <Dialog
        open={branchSelectDialog}
        onClose={() => setBranchSelectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              🏢 Şube Seçin
            </Typography>
            <IconButton onClick={() => setBranchSelectDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Çok Şubeli QR Sistemi:</strong> Her şubenin kendi QR kodu olacak. 
              Çalışanlar hangi şubeden giriş yaparsa, aynı şubeden çıkış yapmak zorundadır.
            </Typography>
          </Alert>
          
          {/* Şube Seçim Butonları */}
          <Box display="flex" gap={2} mb={3}>
            <Button
              fullWidth
              variant={selectedBranch === 'MERKEZ' ? 'contained' : 'outlined'}
              color="primary"
              size="large"
              onClick={() => setSelectedBranch('MERKEZ')}
              sx={{ py: 3, fontSize: '1.1rem' }}
            >
              🏭 Merkez Şube
            </Button>
            <Button
              fullWidth
              variant={selectedBranch === 'IŞIL' ? 'contained' : 'outlined'}
              color="secondary"
              size="large"
              onClick={() => setSelectedBranch('IŞIL')}
              sx={{ py: 3, fontSize: '1.1rem' }}
            >
              🏢 Işıl Şube
            </Button>
          </Box>
          
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ Önemli:</strong> {selectedBranch === 'MERKEZ' ? 'Merkez' : 'Işıl'} şubesinden giriş yapanlar 
              sadece {selectedBranch === 'MERKEZ' ? 'Merkez' : 'Işıl'} şubesinden çıkış yapabilir!
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBranchSelectDialog(false)}>
            İptal
          </Button>
          <Button
            variant="contained"
            startIcon={systemQRLoading ? <CircularProgress size={16} /> : <QrCode2 />}
            onClick={() => handleCreateSystemQR(selectedBranch)}
            disabled={systemQRLoading}
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #FF8E53 0%, #FF6B6B 100%)'
              }
            }}
          >
            QR Kod Oluştur
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
}

export default QRImzaYonetimi;

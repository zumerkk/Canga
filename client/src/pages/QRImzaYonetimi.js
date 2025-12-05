import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  useMediaQuery,
  useTheme,
  Fab,
  Zoom,
  Checkbox,
  Switch,
  FormControlLabel,
  Drawer
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
  TrendingUp,
  VolumeUp,
  VolumeOff,
  WifiOff,
  Wifi,
  Map,
  FilterList,
  ArrowUpward,
  Build
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import toast from 'react-hot-toast';

// Config & API
import api from '../config/api';

// Custom Hooks
// import useSSE from '../hooks/useSSE'; // SSE devre dışı - polling kullanılıyor
import useOnlineStatus from '../hooks/useOnlineStatus';

// Utilities
import { exportToPDF, exportToExcel, exportToCSV, exportStatisticsToPDF } from '../utils/exportUtils';
import { playEventSound, isSoundEnabled, toggleSound } from '../utils/soundUtils';
import { addToOfflineQueue, initDB } from '../utils/indexedDB';

// Components
import LiveLocationMap from '../components/LiveLocationMap';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import SignatureDetailModal from '../components/SignatureDetailModal';
import ReportingDashboard from '../components/ReportingDashboard';
import AIHealthStatus from '../components/AIHealthStatus';

// QR Management Components
import AdvancedFiltersPanel from '../components/QRManagement/AdvancedFiltersPanel';
import BulkActionsToolbar from '../components/QRManagement/BulkActionsToolbar';
import StatsSkeleton, { TableSkeleton, FullPageSkeleton } from '../components/QRManagement/StatsSkeleton';
import EmptyState, { InlineEmptyState } from '../components/QRManagement/EmptyState';
import AttendanceMap from '../components/QRManagement/AttendanceMap';
import CustomReportBuilder from '../components/QRManagement/CustomReportBuilder';
import { MobileRecordsList } from '../components/QRManagement/MobileRecordCard';
import QuickActionsPanel from '../components/QRManagement/QuickActionsPanel';
import DepartmentView from '../components/QRManagement/DepartmentView';
import TrendComparison from '../components/QRManagement/TrendComparison';
import HRSummaryCard from '../components/QRManagement/HRSummaryCard';

moment.locale('tr');

/**
 * 🎯 QR/İMZA YÖNETİMİ - ENHANCED DASHBOARD
 * Tüm iyileştirmeler dahil edildi:
 * - SSE ile real-time güncelleme
 * - Offline desteği
 * - Gelişmiş filtreleme
 * - Toplu işlemler
 * - Sesli bildirimler
 * - Mobil responsive
 * - Harita entegrasyonu
 * - Özel rapor oluşturucu
 * - Performans optimizasyonları
 */

// Stat Card Component
const StatCard = React.memo(({ title, value, icon, color, subtitle, onClick, pulse }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card
      onClick={onClick}
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {pulse && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: color,
            animation: 'pulse 2s infinite'
          }}
        />
      )}
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={color}>
              {value ?? '-'}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, width: 56, height: 56 }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
));

// Main Component
function QRImzaYonetimi() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Online Status Hook
  const { isOnline, isSyncing, pendingCount, syncPendingActions } = useOnlineStatus();

  // Initialize IndexedDB
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  // Core State
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(isSoundEnabled());

  // Data State
  const [liveStats, setLiveStats] = useState(null);
  const [todayRecords, setTodayRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [securityStats, setSecurityStats] = useState(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('TÜM');
  const [filterBranch, setFilterBranch] = useState('TÜM');
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Selection State (for bulk actions)
  const [selectedIds, setSelectedIds] = useState([]);

  // Dialog State
  const [editDialog, setEditDialog] = useState(false);
  const [signatureDialog, setSignatureDialog] = useState(false);
  const [systemQRDialog, setSystemQRDialog] = useState(false);
  const [branchSelectDialog, setBranchSelectDialog] = useState(false);
  const [mapDrawer, setMapDrawer] = useState(false);
  const [reportBuilderDialog, setReportBuilderDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    checkInTime: '',
    checkOutTime: '',
    reason: ''
  });

  // System QR State
  const [systemQR, setSystemQR] = useState(null);
  const [systemQRLoading, setSystemQRLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('MERKEZ');

  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Snackbar State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Scroll to top button
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ============================================
  // SSE devre dışı - Polling ile güncelleme
  // ============================================
  const sseConnected = false; // SSE devre dışı

  // ============================================
  // Data Fetching Functions
  // ============================================
  const loadInitialData = useCallback(async () => {
    if (!isOnline) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await Promise.all([
        loadLiveStats(),
        loadTodayRecords(),
        loadEmployees(),
        loadFraudAlerts(),
        loadSecurityStats()
      ]);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  const loadLiveStats = useCallback(async () => {
    try {
      const response = await api.get('/api/attendance/live-stats', {
        params: {
          location: filterLocation !== 'TÜM' ? filterLocation : undefined,
          branch: filterBranch !== 'TÜM' ? filterBranch : undefined
        }
      });
      // API response: { success, stats: {...}, recentActivity: [...] }
      setLiveStats(response.data?.stats || response.data);
    } catch (error) {
      console.error('Stats yükleme hatası:', error);
    }
  }, [filterLocation, filterBranch]);

  const loadTodayRecords = useCallback(async () => {
    try {
      const response = await api.get('/api/attendance/daily', {
        params: {
          date: moment().format('YYYY-MM-DD'),
          location: filterLocation !== 'TÜM' ? filterLocation : undefined,
          branch: filterBranch !== 'TÜM' ? filterBranch : undefined
        }
      });
      setTodayRecords(response.data.records || []);
    } catch (error) {
      console.error('Kayıtlar yükleme hatası:', error);
    }
  }, [filterLocation, filterBranch]);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await api.get('/api/employees', {
        params: { durum: 'all', limit: 1000 }
      });
      const data = response.data?.data || [];
      setEmployees(Array.isArray(data) ? data.filter(e => e.durum === 'AKTIF') : []);
    } catch (error) {
      console.error('Çalışanlar yükleme hatası:', error);
    }
  }, []);

  const loadFraudAlerts = useCallback(async () => {
    try {
      const response = await api.get('/api/system-qr/fraud-alerts', {
        params: { level: 'MEDIUM', limit: 20 }
      });
      setFraudAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Fraud alerts yükleme hatası:', error);
    }
  }, []);

  const loadSecurityStats = useCallback(async () => {
    try {
      const response = await api.get('/api/system-qr/security-stats');
      setSecurityStats(response.data);
    } catch (error) {
      console.error('Security stats yükleme hatası:', error);
    }
  }, []);

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Filter değiştiğinde yeniden yükle
  useEffect(() => {
    if (!loading) {
      loadTodayRecords();
      loadLiveStats();
    }
  }, [filterLocation, filterBranch]);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fallback polling (SSE bağlı değilse)
  useEffect(() => {
    if (sseConnected || !isOnline) return;

    const interval = setInterval(() => {
      if (currentTab === 0) {
        loadLiveStats();
        loadTodayRecords();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [sseConnected, isOnline, currentTab]);

  // ============================================
  // Memoized Filtered Records
  // ============================================
  const filteredRecords = useMemo(() => {
    let result = [...todayRecords];

    // Arama
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.employeeId?.adSoyad?.toLowerCase().includes(term) ||
        r.employeeId?.tcNo?.includes(term) ||
        r.employeeId?.pozisyon?.toLowerCase().includes(term)
      );
    }

    // Lokasyon filtresi
    if (filterLocation !== 'TÜM') {
      result = result.filter(r => r.checkIn?.location === filterLocation);
    }

    // Şube filtresi
    if (filterBranch !== 'TÜM') {
      result = result.filter(r => r.checkIn?.branch === filterBranch);
    }

    // Gelişmiş filtreler
    if (advancedFilters.statuses?.length > 0) {
      result = result.filter(r => advancedFilters.statuses.includes(r.status));
    }

    if (advancedFilters.departments?.length > 0) {
      result = result.filter(r => advancedFilters.departments.includes(r.employeeId?.departman));
    }

    if (advancedFilters.noLocation) {
      result = result.filter(r => !r.checkIn?.coordinates);
    }

    if (advancedFilters.hasIncomplete) {
      result = result.filter(r => r.needsCorrection || r.status === 'INCOMPLETE');
    }

    return result;
  }, [todayRecords, searchTerm, filterLocation, filterBranch, advancedFilters]);

  // ============================================
  // Action Handlers
  // ============================================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    playEventSound('NOTIFICATION');
    try {
      await Promise.all([loadLiveStats(), loadTodayRecords(), loadFraudAlerts()]);
      toast.success('Veriler güncellendi');
    } catch (error) {
      toast.error('Güncelleme başarısız');
    } finally {
      setRefreshing(false);
    }
  }, [loadLiveStats, loadTodayRecords, loadFraudAlerts]);

  const handleSoundToggle = () => {
    const newState = toggleSound();
    setSoundEnabled(newState);
    toast.success(newState ? '🔊 Sesler açıldı' : '🔇 Sesler kapatıldı');
  };

  const handleSelectAll = () => {
    setSelectedIds(filteredRecords.map(r => r._id));
  };

  const handleSelectNone = () => {
    setSelectedIds([]);
  };

  const handleSelectToggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setEditFormData({
      checkInTime: record.checkIn?.time ? moment(record.checkIn.time).format('HH:mm') : '',
      checkOutTime: record.checkOut?.time ? moment(record.checkOut.time).format('HH:mm') : '',
      reason: ''
    });
    setEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord || !editFormData.reason) {
      toast.error('Düzeltme sebebi zorunludur');
      return;
    }

    const action = {
      type: 'ATTENDANCE_CORRECT',
      data: {
        id: selectedRecord._id,
        checkInTime: editFormData.checkInTime,
        checkOutTime: editFormData.checkOutTime,
        reason: editFormData.reason
      },
      timestamp: new Date().toISOString()
    };

    // Offline ise kuyruğa ekle
    if (!isOnline) {
      await addToOfflineQueue(action);
      toast.success('İşlem kaydedildi, online olunca gönderilecek');
      setEditDialog(false);
      return;
    }

    try {
      await api.put(`/api/attendance/${selectedRecord._id}/correct`, action.data);
      toast.success('Kayıt düzeltildi');
      playEventSound('SUCCESS');
      setEditDialog(false);
      loadTodayRecords();
    } catch (error) {
      toast.error('Düzeltme başarısız');
      playEventSound('ERROR');
    }
  };

  const handleViewSignature = (signature) => {
    setSelectedRecord({ signature });
    setSignatureDialog(true);
  };

  const handleGenerateSystemQR = () => {
    setBranchSelectDialog(true);
  };

  const confirmGenerateSystemQR = async () => {
    setBranchSelectDialog(false);
    setSystemQRLoading(true);
    try {
      const response = await api.post('/api/system-qr/generate-system-qr', {
        type: 'BOTH',
        branch: selectedBranch,
        location: 'ALL',
        expiryHours: 24,
        description: `${selectedBranch} Şubesi Günlük QR - ${moment().format('DD.MM.YYYY')}`
      });
      
      // Backend'den gelen veriyi düzgün şekilde al
      const qrData = {
        qrCode: response.data.qrCode, // Backend 'qrCode' olarak döndürüyor
        token: response.data.token,
        url: response.data.url,
        branch: response.data.token?.branch || selectedBranch,
        branchName: response.data.token?.branchName || (selectedBranch === 'MERKEZ' ? 'Merkez Şube' : 'Işıl Şube'),
        expiresAt: response.data.token?.expiresAt
      };
      
      console.log('QR Data:', qrData); // Debug için
      setSystemQR(qrData);
      setSystemQRDialog(true);
      playEventSound('SUCCESS');
      toast.success('Sistem QR kodu oluşturuldu');
    } catch (error) {
      console.error('QR oluşturma hatası:', error);
      toast.error('QR kod oluşturulamadı: ' + (error.response?.data?.error || error.message));
      playEventSound('ERROR');
    } finally {
      setSystemQRLoading(false);
    }
  };

  // QR kod yazdırma fonksiyonu
  const handlePrintQR = () => {
    if (!systemQR?.qrCode) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup engelleyici aktif olabilir');
      return;
    }
    
    const branchEmoji = systemQR.branch === 'IŞIL' ? '🏢' : '🏭';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Çanga - Sistem QR Kodu</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }
          .header {
            margin-bottom: 30px;
          }
          .logo {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 18px;
            color: #666;
          }
          .qr-container {
            background: white;
            padding: 20px;
            border: 3px solid #1976d2;
            border-radius: 15px;
            display: inline-block;
            margin: 20px 0;
          }
          .qr-code {
            width: 300px;
            height: 300px;
          }
          .branch-badge {
            display: inline-block;
            background: ${systemQR.branch === 'IŞIL' ? '#9c27b0' : '#1976d2'};
            color: white;
            padding: 10px 30px;
            border-radius: 25px;
            font-size: 20px;
            font-weight: bold;
            margin: 15px 0;
          }
          .info {
            margin-top: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 10px;
          }
          .info p {
            margin: 8px 0;
            font-size: 14px;
            color: #555;
          }
          .validity {
            font-size: 16px !important;
            font-weight: bold;
            color: #2e7d32 !important;
          }
          .footer {
            margin-top: 25px;
            font-size: 12px;
            color: #999;
          }
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${branchEmoji}</div>
            <div class="title">ÇANGA SAVUNMA</div>
            <div class="subtitle">Vardiya Takip Sistemi</div>
          </div>
          
          <div class="qr-container">
            <img class="qr-code" src="${systemQR.qrCode}" alt="QR Kod" />
          </div>
          
          <div class="branch-badge">
            ${branchEmoji} ${systemQR.branchName || (systemQR.branch === 'IŞIL' ? 'Işıl Şube' : 'Merkez Şube')}
          </div>
          
          <div class="info">
            <p>Bu QR kodu telefonunuzla tarayarak</p>
            <p>giriş ve çıkış işlemi yapabilirsiniz.</p>
            <p class="validity">✅ Geçerlilik: ${moment(systemQR.expiresAt).format('DD.MM.YYYY HH:mm')}</p>
          </div>
          
          <div class="footer">
            Oluşturulma: ${moment().format('DD.MM.YYYY HH:mm')}
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadReport = async (type) => {
    try {
      toast.loading('Rapor hazırlanıyor...');
      
      // Export fonksiyonları record formatı bekliyor
      // filteredRecords zaten doğru formatta
      if (type === 'excel') {
        exportToExcel(filteredRecords, `devam_raporu_${moment().format('YYYY-MM-DD')}`);
      } else if (type === 'pdf') {
        exportToPDF(filteredRecords, `devam_raporu_${moment().format('YYYY-MM-DD')}`);
      } else if (type === 'csv') {
        exportToCSV(filteredRecords, `devam_raporu_${moment().format('YYYY-MM-DD')}`);
      }
      
      toast.dismiss();
      toast.success('Rapor indirildi');
    } catch (error) {
      console.error('Rapor hatası:', error);
      toast.dismiss();
      toast.error('Rapor oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    try {
      const response = await api.post('/api/attendance-ai/query', {
        query: aiQuery,
        context: {
          date: moment().format('YYYY-MM-DD'),
          stats: liveStats
        }
      });
      setAiResponse(response.data);
      setAiQuery('');
    } catch (error) {
      toast.error('AI yanıt veremedi');
    } finally {
      setAiLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // Render Helpers
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      NORMAL: 'success',
      LATE: 'warning',
      EARLY_LEAVE: 'warning',
      INCOMPLETE: 'error',
      ABSENT: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      NORMAL: 'Normal',
      LATE: 'Geç',
      EARLY_LEAVE: 'Erken Çıkış',
      INCOMPLETE: 'Eksik',
      ABSENT: 'Devamsız'
    };
    return labels[status] || status || '-';
  };

  // ============================================
  // Tab Content Renderers
  // ============================================
  const renderTodayRecordsTab = () => (
    <Box>
      {/* Quick Actions Panel */}
      <QuickActionsPanel
        stats={liveStats}
        onAction={(action) => {
          if (action === 'generateQR') handleGenerateSystemQR();
          else if (action === 'showMissing') setAdvancedFilters({ ...advancedFilters, hasIncomplete: true });
          else if (action === 'exportDaily') handleDownloadReport('excel');
        }}
        onRefresh={handleRefresh}
      />

      {/* Live Stats Cards */}
      {loading ? (
        <StatsSkeleton count={5} />
      ) : (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard
              title="Gelen"
              value={liveStats?.present || 0}
              icon={<CheckCircle />}
              color="#4caf50"
              subtitle="Şu an içeride"
              pulse={sseConnected}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard
              title="Gelmedi"
              value={liveStats?.absent || 0}
              icon={<Cancel />}
              color="#f44336"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard
              title="Geç Kalan"
              value={liveStats?.late || 0}
              icon={<AccessTime />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard
              title="Eksik Kayıt"
              value={liveStats?.incomplete || 0}
              icon={<Warning />}
              color="#9c27b0"
              onClick={() => setAdvancedFilters({ ...advancedFilters, hasIncomplete: true })}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard
              title="GPS Yok"
              value={liveStats?.noLocation || 0}
              icon={<LocationOn />}
              color="#607d8b"
              onClick={() => setAdvancedFilters({ ...advancedFilters, noLocation: true })}
            />
          </Grid>
        </Grid>
      )}

      {/* Connection Status */}
      <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
        <Chip
          icon={sseConnected ? <Wifi /> : <WifiOff />}
          label={sseConnected ? 'Canlı bağlantı' : 'Polling modu'}
          color={sseConnected ? 'success' : 'warning'}
          size="small"
          variant="outlined"
        />
        {!isOnline && (
          <Chip
            icon={<WifiOff />}
            label={`Çevrimdışı${pendingCount > 0 ? ` (${pendingCount} bekliyor)` : ''}`}
            color="error"
            size="small"
          />
        )}
        {isSyncing && (
          <Chip
            icon={<CircularProgress size={16} />}
            label="Senkronize ediliyor..."
            size="small"
          />
        )}
      </Box>

      {/* Advanced Filters */}
      <AdvancedFiltersPanel
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onClear={() => setAdvancedFilters({})}
        expanded={showAdvancedFilters}
        onExpandChange={setShowAdvancedFilters}
      />

      {/* Search & Quick Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ad, TC No veya pozisyon ara..."
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
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Lokasyon</InputLabel>
              <Select
                value={filterLocation}
                label="Lokasyon"
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <MenuItem value="TÜM">Tümü</MenuItem>
                <MenuItem value="MERKEZ">Merkez</MenuItem>
                <MenuItem value="İŞIL">Işıl</MenuItem>
                <MenuItem value="OSB">OSB</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Şube</InputLabel>
              <Select
                value={filterBranch}
                label="Şube"
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <MenuItem value="TÜM">Tümü</MenuItem>
                <MenuItem value="MERKEZ">🏭 Merkez</MenuItem>
                <MenuItem value="IŞIL">🏢 Işıl</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Tooltip title="Harita görünümü">
                <IconButton onClick={() => setMapDrawer(true)}>
                  <Map />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleDownloadReport('excel')}
                disabled={filteredRecords.length === 0}
              >
                Excel
              </Button>
              <Button
                variant="contained"
                startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Yenile
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Records Table / Mobile List */}
      {loading ? (
        <TableSkeleton rows={10} columns={8} />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          type={searchTerm || Object.keys(advancedFilters).length > 0 ? 'FILTER_EMPTY' : 'NO_DATA'}
          actionLabel="Filtreleri Temizle"
          onAction={() => {
            setSearchTerm('');
            setFilterLocation('TÜM');
            setFilterBranch('TÜM');
            setAdvancedFilters({});
          }}
        />
      ) : isMobile ? (
        <MobileRecordsList
          records={filteredRecords}
          selectedIds={selectedIds}
          onSelect={handleSelectToggle}
          onEdit={handleEditRecord}
          onViewSignature={handleViewSignature}
        />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filteredRecords.length}
                    checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
                    onChange={(e) => e.target.checked ? handleSelectAll() : handleSelectNone()}
                  />
                </TableCell>
                <TableCell>Çalışan</TableCell>
                <TableCell>Şube</TableCell>
                <TableCell align="center">Giriş</TableCell>
                <TableCell align="center">Çıkış</TableCell>
                <TableCell align="center">Süre</TableCell>
                <TableCell align="center">Durum</TableCell>
                <TableCell align="center">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence>
                {filteredRecords.map((record, index) => (
                  <motion.tr
                    key={record._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    component={TableRow}
                    hover
                    selected={selectedIds.includes(record._id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(record._id)}
                        onChange={() => handleSelectToggle(record._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar 
                          src={record.employeeId?.profilePhoto}
                          sx={{ 
                            width: 40, 
                            height: 40,
                            bgcolor: record.checkIn?.branch === 'IŞIL' ? 'secondary.main' : 'primary.main'
                          }}
                        >
                          {record.employeeId?.adSoyad?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {record.employeeId?.adSoyad || 'İsimsiz'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {record.employeeId?.pozisyon}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.checkIn?.branch === 'IŞIL' ? '🏢 Işıl' : '🏭 Merkez'}
                        size="small"
                        variant="outlined"
                        color={record.checkIn?.branch === 'IŞIL' ? 'secondary' : 'primary'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Typography variant="body2" fontWeight="medium" color="success.main">
                          {record.checkIn?.time ? moment(record.checkIn.time).format('HH:mm') : '-'}
                        </Typography>
                        {!record.checkIn?.coordinates && (
                          <Tooltip title="GPS verisi yok">
                            <Warning fontSize="small" color="warning" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium" color="error.main">
                        {record.checkOut?.time ? moment(record.checkOut.time).format('HH:mm') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {record.workDuration 
                          ? `${Math.floor(record.workDuration / 60)}s ${record.workDuration % 60}dk`
                          : '-'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getStatusLabel(record.status)}
                        color={getStatusColor(record.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="Düzenle">
                          <IconButton size="small" onClick={() => handleEditRecord(record)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {record.checkIn?.signature && (
                          <Tooltip title="İmzayı Gör">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewSignature(record.checkIn.signature)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Fraud Alerts Section */}
      {fraudAlerts.length > 0 && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Security />
            <Typography variant="h6">Güvenlik Uyarıları ({fraudAlerts.length})</Typography>
          </Box>
          <Grid container spacing={2}>
            {fraudAlerts.slice(0, 3).map((alert, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ bgcolor: 'background.paper' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      {alert.type}
                    </Typography>
                    <Typography variant="body2">
                      {alert.details?.description || 'Anomali tespit edildi'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {moment(alert.timestamp).fromNow()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );

  const renderQRManagementTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <QrCode2 sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Sistem QR Kodu Oluştur
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Tüm çalışanların kullanabileceği günlük QR kod oluşturun.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={systemQRLoading ? <CircularProgress size={20} /> : <QrCode2 />}
                onClick={handleGenerateSystemQR}
                disabled={systemQRLoading}
              >
                QR Kod Oluştur
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TouchApp sx={{ mr: 1, verticalAlign: 'bottom' }} />
                QR Kod Sayfasına Git
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Detaylı QR kod yönetimi için özel sayfaya gidin.
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/qr-kod-olustur')}
              >
                QR Kod Yönetimi
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bugünün QR İstatistikleri */}
      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 Bugünün QR/İmza İstatistikleri
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">{liveStats?.present || 0}</Typography>
              <Typography variant="body2" color="text.secondary">QR ile Giriş</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="secondary">{liveStats?.checkedOut || 0}</Typography>
              <Typography variant="body2" color="text.secondary">QR ile Çıkış</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {todayRecords.filter(r => r.checkIn?.method === 'SIGNATURE').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">İmza ile Giriş</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">{liveStats?.noLocation || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Konum Eksik</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  const renderSignatureRecordsTab = () => {
    const signatureRecords = todayRecords.filter(r => r.checkIn?.signature);
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          ✍️ İmza Kayıtları ({signatureRecords.length})
        </Typography>
        
        {signatureRecords.length === 0 ? (
          <EmptyState
            title="İmza Kaydı Yok"
            description="Bugün için imza kaydı bulunmuyor."
            type="NO_DATA"
          />
        ) : (
          <Grid container spacing={2}>
            {signatureRecords.map(record => (
              <Grid item xs={12} sm={6} md={4} key={record._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar>{record.employeeId?.adSoyad?.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle2">{record.employeeId?.adSoyad}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {moment(record.checkIn.time).format('HH:mm')}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewSignature(record.checkIn.signature)}
                    >
                      İmzayı Görüntüle
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  // Departman Görünümü Tab
  const renderDepartmentTab = () => (
    <Box>
      <DepartmentView 
        employees={employees} 
        records={todayRecords}
      />
    </Box>
  );

  // İK Paneli Tab
  const renderHRTab = () => (
    <Box>
      <HRSummaryCard 
        records={todayRecords}
        employees={employees}
      />
    </Box>
  );

  // Trend Analiz Tab
  const renderTrendTab = () => (
    <Box>
      <TrendComparison />
    </Box>
  );

  const renderReportingTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">📊 Raporlama</Typography>
        <Button
          variant="contained"
          startIcon={<Build />}
          onClick={() => setReportBuilderDialog(true)}
        >
          Özel Rapor Oluştur
        </Button>
      </Box>
      <ReportingDashboard />
    </Box>
  );

  const renderAIAssistantTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SmartToy sx={{ mr: 1, verticalAlign: 'bottom' }} />
                AI Asistanı
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Devam durumu hakkında soru sorun... Örn: 'Bugün en çok hangi departmandan geç kalma var?'"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Button
                variant="contained"
                startIcon={aiLoading ? <CircularProgress size={20} /> : <Send />}
                onClick={handleAIQuery}
                disabled={aiLoading || !aiQuery.trim()}
              >
                Sor
              </Button>

              {aiResponse && (
                <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>AI Yanıtı:</Typography>
                  <Typography variant="body2">{aiResponse.answer || aiResponse.response}</Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <AIHealthStatus />
        </Grid>
      </Grid>
    </Box>
  );

  // ============================================
  // Main Render
  // ============================================
  if (loading && !liveStats) {
    return <FullPageSkeleton />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            🎯 QR/İmza Yönetimi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {moment().format('DD MMMM YYYY, dddd')} • Son güncelleme: {moment().format('HH:mm')}
          </Typography>
        </Box>
        
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title={soundEnabled ? 'Sesleri kapat' : 'Sesleri aç'}>
            <IconButton onClick={handleSoundToggle}>
              {soundEnabled ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<QrCode2 />}
            onClick={handleGenerateSystemQR}
          >
            {isMobile ? 'QR' : 'Sistem QR Oluştur'}
          </Button>
        </Box>
      </Box>

      {/* Offline Banner */}
      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <WifiOff />
            <Box flex={1}>
              <Typography variant="body2">
                Çevrimdışı moddasınız. {pendingCount > 0 && `${pendingCount} işlem bekliyor.`}
              </Typography>
            </Box>
            {pendingCount > 0 && (
              <Button size="small" onClick={syncPendingActions} disabled={isSyncing}>
                {isSyncing ? 'Senkronize ediliyor...' : 'Senkronize Et'}
              </Button>
            )}
          </Box>
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="📊 Bugünkü Kayıtlar" />
          <Tab label="🏢 Departmanlar" />
          <Tab label="👩‍💼 İK Paneli" />
          <Tab label="📱 QR Yönetimi" />
          <Tab label="📈 Raporlama" />
          <Tab label="📉 Trend Analiz" />
          <Tab label="🤖 AI Asistanı" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {currentTab === 0 && renderTodayRecordsTab()}
        {currentTab === 1 && renderDepartmentTab()}
        {currentTab === 2 && renderHRTab()}
        {currentTab === 3 && renderQRManagementTab()}
        {currentTab === 4 && renderReportingTab()}
        {currentTab === 5 && renderTrendTab()}
        {currentTab === 6 && renderAIAssistantTab()}
      </Box>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        records={filteredRecords}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectNone={handleSelectNone}
        onSelectChange={handleSelectToggle}
        onActionComplete={() => {
          loadTodayRecords();
          handleSelectNone();
        }}
      />

      {/* Map Drawer */}
      <Drawer
        anchor="right"
        open={mapDrawer}
        onClose={() => setMapDrawer(false)}
        PaperProps={{ sx: { width: isMobile ? '100%' : 600 } }}
      >
        <Box p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">🗺️ Canlı Konum Haritası</Typography>
            <IconButton onClick={() => setMapDrawer(false)}>
              <Close />
            </IconButton>
          </Box>
          <AttendanceMap 
            records={todayRecords}
            onRefresh={loadTodayRecords}
            height={isMobile ? 400 : 500}
          />
        </Box>
      </Drawer>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Kayıt Düzeltme</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Giriş Saati"
              type="time"
              value={editFormData.checkInTime}
              onChange={(e) => setEditFormData({ ...editFormData, checkInTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Çıkış Saati"
              type="time"
              value={editFormData.checkOutTime}
              onChange={(e) => setEditFormData({ ...editFormData, checkOutTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Düzeltme Sebebi"
              multiline
              rows={3}
              value={editFormData.reason}
              onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
              required
              placeholder="Düzeltme sebebini açıklayın..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>İptal</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={signatureDialog} onClose={() => setSignatureDialog(false)} maxWidth="sm">
        <DialogTitle>İmza Görüntüleme</DialogTitle>
        <DialogContent>
          {selectedRecord?.signature && (
            <Box 
              component="img" 
              src={selectedRecord.signature} 
              alt="İmza"
              sx={{ width: '100%', border: '1px solid #ddd', borderRadius: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureDialog(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Branch Select Dialog - Professional Design */}
      <Dialog 
        open={branchSelectDialog} 
        onClose={() => setBranchSelectDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            p: 3,
            textAlign: 'center'
          }}
        >
          <QrCode2 sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Sistem QR Kodu Oluştur
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
            QR kodun oluşturulacağı şubeyi seçin
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Şube Seçimi
          </Typography>
          
          <Grid container spacing={2}>
            {/* Merkez Şube */}
            <Grid item xs={6}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  onClick={() => setSelectedBranch('MERKEZ')}
                  sx={{
                    cursor: 'pointer',
                    border: 3,
                    borderColor: selectedBranch === 'MERKEZ' ? 'primary.main' : 'transparent',
                    bgcolor: selectedBranch === 'MERKEZ' ? 'primary.light' : 'grey.50',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h2" sx={{ mb: 1 }}>🏭</Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold"
                      color={selectedBranch === 'MERKEZ' ? 'primary.main' : 'text.primary'}
                    >
                      Merkez Şube
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ana fabrika binası
                    </Typography>
                    {selectedBranch === 'MERKEZ' && (
                      <Box mt={2}>
                        <CheckCircle color="primary" />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            {/* Işıl Şube */}
            <Grid item xs={6}>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  onClick={() => setSelectedBranch('IŞIL')}
                  sx={{
                    cursor: 'pointer',
                    border: 3,
                    borderColor: selectedBranch === 'IŞIL' ? 'secondary.main' : 'transparent',
                    bgcolor: selectedBranch === 'IŞIL' ? 'secondary.light' : 'grey.50',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'secondary.light',
                      boxShadow: 3
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h2" sx={{ mb: 1 }}>🏢</Typography>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold"
                      color={selectedBranch === 'IŞIL' ? 'secondary.main' : 'text.primary'}
                    >
                      Işıl Şube
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Işıl üretim tesisi
                    </Typography>
                    {selectedBranch === 'IŞIL' && (
                      <Box mt={2}>
                        <CheckCircle color="secondary" />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
          
          {/* Bilgi */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              • QR kod 24 saat geçerli olacak<br />
              • Tüm çalışanlar bu QR kodu kullanabilir<br />
              • Giriş ve çıkış işlemleri için kullanılabilir
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setBranchSelectDialog(false)}
            sx={{ px: 3 }}
          >
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={confirmGenerateSystemQR}
            disabled={systemQRLoading}
            startIcon={systemQRLoading ? <CircularProgress size={20} color="inherit" /> : <QrCode2 />}
            sx={{ px: 4 }}
          >
            {systemQRLoading ? 'Oluşturuluyor...' : 'QR Kod Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* System QR Dialog - Professional Design */}
      <Dialog 
        open={systemQRDialog} 
        onClose={() => setSystemQRDialog(false)} 
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <Box 
          sx={{ 
            background: systemQR?.branch === 'IŞIL' 
              ? 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h1" sx={{ mb: 1 }}>
            {systemQR?.branch === 'IŞIL' ? '🏢' : '🏭'}
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            {systemQR?.branchName || (systemQR?.branch === 'IŞIL' ? 'Işıl Şube' : 'Merkez Şube')}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Sistem QR Kodu
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          {systemQR?.qrCode ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* QR Kod */}
              <Paper
                elevation={4}
                sx={{
                  display: 'inline-block',
                  p: 3,
                  borderRadius: 3,
                  border: 3,
                  borderColor: systemQR?.branch === 'IŞIL' ? 'secondary.main' : 'primary.main',
                  mb: 3
                }}
              >
                <Box
                  component="img"
                  src={systemQR.qrCode}
                  alt="Sistem QR Kod"
                  sx={{ 
                    width: 250, 
                    height: 250,
                    display: 'block'
                  }}
                />
              </Paper>
              
              {/* Bilgi Kartları */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <CheckCircle color="success" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight="bold" color="success.dark">
                      Giriş İçin
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                    <Cancel color="error" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2" fontWeight="bold" color="error.dark">
                      Çıkış İçin
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Geçerlilik Bilgisi */}
              <Alert 
                severity="success" 
                icon={<AccessTime />}
                sx={{ textAlign: 'left', mb: 2 }}
              >
                <Typography variant="body2">
                  <strong>Geçerlilik:</strong> {moment(systemQR.expiresAt).format('DD MMMM YYYY, HH:mm')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({moment(systemQR.expiresAt).fromNow()} sona erecek)
                </Typography>
              </Alert>
              
              {/* URL */}
              {systemQR.url && (
                <Paper sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Manuel erişim linki:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      wordBreak: 'break-all', 
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}
                  >
                    {systemQR.url}
                  </Typography>
                </Paper>
              )}
            </motion.div>
          ) : (
            <Box py={4}>
              <CircularProgress size={48} />
              <Typography variant="body2" color="text.secondary" mt={2}>
                QR kod yükleniyor...
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setSystemQRDialog(false)}
            color="inherit"
          >
            Kapat
          </Button>
          <Box display="flex" gap={1}>
            <Button 
              variant="outlined"
              startIcon={<Download />}
              onClick={() => {
                // QR kodu indir
                const link = document.createElement('a');
                link.download = `qr_${systemQR?.branch}_${moment().format('YYYYMMDD')}.png`;
                link.href = systemQR?.qrCode;
                link.click();
                toast.success('QR kod indirildi');
              }}
              disabled={!systemQR?.qrCode}
            >
              İndir
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Print />} 
              onClick={handlePrintQR}
              disabled={!systemQR?.qrCode}
            >
              Yazdır
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Custom Report Builder Dialog */}
      <Dialog 
        open={reportBuilderDialog} 
        onClose={() => setReportBuilderDialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">📊 Özel Rapor Oluşturucu</Typography>
            <IconButton onClick={() => setReportBuilderDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <CustomReportBuilder onClose={() => setReportBuilderDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Scroll to Top FAB */}
      <Zoom in={showScrollTop}>
        <Fab
          color="primary"
          size="small"
          onClick={scrollToTop}
          sx={{ position: 'fixed', bottom: 90, right: 20 }}
        >
          <ArrowUpward />
        </Fab>
      </Zoom>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Container>
  );
}

export default QRImzaYonetimi;

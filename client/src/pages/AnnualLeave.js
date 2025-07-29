import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Divider,
  Tooltip,
  Snackbar,
  Checkbox,
  FormControlLabel,
  Backdrop,
  Fade,
  Avatar,
  Stack,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { DataGrid, trTR } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { tr } from 'date-fns/locale';
import { format, differenceInYears, parseISO } from 'date-fns';

// Gelişmiş İstatistik kartı bileşeni
const StatCard = ({ title, value, icon, color, subtitle, trend, onClick, loading = false }) => (
  <Card 
    sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
      } : {},
      position: 'relative',
      overflow: 'hidden'
    }}
    onClick={onClick}
  >
    <CardContent sx={{ position: 'relative', zIndex: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" color="white" gutterBottom sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            <Typography variant="h3" component="div" color="white" fontWeight="bold">
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="white" sx={{ opacity: 0.9, mt: 1, fontWeight: 500 }}>
              {subtitle}
            </Typography>
          )}
          {trend && (
            <Box display="flex" alignItems="center" mt={1}>
              <TrendingUpIcon sx={{ color: 'white', opacity: 0.8, fontSize: 16, mr: 0.5 }} />
              <Typography variant="caption" color="white" sx={{ opacity: 0.8 }}>
                {trend}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ color: 'white', opacity: 0.9 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
    {/* Dekoratif arka plan elementi */}
    <Box
      sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 1
      }}
    />
  </Card>
);

// Çalışan detay modal bileşeni
const EmployeeDetailModal = ({ open, onClose, employee, onLeaveUpdated }) => {
  const [leaveRequest, setLeaveRequest] = useState({
    startDate: null,
    endDate: null,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!employee) return null;

  const calculateLeaveDays = () => {
    if (!leaveRequest.startDate || !leaveRequest.endDate) return 0;
    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // İzin hakkı kontrolü
  const hasLeaveEntitlement = () => {
    return (employee.izinBilgileri?.hakEdilen || 0) > 0;
  };

  const handleLeaveRequest = async () => {
    try {
      // İzin hakkı kontrolü
      if (!hasLeaveEntitlement()) {
        setError('Bu çalışanın henüz izin hakkı bulunmamaktadır.');
        return;
      }

      setLoading(true);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/annual-leave/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: employee._id,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          days: calculateLeaveDays(),
          notes: leaveRequest.notes
        })
      }).catch(error => {
        console.error('Fetch hatası:', error);
        throw new Error(`Ağ hatası: ${error.message}`);
      });
      
      if (!response) {
        throw new Error('Sunucudan yanıt alınamadı');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP hatası: ${response.status}`);
      }
      
      const data = await response.json().catch(error => {
        throw new Error(`Yanıt işlenirken hata: ${error.message}`);
      });
      
      if (!data.success) {
        setError(data.message || 'İzin talebi oluşturulurken hata oluştu');
        return;
      }
      
      showNotification('İzin talebi başarıyla oluşturuldu', 'success');
      setLeaveRequest({ startDate: null, endDate: null, notes: '' });
      if (onLeaveUpdated) onLeaveUpdated();
      onClose();
    } catch (error) {
      console.error('İzin talebi hatası:', error);
      setError(`İzin talebi oluşturulurken hata: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <PersonIcon color="primary" />
          <Typography variant="h6">{employee.adSoyad} - İzin Detayları</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Kişisel Bilgiler */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Kişisel Bilgiler
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Ad Soyad</Typography>
                  <Typography variant="body1" fontWeight="medium">{employee.adSoyad}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Doğum Tarihi</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {employee.dogumTarihi ? new Date(employee.dogumTarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">İşe Giriş Tarihi</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {employee.iseGirisTarihi ? new Date(employee.iseGirisTarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Yaş</Typography>
                  <Typography variant="body1" fontWeight="medium">{employee.yas} yaş</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Hizmet Yılı</Typography>
                  <Typography variant="body1" fontWeight="medium">{employee.hizmetYili} yıl</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* İzin Bilgileri */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  İzin Durumu
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Hak Edilen İzin</Typography>
                  <Typography variant="body1" fontWeight="medium">{employee.izinBilgileri?.hakEdilen || 0} gün</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Kullanılan İzin</Typography>
                  <Typography variant="body1" fontWeight="medium">{employee.izinBilgileri?.kullanilan || 0} gün</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Kalan İzin</Typography>
                  <Typography variant="body1" fontWeight="medium" color={employee.izinBilgileri?.kalan > 0 ? 'success.main' : 'error.main'}>
                    {employee.izinBilgileri?.kalan || 0} gün
                  </Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>İzin Kullanım Oranı</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={employee.izinBilgileri?.hakEdilen > 0 ? (employee.izinBilgileri?.kullanilan / employee.izinBilgileri?.hakEdilen) * 100 : 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* İzin Geçmişi */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Son 5 Yıl İzin Geçmişi
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(employee.izinGecmisi || {}).map(([year, days]) => (
                    <Grid item xs={6} sm={4} md={2.4} key={year}>
                      <Box textAlign="center" p={2} border={1} borderColor="grey.300" borderRadius={2}>
                        <Typography variant="h6" color="primary">{year}</Typography>
                        <Typography variant="h4" fontWeight="bold">{days}</Typography>
                        <Typography variant="body2" color="text.secondary">gün</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* İzin Talep Formu */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Yeni İzin Talebi
                </Typography>
                {!hasLeaveEntitlement() ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Bu çalışanın henüz izin hakkı bulunmamaktadır.
                  </Alert>
                ) : (
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <DatePicker
                          label="Başlangıç Tarihi"
                          value={leaveRequest.startDate}
                          onChange={(newValue) => setLeaveRequest(prev => ({ ...prev, startDate: newValue }))}
                          slotProps={{
                            textField: { fullWidth: true }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <DatePicker
                          label="Bitiş Tarihi"
                          value={leaveRequest.endDate}
                          onChange={(newValue) => setLeaveRequest(prev => ({ ...prev, endDate: newValue }))}
                          slotProps={{
                            textField: { fullWidth: true }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Toplam Gün"
                          value={calculateLeaveDays()}
                          disabled
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Notlar"
                          multiline
                          rows={3}
                          value={leaveRequest.notes}
                          onChange={(e) => setLeaveRequest(prev => ({ ...prev, notes: e.target.value }))}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </LocalizationProvider>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        {hasLeaveEntitlement() && (
          <Button 
            onClick={handleLeaveRequest} 
            variant="contained" 
            disabled={!leaveRequest.startDate || !leaveRequest.endDate || loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'İşleniyor...' : 'İzin Talebi Oluştur'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// İzin düzenleme modalı
const LeaveEditModal = ({ open, onClose, employee, leaveRequest, onLeaveUpdated }) => {
  const [editedRequest, setEditedRequest] = useState({
    startDate: leaveRequest?.startDate ? new Date(leaveRequest.startDate) : null,
    endDate: leaveRequest?.endDate ? new Date(leaveRequest.endDate) : null,
    notes: leaveRequest?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal açıldığında state'i güncelle
  useEffect(() => {
    if (open && leaveRequest) {
      setEditedRequest({
        startDate: leaveRequest.startDate ? new Date(leaveRequest.startDate) : null,
        endDate: leaveRequest.endDate ? new Date(leaveRequest.endDate) : null,
        notes: leaveRequest.notes || ''
      });
      setError(null);
    }
  }, [open, leaveRequest]);

  const calculateDays = () => {
    if (!editedRequest.startDate || !editedRequest.endDate) return 0;
    const diffTime = Math.abs(editedRequest.endDate - editedRequest.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/annual-leave/${employee._id}/edit-request/${leaveRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: editedRequest.startDate,
          endDate: editedRequest.endDate,
          days: calculateDays(),
          notes: editedRequest.notes
        })
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('İzin başarıyla güncellendi', 'success');
        onLeaveUpdated();
        onClose();
      } else {
        setError(data.message || 'İzin düzenlenirken hata oluştu');
      }
    } catch (error) {
      console.error('İzin düzenleme hatası:', error);
      setError('İzin düzenlenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu izin talebini silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/annual-leave/${employee._id}/delete-request/${leaveRequest._id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('İzin başarıyla silindi', 'success');
        onLeaveUpdated();
        onClose();
      } else {
        setError(data.message || 'İzin silinirken hata oluştu');
      }
    } catch (error) {
      console.error('İzin silme hatası:', error);
      setError('İzin silinirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <EditIcon color="primary" />
          <Typography variant="h6">İzin Düzenle</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={editedRequest.startDate}
                onChange={(newValue) => setEditedRequest(prev => ({ ...prev, startDate: newValue }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Bitiş Tarihi"
                value={editedRequest.endDate}
                onChange={(newValue) => setEditedRequest(prev => ({ ...prev, endDate: newValue }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Toplam Gün"
              value={calculateDays()}
              disabled
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Notlar"
              multiline
              rows={3}
              value={editedRequest.notes}
              onChange={(e) => setEditedRequest(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
            />
          </Grid>
        </Grid>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>İptal</Button>
        <Button 
          onClick={handleDelete}
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          Sil
        </Button>
        <Button 
          onClick={handleEdit}
          variant="contained"
          disabled={loading || !editedRequest.startDate || !editedRequest.endDate}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Bildirim fonksiyonu
const showNotification = (message, severity = 'info') => {
  // Snackbar veya Alert göstermek için
  if (window.showToast) {
    window.showToast(message, severity);
  } else {
    console.log(message); // Fallback olarak console'a yazdır
  }
};

// Ana bileşen
const AnnualLeave = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchText, setSearchText] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    ageGroup: '',
    serviceYears: ''
  });
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalLeaveUsed: 0,
    averageLeavePerEmployee: 0,
    totalLeaveEntitled: 0,
    leaveUtilizationRate: 0
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [sortConfig, setSortConfig] = useState({ field: 'adSoyad', direction: 'asc' });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);
  const [showLeaveRequests, setShowLeaveRequests] = useState(false);

  // LeaveEditModal bileşeni satır 381'de zaten tanımlanmış, ikinci tanımını kaldırıyoruz

  // Çalışanları getir
  const fetchEmployees = async (showSuccessMessage = false) => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      
      console.log(`Çalışan verisi isteniyor: ${apiUrl}/api/annual-leave?year=${selectedYear}`);
      
      const response = await fetch(`${apiUrl}/api/annual-leave?year=${selectedYear}`)
        .catch(error => {
          console.error('Fetch hatası:', error);
          throw new Error(`Ağ hatası: ${error.message}`);
        });
      
      if (!response) {
        throw new Error('Sunucudan yanıt alınamadı');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP hatası: ${response.status}`);
      }
      
      const data = await response.json()
        .catch(error => {
          throw new Error(`Yanıt işlenirken hata: ${error.message}`);
        });
      
      if (data.success === false) {
        throw new Error(data.message || 'Veri alınırken hata oluştu');
      }
      
      console.log(`Çalışan verisi yüklendi: ${data.data?.length || 0} çalışan`);
      
      setEmployees(data.data || []);
      setFilteredEmployees(data.data || []);
      calculateStats(data.data || []);
      setSelectedEmployees([]); // Seçimleri temizle
      
      if (showSuccessMessage) {
        showNotification(`${data.data?.length || 0} çalışan verisi başarıyla yüklendi`, 'success');
      }
    } catch (error) {
      console.error('API Hatası:', error);
      showNotification(`Veri yüklenirken hata oluştu: ${error.message}`, 'error');
      // Boş veri dizileri atayarak UI'ın çökmesini önlüyoruz
      setEmployees([]);
      setFilteredEmployees([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // İzin taleplerini getir
  const fetchLeaveRequests = async () => {
    try {
      setLeaveRequestsLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/annual-leave/requests?year=${selectedYear}`)
        .catch(error => {
          console.error('Fetch hatası:', error);
          throw new Error(`Ağ hatası: ${error.message}`);
        });
      
      if (!response) {
        throw new Error('Sunucudan yanıt alınamadı');
      }
      
      // İsteğin durumu kontrol ediliyor
      if (!response.ok) {
        // HTTP durum kodunu kontrol et
        if (response.status === 404) {
          // 404 hatası - Endpoint bulunamadı
          showNotification(`Endpoint bulunamadı: /api/annual-leave/requests (${response.status})`, 'error');
          setLeaveRequests([]);
          return;
        } else {
          // Diğer HTTP hataları
          throw new Error(`HTTP hatası: ${response.status}`);
        }
      }

      // JSON parse hatalarını kontrol et
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse hatası:', jsonError);
        throw new Error('Sunucu yanıtı geçersiz format: ' + jsonError.message);
      }
      
      // Yanıt yapısını kontrol et
      if (!data) {
        throw new Error('Sunucudan boş yanıt alındı');
      }

      // API yanıtında success: false olursa
      if (data.success === false) {
        showNotification(data.message || 'İzin talepleri getirilemedi', 'error');
        setLeaveRequests([]);
        return;
      }
      
      console.log('Yüklenen izin talepleri:', data);
      setLeaveRequests(data.data || []);
      
      // Eğer veri yoksa bilgi mesajı göster
      if (!data.data || data.data.length === 0) {
        showNotification(`${selectedYear} yılına ait izin talebi bulunmuyor`, 'info');
      }
    } catch (error) {
      console.error('İzin talepleri API Hatası:', error);
      showNotification(`İzin talepleri yüklenirken hata oluştu: ${error.message}`, 'error');
      setLeaveRequests([]); // Hata durumunda boş dizi
    } finally {
      setLeaveRequestsLoading(false);
    }
  };

  // Yenileme işlemi
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees(true);
    setRefreshing(false);
  };

  // Gelişmiş istatistikleri hesapla
  const calculateStats = (data) => {
    const totalEmployees = data.length;
    const totalLeaveUsed = data.reduce((sum, emp) => sum + (emp.izinBilgileri?.kullanilan || 0), 0);
    const totalLeaveEntitled = data.reduce((sum, emp) => sum + (emp.izinBilgileri?.hakEdilen || 0), 0);
    const averageLeave = totalEmployees > 0 ? Math.round(totalLeaveUsed / totalEmployees) : 0;
    const leaveUtilizationRate = totalLeaveEntitled > 0 ? Math.round((totalLeaveUsed / totalLeaveEntitled) * 100) : 0;

    setStats({
      totalEmployees,
      totalLeaveUsed,
      averageLeavePerEmployee: averageLeave,
      totalLeaveEntitled,
      leaveUtilizationRate
    });
  };

  // Bildirim göster
  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  // Bildirim kapat
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Bulk işlemler için seçili çalışanları yönet
  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Tüm çalışanları seç/seçimi kaldır
  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp._id));
    }
  };

  // Filtreleme
  const applyFilters = () => {
    let filtered = [...employees];

    // Metin araması
    if (searchText) {
      filtered = filtered.filter(emp => 
        emp.adSoyad?.toLowerCase().includes(searchText.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchText.toLowerCase())
      );
    }



    // Yaş grubu filtresi
    if (filters.ageGroup) {
      filtered = filtered.filter(emp => {
        const age = emp.yas;
        switch (filters.ageGroup) {
          case 'young': return age < 30;
          case 'middle': return age >= 30 && age < 50;
          case 'senior': return age >= 50;
          default: return true;
        }
      });
    }

    // Hizmet yılı filtresi
    if (filters.serviceYears) {
      filtered = filtered.filter(emp => {
        const years = emp.hizmetYili;
        switch (filters.serviceYears) {
          case 'new': return years < 2;
          case 'experienced': return years >= 2 && years < 10;
          case 'veteran': return years >= 10;
          default: return true;
        }
      });
    }

    setFilteredEmployees(filtered);
  };

  // Filtreleri temizle
  const clearFilters = () => {
    setSearchText('');
    setFilters({ ageGroup: '', serviceYears: '' });
    setFilteredEmployees(employees);
  };

  // Excel export
  const exportToExcel = () => {
    const csvContent = [
      ['Ad Soyad', 'Yaş', 'Hizmet Yılı', 'Hak Edilen İzin', 'Kullanılan İzin', 'Kalan İzin'],
      ...filteredEmployees.map(emp => [
        emp.adSoyad,
        emp.yas,
        emp.hizmetYili,
        emp.izinBilgileri?.hakEdilen || 0,
        emp.izinBilgileri?.kullanilan || 0,
        emp.izinBilgileri?.kalan || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `yillik_izin_raporu_${selectedYear}.csv`;
    link.click();
  };

  // Gelişmiş DataGrid kolonları
  const columns = [
    {
      field: 'select',
      headerName: '',
      width: 50,
      sortable: false,
      disableColumnMenu: true,
      renderHeader: () => (
        <Checkbox
          checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
          indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length}
          onChange={handleSelectAll}
          size="small"
        />
      ),
      renderCell: (params) => (
        <Checkbox
          checked={selectedEmployees.includes(params.row._id)}
          onChange={() => handleSelectEmployee(params.row._id)}
          size="small"
        />
      )
    },
    {
      field: 'adSoyad',
      headerName: 'Ad Soyad',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
            {params.value?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Button
            variant="text"
            onClick={() => {
              setSelectedEmployee(params.row);
              setDetailModalOpen(true);
            }}
            sx={{ 
              textTransform: 'none', 
              justifyContent: 'flex-start',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
            }}
          >
            {params.value}
          </Button>
        </Box>
      )
    },
    { 
      field: 'yas', 
      headerName: 'Yaş', 
      width: 80,
      type: 'number',
      renderCell: (params) => (
        <Chip label={`${params.value} yaş`} size="small" variant="outlined" />
      )
    },
    { 
      field: 'hizmetYili', 
      headerName: 'Hizmet Yılı', 
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Chip 
          label={`${params.value} yıl`} 
          size="small" 
          color={params.value >= 10 ? 'primary' : params.value >= 5 ? 'secondary' : 'default'}
        />
      )
    },

    {
      field: 'hakEdilen',
      headerName: 'Hak Edilen',
      width: 120,
      type: 'number',
      valueGetter: (params) => params.row.izinBilgileri?.hakEdilen || 0,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="primary">
          {params.value} gün
        </Typography>
      )
    },
    {
      field: 'kullanilan',
      headerName: 'Kullanılan',
      width: 120,
      type: 'number',
      valueGetter: (params) => params.row.izinBilgileri?.kullanilan || 0,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium" color="warning.main">
          {params.value} gün
        </Typography>
      )
    },
    {
      field: 'kalan',
      headerName: 'Kalan',
      width: 100,
      type: 'number',
      valueGetter: (params) => params.row.izinBilgileri?.kalan || 0,
      renderCell: (params) => (
        <Chip
          label={`${params.value} gün`}
          color={params.value > 10 ? 'success' : params.value > 5 ? 'warning' : 'error'}
          size="small"
          variant="filled"
        />
      )
    },
    {
      field: 'utilizationRate',
      headerName: 'Kullanım Oranı',
      width: 140,
      valueGetter: (params) => {
        const entitled = params.row.izinBilgileri?.hakEdilen || 0;
        const used = params.row.izinBilgileri?.kullanilan || 0;
        return entitled > 0 ? Math.round((used / entitled) * 100) : 0;
      },
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <LinearProgress 
            variant="determinate" 
            value={params.value} 
            sx={{ width: 60, height: 6, borderRadius: 3 }}
            color={params.value > 80 ? 'error' : params.value > 60 ? 'warning' : 'success'}
          />
          <Typography variant="caption" fontWeight="medium">
            {params.value}%
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Detayları Görüntüle">
            <IconButton 
              size="small" 
              onClick={() => {
                setSelectedEmployee(params.row);
                setDetailModalOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="İzin Düzenle">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                if (params.row.izinBilgileri?.hakEdilen > 0) {
                  setSelectedEmployee(params.row);
                  // İzin bilgilerini al
                  const currentLeaveRequest = params.row.izinBilgileri?.leaveRequests?.[0];
                  if (currentLeaveRequest) {
                    setSelectedLeaveRequest(currentLeaveRequest);
                    setEditModalOpen(true);
                  } else {
                    showNotification('Bu çalışan için düzenlenebilecek izin talebi bulunamadı.', 'warning');
                  }
                } else {
                  showNotification('Bu çalışanın henüz izin hakkı bulunmamaktadır.', 'warning');
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  // Component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchEmployees();
        await fetchLeaveRequests();
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        showNotification('Veri yüklenirken beklenmeyen bir hata oluştu', 'error');
      }
    };
    
    loadData();
  }, [selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyFilters();
  }, [searchText, filters, employees]);

  // İzin işlemleri sonrası yenileme
  const handleLeaveUpdated = async () => {
    try {
      setLoading(true);
      await fetchEmployees(true);
      await fetchLeaveRequests();
    } catch (error) {
      console.error('Veri yenileme hatası:', error);
      showNotification('Veriler yenilenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Başlık */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          📆 Yıllık İzin Takip Sistemi
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Yıl</InputLabel>
            <Select
              value={selectedYear}
              label="Yıl"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {[2023, 2024, 2025].map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Yenileniyor...' : 'Yenile'}
          </Button>
        </Box>
      </Box>

      {/* Gelişmiş İstatistik Kartları */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Çalışan"
            value={stats.totalEmployees}
            icon={<GroupIcon sx={{ fontSize: 40 }} />}
            color="#1976d2"
            subtitle="Aktif çalışan sayısı"
            trend="+2% bu ay"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Kullanılan İzin"
            value={`${stats.totalLeaveUsed} gün`}
            icon={<ScheduleIcon sx={{ fontSize: 40 }} />}
            color="#dc004e"
            subtitle="Toplam kullanılan izin"
            trend={`${stats.leaveUtilizationRate}% kullanım oranı`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ortalama İzin"
            value={`${stats.averageLeavePerEmployee} gün`}
            icon={<AssessmentIcon sx={{ fontSize: 40 }} />}
            color="#2e7d32"
            subtitle="Çalışan başına ortalama"
            trend="Hedef: 15 gün"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Hak Edilen"
            value={`${stats.totalLeaveEntitled} gün`}
            icon={<CalendarIcon sx={{ fontSize: 40 }} />}
            color="#ed6c02"
            subtitle="Toplam izin hakkı"
            trend={`${stats.totalLeaveEntitled - stats.totalLeaveUsed} gün kalan`}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Bulk Actions Bar */}
      {selectedEmployees.length > 0 && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" fontWeight="bold">
              {selectedEmployees.length} çalışan seçildi
            </Typography>
            <Chip 
              label="Toplu İşlemler"
              size="small"
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          </Box>
          <Box display="flex" gap={1}>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<SendIcon />}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
              onClick={() => setBulkActionModalOpen(true)}
            >
              Toplu İzin İşlemi
            </Button>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<DownloadIcon />}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
              onClick={exportToExcel}
            >
              Seçilenleri Dışa Aktar
            </Button>
            <IconButton 
              size="small" 
              sx={{ color: 'white' }}
              onClick={() => setSelectedEmployees([])}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Filtreleme ve Arama */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtreleme ve Arama
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Çalışan Ara"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Yaş Grubu</InputLabel>
              <Select
                value={filters.ageGroup}
                label="Yaş Grubu"
                onChange={(e) => setFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
              >
                <MenuItem value="">Tümü</MenuItem>
                <MenuItem value="young">&lt; 30 yaş</MenuItem>
                <MenuItem value="middle">30-50 yaş</MenuItem>
                <MenuItem value="senior">&gt; 50 yaş</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Hizmet Yılı</InputLabel>
              <Select
                value={filters.serviceYears}
                label="Hizmet Yılı"
                onChange={(e) => setFilters(prev => ({ ...prev, serviceYears: e.target.value }))}
              >
                <MenuItem value="">Tümü</MenuItem>
                <MenuItem value="new">&lt; 2 yıl</MenuItem>
                <MenuItem value="experienced">2-10 yıl</MenuItem>
                <MenuItem value="veteran">&gt; 10 yıl</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
                size="small"
              >
                Temizle
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={exportToExcel}
                size="small"
              >
                Excel
              </Button>
              <Button
                variant={showLeaveRequests ? "contained" : "outlined"}
                startIcon={<VisibilityIcon />}
                onClick={() => setShowLeaveRequests(!showLeaveRequests)}
                size="small"
                color="secondary"
              >
                {showLeaveRequests ? 'Çalışanları Göster' : 'İzin Taleplerini Göster'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Gelişmiş Çalışan Listesi veya İzin Talepleri */}
      {!showLeaveRequests ? (
        <Paper sx={{ height: 650, position: 'relative' }}>
          {loading && (
            <Backdrop open={loading} sx={{ position: 'absolute', zIndex: 1, backgroundColor: 'rgba(255,255,255,0.8)' }}>
              <CircularProgress />
            </Backdrop>
          )}
          <DataGrid
            rows={filteredEmployees}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            loading={loading}
            localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
            disableSelectionOnClick
            checkboxSelection={false}
            getRowId={(row) => row._id}
            density="comfortable"
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f5f5f5',
                '&:focus': {
                  outline: 'none'
                }
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#fafafa',
                borderBottom: '2px solid #e0e0e0',
                fontWeight: 600
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer'
                },
                '&.Mui-selected': {
                  backgroundColor: '#e3f2fd !important',
                  '&:hover': {
                    backgroundColor: '#bbdefb !important'
                  }
                }
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '2px solid #e0e0e0',
                backgroundColor: '#fafafa'
              }
            }}
          />
        </Paper>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              📋 İzin Talepleri ({selectedYear})
            </Typography>
            <Chip 
              label={`${leaveRequests.length} talep`} 
              color="primary" 
              variant="outlined"
            />
          </Box>
          
          {leaveRequestsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : leaveRequests.length === 0 ? (
            <Box textAlign="center" p={4}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Henüz izin talebi bulunmuyor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedYear} yılı için henüz izin talebi oluşturulmamış.
              </Typography>
            </Box>
          ) : (
            <DataGrid
              rows={leaveRequests}
              columns={[
                {
                  field: 'employeeName',
                  headerName: 'Çalışan',
                  width: 200,
                  renderCell: (params) => (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                        {params.value?.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight="medium">
                        {params.value}
                      </Typography>
                    </Box>
                  )
                },
                {
                  field: 'department',
                  headerName: 'Departman',
                  width: 150,
                  renderCell: (params) => (
                    <Chip 
                      label={params.value || 'Belirtilmemiş'} 
                      size="small" 
                      variant="outlined"
                    />
                  )
                },
                {
                  field: 'startDate',
                  headerName: 'Başlangıç',
                  width: 120,
                  renderCell: (params) => (
                    <Typography variant="body2">
                      {params.value ? format(new Date(params.value), 'dd.MM.yyyy') : '-'}
                    </Typography>
                  )
                },
                {
                  field: 'endDate',
                  headerName: 'Bitiş',
                  width: 120,
                  renderCell: (params) => (
                    <Typography variant="body2">
                      {params.value ? format(new Date(params.value), 'dd.MM.yyyy') : '-'}
                    </Typography>
                  )
                },
                {
                  field: 'days',
                  headerName: 'Gün',
                  width: 80,
                  renderCell: (params) => (
                    <Chip 
                      label={`${params.value} gün`} 
                      size="small" 
                      color="primary"
                    />
                  )
                },
                {
                  field: 'status',
                  headerName: 'Durum',
                  width: 140,
                  renderCell: (params) => {
                    const statusColors = {
                      'PENDING_APPROVAL': { color: 'warning', label: 'Onay Bekliyor' },
                      'APPROVED': { color: 'success', label: 'Onaylandı' },
                      'REJECTED': { color: 'error', label: 'Reddedildi' },
                      'CANCELLED': { color: 'default', label: 'İptal Edildi' }
                    };
                    const status = statusColors[params.value] || { color: 'default', label: params.value };
                    return (
                      <Chip 
                        label={status.label} 
                        size="small" 
                        color={status.color}
                        variant="filled"
                      />
                    );
                  }
                },
                {
                  field: 'notes',
                  headerName: 'Notlar',
                  width: 200,
                  renderCell: (params) => (
                    <Tooltip title={params.value || 'Not yok'} arrow>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%'
                        }}
                      >
                        {params.value || '-'}
                      </Typography>
                    </Tooltip>
                  )
                },
                {
                  field: 'actions',
                  headerName: 'İşlemler',
                  width: 120,
                  sortable: false,
                  renderCell: (params) => {
                    const employee = employees.find(emp => emp._id === params.row.employeeId);
                    const leaveRequest = {
                      _id: params.row._id,
                      startDate: params.row.startDate,
                      endDate: params.row.endDate,
                      days: params.row.days,
                      notes: params.row.notes,
                      status: params.row.status
                    };
                    
                    return (
                      <Box display="flex" gap={1}>
                        <Tooltip title="Düzenle" arrow>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setSelectedLeaveRequest(leaveRequest);
                              setEditModalOpen(true);
                            }}
                            disabled={!employee}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    );
                  }
                }
              ]}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              loading={leaveRequestsLoading}
              localeText={trTR.components.MuiDataGrid.defaultProps.localeText}
              disableSelectionOnClick
              getRowId={(row) => row._id}
              density="comfortable"
              autoHeight
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f5f5f5'
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#fafafa',
                  borderBottom: '2px solid #e0e0e0',
                  fontWeight: 600
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: '#f8f9fa'
                  }
                }
              }}
            />
          )}
        </Paper>
      )}

      {/* Çalışan Detay Modal */}
      <EmployeeDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        employee={selectedEmployee}
        onLeaveUpdated={handleLeaveUpdated}
      />

      {/* İzin Düzenleme Modal */}
      {editModalOpen && selectedEmployee && selectedLeaveRequest && (
        <LeaveEditModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          employee={selectedEmployee}
          leaveRequest={selectedLeaveRequest}
          onLeaveUpdated={handleLeaveUpdated}
        />
      )}

      {/* Bildirim Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AnnualLeave;
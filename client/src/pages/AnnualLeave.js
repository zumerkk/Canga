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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  Snackbar,
  Checkbox,
  Avatar,
  Backdrop
} from '@mui/material';
import LeaveEditModal from '../components/LeaveEditModal';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
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
import { format } from 'date-fns';

// API tabanı: env varsa onu kullan, yoksa localhost'ta backend'e bağlan; prod'da Render'a git
const API_BASE = process.env.REACT_APP_API_URL || (
  typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost'
    ? 'http://localhost:5001'
    : 'https://canga-api.onrender.com'
);

// Gelişmiş İstatistik kartı bileşeni
const StatCard = ({ title, value, icon, color, subtitle, trend, onClick, loading = false }) => (
  <Card 
    sx={{ 
      height: '125px', // Daha optimal yükseklik
      background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
      border: `2px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      '&:hover': onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        borderColor: color + 'aa'
      } : {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      },
      position: 'relative',
      overflow: 'hidden'
    }}
    onClick={onClick}
  >
    <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Üst kısım - Başlık ve İkon */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '12px', lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Box sx={{ color: color, opacity: 0.8 }}>
          {React.cloneElement(icon, { sx: { fontSize: 20 } })}
        </Box>
      </Box>
      
      {/* Orta kısım - Ana değer */}
      <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
        {loading ? (
          <CircularProgress size={24} sx={{ color: color }} />
        ) : (
          <Typography variant="h3" component="div" color={color} fontWeight="bold" sx={{ fontSize: '30px', lineHeight: 1 }}>
            {value}
          </Typography>
        )}
      </Box>
      
      {/* Alt kısım - Subtitle ve Trend */}
      <Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '11px', lineHeight: 1.2, mb: trend ? 0.3 : 0 }}>
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <Box display="flex" alignItems="center" justifyContent="center">
            <TrendingUpIcon sx={{ color: color, fontSize: 12, mr: 0.5, opacity: 0.8 }} />
            <Typography variant="caption" color={color} sx={{ fontSize: '10px', opacity: 0.8, fontWeight: 500 }}>
              {trend}
            </Typography>
          </Box>
        )}
      </Box>
    </CardContent>
  </Card>
);

// Çalışan detay modal bileşeni
const EmployeeDetailModal = ({ open, onClose, employee, onLeaveUpdated, showNotification }) => {
  const [leaveRequest, setLeaveRequest] = useState({
    startDate: null,
    endDate: null,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!employee) return null;

  // TR sabit resmi tatiller
  const getTurkishPublicHolidays = (year) => {
    return new Set([
      `${year}-01-01`,
      `${year}-04-23`,
      `${year}-05-01`,
      `${year}-05-19`,
      `${year}-07-15`,
      `${year}-08-30`,
      `${year}-10-29`
    ]);
  };

  // Pazar ve resmi tatiller hariç izin günü hesaplama (başlangıç-bitiş dahil)
  const calculateLeaveDays = () => {
    if (!leaveRequest.startDate || !leaveRequest.endDate) return 0;
    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    if (isNaN(start) || isNaN(end) || end < start) return 0;

    const holidays = getTurkishPublicHolidays(start.getFullYear());
    if (end.getFullYear() !== start.getFullYear()) {
      const nextYearHolidays = getTurkishPublicHolidays(end.getFullYear());
      nextYearHolidays.forEach(d => holidays.add(d));
    }

    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const isSunday = current.getDay() === 0;
      const iso = current.toISOString().slice(0, 10);
      const isHoliday = holidays.has(iso);
      if (!isSunday && !isHoliday) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  // İzin hakkı kontrolü (devir + mevcut yıl kalan toplam > 0 ise izin talebine izin ver)
  const hasLeaveEntitlement = () => {
    const entitled = employee.izinBilgileri?.hakEdilen || 0;
    const used = employee.izinBilgileri?.kullanilan || 0;
    const carryover = employee.izinBilgileri?.carryover || 0;
    return entitled + carryover - used > 0;
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

              const response = await fetch(`${API_BASE}/api/annual-leave/request`, {
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
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showNotification('İzin talebi başarıyla oluşturuldu', 'success');
        setLeaveRequest({ startDate: null, endDate: null, notes: '' });
        if (onLeaveUpdated) onLeaveUpdated();
        onClose();
      } else {
        setError(data.message || 'İzin talebi oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('İzin talebi hatası:', error);
      setError('İzin talebi oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (event, reason) => {
    // Backdrop click veya escape tuşu ile kapatılmasını engelle
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <PersonIcon color="primary" />
          <Typography variant="h6">{employee.adSoyad} - İzin Detayları</Typography>
        </Box>
      </DialogTitle>
      <DialogContent onClick={(e) => e.stopPropagation()}>
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
                {typeof employee.izinBilgileri?.carryover === 'number' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Geçen Yıllardan Devir</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {employee.izinBilgileri?.carryover} gün
                    </Typography>
                  </Box>
                )}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>İzin Kullanım Oranı</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(() => {
                      const entitled = employee.izinBilgileri?.hakEdilen || 0;
                      const carryover = employee.izinBilgileri?.carryover || 0;
                      const used = employee.izinBilgileri?.kullanilan || 0;
                      const denom = entitled + carryover;
                      return denom > 0 ? Math.min(100, Math.round((used / denom) * 100)) : 0;
                    })()}
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
                            textField: { 
                              fullWidth: true,
                              id: 'leave-start-date',
                              name: 'startDate'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <DatePicker
                          label="Bitiş Tarihi"
                          value={leaveRequest.endDate}
                          onChange={(newValue) => setLeaveRequest(prev => ({ ...prev, endDate: newValue }))}
                          slotProps={{
                            textField: { 
                              fullWidth: true,
                              id: 'leave-end-date',
                              name: 'endDate'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          id="leave-total-days"
                          name="totalDays"
                          label="Toplam Gün"
                          value={calculateLeaveDays()}
                          disabled
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          id="leave-notes"
                          name="notes"
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
      <DialogActions onClick={(e) => e.stopPropagation()}>
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          İptal
        </Button>
        {hasLeaveEntitlement() && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleLeaveRequest();
            }} 
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

// LeaveEditModal component'i ana component içinde tanımlanacak

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

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);
  const [showLeaveRequests, setShowLeaveRequests] = useState(false);

  // Bildirim göster
  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  // Bildirim kapat
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // İzin düzenleme modalı


  // Çalışanları getir
  const fetchEmployees = async (showSuccessMessage = false) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/annual-leave?year=${selectedYear}`);
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
        setFilteredEmployees(data.data || []);
        calculateStats(data.data || []);
        setSelectedEmployees([]); // Seçimleri temizle
        
        if (showSuccessMessage) {
          showNotification(`${data.data?.length || 0} çalışan verisi başarıyla yüklendi`, 'success');
        }
      } else {
        showNotification('Veri yüklenirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('API Hatası:', error);
      showNotification('Bağlantı hatası oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // İzin taleplerini getir
  const fetchLeaveRequests = async () => {
    try {
      setLeaveRequestsLoading(true);
      const response = await fetch(`${API_BASE}/api/annual-leave/requests?year=${selectedYear}`);
      
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data.data || []);
      } else {
        showNotification('İzin talepleri yüklenirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('İzin talepleri API Hatası:', error);
      showNotification('İzin talepleri bağlantı hatası oluştu', 'error');
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

  // Profesyonel Excel export
  const exportToExcel = async () => {
    try {
      setLoading(true);
      showNotification('Excel dosyası hazırlanıyor...', 'info');
      
      const response = await fetch(`${API_BASE}/api/annual-leave/export/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          exportedBy: 'Sistem Kullanıcısı'
        })
      });
      
      if (response.ok) {
        // Excel dosyasını blob olarak al
        const blob = await response.blob();
        
        // Dosya adını response header'dan al veya varsayılan kullan
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = `Yillik_Izin_Raporu_${selectedYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }
        
        // Dosyayı indir
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Belleği temizle
        URL.revokeObjectURL(link.href);
        
        showNotification('Excel dosyası başarıyla indirildi!', 'success');
      } else {
        const errorData = await response.json();
        showNotification(`Excel export hatası: ${errorData.message || 'Bilinmeyen hata'}`, 'error');
      }
    } catch (error) {
      console.error('Excel export hatası:', error);
      showNotification('Excel dosyası oluşturulurken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // İzin Talepleri Excel export
  const exportLeaveRequestsToExcel = async () => {
    try {
      setLoading(true);
      showNotification('İzin Talepleri Excel dosyası hazırlanıyor...', 'info');
      
      const response = await fetch(`${API_BASE}/api/annual-leave/export/leave-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          status: 'ALL', // Tüm durumlar
          exportedBy: 'Sistem Kullanıcısı'
        })
      });
      
      if (response.ok) {
        // Excel dosyasını blob olarak al
        const blob = await response.blob();
        
        // Dosya adını response header'dan al veya varsayılan kullan
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = `Izin_Talepleri_${selectedYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }
        
        // Dosyayı indir
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Belleği temizle
        URL.revokeObjectURL(link.href);
        
        showNotification(`İzin Talepleri Excel dosyası başarıyla indirildi! (${leaveRequests.length} talep)`, 'success');
      } else {
        const errorData = await response.json();
        showNotification(`İzin Talepleri Excel export hatası: ${errorData.message || 'Bilinmeyen hata'}`, 'error');
      }
    } catch (error) {
      console.error('İzin Talepleri Excel export hatası:', error);
      showNotification('İzin Talepleri Excel dosyası oluşturulurken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
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
        const carryover = params.row.izinBilgileri?.carryover || 0;
        const used = params.row.izinBilgileri?.kullanilan || 0;
        const denom = entitled + carryover;
        const rate = denom > 0 ? Math.round((used / denom) * 100) : 0;
        return isNaN(rate) ? 0 : rate;
      },
      renderCell: (params) => {
        const value = typeof params.value === 'number' ? params.value : 0;
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <LinearProgress 
              variant="determinate" 
              value={value} 
              sx={{ width: 60, height: 6, borderRadius: 3 }}
              color={value > 80 ? 'error' : value > 60 ? 'warning' : 'success'}
            />
            <Typography variant="caption" fontWeight="medium">
              {value}%
            </Typography>
          </Box>
        );
      }
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
              onClick={(e) => {
                e.stopPropagation();
                console.log('🖱️ İzin Düzenle butonu tıklandı:', {
                  employeeId: params.row._id,
                  employeeName: params.row.adSoyad,
                  izinBilgileri: params.row.izinBilgileri
                });
                
                if (params.row.izinBilgileri?.hakEdilen > 0) {
                  setSelectedEmployee(params.row);
                  // İzin bilgilerini al
                  const currentLeaveRequest = params.row.izinBilgileri?.leaveRequests?.[0];
                  console.log('📋 Mevcut izin talebi:', currentLeaveRequest);
                  
                  if (currentLeaveRequest) {
                    setSelectedLeaveRequest(currentLeaveRequest);
                    console.log('✅ Modal açılıyor...');
                    setEditModalOpen(true);
                  } else {
                    console.warn('⚠️ İzin talebi bulunamadı');
                    showNotification('Bu çalışan için düzenlenebilecek izin talebi bulunamadı.', 'warning');
                  }
                } else {
                  console.warn('⚠️ İzin hakkı bulunmuyor');
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
    fetchEmployees();
    fetchLeaveRequests();
  }, [selectedYear]);

  useEffect(() => {
    applyFilters();
  }, [searchText, filters, employees]);

  // İzin işlemleri sonrası yenileme
  const handleLeaveUpdated = () => {
    fetchEmployees(true);
    fetchLeaveRequests();
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', mx: 'auto' }}>
      {/* Başlık */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="600" color="text.primary" sx={{ mb: 0.5 }}>
            Yıllık İzin Takip Sistemi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Çalışan izin durumları ve kullanım analizi
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="year-label">Yıl</InputLabel>
            <Select
              id="year-select"
              name="selectedYear"
              labelId="year-label"
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
            icon={<GroupIcon />}
            color="#2C5AA0"
            subtitle="Aktif çalışan sayısı"
            trend="+2% bu ay"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Kullanılan İzin"
            value={`${stats.totalLeaveUsed} gün`}
            icon={<ScheduleIcon />}
            color="#34495E"
            subtitle="Toplam kullanılan izin"
            trend={`${stats.leaveUtilizationRate}% kullanım oranı`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ortalama İzin"
            value={`${stats.averageLeavePerEmployee} gün`}
            icon={<AssessmentIcon />}
            color="#27AE60"
            subtitle="Çalışan başına ortalama"
            trend="Hedef: 15 gün"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Toplam Hak Edilen"
            value={`${stats.totalLeaveEntitled} gün`}
            icon={<CalendarIcon />}
            color="#5DADE2"
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
            backgroundColor: '#2C5AA0', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(44,90,160,0.15)'
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
              disabled
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
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
          Filtreleme ve Arama
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              id="employee-search"
              name="employeeSearch"
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
              <InputLabel id="age-group-label">Yaş Grubu</InputLabel>
              <Select
                id="age-group-select"
                name="ageGroup"
                labelId="age-group-label"
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
              <InputLabel id="service-years-label">Hizmet Yılı</InputLabel>
              <Select
                id="service-years-select"
                name="serviceYears"
                labelId="service-years-label"
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
          <Grid item xs={12} sm={6} md={6}>
            <Box display="flex" gap={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={clearFilters}
                size="small"
                sx={{ minWidth: '100px' }}
              >
                Temizle
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={showLeaveRequests ? exportLeaveRequestsToExcel : exportToExcel}
                size="small"
                sx={{ minWidth: '100px' }}
              >
                Excel
              </Button>
              <Button
                variant={showLeaveRequests ? "contained" : "outlined"}
                startIcon={<VisibilityIcon />}
                onClick={() => setShowLeaveRequests(!showLeaveRequests)}
                size="small"
                color="secondary"
                sx={{ minWidth: '140px' }}
              >
                {showLeaveRequests ? 'Çalışanlar' : 'İzin Talepleri'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Gelişmiş Çalışan Listesi veya İzin Talepleri */}
      {!showLeaveRequests ? (
        <Paper sx={{ height: 650, position: 'relative', borderRadius: 2, border: '1px solid #e0e0e0' }}>
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
                borderBottom: '1px solid #f0f0f0',
                fontSize: '14px',
                '&:focus': {
                  outline: 'none'
                }
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
                fontWeight: 600,
                fontSize: '14px'
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
                backgroundColor: '#f8f9fa',
                fontSize: '13px'
              }
            }}
          />
        </Paper>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight="600" color="text.primary">
              İzin Talepleri ({selectedYear})
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
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🖱️ İzin Talepleri tablosunda Düzenle butonu tıklandı:', {
                                employeeId: employee?._id,
                                employeeName: employee?.adSoyad,
                                leaveRequestId: leaveRequest._id,
                                leaveRequest: leaveRequest
                              });
                              
                              if (employee) {
                                setSelectedEmployee(employee);
                                setSelectedLeaveRequest(leaveRequest);
                                console.log('✅ İzin Talepleri tablosundan modal açılıyor...');
                                setEditModalOpen(true);
                              } else {
                                console.error('❌ Çalışan bilgisi bulunamadı');
                              }
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
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: '14px'
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8f9fa',
                  borderBottom: '2px solid #e0e0e0',
                  fontWeight: 600,
                  fontSize: '14px'
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: '#f8f9fa'
                  }
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '2px solid #e0e0e0',
                  backgroundColor: '#f8f9fa',
                  fontSize: '13px'
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
        showNotification={showNotification}
      />

      {/* İzin Düzenleme Modal */}
      {editModalOpen && selectedEmployee && selectedLeaveRequest && (
        <LeaveEditModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          employee={selectedEmployee}
          leaveRequest={selectedLeaveRequest}
          onLeaveUpdated={handleLeaveUpdated}
          showNotification={showNotification}
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
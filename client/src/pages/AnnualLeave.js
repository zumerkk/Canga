import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
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
  Backdrop,
  Container,
  Stack,
  Skeleton,
  Slide,
  Grow,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
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
  ManageAccounts as ManageAccountsIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { DataGrid, trTR } from '@mui/x-data-grid';
import { format } from 'date-fns';

// 🚀 Lazy Loading Components for Performance
const LeaveEditModal = React.lazy(() => import('../components/LeaveEditModal'));
const EmployeeDetailModal = React.lazy(() => import('../components/EmployeeDetailModal'));

// API tabanı: env varsa onu kullan, yoksa localhost'ta backend'e bağlan; prod'da Render'a git
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// 🎨 Modern Glassmorphism Skeleton Loader
const StatCardSkeleton = React.memo(() => (
  <Card sx={{ height: '180px', borderRadius: 4 }}>
    <CardContent sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="40%" height={48} />
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Skeleton variant="text" width="30%" height={16} />
          <Skeleton variant="circular" width={44} height={44} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
));

// 🎨 Enhanced Glassmorphism İstatistik kartı bileşeni
const StatCard = React.memo(({ title, value, icon, color, subtitle, trend, onClick, loading = false }) => {
  const trendDirection = trend?.includes('+') ? 'up' : trend?.includes('-') ? 'down' : 'neutral';
  
  return (
    <Grow in timeout={600 + Math.random() * 400}>
      <Card 
        sx={{ 
          height: '180px',
          background: loading ? 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)' : 
            `linear-gradient(145deg, ${color}15 0%, ${color}05 50%, #ffffff 100%)`,
          backdropFilter: 'blur(20px)',
          border: `2px solid ${color}30`,
          borderRadius: 4,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': onClick ? {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: `0 20px 40px ${color}20`,
            borderColor: color,
            '& .stat-icon': {
              transform: 'scale(1.2) rotate(5deg)',
              color: color
            }
          } : {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.12)'
          },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`,
            opacity: 0.6
          }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {/* Üst kısım - Başlık ve İkon */}
          <Box display="flex" alignItems="flex-start" justifyContent="space-between">
            <Typography 
              variant="overline" 
              sx={{ 
                fontWeight: 700, 
                fontSize: '12px', 
                letterSpacing: '0.5px',
                color: 'text.secondary',
                lineHeight: 1.2
              }}
            >
              {title}
            </Typography>
            <Avatar 
              className="stat-icon"
              sx={{ 
                bgcolor: `${color}20`, 
                width: 44, 
                height: 44,
                transition: 'all 0.3s ease',
                border: `2px solid ${color}30`
              }}
            >
              {React.cloneElement(icon, { 
                sx: { 
                  fontSize: 20, 
                  color: color,
                  transition: 'all 0.3s ease'
                } 
              })}
            </Avatar>
          </Box>
          
          {/* Orta kısım - Ana değer */}
          <Box display="flex" alignItems="center" justifyContent="flex-start" flex={1} sx={{ my: 1 }}>
            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={28} sx={{ color: color }} />
                <Typography variant="body2" color="text.secondary">Yükleniyor...</Typography>
              </Stack>
            ) : (
              <Typography 
                variant="h2" 
                component="div" 
                sx={{ 
                  fontSize: '36px', 
                  fontWeight: 800,
                  lineHeight: 1,
                  background: `linear-gradient(45deg, ${color} 30%, ${color}80 90%)`,
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  textShadow: `0 2px 4px ${color}20`
                }}
              >
                {value}
              </Typography>
            )}
          </Box>
          
          {/* Alt kısım - Subtitle ve Trend */}
          <Box>
            {subtitle && (
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '13px', 
                  fontWeight: 500,
                  color: 'text.secondary',
                  lineHeight: 1.3, 
                  mb: trend ? 1 : 0 
                }}
              >
                {subtitle}
              </Typography>
            )}
            
            {trend && (
              <Chip
                icon={
                  trendDirection === 'up' ? 
                    <TrendingUpIcon sx={{ fontSize: '14px !important' }} /> : 
                    trendDirection === 'down' ?
                      <TrendingDownIcon sx={{ fontSize: '14px !important' }} /> :
                      <InfoIcon sx={{ fontSize: '14px !important' }} />
                }
                label={trend}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '11px',
                  fontWeight: 600,
                  bgcolor: `${color}15`,
                  color: color,
                  border: `1px solid ${color}30`,
                  '& .MuiChip-icon': {
                    color: color
                  }
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
});

// Ana bileşen
const AnnualLeave = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 📊 State Management
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchText, setSearchText] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(false);
  const [showLeaveRequests, setShowLeaveRequests] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 🔍 Advanced Filters State
  const [filters, setFilters] = useState({
    ageGroup: '',
    serviceYears: '',
    department: '',
    leaveStatus: ''
  });

  // 📊 Enhanced Statistics State
  const [stats] = useState({
    totalEmployees: 0,
    totalLeaveUsed: 0,
    averageLeavePerEmployee: 0,
    totalLeaveEntitled: 0,
    leaveUtilizationRate: 0,
    employeesWithoutLeave: 0,
    highUtilizationEmployees: 0
  });

  // 📢 Notification State
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 📈 Memoized calculations for performance
  const memoizedStats = useMemo(() => {
    if (employees.length === 0) return stats;
    
    const totalEmployees = employees.length;
    const totalLeaveUsed = employees.reduce((sum, emp) => sum + (emp.izinBilgileri?.kullanilan || 0), 0);
    const totalLeaveEntitled = employees.reduce((sum, emp) => sum + (emp.izinBilgileri?.hakEdilen || 0), 0);
    const averageLeave = totalEmployees > 0 ? Math.round(totalLeaveUsed / totalEmployees) : 0;
    const leaveUtilizationRate = totalLeaveEntitled > 0 ? Math.round((totalLeaveUsed / totalLeaveEntitled) * 100) : 0;
    const employeesWithoutLeave = employees.filter(emp => (emp.izinBilgileri?.kullanilan || 0) === 0).length;
    const highUtilizationEmployees = employees.filter(emp => {
      const used = emp.izinBilgileri?.kullanilan || 0;
      const entitled = emp.izinBilgileri?.hakEdilen || 0;
      return entitled > 0 && (used / entitled) > 0.8;
    }).length;

    return {
      totalEmployees,
      totalLeaveUsed,
      averageLeavePerEmployee: averageLeave,
      totalLeaveEntitled,
      leaveUtilizationRate,
      employeesWithoutLeave,
      highUtilizationEmployees
    };
  }, [employees]);

  // 🔄 Callbacks for performance
  const showNotification = useCallback((message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // İzin düzenleme modalı

  // 📊 Data fetching functions
  const fetchEmployees = useCallback(async (showSuccessMessage = false) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/annual-leave?year=${selectedYear}`);
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || []);
        setFilteredEmployees(data.data || []);
        setSelectedEmployees([]);
        
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
  }, [selectedYear, showNotification]);

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
      field: 'carryover',
      headerName: 'Devir',
      width: 100,
      type: 'number',
      valueGetter: (params) => params.row.izinBilgileri?.carryover || 0,
      renderCell: (params) => {
        const value = params.value || 0;
        if (value === 0) return <Typography variant="caption" color="text.secondary">-</Typography>;
        return (
          <Tooltip 
            title={value > 0 ? `Geçen yıllardan ${value} gün devir aldı` : `Geçen yıllara ${Math.abs(value)} gün borçlu`}
            arrow
          >
            <Chip
              label={`${value > 0 ? '+' : ''}${value} gün`}
              color={value > 0 ? 'success' : 'error'}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Tooltip>
        );
      }
    },
    {
      field: 'kalan',
      headerName: 'Kalan',
      width: 100,
      type: 'number',
      valueGetter: (params) => params.row.izinBilgileri?.kalan || 0,
      renderCell: (params) => (
        <Tooltip 
          title={`Toplam: ${params.row.izinBilgileri?.hakEdilen || 0} + ${params.row.izinBilgileri?.carryover || 0} - ${params.row.izinBilgileri?.kullanilan || 0} = ${params.value}`}
          arrow
        >
          <Chip
            label={`${params.value} gün`}
            color={params.value > 10 ? 'success' : params.value > 5 ? 'warning' : 'error'}
            size="small"
            variant="filled"
          />
        </Tooltip>
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Modern Header - Sade ve Profesyonel */}
      <Slide direction="down" in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#ffffff'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography 
                variant="h5" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  color: 'rgba(0,0,0,0.87)',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  mb: 0.5
                }}
              >
                Yıllık İzin Takibi
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
                {memoizedStats.totalEmployees} Çalışan • {memoizedStats.totalLeaveUsed} Kullanılan İzin • %{memoizedStats.leaveUtilizationRate} Kullanım Oranı
              </Typography>
            </Box>
              
            <Stack direction={isMobile ? "column" : "row"} spacing={1.5} sx={{ minWidth: isMobile ? '100%' : 'auto' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="year-label">Yıl</InputLabel>
                  <Select
                    id="year-select"
                    labelId="year-label"
                    value={selectedYear}
                    label="Yıl"
                    onChange={(e) => setSelectedYear(e.target.value)}
                    sx={{ 
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0,0,0,0.12)'
                      }
                    }}
                  >
                    {[2023, 2024, 2025, 2026].map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<ManageAccountsIcon />}
                  onClick={() => navigate('/annual-leave-edit')}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontWeight: 600,
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                    },
                    transition: 'all 0.25s ease'
                  }}
                >
                  Liste Düzenle
                </Button>
                
                <Tooltip title="Verileri Yenile" arrow>
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    sx={{
                      border: '1px solid rgba(0,0,0,0.12)',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.08)',
                        borderColor: '#667eea',
                        transform: 'rotate(180deg)'
                      },
                      transition: 'all 0.5s ease'
                    }}
                  >
                    {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon sx={{ fontSize: 20 }} />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
        </Paper>
      </Slide>

      {/* 📊 Enhanced Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Toplam Çalışan"
              value={memoizedStats.totalEmployees}
              icon={<GroupIcon />}
              color="#2196F3"
              subtitle="Aktif çalışan sayısı"
              trend="+2% bu ay"
              loading={loading}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Kullanılan İzin"
              value={`${memoizedStats.totalLeaveUsed}`}
              icon={<ScheduleIcon />}
              color="#FF9800"
              subtitle="Toplam kullanılan gün"
              trend={`${memoizedStats.leaveUtilizationRate}% kullanım`}
              loading={loading}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Ortalama İzin"
              value={`${memoizedStats.averageLeavePerEmployee}`}
              icon={<AssessmentIcon />}
              color="#4CAF50"
              subtitle="Çalışan başına ortalama"
              trend="Hedef: 15 gün"
              loading={loading}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              title="Yüksek Kullanım"
              value={memoizedStats.highUtilizationEmployees}
              icon={<TimelineIcon />}
              color="#E91E63"
              subtitle=">80% kullanan çalışan"
              trend={`${memoizedStats.employeesWithoutLeave} hiç kullanmayan`}
              loading={loading}
            />
          )}
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
    </Container>
  );
};

export default AnnualLeave;
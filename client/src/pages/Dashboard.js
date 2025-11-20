import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Container,
  Skeleton,
  Fade,
  Grow,
  Slide,
  Badge,
  CircularProgress
} from '@mui/material';
// Çanga logosunu import ediyoruz
// import CangaLogo from '../assets/7ff0dçanga_logo-removebg-preview.png';
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  ExitToApp as ExitIcon,
  PersonAdd as PersonAddIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Groups as GroupsIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/env';

// Modern İstatistik kartı bileşeni - Sade ve Profesyonel
function StatCard({ title, value, icon, color, subtitle, trend, onClick }) {
  const trendIcon = trend > 0 ? <TrendingUpIcon /> : trend < 0 ? <TrendingDownIcon /> : null;
  
  const colorMap = {
    primary: { main: '#667eea', light: '#8093f1' },
    success: { main: '#43e97b', light: '#63efae' },
    warning: { main: '#fa709a', light: '#fb8db5' },
    info: { main: '#4facfe', light: '#6fc0ff' }
  };
  
  const currentColor = colorMap[color] || colorMap.primary;
  
  return (
    <Grow in timeout={600}>
      <Card 
        elevation={0}
        sx={{ 
          height: '100%',
          background: '#ffffff',
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          overflow: 'hidden',
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.25s ease',
          '&:hover': onClick ? {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${currentColor.main}20`,
            borderColor: currentColor.main
          } : {}
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="overline" 
                sx={{ 
                  color: 'rgba(0,0,0,0.5)', 
                  fontWeight: 700,
                  letterSpacing: '1px',
                  fontSize: '0.7rem'
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                component="div" 
                sx={{ 
                  color: 'rgba(0,0,0,0.87)',
                  fontWeight: 700,
                  mt: 0.5,
                  lineHeight: 1.2,
                  fontSize: { xs: '1.75rem', sm: '2rem' }
                }}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Typography>
            </Box>
            <Box
              sx={{ 
                background: `linear-gradient(135deg, ${currentColor.main} 0%, ${currentColor.light} 100%)`,
                width: 52,
                height: 52,
                borderRadius: 2.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${currentColor.main}30`
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 26, color: 'white' } })}
            </Box>
          </Box>
          
          {subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(0,0,0,0.6)',
                fontSize: '0.875rem',
                mb: trend !== undefined && trend !== 0 ? 1.5 : 0
              }}
            >
              {subtitle}
            </Typography>
          )}
          
          {trend !== undefined && trend !== 0 && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 0.5
            }}>
              {trendIcon && React.cloneElement(trendIcon, { 
                sx: { 
                  fontSize: 16, 
                  color: trend > 0 ? '#43e97b' : '#fa709a' 
                } 
              })}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: trend > 0 ? '#43e97b' : '#fa709a',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {trend > 0 ? '+' : ''}{Math.abs(trend)}% bu ay
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
}

// Modern Hızlı aksiyon kartı - Minimalist
function QuickActionCard({ title, description, icon, color, onClick, badge = null }) {
  const colorMap = {
    primary: '#667eea',
    success: '#43e97b',
    warning: '#fa709a',
    info: '#4facfe'
  };
  
  const currentColor = colorMap[color] || colorMap.primary;
  
  return (
    <Fade in timeout={500}>
      <Card
        elevation={0}
        sx={{
          height: '100%',
          cursor: 'pointer',
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${currentColor}20`,
            borderColor: currentColor,
            '& .action-icon': {
              transform: 'scale(1.05)',
              boxShadow: `0 6px 16px ${currentColor}40`
            }
          }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ textAlign: 'center', p: 3 }}>
          {badge && (
            <Badge 
              badgeContent={badge} 
              color="error"
              sx={{ 
                position: 'absolute',
                top: 12,
                right: 12
              }}
            >
              <Box />
            </Badge>
          )}
          
          <Box
            className="action-icon"
            sx={{ 
              background: `linear-gradient(135deg, ${currentColor} 0%, ${currentColor}cc 100%)`,
              width: 56, 
              height: 56, 
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto', 
              mb: 2,
              transition: 'all 0.25s ease',
              boxShadow: `0 4px 12px ${currentColor}30`
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 28, color: 'white' } })}
          </Box>
          
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600,
              color: 'rgba(0,0,0,0.87)',
              mb: 0.5,
              fontSize: '0.95rem'
            }}
          >
            {title}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{
              color: 'rgba(0,0,0,0.5)',
              fontSize: '0.8rem',
              lineHeight: 1.4
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    activeShifts: 0,
    pendingApprovals: 0,
    completionRate: 0,
    recentShifts: [],
    departmentStats: [],
    alerts: [],
    formerEmployees: 0, // İşten ayrılanlar toplam sayısı
    formerEmployeesLast30Days: 0 // Son 30 günde işten ayrılanlar
  });

  // Gerçek API verilerini yükle
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Dashboard istatistiklerini backend API'sinden çek
      const API_URL = getApiBaseUrl();
      const [dashboardResponse, shiftsResponse, employeesResponse, notificationsResponse, formerEmployeesStatsResponse] = await Promise.all([
        fetch(`${API_URL}/api/dashboard/stats`),
        fetch(`${API_URL}/api/shifts?limit=5`), // Son 5 vardiya
        fetch(`${API_URL}/api/employees?limit=1000`),
        fetch(`${API_URL}/api/notifications/recent?limit=5`), // Son bildirimler
        fetch(`${API_URL}/api/employees/former/stats`) // İşten ayrılanlar istatistikleri
      ]);

      const dashboardStats = await dashboardResponse.json();
      const shiftsData = await shiftsResponse.json();
      const employeesData = await employeesResponse.json();
      const notificationsData = await notificationsResponse.json();
      const formerEmployeesStatsData = await formerEmployeesStatsResponse.json();

      // Backend'den gelen gerçek veriler
      const stats = dashboardStats.data || {};
      const shifts = shiftsData.data || [];
      const employees = employeesData.data || [];
      const notifications = notificationsData.data || [];
      const formerEmployeesStats = formerEmployeesStatsData.data || {};

      // İşten ayrılanlar istatistiklerini backend'den al
      const totalFormerEmployees = formerEmployeesStats.total || 0;
      const formerEmployeesLast30Days = formerEmployeesStats.last30Days || 0;

      // Departman istatistiklerini backend'den gelen verilerle oluştur
      const departmentStats = (stats.departmentStats || []).map(dept => ({
        name: dept._id,
        count: dept.count,
        percentage: Math.round((dept.count / stats.totalEmployees) * 100)
      }));

      // Lokasyon istatistikleri
      const locationCounts = {};
      employees.forEach(emp => {
        locationCounts[emp.location] = (locationCounts[emp.location] || 0) + 1;
      });

      // Son vardiyaları formatla
      const recentShifts = shifts.map(shift => ({
        id: shift._id,
        title: shift.title || `${shift.location} Vardiya Listesi`,
        date: new Date(shift.createdAt).toLocaleDateString('tr-TR'),
        status: shift.status,
        employees: shift.shiftGroups?.reduce((total, group) => {
          return total + group.shifts?.reduce((groupTotal, shiftTime) => {
            return groupTotal + (shiftTime.employees?.length || 0);
          }, 0);
        }, 0) || 0
      }));

      // Tamamlanma oranını hesapla (onaylanan vardiya oranı)
      const approvedShifts = shifts.filter(s => s.status === 'ONAYLANDI').length;
      const completionRate = shifts.length > 0 ? Math.round((approvedShifts / shifts.length) * 100) : 0;

      setDashboardData({
        totalEmployees: stats.totalEmployees || 0,
        activeEmployees: stats.totalEmployees || 0, // Her iki sayı da aynı kaynak (dashboard stats)
        activeShifts: stats.activeShifts || 0,
        pendingApprovals: stats.pendingApprovals || 0,
        completionRate: completionRate,
        departmentStats,
        locationStats: Object.entries(locationCounts).map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / employees.length) * 100)
        })),
        recentShifts,
        formerEmployees: totalFormerEmployees, // İşten ayrılanlar toplam sayısı
        formerEmployeesLast30Days: formerEmployeesLast30Days, // Son 30 günde işten ayrılanlar
        // Gerçek bildirimler backend'den geldi
        alerts: notifications.length > 0 ? notifications.map(notif => ({
          id: notif._id,
          message: notif.message,
          type: notif.priority === 'KRITIK' ? 'error' : 
                notif.priority === 'YUKSEK' ? 'warning' : 
                notif.priority === 'NORMAL' ? 'info' : 'success',
          time: new Date(notif.createdAt).toLocaleDateString('tr-TR'),
          isRead: notif.isRead || false,
          title: notif.title
        })) : [
          {
            id: 'default-1',
            message: `Toplam ${stats.totalEmployees || 0} aktif çalışan sisteme kaydedildi`,
            type: 'success',
            time: 'Şimdi'
          },
          {
            id: 'default-2',
            message: `${stats.activeShifts || 0} aktif vardiya planlanmış`,
            type: 'info',
            time: 'Şimdi'
          }
        ]
      });
      
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
      // Hata durumunda varsayılan değerler
      setDashboardData({
        totalEmployees: 0,
        activeShifts: 0,
        pendingApprovals: 0,
        completionRate: 0,
        departmentStats: [],
        recentShifts: [],
        formerEmployees: 0,
        formerEmployeesLast30Days: 0,
        alerts: [{
          id: 1,
          message: 'Veriler yüklenirken hata oluştu',
          type: 'error',
          time: 'Şimdi'
        }]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sayfa yenileme
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Durum rengini belirle
  const getStatusColor = (status) => {
    switch (status) {
      case 'AKTIF': return 'success';
      case 'ONAYLANDI': return 'success';
      case 'TASLAK': return 'warning';
      case 'TAMAMLANDI': return 'primary';
      case 'İPTAL': return 'error';
      case 'BEKLEMEDE': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'AKTIF': return 'Aktif';
      case 'ONAYLANDI': return 'Onaylandı';
      case 'TASLAK': return 'Taslak';
      case 'TAMAMLANDI': return 'Tamamlandı';
      case 'İPTAL': return 'İptal';
      case 'BEKLEMEDE': return 'Beklemede';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
        {/* Header Skeleton */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 4,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#ffffff'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 1, display: { xs: 'none', sm: 'block' } }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width={150} height={32} />
              <Skeleton variant="text" width={280} height={20} sx={{ mt: 0.5 }} />
            </Box>
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
          </Box>
        </Paper>

        {/* Stats Cards Skeleton */}
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={120} height={28} sx={{ mb: 2.5 }} />
          <Grid container spacing={3}>
            {[1, 2, 3].map((index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width={90} height={18} />
                      <Skeleton variant="text" width={70} height={44} sx={{ mt: 0.5 }} />
                    </Box>
                    <Skeleton variant="rounded" width={52} height={52} sx={{ borderRadius: 2.5 }} />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Content Skeleton */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', mb: 3 }}>
              <Skeleton variant="text" width={130} height={28} sx={{ mb: 2.5 }} />
              <Grid container spacing={3}>
                {[1, 2, 3].map((index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Skeleton variant="rounded" width={56} height={56} sx={{ borderRadius: 2.5, mx: 'auto', mb: 2 }} />
                      <Skeleton variant="text" width={100} height={24} sx={{ mx: 'auto' }} />
                      <Skeleton variant="text" width={120} height={18} sx={{ mx: 'auto', mt: 0.5 }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
              <Skeleton variant="text" width={130} height={28} sx={{ mb: 2 }} />
              {[1, 2, 3].map((index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, '&:last-child': { mb: 0 } }}>
                  <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2, mr: 2 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="70%" height={20} />
                    <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.3 }} />
                  </Box>
                  <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 1 }} />
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', mb: 3 }}>
              <Skeleton variant="text" width={150} height={28} sx={{ mb: 2.5 }} />
              {[1, 2, 3].map((index) => (
                <Box key={index} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Skeleton variant="text" width={100} />
                    <Skeleton variant="rounded" width={50} height={22} sx={{ borderRadius: 1 }} />
                  </Box>
                  <Skeleton variant="text" width="100%" height={6} sx={{ borderRadius: 3 }} />
                </Box>
              ))}
            </Paper>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
              <Skeleton variant="text" width={120} height={28} sx={{ mb: 2.5 }} />
              {[1, 2, 3].map((index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5, '&:last-child': { mb: 0 } }}>
                  <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 2, mr: 2 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="85%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <CircularProgress size={32} sx={{ color: '#667eea' }} />
          <Typography sx={{ mt: 2, color: 'rgba(0,0,0,0.5)', fontWeight: 500, fontSize: '0.875rem' }}>
            Dashboard yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Modern Hero Header - Sade ve Profesyonel */}
      <Slide direction="down" in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            background: '#ffffff',
            borderRadius: 3,
            mb: 4,
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2.5
                  }}
                >
                  <img 
                    src="/canga-logo.png" 
                    alt="Çanga Logo" 
                    style={{ height: 48, width: 'auto' }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography 
                    variant="h5" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 0.5,
                      color: 'rgba(0,0,0,0.87)',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    Dashboard
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(0,0,0,0.5)',
                      fontWeight: 500
                    }}
                  >
                    Hoş geldiniz! Sistemin genel durumunu buradan takip edebilirsiniz.
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Tooltip title="Verileri Yenile" arrow>
                  <IconButton
                    onClick={handleRefresh}
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
                    <RefreshIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/shifts/create')}
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
                  Yeni Vardiya
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Paper>
      </Slide>

      {/* Ana İstatistik Kartları */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            mb: 2.5, 
            fontWeight: 700, 
            color: 'rgba(0,0,0,0.87)',
            fontSize: '1.1rem'
          }}
        >
          Genel Bakış
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Toplam Personel"
              value={dashboardData.totalEmployees}
              icon={<GroupsIcon />}
              color="primary"
              subtitle="Sistemde kayıtlı aktif personel"
              trend={dashboardData.totalEmployees > 100 ? 8 : 0}
              onClick={() => navigate('/employees')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Aktif Çalışanlar"
              value={dashboardData.activeEmployees}
              icon={<GroupsIcon />}
              color="success"
              subtitle="Aktif çalışan sayısı"
              trend={0}
              onClick={() => navigate('/employees')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="İşten Ayrılanlar"
              value={dashboardData.formerEmployeesLast30Days}
              icon={<ExitIcon />}
              color="warning"
              subtitle="Son 30 günde sistemi terk eden"
              trend={dashboardData.formerEmployeesLast30Days > 0 ? -Math.round((dashboardData.formerEmployeesLast30Days / dashboardData.totalEmployees) * 100) : 0}
              onClick={() => navigate('/former-employees')}
            />
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {/* Sol Kolon - Ana İçerik */}
        <Grid item xs={12} lg={8}>
          {/* Hızlı Aksiyonlar Bölümü */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              background: '#ffffff'
            }}
          >
            <Typography 
              variant="h6" 
              component="h3"
              sx={{ 
                fontWeight: 700,
                color: 'rgba(0,0,0,0.87)',
                mb: 2.5,
                fontSize: '1.05rem'
              }}
            >
              Hızlı İşlemler
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <QuickActionCard
                  title="Vardiya Oluştur"
                  description="Yeni vardiya planı hazırlayın"
                  icon={<AddIcon />}
                  color="primary"
                  onClick={() => navigate('/shifts/create')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <QuickActionCard
                  title="Personel Yönetimi"
                  description="Çalışan bilgilerini görüntüle"
                  icon={<PersonAddIcon />}
                  color="success"
                  onClick={() => navigate('/employees')}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <QuickActionCard
                  title="İzin Takibi"
                  description="Yıllık izin durumları"
                  icon={<CalendarIcon />}
                  color="info"
                  onClick={() => navigate('/annual-leave')}
                  badge={dashboardData.formerEmployeesLast30Days > 0 ? dashboardData.formerEmployeesLast30Days : null}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Son Vardiyalar Bölümü */}
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              background: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography 
                  variant="h6" 
                  component="h3" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'rgba(0,0,0,0.87)',
                    fontSize: '1.05rem'
                  }}
                >
                  Son Vardiyalar
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/shifts')}
                  sx={{
                    color: '#667eea',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)'
                    }
                  }}
                >
                  Tümünü Gör →
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ p: 2.5 }}>
              <List sx={{ p: 0 }}>
                {dashboardData.recentShifts.length > 0 ? dashboardData.recentShifts.map((shift, index) => (
                  <Fade in timeout={300 + (index * 100)} key={shift.id}>
                    <ListItem
                      sx={{
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 2,
                        mb: 1.5,
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(102, 126, 234, 0.04)',
                          borderColor: '#667eea',
                          transform: 'translateX(4px)'
                        },
                        '&:last-child': { mb: 0 }
                      }}
                      onClick={() => navigate('/shifts')}
                    >
                      <ListItemAvatar>
                        <Box
                          sx={{ 
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${getStatusColor(shift.status) === 'success' ? '#43e97b' : getStatusColor(shift.status) === 'warning' ? '#fa709a' : '#667eea'} 0%, ${getStatusColor(shift.status) === 'success' ? '#38f9d7' : getStatusColor(shift.status) === 'warning' ? '#fee140' : '#764ba2'} 100%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <ScheduleIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.3 }}>
                            {shift.title}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.75rem' }}>
                              📅 {shift.date}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.75rem' }}>
                              👥 {shift.employees} kişi
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ ml: 1 }}>
                        <Chip
                          label={getStatusText(shift.status)}
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 24,
                            backgroundColor: getStatusColor(shift.status) === 'success' ? '#43e97b15' : getStatusColor(shift.status) === 'warning' ? '#fa709a15' : '#667eea15',
                            color: getStatusColor(shift.status) === 'success' ? '#43e97b' : getStatusColor(shift.status) === 'warning' ? '#fa709a' : '#667eea',
                            border: 'none'
                          }}
                        />
                      </Box>
                    </ListItem>
                  </Fade>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <ScheduleIcon sx={{ fontSize: 48, color: 'rgba(0,0,0,0.2)', mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', mb: 2 }}>
                      Henüz vardiya oluşturulmamış
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate('/shifts/create')}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      İlk Vardiyayı Oluştur
                    </Button>
                  </Box>
                )}
              </List>
            </Box>
          </Paper>
        </Grid>

        {/* Sağ Kolon - İstatistikler ve Bildirimler */}
        <Grid item xs={12} lg={4}>
          {/* Departman Dağılımı */}
          <Paper 
            elevation={0}
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              background: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  fontWeight: 700,
                  color: 'rgba(0,0,0,0.87)',
                  fontSize: '1.05rem'
                }}
              >
                Departman Dağılımı
              </Typography>
            </Box>
            
            <Box sx={{ p: 2.5 }}>
              <List sx={{ p: 0 }}>
                {dashboardData.departmentStats.length > 0 ? dashboardData.departmentStats.map((dept, index) => (
                  <Fade in timeout={300 + (index * 100)} key={dept.name}>
                    <ListItem 
                      sx={{ 
                        px: 0, 
                        py: 1.5,
                        borderBottom: index < dashboardData.departmentStats.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'rgba(0,0,0,0.75)' }}>
                            {dept.name}
                          </Typography>
                          <Chip
                            label={`${dept.count} kişi`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: '#667eea15',
                              color: '#667eea',
                              border: 'none'
                            }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={dept.percentage}
                            sx={{ 
                              flexGrow: 1,
                              height: 6, 
                              borderRadius: 3,
                              bgcolor: 'rgba(0,0,0,0.06)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ minWidth: 38, textAlign: 'right', color: 'rgba(0,0,0,0.5)', fontWeight: 600, fontSize: '0.75rem' }}>
                            {dept.percentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  </Fade>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <BusinessIcon sx={{ fontSize: 48, color: 'rgba(0,0,0,0.2)', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontSize: '0.85rem' }}>
                      Departman verisi bulunamadı
                    </Typography>
                  </Box>
                )}
              </List>
            </Box>
          </Paper>

          {/* Bildirimler ve Uyarılar */}
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.08)',
              background: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography 
                  variant="h6" 
                  component="h3" 
                  sx={{ 
                    fontWeight: 700,
                    color: 'rgba(0,0,0,0.87)',
                    fontSize: '1.05rem'
                  }}
                >
                  Bildirimler
                </Typography>
                {dashboardData.alerts.length > 0 && (
                  <Badge 
                    badgeContent={dashboardData.alerts.length} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.65rem',
                        height: '18px',
                        minWidth: '18px'
                      }
                    }}
                  >
                    <NotificationsIcon sx={{ fontSize: 20, color: 'rgba(0,0,0,0.5)' }} />
                  </Badge>
                )}
              </Box>
            </Box>
            
            <Box sx={{ p: 2.5 }}>
              <List sx={{ p: 0 }}>
                {dashboardData.alerts.length > 0 ? dashboardData.alerts.map((alert, index) => (
                  <Fade in timeout={300 + (index * 100)} key={alert.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 1.5,
                        borderBottom: index < dashboardData.alerts.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      <ListItemAvatar>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: alert.type === 'error' ? '#fa709a15' : alert.type === 'warning' ? '#fee14015' : alert.type === 'success' ? '#43e97b15' : '#667eea15',
                            color: alert.type === 'error' ? '#fa709a' : alert.type === 'warning' ? '#f57c00' : alert.type === 'success' ? '#43e97b' : '#667eea'
                          }}
                        >
                          {alert.type === 'error' ? <WarningIcon sx={{ fontSize: 18 }} /> : 
                           alert.type === 'warning' ? <PendingIcon sx={{ fontSize: 18 }} /> : 
                           <CheckCircleIcon sx={{ fontSize: 18 }} />}
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primary={alert.title || 'Sistem Bildirimi'}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" sx={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)', display: 'block', mb: 0.3, lineHeight: 1.4 }}>
                              {alert.message}
                            </Typography>
                            <Typography component="span" variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.4)' }}>
                              {alert.time}
                            </Typography>
                          </>
                        }
                        primaryTypographyProps={{
                          variant: 'subtitle2',
                          sx: { fontWeight: 600, fontSize: '0.85rem', mb: 0.3, color: 'rgba(0,0,0,0.75)' }
                        }}
                      />
                    </ListItem>
                  </Fade>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#43e97b', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#43e97b', mb: 0.5 }}>
                      Tüm sistemler çalışıyor!
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)' }}>
                      Yeni bildirim bulunmuyor
                    </Typography>
                  </Box>
                )}
              </List>
              
              {dashboardData.alerts.length > 0 && (
                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  sx={{ 
                    mt: 2,
                    color: '#667eea',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)'
                    }
                  }}
                  onClick={() => navigate('/notifications')}
                >
                  Tüm Bildirimleri Gör
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
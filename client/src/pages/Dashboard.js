import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
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
  Badge
} from '@mui/material';
// Çanga logosunu import ediyoruz
import CangaLogo from '../assets/7ff0dçanga_logo-removebg-preview.png';
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  Speed as SpeedIcon,
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

// Modern İstatistik kartı bileşeni
function StatCard({ title, value, icon, color, subtitle, trend, onClick }) {
  const trendIcon = trend > 0 ? <TrendingUpIcon /> : trend < 0 ? <TrendingDownIcon /> : null;
  
  return (
    <Grow in timeout={800}>
      <Card 
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${color === 'primary' ? '#1976d2' : color === 'success' ? '#2e7d32' : color === 'warning' ? '#ed6c02' : '#9c27b0'} 0%, ${color === 'primary' ? '#1565c0' : color === 'success' ? '#1b5e20' : color === 'warning' ? '#e65100' : '#7b1fa2'} 100%)`,
          color: 'white',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': onClick ? {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: `0 20px 40px rgba(${color === 'primary' ? '25, 118, 210' : color === 'success' ? '46, 125, 50' : color === 'warning' ? '237, 108, 2' : '156, 39, 176'}, 0.3)`
          } : {},
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          },
          '&:hover::before': onClick ? {
            opacity: 1
          } : {}
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="overline" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)', 
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  fontSize: '0.75rem'
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                component="div" 
                sx={{ 
                  color: 'white',
                  fontWeight: 700,
                  mt: 1,
                  lineHeight: 1.2
                }}
              >
                {typeof value === 'number' ? value.toLocaleString() : value}
              </Typography>
            </Box>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                width: 56,
                height: 56,
                backdropFilter: 'blur(10px)'
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 28, color: 'white' } })}
            </Avatar>
          </Box>
          
          {subtitle && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                mb: trend ? 1 : 0,
                fontSize: '0.875rem'
              }}
            >
              {subtitle}
            </Typography>
          )}
          
          {trend !== undefined && trend !== 0 && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              py: 0.5,
              px: 1,
              width: 'fit-content'
            }}>
              {trendIcon && React.cloneElement(trendIcon, { 
                sx: { fontSize: 16, mr: 0.5, color: trend > 0 ? '#4caf50' : '#f44336' } 
              })}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: trend > 0 ? '#4caf50' : '#f44336',
                  fontWeight: 600
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

// Modern Hızlı aksiyon kartı
function QuickActionCard({ title, description, icon, color, onClick, badge = null }) {
  return (
    <Fade in timeout={600}>
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 16px 32px rgba(${color === 'primary' ? '25, 118, 210' : color === 'success' ? '46, 125, 50' : color === 'warning' ? '237, 108, 2' : '156, 39, 176'}, 0.2)`,
            borderColor: `${color}.main`,
            '& .action-icon': {
              transform: 'scale(1.1) rotate(5deg)',
              bgcolor: `${color}.main`,
              color: 'white'
            },
            '& .action-content': {
              transform: 'translateY(-2px)'
            }
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: `linear-gradient(90deg, ${color}.main 0%, ${color}.light 100%)`
          }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ textAlign: 'center', p: 3, position: 'relative' }}>
          {badge && (
            <Badge 
              badgeContent={badge} 
              color="error"
              sx={{ 
                position: 'absolute',
                top: 16,
                right: 16
              }}
            >
              <Box />
            </Badge>
          )}
          
          <Box className="action-content" sx={{ transition: 'transform 0.3s ease' }}>
            <Avatar 
              className="action-icon"
              sx={{ 
                bgcolor: `${color}.light`,
                color: `${color}.main`,
                width: 64, 
                height: 64, 
                mx: 'auto', 
                mb: 2,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 8px 16px rgba(${color === 'primary' ? '25, 118, 210' : color === 'success' ? '46, 125, 50' : color === 'warning' ? '237, 108, 2' : '156, 39, 176'}, 0.2)`
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 32 } })}
            </Avatar>
            
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                mb: 1
              }}
            >
              {title}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                lineHeight: 1.4,
                fontSize: '0.875rem'
              }}
            >
              {description}
            </Typography>
          </Box>
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
      const [dashboardResponse, shiftsResponse, employeesResponse, notificationsResponse, formerEmployeesStatsResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/dashboard/stats`),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/shifts?limit=5`), // Son 5 vardiya
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/employees?limit=1000`),
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/notifications/recent?limit=5`), // Son bildirimler
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/employees/former/stats`) // İşten ayrılanlar istatistikleri
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
        activeEmployees: Array.isArray(employees) ? employees.length : 0,
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header Skeleton */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="rectangular" width={80} height={60} sx={{ borderRadius: 2, mr: 3 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width={300} height={40} />
              <Skeleton variant="text" width={200} height={24} sx={{ mt: 1 }} />
            </Box>
          </Box>
        </Paper>

        {/* Stats Cards Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3].map((index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width={100} height={20} />
                    <Skeleton variant="text" width={80} height={48} sx={{ mt: 1 }} />
                  </Box>
                  <Skeleton variant="circular" width={56} height={56} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Content Skeleton */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {[1, 2, 3].map((index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Skeleton variant="circular" width={64} height={64} sx={{ mx: 'auto', mb: 1 }} />
                        <Skeleton variant="text" width={100} height={24} sx={{ mx: 'auto' }} />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
              {[1, 2, 3].map((index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <LinearProgress sx={{ borderRadius: 2, height: 6, maxWidth: 300, mx: 'auto' }} />
          <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
            Dashboard yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Modern Hero Header */}
      <Slide direction="down" in timeout={800}>
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="3" cy="3" r="3"/>%3C/g%3E%3C/svg%3E")',
              opacity: 0.3
            }
          }}
        >
          <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    p: 2,
                    mr: 3,
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <img
                    src={CangaLogo}
                    alt="Çanga Logo"
                    style={{ height: 64, width: 'auto', filter: 'brightness(0) invert(1)' }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      background: 'linear-gradient(45deg, #ffffff 30%, #f8f9ff 90%)',
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      lineHeight: 1.2
                    }}
                  >
                    Vardiya Yönetim Sistemi
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.95, 
                      fontWeight: 400, 
                      mb: 1 
                    }}
                  >
                    Çanga Savunma Endüstrisi
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupsIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {dashboardData.totalEmployees} Aktif Personel
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {dashboardData.activeShifts} Aktif Vardiya
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Tooltip title="Verileri Yenile" arrow>
                  <IconButton
                    onClick={handleRefresh}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        transform: 'rotate(180deg)'
                      },
                      transition: 'all 0.5s ease'
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/shifts/create')}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  Yeni Vardiya Oluştur
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Paper>
      </Slide>

      {/* Ana İstatistik Kartları */}
      <Box sx={{ mb: 5 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 3, 
            fontWeight: 700, 
            color: 'text.primary',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: 60,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        >
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'primary.main' }} />
          Sistem Özeti
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

      <Grid container spacing={4}>
        {/* Sol Kolon - Ana İçerik */}
        <Grid item xs={12} lg={8}>
          {/* Hızlı Aksiyonlar Bölümü */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              mb: 4, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SpeedIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
              <Typography 
                variant="h5" 
                component="h3"
                sx={{ 
                  fontWeight: 700,
                  color: 'text.primary'
                }}
              >
                Hızlı İşlemler
              </Typography>
            </Box>
            
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
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimelineIcon sx={{ mr: 2, fontSize: 28 }} />
                  <Box>
                    <Typography variant="h5" component="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Son Vardiyalar
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      En son oluşturulan vardiya planları
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                  onClick={() => navigate('/shifts')}
                >
                  Tümünü Gör
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <List sx={{ p: 0 }}>
                {dashboardData.recentShifts.length > 0 ? dashboardData.recentShifts.map((shift, index) => (
                  <Slide direction="right" in timeout={300 + (index * 100)} key={shift.id}>
                    <ListItem
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        mb: 2,
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                          transform: 'translateX(8px)'
                        },
                        '&:last-child': { mb: 0 }
                      }}
                      onClick={() => navigate('/shifts')}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: `${getStatusColor(shift.status)}.main`,
                            width: 48,
                            height: 48
                          }}
                        >
                          <ScheduleIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {shift.title}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">
                              📅 {shift.date}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              👥 {shift.employees} kişi
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ ml: 2 }}>
                        <Chip
                          label={getStatusText(shift.status)}
                          color={getStatusColor(shift.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </ListItem>
                  </Slide>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ScheduleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Henüz vardiya oluşturulmamış
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/shifts/create')}
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
              mb: 4, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 2, fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Departman Dağılımı
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Personel departman istatistikleri
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <List sx={{ p: 0 }}>
                {dashboardData.departmentStats.length > 0 ? dashboardData.departmentStats.map((dept, index) => (
                  <Fade in timeout={400 + (index * 100)} key={dept.name}>
                    <ListItem 
                      sx={{ 
                        px: 0, 
                        py: 2,
                        borderBottom: index < dashboardData.departmentStats.length - 1 ? '1px solid' : 'none',
                        borderBottomColor: 'divider'
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {dept.name}
                          </Typography>
                          <Chip
                            label={`${dept.count} kişi`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={dept.percentage}
                            sx={{ 
                              flexGrow: 1,
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'
                              }
                            }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 45, textAlign: 'right' }}>
                            %{dept.percentage}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  </Fade>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
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
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 2, fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Sistem Bildirimleri
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Güncel durum ve uyarılar
                    </Typography>
                  </Box>
                </Box>
                <Badge badgeContent={dashboardData.alerts.length} color="error" />
              </Box>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <List sx={{ p: 0 }}>
                {dashboardData.alerts.length > 0 ? dashboardData.alerts.map((alert, index) => (
                  <Slide direction="left" in timeout={300 + (index * 150)} key={alert.id}>
                    <ListItem
                      sx={{
                        px: 0,
                        py: 2,
                        borderRadius: 2,
                        mb: index < dashboardData.alerts.length - 1 ? 1 : 0,
                        bgcolor: alert.type === 'error' ? 'error.light' : alert.type === 'warning' ? 'warning.light' : 'info.light',
                        color: alert.type === 'error' ? 'error.contrastText' : alert.type === 'warning' ? 'warning.contrastText' : 'info.contrastText',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: alert.type === 'error' ? 'error.main' : alert.type === 'warning' ? 'warning.main' : 'info.main',
                            width: 40,
                            height: 40
                          }}
                        >
                          {alert.type === 'error' ? <WarningIcon /> : 
                           alert.type === 'warning' ? <PendingIcon /> : 
                           <CheckCircleIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {alert.title || 'Sistem Bildirimi'}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {alert.message}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {alert.time}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </Slide>
                )) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="body1" color="success.main" sx={{ fontWeight: 600 }}>
                      Tüm sistemler çalışıyor!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Yeni bildirim bulunmuyor
                    </Typography>
                  </Box>
                )}
              </List>
              
              {dashboardData.alerts.length > 0 && (
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
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
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
  useTheme,
  Tabs,
  Tab,
  Badge,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade
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
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  CalendarToday as CalendarTodayIcon,
  Close as CloseIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Star as StarIcon,
  History as HistoryIcon,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { DataGrid, trTR } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getApiBaseUrl } from '../utils/env';

// 🚀 Lazy Loading Components for Performance
const LeaveEditModal = React.lazy(() => import('../components/LeaveEditModal'));
const EmployeeDetailModal = React.lazy(() => import('../components/EmployeeDetailModal'));

// API tabanı: env varsa onu kullan, yoksa localhost'ta backend'e bağlan; prod'da Render'a git
const API_BASE = getApiBaseUrl();

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

// 📊 İzin Talebi İstatistik Kartı
const LeaveRequestStatCard = React.memo(({ title, value, icon, color, subtitle, onClick }) => {
  return (
    <Grow in timeout={400}>
      <Card
        sx={{
          height: '140px',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 50%, #ffffff 100%)`,
          backdropFilter: 'blur(10px)',
          border: `2px solid ${color}30`,
          borderRadius: 3,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': onClick ? {
            transform: 'translateY(-6px)',
            boxShadow: `0 12px 28px ${color}30`,
            borderColor: color
          } : {},
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="overline" sx={{ fontWeight: 600, fontSize: '11px', color: 'text.secondary' }}>
              {title}
            </Typography>
            <Avatar sx={{ bgcolor: `${color}20`, width: 36, height: 36, border: `2px solid ${color}40` }}>
              {React.cloneElement(icon, { sx: { fontSize: 18, color: color } })}
            </Avatar>
          </Box>
          
          <Typography variant="h3" sx={{ fontSize: '32px', fontWeight: 800, color: color, lineHeight: 1 }}>
            {value}
          </Typography>
          
          {subtitle && (
            <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: 500, color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
});

// 🎴 İzin Talebi Kartı
const LeaveRequestCard = React.memo(({ request, onEdit, onViewDetail, employees }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'ONAY_BEKLIYOR': { color: 'warning', label: 'Onay Bekliyor', icon: <HourglassEmptyIcon />, bgColor: '#FFF3E0' },
      'PENDING_APPROVAL': { color: 'warning', label: 'Onay Bekliyor', icon: <HourglassEmptyIcon />, bgColor: '#FFF3E0' },
      'ONAYLANDI': { color: 'success', label: 'Onaylandı', icon: <CheckCircleIcon />, bgColor: '#E8F5E9' },
      'APPROVED': { color: 'success', label: 'Onaylandı', icon: <CheckCircleIcon />, bgColor: '#E8F5E9' },
      'REDDEDILDI': { color: 'error', label: 'Reddedildi', icon: <CancelIcon />, bgColor: '#FFEBEE' },
      'REJECTED': { color: 'error', label: 'Reddedildi', icon: <CancelIcon />, bgColor: '#FFEBEE' },
      'IPTAL_EDILDI': { color: 'default', label: 'İptal Edildi', icon: <CancelIcon />, bgColor: '#F5F5F5' },
      'CANCELLED': { color: 'default', label: 'İptal Edildi', icon: <CancelIcon />, bgColor: '#F5F5F5' }
    };
    return configs[status] || configs['ONAY_BEKLIYOR'];
  };

  const statusConfig = getStatusConfig(request.status);

  return (
    <Fade in timeout={300}>
      <Card
        sx={{
          mb: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            borderColor: 'primary.main'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {/* Sol Taraf - Çalışan Bilgileri */}
            <Grid item xs={12} md={4}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: 18 }}>
                  {request.employeeName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px', lineHeight: 1.2 }}>
                    {request.employeeName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <WorkIcon sx={{ fontSize: 14 }} />
                    {request.department || 'Departman belirtilmemiş'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Orta - Tarih ve Gün Bilgileri */}
            <Grid item xs={12} md={5}>
              <Stack spacing={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarTodayIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="body2" fontWeight={500}>
                    {request.startDate ? format(new Date(request.startDate), 'dd.MM.yyyy') : '-'} 
                    {' → '}
                    {request.endDate ? format(new Date(request.endDate), 'dd.MM.yyyy') : '-'}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1}>
                  <AccessTimeIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                  <Chip 
                    label={`${request.days || 0} Gün`} 
                    size="small" 
                    color="secondary" 
                    sx={{ fontWeight: 600 }}
                  />
                  {request.type === 'OZEL' && (
                    <Chip 
                      icon={<StarIcon />}
                      label="Özel İzin" 
                      size="small" 
                      color="warning" 
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>

                {request.notes && (
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <DescriptionIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5
                      }}
                    >
                      {request.notes}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Grid>

            {/* Sağ Taraf - Durum ve İşlemler */}
            <Grid item xs={12} md={3}>
              <Stack spacing={1.5} alignItems="flex-end">
                <Chip
                  icon={statusConfig.icon}
                  label={statusConfig.label}
                  color={statusConfig.color}
                  sx={{ 
                    fontWeight: 600,
                    px: 1,
                    bgcolor: statusConfig.bgColor,
                    '& .MuiChip-icon': { color: 'inherit' }
                  }}
                />

                <Stack direction="row" spacing={1}>
                  <Tooltip title="Detayları Görüntüle" arrow>
                    <IconButton
                      size="small"
                      onClick={() => onViewDetail(request)}
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Düzenle" arrow>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const employee = employees.find(emp => emp._id === request.employeeId);
                        if (employee) {
                          const leaveReq = {
                            _id: request._id,
                            startDate: request.startDate,
                            endDate: request.endDate,
                            days: request.days,
                            notes: request.notes,
                            status: request.status
                          };
                          onEdit(employee, leaveReq);
                        }
                      }}
                      sx={{ 
                        bgcolor: 'warning.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'warning.dark' }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {request.createdAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                    {format(new Date(request.createdAt), 'dd.MM.yyyy HH:mm')}
                  </Typography>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Fade>
  );
});

// 🎨 Modern Employee Card (Çalışan Kartı)
const ModernEmployeeCard = React.memo(({ employee, onViewDetail }) => {
  const totalUsed = employee.leaveData?.totalLeaveStats?.totalUsed || 0;
  const totalEntitled = employee.leaveData?.totalLeaveStats?.totalEntitled || 0;
  const remaining = totalEntitled - totalUsed;
  const utilizationRate = totalEntitled > 0 ? Math.round((totalUsed / totalEntitled) * 100) : 0;
  
  return (
    <Fade in timeout={300}>
      <Card
        sx={{
          borderRadius: 3,
          border: '2px solid #e0e0e0',
          transition: 'all 0.3s ease',
          background: '#ffffff',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
            borderColor: '#2196F3'
          },
          position: 'relative',
          overflow: 'hidden',
          height: '100%'
        }}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Çalışan Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2.5}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  bgcolor: remaining < 0 ? '#F44336' : remaining > 10 ? '#4CAF50' : '#FF9800',
                  width: 60,
                  height: 60,
                  fontSize: '26px',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {employee.adSoyad?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="700" sx={{ fontSize: '17px', lineHeight: 1.3 }}>
                  {employee.adSoyad}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <WorkIcon sx={{ fontSize: 13 }} />
                  {employee.employeeId || 'ID yok'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                  {employee.departman || 'Departman belirtilmemiş'}
                </Typography>
              </Box>
            </Box>
            
            <Tooltip title="Detayları Görüntüle">
              <IconButton
                onClick={() => onViewDetail(employee)}
                sx={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1976D2',
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* İstatistikler */}
          <Grid container spacing={1.5} mb={2} sx={{ flexGrow: 1 }}>
            <Grid item xs={4}>
              <Paper sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#e3f2fd', borderRadius: 2, height: '100%' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '10px' }}>
                  HAK EDİLEN
                </Typography>
                <Typography variant="h6" fontWeight="700" color="#2196F3" sx={{ fontSize: '22px', my: 0.5 }}>
                  {totalEntitled}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  gün
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#fff3e0', borderRadius: 2, height: '100%' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '10px' }}>
                  KULLANILAN
                </Typography>
                <Typography variant="h6" fontWeight="700" color="#FF9800" sx={{ fontSize: '22px', my: 0.5 }}>
                  {totalUsed}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  gün
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper sx={{ p: 1.5, textAlign: 'center', backgroundColor: remaining < 0 ? '#ffebee' : '#e8f5e9', borderRadius: 2, height: '100%' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '10px' }}>
                  KALAN
                </Typography>
                <Typography variant="h6" fontWeight="700" color={remaining < 0 ? '#F44336' : '#4CAF50'} sx={{ fontSize: '22px', my: 0.5 }}>
                  {remaining}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                  gün
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Kullanım Oranı */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: '11px' }}>
                İzin Kullanım Oranı
              </Typography>
              <Typography variant="caption" fontWeight={700} color={utilizationRate > 80 ? '#F44336' : utilizationRate > 50 ? '#FF9800' : '#4CAF50'} sx={{ fontSize: '12px' }}>
                %{utilizationRate}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(utilizationRate, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: utilizationRate > 80 
                    ? 'linear-gradient(90deg, #FF9800 0%, #F44336 100%)'
                    : utilizationRate > 50
                    ? 'linear-gradient(90deg, #4CAF50 0%, #FF9800 100%)'
                    : 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                }
              }}
            />
          </Box>
          
          {/* Ek Bilgiler */}
          <Box mt={2} pt={2} borderTop="1px solid #e0e0e0">
            <Grid container spacing={1}>
              {employee.pozisyon && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                    Pozisyon
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '11px' }}>
                    {employee.pozisyon}
                  </Typography>
                </Grid>
              )}
              {employee.lokasyon && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                    Lokasyon
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '11px' }}>
                    {employee.lokasyon}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
});

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
  
  // 🆕 İzin Talepleri için yeni state'ler
  const [selectedTab, setSelectedTab] = useState(0); // 0: Tümü, 1: Bekleyen, 2: Onaylanan, 3: Özel İzinler, 4: Son İzinler
  const [leaveRequestFilters, setLeaveRequestFilters] = useState({
    status: '',
    department: '',
    startDate: '',
    endDate: '',
    leaveType: '',
    searchText: ''
  });
  const [createSpecialLeaveOpen, setCreateSpecialLeaveOpen] = useState(false);
  const [leaveDetailOpen, setLeaveDetailOpen] = useState(false);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState(null);

  // 🔍 Advanced Filters State
  const [filters, setFilters] = useState({
    ageGroup: '',
    serviceYears: '',
    department: '',
    leaveStatus: ''
  });
  
  // 🎨 View Mode State (card veya table)
  const [employeeViewMode, setEmployeeViewMode] = useState('card'); // 'card' veya 'table'

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
        // Son eklenenler en üstte olacak şekilde sırala (createdAt desc)
        const sorted = (data.data || []).slice().sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });
        setLeaveRequests(sorted);
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

  // Çalışan detay modalını aç
  const handleOpenDetailModal = (employee) => {
    setSelectedEmployee(employee);
    setDetailModalOpen(true);
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

  // 📊 İzin Talepleri İstatistikleri
  const leaveRequestStats = useMemo(() => {
    if (!leaveRequests || leaveRequests.length === 0) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        special: 0,
        totalDays: 0
      };
    }

    return {
      total: leaveRequests.length,
      pending: leaveRequests.filter(r => r.status === 'ONAY_BEKLIYOR' || r.status === 'PENDING_APPROVAL').length,
      approved: leaveRequests.filter(r => r.status === 'ONAYLANDI' || r.status === 'APPROVED').length,
      rejected: leaveRequests.filter(r => r.status === 'REDDEDILDI' || r.status === 'REJECTED').length,
      cancelled: leaveRequests.filter(r => r.status === 'IPTAL_EDILDI' || r.status === 'CANCELLED').length,
      special: leaveRequests.filter(r => r.type === 'OZEL').length,
      totalDays: leaveRequests.reduce((sum, r) => sum + (r.days || 0), 0)
    };
  }, [leaveRequests]);

  // 🔍 Filtrelenmiş İzin Talepleri
  const filteredLeaveRequests = useMemo(() => {
    if (!leaveRequests || leaveRequests.length === 0) return [];

    let filtered = [...leaveRequests];

    // Tab filtreleme
    switch (selectedTab) {
      case 1: // Bekleyen
        filtered = filtered.filter(r => r.status === 'ONAY_BEKLIYOR' || r.status === 'PENDING_APPROVAL');
        break;
      case 2: // Onaylanan
        filtered = filtered.filter(r => r.status === 'ONAYLANDI' || r.status === 'APPROVED');
        break;
      case 3: // Özel İzinler
        filtered = filtered.filter(r => r.type === 'OZEL');
        break;
      case 4: // Son İzinler (son 30 gün)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(r => {
          const createdDate = r.createdAt ? new Date(r.createdAt) : null;
          return createdDate && createdDate >= thirtyDaysAgo;
        });
        break;
      default: // Tümü
        break;
    }

    // Durum filtresi
    if (leaveRequestFilters.status) {
      filtered = filtered.filter(r => r.status === leaveRequestFilters.status);
    }

    // Departman filtresi
    if (leaveRequestFilters.department) {
      filtered = filtered.filter(r => 
        r.department?.toLowerCase().includes(leaveRequestFilters.department.toLowerCase())
      );
    }

    // Arama filtresi
    if (leaveRequestFilters.searchText) {
      const search = leaveRequestFilters.searchText.toLowerCase();
      filtered = filtered.filter(r => 
        r.employeeName?.toLowerCase().includes(search) ||
        r.department?.toLowerCase().includes(search) ||
        r.notes?.toLowerCase().includes(search)
      );
    }

    // Tarih filtresi
    if (leaveRequestFilters.startDate && leaveRequestFilters.endDate) {
      const start = new Date(leaveRequestFilters.startDate);
      const end = new Date(leaveRequestFilters.endDate);
      filtered = filtered.filter(r => {
        const reqStart = r.startDate ? new Date(r.startDate) : null;
        return reqStart && reqStart >= start && reqStart <= end;
      });
    }

    return filtered;
  }, [leaveRequests, selectedTab, leaveRequestFilters]);

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
              <span>
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
              </span>
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
            <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
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
              
              {/* Görünüm Modu Butonları - Sadece Çalışanlar görünümünde */}
              {!showLeaveRequests && (
                <Box display="flex" gap={0.5} ml={1}>
                  <Tooltip title="Tablo Görünümü">
                    <IconButton
                      size="small"
                      onClick={() => setEmployeeViewMode('table')}
                      sx={{
                        backgroundColor: employeeViewMode === 'table' ? '#2196F3' : 'transparent',
                        color: employeeViewMode === 'table' ? 'white' : 'text.secondary',
                        border: '1px solid',
                        borderColor: employeeViewMode === 'table' ? '#2196F3' : 'rgba(0,0,0,0.12)',
                        '&:hover': {
                          backgroundColor: employeeViewMode === 'table' ? '#1976D2' : 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      <ViewList />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Kart Görünümü">
                    <IconButton
                      size="small"
                      onClick={() => setEmployeeViewMode('card')}
                      sx={{
                        backgroundColor: employeeViewMode === 'card' ? '#2196F3' : 'transparent',
                        color: employeeViewMode === 'card' ? 'white' : 'text.secondary',
                        border: '1px solid',
                        borderColor: employeeViewMode === 'card' ? '#2196F3' : 'rgba(0,0,0,0.12)',
                        '&:hover': {
                          backgroundColor: employeeViewMode === 'card' ? '#1976D2' : 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      <ViewModule />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Gelişmiş Çalışan Listesi veya İzin Talepleri */}
      {!showLeaveRequests ? (
        <>
          {employeeViewMode === 'table' ? (
            /* 📊 Tablo Görünümü */
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
            /* 🎴 Modern Kart Görünümü */
            <Box>
              {loading ? (
                <Grid container spacing={3}>
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <Grid item xs={12} md={6} lg={4} key={item}>
                      <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <>
                  <Grid container spacing={3} mb={3}>
                    {filteredEmployees.map((employee) => (
                      <Grid item xs={12} md={6} lg={4} key={employee._id}>
                        <ModernEmployeeCard
                          employee={employee}
                          onViewDetail={handleOpenDetailModal}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  
                  {filteredEmployees.length === 0 && (
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Çalışan Bulunamadı
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Filtreleri temizleyerek tekrar deneyin.
                      </Typography>
                    </Paper>
                  )}
                </>
              )}
            </Box>
          )}
        </>
      ) : (
        <Box>
          {/* 📊 İzin Talepleri İstatistik Kartları */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={4} md={2}>
              <LeaveRequestStatCard
                title="Toplam Talep"
                value={leaveRequestStats.total}
                icon={<AssessmentIcon />}
                color="#2196F3"
                subtitle={`${leaveRequestStats.totalDays} gün`}
                onClick={() => setSelectedTab(0)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <LeaveRequestStatCard
                title="Bekleyen"
                value={leaveRequestStats.pending}
                icon={<HourglassEmptyIcon />}
                color="#FF9800"
                subtitle="Onay bekliyor"
                onClick={() => setSelectedTab(1)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <LeaveRequestStatCard
                title="Onaylanan"
                value={leaveRequestStats.approved}
                icon={<CheckCircleIcon />}
                color="#4CAF50"
                subtitle="Tamamlandı"
                onClick={() => setSelectedTab(2)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <LeaveRequestStatCard
                title="Reddedilen"
                value={leaveRequestStats.rejected}
                icon={<CancelIcon />}
                color="#F44336"
                subtitle="İptal edildi"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <LeaveRequestStatCard
                title="Özel İzin"
                value={leaveRequestStats.special}
                icon={<StarIcon />}
                color="#9C27B0"
                subtitle="Gelecek yıldan"
                onClick={() => setSelectedTab(3)}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateSpecialLeaveOpen(true)}
                sx={{
                  height: '140px',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 28px rgba(102, 126, 234, 0.4)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Özel İzin Oluştur
              </Button>
            </Grid>
          </Grid>

          {/* 🎛️ Tabs ve Filtreler */}
          <Paper sx={{ borderRadius: 3, border: '1px solid #e0e0e0', mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs 
                value={selectedTab} 
                onChange={(e, newValue) => setSelectedTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    minHeight: 56
                  }
                }}
              >
                <Tab 
                  icon={<AssessmentIcon />} 
                  iconPosition="start" 
                  label={
                    <Badge badgeContent={leaveRequestStats.total} color="primary" max={999}>
                      <span style={{ marginRight: 24 }}>Tüm İzinler</span>
                    </Badge>
                  } 
                />
                <Tab 
                  icon={<HourglassEmptyIcon />} 
                  iconPosition="start" 
                  label={
                    <Badge badgeContent={leaveRequestStats.pending} color="warning" max={999}>
                      <span style={{ marginRight: 24 }}>Bekleyen</span>
                    </Badge>
                  }
                />
                <Tab 
                  icon={<CheckCircleIcon />} 
                  iconPosition="start" 
                  label={
                    <Badge badgeContent={leaveRequestStats.approved} color="success" max={999}>
                      <span style={{ marginRight: 24 }}>Onaylanan</span>
                    </Badge>
                  }
                />
                <Tab 
                  icon={<StarIcon />} 
                  iconPosition="start" 
                  label={
                    <Badge badgeContent={leaveRequestStats.special} color="secondary" max={999}>
                      <span style={{ marginRight: 24 }}>Özel İzinler</span>
                    </Badge>
                  }
                />
                <Tab 
                  icon={<HistoryIcon />} 
                  iconPosition="start" 
                  label="Son 30 Gün"
                />
              </Tabs>
            </Box>

            {/* Filtreler */}
            <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Ara..."
                    value={leaveRequestFilters.searchText}
                    onChange={(e) => setLeaveRequestFilters(prev => ({ ...prev, searchText: e.target.value }))}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                    <InputLabel>Durum</InputLabel>
                    <Select
                      value={leaveRequestFilters.status}
                      label="Durum"
                      onChange={(e) => setLeaveRequestFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="">Tümü</MenuItem>
                      <MenuItem value="ONAY_BEKLIYOR">Onay Bekliyor</MenuItem>
                      <MenuItem value="ONAYLANDI">Onaylandı</MenuItem>
                      <MenuItem value="REDDEDILDI">Reddedildi</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Departman"
                    value={leaveRequestFilters.department}
                    onChange={(e) => setLeaveRequestFilters(prev => ({ ...prev, department: e.target.value }))}
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Başlangıç"
                    value={leaveRequestFilters.startDate}
                    onChange={(e) => setLeaveRequestFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Bitiş"
                    value={leaveRequestFilters.endDate}
                    onChange={(e) => setLeaveRequestFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    sx={{ bgcolor: 'white' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={1}>
                  <Tooltip title="Filtreleri Temizle" arrow>
                    <IconButton 
                      onClick={() => setLeaveRequestFilters({ status: '', department: '', startDate: '', endDate: '', leaveType: '', searchText: '' })}
                      sx={{ 
                        bgcolor: 'white',
                        border: '1px solid #e0e0e0',
                        '&:hover': { bgcolor: '#f5f5f5' }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* 📋 İzin Talepleri Listesi */}
          <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0', minHeight: 400 }}>
            {leaveRequestsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
                <CircularProgress size={48} />
              </Box>
            ) : filteredLeaveRequests.length === 0 ? (
              <Box textAlign="center" py={8}>
                <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {leaveRequests.length === 0 ? 'Henüz izin talebi bulunmuyor' : 'Filtre kriterlerine uygun talep bulunamadı'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {leaveRequests.length === 0 
                    ? `${selectedYear} yılı için henüz izin talebi oluşturulmamış.`
                    : 'Farklı filtreler deneyebilir veya filtreleri temizleyebilirsiniz.'
                  }
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight={600}>
                    {filteredLeaveRequests.length} Talep Bulundu
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportLeaveRequestsToExcel}
                    size="small"
                  >
                    Excel İndir
                  </Button>
                </Box>

                <Box sx={{ maxHeight: 600, overflowY: 'auto', pr: 1 }}>
                  {filteredLeaveRequests.map((request) => (
                    <LeaveRequestCard
                      key={request._id}
                      request={request}
                      employees={employees}
                      onEdit={(employee, leaveReq) => {
                        setSelectedEmployee(employee);
                        setSelectedLeaveRequest(leaveReq);
                        setEditModalOpen(true);
                      }}
                      onViewDetail={(req) => {
                        setSelectedLeaveDetail(req);
                        setLeaveDetailOpen(true);
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
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

      {/* 🌟 Özel İzin Oluşturma Modalı */}
      <Dialog
        open={createSpecialLeaveOpen}
        onClose={() => setCreateSpecialLeaveOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'primary.main',
          fontWeight: 700,
          fontSize: '20px',
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <StarIcon />
          Özel İzin Oluştur
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500}>
              Özel izinler, gelecek yılın hakkından düşülerek kullanılır.
            </Typography>
          </Alert>

          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>Çalışan Seçin</InputLabel>
              <Select
                value={selectedEmployee?._id || ''}
                label="Çalışan Seçin"
                onChange={(e) => {
                  const emp = employees.find(emp => emp._id === e.target.value);
                  setSelectedEmployee(emp);
                }}
              >
                {employees.filter(emp => emp.izinBilgileri?.hakEdilen > 0).map(emp => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.adSoyad} - {emp.departman || 'Departman yok'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedEmployee && (
              <Card sx={{ bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Bu Yıl Kalan:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedEmployee.izinBilgileri?.kalan || 0} gün
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">
                        Gelecek Yıl Hak Edilen:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        ~{selectedEmployee.izinBilgileri?.hakEdilen || 0} gün
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <TextField
              fullWidth
              type="date"
              label="Başlangıç Tarihi"
              InputLabelProps={{ shrink: true }}
              id="special-leave-start"
            />

            <TextField
              fullWidth
              type="date"
              label="Bitiş Tarihi"
              InputLabelProps={{ shrink: true }}
              id="special-leave-end"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notlar"
              placeholder="Özel izin sebebi veya ek bilgiler..."
              id="special-leave-notes"
            />
          </Stack>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              setCreateSpecialLeaveOpen(false);
              setSelectedEmployee(null);
            }}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            İptal
          </Button>
          <Button 
            onClick={async () => {
              if (!selectedEmployee) {
                showNotification('Lütfen bir çalışan seçin', 'warning');
                return;
              }

              const startDate = document.getElementById('special-leave-start').value;
              const endDate = document.getElementById('special-leave-end').value;
              const notes = document.getElementById('special-leave-notes').value;

              if (!startDate || !endDate) {
                showNotification('Lütfen tarih aralığı seçin', 'warning');
                return;
              }

              try {
                const response = await fetch(`${API_BASE}/api/annual-leave/request/special`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    employeeId: selectedEmployee._id,
                    startDate,
                    endDate,
                    notes: notes || `Özel izin talebi - ${selectedEmployee.adSoyad}`
                  })
                });

                const data = await response.json();
                
                if (data.success) {
                  showNotification('Özel izin başarıyla oluşturuldu!', 'success');
                  setCreateSpecialLeaveOpen(false);
                  setSelectedEmployee(null);
                  handleLeaveUpdated();
                } else {
                  showNotification(data.message || 'Özel izin oluşturulamadı', 'error');
                }
              } catch (error) {
                console.error('Özel izin oluşturma hatası:', error);
                showNotification('Bir hata oluştu', 'error');
              }
            }}
            variant="contained"
            sx={{ 
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
            disabled={!selectedEmployee}
          >
            Oluştur
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📄 İzin Detay Görüntüleme Modalı */}
      <Dialog
        open={leaveDetailOpen}
        onClose={() => {
          setLeaveDetailOpen(false);
          setSelectedLeaveDetail(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        {selectedLeaveDetail && (
          <>
            <DialogTitle sx={{ 
              bgcolor: '#f8f9fa',
              fontWeight: 700,
              fontSize: '20px',
              pb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box display="flex" alignItems="center" gap={1}>
                <EventIcon color="primary" />
                İzin Talebi Detayları
              </Box>
              <IconButton 
                onClick={() => {
                  setLeaveDetailOpen(false);
                  setSelectedLeaveDetail(null);
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                {/* Çalışan Bilgileri */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2.5, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: 22 }}>
                        {selectedLeaveDetail.employeeName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight={600}>
                          {selectedLeaveDetail.employeeName}
                        </Typography>
                        <Stack direction="row" spacing={2} mt={0.5}>
                          <Chip 
                            icon={<WorkIcon />}
                            label={selectedLeaveDetail.department || 'Departman belirtilmemiş'} 
                            size="small" 
                            variant="outlined"
                          />
                          {selectedLeaveDetail.type === 'OZEL' && (
                            <Chip 
                              icon={<StarIcon />}
                              label="Özel İzin" 
                              size="small" 
                              color="warning"
                            />
                          )}
                        </Stack>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Tarih Bilgileri */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, border: '1px solid #e0e0e0', height: '100%' }}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600} display="block" mb={2}>
                      Tarih Bilgileri
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Başlangıç Tarihi
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarTodayIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                          <Typography variant="body1" fontWeight={600}>
                            {selectedLeaveDetail.startDate ? format(new Date(selectedLeaveDetail.startDate), 'dd MMMM yyyy, EEEE', { locale: tr }) : '-'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Bitiş Tarihi
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarTodayIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
                          <Typography variant="body1" fontWeight={600}>
                            {selectedLeaveDetail.endDate ? format(new Date(selectedLeaveDetail.endDate), 'dd MMMM yyyy, EEEE', { locale: tr }) : '-'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Toplam Gün
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <AccessTimeIcon sx={{ fontSize: 20, color: 'success.main' }} />
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {selectedLeaveDetail.days || 0} Gün
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Durum ve Zaman Bilgileri */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2.5, border: '1px solid #e0e0e0', height: '100%' }}>
                    <Typography variant="overline" color="text.secondary" fontWeight={600} display="block" mb={2}>
                      Durum Bilgileri
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          İzin Durumu
                        </Typography>
                        <Chip 
                          icon={
                            selectedLeaveDetail.status === 'ONAYLANDI' || selectedLeaveDetail.status === 'APPROVED' ? <CheckCircleIcon /> :
                            selectedLeaveDetail.status === 'REDDEDILDI' || selectedLeaveDetail.status === 'REJECTED' ? <CancelIcon /> :
                            <HourglassEmptyIcon />
                          }
                          label={
                            selectedLeaveDetail.status === 'ONAYLANDI' || selectedLeaveDetail.status === 'APPROVED' ? 'Onaylandı' :
                            selectedLeaveDetail.status === 'REDDEDILDI' || selectedLeaveDetail.status === 'REJECTED' ? 'Reddedildi' :
                            selectedLeaveDetail.status === 'IPTAL_EDILDI' || selectedLeaveDetail.status === 'CANCELLED' ? 'İptal Edildi' :
                            'Onay Bekliyor'
                          }
                          color={
                            selectedLeaveDetail.status === 'ONAYLANDI' || selectedLeaveDetail.status === 'APPROVED' ? 'success' :
                            selectedLeaveDetail.status === 'REDDEDILDI' || selectedLeaveDetail.status === 'REJECTED' ? 'error' :
                            'warning'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      {selectedLeaveDetail.createdAt && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Oluşturulma Tarihi
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {format(new Date(selectedLeaveDetail.createdAt), 'dd.MM.yyyy HH:mm')}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                {/* Notlar */}
                {selectedLeaveDetail.notes && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2.5, border: '1px solid #e0e0e0', bgcolor: '#fffbf0' }}>
                      <Typography variant="overline" color="text.secondary" fontWeight={600} display="block" mb={1}>
                        Notlar
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {selectedLeaveDetail.notes}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button 
                onClick={() => {
                  setLeaveDetailOpen(false);
                  setSelectedLeaveDetail(null);
                }}
                variant="outlined"
                sx={{ textTransform: 'none' }}
              >
                Kapat
              </Button>
              <Button 
                onClick={() => {
                  const employee = employees.find(emp => emp._id === selectedLeaveDetail.employeeId);
                  if (employee) {
                    const leaveReq = {
                      _id: selectedLeaveDetail._id,
                      startDate: selectedLeaveDetail.startDate,
                      endDate: selectedLeaveDetail.endDate,
                      days: selectedLeaveDetail.days,
                      notes: selectedLeaveDetail.notes,
                      status: selectedLeaveDetail.status
                    };
                    setSelectedEmployee(employee);
                    setSelectedLeaveRequest(leaveReq);
                    setLeaveDetailOpen(false);
                    setSelectedLeaveDetail(null);
                    setEditModalOpen(true);
                  }
                }}
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ textTransform: 'none' }}
              >
                Düzenle
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default AnnualLeave;
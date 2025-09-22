import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Avatar,
  Tooltip,
  Menu,
  Divider,
  LinearProgress,
  Container,
  Grow,
  Slide,
  Skeleton,
  TablePagination,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  ButtonGroup
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

// Modern status configuration
const statusConfig = {
  pending: {
    color: 'warning',
    text: 'Bekliyor',
    icon: <ScheduleIcon />,
    bgColor: 'rgba(255, 193, 7, 0.1)'
  },
  reviewing: {
    color: 'info',
    text: 'İnceleniyor',
    icon: <AssessmentIcon />,
    bgColor: 'rgba(33, 150, 243, 0.1)'
  },
  approved: {
    color: 'success',
    text: 'Onaylandı',
    icon: <CheckCircleIcon />,
    bgColor: 'rgba(76, 175, 80, 0.1)'
  },
  rejected: {
    color: 'error',
    text: 'Reddedildi',
    icon: <CancelIcon />,
    bgColor: 'rgba(244, 67, 54, 0.1)'
  },
  interview: {
    color: 'secondary',
    text: 'Mülakat',
    icon: <GroupIcon />,
    bgColor: 'rgba(156, 39, 176, 0.1)'
  }
};

// Advanced Status Card Component
function StatusCard({ status, count, onClick, isActive }) {
  const config = statusConfig[status];
  
  return (
    <Grow in timeout={600}>
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '2px solid',
          borderColor: isActive ? `${config.color}.main` : 'divider',
          backgroundColor: isActive ? config.bgColor : 'background.paper',
          '&:hover': {
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: `0 12px 24px rgba(${config.color === 'warning' ? '255, 193, 7' : config.color === 'info' ? '33, 150, 243' : config.color === 'success' ? '76, 175, 80' : config.color === 'error' ? '244, 67, 54' : '156, 39, 176'}, 0.25)`,
            borderColor: `${config.color}.main`
          }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ textAlign: 'center', p: 3 }}>
          <Avatar
            sx={{
              bgcolor: `${config.color}.main`,
              width: 56,
              height: 56,
              mx: 'auto',
              mb: 2
            }}
          >
            {config.icon}
          </Avatar>
          <Typography variant="h4" component="div" sx={{ fontWeight: 700, mb: 1 }}>
            {count}
          </Typography>
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
            {config.text}
          </Typography>
        </CardContent>
      </Card>
    </Grow>
  );
}

// Enhanced Application Row Component
function ApplicationRow({ application, onViewDetails, onStatusChange, onActionMenu, isSelected, onToggleSelect }) {
  const statusInfo = statusConfig[application.status];
  
  return (
    <TableRow 
      hover
      selected={isSelected}
      sx={{ 
        cursor: 'pointer',
        '&:hover': { 
          backgroundColor: 'action.hover',
          transform: 'scale(1.005)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        },
        transition: 'all 0.2s ease'
      }}
    >
      <TableCell padding="checkbox">
        <IconButton onClick={() => onToggleSelect(application.id)} size="small">
          {isSelected ? <CheckCircleIcon color="primary" /> : <CheckCircleIcon color="disabled" />}
        </IconButton>
      </TableCell>
      
      <TableCell>
        <Typography variant="body2" fontWeight="bold" color="primary">
          {application.id}
        </Typography>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              mr: 2, 
              bgcolor: 'primary.main',
              width: 48,
              height: 48
            }}
          >
            {application.personalInfo.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight="600">
              {application.personalInfo.name} {application.personalInfo.surname}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {application.personalInfo.gender} • {application.personalInfo.nationality}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
            <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
            {application.personalInfo.phoneMobile}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            📍 {application.personalInfo.address}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        {application.educationInfo[0] && (
          <Box>
            <Typography variant="body2" fontWeight="500">
              🎓 {application.educationInfo[0].schoolName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {application.educationInfo[0].department}
            </Typography>
          </Box>
        )}
      </TableCell>

      <TableCell>
        {application.workExperience[0] && (
          <Box>
            <Typography variant="body2" fontWeight="500">
              💼 {application.workExperience[0].companyName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {application.workExperience[0].position} • {application.workExperience[0].salaryReceived} ₺
            </Typography>
          </Box>
        )}
      </TableCell>

      <TableCell>
        <Chip 
          label={statusInfo.text}
          color={statusInfo.color}
          icon={statusInfo.icon}
          sx={{ fontWeight: 600 }}
        />
      </TableCell>

      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2">
            📅 {new Date(application.submittedAt).toLocaleDateString('tr-TR')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            🕐 {new Date(application.submittedAt).toLocaleTimeString('tr-TR')}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Detayları Görüntüle" arrow>
            <IconButton 
              size="small" 
              onClick={() => onViewDetails(application)}
              color="primary"
              sx={{ 
                '&:hover': { 
                  transform: 'scale(1.2)',
                  backgroundColor: 'primary.light'
                }
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Durum Değiştir" arrow>
            <IconButton 
              size="small" 
              onClick={() => onStatusChange(application)}
              color="secondary"
              sx={{ 
                '&:hover': { 
                  transform: 'scale(1.2)',
                  backgroundColor: 'secondary.light'
                }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Diğer İşlemler" arrow>
            <IconButton 
              size="small" 
              onClick={(e) => onActionMenu(e, application)}
              sx={{ 
                '&:hover': { 
                  transform: 'scale(1.2)'
                }
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function JobApplicationsList() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Load applications
  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/job-applications`);
        const result = await response.json();
        
        if (result.success) {
          setApplications(result.data.applications);
        } else {
          throw new Error(result.message);
        }
        
      } catch (error) {
        console.error('API hatası, demo veriler kullanılıyor:', error);
        setApplications(getDemoApplications());
      }
      
      setLoading(false);
    };

    loadApplications();
  }, []);

  // Demo data
  const getDemoApplications = () => [
    {
      id: 'JOB-1732123456789',
      personalInfo: {
        name: 'Ahmet',
        surname: 'Yılmaz', 
        gender: 'Erkek',
        phoneMobile: '0532 123 45 67',
        address: 'Çankaya, Ankara',
        nationality: 'TC'
      },
      educationInfo: [
        { schoolName: 'Gazi Üniversitesi', department: 'Makine Mühendisliği', degreeReceived: 'Lisans' }
      ],
      workExperience: [
        { companyName: 'ABC Şirketi', position: 'Mühendis', salaryReceived: '15000' }
      ],
      status: 'pending',
      submittedAt: '2024-11-20T10:30:00Z',
      submittedBy: 'GUEST',
      reviewedBy: null,
      notes: ''
    },
    {
      id: 'JOB-1732123456790',
      personalInfo: {
        name: 'Zeynep',
        surname: 'Kara',
        gender: 'Bayan', 
        phoneMobile: '0543 987 65 43',
        address: 'Kadıköy, İstanbul',
        nationality: 'TC'
      },
      educationInfo: [
        { schoolName: 'Boğaziçi Üniversitesi', department: 'Endüstri Mühendisliği', degreeReceived: 'Lisans' }
      ],
      workExperience: [
        { companyName: 'XYZ Corp', position: 'Proje Yöneticisi', salaryReceived: '22000' }
      ],
      status: 'reviewing',
      submittedAt: '2024-11-19T14:15:00Z',
      submittedBy: 'GUEST',
      reviewedBy: 'HR-001',
      notes: 'Profil uygun, mülakat aşamasına geçirilebilir.'
    },
    {
      id: 'JOB-1732123456791',
      personalInfo: {
        name: 'Mehmet',
        surname: 'Demir',
        gender: 'Erkek',
        phoneMobile: '0505 555 44 33', 
        address: 'Konak, İzmir',
        nationality: 'TC'
      },
      educationInfo: [
        { schoolName: 'Ege Üniversitesi', department: 'Bilgisayar Mühendisliği', degreeReceived: 'Lisans' }
      ],
      workExperience: [
        { companyName: 'Tech Start', position: 'Yazılım Geliştirici', salaryReceived: '18000' }
      ],
      status: 'approved',
      submittedAt: '2024-11-18T09:20:00Z',
      submittedBy: 'GUEST',
      reviewedBy: 'HR-001',
      notes: 'Başvuru onaylandı. İK ile görüşme planlandı.'
    },
    {
      id: 'JOB-1732123456792',
      personalInfo: {
        name: 'Ayşe',
        surname: 'Özkan',
        gender: 'Bayan',
        phoneMobile: '0532 444 33 22',
        address: 'Nilüfer, Bursa', 
        nationality: 'TC'
      },
      educationInfo: [
        { schoolName: 'Uludağ Üniversitesi', department: 'İktisat', degreeReceived: 'Lisans' }
      ],
      workExperience: [
        { companyName: 'Finance Co', position: 'Mali Müşavir', salaryReceived: '12000' }
      ],
      status: 'rejected',
      submittedAt: '2024-11-17T16:45:00Z',
      submittedBy: 'GUEST',
      reviewedBy: 'HR-002',
      notes: 'Deneyim alanı şirket gereksinimleri ile uyumlu değil.'
    }
  ];

  // Advanced filtering
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = searchTerm === '' || 
        app.personalInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.personalInfo.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.personalInfo.phoneMobile.includes(searchTerm) ||
        app.personalInfo.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.educationInfo[0] && app.educationInfo[0].schoolName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (app.workExperience[0] && app.workExperience[0].companyName.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  // Paginated applications
  const paginatedApplications = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredApplications.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredApplications, page, rowsPerPage]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: applications.length };
    Object.keys(statusConfig).forEach(status => {
      counts[status] = applications.filter(app => app.status === status).length;
    });
    return counts;
  }, [applications]);

  // Handlers
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailDialog(true);
  };

  const handleStatusChange = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setNotes(application.notes || '');
    setStatusDialog(true);
  };

  const handleUpdateStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/job-applications/${selectedApplication._id || selectedApplication.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes,
          reviewedBy: user?.employeeId || 'HR-001'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setApplications(prev => 
          prev.map(app => 
            (app._id || app.id) === (selectedApplication._id || selectedApplication.id) 
              ? { ...app, status: newStatus, notes: notes, reviewedBy: user?.employeeId || 'HR-001' }
              : app
          )
        );
      }

      setSnackbar({
        open: true,
        message: 'Başvuru durumu başarıyla güncellendi! 🎉',
        severity: 'success'
      });

      setStatusDialog(false);
      setSelectedApplication(null);
      
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Güncelleme sırasında hata oluştu!',
        severity: 'error'
      });
    }
  };

  const handleExportToExcel = () => {
    setSnackbar({
      open: true,
      message: 'Excel dosyası hazırlanıyor... 📊',
      severity: 'info'
    });
  };

  const handleActionMenu = (event, application) => {
    setAnchorEl(event.currentTarget);
    setCurrentAction(application);
  };

  const handleCloseActionMenu = () => {
    setAnchorEl(null);
    setCurrentAction(null);
  };

  const handleToggleSelect = (id) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApplications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    }
  };

  const handleBulkStatusUpdate = (newStatus) => {
    setApplications(prev => 
      prev.map(app => 
        selectedApplications.has(app.id) 
          ? { ...app, status: newStatus, reviewedBy: user?.employeeId || 'HR-001' }
          : app
      )
    );
    setSelectedApplications(new Set());
    setSnackbar({
      open: true,
      message: `${selectedApplications.size} başvurunun durumu güncellendi!`,
      severity: 'success'
    });
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
            <Skeleton variant="circular" width={64} height={64} sx={{ mr: 3 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width={300} height={40} />
              <Skeleton variant="text" width={200} height={24} sx={{ mt: 1 }} />
            </Box>
          </Box>
        </Paper>

        {/* Status Cards Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4, 5].map((index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Skeleton variant="circular" width={56} height={56} sx={{ mx: 'auto', mb: 2 }} />
                  <Skeleton variant="text" width={60} height={40} sx={{ mx: 'auto', mb: 1 }} />
                  <Skeleton variant="text" width={80} height={24} sx={{ mx: 'auto' }} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <LinearProgress sx={{ borderRadius: 2, height: 6, maxWidth: 300, mx: 'auto' }} />
          <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
            Başvurular yükleniyor...
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
            background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
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
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 80,
                    height: 80,
                    mr: 3,
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 40 }} />
                </Avatar>
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
                    Başvuru Yönetimi
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.95, 
                      fontWeight: 400, 
                      mb: 1 
                    }}
                  >
                    İnsan Kaynakları Kontrol Paneli
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {applications.length} Toplam Başvuru
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {statusCounts.pending} Bekleyen
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
              
              <Stack direction="row" spacing={2}>
                <Tooltip title="Verileri Yenile" arrow>
                  <IconButton
                    onClick={() => window.location.reload()}
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
                  startIcon={<ExportIcon />}
                  onClick={handleExportToExcel}
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
                  Excel'e Aktar
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Paper>
      </Slide>

      {/* Status Overview Cards */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 3, 
            fontWeight: 700, 
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 60,
              width: 60,
              height: 4,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #1976d2 0%, #dc004e 100%)'
            }
          }}
        >
          <TrendingUpIcon sx={{ mr: 2, color: 'primary.main' }} />
          Durum Özeti
        </Typography>
        
        <Grid container spacing={3}>
          {Object.entries(statusCounts).filter(([status]) => status !== 'all').map(([status, count]) => (
            <Grid item xs={12} sm={6} md={2.4} key={status}>
              <StatusCard
                status={status}
                count={count}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(0);
                }}
                isActive={statusFilter === status}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Advanced Filters */}
      <Paper elevation={0} sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Ad, soyad, telefon, adres, okul, şirket ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  sx: {
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid',
                      borderColor: 'divider'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Durum Filtresi</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => {setStatusFilter(e.target.value); setPage(0);}}
                  label="Durum Filtresi"
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="all">🌟 Tümü ({statusCounts.all})</MenuItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <MenuItem key={status} value={status}>
                      {React.cloneElement(config.icon, { sx: { mr: 1, fontSize: 18 } })}
                      {config.text} ({statusCounts[status] || 0})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                  {filteredApplications.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  filtrelenmiş başvuru
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Bulk Actions */}
          {selectedApplications.size > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  {selectedApplications.size} başvuru seçildi
                </Typography>
                <ButtonGroup variant="contained" size="small">
                  <Button onClick={() => handleBulkStatusUpdate('approved')} color="success">
                    Onayla
                  </Button>
                  <Button onClick={() => handleBulkStatusUpdate('rejected')} color="error">
                    Reddet
                  </Button>
                  <Button onClick={() => handleBulkStatusUpdate('interview')} color="secondary">
                    Mülakat
                  </Button>
                </ButtonGroup>
              </Box>
            </Box>
          )}
        </CardContent>
      </Paper>

      {/* Applications Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell padding="checkbox">
                  <IconButton onClick={handleSelectAll} size="small">
                    <CheckCircleIcon 
                      color={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0 ? 'primary' : 'disabled'} 
                    />
                  </IconButton>
                </TableCell>
                <TableCell><Typography variant="h6" color="white">ID</Typography></TableCell>
                <TableCell><Typography variant="h6" color="white">Başvuran</Typography></TableCell>
                <TableCell><Typography variant="h6" color="white">İletişim</Typography></TableCell>
                <TableCell><Typography variant="h6" color="white">Eğitim</Typography></TableCell>
                <TableCell><Typography variant="h6" color="white">Deneyim</Typography></TableCell>
                <TableCell><Typography variant="h6" color="white">Durum</Typography></TableCell>
                <TableCell><Typography variant="h6" color="white">Tarih</Typography></TableCell>
                <TableCell><Typography variant="h6" color="white">İşlemler</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedApplications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  onViewDetails={handleViewDetails}
                  onStatusChange={handleStatusChange}
                  onActionMenu={handleActionMenu}
                  isSelected={selectedApplications.has(application.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredApplications.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Sayfa başına:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Paper>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Hızlı İşlemler"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
      >
        <SpeedDialAction
          key="export"
          icon={<ExportIcon />}
          tooltipTitle="Excel'e Aktar"
          onClick={handleExportToExcel}
        />
        <SpeedDialAction
          key="refresh"
          icon={<RefreshIcon />}
          tooltipTitle="Yenile"
          onClick={() => window.location.reload()}
        />
        <SpeedDialAction
          key="filter"
          icon={<FilterListIcon />}
          tooltipTitle="Gelişmiş Filtreler"
          onClick={() => setSearchTerm('')}
        />
      </SpeedDial>

      {/* Enhanced Detail Dialog */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 2 }} />
            <Box>
              <Typography variant="h5" component="div">
                Başvuru Detayları
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {selectedApplication?.id}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={() => setDetailDialog(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {selectedApplication && (
            <Box>
              {/* Status Header */}
              <Box sx={{ 
                p: 3, 
                bgcolor: statusConfig[selectedApplication.status]?.bgColor || 'grey.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {statusConfig[selectedApplication.status]?.icon}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">
                      Durum: {statusConfig[selectedApplication.status]?.text}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İnceleme: {selectedApplication.reviewedBy || 'Henüz incelenmedi'}
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  label={statusConfig[selectedApplication.status]?.text}
                  color={statusConfig[selectedApplication.status]?.color}
                  icon={statusConfig[selectedApplication.status]?.icon}
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              {/* Content Sections */}
              <Box sx={{ p: 3 }}>
                <Grid container spacing={4}>
                  {/* Personal Info */}
                  <Grid item xs={12} md={6}>
                    <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'primary.light' }}>
                        <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1 }} />
                          Kişisel Bilgiler
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Ad Soyad</Typography>
                            <Typography variant="body1" fontWeight="600">
                              {selectedApplication.personalInfo.name} {selectedApplication.personalInfo.surname}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Cinsiyet</Typography>
                            <Typography variant="body1">{selectedApplication.personalInfo.gender}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Telefon</Typography>
                            <Typography variant="body1">{selectedApplication.personalInfo.phoneMobile}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Uyruk</Typography>
                            <Typography variant="body1">{selectedApplication.personalInfo.nationality}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Adres</Typography>
                            <Typography variant="body1">{selectedApplication.personalInfo.address}</Typography>
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  {/* Education Info */}
                  <Grid item xs={12} md={6}>
                    <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'secondary.light' }}>
                        <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                          <SchoolIcon sx={{ mr: 1 }} />
                          Eğitim Bilgileri
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {selectedApplication.educationInfo.map((edu, index) => (
                          <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                            <Stack spacing={1}>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Okul</Typography>
                                <Typography variant="body1" fontWeight="600">{edu.schoolName}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Bölüm</Typography>
                                <Typography variant="body1">{edu.department}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" color="text.secondary">Derece</Typography>
                                <Typography variant="body1">{edu.degreeReceived}</Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  {/* Work Experience */}
                  <Grid item xs={12}>
                    <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'success.light' }}>
                        <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                          <WorkIcon sx={{ mr: 1 }} />
                          İş Deneyimi
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {selectedApplication.workExperience.map((work, index) => (
                            <Grid item xs={12} md={6} key={index}>
                              <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Stack spacing={1}>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Şirket</Typography>
                                    <Typography variant="body1" fontWeight="600">{work.companyName}</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Pozisyon</Typography>
                                    <Typography variant="body1">{work.position}</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">Maaş</Typography>
                                    <Typography variant="body1">{work.salaryReceived} ₺</Typography>
                                  </Box>
                                </Stack>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>

                  {/* Review Notes */}
                  {selectedApplication.notes && (
                    <Grid item xs={12}>
                      <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'warning.light' }}>
                          <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                            <StarIcon sx={{ mr: 1 }} />
                            İnceleme Notları
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body1">{selectedApplication.notes}</Typography>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button onClick={() => setDetailDialog(false)} variant="outlined" size="large">
            Kapat
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setDetailDialog(false);
              handleStatusChange(selectedApplication);
            }}
            size="large"
            startIcon={<EditIcon />}
          >
            Durum Değiştir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Status Dialog */}
      <Dialog 
        open={statusDialog} 
        onClose={() => setStatusDialog(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <EditIcon sx={{ mr: 2 }} />
          <Box>
            <Typography variant="h6">Başvuru Durumu Güncelle</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {selectedApplication?.id} - {selectedApplication?.personalInfo?.name} {selectedApplication?.personalInfo?.surname}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Yeni Durum</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Yeni Durum"
                sx={{ borderRadius: 2 }}
              >
                {Object.entries(statusConfig).map(([status, config]) => (
                  <MenuItem key={status} value={status}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {config.icon}
                      <Typography sx={{ ml: 1 }}>{config.text}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="İnceleme Notları"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bu başvuru ile ilgili notlarınızı buraya yazın..."
              sx={{ 
                '& .MuiOutlinedInput-root': { borderRadius: 2 }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={() => setStatusDialog(false)} 
            variant="outlined" 
            size="large"
          >
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateStatus}
            size="large"
            sx={{ minWidth: 120 }}
          >
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseActionMenu}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => {
          setSnackbar({ open: true, message: 'E-mail gönderiliyor...', severity: 'info' });
          handleCloseActionMenu();
        }}>
          <EmailIcon sx={{ mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="body2">E-mail Gönder</Typography>
            <Typography variant="caption" color="text.secondary">Başvurana bilgilendirme maili</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={() => {
          setSnackbar({ open: true, message: 'CV indiriliyor...', severity: 'info' });
          handleCloseActionMenu();
        }}>
          <DownloadIcon sx={{ mr: 2, color: 'success.main' }} />
          <Box>
            <Typography variant="body2">CV İndir</Typography>
            <Typography variant="caption" color="text.secondary">PDF formatında indir</Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (window.confirm('Bu başvuruyu silmek istediğinizden emin misiniz?')) {
              setApplications(prev => prev.filter(app => app.id !== currentAction.id));
              setSnackbar({ open: true, message: 'Başvuru silindi!', severity: 'success' });
            }
            handleCloseActionMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 2 }} />
          <Box>
            <Typography variant="body2">Başvuruyu Sil</Typography>
            <Typography variant="caption" color="text.secondary">Kalıcı olarak sil</Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontWeight: 500
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default JobApplicationsList;
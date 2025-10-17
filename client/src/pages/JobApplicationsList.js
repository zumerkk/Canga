import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  InputAdornment,
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
  Skeleton,
  TablePagination,
  Stack,
  useTheme,
  useMediaQuery,
  Fade,
  CircularProgress,
  Zoom,
  Badge,
  Breadcrumbs,
  Link,
  alpha,
  Chip,
  Paper,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
// Modern Components
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
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
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


// Enhanced Application Row Component with Responsive Design
const ApplicationRow = React.memo(({ 
  application, 
  onViewDetails, 
  onStatusChange, 
  onActionMenu, 
  isSelected, 
  onToggleSelect,
  isMobile = false,
  isTablet = false,
  index
}) => {
  const statusInfo = statusConfig[application.status];
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Fade in timeout={300 + (index * 50)}>
    <TableRow 
      hover
      selected={isSelected}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      sx={{ 
        cursor: 'pointer',
        '&:hover': { 
            backgroundColor: isSelected ? 'primary.light' : 'action.hover',
            transform: 'scale(1.002)',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.15)'
          },
          '&.Mui-selected': {
            backgroundColor: 'primary.light',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white'
            }
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: isSelected ? 'primary.main' : 'transparent',
            transition: 'all 0.3s ease'
          }
        }}
      >
        {/* Selection Checkbox */}
      <TableCell padding="checkbox">
          <Tooltip title={isSelected ? "Seçimi Kaldır" : "Seç"} arrow>
            <IconButton 
              onClick={() => onToggleSelect(application._id)} 
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'primary.light',
                  transform: 'scale(1.2)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {isSelected ? (
                <CheckCircleIcon color="primary" />
              ) : (
                <CheckCircleIcon 
                  color="disabled"
                  sx={{
                    '&:hover': {
                      color: 'primary.main'
                    }
                  }}
                />
              )}
        </IconButton>
          </Tooltip>
      </TableCell>
      
        {/* ID Column - Hidden on mobile */}
        {!isMobile && (
      <TableCell>
            <Chip
              label={(application.applicationId || application._id || 'N/A').replace('JOB-', '')}
              variant="outlined"
              size="small"
              color="primary"
              sx={{ 
                fontFamily: 'monospace',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'primary.light'
                }
              }}
            />
      </TableCell>
        )}
      
        {/* Applicant Info */}
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              badgeContent={
                application.status === 'pending' ? (
                  <CircularProgress size={12} thickness={6} />
                ) : application.status === 'approved' ? (
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : application.status === 'rejected' ? (
                  <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
                ) : null
              }
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
            >
          <Avatar 
            sx={{ 
                  mr: isMobile ? 1 : 2, 
                  bgcolor: `${statusInfo.color}.main`,
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
                  fontSize: isMobile ? '1rem' : '1.25rem',
                  fontWeight: 600,
                  border: '2px solid',
                  borderColor: isHovered ? 'primary.main' : 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                {application.personalInfo.name.charAt(0)}{application.personalInfo.surname.charAt(0)}
          </Avatar>
            </Badge>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant={isMobile ? "body2" : "body1"} 
                fontWeight="600"
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
              {application.personalInfo.name} {application.personalInfo.surname}
            </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
                  {application.personalInfo.gender}
            </Typography>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {application.personalInfo.nationality}
                </Typography>
                {isMobile && (
                  <>
                    <Typography variant="caption" color="text.secondary">•</Typography>
                    <Typography variant="caption" color="primary.main">
                      {application.personalInfo.phoneMobile}
                    </Typography>
                  </>
                )}
              </Stack>
          </Box>
        </Box>
      </TableCell>

        {/* Contact Info - Hidden on mobile */}
        {!isMobile && (
      <TableCell>
        <Stack spacing={0.5}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight="500">
            {application.personalInfo.phoneMobile}
          </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: 'secondary.main' }} />
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 150
                  }}
                >
                  {application.personalInfo.email || 'Belirtilmemiş'}
          </Typography>
              </Box>
        </Stack>
      </TableCell>
        )}

        {/* Education Info - Hidden on tablet and mobile */}
        {!isTablet && (
      <TableCell>
            {application.educationInfo && application.educationInfo[0] ? (
          <Box>
                <Typography variant="body2" fontWeight="500" sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon sx={{ fontSize: 16, mr: 0.5, color: 'info.main' }} />
                  {application.educationInfo[0].schoolName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {application.educationInfo[0].department}
            </Typography>
          </Box>
            ) : (
              <Typography variant="caption" color="text.disabled" fontStyle="italic">
                Eğitim bilgisi yok
              </Typography>
        )}
      </TableCell>
        )}

        {/* Work Experience - Hidden on tablet and mobile */}
        {!isTablet && (
      <TableCell>
            {application.workExperience && application.workExperience[0] ? (
          <Box>
                <Typography variant="body2" fontWeight="500" sx={{ display: 'flex', alignItems: 'center' }}>
                  <WorkIcon sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
                  {application.workExperience[0].companyName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                  {application.workExperience[0].position}
                  {application.workExperience[0].salaryReceived && ` • ${application.workExperience[0].salaryReceived} ₺`}
            </Typography>
          </Box>
            ) : (
              <Typography variant="caption" color="text.disabled" fontStyle="italic">
                Deneyim bilgisi yok
              </Typography>
        )}
      </TableCell>
        )}

        {/* Status */}
      <TableCell>
          <Zoom in timeout={300}>
        <Chip 
          label={statusInfo.text}
          color={statusInfo.color}
          icon={statusInfo.icon}
              size={isMobile ? "small" : "medium"}
              sx={{ 
                fontWeight: 600,
                animation: application.status === 'pending' ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': {
                    opacity: 1,
                  },
                  '50%': {
                    opacity: 0.7,
                  },
                  '100%': {
                    opacity: 1,
                  },
                }
              }}
            />
          </Zoom>
      </TableCell>

        {/* Date - Hidden on mobile */}
        {!isMobile && (
      <TableCell>
        <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
            📅 {new Date(application.submittedAt).toLocaleDateString('tr-TR')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
                🕐 {new Date(application.submittedAt).toLocaleTimeString('tr-TR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
          </Typography>
        </Stack>
      </TableCell>
        )}

        {/* Actions */}
      <TableCell>
          <Stack direction="row" spacing={isMobile ? 0.5 : 1}>
            <Tooltip title="Detayları Görüntüle" arrow placement="top">
            <IconButton 
              size="small" 
              onClick={() => onViewDetails(application)}
              sx={{ 
                  color: 'primary.main',
                '&:hover': { 
                  transform: 'scale(1.2)',
                    backgroundColor: 'primary.light',
                    color: 'white'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <VisibilityIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
          
            <Tooltip title="Durum Değiştir" arrow placement="top">
            <IconButton 
              size="small" 
              onClick={() => onStatusChange(application)}
              sx={{ 
                  color: 'secondary.main',
                '&:hover': { 
                  transform: 'scale(1.2)',
                    backgroundColor: 'secondary.light',
                    color: 'white'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <EditIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>

            <Tooltip title="Diğer İşlemler" arrow placement="top">
            <IconButton 
              size="small" 
              onClick={(e) => onActionMenu(e, application)}
              sx={{ 
                  color: 'text.secondary',
                '&:hover': { 
                    transform: 'scale(1.2)',
                    backgroundColor: 'grey.200',
                    color: 'text.primary'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <MoreVertIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
    </Fade>
  );
});

function JobApplicationsList() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const searchInputRef = useRef(null);
  
  // Core state
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  
  // Dialog states
  const [detailDialog, setDetailDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [selectedApplications, setSelectedApplications] = useState(new Set());
  
  // Performance optimizations

  // Load applications
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        ((app.applicationId || app._id || app.id || '') + '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Optimized handlers with useCallback
  const handleViewDetails = useCallback((application) => {
    setSelectedApplication(application);
    setDetailDialog(true);
  }, []);

  const handleStatusChange = useCallback((application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setNotes(application.notes || '');
    setStatusDialog(true);
  }, []);

  // Debounced search with performance optimization
  const debouncedSearch = useCallback((searchValue) => {
    const timer = setTimeout(() => {
      setSearchTerm(searchValue);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    debouncedSearch(value);
  }, [debouncedSearch]);

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
    <Box sx={{ py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="xl">
      {/* Modern Header - Sade ve Profesyonel */}
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
              İş Başvuruları Yönetimi
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
              {applications.length} toplam başvuru • {statusCounts.pending} inceleme bekliyor
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1.5}>
            <Tooltip title="Sayfayı Yenile" arrow>
              <IconButton 
                onClick={loadApplications}
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
            <Tooltip title="Test Başvurularını Temizle" arrow>
              <IconButton 
                onClick={async () => {
                  if (window.confirm('Tüm test başvurularını silmek istediğinizden emin misiniz?')) {
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/job-applications/bulk/test-data`, {
                        method: 'DELETE'
                      });
                      const result = await response.json();
                      if (result.success) {
                        setSnackbar({
                          open: true,
                          message: `✅ ${result.data.deletedCount} test başvurusu silindi!`,
                          severity: 'success'
                        });
                        await loadApplications();
                      }
                    } catch (error) {
                      console.error('Test silme hatası:', error);
                      setSnackbar({
                        open: true,
                        message: '❌ Test başvuruları silinemedi!',
                        severity: 'error'
                      });
                    }
                  }
                }}
                sx={{
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                    borderColor: 'error.main'
                  },
                  transition: 'all 0.25s ease'
                }}
              >
                <DeleteIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained" 
              size="medium"
              startIcon={<ExportIcon />}
              onClick={handleExportToExcel}
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
              Excel İndir
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Statistics Dashboard Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 12px 24px rgba(102, 126, 234, 0.3)'
              }
            }}
            onClick={() => { setStatusFilter('all'); setPage(0); }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <BusinessIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {applications.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Toplam Başvuru
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {Object.entries(statusConfig).map(([status, config]) => (
          <Grid item xs={12} sm={6} md={2.4} key={status}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: config.bgColor,
                border: `2px solid ${config.bgColor}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  borderColor: `${status}Chip.main`
                }
              }}
              onClick={() => { setStatusFilter(status); setPage(0); }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ mb: 1 }}>{config.icon}</Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: `${config.color}.main` }}>
                  {statusCounts[status] || 0}
                </Typography>
                <Chip 
                  label={config.text}
                  color={config.color}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Enhanced Breadcrumb */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Breadcrumbs separator="›" sx={{ fontSize: '0.875rem' }}>
          <Link color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            Dashboard
          </Link>
          <Link color="inherit" href="/hr/job-applications" sx={{ display: 'flex', alignItems: 'center' }}>
            İnsan Kaynakları
          </Link>
          <Typography color="primary.main" fontWeight={600}>
            Başvuru Yönetimi
          </Typography>
        </Breadcrumbs>
      </Paper>

      {/* Simple Search */}
      <Paper sx={{ p: 2, mb: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ad, soyad, telefon, e-posta ile ara..."
              ref={searchInputRef}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchTerm('');
                        if (searchInputRef.current) {
                          searchInputRef.current.value = '';
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                if (searchInputRef.current) {
                  searchInputRef.current.value = '';
                }
              }}
            >
              Temizle
            </Button>
          </Grid>
        </Grid>
        
        {filteredApplications.length !== applications.length && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {filteredApplications.length} sonuç bulundu
          </Typography>
        )}
        
        {/* Bulk Actions - Simplified */}
        {selectedApplications.size > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {selectedApplications.size} başvuru seçildi
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="contained" color="success" 
                  onClick={() => handleBulkStatusUpdate('approved')}>
                  Onayla
                </Button>
                <Button size="small" variant="contained" color="error" 
                  onClick={() => handleBulkStatusUpdate('rejected')}>
                  Reddet
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Simple Table */}
      <Paper sx={{ overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>

        {/* Responsive Table Container */}
        <TableContainer 
          sx={{ 
            maxHeight: isMobile ? 600 : 800,
            '&::-webkit-scrollbar': {
              width: 8,
              height: 8
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.3)'
              }
            }
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell 
                  padding="checkbox"
                  sx={{ 
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    fontWeight: 600
                  }}
                >
                  <Tooltip title="Tümünü Seç/Kaldır" arrow>
                    <IconButton 
                      onClick={handleSelectAll} 
                      size="small"
                      sx={{
                        '&:hover': {
                          backgroundColor: 'primary.light',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                    <CheckCircleIcon 
                      color={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0 ? 'primary' : 'disabled'} 
                    />
                  </IconButton>
                  </Tooltip>
                </TableCell>
                {!isMobile && (
                  <TableCell sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', fontWeight: 600 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ID
                    </Typography>
                  </TableCell>
                )}
                <TableCell sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', fontWeight: 600 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    👤 Başvuran
                  </Typography>
                </TableCell>
                {!isMobile && (
                  <TableCell sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', fontWeight: 600 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      📞 İletişim
                    </Typography>
                  </TableCell>
                )}
                {!isTablet && (
                  <>
                    <TableCell sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', fontWeight: 600 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        🎓 Eğitim
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', fontWeight: 600 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        💼 Deneyim
                      </Typography>
                    </TableCell>
                  </>
                )}
                <TableCell sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', fontWeight: 600 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    📊 Durum
                  </Typography>
                </TableCell>
                {!isMobile && (
                  <TableCell sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', fontWeight: 600 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      📅 Tarih
                    </Typography>
                  </TableCell>
                )}
                <TableCell sx={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', fontWeight: 600 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    ⚙️ İşlemler
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Enhanced Loading Skeleton
                Array.from(new Array(rowsPerPage)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Skeleton variant="circular" width={32} height={32} />
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Skeleton variant="text" width={80} />
                      </TableCell>
                    )}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                        <Box>
                          <Skeleton variant="text" width={120} />
                          <Skeleton variant="text" width={80} />
                        </Box>
                      </Box>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Skeleton variant="text" width={100} />
                        <Skeleton variant="text" width={150} />
                      </TableCell>
                    )}
                    {!isTablet && (
                      <>
                        <TableCell>
                          <Skeleton variant="text" width={120} />
                          <Skeleton variant="text" width={80} />
                        </TableCell>
                        <TableCell>
                          <Skeleton variant="text" width={100} />
                          <Skeleton variant="text" width={60} />
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Skeleton variant="rounded" width={80} height={32} />
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Skeleton variant="text" width={80} />
                        <Skeleton variant="text" width={60} />
                      </TableCell>
                    )}
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton variant="circular" width={32} height={32} />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedApplications.length === 0 ? (
                // Empty State
                <TableRow>
                  <TableCell colSpan={isMobile ? 4 : isTablet ? 6 : 9} sx={{ textAlign: 'center', py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Başvuru bulunamadı
                      </Typography>
                      <Typography variant="body2" color="text.disabled">
                        {searchTerm || statusFilter !== 'all' 
                          ? 'Arama kriterlerinizi değiştirmeyi deneyin'
                          : 'Henüz hiç başvuru yapılmamış'
                        }
                      </Typography>
                      {(searchTerm || statusFilter !== 'all') && (
                        <Button 
                          variant="outlined" 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            if (searchInputRef.current) {
                              searchInputRef.current.value = '';
                            }
                          }}
                          sx={{ mt: 2 }}
                        >
                          Filtreleri Temizle
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApplications.map((application, index) => (
                <ApplicationRow
                  key={application._id}
                  application={application}
                  onViewDetails={handleViewDetails}
                  onStatusChange={handleStatusChange}
                  onActionMenu={handleActionMenu}
                  isSelected={selectedApplications.has(application._id)}
                  onToggleSelect={handleToggleSelect}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    index={index}
                />
                ))
              )}
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
    </Box>
  );
}

export default JobApplicationsList;
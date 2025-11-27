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
  Zoom,
  Chip,
  Paper,
  Button,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab,
  Badge,
  alpha,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  CalendarMonth as CalendarIcon,
  Engineering as EngineeringIcon,
  Security as SecurityIcon,
  Build as BuildIcon,
  AdminPanelSettings as AdminIcon,
  Construction as ConstructionIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Star as StarIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  Groups as GroupsIcon,
  Factory as FactoryIcon,
  Handyman as HandymanIcon,
  ElectricalServices as ElectricalServicesIcon,
  LocalShipping as LocalShippingIcon,
  CleaningServices as CleaningServicesIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon,
  Description as DescriptionIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Note as NoteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

// Pozisyon kategorisi için icon ve renk
const getCategoryConfig = (category) => {
  const configs = {
    'CNC/Torna Operatörü': { icon: <EngineeringIcon />, color: '#667eea', bgColor: 'rgba(102, 126, 234, 0.1)' },
    'Kaynakçı': { icon: <ConstructionIcon />, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    'Makine Mühendisi': { icon: <EngineeringIcon />, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    'Elektrik/Elektronik Mühendisi': { icon: <ElectricalServicesIcon />, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    'Endüstri Mühendisi': { icon: <FactoryIcon />, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    'Mühendis': { icon: <EngineeringIcon />, color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.1)' },
    'Güvenlik Görevlisi': { icon: <SecurityIcon />, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    'Bakım-Onarım': { icon: <BuildIcon />, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
    'Elektrikçi': { icon: <ElectricalServicesIcon />, color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.1)' },
    'İdari/Muhasebe': { icon: <AdminIcon />, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
    'Genel/Üretim': { icon: <HandymanIcon />, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
    'Kalite Kontrol': { icon: <AssessmentIcon />, color: '#14b8a6', bgColor: 'rgba(20, 184, 166, 0.1)' },
    'Forklift Operatörü': { icon: <LocalShippingIcon />, color: '#84cc16', bgColor: 'rgba(132, 204, 22, 0.1)' },
    'Boyacı': { icon: <ConstructionIcon />, color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.1)' },
    'Temizlik': { icon: <CleaningServicesIcon />, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
    'Stajyer/Çırak': { icon: <SchoolIcon />, color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.1)' },
    'Diğer': { icon: <WorkIcon />, color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.1)' }
  };
  return configs[category] || configs['Diğer'];
};

// Yıl kartı renkleri
const yearColors = {
  2023: { primary: '#667eea', secondary: '#764ba2', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  2024: { primary: '#f59e0b', secondary: '#ef4444', gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  2025: { primary: '#10b981', secondary: '#06b6d4', gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }
};

// Pozisyon kategorileri
const POSITION_CATEGORIES = [
  'CNC/Torna Operatörü',
  'Kaynakçı',
  'Makine Mühendisi',
  'Elektrik/Elektronik Mühendisi',
  'Endüstri Mühendisi',
  'Mühendis',
  'Güvenlik Görevlisi',
  'Bakım-Onarım',
  'Elektrikçi',
  'İdari/Muhasebe',
  'Genel/Üretim',
  'Kalite Kontrol',
  'Forklift Operatörü',
  'Boyacı',
  'Temizlik',
  'Stajyer/Çırak',
  'Diğer'
];

// Başvuru Satırı Bileşeni
const ApplicationRow = React.memo(({ application, index, onViewDetails, onEdit, onDelete, isMobile, isTablet }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const categoryConfig = getCategoryConfig(application.positionCategory);
  const yearConfig = yearColors[application.year] || yearColors[2025];
  const isEditable = application.source === 'manual' || application._id;
  
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  return (
    <Fade in timeout={200 + (index * 30)}>
      <TableRow
        hover
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(categoryConfig.color, 0.05),
            transform: 'scale(1.001)'
          },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: isHovered ? categoryConfig.color : 'transparent',
            transition: 'all 0.2s ease'
          }
        }}
        onClick={() => onViewDetails(application)}
      >
        {/* Yıl */}
        <TableCell sx={{ width: 80 }}>
          <Chip
            label={application.year}
            size="small"
            sx={{
              background: yearConfig.gradient,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem'
            }}
          />
        </TableCell>
        
        {/* Ad Soyad */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: isMobile ? 36 : 42,
                height: isMobile ? 36 : 42,
                background: yearConfig.gradient,
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              {application.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
            </Avatar>
            <Box>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: isMobile ? 120 : 200
                }}
              >
                {application.fullName || 'İsimsiz'}
              </Typography>
              {isMobile && (
                <Typography variant="caption" color="text.secondary">
                  {application.phone}
                </Typography>
              )}
              {isEditable && (
                <Chip
                  label="Düzenlenebilir"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ mt: 0.5, fontSize: '0.6rem', height: 18 }}
                />
              )}
            </Box>
          </Box>
        </TableCell>
        
        {/* Pozisyon */}
        <TableCell>
          <Box>
            <Chip
              icon={categoryConfig.icon}
              label={application.positionCategory}
              size="small"
              sx={{
                backgroundColor: categoryConfig.bgColor,
                color: categoryConfig.color,
                fontWeight: 600,
                fontSize: '0.7rem',
                '& .MuiChip-icon': {
                  color: categoryConfig.color,
                  fontSize: '1rem'
                }
              }}
            />
            {!isMobile && application.position !== application.positionCategory && (
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 180
                }}
              >
                {application.position}
              </Typography>
            )}
          </Box>
        </TableCell>
        
        {/* Telefon */}
        {!isMobile && (
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2">
                {application.phone || '-'}
              </Typography>
            </Box>
          </TableCell>
        )}
        
        {/* Deneyim */}
        {!isTablet && (
          <TableCell>
            {application.experience ? (
              <Chip
                label={application.experience}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            ) : (
              <Typography variant="caption" color="text.disabled">-</Typography>
            )}
          </TableCell>
        )}
        
        {/* Referans */}
        {!isTablet && (
          <TableCell>
            {application.reference ? (
              <Tooltip title={application.reference} arrow>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 150,
                    color: 'primary.main',
                    fontWeight: 500
                  }}
                >
                  {application.reference}
                </Typography>
              </Tooltip>
            ) : (
              <Typography variant="caption" color="text.disabled">-</Typography>
            )}
          </TableCell>
        )}
        
        {/* Aksiyon */}
        <TableCell align="right">
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <Tooltip title="Detay Görüntüle" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(application);
                }}
                sx={{
                  color: categoryConfig.color,
                  '&:hover': { backgroundColor: categoryConfig.bgColor }
                }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ '&:hover': { backgroundColor: alpha('#667eea', 0.1) } }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: { minWidth: 160, borderRadius: 2 }
              }}
            >
              <MenuItem onClick={(e) => { e.stopPropagation(); handleMenuClose(); onEdit(application); }}>
                <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Düzenle</ListItemText>
              </MenuItem>
              {isEditable && (
                <MenuItem 
                  onClick={(e) => { e.stopPropagation(); handleMenuClose(); onDelete(application); }}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                  <ListItemText>Sil</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </Stack>
        </TableCell>
      </TableRow>
    </Fade>
  );
});

// İstatistik Kartı
const StatCard = ({ title, value, icon, color, gradient, onClick, selected }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      border: selected ? `2px solid ${color}` : '1px solid transparent',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${alpha(color, 0.25)}`
      } : {},
      background: gradient || 'white',
      color: gradient ? 'white' : 'inherit'
    }}
  >
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.25rem' }, lineHeight: 1.2 }}>
            {value.toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500, opacity: gradient ? 0.9 : 0.7 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{
          width: 52,
          height: 52,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: gradient ? 'rgba(255,255,255,0.2)' : alpha(color, 0.1)
        }}>
          {React.cloneElement(icon, { sx: { fontSize: 28, color: gradient ? 'white' : color } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// Kategori Bar
const CategoryBar = ({ category, count, total, onClick }) => {
  const percentage = (count / total) * 100;
  const config = getCategoryConfig(category);
  
  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        p: 1.5,
        borderRadius: 2,
        transition: 'all 0.2s ease',
        '&:hover': { backgroundColor: alpha(config.color, 0.08) }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: config.bgColor
          }}>
            {React.cloneElement(config.icon, { sx: { fontSize: 18, color: config.color } })}
          </Box>
          <Typography variant="body2" fontWeight={600}>{category}</Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} color={config.color}>
          {count.toLocaleString()}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: alpha(config.color, 0.15),
          '& .MuiLinearProgress-bar': { borderRadius: 3, backgroundColor: config.color }
        }}
      />
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════
function ManualApplicationsList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  // State
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showStats, setShowStats] = useState(true);
  
  // CRUD State
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    position: '',
    year: new Date().getFullYear(),
    applicationDate: '',
    experience: '',
    reference: '',
    interview: '',
    status: '',
    finalStatus: '',
    email: '',
    address: '',
    education: '',
    notes: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const searchInputRef = useRef(null);
  
  // Veri yükle
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      if (categoryFilter !== 'all') params.append('position', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page + 1);
      params.append('limit', rowsPerPage);
      
      const response = await fetch(`${API_BASE_URL}/api/manual-applications?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setApplications(result.data.applications);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      setSnackbar({ open: true, message: 'Veriler yüklenirken hata oluştu', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [yearFilter, categoryFilter, searchTerm, page, rowsPerPage]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Form reset
  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      position: '',
      year: new Date().getFullYear(),
      applicationDate: '',
      experience: '',
      reference: '',
      interview: '',
      status: '',
      finalStatus: '',
      email: '',
      address: '',
      education: '',
      notes: ''
    });
  };
  
  // Yeni başvuru ekle
  const handleAdd = async () => {
    if (!formData.fullName.trim()) {
      setSnackbar({ open: true, message: 'Ad soyad zorunludur', severity: 'error' });
      return;
    }
    if (!formData.position.trim()) {
      setSnackbar({ open: true, message: 'Pozisyon zorunludur', severity: 'error' });
      return;
    }
    
    setFormLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/manual-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSnackbar({ open: true, message: '✅ Başvuru başarıyla eklendi!', severity: 'success' });
        setAddDialog(false);
        resetForm();
        loadData();
      } else {
        setSnackbar({ open: true, message: result.message || 'Ekleme başarısız', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Bağlantı hatası', severity: 'error' });
    } finally {
      setFormLoading(false);
    }
  };
  
  // Başvuru güncelle
  const handleUpdate = async () => {
    if (!formData.fullName.trim()) {
      setSnackbar({ open: true, message: 'Ad soyad zorunludur', severity: 'error' });
      return;
    }
    
    setFormLoading(true);
    try {
      const id = selectedApplication._id || selectedApplication.id;
      const response = await fetch(`${API_BASE_URL}/api/manual-applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSnackbar({ open: true, message: '✅ Başvuru başarıyla güncellendi!', severity: 'success' });
        setEditDialog(false);
        resetForm();
        loadData();
      } else {
        setSnackbar({ open: true, message: result.message || 'Güncelleme başarısız', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Bağlantı hatası', severity: 'error' });
    } finally {
      setFormLoading(false);
    }
  };
  
  // Başvuru sil
  const handleDelete = async () => {
    setFormLoading(true);
    try {
      const id = selectedApplication._id || selectedApplication.id;
      const response = await fetch(`${API_BASE_URL}/api/manual-applications/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSnackbar({ open: true, message: '🗑️ Başvuru silindi', severity: 'success' });
        setDeleteDialog(false);
        loadData();
      } else {
        setSnackbar({ open: true, message: result.message || 'Silme başarısız', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Bağlantı hatası', severity: 'error' });
    } finally {
      setFormLoading(false);
    }
  };
  
  // Düzenleme için formu doldur
  const openEditDialog = (application) => {
    setSelectedApplication(application);
    setFormData({
      fullName: application.fullName || '',
      phone: application.phone || '',
      position: application.position || '',
      year: application.year || new Date().getFullYear(),
      applicationDate: application.applicationDate || '',
      experience: application.experience || '',
      reference: application.reference || '',
      interview: application.interview || '',
      status: application.status || '',
      finalStatus: application.finalStatus || '',
      email: application.email || '',
      address: application.address || '',
      education: application.education || '',
      notes: application.notes || ''
    });
    setEditDialog(true);
  };
  
  // Silme için dialog aç
  const openDeleteDialog = (application) => {
    setSelectedApplication(application);
    setDeleteDialog(true);
  };
  
  // Detay görüntüle
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailDialog(true);
  };
  
  // Telefon kopyala
  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone.replace(/\s/g, ''));
    setSnackbar({ open: true, message: 'Telefon numarası kopyalandı!', severity: 'success' });
  };
  
  // 🏆 Profesyonel Excel Export
  const handleExcelExport = async () => {
    setExportLoading(true);
    setSnackbar({ open: true, message: '📊 Profesyonel Excel raporu hazırlanıyor...', severity: 'info' });
    
    try {
      const params = new URLSearchParams();
      if (yearFilter !== 'all') params.append('year', yearFilter);
      
      const response = await fetch(`${API_BASE_URL}/api/manual-applications/export/excel?${params}`);
      
      if (!response.ok) {
        throw new Error('Export başarısız');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Canga_Basvuru_Arsivi_${yearFilter === 'all' ? 'Tum_Yillar' : yearFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: '✅ Excel raporu başarıyla indirildi!', severity: 'success' });
    } catch (error) {
      console.error('Excel export hatası:', error);
      setSnackbar({ open: true, message: 'Excel export başarısız', severity: 'error' });
    } finally {
      setExportLoading(false);
    }
  };
  
  // Filtreleri temizle
  const handleClearFilters = () => {
    setSearchTerm('');
    setYearFilter('all');
    setCategoryFilter('all');
    setPage(0);
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // 📝 FORM DİALOG BİLEŞENİ
  // ═══════════════════════════════════════════════════════════════════════════════
  const FormDialog = ({ open, onClose, onSubmit, title, submitText, isEdit = false }) => (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isEdit ? <EditIcon /> : <AddIcon />}
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={2}>
          {/* Temel Bilgiler */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" /> Temel Bilgiler
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Ad Soyad"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              freeSolo
              options={POSITION_CATEGORIES}
              value={formData.position}
              onChange={(e, value) => setFormData({ ...formData, position: value || '' })}
              onInputChange={(e, value) => setFormData({ ...formData, position: value })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Pozisyon"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start"><WorkIcon color="action" /></InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Yıl</InputLabel>
              <Select
                value={formData.year}
                label="Yıl"
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              >
                <MenuItem value={2023}>2023</MenuItem>
                <MenuItem value={2024}>2024</MenuItem>
                <MenuItem value={2025}>2025</MenuItem>
                <MenuItem value={2026}>2026</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Ek Bilgiler */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon fontSize="small" /> Ek Bilgiler
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Başvuru Tarihi"
              value={formData.applicationDate}
              onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
              placeholder="ör: 15.03.2024"
              InputProps={{
                startAdornment: <InputAdornment position="start"><CalendarIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Deneyim"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="ör: 5 Yıl"
              InputProps={{
                startAdornment: <InputAdornment position="start"><TimelineIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Referans"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><StarIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Eğitim Durumu"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SchoolIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Adres"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><HomeIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
          
          {/* Durum Bilgileri */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon fontSize="small" /> Durum Bilgileri
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Görüşme"
              value={formData.interview}
              onChange={(e) => setFormData({ ...formData, interview: e.target.value })}
              placeholder="ör: YAPILDI"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Durum"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              placeholder="ör: OLUMLU"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Son Durum"
              value={formData.finalStatus}
              onChange={(e) => setFormData({ ...formData, finalStatus: e.target.value })}
              placeholder="ör: İŞE ALINDI"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notlar"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><NoteIcon color="action" /></InputAdornment>
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          startIcon={<CancelIcon />}
          disabled={formLoading}
        >
          İptal
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={formLoading}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            px: 4
          }}
        >
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Loading state
  if (loading && applications.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={64} height={64} sx={{ mr: 3 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width={300} height={40} />
              <Skeleton variant="text" width={200} height={24} sx={{ mt: 1 }} />
            </Box>
          </Box>
        </Paper>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
      </Container>
    );
  }
  
  return (
    <Box sx={{ py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                }}
              >
                <GroupsIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Başvuru Arşivi
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  2023-2024-2025 başvuruları • {stats?.total?.toLocaleString() || 0} kayıt
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Tooltip title="İstatistikleri Göster/Gizle" arrow>
                <IconButton
                  onClick={() => setShowStats(!showStats)}
                  sx={{
                    border: '1px solid rgba(0,0,0,0.12)',
                    backgroundColor: showStats ? alpha('#667eea', 0.1) : 'transparent'
                  }}
                >
                  <PieChartIcon sx={{ fontSize: 20, color: showStats ? '#667eea' : 'text.secondary' }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Yenile" arrow>
                <IconButton
                  onClick={loadData}
                  disabled={loading}
                  sx={{ border: '1px solid rgba(0,0,0,0.12)' }}
                >
                  <RefreshIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => { resetForm(); setAddDialog(true); }}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Yeni Ekle
              </Button>
              
              <Button
                variant="contained"
                startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                onClick={handleExcelExport}
                disabled={exportLoading}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  fontWeight: 600,
                  px: 2.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                Excel İndir
              </Button>
            </Stack>
          </Box>
        </Paper>
        
        {/* İstatistikler */}
        <Collapse in={showStats}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Toplam Başvuru"
                value={stats?.total || 0}
                icon={<GroupsIcon />}
                color="#667eea"
                gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                onClick={() => setYearFilter('all')}
                selected={yearFilter === 'all'}
              />
            </Grid>
            
            {[2023, 2024, 2025].map((year) => (
              <Grid item xs={12} sm={6} md={3} key={year}>
                <StatCard
                  title={`${year} Başvuruları`}
                  value={stats?.byYear?.[year] || 0}
                  icon={<CalendarIcon />}
                  color={yearColors[year].primary}
                  gradient={yearFilter === String(year) ? yearColors[year].gradient : undefined}
                  onClick={() => setYearFilter(yearFilter === String(year) ? 'all' : String(year))}
                  selected={yearFilter === String(year)}
                />
              </Grid>
            ))}
          </Grid>
          
          {stats?.byCategory && (
            <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartIcon sx={{ color: '#667eea' }} />
                Pozisyon Dağılımı
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(stats.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([category, count]) => (
                    <Grid item xs={12} sm={6} md={3} key={category}>
                      <CategoryBar
                        category={category}
                        count={count}
                        total={stats.total}
                        onClick={() => setCategoryFilter(categoryFilter === category ? 'all' : category)}
                      />
                    </Grid>
                  ))}
              </Grid>
            </Paper>
          )}
        </Collapse>
        
        {/* Filtreler */}
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                placeholder="İsim, pozisyon, telefon veya referans ile ara..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                inputRef={searchInputRef}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Yıl</InputLabel>
                <Select
                  value={yearFilter}
                  label="Yıl"
                  onChange={(e) => { setYearFilter(e.target.value); setPage(0); }}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Tüm Yıllar</MenuItem>
                  <MenuItem value="2023">2023</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                  <MenuItem value="2025">2025</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Pozisyon Kategorisi</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Pozisyon Kategorisi"
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">Tüm Pozisyonlar</MenuItem>
                  <Divider />
                  {stats?.byCategory && Object.entries(stats.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <MenuItem key={cat} value={cat}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          {getCategoryConfig(cat).icon}
                          <Typography variant="body2">{cat}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            ({count})
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined" onClick={handleClearFilters} sx={{ borderRadius: 2, height: 40 }}>
                Filtreleri Temizle
              </Button>
            </Grid>
          </Grid>
          
          {(yearFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                Aktif filtreler:
              </Typography>
              {yearFilter !== 'all' && (
                <Chip
                  label={`Yıl: ${yearFilter}`}
                  onDelete={() => setYearFilter('all')}
                  size="small"
                  sx={{ background: yearColors[yearFilter]?.gradient, color: 'white' }}
                />
              )}
              {categoryFilter !== 'all' && (
                <Chip
                  label={`Kategori: ${categoryFilter}`}
                  onDelete={() => setCategoryFilter('all')}
                  size="small"
                  sx={{
                    backgroundColor: getCategoryConfig(categoryFilter).bgColor,
                    color: getCategoryConfig(categoryFilter).color
                  }}
                />
              )}
              {searchTerm && (
                <Chip label={`Arama: "${searchTerm}"`} onDelete={() => setSearchTerm('')} size="small" />
              )}
            </Box>
          )}
        </Paper>
        
        {/* Tablo */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
          {loading && <LinearProgress />}
          
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: '#f8fafc' }}>Yıl</TableCell>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: '#f8fafc' }}>Ad Soyad</TableCell>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: '#f8fafc' }}>Pozisyon</TableCell>
                  {!isMobile && <TableCell sx={{ fontWeight: 700, backgroundColor: '#f8fafc' }}>Telefon</TableCell>}
                  {!isTablet && <TableCell sx={{ fontWeight: 700, backgroundColor: '#f8fafc' }}>Deneyim</TableCell>}
                  {!isTablet && <TableCell sx={{ fontWeight: 700, backgroundColor: '#f8fafc' }}>Referans</TableCell>}
                  <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#f8fafc' }}>İşlem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 4 : isTablet ? 5 : 7} sx={{ textAlign: 'center', py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <GroupsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Başvuru bulunamadı
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                          Yeni başvuru ekleyebilir veya filtrelerinizi değiştirebilirsiniz
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                          <Button variant="outlined" onClick={handleClearFilters}>
                            Filtreleri Temizle
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => { resetForm(); setAddDialog(true); }}
                            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                          >
                            Yeni Ekle
                          </Button>
                        </Stack>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app, index) => (
                    <ApplicationRow
                      key={app.id || app._id}
                      application={app}
                      index={index}
                      onViewDetails={handleViewDetails}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                      isMobile={isMobile}
                      isTablet={isTablet}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={stats?.total || 0}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Sayfa başına:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count.toLocaleString()}`}
            sx={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
          />
        </Paper>
        
        {/* Detay Dialog */}
        <Dialog
          open={detailDialog}
          onClose={() => setDetailDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          {selectedApplication && (
            <>
              <DialogTitle
                sx={{
                  background: yearColors[selectedApplication.year]?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', fontSize: '1.1rem', fontWeight: 700 }}>
                    {selectedApplication.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{selectedApplication.fullName}</Typography>
                    <Chip
                      label={selectedApplication.year}
                      size="small"
                      sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, mt: 0.5 }}
                    />
                  </Box>
                </Box>
                <IconButton onClick={() => setDetailDialog(false)} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              
              <DialogContent sx={{ p: 3 }}>
                <List>
                  <ListItem>
                    <ListItemIcon><WorkIcon color="primary" /></ListItemIcon>
                    <ListItemText primary="Pozisyon" secondary={selectedApplication.position} />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>{getCategoryConfig(selectedApplication.positionCategory).icon}</ListItemIcon>
                    <ListItemText
                      primary="Kategori"
                      secondary={
                        <Chip
                          label={selectedApplication.positionCategory}
                          size="small"
                          sx={{
                            backgroundColor: getCategoryConfig(selectedApplication.positionCategory).bgColor,
                            color: getCategoryConfig(selectedApplication.positionCategory).color,
                            fontWeight: 600
                          }}
                        />
                      }
                    />
                  </ListItem>
                  
                  <ListItem
                    secondaryAction={
                      <Tooltip title="Numarayı Kopyala" arrow>
                        <IconButton edge="end" onClick={() => handleCopyPhone(selectedApplication.phone)}>
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemIcon><PhoneIcon color="success" /></ListItemIcon>
                    <ListItemText primary="Telefon" secondary={selectedApplication.phone || '-'} />
                  </ListItem>
                  
                  {selectedApplication.experience && (
                    <ListItem>
                      <ListItemIcon><TimelineIcon color="info" /></ListItemIcon>
                      <ListItemText primary="Deneyim" secondary={selectedApplication.experience} />
                    </ListItem>
                  )}
                  
                  {selectedApplication.reference && (
                    <ListItem>
                      <ListItemIcon><StarIcon color="warning" /></ListItemIcon>
                      <ListItemText primary="Referans" secondary={selectedApplication.reference} />
                    </ListItem>
                  )}
                  
                  {selectedApplication.email && (
                    <ListItem>
                      <ListItemIcon><EmailIcon color="primary" /></ListItemIcon>
                      <ListItemText primary="E-posta" secondary={selectedApplication.email} />
                    </ListItem>
                  )}
                  
                  {selectedApplication.applicationDate && (
                    <ListItem>
                      <ListItemIcon><CalendarIcon color="secondary" /></ListItemIcon>
                      <ListItemText primary="Başvuru Tarihi" secondary={selectedApplication.applicationDate} />
                    </ListItem>
                  )}
                  
                  {(selectedApplication.interview || selectedApplication.status || selectedApplication.finalStatus) && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <ListItem>
                        <ListItemIcon><AssessmentIcon color="primary" /></ListItemIcon>
                        <ListItemText
                          primary="Görüşme & Durum"
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              {selectedApplication.interview && (
                                <Chip label={`Görüşme: ${selectedApplication.interview}`} size="small" color="info" sx={{ mr: 1, mb: 1 }} />
                              )}
                              {selectedApplication.status && (
                                <Chip
                                  label={selectedApplication.status}
                                  size="small"
                                  color={selectedApplication.status.includes('OLUMLU') ? 'success' : selectedApplication.status.includes('OLUMSUZ') ? 'error' : 'warning'}
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              )}
                              {selectedApplication.finalStatus && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  {selectedApplication.finalStatus}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </>
                  )}
                </List>
              </DialogContent>
              
              <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <Button onClick={() => setDetailDialog(false)} variant="outlined">Kapat</Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => { setDetailDialog(false); openEditDialog(selectedApplication); }}
                >
                  Düzenle
                </Button>
                {selectedApplication.phone && (
                  <Button
                    variant="contained"
                    startIcon={<PhoneIcon />}
                    onClick={() => { window.location.href = `tel:${selectedApplication.phone.replace(/\s/g, '')}`; }}
                    sx={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}
                  >
                    Ara
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
        
        {/* Yeni Ekle Dialog */}
        <FormDialog
          open={addDialog}
          onClose={() => setAddDialog(false)}
          onSubmit={handleAdd}
          title="Yeni Başvuru Ekle"
          submitText="Kaydet"
        />
        
        {/* Düzenle Dialog */}
        <FormDialog
          open={editDialog}
          onClose={() => setEditDialog(false)}
          onSubmit={handleUpdate}
          title="Başvuru Düzenle"
          submitText="Güncelle"
          isEdit
        />
        
        {/* Silme Onay Dialog */}
        <Dialog
          open={deleteDialog}
          onClose={() => setDeleteDialog(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'error.main' }}>
            <WarningIcon color="error" />
            Başvuruyu Sil
          </DialogTitle>
          <DialogContent>
            <Typography>
              <strong>{selectedApplication?.fullName}</strong> adlı başvuruyu silmek istediğinize emin misiniz?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Bu işlem geri alınamaz.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteDialog(false)} variant="outlined" disabled={formLoading}>
              İptal
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
              disabled={formLoading}
            >
              Sil
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        
        {/* SpeedDial - Hızlı Erişim */}
        <SpeedDial
          ariaLabel="Hızlı Erişim"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          icon={<SpeedDialIcon />}
          FabProps={{
            sx: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)' }
            }
          }}
        >
          <SpeedDialAction
            icon={<AddIcon />}
            tooltipTitle="Yeni Başvuru"
            onClick={() => { resetForm(); setAddDialog(true); }}
          />
          <SpeedDialAction
            icon={<FileDownloadIcon />}
            tooltipTitle="Excel İndir"
            onClick={handleExcelExport}
          />
          <SpeedDialAction
            icon={<RefreshIcon />}
            tooltipTitle="Yenile"
            onClick={loadData}
          />
        </SpeedDial>
      </Container>
    </Box>
  );
}

export default ManualApplicationsList;

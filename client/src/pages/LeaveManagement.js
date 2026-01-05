import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tooltip,
  Snackbar,
  Avatar,
  Container,
  Stack,
  Tabs,
  Tab,
  Badge,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarTodayIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Article as ArticleIcon,
  ContentCopy as ContentCopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlaylistAdd as PlaylistAddIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  DateRange as DateRangeIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  LocalPrintshop as LocalPrintshopIcon
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import { format, differenceInDays, addDays, isWeekend, parseISO } from 'date-fns';
import { getApiBaseUrl } from '../utils/env';

const API_BASE = getApiBaseUrl();

// İzin türleri
const LEAVE_TYPES = [
  { value: 'YILLIK_IZIN', label: 'Yıllık İzin', color: '#4CAF50', icon: <EventIcon /> },
  { value: 'IDARI_IZIN', label: 'İdari İzin', color: '#2196F3', icon: <AssignmentIcon /> },
  { value: 'GUNLUK_UCRETSIZ', label: 'Günlük (Ücretsiz)', color: '#FF9800', icon: <DateRangeIcon /> },
  { value: 'SAATLIK_UCRETSIZ', label: 'Saatlik (Ücretsiz)', color: '#9C27B0', icon: <AccessTimeIcon /> },
];

// Dilekçe şablonları
const TEMPLATE_TYPES = [
  { value: 'ESKI_TIP', label: 'Eski Tip Dilekçe (Dikey)', description: 'Klasik dikey formatlı izin dilekçesi' },
  { value: 'YENI_TIP', label: 'Yeni Tip Dilekçe (Yatay)', description: 'Modern yatay formatlı izin dilekçesi' },
];

// İzin gün hesaplama (hafta sonu hariç)
const calculateWorkDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  let workDays = 0;
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    if (!isWeekend(currentDate)) {
      workDays++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return workDays;
};

// İşe başlama tarihi hesaplama
const calculateReturnDate = (endDate) => {
  if (!endDate) return null;
  
  let returnDate = addDays(new Date(endDate), 1);
  
  while (isWeekend(returnDate)) {
    returnDate = addDays(returnDate, 1);
  }
  
  return returnDate;
};

// İzin Girişi Kartı Bileşeni
const LeaveEntryCard = ({ entry, index, employees, onUpdate, onRemove, onDuplicate }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(true);
  
  const selectedEmployee = employees.find(e => e._id === entry.employeeId);
  const leaveTypeConfig = LEAVE_TYPES.find(t => t.value === entry.leaveType);
  
  return (
    <Fade in timeout={300}>
      <Card
        sx={{
          mb: 2,
          borderRadius: 3,
          border: '2px solid',
          borderColor: expanded ? (leaveTypeConfig?.color || '#e0e0e0') + '60' : '#e0e0e0',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            borderColor: leaveTypeConfig?.color || '#2196F3'
          }
        }}
      >
        {/* Kart Başlığı */}
        <Box
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: expanded ? (leaveTypeConfig?.color || '#f5f5f5') + '10' : '#fafafa',
            borderBottom: expanded ? '1px solid #e0e0e0' : 'none',
            cursor: 'pointer'
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: leaveTypeConfig?.color || '#757575',
                width: 44,
                height: 44
              }}
            >
              {selectedEmployee ? selectedEmployee.adSoyad?.charAt(0) : (index + 1)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {selectedEmployee ? selectedEmployee.adSoyad : `İzin Girişi #${index + 1}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {leaveTypeConfig?.label || 'Tür seçilmedi'} 
                {entry.startDate && entry.endDate && ` • ${entry.days || calculateWorkDays(entry.startDate, entry.endDate)} gün`}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Kopyala">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDuplicate(index); }}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sil">
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onRemove(index); }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        
        {/* Kart İçeriği */}
        <Collapse in={expanded}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Çalışan Seçimi */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  fullWidth
                  options={employees}
                  getOptionLabel={(option) => `${option.adSoyad} ${option.employeeId ? `(${option.employeeId})` : ''}`}
                  value={selectedEmployee || null}
                  onChange={(_, newValue) => onUpdate(index, 'employeeId', newValue?._id || '')}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                          {option.adSoyad?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{option.adSoyad}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.departman || 'Departman yok'} • {option.pozisyon || 'Pozisyon yok'}
                          </Typography>
                        </Box>
                      </Box>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Çalışan Seçin"
                      required
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              
              {/* İzin Türü */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>İzin Türü</InputLabel>
                  <Select
                    value={entry.leaveType || ''}
                    label="İzin Türü"
                    onChange={(e) => onUpdate(index, 'leaveType', e.target.value)}
                  >
                    {LEAVE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ color: type.color }}>{type.icon}</Box>
                          <span>{type.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Tarih Alanları - Saatlik izin için saat alanları */}
              {entry.leaveType === 'SAATLIK_UCRETSIZ' ? (
                <>
                  {/* Tarih */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Tarih"
                      type="date"
                      value={entry.startDate || ''}
                      onChange={(e) => {
                        onUpdate(index, 'startDate', e.target.value);
                        onUpdate(index, 'endDate', e.target.value);
                      }}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  
                  {/* Başlangıç Saati */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Başlangıç Saati"
                      type="time"
                      value={entry.startTime || ''}
                      onChange={(e) => onUpdate(index, 'startTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  
                  {/* Bitiş Saati */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Bitiş Saati"
                      type="time"
                      value={entry.endTime || ''}
                      onChange={(e) => onUpdate(index, 'endTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                </>
              ) : (
                <>
                  {/* Başlangıç Tarihi */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Başlangıç Tarihi"
                      type="date"
                      value={entry.startDate || ''}
                      onChange={(e) => {
                        onUpdate(index, 'startDate', e.target.value);
                        // Otomatik gün hesaplama
                        if (entry.endDate) {
                          const days = calculateWorkDays(e.target.value, entry.endDate);
                          onUpdate(index, 'days', days);
                          const returnDate = calculateReturnDate(entry.endDate);
                          onUpdate(index, 'returnDate', returnDate ? format(returnDate, 'yyyy-MM-dd') : '');
                        }
                      }}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  
                  {/* Bitiş Tarihi */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Bitiş Tarihi"
                      type="date"
                      value={entry.endDate || ''}
                      onChange={(e) => {
                        onUpdate(index, 'endDate', e.target.value);
                        // Otomatik gün hesaplama
                        if (entry.startDate) {
                          const days = calculateWorkDays(entry.startDate, e.target.value);
                          onUpdate(index, 'days', days);
                          const returnDate = calculateReturnDate(e.target.value);
                          onUpdate(index, 'returnDate', returnDate ? format(returnDate, 'yyyy-MM-dd') : '');
                        }
                      }}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>
                  
                  {/* İşe Başlama Tarihi */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="İşe Başlama Tarihi"
                      type="date"
                      value={entry.returnDate || ''}
                      onChange={(e) => onUpdate(index, 'returnDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText="Otomatik hesaplanır"
                    />
                  </Grid>
                </>
              )}
              
              {/* İzin Süresi */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label={entry.leaveType === 'SAATLIK_UCRETSIZ' ? 'İzin Süresi (Saat)' : 'İzin Süresi (Gün)'}
                  type="number"
                  value={entry.leaveType === 'SAATLIK_UCRETSIZ' ? (entry.hours || '') : (entry.days || '')}
                  onChange={(e) => onUpdate(index, entry.leaveType === 'SAATLIK_UCRETSIZ' ? 'hours' : 'days', parseInt(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: (
                      <Typography variant="caption" color="text.secondary">
                        {entry.leaveType === 'SAATLIK_UCRETSIZ' ? 'saat' : 'gün'}
                      </Typography>
                    ),
                  }}
                />
              </Grid>
              
              {/* İzin Kullanma Nedeni */}
              <Grid item xs={12} md={9}>
                <TextField
                  fullWidth
                  label="İzin Kullanma Nedeni (Açıklama)"
                  value={entry.reason || ''}
                  onChange={(e) => onUpdate(index, 'reason', e.target.value)}
                  placeholder="İzin kullanma nedenini belirtiniz..."
                  multiline
                  rows={2}
                />
              </Grid>
              
              {/* Bölüm Sorumlusu */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bölüm Sorumlusu"
                  value={entry.supervisor || ''}
                  onChange={(e) => onUpdate(index, 'supervisor', e.target.value)}
                  placeholder="Bölüm sorumlusunun adı soyadı"
                />
              </Grid>
              
              {/* İzin Talep Tarihi */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="İzin Talep Tarihi"
                  type="date"
                  value={entry.requestDate || format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => onUpdate(index, 'requestDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </Card>
    </Fade>
  );
};

// Ana Bileşen
const LeaveManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('ESKI_TIP');
  const [leaveEntries, setLeaveEntries] = useState([createEmptyEntry()]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [bulkMode, setBulkMode] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [savedLeaves, setSavedLeaves] = useState([]);
  const [selectedForPrint, setSelectedForPrint] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingLeaveId, setDeletingLeaveId] = useState(null);

  // Boş izin girişi oluştur
  function createEmptyEntry() {
    return {
      id: Date.now() + Math.random(),
      employeeId: '',
      leaveType: 'YILLIK_IZIN',
      startDate: '',
      endDate: '',
      returnDate: '',
      days: 0,
      hours: 0,
      startTime: '',
      endTime: '',
      reason: '',
      supervisor: '',
      requestDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'PENDING'
    };
  }

  // Çalışanları yükle
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || data || []);
      }
    } catch (error) {
      console.error('Çalışanlar yüklenemedi:', error);
      showNotification('Çalışanlar yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Kayıtlı izinleri yükle
  const fetchSavedLeaves = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/leave-management/list?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setSavedLeaves(data.data || []);
      }
    } catch (error) {
      console.error('Kayıtlı izinler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSavedLeaves();
  }, [selectedMonth]);

  // Bildirim göster
  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  // İzin girişi güncelle
  const updateEntry = (index, field, value) => {
    setLeaveEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // İzin girişi ekle
  const addEntry = () => {
    setLeaveEntries(prev => [...prev, createEmptyEntry()]);
  };

  // İzin girişi sil
  const removeEntry = (index) => {
    if (leaveEntries.length === 1) {
      showNotification('En az bir izin girişi olmalıdır', 'warning');
      return;
    }
    setLeaveEntries(prev => prev.filter((_, i) => i !== index));
  };

  // İzin girişi kopyala
  const duplicateEntry = (index) => {
    const entryToCopy = leaveEntries[index];
    const newEntry = {
      ...entryToCopy,
      id: Date.now() + Math.random(),
      employeeId: '' // Çalışanı boş bırak
    };
    setLeaveEntries(prev => [...prev.slice(0, index + 1), newEntry, ...prev.slice(index + 1)]);
  };

  // Tüm girişleri kaydet
  const saveAllEntries = async () => {
    // Validasyon
    const invalidEntries = leaveEntries.filter(e => !e.employeeId || !e.startDate || !e.endDate);
    if (invalidEntries.length > 0) {
      showNotification('Lütfen tüm zorunlu alanları doldurun', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/api/leave-management/bulk-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: leaveEntries })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification(`${data.savedCount || leaveEntries.length} izin başarıyla kaydedildi!`, 'success');
        setLeaveEntries([createEmptyEntry()]);
        fetchSavedLeaves();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Kaydetme hatası', 'error');
      }
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      showNotification('Bağlantı hatası oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dilekçe yazdır
  const printLeaveDocuments = async () => {
    if (selectedForPrint.length === 0) {
      showNotification('Lütfen yazdırılacak izinleri seçin', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/api/leave-management/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveIds: selectedForPrint,
          templateType: selectedTemplate
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // PDF'i yeni sekmede aç
        window.open(url, '_blank');
        
        showNotification('Dilekçeler hazırlandı!', 'success');
        setPrintDialogOpen(false);
        setSelectedForPrint([]);
      } else {
        const error = await response.json();
        showNotification(error.message || 'Yazdırma hatası', 'error');
      }
    } catch (error) {
      console.error('Yazdırma hatası:', error);
      showNotification('Bağlantı hatası oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // İzin sil
  const handleDeleteLeave = async () => {
    if (!deletingLeaveId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/leave-management/${deletingLeaveId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification('İzin kaydı başarıyla silindi', 'success');
        setDeleteConfirmOpen(false);
        setDeletingLeaveId(null);
        fetchSavedLeaves();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Silme hatası', 'error');
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      showNotification('Bağlantı hatası oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Silme onayı aç
  const openDeleteConfirm = (leaveId) => {
    setDeletingLeaveId(leaveId);
    setDeleteConfirmOpen(true);
  };

  // Düzenleme dialogunu aç
  const openEditDialog = (leave) => {
    setEditingLeave({
      ...leave,
      startDate: leave.startDate ? format(new Date(leave.startDate), 'yyyy-MM-dd') : '',
      endDate: leave.endDate ? format(new Date(leave.endDate), 'yyyy-MM-dd') : '',
      returnDate: leave.returnDate ? format(new Date(leave.returnDate), 'yyyy-MM-dd') : '',
    });
    setEditDialogOpen(true);
  };

  // İzin güncelle
  const handleUpdateLeave = async () => {
    if (!editingLeave) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/leave-management/${editingLeave._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveType: editingLeave.leaveType,
          startDate: editingLeave.startDate,
          endDate: editingLeave.endDate,
          returnDate: editingLeave.returnDate,
          days: editingLeave.days,
          hours: editingLeave.hours,
          startTime: editingLeave.startTime,
          endTime: editingLeave.endTime,
          reason: editingLeave.reason,
          supervisor: editingLeave.supervisor
        })
      });
      
      if (response.ok) {
        showNotification('İzin kaydı başarıyla güncellendi', 'success');
        setEditDialogOpen(false);
        setEditingLeave(null);
        fetchSavedLeaves();
      } else {
        const error = await response.json();
        showNotification(error.message || 'Güncelleme hatası', 'error');
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      showNotification('Bağlantı hatası oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tümünü seç/kaldır
  const toggleSelectAll = () => {
    if (selectedForPrint.length === savedLeaves.length) {
      setSelectedForPrint([]);
    } else {
      setSelectedForPrint(savedLeaves.map(l => l._id));
    }
  };

  // İzin seçimini değiştir
  const toggleLeaveSelection = (leaveId) => {
    setSelectedForPrint(prev =>
      prev.includes(leaveId)
        ? prev.filter(id => id !== leaveId)
        : [...prev, leaveId]
    );
  };

  // İstatistikler
  const stats = useMemo(() => {
    const currentMonthLeaves = savedLeaves.filter(l => {
      const startDate = new Date(l.startDate);
      const [year, month] = selectedMonth.split('-');
      return startDate.getFullYear() === parseInt(year) && startDate.getMonth() === parseInt(month) - 1;
    });

    return {
      totalEntries: leaveEntries.length,
      totalDays: leaveEntries.reduce((sum, e) => sum + (e.days || 0), 0),
      savedCount: savedLeaves.length,
      monthlyCount: currentMonthLeaves.length,
      monthlyDays: currentMonthLeaves.reduce((sum, l) => sum + (l.days || 0), 0)
    };
  }, [leaveEntries, savedLeaves, selectedMonth]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                İzin Yönetim Sistemi
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Toplu veya tekli izin girişi yapın ve dilekçe çıktısı alın
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                type="month"
                label="Ay Seçimi"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Dilekçe Şablonu</InputLabel>
                <Select
                  value={selectedTemplate}
                  label="Dilekçe Şablonu"
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  {TEMPLATE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => setPrintDialogOpen(true)}
                disabled={savedLeaves.length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                Dilekçe Yazdır
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* İstatistik Kartları */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e3f2fd' }}>
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Giriş Sayısı
                </Typography>
                <Typography variant="h4" fontWeight={700} color="#2196F3">
                  {stats.totalEntries}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid #fff3e0' }}>
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Toplam Gün
                </Typography>
                <Typography variant="h4" fontWeight={700} color="#FF9800">
                  {stats.totalDays}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid #e8f5e9' }}>
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Kayıtlı İzin
                </Typography>
                <Typography variant="h4" fontWeight={700} color="#4CAF50">
                  {stats.savedCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ borderRadius: 2, border: '1px solid #fce4ec' }}>
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  Bu Ay
                </Typography>
                <Typography variant="h4" fontWeight={700} color="#E91E63">
                  {stats.monthlyCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: '1px solid #e0e0e0',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 56
              }
            }}
          >
            <Tab
              icon={<PlaylistAddIcon />}
              iconPosition="start"
              label="İzin Girişi"
            />
            <Tab
              icon={<PlaylistAddCheckIcon />}
              iconPosition="start"
              label={
                <Badge badgeContent={savedLeaves.length} color="primary" max={999}>
                  <span style={{ marginRight: 20 }}>Kayıtlı İzinler</span>
                </Badge>
              }
            />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {activeTab === 0 ? (
              /* İzin Girişi Tab */
              <Box>
                {/* Giriş Kartları */}
                {leaveEntries.map((entry, index) => (
                  <LeaveEntryCard
                    key={entry.id}
                    entry={entry}
                    index={index}
                    employees={employees}
                    onUpdate={updateEntry}
                    onRemove={removeEntry}
                    onDuplicate={duplicateEntry}
                  />
                ))}

                {/* Aksiyon Butonları */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addEntry}
                    sx={{ borderStyle: 'dashed', borderWidth: 2 }}
                  >
                    Yeni İzin Ekle
                  </Button>

                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => setLeaveEntries([createEmptyEntry()])}
                    >
                      Temizle
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={saveAllEntries}
                      disabled={loading || leaveEntries.every(e => !e.employeeId)}
                      sx={{
                        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                        px: 4
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : `Tümünü Kaydet (${leaveEntries.length})`}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            ) : (
              /* Kayıtlı İzinler Tab */
              <Box>
                {savedLeaves.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Henüz kayıtlı izin bulunmuyor
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      İzin girişi yaparak başlayın
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Tablo */}
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#fafafa' }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedForPrint.length === savedLeaves.length}
                                indeterminate={selectedForPrint.length > 0 && selectedForPrint.length < savedLeaves.length}
                                onChange={toggleSelectAll}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Çalışan</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>İzin Türü</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Başlangıç</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Bitiş</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Süre</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>İşlem</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {savedLeaves.map((leave) => {
                            // employeeId populate edilmiş olabilir (nesne) veya sadece ID olabilir
                            const employee = leave.employeeId?.adSoyad 
                              ? leave.employeeId 
                              : employees.find(e => 
                                  e._id === leave.employeeId || 
                                  e._id === leave.employeeId?._id ||
                                  String(e._id) === String(leave.employeeId) ||
                                  String(e._id) === String(leave.employeeId?._id)
                                );
                            const leaveType = LEAVE_TYPES.find(t => t.value === leave.leaveType);
                            
                            return (
                              <TableRow
                                key={leave._id}
                                hover
                                selected={selectedForPrint.includes(leave._id)}
                                sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={selectedForPrint.includes(leave._id)}
                                    onChange={() => toggleLeaveSelection(leave._id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12 }}>
                                      {employee?.adSoyad?.charAt(0) || '?'}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2" fontWeight={500}>
                                        {employee?.adSoyad || 'Bilinmiyor'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {employee?.departman || '-'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={leaveType?.label || leave.leaveType}
                                    sx={{
                                      bgcolor: (leaveType?.color || '#757575') + '20',
                                      color: leaveType?.color || '#757575',
                                      fontWeight: 500
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {leave.startDate ? format(new Date(leave.startDate), 'dd.MM.yyyy') : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {leave.endDate ? format(new Date(leave.endDate), 'dd.MM.yyyy') : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={leave.leaveType === 'SAATLIK_UCRETSIZ' ? `${leave.hours} saat` : `${leave.days} gün`}
                                    color="primary"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    icon={leave.status === 'APPROVED' ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                                    label={leave.status === 'APPROVED' ? 'Onaylandı' : 'Beklemede'}
                                    color={leave.status === 'APPROVED' ? 'success' : 'warning'}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="Yazdır">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setSelectedForPrint([leave._id]);
                                          setPrintDialogOpen(true);
                                        }}
                                      >
                                        <PrintIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Düzenle">
                                      <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => openEditDialog(leave)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Sil">
                                      <IconButton 
                                        size="small" 
                                        color="error"
                                        onClick={() => openDeleteConfirm(leave._id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Seçili Sayısı */}
                    {selectedForPrint.length > 0 && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: '#e3f2fd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Typography variant="body2" fontWeight={600}>
                          {selectedForPrint.length} izin seçildi
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PrintIcon />}
                          onClick={() => setPrintDialogOpen(true)}
                        >
                          Seçilenleri Yazdır
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Yazdırma Dialog */}
        <Dialog
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <LocalPrintshopIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Dilekçe Yazdır
              </Typography>
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {selectedForPrint.length} adet izin dilekçesi <strong>{TEMPLATE_TYPES.find(t => t.value === selectedTemplate)?.label}</strong> şablonuyla yazdırılacak.
              </Typography>
            </Alert>

            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Şablon Seçimi
            </Typography>
            <RadioGroup
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {TEMPLATE_TYPES.map((type) => (
                <Paper
                  key={type.value}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: selectedTemplate === type.value ? 'primary.main' : '#e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: 'primary.light' }
                  }}
                  onClick={() => setSelectedTemplate(type.value)}
                >
                  <FormControlLabel
                    value={type.value}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {type.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>

            {/* Önizleme */}
            <Box
              sx={{
                mt: 3,
                p: 3,
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                border: '1px dashed #ccc',
                textAlign: 'center'
              }}
            >
              <ArticleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {selectedTemplate === 'ESKI_TIP' 
                  ? 'Dikey (Portrait) A4 formatında dilekçe oluşturulacak'
                  : 'Yatay (Landscape) A4 formatında dilekçe oluşturulacak'
                }
              </Typography>
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setPrintDialogOpen(false)}
              variant="outlined"
            >
              İptal
            </Button>
            <Button
              onClick={printLeaveDocuments}
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
              disabled={loading || selectedForPrint.length === 0}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Yazdır ({selectedForPrint.length})
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bildirim */}
        <Snackbar
          open={notification.open}
          autoHideDuration={5000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Silme Onay Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <DeleteIcon color="error" />
              <Typography variant="h6" fontWeight={600}>
                İzin Kaydını Sil
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mt: 1 }}>
              Bu izin kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setDeleteConfirmOpen(false)}
              variant="outlined"
            >
              İptal
            </Button>
            <Button
              onClick={handleDeleteLeave}
              variant="contained"
              color="error"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
              disabled={loading}
            >
              Sil
            </Button>
          </DialogActions>
        </Dialog>

        {/* Düzenleme Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <EditIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                İzin Kaydını Düzenle
              </Typography>
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            {editingLeave && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>İzin Türü</InputLabel>
                    <Select
                      value={editingLeave.leaveType}
                      label="İzin Türü"
                      onChange={(e) => setEditingLeave(prev => ({ ...prev, leaveType: e.target.value }))}
                    >
                      {LEAVE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {type.icon}
                            {type.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Başlangıç Tarihi"
                    type="date"
                    value={editingLeave.startDate}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      const endDate = editingLeave.endDate;
                      const days = startDate && endDate ? calculateWorkDays(startDate, endDate) : 0;
                      const returnDate = endDate ? format(calculateReturnDate(endDate), 'yyyy-MM-dd') : '';
                      setEditingLeave(prev => ({ ...prev, startDate, days, returnDate }));
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bitiş Tarihi"
                    type="date"
                    value={editingLeave.endDate}
                    onChange={(e) => {
                      const endDate = e.target.value;
                      const startDate = editingLeave.startDate;
                      const days = startDate && endDate ? calculateWorkDays(startDate, endDate) : 0;
                      const returnDate = endDate ? format(calculateReturnDate(endDate), 'yyyy-MM-dd') : '';
                      setEditingLeave(prev => ({ ...prev, endDate, days, returnDate }));
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="İşe Başlama Tarihi"
                    type="date"
                    value={editingLeave.returnDate}
                    onChange={(e) => setEditingLeave(prev => ({ ...prev, returnDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={editingLeave.leaveType === 'SAATLIK_UCRETSIZ' ? 'Saat' : 'Gün'}
                    type="number"
                    value={editingLeave.leaveType === 'SAATLIK_UCRETSIZ' ? editingLeave.hours : editingLeave.days}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (editingLeave.leaveType === 'SAATLIK_UCRETSIZ') {
                        setEditingLeave(prev => ({ ...prev, hours: value }));
                      } else {
                        setEditingLeave(prev => ({ ...prev, days: value }));
                      }
                    }}
                  />
                </Grid>
                {editingLeave.leaveType === 'SAATLIK_UCRETSIZ' && (
                  <>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Başlangıç Saati"
                        type="time"
                        value={editingLeave.startTime}
                        onChange={(e) => setEditingLeave(prev => ({ ...prev, startTime: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Bitiş Saati"
                        type="time"
                        value={editingLeave.endTime}
                        onChange={(e) => setEditingLeave(prev => ({ ...prev, endTime: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Açıklama / Neden"
                    value={editingLeave.reason}
                    onChange={(e) => setEditingLeave(prev => ({ ...prev, reason: e.target.value }))}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Bölüm Sorumlusu"
                    value={editingLeave.supervisor}
                    onChange={(e) => setEditingLeave(prev => ({ ...prev, supervisor: e.target.value }))}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setEditDialogOpen(false)}
              variant="outlined"
            >
              İptal
            </Button>
            <Button
              onClick={handleUpdateLeave}
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default LeaveManagement;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Badge,
  Tabs,
  Tab,
  Container,
  Stack,
  Switch,
  FormControlLabel,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  RadioGroup,
  Radio
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Key as KeyIcon,
  Draw as DrawIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  AccountCircle as AccountCircleIcon,
  Security as SecurityIcon,
  PersonSearch as PersonSearchIcon,
  PersonAdd as PersonAddIcon,
  ContentCopy as ContentCopyIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { getApiBaseUrl } from '../utils/env';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = getApiBaseUrl();

// Departman listesi
const DEPARTMENTS = [
  'İDARİ BİRİM',
  'TEKNİK OFİS',
  'TORNA GRUBU',
  'FREZE GRUBU',
  'KALİTE KONTROL',
  'MONTAJ',
  'KAYNAK',
  'BOYAHANE',
  'DEPO',
  'LOJİSTİK',
  'BAKIM',
  'ÜRETİM'
];

// İmza Canvas Bileşeni
const SignatureCanvas = ({ onSave, initialSignature, onClear }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Canvas başlangıç ayarları
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000080';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Eğer mevcut imza varsa göster
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onClear) onClear();
  };

  const saveSignature = () => {
    if (!hasDrawn) {
      return null;
    }
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) onSave(dataUrl);
    return dataUrl;
  };

  return (
    <Box>
      <Paper
        elevation={2}
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          overflow: 'hidden',
          mb: 2,
          bgcolor: '#fafafa'
        }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          style={{
            width: '100%',
            height: 150,
            cursor: 'crosshair',
            touchAction: 'none'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </Paper>
      
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="outlined"
          color="error"
          startIcon={<ClearIcon />}
          onClick={clearCanvas}
          size="small"
        >
          Temizle
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={saveSignature}
          disabled={!hasDrawn}
          size="small"
        >
          İmzayı Kaydet
        </Button>
      </Stack>
      
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
        Mouse veya parmağınızla yukarıdaki alana imzanızı atın
      </Typography>
    </Box>
  );
};

// Ana Bileşen
const SupervisorManagement = () => {
  const { user } = useAuth();
  
  // State
  const [supervisors, setSupervisors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Ekleme modu: 'employee' veya 'manual'
  const [addMode, setAddMode] = useState('employee');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tcNo: '',
    phone: '',
    email: '',
    department: '',
    position: 'Bölüm Sorumlusu',
    notes: ''
  });

  // Admin kontrolü
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.employeeId === 'ADMIN-001';

  // Otomatik şifre oluştur
  const generatePassword = () => {
    const chars = '0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    return password;
  };

  // Bölüm sorumlularını yükle
  const fetchSupervisors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/supervisors`);
      if (response.ok) {
        const data = await response.json();
        setSupervisors(data.data || []);
      }
    } catch (error) {
      console.error('Bölüm sorumluları yüklenemedi:', error);
      showNotification('Veriler yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Çalışanları yükle
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/employees`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || data || []);
      }
    } catch (error) {
      console.error('Çalışanlar yüklenemedi:', error);
    }
  }, []);

  useEffect(() => {
    fetchSupervisors();
    fetchEmployees();
  }, [fetchSupervisors, fetchEmployees]);

  // Bildirim göster
  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  // Form değişikliği
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Formu sıfırla
  const resetForm = () => {
    setFormData({
      name: '',
      tcNo: '',
      phone: '',
      email: '',
      department: '',
      position: 'Bölüm Sorumlusu',
      notes: ''
    });
    setShowPassword(false);
    setAddMode('employee');
    setSelectedEmployee(null);
    setGeneratedPassword('');
  };

  // Çalışan seçildiğinde formu doldur
  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    if (employee) {
      setFormData({
        name: employee.adSoyad || '',
        tcNo: employee.tcNo || employee.tcKimlikNo || '',
        phone: employee.cepTelefonu || employee.telefon || '',
        email: employee.email || '',
        department: employee.departman || '',
        position: employee.pozisyon || employee.gorevi || 'Bölüm Sorumlusu',
        notes: '',
        employeeId: employee._id
      });
    }
  };

  // Yeni bölüm sorumlusu ekle
  const handleAddSupervisor = async () => {
    if (!formData.name || !formData.tcNo || !formData.department) {
      showNotification('Ad, TC No ve Bölüm zorunludur', 'warning');
      return;
    }

    try {
      setLoading(true);
      const adminPassword = localStorage.getItem('canga_password');
      
      // Otomatik şifre oluştur
      const autoPassword = generatedPassword || generatePassword();
      
      const submitData = {
        ...formData,
        password: autoPassword,
        employeeId: selectedEmployee?._id || null
      };
      
      const response = await fetch(`${API_BASE}/api/supervisors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'adminpassword': adminPassword
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(`Bölüm sorumlusu eklendi! Giriş şifresi: ${autoPassword}`, 'success');
        // Şifreyi göster
        alert(`✅ Bölüm sorumlusu başarıyla eklendi!\n\n👤 Ad: ${formData.name}\n🔑 Giriş Şifresi: ${autoPassword}\n\n⚠️ Bu şifreyi kaydedin!`);
        setAddDialogOpen(false);
        resetForm();
        fetchSupervisors();
      } else {
        showNotification(data.message || 'Ekleme hatası', 'error');
      }
    } catch (error) {
      console.error('Ekleme hatası:', error);
      showNotification('Bağlantı hatası', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Bölüm sorumlusu güncelle
  const handleUpdateSupervisor = async () => {
    if (!selectedSupervisor) return;

    try {
      setLoading(true);
      const password = localStorage.getItem('canga_password');
      
      const response = await fetch(`${API_BASE}/api/supervisors/${selectedSupervisor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'adminpassword': password
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Bölüm sorumlusu güncellendi', 'success');
        setEditDialogOpen(false);
        resetForm();
        setSelectedSupervisor(null);
        fetchSupervisors();
      } else {
        showNotification(data.message || 'Güncelleme hatası', 'error');
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      showNotification('Bağlantı hatası', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Bölüm sorumlusu sil
  const handleDeleteSupervisor = async () => {
    if (!selectedSupervisor) return;

    try {
      setLoading(true);
      const password = localStorage.getItem('canga_password');
      
      const response = await fetch(`${API_BASE}/api/supervisors/${selectedSupervisor._id}`, {
        method: 'DELETE',
        headers: {
          'adminpassword': password
        }
      });

      if (response.ok) {
        showNotification('Bölüm sorumlusu silindi', 'success');
        setDeleteDialogOpen(false);
        setSelectedSupervisor(null);
        fetchSupervisors();
      } else {
        const data = await response.json();
        showNotification(data.message || 'Silme hatası', 'error');
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      showNotification('Bağlantı hatası', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Durum değiştir
  const handleToggleStatus = async (supervisor) => {
    try {
      const password = localStorage.getItem('canga_password');
      
      const response = await fetch(`${API_BASE}/api/supervisors/${supervisor._id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'adminpassword': password
        }
      });

      if (response.ok) {
        const data = await response.json();
        showNotification(data.message, 'success');
        fetchSupervisors();
      }
    } catch (error) {
      console.error('Durum değiştirme hatası:', error);
      showNotification('Bağlantı hatası', 'error');
    }
  };

  // İmza kaydet
  const handleSaveSignature = async (signatureData) => {
    if (!selectedSupervisor) return;

    try {
      setLoading(true);
      const password = localStorage.getItem('canga_password');
      
      const response = await fetch(`${API_BASE}/api/supervisors/${selectedSupervisor._id}/signature`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'adminpassword': password
        },
        body: JSON.stringify({ signature: signatureData })
      });

      if (response.ok) {
        showNotification('İmza başarıyla kaydedildi', 'success');
        setSignatureDialogOpen(false);
        setSelectedSupervisor(null);
        fetchSupervisors();
      } else {
        const data = await response.json();
        showNotification(data.message || 'İmza kaydetme hatası', 'error');
      }
    } catch (error) {
      console.error('İmza kaydetme hatası:', error);
      showNotification('Bağlantı hatası', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Düzenleme dialogunu aç
  const openEditDialog = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setFormData({
      name: supervisor.name || '',
      tcNo: supervisor.tcNo || '',
      phone: supervisor.phone || '',
      email: supervisor.email || '',
      department: supervisor.department || '',
      position: supervisor.position || 'Bölüm Sorumlusu',
      password: '', // Şifre gösterilmez, sadece değiştirmek isterse doldurur
      notes: supervisor.notes || ''
    });
    setEditDialogOpen(true);
  };

  // İmza dialogunu aç
  const openSignatureDialog = (supervisor) => {
    setSelectedSupervisor(supervisor);
    setSignatureDialogOpen(true);
  };

  // Filtreleme
  const filteredSupervisors = supervisors.filter(sup => {
    const matchesSearch = !searchTerm || 
      sup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.tcNo?.includes(searchTerm) ||
      sup.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !selectedDepartment || sup.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // İstatistikler
  const stats = {
    total: supervisors.length,
    active: supervisors.filter(s => s.isActive).length,
    withSignature: supervisors.filter(s => s.hasSignature).length,
    withPassword: supervisors.filter(s => s.password).length
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece yöneticiler bu sayfayı görüntüleyebilir.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #1a237e08 0%, #0d47a108 100%)'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: '#0D47A1', width: 56, height: 56 }}>
              <SecurityIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                Bölüm Sorumluları Yönetimi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sorumluları ekleyin, düzenleyin ve imzalarını yönetin
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { resetForm(); setAddDialogOpen(true); }}
            sx={{
              background: 'linear-gradient(135deg, #0D47A1 0%, #1976d2 100%)',
              boxShadow: '0 4px 12px rgba(13, 71, 161, 0.3)',
            }}
          >
            Yeni Bölüm Sorumlusu
          </Button>
        </Box>
      </Paper>

      {/* İstatistik Kartları */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, border: '1px solid #e3f2fd' }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">Toplam</Typography>
              <Typography variant="h4" fontWeight={700} color="#2196F3">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, border: '1px solid #e8f5e9' }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">Aktif</Typography>
              <Typography variant="h4" fontWeight={700} color="#4CAF50">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, border: '1px solid #fff3e0' }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">İmzalı</Typography>
              <Typography variant="h4" fontWeight={700} color="#FF9800">{stats.withSignature}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ borderRadius: 2, border: '1px solid #fce4ec' }}>
            <CardContent sx={{ py: 2, textAlign: 'center' }}>
              <Typography variant="overline" color="text.secondary">Şifreli</Typography>
              <Typography variant="h4" fontWeight={700} color="#E91E63">{stats.withPassword}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtreler */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="İsim, TC No veya departman ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Departman</InputLabel>
              <Select
                value={selectedDepartment}
                label="Departman"
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {DEPARTMENTS.map(dep => (
                  <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchSupervisors}
            >
              Yenile
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tablo */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : filteredSupervisors.length === 0 ? (
          <Box textAlign="center" py={6}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {supervisors.length === 0 ? 'Henüz bölüm sorumlusu eklenmemiş' : 'Aramanızla eşleşen sonuç bulunamadı'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Sorumlu</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>TC No</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Departman</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>İletişim</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>İmza</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Giriş</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSupervisors.map((supervisor) => (
                  <TableRow key={supervisor._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{ bgcolor: '#0D47A1', width: 40, height: 40 }}>
                          {supervisor.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {supervisor.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {supervisor.position || 'Bölüm Sorumlusu'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {supervisor.tcNo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={supervisor.department}
                        sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        {supervisor.phone && (
                          <Typography variant="caption" display="flex" alignItems="center" gap={0.5}>
                            <PhoneIcon sx={{ fontSize: 14 }} /> {supervisor.phone}
                          </Typography>
                        )}
                        {supervisor.email && (
                          <Typography variant="caption" display="flex" alignItems="center" gap={0.5} color="text.secondary">
                            <EmailIcon sx={{ fontSize: 14 }} /> {supervisor.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {supervisor.hasSignature ? (
                        <Chip
                          size="small"
                          icon={<CheckCircleIcon />}
                          label="Var"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          size="small"
                          icon={<CancelIcon />}
                          label="Yok"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {supervisor.password ? (
                        <Chip
                          size="small"
                          icon={<KeyIcon />}
                          label="Aktif"
                          color="primary"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          size="small"
                          label="Yok"
                          color="default"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        size="small"
                        checked={supervisor.isActive}
                        onChange={() => handleToggleStatus(supervisor)}
                        color="success"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="İmza Ekle/Düzenle">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => openSignatureDialog(supervisor)}
                          >
                            <DrawIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openEditDialog(supervisor)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedSupervisor(supervisor);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Ekleme Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); resetForm(); }}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <AddIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Yeni Bölüm Sorumlusu Ekle
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {/* Mod Seçimi */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ekleme Yöntemi
            </Typography>
            <ToggleButtonGroup
              value={addMode}
              exclusive
              onChange={(e, newMode) => {
                if (newMode) {
                  setAddMode(newMode);
                  resetForm();
                }
              }}
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="employee" sx={{ py: 1.5 }}>
                <PersonSearchIcon sx={{ mr: 1 }} />
                Çalışan Listesinden Seç
              </ToggleButton>
              <ToggleButton value="manual" sx={{ py: 1.5 }}>
                <PersonAddIcon sx={{ mr: 1 }} />
                Manuel Ekle
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Çalışan Seçimi - Employee Mode */}
          {addMode === 'employee' && (
            <Box sx={{ mb: 3 }}>
              <Autocomplete
                options={employees.filter(emp => 
                  !supervisors.some(sup => sup.employeeId === emp._id)
                )}
                getOptionLabel={(option) => `${option.adSoyad || option.name} - ${option.departman || option.department || 'Departman Yok'}`}
                value={selectedEmployee}
                onChange={(_, newValue) => handleEmployeeSelect(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Çalışan Seçin"
                    placeholder="Ad veya departman ile arayın..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <PersonSearchIcon color="primary" />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                        {(option.adSoyad || option.name || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {option.adSoyad || option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.departman || option.department} • {option.gorevi || option.pozisyon || 'Pozisyon Yok'}
                        </Typography>
                      </Box>
                    </Box>
                  </li>
                )}
                noOptionsText="Çalışan bulunamadı"
                fullWidth
              />
              {selectedEmployee && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>{selectedEmployee.adSoyad || selectedEmployee.name}</strong> seçildi. Bilgileri aşağıda düzenleyebilirsiniz.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {/* Form Alanları */}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
                disabled={addMode === 'employee' && !selectedEmployee}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="TC Kimlik No"
                value={formData.tcNo}
                onChange={(e) => handleFormChange('tcNo', e.target.value)}
                required
                disabled={addMode === 'employee' && !selectedEmployee}
                inputProps={{ maxLength: 11 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><BadgeIcon /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                disabled={addMode === 'employee' && !selectedEmployee}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                disabled={addMode === 'employee' && !selectedEmployee}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={addMode === 'employee' && !selectedEmployee}>
                <InputLabel>Departman</InputLabel>
                <Select
                  value={formData.department}
                  label="Departman"
                  onChange={(e) => handleFormChange('department', e.target.value)}
                >
                  {DEPARTMENTS.map(dep => (
                    <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pozisyon"
                value={formData.position}
                onChange={(e) => handleFormChange('position', e.target.value)}
                disabled={addMode === 'employee' && !selectedEmployee}
              />
            </Grid>
            
            {/* Otomatik Şifre */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip 
                  icon={<AutoAwesomeIcon />} 
                  label="Sistem Giriş Şifresi (Otomatik)" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                />
              </Divider>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'primary.50', 
                borderRadius: 2, 
                border: '1px dashed',
                borderColor: 'primary.300',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyIcon color="primary" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Oluşturulacak Şifre:
                    </Typography>
                    <Typography variant="h6" fontWeight={700} fontFamily="monospace" color="primary.main">
                      {generatedPassword || '••••••••'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => generatePassword()}
                  >
                    Yeni Şifre
                  </Button>
                  {generatedPassword && (
                    <Tooltip title="Kopyala">
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPassword);
                          showNotification('Şifre kopyalandı', 'success');
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                * Şifre kaydettikten sonra sorumluya bildirilecektir.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setAddDialogOpen(false); resetForm(); }} variant="outlined">
            İptal
          </Button>
          <Button
            onClick={handleAddSupervisor}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading || (!formData.name || !formData.tcNo || !formData.department)}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Düzenleme Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); resetForm(); setSelectedSupervisor(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Bölüm Sorumlusunu Düzenle
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="TC Kimlik No"
                value={formData.tcNo}
                onChange={(e) => handleFormChange('tcNo', e.target.value)}
                required
                inputProps={{ maxLength: 11 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Departman</InputLabel>
                <Select
                  value={formData.department}
                  label="Departman"
                  onChange={(e) => handleFormChange('department', e.target.value)}
                >
                  {DEPARTMENTS.map(dep => (
                    <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pozisyon"
                value={formData.position}
                onChange={(e) => handleFormChange('position', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Yeni Şifre (değiştirmek için doldurun)"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                helperText="Şifreyi değiştirmek istemiyorsanız boş bırakın"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setEditDialogOpen(false); resetForm(); setSelectedSupervisor(null); }} variant="outlined">
            İptal
          </Button>
          <Button
            onClick={handleUpdateSupervisor}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading}
          >
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setSelectedSupervisor(null); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon color="error" />
            <Typography variant="h6" fontWeight={600}>
              Silme Onayı
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            <strong>{selectedSupervisor?.name}</strong> isimli bölüm sorumlusunu silmek istediğinizden emin misiniz?
            Bu işlem geri alınamaz.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setDeleteDialogOpen(false); setSelectedSupervisor(null); }} variant="outlined">
            İptal
          </Button>
          <Button
            onClick={handleDeleteSupervisor}
            variant="contained"
            color="error"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            disabled={loading}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* İmza Dialog */}
      <Dialog
        open={signatureDialogOpen}
        onClose={() => { setSignatureDialogOpen(false); setSelectedSupervisor(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DrawIcon color="warning" />
            <Typography variant="h6" fontWeight={600}>
              İmza Kaydet - {selectedSupervisor?.name}
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Aşağıdaki alana imzanızı atın. Bu imza izin belgelerinde kullanılacaktır.
          </Alert>
          
          <SignatureCanvas
            onSave={handleSaveSignature}
            initialSignature={selectedSupervisor?.signature}
            onClear={() => {}}
          />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => { setSignatureDialogOpen(false); setSelectedSupervisor(null); }} 
            variant="outlined"
          >
            Kapat
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
    </Container>
  );
};

export default SupervisorManagement;


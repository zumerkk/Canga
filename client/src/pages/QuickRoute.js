import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Paper,
  Container,
  Divider,
  Avatar,
  Checkbox,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Fade,
  Stack,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  DirectionsBus as BusIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  FileDownload as DownloadIcon,
  Print as PrintIcon,
  Image as ImageIcon,
  Group as GroupIcon,
  CheckCircle as CheckIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  DriveEta as DriveIcon,
  Phone as PhoneIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-hot-toast';

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

function QuickRoute() {
  // 📊 Ana State'ler
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const printRef = useRef(null);

  // 📋 Güzergah Bilgileri
  const [routeInfo, setRouteInfo] = useState({
    title: `Servis Güzergahı - ${new Date().toLocaleDateString('tr-TR')}`,
    date: new Date().toISOString().split('T')[0],
    location: 'MERKEZ ŞUBE',
    timeSlot: '08:00-16:00',
    shiftTime: '16:00-24:00',
    firstStop: '',
    driverName: '',
    driverPhone: '',
    busPlate: '',
    notes: ''
  });

  // 🔍 Filtreler
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    location: '',
    serviceRoute: '',
    sortBy: 'serviceRoute'
  });

  // 📊 İstatistikler
  const [stats, setStats] = useState({
    totalEmployees: 0,
    filteredCount: 0,
    selectedCount: 0,
    uniqueRoutes: 0,
    uniqueStops: 0
  });

  // Referanslar
  const [departments, setDepartments] = useState([]);
  const [serviceRoutes, setServiceRoutes] = useState([]);
  const [availableStops, setAvailableStops] = useState([]);
  const locations = ['MERKEZ ŞUBE', 'IŞIL ŞUBE'];

  // 🚀 Component Mount
  useEffect(() => {
    fetchEmployees();
    fetchServiceRoutes();
  }, []);

  // 📊 İstatistik Güncelleme
  useEffect(() => {
    const uniqueRoutes = [...new Set(selectedEmployees.map(emp => 
      emp.servisGuzergahi || emp.serviceInfo?.routeName
    ).filter(Boolean))];
    
    const uniqueStops = [...new Set(selectedEmployees.map(emp => 
      emp.durak || emp.serviceInfo?.stopName
    ).filter(Boolean))];

    setStats({
      totalEmployees: employees.length,
      filteredCount: filteredEmployees.length,
      selectedCount: selectedEmployees.length,
      uniqueRoutes: uniqueRoutes.length,
      uniqueStops: uniqueStops.length
    });
  }, [employees, filteredEmployees, selectedEmployees]);

  // 🔄 Çalışanları Getir
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees?limit=1000`);
      const data = await response.json();
      
      if (data.success) {
        const activeEmployees = (data.data || []).filter(emp => emp.durum === 'AKTIF');
        setEmployees(activeEmployees);
        setFilteredEmployees(activeEmployees);
        
        // Departmanları çıkar
        const uniqueDepartments = [...new Set(activeEmployees.map(emp => emp.departman))];
        setDepartments(uniqueDepartments.sort());
        
        toast.success(`${activeEmployees.length} aktif çalışan yüklendi`);
      }
    } catch (error) {
      console.error('Çalışan verisi alınamadı:', error);
      toast.error('Çalışan verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // 🚌 Servis Güzergahlarını Getir
  const fetchServiceRoutes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/routes`);
      const data = await response.json();
      
      if (data.success) {
        setServiceRoutes(data.data || []);
        
        // Tüm durakları çıkar
        const allStops = new Set();
        (data.data || []).forEach(route => {
          route.stops?.forEach(stop => allStops.add(stop.name));
        });
        setAvailableStops([...allStops].sort());
      }
    } catch (error) {
      console.error('Servis güzergahları alınamadı:', error);
    }
  };

  // 🔍 Filtreleme İşlemi
  useEffect(() => {
    let filtered = employees;

    // Stajyer ve çırakları hariç tut
    filtered = filtered.filter(emp => 
      emp.departman !== 'STAJYERLİK' && emp.departman !== 'ÇIRAK LİSE'
    );

    // Arama filtresi
    if (filters.search) {
      filtered = filtered.filter(emp => 
        (emp.ad || emp.firstName)?.toLowerCase().includes(filters.search.toLowerCase()) ||
        (emp.soyad || emp.lastName)?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Diğer filtreler
    if (filters.department) {
      filtered = filtered.filter(emp => emp.departman === filters.department);
    }
    if (filters.location) {
      filtered = filtered.filter(emp => emp.lokasyon === filters.location);
    }
    if (filters.serviceRoute) {
      filtered = filtered.filter(emp => {
        const route = emp.servisGuzergahi || emp.serviceInfo?.routeName;
        return route === filters.serviceRoute;
      });
    }

    // Sıralama
    filtered.sort((a, b) => {
      if (filters.sortBy === 'serviceRoute') {
        const aRoute = a.servisGuzergahi || a.serviceInfo?.routeName || '';
        const bRoute = b.servisGuzergahi || b.serviceInfo?.routeName || '';
        return aRoute.localeCompare(bRoute, 'tr');
      }
      const aValue = a[filters.sortBy] || '';
      const bValue = b[filters.sortBy] || '';
      return aValue.localeCompare(bValue, 'tr');
    });

    setFilteredEmployees(filtered);
  }, [filters, employees]);

  // 📊 Excel Export
  const handleExcelDownload = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setDownloadLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-route/export/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employees: selectedEmployees,
          routeInfo
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeLocation = routeInfo.location.replace(/\s+/g, '_');
        const safeDate = routeInfo.date.replace(/-/g, '');
        a.download = `Guzergah_Listesi_${safeLocation}_${safeDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        const generationTime = Date.now() - startTime;
        toast.success(`📊 Excel dosyası ${generationTime}ms'de oluşturuldu!`);
      } else {
        throw new Error('Excel dosyası oluşturulamadı');
      }
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel dosyası oluşturulamadı: ' + error.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  // 🖨️ PDF Export
  const handlePDFDownload = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setDownloadLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-route/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employees: selectedEmployees,
          routeInfo
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeLocation = routeInfo.location.replace(/\s+/g, '_');
        const safeDate = routeInfo.date.replace(/-/g, '');
        a.download = `Guzergah_Listesi_${safeLocation}_${safeDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('📄 PDF dosyası indirildi!');
      } else {
        throw new Error('PDF dosyası oluşturulamadı');
      }
    } catch (error) {
      console.error('PDF export hatası:', error);
      toast.error('PDF dosyası oluşturulamadı: ' + error.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  // 🖼️ PNG Export (HTML2Canvas kullanarak)
  const handlePNGDownload = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    const loadingToast = toast.loading('PNG oluşturuluyor... Lütfen bekleyin.');
    setDownloadLoading(true);

    try {
      // html2canvas dinamik import
      const html2canvas = (await import('html2canvas')).default;
      
      // Önizleme dialog'unu aç
      setPreviewDialog(true);
      
      // Dialog render olması için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Canvas oluştur
      if (printRef.current) {
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });
        
        // PNG olarak indir
        canvas.toBlob((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const safeLocation = routeInfo.location.replace(/\s+/g, '_');
          const safeDate = routeInfo.date.replace(/-/g, '');
          a.download = `Guzergah_Listesi_${safeLocation}_${safeDate}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          toast.success('🖼️ PNG görseli indirildi!', { id: loadingToast });
          setPreviewDialog(false);
        });
      }
    } catch (error) {
      console.error('PNG export hatası:', error);
      toast.error('PNG dosyası oluşturulamadı: ' + error.message, { id: loadingToast });
    } finally {
      setDownloadLoading(false);
    }
  };

  // 🖨️ Yazdır
  const handlePrint = () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setPreviewDialog(true);
    
    // Kısa bir gecikme sonrası yazdırma dialog'u aç
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // 👥 Çalışan Seçim İşlemleri
  const toggleEmployeeSelection = (employee) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.find(emp => emp._id === employee._id);
      return isSelected 
        ? prev.filter(emp => emp._id !== employee._id)
        : [...prev, employee];
    });
  };

  const handleSelectAll = () => {
    setSelectedEmployees(
      selectedEmployees.length === filteredEmployees.length ? [] : [...filteredEmployees]
    );
  };

  const selectByRoute = (routeName) => {
    const routeEmployees = filteredEmployees.filter(emp => {
      const empRoute = emp.servisGuzergahi || emp.serviceInfo?.routeName;
      return empRoute === routeName;
    });
    setSelectedEmployees(routeEmployees);
  };

  // 🗑️ Temizleme İşlemleri
  const clearFilters = () => {
    setFilters({
      search: '',
      department: '',
      location: '',
      serviceRoute: '',
      sortBy: 'serviceRoute'
    });
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  // 📊 Önizleme İçeriği
  const renderPreviewContent = () => {
    // Güzergaha göre grupla
    const groupedByRoute = selectedEmployees.reduce((acc, emp) => {
      const route = emp.servisGuzergahi || emp.serviceInfo?.routeName || 'Belirsiz';
      if (!acc[route]) {
        acc[route] = [];
      }
      acc[route].push(emp);
      return acc;
    }, {});

    return (
      <Box ref={printRef} sx={{ p: 4, bgcolor: 'white', minHeight: '100vh' }}>
        {/* Başlık */}
        <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '3px solid #1976d2' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
            ÇANGA SAVUNMA ENDÜSTRİ LTD.ŞTİ.
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {routeInfo.title}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Chip icon={<LocationIcon />} label={routeInfo.location} color="primary" />
            <Chip icon={<ScheduleIcon />} label={`Tarih: ${new Date(routeInfo.date).toLocaleDateString('tr-TR')}`} />
            <Chip icon={<ScheduleIcon />} label={`Vardiya: ${routeInfo.timeSlot}`} />
            {routeInfo.shiftTime && <Chip icon={<ScheduleIcon />} label={`Hareket: ${routeInfo.shiftTime}`} />}
          </Box>
        </Box>

        {/* Şoför Bilgileri */}
        {(routeInfo.driverName || routeInfo.busPlate) && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
            <Grid container spacing={2}>
              {routeInfo.driverName && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Şoför</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{routeInfo.driverName}</Typography>
                </Grid>
              )}
              {routeInfo.driverPhone && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Telefon</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{routeInfo.driverPhone}</Typography>
                </Grid>
              )}
              {routeInfo.busPlate && (
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">Araç Plakası</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{routeInfo.busPlate}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* İlk Durak */}
        {routeInfo.firstStop && (
          <Alert severity="info" icon={<LocationIcon />} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              İlk Durak: {routeInfo.firstStop}
            </Typography>
          </Alert>
        )}

        {/* Güzergah Grupları */}
        {Object.entries(groupedByRoute).map(([route, emps]) => (
          <Paper key={route} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
              <BusIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              {route} ({emps.length} Kişi)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {emps.map((emp, index) => (
                  <Box
                    key={emp._id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1.5,
                      bgcolor: index % 2 === 0 ? '#f9f9f9' : 'white',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <Typography sx={{ minWidth: 40, fontWeight: 600 }}>
                      {index + 1}.
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>
                        {emp.ad || emp.firstName} {emp.soyad || emp.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {emp.departman || emp.department}
                      </Typography>
                    </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      icon={<LocationIcon fontSize="small" />}
                      label={emp.durak || emp.serviceInfo?.stopName || 'Belirsiz'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        ))}

        {/* Notlar */}
        {routeInfo.notes && (
          <Paper sx={{ p: 2, mt: 3, bgcolor: '#fff3e0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              📝 Notlar:
            </Typography>
            <Typography variant="body2">{routeInfo.notes}</Typography>
          </Paper>
        )}

        {/* Alt Bilgi */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Bu belge {new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Modern Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                <BusIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography 
                  variant="h5" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    mb: 0.5
                  }}
                >
                  Hızlı Güzergah Oluşturucu
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Vardiya servis güzergahlarını kolayca oluşturun ve paylaşın
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Chip 
              icon={<CheckIcon />}
              label={`${selectedEmployees.length} Seçili`}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* İstatistik Kartları */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <GroupIcon color="primary" />
              <Typography variant="body2" color="text.secondary">Toplam Çalışan</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{stats.totalEmployees}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CheckIcon color="success" />
              <Typography variant="body2" color="text.secondary">Seçilen</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>{stats.selectedCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BusIcon color="warning" />
              <Typography variant="body2" color="text.secondary">Güzergah</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>{stats.uniqueRoutes}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationIcon color="error" />
              <Typography variant="body2" color="text.secondary">Durak</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>{stats.uniqueStops}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Ana İçerik */}
      <Grid container spacing={3}>
        {/* Sol Panel - Ayarlar */}
        <Grid item xs={12} md={4}>
          {/* Güzergah Bilgileri */}
          <Paper elevation={0} sx={{ p: 3, mb: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              📋 Güzergah Bilgileri
            </Typography>
              
            <TextField
              fullWidth
              label="Başlık"
              value={routeInfo.title}
              onChange={(e) => setRouteInfo(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              type="date"
              label="Tarih"
              value={routeInfo.date}
              onChange={(e) => setRouteInfo(prev => ({ ...prev, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Lokasyon</InputLabel>
              <Select
                value={routeInfo.location}
                onChange={(e) => setRouteInfo(prev => ({ ...prev, location: e.target.value }))}
              >
                {locations.map(loc => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vardiya Saati</InputLabel>
              <Select
                value={routeInfo.timeSlot}
                onChange={(e) => setRouteInfo(prev => ({ ...prev, timeSlot: e.target.value }))}
              >
                <MenuItem value="08:00-16:00">08:00-16:00 (7:30 saat)</MenuItem>
                <MenuItem value="16:00-24:00">16:00-24:00 (7:30 saat)</MenuItem>
                <MenuItem value="24:00-08:00">24:00-08:00 (7:30 saat)</MenuItem>
                <MenuItem value="08:00-18:00">08:00-18:00 (9 saat)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Hareket Saati"
              value={routeInfo.shiftTime}
              onChange={(e) => setRouteInfo(prev => ({ ...prev, shiftTime: e.target.value }))}
              placeholder="Örn: 15:20"
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>İlk Durak</InputLabel>
              <Select
                value={routeInfo.firstStop}
                onChange={(e) => setRouteInfo(prev => ({ ...prev, firstStop: e.target.value }))}
              >
                <MenuItem value="">Seçiniz...</MenuItem>
                {availableStops.map(stop => (
                  <MenuItem key={stop} value={stop}>{stop}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              🚗 Araç Bilgileri
            </Typography>

            <TextField
              fullWidth
              label="Şoför Adı"
              value={routeInfo.driverName}
              onChange={(e) => setRouteInfo(prev => ({ ...prev, driverName: e.target.value }))}
              InputProps={{
                startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Şoför Telefon"
              value={routeInfo.driverPhone}
              onChange={(e) => setRouteInfo(prev => ({ ...prev, driverPhone: e.target.value }))}
              placeholder="0 546 118 40 97"
              InputProps={{
                startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Araç Plakası"
              value={routeInfo.busPlate}
              onChange={(e) => setRouteInfo(prev => ({ ...prev, busPlate: e.target.value }))}
              placeholder="71 S 0097"
              InputProps={{
                startAdornment: <DriveIcon color="action" sx={{ mr: 1 }} />
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Notlar (Opsiyonel)"
              value={routeInfo.notes}
              onChange={(e) => setRouteInfo(prev => ({ ...prev, notes: e.target.value }))}
              multiline
              rows={2}
              InputProps={{
                startAdornment: <DescriptionIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Paper>

          {/* Aksiyon Butonları */}
          <Paper elevation={0} sx={{ p: 3, mb: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              📥 Dışa Aktar
            </Typography>

            <Stack spacing={1.5}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleExcelDownload}
                disabled={selectedEmployees.length === 0 || downloadLoading}
                startIcon={<DownloadIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
                  fontWeight: 600,
                  py: 1.5
                }}
              >
                Excel İndir
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePDFDownload}
                disabled={selectedEmployees.length === 0 || downloadLoading}
                startIcon={<DownloadIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
                  fontWeight: 600,
                  py: 1.5
                }}
              >
                PDF İndir
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePNGDownload}
                disabled={selectedEmployees.length === 0 || downloadLoading}
                startIcon={<ImageIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
                  fontWeight: 600,
                  py: 1.5
                }}
              >
                PNG Görsel
              </Button>

              <Divider />

              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={handlePrint}
                disabled={selectedEmployees.length === 0}
                startIcon={<PrintIcon />}
                sx={{ fontWeight: 600 }}
              >
                Yazdır
              </Button>
            </Stack>
          </Paper>

          {/* Seçim Özeti */}
          {selectedEmployees.length > 0 && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                ✅ Seçim Özeti
              </Typography>
              
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'success.lighter', mb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {selectedEmployees.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Çalışan seçili
                </Typography>
              </Box>
              
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1 }}>
                GÜZERGAHLAR
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {[...new Set(selectedEmployees.map(emp => 
                  emp.servisGuzergahi || emp.serviceInfo?.routeName
                ).filter(Boolean))].map(route => (
                  <Chip 
                    key={route} 
                    label={route} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Sağ Panel - Çalışan Listesi */}
        <Grid item xs={12} md={8}>
          {/* Filtreler */}
          <Paper elevation={0} sx={{ p: 3, mb: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5 }}>
              🔍 Filtreler
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Arama"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Ad, soyad ara..."
                />
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Departman</InputLabel>
                  <Select
                    value={filters.department}
                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                    label="Departman"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {departments.map(dept => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Güzergah</InputLabel>
                  <Select
                    value={filters.serviceRoute}
                    onChange={(e) => setFilters(prev => ({ ...prev, serviceRoute: e.target.value }))}
                    label="Güzergah"
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {serviceRoutes.map(route => (
                      <MenuItem key={route._id} value={route.routeName}>{route.routeName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Tooltip title="Filtreleri Temizle">
                  <IconButton
                    onClick={clearFilters}
                    sx={{ width: '100%', height: 40, border: '1px solid rgba(0,0,0,0.12)' }}
                  >
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>

            {/* Hızlı Güzergah Seçimi */}
            {serviceRoutes.length > 0 && (
              <Box sx={{ mt: 2.5, pt: 2.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1.5 }}>
                  HIZLI GÜZERGAH SEÇİMİ
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {serviceRoutes.slice(0, 8).map(route => (
                    <Chip
                      key={route._id}
                      label={`${route.routeName} (${route.statistics?.activeEmployees || 0})`}
                      size="small"
                      clickable
                      onClick={() => selectByRoute(route.routeName)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          {/* Çalışan Listesi */}
          <Paper elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    👥 Çalışanlar
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredEmployees.length} kişi listeleniyor
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant={selectedEmployees.length === filteredEmployees.length ? 'contained' : 'outlined'}
                    onClick={handleSelectAll}
                  >
                    {selectedEmployees.length === filteredEmployees.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                  </Button>
                  {selectedEmployees.length > 0 && (
                    <Button size="small" variant="outlined" color="error" onClick={clearSelection}>
                      Temizle
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
              {loading ? (
                <Typography align="center" color="text.secondary">Yükleniyor...</Typography>
              ) : filteredEmployees.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>Çalışan Bulunamadı</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filtre kriterlerinizi değiştirerek tekrar deneyin.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filteredEmployees.map((employee, index) => {
                    const isSelected = selectedEmployees.find(emp => emp._id === employee._id);
                    const route = employee.servisGuzergahi || employee.serviceInfo?.routeName;
                    const stop = employee.durak || employee.serviceInfo?.stopName;
                    
                    return (
                      <Fade in timeout={200 + (index * 20)} key={employee._id}>
                        <Box
                          onClick={() => toggleEmployeeSelection(employee)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: isSelected ? '#667eea' : 'rgba(0,0,0,0.08)',
                            backgroundColor: isSelected ? 'rgba(102, 126, 234, 0.04)' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: isSelected ? '#5568d3' : 'rgba(0,0,0,0.16)',
                              backgroundColor: isSelected ? 'rgba(102, 126, 234, 0.08)' : 'rgba(0,0,0,0.02)',
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <Checkbox checked={!!isSelected} color="primary" sx={{ mr: 1.5 }} />
                          
                            <Avatar 
                            sx={{ 
                              width: 40,
                              height: 40,
                              bgcolor: isSelected ? '#667eea' : 'rgba(0,0,0,0.08)',
                              color: isSelected ? '#ffffff' : 'rgba(0,0,0,0.6)',
                              fontWeight: 600,
                              mr: 2
                            }}
                          >
                            {(employee.ad || employee.firstName)?.charAt(0) || '?'}
                          </Avatar>
                          
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.25 }}>
                              {employee.ad || employee.firstName} {employee.soyad || employee.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {employee.departman || employee.department}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {route && (
                              <Chip
                                icon={<BusIcon fontSize="small" />}
                                label={route}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {stop && (
                              <Chip
                                icon={<LocationIcon fontSize="small" />}
                                label={stop}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      </Fade>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Önizleme Dialog */}
      <Dialog 
        open={previewDialog} 
        onClose={() => setPreviewDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📋 Güzergah Önizlemesi
            </Typography>
            <IconButton onClick={() => setPreviewDialog(false)} size="small">
              <ClearIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {renderPreviewContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Kapat</Button>
          <Button variant="contained" onClick={() => window.print()} startIcon={<PrintIcon />}>
            Yazdır
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yazdırma için CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content, #print-content * {
            visibility: visible;
          }
          #print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Container>
  );
}

export default QuickRoute;


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
  Fade,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
  Tabs,
  Tab
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
  Phone as PhoneIcon,
  Description as DescriptionIcon,
  DriveEta as DriveIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Autorenew as AutoIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-hot-toast';
import QuickRouteManual from './QuickRouteManual';

function QuickRouteModern() {
  const [systemMode, setSystemMode] = useState(0); // 0: Otomatik, 1: Manuel
  const theme = useTheme();
  const printRef = useRef(null);

  // 📊 Ana State'ler
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);

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

    filtered = filtered.filter(emp => 
      emp.departman !== 'STAJYERLİK' && emp.departman !== 'ÇIRAK LİSE'
    );

    if (filters.search) {
      filtered = filtered.filter(emp => 
        (emp.ad || emp.firstName)?.toLowerCase().includes(filters.search.toLowerCase()) ||
        (emp.soyad || emp.lastName)?.toLowerCase().includes(filters.search.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

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

  // Export fonksiyonları (aynı kalıyor)
  const handleExcelDownload = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setDownloadLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-route/export/excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: selectedEmployees, routeInfo })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Guzergah_Listesi_${routeInfo.location.replace(/\s+/g, '_')}_${routeInfo.date.replace(/-/g, '')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('📊 Excel dosyası indirildi!');
      }
    } catch (error) {
      toast.error('Excel dosyası oluşturulamadı');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handlePDFDownload = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setDownloadLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-route/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: selectedEmployees, routeInfo })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Guzergah_Listesi_${routeInfo.location.replace(/\s+/g, '_')}_${routeInfo.date.replace(/-/g, '')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('📄 PDF dosyası indirildi!');
      }
    } catch (error) {
      toast.error('PDF dosyası oluşturulamadı');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handlePNGDownload = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    const loadingToast = toast.loading('PNG oluşturuluyor... Lütfen bekleyin.');
    setDownloadLoading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      setPreviewDialog(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (printRef.current) {
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });
        
        canvas.toBlob((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Guzergah_Listesi_${routeInfo.location.replace(/\s+/g, '_')}_${routeInfo.date.replace(/-/g, '')}.png`;
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

  const handlePrint = () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }
    setPreviewDialog(true);
    setTimeout(() => window.print(), 500);
  };

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

  const clearSelection = () => setSelectedEmployees([]);

  // Önizleme içeriği
  const renderPreviewContent = () => {
    const groupedByRoute = selectedEmployees.reduce((acc, emp) => {
      const route = emp.servisGuzergahi || emp.serviceInfo?.routeName || 'Belirsiz';
      if (!acc[route]) acc[route] = [];
      acc[route].push(emp);
      return acc;
    }, {});

    return (
      <Box ref={printRef} sx={{ p: 4, bgcolor: 'white' }}>
        <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '3px solid #667eea' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
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

        {routeInfo.firstStop && (
          <Alert severity="info" icon={<LocationIcon />} sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              İlk Durak: {routeInfo.firstStop}
            </Typography>
          </Alert>
        )}

        {Object.entries(groupedByRoute).map(([route, emps]) => (
          <Paper key={route} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
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
                    borderRadius: 1
                  }}
                >
                  <Typography sx={{ minWidth: 40, fontWeight: 600 }}>{index + 1}.</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {emp.ad || emp.firstName} {emp.soyad || emp.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {emp.departman || emp.department}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<LocationIcon fontSize="small" />}
                    label={emp.durak || emp.serviceInfo?.stopName || 'Belirsiz'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    );
  };

  // Manuel sisteme geçildiğinde
  if (systemMode === 1) {
    return <QuickRouteManual />;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* 🎯 System Mode Selector */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            background: alpha('#ffffff', 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#ffffff', 0.3)}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Tabs
            value={systemMode}
            onChange={(e, newValue) => setSystemMode(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                minHeight: 64,
                borderRadius: 2,
                mx: 0.5,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab
              icon={<AutoIcon />}
              iconPosition="start"
              label="Otomatik Sistem"
              sx={{
                flexGrow: 1
              }}
            />
            <Tab
              icon={<EditIcon />}
              iconPosition="start"
              label="Manuel Sistem"
              sx={{
                flexGrow: 1
              }}
            />
          </Tabs>
        </Paper>

        {/* 🎨 Ultra Modern Header - Glassmorphism */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 4,
            background: alpha('#ffffff', 0.95),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha('#ffffff', 0.3)}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Box sx={{
              width: 72,
              height: 72,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
            }}>
              <BusIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 0.5 }}>
                Hızlı Güzergah Oluşturucu
              </Typography>
              <Typography variant="body1" sx={{ color: '#6b7280' }}>
                Modern, hızlı ve kolay vardiya güzergah yönetimi
              </Typography>
            </Box>
            <Chip
              icon={<CheckIcon />}
              label={`${selectedEmployees.length} Seçili`}
              sx={{
                height: 48,
                fontSize: '1rem',
                fontWeight: 700,
                background: selectedEmployees.length > 0 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(0,0,0,0.08)',
                color: selectedEmployees.length > 0 ? 'white' : 'rgba(0,0,0,0.6)',
                '& .MuiChip-icon': { color: selectedEmployees.length > 0 ? 'white' : 'rgba(0,0,0,0.6)' }
              }}
            />
          </Box>

          {/* Stats Cards - Glassmorphism Style */}
          <Grid container spacing={2}>
            {[
              { label: 'Toplam', value: stats.totalEmployees, icon: <GroupIcon />, color: '#667eea' },
              { label: 'Seçilen', value: stats.selectedCount, icon: <CheckIcon />, color: '#10b981' },
              { label: 'Güzergah', value: stats.uniqueRoutes, icon: <BusIcon />, color: '#f59e0b' },
              { label: 'Durak', value: stats.uniqueStops, icon: <LocationIcon />, color: '#ef4444' }
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Card sx={{
                  background: alpha('#ffffff', 0.6),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(stat.color, 0.2)}`,
                  borderRadius: 2,
                  p: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${alpha(stat.color, 0.2)}`
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: alpha(stat.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color
                    }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Sol Panel - Modern Form */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              {/* Güzergah Bilgileri Card */}
              <Card sx={{
                background: alpha('#ffffff', 0.95),
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: `1px solid ${alpha('#ffffff', 0.3)}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha('#667eea', 0.1)}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    📋 Liste Bilgileri
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth
                      label="Başlık"
                      value={routeInfo.title}
                      onChange={(e) => setRouteInfo(prev => ({ ...prev, title: e.target.value }))}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover fieldset': { borderColor: '#667eea' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 }
                        }
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      type="date"
                      label="Tarih"
                      value={routeInfo.date}
                      onChange={(e) => setRouteInfo(prev => ({ ...prev, date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                    
                    <FormControl fullWidth>
                      <InputLabel>Lokasyon</InputLabel>
                      <Select
                        value={routeInfo.location}
                        onChange={(e) => setRouteInfo(prev => ({ ...prev, location: e.target.value }))}
                        sx={{ borderRadius: 2 }}
                      >
                        {locations.map(loc => (
                          <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Vardiya Saati</InputLabel>
                      <Select
                        value={routeInfo.timeSlot}
                        onChange={(e) => setRouteInfo(prev => ({ ...prev, timeSlot: e.target.value }))}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="08:00-16:00">08:00-16:00</MenuItem>
                        <MenuItem value="16:00-24:00">16:00-24:00</MenuItem>
                        <MenuItem value="24:00-08:00">24:00-08:00</MenuItem>
                        <MenuItem value="08:00-18:00">08:00-18:00</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Hareket Saati"
                      value={routeInfo.shiftTime}
                      onChange={(e) => setRouteInfo(prev => ({ ...prev, shiftTime: e.target.value }))}
                      placeholder="Örn: 15:20"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <FormControl fullWidth>
                      <InputLabel>İlk Durak</InputLabel>
                      <Select
                        value={routeInfo.firstStop}
                        onChange={(e) => setRouteInfo(prev => ({ ...prev, firstStop: e.target.value }))}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">Seçiniz...</MenuItem>
                        {availableStops.map(stop => (
                          <MenuItem key={stop} value={stop}>{stop}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Divider sx={{ my: 1 }} />

                    <TextField
                      fullWidth
                      label="Şoför Adı"
                      value={routeInfo.driverName}
                      onChange={(e) => setRouteInfo(prev => ({ ...prev, driverName: e.target.value }))}
                      InputProps={{ startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} /> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Şoför Telefon"
                      value={routeInfo.driverPhone}
                      onChange={(e) => setRouteInfo(prev => ({ ...prev, driverPhone: e.target.value }))}
                      placeholder="0 546 118 40 97"
                      InputProps={{ startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} /> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Araç Plakası"
                      value={routeInfo.busPlate}
                      onChange={(e) => setRouteInfo(prev => ({ ...prev, busPlate: e.target.value }))}
                      placeholder="71 S 0097"
                      InputProps={{ startAdornment: <DriveIcon color="action" sx={{ mr: 1 }} /> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Notlar"
                      value={routeInfo.notes}
                      onChange={(e) => setRouteInfo(prev => ({ ...prev, notes: e.target.value }))}
                      multiline
                      rows={2}
                      InputProps={{ startAdornment: <DescriptionIcon color="action" sx={{ mr: 1 }} /> }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Stack>
                </Box>
              </Card>

              {/* Export Buttons Card */}
              <Card sx={{
                background: alpha('#ffffff', 0.95),
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: `1px solid ${alpha('#ffffff', 0.3)}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha('#667eea', 0.1)}` }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    📥 Dışa Aktar
                  </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Stack spacing={1.5}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleExcelDownload}
                      disabled={selectedEmployees.length === 0 || downloadLoading}
                      startIcon={<DownloadIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
                        }
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
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
                        }
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
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)'
                        }
                      }}
                    >
                      PNG Görsel
                    </Button>

                    <Divider sx={{ my: 1 }} />

                    <Button
                      fullWidth
                      variant="outlined"
                      size="medium"
                      onClick={handlePrint}
                      disabled={selectedEmployees.length === 0}
                      startIcon={<PrintIcon />}
                      sx={{
                        borderColor: alpha('#667eea', 0.3),
                        color: '#667eea',
                        fontWeight: 600,
                        py: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#667eea',
                          backgroundColor: alpha('#667eea', 0.08)
                        }
                      }}
                    >
                      Yazdır
                    </Button>
                  </Stack>
                </Box>
              </Card>
            </Stack>
          </Grid>

          {/* Sağ Panel - Çalışan Listesi */}
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              {/* Filtreler */}
              <Card sx={{
                background: alpha('#ffffff', 0.95),
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: `1px solid ${alpha('#ffffff', 0.3)}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    <FilterIcon sx={{ color: '#667eea' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e', flexGrow: 1 }}>
                      Filtreler
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Arama"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        placeholder="Ad, soyad ara..."
                        InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Güzergah</InputLabel>
                        <Select
                          value={filters.serviceRoute}
                          onChange={(e) => setFilters(prev => ({ ...prev, serviceRoute: e.target.value }))}
                          label="Güzergah"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="">Tümü</MenuItem>
                          {serviceRoutes.map(route => (
                            <MenuItem key={route._id} value={route.routeName}>{route.routeName}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setFilters({ search: '', department: '', location: '', serviceRoute: '', sortBy: 'serviceRoute' })}
                        startIcon={<ClearIcon />}
                        sx={{
                          height: 40,
                          borderRadius: 2,
                          borderColor: alpha('#ef4444', 0.3),
                          color: '#ef4444',
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: '#ef4444',
                            backgroundColor: alpha('#ef4444', 0.08)
                          }
                        }}
                      >
                        Temizle
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Hızlı Güzergah Seçimi */}
                  {serviceRoutes.length > 0 && (
                    <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha('#667eea', 0.1)}` }}>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 700, display: 'block', mb: 1.5 }}>
                        HIZLI SEÇİM
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {serviceRoutes.slice(0, 6).map(route => (
                          <Chip
                            key={route._id}
                            label={`${route.routeName} (${route.statistics?.activeEmployees || 0})`}
                            size="small"
                            clickable
                            onClick={() => selectByRoute(route.routeName)}
                            sx={{
                              fontWeight: 600,
                              background: alpha('#667eea', 0.1),
                              border: `1px solid ${alpha('#667eea', 0.2)}`,
                              '&:hover': {
                                background: alpha('#667eea', 0.2),
                                transform: 'scale(1.05)'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Card>

              {/* Çalışan Listesi */}
              <Card sx={{
                background: alpha('#ffffff', 0.95),
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: `1px solid ${alpha('#ffffff', 0.3)}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ p: 3, borderBottom: `1px solid ${alpha('#667eea', 0.1)}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                        👥 Çalışanlar
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                        {filteredEmployees.length} kişi listeleniyor
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant={selectedEmployees.length === filteredEmployees.length ? 'contained' : 'outlined'}
                        onClick={handleSelectAll}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          ...(selectedEmployees.length === filteredEmployees.length ? {
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          } : {
                            borderColor: alpha('#667eea', 0.3),
                            color: '#667eea'
                          })
                        }}
                      >
                        {selectedEmployees.length === filteredEmployees.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                      </Button>
                      {selectedEmployees.length > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={clearSelection}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: alpha('#ef4444', 0.3),
                            color: '#ef4444'
                          }}
                        >
                          Temizle
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
                  {loading ? (
                    <Typography align="center" color="text.secondary">Yükleniyor...</Typography>
                  ) : filteredEmployees.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <PersonIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                        Çalışan Bulunamadı
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280', mt: 1 }}>
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
                          <Fade in timeout={200} key={employee._id}>
                            <Card
                              onClick={() => toggleEmployeeSelection(employee)}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                borderRadius: 2,
                                border: `2px solid ${isSelected ? '#667eea' : 'transparent'}`,
                                background: isSelected 
                                  ? alpha('#667eea', 0.08)
                                  : alpha('#ffffff', 0.6),
                                transition: 'all 0.2s',
                                '&:hover': {
                                  transform: 'translateX(4px)',
                                  borderColor: isSelected ? '#667eea' : alpha('#667eea', 0.3),
                                  background: isSelected 
                                    ? alpha('#667eea', 0.12)
                                    : alpha('#667eea', 0.04)
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Checkbox checked={!!isSelected} sx={{ color: '#667eea' }} />
                                
                                <Avatar 
                                  sx={{ 
                                    width: 44,
                                    height: 44,
                                    background: isSelected 
                                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                      : alpha('#667eea', 0.1),
                                    color: isSelected ? 'white' : '#667eea',
                                    fontWeight: 700,
                                    fontSize: '1.1rem'
                                  }}
                                >
                                  {(employee.ad || employee.firstName)?.charAt(0) || '?'}
                                </Avatar>
                                
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                                    {employee.ad || employee.firstName} {employee.soyad || employee.lastName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                    {employee.departman || employee.department}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {route && (
                                    <Chip
                                      icon={<BusIcon fontSize="small" />}
                                      label={route}
                                      size="small"
                                      sx={{
                                        background: alpha('#667eea', 0.1),
                                        color: '#667eea',
                                        fontWeight: 600,
                                        border: `1px solid ${alpha('#667eea', 0.2)}`
                                      }}
                                    />
                                  )}
                                  {stop && (
                                    <Chip
                                      icon={<LocationIcon fontSize="small" />}
                                      label={stop}
                                      size="small"
                                      sx={{
                                        background: alpha('#f59e0b', 0.1),
                                        color: '#f59e0b',
                                        fontWeight: 600,
                                        border: `1px solid ${alpha('#f59e0b', 0.2)}`
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Card>
                          </Fade>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Önizleme Dialog */}
        <Dialog 
          open={previewDialog} 
          onClose={() => setPreviewDialog(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            📋 Güzergah Önizlemesi
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0 }}>
            {renderPreviewContent()}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPreviewDialog(false)} sx={{ borderRadius: 2 }}>Kapat</Button>
            <Button 
              variant="contained" 
              onClick={() => window.print()} 
              startIcon={<PrintIcon />}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              Yazdır
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default QuickRouteModern;


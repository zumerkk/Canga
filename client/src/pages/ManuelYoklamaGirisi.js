import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Autocomplete,
  Avatar,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Fab,
  Zoom,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Collapse
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Refresh,
  Search,
  Person,
  AccessTime,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Today,
  CheckCircle,
  Cancel,
  Warning,
  ExpandMore,
  ExpandLess,
  ContentPaste,
  Download,
  Print,
  InfoOutlined,
  Schedule,
  Groups,
  PersonAdd,
  AssignmentTurnedIn,
  EventNote,
  Timer,
  MoreTime
} from '@mui/icons-material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import toast from 'react-hot-toast';
import api from '../config/api';

moment.locale('tr');

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = React.memo(({ title, value, icon, color, subtitle, onClick }) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Card
      onClick={onClick}
      sx={{
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        cursor: onClick ? 'pointer' : 'default',
        height: '100%'
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color={color}>
              {value ?? 0}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, width: 56, height: 56 }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
));

// ============================================
// EMPLOYEE ROW COMPONENT
// ============================================
const EmployeeRow = React.memo(({ record, onEditCheckout, onDelete, isToday }) => {
  const isInside = record.checkIn?.time && !record.checkOut?.time;
  const isManual = record.checkIn?.method === 'MANUAL' || record.checkOut?.method === 'MANUAL';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      component={TableRow}
      sx={{
        bgcolor: isInside && isToday ? 'success.light' : 'inherit',
        '&:hover': { bgcolor: 'action.hover' }
      }}
    >
      <TableCell>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              isInside && isToday ? (
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    border: '2px solid white',
                    animation: 'pulse 2s infinite'
                  }}
                />
              ) : null
            }
          >
            <Avatar
              src={record.employeeId?.profilePhoto}
              sx={{
                width: 45,
                height: 45,
                bgcolor: record.checkIn?.branch === 'IŞIL' ? 'secondary.main' : 'primary.main'
              }}
            >
              {record.employeeId?.adSoyad?.charAt(0) || '?'}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {record.employeeId?.adSoyad || 'İsimsiz'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {record.employeeId?.pozisyon || '-'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Chip
          size="small"
          label={record.checkIn?.branch === 'IŞIL' ? '🏢 Işıl' : '🏭 Merkez'}
          color={record.checkIn?.branch === 'IŞIL' ? 'secondary' : 'primary'}
          variant="outlined"
        />
      </TableCell>
      <TableCell align="center">
        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
          <LoginIcon fontSize="small" color="success" />
          <Typography variant="body2" fontWeight="medium" color="success.main">
            {record.checkIn?.time ? moment(record.checkIn.time).format('HH:mm') : '-'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">
        {record.checkOut?.time ? (
          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
            <LogoutIcon fontSize="small" color="error" />
            <Typography variant="body2" fontWeight="medium" color="error.main">
              {moment(record.checkOut.time).format('HH:mm')}
            </Typography>
          </Box>
        ) : (
          <Chip
            size="small"
            label="İçeride"
            color="success"
            icon={<AccessTime />}
          />
        )}
      </TableCell>
      <TableCell align="center">
        <Typography variant="body2">
          {record.workDurationFormatted || '-'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        {isManual ? (
          <Chip size="small" label="Manuel" color="warning" variant="outlined" />
        ) : (
          <Chip size="small" label={record.checkIn?.method || '-'} variant="outlined" />
        )}
      </TableCell>
      <TableCell align="center">
        <Box display="flex" gap={0.5} justifyContent="center">
          {!record.checkOut?.time && (
            <Tooltip title="Çıkış Ekle">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEditCheckout(record)}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {record.checkOut?.time && isManual && (
            <Tooltip title="Düzenle">
              <IconButton
                size="small"
                color="info"
                onClick={() => onEditCheckout(record)}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isManual && (
            <Tooltip title="Sil">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(record)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </motion.tr>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================
function ManuelYoklamaGirisi() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Tab State
  const [currentTab, setCurrentTab] = useState(0);

  // Data State
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    currentlyInside: 0,
    checkedOut: 0,
    manual: 0
  });

  // Form State
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [checkInTime, setCheckInTime] = useState(moment().startOf('hour'));
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('MERKEZ');
  const [entryReason, setEntryReason] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  
  // 🆕 Manuel Fazla Mesai State
  const [overtimeTimeUnit, setOvertimeTimeUnit] = useState('SAAT'); // 'SAAT' veya 'DAKIKA'
  const [overtimeValue, setOvertimeValue] = useState(''); // Kullanıcının girdiği değer
  const [manualOvertimeReason, setManualOvertimeReason] = useState('');
  const [manualOvertimeNotes, setManualOvertimeNotes] = useState('');
  
  // Dakikaya çevrilmiş değer (backend'e gönderilecek)
  const manualOvertimeMinutes = React.useMemo(() => {
    const val = parseFloat(overtimeValue) || 0;
    if (overtimeTimeUnit === 'SAAT') {
      return Math.round(val * 60); // Saati dakikaya çevir
    }
    return Math.round(val); // Zaten dakika
  }, [overtimeValue, overtimeTimeUnit]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterBranch, setFilterBranch] = useState('TÜM');

  // Dialog State
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [checkoutTimeEdit, setCheckoutTimeEdit] = useState(moment());
  const [checkoutReason, setCheckoutReason] = useState('');

  // Collapse State
  const [showForm, setShowForm] = useState(true);

  // ============================================
  // DATA FETCHING
  // ============================================
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const response = await api.get('/api/manual-attendance/by-date', {
        params: {
          date: dateStr,
          branch: filterBranch !== 'TÜM' ? filterBranch : undefined,
          includeAll: 'true'
        }
      });

      setRecords(response.data.allRecords || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Kayıtlar yüklenemedi:', error);
      toast.error('Kayıtlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, filterBranch]);

  const searchEmployees = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get('/api/manual-attendance/search-employees', {
        params: { q: query, limit: 15 }
      });
      setSearchResults(response.data.employees || []);
    } catch (error) {
      console.error('Arama hatası:', error);
    } finally {
      setSearching(false);
    }
  }, []);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchEmployees(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchEmployees]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleSubmitEntry = async () => {
    if (!selectedEmployee) {
      toast.error('Lütfen bir çalışan seçin');
      return;
    }

    if (!checkInTime) {
      toast.error('Lütfen giriş saati girin');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: selectedEmployee._id,
        date: selectedDate.format('YYYY-MM-DD'),
        checkInTime: checkInTime.format('HH:mm'),
        checkOutTime: checkOutTime ? checkOutTime.format('HH:mm') : null,
        branch: selectedBranch,
        reason: entryReason || 'Kağıt kayıttan aktarım',
        notes: entryNotes,
        // 🆕 Manuel Fazla Mesai Bilgileri
        manualOvertimeMinutes: manualOvertimeMinutes > 0 ? parseInt(manualOvertimeMinutes) : 0,
        manualOvertimeReason: manualOvertimeReason || null,
        manualOvertimeNotes: manualOvertimeNotes || null
      };

      const response = await api.post('/api/manual-attendance/entry', payload);

      toast.success(response.data.message);
      
      // Form temizle
      setSelectedEmployee(null);
      setCheckInTime(moment().startOf('hour'));
      setCheckOutTime(null);
      setEntryReason('');
      setEntryNotes('');
      setSearchQuery('');
      // 🆕 Manuel fazla mesai alanlarını temizle
      setOvertimeTimeUnit('SAAT');
      setOvertimeValue('');
      setManualOvertimeReason('');
      setManualOvertimeNotes('');
      
      // Listeyi yenile
      loadRecords();
    } catch (error) {
      console.error('Giriş hatası:', error);
      toast.error(error.response?.data?.error || 'Kayıt eklenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCheckout = (record) => {
    setSelectedRecord(record);
    setCheckoutTimeEdit(
      record.checkOut?.time 
        ? moment(record.checkOut.time) 
        : moment()
    );
    setCheckoutReason('');
    setCheckoutDialog(true);
  };

  const handleSaveCheckout = async () => {
    if (!selectedRecord || !checkoutTimeEdit) return;

    try {
      const response = await api.put(
        `/api/manual-attendance/${selectedRecord._id}/checkout`,
        {
          checkOutTime: checkoutTimeEdit.format('HH:mm'),
          reason: checkoutReason || 'Manuel çıkış düzeltmesi'
        }
      );

      toast.success(response.data.message);
      setCheckoutDialog(false);
      loadRecords();
    } catch (error) {
      console.error('Çıkış güncelleme hatası:', error);
      toast.error(error.response?.data?.error || 'Güncelleme başarısız');
    }
  };

  const handleDeleteRecord = (record) => {
    setSelectedRecord(record);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord) return;

    try {
      await api.delete(`/api/manual-attendance/${selectedRecord._id}`, {
        data: { reason: 'Manuel silme' }
      });

      toast.success('Kayıt silindi');
      setDeleteDialog(false);
      loadRecords();
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error(error.response?.data?.error || 'Silme başarısız');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
    toast.success('Liste yenilendi');
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const isToday = useMemo(() => {
    return selectedDate.isSame(moment(), 'day');
  }, [selectedDate]);

  const currentlyInside = useMemo(() => {
    return records.filter(r => r.checkIn?.time && !r.checkOut?.time);
  }, [records]);

  const checkedOut = useMemo(() => {
    return records.filter(r => r.checkIn?.time && r.checkOut?.time);
  }, [records]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="tr">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              📝 Manuel Yoklama Girişi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              QR/İmza sistemi çalışmadığında kağıtla alınan verileri buradan girin
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={18} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Yenile
            </Button>
          </Box>
        </Box>

        {/* INFO ALERT */}
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<InfoOutlined />}
        >
          <Typography variant="body2">
            <strong>Kullanım:</strong> Sistem kesintisi, elektrik kesintisi veya diğer teknik sorunlar nedeniyle 
            kağıt üzerinde imza ile alınan yoklama kayıtlarını bu ekrandan sisteme girebilirsiniz. 
            Girilen kayıtlar <Chip size="small" label="Manuel" color="warning" sx={{ mx: 0.5 }} /> 
            olarak işaretlenir ve raporlarda ayrıca gösterilir.
          </Typography>
        </Alert>

        {/* STATS CARDS */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Toplam Kayıt"
              value={stats.total}
              icon={<Groups />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Şu An İçeride"
              value={stats.currentlyInside}
              icon={<PersonAdd />}
              color="#4caf50"
              subtitle={isToday ? 'Aktif' : ''}
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Çıkış Yapmış"
              value={stats.checkedOut}
              icon={<AssignmentTurnedIn />}
              color="#ff9800"
            />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              title="Manuel Giriş"
              value={stats.manual}
              icon={<ContentPaste />}
              color="#9c27b0"
            />
          </Grid>
        </Grid>

        {/* TABS */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(e, v) => setCurrentTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<Add />} 
              iconPosition="start" 
              label="Yeni Giriş" 
            />
            <Tab 
              icon={
                <Badge badgeContent={currentlyInside.length} color="success">
                  <Groups />
                </Badge>
              } 
              iconPosition="start" 
              label="Şu An İçeridekiler" 
            />
            <Tab 
              icon={<EventNote />} 
              iconPosition="start" 
              label="Tüm Kayıtlar" 
            />
          </Tabs>
        </Paper>

        {/* TAB 0: YENİ GİRİŞ FORMU */}
        {currentTab === 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center" 
              mb={2}
              onClick={() => setShowForm(!showForm)}
              sx={{ cursor: 'pointer' }}
            >
              <Typography variant="h6">
                <PersonAdd sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Yeni Manuel Kayıt Ekle
              </Typography>
              <IconButton size="small">
                {showForm ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={showForm}>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {/* TARİH SEÇİMİ */}
                <Grid item xs={12} md={4}>
                  <DatePicker
                    label="Tarih"
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    maxDate={moment()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Today />
                            </InputAdornment>
                          )
                        }
                      }
                    }}
                  />
                  {isToday && (
                    <Chip 
                      size="small" 
                      label="Bugün" 
                      color="success" 
                      sx={{ mt: 1 }} 
                    />
                  )}
                </Grid>

                {/* ŞUBE SEÇİMİ */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Şube</InputLabel>
                    <Select
                      value={selectedBranch}
                      label="Şube"
                      onChange={(e) => setSelectedBranch(e.target.value)}
                    >
                      <MenuItem value="MERKEZ">🏭 Merkez Şube</MenuItem>
                      <MenuItem value="IŞIL">🏢 Işıl Şube</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* SEBEP */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Manuel Giriş Sebebi</InputLabel>
                    <Select
                      value={entryReason}
                      label="Manuel Giriş Sebebi"
                      onChange={(e) => setEntryReason(e.target.value)}
                    >
                      <MenuItem value="">Seçiniz...</MenuItem>
                      <MenuItem value="Sistem kesintisi">Sistem Kesintisi</MenuItem>
                      <MenuItem value="Elektrik kesintisi">Elektrik Kesintisi</MenuItem>
                      <MenuItem value="İnternet problemi">İnternet Problemi</MenuItem>
                      <MenuItem value="Telefon arızası">Telefon/Cihaz Arızası</MenuItem>
                      <MenuItem value="Kağıt kayıttan aktarım">Kağıt Kayıttan Aktarım</MenuItem>
                      <MenuItem value="Geçmişe dönük düzeltme">Geçmişe Dönük Düzeltme</MenuItem>
                      <MenuItem value="Diğer">Diğer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* ÇALIŞAN ARAMA */}
                <Grid item xs={12}>
                  <Autocomplete
                    value={selectedEmployee}
                    onChange={(e, newValue) => setSelectedEmployee(newValue)}
                    inputValue={searchQuery}
                    onInputChange={(e, newValue) => setSearchQuery(newValue)}
                    options={searchResults}
                    loading={searching}
                    getOptionLabel={(option) => 
                      `${option.adSoyad} - ${option.pozisyon || 'Pozisyon yok'}`
                    }
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Avatar 
                          src={option.profilePhoto} 
                          sx={{ mr: 2, width: 40, height: 40 }}
                        >
                          {option.adSoyad?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.adSoyad}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.pozisyon} • {option.departman || '-'} • TC: {option.tcNo}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Çalışan Ara (İsim, TC veya Sicil No)"
                        placeholder="En az 2 karakter yazın..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <Search />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                          endAdornment: (
                            <>
                              {searching && <CircularProgress size={20} />}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    noOptionsText="Çalışan bulunamadı"
                    loadingText="Aranıyor..."
                  />
                </Grid>

                {/* SEÇİLİ ÇALIŞAN BİLGİSİ */}
                {selectedEmployee && (
                  <Grid item xs={12}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'success.light',
                        border: '2px solid',
                        borderColor: 'success.main'
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar 
                          src={selectedEmployee.profilePhoto}
                          sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
                        >
                          {selectedEmployee.adSoyad?.charAt(0)}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight="bold">
                            {selectedEmployee.adSoyad}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedEmployee.pozisyon} • {selectedEmployee.departman}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            TC: {selectedEmployee.tcNo} • Lokasyon: {selectedEmployee.lokasyon}
                          </Typography>
                        </Box>
                        <CheckCircle color="success" sx={{ fontSize: 40 }} />
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {/* GİRİŞ SAATİ */}
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="Giriş Saati"
                    value={checkInTime}
                    onChange={(time) => setCheckInTime(time)}
                    ampm={false}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LoginIcon color="success" />
                            </InputAdornment>
                          )
                        }
                      }
                    }}
                  />
                </Grid>

                {/* ÇIKIŞ SAATİ */}
                <Grid item xs={12} sm={6}>
                  <TimePicker
                    label="Çıkış Saati (Opsiyonel)"
                    value={checkOutTime}
                    onChange={(time) => setCheckOutTime(time)}
                    ampm={false}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: 'Sonradan da eklenebilir',
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LogoutIcon color="error" />
                            </InputAdornment>
                          )
                        }
                      }
                    }}
                  />
                </Grid>

                {/* EK NOTLAR */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Ek Notlar (Opsiyonel)"
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    placeholder="Varsa ek açıklama yazın..."
                  />
                </Grid>

                {/* 🆕 MANUEL FAZLA MESAİ BÖLÜMÜ */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MoreTime />
                    Manuel Fazla Mesai Ekleme (Opsiyonel)
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Sistem tarafından hesaplanamayan fazla mesailer için kullanın. 
                      Örn: Yemeğe çıkmadan çalışma, hafta sonu/tatil çalışma, gece mesaisi vb.
                      <br />
                      <strong>Not:</strong> Manuel girilen fazla mesai, sistemin otomatik hesapladığı fazla mesainin <strong>yerine geçer</strong> (toplanmaz).
                    </Typography>
                  </Alert>
                </Grid>

                {/* ZAMAN BİRİMİ SEÇİMİ */}
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Zaman Birimi</InputLabel>
                    <Select
                      value={overtimeTimeUnit}
                      label="Zaman Birimi"
                      onChange={(e) => {
                        setOvertimeTimeUnit(e.target.value);
                        setOvertimeValue(''); // Birim değişince değeri sıfırla
                      }}
                    >
                      <MenuItem value="SAAT">⏰ Saat</MenuItem>
                      <MenuItem value="DAKIKA">⏱️ Dakika</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* MANUEL FAZLA MESAİ SÜRESİ */}
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label={overtimeTimeUnit === 'SAAT' ? 'Fazla Mesai (saat)' : 'Fazla Mesai (dakika)'}
                    value={overtimeValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Negatif değer girişini engelle
                      if (val === '' || parseFloat(val) >= 0) {
                        setOvertimeValue(val);
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Timer color="info" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {overtimeTimeUnit === 'SAAT' ? 'saat' : 'dk'}
                        </InputAdornment>
                      ),
                      inputProps: { 
                        min: 0, 
                        step: overtimeTimeUnit === 'SAAT' ? 0.5 : 15 
                      }
                    }}
                    helperText={
                      manualOvertimeMinutes > 0 
                        ? `= ${Math.floor(manualOvertimeMinutes/60)} saat ${manualOvertimeMinutes%60} dakika` 
                        : overtimeTimeUnit === 'SAAT' 
                          ? 'Örn: 1.5 = 1 saat 30 dk' 
                          : 'Örn: 90 = 1 saat 30 dk'
                    }
                  />
                </Grid>

                {/* MANUEL FAZLA MESAİ SEBEBİ */}
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth disabled={manualOvertimeMinutes <= 0}>
                    <InputLabel>Fazla Mesai Sebebi</InputLabel>
                    <Select
                      value={manualOvertimeReason}
                      label="Fazla Mesai Sebebi"
                      onChange={(e) => setManualOvertimeReason(e.target.value)}
                    >
                      <MenuItem value="">Seçiniz...</MenuItem>
                      <MenuItem value="YEMEK_MOLASI_YOK">🍽️ Yemeğe Çıkmadan Çalıştı</MenuItem>
                      <MenuItem value="HAFTA_SONU_CALISMA">📅 Hafta Sonu Çalışma</MenuItem>
                      <MenuItem value="TATIL_CALISMA">🎉 Resmi Tatil Çalışma</MenuItem>
                      <MenuItem value="GECE_MESAI">🌙 Gece Mesaisi</MenuItem>
                      <MenuItem value="ACIL_IS">🚨 Acil İş</MenuItem>
                      <MenuItem value="PROJE_TESLIM">📦 Proje Teslimi</MenuItem>
                      <MenuItem value="BAKIM_ONARIM">🔧 Bakım/Onarım</MenuItem>
                      <MenuItem value="EGITIM">📚 Eğitim</MenuItem>
                      <MenuItem value="TOPLANTI">👥 Toplantı</MenuItem>
                      <MenuItem value="DIGER">📝 Diğer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* MANUEL FAZLA MESAİ NOTU */}
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Fazla Mesai Açıklaması"
                    value={manualOvertimeNotes}
                    onChange={(e) => setManualOvertimeNotes(e.target.value)}
                    disabled={manualOvertimeMinutes <= 0}
                    placeholder="Detaylı açıklama..."
                  />
                </Grid>

                {/* ÖZET GÖSTERGE */}
                {manualOvertimeMinutes > 0 && (
                  <Grid item xs={12}>
                    <Alert 
                      severity="success" 
                      icon={<MoreTime />}
                      sx={{ 
                        bgcolor: 'success.light',
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                        <Typography variant="body2">
                          <strong>Manuel Fazla Mesai:</strong>{' '}
                          {Math.floor(manualOvertimeMinutes / 60) > 0 && (
                            <>{Math.floor(manualOvertimeMinutes / 60)} saat </>
                          )}
                          {manualOvertimeMinutes % 60 > 0 && (
                            <>{manualOvertimeMinutes % 60} dakika</>
                          )}
                          {manualOvertimeMinutes % 60 === 0 && Math.floor(manualOvertimeMinutes / 60) > 0 && (
                            <>(tam saat)</>
                          )}
                        </Typography>
                        {manualOvertimeReason && (
                          <Chip 
                            size="small" 
                            label={manualOvertimeReason.replace(/_/g, ' ')} 
                            color="info" 
                          />
                        )}
                      </Box>
                    </Alert>
                  </Grid>
                )}

                {/* KAYDET BUTONU */}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    onClick={handleSubmitEntry}
                    disabled={!selectedEmployee || !checkInTime || submitting}
                    sx={{ py: 1.5 }}
                  >
                    {submitting ? 'Kaydediliyor...' : 'Manuel Kaydı Ekle'}
                  </Button>
                </Grid>
              </Grid>
            </Collapse>
          </Paper>
        )}

        {/* TAB 1: ŞU AN İÇERİDEKİLER */}
        {currentTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <Badge badgeContent={currentlyInside.length} color="success" sx={{ mr: 2 }}>
                  <Groups />
                </Badge>
                Şu An İçeridekiler
                {isToday && (
                  <Chip size="small" label="Canlı" color="success" sx={{ ml: 1 }} />
                )}
              </Typography>
            </Box>

            {currentlyInside.length === 0 ? (
              <Alert severity="info">
                {selectedDate.format('DD MMMM YYYY')} tarihinde içeride kimse yok.
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'success.light' }}>
                      <TableCell>Çalışan</TableCell>
                      <TableCell>Şube</TableCell>
                      <TableCell align="center">Giriş</TableCell>
                      <TableCell align="center">Durum</TableCell>
                      <TableCell align="center">İçeride</TableCell>
                      <TableCell align="center">Yöntem</TableCell>
                      <TableCell align="center">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {currentlyInside.map((record) => (
                        <EmployeeRow
                          key={record._id}
                          record={record}
                          onEditCheckout={handleEditCheckout}
                          onDelete={handleDeleteRecord}
                          isToday={isToday}
                        />
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* TAB 2: TÜM KAYITLAR */}
        {currentTab === 2 && (
          <Paper sx={{ p: 3 }}>
            {/* FİLTRELER */}
            <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
              <DatePicker
                label="Tarih Seç"
                value={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                maxDate={moment()}
                slotProps={{ textField: { size: 'small' } }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Şube Filtresi</InputLabel>
                <Select
                  value={filterBranch}
                  label="Şube Filtresi"
                  onChange={(e) => setFilterBranch(e.target.value)}
                >
                  <MenuItem value="TÜM">Tüm Şubeler</MenuItem>
                  <MenuItem value="MERKEZ">🏭 Merkez</MenuItem>
                  <MenuItem value="IŞIL">🏢 Işıl</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                <strong>{records.length}</strong> kayıt bulundu
              </Typography>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : records.length === 0 ? (
              <Alert severity="info">
                {selectedDate.format('DD MMMM YYYY')} tarihinde kayıt bulunamadı.
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell>Çalışan</TableCell>
                      <TableCell>Şube</TableCell>
                      <TableCell align="center">Giriş</TableCell>
                      <TableCell align="center">Çıkış</TableCell>
                      <TableCell align="center">Süre</TableCell>
                      <TableCell align="center">Yöntem</TableCell>
                      <TableCell align="center">İşlem</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {records.map((record) => (
                        <EmployeeRow
                          key={record._id}
                          record={record}
                          onEditCheckout={handleEditCheckout}
                          onDelete={handleDeleteRecord}
                          isToday={isToday}
                        />
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* ÇIKIŞ DİALOG */}
        <Dialog
          open={checkoutDialog}
          onClose={() => setCheckoutDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <LogoutIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Çıkış Saati {selectedRecord?.checkOut?.time ? 'Düzenle' : 'Ekle'}
          </DialogTitle>
          <DialogContent>
            <Box mt={2}>
              {selectedRecord && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <strong>{selectedRecord.employeeId?.adSoyad}</strong> - 
                  Giriş: {moment(selectedRecord.checkIn?.time).format('HH:mm')}
                </Alert>
              )}
              
              <TimePicker
                label="Çıkış Saati"
                value={checkoutTimeEdit}
                onChange={(time) => setCheckoutTimeEdit(time)}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mb: 2 }
                  }
                }}
              />

              <TextField
                fullWidth
                label="Düzeltme Sebebi"
                value={checkoutReason}
                onChange={(e) => setCheckoutReason(e.target.value)}
                placeholder="Opsiyonel..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCheckoutDialog(false)}>İptal</Button>
            <Button variant="contained" onClick={handleSaveCheckout}>
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>

        {/* SİLME ONAY DİALOG */}
        <Dialog
          open={deleteDialog}
          onClose={() => setDeleteDialog(false)}
        >
          <DialogTitle>
            <Warning color="error" sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Kaydı Sil
          </DialogTitle>
          <DialogContent>
            <Typography>
              <strong>{selectedRecord?.employeeId?.adSoyad}</strong> - 
              {moment(selectedRecord?.date).format('DD.MM.YYYY')} tarihli kaydı 
              silmek istediğinizden emin misiniz?
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Bu işlem geri alınamaz!
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(false)}>İptal</Button>
            <Button color="error" variant="contained" onClick={confirmDelete}>
              Sil
            </Button>
          </DialogActions>
        </Dialog>

        {/* CSS for pulse animation */}
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.3); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </Container>
    </LocalizationProvider>
  );
}

export default ManuelYoklamaGirisi;


import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Login,
  Logout,
  Warning,
  Fingerprint,
  Person,
  Search,
  AccessTime,
  Note,
  ArrowBack,
  Close,
  SupervisorAccount,
  Groups,
  Refresh,
  History,
  VerifiedUser,
  Edit,
  Save
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../../config/api';
import toast from 'react-hot-toast';

moment.locale('tr');

/**
 * 👨‍💼 YARDIMLI GİRİŞ/ÇIKIŞ BİLEŞENİ
 * 
 * Yönetici veya güvenlik personeli başkası adına giriş/çıkış kaydı yapabilir.
 * Kullanım durumları:
 * - Yaşlı çalışanlar için
 * - Teknoloji kullanamayan çalışanlar için
 * - Acil durumlar için
 * - Toplu giriş/çıkış için
 */

// Yardımlı giriş sebepleri
const ASSISTED_REASONS = [
  { value: 'ELDERLY', label: '👴 Yaşlı çalışan', icon: '👴' },
  { value: 'NO_PHONE', label: '📱 Telefon yok/bozuk', icon: '📱' },
  { value: 'TECH_DIFFICULTY', label: '🤷 Teknoloji zorluğu', icon: '🤷' },
  { value: 'EMERGENCY', label: '🚨 Acil durum', icon: '🚨' },
  { value: 'FORGOT_CARD', label: '💳 Kart unutuldu', icon: '💳' },
  { value: 'GROUP_ENTRY', label: '👥 Toplu giriş', icon: '👥' },
  { value: 'OTHER', label: '📝 Diğer', icon: '📝' }
];

const AssistedCheckIn = ({ 
  open, 
  onClose, 
  branch = 'MERKEZ',
  supervisorId,
  supervisorName,
  onSuccess 
}) => {
  const signaturePadRef = useRef(null);
  
  // Durumlar
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  
  // Seçimler
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [actionType, setActionType] = useState('CHECK_IN');
  const [assistedReason, setAssistedReason] = useState('');
  const [notes, setNotes] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  
  // Adım yönetimi
  const [activeStep, setActiveStep] = useState(0);
  
  // İşlem durumları
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const steps = ['Çalışan Seç', 'Sebep & Not', 'İmza & Onay'];

  // Veri yükleme
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Çalışanları yükle
      const empResponse = await api.get('/api/employees', { 
        params: { durum: 'all', limit: 1000 } 
      });
      const empData = empResponse.data?.data || [];
      const activeEmployees = Array.isArray(empData) 
        ? empData.filter(e => e.durum === 'AKTIF')
        : [];
      setEmployees(activeEmployees);
      
      // Bugünkü kayıtları yükle
      const recordsResponse = await api.get('/api/attendance/daily', {
        params: { date: moment().format('YYYY-MM-DD') }
      });
      setTodayRecords(recordsResponse.data?.records || []);
      
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Çalışan durumunu kontrol et
  const getEmployeeStatus = useCallback((employeeId) => {
    const record = todayRecords.find(r => r.employeeId?._id === employeeId);
    if (!record) return { hasCheckedIn: false, hasCheckedOut: false };
    return {
      hasCheckedIn: !!record.checkIn?.time,
      hasCheckedOut: !!record.checkOut?.time,
      checkInTime: record.checkIn?.time,
      checkOutTime: record.checkOut?.time
    };
  }, [todayRecords]);

  // Çalışan seç/kaldır
  const toggleEmployeeSelection = (employee) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.some(e => e._id === employee._id);
      if (isSelected) {
        return prev.filter(e => e._id !== employee._id);
      } else {
        return [...prev, employee];
      }
    });
  };

  // İşlem türüne göre filtrelenmiş çalışanlar
  const filteredEmployees = employees.filter(emp => {
    const status = getEmployeeStatus(emp._id);
    if (actionType === 'CHECK_IN') {
      return !status.hasCheckedIn; // Henüz giriş yapmamışlar
    } else {
      return status.hasCheckedIn && !status.hasCheckedOut; // Giriş yapıp çıkış yapmayanlar
    }
  });

  // İmza temizle
  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
  };

  // Toplu işlem gönder
  const handleSubmit = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('En az bir çalışan seçin');
      return;
    }

    if (!assistedReason) {
      toast.error('Yardımlı giriş sebebi seçin');
      return;
    }

    if (signaturePadRef.current?.isEmpty()) {
      toast.error('Yönetici imzası gerekli');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setResults([]);

      const signatureData = signaturePadRef.current.toDataURL('image/png');
      const timestamp = useCustomTime && customTime 
        ? moment().set({
            hour: parseInt(customTime.split(':')[0]),
            minute: parseInt(customTime.split(':')[1])
          }).toDate()
        : new Date();

      const processResults = [];

      for (const employee of selectedEmployees) {
        try {
          const payload = {
            employeeId: employee._id,
            method: 'MANUAL',
            location: employee.lokasyon || branch,
            branch: branch,
            signature: signatureData,
            additionalData: {
              entryMethod: 'ASSISTED',
              assistedBy: supervisorId,
              assistedByName: supervisorName,
              assistedReason: assistedReason,
              notes: notes || undefined,
              originalTimestamp: new Date().toISOString(),
              customTimestamp: useCustomTime ? timestamp.toISOString() : undefined
            }
          };

          // Özel zaman kullanılıyorsa
          if (useCustomTime && customTime) {
            payload.time = timestamp;
          }

          const endpoint = actionType === 'CHECK_IN' 
            ? '/api/attendance/check-in' 
            : '/api/attendance/check-out';

          const response = await api.post(endpoint, payload);

          processResults.push({
            employee: employee,
            success: true,
            message: `${employee.adSoyad} - ${actionType === 'CHECK_IN' ? 'Giriş' : 'Çıkış'} kaydedildi`,
            time: timestamp
          });
        } catch (err) {
          processResults.push({
            employee: employee,
            success: false,
            message: err.response?.data?.error || 'Hata oluştu'
          });
        }
      }

      setResults(processResults);
      
      const successCount = processResults.filter(r => r.success).length;
      const failCount = processResults.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} çalışan için işlem başarılı`);
        onSuccess?.();
      }
      
      if (failCount > 0) {
        toast.error(`${failCount} çalışan için işlem başarısız`);
      }

      // 3 saniye sonra sonuçları göster, sonra kapat
      setTimeout(() => {
        if (failCount === 0) {
          handleClose();
        }
      }, 3000);

    } catch (err) {
      console.error('Toplu işlem hatası:', err);
      setError('İşlem sırasında hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  // Dialog kapat ve sıfırla
  const handleClose = () => {
    setSelectedEmployees([]);
    setActionType('CHECK_IN');
    setAssistedReason('');
    setNotes('');
    setCustomTime('');
    setUseCustomTime(false);
    setActiveStep(0);
    setResults([]);
    setError(null);
    signaturePadRef.current?.clear();
    onClose();
  };

  // Sonraki adım
  const handleNext = () => {
    if (activeStep === 0 && selectedEmployees.length === 0) {
      toast.error('En az bir çalışan seçin');
      return;
    }
    if (activeStep === 1 && !assistedReason) {
      toast.error('Yardımlı giriş sebebi seçin');
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  // Önceki adım
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const branchColor = branch === 'IŞIL' ? '#7b1fa2' : '#1565c0';
  const branchEmoji = branch === 'IŞIL' ? '🏢' : '🏭';
  const branchName = branch === 'IŞIL' ? 'Işıl Şube' : 'Merkez Şube';

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '70vh' }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${branchColor} 0%, ${branchColor}dd 100%)`,
        color: 'white',
        pb: 3
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <SupervisorAccount sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Yardımlı Giriş/Çıkış
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {branchEmoji} {branchName} • {supervisorName || 'Yönetici'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        ) : results.length > 0 ? (
          // Sonuç ekranı
          <Box p={4}>
            <Typography variant="h5" gutterBottom fontWeight="bold" textAlign="center">
              İşlem Sonuçları
            </Typography>
            
            <List>
              {results.map((result, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    bgcolor: result.success ? 'success.light' : 'error.light',
                    borderRadius: 2,
                    mb: 1
                  }}
                >
                  <ListItemAvatar>
                    {result.success ? (
                      <CheckCircle color="success" sx={{ fontSize: 40 }} />
                    ) : (
                      <Cancel color="error" sx={{ fontSize: 40 }} />
                    )}
                  </ListItemAvatar>
                  <ListItemText
                    primary={result.employee.adSoyad}
                    secondary={result.message}
                  />
                  {result.success && result.time && (
                    <Chip 
                      label={moment(result.time).format('HH:mm')}
                      size="small"
                    />
                  )}
                </ListItem>
              ))}
            </List>

            <Button
              variant="contained"
              fullWidth
              onClick={handleClose}
              sx={{ mt: 3 }}
            >
              Kapat
            </Button>
          </Box>
        ) : (
          <>
            {/* Stepper */}
            <Box sx={{ pt: 3, px: 4 }}>
              <Stepper activeStep={activeStep}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Box p={4}>
              {/* Adım 1: Çalışan Seçimi */}
              {activeStep === 0 && (
                <Box>
                  {/* İşlem Türü */}
                  <Box mb={3}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      İşlem Türü
                    </Typography>
                    <ToggleButtonGroup
                      value={actionType}
                      exclusive
                      onChange={(_, v) => {
                        if (v) {
                          setActionType(v);
                          setSelectedEmployees([]);
                        }
                      }}
                      fullWidth
                    >
                      <ToggleButton 
                        value="CHECK_IN"
                        sx={{ 
                          py: 2,
                          '&.Mui-selected': { 
                            bgcolor: 'success.main', 
                            color: 'white',
                            '&:hover': { bgcolor: 'success.dark' }
                          }
                        }}
                      >
                        <Login sx={{ mr: 1 }} /> GİRİŞ
                      </ToggleButton>
                      <ToggleButton 
                        value="CHECK_OUT"
                        sx={{ 
                          py: 2,
                          '&.Mui-selected': { 
                            bgcolor: 'error.main', 
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }
                        }}
                      >
                        <Logout sx={{ mr: 1 }} /> ÇIKIŞ
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Seçilen çalışanlar */}
                  {selectedEmployees.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'success.light' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Seçilen Çalışanlar ({selectedEmployees.length})
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {selectedEmployees.map(emp => (
                          <Chip
                            key={emp._id}
                            label={emp.adSoyad}
                            onDelete={() => toggleEmployeeSelection(emp)}
                            avatar={<Avatar src={emp.profilePhoto}>{emp.adSoyad?.charAt(0)}</Avatar>}
                          />
                        ))}
                      </Box>
                    </Paper>
                  )}

                  {/* Çalışan listesi */}
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    {actionType === 'CHECK_IN' 
                      ? `Henüz Giriş Yapmayan Çalışanlar (${filteredEmployees.length})`
                      : `İçerideki Çalışanlar (${filteredEmployees.length})`
                    }
                  </Typography>

                  {filteredEmployees.length === 0 ? (
                    <Alert severity="info">
                      {actionType === 'CHECK_IN' 
                        ? 'Tüm çalışanlar giriş yapmış'
                        : 'İçeride çalışan yok'
                      }
                    </Alert>
                  ) : (
                    <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {filteredEmployees.map((employee) => {
                        const isSelected = selectedEmployees.some(e => e._id === employee._id);
                        return (
                          <ListItemButton
                            key={employee._id}
                            onClick={() => toggleEmployeeSelection(employee)}
                            selected={isSelected}
                            sx={{ 
                              borderRadius: 2, 
                              mb: 0.5,
                              border: isSelected ? 2 : 0,
                              borderColor: 'success.main'
                            }}
                          >
                            <ListItemAvatar>
                              <Badge
                                badgeContent={isSelected ? '✓' : ''}
                                color="success"
                              >
                                <Avatar src={employee.profilePhoto}>
                                  {employee.adSoyad?.charAt(0)}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={employee.adSoyad}
                              secondary={`${employee.pozisyon} • ${employee.departman || '-'}`}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  )}
                </Box>
              )}

              {/* Adım 2: Sebep ve Not */}
              {activeStep === 1 && (
                <Box>
                  {/* Yardımlı giriş sebebi */}
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Yardımlı Giriş Sebebi *
                  </Typography>
                  <Grid container spacing={1} mb={3}>
                    {ASSISTED_REASONS.map((reason) => (
                      <Grid item xs={6} sm={4} key={reason.value}>
                        <Card
                          onClick={() => setAssistedReason(reason.value)}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            textAlign: 'center',
                            border: 2,
                            borderColor: assistedReason === reason.value ? branchColor : 'transparent',
                            bgcolor: assistedReason === reason.value ? `${branchColor}20` : 'grey.50',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Typography variant="h4">{reason.icon}</Typography>
                          <Typography variant="body2">
                            {reason.label.replace(reason.icon + ' ', '')}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Özel saat */}
                  <Box mb={3}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <input
                        type="checkbox"
                        checked={useCustomTime}
                        onChange={(e) => setUseCustomTime(e.target.checked)}
                        id="customTime"
                      />
                      <label htmlFor="customTime">
                        <Typography variant="subtitle1" fontWeight="medium">
                          Özel saat belirle (geçmişe dönük kayıt)
                        </Typography>
                      </label>
                    </Box>
                    
                    {useCustomTime && (
                      <TextField
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccessTime />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                  </Box>

                  {/* Not */}
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Not (Opsiyonel)"
                    placeholder="Ek açıklama..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Note />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
              )}

              {/* Adım 3: İmza ve Onay */}
              {activeStep === 2 && (
                <Box>
                  {/* Özet */}
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      İşlem Özeti
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">İşlem</Typography>
                        <Typography fontWeight="medium">
                          {actionType === 'CHECK_IN' ? '🟢 Giriş' : '🔴 Çıkış'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Çalışan Sayısı</Typography>
                        <Typography fontWeight="medium">{selectedEmployees.length} kişi</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Sebep</Typography>
                        <Typography fontWeight="medium">
                          {ASSISTED_REASONS.find(r => r.value === assistedReason)?.label || '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Saat</Typography>
                        <Typography fontWeight="medium">
                          {useCustomTime && customTime ? customTime : moment().format('HH:mm')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Seçilen çalışanlar listesi */}
                  <Typography variant="subtitle2" gutterBottom>
                    İşlem Yapılacak Çalışanlar:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                    {selectedEmployees.map(emp => (
                      <Chip
                        key={emp._id}
                        label={emp.adSoyad}
                        avatar={<Avatar src={emp.profilePhoto}>{emp.adSoyad?.charAt(0)}</Avatar>}
                        size="small"
                      />
                    ))}
                  </Box>

                  {/* Yönetici imzası */}
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    <VerifiedUser sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Yönetici Onay İmzası *
                  </Typography>
                  
                  <Box display="flex" justifyContent="flex-end" mb={1}>
                    <Button 
                      size="small" 
                      onClick={handleClearSignature}
                      startIcon={<Refresh />}
                    >
                      Temizle
                    </Button>
                  </Box>
                  
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: branchColor
                    }}
                  >
                    <SignatureCanvas
                      ref={signaturePadRef}
                      canvasProps={{
                        width: Math.min(window.innerWidth - 100, 600),
                        height: 150,
                        style: { 
                          display: 'block', 
                          background: '#fafafa',
                          touchAction: 'none'
                        }
                      }}
                      penColor="#333"
                      minWidth={1.5}
                      maxWidth={3}
                    />
                  </Paper>

                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Bu işlem {supervisorName || 'yönetici'} tarafından onaylanacak ve 
                    {selectedEmployees.length} çalışan için {actionType === 'CHECK_IN' ? 'giriş' : 'çıkış'} kaydı oluşturulacak.
                  </Alert>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      {/* Footer */}
      {!loading && results.length === 0 && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          {activeStep > 0 && (
            <Button onClick={handleBack} startIcon={<ArrowBack />}>
              Geri
            </Button>
          )}
          <Box flex={1} />
          
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained" 
              onClick={handleNext}
              disabled={
                (activeStep === 0 && selectedEmployees.length === 0) ||
                (activeStep === 1 && !assistedReason)
              }
            >
              İleri
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                bgcolor: actionType === 'CHECK_IN' ? 'success.main' : 'error.main',
                '&:hover': {
                  bgcolor: actionType === 'CHECK_IN' ? 'success.dark' : 'error.dark'
                }
              }}
              startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
            >
              {submitting ? 'Kaydediliyor...' : `${selectedEmployees.length} Kişi İçin Kaydet`}
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AssistedCheckIn;


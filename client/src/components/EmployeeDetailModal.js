import React, { useState, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  LinearProgress,
  TextField,
  Avatar,
  Chip,
  Stack,
  Slide,
  IconButton
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import {
  Person as PersonIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

// API Base URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Turkish public holidays calculation
const getTurkishPublicHolidays = (year) => {
  return new Set([
    `${year}-01-01`,
    `${year}-04-23`,
    `${year}-05-01`,
    `${year}-05-19`,
    `${year}-07-15`,
    `${year}-08-30`,
    `${year}-10-29`
  ]);
};

// Calculate leave days excluding Sundays and holidays
const calculateLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end < start) return 0;

  const holidays = getTurkishPublicHolidays(start.getFullYear());
  if (end.getFullYear() !== start.getFullYear()) {
    const nextYearHolidays = getTurkishPublicHolidays(end.getFullYear());
    nextYearHolidays.forEach(d => holidays.add(d));
  }

  let days = 0;
  const current = new Date(start);
  while (current <= end) {
    const isSunday = current.getDay() === 0;
    const iso = current.toISOString().slice(0, 10);
    const isHoliday = holidays.has(iso);
    if (!isSunday && !isHoliday) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EmployeeDetailModal = memo(({ open, onClose, employee, onLeaveUpdated, showNotification }) => {
  const [leaveRequest, setLeaveRequest] = useState({
    startDate: null,
    endDate: null,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!employee) return null;

  // Check leave entitlement
  const hasLeaveEntitlement = () => {
    if (!employee) return false;
    const entitled = employee.izinBilgileri?.hakEdilen || 0;
    const used = employee.izinBilgileri?.kullanilan || 0;
    const carryover = employee.izinBilgileri?.carryover || 0;
    return entitled + carryover - used > 0;
  };

  const handleLeaveRequest = async (isSpecial = false) => {
    try {
      if (!isSpecial && !hasLeaveEntitlement()) {
        setError('Bu çalışanın henüz izin hakkı bulunmamaktadır.');
        return;
      }

      setLoading(true);
      setError(null);

      const endpoint = isSpecial ? 
        `${API_BASE}/api/annual-leave/request/special` : 
        `${API_BASE}/api/annual-leave/request`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: employee._id,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          days: calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate),
          notes: leaveRequest.notes
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showNotification(
          isSpecial ? 
            'Özel izin talebi başarıyla oluşturuldu' : 
            'İzin talebi başarıyla oluşturuldu', 
          'success'
        );
        setLeaveRequest({ startDate: null, endDate: null, notes: '' });
        if (onLeaveUpdated) onLeaveUpdated();
        onClose();
      } else {
        setError(data.message || 'İzin talebi oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('İzin talebi hatası:', error);
      setError('İzin talebi oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }
    setError(null);
    setLeaveRequest({ startDate: null, endDate: null, notes: '' });
    onClose();
  };

  const utilizationRate = (() => {
    const entitled = employee.izinBilgileri?.hakEdilen || 0;
    const carryover = employee.izinBilgileri?.carryover || 0;
    const used = employee.izinBilgileri?.kullanilan || 0;
    const denom = entitled + carryover;
    return denom > 0 ? Math.min(100, Math.round((used / denom) * 100)) : 0;
  })();

  const requestedDays = calculateLeaveDays(leaveRequest.startDate, leaveRequest.endDate);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      disableEscapeKeyDown
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="3" cy="3" r="3"/>%3C/g%3E%3C/svg%3E")',
          opacity: 0.3
        }
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
              <PersonIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {employee.adSoyad}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Çalışan Detayları ve İzin Yönetimi
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleClose} 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 3, 
                border: '2px solid #e3f2fd',
                '&:hover': { 
                  borderColor: '#2196f3',
                  boxShadow: '0 8px 25px rgba(33, 150, 243, 0.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ bgcolor: '#2196f3', width: 40, height: 40 }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    Kişisel Bilgiler
                  </Typography>
                </Box>
                
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Ad Soyad
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {employee.adSoyad}
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Doğum Tarihi
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {employee.dogumTarihi ? new Date(employee.dogumTarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Yaş
                      </Typography>
                      <Chip 
                        label={`${employee.yas} yaş`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        İşe Giriş Tarihi
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {employee.iseGirisTarihi ? new Date(employee.iseGirisTarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Hizmet Yılı
                      </Typography>
                      <Chip 
                        label={`${employee.hizmetYili} yıl`} 
                        size="small" 
                        color={employee.hizmetYili >= 10 ? 'success' : employee.hizmetYili >= 5 ? 'warning' : 'default'}
                        variant="filled"
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Leave Information */}
          <Grid item xs={12} md={6}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 3, 
                border: '2px solid #e8f5e8',
                '&:hover': { 
                  borderColor: '#4caf50',
                  boxShadow: '0 8px 25px rgba(76, 175, 80, 0.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ bgcolor: '#4caf50', width: 40, height: 40 }}>
                    <CalendarIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#388e3c' }}>
                    İzin Durumu
                  </Typography>
                </Box>
                
                <Stack spacing={2.5}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Hak Edilen İzin
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
                        {employee.izinBilgileri?.hakEdilen || 0} gün
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Kullanılan İzin
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#f57c00' }}>
                        {employee.izinBilgileri?.kullanilan || 0} gün
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Kalan İzin
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: (employee.izinBilgileri?.kalan || 0) > 10 ? '#4caf50' : 
                                (employee.izinBilgileri?.kalan || 0) > 5 ? '#ff9800' : '#f44336'
                        }}
                      >
                        {employee.izinBilgileri?.kalan || 0} gün
                      </Typography>
                      <Chip
                        icon={<TrendingUpIcon sx={{ fontSize: '14px !important' }} />}
                        label={utilizationRate > 80 ? 'Yüksek Kullanım' : utilizationRate > 50 ? 'Orta Kullanım' : 'Düşük Kullanım'}
                        size="small"
                        color={utilizationRate > 80 ? 'error' : utilizationRate > 50 ? 'warning' : 'success'}
                        variant="filled"
                      />
                    </Box>
                  </Box>
                  
                  {typeof employee.izinBilgileri?.carryover === 'number' && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Geçen Yıllardan Devir
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            color: employee.izinBilgileri?.carryover > 0 ? '#4caf50' : 
                                   employee.izinBilgileri?.carryover < 0 ? '#f44336' : '#9c27b0'
                          }}
                        >
                          {employee.izinBilgileri?.carryover > 0 ? '+' : ''}{employee.izinBilgileri?.carryover} gün
                        </Typography>
                        {employee.izinBilgileri?.carryover !== 0 && (
                          <Chip
                            label={employee.izinBilgileri?.carryover > 0 ? 'Birikmiş İzin' : 'Borç'}
                            size="small"
                            color={employee.izinBilgileri?.carryover > 0 ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ height: 22, fontSize: '10px' }}
                          />
                        )}
                      </Box>
                      {employee.izinBilgileri?.carryover !== 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                          {employee.izinBilgileri?.carryover > 0 
                            ? 'Bu izinler mevcut yıl ile birlikte kullanılabilir'
                            : 'Bu tutar sonraki yılların hakkından düşülecek'}
                        </Typography>
                      )}
                    </Box>
                  )}
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom sx={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      İzin Kullanım Oranı
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={utilizationRate}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4
                        }
                      }}
                      color={utilizationRate > 80 ? 'error' : utilizationRate > 60 ? 'warning' : 'success'}
                    />
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        0%
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color={utilizationRate > 80 ? 'error.main' : utilizationRate > 60 ? 'warning.main' : 'success.main'}>
                        {utilizationRate}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        100%
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Leave History */}
          <Grid item xs={12}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 3, 
                border: '2px solid #fff3e0',
                '&:hover': { 
                  borderColor: '#ff9800',
                  boxShadow: '0 8px 25px rgba(255, 152, 0, 0.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ bgcolor: '#ff9800', width: 40, height: 40 }}>
                    <WorkIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f57c00' }}>
                    2017 - {new Date().getFullYear()} İzin Geçmişi
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  {(() => {
                    const items = [];
                    const startYear = 2017;
                    const endYear = new Date().getFullYear();
                    for (let y = startYear; y <= endYear; y++) {
                      const days = (employee.izinGecmisi && employee.izinGecmisi[y]) || 0;
                      items.push(
                        <Grid item xs={6} sm={4} md={2.4} key={y}>
                          <Card 
                            sx={{ 
                              textAlign: 'center', 
                              p: 2, 
                              backgroundColor: '#f8f9fa',
                              border: '2px solid #e9ecef',
                              borderRadius: 3,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                borderColor: '#ff9800',
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)'
                              }
                            }}
                          >
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                              {y}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ff9800', my: 1 }}>
                              {days}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              gün kullanıldı
                            </Typography>
                          </Card>
                        </Grid>
                      );
                    }
                    return items;
                  })()}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Leave Request Form */}
          <Grid item xs={12}>
            <Card 
              variant="outlined" 
              sx={{ 
                borderRadius: 3, 
                border: hasLeaveEntitlement() ? '2px solid #e8f5e8' : '2px solid #ffebee',
                '&:hover': { 
                  borderColor: hasLeaveEntitlement() ? '#4caf50' : '#f44336',
                  boxShadow: hasLeaveEntitlement() ? '0 8px 25px rgba(76, 175, 80, 0.1)' : '0 8px 25px rgba(244, 67, 54, 0.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: hasLeaveEntitlement() ? '#388e3c' : '#d32f2f', mb: 3 }}>
                  {hasLeaveEntitlement() ? 'Yeni İzin Talebi' : 'Özel İzin Talebi'}
                </Typography>
                
                {!hasLeaveEntitlement() && (
                  <Stack spacing={2} sx={{ mb: 3 }}>
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                      Bu çalışanın henüz izin hakkı bulunmamaktadır.
                    </Alert>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Özel izin kullanırsanız bu izin bir sonraki yılın hakkından düşecektir.
                    </Alert>
                  </Stack>
                )}
                
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <DatePicker
                        label="Başlangıç Tarihi"
                        value={leaveRequest.startDate}
                        onChange={(newValue) => setLeaveRequest(prev => ({ ...prev, startDate: newValue }))}
                        slotProps={{
                          textField: { 
                            fullWidth: true,
                            sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <DatePicker
                        label="Bitiş Tarihi"
                        value={leaveRequest.endDate}
                        onChange={(newValue) => setLeaveRequest(prev => ({ ...prev, endDate: newValue }))}
                        slotProps={{
                          textField: { 
                            fullWidth: true,
                            sx: { '& .MuiOutlinedInput-root': { borderRadius: 2 } }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Toplam Gün"
                        value={requestedDays}
                        disabled
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{
                          endAdornment: requestedDays > 0 && (
                            <Chip 
                              label={`${requestedDays} iş günü`} 
                              size="small" 
                              color="primary"
                              variant="filled"
                            />
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Notlar"
                        multiline
                        rows={3}
                        value={leaveRequest.notes}
                        onChange={(e) => setLeaveRequest(prev => ({ ...prev, notes: e.target.value }))}
                        fullWidth
                        placeholder="İzin sebebi veya özel notlar..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  </Grid>
                </LocalizationProvider>
                
                {!hasLeaveEntitlement() && requestedDays > 0 && (
                  <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                    Bu özel izin ({requestedDays} gün), onaylandığında bir sonraki yılın hakkından düşülecektir.
                  </Alert>
                )}
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, backgroundColor: '#fafafa' }}>
        <Button 
          onClick={handleClose}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          İptal
        </Button>
        
        {hasLeaveEntitlement() ? (
          <Button 
            onClick={() => handleLeaveRequest(false)}
            variant="contained" 
            disabled={!leaveRequest.startDate || !leaveRequest.endDate || loading || requestedDays <= 0}
            startIcon={loading && <CircularProgress size={20} />}
            sx={{ 
              borderRadius: 2,
              px: 4,
              py: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {loading ? 'İşleniyor...' : 'İzin Talebi Oluştur'}
          </Button>
        ) : (
          <Button 
            color="secondary"
            onClick={() => handleLeaveRequest(true)}
            variant="contained"
            disabled={!leaveRequest.startDate || !leaveRequest.endDate || loading || requestedDays <= 0}
            startIcon={loading && <CircularProgress size={20} />}
            sx={{ 
              borderRadius: 2,
              px: 4,
              py: 1,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {loading ? 'İşleniyor...' : 'Özel İzin Oluştur'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

export default EmployeeDetailModal;

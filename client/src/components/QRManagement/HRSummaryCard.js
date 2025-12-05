import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  CircularProgress,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Assessment,
  Download,
  AccessTime,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
  People,
  EventBusy,
  WorkOff,
  Timer,
  Calculate
} from '@mui/icons-material';
import moment from 'moment';
import { exportSimpleExcel } from '../../utils/exportUtils';
import api from '../../config/api';
import toast from 'react-hot-toast';

/**
 * 👩‍💼 HR Summary Card
 * İK için özet bilgiler ve hızlı raporlar
 */

const HRSummaryCard = ({ records = [], employees = [], date = moment() }) => {
  const [loading, setLoading] = useState(false);
  const [overtimeData, setOvertimeData] = useState([]);

  // Hesaplamalar
  const stats = React.useMemo(() => {
    const totalEmployees = employees.length;
    const presentToday = records.filter(r => r.checkIn?.time).length;
    const absentToday = totalEmployees - presentToday;
    
    // Geç kalanlar (08:30'dan sonra giriş)
    // NOT: Giriş yapan herkes değerlendirilir
    const lateArrivals = records.filter(r => {
      if (!r.checkIn?.time) return false;
      const checkInTime = moment(r.checkIn.time);
      // 08:30'dan sonra giriş yapanlar geç sayılır
      const lateThreshold = moment(r.checkIn.time).hour(8).minute(30).second(0);
      return checkInTime.isAfter(lateThreshold);
    });

    // Erken çıkanlar (17:30'dan önce çıkış)
    const earlyLeavers = records.filter(r => {
      if (!r.checkOut?.time) return false;
      const checkOutTime = moment(r.checkOut.time);
      return checkOutTime.hour() < 17 || (checkOutTime.hour() === 17 && checkOutTime.minute() < 30);
    });

    // Fazla mesai (17:30'dan sonra çıkış)
    const overtime = records.filter(r => {
      if (!r.checkOut?.time) return false;
      const checkOutTime = moment(r.checkOut.time);
      return checkOutTime.hour() > 17 || (checkOutTime.hour() === 17 && checkOutTime.minute() > 30);
    });

    // Eksik kayıtlar (giriş var, çıkış yok)
    const incompleteRecords = records.filter(r => r.checkIn?.time && !r.checkOut?.time);

    // Toplam çalışma saati
    let totalWorkMinutes = 0;
    records.forEach(r => {
      if (r.checkIn?.time && r.checkOut?.time) {
        const checkIn = moment(r.checkIn.time);
        const checkOut = moment(r.checkOut.time);
        totalWorkMinutes += checkOut.diff(checkIn, 'minutes');
      }
    });
    const avgWorkHours = presentToday > 0 ? (totalWorkMinutes / presentToday / 60).toFixed(1) : 0;

    // Devamsızlık oranı
    const attendanceRate = totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(1) : 0;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      lateArrivals: lateArrivals.length,
      earlyLeavers: earlyLeavers.length,
      overtime: overtime.length,
      incompleteRecords: incompleteRecords.length,
      totalWorkMinutes,
      avgWorkHours,
      attendanceRate,
      lateList: lateArrivals.slice(0, 5),
      overtimeList: overtime.slice(0, 5)
    };
  }, [records, employees]);

  // Bordro Özeti Export
  const handleExportPayrollSummary = () => {
    try {
      // Hem giriş hem çıkış yapılmış kayıtları filtrele
      const completedRecords = records.filter(r => r.checkIn?.time && r.checkOut?.time);
      
      if (completedRecords.length === 0) {
        toast.error('Bordro için tamamlanmış kayıt bulunamadı. Çıkış yapılmış kayıt gerekli.');
        return;
      }

      const payrollData = completedRecords.map(r => {
        const checkIn = moment(r.checkIn.time);
        const checkOut = moment(r.checkOut.time);
        const workMinutes = checkOut.diff(checkIn, 'minutes');
        const workHours = (workMinutes / 60).toFixed(2);
        
        // Fazla mesai hesapla (8.5 saat üzeri)
        const overtimeMinutes = Math.max(0, workMinutes - 510); // 510 = 8.5 saat
        const overtimeHours = (overtimeMinutes / 60).toFixed(2);

        return {
          'TC Kimlik': r.employeeId?.tcNo || '-',
          'Ad Soyad': r.employeeId?.adSoyad || '-',
          'Sicil No': r.employeeId?.employeeId || '-',
          'Departman': r.employeeId?.departman || '-',
          'Giriş Tarihi': checkIn.format('DD.MM.YYYY'),
          'Giriş Saati': checkIn.format('HH:mm'),
          'Çıkış Saati': checkOut.format('HH:mm'),
          'Çalışma Süresi (Saat)': workHours,
          'Fazla Mesai (Saat)': overtimeHours,
          'Geç Kalma (dk)': checkIn.hour() > 8 || (checkIn.hour() === 8 && checkIn.minute() > 30) 
            ? Math.max(0, checkIn.diff(checkIn.clone().hour(8).minute(30), 'minutes'))
            : 0,
          'Erken Çıkış (dk)': checkOut.hour() < 17 || (checkOut.hour() === 17 && checkOut.minute() < 30)
            ? Math.max(0, checkOut.clone().hour(17).minute(30).diff(checkOut, 'minutes'))
            : 0
        };
      });

      exportSimpleExcel(payrollData, `bordro_ozet_${date.format('YYYY-MM-DD')}`);
      toast.success(`Bordro özeti indirildi (${payrollData.length} kayıt)`);
    } catch (error) {
      console.error('Bordro export hatası:', error);
      toast.error('Export başarısız: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Devamsızlık Raporu Export
  const handleExportAbsenteeReport = () => {
    try {
      const presentIds = new Set(records.map(r => r.employeeId?._id?.toString()));
      const absentEmployees = employees.filter(e => !presentIds.has(e._id?.toString()));

      const absentData = absentEmployees.map(e => ({
        'TC Kimlik': e.tcNo || '-',
        'Ad Soyad': e.adSoyad || '-',
        'Sicil No': e.employeeId || '-',
        'Departman': e.departman || '-',
        'Pozisyon': e.pozisyon || '-',
        'Lokasyon': e.lokasyon || '-',
        'Tarih': date.format('DD.MM.YYYY'),
        'Durum': 'Gelmedi'
      }));

      exportSimpleExcel(absentData, `devamsizlik_${date.format('YYYY-MM-DD')}`);
      toast.success('Devamsızlık raporu indirildi');
    } catch (error) {
      toast.error('Export başarısız');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Assessment color="primary" />
          <Typography variant="h6" fontWeight="bold">
            İK Özet Paneli
          </Typography>
        </Box>
        <Chip 
          label={date.format('DD MMMM YYYY')}
          icon={<Schedule />}
          variant="outlined"
        />
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: 'success.light', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <People color="success" />
              <Typography variant="h5" fontWeight="bold" color="success.dark">
                {stats.presentToday}
              </Typography>
              <Typography variant="caption">Gelen</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: 'error.light', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <EventBusy color="error" />
              <Typography variant="h5" fontWeight="bold" color="error.dark">
                {stats.absentToday}
              </Typography>
              <Typography variant="caption">Gelmeyen</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: 'warning.light', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <AccessTime color="warning" />
              <Typography variant="h5" fontWeight="bold" color="warning.dark">
                {stats.lateArrivals}
              </Typography>
              <Typography variant="caption">Geç Kalan</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: 'info.light', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Timer color="info" />
              <Typography variant="h5" fontWeight="bold" color="info.dark">
                {stats.overtime}
              </Typography>
              <Typography variant="caption">Mesai</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: 'grey.100', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <Calculate />
              <Typography variant="h5" fontWeight="bold">
                {stats.avgWorkHours}s
              </Typography>
              <Typography variant="caption">Ort. Çalışma</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: stats.attendanceRate >= 90 ? 'success.light' : stats.attendanceRate >= 70 ? 'warning.light' : 'error.light', textAlign: 'center' }}>
            <CardContent sx={{ py: 2 }}>
              <TrendingUp />
              <Typography variant="h5" fontWeight="bold">
                %{stats.attendanceRate}
              </Typography>
              <Typography variant="caption">Devam Oranı</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Alerts */}
      {stats.incompleteRecords > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
          <strong>{stats.incompleteRecords}</strong> çalışanın çıkış kaydı eksik!
        </Alert>
      )}

      {/* Quick Reports */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Hızlı Raporlar
      </Typography>
      <Grid container spacing={1} mb={2}>
        <Grid item xs={6} sm={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportPayrollSummary}
            size="small"
          >
            Bordro Özeti
          </Button>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportAbsenteeReport}
            size="small"
          >
            Devamsızlık
          </Button>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {
              const lateData = stats.lateList.map(r => ({
                'Ad Soyad': r.employeeId?.adSoyad || '-',
                'Giriş Saati': r.checkIn?.time ? moment(r.checkIn?.time).format('HH:mm') : '-',
                'Geç Kalma (dk)': r.checkIn?.time ? Math.max(0, moment(r.checkIn?.time).diff(moment(r.checkIn?.time).hour(8).minute(30), 'minutes')) : 0
              }));
              if (lateData.length === 0) {
                toast.error('Geç kalan bulunmuyor');
                return;
              }
              exportSimpleExcel(lateData, `gec_kalanlar_${date.format('YYYY-MM-DD')}`);
              toast.success('Geç kalanlar listesi indirildi');
            }}
            size="small"
          >
            Geç Kalanlar
          </Button>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {
              if (stats.overtimeList.length === 0) {
                // Çıkış yapan var mı kontrol et
                const hasCheckout = records.some(r => r.checkOut?.time);
                if (!hasCheckout) {
                  toast.error('Fazla mesai hesaplamak için çıkış kaydı gerekli. Henüz çıkış yapan yok.');
                } else {
                  toast.error('17:30 sonrası çıkış yapan bulunmuyor');
                }
                return;
              }
              const otData = stats.overtimeList.map(r => ({
                'Ad Soyad': r.employeeId?.adSoyad || '-',
                'Çıkış Saati': r.checkOut?.time ? moment(r.checkOut?.time).format('HH:mm') : '-',
                'Fazla Mesai (dk)': r.checkOut?.time ? Math.max(0, moment(r.checkOut?.time).diff(moment(r.checkOut?.time).hour(17).minute(30), 'minutes')) : 0
              }));
              exportSimpleExcel(otData, `fazla_mesai_${date.format('YYYY-MM-DD')}`);
              toast.success('Fazla mesai listesi indirildi');
            }}
            size="small"
          >
            Fazla Mesai
          </Button>
        </Grid>
      </Grid>

      {/* Late & Overtime Lists */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" color="text.secondary">
            Son geç kalanlar:
          </Typography>
          <List dense>
            {stats.lateList.map((r, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                    {r.employeeId?.adSoyad?.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={r.employeeId?.adSoyad}
                  secondary={`Giriş: ${moment(r.checkIn?.time).format('HH:mm')}`}
                />
                <Chip 
                  label={`+${moment(r.checkIn?.time).diff(moment(r.checkIn?.time).hour(8).minute(30), 'minutes')}dk`}
                  size="small"
                  color="warning"
                />
              </ListItem>
            ))}
            {stats.lateList.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Geç kalan yok 🎉
              </Typography>
            )}
          </List>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="caption" color="text.secondary">
            Fazla mesai yapanlar:
          </Typography>
          <List dense>
            {stats.overtimeList.map((r, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                    {r.employeeId?.adSoyad?.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={r.employeeId?.adSoyad}
                  secondary={`Çıkış: ${moment(r.checkOut?.time).format('HH:mm')}`}
                />
                <Chip 
                  label={`+${moment(r.checkOut?.time).diff(moment(r.checkOut?.time).hour(17).minute(30), 'minutes')}dk`}
                  size="small"
                  color="info"
                />
              </ListItem>
            ))}
            {stats.overtimeList.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Fazla mesai yok
              </Typography>
            )}
          </List>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default HRSummaryCard;

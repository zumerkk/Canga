import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  TextField,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  Stack,
  Badge
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
  Calculate,
  DateRange,
  Today,
  CalendarMonth,
  Refresh,
  ExpandMore,
  ExpandLess,
  FilterList
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import 'moment/locale/tr';
import { exportSimpleExcel, calculateNetOvertime, formatNetOvertime } from '../../utils/exportUtils';
import api from '../../config/api';
import toast from 'react-hot-toast';

moment.locale('tr');

/**
 * 👩‍💼 HR Summary Card - Gelişmiş Tarih Aralığı Seçimi ile
 * İK için özet bilgiler ve hızlı raporlar
 */

// Tarih aralığı seçenekleri
const DATE_RANGE_OPTIONS = {
  TODAY: 'TODAY',
  YESTERDAY: 'YESTERDAY',
  THIS_WEEK: 'THIS_WEEK',
  LAST_WEEK: 'LAST_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  LAST_MONTH: 'LAST_MONTH',
  CUSTOM: 'CUSTOM'
};

const HRSummaryCard = ({ 
  records: externalRecords = [], 
  employees: externalEmployees = [], 
  date: externalDate = moment() 
}) => {
  // Tarih Aralığı State
  const [dateRangeType, setDateRangeType] = useState(DATE_RANGE_OPTIONS.TODAY);
  const [startDate, setStartDate] = useState(moment().startOf('day'));
  const [endDate, setEndDate] = useState(moment().endOf('day'));
  const [showCustomRange, setShowCustomRange] = useState(false);
  
  // Veri State
  const [records, setRecords] = useState(externalRecords);
  const [employees, setEmployees] = useState(externalEmployees);
  const [loading, setLoading] = useState(false);
  const [useExternalData, setUseExternalData] = useState(true);
  
  // Filtre State
  const [selectedBranch, setSelectedBranch] = useState('TÜM');
  const [showFilters, setShowFilters] = useState(false);

  // 🕐 MESAI SAATLERİ: 08:00 - 18:00
  const WORK_START_HOUR = 8;
  const WORK_START_MINUTE = 0;
  const WORK_END_HOUR = 18;
  const WORK_END_MINUTE = 0;

  // Tarih aralığını hesapla
  const calculateDateRange = useCallback((rangeType) => {
    let start, end;
    
    switch (rangeType) {
      case DATE_RANGE_OPTIONS.TODAY:
        start = moment().startOf('day');
        end = moment().endOf('day');
        break;
      case DATE_RANGE_OPTIONS.YESTERDAY:
        start = moment().subtract(1, 'day').startOf('day');
        end = moment().subtract(1, 'day').endOf('day');
        break;
      case DATE_RANGE_OPTIONS.THIS_WEEK:
        start = moment().startOf('isoWeek');
        end = moment().endOf('isoWeek');
        break;
      case DATE_RANGE_OPTIONS.LAST_WEEK:
        start = moment().subtract(1, 'week').startOf('isoWeek');
        end = moment().subtract(1, 'week').endOf('isoWeek');
        break;
      case DATE_RANGE_OPTIONS.THIS_MONTH:
        start = moment().startOf('month');
        end = moment().endOf('month');
        break;
      case DATE_RANGE_OPTIONS.LAST_MONTH:
        start = moment().subtract(1, 'month').startOf('month');
        end = moment().subtract(1, 'month').endOf('month');
        break;
      case DATE_RANGE_OPTIONS.CUSTOM:
        // Custom durumunda mevcut değerleri koru
        return { start: startDate, end: endDate };
      default:
        start = moment().startOf('day');
        end = moment().endOf('day');
    }
    
    return { start, end };
  }, [startDate, endDate]);

  // Tarih aralığı değiştiğinde
  const handleDateRangeChange = (rangeType) => {
    setDateRangeType(rangeType);
    const { start, end } = calculateDateRange(rangeType);
    setStartDate(start);
    setEndDate(end);
    setShowCustomRange(rangeType === DATE_RANGE_OPTIONS.CUSTOM);
    setUseExternalData(false);
  };

  // Veri çekme fonksiyonu
  const fetchData = useCallback(async () => {
    if (useExternalData && dateRangeType === DATE_RANGE_OPTIONS.TODAY) {
      // Bugün seçiliyse ve dış veri varsa, dış veriyi kullan
      setRecords(externalRecords);
      setEmployees(externalEmployees);
      return;
    }

    setLoading(true);
    try {
      // Tarih aralığına göre kayıtları çek
      const params = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      };
      
      if (selectedBranch !== 'TÜM') {
        params.branch = selectedBranch;
      }

      const [recordsRes, employeesRes] = await Promise.all([
        api.get('/api/attendance/date-range', { params }),
        api.get('/api/employees', { params: { durum: 'all', limit: 1000 } })
      ]);

      const fetchedRecords = recordsRes.data?.records || [];
      const fetchedEmployees = employeesRes.data?.data || [];
      
      setRecords(fetchedRecords);
      setEmployees(Array.isArray(fetchedEmployees) ? fetchedEmployees.filter(e => e.durum === 'AKTIF') : []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      
      // API yoksa fallback olarak günlük API'yi dene
      try {
        if (startDate.isSame(endDate, 'day')) {
          const response = await api.get('/api/attendance/daily', {
            params: { 
              date: startDate.format('YYYY-MM-DD'),
              branch: selectedBranch !== 'TÜM' ? selectedBranch : undefined
            }
          });
          setRecords(response.data?.records || []);
        }
      } catch (fallbackError) {
        console.error('Fallback veri çekme hatası:', fallbackError);
        toast.error('Veri yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedBranch, useExternalData, externalRecords, externalEmployees, dateRangeType]);

  // Tarih veya filtre değiştiğinde veri çek
  useEffect(() => {
    if (!useExternalData) {
      fetchData();
    }
  }, [startDate, endDate, selectedBranch, useExternalData]);

  // External data değiştiğinde güncelle
  useEffect(() => {
    if (useExternalData && dateRangeType === DATE_RANGE_OPTIONS.TODAY) {
      setRecords(externalRecords);
      setEmployees(externalEmployees);
    }
  }, [externalRecords, externalEmployees, useExternalData, dateRangeType]);

  // Hesaplamalar
  const stats = React.useMemo(() => {
    const totalEmployees = employees.length;
    const presentCount = records.filter(r => r.checkIn?.time).length;
    
    // Benzersiz çalışanları say (birden fazla gün için)
    const uniquePresentIds = new Set(records.filter(r => r.checkIn?.time).map(r => r.employeeId?._id?.toString()));
    const uniquePresentCount = uniquePresentIds.size;
    
    // Gün sayısını hesapla
    const dayCount = Math.max(1, endDate.diff(startDate, 'days') + 1);
    const isMultipleDays = dayCount > 1;
    
    // Geç kalanlar (08:00'dan sonra giriş)
    const lateArrivals = records.filter(r => {
      if (!r.checkIn?.time) return false;
      if (r.isLate === true) return true;
      const checkInTime = moment(r.checkIn.time);
      const lateThreshold = moment(r.checkIn.time).hour(WORK_START_HOUR).minute(WORK_START_MINUTE).second(0);
      return checkInTime.isAfter(lateThreshold);
    });

    // Erken çıkanlar (18:00'dan önce çıkış)
    const earlyLeavers = records.filter(r => {
      if (!r.checkOut?.time) return false;
      if (r.isEarlyLeave === true) return true;
      const checkOutTime = moment(r.checkOut.time);
      return checkOutTime.hour() < WORK_END_HOUR || (checkOutTime.hour() === WORK_END_HOUR && checkOutTime.minute() < WORK_END_MINUTE);
    });

    // Eksik çalışma
    const shortShift = records.filter(r => {
      if (r.isShortShift === true || r.status === 'SHORT_SHIFT') return true;
      const isLate = lateArrivals.some(lr => lr._id === r._id);
      const isEarly = earlyLeavers.some(el => el._id === r._id);
      return isLate && isEarly;
    });

    // Fazla mesai (18:00'dan sonra çıkış VEYA manuel fazla mesai girilmiş)
    // 🆕 Manuel fazla mesai varsa sadece onu kullan, otomatik hesaplama yapma
    const overtime = records.filter(r => {
      // Manuel fazla mesai girilmişse, bu kişi fazla mesai yapmış sayılır
      if (r.manualOvertimeMinutes > 0) return true;
      
      // Manuel yoksa, çıkış saatine bak
      if (!r.checkOut?.time) return false;
      const checkOutTime = moment(r.checkOut.time);
      return checkOutTime.hour() > WORK_END_HOUR || (checkOutTime.hour() === WORK_END_HOUR && checkOutTime.minute() > WORK_END_MINUTE);
    });

    // Eksik kayıtlar
    const incompleteRecords = records.filter(r => r.checkIn?.time && !r.checkOut?.time);

    // Toplam çalışma saati
    let totalWorkMinutes = 0;
    let totalLateMinutes = 0;
    let totalEarlyMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalManualOvertimeMinutes = 0;
    let totalAutoOvertimeMinutes = 0;

    records.forEach(r => {
      if (r.checkIn?.time && r.checkOut?.time) {
        const checkIn = moment(r.checkIn.time);
        const checkOut = moment(r.checkOut.time);
        totalWorkMinutes += checkOut.diff(checkIn, 'minutes');
      }
      totalLateMinutes += r.lateMinutes || 0;
      totalEarlyMinutes += r.earlyLeaveMinutes || 0;
      
      // 🆕 Manuel fazla mesai varsa SADECE onu kullan, otomatik hesaplamayı KULLANMA
      // Manuel yoksa otomatik hesaplamayı kullan
      const manualOT = r.manualOvertimeMinutes || 0;
      const autoOT = r.overtimeMinutes || 0;
      
      if (manualOT > 0) {
        // Manuel girilmişse sadece manuel değeri al
        totalOvertimeMinutes += manualOT;
        totalManualOvertimeMinutes += manualOT;
      } else {
        // Manuel yoksa otomatik hesaplamayı kullan
        totalOvertimeMinutes += autoOT;
        totalAutoOvertimeMinutes += autoOT;
      }
    });

    const avgWorkHours = presentCount > 0 ? (totalWorkMinutes / presentCount / 60).toFixed(1) : 0;
    
    // Ortalama devam oranı
    const attendanceRate = totalEmployees > 0 && dayCount > 0 
      ? ((presentCount / (totalEmployees * dayCount)) * 100).toFixed(1) 
      : 0;

    return {
      totalEmployees,
      presentCount,
      uniquePresentCount,
      absentCount: isMultipleDays ? '-' : totalEmployees - presentCount,
      lateArrivals: lateArrivals.length,
      earlyLeavers: earlyLeavers.length,
      shortShift: shortShift.length,
      overtime: overtime.length,
      incompleteRecords: incompleteRecords.length,
      totalWorkMinutes,
      totalLateMinutes,
      totalEarlyMinutes,
      totalOvertimeMinutes,
      totalManualOvertimeMinutes,
      totalAutoOvertimeMinutes,
      avgWorkHours,
      attendanceRate,
      dayCount,
      isMultipleDays,
      lateList: lateArrivals.slice(0, 10),
      earlyLeaveList: earlyLeavers.slice(0, 10),
      shortShiftList: shortShift.slice(0, 10),
      overtimeList: overtime.slice(0, 10)
    };
  }, [records, employees, startDate, endDate]);

  // Tarih aralığı label'ı
  const getDateRangeLabel = () => {
    if (dateRangeType === DATE_RANGE_OPTIONS.CUSTOM || stats.isMultipleDays) {
      return `${startDate.format('DD MMM')} - ${endDate.format('DD MMM YYYY')}`;
    }
    return startDate.format('DD MMMM YYYY');
  };

  // Export fonksiyonları - tarih aralığına göre güncellendi
  const handleExportPayrollSummary = () => {
    try {
      const completedRecords = records.filter(r => r.checkIn?.time && r.checkOut?.time);
      
      if (completedRecords.length === 0) {
        toast.error('Bordro için tamamlanmış kayıt bulunamadı.');
        return;
      }

      const payrollData = completedRecords.map(r => {
        const checkIn = moment(r.checkIn.time);
        const checkOut = moment(r.checkOut.time);
        const workMinutes = checkOut.diff(checkIn, 'minutes');
        const workHours = (workMinutes / 60).toFixed(2);
        
        const overtimeMinutes = Math.max(0, workMinutes - 600);
        const expectedStart = checkIn.clone().hour(WORK_START_HOUR).minute(WORK_START_MINUTE);
        const lateMinutes = r.lateMinutes || (checkIn.isAfter(expectedStart) ? checkIn.diff(expectedStart, 'minutes') : 0);
        const expectedEnd = checkOut.clone().hour(WORK_END_HOUR).minute(WORK_END_MINUTE);
        const earlyLeaveMinutes = r.earlyLeaveMinutes || (checkOut.isBefore(expectedEnd) ? expectedEnd.diff(checkOut, 'minutes') : 0);
        const manualOvertime = r.manualOvertimeMinutes || 0;
        const netOvertime = calculateNetOvertime(r);

        let durum = 'Normal';
        if (lateMinutes > 0 && earlyLeaveMinutes > 0) durum = '⚠️ Eksik Çalışma';
        else if (lateMinutes > 0) durum = '⏰ Geç Kaldı';
        else if (earlyLeaveMinutes > 0) durum = '🚪 Erken Çıkış';
        else if (netOvertime > 0) durum = '💪 Fazla Mesai';

        return {
          'TC Kimlik': r.employeeId?.tcNo || '-',
          'Ad Soyad': r.employeeId?.adSoyad || '-',
          'Sicil No': r.employeeId?.employeeId || '-',
          'Departman': r.employeeId?.departman || '-',
          'Tarih': checkIn.format('DD.MM.YYYY'),
          'Giriş Saati': checkIn.format('HH:mm'),
          'Çıkış Saati': checkOut.format('HH:mm'),
          'Çalışma Süresi (Saat)': workHours,
          'Geç Kalma (dk)': lateMinutes,
          'Erken Çıkış (dk)': earlyLeaveMinutes,
          'Otomatik Fazla Mesai (dk)': overtimeMinutes,
          'Manuel Fazla Mesai (dk)': manualOvertime,
          'Eksik/Fazla Mesai Süresi': formatNetOvertime(netOvertime),
          'Eksik/Fazla (dk)': netOvertime,
          'Durum': durum
        };
      });

      const fileName = stats.isMultipleDays 
        ? `bordro_ozet_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}`
        : `bordro_ozet_${startDate.format('YYYY-MM-DD')}`;
      
      exportSimpleExcel(payrollData, fileName);
      toast.success(`Bordro özeti indirildi (${payrollData.length} kayıt)`);
    } catch (error) {
      console.error('Bordro export hatası:', error);
      toast.error('Export başarısız');
    }
  };

  const handleExportAbsenteeReport = () => {
    try {
      const presentIds = new Set(records.map(r => r.employeeId?._id?.toString()));
      const absentEmployees = employees.filter(e => !presentIds.has(e._id?.toString()));
      const FULL_DAY_MISSING_MINUTES = -540;

      const absentData = absentEmployees.map(e => ({
        'TC Kimlik': e.tcNo || '-',
        'Ad Soyad': e.adSoyad || '-',
        'Sicil No': e.employeeId || '-',
        'Departman': e.departman || '-',
        'Pozisyon': e.pozisyon || '-',
        'Lokasyon': e.lokasyon || '-',
        'Tarih Aralığı': getDateRangeLabel(),
        'Eksik/Fazla Mesai Süresi': '-9s 0dk (Tam gün)',
        'Eksik/Fazla (dk)': FULL_DAY_MISSING_MINUTES,
        'Durum': 'Gelmedi'
      }));

      const fileName = stats.isMultipleDays 
        ? `devamsizlik_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}`
        : `devamsizlik_${startDate.format('YYYY-MM-DD')}`;

      exportSimpleExcel(absentData, fileName);
      toast.success('Devamsızlık raporu indirildi');
    } catch (error) {
      toast.error('Export başarısız');
    }
  };

  const handleExportLateReport = () => {
    const lateData = stats.lateList.map(r => {
      const checkIn = moment(r.checkIn?.time);
      const checkOut = r.checkOut?.time ? moment(r.checkOut.time) : null;
      const expectedStart = checkIn.clone().hour(WORK_START_HOUR).minute(WORK_START_MINUTE);
      const lateMinutes = r.lateMinutes || (checkIn.isAfter(expectedStart) ? checkIn.diff(expectedStart, 'minutes') : 0);
      const netOvertime = calculateNetOvertime(r);
      
      return {
        'Ad Soyad': r.employeeId?.adSoyad || '-',
        'TC Kimlik': r.employeeId?.tcNo || '-',
        'Sicil No': r.employeeId?.employeeId || '-',
        'Departman': r.employeeId?.departman || '-',
        'Tarih': checkIn.format('DD.MM.YYYY'),
        'Giriş Saati': checkIn.format('HH:mm'),
        'Çıkış Saati': checkOut ? checkOut.format('HH:mm') : '-',
        'Geç Kalma (dk)': lateMinutes,
        'Eksik/Fazla Mesai Süresi': formatNetOvertime(netOvertime),
        'Eksik/Fazla (dk)': netOvertime
      };
    });
    
    if (lateData.length === 0) {
      toast.error('08:00 sonrası giriş yapan bulunmuyor');
      return;
    }
    
    const fileName = stats.isMultipleDays 
      ? `gec_kalanlar_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}`
      : `gec_kalanlar_${startDate.format('YYYY-MM-DD')}`;
    
    exportSimpleExcel(lateData, fileName);
    toast.success('Geç kalanlar listesi indirildi');
  };

  const handleExportShortShiftReport = () => {
    if (stats.earlyLeaveList.length === 0) {
      toast.error('Eksik mesai yapan bulunmuyor');
      return;
    }
    
    const shortData = stats.earlyLeaveList.map(r => {
      const checkIn = moment(r.checkIn?.time);
      const checkOut = moment(r.checkOut?.time);
      const expectedStart = checkIn.clone().hour(WORK_START_HOUR).minute(WORK_START_MINUTE);
      const expectedEnd = checkOut.clone().hour(WORK_END_HOUR).minute(WORK_END_MINUTE);
      const lateMinutes = r.lateMinutes || (checkIn.isAfter(expectedStart) ? checkIn.diff(expectedStart, 'minutes') : 0);
      const earlyMinutes = r.earlyLeaveMinutes || (checkOut.isBefore(expectedEnd) ? expectedEnd.diff(checkOut, 'minutes') : 0);
      const netOvertime = calculateNetOvertime(r);
      
      return {
        'Ad Soyad': r.employeeId?.adSoyad || '-',
        'TC Kimlik': r.employeeId?.tcNo || '-',
        'Sicil No': r.employeeId?.employeeId || '-',
        'Departman': r.employeeId?.departman || '-',
        'Tarih': checkIn.format('DD.MM.YYYY'),
        'Giriş Saati': checkIn.format('HH:mm'),
        'Çıkış Saati': checkOut.format('HH:mm'),
        'Geç Kalma (dk)': lateMinutes,
        'Erken Çıkış (dk)': earlyMinutes,
        'Toplam Eksik (dk)': lateMinutes + earlyMinutes,
        'Eksik/Fazla Mesai Süresi': formatNetOvertime(netOvertime),
        'Eksik/Fazla (dk)': netOvertime
      };
    });
    
    const fileName = stats.isMultipleDays 
      ? `eksik_mesai_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}`
      : `eksik_mesai_${startDate.format('YYYY-MM-DD')}`;
    
    exportSimpleExcel(shortData, fileName);
    toast.success('Eksik mesai listesi indirildi');
  };

  const handleExportOvertimeReport = () => {
    if (stats.overtimeList.length === 0) {
      toast.error('Fazla mesai yapan bulunmuyor');
      return;
    }
    
    const otData = stats.overtimeList.map(r => {
      const checkIn = moment(r.checkIn?.time);
      const checkOut = moment(r.checkOut?.time);
      const expectedEnd = checkOut.clone().hour(WORK_END_HOUR).minute(WORK_END_MINUTE);
      const overtimeMinutes = checkOut.isAfter(expectedEnd) ? checkOut.diff(expectedEnd, 'minutes') : 0;
      const manualOvertime = r.manualOvertimeMinutes || 0;
      const netOvertime = calculateNetOvertime(r);
      
      return {
        'Ad Soyad': r.employeeId?.adSoyad || '-',
        'TC Kimlik': r.employeeId?.tcNo || '-',
        'Sicil No': r.employeeId?.employeeId || '-',
        'Departman': r.employeeId?.departman || '-',
        'Tarih': checkIn.format('DD.MM.YYYY'),
        'Giriş Saati': checkIn.format('HH:mm'),
        'Çıkış Saati': checkOut.format('HH:mm'),
        'Otomatik Fazla Mesai (dk)': overtimeMinutes,
        'Manuel Fazla Mesai (dk)': manualOvertime,
        'Toplam Fazla Mesai (dk)': overtimeMinutes + manualOvertime,
        'Eksik/Fazla Mesai Süresi': formatNetOvertime(netOvertime),
        'Eksik/Fazla (dk)': netOvertime
      };
    });
    
    const fileName = stats.isMultipleDays 
      ? `fazla_mesai_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}`
      : `fazla_mesai_${startDate.format('YYYY-MM-DD')}`;
    
    exportSimpleExcel(otData, fileName);
    toast.success('Fazla mesai listesi indirildi');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="tr">
      <Paper sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Assessment color="primary" />
            <Typography variant="h6" fontWeight="bold">
              İK Özet Paneli
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={getDateRangeLabel()}
              icon={<DateRange />}
              color={stats.isMultipleDays ? 'primary' : 'default'}
              variant="outlined"
            />
            {stats.isMultipleDays && (
              <Chip 
                label={`${stats.dayCount} gün`}
                size="small"
                color="info"
              />
            )}
            <IconButton 
              size="small" 
              onClick={() => {
                setUseExternalData(false);
                fetchData();
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Box>
        </Box>

        {/* Tarih Aralığı Seçimi */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CalendarMonth color="primary" />
            <Typography variant="subtitle2" fontWeight="bold">
              Tarih Aralığı Seç
            </Typography>
          </Box>
          
          {/* Hızlı Seçim Butonları */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
            <Button 
              variant={dateRangeType === DATE_RANGE_OPTIONS.TODAY ? 'contained' : 'outlined'}
              size="small"
              startIcon={<Today />}
              onClick={() => handleDateRangeChange(DATE_RANGE_OPTIONS.TODAY)}
            >
              Bugün
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGE_OPTIONS.YESTERDAY ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange(DATE_RANGE_OPTIONS.YESTERDAY)}
            >
              Dün
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGE_OPTIONS.THIS_WEEK ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange(DATE_RANGE_OPTIONS.THIS_WEEK)}
            >
              Bu Hafta
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGE_OPTIONS.LAST_WEEK ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange(DATE_RANGE_OPTIONS.LAST_WEEK)}
            >
              Geçen Hafta
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGE_OPTIONS.THIS_MONTH ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange(DATE_RANGE_OPTIONS.THIS_MONTH)}
            >
              Bu Ay
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGE_OPTIONS.LAST_MONTH ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleDateRangeChange(DATE_RANGE_OPTIONS.LAST_MONTH)}
            >
              Geçen Ay
            </Button>
            <Button 
              variant={dateRangeType === DATE_RANGE_OPTIONS.CUSTOM ? 'contained' : 'outlined'}
              size="small"
              color="secondary"
              startIcon={<DateRange />}
              onClick={() => handleDateRangeChange(DATE_RANGE_OPTIONS.CUSTOM)}
            >
              Özel Aralık
            </Button>
          </Stack>

          {/* Özel Tarih Seçimi */}
          <Collapse in={showCustomRange || dateRangeType === DATE_RANGE_OPTIONS.CUSTOM}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Başlangıç Tarihi"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setDateRangeType(DATE_RANGE_OPTIONS.CUSTOM);
                    setUseExternalData(false);
                  }}
                  maxDate={endDate}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Bitiş Tarihi"
                  value={endDate}
                  onChange={(date) => {
                    setEndDate(date);
                    setDateRangeType(DATE_RANGE_OPTIONS.CUSTOM);
                    setUseExternalData(false);
                  }}
                  minDate={startDate}
                  maxDate={moment()}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Şube</InputLabel>
                  <Select
                    value={selectedBranch}
                    label="Şube"
                    onChange={(e) => {
                      setSelectedBranch(e.target.value);
                      setUseExternalData(false);
                    }}
                  >
                    <MenuItem value="TÜM">Tüm Şubeler</MenuItem>
                    <MenuItem value="MERKEZ">🏭 Merkez</MenuItem>
                    <MenuItem value="IŞIL">🏢 Işıl</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Loading Indicator */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* İstatistikler */}
        {!loading && (
          <>
            {/* Quick Stats */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ bgcolor: 'primary.light', textAlign: 'center' }}>
                  <CardContent sx={{ py: 2 }}>
                    <People color="primary" />
                    <Typography variant="h5" fontWeight="bold" color="primary.dark">
                      {stats.presentCount}
                    </Typography>
                    <Typography variant="caption">
                      {stats.isMultipleDays ? 'Toplam Giriş' : 'Gelen'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              {!stats.isMultipleDays && (
                <Grid item xs={6} sm={4} md={2}>
                  <Card sx={{ bgcolor: 'error.light', textAlign: 'center' }}>
                    <CardContent sx={{ py: 2 }}>
                      <EventBusy color="error" />
                      <Typography variant="h5" fontWeight="bold" color="error.dark">
                        {stats.absentCount}
                      </Typography>
                      <Typography variant="caption">Gelmeyen</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              <Grid item xs={6} sm={4} md={2}>
                <Tooltip title="08:00'dan sonra giriş yapanlar" arrow>
                  <Card sx={{ bgcolor: 'warning.light', textAlign: 'center' }}>
                    <CardContent sx={{ py: 2 }}>
                      <AccessTime color="warning" />
                      <Typography variant="h5" fontWeight="bold" color="warning.dark">
                        {stats.lateArrivals}
                      </Typography>
                      <Typography variant="caption">⏰ Geç Kaldı</Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Tooltip title="18:00'dan önce çıkış yapanlar" arrow>
                  <Card sx={{ bgcolor: '#ffcdd2', textAlign: 'center' }}>
                    <CardContent sx={{ py: 2 }}>
                      <Warning color="error" />
                      <Typography variant="h5" fontWeight="bold" color="error.dark">
                        {stats.earlyLeavers}
                      </Typography>
                      <Typography variant="caption">⚠️ Eksik Mesai</Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ bgcolor: 'info.light', textAlign: 'center' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Timer color="info" />
                    <Typography variant="h5" fontWeight="bold" color="info.dark">
                      {stats.overtime}
                    </Typography>
                    <Typography variant="caption">💪 Fazla Mesai</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Card sx={{ 
                  bgcolor: stats.attendanceRate >= 90 ? 'success.light' : stats.attendanceRate >= 70 ? 'warning.light' : 'error.light', 
                  textAlign: 'center' 
                }}>
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

            {/* Özet Bilgiler (Çoklu gün için) */}
            {stats.isMultipleDays && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>{stats.dayCount} günlük</strong> dönemde <strong>{stats.uniquePresentCount}</strong> farklı çalışan giriş yaptı. 
                  Toplam <strong>{Math.floor(stats.totalWorkMinutes / 60)}</strong> saat çalışma, 
                  <strong> {stats.totalLateMinutes}</strong> dk geç kalma, 
                  <strong> {stats.totalOvertimeMinutes}</strong> dk fazla mesai kaydedildi.
                </Typography>
              </Alert>
            )}

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
              <Grid item xs={6} sm={2.4}>
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
              <Grid item xs={6} sm={2.4}>
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
              <Grid item xs={6} sm={2.4}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  startIcon={<Download />}
                  onClick={handleExportLateReport}
                  size="small"
                >
                  ⏰ Geç Kalanlar
                </Button>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<Download />}
                  onClick={handleExportShortShiftReport}
                  size="small"
                >
                  ⚠️ Eksik Mesai
                </Button>
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="info"
                  startIcon={<Download />}
                  onClick={handleExportOvertimeReport}
                  size="small"
                >
                  💪 Fazla Mesai
                </Button>
              </Grid>
            </Grid>

            {/* Late, Short Shift & Overtime Lists */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="warning.main" fontWeight="bold">
                  ⏰ Geç Kalanlar ({stats.lateArrivals}):
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {stats.lateList.map((r, i) => {
                    const checkIn = moment(r.checkIn?.time);
                    const expectedStart = checkIn.clone().hour(WORK_START_HOUR).minute(WORK_START_MINUTE);
                    const lateMinutes = r.lateMinutes || (checkIn.isAfter(expectedStart) ? checkIn.diff(expectedStart, 'minutes') : 0);
                    return (
                      <ListItem key={i} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'warning.main' }}>
                            {r.employeeId?.adSoyad?.charAt(0)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={r.employeeId?.adSoyad}
                          secondary={`${checkIn.format('DD.MM')} - ${checkIn.format('HH:mm')}`}
                        />
                        <Chip label={`+${lateMinutes}dk`} size="small" color="warning" />
                      </ListItem>
                    );
                  })}
                  {stats.lateList.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Geç kalan yok 🎉</Typography>
                  )}
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="error.main" fontWeight="bold">
                  ⚠️ Eksik Mesai ({stats.earlyLeavers}):
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {stats.earlyLeaveList.map((r, i) => {
                    const checkOut = moment(r.checkOut?.time);
                    const expectedEnd = checkOut.clone().hour(WORK_END_HOUR).minute(WORK_END_MINUTE);
                    const earlyMinutes = r.earlyLeaveMinutes || (checkOut.isBefore(expectedEnd) ? expectedEnd.diff(checkOut, 'minutes') : 0);
                    return (
                      <ListItem key={i} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'error.main' }}>
                            {r.employeeId?.adSoyad?.charAt(0)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={r.employeeId?.adSoyad}
                          secondary={`${checkOut.format('DD.MM')} - ${checkOut.format('HH:mm')}`}
                        />
                        <Chip label={`-${earlyMinutes}dk`} size="small" color="error" />
                      </ListItem>
                    );
                  })}
                  {stats.earlyLeaveList.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Eksik mesai yok ✅</Typography>
                  )}
                </List>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="info.main" fontWeight="bold">
                  💪 Fazla Mesai ({stats.overtime}):
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {stats.overtimeList.map((r, i) => {
                    const checkIn = r.checkIn?.time ? moment(r.checkIn.time) : null;
                    const checkOut = r.checkOut?.time ? moment(r.checkOut.time) : null;
                    const expectedEnd = checkOut ? checkOut.clone().hour(WORK_END_HOUR).minute(WORK_END_MINUTE) : null;
                    
                    // 🆕 Manuel fazla mesai varsa SADECE onu göster
                    const manualOT = r.manualOvertimeMinutes || 0;
                    const autoOT = checkOut && expectedEnd && checkOut.isAfter(expectedEnd) 
                      ? checkOut.diff(expectedEnd, 'minutes') 
                      : 0;
                    
                    // Gösterilecek değer: Manuel varsa manuel, yoksa otomatik
                    const displayOT = manualOT > 0 ? manualOT : autoOT;
                    const isManual = manualOT > 0;
                    
                    return (
                      <ListItem key={i} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Avatar sx={{ 
                            width: 28, 
                            height: 28, 
                            fontSize: 12, 
                            bgcolor: isManual ? 'secondary.main' : 'info.main' 
                          }}>
                            {r.employeeId?.adSoyad?.charAt(0)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={r.employeeId?.adSoyad}
                          secondary={
                            <span>
                              {checkIn ? checkIn.format('DD.MM') : '-'} - {checkOut ? checkOut.format('HH:mm') : '-'}
                              {isManual && <span style={{ color: '#9c27b0', fontWeight: 'bold' }}> (Manuel)</span>}
                            </span>
                          }
                        />
                        <Tooltip title={isManual ? 'Manuel girilmiş fazla mesai' : 'Otomatik hesaplanan fazla mesai'} arrow>
                          <Chip 
                            label={`+${displayOT}dk`} 
                            size="small" 
                            color={isManual ? 'secondary' : 'info'}
                            variant={isManual ? 'filled' : 'outlined'}
                          />
                        </Tooltip>
                      </ListItem>
                    );
                  })}
                  {stats.overtimeList.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Fazla mesai yok</Typography>
                  )}
                </List>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default HRSummaryCard;

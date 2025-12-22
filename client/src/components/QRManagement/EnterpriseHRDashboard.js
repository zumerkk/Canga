import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ListItemAvatar,
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
  Badge,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Assessment,
  Download,
  AccessTime,
  TrendingUp,
  TrendingDown,
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
  FilterList,
  Business,
  Groups,
  Person,
  Star,
  EmojiEvents,
  Speed,
  QueryStats,
  Insights,
  Analytics,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  Compare,
  Notifications,
  Email,
  Print,
  Share,
  Settings,
  MoreVert,
  Cancel,
  Info,
  ErrorOutline,
  CheckCircleOutline,
  AutoGraph,
  Leaderboard,
  WorkHistory,
  CalendarToday,
  EventAvailable,
  EventNote,
  PendingActions,
  TaskAlt,
  Assignment,
  AssignmentInd,
  AssignmentLate,
  AssignmentTurnedIn
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import 'moment/locale/tr';
import { exportSimpleExcel, calculateNetOvertime, formatNetOvertime } from '../../utils/exportUtils';
import api from '../../config/api';
import toast from 'react-hot-toast';

moment.locale('tr');

/**
 * 🏢 ENTERPRISE HR DASHBOARD
 * Ultra gelişmiş İK yönetim paneli
 * 
 * Özellikler:
 * - Executive Summary Dashboard
 * - Real-time KPI Metrikleri
 * - Çalışan Performans Analizi
 * - Departman Karşılaştırmaları
 * - Trend Analizleri
 * - Anomali Tespiti
 * - Otomatik Raporlama
 * - Tahminleme (Predictive Analytics)
 */

// ============================================
// CONSTANTS
// ============================================
const WORK_START_HOUR = 8;
const WORK_START_MINUTE = 0;
const WORK_END_HOUR = 18;
const WORK_END_MINUTE = 0;
const STANDARD_WORK_MINUTES = 540; // 9 saat

const DATE_RANGE_OPTIONS = {
  TODAY: 'TODAY',
  YESTERDAY: 'YESTERDAY',
  THIS_WEEK: 'THIS_WEEK',
  LAST_WEEK: 'LAST_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  LAST_MONTH: 'LAST_MONTH',
  CUSTOM: 'CUSTOM'
};

// ============================================
// HELPER COMPONENTS
// ============================================

// Executive KPI Card
const KPICard = ({ title, value, subtitle, icon, color, trend, trendValue, onClick, loading }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        onClick={onClick}
        sx={{ 
          height: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          border: `2px solid ${color}30`,
          borderRadius: 3,
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Decorative Element */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: `${color}10`,
            opacity: 0.5
          }}
        />
        
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary" fontWeight="medium" gutterBottom>
                {title}
              </Typography>
              
              {loading ? (
                <Skeleton variant="text" width={80} height={48} />
              ) : (
                <Typography 
                  variant="h3" 
                  fontWeight="bold" 
                  sx={{ color, lineHeight: 1.2 }}
                >
                  {value}
                </Typography>
              )}
              
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
              
              {trend && (
                <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                  {trend === 'up' ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : trend === 'down' ? (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                  ) : null}
                  <Typography 
                    variant="caption" 
                    fontWeight="bold"
                    color={trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary'}
                  >
                    {trendValue}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Avatar 
              sx={{ 
                bgcolor: `${color}20`, 
                width: 56, 
                height: 56,
                boxShadow: `0 4px 14px ${color}30`
              }}
            >
              {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Department Performance Card
const DepartmentPerformanceCard = ({ department, stats, color, rank }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.1 }}
  >
    <Paper
      sx={{
        p: 2,
        mb: 1,
        borderLeft: `4px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: `${color}20`, color, width: 40, height: 40 }}>
          {rank <= 3 ? <EmojiEvents /> : <Groups />}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {rank}. {department}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.total} çalışan
          </Typography>
        </Box>
      </Box>
      
      <Box display="flex" alignItems="center" gap={2}>
        <Box textAlign="right">
          <Typography variant="h6" fontWeight="bold" color={color}>
            %{stats.attendanceRate.toFixed(0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Devam Oranı
          </Typography>
        </Box>
        
        <Box sx={{ width: 80 }}>
          <LinearProgress
            variant="determinate"
            value={stats.attendanceRate}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: `${color}20`,
              '& .MuiLinearProgress-bar': {
                bgcolor: color,
                borderRadius: 4
              }
            }}
          />
        </Box>
      </Box>
    </Paper>
  </motion.div>
);

// Employee Highlight Card
const EmployeeHighlightCard = ({ title, icon, employees, color, type }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Box display="flex" alignItems="center" gap={1} mb={2}>
      {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
      <Typography variant="subtitle2" fontWeight="bold">
        {title}
      </Typography>
      <Chip label={employees.length} size="small" sx={{ bgcolor: `${color}20`, color }} />
    </Box>
    
    <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
      {employees.slice(0, 5).map((emp, i) => (
        <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
          <ListItemAvatar sx={{ minWidth: 36 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: color }}>
              {emp.adSoyad?.charAt(0) || '?'}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="body2" noWrap>
                {emp.adSoyad}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {type === 'late' && `+${emp.lateMinutes || 0} dk geç`}
                {type === 'early' && `-${emp.earlyMinutes || 0} dk erken`}
                {type === 'overtime' && `+${emp.overtimeMinutes || 0} dk fazla`}
                {type === 'absent' && emp.departman}
              </Typography>
            }
          />
        </ListItem>
      ))}
      {employees.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
          Kayıt yok ✓
        </Typography>
      )}
    </List>
  </Paper>
);

// Alert Card
const AlertCard = ({ severity, title, count, description, action, icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
  >
    <Alert
      severity={severity}
      icon={icon}
      sx={{ 
        mb: 1,
        '& .MuiAlert-message': { width: '100%' }
      }}
      action={action}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {title} {count > 0 && <Chip label={count} size="small" color={severity} sx={{ ml: 1 }} />}
          </Typography>
          <Typography variant="caption">{description}</Typography>
        </Box>
      </Box>
    </Alert>
  </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const EnterpriseHRDashboard = ({ 
  records: externalRecords = [], 
  employees: externalEmployees = [], 
  date: externalDate = moment() 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [dateRangeType, setDateRangeType] = useState(DATE_RANGE_OPTIONS.TODAY);
  const [startDate, setStartDate] = useState(moment().startOf('day'));
  const [endDate, setEndDate] = useState(moment().endOf('day'));
  const [showCustomRange, setShowCustomRange] = useState(false);
  
  const [records, setRecords] = useState(externalRecords);
  const [employees, setEmployees] = useState(externalEmployees);
  const [loading, setLoading] = useState(false);
  const [useExternalData, setUseExternalData] = useState(true);
  
  const [selectedBranch, setSelectedBranch] = useState('TÜM');
  const [selectedDepartment, setSelectedDepartment] = useState('TÜM');
  const [expandedSection, setExpandedSection] = useState('summary');

  // Calculate date range
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
      default:
        return { start: startDate, end: endDate };
    }
    
    return { start, end };
  }, [startDate, endDate]);

  // Handle date range change
  const handleDateRangeChange = (rangeType) => {
    setDateRangeType(rangeType);
    const { start, end } = calculateDateRange(rangeType);
    setStartDate(start);
    setEndDate(end);
    setShowCustomRange(rangeType === DATE_RANGE_OPTIONS.CUSTOM);
    setUseExternalData(false);
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    if (useExternalData && dateRangeType === DATE_RANGE_OPTIONS.TODAY) {
      setRecords(externalRecords);
      setEmployees(externalEmployees);
      return;
    }

    setLoading(true);
    try {
      const params = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      };
      
      if (selectedBranch !== 'TÜM') params.branch = selectedBranch;

      const [recordsRes, employeesRes] = await Promise.all([
        api.get('/api/attendance/date-range', { params }).catch(() => 
          api.get('/api/attendance/daily', { params: { date: startDate.format('YYYY-MM-DD') } })
        ),
        api.get('/api/employees', { params: { durum: 'all', limit: 1000 } })
      ]);

      setRecords(recordsRes.data?.records || []);
      const empData = employeesRes.data?.data || [];
      setEmployees(Array.isArray(empData) ? empData.filter(e => e.durum === 'AKTIF') : []);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
      toast.error('Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedBranch, useExternalData, externalRecords, externalEmployees, dateRangeType]);

  // Effects
  useEffect(() => {
    if (!useExternalData) fetchData();
  }, [startDate, endDate, selectedBranch, useExternalData]);

  useEffect(() => {
    if (useExternalData && dateRangeType === DATE_RANGE_OPTIONS.TODAY) {
      setRecords(externalRecords);
      setEmployees(externalEmployees);
    }
  }, [externalRecords, externalEmployees, useExternalData, dateRangeType]);

  // ============================================
  // ADVANCED CALCULATIONS
  // ============================================
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const dayCount = Math.max(1, endDate.diff(startDate, 'days') + 1);
    const isMultipleDays = dayCount > 1;

    // Filter by department if selected
    const filteredRecords = selectedDepartment !== 'TÜM' 
      ? records.filter(r => r.employeeId?.departman === selectedDepartment)
      : records;
    
    const filteredEmployees = selectedDepartment !== 'TÜM'
      ? employees.filter(e => e.departman === selectedDepartment)
      : employees;

    // Basic counts
    const presentRecords = filteredRecords.filter(r => r.checkIn?.time);
    const presentCount = presentRecords.length;
    const uniquePresentIds = new Set(presentRecords.map(r => r.employeeId?._id?.toString()));
    const uniquePresentCount = uniquePresentIds.size;
    const checkedOutCount = filteredRecords.filter(r => r.checkIn?.time && r.checkOut?.time).length;
    const incompleteCount = filteredRecords.filter(r => r.checkIn?.time && !r.checkOut?.time).length;

    // Late arrivals (after 08:00)
    const lateRecords = filteredRecords.filter(r => {
      if (!r.checkIn?.time) return false;
      if (r.isLate === true) return true;
      const checkInTime = moment(r.checkIn.time);
      return checkInTime.hour() > WORK_START_HOUR || 
             (checkInTime.hour() === WORK_START_HOUR && checkInTime.minute() > WORK_START_MINUTE);
    });

    // Early leavers (before 18:00)
    const earlyLeaveRecords = filteredRecords.filter(r => {
      if (!r.checkOut?.time) return false;
      if (r.isEarlyLeave === true) return true;
      const checkOutTime = moment(r.checkOut.time);
      return checkOutTime.hour() < WORK_END_HOUR;
    });

    // Overtime (after 18:00 or manual overtime)
    const overtimeRecords = filteredRecords.filter(r => {
      if (r.manualOvertimeMinutes > 0) return true;
      if (!r.checkOut?.time) return false;
      const checkOutTime = moment(r.checkOut.time);
      return checkOutTime.hour() > WORK_END_HOUR || 
             (checkOutTime.hour() === WORK_END_HOUR && checkOutTime.minute() > WORK_END_MINUTE);
    });

    // Time calculations
    let totalWorkMinutes = 0;
    let totalLateMinutes = 0;
    let totalEarlyMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalManualOvertimeMinutes = 0;

    filteredRecords.forEach(r => {
      if (r.checkIn?.time && r.checkOut?.time) {
        const checkIn = moment(r.checkIn.time);
        const checkOut = moment(r.checkOut.time);
        totalWorkMinutes += checkOut.diff(checkIn, 'minutes');
      }
      totalLateMinutes += r.lateMinutes || 0;
      totalEarlyMinutes += r.earlyLeaveMinutes || 0;
      
      const manualOT = r.manualOvertimeMinutes || 0;
      const autoOT = r.overtimeMinutes || 0;
      totalOvertimeMinutes += manualOT > 0 ? manualOT : autoOT;
      totalManualOvertimeMinutes += manualOT;
    });

    // Averages
    const avgWorkHours = presentCount > 0 ? (totalWorkMinutes / presentCount / 60).toFixed(1) : 0;
    const attendanceRate = filteredEmployees.length > 0 && dayCount > 0 
      ? ((presentCount / (filteredEmployees.length * dayCount)) * 100).toFixed(1) 
      : 0;

    // Absent employees
    const presentEmpIds = new Set(filteredRecords.map(r => r.employeeId?._id?.toString()));
    const absentEmployees = filteredEmployees.filter(e => !presentEmpIds.has(e._id?.toString()));

    // Department stats
    const departments = [...new Set(employees.map(e => e.departman).filter(Boolean))];
    const departmentStats = departments.map(dept => {
      const deptEmployees = employees.filter(e => e.departman === dept);
      const deptRecords = records.filter(r => r.employeeId?.departman === dept && r.checkIn?.time);
      const deptLate = deptRecords.filter(r => r.isLate || (moment(r.checkIn?.time).hour() >= WORK_START_HOUR && moment(r.checkIn?.time).minute() > WORK_START_MINUTE));
      
      return {
        name: dept,
        total: deptEmployees.length,
        present: deptRecords.length,
        late: deptLate.length,
        absent: deptEmployees.length - deptRecords.length,
        attendanceRate: deptEmployees.length > 0 ? (deptRecords.length / deptEmployees.length) * 100 : 0
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate);

    // Prepare employee lists with details
    const lateEmployees = lateRecords.map(r => ({
      ...r.employeeId,
      lateMinutes: r.lateMinutes || 0,
      checkInTime: r.checkIn?.time
    }));

    const earlyLeaveEmployees = earlyLeaveRecords.map(r => ({
      ...r.employeeId,
      earlyMinutes: r.earlyLeaveMinutes || 0,
      checkOutTime: r.checkOut?.time
    }));

    const overtimeEmployees = overtimeRecords.map(r => ({
      ...r.employeeId,
      overtimeMinutes: r.manualOvertimeMinutes || r.overtimeMinutes || 0,
      checkOutTime: r.checkOut?.time
    }));

    // Performance metrics
    const onTimeRate = presentCount > 0 ? ((presentCount - lateRecords.length) / presentCount * 100).toFixed(1) : 100;
    const completionRate = presentCount > 0 ? (checkedOutCount / presentCount * 100).toFixed(1) : 0;
    const avgLateMinutes = lateRecords.length > 0 ? Math.round(totalLateMinutes / lateRecords.length) : 0;
    const avgOvertimeMinutes = overtimeRecords.length > 0 ? Math.round(totalOvertimeMinutes / overtimeRecords.length) : 0;

    // Efficiency score (0-100)
    const efficiencyScore = Math.min(100, Math.round(
      (parseFloat(attendanceRate) * 0.4) + 
      (parseFloat(onTimeRate) * 0.3) + 
      (parseFloat(completionRate) * 0.3)
    ));

    return {
      // Basic
      totalEmployees: filteredEmployees.length,
      presentCount,
      uniquePresentCount,
      checkedOutCount,
      incompleteCount,
      absentCount: isMultipleDays ? '-' : filteredEmployees.length - uniquePresentCount,
      
      // Late/Early/Overtime
      lateCount: lateRecords.length,
      earlyLeaveCount: earlyLeaveRecords.length,
      overtimeCount: overtimeRecords.length,
      
      // Time totals
      totalWorkMinutes,
      totalLateMinutes,
      totalEarlyMinutes,
      totalOvertimeMinutes,
      totalManualOvertimeMinutes,
      
      // Averages
      avgWorkHours,
      avgLateMinutes,
      avgOvertimeMinutes,
      
      // Rates
      attendanceRate,
      onTimeRate,
      completionRate,
      efficiencyScore,
      
      // Department data
      departmentStats,
      departments,
      
      // Employee lists
      lateEmployees,
      earlyLeaveEmployees,
      overtimeEmployees,
      absentEmployees,
      
      // Meta
      dayCount,
      isMultipleDays
    };
  }, [records, employees, startDate, endDate, selectedDepartment]);

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================
  const handleExportFullReport = () => {
    try {
      toast.loading('Kapsamlı rapor hazırlanıyor...');
      
      // Main summary sheet
      const summaryData = [
        { 'Metrik': 'Toplam Çalışan', 'Değer': stats.totalEmployees },
        { 'Metrik': 'Gelen', 'Değer': stats.presentCount },
        { 'Metrik': 'Gelmeyen', 'Değer': stats.absentCount },
        { 'Metrik': 'Geç Kalan', 'Değer': stats.lateCount },
        { 'Metrik': 'Erken Çıkan', 'Değer': stats.earlyLeaveCount },
        { 'Metrik': 'Fazla Mesai', 'Değer': stats.overtimeCount },
        { 'Metrik': 'Devam Oranı', 'Değer': `%${stats.attendanceRate}` },
        { 'Metrik': 'Dakiklik Oranı', 'Değer': `%${stats.onTimeRate}` },
        { 'Metrik': 'Verimlilik Skoru', 'Değer': `${stats.efficiencyScore}/100` },
        { 'Metrik': 'Toplam Çalışma Saati', 'Değer': Math.floor(stats.totalWorkMinutes / 60) },
        { 'Metrik': 'Toplam Geç Kalma (dk)', 'Değer': stats.totalLateMinutes },
        { 'Metrik': 'Toplam Fazla Mesai (dk)', 'Değer': stats.totalOvertimeMinutes }
      ];

      const fileName = `ik_rapor_${startDate.format('YYYY-MM-DD')}_${endDate.format('YYYY-MM-DD')}`;
      exportSimpleExcel(summaryData, fileName);
      
      toast.dismiss();
      toast.success('Rapor indirildi');
    } catch (error) {
      toast.dismiss();
      toast.error('Rapor oluşturulamadı');
    }
  };

  // Date range label
  const getDateRangeLabel = () => {
    if (dateRangeType === DATE_RANGE_OPTIONS.CUSTOM || stats.isMultipleDays) {
      return `${startDate.format('DD MMM')} - ${endDate.format('DD MMM YYYY')}`;
    }
    return startDate.format('DD MMMM YYYY');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="tr">
      <Box>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
            <Box>
              <Typography variant="h5" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                <Analytics color="primary" />
                Enterprise İK Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gelişmiş personel yönetimi ve analiz merkezi
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip 
                label={getDateRangeLabel()}
                icon={<DateRange />}
                color="primary"
                variant="outlined"
              />
              {stats.isMultipleDays && (
                <Chip label={`${stats.dayCount} gün`} size="small" color="info" />
              )}
              <IconButton onClick={() => { setUseExternalData(false); fetchData(); }} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleExportFullReport}
                size="small"
              >
                Rapor İndir
              </Button>
            </Box>
          </Box>

          {/* Date Range Selector */}
          <Box mt={3}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {[
                { key: DATE_RANGE_OPTIONS.TODAY, label: 'Bugün', icon: <Today /> },
                { key: DATE_RANGE_OPTIONS.YESTERDAY, label: 'Dün' },
                { key: DATE_RANGE_OPTIONS.THIS_WEEK, label: 'Bu Hafta' },
                { key: DATE_RANGE_OPTIONS.LAST_WEEK, label: 'Geçen Hafta' },
                { key: DATE_RANGE_OPTIONS.THIS_MONTH, label: 'Bu Ay' },
                { key: DATE_RANGE_OPTIONS.LAST_MONTH, label: 'Geçen Ay' },
                { key: DATE_RANGE_OPTIONS.CUSTOM, label: 'Özel', icon: <DateRange /> }
              ].map(opt => (
                <Button
                  key={opt.key}
                  variant={dateRangeType === opt.key ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={opt.icon}
                  onClick={() => handleDateRangeChange(opt.key)}
                >
                  {opt.label}
                </Button>
              ))}
            </Stack>

            <Collapse in={showCustomRange || dateRangeType === DATE_RANGE_OPTIONS.CUSTOM}>
              <Grid container spacing={2} mt={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <DatePicker
                    label="Başlangıç"
                    value={startDate}
                    onChange={(date) => { setStartDate(date); setDateRangeType(DATE_RANGE_OPTIONS.CUSTOM); setUseExternalData(false); }}
                    maxDate={endDate}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <DatePicker
                    label="Bitiş"
                    value={endDate}
                    onChange={(date) => { setEndDate(date); setDateRangeType(DATE_RANGE_OPTIONS.CUSTOM); setUseExternalData(false); }}
                    minDate={startDate}
                    maxDate={moment()}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Şube</InputLabel>
                    <Select value={selectedBranch} label="Şube" onChange={(e) => { setSelectedBranch(e.target.value); setUseExternalData(false); }}>
                      <MenuItem value="TÜM">Tüm Şubeler</MenuItem>
                      <MenuItem value="MERKEZ">🏭 Merkez</MenuItem>
                      <MenuItem value="IŞIL">🏢 Işıl</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Departman</InputLabel>
                    <Select value={selectedDepartment} label="Departman" onChange={(e) => setSelectedDepartment(e.target.value)}>
                      <MenuItem value="TÜM">Tüm Departmanlar</MenuItem>
                      {stats.departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Collapse>
          </Box>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={48} />
          </Box>
        )}

        {/* Main Content */}
        {!loading && (
          <>
            {/* Executive KPIs */}
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6} sm={4} md={2}>
                <KPICard
                  title="Toplam Çalışan"
                  value={stats.totalEmployees}
                  subtitle="Aktif personel"
                  icon={<People />}
                  color="#1976d2"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KPICard
                  title="Gelen"
                  value={stats.presentCount}
                  subtitle={stats.isMultipleDays ? 'Toplam giriş' : 'Bugün giriş'}
                  icon={<CheckCircle />}
                  color="#4caf50"
                  trend={parseFloat(stats.attendanceRate) >= 90 ? 'up' : 'down'}
                  trendValue={`%${stats.attendanceRate}`}
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KPICard
                  title="Gelmeyen"
                  value={stats.absentCount}
                  subtitle="Devamsız"
                  icon={<Cancel />}
                  color="#f44336"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KPICard
                  title="Geç Kalan"
                  value={stats.lateCount}
                  subtitle={`Ort. ${stats.avgLateMinutes} dk`}
                  icon={<AccessTime />}
                  color="#ff9800"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KPICard
                  title="Fazla Mesai"
                  value={stats.overtimeCount}
                  subtitle={`${Math.floor(stats.totalOvertimeMinutes / 60)}s toplam`}
                  icon={<Timer />}
                  color="#9c27b0"
                />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <KPICard
                  title="Verimlilik"
                  value={`${stats.efficiencyScore}`}
                  subtitle="Puan (0-100)"
                  icon={<Speed />}
                  color={stats.efficiencyScore >= 80 ? '#4caf50' : stats.efficiencyScore >= 60 ? '#ff9800' : '#f44336'}
                  trend={stats.efficiencyScore >= 80 ? 'up' : 'down'}
                />
              </Grid>
            </Grid>

            {/* Alerts Section */}
            {(stats.incompleteCount > 0 || stats.lateCount > 5 || stats.absentCount > 10) && (
              <Box mb={3}>
                {stats.incompleteCount > 0 && (
                  <AlertCard
                    severity="warning"
                    title="Eksik Çıkış Kaydı"
                    count={stats.incompleteCount}
                    description="Çalışanların çıkış kaydı eksik"
                    icon={<PendingActions />}
                  />
                )}
                {stats.lateCount > 5 && (
                  <AlertCard
                    severity="error"
                    title="Yüksek Geç Kalma"
                    count={stats.lateCount}
                    description="Normal üzeri geç kalma tespit edildi"
                    icon={<AssignmentLate />}
                  />
                )}
              </Box>
            )}

            {/* Main Panels */}
            <Grid container spacing={3}>
              {/* Left Column - Department Rankings */}
              <Grid item xs={12} md={5}>
                <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                    <Typography variant="h6" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                      <Leaderboard color="primary" />
                      Departman Sıralaması
                    </Typography>
                    <Chip label={`${stats.departmentStats.length} departman`} size="small" />
                  </Box>

                  {stats.departmentStats.slice(0, 8).map((dept, i) => (
                    <DepartmentPerformanceCard
                      key={dept.name}
                      department={dept.name}
                      stats={dept}
                      color={i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#607d8b'}
                      rank={i + 1}
                    />
                  ))}
                </Paper>
              </Grid>

              {/* Right Column - Employee Highlights */}
              <Grid item xs={12} md={7}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <EmployeeHighlightCard
                      title="Geç Kalanlar"
                      icon={<AccessTime />}
                      employees={stats.lateEmployees}
                      color="#ff9800"
                      type="late"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EmployeeHighlightCard
                      title="Erken Çıkanlar"
                      icon={<Warning />}
                      employees={stats.earlyLeaveEmployees}
                      color="#f44336"
                      type="early"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EmployeeHighlightCard
                      title="Fazla Mesai"
                      icon={<Timer />}
                      employees={stats.overtimeEmployees}
                      color="#9c27b0"
                      type="overtime"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <EmployeeHighlightCard
                      title="Gelmeyenler"
                      icon={<EventBusy />}
                      employees={stats.absentEmployees}
                      color="#607d8b"
                      type="absent"
                    />
                  </Grid>
                </Grid>

                {/* Summary Stats */}
                <Paper sx={{ p: 3, mt: 2, borderRadius: 3, bgcolor: 'primary.light' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    📊 Günlük Özet İstatistikler
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold" color="primary.dark">
                          {Math.floor(stats.totalWorkMinutes / 60)}s
                        </Typography>
                        <Typography variant="caption">Toplam Çalışma</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold" color="warning.dark">
                          {stats.totalLateMinutes}dk
                        </Typography>
                        <Typography variant="caption">Toplam Geç Kalma</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold" color="secondary.dark">
                          {stats.totalOvertimeMinutes}dk
                        </Typography>
                        <Typography variant="caption">Toplam Fazla Mesai</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Quick Actions */}
            <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                🚀 Hızlı Rapor İndirme
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6} sm={2}>
                  <Button fullWidth variant="outlined" size="small" startIcon={<Download />} onClick={handleExportFullReport}>
                    Genel Özet
                  </Button>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Button fullWidth variant="outlined" size="small" color="warning" startIcon={<AccessTime />} onClick={() => {
                    const data = stats.lateEmployees.map(e => ({ 'Ad Soyad': e.adSoyad, 'Departman': e.departman, 'Geç (dk)': e.lateMinutes }));
                    if (data.length) exportSimpleExcel(data, `gec_kalanlar_${startDate.format('YYYY-MM-DD')}`);
                    else toast.error('Geç kalan yok');
                  }}>
                    Geç Kalanlar
                  </Button>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Button fullWidth variant="outlined" size="small" color="error" startIcon={<Cancel />} onClick={() => {
                    const data = stats.absentEmployees.map(e => ({ 'Ad Soyad': e.adSoyad, 'Departman': e.departman, 'Pozisyon': e.pozisyon }));
                    if (data.length) exportSimpleExcel(data, `devamsizlar_${startDate.format('YYYY-MM-DD')}`);
                    else toast.success('Herkes gelmiş!');
                  }}>
                    Gelmeyenler
                  </Button>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Button fullWidth variant="outlined" size="small" color="secondary" startIcon={<Timer />} onClick={() => {
                    const data = stats.overtimeEmployees.map(e => ({ 'Ad Soyad': e.adSoyad, 'Departman': e.departman, 'Fazla Mesai (dk)': e.overtimeMinutes }));
                    if (data.length) exportSimpleExcel(data, `fazla_mesai_${startDate.format('YYYY-MM-DD')}`);
                    else toast.error('Fazla mesai yok');
                  }}>
                    Fazla Mesai
                  </Button>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Button fullWidth variant="outlined" size="small" color="info" startIcon={<Groups />} onClick={() => {
                    const data = stats.departmentStats.map(d => ({ 'Departman': d.name, 'Toplam': d.total, 'Gelen': d.present, 'Devam %': d.attendanceRate.toFixed(1) }));
                    exportSimpleExcel(data, `departman_ozet_${startDate.format('YYYY-MM-DD')}`);
                  }}>
                    Departmanlar
                  </Button>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <Button fullWidth variant="contained" size="small" startIcon={<Print />} onClick={() => window.print()}>
                    Yazdır
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default EnterpriseHRDashboard;

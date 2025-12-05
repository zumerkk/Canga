import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Group,
  CheckCircle,
  Cancel,
  AccessTime,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🏢 Department View
 * Departman bazlı devam görünümü
 */

const DEPARTMENT_COLORS = {
  'TORNA GRUBU': '#1976d2',
  'FREZE GRUBU': '#2196f3',
  'TESTERE': '#00bcd4',
  'KAYNAK': '#ff5722',
  'MONTAJ': '#4caf50',
  'İDARİ BİRİM': '#9c27b0',
  'TEKNİK OFİS': '#673ab7',
  'KALİTE KONTROL': '#009688',
  'BAKIM VE ONARIM': '#795548',
  'PLANLAMA': '#607d8b',
  'DEPO': '#ff9800',
  'AR-GE': '#e91e63',
  'BİLGİ İŞLEM': '#3f51b5',
  'default': '#757575'
};

const DepartmentCard = ({ department, employees, records, expanded, onToggle }) => {
  const stats = useMemo(() => {
    const deptEmployees = employees.filter(e => e.departman === department);
    const deptRecords = records.filter(r => r.employeeId?.departman === department);
    
    const present = deptRecords.filter(r => r.checkIn?.time && !r.checkOut?.time).length;
    const checkedOut = deptRecords.filter(r => r.checkIn?.time && r.checkOut?.time).length;
    const late = deptRecords.filter(r => r.status === 'LATE').length;
    const total = deptEmployees.length;
    const absent = total - (present + checkedOut);
    const attendanceRate = total > 0 ? ((present + checkedOut) / total) * 100 : 0;

    return { present, checkedOut, late, absent, total, attendanceRate, deptRecords };
  }, [department, employees, records]);

  const color = DEPARTMENT_COLORS[department] || DEPARTMENT_COLORS.default;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        sx={{ 
          mb: 1,
          border: `2px solid ${color}20`,
          '&:hover': {
            boxShadow: `0 4px 20px ${color}30`
          }
        }}
      >
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            onClick={onToggle}
            sx={{ cursor: 'pointer' }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>
                <Group />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {department || 'Bilinmiyor'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.total} çalışan
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              {/* Stats Chips */}
              <Box display="flex" gap={0.5}>
                <Tooltip title="İçeride">
                  <Chip
                    size="small"
                    icon={<CheckCircle />}
                    label={stats.present}
                    color="success"
                    variant="outlined"
                  />
                </Tooltip>
                <Tooltip title="Çıkış Yaptı">
                  <Chip
                    size="small"
                    label={stats.checkedOut}
                    color="default"
                    variant="outlined"
                  />
                </Tooltip>
                {stats.absent > 0 && (
                  <Tooltip title="Gelmedi">
                    <Chip
                      size="small"
                      icon={<Cancel />}
                      label={stats.absent}
                      color="error"
                      variant="outlined"
                    />
                  </Tooltip>
                )}
              </Box>

              {/* Attendance Rate */}
              <Box sx={{ minWidth: 100 }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Devam:
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={stats.attendanceRate >= 90 ? 'success.main' : stats.attendanceRate >= 70 ? 'warning.main' : 'error.main'}
                  >
                    %{stats.attendanceRate.toFixed(0)}
                  </Typography>
                  {stats.attendanceRate >= 90 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.attendanceRate}
                  sx={{
                    height: 6,
                    borderRadius: 1,
                    bgcolor: `${color}20`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: color
                    }
                  }}
                />
              </Box>

              <IconButton size="small">
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>

          {/* Expanded Content */}
          <Collapse in={expanded}>
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Bugünkü kayıtlar:
              </Typography>
              <List dense>
                {stats.deptRecords.slice(0, 5).map((record) => (
                  <ListItem key={record._id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar src={record.employeeId?.profilePhoto} sx={{ width: 32, height: 32 }}>
                        {record.employeeId?.adSoyad?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={record.employeeId?.adSoyad}
                      secondary={
                        <Box display="flex" gap={1} alignItems="center">
                          <AccessTime fontSize="small" sx={{ fontSize: 14 }} />
                          {record.checkIn?.time 
                            ? new Date(record.checkIn.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                            : '-'
                          }
                          {record.checkOut?.time && (
                            <>
                              <span>→</span>
                              {new Date(record.checkOut.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </>
                          )}
                        </Box>
                      }
                    />
                    <Chip
                      size="small"
                      label={record.checkOut?.time ? 'Çıktı' : 'İçeride'}
                      color={record.checkOut?.time ? 'default' : 'success'}
                    />
                  </ListItem>
                ))}
                {stats.deptRecords.length > 5 && (
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
                    +{stats.deptRecords.length - 5} kayıt daha...
                  </Typography>
                )}
                {stats.deptRecords.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Bugün kayıt yok
                  </Typography>
                )}
              </List>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DepartmentView = ({ employees = [], records = [] }) => {
  const [expandedDept, setExpandedDept] = useState(null);

  // Departmanları grupla
  const departments = useMemo(() => {
    const deptSet = new Set(employees.map(e => e.departman).filter(Boolean));
    return Array.from(deptSet).sort();
  }, [employees]);

  // Genel istatistikler
  const overallStats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalPresent = records.filter(r => r.checkIn?.time).length;
    const rate = totalEmployees > 0 ? (totalPresent / totalEmployees) * 100 : 0;
    return { totalEmployees, totalPresent, rate };
  }, [employees, records]);

  return (
    <Paper sx={{ p: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          🏢 Departman Görünümü
        </Typography>
        <Chip
          label={`Genel Devam: %${overallStats.rate.toFixed(0)}`}
          color={overallStats.rate >= 90 ? 'success' : overallStats.rate >= 70 ? 'warning' : 'error'}
        />
      </Box>

      {/* Department Cards */}
      <Box>
        <AnimatePresence>
          {departments.map((dept) => (
            <DepartmentCard
              key={dept}
              department={dept}
              employees={employees}
              records={records}
              expanded={expandedDept === dept}
              onToggle={() => setExpandedDept(expandedDept === dept ? null : dept)}
            />
          ))}
        </AnimatePresence>
      </Box>

      {departments.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          Departman bilgisi bulunamadı
        </Typography>
      )}
    </Paper>
  );
};

export default DepartmentView;

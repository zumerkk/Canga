import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  CompareArrows,
  CalendarToday,
  Schedule
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import moment from 'moment';
import api from '../../config/api';

/**
 * 📈 Trend Comparison
 * Haftalık/Aylık karşılaştırmalı trend analizi
 */

const TrendComparison = () => {
  const [period, setPeriod] = useState('week'); // week, month
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    current: [],
    previous: [],
    comparison: {}
  });

  useEffect(() => {
    loadTrendData();
  }, [period]);

  const loadTrendData = async () => {
    setLoading(true);
    try {
      // Bu hafta ve geçen hafta için veri al
      const today = moment();
      const currentStart = period === 'week' 
        ? today.clone().startOf('isoWeek')
        : today.clone().startOf('month');
      const previousStart = period === 'week'
        ? currentStart.clone().subtract(1, 'week')
        : currentStart.clone().subtract(1, 'month');

      const [currentRes, previousRes] = await Promise.all([
        api.get('/api/attendance/daily', {
          params: {
            startDate: currentStart.format('YYYY-MM-DD'),
            endDate: today.format('YYYY-MM-DD')
          }
        }),
        api.get('/api/attendance/daily', {
          params: {
            startDate: previousStart.format('YYYY-MM-DD'),
            endDate: currentStart.clone().subtract(1, 'day').format('YYYY-MM-DD')
          }
        })
      ]);

      const currentRecords = currentRes.data?.records || [];
      const previousRecords = previousRes.data?.records || [];

      // Günlük bazda grupla
      const currentByDay = groupByDay(currentRecords, currentStart, period);
      const previousByDay = groupByDay(previousRecords, previousStart, period);

      // Karşılaştırma metrikleri
      const currentTotal = currentRecords.length;
      const previousTotal = previousRecords.length;
      const change = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
        : 0;

      const currentAvg = currentByDay.length > 0 
        ? (currentTotal / currentByDay.filter(d => d.current > 0).length).toFixed(1)
        : 0;
      const previousAvg = previousByDay.length > 0
        ? (previousTotal / previousByDay.filter(d => d.previous > 0).length).toFixed(1)
        : 0;

      setData({
        current: currentByDay,
        previous: previousByDay,
        comparison: {
          currentTotal,
          previousTotal,
          change: parseFloat(change),
          currentAvg: parseFloat(currentAvg),
          previousAvg: parseFloat(previousAvg)
        }
      });

    } catch (error) {
      console.error('Trend data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByDay = (records, startDate, period) => {
    const days = period === 'week' ? 7 : startDate.daysInMonth();
    const result = [];

    for (let i = 0; i < days; i++) {
      const date = startDate.clone().add(i, 'days');
      if (date.isAfter(moment())) break;

      const dayRecords = records.filter(r => 
        moment(r.date).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
      );

      result.push({
        day: date.format('ddd'),
        date: date.format('DD/MM'),
        current: dayRecords.length,
        previous: 0 // Will be filled by previous period
      });
    }

    return result;
  };

  // Grafik için birleştirilmiş veri
  const chartData = data.current.map((item, index) => ({
    ...item,
    previous: data.previous[index]?.current || 0
  }));

  const getTrendIcon = (change) => {
    if (change > 5) return <TrendingUp color="success" />;
    if (change < -5) return <TrendingDown color="error" />;
    return <TrendingFlat color="warning" />;
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <CompareArrows color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Trend Karşılaştırma
          </Typography>
        </Box>
        
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, v) => v && setPeriod(v)}
          size="small"
        >
          <ToggleButton value="week">
            <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
            Haftalık
          </ToggleButton>
          <ToggleButton value="month">
            <Schedule fontSize="small" sx={{ mr: 0.5 }} />
            Aylık
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Comparison Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={6} sm={3}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="caption">Bu {period === 'week' ? 'Hafta' : 'Ay'}</Typography>
                    <Typography variant="h4" fontWeight="bold">{data.comparison.currentTotal}</Typography>
                    <Typography variant="caption">kayıt</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card sx={{ bgcolor: 'grey.100' }}>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Geçen {period === 'week' ? 'Hafta' : 'Ay'}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">{data.comparison.previousTotal}</Typography>
                    <Typography variant="caption" color="text.secondary">kayıt</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Değişim</Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                      {getTrendIcon(data.comparison.change)}
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        color={
                          data.comparison.change > 0 ? 'success.main' : 
                          data.comparison.change < 0 ? 'error.main' : 'text.primary'
                        }
                      >
                        {data.comparison.change > 0 ? '+' : ''}{data.comparison.change}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <Card>
                  <CardContent sx={{ py: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Günlük Ort.</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {data.comparison.currentAvg}
                    </Typography>
                    <Chip 
                      size="small"
                      label={`Önceki: ${data.comparison.previousAvg}`}
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Chart */}
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9e9e9e" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#9e9e9e" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8 }}
                  formatter={(value, name) => [
                    value, 
                    name === 'current' ? 'Bu dönem' : 'Önceki dönem'
                  ]}
                />
                <Legend 
                  formatter={(value) => value === 'current' ? 'Bu dönem' : 'Önceki dönem'}
                />
                <Area 
                  type="monotone" 
                  dataKey="previous" 
                  stroke="#9e9e9e" 
                  fill="url(#previousGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#1976d2" 
                  fill="url(#currentGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default TrendComparison;

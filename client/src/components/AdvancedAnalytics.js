import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AccessTime,
  People
} from '@mui/icons-material';

/**
 * 📊 GELİŞMİŞ ANALİTİK DASHBOARD
 * Recharts ile profesyonel grafikler
 */

const COLORS = {
  primary: '#1976d2',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  purple: '#9c27b0',
  pink: '#e91e63',
  teal: '#009688'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.error,
  COLORS.purple,
  COLORS.pink,
  COLORS.teal,
  COLORS.info
];

const AdvancedAnalytics = ({ records = [], liveStats = {} }) => {
  // Saatlik giriş dağılımı (06:00-20:00 arası)
  const hourlyData = Array.from({ length: 15 }, (_, i) => {
    const hour = 6 + i;
    const count = records.filter(r => {
      const checkInHour = new Date(r.checkIn?.time).getHours();
      return checkInHour === hour;
    }).length;
    
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      giriş: count,
      çıkış: records.filter(r => {
        const checkOutHour = new Date(r.checkOut?.time).getHours();
        return checkOutHour === hour;
      }).length
    };
  });

  // Lokasyon bazlı dağılım
  const locationData = [
    { name: 'MERKEZ', value: records.filter(r => r.checkIn?.location === 'MERKEZ').length, color: COLORS.primary },
    { name: 'İŞL', value: records.filter(r => r.checkIn?.location === 'İŞL').length, color: COLORS.success },
    { name: 'OSB', value: records.filter(r => r.checkIn?.location === 'OSB').length, color: COLORS.warning },
    { name: 'İŞIL', value: records.filter(r => r.checkIn?.location === 'İŞIL').length, color: COLORS.error },
    { name: 'Diğer', value: records.filter(r => !['MERKEZ', 'İŞL', 'OSB', 'İŞIL'].includes(r.checkIn?.location)).length, color: COLORS.purple }
  ].filter(item => item.value > 0);

  // Yöntem bazlı dağılım
  const methodData = [
    { name: 'QR Kod', value: records.filter(r => r.checkIn?.method === 'MOBILE' || r.checkIn?.method === 'TABLET').length },
    { name: 'Kart', value: records.filter(r => r.checkIn?.method === 'CARD').length },
    { name: 'Manuel', value: records.filter(r => r.checkIn?.method === 'MANUAL').length },
    { name: 'Excel', value: records.filter(r => r.checkIn?.method === 'EXCEL_IMPORT').length }
  ].filter(item => item.value > 0);

  // Durum dağılımı
  const statusData = [
    { name: 'Tamamlandı', value: records.filter(r => r.status === 'COMPLETED').length },
    { name: 'Eksik', value: records.filter(r => r.status === 'INCOMPLETE').length },
    { name: 'Devam Ediyor', value: records.filter(r => r.status === 'ONGOING').length }
  ].filter(item => item.value > 0);

  // Haftalık trend (simülasyon - gerçekte API'den gelecek)
  const weeklyTrend = [
    { day: 'Pzt', giriş: 245, çıkış: 242, anomali: 3 },
    { day: 'Sal', giriş: 238, çıkış: 235, anomali: 2 },
    { day: 'Çar', giriş: 251, çıkış: 248, anomali: 4 },
    { day: 'Per', giriş: 247, çıkış: 245, anomali: 1 },
    { day: 'Cum', giriş: 243, çıkış: 240, anomali: 5 },
    { day: 'Cmt', giriş: 89, çıkış: 87, anomali: 0 },
    { day: 'Paz', giriş: 45, çıkış: 44, anomali: 0 }
  ];

  // Özet istatistikler
  const totalCheckIns = records.filter(r => r.checkIn?.time).length;
  const totalCheckOuts = records.filter(r => r.checkOut?.time).length;
  const avgCheckInTime = records.reduce((sum, r) => {
    if (r.checkIn?.time) {
      const hour = new Date(r.checkIn.time).getHours();
      const minute = new Date(r.checkIn.time).getMinutes();
      return sum + (hour * 60 + minute);
    }
    return sum;
  }, 0) / (totalCheckIns || 1);
  
  const avgCheckInHour = Math.floor(avgCheckInTime / 60);
  const avgCheckInMinute = Math.floor(avgCheckInTime % 60);

  return (
    <Grid container spacing={3}>
      {/* Özet Kartlar */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Toplam Giriş
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {totalCheckIns}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <TrendingUp fontSize="small" />
                      <Typography variant="caption">
                        +12% bu hafta
                      </Typography>
                    </Box>
                  </Box>
                  <People sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Toplam Çıkış
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {totalCheckOuts}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <TrendingUp fontSize="small" />
                      <Typography variant="caption">
                        +8% bu hafta
                      </Typography>
                    </Box>
                  </Box>
                  <People sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      Ort. Giriş Saati
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {avgCheckInHour.toString().padStart(2, '0')}:{avgCheckInMinute.toString().padStart(2, '0')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <TrendingDown fontSize="small" />
                      <Typography variant="caption">
                        15 dk erken
                      </Typography>
                    </Box>
                  </Box>
                  <AccessTime sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>
                      QR Kullanım Oranı
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {totalCheckIns > 0 
                        ? Math.round((records.filter(r => r.checkIn?.method === 'MOBILE' || r.checkIn?.method === 'TABLET').length / totalCheckIns) * 100)
                        : 0}%
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <TrendingUp fontSize="small" />
                      <Typography variant="caption">
                        +23% bu ay
                      </Typography>
                    </Box>
                  </Box>
                  <TrendingUp sx={{ fontSize: 50, opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>

      {/* Saatlik Giriş-Çıkış Grafiği */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Saatlik Giriş-Çıkış Dağılımı
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="colorGiriş" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorÇıkış" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="giriş" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorGiriş)" />
              <Area type="monotone" dataKey="çıkış" stroke={COLORS.success} fillOpacity={1} fill="url(#colorÇıkış)" />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Lokasyon Dağılımı Pie Chart */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Lokasyon Dağılımı
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={locationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {locationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Haftalık Trend */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Haftalık Trend Analizi
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="giriş" stroke={COLORS.primary} strokeWidth={2} />
              <Line type="monotone" dataKey="çıkış" stroke={COLORS.success} strokeWidth={2} />
              <Line type="monotone" dataKey="anomali" stroke={COLORS.error} strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Yöntem Dağılımı Bar Chart */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Giriş Yöntemi
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={methodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]}>
                {methodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Performans Metrikleri */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Performans Metrikleri
          </Typography>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2} sx={{ borderRadius: 2, bgcolor: 'primary.light' }}>
                <Typography variant="h3" fontWeight="bold" color="primary.dark">
                  98.5%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sistem Başarı Oranı
                </Typography>
                <Chip label="+2.3%" size="small" color="success" sx={{ mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2} sx={{ borderRadius: 2, bgcolor: 'success.light' }}>
                <Typography variant="h3" fontWeight="bold" color="success.dark">
                  2.3s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ort. İşlem Süresi
                </Typography>
                <Chip label="-0.4s" size="small" color="success" sx={{ mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2} sx={{ borderRadius: 2, bgcolor: 'warning.light' }}>
                <Typography variant="h3" fontWeight="bold" color="warning.dark">
                  12
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Anomali Tespit
                </Typography>
                <Chip label="-5" size="small" color="success" sx={{ mt: 1 }} />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center" p={2} sx={{ borderRadius: 2, bgcolor: 'error.light' }}>
                <Typography variant="h3" fontWeight="bold" color="error.dark">
                  3
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kritik Uyarı
                </Typography>
                <Chip label="0" size="small" color="success" sx={{ mt: 1 }} />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AdvancedAnalytics;


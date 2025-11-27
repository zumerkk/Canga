import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Collapse,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  ExpandMore,
  ExpandLess,
  Psychology,
  Cloud,
  Speed,
  Info
} from '@mui/icons-material';
import api from '../config/api';

/**
 * AI HEALTH STATUS COMPONENT
 * Groq API sağlık durumunu gösterir ve test eder
 */
function AIHealthStatus({ compact = false }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/health/check');
      setHealthData(response.data);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check error:', error);
      setHealthData({
        success: false,
        summary: { healthy: 0, total: 1, healthScore: '0%' },
        apis: {
          groq: { status: 'unhealthy', error: 'Bağlantı hatası' }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle sx={{ color: '#4caf50' }} />;
      case 'unhealthy':
        return <Error sx={{ color: '#f44336' }} />;
      case 'disabled':
        return <Warning sx={{ color: '#9e9e9e' }} />;
      default:
        return <Warning sx={{ color: '#ff9800' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'unhealthy':
        return 'error';
      case 'disabled':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getHealthScoreColor = (score) => {
    const numScore = parseInt(score);
    if (numScore >= 100) return '#4caf50';
    if (numScore >= 50) return '#ff9800';
    return '#f44336';
  };

  if (loading && !healthData) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" gap={2} py={2}>
            <CircularProgress size={24} />
            <Typography>AI servisi kontrol ediliyor...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return null;
  }

  // Compact Mode
  if (compact) {
    return (
      <Chip
        icon={healthData.summary.healthy === healthData.summary.total ? <CheckCircle /> : <Warning />}
        label={`AI: ${healthData.summary.healthScore}`}
        color={healthData.summary.healthy === healthData.summary.total ? 'success' : 'warning'}
        variant="outlined"
        onClick={() => setExpanded(!expanded)}
      />
    );
  }

  // Full Mode
  return (
    <Card 
      elevation={0}
      sx={{ 
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        background: healthData.success ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' : '#ffebee'
      }}
    >
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Psychology color="primary" fontSize="large" />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                AI Sistem Durumu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lastCheck ? `Son kontrol: ${lastCheck.toLocaleTimeString('tr-TR')}` : 'Henüz kontrol yapılmadı'}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={healthData.summary.healthScore}
              color={getStatusColor(healthData.summary.healthy === healthData.summary.total ? 'healthy' : 'unhealthy')}
              sx={{ fontWeight: 'bold', fontSize: '1rem' }}
            />
            <Tooltip title="Yenile">
              <IconButton 
                onClick={checkAPIHealth}
                disabled={loading}
                size="small"
              >
                {loading ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
            </Tooltip>
            <Tooltip title={expanded ? 'Daralt' : 'Genişlet'}>
              <IconButton 
                onClick={() => setExpanded(!expanded)}
                size="small"
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Health Score Progress */}
        <Box mb={2}>
          <LinearProgress 
            variant="determinate" 
            value={parseInt(healthData.summary.healthScore)} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getHealthScoreColor(healthData.summary.healthScore)
              }
            }}
          />
        </Box>

        {/* Quick Status */}
        {!expanded && (
          <Box display="flex" gap={2} flexWrap="wrap">
            {healthData.apis.groq && (
              <Box display="flex" alignItems="center" gap={1}>
                {getStatusIcon(healthData.apis.groq.status)}
                <Typography variant="body2">
                  Groq (Llama 3.3): {healthData.apis.groq.status === 'healthy' ? 'Aktif' : 'Pasif'}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Detailed Status */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          
          {/* Groq API */}
          {healthData.apis.groq && (
            <Box mb={2}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Cloud fontSize="small" color="secondary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Groq API (Llama 3.3)
                </Typography>
                <Chip 
                  size="small" 
                  label={healthData.apis.groq.status === 'healthy' ? 'Çalışıyor' : 'Hatalı'}
                  color={getStatusColor(healthData.apis.groq.status)}
                />
              </Box>

              {healthData.apis.groq.status === 'healthy' ? (
                <Box pl={4}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Speed fontSize="small" />
                    <Typography variant="body2">
                      Yanıt Süresi: <strong>{healthData.apis.groq.responseTime}</strong>
                    </Typography>
                  </Box>
                  {healthData.apis.groq.details && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Info fontSize="small" />
                      <Typography variant="body2">
                        Model: <strong>{healthData.apis.groq.details.model}</strong>
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="error" sx={{ ml: 4 }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    {healthData.apis.groq.error}
                  </Typography>
                  {healthData.apis.groq.troubleshooting && healthData.apis.groq.troubleshooting.length > 0 && (
                    <Box mt={1}>
                      <Typography variant="caption" display="block" gutterBottom>
                        <strong>Çözüm Önerileri:</strong>
                      </Typography>
                      {healthData.apis.groq.troubleshooting.map((tip, idx) => (
                        <Typography key={idx} variant="caption" display="block">
                          • {tip}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Alert>
              )}
            </Box>
          )}

          {/* Recommendation */}
          {healthData.recommendation && (
            <Box mt={2}>
              <Alert 
                severity={healthData.summary.healthy === healthData.summary.total ? 'success' : 'warning'}
                icon={healthData.summary.healthy === healthData.summary.total ? <CheckCircle /> : <Warning />}
              >
                {healthData.recommendation}
              </Alert>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default AIHealthStatus;

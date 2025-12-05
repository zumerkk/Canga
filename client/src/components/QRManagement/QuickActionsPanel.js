import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Tooltip,
  Badge,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  QrCode2,
  PlaylistAddCheck,
  Warning,
  Send,
  Download,
  Print,
  Email,
  Refresh,
  CheckCircle,
  Schedule,
  People,
  TrendingUp,
  Assignment
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';

/**
 * ⚡ Quick Actions Panel
 * Yönetici için hızlı erişim aksiyonları
 */

const QuickActionsPanel = ({ 
  stats = {}, 
  onAction,
  onRefresh 
}) => {
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [loading, setLoading] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailList, setEmailList] = useState('');

  const actions = [
    {
      id: 'qr',
      label: 'Sistem QR',
      icon: <QrCode2 />,
      color: '#1976d2',
      description: 'Yeni QR kod oluştur',
      onClick: () => onAction?.('generateQR')
    },
    {
      id: 'approve',
      label: 'Toplu Onayla',
      icon: <PlaylistAddCheck />,
      color: '#4caf50',
      badge: stats?.pendingApproval || 0,
      description: 'Bekleyen kayıtları onayla',
      onClick: () => setConfirmDialog({ open: true, type: 'approve' })
    },
    {
      id: 'missing',
      label: 'Eksik Kayıt',
      icon: <Warning />,
      color: '#ff9800',
      badge: stats?.incomplete || 0,
      description: 'Eksik kayıtları düzelt',
      onClick: () => onAction?.('showMissing')
    },
    {
      id: 'notify',
      label: 'Bildirim',
      icon: <Send />,
      color: '#9c27b0',
      description: 'Toplu bildirim gönder',
      onClick: () => setEmailDialog(true)
    },
    {
      id: 'export',
      label: 'Rapor',
      icon: <Download />,
      color: '#00bcd4',
      description: 'Günlük rapor indir',
      onClick: () => onAction?.('exportDaily')
    },
    {
      id: 'refresh',
      label: 'Yenile',
      icon: <Refresh />,
      color: '#607d8b',
      description: 'Verileri güncelle',
      onClick: onRefresh
    }
  ];

  const handleBulkApprove = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/attendance/bulk-approve', {
        date: new Date().toISOString().split('T')[0]
      });
      toast.success(`${response.data?.count || 0} kayıt onaylandı`);
      setConfirmDialog({ open: false, type: null });
      onRefresh?.();
    } catch (error) {
      toast.error('Toplu onaylama başarısız');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!emailList.trim()) {
      toast.error('Mesaj boş olamaz');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/notifications/broadcast', {
        message: emailList,
        type: 'ATTENDANCE_REMINDER'
      });
      toast.success('Bildirim gönderildi');
      setEmailDialog(false);
      setEmailList('');
    } catch (error) {
      toast.error('Bildirim gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            ⚡ Hızlı İşlemler
          </Typography>
          <Chip 
            label={`${stats?.present || 0} kişi içeride`}
            color="success"
            size="small"
            icon={<People />}
          />
        </Box>

        <Grid container spacing={1}>
          {actions.map((action, index) => (
            <Grid item xs={4} sm={2} key={action.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Tooltip title={action.description} arrow>
                  <Button
                    fullWidth
                    onClick={action.onClick}
                    sx={{
                      flexDirection: 'column',
                      py: 1.5,
                      px: 1,
                      borderRadius: 2,
                      bgcolor: `${action.color}10`,
                      border: `1px solid ${action.color}30`,
                      '&:hover': {
                        bgcolor: `${action.color}20`
                      }
                    }}
                  >
                    <Badge badgeContent={action.badge} color="error" max={99}>
                      {React.cloneElement(action.icon, { 
                        sx: { color: action.color, fontSize: 28, mb: 0.5 } 
                      })}
                    </Badge>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: action.color,
                        fontWeight: 'medium',
                        fontSize: '0.7rem'
                      }}
                    >
                      {action.label}
                    </Typography>
                  </Button>
                </Tooltip>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Bulk Approve Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: null })}>
        <DialogTitle>
          <CheckCircle color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Toplu Onaylama
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1 }}>
            Bugünkü tüm tamamlanmış kayıtlar onaylanacak.
            Bu işlem {stats?.pendingApproval || 'bilinmeyen sayıda'} kaydı etkileyecek.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: null })}>
            İptal
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleBulkApprove}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
          >
            Tümünü Onayla
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={emailDialog} onClose={() => setEmailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Send color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Toplu Bildirim Gönder
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tüm aktif çalışanlara bildirim gönderilecek.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Mesaj"
            value={emailList}
            onChange={(e) => setEmailList(e.target.value)}
            placeholder="Dikkat: Yarın saat 07:00'de zorunlu toplantı var..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialog(false)}>İptal</Button>
          <Button 
            variant="contained"
            onClick={handleSendNotification}
            disabled={loading || !emailList.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          >
            Gönder
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickActionsPanel;

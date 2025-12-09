import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent
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
  Assignment,
  PersonOff,
  FileDownload,
  Tablet,
  SupervisorAccount,
  ExpandMore,
  TouchApp,
  MoreVert,
  OpenInNew
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';
import AssistedCheckIn from './AssistedCheckIn';

/**
 * ⚡ Quick Actions Panel
 * Yönetici için hızlı erişim aksiyonları
 */

const QuickActionsPanel = ({ 
  stats = {}, 
  onAction,
  onRefresh,
  branch = 'MERKEZ'
}) => {
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [loading, setLoading] = useState(false);
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailList, setEmailList] = useState('');
  const [assistedCheckInOpen, setAssistedCheckInOpen] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [kioskBranchDialog, setKioskBranchDialog] = useState(false); // 🆕 Kiosk şube seçim dialog

  // Kiosk modunu yeni sekmede aç
  const openKioskMode = (selectedBranch) => {
    const url = `/kiosk?branch=${selectedBranch}`;
    window.open(url, '_blank', 'fullscreen=yes');
    setKioskBranchDialog(false);
  };

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
      id: 'kiosk',
      label: 'Kiosk Modu',
      icon: <Tablet />,
      color: '#00897b',
      description: 'Tablet terminal aç (QR\'sız giriş)',
      onClick: () => setKioskBranchDialog(true), // 🆕 Şube seçim dialog aç
      highlight: true
    },
    {
      id: 'assisted',
      label: 'Yardımlı Giriş',
      icon: <SupervisorAccount />,
      color: '#6a1b9a',
      description: 'Başkası adına giriş/çıkış yap',
      onClick: () => setAssistedCheckInOpen(true),
      highlight: true
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
      id: 'absent',
      label: 'Gelmeyenler',
      icon: <PersonOff />,
      color: '#f44336',
      badge: stats?.absent || 0,
      description: 'Gelmeyenleri Excel\'e aktar',
      onClick: () => onAction?.('exportAbsent')
    },
    {
      id: 'refresh',
      label: 'Yenile',
      icon: <Refresh />,
      color: '#607d8b',
      description: 'Verileri güncelle',
      onClick: onRefresh
    },
    {
      id: 'more',
      label: 'Daha Fazla',
      icon: <MoreVert />,
      color: '#455a64',
      description: 'Diğer işlemler',
      onClick: (e) => setMoreMenuAnchor(e.currentTarget)
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
          <Box display="flex" gap={1}>
            <Chip 
              label={`${stats?.present || 0} içeride`}
              color="success"
              size="small"
              icon={<People />}
            />
            <Chip 
              label={`${stats?.absent || 0} gelmedi`}
              color="error"
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Grid container spacing={1}>
          {actions.map((action, index) => (
            <Grid item xs={4} sm={12/7} key={action.id}>
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
                      bgcolor: action.highlight ? `${action.color}25` : `${action.color}10`,
                      border: action.highlight ? `2px solid ${action.color}` : `1px solid ${action.color}30`,
                      '&:hover': {
                        bgcolor: `${action.color}30`
                      },
                      position: 'relative',
                      overflow: 'visible'
                    }}
                  >
                    {action.highlight && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          bgcolor: 'warning.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          fontSize: '0.65rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold'
                        }}
                      >
                        ★
                      </Box>
                    )}
                    <Badge badgeContent={action.badge} color="error" max={99}>
                      {React.cloneElement(action.icon, { 
                        sx: { color: action.color, fontSize: 28, mb: 0.5 } 
                      })}
                    </Badge>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: action.color,
                        fontWeight: action.highlight ? 'bold' : 'medium',
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

        {/* Alternatif giriş yöntemleri bilgi kutusu */}
        <Alert 
          severity="info" 
          sx={{ mt: 2, py: 0.5 }}
          icon={<TouchApp />}
        >
          <Typography variant="caption">
            <strong>💡 QR okutamayan çalışanlar için:</strong> Kiosk Modu veya Yardımlı Giriş kullanın
          </Typography>
        </Alert>
      </Paper>

      {/* Daha Fazla Menüsü */}
      <Menu
        anchorEl={moreMenuAnchor}
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setConfirmDialog({ open: true, type: 'approve' }); setMoreMenuAnchor(null); }}>
          <ListItemIcon><PlaylistAddCheck /></ListItemIcon>
          <ListItemText>Toplu Onayla</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setEmailDialog(true); setMoreMenuAnchor(null); }}>
          <ListItemIcon><Send /></ListItemIcon>
          <ListItemText>Toplu Bildirim</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onAction?.('exportDaily'); setMoreMenuAnchor(null); }}>
          <ListItemIcon><Download /></ListItemIcon>
          <ListItemText>Günlük Rapor</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { openKioskMode('MERKEZ'); setMoreMenuAnchor(null); }}>
          <ListItemIcon><Tablet /></ListItemIcon>
          <ListItemText>🏭 Merkez Kiosk</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { openKioskMode('IŞIL'); setMoreMenuAnchor(null); }}>
          <ListItemIcon><Tablet /></ListItemIcon>
          <ListItemText>🏢 Işıl Kiosk</ListItemText>
        </MenuItem>
      </Menu>

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

      {/* Yardımlı Giriş Dialog */}
      <AssistedCheckIn
        open={assistedCheckInOpen}
        onClose={() => setAssistedCheckInOpen(false)}
        branch={branch}
        supervisorName="Yönetici"
        onSuccess={() => {
          onRefresh?.();
          setAssistedCheckInOpen(false);
        }}
      />

      {/* 🆕 Kiosk Şube Seçim Dialog */}
      <Dialog 
        open={kioskBranchDialog} 
        onClose={() => setKioskBranchDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #00897b 0%, #00695c 100%)',
            color: 'white',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Tablet sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">
            Kiosk Terminal Aç
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
            Hangi şube için tablet terminali açmak istiyorsunuz?
          </Typography>
        </Box>
        
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={2}>
            {/* Merkez Şube */}
            <Grid item xs={6}>
              <Paper
                onClick={() => openKioskMode('MERKEZ')}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: 2,
                  borderColor: 'primary.main',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    transform: 'scale(1.02)',
                    boxShadow: 4
                  }
                }}
              >
                <Typography variant="h1" sx={{ mb: 1 }}>🏭</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  Merkez Şube
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ana fabrika terminali
                </Typography>
              </Paper>
            </Grid>
            
            {/* Işıl Şube */}
            <Grid item xs={6}>
              <Paper
                onClick={() => openKioskMode('IŞIL')}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: 2,
                  borderColor: 'secondary.main',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'secondary.light',
                    transform: 'scale(1.02)',
                    boxShadow: 4
                  }
                }}
              >
                <Typography variant="h1" sx={{ mb: 1 }}>🏢</Typography>
                <Typography variant="h6" fontWeight="bold" color="secondary.main">
                  Işıl Şube
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Işıl üretim terminali
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              • Terminal yeni sekmede tam ekran açılacak<br />
              • QR kod gerektirmeden giriş/çıkış yapılabilir<br />
              • Yaşlı ve teknoloji zorluğu yaşayan çalışanlar için ideal
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setKioskBranchDialog(false)}>
            İptal
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuickActionsPanel;

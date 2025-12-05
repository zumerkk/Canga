import React, { useState } from 'react';
import {
  Box,
  Paper,
  Checkbox,
  Button,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Tooltip,
  Slide
} from '@mui/material';
import {
  CheckCircle,
  Download,
  Email,
  Print,
  MoreVert,
  Close,
  CheckBox,
  CheckBoxOutlineBlank,
  IndeterminateCheckBox,
  Send,
  Verified,
  Cancel,
  Warning
} from '@mui/icons-material';
import api from '../../config/api';
import { exportToExcel } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

/**
 * 📋 Bulk Actions Toolbar
 * Toplu işlem araç çubuğu
 */

const BulkActionsToolbar = ({
  records = [],
  selectedIds = [],
  onSelectAll,
  onSelectNone,
  onSelectChange,
  onActionComplete
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [notifyDialog, setNotifyDialog] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCount = selectedIds.length;
  const totalCount = records.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  // Seçili kayıtları getir
  const selectedRecords = records.filter(r => selectedIds.includes(r._id));

  // Menüyü aç/kapat
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // Tümünü seç/kaldır
  const handleSelectAllClick = () => {
    if (allSelected || someSelected) {
      onSelectNone?.();
    } else {
      onSelectAll?.();
    }
  };

  // Toplu onaylama
  const handleBulkApprove = async () => {
    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const record of selectedRecords) {
        try {
          await api.put(`/api/attendance/${record._id}/correct`, {
            verified: true,
            verifiedBy: 'bulk_action',
            reason: 'Toplu onaylama'
          });
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      toast.success(`${successCount} kayıt onaylandı${errorCount > 0 ? `, ${errorCount} hata` : ''}`);
      onActionComplete?.();
      onSelectNone?.();
    } catch (error) {
      toast.error('Toplu onaylama başarısız');
    } finally {
      setLoading(false);
      setConfirmDialog({ open: false, type: null });
    }
  };

  // Seçili kayıtları export et
  const handleExportSelected = async () => {
    setLoading(true);
    try {
      const exportData = selectedRecords.map(r => ({
        'Ad Soyad': r.employeeId?.adSoyad || '-',
        'TC No': r.employeeId?.tcNo || '-',
        'Pozisyon': r.employeeId?.pozisyon || '-',
        'Lokasyon': r.employeeId?.lokasyon || '-',
        'Şube': r.checkIn?.branch || '-',
        'Giriş Saati': r.checkIn?.time ? new Date(r.checkIn.time).toLocaleTimeString('tr-TR') : '-',
        'Çıkış Saati': r.checkOut?.time ? new Date(r.checkOut.time).toLocaleTimeString('tr-TR') : '-',
        'Çalışma Süresi': r.workDuration ? `${Math.floor(r.workDuration / 60)}s ${r.workDuration % 60}dk` : '-',
        'Durum': r.status || '-',
        'Yöntem': r.checkIn?.method || '-'
      }));

      exportToExcel(exportData, `secili_kayitlar_${new Date().toISOString().split('T')[0]}`);
      toast.success(`${selectedCount} kayıt export edildi`);
    } catch (error) {
      toast.error('Export başarısız');
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };

  // Yazdır
  const handlePrint = () => {
    window.print();
    handleMenuClose();
  };

  // Bildirim gönder
  const handleSendNotification = async () => {
    if (!notifyMessage.trim()) {
      toast.error('Mesaj boş olamaz');
      return;
    }

    setLoading(true);
    try {
      const employeeIds = [...new Set(selectedRecords.map(r => r.employeeId?._id).filter(Boolean))];
      
      await api.post('/api/notifications/send-bulk', {
        recipients: employeeIds,
        message: notifyMessage,
        type: 'ATTENDANCE_NOTICE'
      });

      toast.success(`${employeeIds.length} çalışana bildirim gönderildi`);
      setNotifyDialog(false);
      setNotifyMessage('');
    } catch (error) {
      toast.error('Bildirim gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  // Görünürlük kontrolü
  if (selectedCount === 0) return null;

  return (
    <>
      <Slide direction="up" in={selectedCount > 0} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            py: 1.5,
            px: 3,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 1200,
            bgcolor: 'primary.main',
            color: 'white',
            minWidth: 400
          }}
        >
          {/* Seçim checkbox */}
          <Tooltip title={allSelected ? 'Tümünü kaldır' : someSelected ? 'Tümünü kaldır' : 'Tümünü seç'}>
            <IconButton size="small" onClick={handleSelectAllClick} sx={{ color: 'white' }}>
              {allSelected ? (
                <CheckBox />
              ) : someSelected ? (
                <IndeterminateCheckBox />
              ) : (
                <CheckBoxOutlineBlank />
              )}
            </IconButton>
          </Tooltip>

          {/* Seçim sayısı */}
          <Box>
            <Typography variant="body2" fontWeight="bold">
              {selectedCount} kayıt seçildi
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              / {totalCount} toplam
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />

          {/* Hızlı aksiyonlar */}
          <Tooltip title="Seçilenleri onayla">
            <Button
              variant="contained"
              size="small"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Verified />}
              onClick={() => setConfirmDialog({ open: true, type: 'approve' })}
              disabled={loading}
              sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
            >
              Onayla
            </Button>
          </Tooltip>

          <Tooltip title="Excel olarak indir">
            <Button
              variant="contained"
              size="small"
              startIcon={<Download />}
              onClick={handleExportSelected}
              disabled={loading}
              sx={{ bgcolor: 'info.main', '&:hover': { bgcolor: 'info.dark' } }}
            >
              Export
            </Button>
          </Tooltip>

          <Tooltip title="Bildirim gönder">
            <Button
              variant="contained"
              size="small"
              startIcon={<Send />}
              onClick={() => setNotifyDialog(true)}
              disabled={loading}
              sx={{ bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
            >
              Bildir
            </Button>
          </Tooltip>

          {/* Diğer işlemler */}
          <IconButton size="small" onClick={handleMenuOpen} sx={{ color: 'white' }}>
            <MoreVert />
          </IconButton>

          {/* Seçimi kaldır */}
          <Tooltip title="Seçimi kaldır">
            <IconButton size="small" onClick={onSelectNone} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Tooltip>
        </Paper>
      </Slide>

      {/* More Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handlePrint}>
          <ListItemIcon><Print fontSize="small" /></ListItemIcon>
          <ListItemText>Yazdır</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportSelected}>
          <ListItemIcon><Download fontSize="small" /></ListItemIcon>
          <ListItemText>CSV olarak indir</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleMenuClose(); setConfirmDialog({ open: true, type: 'flag' }); }}>
          <ListItemIcon><Warning fontSize="small" color="warning" /></ListItemIcon>
          <ListItemText>Düzeltme gerekli işaretle</ListItemText>
        </MenuItem>
      </Menu>

      {/* Onay Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: null })}>
        <DialogTitle>
          {confirmDialog.type === 'approve' ? 'Toplu Onaylama' : 'Düzeltme İşareti'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.type === 'approve' 
              ? `${selectedCount} kayıt onaylanacak. Devam etmek istiyor musunuz?`
              : `${selectedCount} kayıt "düzeltme gerekli" olarak işaretlenecek.`
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: null })}>İptal</Button>
          <Button 
            onClick={confirmDialog.type === 'approve' ? handleBulkApprove : () => {}}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Onayla'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bildirim Dialog */}
      <Dialog open={notifyDialog} onClose={() => setNotifyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Çalışanlara Bildirim Gönder</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {[...new Set(selectedRecords.map(r => r.employeeId?.adSoyad))].length} benzersiz çalışana bildirim gönderilecek.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Mesaj"
            value={notifyMessage}
            onChange={(e) => setNotifyMessage(e.target.value)}
            placeholder="Giriş-çıkış kayıtlarınızla ilgili bir bilgilendirme..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotifyDialog(false)}>İptal</Button>
          <Button 
            onClick={handleSendNotification}
            variant="contained"
            disabled={loading || !notifyMessage.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          >
            Gönder
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionsToolbar;

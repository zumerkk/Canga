import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';

// API tabanı
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const LeaveEditModal = ({ open, onClose, employee, leaveRequest, onLeaveUpdated, showNotification }) => {
  const [editedRequest, setEditedRequest] = useState({
    startDate: null,
    endDate: null,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal açıldığında state'i güncelle - sadece modal açıldığında çalışsın
  useEffect(() => {
    if (open && leaveRequest) {
      console.log('🔄 LeaveEditModal açıldı:', { 
        open, 
        employee: employee?.adSoyad, 
        leaveRequest: leaveRequest._id 
      });
      
      setEditedRequest({
        startDate: leaveRequest.startDate ? new Date(leaveRequest.startDate) : null,
        endDate: leaveRequest.endDate ? new Date(leaveRequest.endDate) : null,
        notes: leaveRequest.notes || ''
      });
      setError(null);
      
      console.log('✅ Modal state güncellendi:', {
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        notes: leaveRequest.notes
      });
    }
  }, [open]); // Sadece open değiştiğinde çalışsın

  const calculateDays = () => {
    if (!editedRequest.startDate || !editedRequest.endDate) return 0;
    const diffTime = Math.abs(editedRequest.endDate - editedRequest.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };



  const handleEdit = async () => {
    try {
      console.log('📝 İzin düzenleme başlatıldı:', {
        employeeId: employee._id,
        employeeName: employee.adSoyad,
        requestId: leaveRequest._id,
        editedData: {
          startDate: editedRequest.startDate,
          endDate: editedRequest.endDate,
          days: calculateDays(),
          notes: editedRequest.notes
        }
      });
      
      setLoading(true);
      setError(null);

      const requestBody = {
        startDate: editedRequest.startDate,
        endDate: editedRequest.endDate,
        days: calculateDays(),
        notes: editedRequest.notes
      };

      console.log('🚀 API isteği gönderiliyor:', {
        url: `${API_BASE}/api/annual-leave/${employee._id}/edit-request/${leaveRequest._id}`,
        method: 'PUT',
        body: requestBody
      });

      const response = await fetch(`${API_BASE}/api/annual-leave/${employee._id}/edit-request/${leaveRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('📥 API yanıtı alındı:', { status: response.status, data });

      if (response.ok) {
        console.log('✅ İzin başarıyla güncellendi');
        
        // Uyarı mesajı varsa göster
        if (data.warning) {
          showNotification(data.warning, 'warning');
        } else {
          showNotification('İzin başarıyla güncellendi', 'success');
        }
        
        if (onLeaveUpdated) {
          console.log('🔄 Veri yenileme tetikleniyor...');
          onLeaveUpdated();
        }
        onClose();
      } else {
        console.error('❌ İzin güncelleme hatası:', data.message);
        setError(data.message || 'İzin düzenlenirken hata oluştu');
      }
    } catch (error) {
      console.error('💥 İzin düzenleme exception:', error);
      setError('İzin düzenlenirken bir hata oluştu');
    } finally {
      setLoading(false);
      console.log('🏁 İzin düzenleme işlemi tamamlandı');
    }
  };

  const handleDelete = async () => {
    console.log('🗑️ İzin silme onayı isteniyor:', {
      employeeId: employee._id,
      employeeName: employee.adSoyad,
      requestId: leaveRequest._id
    });
    
    if (!window.confirm('Bu izin talebini silmek istediğinizden emin misiniz?')) {
      console.log('❌ İzin silme işlemi kullanıcı tarafından iptal edildi');
      return;
    }

    try {
      console.log('🚀 İzin silme işlemi başlatıldı');
      setLoading(true);
      setError(null);

      const deleteUrl = `${API_BASE}/api/annual-leave/${employee._id}/delete-request/${leaveRequest._id}`;
      console.log('🚀 DELETE isteği gönderiliyor:', { url: deleteUrl });

      const response = await fetch(deleteUrl, {
        method: 'DELETE'
      });

      const data = await response.json();
      console.log('📥 DELETE yanıtı alındı:', { status: response.status, data });

      if (response.ok) {
        console.log('✅ İzin başarıyla silindi');
        showNotification('İzin başarıyla silindi', 'success');
        if (onLeaveUpdated) {
          console.log('🔄 Veri yenileme tetikleniyor...');
          onLeaveUpdated();
        }
        onClose();
      } else {
        console.error('❌ İzin silme hatası:', data.message);
        setError(data.message || 'İzin silinirken hata oluştu');
      }
    } catch (error) {
      console.error('💥 İzin silme exception:', error);
      setError('İzin silinirken bir hata oluştu');
    } finally {
      setLoading(false);
      console.log('🏁 İzin silme işlemi tamamlandı');
    }
  };

  const handleClose = () => {
    console.log('✅ Modal kapatılıyor...');
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={false}
      aria-labelledby="leave-edit-dialog-title"
      aria-describedby="leave-edit-dialog-description"
      role="dialog"
    >
      <DialogTitle id="leave-edit-dialog-title">
        <Box display="flex" alignItems="center" gap={2}>
          <EditIcon color="primary" />
          <Typography variant="h6">İzin Düzenle</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Başlangıç Tarihi"
                value={editedRequest.startDate}
                onChange={(newValue) => {
                  console.log('📅 Başlangıç tarihi değiştirildi:', newValue);
                  setEditedRequest(prev => ({ ...prev, startDate: newValue }));
                }}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    id: 'leave-edit-start-date',
                    name: 'leaveEditStartDate'
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Bitiş Tarihi"
                value={editedRequest.endDate}
                onChange={(newValue) => {
                  console.log('📅 Bitiş tarihi değiştirildi:', newValue);
                  setEditedRequest(prev => ({ ...prev, endDate: newValue }));
                }}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    id: 'leave-edit-end-date',
                    name: 'leaveEditEndDate'
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="leave-edit-total-days"
              name="leaveEditTotalDays"
              label="Toplam Gün"
              value={calculateDays()}
              disabled
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="leave-edit-notes"
              name="leaveEditNotes"
              label="Notlar"
              multiline
              rows={3}
              value={editedRequest.notes}
              onChange={(e) => {
                console.log('📝 Notlar değiştirildi:', e.target.value);
                setEditedRequest(prev => ({ ...prev, notes: e.target.value }));
              }}
              fullWidth
              placeholder="İzin ile ilgili notlarınızı buraya yazabilirsiniz..."
            />
          </Grid>
        </Grid>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} role="alert" aria-live="polite">
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          İptal
        </Button>
        <Button 
          onClick={handleDelete}
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          Sil
        </Button>
        <Button 
          onClick={handleEdit}
          variant="contained"
          disabled={loading || !editedRequest.startDate || !editedRequest.endDate}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveEditModal;
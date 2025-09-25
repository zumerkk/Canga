import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';


// 🛠️ İŞ BAŞVURU FORMU DÜZENLEYİCİSİ - İK için
function JobApplicationEditor() {
  const { user } = useAuth();
  
  // Core states
  const [formStructure, setFormStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  
  // Form field state
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    options: [],
    placeholder: '',
    validation: {}
  });
  
  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Form yapısını yükle
  useEffect(() => {
    loadFormStructure();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFormStructure = async () => {
    setLoading(true);
    try {
      // API'den form yapısını çek
      const response = await fetch(`${API_BASE_URL}/api/form-structure`);
      const result = await response.json();
      
      if (result.success) {
        setFormStructure(result.data);
      } else {
        // Varsayılan form yapısı
        setFormStructure(getDefaultFormStructure());
      }
    } catch (error) {
      console.error('Form yapısı yükleme hatası:', error);
      // Varsayılan form yapısını kullan
      setFormStructure(getDefaultFormStructure());
    }
    setLoading(false);
  };

  // Varsayılan form yapısı
  const getDefaultFormStructure = () => ({
    title: 'İş Başvuru Formu',
    description: 'Çanga Savunma Endüstrisi A.Ş. İş Başvuru Sistemi',
    sections: [
      {
        id: 'personal',
        title: 'A. KİŞİSEL BİLGİLER',
        icon: 'person',
        active: true,
        fields: [
          { name: 'name', label: 'Adınız', type: 'text', required: true },
          { name: 'surname', label: 'Soyadınız', type: 'text', required: true },
          { name: 'email', label: 'E-posta', type: 'email', required: true },
          { name: 'phone', label: 'Telefon', type: 'tel', required: true },
          { name: 'gender', label: 'Cinsiyet', type: 'radio', required: true, options: ['Erkek', 'Bayan'] },
          { name: 'address', label: 'Adres', type: 'textarea', required: true }
        ]
      },
      {
        id: 'family',
        title: 'B. AİLE BİLGİLERİ',
        icon: 'family',
        active: true,
        fields: [
          { name: 'maritalStatus', label: 'Medeni Durum', type: 'select', options: ['Evli', 'Bekar'] },
          { name: 'spouseName', label: 'Eş Adı', type: 'text' },
          { name: 'childrenCount', label: 'Çocuk Sayısı', type: 'number' }
        ]
      },
      {
        id: 'education',
        title: 'C. EĞİTİM BİLGİLERİ',
        icon: 'school',
        active: true,
        fields: [
          { name: 'schoolName', label: 'Okul Adı', type: 'text', required: true },
          { name: 'department', label: 'Bölüm', type: 'text', required: true },
          { name: 'graduationYear', label: 'Mezuniyet Yılı', type: 'number' },
          { name: 'degree', label: 'Derece', type: 'select', options: ['Lise', 'Ön Lisans', 'Lisans', 'Yüksek Lisans', 'Doktora'] }
        ]
      }
    ],
    settings: {
      allowAnonymous: true,
      requireEmailVerification: false,
      autoSaveEnabled: true,
      maxFileSize: '5MB',
      allowedFileTypes: ['pdf', 'doc', 'docx']
    }
  });

  // Form yapısını kaydet
  const saveFormStructure = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/form-structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          structure: formStructure,
          updatedBy: user?.employeeId || 'HR-001'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Form yapısı başarıyla kaydedildi! 🎉',
          severity: 'success'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Form yapısı kaydetme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Form yapısı kaydedilemedi!',
        severity: 'error'
      });
    }
  };

  // Yeni alan ekleme
  const handleAddField = (sectionId) => {
    setCurrentSection(sectionId);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
      placeholder: ''
    });
    setEditDialog(true);
  };

  // Alan kaydetme
  const handleSaveField = () => {
    if (!newField.name || !newField.label) {
      setSnackbar({
        open: true,
        message: 'Alan adı ve etiketi zorunludur!',
        severity: 'error'
      });
      return;
    }

    setFormStructure(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === currentSection
          ? {
              ...section,
              fields: [...section.fields, { ...newField, id: Date.now() }]
            }
          : section
      )
    }));

    setEditDialog(false);
    setSnackbar({
      open: true,
      message: 'Alan başarıyla eklendi!',
      severity: 'success'
    });
  };

  // Alan silme
  const handleDeleteField = (sectionId, fieldIndex) => {
    if (window.confirm('Bu alanı silmek istediğinizden emin misiniz?')) {
      setFormStructure(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === sectionId
            ? {
                ...section,
                fields: section.fields.filter((_, index) => index !== fieldIndex)
              }
            : section
        )
      }));

      setSnackbar({
        open: true,
        message: 'Alan silindi!',
        severity: 'info'
      });
    }
  };

  // Bölüm aktif/pasif
  const toggleSection = (sectionId) => {
    setFormStructure(prev => ({
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId
          ? { ...section, active: !section.active }
          : section
      )
    }));
  };

  // Alan türü değişimi için seçenekler
  const fieldTypes = [
    { value: 'text', label: 'Metin' },
    { value: 'email', label: 'E-posta' },
    { value: 'tel', label: 'Telefon' },
    { value: 'number', label: 'Sayı' },
    { value: 'textarea', label: 'Çok Satırlı Metin' },
    { value: 'select', label: 'Açılır Liste' },
    { value: 'radio', label: 'Seçenek Butonları' },
    { value: 'checkbox', label: 'Onay Kutusu' },
    { value: 'date', label: 'Tarih' },
    { value: 'file', label: 'Dosya Yükleme' }
  ];

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography color="text.secondary">
            Form editörü yükleniyor...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Minimal Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Form Düzenleyici
          </Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveFormStructure}
            size="small"
          >
            Kaydet
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          İş başvuru formunu özelleştirin ve alanları düzenleyin
        </Typography>
      </Box>

      {/* Form Ayarları */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Form Ayarları
        </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Form Başlığı"
                value={formStructure?.title || ''}
                onChange={(e) => setFormStructure(prev => ({ ...prev, title: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Form Açıklaması"
                value={formStructure?.description || ''}
                onChange={(e) => setFormStructure(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formStructure?.settings?.allowAnonymous || false}
                    onChange={(e) => setFormStructure(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowAnonymous: e.target.checked }
                    }))}
                  />
                }
                label="Anonim Erişime İzin Ver"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formStructure?.settings?.requireEmailVerification || false}
                    onChange={(e) => setFormStructure(prev => ({
                      ...prev,
                      settings: { ...prev.settings, requireEmailVerification: e.target.checked }
                    }))}
                  />
                }
                label="E-posta Doğrulaması Gerekli"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formStructure?.settings?.autoSaveEnabled || false}
                    onChange={(e) => setFormStructure(prev => ({
                      ...prev,
                      settings: { ...prev.settings, autoSaveEnabled: e.target.checked }
                    }))}
                  />
                }
                label="Otomatik Kaydetme"
              />
            </Grid>
          </Grid>
      </Paper>

      {/* Form Bölümleri */}
      <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom>
            Form Bölümleri
          </Typography>

          {formStructure?.sections?.map((section, sectionIndex) => (
            <Accordion key={section.id} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {section.title}
                  </Typography>
                  <Switch
                    checked={section.active}
                    onChange={() => toggleSection(section.id)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleAddField(section.id)}
                    size="small"
                  >
                    Alan Ekle
                  </Button>
                </Box>

                <List>
                  {section.fields?.map((field, fieldIndex) => (
                    <ListItem key={fieldIndex} divider>
                      <ListItemText
                        primary={
                          <Typography variant="body1">
                            {field.label} {field.required && '*'}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {field.type} • {field.name}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteField(section.id, fieldIndex)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
      </Paper>

      {/* Public Link Bilgisi */}
      <Paper sx={{ p: 2, mt: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Başvuru Linki
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          value={`${window.location.origin}/public/job-application`}
          InputProps={{
            readOnly: true,
            style: { fontFamily: 'monospace', fontSize: '0.875rem' }
          }}
          size="small"
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Bu link herkese açıktır ve şifre gerektirmez
        </Typography>
      </Paper>

      {/* Yeni Alan Ekleme Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Alan Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alan Adı (Teknik)"
                value={newField.name}
                onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ornek: firstName"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alan Etiketi (Görünen)"
                value={newField.label}
                onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                placeholder="örnek: Adınız"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Alan Türü</InputLabel>
                <Select
                  value={newField.type}
                  onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value }))}
                  label="Alan Türü"
                >
                  {fieldTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newField.required}
                    onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                  />
                }
                label="Zorunlu Alan"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Placeholder Metin"
                value={newField.placeholder}
                onChange={(e) => setNewField(prev => ({ ...prev, placeholder: e.target.value }))}
                placeholder="Kullanıcıya ipucu metni"
              />
            </Grid>
            {(newField.type === 'select' || newField.type === 'radio') && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Seçenekler (virgülle ayırın)"
                  value={newField.options.join(', ')}
                  onChange={(e) => setNewField(prev => ({ 
                    ...prev, 
                    options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                  }))}
                  placeholder="Seçenek 1, Seçenek 2, Seçenek 3"
                  multiline
                  rows={2}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>İptal</Button>
          <Button onClick={handleSaveField} variant="contained">Kaydet</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default JobApplicationEditor;

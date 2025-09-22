import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
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
  Chip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Avatar,
  Stack,
  Tooltip,
  Slide,
  Grow,
  Fade,
  Skeleton,
  Divider,
  Tab,
  Tabs,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Public as PublicIcon,
  Security as SecurityIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Code as CodeIcon,
  Palette as PaletteIcon,
  Build as BuildIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  ContactPhone as ContactIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

// Modern field type configuration with enhanced design
const fieldTypeConfig = {
  text: { label: 'Metin', icon: '📝', color: 'primary' },
  email: { label: 'E-posta', icon: '✉️', color: 'info' },
  tel: { label: 'Telefon', icon: '📞', color: 'secondary' },
  number: { label: 'Sayı', icon: '🔢', color: 'warning' },
  textarea: { label: 'Çok Satırlı Metin', icon: '📄', color: 'success' },
  select: { label: 'Açılır Liste', icon: '📋', color: 'info' },
  radio: { label: 'Seçenek Butonları', icon: '🔘', color: 'secondary' },
  checkbox: { label: 'Onay Kutusu', icon: '☑️', color: 'success' },
  date: { label: 'Tarih', icon: '📅', color: 'warning' },
  file: { label: 'Dosya Yükleme', icon: '📎', color: 'error' }
};

// Section Icons
const sectionIcons = {
  personal: { icon: <PersonIcon />, color: 'primary' },
  family: { icon: <ContactIcon />, color: 'secondary' },
  education: { icon: <SchoolIcon />, color: 'info' },
  experience: { icon: <WorkIcon />, color: 'success' },
  default: { icon: <BuildIcon />, color: 'warning' }
};

// 🛠️ İŞ BAŞVURU FORMU DÜZENLEYİCİSİ - İK için
function JobApplicationEditor() {
  const { user } = useAuth();
  const [formStructure, setFormStructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    options: [],
    placeholder: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedTab, setSelectedTab] = useState(0);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Skeleton variant="circular" width={64} height={64} sx={{ mr: 3 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width={300} height={40} />
              <Skeleton variant="text" width={200} height={24} sx={{ mt: 1 }} />
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {[1, 2, 3].map((index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                  <Skeleton variant="text" width="80%" height={32} />
                  <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2 }} />
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <LinearProgress sx={{ borderRadius: 2, height: 6, maxWidth: 300, mx: 'auto' }} />
            <Typography sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
              Form editörü yükleniyor...
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Modern Hero Header */}
      <Slide direction="down" in timeout={800}>
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="3" cy="3" r="3"/>%3C/g%3E%3C/svg%3E")',
              opacity: 0.3
            }
          }}
        >
          <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 80,
                    height: 80,
                    mr: 3,
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  <BuildIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      background: 'linear-gradient(45deg, #ffffff 30%, #f8f9ff 90%)',
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      lineHeight: 1.2
                    }}
                  >
                    Form Editörü
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.95, 
                      fontWeight: 400, 
                      mb: 1 
                    }}
                  >
                    İş Başvuru Formu Düzenleyici
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BuildIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {formStructure?.sections?.length || 0} Bölüm
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                        {formStructure?.sections?.reduce((total, section) => total + (section.fields?.length || 0), 0) || 0} Alan
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
              
              <Stack direction="row" spacing={2}>
                <Tooltip title="Formu Önizle" arrow>
                  <IconButton
                    onClick={() => window.open('/public/job-application', '_blank')}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={saveFormStructure}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.3)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  Değişiklikleri Kaydet
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Paper>
      </Slide>

      {/* Form Ayarları */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SecurityIcon sx={{ mr: 1 }} />
            Form Genel Ayarları
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
        </CardContent>
      </Card>

      {/* Form Bölümleri */}
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Form Bölümleri
          </Typography>

          {formStructure?.sections?.map((section, sectionIndex) => (
            <Accordion key={section.id} elevation={2} sx={{ mb: 2 }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  backgroundColor: section.active ? 'primary.light' : 'grey.100',
                  color: section.active ? 'white' : 'text.secondary'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {section.title}
                  </Typography>
                  <Chip 
                    label={section.active ? 'Aktif' : 'Pasif'} 
                    color={section.active ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 2 }}
                  />
                  <Switch
                    checked={section.active}
                    onChange={() => toggleSection(section.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {field.label}
                            </Typography>
                            {field.required && (
                              <Chip label="Zorunlu" color="error" size="small" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Chip label={field.type} variant="outlined" size="small" sx={{ mr: 1 }} />
                            <Typography variant="caption" color="text.secondary">
                              Alan Adı: {field.name}
                            </Typography>
                          </Box>
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
        </CardContent>
      </Card>

      {/* Public Link Bilgisi */}
      <Paper elevation={3} sx={{ p: 3, mt: 3, bgcolor: 'info.light' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <PublicIcon sx={{ mr: 1 }} />
          Public Başvuru Linki
        </Typography>
        <Typography variant="body1" paragraph>
          Başvuruları almak için aşağıdaki linki paylaşabilirsiniz:
        </Typography>
        <Paper elevation={1} sx={{ p: 2, bgcolor: 'white' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {window.location.origin}/public/job-application
          </Typography>
        </Paper>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          💡 Bu link herkese açıktır ve şifre gerektirmez
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

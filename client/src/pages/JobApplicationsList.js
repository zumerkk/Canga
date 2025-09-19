import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Tooltip,
  Menu,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Başvuru durumu renklandırması
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'reviewing': return 'info';  
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'interview': return 'secondary';
    default: return 'default';
  }
};

// Başvuru durumu metinleri
const getStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Bekliyor';
    case 'reviewing': return 'İnceleniyor';
    case 'approved': return 'Onaylandı';
    case 'rejected': return 'Reddedildi';
    case 'interview': return 'Mülakat';
    default: return 'Bilinmiyor';
  }
};

function JobApplicationsList() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);

  // API'den başvuruları yükle
  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      
      try {
        // Gerçek API çağrısı
        const response = await fetch('http://localhost:5001/api/job-applications');
        const result = await response.json();
        
        if (result.success) {
          setApplications(result.data.applications);
        } else {
          throw new Error(result.message);
        }
        
      } catch (error) {
        console.error('API hatası, demo veriler kullanılıyor:', error);
        
        // API hatası durumunda demo veri - geliştirme için
        const demoApplications = [
        {
          id: 'JOB-1732123456789',
          personalInfo: {
            name: 'Ahmet',
            surname: 'Yılmaz', 
            gender: 'Erkek',
            phoneMobile: '0532 123 45 67',
            address: 'Çankaya, Ankara',
            nationality: 'TC'
          },
          educationInfo: [
            { schoolName: 'Gazi Üniversitesi', department: 'Makine Mühendisliği', degreeReceived: 'Lisans' }
          ],
          workExperience: [
            { companyName: 'ABC Şirketi', position: 'Mühendis', salaryReceived: '15000' }
          ],
          status: 'pending',
          submittedAt: '2024-11-20T10:30:00Z',
          submittedBy: 'GUEST',
          reviewedBy: null,
          notes: ''
        },
        {
          id: 'JOB-1732123456790',
          personalInfo: {
            name: 'Zeynep',
            surname: 'Kara',
            gender: 'Bayan', 
            phoneMobile: '0543 987 65 43',
            address: 'Kadıköy, İstanbul',
            nationality: 'TC'
          },
          educationInfo: [
            { schoolName: 'Boğaziçi Üniversitesi', department: 'Endüstri Mühendisliği', degreeReceived: 'Lisans' }
          ],
          workExperience: [
            { companyName: 'XYZ Corp', position: 'Proje Yöneticisi', salaryReceived: '22000' }
          ],
          status: 'reviewing',
          submittedAt: '2024-11-19T14:15:00Z',
          submittedBy: 'GUEST',
          reviewedBy: 'HR-001',
          notes: 'Profil uygun, mülakat aşamasına geçirilebilir.'
        },
        {
          id: 'JOB-1732123456791',
          personalInfo: {
            name: 'Mehmet',
            surname: 'Demir',
            gender: 'Erkek',
            phoneMobile: '0505 555 44 33', 
            address: 'Konak, İzmir',
            nationality: 'TC'
          },
          educationInfo: [
            { schoolName: 'Ege Üniversitesi', department: 'Bilgisayar Mühendisliği', degreeReceived: 'Lisans' }
          ],
          workExperience: [
            { companyName: 'Tech Start', position: 'Yazılım Geliştirici', salaryReceived: '18000' }
          ],
          status: 'approved',
          submittedAt: '2024-11-18T09:20:00Z',
          submittedBy: 'GUEST',
          reviewedBy: 'HR-001',
          notes: 'Başvuru onaylandı. İK ile görüşme planlandı.'
        },
        {
          id: 'JOB-1732123456792',
          personalInfo: {
            name: 'Ayşe',
            surname: 'Özkan',
            gender: 'Bayan',
            phoneMobile: '0532 444 33 22',
            address: 'Nilüfer, Bursa', 
            nationality: 'TC'
          },
          educationInfo: [
            { schoolName: 'Uludağ Üniversitesi', department: 'İktisat', degreeReceived: 'Lisans' }
          ],
          workExperience: [
            { companyName: 'Finance Co', position: 'Mali Müşavir', salaryReceived: '12000' }
          ],
          status: 'rejected',
          submittedAt: '2024-11-17T16:45:00Z',
          submittedBy: 'GUEST',
          reviewedBy: 'HR-002',
          notes: 'Deneyim alanı şirket gereksinimleri ile uyumlu değil.'
        }
      ];

        // Demo veri fallback
        setApplications(demoApplications);
      }
      
      setLoading(false);
    };

    loadApplications();
  }, []);

  // Başvuruları filtreleme
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.personalInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personalInfo.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    // Tab'a göre otomatik filtreleme
    const statusMap = ['all', 'pending', 'reviewing', 'approved', 'rejected'];
    setStatusFilter(statusMap[newValue]);
  };

  // Başvuru detayı gösterme
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailDialog(true);
  };

  // Başvuru durumu değiştirme
  const handleStatusChange = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setNotes(application.notes || '');
    setStatusDialog(true);
  };

  // Durum güncelleme işlemi
  const handleUpdateStatus = async () => {
    try {
      // Gerçek API çağrısı
      const response = await fetch(`http://localhost:5001/api/job-applications/${selectedApplication._id || selectedApplication.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes,
          reviewedBy: user?.employeeId || 'HR-001'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Applications dizisini güncelle
        setApplications(prev => 
          prev.map(app => 
            (app._id || app.id) === (selectedApplication._id || selectedApplication.id) 
              ? result.data 
              : app
          )
        );
      } else {
        throw new Error(result.message);
      }

      setSnackbar({
        open: true,
        message: 'Başvuru durumu başarıyla güncellendi! 🎉',
        severity: 'success'
      });

      setStatusDialog(false);
      setSelectedApplication(null);
      
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Güncelleme sırasında hata oluştu!',
        severity: 'error'
      });
    }
  };

  // Excel export fonksiyonu
  const handleExportToExcel = () => {
    // Burada Excel export işlemi yapılacak
    setSnackbar({
      open: true,
      message: 'Excel dosyası hazırlanıyor... 📊',
      severity: 'info'
    });
  };

  // Action menu
  const handleActionMenu = (event, application) => {
    setAnchorEl(event.currentTarget);
    setCurrentAction(application);
  };

  const handleCloseActionMenu = () => {
    setAnchorEl(null);
    setCurrentAction(null);
  };

  // Tab count'ları
  const getTabCount = (status) => {
    if (status === 'all') return applications.length;
    return applications.filter(app => app.status === status).length;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>İş Başvuruları Yükleniyor...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={6} sx={{ 
        p: 3, 
        mb: 3, 
        background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)', 
        color: 'white' 
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <BusinessIcon sx={{ mr: 2, fontSize: 40 }} />
              İş Başvuruları Yönetimi
            </Typography>
            <Typography variant="h6">
              İnsan Kaynakları Paneli - Tüm başvuruları buradan yönetebilirsiniz
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={handleExportToExcel}
            startIcon={<DownloadIcon />}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } 
            }}
          >
            Excel'e Aktar
          </Button>
        </Box>
      </Paper>

      {/* Filtreler */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Ad, soyad veya başvuru ID ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Durum Filtresi</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Durum Filtresi"
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="pending">Bekliyor</MenuItem>
                  <MenuItem value="reviewing">İnceleniyor</MenuItem>
                  <MenuItem value="approved">Onaylandı</MenuItem>
                  <MenuItem value="rejected">Reddedildi</MenuItem>
                  <MenuItem value="interview">Mülakat</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Toplam: <strong>{filteredApplications.length}</strong> başvuru
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Durum Tabları */}
      <Card elevation={3} sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Badge badgeContent={getTabCount('all')} color="primary">
                Tümü
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={getTabCount('pending')} color="warning">
                Bekliyor
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={getTabCount('reviewing')} color="info">
                İnceleniyor  
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={getTabCount('approved')} color="success">
                Onaylanan
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={getTabCount('rejected')} color="error">
                Reddedilen
              </Badge>
            } 
          />
        </Tabs>
      </Card>

      {/* Başvuru Listesi */}
      <Card elevation={3}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell><strong>Başvuru ID</strong></TableCell>
                <TableCell><strong>Başvuran</strong></TableCell>
                <TableCell><strong>İletişim</strong></TableCell>
                <TableCell><strong>Eğitim</strong></TableCell>
                <TableCell><strong>Deneyim</strong></TableCell>
                <TableCell><strong>Durum</strong></TableCell>
                <TableCell><strong>Tarih</strong></TableCell>
                <TableCell><strong>İşlemler</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.map((application) => (
                <TableRow 
                  key={application.id}
                  hover
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {application.id}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {application.personalInfo.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {application.personalInfo.name} {application.personalInfo.surname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {application.personalInfo.gender} • {application.personalInfo.nationality}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        {application.personalInfo.phoneMobile}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {application.personalInfo.address}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    {application.educationInfo[0] && (
                      <Box>
                        <Typography variant="body2">
                          {application.educationInfo[0].schoolName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {application.educationInfo[0].department}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  <TableCell>
                    {application.workExperience[0] && (
                      <Box>
                        <Typography variant="body2">
                          {application.workExperience[0].companyName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {application.workExperience[0].position} • {application.workExperience[0].salaryReceived} ₺
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip 
                      label={getStatusText(application.status)}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {new Date(application.submittedAt).toLocaleDateString('tr-TR')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(application.submittedAt).toLocaleTimeString('tr-TR')}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Detayları Görüntüle">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewDetails(application)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Durum Değiştir">
                        <IconButton 
                          size="small" 
                          onClick={() => handleStatusChange(application)}
                          color="secondary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Diğer İşlemler">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleActionMenu(e, application)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Başvuru Detay Dialog */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Başvuru Detayları - {selectedApplication?.id}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box sx={{ mt: 2 }}>
              {/* Kişisel Bilgiler */}
              <Typography variant="h6" gutterBottom color="primary">
                📋 Kişisel Bilgiler
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography><strong>Ad Soyad:</strong> {selectedApplication.personalInfo.name} {selectedApplication.personalInfo.surname}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Cinsiyet:</strong> {selectedApplication.personalInfo.gender}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Telefon:</strong> {selectedApplication.personalInfo.phoneMobile}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography><strong>Uyruk:</strong> {selectedApplication.personalInfo.nationality}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography><strong>Adres:</strong> {selectedApplication.personalInfo.address}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Eğitim Bilgileri */}
              <Typography variant="h6" gutterBottom color="secondary">
                🎓 Eğitim Bilgileri
              </Typography>
              {selectedApplication.educationInfo.map((edu, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography><strong>Okul:</strong> {edu.schoolName}</Typography>
                  <Typography><strong>Bölüm:</strong> {edu.department}</Typography>
                  <Typography><strong>Derece:</strong> {edu.degreeReceived}</Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* İş Deneyimi */}
              <Typography variant="h6" gutterBottom color="success.main">
                💼 İş Deneyimi
              </Typography>
              {selectedApplication.workExperience.map((work, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography><strong>Şirket:</strong> {work.companyName}</Typography>
                  <Typography><strong>Pozisyon:</strong> {work.position}</Typography>
                  <Typography><strong>Maaş:</strong> {work.salaryReceived} ₺</Typography>
                </Box>
              ))}

              {/* İnceleme Notları */}
              {selectedApplication.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom color="warning.main">
                    📝 İnceleme Notları
                  </Typography>
                  <Typography>{selectedApplication.notes}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Kapat</Button>
          <Button 
            variant="contained" 
            onClick={() => handleStatusChange(selectedApplication)}
          >
            Durum Değiştir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Durum Değiştirme Dialog */}
      <Dialog 
        open={statusDialog} 
        onClose={() => setStatusDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Başvuru Durumu Güncelle</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Yeni Durum</InputLabel>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                label="Yeni Durum"
              >
                <MenuItem value="pending">Bekliyor</MenuItem>
                <MenuItem value="reviewing">İnceleniyor</MenuItem>
                <MenuItem value="interview">Mülakat</MenuItem>
                <MenuItem value="approved">Onaylandı</MenuItem>
                <MenuItem value="rejected">Reddedildi</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="İnceleme Notları"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bu başvuru ile ilgili notlarınızı buraya yazın..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>İptal</Button>
          <Button 
            variant="contained" 
            onClick={handleUpdateStatus}
            color="primary"
          >
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseActionMenu}
      >
        <MenuItem onClick={() => {
          // E-mail gönderme işlemi
          setSnackbar({ open: true, message: 'E-mail gönderiliyor...', severity: 'info' });
          handleCloseActionMenu();
        }}>
          <EmailIcon sx={{ mr: 1 }} />
          E-mail Gönder
        </MenuItem>
        <MenuItem onClick={() => {
          // CV indirme işlemi
          setSnackbar({ open: true, message: 'CV indiriliyor...', severity: 'info' });
          handleCloseActionMenu();
        }}>
          <DownloadIcon sx={{ mr: 1 }} />
          CV İndir
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          // Başvuru silme işlemi
          if (window.confirm('Bu başvuruyu silmek istediğinizden emin misiniz?')) {
            setApplications(prev => prev.filter(app => app.id !== currentAction.id));
            setSnackbar({ open: true, message: 'Başvuru silindi!', severity: 'success' });
          }
          handleCloseActionMenu();
        }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Başvuruyu Sil
        </MenuItem>
      </Menu>

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
    </Box>
  );
}

export default JobApplicationsList;

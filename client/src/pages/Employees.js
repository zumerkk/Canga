import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Tooltip,
  TablePagination,
  CircularProgress,
  Fab,
  InputAdornment,
  Autocomplete,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Speed as SpeedIcon,
  PhotoCamera as PhotoCameraIcon,
  CloudUpload as CloudUploadIcon,
  DeleteOutline as DeletePhotoIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

// Import edilecek komponentler
import BulkEmployeeEditor from '../components/BulkEmployeeEditor';

// 🎨 Avatar renk fonksiyonu - İsme göre tutarlı renk üretir
const getRandomColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
};

// 🎨 Departman renk yardımcı fonksiyonu - Component dışında tanımla
const getDepartmentColor = (department) => {
  const colors = {
    // Excel'deki Departmanlar
    'MERKEZ FABRİKA': 'primary',
    'İŞİ_FABRİKA': 'secondary',
    'İDARİ': 'info',
    'TEKNİK OFİS / BAKIM ONARIM': 'warning',
    'ARGE': 'success',
    'İNSAN KAYNAKLARI': 'error',
    
    // Diğer
    'DİĞER': 'default'
  };
  return colors[department] || 'default';
};

// Çalışan kartı bileşeni
function EmployeeCard({ employee, onEdit, onDelete }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            src={employee.profilePhoto || ''} 
            sx={{ bgcolor: getRandomColor(employee.adSoyad || employee.employeeId), width: 56, height: 56 }}
          >
            {employee.adSoyad ? employee.adSoyad.split(' ').map(n => n[0]).join('').toUpperCase() : 'NA'}
          </Avatar>
          <Box ml={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {employee.adSoyad || 'İsimsiz Çalışan'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employee.employeeId} • {employee.pozisyon?.replace(/\s*\(ENGELLİ\)\s*/gi, '').trim() || 'Pozisyon Belirtilmemiş'}
            </Typography>
          </Box>
        </Box>

        {/* İletişim & Kişisel Bilgiler */}
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2">
                <strong>TC No:</strong> {employee.tcNo || '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2">
                <strong>Telefon:</strong> {employee.cepTelefonu || '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2">
                <strong>Doğum Tarihi:</strong> {employee.dogumTarihi ? new Date(employee.dogumTarihi).toLocaleDateString('tr-TR') : '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" mb={1}>
              <WorkIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2">
                <strong>Departman:</strong> {employee.departman || '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" mb={1}>
              <LocationIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2">
                <strong>Lokasyon:</strong> {employee.lokasyon || '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <WorkIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2">
                <strong>İşe Giriş:</strong> {employee.iseGirisTarihi ? new Date(employee.iseGirisTarihi).toLocaleDateString('tr-TR') : '-'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Servis Bilgileri */}
        {employee.servisGuzergahi && (
          <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              🚌 Servis Bilgileri
            </Typography>
            <Typography variant="body2">
              <strong>Güzergah:</strong> {employee.servisGuzergahi}
            </Typography>
            {employee.durak && (
              <Typography variant="body2">
                <strong>Durak:</strong> {employee.durak}
              </Typography>
            )}
          </Box>
        )}

        {/* Alt Bilgiler ve Eylemler */}
        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" gap={1}>
            <Chip 
              label={employee.durum || 'AKTIF'} 
              size="small"
              color={employee.durum === 'AKTIF' ? 'success' : 'default'}
            />
            {employee.iseFabrika && (
              <Chip 
                label={employee.iseFabrika} 
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Düzenle">
              <IconButton size="small" color="primary" onClick={() => onEdit(employee)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Sil">
              <IconButton size="small" color="error" onClick={() => onDelete(employee)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Ana çalışanlar bileşeni
function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' veya 'table'
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  // 🚀 Hızlı ekleme modu
  const [currentTab, setCurrentTab] = useState(0); // 0: Normal görünüm, 1: Hızlı ekleme
  const [bulkMode, setBulkMode] = useState(false);
  // 📝 Form verisi - Excel'deki kolonlara göre güncellendi
  const [formData, setFormData] = useState({
    // Kişisel Bilgiler
    adSoyad: '',
    tcNo: '',
    cepTelefonu: '',
    dogumTarihi: '',
    profilePhoto: '', // 📷 Personel fotoğrafı
    
    // İş Bilgileri
    employeeId: '',
    departman: '',
    iseFabrika: '',
    pozisyon: '',
    lokasyon: '',
    iseGirisTarihi: '',
    durum: 'AKTIF',
    
    // Servis Bilgileri
    servisGuzergahi: '',
    durak: '',
  });
  
  // 📷 Fotoğraf yükleme state'leri
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  
  // 📥 Excel Import Dialog
  const [importDialog, setImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // 🏢 Departman listesi - API'den dinamik olarak gelir
  const [departments, setDepartments] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);

  // 📍 Lokasyonlar - API'den dinamik olarak gelir
  const [locations, setLocations] = useState([]);
  const [locationStats, setLocationStats] = useState([]);

  // 📊 Çalışan durumları
  const statusOptions = [
    'AKTIF',
    'PASİF', 
    'İZİNLİ',
    'AYRILDI'
  ];

  // 🚌 Servis güzergahları ve durakları - API'den gelecek
  const [serviceRoutes, setServiceRoutes] = useState([]);
  const [availableStops, setAvailableStops] = useState([]);
  const [loadingStops, setLoadingStops] = useState(false);

  // 🚌 Servis güzergahlarını yükle
  const fetchServiceRoutes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/routes/names`);
      if (response.ok) {
        const data = await response.json();
        setServiceRoutes(data.data || []);
      }
    } catch (error) {
      console.error('Servis güzergahları yükleme hatası:', error);
    }
  };

  // 🏢 Departman listesini yükle
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/departments`);
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Departman listesi yükleme hatası:', error);
    }
  };

  // 📍 Lokasyon listesini yükle
  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data.data || []);
      }
    } catch (error) {
      console.error('Lokasyon listesi yükleme hatası:', error);
    }
  };

  // 📊 Departman ve lokasyon istatistiklerini yükle
  const fetchFilterStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/stats/filters`);
      if (response.ok) {
        const data = await response.json();
        setDepartmentStats(data.data.departments || []);
        setLocationStats(data.data.locations || []);
      }
    } catch (error) {
      console.error('Filtre istatistikleri yükleme hatası:', error);
    }
  };

  // 🚏 Seçilen güzergahın duraklarını yükle
  const fetchStopsForRoute = async (routeName) => {
    if (!routeName) {
      console.log("⚠️ Güzergah adı boş, duraklar yüklenmiyor");
      setAvailableStops([]);
      return;
    }

    try {
      setLoadingStops(true);
      console.log(`🚏 "${routeName}" güzergahı için duraklar yükleniyor...`);
      
      const encodedRouteName = encodeURIComponent(routeName);
      const response = await fetch(`${API_BASE_URL}/api/services/routes/${encodedRouteName}/stops`);
      
      if (response.ok) {
        const data = await response.json();
        const stops = data.data?.stops || [];
        console.log(`✅ ${stops.length} durak yüklendi:`, stops);
        setAvailableStops(stops);
      } else {
        console.error(`❌ Duraklar yüklenemedi - HTTP ${response.status}`);
        const errorData = await response.json();
        console.error("API Hata detayı:", errorData);
        setAvailableStops([]);
      }
    } catch (error) {
      console.error('❌ Durak yükleme hatası:', error);
      setAvailableStops([]);
    } finally {
      setLoadingStops(false);
    }
  };

  // 📝 Servis güzergahı değiştiğinde durakları yükle
  const handleServiceRouteChange = (e) => {
    const routeName = e.target.value;
    setFormData(prev => ({
      ...prev,
      servisGuzergahi: routeName, // serviceRoute yerine servisGuzergahi kullan
      durak: '' // Durak seçimini sıfırla
    }));
    
    // Yeni güzergahın duraklarını yükle
    fetchStopsForRoute(routeName);
  };

  // Çalışanları yükle
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employees?limit=200`); // Tüm çalışanları getir
      if (response.ok) {
        const data = await response.json();
        // API'den gelen data.data'yı kullan (backend success response formatında)
        setEmployees(data.data || data);
      } else {
        showAlert('Çalışanlar yüklenirken hata oluştu', 'error');
      }
    } catch (error) {
      console.error('API Hatası:', error);
      showAlert('Bağlantı hatası oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchServiceRoutes(); // Servis güzergahlarını da yükle
    fetchDepartments(); // Departman listesini yükle
    fetchLocations(); // Lokasyon listesini yükle
    fetchFilterStats(); // Filtre istatistiklerini yükle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Alert göster
  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5001);
  };

  // Çalışanları filtrele - employees'ın array olduğundan emin ol
  const filteredEmployees = (employees || []).filter(employee => {    
    // adSoyad alanını kullanarak arama yap
    const matchesSearch = (employee.adSoyad || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.departman || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.pozisyon || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === '' || employee.departman === departmentFilter;
    const matchesLocation = locationFilter === '' || employee.lokasyon === locationFilter;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  // Sayfalama için veriyi ayır
  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Form değişiklikleri
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 📷 Fotoğraf yükleme fonksiyonu
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAlert({ show: true, message: 'Dosya boyutu 5MB\'dan küçük olmalıdır', severity: 'error' });
      return;
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAlert({ show: true, message: 'Sadece resim dosyaları yüklenebilir (jpeg, png, gif, webp)', severity: 'error' });
      return;
    }

    try {
      setPhotoUploading(true);
      
      // Base64'e çevir
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        setPhotoPreview(base64);
        setFormData(prev => ({ ...prev, profilePhoto: base64 }));
        setPhotoUploading(false);
      };
      reader.onerror = () => {
        setAlert({ show: true, message: 'Fotoğraf okunamadı', severity: 'error' });
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Fotoğraf yükleme hatası:', error);
      setAlert({ show: true, message: 'Fotoğraf yüklenemedi', severity: 'error' });
      setPhotoUploading(false);
    }
  };

  // 📷 Fotoğrafı sil
  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, profilePhoto: '' }));
  };

  // 🚀 Hızlı ekleme modunu aç/kapat
  const handleQuickAddMode = () => {
    setBulkMode(true);
    setCurrentTab(1);
  };

  // 🚀 Hızlı ekleme kapatıldığında
  const handleBulkModeClose = () => {
    setBulkMode(false);
    setCurrentTab(0);
    fetchEmployees(); // Listeyi yenile
  };

  // 🚀 Hızlı ekleme kaydetme başarılı olduğunda
  const handleBulkSaveSuccess = (result) => {
    setBulkMode(false);
    setCurrentTab(0);
    fetchEmployees(); // Listeyi yenile
    showAlert(`${result.data.success} çalışan başarıyla eklendi!`, 'success');
  };

  // Tab değiştirme
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    if (newValue === 1) {
      setBulkMode(true);
    } else {
      setBulkMode(false);
    }
  };

  // Yeni çalışan ekle
  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setPhotoPreview(null); // 📷 Fotoğraf önizlemesini temizle
    setFormData({
      // Kişisel Bilgiler
      adSoyad: '',
      tcNo: '',
      cepTelefonu: '',
      dogumTarihi: '',
      profilePhoto: '', // 📷 Fotoğraf
      
      // İş Bilgileri
      employeeId: '',
      departman: '',
      iseFabrika: '',
      pozisyon: '',
      lokasyon: '',
      iseGirisTarihi: '',
      durum: 'AKTIF',
      
      // Servis Bilgileri
      servisGuzergahi: '',
      durak: '',
    });
    setOpenDialog(true);
  };

  // Çalışan düzenle - Önce tam çalışan verisini (profilePhoto dahil) çek
  const handleEditEmployee = async (employee) => {
    try {
      // 📷 Tek çalışan detayını çek (profilePhoto dahil)
      const response = await fetch(`${API_BASE_URL}/api/employees/${employee._id}`);
      let fullEmployee = employee;
      
      if (response.ok) {
        const data = await response.json();
        fullEmployee = data.data || employee;
      }
      
      setEditingEmployee(fullEmployee);
      
      // 🔧 Değerlerin mevcut seçeneklerde var mı kontrol et
      const currentServisGuzergahi = fullEmployee.servisGuzergahi || '';
      const validServisGuzergahi = serviceRoutes.includes(currentServisGuzergahi) ? currentServisGuzergahi : '';
      
      const currentDepartman = fullEmployee.departman || '';
      const validDepartman = departments.includes(currentDepartman) ? currentDepartman : '';
      
      const currentLokasyon = fullEmployee.lokasyon || '';
      const validLokasyon = locations.includes(currentLokasyon) ? currentLokasyon : '';
      
      const currentDurum = fullEmployee.durum || 'AKTIF';
      const validDurum = statusOptions.includes(currentDurum) ? currentDurum : 'AKTIF';
      
      setFormData({
          // Kişisel Bilgiler
          adSoyad: fullEmployee.adSoyad || '',
          tcNo: fullEmployee.tcNo || '',
          cepTelefonu: fullEmployee.cepTelefonu || '',
          dogumTarihi: fullEmployee.dogumTarihi ? fullEmployee.dogumTarihi.substring(0, 10) : '',
          profilePhoto: fullEmployee.profilePhoto || '', // 📷 Fotoğraf
          
          // İş Bilgileri - Güvenli değerler kullan
          employeeId: fullEmployee.employeeId || '',
          departman: validDepartman,
          iseFabrika: fullEmployee.iseFabrika || '',
          pozisyon: fullEmployee.pozisyon || '',
          lokasyon: validLokasyon,
          iseGirisTarihi: fullEmployee.iseGirisTarihi ? fullEmployee.iseGirisTarihi.substring(0, 10) : '',
          durum: validDurum,
          
          // Servis Bilgileri - Güvenli değer kullan
          servisGuzergahi: validServisGuzergahi,
          durak: validServisGuzergahi ? (fullEmployee.durak || '') : '', // Servis güzergahı yoksa durak da temizle
        });
      
      // 📷 Fotoğraf önizlemesini de ayarla
      setPhotoPreview(fullEmployee.profilePhoto || null);
    
    // Geçersiz değerler için kullanıcıyı bilgilendir
    if (currentDepartman && !validDepartman) {
      console.warn(`⚠️ Çalışanın departmanı "${currentDepartman}" artık mevcut değil, temizlendi.`);
    }
    if (currentLokasyon && !validLokasyon) {
      console.warn(`⚠️ Çalışanın lokasyonu "${currentLokasyon}" artık mevcut değil, temizlendi.`);
    }
    if (currentServisGuzergahi && !validServisGuzergahi) {
      console.warn(`⚠️ Çalışanın servis güzergahı "${currentServisGuzergahi}" artık mevcut değil, temizlendi.`);
    }
    if (currentDurum && !validDurum) {
      console.warn(`⚠️ Çalışanın durumu "${currentDurum}" artık mevcut değil, AKTIF olarak ayarlandı.`);
    }
    
    // Eğer geçerli servis güzergahı varsa, duraklarını yükle
    if (validServisGuzergahi) {
      console.log("🚌 Servis güzergahı durakları yükleniyor:", validServisGuzergahi);
      fetchStopsForRoute(validServisGuzergahi);
    } else {
      console.log("⚠️ Geçerli servis güzergahı bulunamadı, duraklar yüklenmeyecek");
      setAvailableStops([]); // Durakları temizle
    }
    
    setOpenDialog(true);
    } catch (error) {
      console.error('Çalışan detayları yüklenirken hata:', error);
      showAlert('Çalışan detayları yüklenemedi', 'error');
    }
  };

  // Çalışan kaydet
  const handleSaveEmployee = async () => {
    try {
      // 📝 Form verilerini backend formatına dönüştür
      const employeeData = {
          // Kişisel Bilgiler
          adSoyad: formData.adSoyad,
          tcNo: formData.tcNo || undefined,
          cepTelefonu: formData.cepTelefonu || undefined,
          dogumTarihi: formData.dogumTarihi || undefined,
          profilePhoto: formData.profilePhoto || undefined, // 📷 Personel fotoğrafı (base64)
          
          // İş Bilgileri
          employeeId: formData.employeeId || undefined, // Boş ise backend otomatik oluşturacak
          departman: formData.departman,
          iseFabrika: formData.iseFabrika || undefined,
          pozisyon: formData.pozisyon,
          lokasyon: formData.lokasyon,
          iseGirisTarihi: formData.iseGirisTarihi || undefined,
          durum: formData.durum,
          
          // Servis Bilgileri
          servisGuzergahi: formData.servisGuzergahi || undefined,
          durak: formData.durak || undefined,
          
          // Yeni servis bilgileri formatı - daha sonra kullanılacak
          serviceInfo: formData.servisGuzergahi ? {
            usesService: true,
            routeName: formData.servisGuzergahi,
            stopName: formData.durak || undefined
          } : {
            usesService: false
          }
      };
      
      console.log("💾 Kaydedilecek çalışan verileri:", employeeData);
      console.log("📷 profilePhoto durumu:", {
        formDataHas: !!formData.profilePhoto,
        formDataLength: formData.profilePhoto?.length || 0,
        employeeDataHas: !!employeeData.profilePhoto,
        employeeDataLength: employeeData.profilePhoto?.length || 0
      });

      // API endpoint ve method belirle
      let url = `${API_BASE_URL}/api/employees`;
      let method = 'POST';
      
      // Düzenleme modunda ID'yi ekle
      if (editingEmployee) {
        url = `${url}/${editingEmployee._id}`;
        method = 'PUT';
      }
      
      // API isteği gönder
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(employeeData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showAlert(`Çalışan başarıyla ${editingEmployee ? 'güncellendi' : 'eklendi'}!`, 'success');
        setOpenDialog(false);
        fetchEmployees(); // Listeyi yenile
      } else {
        showAlert(`Hata: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('API Hatası:', error);
      showAlert('Bir hata oluştu', 'error');
    }
  };

  // 🚪 Çalışanı işten ayrıldı olarak işaretle
  const handleEmployeeTermination = async () => {
    const fullName = editingEmployee.adSoyad || 'İsimsiz çalışan';
    const confirmMessage = `${fullName} adlı çalışanı işten ayrıldı olarak işaretlemek istediğinize emin misiniz?\n\nBu işlem sonrasında çalışan "İşten Ayrılanlar" listesine taşınacaktır.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        // Ayrılma tarihini bugün olarak ayarla
        const terminationData = {
          durum: 'AYRILDI',
          ayrilmaTarihi: new Date().toISOString(),
          ayrilmaSebebi: 'Manuel işaretleme' // Varsayılan sebep
        };

        const response = await fetch(`${API_BASE_URL}/api/employees/${editingEmployee._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(terminationData),
        });

        if (response.ok) {
          showAlert(`${fullName} işten ayrıldı olarak işaretlendi`, 'warning');
          setOpenDialog(false); // Dialog'u kapat
          fetchEmployees(); // Listeyi yenile
          fetchDepartments(); // Departman listesini yenile
          fetchLocations(); // Lokasyon listesini yenile
          fetchFilterStats(); // Filtre istatistiklerini yenile
        } else {
          const errorData = await response.json();
          showAlert(errorData.message || 'İşten ayrılma işlemi başarısız', 'error');
        }
      } catch (error) {
        console.error('İşten ayrılma işlemi hatası:', error);
        showAlert('İşten ayrılma işlemi başarısız', 'error');
      }
    }
  };

  // Çalışan sil
  const handleDeleteEmployee = async (employee) => {
    const fullName = employee.adSoyad || 'İsimsiz çalışan';
    if (window.confirm(`${fullName} adlı çalışanı silmek istediğinize emin misiniz?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/employees/${employee._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          showAlert('Çalışan başarıyla silindi', 'success');
          fetchEmployees(); // Listeyi yenile
        } else {
          showAlert('Silme işlemi başarısız', 'error');
        }
      } catch (error) {
        console.error('Silme hatası:', error);
        showAlert('Silme işlemi başarısız', 'error');
      }
    }
  };

  // Excel'e aktar (TÜM çalışanlar)
  const handleExportExcel = async () => {
    try {
      showAlert('Excel dosyası oluşturuluyor...', 'info');
      
      // Backend'den Excel dosyası iste
      const response = await fetch(`${API_BASE_URL}/api/excel/employees`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (response.ok) {
        // Dosyayı blob olarak al
        const blob = await response.blob();
        
        // Dosya adı ve tarih oluştur
        const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
        const fileName = `Canga_Calisanlar_${currentDate}.xlsx`;
        
        // Dosyayı indir
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Temizlik
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        showAlert('Excel dosyası başarıyla indirildi!', 'success');
      } else {
        const errorData = await response.json();
        showAlert(errorData.message || 'Excel oluşturma başarısız', 'error');
      }
    } catch (error) {
      console.error('Excel export hatası:', error);
      showAlert('Excel oluşturma işlemi başarısız', 'error');
    }
  };

  // 🎯 FİLTRELENMİŞ çalışanları Excel'e aktar - YENI ÖZELLİK
  const handleExportFilteredExcel = async () => {
    try {
      showAlert('Filtrelenmiş Excel dosyası oluşturuluyor...', 'info');
      
      // Query parametrelerini oluştur
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (departmentFilter) params.append('departman', departmentFilter);
      if (locationFilter) params.append('lokasyon', locationFilter);
      
      // Backend'den filtrelenmiş Excel dosyası iste
      const response = await fetch(`${API_BASE_URL}/api/excel/employees/filtered?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (response.ok) {
        // Dosyayı blob olarak al
        const blob = await response.blob();
        
        // Dosya adı ve tarih oluştur - filtre bilgilerini içerir
        const currentDate = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
        let fileName = `Canga_Filtrelenmis_Calisanlar_${currentDate}`;
        
        // Filtre bilgilerini dosya adına ekle
        if (departmentFilter) fileName += `_${departmentFilter.replace(/\s+/g, '_')}`;
        if (locationFilter) fileName += `_${locationFilter}`;
        if (searchTerm) fileName += `_Arama`;
        
        fileName += '.xlsx';
        
        // Dosyayı indir
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Temizlik
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        showAlert(`🎯 Filtrelenmiş Excel dosyası başarıyla indirildi! (${filteredEmployees.length} çalışan)`, 'success');
      } else {
        const errorData = await response.json();
        showAlert(errorData.message || 'Filtrelenmiş Excel oluşturma başarısız', 'error');
      }
    } catch (error) {
      console.error('Filtrelenmiş Excel export hatası:', error);
      showAlert('Filtrelenmiş Excel oluşturma işlemi başarısız', 'error');
    }
  };

  // 📥 Excel'den toplu çalışan içe aktar - Geliştirilmiş versiyon
  const handleImportExcel = async (file) => {
    if (!file) return;

    // Dosya boyutu kontrolü (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showAlert('Dosya boyutu 10MB\'dan büyük olamaz', 'error');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);
      showAlert('Excel dosyası işleniyor...', 'info');

      // FormData oluştur ve dosyayı ekle
      const formData = new FormData();
      formData.append('excelFile', file);

      // Backend'e gönder
      const response = await fetch(`${API_BASE_URL}/api/excel/import-employees`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setImportResult(result.data);
        showAlert(
          `✅ ${result.data.imported} çalışan başarıyla içe aktarıldı!${result.data.skipped > 0 ? ` (${result.data.skipped} çalışan zaten mevcut)` : ''}`,
          'success'
        );
        
        // Listeyi yenile
        fetchEmployees();
      } else {
        showAlert(result.message || 'İçe aktarma işlemi başarısız', 'error');
        setImportResult({ 
          imported: 0, 
          skipped: 0, 
          errors: result.data?.errors?.length || 1,
          details: { errors: [result.message] }
        });
      }
    } catch (error) {
      console.error('Import hatası:', error);
      showAlert('Dosya yükleme işlemi başarısız', 'error');
      setImportResult({ 
        imported: 0, 
        skipped: 0, 
        errors: 1,
        details: { errors: [error.message] }
      });
    } finally {
      setImporting(false);
    }
  };

  // 📥 Import Dialog Açma
  const openImportDialog = () => {
    setImportDialog(true);
    setImportResult(null);
  };

  // 📄 Şablon İndirme
  const handleDownloadTemplate = () => {
    // CSV şablonu oluştur - Örnek verilerle
    const template = `Ad-Soyad,TC NO,Cep Telefonu,Doğum Tarihi,İşe Giriş Tarihi,Görev/Pozisyon,Servis Güzergahı,Servis Biniş Noktası,Departman,Lokasyon,Durum
Ahmet YILMAZ,12345678901,0532 123 45 67,15.05.1990,01.01.2023,CNC TORNA OPERATÖRÜ,DİSPANSER SERVİS GÜZERGAHI,VALİLİK,MERKEZ FABRİKA,MERKEZ,AKTIF
Ayşe DEMİR,98765432109,0533 987 65 43,20.03.1995,15.06.2023,MAL İŞÇİSİ,OSMANGAZİ-KARŞIYAKA MAHALLESİ,BAĞDAT KÖPRÜ,İŞL FABRİKA,İŞL,AKTIF
Mehmet KAYA,11223344556,0544 111 22 33,10.08.1988,01.09.2022,TEKNİK OFİS MÜHENDİSİ,ÇALILIÖZ MAHALLESİ SERVİS GÜZERGAHI,SAAT KULESİ,TEKNİK OFİS,MERKEZ,AKTIF`;
    
    // UTF-8 BOM ekliyoruz (\ufeff) - Excel'de Türkçe karakterler için
    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Canga_Calisan_Import_Sablonu.csv';
    link.click();
    
    showAlert('📄 Şablon dosyası indirildi! Excel ile açıp düzenleyebilirsiniz.', 'success');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Çalışanlar yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Alert */}
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}

      {/* Başlık ve İstatistikler - Modern Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          background: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                color: 'rgba(0,0,0,0.87)',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                mb: 0.5
              }}
            >
              Çalışan Yönetimi
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
              Toplam {(employees || []).length} çalışan • {filteredEmployees.length} sonuç gösteriliyor
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="medium"
              startIcon={<SpeedIcon />}
              onClick={handleQuickAddMode}
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
                },
                transition: 'all 0.25s ease'
              }}
            >
              Hızlı Ekleme
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<UploadIcon />}
              onClick={openImportDialog}
              sx={{
                borderColor: 'rgba(0,0,0,0.12)',
                color: 'rgba(0,0,0,0.7)',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  borderColor: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.08)'
                }
              }}
            >
              Excel İçe Aktar
            </Button>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              sx={{
                borderColor: 'rgba(0,0,0,0.12)',
                color: 'rgba(0,0,0,0.7)',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  borderColor: '#43e97b',
                  backgroundColor: 'rgba(67, 233, 123, 0.08)'
                }
              }}
            >
              Excel İndir
            </Button>
          {/* 🎯 FİLTRELENMİŞ EXCEL İNDİR BUTONU - Sadece filtre uygulandığında görünür */}
          {(searchTerm || departmentFilter || locationFilter) && (
            <Button
              variant="contained"
              size="medium"
              startIcon={<DownloadIcon />}
              onClick={handleExportFilteredExcel}
              sx={{ 
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(250, 112, 154, 0.3)',
                textTransform: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(250, 112, 154, 0.4)'
                },
                transition: 'all 0.25s ease'
              }}
            >
              🎯 Filtreli Excel İndir ({filteredEmployees.length})
            </Button>
          )}
          </Box>
        </Box>
      </Paper>

      {/* Tabs - Normal görünüm ve Hızlı ekleme */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange} aria-label="Çalışan yönetimi tabs">
          <Tab 
            label="📋 Çalışan Listesi" 
            sx={{ fontWeight: currentTab === 0 ? 'bold' : 'normal' }}
          />
          <Tab 
            label="🚀 Hızlı Ekleme" 
            sx={{ fontWeight: currentTab === 1 ? 'bold' : 'normal' }}
          />
        </Tabs>
      </Box>

      {/* Tab İçeriği */}
      {currentTab === 0 && !bulkMode && (
        <>
          {/* Filtreler ve Arama */}
          <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Çalışan Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Departman</InputLabel>
              <Select
                value={departmentFilter}
                label="Departman"
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {departments.map(dept => {
                  const stat = departmentStats.find(s => s._id === dept);
                  const count = stat ? stat.count : 0;
                  return (
                    <MenuItem key={dept} value={dept}>
                      {dept} {count > 0 && `(${count})`}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Lokasyon</InputLabel>
              <Select
                value={locationFilter}
                label="Lokasyon"
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <MenuItem value="">Tümü</MenuItem>
                {locations.map(loc => {
                  const stat = locationStats.find(s => s._id === loc);
                  const count = stat ? stat.count : 0;
                  return (
                    <MenuItem key={loc} value={loc}>
                      {loc} {count > 0 && `(${count})`}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('cards')}
                size="small"
              >
                Kartlar
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                size="small"
              >
                Tablo
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Çalışan Listesi - Kart Görünümü */}
      {viewMode === 'cards' && (
        <Grid container spacing={2}>
          {paginatedEmployees.map((employee) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={employee._id}>
              <EmployeeCard
                employee={employee}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Çalışan Listesi - Tablo Görünümü */}
      {viewMode === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Çalışan</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Departman</TableCell>
                <TableCell>Pozisyon</TableCell>
                <TableCell>Durum</TableCell>
                <TableCell>Servis</TableCell>
                <TableCell>İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        src={employee.profilePhoto || ''} 
                        sx={{ mr: 2, bgcolor: getRandomColor(employee.adSoyad || employee.employeeId) }}
                      >
                        {employee.adSoyad ? employee.adSoyad.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'NA'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {employee.adSoyad || 'İsimsiz'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employee.cepTelefonu || 'İletişim bilgisi yok'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{employee.employeeId}</TableCell>
                  <TableCell>
                    <Chip 
                      label={employee.departman} 
                      size="small" 
                      color={getDepartmentColor(employee.departman)}
                    />
                  </TableCell>
                  <TableCell>{employee.pozisyon?.replace(/\s*\(ENGELLİ\)\s*/gi, '').trim() || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={employee.durum || 'AKTIF'}
                      size="small"
                      color={employee.durum === 'AKTIF' ? 'success' : employee.durum === 'IZINLI' ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {employee.servisGuzergahi ? (
                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {employee.servisGuzergahi}
                        {employee.durak && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {employee.durak}
                          </Typography>
                        )}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Servis Yok
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="primary" onClick={() => handleEditEmployee(employee)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteEmployee(employee)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Sayfalama */}
      <TablePagination
        component="div"
        count={filteredEmployees.length}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Sayfa başına:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />

      {/* Çalışan Ekleme FAB */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddEmployee}
      >
        <AddIcon />
      </Fab>

      {/* Çalışan Ekleme/Düzenleme Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Çalışan Düzenle' : 'Yeni Çalışan Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* 👤 Kişisel Bilgiler */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                👤 Kişisel Bilgiler
              </Typography>
            </Grid>
            
            {/* 📷 Fotoğraf Yükleme Bölümü */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3, 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'grey.300'
              }}>
                {/* Fotoğraf Önizleme */}
                <Avatar
                  src={photoPreview || formData.profilePhoto || ''}
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    fontSize: 36,
                    bgcolor: formData.adSoyad ? getRandomColor(formData.adSoyad) : 'grey.400',
                    border: '3px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  {formData.adSoyad ? formData.adSoyad.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : <PhotoCameraIcon sx={{ fontSize: 40 }} />}
                </Avatar>
                
                {/* Yükleme Kontrolleri */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📷 Personel Fotoğrafı (Vesikalık)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    JPEG, PNG veya WEBP formatında, max 5MB
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      component="label"
                      variant="contained"
                      size="small"
                      startIcon={photoUploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                      disabled={photoUploading}
                    >
                      {photoUploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}
                      <input
                        type="file"
                        hidden
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handlePhotoUpload}
                      />
                    </Button>
                    
                    {(photoPreview || formData.profilePhoto) && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeletePhotoIcon />}
                        onClick={handleRemovePhoto}
                      >
                        Kaldır
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ad *"
                name="adSoyad"
                value={formData.adSoyad}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="TC Kimlik No"
                name="tcNo"
                value={formData.tcNo}
                onChange={handleInputChange}
                inputProps={{ maxLength: 11 }}
                helperText="11 haneli TC kimlik numarası"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cep Telefonu"
                name="cepTelefonu"
                value={formData.cepTelefonu}
                onChange={handleInputChange}
                placeholder="05XX XXX XX XX"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Doğum Tarihi"
                name="dogumTarihi"
                type="date"
                value={formData.dogumTarihi}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* 💼 İş Bilgileri */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                💼 İş Bilgileri
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Çalışan ID"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                placeholder="Boş bırakın - otomatik oluşturulur"
                helperText="Örn: TŞ0001, AS0002 (Ad-Soyad baş harfleri + numara)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Durum</InputLabel>
                <Select
                  name="durum"
                  value={statusOptions.includes(formData.durum) ? formData.durum : 'AKTIF'}
                  label="Durum"
                  onChange={handleInputChange}
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Departman</InputLabel>
                <Select
                  name="departman"
                  value={departments.includes(formData.departman) ? formData.departman : ''}
                  label="Departman"
                  onChange={handleInputChange}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Görev/Pozisyon *"
                name="pozisyon"
                value={formData.pozisyon}
                onChange={handleInputChange}
                required
                placeholder="Örn: CNC Tığıcı, MAL İşCiSi"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Lokasyon</InputLabel>
                <Select
                  name="lokasyon"
                  value={locations.includes(formData.lokasyon) ? formData.lokasyon : ''}
                  label="Lokasyon"
                  onChange={handleInputChange}
                >
                  {locations.map(loc => (
                    <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="İşe Giriş Tarihi *"
                name="iseGirisTarihi"
                type="date"
                value={formData.iseGirisTarihi}
                onChange={handleInputChange}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* 🚌 Servis Bilgileri */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                🚌 Servis Bilgileri
              </Typography>
            </Grid>
            
                         <Grid item xs={12} md={6}>
               <FormControl fullWidth>
                 <InputLabel>Servis Güzergahı</InputLabel>
                 <Select
                   name="servisGuzergahi"
                   value={serviceRoutes.includes(formData.servisGuzergahi) ? formData.servisGuzergahi : ''}
                   label="Servis Güzergahı"
                   onChange={handleServiceRouteChange}
                 >
                   <MenuItem value="">Servis Kullanmıyor</MenuItem>
                   {serviceRoutes.map(route => (
                     <MenuItem key={route} value={route}>{route}</MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Grid>
             <Grid item xs={12} md={6}>
               <Autocomplete
                 freeSolo // 🆓 Serbest yazım için
                 disabled={!formData.servisGuzergahi || loadingStops}
                 options={availableStops.map(stop => `${stop.order}. ${stop.name}`)}
                 value={formData.durak || ''}
                 onChange={(event, newValue) => {
                   console.log("🚏 Durak seçildi:", newValue);
                   setFormData(prev => ({
                     ...prev,
                     durak: newValue || ''
                   }));
                 }}
                 onInputChange={(event, newInputValue) => {
                   console.log("🚏 Durak yazıldı:", newInputValue);
                   setFormData(prev => ({
                     ...prev,
                     durak: newInputValue || ''
                   }));
                 }}
                 renderInput={(params) => (
                   <TextField
                     {...params}
                     label={loadingStops ? 'Duraklar yükleniyor...' : 'Servis Biniş Noktası'}
                     placeholder={!formData.servisGuzergahi ? "Önce servis güzergahı seçin" : "Durak seçin veya manuel yazın"}
                     helperText={
                       !formData.servisGuzergahi 
                         ? "Önce servis güzergahı seçin"
                         : availableStops.length > 0 
                           ? `💡 ${availableStops.length} durak bulundu - Listeden seçin veya özel konum yazın` 
                           : loadingStops 
                             ? "Duraklar yükleniyor..." 
                             : "Bu güzergah için durak bulunamadı - Manuel yazabilirsiniz"
                     }
                     fullWidth
                   />
                 )}
                 sx={{ width: '100%' }}
               />
             </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 3 }}>
          {/* Sol taraf - İşten Ayrıldı butonu (sadece düzenleme modunda) */}
          <Box>
            {editingEmployee && editingEmployee.durum !== 'AYRILDI' && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleEmployeeTermination}
                startIcon={<PersonIcon />}
                sx={{
                  borderColor: 'error.main',
                  '&:hover': {
                    borderColor: 'error.dark',
                    backgroundColor: 'error.light'
                  }
                }}
              >
                🚪 İşten Ayrıldı Olarak İşaretle
              </Button>
            )}
          </Box>
          
          {/* Sağ taraf - Normal butonlar */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)}>İptal</Button>
            <Button onClick={handleSaveEmployee} variant="contained">
              {editingEmployee ? 'Güncelle' : 'Ekle'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      </>
      )}

      {/* Hızlı Ekleme Tab */}
      {currentTab === 1 && bulkMode && (
        <BulkEmployeeEditor 
          onSave={handleBulkSaveSuccess}
          onCancel={handleBulkModeClose}
        />
      )}

      {/* 📥 Excel Import Dialog */}
      <Dialog 
        open={importDialog} 
        onClose={() => !importing && setImportDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #9c27b0 30%, #e91e63 90%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <UploadIcon />
          📥 Excel'den Toplu Çalışan İçe Aktarma
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* Açıklama */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>📋 Nasıl Kullanılır:</strong>
            </Typography>
            <Typography variant="body2" component="div">
              1. Aşağıdaki "Şablon İndir" butonuna tıklayın<br/>
              2. İndirilen CSV dosyasını Excel ile açın<br/>
              3. Çalışan bilgilerini doldurun (örnek satırları silin)<br/>
              4. Dosyayı kaydedin<br/>
              5. "Dosya Seç" butonuna tıklayıp dosyayı yükleyin
            </Typography>
          </Alert>

          {/* Şablon İndir Butonu */}
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              size="large"
              sx={{
                background: 'linear-gradient(45deg, #4caf50 30%, #8bc34a 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #388e3c 30%, #689f38 90%)'
                }
              }}
            >
              📄 Şablon İndir (CSV)
            </Button>
          </Box>

          {/* Dosya Seçme */}
          <Box sx={{ 
            border: '2px dashed #9c27b0',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: '#f3e5f5',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#e1bee7'
            }
          }}
          onClick={() => document.getElementById('excel-file-input').click()}
          >
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleImportExcel(file);
                }
              }}
              disabled={importing}
            />
            {importing ? (
              <>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="h6" color="primary">
                  İşleniyor...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Lütfen bekleyin, çalışanlar içe aktarılıyor
                </Typography>
              </>
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 64, color: '#9c27b0', mb: 2 }} />
                <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                  Excel Dosyasını Buraya Sürükleyin
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  veya dosya seçmek için tıklayın
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Desteklenen formatlar: .xlsx, .xls, .csv (Max: 10MB)
                </Typography>
              </>
            )}
          </Box>

          {/* İmport Sonucu */}
          {importResult && (
            <Box sx={{ mt: 3 }}>
              <Alert 
                severity={importResult.imported > 0 ? "success" : "error"}
                sx={{ mb: 2 }}
              >
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📊 İçe Aktarma Sonuçları:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>✅ Başarılı: {importResult.imported} çalışan</li>
                  {importResult.skipped > 0 && (
                    <li>⚠️ Atlanan: {importResult.skipped} çalışan (zaten kayıtlı)</li>
                  )}
                  {importResult.errors > 0 && (
                    <li>❌ Hata: {importResult.errors} kayıt</li>
                  )}
                </Box>
              </Alert>

              {/* Hata Detayları */}
              {importResult.details?.errors && importResult.details.errors.length > 0 && (
                <Alert severity="warning">
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    ⚠️ Hata Detayları:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0, maxHeight: 200, overflow: 'auto' }}>
                    {importResult.details.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>
                        <Typography variant="caption">{error}</Typography>
                      </li>
                    ))}
                    {importResult.details.errors.length > 10 && (
                      <li>
                        <Typography variant="caption">
                          ... ve {importResult.details.errors.length - 10} hata daha
                        </Typography>
                      </li>
                    )}
                  </Box>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setImportDialog(false)} 
            disabled={importing}
          >
            {importResult ? 'Kapat' : 'İptal'}
          </Button>
          {importResult && importResult.imported > 0 && (
            <Button 
              variant="contained" 
              onClick={() => {
                setImportDialog(false);
                setImportResult(null);
              }}
            >
              Tamam
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default Employees; 
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Checkbox,
  Switch,
  FormControlLabel,
  Skeleton,
  Container,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Fade
} from '@mui/material';
import {
  FilterList as FilterIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  FileDownload as FileDownloadIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  Clear as ClearIcon,
  Print as PrintIcon,
  DirectionsBus as BusIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';
import { toast } from 'react-hot-toast';

// 🎨 Şablon Konfigürasyonları - OPTİMİZE EDİLMİŞ
const TEMPLATE_CONFIGS = {
  corporate: {
    id: 'corporate',
    name: 'Kurumsal Şablon',
    description: 'Resmi belgeler için profesyonel tasarım',
    color: '#1976d2',
    accentColor: '#f5f5f5',
    fontFamily: 'Calibri',
    icon: '🏢',
    preview: '/templates/corporate-preview.png',
    recommended: true,
    gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    features: ['Logo desteği', 'Resmi başlık', 'İmza alanları', 'QR kod']
  },
  premium: {
    id: 'premium',
    name: 'Premium Şablon',
    description: 'Yönetici sunumları için özel tasarım',
    color: '#2e7d32',
    accentColor: '#e8f5e8',
    fontFamily: 'Arial',
    icon: '⭐',
    preview: '/templates/premium-preview.png',
    recommended: false,
    gradient: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
    features: ['Premium logo', 'Grafik elementler', 'Renkli başlıklar', 'İstatistikler']
  },
  executive: {
    id: 'executive',
    name: 'Yönetici Şablonu',
    description: 'Üst düzey raporlar için lüks tasarım',
    color: '#7b1fa2',
    accentColor: '#f3e5f5',
    fontFamily: 'Times New Roman',
    icon: '👔',
    preview: '/templates/executive-preview.png',
    recommended: false,
    gradient: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
    features: ['Lüks tasarım', 'Altın detaylar', 'Executive logo', 'VIP düzen']
  }
};

// Debounce fonksiyonu - form alanları için
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Liste başlığından liste türünü tespit etme - optimize edilmiş
const getListTypeFromTitle = (title) => {
  if (!title) return 'custom';
  
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('devam') || lowerTitle.includes('imza')) return 'attendance';
  if (lowerTitle.includes('mesai') || lowerTitle.includes('fazla')) return 'overtime';
  
  return 'custom';
};

// Liste Ayarları Form Bileşeni - Memo ile optimize edildi
const ListSettingsForm = React.memo(({ listInfo, setListInfo, locations }) => {
  // Form state'leri için local state kullan
  const [localTitle, setLocalTitle] = useState(listInfo.title);
  const [localDate, setLocalDate] = useState(listInfo.date);
  const [localDescription, setLocalDescription] = useState(listInfo.description);
  const [localCustomTimeSlot, setLocalCustomTimeSlot] = useState(listInfo.customTimeSlot);
  
  // Debounce değerleri
  const debouncedTitle = useDebounce(localTitle, 300);
  const debouncedDescription = useDebounce(localDescription, 300);
  const debouncedCustomTimeSlot = useDebounce(localCustomTimeSlot, 300);
  
  // Değerler değiştiğinde parent'a bildir
  useEffect(() => {
    setListInfo(prev => ({ ...prev, title: debouncedTitle }));
  }, [debouncedTitle, setListInfo]);
  
  useEffect(() => {
    setListInfo(prev => ({ ...prev, description: debouncedDescription }));
  }, [debouncedDescription, setListInfo]);
  
  useEffect(() => {
    setListInfo(prev => ({ ...prev, customTimeSlot: debouncedCustomTimeSlot }));
  }, [debouncedCustomTimeSlot, setListInfo]);
  
  // Date ve location değişikliklerini anında uygula (debounce gerekmez)
  const handleDateChange = (e) => {
    setLocalDate(e.target.value);
    setListInfo(prev => ({ ...prev, date: e.target.value }));
  };
  
  const handleLocationChange = (e) => {
    setListInfo(prev => ({ ...prev, location: e.target.value }));
  };
  
  const handleTimeSlotChange = (e) => {
    setListInfo(prev => ({ 
      ...prev, 
      timeSlot: e.target.value,
      customTimeSlot: e.target.value === 'custom' ? prev.customTimeSlot : ''
    }));
  };
  
  return (
    <>
      <TextField
        fullWidth
        label="Liste Başlığı"
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        type="date"
        label="Tarih"
        value={localDate}
        onChange={handleDateChange}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Lokasyon</InputLabel>
        <Select
          value={listInfo.location}
          onChange={handleLocationChange}
          startAdornment={<LocationIcon sx={{ mr: 1 }} />}
        >
          {locations.map(loc => (
            <MenuItem key={loc} value={loc}>{loc}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Vardiya Saati</InputLabel>
        <Select
          value={listInfo.timeSlot}
          onChange={handleTimeSlotChange}
          startAdornment={<ScheduleIcon sx={{ mr: 1 }} />}
        >
          <MenuItem value="08:00-18:00">08:00-18:00 (9 saat)</MenuItem>
          <MenuItem value="08:00-16:00">08:00-16:00 (7:30 saat)</MenuItem>
          <MenuItem value="16:00-24:00">16:00-24:00 (7:30 saat)</MenuItem>
          <MenuItem value="24:00-08:00">24:00-08:00 (7:30 saat)</MenuItem>
          <MenuItem value="custom">🕐 Özel Saat Belirle</MenuItem>
        </Select>
      </FormControl>

      {/* ✅ Özel Vardiya Saati Input'u */}
      {listInfo.timeSlot === 'custom' && (
        <TextField
          fullWidth
          label="Özel Vardiya Saati"
          value={localCustomTimeSlot}
          onChange={(e) => setLocalCustomTimeSlot(e.target.value)}
          placeholder="Örn: 09:00-17:30 veya Esnek Çalışma"
          sx={{ mb: 2 }}
          helperText="İstediğiniz saati yazabilirsiniz (Örn: 06:00-14:00, Esnek, Gece Vardiyası)"
        />
      )}

      <TextField
        fullWidth
        label="Açıklama (Opsiyonel)"
        value={localDescription}
        onChange={(e) => setLocalDescription(e.target.value)}
        multiline
        rows={3}
        sx={{ mb: 2 }}
      />
    </>
  );
});

// 🚀 Ana Bileşen
function QuickList() {
  // 📊 Ana State'ler
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  // 🎯 Adım Kontrolü - gelecekte kullanılacak
  // const [activeStep, setActiveStep] = useState(0);
  // const [tabValue, setTabValue] = useState(0);
  
  // 🎨 Şablon ve Ayarlar
  const [selectedTemplate, setSelectedTemplate] = useState('corporate');
  const [previewDialog, setPreviewDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  
  // 📋 Liste Bilgileri
  const [listInfo, setListInfo] = useState({
    title: `İmza Listesi - ${new Date().toLocaleDateString('tr-TR')}`,
    date: new Date().toISOString().split('T')[0],
    location: 'MERKEZ ŞUBE',
    timeSlot: '08:00-18:00',
    customTimeSlot: '', // ✅ Özel vardiya saati için eklendi
    description: '',
    isOvertimeList: false,
    overtimeReason: '',
    showDepartment: true,
    showPosition: true,
    showSignature: true,
    showTime: true,
    customFields: []
  });
  
  // 🔍 Gelişmiş Filtreler
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    location: '',
    status: 'AKTIF',
    position: '',
    sortBy: 'firstName',
    sortOrder: 'asc'
  });
  
  // 📋 Liste Türleri - OPTİMİZE EDİLMİŞ
  const [listTypes] = useState([
    { id: 'attendance', name: 'Devam Listesi', icon: '📋', template: 'corporate', color: '#1976d2', description: 'Günlük devam kontrolü' },
    { id: 'overtime', name: 'Fazla Mesai Listesi', icon: '⏰', template: 'premium', color: '#ff9800', description: 'Mesai saatleri dışı çalışma' },
    { id: 'custom', name: 'Özel Liste', icon: '⚙️', template: 'executive', color: '#795548', description: 'Özelleştirilebilir liste' }
  ]);

  // 📊 İstatistikler
  const [stats, setStats] = useState({
    totalEmployees: 0,
    filteredCount: 0,
    selectedCount: 0,
    departmentCount: 0
  });


  // Referanslar
  const [departments, setDepartments] = useState([]);
  const locations = ['MERKEZ ŞUBE', 'IŞIL ŞUBE']; // OSB ŞUBE kaldırıldı - sistemde mevcut değil

  // 🚀 Component Mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // 📊 İstatistik Güncelleme
  useEffect(() => {
    setStats({
      totalEmployees: employees.length,
      filteredCount: filteredEmployees.length,
      selectedCount: selectedEmployees.length,
      departmentCount: [...new Set(employees.map(emp => emp.department))].length
    });
  }, [employees, filteredEmployees, selectedEmployees]);

  // 🤖 Akıllı önerileri güncelle
  useEffect(() => {
    // Artık akıllı öneriler useMemo ile hesaplanıyor, bir şey yapmaya gerek yok
  }, [selectedEmployees, employees, listInfo.title]);

  // 🔄 Çalışanları Getir
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees?limit=1000`);
      const data = await response.json();
      
      if (data.success) {
        const activeEmployees = data.data || [];
        setEmployees(activeEmployees);
        setFilteredEmployees(activeEmployees);
        
        // Departmanları çıkar
        const uniqueDepartments = [...new Set(activeEmployees.map(emp => emp.department))];
        setDepartments(uniqueDepartments.sort());
        
        toast.success(`${activeEmployees.length} çalışan yüklendi`);
      }
    } catch (error) {
      console.error('Çalışan verisi alınamadı:', error);
      toast.error('Çalışan verisi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Filtreleme İşlemi
  useEffect(() => {
    try {
      let filtered = employees;

      // Stajyer ve çırakları hariç tut (onlar ayrı sayfada)
      filtered = filtered.filter(emp => 
        emp.department !== 'STAJYERLİK' && emp.department !== 'ÇIRAK LİSE'
      );

      // Arama filtresi
      if (filters.search) {
        filtered = filtered.filter(emp => 
          emp.firstName?.toLowerCase().includes(filters.search.toLowerCase()) ||
          emp.lastName?.toLowerCase().includes(filters.search.toLowerCase()) ||
          emp.employeeId?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      // Diğer filtreler
      if (filters.department) {
        filtered = filtered.filter(emp => emp.department === filters.department);
      }
      if (filters.location) {
        filtered = filtered.filter(emp => emp.location === filters.location);
      }
      if (filters.status) {
        filtered = filtered.filter(emp => emp.status === filters.status);
      }
      if (filters.position) {
        filtered = filtered.filter(emp => emp.position?.includes(filters.position));
      }

      // Sıralama
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy] || '';
        const bValue = b[filters.sortBy] || '';
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        return aValue.localeCompare(bValue, 'tr') * order;
      });

      setFilteredEmployees(filtered);
    } catch (error) {
      console.error('Filtreleme hatası:', error);
      toast.error('Filtreleme sırasında hata oluştu');
    }
  }, [filters, employees]);

  // 📊 Excel Export - Profesyonel - useCallback ile optimize edildi
  const handleProfessionalDownload = useCallback(async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setDownloadLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/excel/export/quick-list-professional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employees: selectedEmployees,
          listInfo: {
            ...listInfo,
            // ✅ Özel vardiya saatini Excel'e gönder
            timeSlot: listInfo.timeSlot === 'custom' ? listInfo.customTimeSlot : listInfo.timeSlot
          },
          template: selectedTemplate
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const templateName = TEMPLATE_CONFIGS[selectedTemplate].name.replace(/\s+/g, '_');
        a.download = `${templateName}_${listInfo.location}_${listInfo.date.replace(/-/g, '')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // 📊 Analytics Event Kaydet
        const generationTime = Date.now() - startTime;
        await trackAnalyticsEvent('list_created', {
          type: getListTypeFromTitle(listInfo.title) || 'custom',
          template: selectedTemplate,
          employeeCount: selectedEmployees.length,
          location: listInfo.location,
          departments: [...new Set(selectedEmployees.map(emp => emp.department))],
          fileSize: blob.size,
          generationTime
        });
        
        toast.success('📊 Profesyonel Excel dosyası indirildi!');
      } else {
        throw new Error('Excel dosyası oluşturulamadı');
      }
    } catch (error) {
      console.error('Excel export hatası:', error);
      toast.error('Excel dosyası oluşturulamadı');
      
      // 📊 Hata Analytics
      try {
        await trackAnalyticsEvent('error_occurred', {
          errorType: 'excel_generation_failed',
          errorMessage: error.message,
          template: selectedTemplate,
          employeeCount: selectedEmployees.length
        });
      } catch (analyticsError) {
        console.warn('Analytics event gönderilemedi:', analyticsError);
      }
    } finally {
      setDownloadLoading(false);
    }
  }, [selectedEmployees, listInfo, selectedTemplate]);

  // 🚌 Servis Listesi İndir - YENİ ÖZELLİK!
  const handleServiceListDownload = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setDownloadLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/excel/export/quick-list-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employees: selectedEmployees,
          listInfo: {
            ...listInfo,
            timeSlot: listInfo.timeSlot === 'custom' ? listInfo.customTimeSlot : listInfo.timeSlot
          },
          template: selectedTemplate
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeLocation = listInfo.location.replace(/\s+/g, '_');
        const safeDate = listInfo.date.replace(/-/g, '');
        a.download = `Servis_Listesi_${safeLocation}_${safeDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // 📊 Analytics Event Kaydet
        const generationTime = Date.now() - startTime;
        await trackAnalyticsEvent('service_list_created', {
          type: 'service_schedule',
          employeeCount: selectedEmployees.length,
          location: listInfo.location,
          departments: [...new Set(selectedEmployees.map(emp => emp.department))],
          fileSize: blob.size,
          generationTime
        });
        
        toast.success('🚌 Servis listesi indirildi!');
      } else {
        throw new Error('Servis listesi oluşturulamadı');
      }
    } catch (error) {
      console.error('Servis listesi export hatası:', error);
      toast.error('Servis listesi oluşturulamadı');
      
      // 📊 Hata Analytics
      try {
        await trackAnalyticsEvent('error_occurred', {
          errorType: 'service_list_generation_failed',
          errorMessage: error.message,
          employeeCount: selectedEmployees.length
        });
      } catch (analyticsError) {
        console.warn('Analytics event gönderilemedi:', analyticsError);
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  // 🖨️ İmza Listesini Yazdır - YENİ ÖZELLİK!
  const handleProfessionalPrint = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setDownloadLoading(true);
    
    try {
      // HTML yazdırma görünümü için veri hazırla
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.error('Popup penceresi açılamadı. Lütfen popup engelleyiciyi kontrol edin.');
        setDownloadLoading(false);
        return;
      }
      
      // Yazdırma sayfası için HTML içeriği oluştur
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Çanga İmza Listesi - ${listInfo.title}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #1976d2;
              padding-bottom: 10px;
            }
            .print-title {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #1976d2;
            }
            .print-subtitle {
              font-size: 18px;
              margin: 5px 0;
            }
            .print-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .print-info div {
              margin-right: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .signature-cell {
              width: 120px;
              height: 40px;
            }
            .time-cell {
              width: 80px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 30px;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1 class="print-title">ÇANGA SAVUNMA ENDÜSTRİ LTD.ŞTİ.</h1>
            <h2 class="print-subtitle">${listInfo.title}</h2>
          </div>
          
          <div class="print-info">
            <div><strong>Tarih:</strong> ${new Date(listInfo.date).toLocaleDateString('tr-TR')}</div>
            <div><strong>Lokasyon:</strong> ${listInfo.location}</div>
            <div><strong>Vardiya:</strong> ${(() => {
              // Net çalışma saatini hesapla ve ekle
              if (listInfo.timeSlot === '08:00-18:00') {
                return `${listInfo.timeSlot} (9 saat)`;
              } else if (listInfo.timeSlot === '08:00-16:00' || 
                          listInfo.timeSlot === '16:00-24:00' || 
                          listInfo.timeSlot === '24:00-08:00') {
                return `${listInfo.timeSlot} (7:30 saat)`;
              } else {
                return listInfo.timeSlot === 'custom' ? listInfo.customTimeSlot : listInfo.timeSlot;
              }
            })()}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Ad Soyad</th>
                <th>Giriş Saati</th>
                <th>Giriş İmza</th>
                <th>Çıkış Saati</th>
                <th>Çıkış İmza</th>
              </tr>
            </thead>
            <tbody>
              ${selectedEmployees.map((emp, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${emp.firstName || ''} ${emp.lastName || ''}</td>
                  <td class="time-cell"></td>
                  <td class="signature-cell"></td>
                  <td class="time-cell"></td>
                  <td class="signature-cell"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Bu belge ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
          </div>
          
          <button onclick="window.print()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 20px auto; display: block;">
            Yazdır
          </button>
          
          <script>
            // Sayfa yüklendiğinde otomatik yazdırma diyaloğu aç
            window.onload = function() {
              // Kısa bir gecikme ile yazdırma diyaloğunu aç
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;
      
      // Yazdırma penceresine içeriği yaz
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      toast.success('🖨️ Yazdırma ekranı açılıyor!');
      
      // 📊 Analytics Event Kaydet
      await trackAnalyticsEvent('list_printed', {
        type: getListTypeFromTitle(listInfo.title) || 'custom',
        template: selectedTemplate,
        employeeCount: selectedEmployees.length,
        location: listInfo.location
      });
    } catch (error) {
      console.error('Yazdırma hatası:', error);
      toast.error('Yazdırma ekranı hazırlanamadı');
    } finally {
      setDownloadLoading(false);
    }
  };

  // 🖨️ Servis Listesini Yazdır - YENİ ÖZELLİK!
  const handleServiceListPrint = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin!');
      return;
    }

    setDownloadLoading(true);
    
    try {
      // Backend'den servis listesi verilerini çek - Excel ile aynı endpoint
      const response = await fetch(`${API_BASE_URL}/api/excel/export/quick-list-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employees: selectedEmployees,
          listInfo: {
            ...listInfo,
            timeSlot: listInfo.timeSlot === 'custom' ? listInfo.customTimeSlot : listInfo.timeSlot
          },
          template: selectedTemplate,
          returnData: true // Backend'den sadece veri döndür, Excel dosyası değil
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Servis listesi verileri alınamadı');
      }

      // Backend'den alınan zenginleştirilmiş veriyi kullan
      const enrichedEmployees = result.data || selectedEmployees;
      
      // HTML yazdırma görünümü için veri hazırla
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        toast.error('Popup penceresi açılamadı. Lütfen popup engelleyiciyi kontrol edin.');
        setDownloadLoading(false);
        return;
      }
      
      // Yazdırma sayfası için HTML içeriği oluştur
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Çanga Servis Listesi - ${listInfo.title}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #ff9800;
              padding-bottom: 10px;
            }
            .print-title {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #ff9800;
            }
            .print-subtitle {
              font-size: 18px;
              margin: 5px 0;
            }
            .print-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              font-size: 14px;
            }
            .print-info div {
              margin-right: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #fff3e0;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-top: 30px;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1 class="print-title">ÇANGA SAVUNMA ENDÜSTRİ LTD.ŞTİ.</h1>
            <h2 class="print-subtitle">SERVİS YOLCU LİSTESİ</h2>
          </div>
          
          <div class="print-info">
            <div><strong>Tarih:</strong> ${new Date(listInfo.date).toLocaleDateString('tr-TR')}</div>
            <div><strong>Lokasyon:</strong> ${listInfo.location}</div>
            <div><strong>Vardiya:</strong> ${listInfo.timeSlot === 'custom' ? listInfo.customTimeSlot : listInfo.timeSlot}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Ad Soyad</th>
                <th>Servis Güzergahı</th>
                <th>Durak</th>
              </tr>
            </thead>
            <tbody>
              ${enrichedEmployees.map((emp, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${emp.firstName || ''} ${emp.lastName || ''}</td>
                  <td>${emp.serviceRoute || emp.servisGuzergahi || 'KENDİ ARACI'}</td>
                  <td>${emp.stopName || emp.durak || 'FABRİKA'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Bu belge ${new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.</p>
          </div>
          
          <button onclick="window.print()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 20px auto; display: block;">
            Yazdır
          </button>
          
          <script>
            // Sayfa yüklendiğinde otomatik yazdırma diyaloğu aç
            window.onload = function() {
              // Kısa bir gecikme ile yazdırma diyaloğunu aç
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;
      
      // Yazdırma penceresine içeriği yaz
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      toast.success('🚌 Servis listesi yazdırma ekranı açılıyor!');
      
      // 📊 Analytics Event Kaydet
      await trackAnalyticsEvent('service_list_printed', {
        type: 'service_schedule',
        employeeCount: enrichedEmployees.length,
        location: listInfo.location
      });
    } catch (error) {
      console.error('Yazdırma hatası:', error);
      toast.error('Yazdırma ekranı hazırlanamadı: ' + error.message);
    } finally {
      setDownloadLoading(false);
    }
  };

  // �� Şablon Değiştirme
  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    toast.success(`${TEMPLATE_CONFIGS[templateId].name} seçildi`);
    
    // 📊 Analytics Event
    trackAnalyticsEvent('template_selected', {
      template: templateId,
      templateName: TEMPLATE_CONFIGS[templateId].name
    });
  };

  // 📋 Liste Türü Değiştirme
  const handleListTypeChange = (listType) => {
    setListInfo(prev => ({
      ...prev,
      title: `${listType.name} - ${new Date().toLocaleDateString('tr-TR')}`,
      isOvertimeList: listType.id === 'overtime'
    }));
    setSelectedTemplate(listType.template);
    toast.success(`${listType.name} şablonu hazırlandı`);
    
    // 📊 Analytics Event
    trackAnalyticsEvent('list_type_selected', {
      listType: listType.id,
      listTypeName: listType.name,
      template: listType.template
    });
  };

  // 👥 Çalışan Seçim İşlemleri
  const toggleEmployeeSelection = (employee) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.find(emp => emp._id === employee._id);
      const newSelection = isSelected 
        ? prev.filter(emp => emp._id !== employee._id)
        : [...prev, employee];
      
      // 📊 Analytics Event
      trackAnalyticsEvent(isSelected ? 'employee_deselected' : 'employee_selected', {
        employeeId: employee.employeeId,
        department: employee.department,
        location: employee.location,
        totalSelected: newSelection.length
      });
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    setSelectedEmployees(
      selectedEmployees.length === filteredEmployees.length ? [] : [...filteredEmployees]
    );
  };

  const selectByDepartment = (department) => {
    const deptEmployees = filteredEmployees.filter(emp => emp.department === department);
    setSelectedEmployees(prev => {
      const otherDeptEmployees = prev.filter(emp => emp.department !== department);
      return [...otherDeptEmployees, ...deptEmployees];
    });
  };

  // 🗑️ Temizleme İşlemleri
  const clearFilters = () => {
    setFilters({
      search: '',
      department: '',
      location: '',
      status: 'AKTIF',
      position: '',
      sortBy: 'firstName',
      sortOrder: 'asc'
    });
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  // 📊 Analytics Event Tracking Helper - Disabled (analytics endpoint removed)
  const trackAnalyticsEvent = async (eventType, listDetails = {}, metadata = {}) => {
    // Analytics functionality disabled - endpoint removed
    console.debug('Analytics event (disabled):', { eventType, listDetails, metadata });
  };




  // 🚀 Component Mount - Analytics
  useEffect(() => {
    // Sayfa görüntüleme eventi
    trackAnalyticsEvent('page_view', {}, {
      page: 'quick_list',
      timestamp: new Date().toISOString()
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔍 Filtre değişimi - Analytics
  useEffect(() => {
    if (filters.search || filters.department || filters.location) {
      trackAnalyticsEvent('filter_applied', {}, {
        filters: {
          search: !!filters.search,
          department: filters.department,
          location: filters.location,
          sortBy: filters.sortBy
        },
        resultCount: filteredEmployees.length
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.department, filters.location, filters.sortBy, filteredEmployees.length]);

  // 📊 Modern Stat Kartları - Minimal ve Sade
  const renderStatsCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#ffffff',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#1976d2',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box 
              sx={{ 
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)'
              }}
            >
              <GroupIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(0,0,0,0.87)', mb: 0.5 }}>
            {stats.totalEmployees}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
            Toplam Çalışan
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#ffffff',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#2e7d32',
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box 
              sx={{ 
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)'
              }}
            >
              <FilterIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(0,0,0,0.87)', mb: 0.5 }}>
            {stats.filteredCount}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
            Filtrelenen
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#ffffff',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#ed6c02',
              boxShadow: '0 4px 12px rgba(237, 108, 2, 0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box 
              sx={{ 
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)'
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(0,0,0,0.87)', mb: 0.5 }}>
            {stats.selectedCount}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
            Seçilen
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={6} md={3}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#ffffff',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: '#7b1fa2',
              boxShadow: '0 4px 12px rgba(123, 31, 162, 0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box 
              sx={{ 
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #7b1fa2 0%, #ab47bc 100%)'
              }}
            >
              <BusinessIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'rgba(0,0,0,0.87)', mb: 0.5 }}>
            {stats.departmentCount}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
            Departman
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );


  // 🔍 Modern Filtre Paneli - Ultra Sade
  const renderAdvancedFilters = () => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.08)',
        background: '#ffffff'
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600,
          color: 'rgba(0,0,0,0.87)',
          mb: 2.5,
          fontSize: '1.125rem'
        }}
      >
        Filtreler
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Arama"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Ad, soyad veya sicil no ile ara..."
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#1976d2'
                }
              }
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Departman</InputLabel>
            <Select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              label="Departman"
            >
              <MenuItem value="">Tümü</MenuItem>
              {departments.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Lokasyon</InputLabel>
            <Select
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              label="Lokasyon"
            >
              <MenuItem value="">Tümü</MenuItem>
              {locations.map(loc => (
                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Sırala</InputLabel>
            <Select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              label="Sırala"
            >
              <MenuItem value="firstName">Ada Göre</MenuItem>
              <MenuItem value="lastName">Soyada Göre</MenuItem>
              <MenuItem value="department">Departman</MenuItem>
              <MenuItem value="employeeId">Sicil No</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={1}>
          <Tooltip title="Filtreleri Temizle">
            <IconButton
              onClick={clearFilters}
              sx={{
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 1,
                width: '100%',
                height: 40,
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.04)',
                  borderColor: '#d32f2f'
                }
              }}
            >
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
      
      {/* Hızlı Departman Seçimi */}
      {departments.length > 0 && (
        <Box sx={{ mt: 2.5, pt: 2.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 600, display: 'block', mb: 1.5 }}>
            HIZLI DEPARTMAN SEÇİMİ
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {departments.map(dept => (
              <Chip
                key={dept}
                label={dept}
                size="small"
                clickable
                onClick={() => selectByDepartment(dept)}
                sx={{
                  bgcolor: selectedEmployees.some(emp => emp.department === dept) 
                    ? 'rgba(25, 118, 210, 0.12)'
                    : 'rgba(0,0,0,0.05)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: selectedEmployees.some(emp => emp.department === dept)
                      ? 'rgba(25, 118, 210, 0.2)'
                      : 'rgba(0,0,0,0.1)',
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );


  // 👥 Modern Çalışan Listesi - Ultra Kullanıcı Dostu
  const renderEmployeeList = () => (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid rgba(0,0,0,0.08)',
        background: '#ffffff',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: 'rgba(0,0,0,0.87)',
                fontSize: '1.125rem',
                mb: 0.5
              }}
            >
              Çalışanlar
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)' }}>
              {filteredEmployees.length} kişi listeleniyor
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant={selectedEmployees.length === filteredEmployees.length ? 'contained' : 'outlined'}
              onClick={handleSelectAll}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2
              }}
            >
              {selectedEmployees.length === filteredEmployees.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </Button>
            {selectedEmployees.length > 0 && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={clearSelection}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2
                }}
              >
                Temizle
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box>
            {[...Array(5)].map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
          </Box>
        ) : filteredEmployees.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.04)',
                margin: '0 auto 16px'
              }}
            >
              <PersonIcon sx={{ fontSize: 40, color: 'rgba(0,0,0,0.3)' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'rgba(0,0,0,0.87)', mb: 1 }}>
              Çalışan Bulunamadı
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)' }}>
              Filtre kriterlerinizi değiştirerek tekrar deneyin.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
            {filteredEmployees.map((employee, index) => {
              const isSelected = selectedEmployees.find(emp => emp._id === employee._id);
              
              return (
                <Fade in timeout={200 + (index * 20)} key={employee._id}>
                  <Box
                    onClick={() => toggleEmployeeSelection(employee)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isSelected ? '#1976d2' : 'rgba(0,0,0,0.08)',
                      backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.04)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: isSelected ? '#1565c0' : 'rgba(0,0,0,0.16)',
                        backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0,0,0,0.02)',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Checkbox
                      checked={!!isSelected}
                      color="primary"
                      sx={{ mr: 1.5 }}
                    />
                    
                    <Avatar 
                      sx={{ 
                        width: 40,
                        height: 40,
                        bgcolor: isSelected ? '#1976d2' : 'rgba(0,0,0,0.08)',
                        color: isSelected ? '#ffffff' : 'rgba(0,0,0,0.6)',
                        fontWeight: 600,
                        mr: 2
                      }}
                    >
                      {employee.firstName?.charAt(0) || '?'}
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'rgba(0,0,0,0.87)',
                          mb: 0.25
                        }}
                      >
                        {employee.firstName} {employee.lastName}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(0,0,0,0.5)',
                          display: 'block'
                        }}
                      >
                        {employee.department} • {employee.location} • {employee.employeeId}
                      </Typography>
                    </Box>
                    
                    <Chip
                      label={employee.status}
                      size="small"
                      sx={{
                        bgcolor: employee.status === 'AKTIF' ? 'rgba(46, 125, 50, 0.12)' : 'rgba(0,0,0,0.08)',
                        color: employee.status === 'AKTIF' ? '#2e7d32' : 'rgba(0,0,0,0.6)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24
                      }}
                    />
                  </Box>
                </Fade>
              );
            })}
          </Box>
        )}
      </Box>
    </Paper>
  );

  // Bulk Actions kaldırıldı - performans iyileştirmesi

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Modern Header - Ultra Sade ve Profesyonel */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2.5 }}>
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
              Liste Oluşturucu
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
              İmza ve servis listelerini hızlıca oluşturun
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Chip 
              icon={<CheckCircleIcon />}
              label={`${selectedEmployees.length} Seçili`}
              color={selectedEmployees.length > 0 ? "success" : "default"}
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* 📊 İstatistik Kartları */}
      {renderStatsCards()}

      {/* ⚙️ Ana Konfigürasyon */}
      <Grid container spacing={3}>
        {/* Sol Panel - Ayarlar */}
        <Grid item xs={12} md={4}>
          {/* Liste Ayarları */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              background: '#ffffff'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: 'rgba(0,0,0,0.87)',
                mb: 2.5,
                fontSize: '1.125rem'
              }}
            >
              Liste Bilgileri
            </Typography>
              
            {/* Optimize edilmiş form bileşeni */}
            <ListSettingsForm 
              listInfo={listInfo} 
              setListInfo={setListInfo} 
              locations={locations} 
            />
          </Paper>

          {/* Aksiyon Butonları */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              background: '#ffffff'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: 'rgba(0,0,0,0.87)',
                mb: 2.5,
                fontSize: '1.125rem'
              }}
            >
              Hızlı İşlemler
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleProfessionalDownload}
                disabled={selectedEmployees.length === 0 || downloadLoading}
                startIcon={<FileDownloadIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                    color: 'rgba(0,0,0,0.26)'
                  },
                  transition: 'all 0.25s ease'
                }}
              >
                {downloadLoading ? 'Hazırlanıyor...' : `İmza Listesi İndir ${selectedEmployees.length > 0 ? `(${selectedEmployees.length})` : ''}`}
              </Button>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleServiceListDownload}
                disabled={selectedEmployees.length === 0 || downloadLoading}
                startIcon={<BusIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
                  fontWeight: 600,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(237, 108, 2, 0.3)',
                  textTransform: 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(237, 108, 2, 0.4)'
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                    color: 'rgba(0,0,0,0.26)'
                  },
                  transition: 'all 0.25s ease'
                }}
              >
                {downloadLoading ? 'Hazırlanıyor...' : `Servis Listesi İndir ${selectedEmployees.length > 0 ? `(${selectedEmployees.length})` : ''}`}
              </Button>

              <Divider sx={{ my: 1 }} />
              
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={handleProfessionalPrint}
                disabled={selectedEmployees.length === 0 || downloadLoading}
                startIcon={<PrintIcon />}
                sx={{
                  borderColor: 'rgba(0,0,0,0.12)',
                  color: 'rgba(0,0,0,0.6)',
                  fontWeight: 600,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                İmza Listesini Yazdır
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={handleServiceListPrint}
                disabled={selectedEmployees.length === 0 || downloadLoading}
                startIcon={<PrintIcon />}
                sx={{
                  borderColor: 'rgba(0,0,0,0.12)',
                  color: 'rgba(0,0,0,0.6)',
                  fontWeight: 600,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ed6c02',
                    backgroundColor: 'rgba(237, 108, 2, 0.04)'
                  }
                }}
              >
                Servis Listesini Yazdır
              </Button>
            </Box>
          </Paper>

          {/* Seçim Özeti */}
          {selectedEmployees.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                background: '#ffffff'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: 'rgba(0,0,0,0.87)',
                  mb: 2,
                  fontSize: '1.125rem'
                }}
              >
                Seçim Özeti
              </Typography>
              
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: 'rgba(46, 125, 50, 0.08)',
                border: '1px solid rgba(46, 125, 50, 0.2)',
                mb: 2
              }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32', mb: 0.5 }}>
                  {selectedEmployees.length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                  Çalışan seçili
                </Typography>
              </Box>
              
              <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)', fontWeight: 600, display: 'block', mb: 1 }}>
                DEPARTMANLAR
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {[...new Set(selectedEmployees.map(emp => emp.department))].map(dept => (
                  <Chip 
                    key={dept} 
                    label={dept} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(0,0,0,0.05)',
                      fontWeight: 500,
                      fontSize: '0.75rem'
                    }}
                  />
                ))}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Sağ Panel - Filtreler ve Liste */}
        <Grid item xs={12} md={8}>
          {renderAdvancedFilters()}
          {renderEmployeeList()}
        </Grid>
      </Grid>

      {/* 👁️ Önizleme Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>📋 Liste Önizlemesi</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {TEMPLATE_CONFIGS[selectedTemplate].name} kullanılarak {selectedEmployees.length} çalışan için liste oluşturulacak
          </Alert>
          
          <Typography variant="body2" paragraph>
            <strong>Başlık:</strong> {listInfo.title}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Tarih:</strong> {new Date(listInfo.date).toLocaleDateString('tr-TR')}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Lokasyon:</strong> {listInfo.location}
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Vardiya:</strong> {listInfo.timeSlot === 'custom' ? listInfo.customTimeSlot : listInfo.timeSlot}
          </Typography>
          
          {/* Seçilen çalışanların önizlemesi */}
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Seçilen Çalışanlar:</Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
            {selectedEmployees.slice(0, 10).map((emp, index) => (
              <Typography key={emp._id} variant="body2">
                {index + 1}. {emp.firstName} {emp.lastName} - {emp.department}
              </Typography>
            ))}
            {selectedEmployees.length > 10 && (
              <Typography variant="body2" color="text.secondary">
                ... ve {selectedEmployees.length - 10} çalışan daha
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Kapat</Button>
          <Button variant="contained" onClick={handleProfessionalDownload} startIcon={<FileDownloadIcon />}>
            Excel İndir
          </Button>
          <Button variant="outlined" color="primary" onClick={handleProfessionalPrint} startIcon={<PrintIcon />}>
            Yazıcıya Aktar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ⚙️ Ayarlar Dialog */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>⚙️ Gelişmiş Ayarlar</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Görünüm Ayarları:</Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={listInfo.showDepartment}
                onChange={(e) => setListInfo(prev => ({ ...prev, showDepartment: e.target.checked }))}
              />
            }
            label="Departman Bilgisi Göster"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={listInfo.showPosition}
                onChange={(e) => setListInfo(prev => ({ ...prev, showPosition: e.target.checked }))}
              />
            }
            label="Pozisyon Bilgisi Göster"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={listInfo.showSignature}
                onChange={(e) => setListInfo(prev => ({ ...prev, showSignature: e.target.checked }))}
              />
            }
            label="İmza Alanı Göster"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={listInfo.showTime}
                onChange={(e) => setListInfo(prev => ({ ...prev, showTime: e.target.checked }))}
              />
            }
            label="Giriş/Çıkış Saati Göster"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>Kapat</Button>
          <Button variant="contained" onClick={() => setSettingsDialog(false)}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default QuickList; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormControlLabel,
  TextField,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow,
  Save,
  Download,
  Schedule,
  Delete,
  Add,
  Preview,
  Email,
  CalendarToday
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import api from '../../config/api';
import { exportToExcel } from '../../utils/exportUtils';
import toast from 'react-hot-toast';
import { savePreference, getPreference } from '../../utils/indexedDB';

/**
 * 📊 Custom Report Builder
 * Özel rapor oluşturucu
 */

const REPORT_COLUMNS = [
  { id: 'adSoyad', label: 'Ad Soyad', category: 'Çalışan' },
  { id: 'tcNo', label: 'TC No', category: 'Çalışan' },
  { id: 'sicilNo', label: 'Sicil No', category: 'Çalışan' },
  { id: 'pozisyon', label: 'Pozisyon', category: 'Çalışan' },
  { id: 'departman', label: 'Departman', category: 'Çalışan' },
  { id: 'lokasyon', label: 'Lokasyon', category: 'Çalışan' },
  { id: 'date', label: 'Tarih', category: 'Devam' },
  { id: 'checkInTime', label: 'Giriş Saati', category: 'Devam' },
  { id: 'checkOutTime', label: 'Çıkış Saati', category: 'Devam' },
  { id: 'workDuration', label: 'Çalışma Süresi', category: 'Devam' },
  { id: 'workDurationMinutes', label: 'Çalışma (dk)', category: 'Devam' },
  { id: 'status', label: 'Durum', category: 'Devam' },
  { id: 'branch', label: 'Şube', category: 'Devam' },
  { id: 'method', label: 'Giriş Yöntemi', category: 'Devam' },
  { id: 'hasGPS', label: 'GPS Durumu', category: 'Konum' },
  { id: 'distance', label: 'Fabrikaya Uzaklık', category: 'Konum' },
  { id: 'lateMinutes', label: 'Geç Kalma (dk)', category: 'Mesai Hesaplama' },
  { id: 'earlyLeaveMinutes', label: 'Erken Çıkış (dk)', category: 'Mesai Hesaplama' },
  { id: 'overtimeMinutes', label: 'Otomatik Fazla Mesai (dk)', category: 'Mesai Hesaplama' },
  { id: 'manualOvertimeMinutes', label: 'Manuel Fazla Mesai (dk)', category: 'Mesai Hesaplama' },
  { id: 'manualOvertimeReason', label: 'Manuel Mesai Sebebi', category: 'Mesai Hesaplama' },
  { id: 'totalOvertimeMinutes', label: 'Toplam Fazla Mesai (dk)', category: 'Mesai Hesaplama' },
  { id: 'netOvertimeMinutes', label: 'Eksik/Fazla (dk)', category: 'Mesai Hesaplama' },
  { id: 'netOvertimeFormatted', label: 'Eksik/Fazla Mesai Süresi', category: 'Mesai Hesaplama' },
  { id: 'notes', label: 'Notlar', category: 'Diğer' }
];

const REPORT_TYPES = [
  { id: 'daily', label: 'Günlük Rapor', icon: '📅' },
  { id: 'weekly', label: 'Haftalık Rapor', icon: '📆' },
  { id: 'monthly', label: 'Aylık Rapor', icon: '📊' },
  { id: 'custom', label: 'Özel Tarih Aralığı', icon: '📋' }
];

const SCHEDULE_OPTIONS = [
  { id: 'once', label: 'Tek Seferlik' },
  { id: 'daily', label: 'Her Gün' },
  { id: 'weekly', label: 'Her Hafta' },
  { id: 'monthly', label: 'Her Ay' }
];

const CustomReportBuilder = ({ onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [previewDialog, setPreviewDialog] = useState(false);

  const [reportConfig, setReportConfig] = useState({
    name: '',
    type: 'daily',
    dateRange: {
      start: moment(),
      end: moment()
    },
    columns: ['adSoyad', 'checkInTime', 'checkOutTime', 'workDuration', 'status'],
    filters: {
      departments: [],
      locations: [],
      branches: [],
      statuses: []
    },
    groupBy: '',
    schedule: 'once',
    sendEmail: false,
    emailRecipients: []
  });

  // Kaydedilmiş raporları yükle
  useEffect(() => {
    const loadSavedReports = async () => {
      const saved = await getPreference('savedReportTemplates', []);
      setSavedReports(saved);
    };
    loadSavedReports();
  }, []);

  // Config güncelle
  const updateConfig = (field, value) => {
    setReportConfig(prev => ({ ...prev, [field]: value }));
  };

  // Kolon toggle
  const toggleColumn = (columnId) => {
    const current = reportConfig.columns;
    const newColumns = current.includes(columnId)
      ? current.filter(c => c !== columnId)
      : [...current, columnId];
    updateConfig('columns', newColumns);
  };

  // Rapor ön izleme
  const handlePreview = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: reportConfig.dateRange.start.format('YYYY-MM-DD'),
        endDate: reportConfig.dateRange.end.format('YYYY-MM-DD'),
        ...reportConfig.filters
      };

      const response = await api.get('/api/attendance/daily', { params });
      
      // Veriyi formatla
      const formattedData = (response.data.records || []).slice(0, 10).map(r => 
        formatRecordForReport(r, reportConfig.columns)
      );

      setPreviewData({
        columns: reportConfig.columns.map(c => REPORT_COLUMNS.find(col => col.id === c)),
        data: formattedData,
        totalCount: response.data.records?.length || 0
      });
      setPreviewDialog(true);
    } catch (error) {
      toast.error('Ön izleme yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Rapor oluştur ve indir
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: reportConfig.dateRange.start.format('YYYY-MM-DD'),
        endDate: reportConfig.dateRange.end.format('YYYY-MM-DD'),
        ...reportConfig.filters
      };

      const response = await api.get('/api/attendance/daily', { params });
      
      const formattedData = (response.data.records || []).map(r => 
        formatRecordForReport(r, reportConfig.columns)
      );

      // Excel'e dönüştür
      const exportData = formattedData.map(row => {
        const obj = {};
        reportConfig.columns.forEach(colId => {
          const col = REPORT_COLUMNS.find(c => c.id === colId);
          obj[col?.label || colId] = row[colId] || '-';
        });
        return obj;
      });

      const fileName = reportConfig.name || 
        `rapor_${reportConfig.type}_${moment().format('YYYY-MM-DD')}`;
      
      exportToExcel(exportData, fileName);
      toast.success(`Rapor oluşturuldu: ${exportData.length} kayıt`);
    } catch (error) {
      toast.error('Rapor oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  // Şablonu kaydet
  const handleSaveTemplate = async () => {
    if (!reportConfig.name) {
      toast.error('Lütfen rapor adı girin');
      return;
    }

    const newTemplate = {
      ...reportConfig,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    const newSaved = [...savedReports, newTemplate];
    setSavedReports(newSaved);
    await savePreference('savedReportTemplates', newSaved);
    toast.success('Şablon kaydedildi');
  };

  // Şablon yükle
  const handleLoadTemplate = (template) => {
    setReportConfig({
      ...template,
      dateRange: {
        start: moment(),
        end: moment()
      }
    });
    toast.success('Şablon yüklendi');
  };

  // Şablon sil
  const handleDeleteTemplate = async (id) => {
    const newSaved = savedReports.filter(t => t.id !== id);
    setSavedReports(newSaved);
    await savePreference('savedReportTemplates', newSaved);
    toast.success('Şablon silindi');
  };

  // Kategoriye göre grupla
  const columnsByCategory = REPORT_COLUMNS.reduce((acc, col) => {
    if (!acc[col.category]) acc[col.category] = [];
    acc[col.category].push(col);
    return acc;
  }, {});

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Box>
        {/* Kaydedilmiş Şablonlar */}
        {savedReports.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Kaydedilmiş Şablonlar
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {savedReports.map(template => (
                <Chip
                  key={template.id}
                  label={template.name}
                  onClick={() => handleLoadTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Step 1: Rapor Tipi */}
          <Step>
            <StepLabel>Rapor Tipi Seçin</StepLabel>
            <StepContent>
              <Grid container spacing={2}>
                {REPORT_TYPES.map(type => (
                  <Grid item xs={6} md={3} key={type.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: 2,
                        borderColor: reportConfig.type === type.id ? 'primary.main' : 'transparent',
                        '&:hover': { borderColor: 'primary.light' }
                      }}
                      onClick={() => updateConfig('type', type.id)}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h4" mb={1}>{type.icon}</Typography>
                        <Typography variant="body2">{type.label}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {reportConfig.type === 'custom' && (
                <Box mt={2} display="flex" gap={2}>
                  <DatePicker
                    label="Başlangıç"
                    value={reportConfig.dateRange.start}
                    onChange={(date) => updateConfig('dateRange', { ...reportConfig.dateRange, start: date })}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label="Bitiş"
                    value={reportConfig.dateRange.end}
                    onChange={(date) => updateConfig('dateRange', { ...reportConfig.dateRange, end: date })}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
              )}

              <Box mt={2}>
                <Button variant="contained" onClick={() => setActiveStep(1)}>
                  Devam
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 2: Kolonları Seç */}
          <Step>
            <StepLabel>Rapor Kolonlarını Seçin</StepLabel>
            <StepContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                {reportConfig.columns.length} kolon seçildi
              </Alert>

              {Object.entries(columnsByCategory).map(([category, columns]) => (
                <Box key={category} mb={2}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {category}
                  </Typography>
                  <FormGroup row>
                    {columns.map(col => (
                      <FormControlLabel
                        key={col.id}
                        control={
                          <Checkbox
                            checked={reportConfig.columns.includes(col.id)}
                            onChange={() => toggleColumn(col.id)}
                            size="small"
                          />
                        }
                        label={col.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              ))}

              <Box mt={2} display="flex" gap={1}>
                <Button onClick={() => setActiveStep(0)}>Geri</Button>
                <Button variant="contained" onClick={() => setActiveStep(2)}>
                  Devam
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* Step 3: Ayarlar ve Oluştur */}
          <Step>
            <StepLabel>Rapor Ayarları</StepLabel>
            <StepContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rapor Adı"
                    value={reportConfig.name}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="Örn: Haftalık Devam Raporu"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gruplama</InputLabel>
                    <Select
                      value={reportConfig.groupBy}
                      label="Gruplama"
                      onChange={(e) => updateConfig('groupBy', e.target.value)}
                    >
                      <MenuItem value="">Gruplama Yok</MenuItem>
                      <MenuItem value="department">Departmana Göre</MenuItem>
                      <MenuItem value="location">Lokasyona Göre</MenuItem>
                      <MenuItem value="date">Tarihe Göre</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={16} /> : <Preview />}
                  onClick={handlePreview}
                  disabled={loading}
                >
                  Ön İzleme
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={handleSaveTemplate}
                >
                  Şablon Kaydet
                </Button>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Download />}
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  Raporu Oluştur
                </Button>
              </Box>

              <Box mt={2}>
                <Button onClick={() => setActiveStep(1)}>Geri</Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>

        {/* Preview Dialog */}
        <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Rapor Ön İzleme (İlk 10 Kayıt)</DialogTitle>
          <DialogContent>
            {previewData && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Toplam {previewData.totalCount} kayıt bulundu
                </Alert>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {previewData.columns.map(col => (
                          <th 
                            key={col?.id} 
                            style={{ 
                              padding: 8, 
                              borderBottom: '2px solid #ddd',
                              textAlign: 'left',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {col?.label || '-'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.data.map((row, i) => (
                        <tr key={i}>
                          {previewData.columns.map(col => (
                            <td 
                              key={col?.id}
                              style={{ 
                                padding: 8, 
                                borderBottom: '1px solid #eee' 
                              }}
                            >
                              {row[col?.id] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialog(false)}>Kapat</Button>
            <Button 
              variant="contained" 
              onClick={() => { setPreviewDialog(false); handleGenerate(); }}
            >
              Raporu İndir
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

// Manuel mesai sebebi çevirisi
const MANUAL_OVERTIME_REASONS = {
  'YEMEK_MOLASI_YOK': 'Yemeğe Çıkmadan Çalıştı',
  'HAFTA_SONU_CALISMA': 'Hafta Sonu Çalışma',
  'TATIL_CALISMA': 'Tatil Günü Çalışma',
  'GECE_MESAI': 'Gece Mesaisi',
  'ACIL_IS': 'Acil İş',
  'PROJE_TESLIM': 'Proje Teslimi',
  'BAKIM_ONARIM': 'Bakım/Onarım',
  'EGITIM': 'Eğitim',
  'TOPLANTI': 'Toplantı',
  'DIGER': 'Diğer'
};

// Durum çevirisi
const STATUS_MAP = {
  'NORMAL': 'Normal',
  'LATE': 'Geç Kaldı',
  'EARLY_LEAVE': 'Erken Çıktı',
  'ABSENT': 'Devamsız',
  'HOLIDAY': 'Tatil',
  'LEAVE': 'İzinli',
  'SICK_LEAVE': 'Hastalık İzni',
  'WEEKEND': 'Hafta Sonu',
  'INCOMPLETE': 'Eksik Kayıt',
  'COMPLETED': 'Tamamlandı'
};

// Record'u rapor formatına dönüştür
function formatRecordForReport(record, columns) {
  const result = {};
  
  // Mesai hesaplamaları
  const lateMinutes = record.lateMinutes || 0;
  const earlyLeaveMinutes = record.earlyLeaveMinutes || 0;
  const autoOvertime = record.overtimeMinutes || 0;
  const manualOvertime = record.manualOvertimeMinutes || 0;
  const totalOvertime = autoOvertime + manualOvertime;
  const netOvertime = totalOvertime - lateMinutes - earlyLeaveMinutes;
  
  // Net eksik/fazla mesai formatlanmış
  let netOvertimeFormatted = '0 dk';
  if (netOvertime !== 0) {
    const absMinutes = Math.abs(netOvertime);
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    const formatted = hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
    netOvertimeFormatted = netOvertime > 0 ? `+${formatted}` : `-${formatted}`;
  }
  
  columns.forEach(colId => {
    switch (colId) {
      case 'adSoyad':
        result[colId] = record.employeeId?.adSoyad || '-';
        break;
      case 'tcNo':
        result[colId] = record.employeeId?.tcNo || '-';
        break;
      case 'sicilNo':
        result[colId] = record.employeeId?.employeeId || record.employeeId?.sicilNo || '-';
        break;
      case 'pozisyon':
        result[colId] = record.employeeId?.pozisyon || '-';
        break;
      case 'departman':
        result[colId] = record.employeeId?.departman || '-';
        break;
      case 'lokasyon':
        result[colId] = record.employeeId?.lokasyon || '-';
        break;
      case 'date':
        result[colId] = record.date 
          ? new Date(record.date).toLocaleDateString('tr-TR')
          : record.checkIn?.time 
            ? new Date(record.checkIn.time).toLocaleDateString('tr-TR')
            : '-';
        break;
      case 'checkInTime':
        result[colId] = record.checkIn?.time 
          ? new Date(record.checkIn.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          : '-';
        break;
      case 'checkOutTime':
        result[colId] = record.checkOut?.time 
          ? new Date(record.checkOut.time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          : '-';
        break;
      case 'workDuration':
        result[colId] = record.workDuration 
          ? `${Math.floor(record.workDuration / 60)}s ${record.workDuration % 60}dk`
          : '-';
        break;
      case 'workDurationMinutes':
        result[colId] = record.workDuration || 0;
        break;
      case 'status':
        // Gelişmiş durum belirleme
        let statusStr = STATUS_MAP[record.status] || record.status || '-';
        if (record.isLate && record.isEarlyLeave) {
          statusStr = '⚠️ Eksik Mesai';
        } else if (record.isLate) {
          statusStr = '⏰ Geç Kaldı';
        } else if (record.isEarlyLeave) {
          statusStr = '🚪 Erken Çıkış';
        } else if (netOvertime > 0) {
          statusStr = '💪 Fazla Mesai';
        }
        result[colId] = statusStr;
        break;
      case 'branch':
        const branch = record.checkIn?.branch;
        result[colId] = branch === 'IŞIL' || branch === 'ISIL' ? 'Işıl Şube' : branch === 'MERKEZ' ? 'Merkez Şube' : branch || '-';
        break;
      case 'method':
        const method = record.checkIn?.method;
        const methodMap = { 'QR': 'QR Kod', 'SIGNATURE': 'İmza', 'MANUAL': 'Manuel', 'GPS': 'GPS' };
        result[colId] = methodMap[method] || method || '-';
        break;
      case 'hasGPS':
        result[colId] = record.checkIn?.coordinates ? '✓ Var' : '✗ Yok';
        break;
      case 'distance':
        result[colId] = record.checkIn?.distanceFromFactory 
          ? `${record.checkIn.distanceFromFactory}m`
          : '-';
        break;
      case 'lateMinutes':
        result[colId] = lateMinutes;
        break;
      case 'earlyLeaveMinutes':
        result[colId] = earlyLeaveMinutes;
        break;
      case 'overtimeMinutes':
        result[colId] = autoOvertime;
        break;
      case 'manualOvertimeMinutes':
        result[colId] = manualOvertime;
        break;
      case 'manualOvertimeReason':
        result[colId] = record.manualOvertimeReason 
          ? MANUAL_OVERTIME_REASONS[record.manualOvertimeReason] || record.manualOvertimeReason
          : '-';
        break;
      case 'totalOvertimeMinutes':
        result[colId] = totalOvertime;
        break;
      case 'netOvertimeMinutes':
        result[colId] = netOvertime;
        break;
      case 'netOvertimeFormatted':
        result[colId] = netOvertimeFormatted;
        break;
      case 'notes':
        result[colId] = record.notes || record.manualOvertimeNotes || '-';
        break;
      default:
        result[colId] = '-';
    }
  });

  return result;
}

export default CustomReportBuilder;

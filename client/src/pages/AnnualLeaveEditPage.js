import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  Snackbar,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { tr } from 'date-fns/locale';
import { format, differenceInYears } from 'date-fns';

// 🔗 API Base URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// 📆 Yıllık İzin Detay Düzenleme Sayfası
const AnnualLeaveEditPage = () => {
  const navigate = useNavigate();
  
  // 🔄 State tanımlamaları
  const [employees, setEmployees] = useState([]); // Çalışanlar ve izin bilgileri
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null); // Düzenlenen çalışan
  const [changes, setChanges] = useState({}); // Yapılan değişiklikler
  
  // 📄 Sayfalama
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // 🔔 Bildirim sistemi
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 📊 İstatistikler
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalLeaveUsed: 0,
    totalLeaveEntitled: 0,
    avgLeavePerEmployee: 0,
    employeesWithoutLeave: 0
  });

  // 📤 Excel Export
  const [exporting, setExporting] = useState(false);

  // 📅 Yıl seçimi
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const availableYears = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

  // 🔔 Bildirim göster
  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  // 🔔 Bildirim kapat
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // 👥 Çalışanları ve izin bilgilerini getir
  const fetchEmployeesWithLeaveData = async () => {
    try {
      setLoading(true);
      
      // Önce çalışanları al
      const employeesResponse = await fetch(`${API_BASE}/api/employees?limit=1000&durum=AKTIF`);
      const employeesData = await employeesResponse.json();
      
      if (!employeesResponse.ok) {
        throw new Error('Çalışanlar yüklenemedi');
      }

      // Her çalışan için izin bilgilerini al
      const employeesWithLeave = await Promise.all(
        employeesData.data.map(async (employee) => {
          try {
            const leaveResponse = await fetch(`${API_BASE}/api/annual-leave/${employee._id}`);
            let leaveData = { leaveByYear: [], totalLeaveStats: { totalEntitled: 0, totalUsed: 0, remaining: 0 } };
            
            if (leaveResponse.ok) {
              const leaveResult = await leaveResponse.json();
              leaveData = leaveResult.data?.leaveRecord || leaveData;
            }

            return {
              ...employee,
              leaveData,
              // İzin hakları hesaplama
              workYears: employee.iseGirisTarihi ? differenceInYears(new Date(), new Date(employee.iseGirisTarihi)) : 0
            };
          } catch (error) {
            console.error(`${employee.adSoyad} için izin verileri alınamadı:`, error);
            return {
              ...employee,
              leaveData: { leaveByYear: [], totalLeaveStats: { totalEntitled: 0, totalUsed: 0, remaining: 0 } },
              workYears: 0
            };
          }
        })
      );

      setEmployees(employeesWithLeave);
      calculateStats(employeesWithLeave);
      
      showNotification(`${employeesWithLeave.length} çalışanın izin verileri yüklendi`, 'success');
      
    } catch (error) {
      console.error('❌ Veri yükleme hatası:', error);
      showNotification('Veriler yüklenemedi: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 📊 İstatistikleri hesapla
  const calculateStats = (employeesData) => {
    const totalEmployees = employeesData.length;
    const totalLeaveUsed = employeesData.reduce((sum, emp) => sum + (emp.leaveData?.totalLeaveStats?.totalUsed || 0), 0);
    const totalLeaveEntitled = employeesData.reduce((sum, emp) => sum + (emp.leaveData?.totalLeaveStats?.totalEntitled || 0), 0);
    const employeesWithoutLeave = employeesData.filter(emp => (emp.leaveData?.totalLeaveStats?.totalUsed || 0) === 0).length;
    
    setStats({
      totalEmployees,
      totalLeaveUsed,
      totalLeaveEntitled,
      avgLeavePerEmployee: totalEmployees > 0 ? Math.round(totalLeaveUsed / totalEmployees) : 0,
      employeesWithoutLeave
    });
  };

  // 🔍 Arama ve filtreleme
  const applyFilters = () => {
    let filtered = [...employees];
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.adSoyad?.toLowerCase().includes(searchLower) ||
        emp.employeeId?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredEmployees(filtered);
  };

  // ✏️ Çalışan düzenleme başlat
  const startEditEmployee = (employee) => {
    setEditingEmployee(employee._id);
    
    // Mevcut izin verilerini changes'e koy
    const currentLeaveData = employee.leaveData || { leaveByYear: [] };
    setChanges({
      [employee._id]: {
        leaveByYear: [...currentLeaveData.leaveByYear]
      }
    });
  };

  // ❌ Düzenlemeyi iptal et
  const cancelEdit = () => {
    setEditingEmployee(null);
    setChanges({});
  };

  // 📝 Yıllık izin değişikliği
  const handleYearlyLeaveChange = (employeeId, year, field, value) => {
    setChanges(prev => {
      const employeeChanges = prev[employeeId] || { leaveByYear: [] };
      const leaveByYear = [...employeeChanges.leaveByYear];
      
      // Yıl var mı kontrol et
      let yearIndex = leaveByYear.findIndex(y => y.year === year);
      
      if (yearIndex === -1) {
        // Yıl yoksa yeni ekle
        yearIndex = leaveByYear.length;
        leaveByYear.push({ year, entitled: 0, used: 0 });
      }
      
      // Değeri güncelle
      leaveByYear[yearIndex][field] = parseInt(value) || 0;
      
      return {
        ...prev,
        [employeeId]: {
          ...employeeChanges,
          leaveByYear
        }
      };
    });
  };

  // 💾 Değişiklikleri kaydet
  const saveChanges = async () => {
    if (!editingEmployee || !changes[editingEmployee]) {
      showNotification('Kaydedilecek değişiklik bulunamadı', 'warning');
      return;
    }

    try {
      setSaving(true);
      
      const employeeChanges = changes[editingEmployee];
      
      // Her yıl için ayrı ayrı kaydet
      let successCount = 0;
      for (const yearData of employeeChanges.leaveByYear) {
        try {
          const response = await fetch(`${API_BASE}/api/annual-leave/${editingEmployee}/usage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              year: yearData.year,
              days: yearData.used,
              startDate: new Date(yearData.year, 0, 1),
              endDate: new Date(yearData.year, 11, 31),
              notes: `Manuel güncelleme - ${yearData.year} yılı için ${yearData.used} gün`
            })
          });
          
          if (response.ok) {
            successCount++;
          } else {
            console.error(`${yearData.year} yılı güncellenemedi`);
          }
        } catch (error) {
          console.error(`${yearData.year} yılı güncelleme hatası:`, error);
        }
      }
      
      if (successCount > 0) {
        showNotification(`${successCount} yıl başarıyla güncellendi!`, 'success');
        
        // Verileri yenile
        await fetchEmployeesWithLeaveData();
        setEditingEmployee(null);
        setChanges({});
      } else {
        throw new Error('Hiçbir yıl güncellenemedi');
      }
      
    } catch (error) {
      console.error('❌ Kaydetme hatası:', error);
      showNotification('Değişiklikler kaydedilemedi: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // 📊 Profesyonel Excel Export
  const handleExcelExport = async () => {
    try {
      setExporting(true);
      
      // Excel verilerini hazırla
      const today = new Date();
      const reportData = {
        title: 'CANGA MAKİNA - Yıllık İzin Raporu',
        generatedDate: format(today, 'dd.MM.yyyy HH:mm', { locale: tr }),
        reportPeriod: `${Math.min(...availableYears)} - ${Math.max(...availableYears)}`,
        totalEmployees: stats.totalEmployees,
        totalLeaveUsed: stats.totalLeaveUsed,
        totalLeaveEntitled: stats.totalLeaveEntitled,
        avgLeavePerEmployee: stats.avgLeavePerEmployee,
        employees: filteredEmployees.map(emp => {
          const leaveData = emp.leaveData || {};
          const totalUsed = leaveData.totalLeaveStats?.totalUsed || 0;
          const totalEntitled = leaveData.totalLeaveStats?.totalEntitled || 0;
          
          return {
            adSoyad: emp.adSoyad,
            employeeId: emp.employeeId,
            iseGirisTarihi: emp.iseGirisTarihi ? format(new Date(emp.iseGirisTarihi), 'dd.MM.yyyy', { locale: tr }) : '',
            calismaYili: emp.workYears,
            toplamKullanilan: totalUsed,
            toplamHakEdilen: totalEntitled,
            kalan: totalEntitled - totalUsed,
            yearlyData: availableYears.map(year => {
              const yearData = leaveData.leaveByYear?.find(y => y.year === year);
              return {
                year,
                used: yearData?.used || 0,
                entitled: yearData?.entitled || calculateLeaveEntitlement(emp.workYears)
              };
            })
          };
        })
      };
      
      // Excel export API'sine gönder
      const response = await fetch(`${API_BASE}/api/annual-leave/export-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) {
        throw new Error('Excel export başarısız');
      }
      
      // Dosyayı indir
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Canga_Yillik_Izin_Raporu_${format(today, 'dd-MM-yyyy', { locale: tr })}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showNotification('Excel raporu başarıyla indirildi!', 'success');
      
    } catch (error) {
      console.error('❌ Excel export hatası:', error);
      showNotification('Excel raporu oluşturulamadı: ' + error.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  // 📅 İzin hakkı hesaplama (Türk İş Kanunu'na göre)
  const calculateLeaveEntitlement = (workYears) => {
    if (workYears < 1) return 0;
    if (workYears >= 1 && workYears < 5) return 14; // 1-5 yıl: 14 gün
    if (workYears >= 5 && workYears < 15) return 20; // 5-15 yıl: 20 gün
    return 26; // 15+ yıl: 26 gün
  };

  // 🎨 Yıllık izin hücresi render
  const renderYearlyLeaveCell = (employee, year) => {
    const isEditing = editingEmployee === employee._id;
    const yearData = employee.leaveData?.leaveByYear?.find(y => y.year === year);
    const usedDays = yearData?.used || 0;
    const entitledDays = yearData?.entitled || calculateLeaveEntitlement(employee.workYears);
    
    // Düzenleme modundaki güncel değer
    const currentChanges = changes[employee._id]?.leaveByYear?.find(y => y.year === year);
    const currentUsed = currentChanges?.used !== undefined ? currentChanges.used : usedDays;
    const currentEntitled = currentChanges?.entitled !== undefined ? currentChanges.entitled : entitledDays;

    if (!isEditing) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="body2" fontWeight="600">
            {usedDays} / {entitledDays}
          </Typography>
          {usedDays > 0 && (
            <LinearProgress 
              variant="determinate" 
              value={Math.min((usedDays / entitledDays) * 100, 100)}
              sx={{ width: '100%', mt: 0.5 }}
              color={usedDays > entitledDays ? 'error' : 'primary'}
            />
          )}
        </Box>
      );
    }

    return (
      <Box display="flex" flexDirection="column" gap={1}>
        <TextField
          size="small"
          type="number"
          label="Kullanılan"
          value={currentUsed}
          onChange={(e) => handleYearlyLeaveChange(employee._id, year, 'used', e.target.value)}
          sx={{ width: 80 }}
        />
        <TextField
          size="small"
          type="number"
          label="Hak Edilen"
          value={currentEntitled}
          onChange={(e) => handleYearlyLeaveChange(employee._id, year, 'entitled', e.target.value)}
          sx={{ width: 80 }}
        />
      </Box>
    );
  };

  // 🔄 Component mount
  useEffect(() => {
    fetchEmployeesWithLeaveData();
  }, []);

  // 🔍 Arama değiştiğinde filtreleme
  useEffect(() => {
    applyFilters();
  }, [searchText, employees]);

  // 📅 Tarih formatlama
  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd.MM.yyyy', { locale: tr });
    } catch {
      return '-';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
      <Box sx={{ p: 3, maxWidth: '1800px', mx: 'auto' }}>
        {/* 🎯 Sayfa Başlığı */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="600" color="text.primary" sx={{ mb: 0.5 }}>
              📆 Yıllık İzin Liste Düzenleme
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Çalışanların daha önce alınmış izinleri, kalan hakları, kullanılan hakları ve yıllara göre detaylı izin bilgilerini düzenleyin
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExcelExport}
              disabled={exporting || loading}
              sx={{
                backgroundColor: '#2E7D32',
                '&:hover': { backgroundColor: '#1B5E20' }
              }}
            >
              {exporting ? 'Excel Hazırlanıyor...' : '📊 Profesyonel Excel Raporu İndir'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/annual-leave')}
            >
              Geri Dön
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchEmployeesWithLeaveData}
              disabled={loading}
            >
              Yenile
            </Button>
            {editingEmployee && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={cancelEdit}
                >
                  İptal
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveChanges}
                  disabled={saving}
                  sx={{
                    backgroundColor: '#2C5AA0',
                    '&:hover': { backgroundColor: '#1e3f73' }
                  }}
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* 📊 İstatistik Kartları */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CalendarIcon sx={{ mr: 1, color: '#2C5AA0' }} />
                  <Box>
                    <Typography variant="h6">{stats.totalEmployees}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Çalışan
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AssessmentIcon sx={{ mr: 1, color: '#ff9800' }} />
                  <Box>
                    <Typography variant="h6">{stats.totalLeaveUsed}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Kullanılan İzin
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUpIcon sx={{ mr: 1, color: '#4caf50' }} />
                  <Box>
                    <Typography variant="h6">{stats.totalLeaveEntitled}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toplam Hak Edilen İzin
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ScheduleIcon sx={{ mr: 1, color: '#9c27b0' }} />
                  <Box>
                    <Typography variant="h6">{stats.avgLeavePerEmployee}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ortalama İzin/Kişi
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <WarningIcon sx={{ mr: 1, color: '#f44336' }} />
                  <Box>
                    <Typography variant="h6">{stats.employeesWithoutLeave}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      İzin Kullanmayan
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 🔍 Arama */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Çalışan ara (Ad, Çalışan ID)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {filteredEmployees.length} / {employees.length} çalışan
            </Typography>
          </Box>
        </Paper>

        {/* 📋 İzin Tablosu */}
        <Paper>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>İşlemler</TableCell>
                      <TableCell>Çalışan Adı</TableCell>
                      <TableCell>İşe Giriş</TableCell>
                      <TableCell>Çalışma Yılı</TableCell>
                      <TableCell>Toplam Kullanılan</TableCell>
                      <TableCell>Toplam Hak Edilen</TableCell>
                      <TableCell>Kalan</TableCell>
                      <TableCell>İzin Geçmişi</TableCell>
                      {availableYears.slice(0, 8).map(year => (
                        <TableCell key={year} align="center">
                          {year}
                          <br />
                          <Typography variant="caption">K/H</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((employee) => {
                        const isEditing = editingEmployee === employee._id;
                        const totalUsed = employee.leaveData?.totalLeaveStats?.totalUsed || 0;
                        const totalEntitled = employee.leaveData?.totalLeaveStats?.totalEntitled || 0;
                        const remaining = totalEntitled - totalUsed;
                        
                        // İzin geçmişi (izin kullandığı yıllar)
                        const leaveHistory = employee.leaveData?.leaveByYear?.filter(y => y.used > 0) || [];
                        
                        return (
                          <TableRow 
                            key={employee._id}
                            sx={{ 
                              backgroundColor: isEditing ? '#e3f2fd' : 'inherit',
                              '&:hover': { backgroundColor: '#f5f5f5' }
                            }}
                          >
                            {/* İşlemler */}
                            <TableCell>
                              {!isEditing ? (
                                <Tooltip title="İzin Detaylarını Düzenle">
                                  <IconButton
                                    size="small"
                                    onClick={() => startEditEmployee(employee)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Chip 
                                  label="Düzenleniyor" 
                                  color="primary" 
                                  size="small"
                                  icon={<EditIcon />}
                                />
                              )}
                            </TableCell>
                            
                            {/* Çalışan Bilgileri */}
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {employee.adSoyad}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {employee.employeeId}
                              </Typography>
                            </TableCell>
                            <TableCell>{formatDate(employee.iseGirisTarihi)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={`${employee.workYears} yıl`}
                                size="small"
                                color={employee.workYears >= 5 ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {totalUsed} gün
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {totalEntitled} gün
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${remaining} gün`}
                                size="small"
                                color={remaining < 0 ? 'error' : remaining > 10 ? 'success' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={0.5} flexWrap="wrap">
                                {leaveHistory.length > 0 ? (
                                  leaveHistory.map(yearData => (
                                    <Chip
                                      key={yearData.year}
                                      label={`${yearData.year}: ${yearData.used}g`}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                  ))
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    Henüz izin kullanımı yok
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            
                            {/* Yıllık İzin Detayları */}
                            {availableYears.slice(0, 8).map(year => (
                              <TableCell key={year} align="center">
                                {renderYearlyLeaveCell(employee, year)}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* 📄 Sayfalama */}
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
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Sayfa başına satır:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
                }
              />
            </>
          )}
        </Paper>



        {/* 🔔 Bildirim Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseNotification} 
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AnnualLeaveEditPage;

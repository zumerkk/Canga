import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  ButtonGroup,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Switch
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Assessment as AssessmentIcon,
  TrendingUp,
  TrendingDown,
  Schedule,
  People,
  LocationOn,
  CheckCircle,
  Cancel,
  Warning,
  FilterList,
  Search,
  Refresh,
  PictureAsPdf,
  TableChart,
  BarChart,
  PieChart,
  Timeline,
  DateRange,
  Today,
  ViewWeek,
  CalendarMonth
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import 'moment/locale/tr';
import api from '../config/api';
import { 
  LineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

moment.locale('tr');

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ReportingDashboard = () => {
  const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({
    totalEmployees: 145,
    totalCheckIns: 142,
    totalCheckOuts: 138,
    totalAbsents: 3,
    totalLate: 12,
    totalEarly: 5,
    attendanceRate: 98,
    punctualityRate: 92,
    avgWorkHours: 8.5,
    totalOvertime: 24,
    avgLateMinutes: 15
  });
  const [chartData, setChartData] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [filters, setFilters] = useState({
    showLate: true,
    showEarly: true,
    showAbsent: true,
    showOvertime: true,
    groupByDepartment: false
  });

  useEffect(() => {
    // Simulated data for demonstration
    const mockChartData = {
      dailyTrend: [
        { date: '06.11', giriş: 140, çıkış: 138, devamsız: 5 },
        { date: '07.11', giriş: 142, çıkış: 140, devamsız: 3 },
        { date: '08.11', giriş: 141, çıkış: 139, devamsız: 4 },
        { date: '09.11', giriş: 143, çıkış: 141, devamsız: 2 },
        { date: '10.11', giriş: 138, çıkış: 136, devamsız: 7 },
        { date: '11.11', giriş: 144, çıkış: 142, devamsız: 1 },
        { date: '12.11', giriş: 142, çıkış: 138, devamsız: 3 }
      ],
      locationDistribution: [
        { name: 'MERKEZ', value: 85 },
        { name: 'İŞL', value: 35 },
        { name: 'OSB', value: 15 },
        { name: 'İŞİL', value: 10 }
      ],
      departmentDistribution: [
        { name: 'Üretim', toplam: 65, zamanında: 58, geç: 7 },
        { name: 'Yönetim', toplam: 25, zamanında: 24, geç: 1 },
        { name: 'Satış', toplam: 20, zamanında: 18, geç: 2 },
        { name: 'IT', toplam: 15, zamanında: 14, geç: 1 },
        { name: 'Muhasebe', toplam: 20, zamanında: 19, geç: 1 }
      ],
      anomalyDistribution: [
        { name: 'Geç Gelme', value: 12 },
        { name: 'Erken Çıkma', value: 5 },
        { name: 'Eksik Kayıt', value: 3 },
        { name: 'Devamsız', value: 3 }
      ]
    };
    setChartData(mockChartData);
    loadReportData();
  }, [reportType, selectedDate, selectedLocation, selectedDepartment]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      let startDate, endDate;
      
      switch(reportType) {
        case 'daily':
          startDate = selectedDate.clone().startOf('day');
          endDate = selectedDate.clone().endOf('day');
          break;
        case 'weekly':
          startDate = selectedDate.clone().startOf('week');
          endDate = selectedDate.clone().endOf('week');
          break;
        case 'monthly':
          startDate = selectedDate.clone().startOf('month');
          endDate = selectedDate.clone().endOf('month');
          break;
        default:
          startDate = selectedDate.clone().startOf('day');
          endDate = selectedDate.clone().endOf('day');
          break;
      }
      
      const response = await api.get('/api/reports/attendance-report', {
        params: {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          location: selectedLocation,
          department: selectedDepartment,
          reportType: reportType
        }
      });
      
      // Use mock data if API fails
      if (response.data) {
        setReportData(response.data);
        processChartData(response.data);
      }
      
    } catch (error) {
      console.error('Rapor yüklenemedi:', error);
      // Use mock data on error
      setReportData({
        totalEmployees: 145,
        totalCheckIns: 142,
        totalCheckOuts: 138,
        totalAbsents: 3,
        totalLate: 12,
        totalEarly: 5,
        attendanceRate: 98,
        punctualityRate: 92,
        avgWorkHours: 8.5,
        totalOvertime: 24,
        avgLateMinutes: 15
      });
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    if (!data) {
      // Use mock data if no data available
      const mockChartData = {
        dailyTrend: [
          { date: '06.11', giriş: 140, çıkış: 138, devamsız: 5 },
          { date: '07.11', giriş: 142, çıkış: 140, devamsız: 3 },
          { date: '08.11', giriş: 141, çıkış: 139, devamsız: 4 },
          { date: '09.11', giriş: 143, çıkış: 141, devamsız: 2 },
          { date: '10.11', giriş: 138, çıkış: 136, devamsız: 7 },
          { date: '11.11', giriş: 144, çıkış: 142, devamsız: 1 },
          { date: '12.11', giriş: 142, çıkış: 138, devamsız: 3 }
        ],
        locationDistribution: [
          { name: 'MERKEZ', value: 85 },
          { name: 'İŞL', value: 35 },
          { name: 'OSB', value: 15 },
          { name: 'İŞİL', value: 10 }
        ],
        departmentDistribution: [
          { name: 'Üretim', toplam: 65, zamanında: 58, geç: 7 },
          { name: 'Yönetim', toplam: 25, zamanında: 24, geç: 1 },
          { name: 'Satış', toplam: 20, zamanında: 18, geç: 2 },
          { name: 'IT', toplam: 15, zamanında: 14, geç: 1 },
          { name: 'Muhasebe', toplam: 20, zamanında: 19, geç: 1 }
        ],
        anomalyDistribution: [
          { name: 'Geç Gelme', value: 12 },
          { name: 'Erken Çıkma', value: 5 },
          { name: 'Eksik Kayıt', value: 3 },
          { name: 'Devamsız', value: 3 }
        ]
      };
      setChartData(mockChartData);
      return;
    }
    
    // Günlük trend verisi
    const dailyTrend = data.dailyStats?.map(day => ({
      date: moment(day.date).format('DD.MM'),
      giriş: day.checkIns,
      çıkış: day.checkOuts,
      devamsız: day.absents
    })) || [];
    
    // Lokasyon dağılımı
    const locationDistribution = Object.entries(data.locationStats || {}).map(([location, count]) => ({
      name: location,
      value: count
    }));
    
    // Departman dağılımı
    const departmentDistribution = Object.entries(data.departmentStats || {}).map(([dept, stats]) => ({
      name: dept,
      toplam: stats.total,
      zamanında: stats.onTime,
      geç: stats.late
    }));
    
    // Anomali dağılımı
    const anomalyDistribution = Object.entries(data.anomalies || {}).map(([type, count]) => ({
      name: type,
      value: count
    }));
    
    // If no data, use mock
    if (dailyTrend.length === 0 && locationDistribution.length === 0) {
      const mockChartData = {
        dailyTrend: [
          { date: '06.11', giriş: 140, çıkış: 138, devamsız: 5 },
          { date: '07.11', giriş: 142, çıkış: 140, devamsız: 3 },
          { date: '08.11', giriş: 141, çıkış: 139, devamsız: 4 },
          { date: '09.11', giriş: 143, çıkış: 141, devamsız: 2 },
          { date: '10.11', giriş: 138, çıkış: 136, devamsız: 7 },
          { date: '11.11', giriş: 144, çıkış: 142, devamsız: 1 },
          { date: '12.11', giriş: 142, çıkış: 138, devamsız: 3 }
        ],
        locationDistribution: [
          { name: 'MERKEZ', value: 85 },
          { name: 'İŞL', value: 35 },
          { name: 'OSB', value: 15 },
          { name: 'İŞİL', value: 10 }
        ],
        departmentDistribution: [
          { name: 'Üretim', toplam: 65, zamanında: 58, geç: 7 },
          { name: 'Yönetim', toplam: 25, zamanında: 24, geç: 1 },
          { name: 'Satış', toplam: 20, zamanında: 18, geç: 2 },
          { name: 'IT', toplam: 15, zamanında: 14, geç: 1 },
          { name: 'Muhasebe', toplam: 20, zamanında: 19, geç: 1 }
        ],
        anomalyDistribution: [
          { name: 'Geç Gelme', value: 12 },
          { name: 'Erken Çıkma', value: 5 },
          { name: 'Eksik Kayıt', value: 3 },
          { name: 'Devamsız', value: 3 }
        ]
      };
      setChartData(mockChartData);
    } else {
      setChartData({
        dailyTrend: dailyTrend.length > 0 ? dailyTrend : chartData?.dailyTrend || [],
        locationDistribution: locationDistribution.length > 0 ? locationDistribution : chartData?.locationDistribution || [],
        departmentDistribution: departmentDistribution.length > 0 ? departmentDistribution : chartData?.departmentDistribution || [],
        anomalyDistribution: anomalyDistribution.length > 0 ? anomalyDistribution : chartData?.anomalyDistribution || []
      });
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;
    
    // Profesyonel Excel şablonu oluştur
    const wb = XLSX.utils.book_new();
    
    // Özet Sayfası - Profesyonel tasarım
    const summaryData = [
      ['ÇANGA SAVUNMA SANAYİ A.Ş.'], // Şirket adı
      ['Personel Devam Kontrol Sistemi'], // Alt başlık
      [''], // Boş satır
      ['════════════════════════════════════════════════════════════════'], // Ayırıcı
      [''], // Boş satır
      ['📊 RAPOR BİLGİLERİ'], // Bölüm başlığı
      [''], // Boş satır
      ['Rapor Tipi:', reportType === 'daily' ? '📅 Günlük Rapor' : reportType === 'weekly' ? '📆 Haftalık Rapor' : '🗓️ Aylık Rapor'],
      ['Rapor Tarihi:', selectedDate.format('DD MMMM YYYY, dddd')],
      ['Lokasyon:', selectedLocation === 'ALL' ? '📍 Tüm Lokasyonlar' : selectedLocation],
      ['Departman:', selectedDepartment === 'ALL' ? '🏢 Tüm Departmanlar' : selectedDepartment],
      ['Oluşturulma Tarihi:', moment().format('DD.MM.YYYY HH:mm:ss')],
      ['Oluşturan Sistem:', 'QR İmza Yönetim Sistemi v2.0'],
      [''], // Boş satır
      ['════════════════════════════════════════════════════════════════'], // Ayırıcı
      [''], // Boş satır
      ['📈 GENEL İSTATİSTİKLER'], // Bölüm başlığı
      [''], // Boş satır
      ['Metrik', 'Değer', 'Durum'], // Tablo başlıkları
      ['👥 Toplam Personel', reportData.totalEmployees || 0, ''],
      ['✅ Giriş Yapan', reportData.totalCheckIns || 0, ''],
      ['🚪 Çıkış Yapan', reportData.totalCheckOuts || 0, ''],
      ['❌ Devamsız', reportData.totalAbsents || 0, reportData.totalAbsents > 0 ? '⚠️ Dikkat' : '✓ İyi'],
      ['⏰ Geç Kalan', reportData.totalLate || 0, reportData.totalLate > 5 ? '⚠️ Dikkat' : '✓ İyi'],
      ['🏃 Erken Çıkan', reportData.totalEarly || 0, reportData.totalEarly > 3 ? '⚠️ Dikkat' : '✓ İyi'],
      [''], // Boş satır
      ['════════════════════════════════════════════════════════════════'], // Ayırıcı
      [''], // Boş satır
      ['🎯 PERFORMANS METRİKLERİ'], // Bölüm başlığı
      [''], // Boş satır
      ['Metrik', 'Değer', 'Hedef'], // Tablo başlıkları
      ['📊 Devamlılık Oranı', `${reportData.attendanceRate || 0}%`, '≥ 95%'],
      ['⏱️ Zamanında Gelme Oranı', `${reportData.punctualityRate || 0}%`, '≥ 90%'],
      ['💼 Ortalama Çalışma Süresi', `${reportData.avgWorkHours || 0} saat`, '8 saat'],
      ['➕ Toplam Fazla Mesai', `${reportData.totalOvertime || 0} saat`, '-'],
      ['⏳ Ortalama Geç Kalma', `${reportData.avgLateMinutes || 0} dakika`, '< 5 dk'],
      [''], // Boş satır
      ['════════════════════════════════════════════════════════════════'], // Ayırıcı
      [''], // Boş satır
      ['📝 YORUMLAR VE NOTLAR'], // Bölüm başlığı
      [''], // Boş satır
      ['Bu rapor otomatik olarak sistem tarafından oluşturulmuştur.'],
      ['Detaylı kayıtlar için "Detaylı Kayıtlar" sekmesini inceleyiniz.'],
      [''], // Boş satır
      [''], // Boş satır
      ['İmza/Onay:', '_______________________'],
      ['Tarih:', '_______________________'],
      [''], // Boş satır
      ['════════════════════════════════════════════════════════════════'] // Son ayırıcı
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Gelişmiş stil ayarları
    ws1['!cols'] = [
      { wch: 35 }, // A sütunu - Etiketler
      { wch: 25 }, // B sütunu - Değerler
      { wch: 20 }  // C sütunu - Durum/Hedef
    ];
    
    // Satır yükseklikleri
    ws1['!rows'] = [
      { hpx: 35 },  // Şirket adı - büyük
      { hpx: 25 },  // Alt başlık
      { hpx: 10 },  // Boş satır
      { hpx: 15 },  // Ayırıcı
      { hpx: 10 },  // Boş satır
      { hpx: 25 }   // Bölüm başlığı
    ];
    
    // Hücre birleştirme - Başlıklar için
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Şirket adı (3 sütun birleştir)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // Alt başlık
      { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // Ayırıcı
      { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } }, // Rapor bilgileri başlık
      { s: { r: 14, c: 0 }, e: { r: 14, c: 2 } }, // Ayırıcı
      { s: { r: 16, c: 0 }, e: { r: 16, c: 2 } }, // İstatistikler başlık
      { s: { r: 26, c: 0 }, e: { r: 26, c: 2 } }, // Ayırıcı
      { s: { r: 28, c: 0 }, e: { r: 28, c: 2 } }, // Performans başlık
      { s: { r: 36, c: 0 }, e: { r: 36, c: 2 } }, // Ayırıcı
      { s: { r: 38, c: 0 }, e: { r: 38, c: 2 } }, // Yorumlar başlık
      { s: { r: 40, c: 0 }, e: { r: 40, c: 2 } }, // Yorum 1
      { s: { r: 41, c: 0 }, e: { r: 41, c: 2 } }, // Yorum 2
      { s: { r: 47, c: 0 }, e: { r: 47, c: 2 } }  // Son ayırıcı
    ];
    
    // Şirket adı stili (A1)
    if (ws1['A1']) {
      ws1['A1'].s = {
        font: { bold: true, sz: 18, color: { rgb: "FFFFFF" }, name: 'Calibri' },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: "1F4E78" } }, // Koyu mavi
        border: {
          top: { style: 'thick', color: { rgb: "000000" } },
          bottom: { style: 'thick', color: { rgb: "000000" } },
          left: { style: 'thick', color: { rgb: "000000" } },
          right: { style: 'thick', color: { rgb: "000000" } }
        }
      };
    }
    
    // Alt başlık stili (A2)
    if (ws1['A2']) {
      ws1['A2'].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" }, name: 'Calibri' },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: "4472C4" } }, // Orta mavi
        border: {
          top: { style: 'thin', color: { rgb: "000000" } },
          bottom: { style: 'thick', color: { rgb: "000000" } },
          left: { style: 'thick', color: { rgb: "000000" } },
          right: { style: 'thick', color: { rgb: "000000" } }
        }
      };
    }
    
    // Bölüm başlıkları stili (A6, A17, A29, A39)
    ['A6', 'A17', 'A29', 'A39'].forEach(cell => {
      if (ws1[cell]) {
        ws1[cell].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" }, name: 'Calibri' },
          fill: { fgColor: { rgb: "4472C4" } }, // Mavi
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: "000000" } },
            bottom: { style: 'medium', color: { rgb: "000000" } },
            left: { style: 'medium', color: { rgb: "000000" } },
            right: { style: 'medium', color: { rgb: "000000" } }
          }
        };
      }
    });
    
    // Tablo başlıkları stili (A19:C19, A31:C31)
    ['A19', 'B19', 'C19', 'A31', 'B31', 'C31'].forEach(cell => {
      if (ws1[cell]) {
        ws1[cell].s = {
          font: { bold: true, sz: 11, color: { rgb: "FFFFFF" }, name: 'Calibri' },
          fill: { fgColor: { rgb: "5B9BD5" } }, // Açık mavi
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      }
    });
    
    // Veri hücreleri için zebrali stil (A20:C25, A32:C35)
    for (let row = 20; row <= 25; row++) {
      ['A', 'B', 'C'].forEach(col => {
        const cell = `${col}${row}`;
        if (ws1[cell]) {
          ws1[cell].s = {
            font: { sz: 10, name: 'Calibri' },
            fill: { fgColor: { rgb: row % 2 === 0 ? "F2F2F2" : "FFFFFF" } },
            alignment: { horizontal: col === 'A' ? 'left' : 'center', vertical: 'center' },
            border: {
              top: { style: 'hair', color: { rgb: "D3D3D3" } },
              bottom: { style: 'hair', color: { rgb: "D3D3D3" } },
              left: { style: 'hair', color: { rgb: "D3D3D3" } },
              right: { style: 'hair', color: { rgb: "D3D3D3" } }
            }
          };
        }
      });
    }
    
    for (let row = 32; row <= 35; row++) {
      ['A', 'B', 'C'].forEach(col => {
        const cell = `${col}${row}`;
        if (ws1[cell]) {
          ws1[cell].s = {
            font: { sz: 10, name: 'Calibri' },
            fill: { fgColor: { rgb: row % 2 === 0 ? "E7E6E6" : "FFFFFF" } },
            alignment: { horizontal: col === 'A' ? 'left' : 'center', vertical: 'center' },
            border: {
              top: { style: 'hair', color: { rgb: "D3D3D3" } },
              bottom: { style: 'hair', color: { rgb: "D3D3D3" } },
              left: { style: 'hair', color: { rgb: "D3D3D3" } },
              right: { style: 'hair', color: { rgb: "D3D3D3" } }
            }
          };
        }
      });
    }
    
    XLSX.utils.book_append_sheet(wb, ws1, '📊 Özet Rapor');
    
    // Detaylı Kayıtlar Sayfası
    if (reportData.records && reportData.records.length > 0) {
      const detailHeaders = [
        'Personel Adı',
        'Sicil No',
        'Departman',
        'Pozisyon',
        'Tarih',
        'Giriş Saati',
        'Çıkış Saati',
        'Çalışma Süresi',
        'Lokasyon',
        'Durum',
        'Geç Kalma (dk)',
        'Erken Çıkma (dk)',
        'Fazla Mesai (dk)',
        'Notlar'
      ];
      
      const detailData = reportData.records.map(record => [
        record.employee?.adSoyad || '-',
        record.employee?.sicilNo || '-',
        record.employee?.departman || '-',
        record.employee?.pozisyon || '-',
        moment(record.date).format('DD.MM.YYYY'),
        record.checkIn?.time ? moment(record.checkIn.time).format('HH:mm') : '-',
        record.checkOut?.time ? moment(record.checkOut.time).format('HH:mm') : '-',
        record.workDuration ? `${Math.floor(record.workDuration / 60)}s ${record.workDuration % 60}dk` : '-',
        record.checkIn?.location || '-',
        translateStatus(record.status),
        record.lateMinutes || 0,
        record.earlyLeaveMinutes || 0,
        record.overtimeMinutes || 0,
        record.notes || '-'
      ]);
      
      const ws2Data = [detailHeaders, ...detailData];
      const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
      
      // Sütun genişlikleri
      ws2['!cols'] = [
        { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
        { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 30 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws2, 'Detaylı Kayıtlar');
    }
    
    // İstatistikler Sayfası
    if (chartData) {
      const statsData = [
        ['LOKASYON DAĞILIMI'],
        ['Lokasyon', 'Personel Sayısı'],
        ...chartData.locationDistribution.map(item => [item.name, item.value]),
        [''],
        ['DEPARTMAN PERFORMANSI'],
        ['Departman', 'Toplam', 'Zamanında', 'Geç'],
        ...chartData.departmentDistribution.map(item => [item.name, item.toplam, item.zamanında, item.geç]),
        [''],
        ['ANOMALİ DAĞILIMI'],
        ['Tip', 'Adet'],
        ...chartData.anomalyDistribution.map(item => [item.name, item.value])
      ];
      
      const ws3 = XLSX.utils.aoa_to_sheet(statsData);
      ws3['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      
      XLSX.utils.book_append_sheet(wb, ws3, 'İstatistikler');
    }
    
    // Excel dosyasını indir
    const fileName = `Personel_Devam_Raporu_${reportType}_${selectedDate.format('YYYYMMDD')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportToPDF = () => {
    if (!reportData) return;
    
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape format
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Başlık - Şirket Logosu Yerine (Büyük Başlık)
    pdf.setFillColor(31, 78, 120); // Koyu mavi
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(undefined, 'bold');
    pdf.text('ÇANGA SAVUNMA SANAYİ A.Ş.', pageWidth / 2, 12, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.text('Personel Devam Kontrol Sistemi', pageWidth / 2, 20, { align: 'center' });
    
    // Rapor bilgileri kutusu
    pdf.setFillColor(68, 114, 196);
    pdf.rect(0, 25, pageWidth, 8, 'F');
    
    pdf.setFontSize(11);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont(undefined, 'bold');
    pdf.text(`${reportType === 'daily' ? 'Günlük Rapor' : reportType === 'weekly' ? 'Haftalık Rapor' : 'Aylık Rapor'}`, 20, 30);
    pdf.text(`Tarih: ${selectedDate.format('DD.MM.YYYY')}`, pageWidth / 2, 30, { align: 'center' });
    pdf.text(`Oluşturulma: ${moment().format('DD.MM.YYYY HH:mm')}`, pageWidth - 20, 30, { align: 'right' });
    
    // Özet bilgiler tablosu
    pdf.setFontSize(12);
    pdf.setTextColor(68, 114, 196);
    pdf.setFont(undefined, 'bold');
    pdf.text('ÖZET BİLGİLER', 20, 43);
    
    const summaryData = [
      ['Metrik', 'Değer', 'Durum'],
      ['Toplam Personel', (reportData.totalEmployees || 0).toString(), ''],
      ['Giriş Yapan', (reportData.totalCheckIns || 0).toString(), reportData.totalCheckIns > 0 ? '✓' : ''],
      ['Çıkış Yapan', (reportData.totalCheckOuts || 0).toString(), reportData.totalCheckOuts > 0 ? '✓' : ''],
      ['Devamsız', (reportData.totalAbsents || 0).toString(), reportData.totalAbsents > 0 ? '⚠' : '✓'],
      ['Geç Kalan', (reportData.totalLate || 0).toString(), reportData.totalLate > 5 ? '⚠' : '✓'],
      ['Erken Çıkan', (reportData.totalEarly || 0).toString(), reportData.totalEarly > 3 ? '⚠' : '✓'],
      ['Devamlılık Oranı', `${reportData.attendanceRate || 0}%`, reportData.attendanceRate >= 95 ? '✓' : '⚠'],
      ['Zamanında Gelme Oranı', `${reportData.punctualityRate || 0}%`, reportData.punctualityRate >= 90 ? '✓' : '⚠']
    ];
    
    autoTable(pdf, {
      startY: 48,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      headStyles: { 
        fillColor: [68, 114, 196],
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: { 
        0: { cellWidth: 80, halign: 'left', fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 }
    });
    
    // Performans metrikleri
    const finalY = pdf.lastAutoTable.finalY || 48;
    
    if (finalY < 120) {
      pdf.setFontSize(12);
      pdf.setTextColor(68, 114, 196);
      pdf.setFont(undefined, 'bold');
      pdf.text('PERFORMANS METRİKLERİ', 20, finalY + 15);
      
      const performanceData = [
        ['Metrik', 'Değer', 'Hedef', 'Durum'],
        ['Ortalama Çalışma Süresi', `${reportData.avgWorkHours || 0} saat`, '8 saat', reportData.avgWorkHours >= 8 ? '✓' : '⚠'],
        ['Toplam Fazla Mesai', `${reportData.totalOvertime || 0} saat`, '-', reportData.totalOvertime > 0 ? 'ℹ' : '-'],
        ['Ortalama Geç Kalma', `${reportData.avgLateMinutes || 0} dakika`, '< 5 dakika', reportData.avgLateMinutes < 5 ? '✓' : '⚠']
      ];
      
      autoTable(pdf, {
        startY: finalY + 20,
        head: [performanceData[0]],
        body: performanceData.slice(1),
        theme: 'grid',
        headStyles: { 
          fillColor: [91, 155, 213],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 2.5
        },
        columnStyles: { 
          0: { cellWidth: 70, halign: 'left' },
          1: { cellWidth: 40, halign: 'center' },
          2: { cellWidth: 40, halign: 'center' },
          3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Detaylı kayıtlar - Yeni sayfa
    if (reportData.records && reportData.records.length > 0) {
      pdf.addPage();
      
      // Başlık
      pdf.setFillColor(68, 114, 196);
      pdf.rect(0, 0, pageWidth, 12, 'F');
      
      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      pdf.text('DETAYLI PERSONEL KAYITLARI', pageWidth / 2, 8, { align: 'center' });
      
      const tableData = reportData.records.map(record => [
        record.employee?.adSoyad || '-',
        record.employee?.sicilNo || '-',
        moment(record.date).format('DD.MM.YYYY'),
        record.checkIn?.time ? moment(record.checkIn.time).format('HH:mm') : '-',
        record.checkOut?.time ? moment(record.checkOut.time).format('HH:mm') : '-',
        record.checkIn?.location || '-',
        translateStatus(record.status)
      ]);
      
      autoTable(pdf, {
        startY: 18,
        head: [['Personel Adı', 'Sicil No', 'Tarih', 'Giriş', 'Çıkış', 'Lokasyon', 'Durum']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [68, 114, 196],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 50, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 28, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 25, halign: 'center' },
          6: { cellWidth: 30, halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        margin: { left: 15, right: 15 }
      });
    }
    
    // Footer - Her sayfaya
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.setFont(undefined, 'normal');
      
      const footerText = `Çanga Savunma Sanayi A.Ş. - QR İmza Yönetim Sistemi v2.0 | Sayfa ${i} / ${pageCount}`;
      pdf.text(footerText, pageWidth / 2, pdf.internal.pageSize.getHeight() - 5, { align: 'center' });
    }
    
    // PDF'i indir
    const fileName = `Canga_Personel_Devam_Raporu_${reportType}_${selectedDate.format('YYYYMMDD')}.pdf`;
    pdf.save(fileName);
  };

  const translateStatus = (status) => {
    const statusMap = {
      'NORMAL': 'Normal',
      'LATE': 'Geç Kaldı',
      'EARLY_LEAVE': 'Erken Çıktı',
      'ABSENT': 'Devamsız',
      'HOLIDAY': 'Tatil',
      'LEAVE': 'İzinli',
      'SICK_LEAVE': 'Hastalık İzni',
      'WEEKEND': 'Hafta Sonu',
      'INCOMPLETE': 'Eksik Kayıt'
    };
    return statusMap[status] || status;
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 },
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      {/* Başlık ve Kontroller */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 3 },
          mb: 3,
          borderRadius: 3,
          background: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: 48, 
                height: 48,
                boxShadow: 3
              }}>
                <AssessmentIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Raporlama
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Merkezi
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <Grid container spacing={2} alignItems="center">
              {/* Rapor Tipi */}
              <Grid item xs={12} sm={3}>
                <ButtonGroup 
                  variant="contained" 
                  fullWidth 
                  size="small"
                  sx={{ 
                    boxShadow: 2,
                    '& .MuiButton-root': {
                      borderRadius: 0,
                      '&:first-of-type': {
                        borderTopLeftRadius: 8,
                        borderBottomLeftRadius: 8
                      },
                      '&:last-child': {
                        borderTopRightRadius: 8,
                        borderBottomRightRadius: 8
                      }
                    }
                  }}
                >
                  <Button 
                    onClick={() => setReportType('daily')}
                    color={reportType === 'daily' ? 'primary' : 'inherit'}
                    startIcon={<Today />}
                  >
                    Günlük
                  </Button>
                  <Button 
                    onClick={() => setReportType('weekly')}
                    color={reportType === 'weekly' ? 'primary' : 'inherit'}
                    startIcon={<ViewWeek />}
                  >
                    Haftalık
                  </Button>
                  <Button 
                    onClick={() => setReportType('monthly')}
                    color={reportType === 'monthly' ? 'primary' : 'inherit'}
                    startIcon={<CalendarMonth />}
                  >
                    Aylık
                  </Button>
                </ButtonGroup>
              </Grid>
              
              {/* Tarih Seçici */}
              <Grid item xs={12} sm={3}>
                <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="tr">
                  <DatePicker
                    label="Tarih Seç"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    format="DD.MM.YYYY"
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        size: 'small' 
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              {/* Lokasyon Filtresi */}
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Lokasyon</InputLabel>
                  <Select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    label="Lokasyon"
                  >
                    <MenuItem value="ALL">Tümü</MenuItem>
                    <MenuItem value="MERKEZ">Merkez</MenuItem>
                    <MenuItem value="İŞL">İŞL</MenuItem>
                    <MenuItem value="OSB">OSB</MenuItem>
                    <MenuItem value="İŞIL">İŞIL</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Export Butonları */}
              <Grid item xs={12} sm={4}>
                <Box display="flex" gap={1} justifyContent="flex-end">
                  <Tooltip title="Excel İndir" placement="top">
                    <span>
                      <IconButton 
                        onClick={exportToExcel}
                        disabled={!reportData}
                        sx={{ 
                          bgcolor: reportData ? '#00c853' : 'grey.300',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#00a844',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s',
                          boxShadow: reportData ? 3 : 0
                        }}
                      >
                        <TableChart />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="PDF İndir" placement="top">
                    <span>
                      <IconButton 
                        onClick={exportToPDF}
                        disabled={!reportData}
                        sx={{ 
                          bgcolor: reportData ? '#f44336' : 'grey.300',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#d32f2f',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s',
                          boxShadow: reportData ? 3 : 0
                        }}
                      >
                        <PictureAsPdf />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Yazdır" placement="top">
                    <span>
                      <IconButton 
                        onClick={() => window.print()}
                        disabled={!reportData}
                        sx={{ 
                          bgcolor: reportData ? '#2196f3' : 'grey.300',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#1976d2',
                            transform: 'scale(1.1)'
                          },
                          transition: 'all 0.2s',
                          boxShadow: reportData ? 3 : 0
                        }}
                      >
                        <PrintIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="E-posta Gönder">
                    <span>
                      <IconButton 
                        color="info" 
                        disabled={!reportData}
                        sx={{ bgcolor: 'info.light', color: 'white' }}
                      >
                        <EmailIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Yenile">
                    <IconButton 
                      onClick={loadReportData}
                      sx={{ bgcolor: 'grey.300' }}
                    >
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      {reportData && (
        <>
          {/* Özet Kartları */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 25px 50px rgba(102, 126, 234, 0.35)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography gutterBottom variant="caption" sx={{ opacity: 0.9 }}>
                        Toplam Personel
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {reportData.totalEmployees || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Aktif çalışan
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 64, 
                      height: 64,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <People sx={{ fontSize: 32 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: 'white',
                  boxShadow: '0 20px 40px rgba(56, 239, 125, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 25px 50px rgba(56, 239, 125, 0.35)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography gutterBottom variant="caption" sx={{ opacity: 0.9 }}>
                        Devamlılık Oranı
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {reportData.attendanceRate || 0}%
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {reportData.totalCheckIns || 0} giriş yapıldı
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 64, 
                      height: 64,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <CheckCircle sx={{ fontSize: 32 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  boxShadow: '0 20px 40px rgba(245, 87, 108, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 25px 50px rgba(245, 87, 108, 0.35)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography gutterBottom variant="caption" sx={{ opacity: 0.9 }}>
                        Geç Kalma
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {reportData.totalLate || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {reportData.avgLateMinutes || 0} dk ortalama
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 64, 
                      height: 64,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <Warning sx={{ fontSize: 32 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                elevation={0}
                sx={{
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  boxShadow: '0 20px 40px rgba(0, 242, 254, 0.25)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 25px 50px rgba(0, 242, 254, 0.35)'
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)'
                  }
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography gutterBottom variant="caption" sx={{ opacity: 0.9 }}>
                        Fazla Mesai
                      </Typography>
                      <Typography variant="h3" fontWeight="bold">
                        {reportData.totalOvertime || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        saat toplam
                      </Typography>
                    </Box>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      width: 64, 
                      height: 64,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <Schedule sx={{ fontSize: 32 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Ana İçerik */}
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              overflow: 'hidden'
            }}
          >
            <Tabs 
              value={currentTab} 
              onChange={(e, v) => setCurrentTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 600
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab icon={<BarChart />} label="Grafikler" iconPosition="start" />
              <Tab icon={<TableChart />} label="Detaylı Tablo" iconPosition="start" />
              <Tab icon={<Timeline />} label="Trend Analizi" iconPosition="start" />
              <Tab icon={<PieChart />} label="Dağılımlar" iconPosition="start" />
            </Tabs>

            {/* Grafikler Tab */}
            {currentTab === 0 && chartData && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Günlük Trend */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Günlük Giriş-Çıkış Trendi
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData.dailyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Area type="monotone" dataKey="giriş" stackId="1" stroke="#8884d8" fill="#8884d8" />
                            <Area type="monotone" dataKey="çıkış" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                            <Area type="monotone" dataKey="devamsız" stackId="1" stroke="#ffc658" fill="#ffc658" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Lokasyon Dağılımı */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Lokasyon Dağılımı
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPieChart>
                            <Pie
                              data={chartData.locationDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={entry => `${entry.name}: ${entry.value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {chartData.locationDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Departman Performansı */}
                  <Grid item xs={12}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Departman Performansı
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsBarChart data={chartData.departmentDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="toplam" fill="#8884d8" />
                            <Bar dataKey="zamanında" fill="#82ca9d" />
                            <Bar dataKey="geç" fill="#ffc658" />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Detaylı Tablo Tab */}
            {currentTab === 1 && reportData.records && (
              <Box sx={{ p: 3 }}>
                <TableContainer component={Paper} elevation={2}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'primary.main' }}>
                        <TableCell sx={{ color: 'white' }}>Personel</TableCell>
                        <TableCell sx={{ color: 'white' }}>Sicil No</TableCell>
                        <TableCell sx={{ color: 'white' }}>Departman</TableCell>
                        <TableCell sx={{ color: 'white' }}>Tarih</TableCell>
                        <TableCell sx={{ color: 'white' }}>Giriş</TableCell>
                        <TableCell sx={{ color: 'white' }}>Çıkış</TableCell>
                        <TableCell sx={{ color: 'white' }}>Süre</TableCell>
                        <TableCell sx={{ color: 'white' }}>Lokasyon</TableCell>
                        <TableCell sx={{ color: 'white' }}>Durum</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.records.map((record, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{record.employee?.adSoyad}</TableCell>
                          <TableCell>{record.employee?.sicilNo}</TableCell>
                          <TableCell>{record.employee?.departman}</TableCell>
                          <TableCell>{moment(record.date).format('DD.MM.YYYY')}</TableCell>
                          <TableCell>
                            {record.checkIn?.time ? 
                              moment(record.checkIn.time).format('HH:mm') : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {record.checkOut?.time ? 
                              moment(record.checkOut.time).format('HH:mm') : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {record.workDuration ? 
                              `${Math.floor(record.workDuration / 60)}s ${record.workDuration % 60}dk` : '-'
                            }
                          </TableCell>
                          <TableCell>{record.checkIn?.location || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={translateStatus(record.status)}
                              size="small"
                              color={
                                record.status === 'NORMAL' ? 'success' :
                                record.status === 'LATE' ? 'warning' :
                                record.status === 'ABSENT' ? 'error' : 'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Trend Analizi Tab */}
            {currentTab === 2 && chartData && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <AlertTitle>Trend Analizi</AlertTitle>
                      Seçilen dönem için personel devam trendleri ve tahminler
                    </Alert>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Haftalık Karşılaştırma
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={chartData.dailyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="giriş" stroke="#8884d8" strokeWidth={2} />
                            <Line type="monotone" dataKey="çıkış" stroke="#82ca9d" strokeWidth={2} />
                            <Line type="monotone" dataKey="devamsız" stroke="#ff7300" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Dağılımlar Tab */}
            {currentTab === 3 && chartData && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Anomali Dağılımı */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Anomali Dağılımı
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsPieChart>
                            <Pie
                              data={chartData.anomalyDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.anomalyDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Özet İstatistikler */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Performans Özeti
                        </Typography>
                        <List>
                          <ListItem>
                            <ListItemIcon>
                              <TrendingUp color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="En İyi Devamlılık"
                              secondary={`${reportData.bestAttendanceDept || '-'} Departmanı`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <TrendingDown color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary="En Çok Devamsızlık"
                              secondary={`${reportData.worstAttendanceDept || '-'} Departmanı`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <Schedule color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Ortalama Geç Kalma"
                              secondary={`${reportData.avgLateMinutes || 0} dakika`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <LocationOn color="info" />
                            </ListItemIcon>
                            <ListItemText
                              primary="En Yoğun Lokasyon"
                              secondary={reportData.busiestLocation || '-'}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default ReportingDashboard;

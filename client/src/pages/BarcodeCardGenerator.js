import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  QrCode2,
  Print,
  Download,
  Search,
  SelectAll,
  DeselectOutlined,
  Business,
  Person,
  FilterList,
  Preview,
  ArrowBack,
  CheckCircle,
  Cancel,
  Badge as BadgeIcon,
  CreditCard,
  Groups,
  LocalPrintshop,
  GridView
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import JsBarcode from 'jsbarcode';
import api from '../config/api';
import toast from 'react-hot-toast';

/**
 * 📊 BARKOD KART OLUŞTURUCU - ÇANGA MARKA TASARIMI
 * 
 * Çalışanlar için profesyonel barkod kartları oluşturma ve yazdırma
 * Marka Renkleri: Lacivert (#1a3a6e), Kırmızı (#e63946), Beyaz
 */

// Marka Renkleri
const BRAND_COLORS = {
  navy: '#1a3a6e',      // Ana lacivert
  navyDark: '#0f2847',  // Koyu lacivert
  navyLight: '#2d5a9e', // Açık lacivert
  red: '#e63946',       // Kırmızı aksan
  redDark: '#c62828',   // Koyu kırmızı
  white: '#ffffff',
  gray: '#f8f9fa',
  grayDark: '#6c757d',
  text: '#212529'
};

// Tarih formatlama fonksiyonu
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  } catch {
    return '-';
  }
};

// Logo path
const LOGO_PATH = '/canga-logo.png';

// Türkçe karakterleri ASCII'ye çevirme fonksiyonu
const turkishToAscii = (str) => {
  if (!str) return str;
  const map = {
    'Ç': 'C', 'ç': 'c',
    'Ğ': 'G', 'ğ': 'g',
    'İ': 'I', 'ı': 'i',
    'Ö': 'O', 'ö': 'o',
    'Ş': 'S', 'ş': 's',
    'Ü': 'U', 'ü': 'u'
  };
  return str.replace(/[ÇçĞğİıÖöŞşÜü]/g, char => map[char] || char);
};

// Benzersiz barkod değeri oluşturma fonksiyonu
const generateBarcodeValue = (employee) => {
  if (employee.employeeId && employee.employeeId !== 'XX0000') {
    return turkishToAscii(employee.employeeId);
  }
  
  if (employee.tcNo && employee.tcNo.length >= 6) {
    return 'TC' + employee.tcNo.slice(-6);
  }
  
  if (employee._id) {
    return 'ID' + employee._id.slice(-8).toUpperCase();
  }
  
  return 'ERR' + Math.random().toString(36).slice(-5).toUpperCase();
};

// Profesyonel Barkod Kart Bileşeni
const ProfessionalBarcodeCard = ({ employee, showPreview = false }) => {
  const barcodeRef = useRef(null);
  const barcodeValue = generateBarcodeValue(employee);
  
  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: 'CODE128',
          width: 2,
          height: 45,
          displayValue: true,
          fontSize: 14,
          font: 'monospace',
          fontOptions: 'bold',
          margin: 8,
          background: '#ffffff',
          lineColor: BRAND_COLORS.navyDark
        });
      } catch (e) {
        console.error('Barkod oluşturma hatası:', e);
      }
    }
  }, [barcodeValue]);
  
  return (
    <Box
      sx={{
        width: showPreview ? 380 : '100%',
        height: showPreview ? 220 : 'auto',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        background: BRAND_COLORS.white,
        boxShadow: '0 4px 20px rgba(26, 58, 110, 0.15)',
        border: `2px solid ${BRAND_COLORS.navy}`,
        breakInside: 'avoid',
        pageBreakInside: 'avoid'
      }}
    >
      {/* Üst Kırmızı Şerit */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.redDark} 100%)`
        }}
      />
      
      {/* Header - Logo ve Lokasyon */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          background: BRAND_COLORS.navy,
          borderBottom: `3px solid ${BRAND_COLORS.red}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src={LOGO_PATH}
            alt="Çanga Logo"
            sx={{
              height: 32,
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </Box>
        
        <Box
          sx={{
            px: 2,
            py: 0.5,
            borderRadius: '4px',
            background: BRAND_COLORS.red,
            color: BRAND_COLORS.white
          }}
        >
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}
          >
            {employee.lokasyon || 'MERKEZ'}
          </Typography>
        </Box>
      </Box>
      
      {/* Ana İçerik */}
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Avatar */}
          <Grid item xs={3}>
            <Box
              sx={{
                position: 'relative',
                width: 64,
                height: 64
              }}
            >
              <Avatar
                src={employee.profilePhoto}
                sx={{
                  width: 64,
                  height: 64,
                  fontSize: 26,
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, ${BRAND_COLORS.navyLight} 100%)`,
                  color: BRAND_COLORS.white,
                  border: `3px solid ${BRAND_COLORS.navy}`,
                  boxShadow: '0 2px 8px rgba(26, 58, 110, 0.3)'
                }}
              >
                {employee.adSoyad?.charAt(0)}
              </Avatar>
              {/* Kırmızı aksan noktası */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: BRAND_COLORS.red,
                  border: `2px solid ${BRAND_COLORS.white}`
                }}
              />
            </Box>
          </Grid>
          
          {/* Bilgiler */}
          <Grid item xs={9}>
            <Typography
              sx={{
                color: BRAND_COLORS.navyDark,
                fontSize: '16px',
                fontWeight: 800,
                letterSpacing: '0.3px',
                mb: 0.8,
                lineHeight: 1.2
              }}
            >
              {employee.adSoyad}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography
                sx={{
                  color: BRAND_COLORS.red,
                  fontSize: '11px',
                  fontWeight: 700,
                  lineHeight: 1.2
                }}
              >
                {employee.pozisyon ? employee.pozisyon.replace(/\s*\(ENGELLİ\)\s*/gi, '').replace(/\s*ENGELLİ\s*/gi, '').trim() : '-'}
              </Typography>
              <Typography
                sx={{
                  color: BRAND_COLORS.grayDark,
                  fontSize: '10px',
                  fontWeight: 500
                }}
              >
                İşe Giriş: {formatDate(employee.iseGirisTarihi)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Barkod Alanı */}
      <Box
        sx={{
          mx: 2,
          mb: 1.5,
          p: 1,
          borderRadius: '8px',
          background: BRAND_COLORS.gray,
          border: `1px solid ${BRAND_COLORS.navy}20`,
          textAlign: 'center'
        }}
      >
        <svg ref={barcodeRef} style={{ display: 'block', margin: '0 auto' }}></svg>
      </Box>
      
      {/* Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          pb: 1.5,
          borderTop: `1px solid ${BRAND_COLORS.navy}15`
        }}
      >
        <Typography
          sx={{
            color: BRAND_COLORS.grayDark,
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}
        >
          ÇANGA SAVUNMA ENDÜSTRİ © {new Date().getFullYear()}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e'
            }}
          />
          <Typography
            sx={{
              color: BRAND_COLORS.grayDark,
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            AKTİF
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// Ana Bileşen
const BarcodeCardGenerator = () => {
  const navigate = useNavigate();
  const printRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  
  // Filtreler
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('TÜM');
  const [filterLocation, setFilterLocation] = useState('TÜM');
  
  // Departman ve lokasyon listeleri
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  
  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Veri yükleme
  useEffect(() => {
    loadEmployees();
  }, []);
  
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/employees', {
        params: { durum: 'AKTIF', limit: 1000 }
      });
      
      const empData = response.data?.data || [];
      setEmployees(empData);
      
      const depts = [...new Set(empData.map(e => e.departman).filter(Boolean))].sort();
      const locs = [...new Set(empData.map(e => e.lokasyon).filter(Boolean))].sort();
      
      setDepartments(depts);
      setLocations(locs);
      
    } catch (error) {
      console.error('Çalışanlar yüklenemedi:', error);
      toast.error('Çalışanlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtreleme
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm || 
      emp.adSoyad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.tcNo?.includes(searchTerm);
    
    const matchesDept = filterDepartment === 'TÜM' || emp.departman === filterDepartment;
    const matchesLoc = filterLocation === 'TÜM' || emp.lokasyon === filterLocation;
    
    return matchesSearch && matchesDept && matchesLoc;
  });
  
  // Seçim işlemleri
  const handleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(e => e._id));
    }
  };
  
  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };
  
  // Kart oluştur
  const generateCards = async () => {
    if (selectedIds.length === 0) {
      toast.error('Lütfen en az bir çalışan seçin');
      return;
    }
    
    try {
      setGenerating(true);
      
      const response = await api.post('/api/barcode/bulk-card-info', {
        employeeIds: selectedIds
      });
      
      if (response.data.success) {
        setSelectedCards(response.data.cards);
        setPreviewOpen(true);
        toast.success(`${response.data.count} kart oluşturuldu`);
      }
      
    } catch (error) {
      console.error('Kart oluşturma hatası:', error);
      toast.error('Kartlar oluşturulamadı');
    } finally {
      setGenerating(false);
    }
  };
  
  // Profesyonel yazdır
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Personel Kartları - Çanga Savunma</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background: #f5f5f5;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .card-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8mm;
            padding: 2mm;
          }
          
          /* Profesyonel Kart Stilleri */
          .pro-card {
            width: 100%;
            height: 56mm;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(26, 58, 110, 0.15);
            border: 2px solid #1a3a6e;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Kırmızı Üst Şerit */
          .red-stripe {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #e63946 0%, #c62828 100%);
          }
          
          /* Header */
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: #1a3a6e;
            border-bottom: 2px solid #e63946;
          }
          
          .logo-img {
            height: 24px;
            filter: brightness(0) invert(1);
          }
          
          .location-badge {
            padding: 3px 10px;
            border-radius: 4px;
            background: #e63946;
            color: white;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          
          /* İçerik */
          .card-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
          }
          
          .avatar-container {
            position: relative;
            flex-shrink: 0;
          }
          
          .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a3a6e 0%, #2d5a9e 100%);
            color: white;
            font-size: 20px;
            font-weight: 700;
            border: 2px solid #1a3a6e;
            box-shadow: 0 2px 6px rgba(26, 58, 110, 0.3);
          }
          
          .avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }
          
          .status-dot {
            position: absolute;
            bottom: 1px;
            right: 1px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #e63946;
            border: 2px solid white;
          }
          
          .info {
            flex: 1;
            min-width: 0;
          }
          
          .employee-name {
            color: #0f2847;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 0.3px;
            margin-bottom: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .position-text {
            color: #e63946;
            font-size: 10px;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 2px;
          }
          
          .date-text {
            color: #6c757d;
            font-size: 9px;
            font-weight: 500;
          }
          
          /* Barkod Alanı */
          .barcode-section {
            margin: 0 12px 6px;
            padding: 6px;
            border-radius: 6px;
            background: #f8f9fa;
            border: 1px solid rgba(26, 58, 110, 0.1);
            text-align: center;
          }
          
          .barcode-section svg {
            display: block;
            margin: 0 auto;
            max-width: 100%;
          }
          
          /* Footer */
          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 12px 6px;
            border-top: 1px solid rgba(26, 58, 110, 0.1);
          }
          
          .copyright {
            color: #6c757d;
            font-size: 7px;
            font-weight: 500;
            letter-spacing: 0.5px;
          }
          
          .active-badge {
            display: flex;
            align-items: center;
            gap: 3px;
          }
          
          .active-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #22c55e;
          }
          
          .active-text {
            color: #6c757d;
            font-size: 7px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          
          @media print {
            body {
              background: white;
            }
            .pro-card {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="card-grid">
          ${selectedCards.map(card => {
            const turkishMap = {'Ç':'C','ç':'c','Ğ':'G','ğ':'g','İ':'I','ı':'i','Ö':'O','ö':'o','Ş':'S','ş':'s','Ü':'U','ü':'u'};
            const toAscii = (s) => s ? s.replace(/[ÇçĞğİıÖöŞşÜü]/g, c => turkishMap[c] || c) : s;
            
            let barcodeValue;
            if (card.employeeId && card.employeeId !== 'XX0000') {
              barcodeValue = toAscii(card.employeeId);
            } else if (card.tcNo && card.tcNo.length >= 6) {
              barcodeValue = 'TC' + card.tcNo.slice(-6);
            } else if (card._id) {
              barcodeValue = 'ID' + card._id.slice(-8).toUpperCase();
            } else {
              barcodeValue = 'ERR' + Math.random().toString(36).slice(-5).toUpperCase();
            }
            
            return `
              <div class="pro-card">
                <div class="red-stripe"></div>
                
                <div class="card-header">
                  <img src="/canga-logo.png" alt="Logo" class="logo-img" onerror="this.style.display='none'">
                  <div class="location-badge">${card.lokasyon || 'MERKEZ'}</div>
                </div>
                
                <div class="card-content">
                  <div class="avatar-container">
                    <div class="avatar">
                      ${card.profilePhoto 
                        ? `<img src="${card.profilePhoto}" alt="${card.adSoyad}" onerror="this.parentElement.innerHTML='${card.adSoyad?.charAt(0) || '?'}'">`
                        : (card.adSoyad?.charAt(0) || '?')
                      }
                    </div>
                    <div class="status-dot"></div>
                  </div>
                  <div class="info">
                    <div class="employee-name">${card.adSoyad || '-'}</div>
                    <div class="position-text">${card.pozisyon ? card.pozisyon.replace(/\\s*\\(ENGELLİ\\)\\s*/gi, '').replace(/\\s*ENGELLİ\\s*/gi, '').trim() : '-'}</div>
                    <div class="date-text">İşe Giriş: ${card.iseGirisTarihi ? new Date(card.iseGirisTarihi).toLocaleDateString('tr-TR') : '-'}</div>
                  </div>
                </div>
                
                <div class="barcode-section">
                  <svg id="barcode-${card._id}"></svg>
                </div>
                
                <div class="card-footer">
                  <div class="copyright">ÇANGA SAVUNMA ENDÜSTRİ © ${new Date().getFullYear()}</div>
                  <div class="active-badge">
                    <div class="active-dot"></div>
                    <div class="active-text">AKTİF</div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          ${selectedCards.map(card => {
            const turkishMap2 = {'Ç':'C','ç':'c','Ğ':'G','ğ':'g','İ':'I','ı':'i','Ö':'O','ö':'o','Ş':'S','ş':'s','Ü':'U','ü':'u'};
            const toAscii2 = (s) => s ? s.replace(/[ÇçĞğİıÖöŞşÜü]/g, c => turkishMap2[c] || c) : s;
            
            let barcodeValue;
            if (card.employeeId && card.employeeId !== 'XX0000') {
              barcodeValue = toAscii2(card.employeeId);
            } else if (card.tcNo && card.tcNo.length >= 6) {
              barcodeValue = 'TC' + card.tcNo.slice(-6);
            } else if (card._id) {
              barcodeValue = 'ID' + card._id.slice(-8).toUpperCase();
            } else {
              barcodeValue = 'ERR' + Math.random().toString(36).slice(-5).toUpperCase();
            }
            return `
              try {
                JsBarcode("#barcode-${card._id}", "${barcodeValue}", {
                  format: "CODE128",
                  width: 1.8,
                  height: 32,
                  displayValue: true,
                  fontSize: 11,
                  font: "monospace",
                  fontOptions: "bold",
                  margin: 5,
                  background: "transparent",
                  lineColor: "#0f2847"
                });
              } catch(e) { console.error(e); }
            `;
          }).join('')}
          
          setTimeout(function() {
            window.print();
          }, 800);
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: BRAND_COLORS.navy }} />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: BRAND_COLORS.white,
          border: `2px solid ${BRAND_COLORS.navy}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.redDark} 100%)`
          }
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              onClick={() => navigate('/qr-imza-yonetimi')}
              sx={{ 
                color: BRAND_COLORS.navy, 
                '&:hover': { 
                  bgcolor: `${BRAND_COLORS.navy}10` 
                } 
              }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800, 
                  color: BRAND_COLORS.navyDark,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CreditCard sx={{ color: BRAND_COLORS.red }} />
                Personel Kart Oluşturucu
              </Typography>
              <Typography variant="body2" sx={{ color: BRAND_COLORS.grayDark }}>
                Çalışanlar için profesyonel barkod kartları oluşturun
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" gap={1}>
            <Chip 
              icon={<Groups sx={{ color: `${BRAND_COLORS.navy} !important` }} />}
              label={`${filteredEmployees.length} Çalışan`}
              sx={{ 
                bgcolor: `${BRAND_COLORS.navy}10`, 
                color: BRAND_COLORS.navy,
                border: `1px solid ${BRAND_COLORS.navy}30`,
                fontWeight: 600
              }}
            />
            <Chip 
              icon={<CheckCircle sx={{ color: selectedIds.length > 0 ? `${BRAND_COLORS.red} !important` : 'inherit' }} />}
              label={`${selectedIds.length} Seçili`}
              sx={{ 
                bgcolor: selectedIds.length > 0 ? `${BRAND_COLORS.red}15` : `${BRAND_COLORS.grayDark}10`, 
                color: selectedIds.length > 0 ? BRAND_COLORS.red : BRAND_COLORS.grayDark,
                border: selectedIds.length > 0 ? `1px solid ${BRAND_COLORS.red}40` : `1px solid ${BRAND_COLORS.grayDark}30`,
                fontWeight: 600
              }}
            />
          </Box>
        </Box>
      </Paper>
      
      {/* Filtreler */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="İsim, sicil no veya TC ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: BRAND_COLORS.navy }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': { borderColor: BRAND_COLORS.navy },
                  '&.Mui-focused fieldset': { borderColor: BRAND_COLORS.navy }
                }
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Departman</InputLabel>
              <Select
                value={filterDepartment}
                label="Departman"
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <MenuItem value="TÜM">Tümü</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Lokasyon</InputLabel>
              <Select
                value={filterLocation}
                label="Lokasyon"
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <MenuItem value="TÜM">Tümü</MenuItem>
                {locations.map(loc => (
                  <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={selectedIds.length === filteredEmployees.length ? <DeselectOutlined /> : <SelectAll />}
              onClick={handleSelectAll}
              sx={{
                borderColor: BRAND_COLORS.navy,
                color: BRAND_COLORS.navy,
                '&:hover': {
                  borderColor: BRAND_COLORS.navyDark,
                  bgcolor: `${BRAND_COLORS.navy}10`
                }
              }}
            >
              {selectedIds.length === filteredEmployees.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </Button>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <LocalPrintshop />}
              onClick={generateCards}
              disabled={selectedIds.length === 0 || generating}
              sx={{
                background: `linear-gradient(135deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.redDark} 100%)`,
                color: BRAND_COLORS.white,
                fontWeight: 700,
                '&:hover': {
                  background: `linear-gradient(135deg, ${BRAND_COLORS.redDark} 0%, ${BRAND_COLORS.red} 100%)`
                },
                '&:disabled': {
                  background: BRAND_COLORS.grayDark,
                  color: BRAND_COLORS.white
                }
              }}
            >
              Kart Oluştur ({selectedIds.length})
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Çalışan Listesi */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${BRAND_COLORS.navy}20` }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ bgcolor: BRAND_COLORS.navy }}>
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filteredEmployees.length}
                    checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={handleSelectAll}
                    sx={{ color: BRAND_COLORS.white, '&.Mui-checked': { color: BRAND_COLORS.white } }}
                  />
                </TableCell>
                <TableCell sx={{ bgcolor: BRAND_COLORS.navy, color: BRAND_COLORS.white, fontWeight: 700 }}>Çalışan</TableCell>
                <TableCell sx={{ bgcolor: BRAND_COLORS.navy, color: BRAND_COLORS.white, fontWeight: 700 }}>Sicil No</TableCell>
                <TableCell sx={{ bgcolor: BRAND_COLORS.navy, color: BRAND_COLORS.white, fontWeight: 700 }}>Departman</TableCell>
                <TableCell sx={{ bgcolor: BRAND_COLORS.navy, color: BRAND_COLORS.white, fontWeight: 700 }}>Lokasyon</TableCell>
                <TableCell sx={{ bgcolor: BRAND_COLORS.navy, color: BRAND_COLORS.white, fontWeight: 700 }}>Barkod</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const isSelected = selectedIds.includes(emp._id);
                const barcodeValue = generateBarcodeValue(emp);
                
                return (
                  <TableRow 
                    key={emp._id}
                    hover
                    selected={isSelected}
                    onClick={() => handleSelect(emp._id)}
                    sx={{ 
                      cursor: 'pointer',
                      '&.Mui-selected': {
                        bgcolor: `${BRAND_COLORS.red}08`
                      },
                      '&.Mui-selected:hover': {
                        bgcolor: `${BRAND_COLORS.red}12`
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox 
                        checked={isSelected} 
                        sx={{ '&.Mui-checked': { color: BRAND_COLORS.red } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar 
                          src={emp.profilePhoto} 
                          sx={{ 
                            width: 36, 
                            height: 36,
                            bgcolor: BRAND_COLORS.navy,
                            border: isSelected ? `2px solid ${BRAND_COLORS.red}` : 'none'
                          }}
                        >
                          {emp.adSoyad?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color={BRAND_COLORS.navyDark}>
                            {emp.adSoyad}
                          </Typography>
                          <Typography variant="caption" color={BRAND_COLORS.red}>
                            {emp.pozisyon}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={emp.employeeId || '-'} 
                        size="small" 
                        sx={{ 
                          bgcolor: `${BRAND_COLORS.navy}10`,
                          color: BRAND_COLORS.navy,
                          fontWeight: 600,
                          border: `1px solid ${BRAND_COLORS.navy}30`
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: BRAND_COLORS.grayDark }}>{emp.departman || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={emp.lokasyon || 'MERKEZ'} 
                        size="small" 
                        sx={{
                          bgcolor: `${BRAND_COLORS.red}15`,
                          color: BRAND_COLORS.red,
                          fontWeight: 600,
                          border: `1px solid ${BRAND_COLORS.red}30`
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          bgcolor: BRAND_COLORS.navy,
                          color: BRAND_COLORS.white,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          display: 'inline-block',
                          fontSize: '12px'
                        }}
                      >
                        {barcodeValue}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        
        {filteredEmployees.length === 0 && (
          <Box p={4} textAlign="center">
            <Typography color={BRAND_COLORS.grayDark}>
              Sonuç bulunamadı
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `2px solid ${BRAND_COLORS.navy}`
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: BRAND_COLORS.navy,
            borderBottom: `3px solid ${BRAND_COLORS.red}`
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: BRAND_COLORS.white, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
              <Preview />
              Kart Önizleme ({selectedCards.length} kart)
            </Typography>
            <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: BRAND_COLORS.white }}>
              <Cancel />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent 
          dividers 
          sx={{ 
            bgcolor: BRAND_COLORS.gray,
            p: 3
          }}
        >
          <Box 
            ref={printRef}
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 3
            }}
          >
            {selectedCards.map((card) => (
              <ProfessionalBarcodeCard key={card._id} employee={card} showPreview />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: BRAND_COLORS.white }}>
          <Button 
            onClick={() => setPreviewOpen(false)}
            sx={{ color: BRAND_COLORS.grayDark }}
          >
            Kapat
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{
              background: `linear-gradient(135deg, ${BRAND_COLORS.red} 0%, ${BRAND_COLORS.redDark} 100%)`,
              color: BRAND_COLORS.white,
              fontWeight: 700,
              px: 3,
              '&:hover': {
                background: `linear-gradient(135deg, ${BRAND_COLORS.redDark} 0%, ${BRAND_COLORS.red} 100%)`
              }
            }}
          >
            Yazdır
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BarcodeCardGenerator;

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import Barcode from 'react-barcode';
import api from '../utils/api';

// Profesyonel E-Kart Sayfası - Telefon ekranından okutulabilir
const ECard = () => {
  const { employeeId, token } = useParams();
  const [ecard, setEcard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const cardRef = useRef(null);

  useEffect(() => {
    loadECard();
  }, [employeeId, token]);

  const loadECard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/e-card/${employeeId}/${token}`);
      if (response.data.success) {
        setEcard(response.data.ecard);
      } else {
        setError(response.data.error || 'E-kart yüklenemedi');
      }
    } catch (err) {
      console.error('E-Card load error:', err);
      if (err.response?.status === 403) {
        setError('Bu e-kart bağlantısı geçersiz veya süresi dolmuş');
      } else if (err.response?.status === 404) {
        setError('E-kart bulunamadı');
      } else {
        setError('E-kart yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      cardRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Pozisyon metninden (ENGELLİ) kısmını kaldır
  const cleanPosition = (position) => {
    if (!position) return '-';
    return position.replace(/\s*\(ENGELLİ\)\s*/gi, '').trim();
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#00d4ff' }} />
          <Typography sx={{ color: '#fff', mt: 2, fontFamily: 'monospace' }}>
            E-Kart Yükleniyor...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #1a0a0a 100%)',
          p: 3
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: 400,
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            border: '1px solid #d32f2f',
            '& .MuiAlert-icon': { color: '#ff6b6b' }
          }}
        >
          <Typography variant="h6" sx={{ color: '#ff6b6b', mb: 1 }}>
            E-Kart Hatası
          </Typography>
          <Typography sx={{ color: '#ffb4b4' }}>
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  const theme = darkMode ? {
    bg: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)',
    cardBg: 'linear-gradient(145deg, #1e1e3f 0%, #2a2a5a 50%, #1e1e3f 100%)',
    cardBorder: 'rgba(0, 212, 255, 0.3)',
    text: '#ffffff',
    textSecondary: '#a0a0c0',
    accent: '#00d4ff',
    accentGlow: 'rgba(0, 212, 255, 0.4)',
    barcodeBg: '#ffffff',
    barcodeText: '#000000'
  } : {
    bg: 'linear-gradient(135deg, #f0f4f8 0%, #e8f0f8 50%, #f0f4f8 100%)',
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)',
    cardBorder: 'rgba(25, 118, 210, 0.3)',
    text: '#1a1a2e',
    textSecondary: '#5a5a7a',
    accent: '#1976d2',
    accentGlow: 'rgba(25, 118, 210, 0.3)',
    barcodeBg: '#ffffff',
    barcodeText: '#000000'
  };

  return (
    <Box
      ref={cardRef}
      sx={{
        minHeight: '100vh',
        background: theme.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Effects */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle at 30% 30%, ${theme.accentGlow} 0%, transparent 50%)`,
            animation: 'pulse 8s ease-in-out infinite'
          },
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
            '50%': { transform: 'scale(1.1)', opacity: 0.8 }
          }
        }}
      />

      {/* Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 1,
          zIndex: 10
        }}
      >
        <Tooltip title={darkMode ? 'Açık Mod' : 'Koyu Mod'}>
          <IconButton
            onClick={() => setDarkMode(!darkMode)}
            sx={{
              color: theme.text,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
            }}
          >
            {darkMode ? <LightIcon /> : <DarkIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Tam Ekran">
          <IconButton
            onClick={toggleFullscreen}
            sx={{
              color: theme.text,
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <FullscreenIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* E-Card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 380,
          background: theme.cardBg,
          borderRadius: '24px',
          border: `2px solid ${theme.cardBorder}`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${theme.accentGlow}`,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeIn 0.6s ease-out',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'translateY(20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        {/* Header with Logo */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.accent} 0%, ${darkMode ? '#0099cc' : '#1565c0'} 100%)`,
            p: 2.5,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '150px',
              height: '150px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)'
            }
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Orbitron", "Roboto Mono", monospace',
              fontSize: '2rem',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '0.3em',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              position: 'relative',
              zIndex: 1
            }}
          >
            CANGA
          </Typography>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.2em',
              mt: 0.5,
              position: 'relative',
              zIndex: 1
            }}
          >
            DİJİTAL PERSONEL KARTI
          </Typography>
        </Box>

        {/* Location Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 85,
            right: 16,
            background: darkMode 
              ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
              : 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
            color: '#fff',
            px: 1.5,
            py: 0.5,
            borderRadius: '12px',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            boxShadow: '0 4px 15px rgba(255,107,53,0.4)',
            zIndex: 2
          }}
        >
          {ecard?.lokasyon || 'MERKEZ'}
        </Box>

        {/* Profile Section */}
        <Box sx={{ p: 3, textAlign: 'center', pt: 4 }}>
          {/* Avatar */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <Avatar
              src={ecard?.profilePhoto || ''}
              sx={{
                width: 120,
                height: 120,
                fontSize: '2.5rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.accent} 0%, ${darkMode ? '#0099cc' : '#1565c0'} 100%)`,
                border: `4px solid ${theme.cardBorder}`,
                boxShadow: `0 8px 30px ${theme.accentGlow}`,
                color: '#fff'
              }}
            >
              {getInitials(ecard?.adSoyad)}
            </Avatar>
          </Box>

          {/* Name */}
          <Typography
            sx={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: theme.text,
              mb: 0.5,
              letterSpacing: '0.02em'
            }}
          >
            {ecard?.adSoyad}
          </Typography>

          {/* Position */}
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: theme.accent,
              fontWeight: 600,
              mb: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            {cleanPosition(ecard?.pozisyon)}
          </Typography>

          {/* Department */}
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: theme.textSecondary,
              mb: 2
            }}
          >
            {ecard?.departman}
          </Typography>

          {/* Info Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.5,
              mb: 3,
              px: 1
            }}
          >
            <Box
              sx={{
                background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: '12px',
                p: 1.5
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', color: theme.textSecondary, mb: 0.3 }}>
                SİCİL NO
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: theme.text, fontWeight: 600 }}>
                {ecard?.employeeId || '-'}
              </Typography>
            </Box>
            <Box
              sx={{
                background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: '12px',
                p: 1.5
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', color: theme.textSecondary, mb: 0.3 }}>
                İŞE GİRİŞ
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: theme.text, fontWeight: 600 }}>
                {formatDate(ecard?.iseGirisTarihi)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Barcode Section - Large for scanning */}
        <Box
          sx={{
            background: theme.barcodeBg,
            p: 3,
            textAlign: 'center',
            borderTop: `1px solid ${theme.cardBorder}`
          }}
        >
          <Typography
            sx={{
              fontSize: '0.65rem',
              color: '#666',
              letterSpacing: '0.15em',
              mb: 1.5,
              textTransform: 'uppercase'
            }}
          >
            OKUTMAK İÇİN EKRANI TARAYICIYA TUTUN
          </Typography>
          
          <Box sx={{ transform: 'scale(1.1)', transformOrigin: 'center' }}>
            <Barcode
              value={ecard?.barcode?.simple || 'ERROR'}
              format="CODE128"
              width={2.5}
              height={80}
              displayValue={true}
              fontSize={16}
              fontOptions="bold"
              textMargin={8}
              background={theme.barcodeBg}
              lineColor={theme.barcodeText}
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            background: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
            p: 1.5,
            textAlign: 'center'
          }}
        >
          <Typography
            sx={{
              fontSize: '0.6rem',
              color: theme.textSecondary,
              letterSpacing: '0.1em'
            }}
          >
            © 2025 CANGA MAKİNA • DİJİTAL E-KART
          </Typography>
        </Box>
      </Box>

      {/* Scan Instructions */}
      <Box
        sx={{
          mt: 3,
          textAlign: 'center',
          animation: 'pulse2 2s ease-in-out infinite',
          '@keyframes pulse2': {
            '0%, 100%': { opacity: 0.6 },
            '50%': { opacity: 1 }
          }
        }}
      >
        <Typography
          sx={{
            color: theme.textSecondary,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          📱 Parlaklığı artırın • Barkod okuyucuya tutun
        </Typography>
      </Box>
    </Box>
  );
};

export default ECard;

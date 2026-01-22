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
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';
import Barcode from 'react-barcode';
import api from '../config/api';

// 🎨 CANGA Marka Renkleri
const BRAND = {
  navy: '#1a3a6e',
  navyDark: '#0f2847',
  navyLight: '#2d5a9e',
  red: '#e63946',
  redDark: '#c62828',
  white: '#ffffff',
  gray: '#f8f9fa',
  grayDark: '#6c757d'
};

// Profesyonel E-Kart Sayfası - CANGA Marka Tasarımı
const ECard = () => {
  const { employeeId, token } = useParams();
  const [ecard, setEcard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    loadECard();
    
    // Fullscreen change listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
          background: `linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 50%, ${BRAND.navyDark} 100%)`
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: BRAND.red }} />
          <Typography sx={{ color: BRAND.white, mt: 2, fontWeight: 500 }}>
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
          background: `linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 100%)`,
          p: 3
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: 400,
            backgroundColor: 'rgba(230, 57, 70, 0.15)',
            border: `2px solid ${BRAND.red}`,
            borderRadius: 3,
            '& .MuiAlert-icon': { color: BRAND.red }
          }}
        >
          <Typography variant="h6" sx={{ color: BRAND.red, mb: 1, fontWeight: 700 }}>
            E-Kart Hatası
          </Typography>
          <Typography sx={{ color: BRAND.white }}>
            {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      ref={cardRef}
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${BRAND.navyDark} 0%, ${BRAND.navy} 50%, ${BRAND.navyDark} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BRAND.red}20 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BRAND.navyLight}30 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />

      {/* Fullscreen Control */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10
        }}
      >
        <Tooltip title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}>
          <IconButton
            onClick={toggleFullscreen}
            sx={{
              color: BRAND.white,
              backgroundColor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }
            }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* E-Card - CANGA Branded Design */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 380,
          background: BRAND.white,
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          animation: 'slideUp 0.5s ease-out',
          '@keyframes slideUp': {
            '0%': { opacity: 0, transform: 'translateY(30px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          }
        }}
      >
        {/* Top Red Stripe */}
        <Box
          sx={{
            height: 6,
            background: `linear-gradient(90deg, ${BRAND.red} 0%, ${BRAND.redDark} 100%)`
          }}
        />

        {/* Header with Logo */}
        <Box
          sx={{
            background: BRAND.navy,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `3px solid ${BRAND.red}`
          }}
        >
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/canga-logo.png"
              alt="CANGA"
              sx={{
                height: 36,
                filter: 'brightness(0) invert(1)',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <Typography
              sx={{
                fontFamily: '"Segoe UI", "Roboto", sans-serif',
                fontSize: '1.5rem',
                fontWeight: 900,
                color: BRAND.white,
                letterSpacing: '0.15em',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              CANGA
            </Typography>
          </Box>

          {/* Location Badge */}
          <Box
            sx={{
              background: BRAND.red,
              color: BRAND.white,
              px: 1.5,
              py: 0.5,
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(230, 57, 70, 0.4)'
            }}
          >
            {ecard?.lokasyon || 'MERKEZ'}
          </Box>
        </Box>

        {/* Profile Section */}
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: BRAND.gray }}>
          {/* Avatar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar
              src={ecard?.profilePhoto || ''}
              sx={{
                width: 110,
                height: 110,
                fontSize: '2.2rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`,
                border: `4px solid ${BRAND.white}`,
                boxShadow: `0 8px 25px rgba(26, 58, 110, 0.4), 0 0 0 3px ${BRAND.navy}`,
                color: BRAND.white
              }}
            >
              {getInitials(ecard?.adSoyad)}
            </Avatar>
          </Box>

          {/* Name */}
          <Typography
            sx={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: BRAND.navyDark,
              mb: 0.5,
              letterSpacing: '0.02em'
            }}
          >
            {ecard?.adSoyad}
          </Typography>

          {/* Position */}
          <Typography
            sx={{
              fontSize: '0.85rem',
              color: BRAND.red,
              fontWeight: 700,
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            {cleanPosition(ecard?.pozisyon)}
          </Typography>

          {/* Department */}
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: BRAND.grayDark,
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
              mb: 2
            }}
          >
            <Box
              sx={{
                background: BRAND.white,
                borderRadius: '10px',
                p: 1.5,
                border: `1px solid ${BRAND.navy}20`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <Typography sx={{ fontSize: '0.6rem', color: BRAND.grayDark, mb: 0.3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Sicil No
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: BRAND.navy, fontWeight: 700 }}>
                {ecard?.employeeId || '-'}
              </Typography>
            </Box>
            <Box
              sx={{
                background: BRAND.white,
                borderRadius: '10px',
                p: 1.5,
                border: `1px solid ${BRAND.navy}20`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <Typography sx={{ fontSize: '0.6rem', color: BRAND.grayDark, mb: 0.3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                İşe Giriş
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: BRAND.navy, fontWeight: 700 }}>
                {formatDate(ecard?.iseGirisTarihi)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Barcode Section */}
        <Box
          sx={{
            background: BRAND.white,
            p: 2.5,
            textAlign: 'center',
            borderTop: `2px solid ${BRAND.navy}15`
          }}
        >
          <Typography
            sx={{
              fontSize: '0.6rem',
              color: BRAND.grayDark,
              letterSpacing: '0.12em',
              mb: 1.5,
              textTransform: 'uppercase',
              fontWeight: 500
            }}
          >
            📱 Ekranı Barkod Okuyucuya Tutun
          </Typography>
          
          <Box sx={{ transform: 'scale(1.05)', transformOrigin: 'center' }}>
            <Barcode
              value={ecard?.barcode?.simple || 'ERROR'}
              format="CODE128"
              width={2.2}
              height={70}
              displayValue={true}
              fontSize={15}
              fontOptions="bold"
              textMargin={6}
              background={BRAND.white}
              lineColor={BRAND.navyDark}
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            background: BRAND.navy,
            p: 1.5,
            textAlign: 'center',
            borderTop: `3px solid ${BRAND.red}`
          }}
        >
          <Typography
            sx={{
              fontSize: '0.55rem',
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            © 2025 CANGA MAKİNA SAN. TİC. A.Ş. • DİJİTAL E-KART
          </Typography>
        </Box>
      </Box>

      {/* Scan Instructions */}
      <Box
        sx={{
          mt: 3,
          textAlign: 'center',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 0.5 },
            '50%': { opacity: 1 }
          }
        }}
      >
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            fontWeight: 500
          }}
        >
          💡 Parlaklığı artırın • Barkod okuyucuya yaklaştırın
        </Typography>
      </Box>
    </Box>
  );
};

export default ECard;

import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import CangaLogo from '../../assets/7ff0dçanga_logo-removebg-preview.png';

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { login } = useAuth();
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Enter tuşu ile giriş
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  // Giriş işlemi
  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Lütfen şifrenizi girin');
      return;
    }

    try {
      const result = await login(password);
      
      if (!result.success) {
        setError(result.message || 'Giriş başarısız');
        // Şifre alanını temizle
        setPassword('');
      }
    } catch (error) {
      setError('Beklenmeyen bir hata oluştu');
      console.error('Login error:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative'
      }}
    >
      {/* Minimal background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          background: `
            radial-gradient(circle at 20% 20%, #1e3a8a 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, #dc2626 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Ana kontainer */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          zIndex: 1
        }}
      >
        {/* Logo - Minimal Design */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3
          }}
        >
          <Box
            sx={{
              background: '#ffffff',
              borderRadius: 3,
              p: 3,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}
          >
            <img 
              src={CangaLogo} 
              alt="Çanga Savunma Endüstrisi" 
              style={{ 
                height: isMobile ? 80 : 110, 
                width: 'auto',
                display: 'block'
              }}
            />
          </Box>
        </Box>

        {/* Giriş kartı - Minimal Corporate Design */}
        <Fade in={true} timeout={800}>
          <Paper
            elevation={0}
            sx={{
              background: '#ffffff',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Container sx={{ p: isMobile ? 4 : 5 }}>
              {/* Başlık - Clean Style */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    mb: 2.5,
                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)'
                  }}
                >
                  <SecurityIcon 
                    sx={{ 
                      fontSize: 32, 
                      color: '#ffffff'
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h5" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 700,
                    color: '#1e293b',
                    fontSize: isMobile ? '1.5rem' : '1.75rem',
                    mb: 1
                  }}
                >
                  Çanga Vardiya Sistemi
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: '#64748b',
                    fontSize: '0.95rem',
                    mb: 0.5
                  }}
                >
                  Savunma Endüstrisi
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: '#94a3b8',
                    fontSize: '0.875rem'
                  }}
                >
                  Sisteme erişim için şifrenizi girin
                </Typography>
              </Box>

              {/* Hata mesajı */}
              {error && (
                <Fade in={!!error}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      border: '1px solid rgba(220, 38, 38, 0.2)'
                    }}
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              {/* Şifre alanı - Minimal Style */}
              <TextField
                id="password-input"
                name="password"
                label="Şifre"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                error={!!error}
                placeholder="Şifrenizi girin"
                autoComplete="current-password"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#f8fafc',
                    height: '54px',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      borderColor: 'rgba(226, 232, 240, 1)',
                      borderWidth: '1px'
                    },
                    '&:hover': {
                      backgroundColor: '#ffffff',
                      '& fieldset': {
                        borderColor: 'rgba(30, 58, 138, 0.3)'
                      }
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff',
                      '& fieldset': {
                        borderColor: '#1e3a8a',
                        borderWidth: '2px'
                      }
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: '#64748b',
                    fontSize: '1rem',
                    '&.Mui-focused': {
                      color: '#1e3a8a'
                    }
                  }
                }}
              />

              {/* Giriş butonu - Minimal Corporate Style */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={!password.trim()}
                sx={{
                  borderRadius: 2,
                  py: 1.75,
                  fontSize: '1rem',
                  fontWeight: 600,
                  height: '52px',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
                  border: 'none',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                    boxShadow: '0 6px 20px rgba(30, 58, 138, 0.35)',
                    transform: 'translateY(-2px)'
                  },
                  '&:active': {
                    transform: 'translateY(0px)'
                  },
                  '&:disabled': {
                    background: '#cbd5e1',
                    boxShadow: 'none',
                    color: '#94a3b8'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Sisteme Giriş Yap
              </Button>

              {/* Alt bilgi - Minimal Style */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: '1px',
                    background: 'rgba(226, 232, 240, 0.8)',
                    mb: 2.5
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#64748b',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  © 2025 Çanga Savunma Endüstrisi
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#94a3b8',
                    fontSize: '0.8rem',
                    display: 'block',
                    mb: 0.5
                  }}
                >
                  Vardiya Yönetim Sistemi v1.0
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    display: 'block'
                  }}
                >
                  Coded By KEKILLIOGLU
                </Typography>
                {/* Güvenlik rozetleri */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 2.5, 
                    mt: 2.5
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: '#94a3b8',
                      fontSize: '0.75rem'
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 14 }} />
                    SSL Korumalı
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: '#94a3b8',
                      fontSize: '0.75rem'
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 14 }} />
                    256-bit Şifreleme
                  </Box>
                </Box>
              </Box>
            </Container>
          </Paper>
        </Fade>
      </Box>

    </Box>
  );
}

export default Login; 
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Circles */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30, 58, 138, 0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 10s ease-in-out infinite reverse'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'pulse 6s ease-in-out infinite',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* Grid Pattern Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.5
        }}
      />

      {/* Ana kontainer */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 480,
          zIndex: 1
        }}
      >
        {/* Logo - Premium Design with Animation */}
        <Fade in={true} timeout={1200}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4
            }}
          >
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                p: 4,
                boxShadow: `
                  0 20px 60px rgba(0, 0, 0, 0.3),
                  0 0 40px rgba(30, 58, 138, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6)
                `,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                position: 'relative',
                transition: 'all 0.4s ease',
                animation: 'slideDown 1s ease-out',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `
                    0 30px 80px rgba(0, 0, 0, 0.4),
                    0 0 60px rgba(30, 58, 138, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6)
                  `
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: 'linear-gradient(135deg, #1e3a8a, #2563eb, #dc2626)',
                  borderRadius: 4,
                  zIndex: -1,
                  opacity: 0,
                  transition: 'opacity 0.4s ease'
                },
                '&:hover::before': {
                  opacity: 0.6
                }
              }}
            >
              <img 
                src={CangaLogo} 
                alt="Çanga Savunma Endüstrisi" 
                style={{ 
                  height: isMobile ? 90 : 130, 
                  width: 'auto',
                  display: 'block',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
                }}
              />
            </Box>
          </Box>
        </Fade>

        {/* Giriş kartı - Premium Glassmorphism Design */}
        <Fade in={true} timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(30px) saturate(180%)',
              borderRadius: 4,
              boxShadow: `
                0 25px 80px rgba(0, 0, 0, 0.4),
                0 0 40px rgba(30, 58, 138, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                inset 0 -1px 0 rgba(0, 0, 0, 0.1)
              `,
              border: '1px solid rgba(255, 255, 255, 0.18)',
              overflow: 'hidden',
              position: 'relative',
              animation: 'slideUp 1s ease-out',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'shine 3s ease-in-out infinite'
              }
            }}
          >
            <Container sx={{ p: isMobile ? 4 : 5 }}>
              {/* Başlık - Premium Animated Style */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
                    mb: 3,
                    boxShadow: `
                      0 10px 40px rgba(30, 58, 138, 0.4),
                      0 0 20px rgba(37, 99, 235, 0.3),
                      inset 0 2px 0 rgba(255, 255, 255, 0.3)
                    `,
                    position: 'relative',
                    animation: 'iconPulse 2s ease-in-out infinite',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: -4,
                      left: -4,
                      right: -4,
                      bottom: -4,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                      opacity: 0.3,
                      filter: 'blur(10px)',
                      zIndex: -1,
                      animation: 'glow 2s ease-in-out infinite'
                    }
                  }}
                >
                  <SecurityIcon 
                    sx={{ 
                      fontSize: 40, 
                      color: '#ffffff',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }} 
                  />
                </Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: isMobile ? '1.75rem' : '2rem',
                    mb: 1.5,
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Çanga Vardiya Sistemi
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '1rem',
                    mb: 0.5,
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  Savunma Endüstrisi
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.9rem',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  🔒 Güvenli Giriş Portalı
                </Typography>
              </Box>

              {/* Hata mesajı */}
              {error && (
                <Fade in={!!error}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2.5,
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      background: 'rgba(220, 38, 38, 0.15)',
                      backdropFilter: 'blur(10px)',
                      color: '#ffffff',
                      fontWeight: 500,
                      '& .MuiAlert-icon': {
                        color: '#fca5a5'
                      }
                    }}
                    onClose={() => setError('')}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              {/* Şifre alanı - Premium Glassmorphism Style */}
              <TextField
                id="password-input"
                name="password"
                label="🔑 Şifre"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                error={!!error}
                placeholder="Şifrenizi girin..."
                autoComplete="current-password"
                sx={{
                  mb: 3.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    height: '60px',
                    fontSize: '1.05rem',
                    color: '#ffffff',
                    transition: 'all 0.3s ease',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                      borderWidth: '1.5px'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.4)'
                      }
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'translateY(-2px)',
                      boxShadow: `
                        0 8px 32px rgba(30, 58, 138, 0.3),
                        0 0 20px rgba(37, 99, 235, 0.2)
                      `,
                      '& fieldset': {
                        borderColor: '#3b82f6',
                        borderWidth: '2px'
                      }
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: '#ffffff'
                    }
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#ffffff',
                    '&::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)'
                    }
                  }
                }}
              />

              {/* Giriş butonu - Premium Animated Style */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={!password.trim()}
                sx={{
                  borderRadius: 2.5,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  height: '60px',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
                  boxShadow: `
                    0 10px 40px rgba(30, 58, 138, 0.4),
                    0 0 20px rgba(37, 99, 235, 0.3),
                    inset 0 2px 0 rgba(255, 255, 255, 0.3)
                  `,
                  border: 'none',
                  textTransform: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  letterSpacing: '0.5px',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transition: 'left 0.6s ease'
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                    boxShadow: `
                      0 15px 50px rgba(30, 58, 138, 0.5),
                      0 0 30px rgba(37, 99, 235, 0.4),
                      inset 0 2px 0 rgba(255, 255, 255, 0.3)
                    `,
                    transform: 'translateY(-4px) scale(1.02)',
                    '&::before': {
                      left: '100%'
                    }
                  },
                  '&:active': {
                    transform: 'translateY(-2px) scale(0.98)'
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: 'none',
                    color: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(10px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                ⚡ Sisteme Giriş Yap
              </Button>

              {/* Alt bilgi - Premium Style */}
              <Box sx={{ mt: 5, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: '100%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                    mb: 3
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    mb: 1,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  © 2025 Çanga Savunma Endüstrisi
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.85rem',
                    display: 'block',
                    mb: 0.5,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  Vardiya Yönetim Sistemi v1.0
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.75rem',
                    display: 'block',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  💻 Coded By KEKILLIOGLU
                </Typography>
                {/* Güvenlik rozetleri */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: 3, 
                    mt: 3
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 16 }} />
                    SSL Korumalı
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 16 }} />
                    256-bit Şifreleme
                  </Box>
                </Box>
              </Box>
            </Container>
          </Paper>
        </Fade>
      </Box>

      {/* Premium CSS Animations */}
      <style jsx="true">{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.3;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shine {
          0% {
            left: -100%;
          }
          50%, 100% {
            left: 100%;
          }
        }

        @keyframes iconPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes glow {
          0%, 100% {
            opacity: 0.3;
            filter: blur(10px);
          }
          50% {
            opacity: 0.5;
            filter: blur(15px);
          }
        }
      `}</style>
    </Box>
  );
}

export default Login; 
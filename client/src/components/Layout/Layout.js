import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
// Çanga logosunu import ediyoruz
// import CangaLogo from '../../assets/7ff0dçanga_logo-removebg-preview.png';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  DirectionsBus as DirectionsBusIcon,
  EventNote as EventNoteIcon,
  CalendarMonth as CalendarIcon,
  ExitToApp as ExitToAppIcon,
  School as SchoolIcon,
  EventAvailable as EventAvailableIcon,
  PersonAdd as PersonAddIcon,
  Build as BuildIcon,
  FlightTakeoff as FlightIcon,
  QrCode2 as QrCodeIcon
} from '@mui/icons-material';

const drawerWidth = 280;

// Modern organizasyonlu menü grupları
const getMenuGroups = (user) => {
  const allGroups = [
    {
      title: 'Dashboard',
      items: [
        {
          text: 'Ana Sayfa',
          icon: <DashboardIcon />,
          path: '/dashboard',
          color: '#667eea'
        }
      ]
    },
    {
      title: 'İnsan Kaynakları',
      items: [
        {
          text: 'Çalışanlar',
          icon: <PeopleIcon />,
          path: '/employees',
          color: '#4facfe'
        },
        {
          text: 'İşten Ayrılanlar',
          icon: <ExitToAppIcon />,
          path: '/former-employees',
          color: '#f093fb'
        },
        {
          text: 'Stajyer & Çıraklar',
          icon: <SchoolIcon />,
          path: '/trainees-apprentices',
          color: '#43e97b'
        },
        {
          text: 'Yıllık İzin',
          icon: <EventAvailableIcon />,
          path: '/annual-leave',
          color: '#fa709a'
        }
      ]
    },
    {
      title: 'İK Yönetimi',
      items: [
        {
          text: 'Başvurular',
          icon: <PersonAddIcon />,
          path: '/hr/job-applications',
          color: '#764ba2',
          requiresHRAccess: true
        },
        {
          text: 'Form Editörü',
          icon: <BuildIcon />,
          path: '/hr/job-application-editor',
          color: '#f093fb',
          requiresHRAccess: true
        }
      ]
    },
    {
      title: 'Operasyonlar',
      items: [
        {
          text: 'Vardiyalar',
          icon: <ScheduleIcon />,
          path: '/shifts',
          color: '#667eea'
        },
        {
          text: 'Yolcu Listesi',
          icon: <FlightIcon />,
          path: '/passenger-list',
          color: '#4facfe'
        },
        {
          text: 'Servis Rotaları',
          icon: <DirectionsBusIcon />,
          path: '/services',
          color: '#38f9d7'
        }
      ]
    },
    {
      title: 'Giriş-Çıkış',
      items: [
        {
          text: 'QR/İmza Yönetimi',
          icon: <QrCodeIcon />,
          path: '/qr-imza-yonetimi',
          color: '#FF6B6B',
          badge: 'YENİ'
        }
      ]
    },
    {
      title: 'Planlama',
      items: [
        {
          text: 'Hızlı Liste',
          icon: <EventNoteIcon />,
          path: '/quick-list',
          color: '#fa709a'
        },
        {
          text: 'Hızlı Güzergah',
          icon: <DirectionsBusIcon />,
          path: '/quick-route',
          color: '#667eea'
        },
        {
          text: 'Takvim',
          icon: <CalendarIcon />,
          path: '/calendar',
          color: '#fee140'
        }
      ]
    }
  ];

  // Grup filtreleme ve yetkilendirme
  return allGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.requiresAdminAccess) {
        return user?.employeeId === 'ADMIN-001';
      }
      if (item.requiresHRAccess) {
        return user?.employeeId === 'ADMIN-001' || user?.employeeId?.startsWith('HR-') || user?.department === 'İnsan Kaynakları';
      }
      return true;
    })
  })).filter(group => group.items.length > 0);
};

function Layout({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Drawer toggle - mobil cihazlar için
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Profil menüsü
  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  // Logout işlemi
  const handleLogout = () => {
    logout();
    handleProfileClose();
  };

  // Bildirim sayısını yükle
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/notifications/unread-count?userId=admin`);
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Bildirim sayısı alınamadı:', error);
    }
  };

  // Component mount olduğunda ve her 30 saniyede bir bildirim sayısını kontrol et
  React.useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // 30 saniye
    return () => clearInterval(interval);
  }, []);

  // Navigasyon
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Aktif sayfa kontrolü
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Modern sidebar içeriği
  const drawerContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#ffffff'
    }}>
      {/* Logo Bölümü */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        borderBottom: '1px solid rgba(0,0,0,0.06)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
          <img 
            src="/canga-logo.png" 
            alt="Çanga Logo" 
            style={{ height: 50, width: 'auto' }}
          />
        </Box>
        <Typography variant="caption" sx={{ 
          color: 'text.secondary', 
          fontWeight: 600, 
          display: 'block',
          letterSpacing: '0.5px',
          fontSize: '0.7rem',
          textTransform: 'uppercase'
        }}>
          Vardiya Yönetim Sistemi
        </Typography>
      </Box>

      {/* Menü Grupları */}
      <Box sx={{ 
        flexGrow: 1, 
        py: 2, 
        px: 2, 
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(0,0,0,0.2)',
        }
      }}>
        {getMenuGroups(user).map((group, groupIndex) => (
          <Box key={group.title} sx={{ mb: 3 }}>
            {/* Grup Başlığı */}
            <Typography 
              variant="overline" 
              sx={{ 
                px: 2,
                py: 1,
                display: 'block',
                fontWeight: 700,
                color: 'rgba(0,0,0,0.4)',
                fontSize: '0.65rem',
                letterSpacing: '1.2px'
              }}
            >
              {group.title}
            </Typography>
            
            {/* Grup Öğeleri */}
            <List sx={{ py: 0 }}>
              {group.items.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      py: 1.2,
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: isActive(item.path) 
                        ? `${item.color}10`
                        : 'transparent',
                      transition: 'all 0.25s ease',
                      '&::before': isActive(item.path) ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '60%',
                        backgroundColor: item.color,
                        borderRadius: '0 4px 4px 0'
                      } : {},
                      '&:hover': {
                        backgroundColor: isActive(item.path) 
                          ? `${item.color}18`
                          : `${item.color}08`,
                        transform: 'translateX(2px)'
                      },
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: isActive(item.path) ? item.color : 'rgba(0,0,0,0.5)',
                        minWidth: 40,
                        transition: 'all 0.25s ease'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive(item.path) ? 600 : 500,
                        fontSize: '0.875rem',
                        color: isActive(item.path) ? item.color : 'rgba(0,0,0,0.75)'
                      }}
                    />
                    {item.badge && (
                      <Chip 
                        label={item.badge} 
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                          color: 'white',
                          border: 'none'
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Hızlı Aksiyon Butonu */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <ListItemButton
          onClick={() => handleNavigation('/shifts/create')}
          sx={{
            borderRadius: 2,
            py: 1.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <AddIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Yeni Vardiya"
            primaryTypographyProps={{
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          />
        </ListItemButton>
      </Box>

      {/* Alt bilgi */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(0,0,0,0.06)',
        textAlign: 'center'
      }}>
        <Typography variant="caption" sx={{ 
          color: 'rgba(0,0,0,0.4)', 
          display: 'block',
          fontSize: '0.7rem'
        }}>
          © 2024 Çanga Savunma
        </Typography>
        <Typography variant="caption" sx={{ 
          color: 'rgba(0,0,0,0.5)', 
          fontWeight: 600,
          fontSize: '0.7rem'
        }}>
          v2.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          color: 'text.primary',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          boxShadow: 'none'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Mobil menü butonu */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.1)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Başlık */}
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'rgba(0,0,0,0.85)'
            }}
          >
            {(() => {
              const groups = getMenuGroups(user);
              for (const group of groups) {
                const activeItem = group.items.find(item => isActive(item.path));
                if (activeItem) return activeItem.text;
              }
              return 'Çanga Vardiya Sistemi';
            })()}
          </Typography>

          {/* Sağ taraf - bildirimler ve profil */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Bildirim butonu */}
            <IconButton 
              color="inherit" 
              onClick={() => navigate('/notifications')}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)'
                }
              }}
            >
              <Badge 
                badgeContent={unreadCount} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    height: '18px',
                    minWidth: '18px'
                  }
                }}
              >
                <NotificationsIcon sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>

            {/* Profil menüsü */}
            <IconButton
              onClick={handleProfileClick}
              sx={{
                padding: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)'
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {user?.name?.charAt(0) || 'Ç'}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: 220,
                  borderRadius: 2,
                  overflow: 'visible',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    borderLeft: '1px solid rgba(0,0,0,0.08)'
                  },
                },
              }}
            >
              <MenuItem 
                onClick={handleProfileClose}
                sx={{ 
                  py: 1.5,
                  borderBottom: '1px solid rgba(0,0,0,0.08)'
                }}
              >
                <ListItemIcon>
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '0.8rem'
                    }}
                  >
                    {user?.name?.charAt(0) || 'Ç'}
                  </Avatar>
                </ListItemIcon>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {user?.name || 'Çanga Yöneticisi'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.department || 'İdari Birim'}
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem 
                onClick={() => { handleProfileClose(); navigate('/profile'); }}
                sx={{
                  py: 1.2,
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.08)'
                  }
                }}
              >
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Ayarlar</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleLogout} 
                sx={{ 
                  py: 1.2,
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.08)'
                  }
                }}
              >
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <Typography variant="body2">Çıkış Yap</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobil drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#ffffff',
              borderRight: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#ffffff',
              borderRight: '1px solid rgba(0,0,0,0.08)',
              boxShadow: 'none'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Ana içerik alanı */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
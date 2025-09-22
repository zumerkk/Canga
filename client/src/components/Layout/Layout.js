import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
// Çanga logosunu import ediyoruz
import CangaLogo from '../../assets/7ff0dçanga_logo-removebg-preview.png';
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
  BusinessCenter as BusinessCenterIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  ExitToApp as ExitToAppIcon,
  School as SchoolIcon,
  EventAvailable as EventAvailableIcon,
  Assignment as AssignmentIcon,
  WorkOutline as WorkOutlineIcon,
  PersonAdd as PersonAddIcon,
  Build as BuildIcon,
  FlightTakeoff as FlightIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const drawerWidth = 300;

// Modern organizasyonlu menü grupları
const getMenuGroups = (user) => {
  const allGroups = [
    {
      title: 'Dashboard',
      icon: <TimelineIcon sx={{ fontSize: '1rem' }} />,
      items: [
        {
          text: 'Ana Sayfa',
          icon: <DashboardIcon />,
          path: '/dashboard',
          description: 'Genel görünüm ve istatistikler'
        }
      ]
    },
    {
      title: 'İnsan Kaynakları',
      icon: <PeopleIcon sx={{ fontSize: '1rem' }} />,
      items: [
        {
          text: 'Çalışanlar',
          icon: <PeopleIcon />,
          path: '/employees',
          description: 'Aktif çalışan yönetimi'
        },
        {
          text: 'İşten Ayrılanlar',
          icon: <ExitToAppIcon />,
          path: '/former-employees',
          description: 'Eski çalışanlar arşivi'
        },
        {
          text: 'Stajyer & Çıraklar',
          icon: <SchoolIcon />,
          path: '/trainees-apprentices',
          description: 'Eğitim programları'
        },
        {
          text: 'Yıllık İzin Takibi',
          icon: <EventAvailableIcon />,
          path: '/annual-leave',
          description: 'İzin yönetim sistemi'
        }
      ]
    },
    {
      title: 'İK Yönetimi',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: '1rem' }} />,
      items: [
        {
          text: 'Başvuru Yönetimi',
          icon: <PersonAddIcon />,
          path: '/hr/job-applications',
          description: 'İş başvuruları kontrol paneli',
          requiresHRAccess: true
        },
        {
          text: 'Form Düzenleyici',
          icon: <BuildIcon />,
          path: '/hr/job-application-editor',
          description: 'Başvuru formu konfigürasyonu',
          requiresHRAccess: true
        }
      ]
    },
    {
      title: 'Operasyonel İşlemler',
      icon: <WorkOutlineIcon sx={{ fontSize: '1rem' }} />,
      items: [
        {
          text: 'Vardiyalar',
          icon: <ScheduleIcon />,
          path: '/shifts',
          description: 'Vardiya planlama sistemi'
        },
        {
          text: 'Yolcu Listesi',
          icon: <FlightIcon />,
          path: '/passenger-list',
          description: 'Ulaşım yolcu yönetimi'
        },
        {
          text: 'Servis Güzergahları',
          icon: <DirectionsBusIcon />,
          path: '/services',
          description: 'Ulaşım rotaları'
        }
      ]
    },
    {
      title: 'Araçlar & Planlama',
      icon: <AssignmentIcon sx={{ fontSize: '1rem' }} />,
      items: [
        {
          text: 'Hızlı Liste Oluştur',
          icon: <EventNoteIcon />,
          path: '/quick-list',
          description: 'Anında liste üretimi'
        },
        {
          text: 'Takvim & Ajanda',
          icon: <CalendarIcon />,
          path: '/calendar',
          description: 'Etkinlik takip sistemi'
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

// Hızlı aksiyonlar - geliştirilmiş
const quickActions = [
  {
    text: 'Yeni Vardiya',
    icon: <AddIcon />,
    path: '/shifts/create',
    color: 'primary',
    description: 'Hızlı vardiya oluştur'
  },
];

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
      background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)'
    }}>
      {/* Logo Bölümü */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center', 
        borderBottom: '2px solid #e3f2fd',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={CangaLogo} 
            alt="Çanga Logo" 
            style={{ height: 55, width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
        </Box>
        <Typography variant="caption" sx={{ 
          color: 'text.secondary', 
          fontWeight: 500, 
          mt: 1, 
          display: 'block',
          letterSpacing: '0.5px'
        }}>
          Vardiya Yönetim Sistemi
        </Typography>
      </Box>

      {/* Menü Grupları */}
      <Box sx={{ flexGrow: 1, py: 2, px: 1, overflowY: 'auto' }}>
        {getMenuGroups(user).map((group, groupIndex) => (
          <Box key={group.title} sx={{ mb: 3 }}>
            {/* Grup Başlığı */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              px: 2, 
              py: 1.5, 
              mb: 1,
              background: 'linear-gradient(90deg, rgba(25, 118, 210, 0.08) 0%, rgba(25, 118, 210, 0.02) 100%)',
              borderRadius: 2,
              mx: 1
            }}>
              {group.icon}
              <Typography 
                variant="overline" 
                sx={{ 
                  ml: 1.5,
                  fontWeight: 600,
                  color: 'primary.main',
                  fontSize: '0.75rem',
                  letterSpacing: '0.8px'
                }}
              >
                {group.title}
              </Typography>
            </Box>
            
            {/* Grup Öğeleri */}
            <List sx={{ py: 0 }}>
              {group.items.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 3,
                      mx: 1.5,
                      py: 1.5,
                      backgroundColor: isActive(item.path) 
                        ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                        : 'transparent',
                      background: isActive(item.path) 
                        ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                        : 'transparent',
                      color: isActive(item.path) ? 'white' : 'text.primary',
                      boxShadow: isActive(item.path) 
                        ? '0 4px 12px rgba(25, 118, 210, 0.3)'
                        : 'none',
                      transform: isActive(item.path) ? 'translateX(4px)' : 'translateX(0)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: isActive(item.path) 
                          ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                          : 'rgba(25, 118, 210, 0.08)',
                        background: isActive(item.path) 
                          ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                          : 'rgba(25, 118, 210, 0.08)',
                        transform: 'translateX(6px)',
                        boxShadow: isActive(item.path)
                          ? '0 6px 16px rgba(25, 118, 210, 0.4)'
                          : '0 2px 8px rgba(25, 118, 210, 0.1)'
                      },
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: isActive(item.path) ? 'white' : 'primary.main',
                        minWidth: 45,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      secondary={!isActive(item.path) ? item.description : null}
                      primaryTypographyProps={{
                        fontWeight: isActive(item.path) ? 600 : 500,
                        fontSize: '0.9rem'
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.75rem',
                        color: isActive(item.path) ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                        lineHeight: 1.3
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}

        {/* Hızlı Aksiyonlar */}
        <Box sx={{ mt: 2, px: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 2, 
            py: 1.5, 
            mb: 1,
            background: 'linear-gradient(90deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.02) 100%)',
            borderRadius: 2,
            mx: 1
          }}>
            <AddIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
            <Typography 
              variant="overline" 
              sx={{ 
                ml: 1.5,
                fontWeight: 600,
                color: 'success.main',
                fontSize: '0.75rem',
                letterSpacing: '0.8px'
              }}
            >
              Hızlı Aksiyonlar
            </Typography>
          </Box>
          
          <List sx={{ py: 0 }}>
            {quickActions.map((action) => (
              <ListItem key={action.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(action.path)}
                  sx={{
                    borderRadius: 3,
                    mx: 1.5,
                    py: 1.5,
                    border: `2px solid ${theme.palette[action.color].main}`,
                    background: `linear-gradient(135deg, ${theme.palette[action.color].main}08 0%, ${theme.palette[action.color].main}04 100%)`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette[action.color].main}15 0%, ${theme.palette[action.color].main}08 100%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${theme.palette[action.color].main}25`,
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: `${action.color}.main`, 
                    minWidth: 45,
                    transition: 'transform 0.3s ease'
                  }}>
                    {action.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={action.text}
                    secondary={action.description}
                    primaryTypographyProps={{
                      color: `${action.color}.main`,
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: 'text.secondary'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>

      {/* Alt bilgi - Modern */}
      <Box sx={{ 
        p: 2.5, 
        borderTop: '2px solid #e3f2fd',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
      }}>
        <Typography variant="caption" sx={{ 
          color: 'text.secondary', 
          display: 'block',
          fontWeight: 500,
          textAlign: 'center'
        }}>
          © 2024 Çanga Savunma Endüstrisi
        </Typography>
        <Typography variant="caption" sx={{ 
          color: 'primary.main', 
          fontWeight: 600,
          textAlign: 'center',
          display: 'block',
          mt: 0.5
        }}>
          v2.0.0 • KEKILLIOGLU
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          {/* Mobil menü butonu */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Başlık */}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Bildirim butonu */}
            <IconButton color="inherit" onClick={() => navigate('/notifications')}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Profil menüsü */}
            <IconButton
              onClick={handleProfileClick}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.name?.charAt(0) || 'Ç'}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileClose}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                <Box>
                  <Typography variant="body2">{user?.name || 'Çanga Yöneticisi'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.department || 'İdari Birim'}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleProfileClose(); navigate('/profile'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Ayarlar
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                Çıkış Yap
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
            keepMounted: true, // Mobil performans için
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#fafafa',
              borderRight: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
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
              backgroundColor: '#fafafa',
              borderRight: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.08)'
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
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar /> {/* AppBar için boşluk */}
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
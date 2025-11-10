import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// Authentication
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login/Login';

// Core components - immediate load
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';

// Lazy loaded components - bundle optimization
const Employees = React.lazy(() => import('./pages/Employees'));
const FormerEmployees = React.lazy(() => import('./pages/FormerEmployees'));
const TraineesAndApprentices = React.lazy(() => import('./pages/TraineesAndApprentices'));
const PassengerList = React.lazy(() => import('./pages/PassengerList'));
const Shifts = React.lazy(() => import('./pages/Shifts'));
const CreateShift = React.lazy(() => import('./pages/CreateShift'));
const QuickList = React.lazy(() => import('./pages/QuickList'));
const QuickRoute = React.lazy(() => import('./pages/QuickRouteModern'));
const Services = React.lazy(() => import('./pages/Services'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const AnnualLeave = React.lazy(() => import('./pages/AnnualLeave'));
const JobApplicationsList = React.lazy(() => import('./pages/JobApplicationsList'));
const PublicJobApplication = React.lazy(() => import('./pages/PublicJobApplication'));
const JobApplicationEditor = React.lazy(() => import('./pages/JobApplicationEditor'));
const AnnualLeaveEditPage = React.lazy(() => import('./pages/AnnualLeaveEditPage'));

// QR/İmza Sistemi
const QRImzaYonetimi = React.lazy(() => import('./pages/QRImzaYonetimi'));
const QRCodeGenerator = React.lazy(() => import('./pages/QRCodeGenerator'));
const SignaturePage = React.lazy(() => import('./pages/SignaturePage'));
const SystemSignaturePage = React.lazy(() => import('./pages/SystemSignaturePage'));

// Loading component
const PageLoader = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '60vh',
      flexDirection: 'column',
      gap: 2
    }}
  >
    <CircularProgress size={40} />
    <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
      Sayfa yükleniyor...
    </Box>
  </Box>
);

// Tema konfigürasyonu - Canga markasına uygun renkler
const theme = createTheme({
  palette: {
    primary: {
      main: '#0D47A1', // Kurumsal lacivert
      light: '#1976d2',
      dark: '#0b3a83',
    },
    secondary: {
      main: '#D32F2F', // Kurumsal kırmızı vurgusu
      light: '#ef5350',
      dark: '#9a0007',
    },
    background: {
      default: '#f5f6f8',
      paper: '#ffffff',
    },
    success: { main: '#2e7d32' },
    warning: { main: '#F9A825' }, // Altın vurgu
    error: { main: '#d32f2f' },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } }
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } }
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: 'none',
          '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f0f0' },
          '& .MuiDataGrid-columnHeaders': { backgroundColor: '#fafafa', borderBottom: '2px solid #e0e0e0' },
        },
      },
    },
  },
});

// Protected Routes Component
function ProtectedRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Box sx={{ textAlign: 'center' }}>
          Çanga Vardiya Sistemi Yükleniyor...
        </Box>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Ana Sayfa - Dashboard'a yönlendir */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Çalışanlar */}
            <Route path="/employees" element={<Employees />} />
            
            {/* 🚪 İşten Ayrılanlar */}
            <Route path="/former-employees" element={<FormerEmployees />} />
            
            {/* 📊 İK: İş Başvuruları Yönetimi */}
            <Route path="/hr/job-applications" element={<JobApplicationsList />} />
            
            {/* ⚙️ İK: Form Düzenleyici */}
            <Route path="/hr/job-application-editor" element={<JobApplicationEditor />} />
            
            {/* 🎓 Stajyer ve Çıraklar */}
            <Route path="/trainees-apprentices" element={<TraineesAndApprentices />} />
            
            {/* Yolcu Listesi */}
            <Route path="/passenger-list" element={<PassengerList />} />
            
            {/* Vardiyalar */}
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/shifts/create" element={<CreateShift />} />
            <Route path="/shifts/edit/:id" element={<CreateShift />} />
            
            {/* Hızlı Liste Oluştur */}
            <Route path="/quick-list" element={<QuickList />} />
            
            {/* Hızlı Güzergah Oluştur */}
            <Route path="/quick-route" element={<QuickRoute />} />
            
            {/* Servis Yönetimi */}
            <Route path="/services" element={<Services />} />
            
            {/* Bildirimler */}
            <Route path="/notifications" element={<Notifications />} />
            
            {/* Profil Yönetimi */}
            <Route path="/profile" element={<Profile />} />
            
            {/* Takvim/Ajanda */}
            <Route path="/calendar" element={<Calendar />} />
          
          {/* 📆 Yıllık İzin Takibi */}
          <Route path="/annual-leave" element={<AnnualLeave />} />
          
          {/* 📆 Yıllık İzin Detay Düzenleme */}
          <Route path="/annual-leave-edit" element={<AnnualLeaveEditPage />} />
          
          {/* 📱 QR/İmza Yönetim Sistemi */}
          <Route path="/qr-imza-yonetimi" element={<QRImzaYonetimi />} />
          <Route path="/qr-kod-olustur" element={<QRCodeGenerator />} />
          
          {/* 404 - Sayfa bulunamadı */}
          <Route path="*" element={
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '50vh',
                textAlign: 'center'
              }}
            >
              <h1>404 - Sayfa Bulunamadı</h1>
              <p>Aradığınız sayfa mevcut değil.</p>
            </Box>
          } />
        </Routes>
        </Suspense>
      </Layout>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Routes>
            {/* 🌐 PUBLIC ROUTES - Şifre gerektirmez */}
            <Route path="/public/job-application" element={<PublicJobApplication />} />
            <Route path="/imza/:token" element={<SignaturePage />} />
            <Route path="/sistem-imza/:token" element={<SystemSignaturePage />} />
            
            {/* 🔐 PROTECTED ROUTES - Şifre gerektirir */}
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
          
          {/* Toast bildirimleri */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#2e7d32',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#d32f2f',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
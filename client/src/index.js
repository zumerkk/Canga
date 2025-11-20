import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { getApiBaseUrl } from './utils/env';

// Global API URL tanımı - tüm API istekleri için bu kullanılacak
window.API_URL = getApiBaseUrl();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode geçici olarak kapatıldı - drag & drop uyumluluğu için
  // <React.StrictMode>
  <AuthProvider>
    <App />
  </AuthProvider>
  // </React.StrictMode>
); 
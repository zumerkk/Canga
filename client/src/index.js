import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// Global API URL tanımı - tüm API istekleri için bu kullanılacak
window.API_URL = 'https://canga-api.onrender.com';

ReactDOM.render(
  // StrictMode geçici olarak kapatıldı - drag & drop uyumluluğu için
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
); 
const resolveApiBaseUrl = () => {
  // Tarayıcı ortamında window.API_URL varsa kullan
  if (typeof window !== 'undefined' && window.API_URL) {
    return window.API_URL;
  }
  
  // Vite environment variables (import.meta.env kullanımı)
  // Güvenli erişim kontrolü
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // CRA / Webpack environment variables (process.env kullanımı)
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback: localhost
  return 'http://localhost:5001';
};

export const getApiBaseUrl = () => resolveApiBaseUrl();

export default getApiBaseUrl;

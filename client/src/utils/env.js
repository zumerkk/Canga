const resolveApiBaseUrl = () => {
  // 1. Tarayıcı ortamında window.API_URL varsa kullan (Runtime enjeksiyonu için)
  if (typeof window !== 'undefined' && window.API_URL) {
    return window.API_URL;
  }
  
  // 2. CRA / Webpack environment variables (process.env kullanımı) - ÖNCELİKLİ
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.REACT_APP_API_URL) {
      console.log('🔧 API URL from REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
      return process.env.REACT_APP_API_URL;
    }
    // Webpack production check
    if (process.env.NODE_ENV === 'production') {
      console.log('🔧 Production mode detected, using Render API URL');
      return 'https://canga-api.onrender.com';
    }
  }
  
  // 3. Vite environment check (Güvenli erişim)
  try {
    // Webpack/CRA ortamında import.meta kullanımı hata verebilir, bu yüzden try-catch içinde
    // Ayrıca import.meta'nın kendisinin varlığını kontrol ediyoruz
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
      }
      if (import.meta.env.PROD) {
        return 'https://canga-api.onrender.com';
      }
    }
  } catch (e) {
    // import.meta desteklenmiyor (Webpack/CRA ortamı)
  }
  
  // 4. URL-based detection (Son çare)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    // Render.com'da yayındaysak production API kullan
    if (hostname.includes('onrender.com') || hostname.includes('render.com')) {
      console.log('🔧 Detected Render.com hostname, using production API');
      return 'https://canga-api.onrender.com';
    }
  }
  
  // 5. Fallback: localhost (development)
  console.log('🔧 Fallback to localhost:5001');
  return 'http://localhost:5001';
};

export const getApiBaseUrl = () => resolveApiBaseUrl();

export default getApiBaseUrl;

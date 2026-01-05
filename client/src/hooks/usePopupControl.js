/**
 * 🎯 Popup Control Hook
 * 24 saatte bir popup gösterilmesini kontrol eder
 */

const POPUP_STORAGE_KEY = 'canga_popup_last_shown';
const POPUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 saat

export const usePopupControl = () => {
  const shouldShowPopup = () => {
    try {
      const lastShown = localStorage.getItem(POPUP_STORAGE_KEY);
      
      if (!lastShown) {
        // İlk kez gösteriliyor
        return true;
      }
      
      const lastShownTime = parseInt(lastShown, 10);
      const currentTime = new Date().getTime();
      const timeDiff = currentTime - lastShownTime;
      
      // 24 saatten fazla geçmişse göster
      return timeDiff >= POPUP_INTERVAL_MS;
    } catch (error) {
      console.error('Popup kontrolü hatası:', error);
      return false;
    }
  };

  const markPopupAsShown = () => {
    try {
      const currentTime = new Date().getTime();
      localStorage.setItem(POPUP_STORAGE_KEY, currentTime.toString());
    } catch (error) {
      console.error('Popup kayıt hatası:', error);
    }
  };

  const resetPopup = () => {
    try {
      localStorage.removeItem(POPUP_STORAGE_KEY);
    } catch (error) {
      console.error('Popup sıfırlama hatası:', error);
    }
  };

  return {
    shouldShowPopup,
    markPopupAsShown,
    resetPopup
  };
};


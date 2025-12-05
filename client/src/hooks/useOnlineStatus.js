import { useState, useEffect, useCallback } from 'react';
import { 
  getPendingOfflineActions, 
  markOfflineActionComplete, 
  markOfflineActionFailed 
} from '../utils/indexedDB';
import api from '../config/api';

/**
 * 🌐 useOnlineStatus Hook
 * Online/Offline durumu ve offline kuyruk senkronizasyonu
 */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  /**
   * Online durumu güncelle
   */
  const handleOnline = useCallback(() => {
    console.log('🌐 Online oldu');
    setIsOnline(true);
    // Online olunca bekleyen işlemleri senkronize et
    syncPendingActions();
  }, []);

  const handleOffline = useCallback(() => {
    console.log('🌐 Offline oldu');
    setIsOnline(false);
  }, []);

  /**
   * Bekleyen offline işlemleri senkronize et
   */
  const syncPendingActions = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    console.log('🔄 Offline işlemler senkronize ediliyor...');

    try {
      const pendingActions = await getPendingOfflineActions();
      setPendingCount(pendingActions.length);

      if (pendingActions.length === 0) {
        console.log('✅ Bekleyen işlem yok');
        setIsSyncing(false);
        return;
      }

      console.log(`📋 ${pendingActions.length} bekleyen işlem bulundu`);

      for (const action of pendingActions) {
        try {
          // İşlem tipine göre API çağrısı yap
          let response;

          switch (action.type) {
            case 'CHECK_IN':
              response = await api.post('/api/system-qr/submit-system-signature', action.data);
              break;
            case 'CHECK_OUT':
              response = await api.post('/api/system-qr/submit-system-signature', action.data);
              break;
            case 'ATTENDANCE_CORRECT':
              response = await api.put(`/api/attendance/${action.data.id}/correct`, action.data);
              break;
            default:
              console.warn('Bilinmeyen işlem tipi:', action.type);
              continue;
          }

          if (response?.data?.success) {
            await markOfflineActionComplete(action.id);
            console.log(`✅ İşlem senkronize edildi: ${action.id}`);
          } else {
            throw new Error(response?.data?.error || 'Senkronizasyon başarısız');
          }

        } catch (actionError) {
          console.error(`❌ İşlem senkronize edilemedi (${action.id}):`, actionError.message);
          await markOfflineActionFailed(action.id, actionError.message);
        }
      }

      // Güncelle
      const remaining = await getPendingOfflineActions();
      setPendingCount(remaining.length);
      setLastSyncTime(new Date());

      console.log(`✅ Senkronizasyon tamamlandı. Kalan: ${remaining.length}`);

    } catch (error) {
      console.error('❌ Senkronizasyon hatası:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  /**
   * Bekleyen işlem sayısını güncelle
   */
  const refreshPendingCount = useCallback(async () => {
    try {
      const pendingActions = await getPendingOfflineActions();
      setPendingCount(pendingActions.length);
    } catch (error) {
      console.error('Pending count refresh error:', error);
    }
  }, []);

  // Event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // İlk yüklemede bekleyen işlemleri kontrol et
    refreshPendingCount();

    // Online ise senkronize et
    if (navigator.onLine) {
      syncPendingActions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncPendingActions,
    refreshPendingCount
  };
};

export default useOnlineStatus;

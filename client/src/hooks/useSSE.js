import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiBaseUrl } from '../utils/env';

/**
 * 🔴 useSSE Hook
 * Server-Sent Events için React hook
 * 
 * @param {string} endpoint - SSE endpoint path (e.g., '/api/live-stream/attendance')
 * @param {object} options - Hook options
 * @returns {object} - { data, isConnected, error, reconnect }
 */
const useSSE = (endpoint, options = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    params = {},
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  /**
   * SSE bağlantısını kapat
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  /**
   * SSE bağlantısını başlat
   */
  const connect = useCallback(() => {
    // Önceki bağlantıyı kapat
    disconnect();

    if (!enabled) return;

    try {
      // URL oluştur
      const baseUrl = getApiBaseUrl();
      const queryString = new URLSearchParams(params).toString();
      const url = `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

      console.log('🔴 SSE Connecting to:', url);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Bağlantı açıldı
      eventSource.onopen = () => {
        console.log('🔴 SSE Connected');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
        onOpen?.();
      };

      // Mesaj alındı
      eventSource.onmessage = (event) => {
        try {
          // Ping mesajlarını yoksay
          if (event.data === ':ping') return;

          const parsedData = JSON.parse(event.data);
          setData(parsedData);
          onMessage?.(parsedData);
        } catch (parseError) {
          console.warn('SSE parse error:', parseError);
        }
      };

      // Hata oluştu
      eventSource.onerror = (err) => {
        console.error('🔴 SSE Error:', err);
        setIsConnected(false);
        setError(err);
        onError?.(err);

        // Event source'u kapat
        eventSource.close();
        eventSourceRef.current = null;

        // Otomatik yeniden bağlanma
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          console.log(`🔴 SSE Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

    } catch (err) {
      console.error('SSE connection error:', err);
      setError(err);
    }
  }, [endpoint, params, enabled, autoReconnect, reconnectInterval, maxReconnectAttempts, reconnectAttempts, disconnect, onOpen, onMessage, onError]);

  /**
   * Manuel yeniden bağlanma
   */
  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    connect();
  }, [connect]);

  // Component mount/unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
      onClose?.();
    };
  }, [enabled]); // Sadece enabled değiştiğinde

  // Params değiştiğinde yeniden bağlan
  useEffect(() => {
    if (enabled && isConnected) {
      connect();
    }
  }, [JSON.stringify(params)]);

  return {
    data,
    isConnected,
    error,
    reconnect,
    disconnect,
    reconnectAttempts
  };
};

export default useSSE;

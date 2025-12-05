/**
 * 📦 IndexedDB Utility
 * Offline veri saklama ve senkronizasyon için
 */

const DB_NAME = 'CangaOfflineDB';
const DB_VERSION = 1;

// Store isimleri
export const STORES = {
  PENDING_SIGNATURES: 'pendingSignatures',
  CACHED_RECORDS: 'cachedRecords',
  USER_PREFERENCES: 'userPreferences',
  OFFLINE_QUEUE: 'offlineQueue'
};

let db = null;

/**
 * Veritabanını başlat
 */
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB açılamadı:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('✅ IndexedDB başlatıldı');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Pending Signatures store
      if (!database.objectStoreNames.contains(STORES.PENDING_SIGNATURES)) {
        const sigStore = database.createObjectStore(STORES.PENDING_SIGNATURES, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        sigStore.createIndex('timestamp', 'timestamp', { unique: false });
        sigStore.createIndex('employeeId', 'employeeId', { unique: false });
      }

      // Cached Records store
      if (!database.objectStoreNames.contains(STORES.CACHED_RECORDS)) {
        const cacheStore = database.createObjectStore(STORES.CACHED_RECORDS, { 
          keyPath: 'id' 
        });
        cacheStore.createIndex('date', 'date', { unique: false });
        cacheStore.createIndex('type', 'type', { unique: false });
      }

      // User Preferences store
      if (!database.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
        database.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' });
      }

      // Offline Queue store
      if (!database.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = database.createObjectStore(STORES.OFFLINE_QUEUE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('type', 'type', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
};

/**
 * Veri ekle
 */
export const addItem = async (storeName, item) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add({
      ...item,
      timestamp: item.timestamp || new Date().toISOString()
    });

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Veri güncelle
 */
export const updateItem = async (storeName, item) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Veri getir
 */
export const getItem = async (storeName, key) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Tüm verileri getir
 */
export const getAllItems = async (storeName) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Veri sil
 */
export const deleteItem = async (storeName, key) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Store'u temizle
 */
export const clearStore = async (storeName) => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// ============================================
// OFFLINE QUEUE HELPERS
// ============================================

/**
 * Offline kuyruğa ekle
 */
export const addToOfflineQueue = async (action) => {
  return addItem(STORES.OFFLINE_QUEUE, {
    ...action,
    status: 'pending',
    retryCount: 0
  });
};

/**
 * Bekleyen offline işlemleri getir
 */
export const getPendingOfflineActions = async () => {
  const items = await getAllItems(STORES.OFFLINE_QUEUE);
  return items.filter(item => item.status === 'pending');
};

/**
 * Offline işlemi tamamlandı olarak işaretle
 */
export const markOfflineActionComplete = async (id) => {
  const item = await getItem(STORES.OFFLINE_QUEUE, id);
  if (item) {
    item.status = 'completed';
    item.completedAt = new Date().toISOString();
    await updateItem(STORES.OFFLINE_QUEUE, item);
  }
};

/**
 * Offline işlemi başarısız olarak işaretle
 */
export const markOfflineActionFailed = async (id, error) => {
  const item = await getItem(STORES.OFFLINE_QUEUE, id);
  if (item) {
    item.retryCount = (item.retryCount || 0) + 1;
    item.lastError = error;
    item.lastRetryAt = new Date().toISOString();
    
    // 3 denemeden sonra failed olarak işaretle
    if (item.retryCount >= 3) {
      item.status = 'failed';
    }
    
    await updateItem(STORES.OFFLINE_QUEUE, item);
  }
};

// ============================================
// USER PREFERENCES HELPERS
// ============================================

/**
 * Kullanıcı tercihini kaydet
 */
export const savePreference = async (key, value) => {
  return updateItem(STORES.USER_PREFERENCES, { key, value });
};

/**
 * Kullanıcı tercihini getir
 */
export const getPreference = async (key, defaultValue = null) => {
  const item = await getItem(STORES.USER_PREFERENCES, key);
  return item?.value ?? defaultValue;
};

// ============================================
// CACHE HELPERS
// ============================================

/**
 * Cache'e kaydet
 */
export const cacheData = async (id, type, data, ttl = 300000) => { // 5 dakika TTL
  return updateItem(STORES.CACHED_RECORDS, {
    id,
    type,
    data,
    date: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ttl).toISOString()
  });
};

/**
 * Cache'den oku
 */
export const getCachedData = async (id) => {
  const item = await getItem(STORES.CACHED_RECORDS, id);
  
  if (!item) return null;
  
  // TTL kontrolü
  if (new Date(item.expiresAt) < new Date()) {
    await deleteItem(STORES.CACHED_RECORDS, id);
    return null;
  }
  
  return item.data;
};

/**
 * Süresi dolmuş cache kayıtlarını temizle
 */
export const cleanExpiredCache = async () => {
  const items = await getAllItems(STORES.CACHED_RECORDS);
  const now = new Date();
  
  for (const item of items) {
    if (new Date(item.expiresAt) < now) {
      await deleteItem(STORES.CACHED_RECORDS, item.id);
    }
  }
};

export default {
  initDB,
  addItem,
  updateItem,
  getItem,
  getAllItems,
  deleteItem,
  clearStore,
  addToOfflineQueue,
  getPendingOfflineActions,
  markOfflineActionComplete,
  markOfflineActionFailed,
  savePreference,
  getPreference,
  cacheData,
  getCachedData,
  cleanExpiredCache,
  STORES
};

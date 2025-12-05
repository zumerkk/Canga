/**
 * 🔊 Sound Utilities
 * Bildirim sesleri için yardımcı fonksiyonlar
 */

// Web Audio API context
let audioContext = null;

/**
 * AudioContext'i başlat (kullanıcı etkileşimi sonrası)
 */
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Basit beep sesi oluştur
 */
const createBeep = (frequency, duration, type = 'sine') => {
  const ctx = initAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

// ============================================
// NOTIFICATION SOUNDS
// ============================================

/**
 * Giriş bildirimi sesi
 */
export const playCheckInSound = () => {
  try {
    // İki tonlu pozitif ses
    createBeep(800, 0.1);
    setTimeout(() => createBeep(1000, 0.15), 100);
  } catch (error) {
    console.warn('Ses çalınamadı:', error);
  }
};

/**
 * Çıkış bildirimi sesi
 */
export const playCheckOutSound = () => {
  try {
    // Aşağı inen ton
    createBeep(800, 0.1);
    setTimeout(() => createBeep(600, 0.15), 100);
  } catch (error) {
    console.warn('Ses çalınamadı:', error);
  }
};

/**
 * Başarı sesi
 */
export const playSuccessSound = () => {
  try {
    createBeep(523, 0.1); // C5
    setTimeout(() => createBeep(659, 0.1), 100); // E5
    setTimeout(() => createBeep(784, 0.15), 200); // G5
  } catch (error) {
    console.warn('Ses çalınamadı:', error);
  }
};

/**
 * Hata sesi
 */
export const playErrorSound = () => {
  try {
    createBeep(200, 0.2, 'square');
    setTimeout(() => createBeep(150, 0.3, 'square'), 200);
  } catch (error) {
    console.warn('Ses çalınamadı:', error);
  }
};

/**
 * Uyarı sesi
 */
export const playWarningSound = () => {
  try {
    createBeep(600, 0.15);
    setTimeout(() => createBeep(600, 0.15), 200);
  } catch (error) {
    console.warn('Ses çalınamadı:', error);
  }
};

/**
 * Bildirim sesi
 */
export const playNotificationSound = () => {
  try {
    createBeep(880, 0.1); // A5
    setTimeout(() => createBeep(1100, 0.1), 80);
  } catch (error) {
    console.warn('Ses çalınamadı:', error);
  }
};

/**
 * Yeni kayıt sesi
 */
export const playNewRecordSound = () => {
  try {
    createBeep(440, 0.05);
    setTimeout(() => createBeep(550, 0.05), 50);
    setTimeout(() => createBeep(660, 0.1), 100);
  } catch (error) {
    console.warn('Ses çalınamadı:', error);
  }
};

/**
 * Anomali/Güvenlik uyarısı sesi
 */
export const playAlertSound = () => {
  try {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        createBeep(800, 0.1);
        setTimeout(() => createBeep(400, 0.1), 100);
      }, i * 300);
    }
  } catch (error) {
    console.warn('Ses çalınamadı:', error);
  }
};

// ============================================
// SOUND PREFERENCES
// ============================================

const SOUND_ENABLED_KEY = 'canga_sound_enabled';

/**
 * Ses ayarını kontrol et
 */
export const isSoundEnabled = () => {
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  return stored !== 'false'; // Varsayılan: açık
};

/**
 * Ses ayarını değiştir
 */
export const setSoundEnabled = (enabled) => {
  localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
};

/**
 * Ses ayarını toggle et
 */
export const toggleSound = () => {
  const current = isSoundEnabled();
  setSoundEnabled(!current);
  return !current;
};

/**
 * Kondisyonel ses çal (ayar açıksa)
 */
export const playSoundIfEnabled = (soundFn) => {
  if (isSoundEnabled()) {
    soundFn();
  }
};

// ============================================
// EVENT-BASED SOUNDS
// ============================================

/**
 * Event tipine göre ses çal
 */
export const playEventSound = (eventType) => {
  if (!isSoundEnabled()) return;

  switch (eventType) {
    case 'CHECK_IN':
    case 'CHECKIN':
      playCheckInSound();
      break;
    case 'CHECK_OUT':
    case 'CHECKOUT':
      playCheckOutSound();
      break;
    case 'SUCCESS':
      playSuccessSound();
      break;
    case 'ERROR':
      playErrorSound();
      break;
    case 'WARNING':
      playWarningSound();
      break;
    case 'NOTIFICATION':
      playNotificationSound();
      break;
    case 'NEW_RECORD':
      playNewRecordSound();
      break;
    case 'ALERT':
    case 'FRAUD':
    case 'ANOMALY':
      playAlertSound();
      break;
    default:
      playNotificationSound();
  }
};

export default {
  playCheckInSound,
  playCheckOutSound,
  playSuccessSound,
  playErrorSound,
  playWarningSound,
  playNotificationSound,
  playNewRecordSound,
  playAlertSound,
  isSoundEnabled,
  setSoundEnabled,
  toggleSound,
  playSoundIfEnabled,
  playEventSound
};

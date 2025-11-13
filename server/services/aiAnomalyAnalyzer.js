/**
 * 🤖 AI ANOMALİ ANALİZ SERVİSİ
 * Gemini ve Groq API entegrasyonu ile konum anomalilerini analiz eder
 */

const axios = require('axios');

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// API Endpoints
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Gemini API ile anomali analizi
 * @param {object} anomalyData - Anomali verileri
 * @returns {Promise<object>} Analiz sonucu
 */
async function analyzeWithGemini(anomalyData) {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY bulunamadı. AI analizi atlanıyor.');
    return null;
  }

  try {
    const { employee, distance, distanceText, timestamp, userLocation, factoryLocation } = anomalyData;
    
    const prompt = `
Bir çalışanın giriş-çıkış sisteminde konum anomalisi tespit edildi. Lütfen bu durumu analiz et ve değerlendir.

🏢 FİRMA BİLGİLERİ:
- Firma: Çanga Savunma Endüstrisi A.Ş.
- Fabrika: FABRİKALAR MAH. SİLAH İHTİSAS OSB 2. SOKAK NO: 3, 71100 Kırıkkale Merkez
- Fabrika Koordinatları: ${factoryLocation.latitude}°N, ${factoryLocation.longitude}°E
- Kabul Edilen Maksimum Mesafe: 1000 metre (1 km)

👤 ÇALIŞAN BİLGİLERİ:
- Ad Soyad: ${employee.adSoyad}
- Personel ID: ${employee.employeeId}
- Departman: ${employee.departman}
- Pozisyon: ${employee.pozisyon}
- Lokasyon: ${employee.lokasyon}

📍 KONUM BİLGİLERİ:
- Çalışanın Konumu: ${userLocation.latitude}°N, ${userLocation.longitude}°E
- Fabrikadan Uzaklık: ${distanceText} (${distance} metre)
- Zaman: ${new Date(timestamp).toLocaleString('tr-TR')}

❓ SORULAR:
1. Bu mesafe normal bir durumu mu gösteriyor yoksa şüpheli mi?
2. Çalışan evden veya farklı bir lokasyondan mı giriş yapmış olabilir?
3. Bu durumun makul açıklamaları neler olabilir? (örn: servis güzergahı, arızalı araç, acil durum, vb.)
4. Yönetimin bu duruma dikkat etmesi gerekir mi?
5. Risk seviyesi nedir? (DÜŞÜK / ORTA / YÜKSEK)

Lütfen kısa, net ve Türkçe bir analiz yap. Maksimum 200 kelime.
`;

    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const analysis = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    
    if (!analysis) {
      throw new Error('Gemini API geçerli yanıt döndürmedi');
    }

    return {
      provider: 'GEMINI',
      analysis,
      timestamp: new Date(),
      success: true
    };

  } catch (error) {
    console.error('❌ Gemini API hatası:', error.message);
    return {
      provider: 'GEMINI',
      error: error.message,
      timestamp: new Date(),
      success: false
    };
  }
}

/**
 * Groq API ile anomali analizi
 * @param {object} anomalyData - Anomali verileri
 * @returns {Promise<object>} Analiz sonucu
 */
async function analyzeWithGroq(anomalyData) {
  if (!GROQ_API_KEY) {
    console.warn('⚠️ GROQ_API_KEY bulunamadı. AI analizi atlanıyor.');
    return null;
  }

  try {
    const { employee, distance, distanceText, timestamp, userLocation, factoryLocation } = anomalyData;
    
    const systemPrompt = `Sen Çanga Savunma Endüstrisi için çalışan bir güvenlik analisti AI'sın. Konum anomalilerini değerlendirip yönetim için raporlar hazırlıyorsun. Türkçe, profesyonel ve objektif yanıtlar veriyorsun.`;
    
    const userPrompt = `
Konum Anomalisi Tespit Edildi:

Çalışan: ${employee.adSoyad} (${employee.employeeId})
Departman: ${employee.departman} - ${employee.pozisyon}
Fabrikadan Uzaklık: ${distanceText}
Zaman: ${new Date(timestamp).toLocaleString('tr-TR')}

Fabrika: Kırıkkale OSB (${factoryLocation.latitude}°N, ${factoryLocation.longitude}°E)
Çalışan Konumu: ${userLocation.latitude}°N, ${userLocation.longitude}°E

Bu durumu analiz et ve şunları belirt:
1. Risk seviyesi (DÜŞÜK/ORTA/YÜKSEK)
2. Olası açıklamalar
3. Yönetim önerisi

Maksimum 150 kelime, direkt ve net.
`;

    const response = await axios.post(
      GROQ_ENDPOINT,
      {
        model: 'mixtral-8x7b-32768', // Hızlı ve güçlü model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Daha tutarlı sonuçlar için düşük
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const analysis = response.data?.choices?.[0]?.message?.content || null;
    
    if (!analysis) {
      throw new Error('Groq API geçerli yanıt döndürmedi');
    }

    return {
      provider: 'GROQ',
      analysis,
      timestamp: new Date(),
      success: true
    };

  } catch (error) {
    console.error('❌ Groq API hatası:', error.message);
    return {
      provider: 'GROQ',
      error: error.message,
      timestamp: new Date(),
      success: false
    };
  }
}

/**
 * Her iki AI ile de analiz yap (paralel)
 * @param {object} anomalyData - Anomali verileri
 * @returns {Promise<object>} Kombine analiz sonucu
 */
async function analyzeAnomaly(anomalyData) {
  console.log('🤖 AI Anomali Analizi başlatılıyor...');
  console.log(`   Çalışan: ${anomalyData.employee.adSoyad}`);
  console.log(`   Mesafe: ${anomalyData.distanceText}`);

  // Her iki AI'ı paralel çalıştır
  const [geminiResult, groqResult] = await Promise.allSettled([
    analyzeWithGemini(anomalyData),
    analyzeWithGroq(anomalyData)
  ]);

  const results = {
    gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : null,
    groq: groqResult.status === 'fulfilled' ? groqResult.value : null,
    analyzedAt: new Date(),
    anomalyData: {
      employeeName: anomalyData.employee.adSoyad,
      employeeId: anomalyData.employee.employeeId,
      distance: anomalyData.distance,
      distanceText: anomalyData.distanceText,
      timestamp: anomalyData.timestamp
    }
  };

  // Başarılı analiz sayısı
  const successCount = [results.gemini?.success, results.groq?.success].filter(Boolean).length;
  
  if (successCount > 0) {
    console.log(`✅ AI Analizi tamamlandı (${successCount}/2 başarılı)`);
  } else {
    console.warn('⚠️ Hiçbir AI analizi başarısız oldu');
  }

  return results;
}

/**
 * Risk seviyesi çıkar (AI analizinden)
 * @param {string} analysis - AI analiz metni
 * @returns {string} Risk seviyesi
 */
function extractRiskLevel(analysis) {
  if (!analysis) return 'BILINMIYOR';
  
  const text = analysis.toUpperCase();
  
  if (text.includes('YÜKSEK')) return 'YÜKSEK';
  if (text.includes('ORTA')) return 'ORTA';
  if (text.includes('DÜŞÜK')) return 'DÜŞÜK';
  
  return 'BILINMIYOR';
}

/**
 * Özet rapor oluştur
 * @param {object} aiResults - AI analiz sonuçları
 * @returns {string} Özet rapor
 */
function generateSummary(aiResults) {
  const parts = [];
  
  if (aiResults.gemini?.success) {
    const risk = extractRiskLevel(aiResults.gemini.analysis);
    parts.push(`Gemini (Risk: ${risk})`);
  }
  
  if (aiResults.groq?.success) {
    const risk = extractRiskLevel(aiResults.groq.analysis);
    parts.push(`Groq (Risk: ${risk})`);
  }
  
  if (parts.length === 0) {
    return 'AI analizi başarısız oldu';
  }
  
  return `${aiResults.anomalyData.employeeName} - ${aiResults.anomalyData.distanceText} uzaklık. ${parts.join(' | ')}`;
}

module.exports = {
  analyzeAnomaly,
  analyzeWithGemini,
  analyzeWithGroq,
  extractRiskLevel,
  generateSummary
};


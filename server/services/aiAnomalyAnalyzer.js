/**
 * 🤖 AI ANOMALİ ANALİZ SERVİSİ
 * Sadece Groq API entegrasyonu ile konum anomalilerini analiz eder
 */

const axios = require('axios');

// API Keys
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// API Endpoints
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

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

Bu durumu analiz et ve şunları belirt:
1. Risk seviyesi (DÜŞÜK/ORTA/YÜKSEK)
2. Olası açıklamalar (örn: servis güzergahı, arızalı araç, acil durum, vb.)
3. Yönetim önerisi

Maksimum 200 kelime, direkt ve net.
`;

    const response = await axios.post(
      GROQ_ENDPOINT,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
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
 * AI ile anomali analizi yap
 * @param {object} anomalyData - Anomali verileri
 * @returns {Promise<object>} Analiz sonucu
 */
async function analyzeAnomaly(anomalyData) {
  console.log('🤖 AI Anomali Analizi başlatılıyor...');
  console.log(`   Çalışan: ${anomalyData.employee.adSoyad}`);
  console.log(`   Mesafe: ${anomalyData.distanceText}`);

  // Groq ile analiz yap
  const groqResult = await analyzeWithGroq(anomalyData);

  const results = {
    groq: groqResult,
    analyzedAt: new Date(),
    anomalyData: {
      employeeName: anomalyData.employee.adSoyad,
      employeeId: anomalyData.employee.employeeId,
      distance: anomalyData.distance,
      distanceText: anomalyData.distanceText,
      timestamp: anomalyData.timestamp
    }
  };

  if (groqResult?.success) {
    console.log('✅ AI Analizi tamamlandı');
  } else {
    console.warn('⚠️ AI analizi başarısız oldu');
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
  if (aiResults.groq?.success) {
    const risk = extractRiskLevel(aiResults.groq.analysis);
    return `${aiResults.anomalyData.employeeName} - ${aiResults.anomalyData.distanceText} uzaklık. Groq AI (Risk: ${risk})`;
  }
  
  return 'AI analizi başarısız oldu';
}

module.exports = {
  analyzeAnomaly,
  analyzeWithGroq,
  extractRiskLevel,
  generateSummary
};

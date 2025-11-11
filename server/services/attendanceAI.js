/**
 * 🤖 ATTENDANCE AI SERVICE
 * 
 * QR/İmza sistemi için AI destekli özellikler:
 * - Excel import analizi ve düzeltme (Gemini)
 * - Anomali tespiti (Groq - hızlı)
 * - Fraud detection (Gemini - analitik)
 * - Akıllı raporlama (Groq - text generation)
 * - Predictive analytics (Gemini)
 */

const { aiClient } = require('../config/aiConfig');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const moment = require('moment');

class AttendanceAI {
  
  /**
   * 1️⃣ EXCEL İMPORT ANALİZİ VE DÜZELTME
   * Kart okuyucu Excel'ini AI ile analiz et ve düzelt
   */
  async analyzeExcelImport(excelData) {
    console.log('🤖 AI Excel Analizi başlıyor...');
    
    const prompt = `
GÖREV: Kart okuyucu giriş-çıkış verilerini analiz et ve düzelt.

VERİ:
${JSON.stringify(excelData.slice(0, 50), null, 2)}

YAPILACAKLAR:
1. ±1 dakika hataları düzelt (08:59 → 09:00, 17:31 → 17:30)
2. Eksik kayıtları tespit et (sadece giriş var, çıkış yok)
3. Çift kayıtları bul ve birleştir
4. Anormal saatleri işaretle (çok erken/geç, gece 3'te giriş vb.)
5. İsim varyasyonlarını standartlaştır (AHMET Yilmaz → Ahmet Yılmaz)
6. Geçersiz kayıtları tespit et

ÇIKTI (JSON formatında):
{
  "duzeltmeler": [
    {
      "satir": 1,
      "alan": "giris_saati",
      "eski": "08:59",
      "yeni": "09:00",
      "sebep": "1 dakika düzeltme"
    }
  ],
  "eksik_kayitlar": [
    {
      "satir": 5,
      "calisan": "Ahmet Yılmaz",
      "sorun": "Çıkış kaydı yok",
      "oneri": "Manuel kontrol gerekli"
    }
  ],
  "anomaliler": [
    {
      "satir": 10,
      "sorun": "Gece 03:00'te giriş",
      "seviye": "yuksek",
      "oneri": "Doğrulama gerekli"
    }
  ],
  "ozet": {
    "toplam_kayit": 50,
    "duzeltilen": 12,
    "eksik": 3,
    "anomali": 2,
    "basari_orani": 94,
    "oneri": "Genel değerlendirme ve öneriler"
  }
}
`;

    try {
      const result = await aiClient.generate(prompt, {
        taskType: 'analysis',
        forceProvider: 'gemini' // Gemini analitik için daha iyi
      });

      // JSON parse
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          provider: result.provider,
          analysis
        };
      }

      return {
        success: false,
        error: 'JSON formatında dönemedi',
        rawResponse: result.content
      };

    } catch (error) {
      console.error('❌ Excel AI analizi hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 2️⃣ ANOMALİ TESPİTİ
   * Anormal giriş-çıkış pattern'lerini tespit et (Hızlı - Groq)
   */
  async detectAnomalies(attendanceRecords) {
    console.log('🚨 AI Anomali tespiti başlıyor...');

    const summary = attendanceRecords.map(r => ({
      isim: r.employeeId?.adSoyad,
      giris: r.checkIn?.time ? moment(r.checkIn.time).format('HH:mm') : null,
      cikis: r.checkOut?.time ? moment(r.checkOut.time).format('HH:mm') : null,
      sure: r.workDuration,
      yontem: r.checkIn?.method,
      durum: r.status
    }));

    const prompt = `
GÖREV: Giriş-çıkış kayıtlarında anomali tespit et.

KAYITLAR:
${JSON.stringify(summary, null, 2)}

ANOMALI TİPLERİ:
1. Çok erken/geç saatler (örn: 04:00 gibi gece saatleri)
2. Çok kısa/uzun çalışma süreleri (< 2 saat veya > 14 saat)
3. Aynı kişinin çift kaydı
4. Giriş var ama çıkış yok (eksik kayıt)
5. Mantıksız giriş-çıkış sırası (çıkış girişten önce)
6. Hafta sonu/tatil günü kayıt

ÇIKTI (JSON):
{
  "anomaliler": [
    {
      "calisan": "İsim",
      "tip": "cok_erken",
      "detay": "Gece 03:00'te giriş kaydı",
      "seviye": "yuksek",
      "oneri": "Manuel doğrulama gerekli"
    }
  ],
  "ozet": {
    "toplam_kayit": 100,
    "anomali_sayisi": 5,
    "risk_seviyesi": "orta",
    "genel_oneri": "Kısa değerlendirme"
  }
}
`;

    try {
      const result = await aiClient.generate(prompt, {
        taskType: 'analysis',
        forceProvider: 'groq' // Groq daha hızlı
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { ozet: { genel_oneri: result.content } };

    } catch (error) {
      console.error('❌ Anomali tespiti hatası:', error);
      return { error: error.message };
    }
  }

  /**
   * 3️⃣ FRAUD DETECTION - İmza Sahtecilik Tespiti
   * Şüpheli imza kullanımlarını tespit et
   */
  async detectFraud(attendanceHistory) {
    console.log('🕵️ AI Fraud detection başlıyor...');

    const patterns = attendanceHistory.map(r => ({
      isim: r.employeeId?.adSoyad,
      tarih: moment(r.date).format('YYYY-MM-DD'),
      giris_yontem: r.checkIn?.method,
      giris_ip: r.checkIn?.ipAddress,
      giris_gps: r.checkIn?.coordinates,
      cikis_yontem: r.checkOut?.method,
      imza_var: !!r.checkIn?.signature
    }));

    const prompt = `
GÖREV: Giriş-çıkış kayıtlarında fraud (sahtecilik) pattern'leri tespit et.

KAYITLAR:
${JSON.stringify(patterns, null, 2)}

ŞÜPHELİ PATTERN'LER:
1. Aynı IP'den çok fazla giriş (başkası yerine basma)
2. GPS lokasyon uyuşmazlığı (farklı şehirden giriş)
3. Çok hızlı giriş-çıkış (5 dk içinde)
4. Sabah giriş yok ama akşam çıkış var
5. Aynı dakikada birden fazla kişi aynı metotla giriş
6. İmza pattern'i tutarsızlığı (her gün farklı imza)

ÇIKTI (JSON):
{
  "fraud_bulgulari": [
    {
      "calisan": "İsim",
      "tip": "buddy_punching",
      "detay": "Aynı IP'den 5 dakika içinde 3 farklı kişi giriş yapmış",
      "guven_skoru": 0.85,
      "oneri": "İK ile görüşme önerilir"
    }
  ],
  "risk_analizi": {
    "toplam_kayit": 100,
    "suphe_sayisi": 3,
    "yuksek_risk": 1,
    "orta_risk": 2,
    "genel_risk": "orta"
  }
}
`;

    try {
      const result = await aiClient.generate(prompt, {
        taskType: 'analysis',
        forceProvider: 'gemini' // Gemini pattern recognition için iyi
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { risk_analizi: { genel_risk: 'bilinmiyor' } };

    } catch (error) {
      console.error('❌ Fraud detection hatası:', error);
      return { error: error.message };
    }
  }

  /**
   * 4️⃣ AKILLI RAPORLAMA - AI Insights
   * Aylık rapor için AI öngörüleri ve öneriler
   */
  async generateMonthlyInsights(monthData) {
    console.log('💡 AI Monthly Insights oluşturuluyor...');

    const stats = {
      toplam_calisan: monthData.totalEmployees,
      ortalama_gunluk_katilim: monthData.averageAttendance,
      toplam_gec_kalma: monthData.totalLateArrivals,
      toplam_devamsizlik: monthData.totalAbsences,
      fazla_mesai_toplam: monthData.totalOvertime,
      en_cok_gec_kalan_top5: monthData.topLateEmployees,
      trend_data: monthData.dailyTrends
    };

    const prompt = `
GÖREV: Aylık giriş-çıkış raporunu analiz et ve yönetici için insights oluştur.

AYLIK VERİ:
${JSON.stringify(stats, null, 2)}

ANALİZ ET:
1. TRENDLER: Hangi günler/saatler daha fazla geç kalma/devamsızlık var?
2. PATTERN'LER: Tekrarlayan sorunlar var mı?
3. RİSKLER: Dikkat edilmesi gereken çalışanlar/durumlar
4. ÖNERİLER: İyileştirme önerileri
5. TAHMİNLER: Gelecek ay için tahminler

ÇIKTI (JSON):
{
  "onemli_bulgular": [
    "Pazartesi günleri %35 daha fazla geç kalma",
    "15-20 yaş arası çalışanlarda devamsızlık yüksek"
  ],
  "trendler": {
    "gec_kalma_trend": "artiyor",
    "devamsizlik_trend": "stabil",
    "fazla_mesai_trend": "azaliyor"
  },
  "riskli_alanlar": [
    {
      "alan": "Sabah vardiyası",
      "risk": "Sürekli geç başlama",
      "oneri": "Vardiya saatini 30 dk ileri alın"
    }
  ],
  "aksiyonlar": [
    "Top 5 geç kalana uyarı",
    "Pazartesi sabahı hatırlatma SMS",
    "Fazla mesai politikası güncelleme"
  ],
  "tahminler": {
    "gelecek_ay_katilim": "%92",
    "beklenen_fazla_mesai": "120 saat",
    "potansiyel_sorunlar": ["Yaz tatili dönemi"]
  }
}
`;

    try {
      const result = await aiClient.generate(prompt, {
        taskType: 'analysis',
        forceProvider: 'groq' // Groq text generation için hızlı
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { onemli_bulgular: [result.content] };

    } catch (error) {
      console.error('❌ Monthly insights hatası:', error);
      return { error: error.message };
    }
  }

  /**
   * 5️⃣ PREDICTIVE ANALYTICS - Devamsızlık Tahmini
   * Hangi çalışanlar yarın devamsız olabilir?
   */
  async predictAbsences(employeeHistory) {
    console.log('🔮 AI Absence Prediction başlıyor...');

    const prompt = `
GÖREV: Çalışan geçmişine göre yarın devamsız olma riskini tahmin et.

ÇALIŞAN GEÇMİŞİ (Son 30 gün):
${JSON.stringify(employeeHistory, null, 2)}

ANALİZ:
1. Geçmiş devamsızlık pattern'i
2. Haftanın günü effect (Pazartesi riski yüksek mi?)
3. Mevsimsel faktörler
4. Geç kalma geçmişi (geç kalanlar devamsız olur mu?)
5. İzin kullanımı

Her çalışan için risk skoru (0-100) ve sebep ver.

ÇIKTI (JSON):
{
  "yuksek_risk": [
    {
      "calisan": "İsim",
      "risk_skoru": 85,
      "sebep": "Son 7 günde 3 gün geç kalmış, Pazartesi pattern'i var",
      "oneri": "Hatırlatma SMS gönder"
    }
  ],
  "orta_risk": [...],
  "dusuk_risk": [...],
  "genel_tahmin": {
    "yarin_devamsiz_tahmin": "5-8 kişi",
    "guven": 0.75
  }
}
`;

    try {
      const result = await aiClient.generate(prompt, {
        taskType: 'analysis',
        forceProvider: 'gemini'
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { genel_tahmin: { yarin_devamsiz_tahmin: 'bilinmiyor' } };

    } catch (error) {
      console.error('❌ Prediction hatası:', error);
      return { error: error.message };
    }
  }

  /**
   * 6️⃣ NLP ÇALIŞAN ARAMA
   * Doğal dille çalışan ara ("pazartesi sabah geç kalan operatörler")
   */
  async nlpSearch(query, allRecords) {
    console.log('🔎 AI NLP Search:', query);

    const prompt = `
GÖREV: Doğal dil sorgusunu SQL benzeri filtre kriterlerine çevir.

SORGU: "${query}"

MEVCUT ALANLAR:
- adSoyad (string)
- pozisyon (string)
- lokasyon (MERKEZ, İŞL, OSB, İŞIL)
- departman (string)
- durum (AKTIF, PASIF)
- checkIn.time (datetime)
- checkOut.time (datetime)
- status (NORMAL, LATE, ABSENT, INCOMPLETE)
- workDuration (number - dakika)

ÖRNEK SORGULAR:
"pazartesi sabah geç kalanlar" → { status: 'LATE', dayOfWeek: 1 }
"merkez lokasyonundaki operatörler" → { lokasyon: 'MERKEZ', pozisyon: /operatör/i }
"bu hafta en çok çalışanlar" → { workDuration: { $gte: 2400 }, lastWeek: true }

ÇIKTI (JSON):
{
  "anlasildi": true,
  "filtre": {
    "status": "LATE",
    "checkIn.time": {
      "$gte": "2025-11-10T00:00:00",
      "$lt": "2025-11-11T00:00:00"
    }
  },
  "siralama": { "lateMinutes": -1 },
  "aciklama": "10 Kasım Pazartesi günü geç kalan çalışanlar, en geç kalandan başlayarak"
}
`;

    try {
      const result = await aiClient.generate(prompt, {
        taskType: 'classification',
        forceProvider: 'groq', // NLP için hızlı
        maxTokens: 1024
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { anlasildi: false, aciklama: result.content };

    } catch (error) {
      console.error('❌ NLP search hatası:', error);
      return { error: error.message };
    }
  }

  /**
   * 7️⃣ SMART REPORT GENERATOR
   * Yöneticiler için otomatik rapor özeti oluştur
   */
  async generateExecutiveSummary(weekData) {
    console.log('📊 AI Executive Summary oluşturuluyor...');

    const prompt = `
GÖREV: Haftalık giriş-çıkış verilerini analiz edip yönetici özeti hazırla.

HAFTALIK VERİ:
${JSON.stringify(weekData, null, 2)}

ÖZET İÇERMELİ:
1. Önemli Metrikler (katılım, geç kalma, fazla mesai)
2. Öne Çıkan Bulgular (pozitif ve negatif)
3. Karşılaştırma (geçen haftaya göre)
4. Aksiyon Önerileri (yapılması gerekenler)
5. Tahminler (gelecek hafta için)

TÜRKÇE, PROFESYONEL, YÖNETİCİ DİLİ İLE YAZ.
Markdown formatında dön.

ÖRN:
# Haftalık Giriş-Çıkış Raporu

## 📊 Önemli Metrikler
- Ortalama Katılım: %94 (↑ %2)
- Geç Kalma: 23 kez (↓ 5)
- Fazla Mesai: 156 saat (↑ 12)

## 🎯 Öne Çıkanlar
✅ **Pozitif:** ...
⚠️ **Dikkat:** ...

## 💡 Öneriler
1. ...
2. ...
`;

    try {
      const result = await aiClient.generate(prompt, {
        taskType: 'generation',
        forceProvider: 'groq',
        maxTokens: 2048
      });

      return {
        success: true,
        provider: result.provider,
        summary: result.content,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('❌ Executive summary hatası:', error);
      return { error: error.message };
    }
  }

  /**
   * 8️⃣ ÇALIŞAN PATTERN ANALİZİ
   * Bireysel çalışan davranış analizi
   */
  async analyzeEmployeePattern(employeeId) {
    console.log('👤 AI Employee Pattern analizi...');

    // Son 30 günün verisi
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await Attendance.find({
      employeeId: employeeId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    const employee = await Employee.findById(employeeId);

    const summary = {
      calisan: employee.adSoyad,
      pozisyon: employee.pozisyon,
      departman: employee.departman,
      son_30_gun: {
        toplam_gun: records.length,
        gec_kalma: records.filter(r => r.status === 'LATE').length,
        erken_cikis: records.filter(r => r.status === 'EARLY_LEAVE').length,
        devamsizlik: 30 - records.length,
        ortalama_calisma_suresi: records.reduce((sum, r) => sum + (r.workDuration || 0), 0) / records.length
      }
    };

    const prompt = `
GÖREV: Çalışan davranış pattern'ini analiz et ve profil oluştur.

ÇALIŞAN VERİSİ:
${JSON.stringify(summary, null, 2)}

ANALİZ:
1. Çalışma alışkanlıkları (erken mi, geç mi gelir?)
2. Güvenilirlik (düzenli mi, düzensiz mi?)
3. Performans göstergeleri
4. Risk faktörleri (devamsızlık artıyor mu?)
5. Öneriler (takdir, uyarı, eğitim?)

ÇIKTI (JSON):
{
  "profil": {
    "tip": "duzenli_calisan",
    "guvenilirlik_skoru": 92,
    "performans": "yuksek",
    "ozellikler": ["Sabah erken gelir", "Fazla mesai yapar"]
  },
  "trendler": {
    "katilim": "stabil",
    "gecikalma": "azaliyor",
    "performans": "artiyor"
  },
  "oneri": {
    "aksiyon": "takdir_belgesi",
    "sebep": "Düzenli katılım ve yüksek performans",
    "oncelik": "dusuk"
  }
}
`;

    try {
      const result = await aiClient.generate(prompt, {
        taskType: 'analysis',
        forceProvider: 'gemini'
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { profil: { tip: 'bilinmiyor' } };

    } catch (error) {
      console.error('❌ Pattern analizi hatası:', error);
      return { error: error.message };
    }
  }
}

// Singleton instance
const attendanceAI = new AttendanceAI();

module.exports = attendanceAI;


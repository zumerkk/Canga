# 🧪 QR/İMZA SİSTEMİ - TEST KILAVUZU

## ✅ SİSTEM DURUMU

### Backend ✅
- Server çalışıyor: http://localhost:5001
- MongoDB bağlı ✅
- Redis bağlı ✅
- Tüm API endpoint'ler aktif ✅

### Frontend 🔄
- React başlatılıyor...
- Paketler yüklendi ✅
- Sayfalar oluşturuldu ✅

---

## 🚀 TEST ADIMLARI

### Adım 1: Dashboard'a Git
```
1. Tarayıcıda: http://localhost:3000/dashboard
2. Giriş yap (şifre: 28150503)
3. Dashboard açılacak
```

### Adım 2: QR/İmza Menüsünü Gör
```
Sol sidebar'da:

┌─────────────────────────┐
│  Giriş-Çıkış            │
│  📱 QR/İmza Yönetimi  🔴 │
│       ↑                  │
│    YENİ badge           │
└─────────────────────────┘

Tıkla!
```

### Adım 3: Ana Dashboard'u İncele
```
Göreceklerin:

1. 📊 4 Canlı İstatistik Kartı
   - İçeride: Şu an kaç kişi
   - Devamsız: Bugün gelmeyenler
   - Geç Kalan: Geç gelenler
   - Eksik Kayıt: Düzeltme gerekenler

2. 🗂️ 5 Tab
   - Bugünkü Kayıtlar
   - QR Kod Yönetimi
   - İmza Kayıtları
   - Raporlama
   - Analitik

3. 🔍 Arama ve Filtreler
   - Çalışan ara
   - Lokasyon filtrele

4. ⚡ Canlı Güncelleme
   - Her 10 saniyede otomatik
   - Manuel yenile butonu
```

### Adım 4: QR Kod Oluştur
```
1. "QR Kod Oluştur" butonuna bas
2. Yeni sayfaya yönlendirileceksin
3. Çalışan seç (dropdown)
4. "GİRİŞ" veya "ÇIKIŞ" seç
5. "Tekli QR Kod Oluştur" butonuna bas
6. QR kod oluşacak!
```

### Adım 5: QR Kodu Test Et
```
1. Telefonla QR kodu tara
2. İmza sayfası açılacak
3. İsim ve saat otomatik görünecek
4. İmza at
5. "Giriş Yap" butonuna bas
6. Başarılı mesajı göreceksin!
```

---

## 📊 ÖZELLİKLER TEST LİSTESI

### Ana Dashboard (`/qr-imza-yonetimi`)

- [ ] Sayfa açılıyor mu?
- [ ] 4 istatistik kartı görünüyor mu?
- [ ] İstatistikler sıfır olabilir (henüz kayıt yok)
- [ ] Tab'lar çalışıyor mu? (5 tab arasında geçiş)
- [ ] "Yenile" butonu çalışıyor mu?
- [ ] "QR Kod Oluştur" butonu çalışıyor mu?

### Tab 1: Bugünkü Kayıtlar

- [ ] Tablo görünüyor mu?
- [ ] "Bugün henüz kayıt yok" mesajı var mı?
- [ ] Arama kutusu çalışıyor mu?
- [ ] Lokasyon filtreleri çalışıyor mu?
- [ ] (Kayıt varsa) Tablo dolu mu?
- [ ] Düzenle butonu çalışıyor mu?

### Tab 2: QR Kod Yönetimi

- [ ] QR ikon görünüyor mu?
- [ ] "QR Kod Oluşturucu'ya Git" butonu çalışıyor mu?
- [ ] İstatistikler görünüyor mu?

### Tab 3: İmza Kayıtları

- [ ] Tablo görünüyor mu?
- [ ] "İmzalı kayıt bulunmuyor" mesajı var mı?
- [ ] (İmzalı kayıt varsa) Görüntüleniyor mu?

### Tab 4: Raporlama

- [ ] 3 rapor kartı görünüyor mu?
- [ ] "Excel İndir" butonları var mı?
- [ ] Özel rapor formu çalışıyor mu?
- [ ] Tarih seçiciler çalışıyor mu?

### Tab 5: Analitik

- [ ] Progress barlar görünüyor mu?
- [ ] Yüzdeler hesaplanıyor mu?
- [ ] "Kullanım Analitiği" başlığı var mı?
- [ ] Giriş yöntemi dağılımı görünüyor mu?

### QR Kod Oluşturucu (`/qr-kod-olustur`)

- [ ] Sayfa açılıyor mu?
- [ ] "Geri Dön" butonu çalışıyor mu?
- [ ] Çalışan dropdown çalışıyor mu?
- [ ] Çalışanlar listeleniyor mu?
- [ ] Bugünkü durum gösterimi var mı?
- [ ] "GİRİŞ" ve "ÇIKIŞ" radio butonları çalışıyor mu?
- [ ] Lokasyon seçimi çalışıyor mu?
- [ ] "Tekli QR Kod Oluştur" butonu çalışıyor mu?
- [ ] QR kod oluşuyor mu?
- [ ] Kalan süre sayacı çalışıyor mu?
- [ ] "İndir" butonu çalışıyor mu?
- [ ] "Linki Kopyala" butonu çalışıyor mu?
- [ ] "Yenile" butonu QR'ı yeniliyor mu?
- [ ] "Toplu QR Oluştur" butonu çalışıyor mu?

### İmza Sayfası (`/imza/:token`)

**NOT:** Bu sayfayı test etmek için önce QR kod oluşturup taramalısınız!

- [ ] Sayfa açılıyor mu?
- [ ] Çalışan bilgileri görünüyor mu?
- [ ] Canlı saat çalışıyor mu?
- [ ] İmza pedi çalışıyor mu?
- [ ] "Temizle" butonu çalışıyor mu?
- [ ] Kalan süre sayacı var mı?
- [ ] "Giriş Yap/Çıkış Yap" butonu çalışıyor mu?
- [ ] İmza atınca kayıt oluşuyor mu?
- [ ] Başarılı mesajı görünüyor mu?

---

## 🐛 OLASI HATALAR VE ÇÖZÜMLERİ

### Hata 1: "Module not found: moment"
**Çözüm:**
```bash
cd client
npm install
```

### Hata 2: "Module not found: react-signature-canvas"
**Çözüm:**
```bash
cd client
npm install
```

### Hata 3: Sidebar'da QR/İmza menüsü yok
**Çözüm:**
```
1. Sayfayı yenile (F5)
2. Cache temizle (Cmd+Shift+R veya Ctrl+Shift+R)
```

### Hata 4: API çağrıları hata veriyor
**Çözüm:**
```bash
# Backend çalışıyor mu kontrol et
curl http://localhost:5001/health

# Çalışmıyorsa başlat:
cd server
npm start
```

### Hata 5: CORS hatası
**Çözüm:**
```
Backend'de zaten CORS ayarları yapılmış.
Eğer hata devam ederse server'ı yeniden başlat.
```

---

## 🎯 TEST SENARYOLARI

### Senaryo 1: İlk Giriş Kaydı

```
1. Dashboard → QR/İmza Yönetimi
2. Bugünkü Kayıtlar tab'ı → Boş olacak
3. "QR Kod Oluştur" butonuna bas
4. İlk çalışanı seç (örn: Ahmet Yılmaz)
5. "GİRİŞ" seçili olacak
6. "MERKEZ" seçili olacak
7. "Tekli QR Kod Oluştur" bas
8. QR kod oluşacak, 2 dakika sayacı başlayacak
9. QR kodu telefonla tara
10. İmza sayfası açılacak
11. İsim göreceksin: Ahmet Yılmaz
12. Saat göreceksin: 11:45:32 (canlı)
13. İmza at
14. "Giriş Yap" butonuna bas
15. ✅ Başarılı mesajı
16. Dashboard'a dön
17. "Bugünkü Kayıtlar" tab'ında kayıt göreceksin!
```

### Senaryo 2: Çıkış Kaydı

```
1. Aynı çalışanı seç
2. "ÇIKIŞ" seç
3. QR oluştur
4. Tara, imzala
5. Kayıt tamamlanacak
6. Dashboard'ta "Çalışma Süresi" hesaplanmış göreceksin
```

### Senaryo 3: Toplu QR

```
1. "Toplu QR Oluştur" butonuna bas
2. İlk 50 çalışan için QR oluşacak
3. Dialog açılacak
4. Grid'de tüm QR'lar görünecek
5. "Yazdır" butonuna basabilirsin
```

### Senaryo 4: Manuel Düzeltme

```
1. Bugünkü Kayıtlar tab'ında bir kayıt seç
2. "Düzenle" butonuna bas
3. Dialog açılacak
4. Giriş/çıkış saatini değiştir
5. Sebep yaz
6. "Kaydet" butonuna bas
7. Kayıt güncellenecek
```

### Senaryo 5: Rapor İndirme

```
1. "Raporlama" tab'ına git
2. "Günlük Rapor" kartında "Excel İndir" butonuna bas
3. Excel dosyası indirilecek
4. Aç ve incele
```

---

## 🎨 BEKLENEN GÖRÜNÜM

### Dashboard
```
┌─────────────────────────────────────────────────────────┐
│  QR/İmza Yönetim Sistemi                    [Yenile] [QR]│
│  Gerçek zamanlı giriş-çıkış takip                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ İçeride  │  │ Devamsız │  │ Geç Kalan│  │  Eksik   ││
│  │   156    │  │    21    │  │     8    │  │    3     ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Bugünkü Kayıtlar] [QR Yönetimi] [İmza] [Rapor] [Analitik]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🔍 Arama: [________________]  [TÜM][MERKEZ][İŞL][OSB]  │
│                                                          │
│  Tablo:                                                  │
│  Çalışan | Giriş | Çıkış | Süre | Yöntem | Durum | İşlem│
│  ─────────────────────────────────────────────────────── │
│  ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### QR Kod Oluşturucu
```
┌─────────────────────────────────────────────────────────┐
│  [← Geri]  QR Kod Oluşturucu                            │
├──────────────────┬──────────────────────────────────────┤
│  AYARLAR         │  ÖNIZLEME                            │
│                  │                                       │
│  Çalışan: [▼]   │  ┌──────────────┐                    │
│  Durum: ✅ Giriş │  │              │                    │
│                  │  │   QR CODE    │                    │
│  İşlem:          │  │              │                    │
│  ◉ Giriş         │  └──────────────┘                    │
│  ○ Çıkış         │                                       │
│                  │  Kalan: 1:45                         │
│  Lokasyon:       │                                       │
│  ◉ MERKEZ        │  [İndir] [Kopyala] [Yenile]          │
│  ○ İŞL          │                                       │
│                  │                                       │
│  [QR Oluştur]    │                                       │
│  [Toplu QR]      │                                       │
└──────────────────┴──────────────────────────────────────┘
```

---

## 🎯 BAŞARI KRİTERLERİ

### ✅ Temel Fonksiyonlar
- [ ] Dashboard açılıyor
- [ ] Menü görünüyor
- [ ] QR oluşturucu çalışıyor
- [ ] QR kod oluşuyor
- [ ] İmza sayfası açılıyor
- [ ] İmza kaydediliyor

### ✅ Gelişmiş Özellikler
- [ ] Canlı istatistikler güncelleniyor
- [ ] Arama çalışıyor
- [ ] Filtreler çalışıyor
- [ ] Tab geçişleri sorunsuz
- [ ] Manuel düzeltme çalışıyor
- [ ] Excel export çalışıyor

### ✅ Kullanıcı Deneyimi
- [ ] Hızlı yükleniyor (< 2 saniye)
- [ ] Butonlar responsive
- [ ] Renkler uyumlu
- [ ] Animasyonlar smooth
- [ ] Mobil uyumlu

---

## 💡 İPUÇLARI

### QR Kod Tarama

**iOS:**
1. Kamera uygulamasını aç
2. QR koda tut
3. Üstte çıkan bildirme tıkla

**Android:**
1. Kamera aç
2. Google Lens ikonuna tıkla
3. QR koda tut

**Alternatif:**
- Herhangi bir QR okuyucu app
- Link'i manuel kopyala-yapıştır

### Test İçin Sahte Veri

Eğer henüz kayıt yoksa:

```bash
# Backend'de test verisi oluştur
cd server
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Attendance = require('./models/Attendance');
  const Employee = require('./models/Employee');
  
  const employees = await Employee.find().limit(10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let emp of employees) {
    await Attendance.create({
      employeeId: emp._id,
      date: today,
      checkIn: {
        time: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        method: 'CARD',
        location: emp.lokasyon || 'MERKEZ'
      }
    });
  }
  
  console.log('✅ 10 test kaydı oluşturuldu');
  process.exit(0);
});
"
```

---

## 📈 BEKLENİLEN SONUÇLAR

### İlk Açılışta

```
İçeride: 0
Devamsız: 0
Geç Kalan: 0
Eksik Kayıt: 0

Bugünkü Kayıtlar: Boş
```

### İlk Kayıt Sonrası

```
İçeride: 1
Devamsız: 0
Geç Kalan: 0
Eksik Kayıt: 0

Bugünkü Kayıtlar:
- Ahmet Yılmaz | 08:00 | - | - | MOBILE | INCOMPLETE
```

### İkinci Kayıt (Çıkış) Sonrası

```
İçeride: 0
Devamsız: 0
Geç Kalan: 0
Eksik Kayıt: 0

Bugünkü Kayıtlar:
- Ahmet Yılmaz | 08:00 | 17:00 | 8s 0dk | MOBILE | NORMAL
```

---

## 🚨 KRİTİK KONTROLLER

### 1. Token Güvenliği
```
✅ Random URL oluşuyor mu?
✅ 2 dakika sonra geçersiz oluyor mu?
✅ Aynı QR kod 2. kez çalışmıyor mu?
✅ Bugün zaten giriş yaptıysa engelliyor mu?
```

### 2. Veri Bütünlüğü
```
✅ Giriş saati doğru kaydediliyor mu?
✅ Çıkış saati doğru kaydediliyor mu?
✅ Çalışma süresi hesaplanıyor mu?
✅ İmza kaydediliyor mu?
✅ GPS kaydediliyor mu?
```

### 3. UI/UX
```
✅ Loading states gösteriliyor mu?
✅ Hata mesajları anlaşılır mı?
✅ Başarı mesajları görünüyor mu?
✅ Animasyonlar smooth mu?
```

---

## 🎉 BAŞARILI TEST SONUCU

Eğer tüm testler geçerse:

```
🎉 TEBRİKLER!

Sisteminiz %100 çalışır durumda!

✅ Backend API'ler çalışıyor
✅ Frontend sayfalar çalışıyor
✅ QR kod sistemi çalışıyor
✅ İmza sistemi çalışıyor
✅ Raporlama hazır
✅ Analitik çalışıyor

Artık canlı kullanıma hazır!
```

---

## 📞 DESTEK

### Hata Raporlama

Bir sorun bulursanız:

1. **Hata mesajını kopyalayın**
2. **Hangi sayfada olduğunuzu belirtin**
3. **Hangi adımda hata aldığınızı açıklayın**
4. **Console logları paylaşın** (F12 → Console)

### Özellik İstekleri

Ekstra özellik istiyorsanız:

- Mobil uygulama
- Yüz tanıma
- Biyometrik entegrasyon
- WhatsApp bildirimleri
- Excel otomatik import

---

**Hazırlayan:** AI Development Assistant  
**Tarih:** 10 Kasım 2025  
**Durum:** ✅ Test İçin Hazır

**Hemen test edin:** http://localhost:3000/qr-imza-yonetimi

🚀 **Başarılar!**


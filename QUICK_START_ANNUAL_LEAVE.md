# 🚀 Yıllık İzin Sistemi - Hızlı Başlangıç Kılavuzu

Bu kılavuz, yıllık izin sistemini hızlıca anlamanız ve kullanmanız için hazırlanmıştır.

---

## 📋 İZİN HESAPLAMA KURALLARI

### 1. 50 Yaş ve Üzeri
```
✅ 50 yaş ve üzeri çalışanlar → 20 gün yıllık izin
Örnek: 56 yaş, 6 yıl hizmet → 20 gün
```

### 2. 50 Yaş Altı + 5 Yıldan Az
```
✅ 50 yaş altı + 5 yıldan az hizmet → 14 gün yıllık izin
Örnek: 21 yaş, 1 yıl hizmet → 14 gün
```

### 3. 50 Yaş Altı + 5 Yıl ve Üzeri
```
✅ 50 yaş altı + 5 yıl ve üzeri hizmet → 20 gün yıllık izin
Örnek: 30 yaş, 6 yıl hizmet → 20 gün
```

### 4. İlk Yıl Çalışanlar
```
⚠️ İşe giriş yılı → 0 gün (ilk yıl hakediş yok)
Örnek: 2025'te işe giren → 2026'da hak kazanır
```

---

## 🔄 İZİN BİRİKİMİ

### Kullanılmayan İzinler
```
2024: 14 gün hak - 5 gün kullanım = +9 gün devir
2025: 14 gün hak + 9 gün devir = 23 gün kullanılabilir
```

### Fazla Kullanım
```
2024: 14 gün hak - 20 gün kullanım = -6 gün borç
2025: 20 gün hak - 6 gün borç = 14 gün kullanılabilir
```

---

## 💻 SİSTEM KULLANIMI

### 1. İzin Durumunu Görüntüleme
1. `http://localhost:3001/annual-leave` adresine gidin
2. Tüm çalışanların izin durumunu görüntüleyin
3. Filtreleme ve arama yapabilirsiniz

### 2. İzin Talebi Oluşturma
1. Çalışan adına tıklayın
2. Detay modalde başlangıç ve bitiş tarihi seçin
3. "İzin Talebi Oluştur" butonuna tıklayın

### 3. İzin Düzenleme
1. Liste üzerinde "✏️ Düzenle" ikonuna tıklayın
2. Tarihleri güncelleyin
3. "Kaydet" butonuna tıklayın

### 4. Excel Export
1. "Excel" butonuna tıklayın
2. Profesyonel rapor otomatik indirilir

---

## 📊 EKRAN GÖRÜNTÜLERİ

### Ana Sayfa
- **İstatistik Kartları:** Toplam çalışan, kullanılan izin, ortalama
- **İzin Kuralları:** Üstte bilgilendirme bölümü
- **DataGrid:** Tüm çalışanların listesi
- **Devir Kolonu:** Pozitif (yeşil) ve negatif (kırmızı) devir

### Çalışan Detay Modal
- **Kişisel Bilgiler:** Ad, yaş, hizmet yılı
- **İzin Durumu:** Hak edilen, kullanılan, kalan, devir
- **İzin Geçmişi:** Son 5 yıl
- **Yeni İzin Formu:** Tarih seçici ve not alanı

---

## 🎨 RENK KODLARI

### Kalan İzin
- 🟢 **Yeşil:** 10+ gün kalan (iyi durum)
- 🟡 **Sarı:** 5-10 gün kalan (dikkat)
- 🔴 **Kırmızı:** <5 gün veya negatif (acil)

### Devir
- 🟢 **Yeşil:** Pozitif devir (birikmiş izin)
- 🔴 **Kırmızı:** Negatif devir (borç)
- ⚫ **Gri:** Devir yok (-)

---

## 🔧 TROUBLESHOOTING

### Problem: İzin Hakkı Görünmüyor
**Çözüm:** Çalışan ilk yılında olabilir, bir sonraki yıl hak kazanacak

### Problem: Negatif Devir Görünüyor
**Çözüm:** Normal - Önceki yıllarda fazla kullanım yapılmış, sonraki yıllardan düşülecek

### Problem: Excel İndirilmiyor
**Çözüm:** Popup blocker'ı kontrol edin, backend'in çalıştığından emin olun

---

## 📞 DESTEK

Sorun yaşarsanız:
1. `ANNUAL_LEAVE_SYSTEM_ANALYSIS.md` dosyasına bakın
2. `ANNUAL_LEAVE_FINAL_REPORT.md` dosyasını okuyun
3. Sistem yöneticisine başvurun

---

**Kolay gelsin! 🎉**


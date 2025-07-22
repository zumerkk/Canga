# Canga Projesi

Bu proje, çalışan yönetimi, vardiya planlama ve servis rotaları yönetimi için geliştirilmiş bir web uygulamasıdır.

## Proje Yapısı

Proje iki ana bölümden oluşmaktadır:

### Client (Frontend)
- React tabanlı kullanıcı arayüzü
- Modern ve kullanıcı dostu tasarım
- Takvim, analitik grafikler ve veri yönetimi özellikleri

### Server (Backend)
- Node.js ve Express tabanlı API servisi
- MongoDB veritabanı bağlantısı
- Çalışan, vardiya ve servis rota verileri için modeller

## Özellikler

- 📅 Gelişmiş takvim ve vardiya planlama
- 📊 Analitik dashboard ve raporlama
- 👥 Çalışan veritabanı yönetimi
- 🚌 Servis rota planlama
- 📱 Mobil uyumlu arayüz
- 🔔 Bildirim sistemi

## Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- MongoDB
- npm veya yarn

### Backend Kurulumu
```bash
# Server klasörüne git
cd server

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# .env dosyasını düzenle (MongoDB bağlantı bilgilerini ekle)

# Server'ı başlat
npm start
```

### Frontend Kurulumu
```bash
# Client klasörüne git
cd client

# Bağımlılıkları yükle
npm install

# Uygulamayı geliştirme modunda başlat
npm start
```

## Katkıda Bulunma

1. Bu depoyu fork edin
2. Feature branch'i oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin yeni-ozellik`)
5. Pull Request açın

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

Geliştirici: [Zümer Kekillioğlu] 
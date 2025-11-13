# Google Maps API Key Kurulumu

## Client Tarafı için .env Dosyası Oluşturma

Client klasöründe `.env` dosyası oluşturun ve aşağıdaki içeriği ekleyin:

```bash
cd client
touch .env
```

`.env` dosyasının içeriği:

```
# Google Maps API Key
REACT_APP_GOOGLE_MAPS_KEY=AIzaSyBVgWu_2vvIhcUW3-Lb5lDpQ0Rw0M5N0OI

# API URL
REACT_APP_API_URL=http://localhost:5001
```

## Önemli Notlar:

1. `.env` dosyasını oluşturduktan sonra React uygulamasını yeniden başlatın:
   ```bash
   cd client
   npm start
   ```

2. Google Maps API Key'inizi production'da değiştirmeyi unutmayın!

3. API Key güvenliği için Google Cloud Console'da:
   - HTTP referrer kısıtlaması ekleyin
   - Sadece gerekli API'leri etkinleştirin (Maps JavaScript API, Places API, Geometry Library)

## Alternatif Çözüm

Eğer .env dosyası oluşturamazsanız, `client/src/components/SignatureDetailModal.js` dosyasında API key zaten hardcoded olarak eklenmiştir:

```javascript
googleMapsApiKey: "AIzaSyBVgWu_2vvIhcUW3-Lb5lDpQ0Rw0M5N0OI"
```

Bu geçici bir çözümdür, production'da mutlaka environment variable kullanın!

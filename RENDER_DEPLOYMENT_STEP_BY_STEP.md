# 🚀 Canga Vardiya Sistemi - Render.com Deployment Rehberi

## 📋 ÖN HAZIRLIK LİSTESİ

### ✅ Gereksinimler
- [ ] MongoDB Atlas hesabı (ücretsiz tier yeterli)
- [ ] Render.com hesabı
- [ ] GitHub repository (kodlar push edilmiş olmalı)
- [ ] Environment değişkenleri listesi

## 🔧 1. MONGOdb ATLAS KURULUMU

### MongoDB Atlas Bağlantı String Hazırlığı
1. [MongoDB Atlas](https://cloud.mongodb.com) hesabınıza girin
2. **Database** → **Connect** tıklayın
3. **Drivers** → **Node.js** seçin
4. Connection string'i kopyalayın:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxxx.mongodb.net/<database_name>
   ```

### Network Access Ayarları
- **Network Access** → **Add IP Address** 
- **Allow Access from Anywhere** seçin (0.0.0.0/0)

## 🖥️ 2. BACKEND WEB SERVICE KURULUMU

### Render.com'da Backend Service Oluşturma

1. **Render Dashboard** → **New +** → **Web Service**
2. GitHub repository'nizi seçin
3. Ayarları yapılandırın:

#### Temel Ayarlar:
- **Name**: `canga-api` 
- **Region**: `Frankfurt` (Avrupa'ya yakın)
- **Branch**: `main`
- **Runtime**: `Node`

#### Build & Start Komutları:
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### Environment Variables (Ortam Değişkenleri):

**⚠️ KRİTİK - Bu değişkenleri mutlaka ayarlayın:**

| Key | Value | Açıklama |
|-----|-------|----------|
| `NODE_ENV` | `production` | Production modu |
| `PORT` | `5000` | Render otomatik atayacak |
| `MONGODB_URI` | `mongodb+srv://...` | **Atlas connection string** |
| `JWT_SECRET` | `random_32_char_string` | **Güçlü secret key** |
| `JWT_EXPIRE` | `30d` | Token süresi |

**📝 İsteğe Bağlı (Gelişmiş Özellikler için):**

| Key | Value | Açıklama |
|-----|-------|----------|
| `REDIS_HOST` | `localhost` | Redis cache |
| `REDIS_PORT` | `6379` | Redis port |
| `LOG_LEVEL` | `info` | Log seviyesi |
| `GOOGLE_AI_API_KEY` | `your_key` | AI analiz için |

## 🌐 3. FRONTEND STATIC SITE KURULUMU  

### Render.com'da Frontend Service Oluşturma

1. **New +** → **Static Site**
2. Aynı GitHub repository'yi seçin
3. Ayarları yapılandırın:

#### Temel Ayarlar:
- **Name**: `canga-frontend`
- **Branch**: `main` 
- **Root Directory**: `client`

#### Build Ayarları:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`

#### Environment Variables:

| Key | Value | Açıklama |
|-----|-------|----------|
| `REACT_APP_API_URL` | `https://canga-api.onrender.com` | **Backend URL** |

**⚠️ DİKKAT**: Backend service deploy edildikten sonra gerçek URL'i buraya yazın!

## 🔄 4. DEPLOYMENT SÜRECİ

### Sıralama Önemlı:
1. **İlk önce Backend** deploy edin
2. Backend URL'ini alın
3. **Sonra Frontend** deploy edin, `REACT_APP_API_URL`'e backend URL'ini yazın

### Backend Deploy Kontrolü:
```bash
# Backend sağlık kontrolü
curl https://canga-api.onrender.com/api/health
```

Başarılı yanıt:
```json
{
  "status": "OK",
  "message": "Canga Vardiya Sistemi API çalışıyor! 🚀",
  "services": {
    "mongodb": "connected",
    "redis": "disconnected"
  }
}
```

## 🛠️ 5. RENDER.YAML İLE OTOMATIK DEPLOY

Mevcut `render.yaml` dosyanızı güncelleyebiliriz:

### Güncellenmiş render.yaml:
```yaml
services:
  # Backend API servisi
  - type: web
    name: canga-api
    env: node
    region: frankfurt
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: JWT_SECRET
        generateValue: true  # Render otomatik oluşturacak
      - key: JWT_EXPIRE
        value: 30d
      - key: MONGODB_URI
        sync: false  # Manuel girmeniz gerek

  # Frontend static site
  - type: web
    name: canga-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: REACT_APP_API_URL
        fromService:
          name: canga-api
          type: web
          property: url
```

## 🔒 6. GÜVENLİK AYARLARI

### JWT Secret Oluşturma:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### MongoDB Network Security:
- IP whitelist: `0.0.0.0/0` (Render için gerekli)
- Database user: Read/Write yetkisi

## 🚨 7. SORUN GİDERME

### Yaygın Hatalar:

#### MongoDB Bağlantı Hatası:
```
MongoServerError: bad auth
```
**Çözüm**: MongoDB Atlas'ta username/password kontrol edin

#### CORS Hatası:
```
CORS policy error
```
**Çözüm**: Backend'de `CLIENT_URL` environment variable'ını frontend URL'i ile ayarlayın

#### Build Hatası:
```
npm ERR! code ERESOLVE
```
**Çözüm**: Package.json dependency conflict'leri çözün

## 📊 8. PERFORMANS OPTİMİZASYONU

### Render.com Özellikleri:
- **Auto-scaling**: Otomatik
- **CDN**: Global edge locations
- **SSL**: Otomatik HTTPS
- **Monitoring**: Render dashboard

### Önerilen Ayarlar:
- **Backend**: Starter plan ($7/ay) 
- **Frontend**: Ücretsiz static hosting
- **MongoDB**: Atlas Free Tier (512MB)

## 🔍 9. DEPLOYMENT SONRASI KONTROLLER

### Test URL'leri:
```bash
# Backend API
https://canga-api.onrender.com/api/health

# Frontend
https://canga-frontend.onrender.com

# Test login
https://canga-frontend.onrender.com/login
```

### Başarılı Deployment İşaretleri:
- ✅ API health check başarılı
- ✅ Frontend yükleniyor
- ✅ Login sayfası açılıyor
- ✅ MongoDB bağlantısı aktif

---

## 📞 DESTEK

Deployment sırasında sorun yaşarsanız:
1. Render logs'unu kontrol edin
2. Environment variables'ları doğrulayın
3. MongoDB Atlas network ayarlarını kontrol edin
4. GitHub repository'nin güncel olduğundan emin olun

**🎉 Başarıyla deploy ettikten sonra sisteminiz canlı ortamda çalışacak!**

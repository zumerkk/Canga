# 🔧 Render.com Troubleshooting Guide

## Sorun: QR Linkleri Hala 404 Veriyor

### ✅ Kontrol Listesi:

#### 1. **GitHub Son Commit Kontrolü**
```bash
# Local'de kontrol et
cd /Users/zumerkekillioglu/Desktop/Canga
git log -1 --oneline

# Beklenen çıktı:
# 3b953e9 fix: Render.com SPA routing sorunu çözüldü
```

#### 2. **Render.com Deploy Kontrolü**
- Dashboard → canga-frontend → Events
- Son deploy: **"3b953e9"** commit hash'i olmalı
- Status: **"Deploy live"** (yeşil tick ✅)

#### 3. **Build Logs İnceleme**
Şu satırı arayın:
```
cp public/_redirects build/_redirects
```

Eğer YOKSA → Build command'i doğru çalışmamış demektir.

#### 4. **render.yaml Kontrolü**
```yaml
buildCommand: cd client && npm install && npm run build && cp public/_redirects build/_redirects && (cp render.json build/render.json || true)
```

### 🚨 Acil Çözümler:

#### **Çözüm 1: Manuel Build Command Güncelleme**

Render Dashboard'da:
1. **canga-frontend** → Settings
2. **Build Command** alanını bulun
3. Şunu yapıştırın:
```bash
cd client && npm ci && npm run build && cp -v public/_redirects build/_redirects
```
4. **Save Changes**
5. **Manual Deploy** → Deploy

#### **Çözüm 2: _redirects Dosyasını Manuel Kontrol**

Deploy tamamlandıktan sonra, Render.com'un Shell'ini kullanın:
1. Dashboard → canga-frontend → Shell (üst menüde)
2. Komut çalıştırın:
```bash
ls -la build/_redirects
cat build/_redirects
```

Dosya VARSA içeriği şöyle olmalı:
```
# SPA routing fix for Render.com / Netlify / Vercel
# Tüm route'ları index.html'e yönlendir (React Router için)

# API çağrıları - proxy değil, direkt backend'e
/api/*  https://canga-api.onrender.com/api/:splat  200

# Diğer tüm route'lar - React Router'a yönlendir
/*    /index.html   200
```

#### **Çözüm 3: Static Site Settings**

Dashboard → canga-frontend → Settings → **Redirect Rules**

Manuel olarak ekleyin:
```
Source: /*
Destination: /index.html
Action: Rewrite
```

#### **Çözüm 4: Headers Kontrolü**

Settings → **Headers**
```
/*
  Cache-Control: public, max-age=0, must-revalidate

/static/*
  Cache-Control: public, max-age=31536000, immutable
```

### 📞 Render.com Support

Eğer hiçbir şey çalışmazsa:
1. https://render.com/support
2. Ticket açın:
```
Subject: Static site SPA routing not working
Body:
- Service: canga-frontend (srv-dlvmto6mcj7s73fho4u0)
- Issue: Direct URLs return 404
- _redirects file exists in build/ but not working
- Commit: 3b953e9
```

### 🔍 Debug Komutları

#### **Browser Console'da Test:**
```javascript
// Sayfa yüklenmiş mi?
console.log('React Router loaded:', window.location.pathname);

// API endpoint test
fetch('https://canga-api.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log);
```

#### **Network Tab İnceleme:**
1. F12 → Network
2. URL'e git: /sistem-imza/abc123
3. İlk request'e bak:
   - Status: **200** olmalı (404 değil!)
   - Response: **index.html** içeriği olmalı

### ✅ Başarılı Deploy Göstergeleri:

```
✅ Build logs'da: "cp public/_redirects build/_redirects"
✅ Deploy status: "Live" (yeşil)
✅ Browser Network: 200 status code
✅ index.html yükleniyor
✅ React Router devreye giriyor
✅ /sistem-imza/[token] çalışıyor
```

### 📊 Alternatif Platform Önerileri:

Eğer Render.com'da çözülemezse:

1. **Vercel** (Önerilen - SPA için mükemmel):
   ```bash
   npm i -g vercel
   cd client
   vercel --prod
   ```

2. **Netlify** (Otomatik _redirects desteği):
   - GitHub'a bağla
   - Auto-deploy
   - _redirects otomatik çalışır

3. **Cloudflare Pages**:
   - Ücretsiz
   - Hızlı CDN
   - SPA routing built-in

---

**Son Güncelleme:** 13 Kasım 2024
**Build Hash:** 3b953e9


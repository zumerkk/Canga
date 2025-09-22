# 🔐 Canga Vardiya Sistemi - Render Environment Variables Setup

## 📋 MEVCUT .ENV BİLGİLERİNİZDEN RENDER İÇİN HAZIRLAMA

### ✅ KRİTİK DEĞERLER (Mutlaka Gerekli)

**Render.com Dashboard'da Environment Variables bölümüne bunları ekleyin:**

| Key | Value | Kaynak |
|-----|-------|--------|
| `MONGODB_URI` | `mongodb+srv://thebestkekilli:2002.2002@canga.rgadvdl.mongodb.net/canga?retryWrites=true&w=majority&appName=canga` | ✅ Mevcut |
| `NODE_ENV` | `production` | ⚠️ development → production değiştirin |
| `PORT` | `5000` | ⚠️ 5001 → 5000 (Render standart) |
| `JWT_SECRET` | **YENİ OLUŞTURUN** | ⚠️ Güvenlik için yeni secret |

### 🔄 FRONTEND İÇİN GÜNCELLEME

| Key | Value | Açıklama |
|-----|-------|----------|
| `REACT_APP_API_URL` | `https://canga-api.onrender.com` | Backend URL (deploy sonrası) |

### 📊 İSTEĞE BAĞLI DEĞERLER

| Key | Value | Durum |
|-----|-------|-------|
| `LOG_LEVEL` | `info` | ✅ Kullanılabilir |
| `MAX_FILE_SIZE` | `10485760` | ✅ Kullanılabilir |
| `DB_NAME` | `canga-vardiya-sistemi` | ✅ Kullanılabilir |
| `MAX_POOL_SIZE` | `10` | ✅ Kullanılabilir |

### ❌ KULLANILMAYACAKLAR (Local Development)

Bu değerleri Render'a eklemeyin:
- `CLIENT_URL` (Frontend URL farklı olacak)
- `FRONTEND_URL` (Otomatik ayarlanacak)
- `REDIS_URL` (Redis service yoksa)
- `SENTRY_DSN` (Henüz setup edilmemiş)
- `NEW_RELIC_LICENSE_KEY` (Henüz setup edilmemiş)

---

## 🚀 RENDER DEPLOYMENT ADIM ADIM

### 1️⃣ Güvenli JWT Secret Oluştur
```bash
node generate-env-secrets.js
```

### 2️⃣ MongoDB Atlas Kontrol
✅ Connection string'iniz hazır: `mongodb+srv://thebestkekilli:...`

**Kontrol edilecekler:**
- [ ] MongoDB Atlas'ta IP whitelist: `0.0.0.0/0` ekli mi?
- [ ] Database user aktif mi?
- [ ] Connection test edildi mi?

### 3️⃣ Render.com Environment Variables

**Backend Service (canga-api) için:**
```
MONGODB_URI=mongodb+srv://thebestkekilli:2002.2002@canga.rgadvdl.mongodb.net/canga?retryWrites=true&w=majority&appName=canga
NODE_ENV=production
PORT=5000
JWT_SECRET=[YENİ_GENERATE_EDİLEN_SECRET]
JWT_EXPIRE=30d
LOG_LEVEL=info
MAX_FILE_SIZE=10485760
DB_NAME=canga-vardiya-sistemi
MAX_POOL_SIZE=10
```

**Frontend Service (canga-frontend) için:**
```
REACT_APP_API_URL=https://canga-api.onrender.com
```

---

## 🔧 MONGODB ATLAS TEST

Mevcut connection string'inizi test edelim:

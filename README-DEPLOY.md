# Canga Projesi - Render.com Deployment Rehberi

Bu rehber, Canga projesini Render.com üzerinde nasıl deploy edeceğinizi adım adım anlatmaktadır.

## Ön Hazırlık

### MongoDB Veritabanı Hazırlama

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) üzerinde hesap oluşturun
2. Yeni bir cluster oluşturun (ücretsiz shared cluster yeterli olacaktır)
3. Database erişimi için kullanıcı oluşturun
4. IP erişim listesine `0.0.0.0/0` ekleyin (tüm IP'lerden erişime izin vermek için)
5. Connection string'i kopyalayın (örn: `mongodb+srv://username:password@cluster.mongodb.net/canga`)

## Render.com Üzerinden Deployment

### 1. Render.com Hesabı Oluşturma

1. [Render.com](https://render.com/) adresine gidin
2. "Sign Up" butonuna tıklayın
3. GitHub hesabınızla giriş yapın ve GitHub reponuzu bağlayın

### 2. Backend (API) Servisi Oluşturma

1. Render.com Dashboard'dan "New +" butonuna tıklayın
2. "Web Service" seçeneğini seçin
3. GitHub reponuzu seçin
4. Şu bilgileri girin:
   - **Name**: `canga-api` (veya istediğiniz bir isim)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. "Advanced" butonuna tıklayın ve şu environment variable'ları ekleyin:
   - `PORT`: `10000` (Render, otomatik olarak PORT environment variable'ını sağlar, ancak kodunuzda bu değişkeni kullanabilmeniz için yine de tanımlıyoruz)
   - `MONGODB_URI`: MongoDB Atlas connection string'iniz
   - `JWT_SECRET`: Güvenli bir JWT token anahtarı
   - `JWT_EXPIRE`: `30d` (veya istediğiniz süre)
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: Frontend URL'niz (henüz yoksa daha sonra ekleyebilirsiniz)

6. "Create Web Service" butonuna tıklayın

### 3. Frontend (Static Site) Servisi Oluşturma

1. Render.com Dashboard'dan tekrar "New +" butonuna tıklayın
2. "Static Site" seçeneğini seçin
3. GitHub reponuzu seçin
4. Şu bilgileri girin:
   - **Name**: `canga-frontend` (veya istediğiniz bir isim)
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

5. "Advanced" butonuna tıklayın ve şu environment variable'ı ekleyin:
   - `REACT_APP_API_URL`: Backend servisinizin URL'i (örn: `https://canga-api.onrender.com`)

6. "Create Static Site" butonuna tıklayın

## Deployment Sonrası

1. Her iki servisin de başarıyla deploy edildiğinden emin olun
2. Frontend URL'inizi kullanarak uygulamaya erişin
3. Herhangi bir hata durumunda Render.com Logs bölümünü kontrol edin

## Otomatik Deployment

Render.com, GitHub reponuza yeni bir commit gönderdiğinizde otomatik olarak yeniden deploy yapar. Bu özellik varsayılan olarak açıktır ve her güncellemeden sonra projeniz otomatik olarak güncellenir.

## Render.yaml ile Deployment (Alternatif)

Bu repo'da bulunan `render.yaml` dosyası ile tüm servislerinizi tek seferde deploy edebilirsiniz:

1. Render.com Dashboard'dan "New +" butonuna tıklayın
2. "Blueprint" seçeneğini seçin 
3. GitHub reponuzu seçin
4. Render otomatik olarak render.yaml dosyasını bulup servislerinizi oluşturacaktır

> **Not**: Blueprint kullanırken, yine de hassas bilgileri (JWT_SECRET, MONGODB_URI gibi) manuel olarak Render.com dashboard'dan eklemeniz gerekecektir. 
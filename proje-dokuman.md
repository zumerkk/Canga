# 📋 Canga Vardiya Yönetim Sistemi - Proje Dökümantasyonu

## 📌 Proje Genel Bakış

**Canga Vardiya Yönetim Sistemi**, Çanga Savunma Endüstrisi Ltd. Şti. için özel olarak geliştirilmiş kapsamlı bir **çalışan, vardiya ve servis yönetim platformudur**. Sistem, savunma endüstrisinin yüksek güvenlik ve detaylı raporlama gereksinimlerini karşılamak üzere tasarlanmıştır.

### 🎯 Proje Amacı

Sistem, şirket içerisindeki tüm personel yönetimi, vardiya planlaması, servis rotaları, yıllık izin takibi, giriş-çıkış kayıtları ve kapsamlı raporlama süreçlerini dijitalleştirerek:
- ✅ Manuel süreçleri otomatikleştirme
- ✅ Gerçek zamanlı takip ve raporlama
- ✅ Excel entegrasyonu ile kolay veri aktarımı
- ✅ QR kod tabanlı dijital imza sistemi
- ✅ Yapay zeka destekli anomali tespiti
- ✅ Coğrafi konum bazlı takip ve harita görselleştirme

### 📊 Proje Bilgileri

| Özellik | Detay |
|---------|-------|
| **Proje Adı** | CangaZMK - Çanga Vardiya Yönetim Sistemi |
| **Versiyon** | 2.0.0 |
| **Geliştirici** | Zümer Kekillioğlu |
| **Kurum** | Çanga Savunma Endüstrisi Ltd. Şti. |
| **Lisans** | ISC |
| **Repository** | https://github.com/zumerkk/CangaZMK |

---

## 🏗️ Sistem Mimarisi

Proje **monorepo yapısında** geliştirilmiş olup, **client-server** mimarisini kullanmaktadır.

```
Canga/
├── client/          # React Frontend (Port: 3000)
├── server/          # Node.js Backend API (Port: 5001)
├── package.json     # Root package - dev scripts
└── render.yaml      # Deployment configuration
```

### 🔧 Teknoloji Stack

#### **Frontend (Client)**
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **React** | 18.2.0 | UI Framework |
| **Material-UI** | 5.14.20 | UI Component Library |
| **React Router** | 6.20.1 | Routing |
| **FullCalendar** | 6.1.9 | Takvim ve vardiya görselleştirme |
| **Chart.js** | 4.5.0 | Veri görselleştirme |
| **Leaflet** | 1.9.4 | Harita entegrasyonu |
| **React Beautiful DnD** | 13.1.1 | Drag & drop işlemleri |
| **Axios** | 1.6.2 | HTTP istekleri |
| **Moment.js** | 2.30.1 | Tarih işlemleri |
| **ExcelJS** | 4.4.0 | Excel dosya işlemleri |
| **React Hot Toast** | 2.5.2 | Bildirimler |
| **jsPDF** | 2.5.2 | PDF oluşturma |
| **QRCode** | - | QR kod görselleştirme |

#### **Backend (Server)**
| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Node.js** | - | Runtime Environment |
| **Express** | 4.18.2 | Web Framework |
| **MongoDB** | - | Veritabanı (Mongoose 8.16.1) |
| **Redis** | 5.8.2 | Cache & Session yönetimi |
| **JWT** | 9.0.2 | Authentication |
| **Bcrypt** | 2.4.3 | Şifre hashleme |
| **ExcelJS** | 4.4.0 | Excel işlemleri |
| **QRCode** | 1.5.3 | QR kod üretimi |
| **Multer** | 1.4.5 | Dosya yükleme |
| **Winston** | 3.17.0 | Logging sistemi |
| **Sentry** | 10.12.0 | Error tracking |
| **New Relic** | 13.3.2 | APM Monitoring |
| **Node-Cron** | 3.0.3 | Zamanlanmış görevler |
| **Groq SDK** | 0.3.3 | AI Entegrasyonu (LLM) |
| **Google Generative AI** | 0.24.1 | Gemini AI entegrasyonu |
| **Moment.js** | 2.29.4 | Tarih işlemleri |
| **Axios** | 1.10.0 | HTTP Client |

---

## 🗄️ Veritabanı Yapısı

Sistem **MongoDB** kullanmakta olup, aşağıdaki ana koleksiyonlara sahiptir:

### 1️⃣ **Employee (Çalışan Modeli)**
Tüm çalışan bilgilerini tutar. Excel dosyalarından import edilen yapıya uygun tasarlanmıştır.

**Temel Alanlar:**
- `employeeId`: Otomatik oluşturulan benzersiz ID
- `adSoyad`: Ad soyad (string, required)
- `tcNo`: TC Kimlik No (unique, sparse)
- `cepTelefonu`: Cep telefonu
- `dogumTarihi`: Doğum tarihi
- `pozisyon`: Pozisyon (string, required)
- `departman`: Departman (dinamik - enum yok)
- `lokasyon`: Lokasyon (MERKEZ, İŞİL, OSB)
- `iseGirisTarihi`: İşe giriş tarihi
- `durum`: Çalışan durumu (AKTIF, İZİNLİ, AYRILDI, vb.)
- `ayrilmaTarihi`: İşten ayrılma tarihi
- `ayrilmaSebebi`: Ayrılma sebebi
- `servisYoluGuzergah`: Servis güzergahı
- `acilDurumKisi`: Acil durum kişisi
- `acilDurumTelefon`: Acil durum telefonu

**İzin ve Kıdem Bilgileri:**
- `izinGunu`: Toplam izin günü hakkı
- `kullanilanIzin`: Kullanılan izin günü
- `kalanIzin`: Kalan izin günü (virtual)
- `kidem`: Kıdem yılı (hesaplanan)

**Özel Gruplar:**
- `ozelGrup`: Özel grup (ÇIRAK, STAJYER, vb.)
- `supervisor`: Sorumlu kişi

**Metadata:**
- `createdAt`, `updatedAt`: Zaman damgaları
- `notlar`: Ek notlar

### 2️⃣ **Shift (Vardiya Modeli)**
Vardiya planlamalarını tutar. Excel yapısına uygun tasarlanmıştır.

**Temel Bilgiler:**
- `title`: Vardiya başlığı
- `startDate`, `endDate`: Başlangıç ve bitiş tarihleri
- `location`: Lokasyon
- `status`: Durum (TASLAK, ONAYLANDI, YAYINLANDI, TAMAMLANDI, İPTAL)

**Sorumlular:**
- `generalManager`: Fabrika Genel Sorumlusu
- `departmentManager`: Bölüm Sorumlusu
- `supervisor`: Ustabaşı

**Vardiya Grupları (`shiftGroups[]`):**
- `groupName`: Grup adı (Montaj, Kaynak, vb.)
- `sectionManager`: Bölüm sorumlusu
- `sectionSupervisor`: Bölüm ustabaşı
- `shifts[]`: Vardiya saatleri
  - `timeSlot`: Saat aralığı (HH:MM-HH:MM formatı)
  - `employees[]`: Çalışanlar
    - `employeeId`: Çalışan referansı
    - `name`: Ad soyad
    - `entryTime`, `exitTime`: Giriş-çıkış saatleri
    - `signature`: İmza
    - `status`: Durum (PLANLANDI, GELDİ, GİTTİ, DEVAMSIZ, İZİNLİ)
  - `totalHours`: Toplam çalışma saati (yemek molası düşülmüş)

**Özel Gruplar (`specialGroups[]`):**
- Stajyerler, çıraklar, fazla mesai listeleri

### 3️⃣ **User (Kullanıcı Modeli)**
Sisteme giriş yapan kullanıcıları yönetir.

- `username`: Kullanıcı adı (unique)
- `password`: Hashlenmiş şifre (bcrypt)
- `email`: E-posta
- `role`: Rol (ADMIN, MANAGER, SUPERVISOR, USER)
- `employeeId`: Bağlı çalışan (opsiyonel)
- `isActive`: Aktif mi?
- `lastLogin`: Son giriş zamanı

### 4️⃣ **Attendance (Giriş-Çıkış Modeli)**
Çalışanların günlük giriş-çıkış kayıtlarını tutar.

- `employeeId`: Çalışan referansı
- `date`: Tarih
- `checkIn`: Giriş zamanı
- `checkOut`: Çıkış zamanı
- `method`: Giriş yöntemi (QR, MANUAL, BIOMETRIC, CARD, MOBILE)
- `location`: Giriş lokasyonu
- `coordinates`: GPS koordinatları
- `signature`: Dijital imza
- `photo`: Fotoğraf URL
- `status`: Durum (PRESENT, ABSENT, LATE, EARLY_LEAVE, LEAVE)
- `workHours`: Toplam çalışma saati

### 5️⃣ **AnnualLeave (Yıllık İzin Modeli)**
Yıllık izin talep ve onay süreçlerini yönetir.

- `employeeId`: Çalışan referansı
- `startDate`, `endDate`: İzin tarihleri
- `totalDays`: Toplam gün sayısı
- `leaveType`: İzin türü (ANNUAL, SICK, MATERNITY, UNPAID, vb.)
- `status`: Durum (PENDING, APPROVED, REJECTED, CANCELLED)
- `reason`: İzin sebebi
- `approvedBy`: Onaylayan kişi
- `approvedAt`: Onay tarihi
- `rejectionReason`: Red sebebi

### 6️⃣ **ServiceRoute (Servis Rotası Modeli)**
Servis araçlarının güzergah bilgilerini tutar.

- `routeName`: Rota adı
- `routeCode`: Rota kodu (unique)
- `location`: Lokasyon (MERKEZ, İŞİL, OSB)
- `shiftTime`: Vardiya saati
- `vehicle`: Araç bilgileri
- `driver`: Sürücü bilgileri
- `stops[]`: Durak listesi
  - `order`: Durak sırası
  - `stopName`: Durak adı
  - `address`: Adres
  - `coordinates`: GPS koordinatları
  - `passengers[]`: Yolcu listesi
  - `estimatedArrival`: Tahmini varış
- `status`: Durum (ACTIVE, INACTIVE, SCHEDULED)

### 7️⃣ **AttendanceToken (QR Token Modeli)**
Kişiye özel QR kod token'larını tutar.

- `token`: Benzersiz token (UUID)
- `employeeId`: Çalışan referansı
- `type`: Token türü (CHECK_IN, CHECK_OUT, SIGNATURE)
- `expiresAt`: Son kullanma tarihi
- `usedAt`: Kullanım zamanı
- `status`: Durum (ACTIVE, USED, EXPIRED)

### 8️⃣ **SystemQRToken (Sistem QR Token Modeli)**
Paylaşımlı sistem QR kodlarını tutar.

- `token`: Benzersiz token
- `location`: Lokasyon
- `deviceId`: Cihaz ID
- `purpose`: Amaç (ENTRY, EXIT, SIGNATURE)
- `expiresAt`: Son kullanma
- `usageCount`: Kullanım sayısı
- `status`: Durum

### 9️⃣ **JobApplication (İş Başvurusu Modeli)**
İK iş başvurularını yönetir.

- `formData`: Form verileri (JSON)
- `status`: Durum (NEW, REVIEWED, SHORTLISTED, REJECTED, HIRED)
- `reviewedBy`: İnceleyen kişi
- `notes`: Notlar
- `attachments`: Ek dosyalar

### 🔟 **Notification (Bildirim Modeli)**
Sistem bildirimlerini tutar.

- `userId`: Hedef kullanıcı
- `type`: Tip (INFO, WARNING, ERROR, SUCCESS)
- `title`: Başlık
- `message`: Mesaj
- `read`: Okundu mu?
- `link`: İlgili sayfa linki

---

## 🚀 Ana Özellikler ve Modüller

### 1. 👥 **Çalışan Yönetimi (Employee Management)**

**Dosyalar:**
- `client/src/pages/Employees.js`
- `server/routes/employees.js`
- `server/models/Employee.js`

**Özellikler:**
- ✅ Çalışan CRUD işlemleri
- ✅ Excel'den toplu import/export
- ✅ Gelişmiş filtreleme ve arama
- ✅ Departman ve lokasyon bazlı gruplandırma
- ✅ Çalışan detay modal penceresi
- ✅ Toplu düzenleme (Bulk Edit)
- ✅ Fotoğraf yükleme
- ✅ İzin hakları takibi
- ✅ Kıdem hesaplama

**API Endpoints:**
```
GET    /api/employees              - Tüm çalışanları listele
GET    /api/employees/:id          - Çalışan detayı
POST   /api/employees              - Yeni çalışan ekle
PUT    /api/employees/:id          - Çalışan güncelle
DELETE /api/employees/:id          - Çalışan sil
GET    /api/employees/stats        - Çalışan istatistikleri
POST   /api/employees/bulk-update  - Toplu güncelleme
```

### 2. 🚪 **İşten Ayrılanlar (Former Employees)**

**Dosyalar:**
- `client/src/pages/FormerEmployees.js`

**Özellikler:**
- ✅ İşten ayrılan çalışanların ayrı takibi
- ✅ Ayrılma tarihi ve sebebi
- ✅ Geçmiş kayıtlar
- ✅ Raporlama

### 3. 🎓 **Stajyer ve Çırak Yönetimi**

**Dosyalar:**
- `client/src/pages/TraineesAndApprentices.js`

**Özellikler:**
- ✅ Stajyer ve çırakların ayrı takibi
- ✅ Sorumlu atama
- ✅ Eğitim süreci takibi
- ✅ Özel raporlama

### 4. 📅 **Vardiya Yönetimi (Shift Management)**

**Dosyalar:**
- `client/src/pages/Shifts.js`
- `client/src/pages/CreateShift.js`
- `server/routes/shifts.js`
- `server/models/Shift.js`

**Özellikler:**
- ✅ Vardiya oluşturma ve düzenleme
- ✅ Çoklu zaman dilimi desteği
- ✅ Grup bazlı vardiya planlaması
- ✅ Dinamik departman ve saat aralığı
- ✅ Çalışan atama (Drag & Drop)
- ✅ Giriş-çıkış saatleri
- ✅ Dijital imza alanları
- ✅ Excel export (Resmi vardiya listesi formatında)
- ✅ Yemek molası hesaplaması
- ✅ Toplam çalışma saati hesaplama
- ✅ Onay süreci

**Vardiya Durumları:**
- TASLAK: Henüz tamamlanmamış
- ONAYLANDI: Yönetici onayından geçmiş
- YAYINLANDI: Çalışanlara duyurulmuş
- TAMAMLANDI: Vardiya tamamlanmış
- İPTAL: İptal edilmiş

**API Endpoints:**
```
GET    /api/shifts                 - Vardiya listesi
GET    /api/shifts/:id             - Vardiya detayı
POST   /api/shifts                 - Yeni vardiya
PUT    /api/shifts/:id             - Vardiya güncelle
DELETE /api/shifts/:id             - Vardiya sil
POST   /api/shifts/:id/approve     - Vardiya onayla
POST   /api/shifts/:id/publish     - Vardiya yayınla
GET    /api/shifts/export/:id      - Excel export
```

### 5. 🗓️ **Takvim ve Ajanda (Calendar)**

**Dosyalar:**
- `client/src/pages/Calendar.js`
- `client/src/components/Calendar/VacationManager.js`
- `client/src/components/Calendar/SmartFilters.js`
- `server/routes/calendar.js`

**Özellikler:**
- ✅ FullCalendar entegrasyonu
- ✅ Vardiya görselleştirme
- ✅ İzin takibi
- ✅ Drag & drop ile vardiya düzenleme
- ✅ Çoklu görünüm (Aylık, Haftalık, Günlük, Liste)
- ✅ Renk kodlu kategoriler
- ✅ Akıllı filtreleme
- ✅ Mobil uyumlu

### 6. 📆 **Yıllık İzin Takibi (Annual Leave)**

**Dosyalar:**
- `client/src/pages/AnnualLeave.js`
- `client/src/pages/AnnualLeaveEditPage.js`
- `server/routes/annualLeave.js`
- `server/models/AnnualLeave.js`

**Özellikler:**
- ✅ İzin talep sistemi
- ✅ Çoklu onay süreci
- ✅ İzin bakiyesi takibi
- ✅ İzin türleri (Yıllık, Mazeret, Doğum, Ücretsiz, vb.)
- ✅ Takvim entegrasyonu
- ✅ Çakışma kontrolü
- ✅ Otomatik izin hesaplama
- ✅ Excel export/import
- ✅ Detaylı raporlama

**İzin Türleri:**
- ANNUAL: Yıllık izin
- SICK: Hastalık izni
- MATERNITY: Doğum izni
- PATERNITY: Babalık izni
- UNPAID: Ücretsiz izin
- EXCUSED: Mazeret izni

**API Endpoints:**
```
GET    /api/annual-leave                    - İzin listesi
GET    /api/annual-leave/employee/:id       - Çalışan izinleri
POST   /api/annual-leave                    - İzin talebi
PUT    /api/annual-leave/:id                - İzin güncelle
POST   /api/annual-leave/:id/approve        - İzin onayla
POST   /api/annual-leave/:id/reject         - İzin reddet
GET    /api/annual-leave/balance/:employeeId - İzin bakiyesi
```

### 7. 🕐 **Giriş-Çıkış Takibi (Attendance)**

**Dosyalar:**
- `server/routes/attendance.js`
- `server/routes/attendanceQR.js`
- `server/models/Attendance.js`
- `server/models/AttendanceToken.js`

**Özellikler:**
- ✅ Çoklu giriş yöntemi (QR, Manuel, Biyometrik, Kart, Mobil)
- ✅ QR kod tabanlı check-in/check-out
- ✅ GPS lokasyon kaydetme
- ✅ Dijital imza
- ✅ Fotoğraf çekme
- ✅ Geç kalma ve erken çıkış tespiti
- ✅ Otomatik çalışma saati hesaplama
- ✅ Excel export
- ✅ Günlük/Haftalık/Aylık raporlar

**Giriş Yöntemleri:**
- QR: QR kod okutma
- MANUAL: Manuel kayıt
- BIOMETRIC: Parmak izi/Yüz tanıma
- CARD: Kart okutma
- MOBILE: Mobil uygulama

**API Endpoints:**
```
POST   /api/attendance/check-in           - Giriş kaydı
POST   /api/attendance/check-out          - Çıkış kaydı
GET    /api/attendance/employee/:id       - Çalışan devamsızlık kayıtları
GET    /api/attendance/report/daily       - Günlük rapor
GET    /api/attendance/report/monthly     - Aylık rapor
POST   /api/attendance-qr/generate        - QR kod üret
POST   /api/attendance-qr/verify          - QR kod doğrula
```

### 8. 📱 **QR Kod ve İmza Sistemi**

**Dosyalar:**
- `client/src/pages/QRImzaYonetimi.js`
- `client/src/pages/QRCodeGenerator.js`
- `client/src/pages/SignaturePage.js`
- `client/src/pages/SystemSignaturePage.js`
- `server/routes/systemQR.js`
- `server/models/SystemQRToken.js`

**Özellikler:**
- ✅ Kişiye özel QR kod üretimi
- ✅ Sistem geneli paylaşımlı QR kodlar
- ✅ Token süre yönetimi
- ✅ Dijital imza canvas
- ✅ İmza kaydetme ve görüntüleme
- ✅ Token kullanım takibi
- ✅ Otomatik token temizleme (Cron job)
- ✅ Public access (şifre gerektirmez)

**QR Kod Türleri:**
1. **Kişisel Token**: Her çalışan için benzersiz, tek kullanımlık
2. **Sistem Token**: Cihaz bazlı, çoklu kullanımlı

**API Endpoints:**
```
POST   /api/system-qr/generate            - Sistem QR üret
GET    /api/system-qr/token/:token        - Token bilgisi
POST   /api/system-qr/use                 - Token kullan
GET    /api/system-qr/active              - Aktif tokenlar
POST   /api/system-qr/revoke/:id          - Token iptal et
```

### 9. 🚌 **Servis Yönetimi (Service Management)**

**Dosyalar:**
- `client/src/pages/Services.js`
- `client/src/pages/PassengerList.js`
- `client/src/pages/QuickRoute.js`
- `client/src/pages/QuickRouteModern.js`
- `server/routes/services.js`
- `server/routes/quickRoute.js`
- `server/models/ServiceRoute.js`
- `server/models/ServiceSchedule.js`

**Özellikler:**
- ✅ Servis rotası tanımlama
- ✅ Güzergah optimizasyonu
- ✅ Yolcu atama
- ✅ Durak yönetimi
- ✅ Sürücü ve araç ataması
- ✅ Harita görselleştirme (Leaflet)
- ✅ GPS koordinat yönetimi
- ✅ Hızlı rota oluşturucu
- ✅ Yolcu listesi Excel export
- ✅ Günlük servis programı

**API Endpoints:**
```
GET    /api/services/routes               - Rota listesi
POST   /api/services/routes               - Yeni rota
PUT    /api/services/routes/:id           - Rota güncelle
DELETE /api/services/routes/:id           - Rota sil
GET    /api/services/schedule             - Servis programı
POST   /api/quick-route/generate          - Hızlı rota oluştur
```

### 10. 🗺️ **Harita ve Lokasyon (Location Map)**

**Dosyalar:**
- `client/src/components/LocationMap.js`
- `client/src/components/LiveLocationMap.js`
- `client/src/components/LeafletMap.js`
- `server/routes/locationMap.js`

**Özellikler:**
- ✅ Leaflet harita entegrasyonu
- ✅ Çalışan konum görselleştirme
- ✅ Servis rotası haritası
- ✅ Durak işaretleme
- ✅ Heat map desteği
- ✅ Gerçek zamanlı konum takibi
- ✅ Marker clustering

### 11. 📊 **Dashboard ve Raporlama**

**Dosyalar:**
- `client/src/pages/Dashboard.js`
- `client/src/components/AdvancedAnalytics.js`
- `client/src/components/ReportingDashboard.js`
- `client/src/components/Charts/DatabaseCharts.js`
- `server/routes/dashboard.js`
- `server/routes/reports.js`

**Özellikler:**
- ✅ Gerçek zamanlı KPI'lar
- ✅ Çalışan istatistikleri
- ✅ Vardiya raporları
- ✅ Devamsızlık analizi
- ✅ Departman bazlı raporlar
- ✅ Chart.js ile görselleştirme
- ✅ PDF ve Excel export
- ✅ Özelleştirilebilir tarih aralığı
- ✅ Drill-down özelliği

**Dashboard KPI'lar:**
- Toplam çalışan sayısı
- Aktif/İzinli/Ayrılanlar
- Bugünkü devamsızlık oranı
- Haftalık çalışma saati
- Departman dağılımı
- Lokasyon bazlı istatistikler
- İzin kullanım oranı

**API Endpoints:**
```
GET    /api/dashboard/stats               - Genel istatistikler
GET    /api/dashboard/charts              - Grafik verileri
GET    /api/reports/attendance            - Devamsızlık raporu
GET    /api/reports/shift                 - Vardiya raporu
GET    /api/reports/employee              - Çalışan raporu
POST   /api/reports/export                - Rapor export
```

### 12. 🤖 **Yapay Zeka Entegrasyonları**

**Dosyalar:**
- `server/routes/attendanceAI.js`
- `server/routes/aiAnalysis.js`
- `server/services/attendanceAI.js`
- `server/services/aiAnomalyAnalyzer.js`
- `server/config/aiConfig.js`

**Özellikler:**
- ✅ Gemini AI entegrasyonu
- ✅ Groq AI entegrasyonu
- ✅ İsim benzerlik analizi
- ✅ Veri tutarlılık kontrolü
- ✅ Anomali tespiti
- ✅ Otomatik hata bulma
- ✅ Akıllı öneriler
- ✅ Devamsızlık pattern analizi

**AI Kullanım Alanları:**
1. **İsim Tutarlılığı**: Aynı kişinin farklı yazım şekillerini tespit
2. **Veri Validasyonu**: TC No, telefon formatı kontrolü
3. **Anomali Tespiti**: Olağandışı devamsızlık patternleri
4. **Tahminleme**: Gelecek dönem izin tahminleri

**API Endpoints:**
```
POST   /api/attendance-ai/analyze         - Devamsızlık analizi
POST   /api/ai-analysis/check-duplicates  - Duplikasyon kontrolü
POST   /api/ai-analysis/validate-data     - Veri validasyonu
GET    /api/ai-analysis/anomalies         - Anomaliler
```

### 13. 🏢 **İş Başvuruları (Job Applications)**

**Dosyalar:**
- `client/src/pages/JobApplicationsList.js`
- `client/src/pages/PublicJobApplication.js`
- `client/src/pages/JobApplicationEditor.js`
- `server/routes/jobApplications.js`
- `server/routes/formStructure.js`
- `server/models/JobApplication.js`
- `server/models/FormStructure.js`

**Özellikler:**
- ✅ Public başvuru formu (şifresiz erişim)
- ✅ Dinamik form yapısı
- ✅ Form builder (Admin için)
- ✅ Başvuru yönetimi
- ✅ Durum takibi (Yeni, İnceleniyor, Kabul, Red)
- ✅ Dosya yükleme (CV, belgeler)
- ✅ Başvuru notları
- ✅ Email bildirimleri

**Başvuru Durumları:**
- NEW: Yeni başvuru
- REVIEWED: İncelendi
- SHORTLISTED: Ön değerlendirmeden geçti
- REJECTED: Reddedildi
- HIRED: İşe alındı

**API Endpoints:**
```
GET    /api/job-applications              - Başvuru listesi
POST   /api/job-applications              - Yeni başvuru (public)
GET    /api/job-applications/:id          - Başvuru detayı
PUT    /api/job-applications/:id/status   - Durum güncelle
POST   /api/job-applications/:id/note     - Not ekle
GET    /api/form-structure                - Form yapısı
PUT    /api/form-structure                - Form güncelle
```

### 14. 📋 **Excel İşlemleri**

**Dosyalar:**
- `server/routes/excel.js`
- `server/scripts/importCSVData.js`
- `server/scripts/exportUsageToCsv.js`
- `server/scripts/importUsedLeaveFromCsv.js`
- `server/utils/employeeFieldMapper.js`
- `client/src/utils/exportUtils.js`

**Özellikler:**
- ✅ Excel import (Çalışan, İzin, Devamsızlık)
- ✅ Excel export (Vardiya, Raporlar, Yolcu Listesi)
- ✅ Otomatik alan eşleme
- ✅ Veri validasyonu
- ✅ Hata raporlama
- ✅ CSV desteği
- ✅ Toplu veri güncelleme
- ✅ Excel şablon indirme

**API Endpoints:**
```
POST   /api/excel/import                  - Excel import
GET    /api/excel/export/:type            - Excel export
GET    /api/excel/template/:type          - Şablon indir
POST   /api/excel/validate                - Dosya validasyonu
```

### 15. 🔔 **Bildirim Sistemi (Notifications)**

**Dosyalar:**
- `client/src/pages/Notifications.js`
- `server/routes/notifications.js`
- `server/models/Notification.js`

**Özellikler:**
- ✅ Gerçek zamanlı bildirimler
- ✅ Kullanıcı bazlı bildirimler
- ✅ Bildirim tipleri (Bilgi, Uyarı, Hata, Başarılı)
- ✅ Okundu işaretleme
- ✅ Toplu işaretleme
- ✅ Bildirim geçmişi
- ✅ Link yönlendirme

**API Endpoints:**
```
GET    /api/notifications                 - Bildirimler
POST   /api/notifications                 - Yeni bildirim
PUT    /api/notifications/:id/read        - Okundu işaretle
PUT    /api/notifications/mark-all-read   - Tümünü okundu işaretle
DELETE /api/notifications/:id             - Bildirimi sil
```

### 16. ⏰ **Zamanlanmış Görevler (Cron Jobs)**

**Dosyalar:**
- `server/services/cronJobs.js`
- `server/services/dailyReportService.js`

**Zamanlanmış Görevler:**

| Görev | Zamanlama | Açıklama |
|-------|-----------|----------|
| **Günlük Rapor** | Her gece 01:00 | Önceki günün devamsızlık raporu |
| **Token Temizleme** | Her saat başı | Süresi dolmuş QR tokenları temizle |
| **Haftalık Rapor** | Pazartesi 08:00 | Geçen haftanın özet raporu |
| **Aylık Rapor** | Her ayın 1'i 09:00 | Geçen ayın detaylı raporu |

**Manuel Çalıştırma:**
Cron job'lar manuel olarak da tetiklenebilir (API endpoint ile).

### 17. 🔐 **Kimlik Doğrulama ve Yetkilendirme**

**Dosyalar:**
- `client/src/contexts/AuthContext.js`
- `client/src/components/Login/Login.js`
- `server/routes/users.js`
- `server/middleware/auth.js`
- `server/models/User.js`

**Özellikler:**
- ✅ JWT tabanlı authentication
- ✅ Bcrypt ile şifre hashleme
- ✅ Rol bazlı yetkilendirme (RBAC)
- ✅ Token refresh
- ✅ Session yönetimi
- ✅ Şifre sıfırlama
- ✅ Son giriş takibi

**Roller:**
- **ADMIN**: Tam yetki
- **MANAGER**: Yönetim işlemleri
- **SUPERVISOR**: Bölüm sorumlusu
- **USER**: Temel kullanıcı

**API Endpoints:**
```
POST   /api/users/register                - Kayıt ol
POST   /api/users/login                   - Giriş yap
POST   /api/users/logout                  - Çıkış yap
GET    /api/users/me                      - Kullanıcı bilgisi
PUT    /api/users/change-password         - Şifre değiştir
POST   /api/users/forgot-password         - Şifre sıfırla
```

### 18. 📝 **Logging ve Monitoring**

**Dosyalar:**
- `server/config/logger.js`
- `server/config/sentry.js`
- `server/newrelic.js`

**Logging Sistemi (Winston):**
- ✅ Farklı log seviyeleri (error, warn, info, debug)
- ✅ Dosya bazlı log kaydetme
- ✅ Console output
- ✅ Log rotation
- ✅ Audit logging

**Log Dosyaları:**
- `logs/error.log`: Hata logları
- `logs/combined.log`: Tüm loglar
- `logs/audit.log`: Audit logları
- `logs/exceptions.log`: İstisna logları
- `logs/rejections.log`: Promise rejection logları

**Error Tracking (Sentry):**
- ✅ Gerçek zamanlı hata takibi
- ✅ Stack trace
- ✅ Breadcrumb'lar
- ✅ User context
- ✅ Release tracking

**APM (New Relic):**
- ✅ Uygulama performans izleme
- ✅ Transaction tracing
- ✅ Database query monitoring
- ✅ External service calls
- ✅ Custom metrics

### 19. 💾 **Cache Yönetimi (Redis)**

**Dosyalar:**
- `server/config/redis.js`
- `server/middleware/cache.js`

**Özellikler:**
- ✅ Redis cache entegrasyonu
- ✅ Otomatik cache invalidation
- ✅ TTL yönetimi
- ✅ Cache warming
- ✅ Session storage
- ✅ Rate limiting

**Cached Data:**
- Çalışan istatistikleri (10 dakika)
- Departman ve lokasyon filtreleri (5 dakika)
- Dashboard verileri (5 dakika)
- API response cache'leri

---

## 🌐 API Genel Yapısı

### Base URL
```
Development:  http://localhost:5001/api
Production:   https://canga-api.onrender.com/api
```

### Response Format

**Başarılı Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı"
}
```

**Hata Response:**
```json
{
  "success": false,
  "error": "Hata mesajı",
  "details": { ... }
}
```

### HTTP Status Kodları
- `200`: Başarılı
- `201`: Oluşturuldu
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

### Authentication
JWT token kullanımı:
```
Authorization: Bearer <token>
```

---

## 📁 Proje Klasör Yapısı

```
Canga/
│
├── client/                          # Frontend (React)
│   ├── public/
│   │   ├── index.html
│   │   ├── canga-logo.png
│   │   └── _redirects              # Render routing config
│   │
│   ├── src/
│   │   ├── App.js                  # Ana uygulama
│   │   ├── index.js                # Entry point
│   │   │
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   └── Layout.js       # Ana layout (Sidebar + Header)
│   │   │   │
│   │   │   ├── Login/
│   │   │   │   └── Login.js        # Login sayfası
│   │   │   │
│   │   │   ├── Calendar/
│   │   │   │   ├── VacationManager.js
│   │   │   │   ├── SmartFilters.js
│   │   │   │   ├── DragDropFeature.js
│   │   │   │   └── MobileCalendar.js
│   │   │   │
│   │   │   ├── Charts/
│   │   │   │   ├── DatabaseCharts.js
│   │   │   │   ├── ChartFilters.js
│   │   │   │   ├── ChartExporter.js
│   │   │   │   └── ChartDrilldown.js
│   │   │   │
│   │   │   ├── modern/
│   │   │   │   ├── ModernButton.js
│   │   │   │   ├── ModernCard.js
│   │   │   │   └── ModernInput.js
│   │   │   │
│   │   │   ├── AdvancedAnalytics.js
│   │   │   ├── BulkEmployeeEditor.js
│   │   │   ├── EmployeeDetailModal.js
│   │   │   ├── LeaveEditModal.js
│   │   │   ├── SignatureDetailModal.js
│   │   │   ├── ExportButtons.js
│   │   │   ├── ReportingDashboard.js
│   │   │   ├── LocationMap.js
│   │   │   ├── LiveLocationMap.js
│   │   │   ├── LeafletMap.js
│   │   │   └── SimpleMap.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Employees.js
│   │   │   ├── FormerEmployees.js
│   │   │   ├── TraineesAndApprentices.js
│   │   │   ├── Shifts.js
│   │   │   ├── CreateShift.js
│   │   │   ├── Calendar.js
│   │   │   ├── CalendarAdvanced.js
│   │   │   ├── AnnualLeave.js
│   │   │   ├── AnnualLeaveEditPage.js
│   │   │   ├── Services.js
│   │   │   ├── PassengerList.js
│   │   │   ├── QuickRoute.js
│   │   │   ├── QuickRouteModern.js
│   │   │   ├── QuickRouteManual.js
│   │   │   ├── QuickList.js
│   │   │   ├── QRImzaYonetimi.js
│   │   │   ├── QRCodeGenerator.js
│   │   │   ├── SignaturePage.js
│   │   │   ├── SystemSignaturePage.js
│   │   │   ├── JobApplicationsList.js
│   │   │   ├── JobApplicationEditor.js
│   │   │   ├── PublicJobApplication.js
│   │   │   ├── Notifications.js
│   │   │   └── Profile.js
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.js      # Authentication context
│   │   │
│   │   ├── config/
│   │   │   └── api.js              # API base URL config
│   │   │
│   │   ├── theme/
│   │   │   └── modernTheme.js      # Material-UI tema
│   │   │
│   │   └── utils/
│   │       └── exportUtils.js      # Excel export utilities
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Backend (Node.js + Express)
│   │
│   ├── index.js                     # Ana server dosyası
│   ├── newrelic.js                  # New Relic APM
│   │
│   ├── config/
│   │   ├── logger.js                # Winston logger config
│   │   ├── redis.js                 # Redis config
│   │   ├── sentry.js                # Sentry error tracking
│   │   └── aiConfig.js              # AI servis config
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Employee.js
│   │   ├── Shift.js
│   │   ├── Attendance.js
│   │   ├── AttendanceToken.js
│   │   ├── SystemQRToken.js
│   │   ├── AnnualLeave.js
│   │   ├── ServiceRoute.js
│   │   ├── ServiceSchedule.js
│   │   ├── JobApplication.js
│   │   ├── FormStructure.js
│   │   ├── Notification.js
│   │   ├── ScheduledList.js
│   │   ├── Analytics.js
│   │   └── SystemLog.js
│   │
│   ├── routes/
│   │   ├── users.js
│   │   ├── employees.js
│   │   ├── shifts.js
│   │   ├── attendance.js
│   │   ├── attendanceQR.js
│   │   ├── attendanceAI.js
│   │   ├── systemQR.js
│   │   ├── annualLeave.js
│   │   ├── services.js
│   │   ├── quickRoute.js
│   │   ├── calendar.js
│   │   ├── dashboard.js
│   │   ├── reports.js
│   │   ├── excel.js
│   │   ├── notifications.js
│   │   ├── jobApplications.js
│   │   ├── formStructure.js
│   │   ├── locationMap.js
│   │   ├── scheduledLists.js
│   │   └── aiAnalysis.js
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   └── cache.js                 # Redis cache middleware
│   │
│   ├── services/
│   │   ├── cronJobs.js              # Zamanlanmış görevler
│   │   ├── dailyReportService.js    # Günlük rapor servisi
│   │   ├── attendanceAI.js          # AI devamsızlık analizi
│   │   ├── aiAnomalyAnalyzer.js     # AI anomali tespiti
│   │   └── serviceSyncService.js    # Servis senkronizasyon
│   │
│   ├── utils/
│   │   ├── employeeFieldMapper.js   # Excel field mapping
│   │   └── locationHelper.js        # GPS koordinat yardımcıları
│   │
│   ├── constants/
│   │   └── employee.constants.js    # Sabit değerler
│   │
│   ├── data/
│   │   └── employeeImportData.js    # Örnek veri
│   │
│   ├── scripts/
│   │   ├── importCSVData.js         # CSV import script
│   │   ├── exportUsageToCsv.js      # Kullanım export
│   │   └── importUsedLeaveFromCsv.js # İzin import
│   │
│   ├── logs/                        # Log dosyaları
│   │   ├── error.log
│   │   ├── combined.log
│   │   ├── audit.log
│   │   ├── exceptions.log
│   │   └── rejections.log
│   │
│   ├── uploads/                     # Yüklenen dosyalar
│   │
│   └── package.json
│
├── testsprite_tests/                # Test dosyaları
│
├── package.json                     # Root package
├── render.yaml                      # Render.com deployment
├── vercel.json                      # Vercel config (opsiyonel)
├── README.md
├── LICENSE
└── TEST_REPORT.md
```

---

## 🛠️ Kurulum ve Çalıştırma

### Gereksinimler

- **Node.js**: v14 veya üzeri
- **npm**: v6 veya üzeri
- **MongoDB**: v4.4 veya üzeri
- **Redis**: v6 veya üzeri (opsiyonel, performans için önerilir)

### 1. Projeyi Klonlama

```bash
git clone https://github.com/zumerkk/CangaZMK.git
cd Canga
```

### 2. Bağımlılıkları Yükleme

**Tüm bağımlılıkları tek seferde yükle:**
```bash
npm run install-deps
```

**Veya manuel olarak:**
```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 3. Environment Variables

**Server `.env` dosyası oluştur:**
```bash
cd server
cp .env.example .env
```

**.env içeriği:**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/canga
# Veya MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/canga

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Server
PORT=5001
NODE_ENV=development

# CORS - Frontend URL
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Redis (Opsiyonel)
REDIS_URL=redis://localhost:6379

# AI Services (Opsiyonel)
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# Monitoring (Opsiyonel)
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_newrelic_key

# Email (Opsiyonel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password
```

### 4. MongoDB Kurulumu

**Local MongoDB:**
```bash
# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt install mongodb
sudo systemctl start mongodb
```

**MongoDB Atlas (Cloud):**
1. https://www.mongodb.com/cloud/atlas adresinden hesap oluştur
2. Cluster oluştur
3. IP Whitelist'e `0.0.0.0/0` ekle (tüm IP'ler)
4. Database user oluştur
5. Connection string'i kopyala ve `.env` dosyasına ekle

### 5. Redis Kurulumu (Opsiyonel)

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server
```

### 6. Uygulamayı Çalıştırma

**Development (Concurrently - Client + Server birlikte):**
```bash
npm run dev
```

**Ayrı ayrı çalıştırma:**

Backend:
```bash
cd server
npm run dev
# Çalışacak port: http://localhost:5001
```

Frontend:
```bash
cd client
npm start
# Çalışacak port: http://localhost:3000
```

### 7. İlk Kullanıcı Oluşturma

API endpoint ile admin kullanıcı oluştur:
```bash
curl -X POST http://localhost:5001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "email": "admin@canga.com",
    "role": "ADMIN"
  }'
```

Veya MongoDB Compass kullanarak manuel olarak `users` koleksiyonuna ekle.

### 8. Örnek Veri Yükleme (Opsiyonel)

```bash
cd server
node scripts/importCSVData.js
```

---

## 🚀 Deployment (Üretim Ortamı)

### Render.com Deployment

Proje **Render.com** üzerinde deploy edilebilir (mevcut config dosyaları hazır).

**render.yaml yapılandırması:**
```yaml
services:
  # Backend API
  - type: web
    name: canga-api
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: PORT
        value: 5001

  # Frontend
  - type: web
    name: canga-frontend
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/build
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

**Deployment adımları:**
1. GitHub repository'ye push et
2. Render.com'a giriş yap
3. "New +" → "Blueprint" seç
4. Repository bağla
5. `render.yaml` otomatik algılanır
6. Environment variables ekle
7. Deploy başlat

### Railway Deployment

```bash
# Railway CLI kurulum
npm install -g @railway/cli

# Login
railway login

# Proje oluştur
railway init

# Deploy
railway up
```

### Vercel Deployment (Sadece Frontend)

```bash
# Vercel CLI
npm install -g vercel

# Deploy
cd client
vercel --prod
```

### Docker Deployment

**Dockerfile (Server):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ .
EXPOSE 5001
CMD ["npm", "start"]
```

**Dockerfile (Client):**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: server/Dockerfile
    ports:
      - "5001:5001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/canga
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  frontend:
    build:
      context: .
      dockerfile: client/Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

**Çalıştırma:**
```bash
docker-compose up -d
```

---

## 🔒 Güvenlik Özellikleri

### 1. Authentication & Authorization
- ✅ JWT token based authentication
- ✅ Bcrypt ile şifre hashleme (salt rounds: 10)
- ✅ Rol bazlı erişim kontrolü (RBAC)
- ✅ Token expiration (24 saat)
- ✅ Refresh token desteği

### 2. API Security
- ✅ CORS policy (Whitelist based)
- ✅ Rate limiting (Redis)
- ✅ Request validation
- ✅ XSS protection
- ✅ SQL Injection prevention (MongoDB NoSQL)
- ✅ Helmet.js (HTTP headers)

### 3. Data Security
- ✅ MongoDB field level encryption
- ✅ Sensitive data masking (logs)
- ✅ Input sanitization
- ✅ File upload validation
- ✅ HTTPS enforced (production)

### 4. Session Security
- ✅ Session timeout
- ✅ Concurrent session control
- ✅ IP tracking
- ✅ Device fingerprinting

### 5. Audit & Compliance
- ✅ Audit log (Winston)
- ✅ User action tracking
- ✅ Data change history
- ✅ GDPR compliance ready

---

## 📊 Performans Optimizasyonları

### 1. Backend Optimizasyonları
- ✅ **Redis Cache**: Sık kullanılan veriler cache'lenir
- ✅ **MongoDB Index**: Sık sorgulanan alanlar index'lenir
- ✅ **Pagination**: Büyük listeler sayfalanır
- ✅ **Lazy Loading**: İhtiyaç duyulana kadar yükleme yapılmaz
- ✅ **Query Optimization**: Aggregation pipeline kullanımı
- ✅ **Connection Pooling**: MongoDB connection pool (max 10)

### 2. Frontend Optimizasyonları
- ✅ **Code Splitting**: React.lazy ile sayfa bazlı split
- ✅ **Bundle Optimization**: Vite build optimization
- ✅ **Image Optimization**: Lazy loading, responsive images
- ✅ **Memoization**: React.memo, useMemo, useCallback
- ✅ **Debouncing**: Arama ve filter işlemlerinde
- ✅ **Virtual Scrolling**: Büyük listelerde

### 3. Monitoring
- ✅ **New Relic APM**: Application performance monitoring
- ✅ **Sentry**: Error tracking ve reporting
- ✅ **Winston Logger**: Detaylı logging
- ✅ **Health Checks**: `/health` endpoint

---

## 📈 Metrikler ve KPI'lar

### Sistem Metrikleri
- ✅ Uptime: %99.9 target
- ✅ Response Time: <200ms (avg)
- ✅ Error Rate: <0.1%
- ✅ Concurrent Users: 100+ support

### İş Metrikleri
- ✅ Toplam Çalışan Sayısı
- ✅ Aktif Vardiya Sayısı
- ✅ Günlük Devamsızlık Oranı
- ✅ İzin Kullanım Oranı
- ✅ Servis Kullanım İstatistikleri

---

## 🐛 Bilinen Sorunlar ve Çözümler

### 1. MongoDB Bağlantı Sorunu
**Sorun:** Production'da MongoDB bağlanamıyor
**Çözüm:**
- IP Whitelist kontrolü (`0.0.0.0/0` ekli mi?)
- Connection string doğru mu?
- Kullanıcı adı/şifre doğru mu?

### 2. CORS Hatası
**Sorun:** Frontend'den API'ye istek atılamıyor
**Çözüm:**
- `server/.env` dosyasında `CLIENT_URL` doğru ayarlanmalı
- Development: `http://localhost:3000`
- Production: Frontend URL'i

### 3. Redis Bağlantı Hatası
**Sorun:** Redis'e bağlanılamıyor
**Çözüm:**
- Redis servisinin çalıştığından emin olun: `redis-cli ping`
- Opsiyonel olduğu için devre dışı bırakılabilir

### 4. Port Zaten Kullanımda
**Sorun:** `EADDRINUSE: Port 5001 already in use`
**Çözüm:**
```bash
# Port kullanan işlemi bul ve kapat
lsof -ti:5001 | xargs kill

# Veya başka port kullan
PORT=5002 npm run dev
```

---

## 🔄 Güncellemeler ve Versiyon Geçmişi

### v2.0.0 (Mevcut)
- ✅ AI entegrasyonları (Gemini, Groq)
- ✅ QR kod sistemi
- ✅ Yıllık izin takibi
- ✅ İş başvuru sistemi
- ✅ Harita entegrasyonu
- ✅ Gelişmiş raporlama

### v1.0.0 (İlk Versiyon)
- ✅ Çalışan yönetimi
- ✅ Vardiya planlama
- ✅ Servis yönetimi
- ✅ Excel import/export
- ✅ Temel dashboard

---

## 📞 İletişim ve Destek

**Geliştirici:** Zümer Kekillioğlu
**Kurum:** Çanga Savunma Endüstrisi Ltd. Şti.
**Repository:** https://github.com/zumerkk/CangaZMK
**Issues:** https://github.com/zumerkk/CangaZMK/issues

---

## 📄 Lisans

Bu proje **ISC Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.

---

## 🙏 Teşekkürler

Bu proje, Çanga Savunma Endüstrisi'nin dijital dönüşüm hedefleri doğrultusunda geliştirilmiştir. Tüm ekibe katkılarından dolayı teşekkür ederiz.

---

**Son Güncelleme:** 14 Kasım 2025
**Döküman Versiyonu:** 1.0


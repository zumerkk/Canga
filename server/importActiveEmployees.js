const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Employee modelini import et
const Employee = require('./models/Employee');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error);
    process.exit(1);
  }
};

// CSV dosyasını okuma ve parse etme fonksiyonu
const parseCSV = (filePath) => {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // İlk birkaç satırı atla (boş satırlar ve başlık)
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('AD - SOYAD') || lines[i].includes('TC KİMLİK NO')) {
        startIndex = i + 1;
        break;
      }
    }
    
    const employees = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Semicolon ile ayır
      const columns = line.split(';');
      
      // En az 5-6 kolon olmalı (D.NO;S.No.;AD - SOYAD;TC KİMLİK NO;CEP NO;DOĞUM TARİHİ;İŞE GİRİŞ TARİHİ;GÖREV;SERVİS BİNİŞ NOKTASI)
      if (columns.length < 5) continue;

      // Yeni CSV başlığına göre kolonlar
      const [dNo, sNo, adSoyadRaw, tcNoRaw, cepNoRaw, dogumTarihiRaw, iseGirisTarihiRaw, gorevRaw, servisBinisNoktasiRaw] = columns;

      const adSoyad = (adSoyadRaw || '').trim();
      if (!adSoyad) continue; // İsim zorunlu

      const tcNo = (tcNoRaw || '').trim();
      const cepNo = (cepNoRaw || '').trim();
      const gorev = (gorevRaw || '').trim();
      const servisBinisNoktasi = (servisBinisNoktasiRaw || '').trim();

      // Çok formatlı tarih parse (DD.MM.YYYY, DD.MM.YY, M/D/YY, M/D/YYYY)
      const formatDate = (value) => {
        if (!value) return null;
        const dateStr = value.trim();
        if (!dateStr) return null;

        // 1) Noktalı format: DD.MM.YYYY veya DD.MM.YY
        if (dateStr.includes('.')) {
          const [dd, mm, yy] = dateStr.split('.');
          if (dd && mm && yy) {
            let yearNum = parseInt(yy, 10);
            if (yy.length === 2) {
              yearNum = yearNum >= 30 ? 1900 + yearNum : 2000 + yearNum;
            }
            const iso = `${yearNum}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
            const d = new Date(iso);
            return isNaN(d.getTime()) ? null : d;
          }
        }

        // 2) Slash format: M/D/YY veya M/D/YYYY
        if (dateStr.includes('/')) {
          const [m, d, y] = dateStr.split('/');
          if (m && d && y) {
            let yearNum = parseInt(y, 10);
            if (y.length === 2) {
              yearNum = yearNum >= 30 ? 1900 + yearNum : 2000 + yearNum;
            }
            const iso = `${yearNum}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const dt = new Date(iso);
            return isNaN(dt.getTime()) ? null : dt;
          }
        }

        // 3) Fallback native parse
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      // Telefon numarası temizleme
      const cleanPhone = (phone) => {
        if (!phone) return '';
        return phone.replace(/[^0-9]/g, '');
      };

      // Lokasyon: CSV'de yok -> zorunlu alan için varsayılan MERKEZ
      const determineLokasyon = () => 'MERKEZ';

      // Kendi aracı bilgisi: metin içinde "KENDİ ARACI" geçiyorsa true
      const containsOwnCar = (text) => {
        if (!text) return false;
        const upper = text.toUpperCase();
        return upper.includes('KENDI ARACI') || upper.includes('KENDİ ARACI');
      };

      const employee = {
        adSoyad,
        tcNo,
        cepTelefonu: cleanPhone(cepNo),
        dogumTarihi: formatDate(dogumTarihiRaw),
        iseGirisTarihi: formatDate(iseGirisTarihiRaw),
        pozisyon: gorev || 'Belirtilmemiş',
        lokasyon: determineLokasyon(),
        servisGuzergahi: servisBinisNoktasi,
        durak: servisBinisNoktasi || '',
        kendiAraci: containsOwnCar(servisBinisNoktasi),
        durum: 'AKTIF',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      employees.push(employee);
    }
    
    return employees;
  } catch (error) {
    console.error('❌ CSV okuma hatası:', error);
    return [];
  }
};

// Ana import fonksiyonu
const importActiveEmployees = async () => {
  try {
    await connectDB();
    
    const csvPath = '/Users/zumerkekillioglu/Desktop/Canga/csv/GENEL LİSTE-Tablo 1.csv';
    console.log('📄 CSV dosyası okunuyor:', csvPath);
    
    const employees = parseCSV(csvPath);
    console.log(`📊 Toplam ${employees.length} çalışan verisi bulundu`);
    
    if (employees.length === 0) {
      console.log('⚠️ İçe aktarılacak veri bulunamadı');
      return;
    }
    
    // Mevcut aktif çalışanları temizle
    console.log('🧹 Mevcut aktif çalışanlar temizleniyor...');
    await Employee.deleteMany({ durum: { $in: ['AKTIF', 'PASIF', 'İZİNLİ'] } });
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    console.log('💾 Çalışanlar MongoDB\'ye kaydediliyor...');
    
    for (const employeeData of employees) {
      try {
        const employee = new Employee(employeeData);
        await employee.save();
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ ${successCount} çalışan kaydedildi...`);
        }
      } catch (error) {
        errorCount++;
        errors.push({
          employee: employeeData.adSoyad,
          error: error.message
        });
        console.error(`❌ Hata (${employeeData.adSoyad}):`, error.message);
      }
    }
    
    console.log('\n📈 İMPORT SONUÇLARI:');
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    console.log(`📊 Toplam: ${employees.length}`);
    
    if (errors.length > 0) {
      console.log('\n🔍 HATALAR:');
      errors.forEach(err => {
        console.log(`- ${err.employee}: ${err.error}`);
      });
    }
    
    // Durum özeti
    const statusCounts = await Employee.aggregate([
      { $group: { _id: '$durum', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 DURUM ÖZETİ:');
    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count}`);
    });
    
  } catch (error) {
    console.error('❌ Import işlemi başarısız:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script'i çalıştır
if (require.main === module) {
  importActiveEmployees();
}

module.exports = { importActiveEmployees, parseCSV };
const fs = require('fs');
const path = require('path');

// Çakışan TC numaraları (aktif çalışanlar)
const conflictingTCs = [
  '46366221550', // Sadullah AKBAYIR
  '16979600110', // Kamil Batuhan BEYGO
  '10322822112'  // Mehmet DİRİ
];

const updateFormerEmployeesCSV = () => {
  try {
    console.log('🔄 İşten ayrılanlar CSV dosyası güncelleniyor...\n');
    
    // Orijinal CSV dosyasını oku
    const originalCSVPath = path.join(__dirname, '..', 'İŞTEN AYRILANLAR-Tablo 1.csv');
    const csvContent = fs.readFileSync(originalCSVPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    console.log(`📋 Orijinal dosyada ${lines.length} satır bulundu`);
    
    // Güncellenmiş satırları tutacak array
    const updatedLines = [];
    const removedEmployees = [];
    let removedCount = 0;
    
    // Her satırı kontrol et
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Header satırları ve boş satırları koru
      if (i < 2 || !line.trim() || line.startsWith(';;;')) {
        updatedLines.push(line);
        continue;
      }
      
      const columns = line.split(';');
      
      // TC numarası var mı kontrol et
      if (columns.length >= 4 && columns[3]) {
        const tcNo = columns[3].trim();
        
        // Çakışan TC numarası ise bu satırı çıkar
        if (conflictingTCs.includes(tcNo)) {
          removedEmployees.push({
            siraNo: columns[0],
            adSoyad: columns[2] ? columns[2].trim() : '',
            tcNo: tcNo,
            ayrilistarihi: columns[1] || ''
          });
          removedCount++;
          console.log(`❌ Çıkarıldı: ${columns[2] ? columns[2].trim() : 'İsim yok'} (TC: ${tcNo}) - Ayrılış: ${columns[1] || 'Tarih yok'}`);
          continue; // Bu satırı ekleme
        }
      }
      
      // Çakışmayan satırları koru
      updatedLines.push(line);
    }
    
    console.log(`\n✅ ${removedCount} çakışan kayıt çıkarıldı`);
    console.log(`📊 Güncellenmiş dosyada ${updatedLines.length} satır kalacak`);
    
    // Güncellenmiş içeriği oluştur
    const updatedContent = updatedLines.join('\n');
    
    // Yedek dosya oluştur
    const backupPath = path.join(__dirname, '..', 'İŞTEN AYRILANLAR-Tablo 1_BACKUP.csv');
    fs.writeFileSync(backupPath, csvContent);
    console.log(`\n💾 Orijinal dosya yedeklendi: ${backupPath}`);
    
    // Güncellenmiş dosyayı kaydet
    fs.writeFileSync(originalCSVPath, updatedContent);
    console.log(`✅ Güncellenmiş dosya kaydedildi: ${originalCSVPath}`);
    
    // Çıkarılan kayıtları rapor dosyasına kaydet
    const reportData = {
      updateDate: new Date().toISOString(),
      removedCount: removedCount,
      removedEmployees: removedEmployees,
      conflictingTCs: conflictingTCs,
      originalLineCount: lines.length,
      updatedLineCount: updatedLines.length
    };
    
    const reportPath = path.join(__dirname, 'former_employees_update_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Güncelleme raporu kaydedildi: ${reportPath}`);
    
    console.log('\n📊 GÜNCELLEME ÖZETİ:');
    console.log('=' * 40);
    console.log(`   Çıkarılan kayıtlar: ${removedCount}`);
    console.log(`   Kalan kayıtlar: ${updatedLines.length - 2} (header hariç)`); // Header satırlarını çıkar
    
    if (removedEmployees.length > 0) {
      console.log('\n🚫 ÇIKARILAN PERSONELLER:');
      removedEmployees.forEach((emp, index) => {
        console.log(`   ${index + 1}. ${emp.adSoyad} (TC: ${emp.tcNo}) - Ayrılış: ${emp.ayrilistarihi}`);
      });
    }
    
    console.log('\n✅ İşten ayrılanlar listesi başarıyla güncellendi!');
    console.log('   Artık sadece gerçekten ayrılmış personeller listede bulunuyor.');
    
    return {
      success: true,
      removedCount,
      removedEmployees,
      updatedLineCount: updatedLines.length
    };
    
  } catch (error) {
    console.error('❌ CSV güncelleme hatası:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Script'i çalıştır
if (require.main === module) {
  updateFormerEmployeesCSV();
}

module.exports = { updateFormerEmployeesCSV };
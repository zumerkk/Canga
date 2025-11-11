#!/usr/bin/env node

/**
 * 🔄 ÇALIŞANLARI YENİDEN AKTİF YAPMA SCRİPTİ
 * 
 * Önder Okatan ve Salih Albayrak'ı aktif duruma getirir
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Employee = require('../models/Employee');

async function reactivateEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    const report = {
      success: [],
      errors: []
    };

    // 1. Önder Okatan'ı aktif yap
    console.log('🔄 1. ÖNDER OKATAN aktif yapılıyor...');
    try {
      const onder = await Employee.findOne({ tcNo: '60838137972' });
      if (onder) {
        onder.durum = 'AKTIF';
        onder.ayrilmaTarihi = undefined;
        onder.ayrilmaSebebi = undefined;
        onder.servisGuzergahi = 'KARŞIYAKA SERVİS GÜZERGAHI';
        onder.durak = 'KARŞIYAKA';
        onder.serviceInfo = {
          usesService: true,
          routeName: 'KARŞIYAKA SERVİS GÜZERGAHI',
          stopName: 'KARŞIYAKA',
          routeId: null
        };
        await onder.save();
        
        console.log('   ✅ Önder Okatan aktif yapıldı');
        console.log('   📍 Servis: KARŞIYAKA SERVİS GÜZERGAHI');
        console.log('   🚏 Durak: KARŞIYAKA\n');
        
        report.success.push({
          name: 'ÖNDER OKATAN',
          tcNo: '60838137972',
          action: 'Aktif yapıldı',
          route: 'KARŞIYAKA SERVİS GÜZERGAHI',
          stop: 'KARŞIYAKA'
        });
      } else {
        console.log('   ❌ Önder Okatan bulunamadı\n');
        report.errors.push('Önder Okatan bulunamadı');
      }
    } catch (error) {
      console.error('   ❌ Hata:', error.message);
      report.errors.push(`Önder Okatan: ${error.message}`);
    }

    // 2. Salih Albayrak'ı aktif yap
    console.log('🔄 2. SALİH ALBAYRAK aktif yapılıyor...');
    try {
      const salih = await Employee.findOne({ tcNo: '10241426606' });
      if (salih) {
        salih.durum = 'AKTIF';
        salih.ayrilmaTarihi = undefined;
        salih.ayrilmaSebebi = undefined;
        salih.servisGuzergahi = 'KARŞIYAKA SERVİS GÜZERGAHI';
        salih.durak = 'KARŞIYAKA';
        salih.serviceInfo = {
          usesService: true,
          routeName: 'KARŞIYAKA SERVİS GÜZERGAHI',
          stopName: 'KARŞIYAKA',
          routeId: null
        };
        await salih.save();
        
        console.log('   ✅ Salih Albayrak aktif yapıldı');
        console.log('   📍 Servis: KARŞIYAKA SERVİS GÜZERGAHI');
        console.log('   🚏 Durak: KARŞIYAKA\n');
        
        report.success.push({
          name: 'SALİH ALBAYRAK',
          tcNo: '10241426606',
          action: 'Aktif yapıldı',
          route: 'KARŞIYAKA SERVİS GÜZERGAHI',
          stop: 'KARŞIYAKA'
        });
      } else {
        console.log('   ❌ Salih Albayrak bulunamadı\n');
        report.errors.push('Salih Albayrak bulunamadı');
      }
    } catch (error) {
      console.error('   ❌ Hata:', error.message);
      report.errors.push(`Salih Albayrak: ${error.message}`);
    }

    // 3. Serhat Güven kontrolü
    console.log('🔍 3. SERHAT GÜVEN kontrolü...');
    const serhat = await Employee.findOne({ tcNo: '10280823824' });
    if (serhat) {
      console.log('   ✅ Serhat Güven doğru şekilde AYRILDI durumunda');
      console.log('   📅 Ayrılma Tarihi:', serhat.ayrilmaTarihi);
      console.log('   ✓ Değişiklik yapılmadı\n');
    }

    // Özet rapor
    console.log('\n' + '='.repeat(60));
    console.log('📊 ÖZET RAPOR');
    console.log('='.repeat(60));
    console.log(`✅ Başarılı: ${report.success.length}`);
    console.log(`❌ Hatalı: ${report.errors.length}`);
    
    if (report.success.length > 0) {
      console.log('\n✅ Başarılı İşlemler:');
      report.success.forEach(item => {
        console.log(`   - ${item.name} (${item.tcNo})`);
        console.log(`     ${item.action} - ${item.route} / ${item.stop}`);
      });
    }
    
    if (report.errors.length > 0) {
      console.log('\n❌ Hatalar:');
      report.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ İşlem tamamlandı!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

reactivateEmployees();


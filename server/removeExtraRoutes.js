const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const ServiceRoute = require('./models/ServiceRoute');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function removeExtraRoutes() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canga');
  
  console.log('🗑️  Fazla güzergahları siliyorum...\n');
  
  // Mevcut güzergahları listele
  const allRoutes = await ServiceRoute.find({});
  console.log('📋 Mevcut güzergahlar:');
  allRoutes.forEach((route, idx) => {
    console.log(`   ${idx + 1}. "${route.routeName}" (${route.status}) - ${route.stops?.length || 0} durak`);
  });
  console.log('');
  
  let removed = 0;
  
  // 1) "19-24 AĞUSTOS 2024 SERVİS GÜZERGAHLARI" adlı güzergahı sil
  const augustRoute = await ServiceRoute.findOne({ 
    routeName: { $regex: /19.*24.*AĞUSTOS.*2024/i }
  });
  
  if (augustRoute) {
    console.log(`❌ Siliniyor: "${augustRoute.routeName}"`);
    await augustRoute.deleteOne();
    removed++;
  } else {
    console.log('⚠️  "19-24 AĞUSTOS 2024" güzergahı bulunamadı');
  }
  
  // 2) İsimsiz (boş routeName) güzergahları sil
  const emptyNameRoutes = await ServiceRoute.find({
    $or: [
      { routeName: '' },
      { routeName: { $exists: false } },
      { routeName: null },
      { routeName: { $regex: /^\s*$/ } }
    ]
  });
  
  if (emptyNameRoutes.length > 0) {
    console.log(`❌ ${emptyNameRoutes.length} isimsiz güzergah siliniyor:`);
    for (const route of emptyNameRoutes) {
      console.log(`   - ID: ${route._id}, routeName: "${route.routeName || 'BOŞ'}", stops: ${route.stops?.length || 0}`);
      await route.deleteOne();
      removed++;
    }
  } else {
    console.log('✅ İsimsiz güzergah bulunamadı');
  }
  
  // 3) Şüpheli/geçersiz güzergahları kontrol et
  const suspiciousRoutes = await ServiceRoute.find({
    $or: [
      { routeName: { $regex: /SABAH|AKŞAM|16-24|24-08/i } },
      { routeName: { $regex: /^\d+$/ } },
      { routeName: { $regex: /^[A-Z]{1,3}\d+$/ } }
    ]
  });
  
  if (suspiciousRoutes.length > 0) {
    console.log(`❌ ${suspiciousRoutes.length} şüpheli güzergah siliniyor:`);
    for (const route of suspiciousRoutes) {
      console.log(`   - "${route.routeName}"`);
      await route.deleteOne();
      removed++;
    }
  }
  
  // 4) Final durum
  const finalRoutes = await ServiceRoute.find({ status: 'AKTIF' });
  
  console.log('\n📊 TEMİZLİK SONUCU:');
  console.log('=' * 40);
  console.log(`🗑️  Silinen güzergah: ${removed}`);
  console.log(`🚌 Kalan aktif güzergah: ${finalRoutes.length}`);
  
  console.log('\n✅ KALAN AKTİF GÜZERGAHLAR:');
  finalRoutes.forEach((route, idx) => {
    console.log(`   ${idx + 1}. ${route.routeName}`);
    console.log(`      🚏 ${route.stops?.length || 0} durak`);
    console.log(`      🎨 Renk: ${route.color}`);
    console.log('');
  });
  
  await mongoose.disconnect();
  
  return {
    removed,
    finalCount: finalRoutes.length,
    finalRoutes: finalRoutes.map(r => ({
      name: r.routeName,
      stops: r.stops?.length || 0,
      status: r.status
    }))
  };
}

if (require.main === module) {
  removeExtraRoutes().catch(err => {
    console.error('❌ Hata:', err);
    mongoose.disconnect();
  });
}

module.exports = { removeExtraRoutes };

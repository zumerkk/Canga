require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');

async function checkCurrentEmployeeCount() {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB bağlantısı başarılı');

        // Tüm aktif çalışanları say
        const totalEmployees = await Employee.countDocuments();
        console.log(`📊 Toplam çalışan sayısı: ${totalEmployees}`);

        // Aktif çalışanları say
        const activeEmployees = await Employee.countDocuments({ 
            durum: 'AKTIF' 
        });
        console.log(`👥 Aktif çalışan sayısı: ${activeEmployees}`);

        // Eski çalışanları say
        const formerEmployees = await Employee.countDocuments({ 
            durum: 'AYRILDI' 
        });
        console.log(`📤 Eski çalışan sayısı: ${formerEmployees}`);

        // Durum bazında dağılım
        const statusDistribution = await Employee.aggregate([
            {
                $group: {
                    _id: '$durum',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📈 Durum bazında dağılım:');
        statusDistribution.forEach(item => {
            console.log(`  ${item._id}: ${item.count}`);
        });

        // Son eklenen 10 çalışanı göster
        const recentEmployees = await Employee.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .select('adSoyad tcNo durum createdAt employeeId');

        console.log('\n📋 Son eklenen 10 çalışan:');
        recentEmployees.forEach((emp, index) => {
            console.log(`  ${index + 1}. ${emp.adSoyad} (TC: ${emp.tcNo}) - ID: ${emp.employeeId} - Status: ${emp.durum}`);
        });

    } catch (error) {
        console.error('❌ Hata:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 MongoDB bağlantısı kapatıldı');
    }
}

checkCurrentEmployeeCount();
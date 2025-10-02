/**
 * 🧪 Yıllık İzin Sistemi - Test Senaryoları
 * 
 * Bu dosya, yıllık izin hesaplama kurallarını ve izin birikimi sistemini test eder.
 */

const mongoose = require('mongoose');

// Test fonksiyonları - Backend'deki fonksiyonların kopyası
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function calculateYearsOfService(hireDate) {
  if (!hireDate) return null;
  
  const today = new Date();
  const hire = new Date(hireDate);
  
  if (hire > today) {
    return 0;
  }
  
  let years = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
    years--;
  }
  
  return Math.max(0, years);
}

function calculateEntitledLeaveDays(employee, year) {
  if (!employee.dogumTarihi || !employee.iseGirisTarihi) {
    return 0;
  }
  
  const birthDate = new Date(employee.dogumTarihi);
  const hireDate = new Date(employee.iseGirisTarihi);
  const checkDate = new Date(year, 11, 31);
  
  // Yaş hesabı
  let age = checkDate.getFullYear() - birthDate.getFullYear();
  const ageMonthDiff = checkDate.getMonth() - birthDate.getMonth();
  if (ageMonthDiff < 0 || (ageMonthDiff === 0 && checkDate.getDate() < birthDate.getDate())) {
    age--;
  }

  // Hizmet yılı
  let yearsOfService = checkDate.getFullYear() - hireDate.getFullYear();
  const monthDiff = checkDate.getMonth() - hireDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && checkDate.getDate() < hireDate.getDate())) {
    yearsOfService--;
  }

  // İşe giriş yılı ise hakediş yok
  if (checkDate.getFullYear() === hireDate.getFullYear()) {
    return 0;
  }
  
  // YENİ İZİN KURALLARI:
  if (age >= 50) {
    return yearsOfService > 0 ? 20 : 0;
  } else {
    if (yearsOfService <= 0) {
      return 0;
    } else if (yearsOfService < 5) {
      return 14;
    } else {
      return 20;
    }
  }
}

function calculateCarryover(leaveRecord, currentYear) {
  if (!leaveRecord || !Array.isArray(leaveRecord.leaveByYear)) return 0;
  
  return leaveRecord.leaveByYear
    .filter(y => y.year < currentYear)
    .reduce((sum, y) => {
      const remaining = (y.entitled || 0) - (y.used || 0);
      return sum + remaining;
    }, 0);
}

// 🧪 Test Senaryoları
const testScenarios = [
  {
    name: "Test 1: 50+ Yaş Çalışan (Tecrübeli)",
    employee: {
      adSoyad: "Ahmet ÇANGA",
      dogumTarihi: new Date(1969, 2, 21), // 56 yaş
      iseGirisTarihi: new Date(2019, 4, 21) // 6 yıl hizmet
    },
    year: 2025,
    expected: {
      age: 56,
      yearsOfService: 6,
      entitledDays: 20,
      reason: "50+ yaş kuralı (yaş koşulu yeterli)"
    }
  },
  {
    name: "Test 2: 50+ Yaş Çalışan (Yeni)",
    employee: {
      adSoyad: "Ali SAVAŞ",
      dogumTarihi: new Date(1955, 11, 31), // 70 yaş
      iseGirisTarihi: new Date(2024, 6, 30) // 1 yıl hizmet
    },
    year: 2025,
    expected: {
      age: 70,
      yearsOfService: 1,
      entitledDays: 20,
      reason: "50+ yaş kuralı (1 yıl üzeri hizmet yeterli)"
    }
  },
  {
    name: "Test 3: Genç Çalışan (< 5 Yıl)",
    employee: {
      adSoyad: "Ahmet ÇELİK",
      dogumTarihi: new Date(1995, 8, 20), // 30 yaş
      iseGirisTarihi: new Date(2019, 8, 4) // 6 yıl hizmet
    },
    year: 2025,
    expected: {
      age: 30,
      yearsOfService: 6,
      entitledDays: 20,
      reason: "50 yaş altı + 5 yıl ve üzeri kuralı"
    }
  },
  {
    name: "Test 4: Genç Çalışan (< 5 Yıl)",
    employee: {
      adSoyad: "Ahmet ŞAHİN",
      dogumTarihi: new Date(2004, 5, 30), // 21 yaş
      iseGirisTarihi: new Date(2024, 5, 24) // 1 yıl hizmet
    },
    year: 2025,
    expected: {
      age: 21,
      yearsOfService: 1,
      entitledDays: 14,
      reason: "50 yaş altı + 5 yıldan az kuralı"
    }
  },
  {
    name: "Test 5: Yeni İşe Giren (İlk Yıl)",
    employee: {
      adSoyad: "Yeni Çalışan",
      dogumTarihi: new Date(1990, 0, 1), // 35 yaş
      iseGirisTarihi: new Date(2025, 0, 1) // 2025 yılında işe girdi
    },
    year: 2025,
    expected: {
      age: 35,
      yearsOfService: 0,
      entitledDays: 0,
      reason: "İşe giriş yılı (ilk yıl hakediş yok)"
    }
  },
  {
    name: "Test 6: Sınırda Yaş (49 yaş, 3 yıl)",
    employee: {
      adSoyad: "Sınır Çalışan 1",
      dogumTarihi: new Date(1976, 11, 31), // 49 yaş (31 Aralık 2025'te)
      iseGirisTarihi: new Date(2022, 0, 1) // 3 yıl hizmet
    },
    year: 2025,
    expected: {
      age: 49,
      yearsOfService: 3,
      entitledDays: 14,
      reason: "50 yaş altı + 5 yıldan az"
    }
  },
  {
    name: "Test 7: Sınırda Yaş (50 yaş, 3 yıl)",
    employee: {
      adSoyad: "Sınır Çalışan 2",
      dogumTarihi: new Date(1975, 11, 31), // 50 yaş (31 Aralık 2025'te)
      iseGirisTarihi: new Date(2022, 0, 1) // 3 yıl hizmet
    },
    year: 2025,
    expected: {
      age: 50,
      yearsOfService: 3,
      entitledDays: 20,
      reason: "50 yaş (sınır) + 3 yıl → 20 gün"
    }
  },
  {
    name: "Test 8: Sınırda Hizmet (4 yıl 11 ay)",
    employee: {
      adSoyad: "Sınır Çalışan 3",
      dogumTarihi: new Date(1990, 0, 1), // 35 yaş
      iseGirisTarihi: new Date(2020, 1, 1) // 4 yıl 11 ay (31 Aralık 2025'te)
    },
    year: 2025,
    expected: {
      age: 35,
      yearsOfService: 4,
      entitledDays: 14,
      reason: "50 yaş altı + 5 yıldan az (4 yıl)"
    }
  },
  {
    name: "Test 9: Sınırda Hizmet (Tam 5 yıl)",
    employee: {
      adSoyad: "Sınır Çalışan 4",
      dogumTarihi: new Date(1990, 0, 1), // 35 yaş
      iseGirisTarihi: new Date(2020, 0, 1) // Tam 5 yıl (1 Ocak 2020 - 31 Aralık 2025)
    },
    year: 2025,
    expected: {
      age: 35,
      yearsOfService: 5,
      entitledDays: 20,
      reason: "50 yaş altı + tam 5 yıl → 20 gün"
    }
  },
  {
    name: "Test 10: İzin Birikimi (Pozitif Devir)",
    leaveRecord: {
      employeeId: "test-employee-1",
      leaveByYear: [
        { year: 2023, entitled: 14, used: 5 },  // +9 kalan
        { year: 2024, entitled: 14, used: 10 }, // +4 kalan
        { year: 2025, entitled: 14, used: 0 }
      ]
    },
    currentYear: 2025,
    expected: {
      carryover: 13, // (14-5) + (14-10) = 9 + 4 = 13
      totalAvailable: 27, // 14 (2025) + 13 (devir)
      reason: "Önceki yıllardan pozitif devir"
    }
  },
  {
    name: "Test 11: İzin Birikimi (Negatif Devir)",
    leaveRecord: {
      employeeId: "test-employee-2",
      leaveByYear: [
        { year: 2023, entitled: 14, used: 18 }, // -4 borç
        { year: 2024, entitled: 14, used: 20 }, // -6 borç
        { year: 2025, entitled: 20, used: 0 }
      ]
    },
    currentYear: 2025,
    expected: {
      carryover: -10, // (14-18) + (14-20) = -4 + -6 = -10
      totalAvailable: 10, // 20 (2025) - 10 (borç)
      reason: "Önceki yıllardan negatif devir (borç)"
    }
  },
  {
    name: "Test 12: İzin Birikimi (Karışık)",
    leaveRecord: {
      employeeId: "test-employee-3",
      leaveByYear: [
        { year: 2022, entitled: 14, used: 8 },   // +6 kalan
        { year: 2023, entitled: 14, used: 20 },  // -6 borç (önceki kalan kullanıldı)
        { year: 2024, entitled: 20, used: 15 },  // +5 kalan
        { year: 2025, entitled: 20, used: 0 }
      ]
    },
    currentYear: 2025,
    expected: {
      carryover: 5, // (14-8) + (14-20) + (20-15) = 6 - 6 + 5 = 5
      totalAvailable: 25, // 20 (2025) + 5 (devir)
      reason: "Karışık kullanım senaryosu"
    }
  }
];

// 🧪 Test Çalıştırıcı
function runTests() {
  console.log('🧪 Yıllık İzin Sistemi Test Senaryoları\n');
  console.log('=' .repeat(80));
  
  let passedTests = 0;
  let failedTests = 0;
  const failedTestDetails = [];

  testScenarios.forEach((test, index) => {
    console.log(`\n📋 ${test.name}`);
    console.log('-'.repeat(80));
    
    let testPassed = true;
    const results = {};

    if (test.employee) {
      // İzin hesaplama testleri
      const actualAge = calculateAge(test.employee.dogumTarihi);
      const actualYearsOfService = calculateYearsOfService(test.employee.iseGirisTarihi);
      const actualEntitledDays = calculateEntitledLeaveDays(test.employee, test.year);

      results.age = actualAge;
      results.yearsOfService = actualYearsOfService;
      results.entitledDays = actualEntitledDays;

      console.log(`👤 Çalışan: ${test.employee.adSoyad}`);
      console.log(`📅 Doğum Tarihi: ${test.employee.dogumTarihi.toLocaleDateString('tr-TR')}`);
      console.log(`📅 İşe Giriş: ${test.employee.iseGirisTarihi.toLocaleDateString('tr-TR')}`);
      console.log(`\n📊 Sonuçlar:`);
      console.log(`   Yaş: ${actualAge} (Beklenen: ${test.expected.age})`);
      console.log(`   Hizmet Yılı: ${actualYearsOfService} (Beklenen: ${test.expected.yearsOfService})`);
      console.log(`   Hak Edilen İzin: ${actualEntitledDays} gün (Beklenen: ${test.expected.entitledDays} gün)`);
      console.log(`   Kural: ${test.expected.reason}`);

      // Test kontrolü
      if (actualAge !== test.expected.age || 
          actualYearsOfService !== test.expected.yearsOfService || 
          actualEntitledDays !== test.expected.entitledDays) {
        testPassed = false;
        failedTestDetails.push({
          name: test.name,
          expected: test.expected,
          actual: results
        });
      }

    } else if (test.leaveRecord) {
      // İzin birikimi testleri
      const actualCarryover = calculateCarryover(test.leaveRecord, test.currentYear);
      const currentYearLeave = test.leaveRecord.leaveByYear.find(y => y.year === test.currentYear);
      const actualAvailable = (currentYearLeave?.entitled || 0) + actualCarryover - (currentYearLeave?.used || 0);

      results.carryover = actualCarryover;
      results.totalAvailable = actualAvailable;

      console.log(`📊 İzin Birikimi Testi`);
      console.log(`   Yıl: ${test.currentYear}`);
      console.log(`\n   Geçmiş Yıllar:`);
      test.leaveRecord.leaveByYear
        .filter(y => y.year < test.currentYear)
        .forEach(y => {
          const remaining = y.entitled - y.used;
          console.log(`     ${y.year}: ${y.entitled} hak - ${y.used} kullanım = ${remaining} kalan`);
        });
      console.log(`\n📊 Sonuçlar:`);
      console.log(`   Devir: ${actualCarryover} gün (Beklenen: ${test.expected.carryover} gün)`);
      console.log(`   Toplam Kullanılabilir: ${actualAvailable} gün (Beklenen: ${test.expected.totalAvailable} gün)`);
      console.log(`   Açıklama: ${test.expected.reason}`);

      // Test kontrolü
      if (actualCarryover !== test.expected.carryover || 
          actualAvailable !== test.expected.totalAvailable) {
        testPassed = false;
        failedTestDetails.push({
          name: test.name,
          expected: test.expected,
          actual: results
        });
      }
    }

    if (testPassed) {
      console.log(`\n✅ TEST BAŞARILI`);
      passedTests++;
    } else {
      console.log(`\n❌ TEST BAŞARISIZ`);
      failedTests++;
    }
  });

  // Özet
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SONUÇLARI');
  console.log('='.repeat(80));
  console.log(`\n✅ Başarılı Testler: ${passedTests}/${testScenarios.length}`);
  console.log(`❌ Başarısız Testler: ${failedTests}/${testScenarios.length}`);
  console.log(`📈 Başarı Oranı: ${Math.round((passedTests / testScenarios.length) * 100)}%`);

  if (failedTests > 0) {
    console.log('\n❌ BAŞARISIZ TEST DETAYLARI:');
    console.log('-'.repeat(80));
    failedTestDetails.forEach(detail => {
      console.log(`\n${detail.name}`);
      console.log(`  Beklenen: ${JSON.stringify(detail.expected, null, 2)}`);
      console.log(`  Gerçek: ${JSON.stringify(detail.actual, null, 2)}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TÜM TESTLER TAMAMLANDI');
  console.log('='.repeat(80) + '\n');

  return {
    total: testScenarios.length,
    passed: passedTests,
    failed: failedTests,
    successRate: Math.round((passedTests / testScenarios.length) * 100)
  };
}

// Script olarak çalıştırıldığında testleri çalıştır
if (require.main === module) {
  const results = runTests();
  process.exit(results.failed > 0 ? 1 : 0);
}

// Export for use in other test files
module.exports = {
  runTests,
  testScenarios,
  calculateAge,
  calculateYearsOfService,
  calculateEntitledLeaveDays,
  calculateCarryover
};


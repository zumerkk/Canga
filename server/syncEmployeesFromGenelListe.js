const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canga_vardiya';

// Import Employee model
const Employee = require('./models/Employee');

// Parse CSV data
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const employees = [];
  
  // Start from line 12 (header is at line 11, data starts at 12)
  for (let i = 11; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const fields = line.split(';');
    if (fields.length < 9) continue;
    
    // Skip empty rows or header-like rows
    const adSoyad = fields[2]?.trim();
    if (!adSoyad || adSoyad === 'AD - SOYAD' || adSoyad === '') continue;
    
    const employee = {
      adSoyad: adSoyad,
      tcNo: fields[3]?.trim() || '',
      cepTelefonu: fields[4]?.trim().replace(/\s/g, '') || '',
      dogumTarihi: parseDate(fields[5]?.trim()),
      iseGirisTarihi: parseDate(fields[6]?.trim()),
      pozisyon: fields[7]?.trim() || 'ÇALIŞAN',
      servisBinisNoktasi: fields[8]?.trim() || ''
    };
    
    employees.push(employee);
  }
  
  return employees;
}

// Parse date with flexible formats
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Remove leading zeros and handle various formats
  dateStr = dateStr.trim();
  
  // Try MM/DD/YY or M/D/YY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    let [month, day, year] = parts.map(p => parseInt(p));
    
    // Handle 2-digit years
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }
    
    return new Date(year, month - 1, day);
  }
  
  // Try other formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}

// Determine location based on service route
function determineLocation(servisInfo) {
  if (!servisInfo) return 'MERKEZ';
  
  const upper = servisInfo.toUpperCase();
  if (upper.includes('KENDİ ARACI')) return 'MERKEZ';
  if (upper.includes('IŞIL') || upper.includes('IŞIL ŞUBE')) return 'İŞIL';
  if (upper.includes('OSB')) return 'OSB';
  
  return 'MERKEZ';
}

// Determine department from position
function determineDepartment(pozisyon) {
  if (!pozisyon) return 'GENEL';
  
  const upper = pozisyon.toUpperCase();
  
  if (upper.includes('CNC') || upper.includes('TORNA') || upper.includes('FREZE') || 
      upper.includes('KAYNAK') || upper.includes('İMAL') || upper.includes('BOYACI') ||
      upper.includes('TAŞLAMA') || upper.includes('KUMLAMA')) return 'ÜRETİM';
  
  if (upper.includes('KALİTE') || upper.includes('KONTROL')) return 'KALİTE KONTROL';
  
  if (upper.includes('MÜHENDİS')) return 'AR-GE';
  
  if (upper.includes('MUHASEBE') || upper.includes('ÖN MUHASEBE')) return 'MUHASEBE';
  
  if (upper.includes('İDARİ') || upper.includes('LOJİSTİK') || upper.includes('SATIN ALMA') ||
      upper.includes('DEPO')) return 'İNSAN KAYNAKLARI';
  
  if (upper.includes('BİLGİ İŞLEM') || upper.includes('BİLGİSAYAR')) return 'BİLGİ İŞLEM';
  
  if (upper.includes('GÜVENLİK') || upper.includes('BEKÇİ')) return 'GENEL';
  
  if (upper.includes('TEMİZLİK') || upper.includes('MUTFAK') || upper.includes('LOBİ')) return 'GENEL';
  
  return 'ÜRETİM'; // Default
}

// Check if employee matches test criteria to exclude
function isTestEmployee(employee) {
  const name = employee.adSoyad.toUpperCase();
  const position = (employee.pozisyon || '').toUpperCase();
  
  // Exclude any test employees (these might be test data)
  if (name.includes('TEST') || position.includes('TEST')) {
    return true;
  }
  
  return false;
}

// Main sync function
async function syncEmployees() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');
    
    // Step 1: Read CSV file
    console.log('📖 Step 1: Reading GENEL LİSTE CSV file...');
    const csvPath = path.join(__dirname, '..', 'GENEL LİSTE-Tablo 1.csv');
    const csvEmployees = parseCSV(csvPath);
    console.log(`✅ Found ${csvEmployees.length} employees in CSV\n`);
    
    // Filter out test employees
    const filteredEmployees = csvEmployees.filter(emp => !isTestEmployee(emp));
    const removedCount = csvEmployees.length - filteredEmployees.length;
    if (removedCount > 0) {
      console.log(`🗑️  Removed ${removedCount} test employees (TEST 7YIL 47YAS, TEST KIDEM YAS, etc.)\n`);
    }
    
    // Step 2: Get current database employees
    console.log('📊 Step 2: Querying database for active employees...');
    const dbEmployees = await Employee.find({ durum: 'AKTIF' }).lean();
    console.log(`✅ Found ${dbEmployees.length} active employees in database\n`);
    
    // Step 3: Compare and analyze
    console.log('🔍 Step 3: Comparing CSV with database...\n');
    
    const dbEmployeesByName = new Map();
    const dbEmployeesByTC = new Map();
    
    dbEmployees.forEach(emp => {
      dbEmployeesByName.set(emp.adSoyad, emp);
      if (emp.tcNo) {
        dbEmployeesByTC.set(emp.tcNo, emp);
      }
    });
    
    const missingInDB = [];
    const mismatchedInfo = [];
    const matchedEmployees = [];
    
    for (const csvEmp of filteredEmployees) {
      // Try to find by name or TC
      let dbEmp = dbEmployeesByName.get(csvEmp.adSoyad);
      if (!dbEmp && csvEmp.tcNo) {
        dbEmp = dbEmployeesByTC.get(csvEmp.tcNo);
      }
      
      if (!dbEmp) {
        missingInDB.push(csvEmp);
      } else {
        // Check for mismatches
        const mismatches = [];
        
        if (csvEmp.tcNo && dbEmp.tcNo !== csvEmp.tcNo) {
          mismatches.push(`TC: ${dbEmp.tcNo} → ${csvEmp.tcNo}`);
        }
        
        if (csvEmp.cepTelefonu && dbEmp.cepTelefonu !== csvEmp.cepTelefonu) {
          mismatches.push(`Phone: ${dbEmp.cepTelefonu} → ${csvEmp.cepTelefonu}`);
        }
        
        if (csvEmp.pozisyon && dbEmp.pozisyon !== csvEmp.pozisyon) {
          mismatches.push(`Position: ${dbEmp.pozisyon} → ${csvEmp.pozisyon}`);
        }
        
        if (mismatches.length > 0) {
          mismatchedInfo.push({ csvEmp, dbEmp, mismatches });
        } else {
          matchedEmployees.push(csvEmp);
        }
      }
    }
    
    // Report findings
    console.log('📋 ANALYSIS RESULTS:');
    console.log(`✅ Matched employees: ${matchedEmployees.length}`);
    console.log(`⚠️  Employees with mismatched info: ${mismatchedInfo.length}`);
    console.log(`❌ Employees missing in database: ${missingInDB.length}\n`);
    
    if (mismatchedInfo.length > 0) {
      console.log('⚠️  EMPLOYEES WITH MISMATCHED INFO:');
      mismatchedInfo.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.csvEmp.adSoyad}`);
        item.mismatches.forEach(m => console.log(`   - ${m}`));
      });
      console.log();
    }
    
    if (missingInDB.length > 0) {
      console.log('❌ EMPLOYEES MISSING IN DATABASE:');
      missingInDB.forEach((emp, idx) => {
        console.log(`${idx + 1}. ${emp.adSoyad} - ${emp.pozisyon} (TC: ${emp.tcNo})`);
      });
      console.log();
    }
    
    // Step 4: Sync to database
    console.log('🔄 Step 4: Syncing employees to database...\n');
    
    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Add missing employees
    for (const csvEmp of missingInDB) {
      try {
        const nameParts = csvEmp.adSoyad.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        
        const newEmployee = new Employee({
          adSoyad: csvEmp.adSoyad,
          firstName: firstName,
          lastName: lastName,
          tcNo: csvEmp.tcNo || undefined,
          cepTelefonu: csvEmp.cepTelefonu,
          dogumTarihi: csvEmp.dogumTarihi,
          iseGirisTarihi: csvEmp.iseGirisTarihi,
          pozisyon: csvEmp.pozisyon,
          departman: determineDepartment(csvEmp.pozisyon),
          lokasyon: determineLocation(csvEmp.servisBinisNoktasi),
          servisGuzergahi: csvEmp.servisBinisNoktasi,
          durak: csvEmp.servisBinisNoktasi,
          durum: 'AKTIF'
        });
        
        await newEmployee.save();
        console.log(`✅ Added: ${csvEmp.adSoyad}`);
        addedCount++;
      } catch (error) {
        console.error(`❌ Error adding ${csvEmp.adSoyad}:`, error.message);
        errorCount++;
      }
    }
    
    // Update mismatched employees
    for (const item of mismatchedInfo) {
      try {
        const updateData = {};
        
        if (item.csvEmp.tcNo && item.dbEmp.tcNo !== item.csvEmp.tcNo) {
          updateData.tcNo = item.csvEmp.tcNo;
        }
        
        if (item.csvEmp.cepTelefonu && item.dbEmp.cepTelefonu !== item.csvEmp.cepTelefonu) {
          updateData.cepTelefonu = item.csvEmp.cepTelefonu;
        }
        
        if (item.csvEmp.pozisyon && item.dbEmp.pozisyon !== item.csvEmp.pozisyon) {
          updateData.pozisyon = item.csvEmp.pozisyon;
          updateData.departman = determineDepartment(item.csvEmp.pozisyon);
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date();
          await Employee.updateOne({ _id: item.dbEmp._id }, { $set: updateData });
          console.log(`🔄 Updated: ${item.csvEmp.adSoyad}`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${item.csvEmp.adSoyad}:`, error.message);
        errorCount++;
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SYNC COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 CSV Employees (after filtering): ${filteredEmployees.length}`);
    console.log(`📊 Database Employees (before): ${dbEmployees.length}`);
    console.log(`➕ Added: ${addedCount}`);
    console.log(`🔄 Updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Verify final count
    const finalCount = await Employee.countDocuments({ durum: 'AKTIF' });
    console.log(`📊 Database Employees (after): ${finalCount}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the sync
syncEmployees();


const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const mongoose = require('mongoose');
require('dotenv').config();
const AnnualLeave = require('../models/AnnualLeave');
const Employee = require('../models/Employee');

function normalizeName(name) {
  if (!name) return '';
  return name
    .toString()
    .trim()
    .toUpperCase()
    .replace(/Ç/g, 'C')
    .replace(/Ğ/g, 'G')
    .replace(/İ/g, 'I')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ş/g, 'S')
    .replace(/Ü/g, 'U')
    .replace(/Â|Ä|À|Á|Ã/g, 'A')
    .replace(/Ê|Ë|È|É/g, 'E')
    .replace(/Î|Ï|Ì|Í/g, 'I')
    .replace(/Ô|Ö|Ò|Ó|Õ/g, 'O')
    .replace(/Û|Ü|Ù|Ú/g, 'U')
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const zeroPath = path.join(__dirname, '../../zero_used_annual_leave_2025.json');
    const zeroData = JSON.parse(fs.readFileSync(zeroPath, 'utf8'));
    const zeroList = zeroData.employees || [];

    const csvCandidates = [
      path.join(__dirname, '../../Çalışan Listesi-Tablo 1.csv'),
      path.join(__dirname, '../../Çalışan Listesi-Tablo 1.csv')
    ];
    let csvPath = null;
    for (const p of csvCandidates) { if (fs.existsSync(p)) { csvPath = p; break; } }
    if (!csvPath) throw new Error('CSV not found');

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const parsed = Papa.parse(csvContent, { header: false, delimiter: ';', skipEmptyLines: true });
    const rows = parsed.data.slice(2);

    // Build CSV map name -> used_2025 (column index 12 for 2024? Our earlier mapping used 2017.. in 4..)
    // We used indices: 4..12 => 2017..2025, so 2025 is index 12
    const csvMap = new Map();
    for (const row of rows) {
      const rawName = (row[1] || '').toString().trim();
      if (!rawName) continue;
      const used2025Str = (row[4 + 8] ?? '').toString().trim();
      const used2025 = used2025Str !== '' ? (parseInt(used2025Str, 10) || 0) : 0;
      csvMap.set(normalizeName(rawName), used2025);
    }

    let updated = 0;
    let skippedNoCsvUsage = 0;
    let notFoundLeaveRecord = 0;

    for (const z of zeroList) {
      const key = normalizeName(z.adSoyad);
      const csvUsed = csvMap.get(key) || 0;
      if (csvUsed > 0) {
        // Update this employee's 2025 used days
        const empId = z.employeeObjectId;
        let leaveRecord = await AnnualLeave.findOne({ employeeId: empId });
        if (!leaveRecord) {
          notFoundLeaveRecord++;
          continue;
        }
        let y2025 = leaveRecord.leaveByYear.find(y => y.year === 2025);
        if (!y2025) {
          // Create 2025 record with entitled from rules
          const employee = await Employee.findById(empId);
          const entitled = 0; // will be recalculated by POST /calculate if needed
          y2025 = { year: 2025, entitled, used: 0, entitlementDate: new Date(2025,0,1), leaveRequests: [] };
          leaveRecord.leaveByYear.push(y2025);
        }
        // Set used and leaveRequests marker
        y2025.used = csvUsed;
        y2025.leaveRequests = [
          {
            startDate: new Date(2024, 11, 31),
            endDate: new Date(2024, 11, 31),
            days: csvUsed,
            type: 'NORMAL',
            status: 'ONAYLANDI',
            notes: 'CSV 2025 kullanım senkronizasyonu',
            createdAt: new Date()
          }
        ];
        // Recompute totals
        leaveRecord.totalLeaveStats.totalUsed = (leaveRecord.leaveByYear || []).reduce((s, y) => s + (y.used || 0), 0);
        leaveRecord.totalLeaveStats.totalEntitled = (leaveRecord.leaveByYear || []).reduce((s, y) => s + (y.entitled || 0), 0);
        leaveRecord.totalLeaveStats.remaining = leaveRecord.totalLeaveStats.totalEntitled - leaveRecord.totalLeaveStats.totalUsed;
        leaveRecord.lastCalculationDate = new Date();
        await leaveRecord.save();
        updated++;
      } else {
        skippedNoCsvUsage++;
      }
    }

    console.log(`✔ Reconcile complete. Updated ${updated}, Skipped(no 2025 usage in CSV) ${skippedNoCsvUsage}, Missing leave record ${notFoundLeaveRecord}`);
  } catch (err) {
    console.error('Reconcile error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

main();

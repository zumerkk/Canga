const mongoose = require('mongoose');
const moment = require('moment');

/**
 * 📊 DAILY REPORT SERVICE
 * 
 * Günlük olarak attendance verilerini toplayan ve raporlayan servis
 * Her gece çalışarak günün verilerini toplar ve saklar
 */

class DailyReportService {
  constructor() {
    this.models = null;
  }

  // Lazy load models
  getModels() {
    if (!this.models) {
      this.models = {
        Attendance: require('../models/Attendance'),
        Employee: require('../models/Employee'),
        SystemLog: mongoose.models.SystemLog || mongoose.model('SystemLog', new mongoose.Schema({
          type: String,
          message: String,
          data: mongoose.Schema.Types.Mixed,
          level: { type: String, default: 'info' },
          timestamp: { type: Date, default: Date.now }
        }))
      };
    }
    return this.models;
  }

  // Günlük rapor oluştur
  async generateDailyReport(date = new Date()) {
    try {
      const { Attendance, Employee } = this.getModels();
      
      const startOfDay = moment(date).startOf('day').toDate();
      const endOfDay = moment(date).endOf('day').toDate();
      
      console.log(`Generating daily report for ${moment(date).format('YYYY-MM-DD')}...`);
      
      // Tüm aktif çalışanları al
      const activeEmployees = await Employee.find({ 
        isFormerEmployee: false 
      }).lean();
      
      // Bugünkü attendance kayıtlarını al
      const todayAttendance = await Attendance.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).populate('employeeId', 'adSoyad tcNo pozisyon lokasyon department').lean();
      
      // İstatistikleri hesapla
      const stats = {
        date: moment(date).format('YYYY-MM-DD'),
        totalEmployees: activeEmployees.length,
        totalCheckIns: 0,
        totalCheckOuts: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0,
        totalEarlyLeave: 0,
        totalOvertime: 0,
        avgWorkHours: 0,
        avgLateMinutes: 0,
        avgEarlyMinutes: 0,
        byLocation: {},
        byDepartment: {},
        byStatus: {},
        anomalies: [],
        details: []
      };
      
      // Gelen çalışanları takip et
      const presentEmployeeIds = new Set();
      let totalWorkMinutes = 0;
      let totalLateMinutes = 0;
      let totalEarlyMinutes = 0;
      
      // Her attendance kaydını işle
      for (const record of todayAttendance) {
        if (!record.employeeId) continue;
        
        presentEmployeeIds.add(record.employeeId._id.toString());
        
        // Check-in var mı?
        if (record.checkIn?.time) {
          stats.totalCheckIns++;
          
          // Lokasyon bazlı sayım
          const location = record.checkIn.location || 'MERKEZ';
          stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
        }
        
        // Check-out var mı?
        if (record.checkOut?.time) {
          stats.totalCheckOuts++;
        }
        
        // Department bazlı sayım
        if (record.employeeId?.department) {
          const dept = record.employeeId.department;
          if (!stats.byDepartment[dept]) {
            stats.byDepartment[dept] = {
              total: 0,
              present: 0,
              late: 0,
              early: 0
            };
          }
          stats.byDepartment[dept].present++;
        }
        
        // Durum bazlı sayım
        const status = record.status || 'NORMAL';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        
        // Geç kalma
        if (record.lateMinutes > 0) {
          stats.totalLate++;
          totalLateMinutes += record.lateMinutes;
          if (stats.byDepartment[record.employeeId?.department]) {
            stats.byDepartment[record.employeeId.department].late++;
          }
        }
        
        // Erken çıkma
        if (record.earlyLeaveMinutes > 0) {
          stats.totalEarlyLeave++;
          totalEarlyMinutes += record.earlyLeaveMinutes;
          if (stats.byDepartment[record.employeeId?.department]) {
            stats.byDepartment[record.employeeId.department].early++;
          }
        }
        
        // Fazla mesai
        if (record.overtimeMinutes > 0) {
          stats.totalOvertime++;
        }
        
        // Çalışma süresi
        if (record.workDuration > 0) {
          totalWorkMinutes += record.workDuration;
        }
        
        // Anomalileri topla
        if (record.anomalies && record.anomalies.length > 0) {
          for (const anomaly of record.anomalies) {
            stats.anomalies.push({
              employeeId: record.employeeId._id,
              employeeName: record.employeeId.adSoyad,
              type: anomaly.type,
              description: anomaly.description,
              severity: anomaly.severity
            });
          }
        }
        
        // Detaylı kayıt ekle
        stats.details.push({
          employeeId: record.employeeId._id,
          employeeName: record.employeeId.adSoyad,
          department: record.employeeId.department,
          location: record.checkIn?.location,
          checkInTime: record.checkIn?.time,
          checkOutTime: record.checkOut?.time,
          workDuration: record.workDuration,
          status: record.status,
          lateMinutes: record.lateMinutes,
          earlyLeaveMinutes: record.earlyLeaveMinutes,
          overtimeMinutes: record.overtimeMinutes
        });
      }
      
      // Gelen ve gelmeyen sayılarını hesapla
      stats.totalPresent = presentEmployeeIds.size;
      stats.totalAbsent = activeEmployees.length - presentEmployeeIds.size;
      
      // Gelmeyen çalışanları bul ve department bazlı say
      const absentEmployees = activeEmployees.filter(emp => 
        !presentEmployeeIds.has(emp._id.toString())
      );
      
      for (const emp of absentEmployees) {
        if (emp.department) {
          if (!stats.byDepartment[emp.department]) {
            stats.byDepartment[emp.department] = {
              total: 0,
              present: 0,
              late: 0,
              early: 0
            };
          }
          stats.byDepartment[emp.department].total++;
        }
      }
      
      // Department toplam sayılarını güncelle
      for (const emp of activeEmployees) {
        if (emp.department && stats.byDepartment[emp.department]) {
          stats.byDepartment[emp.department].total++;
        }
      }
      
      // Ortalama değerleri hesapla
      if (stats.totalPresent > 0) {
        stats.avgWorkHours = (totalWorkMinutes / stats.totalPresent / 60).toFixed(1);
      }
      
      if (stats.totalLate > 0) {
        stats.avgLateMinutes = Math.round(totalLateMinutes / stats.totalLate);
      }
      
      if (stats.totalEarlyLeave > 0) {
        stats.avgEarlyMinutes = Math.round(totalEarlyMinutes / stats.totalEarlyLeave);
      }
      
      // Yüzdeleri hesapla
      stats.attendanceRate = stats.totalEmployees > 0 
        ? Math.round((stats.totalPresent / stats.totalEmployees) * 100) 
        : 0;
        
      stats.punctualityRate = stats.totalPresent > 0
        ? Math.round(((stats.totalPresent - stats.totalLate) / stats.totalPresent) * 100)
        : 0;
      
      // Raporu kaydet (opsiyonel - gerekirse başka bir koleksiyona)
      await this.saveReportToDatabase(stats);
      
      // Log oluştur
      await this.logReport(stats);
      
      return stats;
      
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  // Haftalık rapor oluştur
  async generateWeeklyReport(startDate = moment().startOf('week').toDate()) {
    try {
      const reports = [];
      
      // 7 gün için rapor oluştur
      for (let i = 0; i < 7; i++) {
        const date = moment(startDate).add(i, 'days').toDate();
        const dailyReport = await this.generateDailyReport(date);
        reports.push(dailyReport);
      }
      
      // Haftalık özet hesapla
      const weeklyStats = {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(startDate).add(6, 'days').format('YYYY-MM-DD'),
        dailyReports: reports,
        summary: {
          avgAttendanceRate: 0,
          avgPunctualityRate: 0,
          totalWorkHours: 0,
          totalOvertimeHours: 0,
          totalAnomalies: 0,
          trendData: []
        }
      };
      
      // Özet hesaplamaları
      let totalAttendance = 0;
      let totalPunctuality = 0;
      let validDays = 0;
      
      for (const report of reports) {
        if (report.totalEmployees > 0) {
          totalAttendance += report.attendanceRate;
          totalPunctuality += report.punctualityRate;
          validDays++;
        }
        
        weeklyStats.summary.totalWorkHours += parseFloat(report.avgWorkHours || 0) * report.totalPresent;
        weeklyStats.summary.totalAnomalies += report.anomalies.length;
        
        // Trend verisi
        weeklyStats.summary.trendData.push({
          date: report.date,
          attendance: report.attendanceRate,
          punctuality: report.punctualityRate,
          present: report.totalPresent,
          absent: report.totalAbsent
        });
      }
      
      if (validDays > 0) {
        weeklyStats.summary.avgAttendanceRate = Math.round(totalAttendance / validDays);
        weeklyStats.summary.avgPunctualityRate = Math.round(totalPunctuality / validDays);
      }
      
      return weeklyStats;
      
    } catch (error) {
      console.error('Error generating weekly report:', error);
      throw error;
    }
  }

  // Aylık rapor oluştur
  async generateMonthlyReport(year = moment().year(), month = moment().month() + 1) {
    try {
      const startDate = moment([year, month - 1, 1]).toDate();
      const endDate = moment([year, month - 1, 1]).endOf('month').toDate();
      const daysInMonth = moment([year, month - 1]).daysInMonth();
      
      const reports = [];
      
      // Her gün için rapor oluştur
      for (let day = 1; day <= daysInMonth; day++) {
        const date = moment([year, month - 1, day]).toDate();
        const dailyReport = await this.generateDailyReport(date);
        reports.push(dailyReport);
      }
      
      // Aylık özet
      const monthlyStats = {
        year,
        month,
        monthName: moment([year, month - 1]).format('MMMM'),
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD'),
        dailyReports: reports,
        summary: {
          avgAttendanceRate: 0,
          avgPunctualityRate: 0,
          totalWorkDays: 0,
          totalWorkHours: 0,
          totalOvertimeHours: 0,
          mostCommonAnomalies: {},
          bestDay: null,
          worstDay: null
        }
      };
      
      // Hesaplamalar
      let totalAttendance = 0;
      let totalPunctuality = 0;
      let workDays = 0;
      let bestAttendance = 0;
      let worstAttendance = 100;
      
      for (const report of reports) {
        // Hafta sonu kontrolü (basit versiyon)
        const dayOfWeek = moment(report.date).day();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pazar ve Cumartesi değilse
          workDays++;
          
          if (report.totalEmployees > 0) {
            totalAttendance += report.attendanceRate;
            totalPunctuality += report.punctualityRate;
            
            if (report.attendanceRate > bestAttendance) {
              bestAttendance = report.attendanceRate;
              monthlyStats.summary.bestDay = report.date;
            }
            
            if (report.attendanceRate < worstAttendance) {
              worstAttendance = report.attendanceRate;
              monthlyStats.summary.worstDay = report.date;
            }
          }
        }
        
        monthlyStats.summary.totalWorkHours += parseFloat(report.avgWorkHours || 0) * report.totalPresent;
        
        // Anomali sayımı
        for (const anomaly of report.anomalies) {
          if (!monthlyStats.summary.mostCommonAnomalies[anomaly.type]) {
            monthlyStats.summary.mostCommonAnomalies[anomaly.type] = 0;
          }
          monthlyStats.summary.mostCommonAnomalies[anomaly.type]++;
        }
      }
      
      monthlyStats.summary.totalWorkDays = workDays;
      
      if (workDays > 0) {
        monthlyStats.summary.avgAttendanceRate = Math.round(totalAttendance / workDays);
        monthlyStats.summary.avgPunctualityRate = Math.round(totalPunctuality / workDays);
      }
      
      return monthlyStats;
      
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  // Raporu veritabanına kaydet
  async saveReportToDatabase(report) {
    try {
      // DailyReport modelini oluştur (yoksa)
      const DailyReport = mongoose.models.DailyReport || mongoose.model('DailyReport', new mongoose.Schema({
        date: { type: Date, required: true, unique: true },
        stats: mongoose.Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now }
      }));
      
      // Varsa güncelle, yoksa oluştur
      await DailyReport.findOneAndUpdate(
        { date: moment(report.date).toDate() },
        { 
          stats: report,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      
      console.log(`Report saved for ${report.date}`);
      
    } catch (error) {
      console.error('Error saving report to database:', error);
    }
  }

  // Log oluştur
  async logReport(stats) {
    try {
      const { SystemLog } = this.getModels();
      
      await SystemLog.create({
        type: 'DAILY_REPORT',
        message: `Daily report generated for ${stats.date}`,
        data: {
          date: stats.date,
          totalEmployees: stats.totalEmployees,
          totalPresent: stats.totalPresent,
          totalAbsent: stats.totalAbsent,
          attendanceRate: stats.attendanceRate,
          anomalyCount: stats.anomalies.length
        },
        level: 'info'
      });
      
    } catch (error) {
      console.error('Error logging report:', error);
    }
  }

  // Otomatik günlük rapor üretici (cron job için)
  async runDailyReportJob() {
    try {
      console.log('Starting daily report job...');
      
      // Dünkü raporu oluştur (genelde gece yarısı çalışır)
      const yesterday = moment().subtract(1, 'day').toDate();
      const report = await this.generateDailyReport(yesterday);
      
      console.log('Daily report completed:', {
        date: report.date,
        attendance: `${report.attendanceRate}%`,
        present: report.totalPresent,
        absent: report.totalAbsent
      });
      
      return report;
      
    } catch (error) {
      console.error('Daily report job failed:', error);
      throw error;
    }
  }
}

// Singleton instance
const dailyReportService = new DailyReportService();

module.exports = dailyReportService;

const cron = require('node-cron');
const dailyReportService = require('./dailyReportService');
const moment = require('moment');

/**
 * ⏰ CRON JOB SERVICE
 * 
 * Zamanlanmış görevleri yöneten servis
 * Günlük raporlar, temizlik işlemleri vb.
 */

class CronJobService {
  constructor() {
    this.jobs = [];
  }

  /**
   * Tüm cron job'ları başlat
   */
  startAllJobs() {
    console.log('🕐 Starting cron jobs...');
    
    // Günlük rapor job'ı - Her gece saat 01:00'de çalışır
    this.scheduleDailyReportJob();
    
    // Token temizleme job'ı - Her saat başı çalışır
    this.scheduleTokenCleanupJob();
    
    // Haftalık rapor job'ı - Her Pazartesi sabah 08:00'de
    this.scheduleWeeklyReportJob();
    
    // Aylık rapor job'ı - Her ayın 1'inde saat 09:00'da
    this.scheduleMonthlyReportJob();
    
    console.log(`✅ ${this.jobs.length} cron jobs started successfully`);
  }

  /**
   * Günlük rapor job'ı
   * Her gece saat 01:00'de dünün raporunu oluşturur
   */
  scheduleDailyReportJob() {
    const job = cron.schedule('0 1 * * *', async () => {
      console.log('📊 Running daily report job at', new Date().toISOString());
      
      try {
        // Dünkü raporu oluştur
        const yesterday = moment().subtract(1, 'day').toDate();
        const report = await dailyReportService.generateDailyReport(yesterday);
        
        console.log('✅ Daily report completed:', {
          date: report.date,
          attendanceRate: `${report.attendanceRate}%`,
          totalPresent: report.totalPresent,
          totalAbsent: report.totalAbsent
        });
        
      } catch (error) {
        console.error('❌ Daily report job failed:', error);
      }
    });
    
    this.jobs.push({
      name: 'Daily Report',
      schedule: '0 1 * * *',
      description: 'Her gece saat 01:00',
      job
    });
  }

  /**
   * Token temizleme job'ı
   * Her saat başı süresi dolmuş token'ları temizler
   */
  scheduleTokenCleanupJob() {
    const job = cron.schedule('0 * * * *', async () => {
      console.log('🧹 Running token cleanup job at', new Date().toISOString());
      
      try {
        const AttendanceToken = require('../models/AttendanceToken');
        const SystemQRToken = require('../models/SystemQRToken');
        
        // Attendance token'larını temizle
        const attendanceResult = await AttendanceToken.cleanupExpired();
        
        // System QR token'larını temizle
        const systemResult = await SystemQRToken.updateMany(
          {
            status: 'ACTIVE',
            expiresAt: { $lt: new Date() }
          },
          {
            status: 'EXPIRED'
          }
        );
        
        console.log(`✅ Token cleanup completed: ${attendanceResult} attendance tokens, ${systemResult.modifiedCount} system tokens`);
        
      } catch (error) {
        console.error('❌ Token cleanup job failed:', error);
      }
    });
    
    this.jobs.push({
      name: 'Token Cleanup',
      schedule: '0 * * * *',
      description: 'Her saat başı',
      job
    });
  }

  /**
   * Haftalık rapor job'ı
   * Her Pazartesi sabah 08:00'de geçen haftanın raporunu oluşturur
   */
  scheduleWeeklyReportJob() {
    const job = cron.schedule('0 8 * * 1', async () => {
      console.log('📊 Running weekly report job at', new Date().toISOString());
      
      try {
        // Geçen haftanın başlangıcı
        const lastWeekStart = moment().subtract(1, 'week').startOf('week').toDate();
        const report = await dailyReportService.generateWeeklyReport(lastWeekStart);
        
        console.log('✅ Weekly report completed:', {
          week: `${report.startDate} - ${report.endDate}`,
          avgAttendance: `${report.summary.avgAttendanceRate}%`,
          totalWorkHours: report.summary.totalWorkHours
        });
        
      } catch (error) {
        console.error('❌ Weekly report job failed:', error);
      }
    });
    
    this.jobs.push({
      name: 'Weekly Report',
      schedule: '0 8 * * 1',
      description: 'Her Pazartesi 08:00',
      job
    });
  }

  /**
   * Aylık rapor job'ı
   * Her ayın 1'inde saat 09:00'da geçen ayın raporunu oluşturur
   */
  scheduleMonthlyReportJob() {
    const job = cron.schedule('0 9 1 * *', async () => {
      console.log('📊 Running monthly report job at', new Date().toISOString());
      
      try {
        // Geçen ay
        const lastMonth = moment().subtract(1, 'month');
        const year = lastMonth.year();
        const month = lastMonth.month() + 1; // moment 0-indexed, bizim servis 1-indexed
        
        const report = await dailyReportService.generateMonthlyReport(year, month);
        
        console.log('✅ Monthly report completed:', {
          month: `${report.monthName} ${report.year}`,
          avgAttendance: `${report.summary.avgAttendanceRate}%`,
          totalWorkDays: report.summary.totalWorkDays,
          totalWorkHours: report.summary.totalWorkHours
        });
        
      } catch (error) {
        console.error('❌ Monthly report job failed:', error);
      }
    });
    
    this.jobs.push({
      name: 'Monthly Report', 
      schedule: '0 9 1 * *',
      description: 'Her ayın 1\'i saat 09:00',
      job
    });
  }

  /**
   * Manuel olarak bir job'ı çalıştır
   */
  async runJobManually(jobName) {
    switch(jobName) {
      case 'daily':
        console.log('🔄 Running daily report manually...');
        return await dailyReportService.runDailyReportJob();
        
      case 'weekly':
        console.log('🔄 Running weekly report manually...');
        const lastWeekStart = moment().subtract(1, 'week').startOf('week').toDate();
        return await dailyReportService.generateWeeklyReport(lastWeekStart);
        
      case 'monthly':
        console.log('🔄 Running monthly report manually...');
        const lastMonth = moment().subtract(1, 'month');
        return await dailyReportService.generateMonthlyReport(lastMonth.year(), lastMonth.month() + 1);
        
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  /**
   * Tüm job'ları durdur
   */
  stopAllJobs() {
    console.log('🛑 Stopping all cron jobs...');
    
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`  - ${name} stopped`);
    });
    
    this.jobs = [];
    console.log('✅ All cron jobs stopped');
  }

  /**
   * Job listesini getir
   */
  getJobList() {
    return this.jobs.map(({ name, schedule, description }) => ({
      name,
      schedule,
      description
    }));
  }
}

// Singleton instance
const cronJobService = new CronJobService();

module.exports = cronJobService;

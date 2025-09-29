/**
 * 🔄 Servis Senkronizasyon Servisi
 * 
 * Bu servis employees ve services sayfaları arasında
 * gerçek zamanlı senkronizasyon sağlar
 */

const Employee = require('../models/Employee');
const ServiceRoute = require('../models/ServiceRoute');
const ServiceSchedule = require('../models/ServiceSchedule');

class ServiceSyncService {
  constructor() {
    this.subscribers = new Map(); // WebSocket bağlantıları
  }

  // WebSocket subscriber ekle
  addSubscriber(id, ws) {
    this.subscribers.set(id, ws);
  }

  // Subscriber kaldır
  removeSubscriber(id) {
    this.subscribers.delete(id);
  }

  // Tüm subscriber'lara mesaj gönder
  broadcast(event, data) {
    const message = JSON.stringify({ event, data, timestamp: new Date() });
    
    this.subscribers.forEach((ws, id) => {
      try {
        if (ws.readyState === 1) { // OPEN
          ws.send(message);
        } else {
          this.subscribers.delete(id);
        }
      } catch (error) {
        console.error(`WebSocket error for subscriber ${id}:`, error);
        this.subscribers.delete(id);
      }
    });
  }

  // Employee güncelleme ile tetiklenen senkronizasyon
  async syncEmployeeUpdate(employeeId, updateData) {
    try {
      const employee = await Employee.findById(employeeId);
      if (!employee) return;

      // Route istatistiklerini güncelle
      if (updateData.serviceInfo || updateData.servisGuzergahi) {
        await this.updateRouteStatistics(
          updateData.serviceInfo?.routeId || 
          await this.getRouteIdByName(updateData.servisGuzergahi)
        );

        // Eski route'un istatistiklerini de güncelle
        if (employee.serviceInfo?.routeId) {
          await this.updateRouteStatistics(employee.serviceInfo.routeId);
        }
      }

      // Real-time broadcast
      this.broadcast('employee_updated', {
        employeeId,
        employee: await this.getEmployeeData(employeeId),
        affectedRoutes: await this.getAffectedRoutesData(employee, updateData)
      });

    } catch (error) {
      console.error('Employee sync error:', error);
    }
  }

  // Route güncelleme ile tetiklenen senkronizasyon
  async syncRouteUpdate(routeId, updateData) {
    try {
      const route = await ServiceRoute.findById(routeId);
      if (!route) return;

      // Route'daki employee'leri güncelle
      if (updateData.stops) {
        await this.syncRouteStopsWithEmployees(routeId, updateData.stops);
      }

      // Route istatistiklerini güncelle
      await this.updateRouteStatistics(routeId);

      // Real-time broadcast
      this.broadcast('route_updated', {
        routeId,
        route: await this.getRouteData(routeId),
        affectedEmployees: await this.getRouteEmployeesData(routeId)
      });

    } catch (error) {
      console.error('Route sync error:', error);
    }
  }

  // Route stops ile employee assignments senkronize et
  async syncRouteStopsWithEmployees(routeId, stops) {
    const employees = await Employee.find({
      $or: [
        { 'serviceInfo.routeId': routeId },
        { servisGuzergahi: { $exists: true } }
      ]
    });

    for (const employee of employees) {
      const employeeStop = employee.serviceInfo?.stopName || employee.durak;
      const matchingStop = stops.find(stop => 
        this.normalizeText(stop.name) === this.normalizeText(employeeStop)
      );

      if (matchingStop) {
        await Employee.findByIdAndUpdate(employee._id, {
          $set: {
            'serviceInfo.stopOrder': matchingStop.order,
            updatedAt: new Date()
          }
        });
      }
    }
  }

  // Route istatistiklerini güncelle
  async updateRouteStatistics(routeId) {
    if (!routeId) return;

    const route = await ServiceRoute.findById(routeId);
    if (!route) return;

    const totalEmployees = await Employee.countDocuments({
      $or: [
        { 'serviceInfo.routeId': routeId },
        { servisGuzergahi: route.routeName }
      ]
    });

    const activeEmployees = await Employee.countDocuments({
      $or: [
        { 'serviceInfo.routeId': routeId },
        { servisGuzergahi: route.routeName }
      ],
      durum: 'AKTIF'
    });

    await ServiceRoute.findByIdAndUpdate(routeId, {
      $set: {
        'statistics.totalEmployees': totalEmployees,
        'statistics.activeEmployees': activeEmployees,
        updatedAt: new Date()
      }
    });

    return { totalEmployees, activeEmployees };
  }

  // Employee data'sını format'la
  async getEmployeeData(employeeId) {
    const employee = await Employee.findById(employeeId)
      .populate('serviceInfo.routeId');
    
    if (!employee) return null;

    return {
      _id: employee._id,
      fullName: employee.adSoyad || employee.fullName,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.pozisyon,
      serviceInfo: employee.serviceInfo,
      durak: employee.durak,
      servisGuzergahi: employee.servisGuzergahi,
      durum: employee.durum
    };
  }

  // Route data'sını format'la
  async getRouteData(routeId) {
    const route = await ServiceRoute.findById(routeId);
    if (!route) return null;

    const employeesCount = await Employee.countDocuments({
      $or: [
        { 'serviceInfo.routeId': routeId },
        { servisGuzergahi: route.routeName }
      ],
      durum: 'AKTIF'
    });

    return {
      _id: route._id,
      routeName: route.routeName,
      routeCode: route.routeCode,
      stops: route.stops,
      statistics: {
        ...route.statistics,
        activeEmployees: employeesCount
      },
      status: route.status,
      schedule: route.schedule
    };
  }

  // Route'un employee'lerini getir
  async getRouteEmployeesData(routeId) {
    const route = await ServiceRoute.findById(routeId);
    if (!route) return [];

    const employees = await Employee.find({
      $or: [
        { 'serviceInfo.routeId': routeId },
        { servisGuzergahi: route.routeName }
      ],
      durum: 'AKTIF'
    });

    return employees.map(emp => this.getEmployeeData(emp._id));
  }

  // Etkilenen route'ları getir
  async getAffectedRoutesData(employee, updateData) {
    const affectedRoutes = [];

    // Eski route
    if (employee.serviceInfo?.routeId) {
      const oldRouteData = await this.getRouteData(employee.serviceInfo.routeId);
      if (oldRouteData) affectedRoutes.push(oldRouteData);
    }

    // Yeni route
    if (updateData.serviceInfo?.routeId && 
        updateData.serviceInfo.routeId !== employee.serviceInfo?.routeId) {
      const newRouteData = await this.getRouteData(updateData.serviceInfo.routeId);
      if (newRouteData) affectedRoutes.push(newRouteData);
    }

    return affectedRoutes;
  }

  // Route ID'yi isimden bul
  async getRouteIdByName(routeName) {
    if (!routeName) return null;
    const route = await ServiceRoute.findOne({ routeName });
    return route?._id;
  }

  // Text normalizasyonu
  normalizeText(text) {
    if (!text) return '';
    return text.toString().trim().toUpperCase()
      .replace(/[IİıĞğŞşÇçÖöÜü]/g, match => {
        const map = { 'I': 'İ', 'İ': 'İ', 'ı': 'i', 'Ğ': 'G', 'ğ': 'g', 'Ş': 'Ş', 'ş': 'ş', 'Ç': 'Ç', 'ç': 'ç', 'Ö': 'Ö', 'ö': 'ö', 'Ü': 'Ü', 'ü': 'ü' };
        return map[match] || match;
      });
  }

  // Bulk sync işlemi - CSV import sonrası kullanılır
  async performBulkSync() {
    console.log('🔄 Bulk senkronizasyon başlatılıyor...');
    
    try {
      // Tüm route'ların istatistiklerini güncelle
      const routes = await ServiceRoute.find();
      for (const route of routes) {
        await this.updateRouteStatistics(route._id);
      }

      // Employee service info ve legacy field'ları senkronize et
      const employees = await Employee.find();
      for (const employee of employees) {
        const hasServiceInfo = employee.serviceInfo && employee.serviceInfo.routeName;
        const hasLegacyInfo = employee.servisGuzergahi || employee.durak;

        // Service info eksikse legacy'den doldur
        if (!hasServiceInfo && hasLegacyInfo) {
          const route = await ServiceRoute.findOne({ routeName: employee.servisGuzergahi });
          
          await Employee.findByIdAndUpdate(employee._id, {
            $set: {
              serviceInfo: {
                usesService: employee.servisGuzergahi !== 'KENDİ ARACI İLE GELENLER',
                routeName: employee.servisGuzergahi,
                stopName: employee.durak,
                routeId: route?._id,
                usesOwnCar: employee.servisGuzergahi === 'KENDİ ARACI İLE GELENLER'
              }
            }
          });
        }
        // Legacy field'lar eksikse service info'dan doldur
        else if (hasServiceInfo && !hasLegacyInfo) {
          await Employee.findByIdAndUpdate(employee._id, {
            $set: {
              servisGuzergahi: employee.serviceInfo.routeName,
              durak: employee.serviceInfo.stopName
            }
          });
        }
      }

      // Global broadcast
      this.broadcast('bulk_sync_completed', {
        message: 'Veriler senkronize edildi',
        timestamp: new Date(),
        routesCount: routes.length,
        employeesCount: employees.length
      });

      console.log('✅ Bulk senkronizasyon tamamlandı');
      
    } catch (error) {
      console.error('❌ Bulk sync hatası:', error);
      throw error;
    }
  }

  // Health check
  getStatus() {
    return {
      activeSubscribers: this.subscribers.size,
      status: 'running',
      lastUpdate: new Date()
    };
  }
}

// Singleton instance
const serviceSyncService = new ServiceSyncService();

module.exports = serviceSyncService;

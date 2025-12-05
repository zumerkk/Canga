const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { EMPLOYEE_STATUS } = require('../constants/employee.constants');

/**
 * 🔴 LIVE STREAM ROUTES
 * Server-Sent Events (SSE) ile gerçek zamanlı veri akışı
 */

// Aktif SSE bağlantıları
const clients = new Map();

// ============================================
// SSE - CANLI İSTATİSTİK AKIŞI
// ============================================

/**
 * GET /api/live-stream/attendance
 * Real-time attendance updates via SSE
 */
router.get('/attendance', async (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx için
  
  // Client ID oluştur
  const clientId = Date.now().toString();
  const { location, branch } = req.query;
  
  console.log(`🔴 SSE Client connected: ${clientId}`);
  
  // Client'ı kaydet
  clients.set(clientId, { res, location, branch });
  
  // İlk veriyi gönder
  try {
    const initialData = await getAttendanceStats(location, branch);
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);
  } catch (error) {
    console.error('SSE initial data error:', error);
  }
  
  // Heartbeat - her 30 saniyede bir ping gönder
  const heartbeat = setInterval(() => {
    res.write(`:ping\n\n`);
  }, 30000);
  
  // Client kapandığında temizle
  req.on('close', () => {
    console.log(`🔴 SSE Client disconnected: ${clientId}`);
    clearInterval(heartbeat);
    clients.delete(clientId);
  });
});

/**
 * Attendance istatistiklerini getir
 */
const getAttendanceStats = async (location, branch) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const query = { date: today };
  if (location && location !== 'TÜM') {
    query['checkIn.location'] = location;
  }
  if (branch && branch !== 'TÜM') {
    query['checkIn.branch'] = branch;
  }
  
  const records = await Attendance.find(query)
    .populate('employeeId', 'adSoyad employeeId pozisyon departman lokasyon profilePhoto')
    .lean();
  
  // Toplam aktif çalışan sayısı
  const totalQuery = { durum: EMPLOYEE_STATUS.ACTIVE };
  if (location && location !== 'TÜM') {
    totalQuery.lokasyon = location;
  }
  const totalEmployees = await Employee.countDocuments(totalQuery);
  
  // Benzersiz çalışan sayısı (bugün gelen)
  const uniqueEmployeeIds = new Set(records.map(r => r.employeeId?._id?.toString()).filter(Boolean));
  
  const stats = {
    totalEmployees,
    present: records.filter(r => r.checkIn?.time && !r.checkOut?.time).length,
    checkedOut: records.filter(r => r.checkIn?.time && r.checkOut?.time).length,
    absent: totalEmployees - uniqueEmployeeIds.size,
    late: records.filter(r => r.status === 'LATE').length,
    incomplete: records.filter(r => r.status === 'INCOMPLETE' || r.needsCorrection).length,
    noLocation: records.filter(r => r.checkIn?.time && (!r.checkIn?.coordinates || !r.checkIn?.coordinates?.latitude)).length
  };
  
  // Son 10 aktivite
  const recentActivity = records
    .sort((a, b) => new Date(b.checkIn?.time || b.checkOut?.time) - new Date(a.checkIn?.time || a.checkOut?.time))
    .slice(0, 10)
    .map(r => ({
      _id: r._id,
      employee: {
        _id: r.employeeId?._id,
        adSoyad: r.employeeId?.adSoyad,
        pozisyon: r.employeeId?.pozisyon,
        profilePhoto: r.employeeId?.profilePhoto
      },
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      status: r.status,
      branch: r.checkIn?.branch
    }));
  
  return {
    type: 'STATS_UPDATE',
    timestamp: new Date().toISOString(),
    stats,
    recentActivity,
    recordCount: records.length
  };
};

/**
 * Tüm bağlı client'lara güncelleme gönder
 */
const broadcastUpdate = async () => {
  if (clients.size === 0) return;
  
  try {
    // Her client için kendi filtresine göre veri al
    for (const [clientId, client] of clients) {
      try {
        const data = await getAttendanceStats(client.location, client.branch);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error(`SSE broadcast error for client ${clientId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('SSE broadcast error:', error);
  }
};

// 5 saniyede bir güncelleme gönder
setInterval(broadcastUpdate, 5000);

/**
 * POST /api/live-stream/notify
 * Manuel olarak tüm client'lara bildirim gönder
 */
router.post('/notify', async (req, res) => {
  try {
    const { type, message, data } = req.body;
    
    const notification = {
      type: type || 'NOTIFICATION',
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    for (const [, client] of clients) {
      client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
    
    res.json({
      success: true,
      message: `Notification sent to ${clients.size} clients`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/live-stream/status
 * SSE bağlantı durumu
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    connectedClients: clients.size,
    clients: Array.from(clients.keys())
  });
});

// Export broadcast function for use in other routes
router.broadcastUpdate = broadcastUpdate;
router.broadcastEvent = (event) => {
  for (const [, client] of clients) {
    client.res.write(`data: ${JSON.stringify(event)}\n\n`);
  }
};

module.exports = router;

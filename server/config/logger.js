const winston = require('winston');
const path = require('path');

// Log formatı
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console formatı (development için)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Logs klasörünün var olduğundan emin ol
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger konfigürasyonu
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'canga-hr-system',
    version: '2.0.0'
  },
  transports: [
    // Error logs - sadece error seviyesi
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      handleExceptions: false,
      handleRejections: false
    }),
    
    // Combined logs - tüm seviyeler
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: logFormat,
      handleExceptions: false,
      handleRejections: false
    }),
    
    // Audit logs - kullanıcı işlemleri için özel
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 20,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      handleExceptions: false,
      handleRejections: false
    })
  ],
  
  // Unhandled exception ve rejection handling - ayrı dosyalar
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ],
  
  // Hata durumunda logger'ın kendisinin çökmesini engelle
  exitOnError: false
});

// Development ortamında console'a da log yaz
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Audit logging için özel fonksiyon
const auditLogger = {
  log: (action, userId, details = {}, req = null) => {
    const auditData = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      details,
      ip: req ? (req.ip || req.connection.remoteAddress) : null,
      userAgent: req ? req.get('User-Agent') : null,
      sessionId: req ? req.sessionID : null
    };
    
    logger.info('AUDIT_LOG', auditData);
  },
  
  // Çalışan işlemleri
  employeeAction: (action, userId, employeeId, details = {}, req = null) => {
    auditLogger.log(`EMPLOYEE_${action.toUpperCase()}`, userId, {
      employeeId,
      ...details
    }, req);
  },
  
  // Vardiya işlemleri
  shiftAction: (action, userId, shiftId, details = {}, req = null) => {
    auditLogger.log(`SHIFT_${action.toUpperCase()}`, userId, {
      shiftId,
      ...details
    }, req);
  },
  
  // Sistem işlemleri
  systemAction: (action, userId, details = {}, req = null) => {
    auditLogger.log(`SYSTEM_${action.toUpperCase()}`, userId, details, req);
  },
  
  // Güvenlik olayları
  securityEvent: (event, userId, details = {}, req = null) => {
    auditLogger.log(`SECURITY_${event.toUpperCase()}`, userId, {
      severity: 'high',
      ...details
    }, req);
  }
};

// Performance logging için özel fonksiyon
const performanceLogger = {
  logApiCall: (method, url, duration, statusCode, userId = null) => {
    logger.info('API_PERFORMANCE', {
      method,
      url,
      duration: `${duration}ms`,
      statusCode,
      userId,
      timestamp: new Date().toISOString()
    });
  },
  
  logDatabaseQuery: (operation, collection, duration, recordCount = null) => {
    logger.info('DB_PERFORMANCE', {
      operation,
      collection,
      duration: `${duration}ms`,
      recordCount,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  logger,
  auditLogger,
  performanceLogger
};
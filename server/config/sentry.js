const Sentry = require('@sentry/node');

// Sentry konfigürasyonu
const initSentry = () => {
  // Sadece production ve staging ortamlarında aktif
  if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_FORCE_ENABLE) {
    console.log('🔧 Sentry: Development modunda devre dışı');
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️ Sentry: SENTRY_DSN environment variable bulunamadı');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // HTTP istekleri için otomatik instrumentation
      new Sentry.Integrations.Http({ tracing: true }),
      
      // Express.js entegrasyonu
      new Sentry.Integrations.Express({ app: null }),
      
      // MongoDB entegrasyonu
      new Sentry.Integrations.Mongo(),
    ],
    
    // Release tracking
    release: process.env.SENTRY_RELEASE || 'canga-hr-system@2.0.0',
    
    // Kullanıcı context'i için
    beforeSend(event, hint) {
      // Hassas bilgileri filtrele
      if (event.request) {
        // Password ve token bilgilerini temizle
        if (event.request.data) {
          const data = typeof event.request.data === 'string' 
            ? JSON.parse(event.request.data) 
            : event.request.data;
          
          if (data.password) data.password = '[Filtered]';
          if (data.token) data.token = '[Filtered]';
          if (data.apiKey) data.apiKey = '[Filtered]';
          
          event.request.data = JSON.stringify(data);
        }
        
        // Headers'dan hassas bilgileri temizle
        if (event.request.headers) {
          if (event.request.headers.authorization) {
            event.request.headers.authorization = '[Filtered]';
          }
          if (event.request.headers['x-api-key']) {
            event.request.headers['x-api-key'] = '[Filtered]';
          }
        }
      }
      
      return event;
    },
    
    // Tag'ler
    initialScope: {
      tags: {
        component: 'canga-hr-backend',
        version: '2.0.0'
      }
    }
  });
  
  console.log('✅ Sentry: Error tracking aktif');
};

// Express middleware'leri
const getSentryMiddlewares = (app) => {
  if (!Sentry.getCurrentHub().getClient()) {
    return {
      requestHandler: (req, res, next) => next(),
      tracingHandler: (req, res, next) => next(),
      errorHandler: (error, req, res, next) => next(error)
    };
  }
  
  return {
    // Request handler - her request'in başında
    requestHandler: Sentry.Handlers.requestHandler({
      user: ['id', 'email', 'role'],
      request: ['method', 'url', 'headers'],
      transaction: 'methodPath'
    }),
    
    // Tracing handler - performance monitoring için
    tracingHandler: Sentry.Handlers.tracingHandler(),
    
    // Error handler - hataları yakalamak için
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // 4xx hataları Sentry'ye gönderme (client hataları)
        if (error.status && error.status >= 400 && error.status < 500) {
          return false;
        }
        return true;
      }
    })
  };
};

// Manuel hata raporlama fonksiyonları
const sentryLogger = {
  // Hata loglama
  captureError: (error, context = {}) => {
    if (!Sentry.getCurrentHub().getClient()) return;
    
    Sentry.withScope((scope) => {
      // Context bilgilerini ekle
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      
      Sentry.captureException(error);
    });
  },
  
  // Mesaj loglama
  captureMessage: (message, level = 'info', context = {}) => {
    if (!Sentry.getCurrentHub().getClient()) return;
    
    Sentry.withScope((scope) => {
      scope.setLevel(level);
      
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
      
      Sentry.captureMessage(message);
    });
  },
  
  // Kullanıcı context'i set etme
  setUser: (user) => {
    if (!Sentry.getCurrentHub().getClient()) return;
    
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department
    });
  },
  
  // Tag ekleme
  setTag: (key, value) => {
    if (!Sentry.getCurrentHub().getClient()) return;
    Sentry.setTag(key, value);
  },
  
  // Performance transaction başlatma
  startTransaction: (name, op = 'http') => {
    if (!Sentry.getCurrentHub().getClient()) {
      return {
        setTag: () => {},
        setData: () => {},
        finish: () => {}
      };
    }
    
    return Sentry.startTransaction({ name, op });
  }
};

// Database işlemleri için özel error handling
const handleDatabaseError = (error, operation, collection) => {
  sentryLogger.captureError(error, {
    database: {
      operation,
      collection,
      errorCode: error.code,
      errorMessage: error.message
    }
  });
};

// API endpoint'leri için özel error handling
const handleApiError = (error, req, endpoint) => {
  sentryLogger.captureError(error, {
    api: {
      endpoint,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    },
    user: req.user ? {
      id: req.user.id,
      role: req.user.role
    } : null
  });
};

module.exports = {
  initSentry,
  getSentryMiddlewares,
  sentryLogger,
  handleDatabaseError,
  handleApiError
};
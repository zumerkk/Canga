const jwt = require('jsonwebtoken');

/**
 * 🔐 AUTHENTICATION MIDDLEWARE
 * JWT token doğrulama middleware'i
 */

const authMiddleware = async (req, res, next) => {
  try {
    // Token'ı header'dan al
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      // Development modda auth bypass (optional)
      if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
        console.log('⚠️ Auth bypassed in development mode');
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
    }
    
    // Token'ı doğrula
    const JWT_SECRET = process.env.JWT_SECRET || 'canga_secret_key_2024';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Decoded bilgileri request'e ekle
    req.user = decoded;
    req.userId = decoded.userId || decoded.id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Development modda auth bypass (fallback)
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Auth error bypassed in development mode');
      return next();
    }
    
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token',
      error: error.message
    });
  }
};

// Optional middleware - sadece uyarı verir, bloke etmez
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const JWT_SECRET = process.env.JWT_SECRET || 'canga_secret_key_2024';
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.userId = decoded.userId || decoded.id;
    }
  } catch (error) {
    console.warn('Optional auth failed, continuing without auth:', error.message);
  }
  
  next();
};

// Admin check middleware
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kimlik doğrulama gerekli'
      });
    }
    
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yönetici yetkisi gerekli'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Yetki kontrolü hatası',
      error: error.message
    });
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  adminMiddleware
};


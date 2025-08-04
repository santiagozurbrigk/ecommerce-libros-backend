const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Rate limiting para prevenir ataques de fuerza bruta
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limit específico para login
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    error: 'Demasiados intentos de login. Intenta nuevamente en 15 minutos.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para registro
const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros por hora
  message: {
    error: 'Demasiados intentos de registro. Intenta nuevamente en 1 hora.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configurar headers de seguridad con Helmet
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.mercadopago.com"],
        frameSrc: ["'self'", "https://www.mercadopago.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
};

// Sanitizar datos de MongoDB
const configureMongoSanitize = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`⚠️  Intento de inyección NoSQL detectado: ${key}`);
    },
  });
};

// Prevenir XSS
const configureXSS = () => {
  return xss();
};

// Prevenir HTTP Parameter Pollution
const configureHPP = () => {
  return hpp({
    whitelist: ['category', 'page', 'limit', 'search'] // Parámetros permitidos
  });
};

// Middleware para validar tipos de contenido
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type debe ser application/json'
      });
    }
  }
  next();
};

// Middleware para validar tamaño de payload
const validatePayloadSize = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'], 10);
  const maxSize = 1024 * 1024; // 1MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Payload demasiado grande. Máximo 1MB permitido.'
    });
  }
  next();
};

// Middleware para logging de seguridad
const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i
  ];

  const userAgent = req.headers['user-agent'] || '';
  const url = req.url;
  const method = req.method;
  const ip = req.ip || req.connection.remoteAddress;

  // Detectar patrones sospechosos
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent) || pattern.test(JSON.stringify(req.body))
  );

  if (isSuspicious) {
    console.warn(`🚨 Actividad sospechosa detectada:`, {
      ip,
      method,
      url,
      userAgent: userAgent.substring(0, 100),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Middleware para prevenir clickjacking
const preventClickjacking = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

// Middleware para prevenir MIME type sniffing
const preventMimeSniffing = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

// Middleware para configurar referrer policy
const setReferrerPolicy = (req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

module.exports = {
  createRateLimit,
  loginRateLimit,
  registerRateLimit,
  configureHelmet,
  configureMongoSanitize,
  configureXSS,
  configureHPP,
  validateContentType,
  validatePayloadSize,
  securityLogger,
  preventClickjacking,
  preventMimeSniffing,
  setReferrerPolicy
}; 
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Importar middlewares de seguridad
const {
  configureHelmet,
  configureMongoSanitize,
  configureXSS,
  configureHPP,
  validateContentType,
  validatePayloadSize,
  securityLogger,
  preventClickjacking,
  preventMimeSniffing,
  setReferrerPolicy,
  loginRateLimit,
  registerRateLimit,
  createRateLimit
} = require('./middlewares/security');

dotenv.config();

// Validar variables de entorno requeridas
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  process.exit(1);
}

// Validar variables de entorno de AWS S3 (opcionales pero recomendadas)
const awsEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'];
const missingAwsVars = awsEnvVars.filter(varName => !process.env[varName]);

if (missingAwsVars.length > 0) {
  console.warn('⚠️  Variables de entorno de AWS S3 faltantes:', missingAwsVars);
  console.warn('⚠️  Las imágenes se almacenarán localmente en lugar de S3');
} else {
  console.log('✅ Variables de entorno de AWS S3 configuradas');
}

// Validar variables de entorno de Mercado Pago (opcionales) - DESHABILITADO
/*
const mpEnvVars = ['MERCADOPAGO_ACCESS_TOKEN'];
const missingMpVars = mpEnvVars.filter(varName => !process.env[varName]);

if (missingMpVars.length > 0) {
  console.warn('⚠️  Variables de entorno de Mercado Pago faltantes:', missingMpVars);
  console.warn('⚠️  Los pagos no estarán disponibles');
} else {
  console.log('✅ Variables de entorno de Mercado Pago configuradas');
}
*/

console.log('✅ Variables de entorno validadas correctamente');

const app = express();
connectDB();

// Configurar Mercado Pago si las credenciales están disponibles - DESHABILITADO
/*
if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
  const { configureMercadoPago } = require('./config/mercadopago');
  configureMercadoPago();
}
*/

// 🔒 CONFIGURACIÓN DE SEGURIDAD

// 1. Helmet - Headers de seguridad
app.use(configureHelmet());

// 2. Prevenir clickjacking
app.use(preventClickjacking);

// 3. Prevenir MIME type sniffing
app.use(preventMimeSniffing);

// 4. Configurar referrer policy
app.use(setReferrerPolicy);

// 5. Sanitizar datos de MongoDB
app.use(configureMongoSanitize());

// 6. Prevenir XSS
app.use(configureXSS());

// 7. Prevenir HTTP Parameter Pollution
app.use(configureHPP());

// 8. Validar tamaño de payload
app.use(validatePayloadSize);

// 9. Logging de seguridad
app.use(securityLogger);

// Configuración de CORS más robusta
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://navajowhite-giraffe-485297.hostingersite.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚨 Origin bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware para manejar preflight requests
app.options('*', cors());

// Validar Content-Type para requests que envían datos
app.use(validateContentType);

// Rate limiting general
app.use(createRateLimit(15 * 60 * 1000, 100)); // 100 requests por 15 minutos

app.use(express.json({ limit: '1mb' })); // Limitar tamaño de JSON

// Middleware para logging de requests (debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin} - IP: ${req.ip}`);
  next();
});

// Servir imágenes subidas
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Endpoint de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    cors: 'Configurado correctamente',
    security: 'Medidas de seguridad implementadas'
  });
});

// Log de debug
console.log('Configurando rutas...');

// Rutas - Cargar una por una para identificar el problema
try {
  console.log('Cargando rutas de usuarios...');
  const userRoutes = require('./routes/userRoutes');
  
  // Aplicar rate limiting específico a rutas sensibles
  app.use('/api/usuarios/login', loginRateLimit);
  app.use('/api/usuarios/register', registerRateLimit);
  
  app.use('/api/usuarios', userRoutes);
  console.log('✅ Rutas de usuarios cargadas');
} catch (error) {
  console.error('❌ Error cargando rutas de usuarios:', error);
  process.exit(1);
}

try {
  console.log('Cargando rutas de productos...');
  app.use('/api/productos', require('./routes/productRoutes'));
  console.log('✅ Rutas de productos cargadas');
} catch (error) {
  console.error('❌ Error cargando rutas de productos:', error);
  process.exit(1);
}

try {
  console.log('Cargando rutas de pedidos...');
  app.use('/api/pedidos', require('./routes/orderRoutes'));
  console.log('✅ Rutas de pedidos cargadas');
} catch (error) {
  console.error('❌ Error cargando rutas de pedidos:', error);
  process.exit(1);
}

try {
  console.log('Cargando rutas de prueba...');
  app.use('/api/test', require('./routes/testRoutes'));
  console.log('✅ Rutas de prueba cargadas');
} catch (error) {
  console.error('❌ Error cargando rutas de prueba:', error);
  process.exit(1);
}

// Rutas de pagos - DESHABILITADAS TEMPORALMENTE
/*
try {
  console.log('Cargando rutas de pagos...');
  app.use('/api/payments', require('./routes/paymentRoutes'));
  console.log('✅ Rutas de pagos cargadas');
} catch (error) {
  console.error('❌ Error cargando rutas de pagos:', error);
  process.exit(1);
}
*/

// Log de debug
console.log('✅ Todas las rutas configuradas correctamente');
console.log('🔒 Medidas de seguridad implementadas:');
console.log('  - Helmet (headers de seguridad)');
console.log('  - Rate limiting');
console.log('  - Sanitización MongoDB');
console.log('  - Prevención XSS');
console.log('  - Prevención HPP');
console.log('  - Validación de contenido');
console.log('  - Logging de seguridad');

// Manejo de rutas no encontradas (debe ir antes del error handler)
const { notFound } = require('./middlewares/errorHandler');
app.use(notFound);

// Manejo centralizado de errores (debe ir al final)
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log('📋 Rutas disponibles:');
  console.log('- POST /api/usuarios/register');
  console.log('- POST /api/usuarios/login');
  console.log('- POST /api/usuarios/create-admin');
  console.log('🔒 Seguridad: Configurada y activa');
  console.log('🛡️  Manejo de errores: Configurado');
  console.log('💳 Mercado Pago: Deshabilitado temporalmente');
});

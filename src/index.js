const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Importar middlewares de seguridad
const {
  createRateLimit,
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
} = require('./middlewares/security');

const { notFound, errorHandler } = require('./middlewares/errorHandler');

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

// Configurar trust proxy para Render.com
app.set('trust proxy', 1);

// Conectar a la base de datos
connectDB();

// Middlewares de seguridad
app.use(configureHelmet());
app.use(configureMongoSanitize());
app.use(configureXSS());
app.use(configureHPP());
app.use(validateContentType);
app.use(validatePayloadSize);
app.use(securityLogger);
app.use(preventClickjacking);
app.use(preventMimeSniffing);
app.use(setReferrerPolicy);

// Configurar CORS
app.use(cors({
  origin: 'https://navajowhite-giraffe-485297.hostingersite.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para manejar preflight requests
app.options('*', cors());

// Rate limiting general
app.use(createRateLimit());

// Rate limiting específico para login y registro
const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos'
});

const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros
  message: 'Demasiados intentos de registro, intenta de nuevo en 1 hora'
});

// Middleware para parsear JSON
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Middleware para logging de requests (debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin} - IP: ${req.ip}`);
  next();
});

// Servir imágenes subidas
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ruta raíz - Documentación de la API
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API de Impresiones Low Cost',
    version: '1.0.0',
    status: 'Activo',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        register: 'POST /api/usuarios/register',
        login: 'POST /api/usuarios/login',
        createAdmin: 'POST /api/usuarios/create-admin'
      },
      products: {
        getAll: 'GET /api/productos',
        getById: 'GET /api/productos/:id',
        create: 'POST /api/productos (admin)',
        update: 'PUT /api/productos/:id (admin)',
        delete: 'DELETE /api/productos/:id (admin)',
        categories: ['escolares', 'ingles']
      },
      orders: {
        create: 'POST /api/pedidos',
        getUserOrders: 'GET /api/pedidos',
        getAllOrders: 'GET /api/pedidos (admin)',
        updateStatus: 'PUT /api/pedidos/:id/status (admin)',
        getStats: 'GET /api/pedidos/stats (admin)',
        note: 'Sistema de reservas - pago al retirar'
      },
      test: 'GET /api/test'
    },
    security: {
      rateLimiting: 'Activo',
      cors: 'Configurado',
      helmet: 'Activo',
      xssProtection: 'Activo',
      mongoSanitize: 'Activo'
    },
    mercadoPago: 'Deshabilitado temporalmente',
    documentation: 'Consulta los endpoints para más información'
  });
});

// Ruta de test para health check
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    cors: 'Configurado correctamente',
    security: 'Medidas de seguridad implementadas',
    categories: ['escolares', 'ingles']
  });
});

// Rutas de usuarios
app.use('/api/usuarios', require('./routes/userRoutes'));

// Rutas de productos
app.use('/api/productos', require('./routes/productRoutes'));

// Rutas de pedidos
app.use('/api/pedidos', require('./routes/orderRoutes'));

// Middleware para manejar rutas no encontradas
app.use(notFound);

// Middleware para manejar errores
app.use(errorHandler);

// Configurar Mercado Pago (comentado temporalmente)
// if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
//   const mercadopago = require('mercadopago');
//   mercadopago.configure({
//     access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
// });
//   app.use('/api/payments', require('./routes/paymentRoutes'));
//   console.log('💳 Mercado Pago: Configurado correctamente');
// } else {
//   console.log('💳 Mercado Pago: Deshabilitado temporalmente');
// }

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Seguridad: Rate limiting, CORS, Helmet activos`);
  console.log(`📊 Categorías: escolares, ingles`);
  console.log('💳 Mercado Pago: Deshabilitado temporalmente');
});

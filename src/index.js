const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Validar variables de entorno requeridas
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  process.exit(1);
}

console.log('✅ Variables de entorno validadas correctamente');

const app = express();
connectDB();

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
      console.log('Origin bloqueado por CORS:', origin);
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
app.use(express.json());

// Middleware para manejar preflight requests
app.options('*', cors());

// Middleware para logging de requests (debug)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
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
    cors: 'Configurado correctamente'
  });
});

// Log de debug
console.log('Configurando rutas...');

// Rutas - Cargar una por una para identificar el problema
try {
  console.log('Cargando rutas de usuarios...');
  app.use('/api/usuarios', require('./routes/userRoutes'));
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

// Log de debug
console.log('✅ Todas las rutas configuradas correctamente');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log('Rutas disponibles:');
  console.log('- POST /api/usuarios/register');
  console.log('- POST /api/usuarios/login');
  console.log('- POST /api/usuarios/create-admin');
});

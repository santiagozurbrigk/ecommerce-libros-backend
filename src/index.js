const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
// Servir imágenes subidas
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log de debug
console.log('Configurando rutas...');

// Rutas
app.use('/api/usuarios', require('./routes/userRoutes'));
app.use('/api/productos', require('./routes/productRoutes'));
app.use('/api/pedidos', require('./routes/orderRoutes'));

// Log de debug
console.log('Rutas configuradas correctamente');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log('Rutas disponibles:');
  console.log('- POST /api/usuarios/register');
  console.log('- POST /api/usuarios/login');
  console.log('- POST /api/usuarios/create-admin');
});

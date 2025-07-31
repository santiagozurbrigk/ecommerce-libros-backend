const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Configuración básica de CORS
app.use(cors());
app.use(express.json());

// Endpoint de prueba simple
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de prueba para login
app.post('/api/usuarios/login', (req, res) => {
  res.json({ 
    message: 'Login endpoint funcionando',
    token: 'test-token'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor simple corriendo en puerto ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
}); 
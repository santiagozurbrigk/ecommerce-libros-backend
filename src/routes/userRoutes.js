const express = require('express');
const router = express.Router();
const { register, login, createAdmin, getUsers } = require('../controllers/userController');
const { configureRateLimit } = require('../middlewares/security');

// Rate limiting específico para login y registro
const loginRateLimit = configureRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Demasiados intentos de login, intenta de nuevo en 15 minutos'
});

const registerRateLimit = configureRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros
  message: 'Demasiados intentos de registro, intenta de nuevo en 1 hora'
});

// Registro de usuario
router.post('/register', registerRateLimit, register);

// Login de usuario
router.post('/login', loginRateLimit, login);

// Crear usuario admin (solo para desarrollo)
router.post('/create-admin', createAdmin);

// Endpoint temporal GET para crear admin (solo para desarrollo)
router.get('/create-admin', createAdmin);

// Listar usuarios
router.get('/', getUsers);

module.exports = router;

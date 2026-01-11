const express = require('express');
const router = express.Router();
const { register, login, createAdmin, createEmpleadoLocal, getUsers } = require('../controllers/userController');
const { createRateLimit } = require('../middlewares/security');

// Rate limiting específico para login y registro
const loginRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 intentos en 15 minutos
const registerRateLimit = createRateLimit(60 * 60 * 1000, 3); // 3 registros en 1 hora

// Registro de usuario
router.post('/register', registerRateLimit, register);

// Login de usuario
router.post('/login', loginRateLimit, login);

// Crear usuario admin (solo para desarrollo)
router.post('/create-admin', createAdmin);

// Endpoint temporal GET para crear admin (solo para desarrollo)
router.get('/create-admin', createAdmin);

// Crear usuario empleado local (temporal)
router.post('/create-empleado-local', createEmpleadoLocal);
router.get('/create-empleado-local', createEmpleadoLocal);

// Listar usuarios
router.get('/', getUsers);

module.exports = router;

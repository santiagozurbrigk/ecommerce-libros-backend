const express = require('express');
const router = express.Router();
const { register, login, createAdmin, getUsers } = require('../controllers/userController');

// Registro de usuario
router.post('/register', register);

// Login de usuario
router.post('/login', login);

// Crear usuario admin (solo para desarrollo)
router.post('/create-admin', createAdmin);

// Listar usuarios
router.get('/', getUsers);

module.exports = router;

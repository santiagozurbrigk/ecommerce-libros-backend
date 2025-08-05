const { body, validationResult } = require('express-validator');

// Validación para registro de usuarios
const validateRegister = [
  body('nombre')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('telefono')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Formato de teléfono inválido'),
  
  body('carrera')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La carrera no puede exceder 100 caracteres')
];

// Validación para login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Validación para productos
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La descripción debe tener entre 10 y 1000 caracteres'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  
  body('pages')
    .isInt({ min: 1 })
    .withMessage('Las páginas deben ser un número entero positivo'),
  
  body('category')
    .isIn(['escolares', 'ingles'])
    .withMessage('La categoría debe ser "escolares" o "ingles"')
];

// Validación para pedidos
const validateOrder = [
  body('products')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  
  body('products.*.product')
    .isMongoId()
    .withMessage('ID de producto inválido'),
  
  body('products.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('La cantidad debe ser entre 1 y 100'),
  
  body('paymentMethod')
    .isIn(['mercadopago', 'efectivo'])
    .withMessage('Método de pago inválido')
];

// Sanitizar datos de entrada
const sanitizeInput = (req, res, next) => {
  // Sanitizar strings
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Sanitizar query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  next();
};

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validar JWT token
const validateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Token de autenticación requerido'
    });
  }
  
  // Validar formato del token
  if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
    return res.status(401).json({
      error: 'Formato de token inválido'
    });
  }
  
  next();
};

// Validar permisos de administrador
const validateAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

// Validar que el usuario sea propietario del recurso
const validateOwnership = (resourceModel) => {
  return async (req, res, next) => {
    try {
      const resource = await resourceModel.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          error: 'Recurso no encontrado'
        });
      }
      
      // Verificar que el usuario sea propietario o admin
      if (resource.user.toString() !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          error: 'No tienes permisos para acceder a este recurso'
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Error validando propiedad:', error);
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateOrder,
  sanitizeInput,
  handleValidationErrors,
  validateToken,
  validateAdmin,
  validateOwnership
}; 
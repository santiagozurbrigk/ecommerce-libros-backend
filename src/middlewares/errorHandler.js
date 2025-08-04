// Middleware para manejo centralizado de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message: `Error de validación: ${message}`,
      statusCode: 400
    };
  }

  // Error de duplicación de MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      message: `El ${field} ya existe en la base de datos`,
      statusCode: 400
    };
  }

  // Error de cast de MongoDB
  if (err.name === 'CastError') {
    error = {
      message: 'ID inválido',
      statusCode: 400
    };
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Token inválido',
      statusCode: 401
    };
  }

  // Error de expiración de JWT
  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expirado',
      statusCode: 401
    };
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = {
      message: 'JSON inválido en el cuerpo de la petición',
      statusCode: 400
    };
  }

  // Error de límite de archivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'El archivo es demasiado grande',
      statusCode: 413
    };
  }

  // Error de tipo de archivo
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Tipo de archivo no permitido',
      statusCode: 400
    };
  }

  // Error de rate limiting
  if (err.status === 429) {
    error = {
      message: err.message || 'Demasiadas solicitudes',
      statusCode: 429
    };
  }

  // Error de CORS
  if (err.message === 'No permitido por CORS') {
    error = {
      message: 'Origen no permitido',
      statusCode: 403
    };
  }

  // Error de Mercado Pago
  if (err.name === 'MercadoPagoError') {
    error = {
      message: `Error de Mercado Pago: ${err.message}`,
      statusCode: 400
    };
  }

  // Respuesta de error
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

// Middleware para manejar rutas no encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Middleware para manejar errores asíncronos
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
}; 
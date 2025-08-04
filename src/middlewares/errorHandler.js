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
  // No generar error para rutas no encontradas, solo responder con 404
  if (req.path === '/favicon.ico') {
    return res.status(204).end(); // No content para favicon
  }
  
  // Para rutas de API, devolver JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'Endpoint no encontrado',
      path: req.path,
      method: req.method,
      availableEndpoints: [
        'POST /api/usuarios/register',
        'POST /api/usuarios/login',
        'GET /api/productos',
        'POST /api/pedidos',
        'GET /api/test'
      ]
    });
  }
  
  // Para otras rutas, devolver HTML simple
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Página no encontrada</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #e74c3c; }
        .api-link { color: #3498db; text-decoration: none; }
        .api-link:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404 - Página no encontrada</h1>
        <p>La ruta <strong>${req.path}</strong> no existe en este servidor.</p>
        <p>Este es un servidor de API. Para ver la documentación de la API, visita:</p>
        <a href="/" class="api-link">📚 Documentación de la API</a>
      </div>
    </body>
    </html>
  `);
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
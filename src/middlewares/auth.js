const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Obtener el token del header (case-insensitive)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }
  
  // Extraer el token (puede venir como "Bearer TOKEN" o solo "TOKEN")
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : authHeader.trim();
  
  if (!token) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validar que decoded.user existe y tiene id
    if (!decoded || !decoded.user || !decoded.user.id) {
      console.error('Token decodificado pero sin user.id:', decoded);
      return res.status(401).json({ msg: 'Token inválido: información de usuario incompleta' });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    // Manejar diferentes tipos de errores de JWT
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token expirado. Por favor, inicia sesión nuevamente' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Token inválido' });
    }
    console.error('Error al verificar token:', err);
    return res.status(401).json({ msg: 'Error al verificar token' });
  }
}; 
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  console.log(`[auth] Verificando autenticación para ${req.method} ${req.path}`);
  
  // Obtener el token del header (case-insensitive)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || req.header('Authorization');
  if (!authHeader) {
    console.warn(`[auth] ❌ No hay token en ${req.method} ${req.path}`);
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }
  
  // Extraer el token (puede venir como "Bearer TOKEN" o solo "TOKEN")
  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : authHeader.trim();
  
  if (!token) {
    console.warn(`[auth] ❌ Token vacío en ${req.method} ${req.path}`);
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validar que decoded.user existe y tiene id
    if (!decoded || !decoded.user || !decoded.user.id) {
      console.error(`[auth] ❌ Token decodificado pero sin user.id en ${req.method} ${req.path}:`, decoded);
      return res.status(401).json({ msg: 'Token inválido: información de usuario incompleta' });
    }
    
    console.log(`[auth] ✅ Autenticación exitosa para usuario ${decoded.user.id} en ${req.method} ${req.path}`);
    req.user = decoded.user;
    next();
  } catch (err) {
    // Manejar diferentes tipos de errores de JWT
    if (err.name === 'TokenExpiredError') {
      console.warn(`[auth] ❌ Token expirado en ${req.method} ${req.path}`);
      return res.status(401).json({ msg: 'Token expirado. Por favor, inicia sesión nuevamente' });
    }
    if (err.name === 'JsonWebTokenError') {
      console.warn(`[auth] ❌ Token inválido en ${req.method} ${req.path}:`, err.message);
      return res.status(401).json({ msg: 'Token inválido' });
    }
    console.error(`[auth] ❌ Error al verificar token en ${req.method} ${req.path}:`, err);
    return res.status(401).json({ msg: 'Error al verificar token' });
  }
}; 
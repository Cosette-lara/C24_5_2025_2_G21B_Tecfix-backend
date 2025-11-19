const jwt = require('jsonwebtoken');

// IMPORTANTE: Esta clave debe ser EXACTAMENTE la misma que usó 
// en 'auth.controller.js' para firmar el token.
const JWT_SECRET = 'su-clave-secreta-muy-segura-para-la-tesis';

/**
 * Middleware de autenticación.
 * Verifica el token JWT enviado en la cabecera 'x-auth-token'.
 */
module.exports = function(req, res, next) {
  // 1. Obtener el token de la cabecera
  const token = req.header('x-auth-token');

  // 2. Verificar si no hay token
  if (!token) {
    // 401 = No autorizado (falta autenticación)
    return res.status(401).json({ msg: 'No hay token, permiso denegado.' });
  }

  // 3. Verificar el token si existe
  try {
    // jwt.verify decodifica el token usando la clave secreta.
    // Si el token es inválido o expiró, lanzará un error.
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4. Si el token es válido, extraemos el payload (que llamamos 'usuario')
    // y lo adjuntamos al objeto 'request' (req) de Express.
    req.usuario = decoded.usuario; 

    // 5. Llamamos a next() para pasar la solicitud al siguiente 
    // middleware o al controlador final (ej. crearIncidencia).
    next();
  } catch (err) {
    // Si jwt.verify falla (token inválido)
    res.status(401).json({ msg: 'Token no es válido.' });
  }
};
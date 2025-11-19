exports.checkRole = (rolesPermitidos) => {

  return (req, res, next) => {
    //Verificar que auth.middleware.js se ejecutó primero
    if (!req.usuario || req.usuario.rol === undefined) {
      return res.status(500).json({ msg: 'Error de autenticación: no se encontró información del usuario.' });
    }

    const idRolUsuario = req.usuario.rol;

    //Verificar si el ID del rol del usuario está en la lista de roles permitidos
    if (!rolesPermitidos.includes(idRolUsuario)) {
      // 403 = Prohibido (Forbidden). El usuario está autenticado pero no tiene permisos.
      return res.status(403).json({ msg: 'Acceso denegado. No tiene el rol autorizado.' });
    }

    //Si tiene el rol, continuar
    next();
  };
};


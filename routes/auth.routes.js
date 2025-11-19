const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');

// @ruta    POST /api/auth/login
// @desc    Iniciar sesión (autenticar) un usuario y obtener un token JWT.
// @acceso  Público
router.post('/login', controller.login);

// @ruta    POST /api/auth/register
// @desc    Registrar un nuevo usuario (para el rol 'Usuario').
// @acceso  Público
router.post('/register', controller.register);

// @ruta    GET /api/auth/verify (Opcional, pero recomendado)
// @desc    Verificar un token existente (para el frontend)
// @acceso  Privado (requeriría un middleware de auth)
// router.get('/verify', authMiddleware, controller.verifyToken);

module.exports = router;
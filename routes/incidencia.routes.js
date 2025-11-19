const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/incidencia.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Define dónde y cómo guardar las fotos subidas.
const storage = multer.diskStorage({
  // Define la carpeta de destino
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardan las fotos
  },
  // Define el nombre del archivo
  filename: (req, file, cb) => {
    // Crea un nombre único para evitar colisiones (ej: 1678886400000-mi-foto.jpg)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Middleware de Multer
const upload = multer({ storage: storage });

/**
 * @ruta    POST /api/incidencias/
 * @desc    Reportar una nueva incidencia.
 * @acceso  Privado (requiere token de Usuario)
 *
 * Middlewares:
 * 1. authMiddleware: Verifica que el usuario tenga un token válido.
 * 2. upload.single('prueba_fotografica'): Procesa un solo archivo que venga
 * en el campo 'prueba_fotografica' del formulario (Flutter).
 */
router.post(
  '/',
  authMiddleware,
  upload.single('prueba_fotografica'),
  controller.crearIncidencia
);

/**
 * @ruta    GET /api/incidencias/resumen/:idUsuario
 * @desc    Obtener el conteo de reportes (pendientes/resueltos)
 * para el dashboard de inicio_screen.dart.
 * @acceso  Privado (requiere token de Usuario)
 */
router.get(
  '/resumen/:idUsuario',
  authMiddleware,
  controller.getResumenPorUsuario
);

/**
 * @ruta    GET /api/incidencias/ultimas/:idUsuario
 * @desc    Obtener las últimas 5 incidencias reportadas
 * para el dashboard de inicio_screen.dart.
 * @acceso  Privado (requiere token de Usuario)
 */
router.get(
  '/ultimas/:idUsuario',
  authMiddleware,
  controller.getUltimasPorUsuario
);

/**
 * @ruta    GET /api/incidencias/usuario/:idUsuario
 * @desc    Obtener el historial COMPLETO de incidencias
 * del usuario para historial_screen.dart.
 * @acceso  Privado (requiere token de Usuario)
 */
router.get(
  '/usuario/:idUsuario',
  authMiddleware,
  controller.getHistorialPorUsuario
);

module.exports = router;
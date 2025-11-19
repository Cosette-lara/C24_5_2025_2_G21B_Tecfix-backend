const express = require('express');
const router = express.Router();
const controller = require('../controllers/ubicacion.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas aquí deben estar protegidas,
// ya que solo usuarios autenticados pueden reportar.

/**
 * @ruta    GET /api/ubicaciones/pabellones
 * @desc    Obtiene la lista de todos los pabellones.
 * @acceso  Privado
 */
router.get(
  '/pabellones',
  authMiddleware,
  controller.getAllPabellones
);

/**
 * @ruta    GET /api/ubicaciones/salones/:idPabellon
 * @desc    Obtiene los salones de un pabellón específico.
 * @acceso  Privado
 */
router.get(
  '/salones/:idPabellon',
  authMiddleware,
  controller.getSalonesByPabellon
);

module.exports = router;
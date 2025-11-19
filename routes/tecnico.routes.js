const express = require('express');
const router = express.Router();
const controller = require('../controllers/tecnico.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// --- Definición de Constante de Rol ---
const ROL_TECNICO = 2; // ID del rol "Técnico" en la BD

// --- Definición de Rutas (Endpoints) ---
// Todas las rutas en este archivo requieren que el usuario sea un Técnico verificado.

/**
 * @ruta    GET /api/tecnico/tareas-disponibles
 * @desc    Obtiene la cola de tareas "Pendiente de Asignación".
 * @acceso  Privado (Solo Técnicos)
 */
router.get(
  '/tareas-disponibles',
  [authMiddleware, checkRole([ROL_TECNICO])], // Protegido por Token y Rol
  controller.getTareasDisponibles
);

/**
 * @ruta    PUT /api/tecnico/auto-asignar/:idIncidencia
 * @desc    Permite al técnico auto-asignarse una tarea.
 * @acceso  Privado (Solo Técnicos)
 */
router.put(
  '/auto-asignar/:idIncidencia',
  [authMiddleware, checkRole([ROL_TECNICO])], // Protegido por Token y Rol
  controller.autoAsignarTarea
);

/**
 * @ruta    GET /api/tecnico/mis-tareas
 * @desc    Obtiene la lista de tareas asignadas al técnico logueado.
 * @acceso  Privado (Solo Técnicos)
 */
router.get(
  '/mis-tareas',
  [authMiddleware, checkRole([ROL_TECNICO])], // Protegido por Token y Rol
  controller.getMisTareas
);

/**
 * @ruta    PUT /api/tecnico/actualizar-estado/:idIncidencia
 * @desc     Actualiza el estado de una tarea asignada.
 * Si el nuevo estado es "Resuelta", valida que se incluyan las horas-hombre.
 * @acceso  Privado (Solo Técnicos)
 */
router.put(
  '/actualizar-estado/:idIncidencia',
  [authMiddleware, checkRole([ROL_TECNICO])], // Protegido por Token y Rol
  controller.actualizarEstadoTarea
);

module.exports = router;
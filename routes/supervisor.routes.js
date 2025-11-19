const express = require('express');
const router = express.Router();
const controller = require('../controllers/supervisor.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// --- Definición de Constante de Rol ---
const ROL_SUPERVISOR = 1; // ID del rol "Supervisor" en la BD

// --- Definición de Rutas (Endpoints) ---
// Todas las rutas en este archivo requieren que el usuario sea un Supervisor verificado.

/**
 * @ruta    GET /api/supervisor/all-incidencias
 * @desc    Obtiene TODAS las incidencias para el dashboard del supervisor.
 * @acceso  Privado (Solo Supervisores)
 */
router.get(
  '/all-incidencias',
  [authMiddleware, checkRole([ROL_SUPERVISOR])], // Protegido por Token y Rol
  controller.getAllIncidencias
);

/**
 * @ruta    PUT /api/supervisor/asignar/:idIncidencia
 * @desc    Asigna (o reasigna) una incidencia a un técnico específico.
 * @acceso  Privado (Solo Supervisores)
 */
router.put(
  '/asignar/:idIncidencia',
  [authMiddleware, checkRole([ROL_SUPERVISOR])], // Protegido por Token y Rol
  controller.asignarTarea
);

/**
 * @ruta    PUT /api/supervisor/validar/:idIncidencia
 * @desc    Valida o rechaza una tarea marcada como "Resuelta".
 * @acceso  Privado (Solo Supervisores)
 */
router.put(
  '/validar/:idIncidencia',
  [authMiddleware, checkRole([ROL_SUPERVISOR])], // Protegido por Token y Rol
  controller.validarCierre
);

/**
 * @ruta    GET /api/supervisor/reportes-kpi
 * @desc    Obtiene los datos para los reportes de KPIs (Tiempos y Horas-Hombre).
 * @acceso  Privado (Solo Supervisores)
 */
router.get(
  '/reportes-kpi',
  [authMiddleware, checkRole([ROL_SUPERVISOR])], // Protegido por Token y Rol
  controller.getReporteKPIs
);

module.exports = router;
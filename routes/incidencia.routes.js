const router = require('express').Router();
const controller = require('../controllers/incidencia.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadFotosReporte } = require('../middleware/upload.middleware');

// Ruta principal del reporte (POST)
router.post('/crear', [verifyToken, uploadFotosReporte], controller.crearIncidencia);

// Ruta historial (GET)
router.get('/mis-reportes/:id_usuario', verifyToken, controller.getMisIncidencias);

module.exports = router;
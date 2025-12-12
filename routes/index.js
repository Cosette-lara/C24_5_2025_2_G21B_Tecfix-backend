const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const ubi = require('../controllers/ubicacion.controller');
const tipo = require('../controllers/tipo.controller');
const inc = require('../controllers/incidencia.controller');
const { uploadFotosReporte } = require('../middleware/upload.middleware');

// Rutas directas para simplificar
router.post('/auth/login', auth.login);
router.get('/ubicacion/pabellones', ubi.getPabellones);
router.get('/ubicacion/salones/:id', ubi.getSalones);
router.get('/tipos', tipo.getTipos);
router.post('/incidencia/crear', uploadFotosReporte, inc.crearIncidencia);
router.get('/incidencia/mis-reportes/:id', inc.getMisIncidencias);

module.exports = router;
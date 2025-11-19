const express = require('express');
const router = express.Router();

// Importar todos los enrutadores específicos
const authRoutes = require('./auth.routes');
const incidenciaRoutes = require('./incidencia.routes');
const tecnicoRoutes = require('./tecnico.routes');
const supervisorRoutes = require('./supervisor.routes');
const ubicacionRoutes = require('./ubicacion.routes'); 

// Definir las rutas base para cada módulo
router.use('/auth', authRoutes);
router.use('/incidencias', incidenciaRoutes);
router.use('/tecnico', tecnicoRoutes);
router.use('/supervisor', supervisorRoutes);
router.use('/ubicaciones', ubicacionRoutes); 

module.exports = router;
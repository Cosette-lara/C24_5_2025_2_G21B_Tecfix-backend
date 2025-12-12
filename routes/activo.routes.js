const router = require('express').Router();
const controller = require('../controllers/activo.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/por-salon/:id_salon', verifyToken, controller.getActivosBySalon);

module.exports = router;
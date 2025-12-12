const router = require('express').Router();
const controller = require('../controllers/ubicacion.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/pabellones', verifyToken, controller.getPabellones);
router.get('/salones/:id_pabellon', verifyToken, controller.getSalonesByPabellon);

module.exports = router;
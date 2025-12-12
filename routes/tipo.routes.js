const router = require('express').Router();
const controller = require('../controllers/tipo.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, controller.getTipos);

module.exports = router;
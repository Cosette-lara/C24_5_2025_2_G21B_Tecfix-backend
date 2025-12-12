const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ msg: 'No se proporcionó token' });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.id_usuario = decoded.id;
        req.rol = decoded.rol;
        next();
    } catch (error) {
        return res.status(401).json({ msg: 'No autorizado' });
    }
};

module.exports = { verifyToken };
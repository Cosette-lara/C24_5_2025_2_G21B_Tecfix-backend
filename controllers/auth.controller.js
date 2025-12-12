const db = require('../db/db');

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.query('SELECT * FROM "Usuarios" WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(404).json({ msg: 'Usuario no encontrado' });
        
        // MVP: Comparación simple. En producción usar bcrypt.
        if (password !== user.rows[0].password_hash) return res.status(401).json({ msg: 'Password incorrecto' });

        // MVP: Token simple simulado (En prod usar JWT real)
        const token = 'fake-jwt-token-' + user.rows[0].id_usuario;
        
        res.json({ token, usuario: user.rows[0] });
    } catch (error) {
        res.status(500).json({ msg: 'Error server' });
    }
};
module.exports = { login };
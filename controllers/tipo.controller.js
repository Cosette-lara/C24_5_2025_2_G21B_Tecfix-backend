const db = require('../db/db');
const getTipos = async (req, res) => {
    try {
        const r = await db.query('SELECT * FROM "Tipos_Incidencia" ORDER BY nombre_tipo');
        res.json(r.rows);
    } catch (e) { res.status(500).json({msg: 'Error'}); }
};
module.exports = { getTipos };
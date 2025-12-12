const db = require('../db/db');

const getPabellones = async (req, res) => {
    try {
        const r = await db.query('SELECT * FROM "Pabellones" ORDER BY nombre_pabellon');
        res.json(r.rows);
    } catch (e) { res.status(500).json({msg: 'Error'}); }
};

const getSalones = async (req, res) => {
    try {
        const r = await db.query('SELECT * FROM "Salones" WHERE id_pabellon = $1', [req.params.id]);
        res.json(r.rows);
    } catch (e) { res.status(500).json({msg: 'Error'}); }
};
module.exports = { getPabellones, getSalones };
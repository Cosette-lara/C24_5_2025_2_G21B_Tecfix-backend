const db = require('../db/db');

// Listar Activos por Salón (Para el dropdown final)
const getActivosBySalon = async (req, res) => {
    const { id_salon } = req.params;
    try {
        const response = await db.query(`
            SELECT a.id_activo, a.nombre_activo, a.codigo_patrimonial, c.nombre_categoria 
            FROM "Activos" a
            JOIN "Categorias_Activo" c ON a.id_categoria = c.id_categoria
            WHERE a.id_salon = $1 AND a.estado_activo = 'Operativo'
            ORDER BY a.nombre_activo ASC
        `, [id_salon]);

        res.json(response.rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo activos' });
    }
};

module.exports = { getActivosBySalon };
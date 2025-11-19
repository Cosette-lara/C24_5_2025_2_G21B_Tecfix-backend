const pool = require('../db/db.js');

/**
 * Obtiene la lista de todos los pabellones/áreas principales.
 */
exports.getAllPabellones = async (req, res) => {
  try {
    const pabellones = await pool.query(
      `SELECT * FROM "Pabellones" ORDER BY "nombre_pabellon" ASC`
    );
    res.json(pabellones.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al obtener pabellones");
  }
};

/**
 * Obtiene los salones/oficinas de UN pabellón específico.
 */
exports.getSalonesByPabellon = async (req, res) => {
  try {
    const { idPabellon } = req.params;
    const salones = await pool.query(
      `SELECT * FROM "Salones" WHERE "id_pabellon" = $1 ORDER BY "nombre_salon" ASC`,
      [idPabellon]
    );
    res.json(salones.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al obtener salones");
  }
};
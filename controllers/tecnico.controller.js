const pool = require('../db/db.js');

/**
 * Obtiene la cola de tareas "Pendiente de Asignación".
 */
exports.getTareasDisponibles = async (req, res) => {
  try {
    const tareas = await pool.query(
      `SELECT 
         inc.id_incidencia,
         inc.descripcion,
         inc.urgencia,
         inc.fecha_creacion,
         tip.nombre_tipo,
         sal."nombre_salon",         -- <-- AÑADIDO
         pab."nombre_pabellon"     -- <-- AÑADIDO
       FROM "Incidencias" AS inc
       JOIN "Tipos_Incidencia" AS tip ON inc.id_tipo = tip.id_tipo
       JOIN "Salones" AS sal ON inc."id_salon" = sal."id_salon"             -- <-- AÑADIDO
       JOIN "Pabellones" AS pab ON sal."id_pabellon" = pab."id_pabellon"   -- <-- AÑADIDO
       WHERE inc.id_estado = 1 
       ORDER BY 
         CASE inc.urgencia
           WHEN 'Crítica' THEN 1
           WHEN 'Alta' THEN 2
           WHEN 'Media' THEN 3
           WHEN 'Baja' THEN 4
           ELSE 5
         END,
         inc.fecha_creacion ASC`,
      []
    );

    // Mapeamos para concatenar la ubicación
    const resultadoFormateado = tareas.rows.map(t => ({
      ...t,
      ubicacion: `${t.nombre_pabellon} - ${t.nombre_salon}`
    }));

    res.json(resultadoFormateado);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al obtener tareas disponibles");
  }
};

/**
 * Permite al técnico auto-asignarse una tarea.
 */
exports.autoAsignarTarea = async (req, res) => {
  const { idIncidencia } = req.params;
  const idTecnico = req.usuario.id;
  const nuevoEstadoId = 2; 
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateQuery = await client.query(
      `UPDATE "Incidencias"
       SET id_tecnico_asignado = $1, id_estado = $2
       WHERE id_incidencia = $3 AND id_estado = 1
       RETURNING *`,
      [idTecnico, nuevoEstadoId, idIncidencia]
    );
    if (updateQuery.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ msg: 'Esta tarea ya fue asignada por otro técnico.' });
    }
    const descripcionCambio = `Técnico se auto-asignó la tarea. Estado cambiado a 'Asignado'.`;
    await client.query(
      `INSERT INTO "Historial_Cambios" (id_incidencia, id_usuario_actor, descripcion_cambio)
       VALUES ($1, $2, $3)`,
      [idIncidencia, idTecnico, descripcionCambio]
    );
    await client.query('COMMIT');
    res.json({ msg: 'Tarea asignada exitosamente.', incidencia: updateQuery.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send("Error del Servidor al auto-asignar tarea");
  } finally {
    client.release();
  }
};


/**
 Obtiene la lista de tareas asignadas al técnico logueado.
 */
exports.getMisTareas = async (req, res) => {
  const idTecnico = req.usuario.id;
  try {
    const misTareas = await pool.query(
      `SELECT 
         inc.id_incidencia,
         inc.descripcion,
         inc.urgencia,
         inc.fecha_creacion,
         est.nombre_estado,
         tip.nombre_tipo,
         sal."nombre_salon",         -- <-- AÑADIDO
         pab."nombre_pabellon"     -- <-- AÑADIDO
       FROM "Incidencias" AS inc
       JOIN "Estados_Incidencia" AS est ON inc.id_estado = est.id_estado
       JOIN "Tipos_Incidencia" AS tip ON inc.id_tipo = tip.id_tipo
       JOIN "Salones" AS sal ON inc."id_salon" = sal."id_salon"             -- <-- AÑADIDO
       JOIN "Pabellones" AS pab ON sal."id_pabellon" = pab."id_pabellon"   -- <-- AÑADIDO
       WHERE inc.id_tecnico_asignado = $1 AND inc.id_estado != 5
       ORDER BY inc.fecha_creacion DESC`,
      [idTecnico]
    );
    
    // Mapeamos para concatenar la ubicación
    const resultadoFormateado = misTareas.rows.map(t => ({
      ...t,
      ubicacion: `${t.nombre_pabellon} - ${t.nombre_salon}`
    }));

    res.json(resultadoFormateado);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al obtener mis tareas");
  }
};


/**
  Actualiza el estado de una tarea asignada.
 */
exports.actualizarEstadoTarea = async (req, res) => {
  const { idIncidencia } = req.params;
  const idTecnico = req.usuario.id;
  const { nuevoEstadoId, horas_hombre } = req.body;
  const ESTADO_RESUELTO = 4;
  if (parseInt(nuevoEstadoId, 10) === ESTADO_RESUELTO) {
    if (!horas_hombre || isNaN(parseFloat(horas_hombre)) || parseFloat(horas_hombre) <= 0) {
      return res.status(400).json({ msg: 'Debe registrar las horas-hombre (RF-07) para marcar una tarea como resuelta.' });
    }
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tareaCheck = await client.query(
      'SELECT * FROM "Incidencias" WHERE id_incidencia = $1 AND id_tecnico_asignado = $2',
      [idIncidencia, idTecnico]
    );
    if (tareaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ msg: 'Esta tarea no está asignada a usted.' });
    }
    let updateQueryText = '';
    let queryParams = [];
    if (parseInt(nuevoEstadoId, 10) === ESTADO_RESUELTO) {
      updateQueryText = `UPDATE "Incidencias" SET id_estado = $1, horas_hombre = $2 WHERE id_incidencia = $3 RETURNING *`;
      queryParams = [nuevoEstadoId, parseFloat(horas_hombre), idIncidencia];
    } else {
      updateQueryText = `UPDATE "Incidencias" SET id_estado = $1 WHERE id_incidencia = $2 RETURNING *`;
      queryParams = [nuevoEstadoId, idIncidencia];
    }
    const updatedIncidencia = await client.query(updateQueryText, queryParams);
    const estadoNombre = await client.query(
      'SELECT nombre_estado FROM "Estados_Incidencia" WHERE id_estado = $1',
      [nuevoEstadoId]
    );
    const descripcionCambio = `Estado cambiado a '${estadoNombre.rows[0].nombre_estado}'.`;
    await client.query(
      `INSERT INTO "Historial_Cambios" (id_incidencia, id_usuario_actor, descripcion_cambio)
       VALUES ($1, $2, $3)`,
      [idIncidencia, idTecnico, descripcionCambio]
    );
    await client.query('COMMIT');
    res.json({ msg: 'Estado actualizado.', incidencia: updatedIncidencia.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send("Error del Servidor al actualizar el estado");
  } finally {
    client.release();
  }
};
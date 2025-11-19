const pool = require('../db/db.js');

/**
 Obtiene TODAS las incidencias para el dashboard del supervisor.
 */
exports.getAllIncidencias = async (req, res) => {
  try {
    const todasLasIncidencias = await pool.query(
      `SELECT 
         inc.id_incidencia,
         inc.descripcion,
         inc.urgencia,
         inc.fecha_creacion,
         inc.horas_hombre,
         est.nombre_estado,
         tip.nombre_tipo,
         usr_rep."nombre_completo" AS reportado_por,
         usr_tec."nombre_completo" AS tecnico_asignado,
         sal."nombre_salon",         -- <-- AÑADIDO
         pab."nombre_pabellon"     -- <-- AÑADIDO
       FROM "Incidencias" AS inc
       INNER JOIN "Estados_Incidencia" AS est ON inc."id_estado" = est."id_estado"
       INNER JOIN "Tipos_Incidencia" AS tip ON inc."id_tipo" = tip."id_tipo"
       INNER JOIN "Usuarios" AS usr_rep ON inc."id_usuario_reporta" = usr_rep."id_usuario"
       LEFT JOIN "Usuarios" AS usr_tec ON inc."id_tecnico_asignado" = usr_tec."id_usuario"
       INNER JOIN "Salones" AS sal ON inc."id_salon" = sal."id_salon"             -- <-- AÑADIDO
       INNER JOIN "Pabellones" AS pab ON sal."id_pabellon" = pab."id_pabellon"   -- <-- AÑADIDO
       ORDER BY inc."fecha_creacion" DESC`,
      []
    );
    
    // Mapeamos para concatenar la ubicación
    const resultadoFormateado = todasLasIncidencias.rows.map(t => ({
      ...t,
      ubicacion: `${t.nombre_pabellon} - ${t.nombre_salon}`
    }));

    res.json(resultadoFormateado);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al obtener todas las incidencias");
  }
};

/**
 * Asigna (o reasigna) una incidencia a un técnico específico.
 */
exports.asignarTarea = async (req, res) => {
  const { idIncidencia } = req.params;
  const { idTecnico } = req.body;
  const idSupervisor = req.usuario.id;
  const ESTADO_ASIGNADO = 2;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateQuery = await client.query(
      `UPDATE "Incidencias"
       SET id_tecnico_asignado = $1, id_estado = $2
       WHERE id_incidencia = $3
       RETURNING *`,
      [idTecnico, ESTADO_ASIGNADO, idIncidencia]
    );
    if (updateQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ msg: 'Incidencia no encontrada.' });
    }
    const tecnico = await client.query('SELECT nombre_completo FROM "Usuarios" WHERE id_usuario = $1', [idTecnico]);
    const nombreTecnico = tecnico.rows[0].nombre_completo;
    const descripcionCambio = `Supervisor asignó la tarea a ${nombreTecnico}. Estado cambiado a 'Asignado'.`;
    await client.query(
      `INSERT INTO "Historial_Cambios" (id_incidencia, id_usuario_actor, descripcion_cambio)
       VALUES ($1, $2, $3)`,
      [idIncidencia, idSupervisor, descripcionCambio]
    );
    await client.query('COMMIT');
    res.json({ msg: 'Tarea asignada exitosamente.', incidencia: updateQuery.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send("Error del Servidor al asignar la tarea");
  } finally {
    client.release();
  }
};

/**
 * Valida o rechaza una tarea marcada como "Resuelta".
 */
exports.validarCierre = async (req, res) => {
  const { idIncidencia } = req.params;
  const { aprobado } = req.body;
  const idSupervisor = req.usuario.id;
  const ESTADO_RESUELTO = 4;
  const ESTADO_CERRADO = 5;
  const ESTADO_RECHAZADO = 6;
  let nuevoEstadoId;
  let descripcionCambio;
  if (aprobado) {
    nuevoEstadoId = ESTADO_CERRADO;
    descripcionCambio = "Supervisor validó y cerró la incidencia.";
  } else {
    nuevoEstadoId = ESTADO_RECHAZADO;
    descripcionCambio = "Supervisor rechazó la solución. La tarea se reabre.";
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tareaCheck = await client.query(
      'SELECT * FROM "Incidencias" WHERE id_incidencia = $1 AND id_estado = $2',
      [idIncidencia, ESTADO_RESUELTO]
    );
    if (tareaCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ msg: 'Esta tarea no está pendiente de validación.' });
    }
    const updateQuery = await client.query(
      `UPDATE "Incidencias"
       SET id_estado = $1, id_supervisor_valida = $2, fecha_cierre = $3
       WHERE id_incidencia = $4
       RETURNING *`,
      [
        nuevoEstadoId, 
        idSupervisor, 
        aprobado ? new Date() : null,
        idIncidencia
      ]
    );
    await client.query(
      `INSERT INTO "Historial_Cambios" (id_incidencia, id_usuario_actor, descripcion_cambio)
       VALUES ($1, $2, $3)`,
      [idIncidencia, idSupervisor, descripcionCambio]
    );
    await client.query('COMMIT');
    res.json({ msg: 'Validación completada.', incidencia: updateQuery.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send("Error del Servidor al validar la tarea");
  } finally {
    client.release();
  }
};

/**
 * RF-12: 
 * Obtiene los datos para los reportes de KPIs.
 */
exports.getReporteKPIs = async (req, res) => {
  try {
    //Reporte de Horas-Hombre por Tipo
    const horasPorTipoQuery = pool.query(
      `SELECT 
         tip.nombre_tipo,
         SUM(inc.horas_hombre) AS total_horas,
         COUNT(inc.id_incidencia) AS total_incidencias
       FROM "Incidencias" AS inc
       JOIN "Tipos_Incidencia" AS tip ON inc.id_tipo = tip.id_tipo
       WHERE inc.horas_hombre IS NOT NULL
       GROUP BY tip.nombre_tipo`
    );

    // Reporte de Horas-Hombre por Técnico
    const horasPorTecnicoQuery = pool.query(
      `SELECT 
         tec."nombre_completo" AS tecnico,
         SUM(inc.horas_hombre) AS total_horas,
         COUNT(inc.id_incidencia) AS total_incidencias,
         AVG(inc.horas_hombre) AS promedio_horas_por_tarea
       FROM "Incidencias" AS inc
       JOIN "Usuarios" AS tec ON inc."id_tecnico_asignado" = tec."id_usuario"
       WHERE inc.horas_hombre IS NOT NULL
       GROUP BY tec."nombre_completo"`
    );
        
    // Reporte de Incidencias por Pabellón 
    const incidenciasPorPabellonQuery = pool.query(
      `SELECT
         pab.nombre_pabellon,
         COUNT(inc.id_incidencia) AS total_incidencias
       FROM "Incidencias" AS inc
       JOIN "Salones" AS sal ON inc.id_salon = sal.id_salon
       JOIN "Pabellones" AS pab ON sal.id_pabellon = pab.id_pabellon
       GROUP BY pab.nombre_pabellon
       ORDER BY total_incidencias DESC`
    );

    // Reporte de Tiempos de Resolución
    const tiemposResolucionQuery = pool.query(
      `SELECT 
         AVG(fecha_cierre - fecha_creacion) AS tiempo_promedio_resolucion
       FROM "Incidencias"
       WHERE "fecha_cierre" IS NOT NULL AND "id_estado" = 5` // 'Validado y Cerrado'
    );
    
    // Ejecutamos todo en paralelo
    const [
      horasTipoResult, 
      horasTecnicoResult,
      incidenciasPabellonResult,
      tiemposResult
    ] = await Promise.all([
      horasPorTipoQuery, 
      horasTecnicoResult,
      incidenciasPorPabellonQuery,
      tiemposResult
    ]);

    res.json({
      reporte_horas_por_tipo: horasTipoResult.rows,
      reporte_horas_por_tecnico: horasTecnicoResult.rows,
      reporte_incidencias_por_pabellon: incidenciasPabellonResult.rows, 
      kpis_generales: {
        tiempo_promedio_resolucion: tiemposResult.rows[0].tiempo_promedio_resolucion || 'N/A'
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al generar reportes");
  }
};
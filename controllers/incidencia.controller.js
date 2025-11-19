const pool = require('../db/db.js');

/**
 * Crea una nueva incidencia.
 */
exports.crearIncidencia = async (req, res) => {
  try {
    // Obtenemos los datos (¡'ubicacion' se reemplaza por 'id_salon'!)
    const { descripcion, id_salon, id_tipo, urgencia, id_usuario_reporta } = req.body; 

    // Verificamos la foto
    if (!req.file) {
      return res.status(400).json({ msg: "Debe adjuntar una prueba fotográfica." });
    }
    const url_foto = `uploads/${req.file.filename}`;

    // Estado inicial
    const id_estado_inicial = 1; // 'Pendiente de Asignación'

    // Insertamos la Incidencia principal en la BD
    const nuevaIncidencia = await pool.query(
      `INSERT INTO "Incidencias" 
         (descripcion, id_salon, urgencia, id_usuario_reporta, id_tipo, id_estado) -- <-- MODIFICADO
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_incidencia`,
      [descripcion, id_salon, urgencia, id_usuario_reporta, id_tipo, id_estado_inicial] 
    );

    const idIncidenciaNueva = nuevaIncidencia.rows[0].id_incidencia;

    // Insertamos la foto
    await pool.query(
      `INSERT INTO "Fotos_Incidencia" (id_incidencia, url_foto) VALUES ($1, $2)`,
      [idIncidenciaNueva, url_foto]
    );

    // Respondemos
    res.status(201).json({
      msg: "Incidencia reportada con éxito.",
      id_incidencia: idIncidenciaNueva
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al crear la incidencia");
  }
};

/**
 * Obtiene el resumen de reportes.
 */
exports.getResumenPorUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    if (req.usuario.id.toString() !== idUsuario) {
        return res.status(403).json({ msg: "Acceso no autorizado." });
    }
    const pendientesQuery = pool.query(
      `SELECT COUNT(*) FROM "Incidencias" 
       WHERE "id_usuario_reporta" = $1 AND "id_estado" != 5`,
      [idUsuario]
    );
    const resueltosQuery = pool.query(
      `SELECT COUNT(*) FROM "Incidencias" 
       WHERE "id_usuario_reporta" = $1 AND "id_estado" = 5`,
      [idUsuario]
    );
    const [pendientesResult, resueltosResult] = await Promise.all([
      pendientesQuery,
      resueltosQuery,
    ]);
    res.json({
      pendientes: parseInt(pendientesResult.rows[0].count, 10),
      resueltos: parseInt(resueltosResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al obtener resumen");
  }
};


/**
 *Obtiene las últimas 5 incidencias.
 */
exports.getUltimasPorUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    if (req.usuario.id.toString() !== idUsuario) {
        return res.status(403).json({ msg: "Acceso no autorizado." });
    }

    const ultimas = await pool.query(
      `SELECT 
         inc."id_incidencia", 
         inc."descripcion", 
         inc."fecha_creacion",
         est."nombre_estado",
         sal."nombre_salon",         -- <-- AÑADIDO
         pab."nombre_pabellon"     -- <-- AÑADIDO
       FROM "Incidencias" AS inc
       INNER JOIN "Estados_Incidencia" AS est ON inc."id_estado" = est."id_estado"
       INNER JOIN "Salones" AS sal ON inc."id_salon" = sal."id_salon"             -- <-- AÑADIDO
       INNER JOIN "Pabellones" AS pab ON sal."id_pabellon" = pab."id_pabellon"   -- <-- AÑADIDO
       WHERE inc."id_usuario_reporta" = $1
       ORDER BY inc."fecha_creacion" DESC
       LIMIT 5`,
      [idUsuario]
    );

    // Mapeamos el resultado
    const resultadoFormateado = ultimas.rows.map(row => ({
      id_incidencia: row.id_incidencia,
      descripcion: row.descripcion,
      // Concatenamos la ubicación para el frontend
      ubicacion: `${row.nombre_pabellon} - ${row.nombre_salon}`, 
      fecha_creacion: row.fecha_creacion,
      estado: {
        nombre_estado: row.nombre_estado
      }
    }));

    res.json(resultadoFormateado);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al obtener últimas incidencias");
  }
};


/**
 * Obtiene el historial COMPLETO del usuario.
 */
exports.getHistorialPorUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    if (req.usuario.id.toString() !== idUsuario) {
      return res.status(403).json({ msg: "Acceso no autorizado." });
    }
    
    // Obtenemos todas las incidencias
    const incidenciasQuery = await pool.query(
      `SELECT 
         inc.*,
         est."nombre_estado",
         sal."nombre_salon",         -- <-- AÑADIDO
         pab."nombre_pabellon"     -- <-- AÑADIDO
       FROM "Incidencias" AS inc
       INNER JOIN "Estados_Incidencia" AS est ON inc."id_estado" = est."id_estado"
       INNER JOIN "Salones" AS sal ON inc."id_salon" = sal."id_salon"             -- <-- AÑADIDO
       INNER JOIN "Pabellones" AS pab ON sal."id_pabellon" = pab."id_pabellon"   -- <-- AÑADIDO
       WHERE inc."id_usuario_reporta" = $1
       ORDER BY inc."fecha_creacion" DESC`,
      [idUsuario]
    );

    const incidencias = incidenciasQuery.rows;

    // Para cada incidencia, obtenemos sus fotos e historial (sin cambios aquí)
    const incidenciasCompletas = await Promise.all(
      incidencias.map(async (inc) => {
        const idIncidencia = inc.id_incidencia;

        const fotosQuery = pool.query(
          `SELECT "url_foto" FROM "Fotos_Incidencia" WHERE "id_incidencia" = $1`,
          [idIncidencia]
        );

        const historialQuery = pool.query(
          `SELECT 
             h.*,
             u."nombre_completo"
           FROM "Historial_Cambios" AS h
           INNER JOIN "Usuarios" AS u ON h."id_usuario_actor" = u."id_usuario"
           WHERE h."id_incidencia" = $1
           ORDER BY h."fecha_cambio" ASC`,
          [idIncidencia]
        );
        
        const [fotosResult, historialResult] = await Promise.all([fotosQuery, historialQuery]);

        // Formateamos el JSON final
        return {
          id_incidencia: inc.id_incidencia,
          descripcion: inc.descripcion,
          ubicacion: `${inc.nombre_pabellon} - ${inc.nombre_salon}`, 
          fecha_creacion: inc.fecha_creacion,
          urgencia: inc.urgencia,
          horas_hombre: inc.horas_hombre,
          estado: {
            nombre_estado: inc.nombre_estado
          },
          fotos: fotosResult.rows,
          historial: historialResult.rows.map(h => ({
            id_historial: h.id_historial,
            fecha_cambio: h.fecha_cambio,
            descripcion_cambio: h.descripcion_cambio,
            usuario_actor: {
              nombre_completo: h.nombre_completo
            }
          }))
        };
      })
    );
    
    res.json(incidenciasCompletas);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al obtener el historial");
  }
};
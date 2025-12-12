const db = require('../db/db');
const axios = require('axios');

// Si no hay URL configurada, esto será undefined y lo controlaremos abajo
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL; 

// 1. CREAR INCIDENCIA
const crearIncidencia = async (req, res) => {
    // 🔍 DEBUG: Ver qué llega del celular
    console.log("📥 Datos recibidos (Body):", req.body);
    console.log("📸 Archivos recibidos:", req.files ? Object.keys(req.files) : "Ninguno");

    const { descripcion, urgencia, id_salon, id_tipo, id_usuario_reporta } = req.body;
    
    // Validación de fotos
    if (!req.files || !req.files['foto_codigo'] || !req.files['foto_averia']) {
        console.error("❌ Faltan fotos obligatorias");
        return res.status(400).json({ msg: 'Debe subir foto del CÓDIGO y foto de la AVERÍA.' });
    }

    try {
        await db.query('BEGIN'); // Iniciar transacción

        // Insertar Incidencia
        const nuevaIncidencia = await db.query(`
            INSERT INTO "Incidencias" 
            (descripcion, urgencia, id_salon, id_activo, id_tipo, id_usuario_reporta, id_estado, horas_hombre)
            VALUES ($1, $2, $3, NULL, $4, $5, 1, 0) -- id_activo va NULL, id_estado 1 (Pendiente)
            RETURNING id_incidencia
        `, [descripcion, urgencia, id_salon, id_tipo, id_usuario_reporta]);

        const idIncidencia = nuevaIncidencia.rows[0].id_incidencia;
        console.log("✅ Incidencia insertada con ID:", idIncidencia);

        // Guardar Fotos
        const pathCodigo = req.files['foto_codigo'][0].filename;
        const pathAveria = req.files['foto_averia'][0].filename;

        await db.query(`INSERT INTO "Fotos_Incidencia" (id_incidencia, url_foto, tipo_foto) VALUES ($1, $2, 'CODIGO')`, [idIncidencia, pathCodigo]);
        await db.query(`INSERT INTO "Fotos_Incidencia" (id_incidencia, url_foto, tipo_foto) VALUES ($1, $2, 'AVERIA')`, [idIncidencia, pathAveria]);

        await db.query('COMMIT'); // Guardar cambios definitivamente

        // --- BLOQUE n8n SEGURO ---
        // Solo intentamos enviar si existe la URL y no detenemos si falla
        if (N8N_WEBHOOK_URL && N8N_WEBHOOK_URL.startsWith('http')) {
            axios.post(N8N_WEBHOOK_URL, { 
                id: idIncidencia, 
                urgencia, 
                usuario: id_usuario_reporta 
            }).catch(errorN8N => {
                console.warn("⚠️ Advertencia: n8n no respondió, pero los datos SÍ se guardaron en BD.");
                // No hacemos nada más, dejamos que el usuario reciba su "OK"
            });
        } else {
            console.log("ℹ️ n8n omitido (URL no configurada), pero datos guardados.");
        }
        // -------------------------

        res.status(201).json({ msg: 'Reporte enviado correctamente', id: idIncidencia });

    } catch (error) {
        await db.query('ROLLBACK'); // Deshacer cambios si algo falla
        console.error("🔥 ERROR CRÍTICO EN BASE DE DATOS:");
        console.error(error.detail || error.message); // Ver el detalle exacto (ej. llave foránea)
        
        res.status(500).json({ 
            msg: 'Error al guardar en base de datos', 
            error: error.detail || error.message 
        });
    }
};

// 2. OBTENER MIS REPORTES
const getMisIncidencias = async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const response = await db.query(`
            SELECT 
                i.id_incidencia, i.descripcion, i.urgencia, e.nombre_estado, 
                i.fecha_creacion, s.nombre_salon, p.nombre_pabellon, t.nombre_tipo,
                (SELECT url_foto FROM "Fotos_Incidencia" f WHERE f.id_incidencia = i.id_incidencia AND f.tipo_foto = 'CODIGO' LIMIT 1) as foto_codigo,
                (SELECT url_foto FROM "Fotos_Incidencia" f WHERE f.id_incidencia = i.id_incidencia AND f.tipo_foto = 'AVERIA' LIMIT 1) as foto_averia
            FROM "Incidencias" i
            JOIN "Estados_Incidencia" e ON i.id_estado = e.id_estado
            JOIN "Salones" s ON i.id_salon = s.id_salon
            JOIN "Pabellones" p ON s.id_pabellon = p.id_pabellon
            JOIN "Tipos_Incidencia" t ON i.id_tipo = t.id_tipo
            WHERE i.id_usuario_reporta = $1
            ORDER BY i.fecha_creacion DESC
        `, [id_usuario]);
        
        res.json(response.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al obtener historial' });
    }
};

module.exports = { crearIncidencia, getMisIncidencias };
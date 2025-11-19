const pool = require('../db/db.js'); // Importa la conexión a la base de datos PostgreSQL
const bcrypt = require('bcryptjs'); // Para encriptar y comparar contraseñas
const jwt = require('jsonwebtoken'); // Para generar el token de seguridad

const JWT_SECRET = 'su-clave-secreta-muy-segura-para-la-tesis';

/**
 * Registra un nuevo usuario en la base de datos.
 * Asume que el rol 'Usuario' tiene el id_rol = 3.
 */
exports.register = async (req, res) => {
  try {
    const { nombre_completo, email, password } = req.body;

    // 1. Verificar si el email ya existe
    const userExists = await pool.query(
      'SELECT * FROM "Usuarios" WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ msg: "El correo electrónico ya está registrado." });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Asignar el rol de "Usuario" por defecto (asumimos id_rol = 3)
    const id_rol_usuario = 3; 

    // Guardar el nuevo usuario en la BD
    const newUser = await pool.query(
      `INSERT INTO "Usuarios" (nombre_completo, email, password_hash, id_rol) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id_usuario, nombre_completo, email, id_rol`, // Devuelve los datos guardados
      [nombre_completo, email, password_hash, id_rol_usuario]
    );

    // Responder al cliente
    res.status(201).json({
      msg: "Usuario registrado exitosamente.",
      usuario: newUser.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al registrar");
  }
};


/**
 * Autentica un usuario (Login) y devuelve un token JWT.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Verificar si el usuario existe
    const user = await pool.query(
      'SELECT * FROM "Usuarios" WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ msg: "Credenciales inválidas." });
    }

    const usuarioEncontrado = user.rows[0];

    //Comparar la contraseña ingresada con la encriptada (hash) en la BD
    const isMatch = await bcrypt.compare(password, usuarioEncontrado.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ msg: "Credenciales inválidas." });
    }

    //Si las credenciales son correctas, crear el Token (JWT)
    // El 'payload' contiene los datos que queremos guardar en el token
    const payload = {
      usuario: {
        id: usuarioEncontrado.id_usuario,
        rol: usuarioEncontrado.id_rol
        // No incluir la contraseña aquí
      }
    };

    //Firmar el token (crearlo)
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '8h' }, // El token expira en 8 horas
      (err, token) => {
        if (err) throw err;
        
        //Enviar el token y los datos del usuario al cliente (Flutter)
        res.json({
          token, // El token de seguridad
          usuario: {
            id_usuario: usuarioEncontrado.id_usuario,
            nombre_completo: usuarioEncontrado.nombre_completo,
            email: usuarioEncontrado.email,
            id_rol: usuarioEncontrado.id_rol
          }
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del Servidor al iniciar sesión");
  }
};
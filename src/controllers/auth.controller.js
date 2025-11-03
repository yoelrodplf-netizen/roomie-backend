const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const register = async (req, res) => {
  const {
    correo_electronico,
    contrasena,
    nombre_perfil,
    edad,
    genero,
    profesion = '',
    habito_limpieza_nivel = 50,
    nivel_ruido_nivel = 50,
    consumo_alcohol_nivel = 0,
    frecuencia_invitados_nivel = 30,
    horario_vida = '',
    es_fumador = false,
    mascotas = '',
    presupuesto_max_renta = '',
    fecha_mudanza_min = '',
    fecha_mudanza_max = '',
    ubicacion_preferida = '',
    tipo_propiedad = '',
    es_amueblada = false,
    quiere_bano_propio = false,
    servicios_incluidos = [],
    caracteristicas_adicionales = [],
    hobbies = [],
    filosofia_vida = '',
    habilidades_intereses = [],
    descripcion_roomie_ideal = '',
    expectativas_hogar = '',
    descripcion_personal = ''
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const exists = await client.query('SELECT id_usuario FROM usuarios WHERE correo_electronico = $1', [correo_electronico]);
    if (exists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El correo ya está registrado.' });
    }

    const hashed = await bcrypt.hash(contrasena, 12);
    const user = await client.query(
      `INSERT INTO usuarios (rol_usuario, nombre_perfil, edad, genero, correo_electronico, contrasena_hash, es_verificado, profesion)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7) RETURNING id_usuario`,
      ['AMBOS', nombre_perfil, edad, genero, correo_electronico, hashed, profesion]
    );
    const userId = user.rows[0].id_usuario;

    // Insertar perfil_estilo_vida
    await client.query(
      `INSERT INTO perfil_estilo_vida (id_usuario, habito_limpieza, nivel_ruido, horario_vida, es_fumador, frecuencia_invitados, mascotas, consumo_alcohol_drogas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        habito_limpieza_nivel?.toString() || null,
        nivel_ruido_nivel?.toString() || null,
        horario_vida || null,
        es_fumador,
        frecuencia_invitados_nivel?.toString() || null,
        mascotas || null,
        consumo_alcohol_nivel?.toString() || null
      ]
    );

    // Insertar perfil_necesidades_propiedad
    await client.query(
      `INSERT INTO perfil_necesidades_propiedad (
        id_usuario, presupuesto_max_renta, fecha_mudanza_min, fecha_mudanza_max,
        ubicacion_preferida, tipo_propiedad, es_amueblada, quiere_bano_propio,
        servicios_incluidos, caracteristicas_adicionales
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        presupuesto_max_renta || null,
        fecha_mudanza_min || null,
        fecha_mudanza_max || null,
        ubicacion_preferida || null,
        tipo_propiedad || null,
        es_amueblada,
        quiere_bano_propio,
        servicios_incluidos || null,
        caracteristicas_adicionales || null
      ]
    );

    // Insertar intereses_personalidad
    await client.query(
      `INSERT INTO intereses_personalidad (id_usuario, hobbies, filosofia_vida, habilidades_intereses)
       VALUES ($1, $2, $3, $4)`,
      [userId, hobbies || null, filosofia_vida || null, habilidades_intereses || null]
    );

    // Insertar preguntas_abiertas
    await client.query(
      `INSERT INTO preguntas_abiertas (id_usuario, descripcion_roomie_ideal, expectativas_hogar, descripcion_personal)
       VALUES ($1, $2, $3, $4)`,
      [userId, descripcion_roomie_ideal || null, expectativas_hogar || null, descripcion_personal || null]
    );

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: { id: userId, nombre: nombre_perfil }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registro falló:', err);
    res.status(500).json({ error: 'Error al registrar usuario.' });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  const { correo_electronico, contrasena } = req.body;
  try {
    const user = await pool.query(
      'SELECT id_usuario, contrasena_hash, rol_usuario, nombre_perfil FROM usuarios WHERE correo_electronico = $1',
      [correo_electronico]
    );
    if (user.rows.length === 0) return res.status(400).json({ error: 'Credenciales inválidas.' });

    const valid = await bcrypt.compare(contrasena, user.rows[0].contrasena_hash);
    if (!valid) return res.status(400).json({ error: 'Credenciales inválidas.' });

    const token = jwt.sign(
      { id: user.rows[0].id_usuario, rol: user.rows[0].rol_usuario },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.rows[0].id_usuario,
        nombre: user.rows[0].nombre_perfil,
        rol: user.rows[0].rol_usuario
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
};

module.exports = { register, login };
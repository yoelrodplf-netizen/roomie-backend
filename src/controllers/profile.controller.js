const { pool } = require('../config/db');

const getCompatibleProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT 
        u.id_usuario,
        u.nombre_perfil,
        u.edad,
        u.genero,
        n.ubicacion_preferida AS ubicacion,
        n.presupuesto_max_renta AS presupuesto,
        e.habito_limpieza::INTEGER AS limpieza,
        e.nivel_ruido::INTEGER AS ruido,
        e.consumo_alcohol_drogas::INTEGER AS alcohol,
        p.descripcion_personal AS descripcion
      FROM usuarios u
      LEFT JOIN perfil_estilo_vida e ON u.id_usuario = e.id_usuario
      LEFT JOIN perfil_necesidades_propiedad n ON u.id_usuario = n.id_usuario
      LEFT JOIN preguntas_abiertas p ON u.id_usuario = p.id_usuario
      WHERE u.id_usuario != $1
      ORDER BY u.id_usuario
      LIMIT 10;
    `,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al cargar perfiles:', err);
    res.status(500).json({ error: 'Error al cargar perfiles' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT 
        u.id_usuario,
        u.nombre_perfil,
        u.edad,
        u.genero,
        u.correo_electronico,
        u.profesion,
        e.habito_limpieza AS habito_limpieza_nivel,
        e.nivel_ruido AS nivel_ruido_nivel,
        e.consumo_alcohol_drogas AS consumo_alcohol_nivel,
        e.frecuencia_invitados AS frecuencia_invitados_nivel,
        e.horario_vida,
        e.es_fumador,
        e.mascotas,
        n.presupuesto_max_renta,
        n.fecha_mudanza_min,
        n.fecha_mudanza_max,
        n.ubicacion_preferida,
        n.tipo_propiedad,
        n.es_amueblada,
        n.quiere_bano_propio,
        n.servicios_incluidos,
        n.caracteristicas_adicionales,
        i.hobbies,
        i.filosofia_vida,
        i.habilidades_intereses,
        p.descripcion_roomie_ideal,
        p.expectativas_hogar,
        p.descripcion_personal
      FROM usuarios u
      LEFT JOIN perfil_estilo_vida e ON u.id_usuario = e.id_usuario
      LEFT JOIN perfil_necesidades_propiedad n ON u.id_usuario = n.id_usuario
      LEFT JOIN intereses_personalidad i ON u.id_usuario = i.id_usuario
      LEFT JOIN preguntas_abiertas p ON u.id_usuario = p.id_usuario
      WHERE u.id_usuario = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al cargar mi perfil:', err);
    res.status(500).json({ error: 'Error al cargar tu perfil' });
  }
};

const updateMyProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    nombre_perfil,
    edad,
    genero,
    profesion,
    habito_limpieza_nivel,
    nivel_ruido_nivel,
    consumo_alcohol_nivel,
    frecuencia_invitados_nivel,
    horario_vida,
    es_fumador,
    mascotas,
    presupuesto_max_renta,
    fecha_mudanza_min,
    fecha_mudanza_max,
    ubicacion_preferida,
    tipo_propiedad,
    es_amueblada,
    quiere_bano_propio,
    servicios_incluidos,
    caracteristicas_adicionales,
    hobbies,
    filosofia_vida,
    habilidades_intereses,
    descripcion_roomie_ideal,
    expectativas_hogar,
    descripcion_personal
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Actualizar usuarios
    await client.query(
      `UPDATE usuarios 
       SET nombre_perfil = $1, edad = $2, genero = $3, profesion = $4
       WHERE id_usuario = $5`,
      [nombre_perfil, edad, genero, profesion, userId]
    );

    // Actualizar o insertar en perfil_estilo_vida
    const estiloExists = await client.query('SELECT 1 FROM perfil_estilo_vida WHERE id_usuario = $1', [userId]);
    if (estiloExists.rows.length > 0) {
      await client.query(
        `UPDATE perfil_estilo_vida SET
          habito_limpieza = $1, nivel_ruido = $2, horario_vida = $3,
          es_fumador = $4, frecuencia_invitados = $5, mascotas = $6,
          consumo_alcohol_drogas = $7
         WHERE id_usuario = $8`,
        [
          habito_limpieza_nivel?.toString() || null,
          nivel_ruido_nivel?.toString() || null,
          horario_vida || null,
          es_fumador,
          frecuencia_invitados_nivel?.toString() || null,
          mascotas || null,
          consumo_alcohol_nivel?.toString() || null,
          userId
        ]
      );
    } else {
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
    }

    // Actualizar o insertar en perfil_necesidades_propiedad
    const necesidadesExists = await client.query('SELECT 1 FROM perfil_necesidades_propiedad WHERE id_usuario = $1', [userId]);
    const queryNec = necesidadesExists.rows.length > 0
      ? `UPDATE perfil_necesidades_propiedad SET
          presupuesto_max_renta = $1, fecha_mudanza_min = $2, fecha_mudanza_max = $3,
          ubicacion_preferida = $4, tipo_propiedad = $5, es_amueblada = $6, quiere_bano_propio = $7,
          servicios_incluidos = $8, caracteristicas_adicionales = $9
         WHERE id_usuario = $10`
      : `INSERT INTO perfil_necesidades_propiedad (
          id_usuario, presupuesto_max_renta, fecha_mudanza_min, fecha_mudanza_max,
          ubicacion_preferida, tipo_propiedad, es_amueblada, quiere_bano_propio,
          servicios_incluidos, caracteristicas_adicionales
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

    await client.query(queryNec, [
      presupuesto_max_renta || null,
      fecha_mudanza_min || null,
      fecha_mudanza_max || null,
      ubicacion_preferida || null,
      tipo_propiedad || null,
      es_amueblada,
      quiere_bano_propio,
      servicios_incluidos || null,
      caracteristicas_adicionales || null,
      userId
    ]);

    // Actualizar o insertar en intereses_personalidad
    const interesesExists = await client.query('SELECT 1 FROM intereses_personalidad WHERE id_usuario = $1', [userId]);
    const queryInt = interesesExists.rows.length > 0
      ? `UPDATE intereses_personalidad SET hobbies = $1, filosofia_vida = $2, habilidades_intereses = $3 WHERE id_usuario = $4`
      : `INSERT INTO intereses_personalidad (id_usuario, hobbies, filosofia_vida, habilidades_intereses) VALUES ($1, $2, $3, $4)`;

    await client.query(queryInt, [
      hobbies || null,
      filosofia_vida || null,
      habilidades_intereses || null,
      userId
    ]);

    // Actualizar o insertar en preguntas_abiertas
    const preguntasExists = await client.query('SELECT 1 FROM preguntas_abiertas WHERE id_usuario = $1', [userId]);
    const queryPreg = preguntasExists.rows.length > 0
      ? `UPDATE preguntas_abiertas SET descripcion_roomie_ideal = $1, expectativas_hogar = $2, descripcion_personal = $3 WHERE id_usuario = $4`
      : `INSERT INTO preguntas_abiertas (id_usuario, descripcion_roomie_ideal, expectativas_hogar, descripcion_personal) VALUES ($1, $2, $3, $4)`;

    await client.query(queryPreg, [
      descripcion_roomie_ideal || null,
      expectativas_hogar || null,
      descripcion_personal || null,
      userId
    ]);

    await client.query('COMMIT');
    res.json({ message: 'Perfil actualizado con éxito' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en updateMyProfile:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  } finally {
    client.release();
  }
};

module.exports = { getCompatibleProfiles, getMyProfile, updateMyProfile };
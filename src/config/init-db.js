// src/config/init-db.js
const { pool } = require('./db');

const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario SERIAL PRIMARY KEY,
      rol_usuario VARCHAR(20) DEFAULT 'AMBOS',
      nombre_perfil VARCHAR(100) NOT NULL,
      edad INTEGER,
      genero VARCHAR(50),
      correo_electronico VARCHAR(255) UNIQUE NOT NULL,
      contrasena_hash VARCHAR(255) NOT NULL,
      profesion VARCHAR(100),
      es_verificado BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS perfil_estilo_vida (
      id_usuario INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      habito_limpieza VARCHAR(10),
      nivel_ruido VARCHAR(10),
      horario_vida VARCHAR(50),
      es_fumador BOOLEAN,
      frecuencia_invitados VARCHAR(10),
      mascotas TEXT,
      consumo_alcohol_drogas VARCHAR(10)
    )`,

    `CREATE TABLE IF NOT EXISTS perfil_necesidades_propiedad (
      id_usuario INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      presupuesto_max_renta VARCHAR(50),
      fecha_mudanza_min DATE,
      fecha_mudanza_max DATE,
      ubicacion_preferida VARCHAR(100),
      tipo_propiedad VARCHAR(50),
      es_amueblada BOOLEAN,
      quiere_bano_propio BOOLEAN,
      servicios_incluidos TEXT,
      caracteristicas_adicionales TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS intereses_personalidad (
      id_usuario INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      hobbies TEXT,
      filosofia_vida TEXT,
      habilidades_intereses TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS preguntas_abiertas (
      id_usuario INTEGER PRIMARY KEY REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
      descripcion_roomie_ideal TEXT,
      expectativas_hogar TEXT,
      descripcion_personal TEXT
    )`
  ];

  try {
    for (const query of queries) {
      await pool.query(query);
    }
    console.log('✅ Tablas creadas o verificadas con éxito.');
  } catch (err) {
    console.error('❌ Error al crear las tablas:', err);
  }
};

module.exports = { createTables };
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

exports.uploadSingle = upload.single('foto_perfil');

exports.signup = async (req, res) => {
  try {
    const {
      correo_electronico,
      contrasena,
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

    if (!correo_electronico || !contrasena || !nombre_perfil || !edad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const existingUser = await User.findOne({ correo_electronico });
    if (existingUser) {
      return res.status(400).json({ error: 'Correo ya registrado' });
    }

    let foto_perfil_url = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'roomie-profiles',
          public_id: `signup-${nombre_perfil.replace(/\s+/g, '-')}-${Date.now()}`,
          overwrite: true,
          resource_type: 'image'
        });
        foto_perfil_url = result.secure_url;
      } catch (err) {
        console.error('Cloudinary error:', err);
      }
    }

    const newUser = new User({
      correo_electronico,
      contrasena: await bcrypt.hash(contrasena, 10),
      nombre_perfil,
      edad: parseInt(edad),
      genero,
      profesion,
      habito_limpieza_nivel: parseInt(habito_limpieza_nivel) || 50,
      nivel_ruido_nivel: parseInt(nivel_ruido_nivel) || 50,
      consumo_alcohol_nivel: parseInt(consumo_alcohol_nivel) || 0,
      frecuencia_invitados_nivel: parseInt(frecuencia_invitados_nivel) || 30,
      horario_vida,
      es_fumador: es_fumador === 'true' || es_fumador === true,
      mascotas,
      presupuesto_max_renta,
      fecha_mudanza_min,
      fecha_mudanza_max,
      ubicacion_preferida,
      tipo_propiedad,
      es_amueblada: es_amueblada === 'true' || es_amueblada === true,
      quiere_bano_propio: quiere_bano_propio === 'true' || quiere_bano_propio === true,
      servicios_incluidos: Array.isArray(servicios_incluidos) ? servicios_incluidos : (servicios_incluidos ? [servicios_incluidos] : []),
      caracteristicas_adicionales: Array.isArray(caracteristicas_adicionales) ? caracteristicas_adicionales : (caracteristicas_adicionales ? [caracteristicas_adicionales] : []),
      hobbies: Array.isArray(hobbies) ? hobbies : (hobbies ? [hobbies] : []),
      filosofia_vida,
      habilidades_intereses: Array.isArray(habilidades_intereses) ? habilidades_intereses : (habilidades_intereses ? [habilidades_intereses] : []),
      descripcion_roomie_ideal,
      expectativas_hogar,
      descripcion_personal,
      foto_perfil: foto_perfil_url,
      likes: []
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'roomie-secret-key', { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: newUser._id, nombre: newUser.nombre_perfil }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.login = async (req, res) => {
  try {
    const { correo_electronico, contrasena } = req.body;
    const user = await User.findOne({ correo_electronico });
    if (!user || !(await bcrypt.compare(contrasena, user.contrasena))) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'roomie-secret-key', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, nombre: user.nombre_perfil } });
  } catch (error) {
    res.status(500).json({ error: 'Error en login' });
  }
};
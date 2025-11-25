const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

exports.uploadFields = upload.fields([
  { name: 'fotos_perfil', maxCount: 5 },
  { name: 'fotos_propiedad', maxCount: 5 }
]);

exports.signup = async (req, res) => {
  try {
    const {
      correo_electronico,
      contrasena,
      nombre_perfil,
      edad,
      genero,
      profesion,
      rol,
      bio
    } = req.body;

    if (!correo_electronico || !contrasena || !nombre_perfil || !edad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const existingUser = await User.findOne({ correo_electronico });
    if (existingUser) {
      return res.status(400).json({ error: 'Correo ya registrado' });
    }

    let fotos_perfil = [];
    let fotos_propiedad = [];

    if (req.files?.fotos_perfil) {
      for (const file of req.files.fotos_perfil) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'roomie-photos/fotos_perfil',
          public_id: `profile-${nombre_perfil}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          overwrite: true,
          resource_type: 'image'
        });
        fotos_perfil.push(result.secure_url);
      }
    }

    if (fotos_perfil.length === 0) {
      return res.status(400).json({ error: 'Debes subir al menos una foto de perfil' });
    }

    if (req.files?.fotos_propiedad && ['OFERENTE', 'AMBOS'].includes(rol)) {
      for (const file of req.files.fotos_propiedad) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'roomie-photos/fotos_propiedad',
          public_id: `property-${nombre_perfil}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          overwrite: true,
          resource_type: 'image'
        });
        fotos_propiedad.push(result.secure_url);
      }
    }

    const newUser = new User({
      correo_electronico,
      contrasena: await bcrypt.hash(contrasena, 10),
      nombre_perfil,
      edad: parseInt(edad),
      genero,
      profesion,
      rol,
      bio: (bio || '').slice(0, 120),
      fotos_perfil,
      fotos_propiedad,
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
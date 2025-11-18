// src/controllers/profile.controller.js
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// Configurar multer
const upload = multer({ dest: 'uploads/' });

// ✅ Middleware para subir foto
exports.uploadSingle = upload.single('foto_perfil');

// ✅ Actualizar perfil (incluyendo foto)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = { ...req.body };

    // Convertir campos booleanos y numéricos
    if (updates.edad) updates.edad = parseInt(updates.edad);
    if (updates.habito_limpieza_nivel) updates.habito_limpieza_nivel = parseInt(updates.habito_limpieza_nivel);
    if (updates.nivel_ruido_nivel) updates.nivel_ruido_nivel = parseInt(updates.nivel_ruido_nivel);
    if (updates.consumo_alcohol_nivel) updates.consumo_alcohol_nivel = parseInt(updates.consumo_alcohol_nivel);
    if (updates.frecuencia_invitados_nivel) updates.frecuencia_invitados_nivel = parseInt(updates.frecuencia_invitados_nivel);
    if (updates.es_fumador !== undefined) updates.es_fumador = updates.es_fumador === 'true' || updates.es_fumador === true;
    if (updates.es_amueblada !== undefined) updates.es_amueblada = updates.es_amueblada === 'true' || updates.es_amueblada === true;
    if (updates.quiere_bano_propio !== undefined) updates.quiere_bano_propio = updates.quiere_bano_propio === 'true' || updates.quiere_bano_propio === true;

    // Manejar arrays
    const arrayFields = [
      'servicios_incluidos',
      'caracteristicas_adicionales',
      'hobbies',
      'habilidades_intereses'
    ];
    arrayFields.forEach(field => {
      if (updates[field] && typeof updates[field] === 'string') {
        updates[field] = updates[field] ? [updates[field]] : [];
      }
    });

    // Subir nueva foto si se envió
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'roomie-profiles',
          public_id: `profile-${userId}-${Date.now()}`,
          overwrite: true,
          resource_type: 'image'
        });
        updates.foto_perfil = result.secure_url;
      } catch (uploadErr) {
        console.error('Error al subir foto:', uploadErr.message);
        // Continuar sin actualizar la foto si falla
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Obtener mi perfil
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar el perfil' });
  }
};
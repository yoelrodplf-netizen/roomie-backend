const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

exports.uploadSingle = upload.single('foto_perfil');

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = { ...req.body };

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'roomie-profiles',
          public_id: `profile-${userId}-${Date.now()}`,
          overwrite: true,
          resource_type: 'image'
        });
        updates.foto_perfil = result.secure_url;
      } catch (err) {
        console.error('Cloudinary update error:', err);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!updatedUser) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar perfil' });
  }
};
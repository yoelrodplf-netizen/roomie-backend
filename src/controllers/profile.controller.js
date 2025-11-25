const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

exports.uploadFields = upload.fields([
  { name: 'fotos_perfil', maxCount: 5 },
  { name: 'fotos_propiedad', maxCount: 5 }
]);

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = { ...req.body };

    let fotos_perfil = [...(req.user.fotos_perfil || [])];
    let fotos_propiedad = [...(req.user.fotos_propiedad || [])];

    if (req.files?.fotos_perfil) {
      for (const file of req.files.fotos_perfil) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'roomie-photos/fotos_perfil',
          public_id: `profile-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          overwrite: true,
          resource_type: 'image'
        });
        fotos_perfil.push(result.secure_url);
      }
      fotos_perfil = fotos_perfil.slice(-5);
    }

    if (req.files?.fotos_propiedad && ['OFERENTE', 'AMBOS'].includes(updates.rol)) {
      for (const file of req.files.fotos_propiedad) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'roomie-photos/fotos_propiedad',
          public_id: `property-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          overwrite: true,
          resource_type: 'image'
        });
        fotos_propiedad.push(result.secure_url);
      }
      fotos_propiedad = fotos_propiedad.slice(-5);
    }

    updates.fotos_perfil = fotos_perfil;
    updates.fotos_propiedad = fotos_propiedad;
    updates.bio = (updates.bio || '').slice(0, 120);

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
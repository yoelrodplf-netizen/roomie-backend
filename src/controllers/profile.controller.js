const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Función auxiliar: extrae la ciudad principal de una dirección
function extractCity(location) {
  if (!location) return null;
  const parts = location.split(',').map(p => p.trim());
  return parts[0] || null;
}

// NUEVO: Algoritmo de matching
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // IDs ya likeados (para no repetir)
    const likedIds = currentUser.likes.map(id => id.toString());

    // Ciudad del usuario actual
    const currentUserCity = extractCity(currentUser.ubicacion_preferida);

    // Filtro base
    const filter = {
      _id: { $ne: userId, $nin: likedIds },
      fotos_perfil: { $exists: true, $not: { $size: 0 } } // Solo perfiles con al menos una foto
    };

    // Filtro por ciudad (si existe)
    if (currentUserCity) {
      filter.ubicacion_preferida = { $regex: new RegExp(currentUserCity, 'i') };
    }

    // Roles compatibles
    if (currentUser.rol === 'OFERENTE') {
      filter.rol = { $in: ['BUSCADOR', 'AMBOS'] };
    } else if (currentUser.rol === 'BUSCADOR') {
      filter.rol = { $in: ['OFERENTE', 'AMBOS'] };
    }
    // Si es AMBOS, no se filtra por rol

    const candidates = await User.find(filter);

    // Aplicar compatibilidad de sliders (±30 puntos máximo)
    const compatibleProfiles = candidates.filter(profile => {
      const diffLimpieza = Math.abs(currentUser.habito_limpieza_nivel - profile.habito_limpieza_nivel);
      const diffRuido = Math.abs(currentUser.nivel_ruido_nivel - profile.nivel_ruido_nivel);
      const diffAlcohol = Math.abs(currentUser.consumo_alcohol_nivel - profile.consumo_alcohol_nivel);
      const diffInvitados = Math.abs(currentUser.frecuencia_invitados_nivel - profile.frecuencia_invitados_nivel);

      return diffLimpieza <= 30 && diffRuido <= 30 && diffAlcohol <= 30 && diffInvitados <= 30;
    });

    // Ordenar por compatibilidad (menor diferencia = mejor match)
    compatibleProfiles.sort((a, b) => {
      const scoreA = Math.abs(currentUser.habito_limpieza_nivel - a.habito_limpieza_nivel) +
                     Math.abs(currentUser.nivel_ruido_nivel - a.nivel_ruido_nivel);
      const scoreB = Math.abs(currentUser.habito_limpieza_nivel - b.habito_limpieza_nivel) +
                     Math.abs(currentUser.nivel_ruido_nivel - b.nivel_ruido_nivel);
      return scoreA - scoreB;
    });

    res.json(compatibleProfiles);
  } catch (error) {
    console.error('Error en feed:', error);
    res.status(500).json({ error: 'Error al cargar el feed' });
  }
};

// Actualizar perfil (igual que antes)
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
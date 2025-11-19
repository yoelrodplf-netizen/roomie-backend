const User = require('../models/User');

exports.likeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.targetId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (!user.likes.includes(targetId)) {
      user.likes.push(targetId);
      await user.save();
    }

    res.json({ liked: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al dar like' });
  }
};
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado: token no proporcionado' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'roomie-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
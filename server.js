require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const profileRoutes = require('./src/routes/profile.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS para Vercel y desarrollo local
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://roomie-frontend.vercel.app'
  ],
  credentials: true
};
app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ message: 'RoomieFinder Backend ✅' });
});

// Manejo de rutas no encontradas (SIN '*')
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
});
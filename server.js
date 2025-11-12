// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const profileRoutes = require('./src/routes/profile.routes');
const { createTables } = require('./src/config/init-db');

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Orígenes permitidos (sin espacios y con el dominio correcto)
const allowedOrigins = [
  'http://localhost:5173',
  'https://roomie-frontend.vercel.app',
  'https://roomie-frontend-25.vercel.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite solicitudes sin origen (como las de Postman o curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS: Origen no permitido por el servidor'));
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'RoomieFinder Backend ✅' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor y crear tablas
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  await createTables();
});
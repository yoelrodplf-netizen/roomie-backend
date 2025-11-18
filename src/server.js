// src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http'); // Necesario para Socket.IO en la Fase 3

// Cargar variables de entorno
dotenv.config();

// Inicializar Express
const app = express();

// Crear servidor HTTP (requerido para WebSocket en Fase 3)
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',           // Frontend en desarrollo
    'https://roomie-frontend.vercel.app' // Frontend en producción
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (opcional, para desarrollo local de imágenes)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend de Roomie funcionando ✅' });
});

// Conectar a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/roomie';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
});

// Exportar tanto app como server para uso en otras partes (ej: Socket.IO)
module.exports = { app, server };
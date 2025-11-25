const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://roomie-frontend.vercel.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Socket.IO
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const io = socketIO(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://roomie-frontend.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('👤 Usuario conectado:', socket.id);

  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'roomie-secret-key');
      const user = await User.findById(decoded.id);
      if (!user) throw new Error('Usuario no encontrado');

      socket.userId = user._id.toString();
      userSockets.set(socket.userId, socket.id);
      socket.join(socket.userId);
      console.log(`✅ Usuario autenticado: ${socket.userId}`);
    } catch (err) {
      console.error('❌ Autenticación fallida:', err.message);
      socket.disconnect(true);
    }
  });

  socket.on('sendMessage', async (data) => {
    const { receiverId, message } = data;
    const senderId = socket.userId;

    if (!senderId || !receiverId || !message) {
      return socket.emit('error', 'Faltan datos');
    }

    try {
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
        return socket.emit('error', 'Usuario no encontrado');
      }

      const isMatch = 
        sender.likes.map(id => id.toString()).includes(receiverId) &&
        receiver.likes.map(id => id.toString()).includes(senderId);

      if (!isMatch) {
        return socket.emit('error', 'No hay match entre ustedes');
      }

      const messageData = {
        senderId,
        receiverId,
        message,
        timestamp: new Date().toISOString()
      };

      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', messageData);
      }

      io.to(senderId).emit('receiveMessage', messageData);

    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      socket.emit('error', 'Error interno');
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }
    console.log('🚪 Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});

module.exports = { app, server };
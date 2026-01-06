// server.js - UPDATED AND CORRECTED
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// IMPORTANT: Since server.js is in planyty-backend/ (root)
const projectRoot = __dirname; // This gives planyty-backend/
const srcDir = path.join(projectRoot, 'src');
const uploadsDir = path.join(projectRoot, 'uploads'); // planyty-backend/uploads/

console.log('📁 SERVER.JS - DIRECTORY PATHS:');
console.log('Project Root:', projectRoot);
console.log('Src Dir:', srcDir);
console.log('Uploads Dir:', uploadsDir);

// Create required directories
const directories = [
  'uploads/images',
  'uploads/videos', 
  'uploads/audio',
  'uploads/documents'
];

directories.forEach(dir => {
  const fullPath = path.join(projectRoot, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true, mode: 0o755 });
    console.log(`✅ Created: ${fullPath}`);
  } else {
    console.log(`✅ Exists: ${fullPath}`);
  }
});

// Clean old audio files if needed
const audioDir = path.join(projectRoot, 'uploads', 'audio');
if (fs.existsSync(audioDir)) {
  const files = fs.readdirSync(audioDir);
  console.log(`📁 Audio files (${files.length}):`);
  
  // Remove old format files (audio-*)
  files.forEach(file => {
    const filePath = path.join(audioDir, file);
    if (file.startsWith('audio-')) {
      console.log(`🗑️ Removing old format: ${file}`);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`⚠️ Could not delete ${file}:`, err.message);
      }
    } else if (file.endsWith('.webm')) {
      const stats = fs.statSync(filePath);
      console.log(`   - ${file} (${stats.size} bytes)`);
    }
  });
}

const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { sequelize, User, Team } = require('./src/models/index');
const socketController = require('./src/controllers/socket.controller');

const PORT = process.env.PORT || 5000;
const mongo = process.env.MONGO_URI;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true
});

const connectedUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Team,
        as: 'teams',
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    const teamId = user.teams && user.teams.length > 0 ? user.teams[0].id : null;
    
    socket.userId = String(user.id);
    socket.userName = user.name || user.username || 'User';
    socket.userRole = user.role || 'team_member';
    socket.teamId = teamId ? String(teamId) : null;
    
    connectedUsers.set(socket.userId, {
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole,
      teamId: socket.teamId,
      socketId: socket.id
    });
    
    console.log(`✅ Socket authenticated: ${socket.userName} (ID: ${socket.userId})`);
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error('Authentication error: ' + error.message));
  }
});

io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id, 'as', socket.userName);
  
  const typingUsers = new Map();
  
  socketController(io, socket, connectedUsers);
  
  socket.on('typing_start', ({ channelId }) => {
    if (!channelId) return;
    
    if (!typingUsers.has(channelId)) {
      typingUsers.set(channelId, new Set());
    }
    typingUsers.get(channelId).add(socket.userId);
    
    socket.to(channelId).emit('user_typing', {
      channelId,
      userId: socket.userId,
      userName: socket.userName,
      typingUsers: Array.from(typingUsers.get(channelId)).map(id => ({
        userId: id,
        userName: connectedUsers.get(id)?.userName || 'User'
      }))
    });
  });
  
  socket.on('typing_stop', ({ channelId }) => {
    if (!channelId || !typingUsers.has(channelId)) return;
    
    typingUsers.get(channelId).delete(socket.userId);
    
    if (typingUsers.get(channelId).size === 0) {
      typingUsers.delete(channelId);
      socket.to(channelId).emit('user_stopped_typing', { channelId });
    } else {
      socket.to(channelId).emit('user_typing', {
        channelId,
        userId: socket.userId,
        userName: socket.userName,
        typingUsers: Array.from(typingUsers.get(channelId)).map(id => ({
          userId: id,
          userName: connectedUsers.get(id)?.userName || 'User'
        }))
      });
    }
  });

  socket.on('user_online', () => {
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('user_status', {
          userId: socket.userId,
          userName: socket.userName,
          status: 'online',
          lastSeen: new Date()
        });
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Client Disconnected:', socket.id, socket.userName);
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
    
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.to(room).emit('user_status', {
          userId: socket.userId,
          userName: socket.userName,
          status: 'offline',
          lastSeen: new Date()
        });
      }
    });
  });
});

async function startServer() {
  try {
    if (mongo) {
      try {
        await mongoose.connect(mongo);
        console.log('✅ MongoDB connected');
      } catch (mongoError) {
        console.warn('⚠️ MongoDB connection failed:', mongoError.message);
      }
    }

    await connectDB();
    console.log('✅ MySQL Database connected');
    
    console.log('🔄 Syncing MySQL models...');
    
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ All MySQL Models synchronized');
    } catch (syncError) {
      console.error('❌ Model sync error:', syncError.message);
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running → http://localhost:${PORT}`);
      console.log(`🔌 WebSocket running → ws://localhost:${PORT}`);
      console.log(`📁 Serving uploads from: ${uploadsDir}`);
    });

  } catch (error) {
    console.error('❌ Critical failure:', error);
    process.exit(1);
  }
}

startServer();
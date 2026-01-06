// src/app.js - UPDATED AND CORRECTED
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');
const fs = require('fs');

const app = express();

// IMPORTANT: Since app.js is in planyty-backend/src/
// We need to go up one level to get to planyty-backend/
const projectRoot = path.resolve(__dirname, '..'); // Go from src to planyty-backend
const uploadsDir = path.join(projectRoot, 'uploads'); // planyty-backend/uploads/
const audioDir = path.join(uploadsDir, 'audio');

console.log('📁 APP.JS - DIRECTORY PATHS:');
console.log('Project Root:', projectRoot);
console.log('Uploads Dir:', uploadsDir);
console.log('Audio Dir:', audioDir);
console.log('Audio Dir exists?', fs.existsSync(audioDir));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug endpoint
app.get('/debug-uploads', (req, res) => {
  const debugInfo = {
    projectRoot: projectRoot,
    uploadsDir: uploadsDir,
    audioDir: audioDir,
    audioDirExists: fs.existsSync(audioDir),
    files: []
  };
  
  if (fs.existsSync(audioDir)) {
    debugInfo.files = fs.readdirSync(audioDir).map(file => {
      const filePath = path.join(audioDir, file);
      return {
        name: file,
        path: filePath,
        exists: fs.existsSync(filePath),
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        url: `http://localhost:5000/uploads/audio/${file}`
      };
    });
  }
  
  res.json(debugInfo);
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    const ext = path.extname(filePath).toLowerCase();
    if (['.webm', '.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
      res.setHeader('Content-Type', 'audio/webm');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// Audio serving endpoint
app.get('/audio/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(audioDir, filename);
  
  console.log('🎵 Audio request:', filename);
  console.log('📁 Looking in:', audioDir);
  console.log('📁 Full path:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found at:', filePath);
    console.log('📁 Audio dir contents:', fs.existsSync(audioDir) ? fs.readdirSync(audioDir) : 'Directory does not exist');
    return res.status(404).json({
      error: 'Audio file not found',
      filename: filename,
      audioDir: audioDir,
      filePath: filePath,
      exists: fs.existsSync(filePath)
    });
  }
  
  try {
    const stats = fs.statSync(filePath);
    
    // Set proper headers for audio
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Handle range requests for seeking
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
      res.setHeader('Content-Length', chunksize);
      
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
    
    console.log(`✅ Serving: ${filename} (${stats.size} bytes)`);
  } catch (error) {
    console.error('❌ Error serving audio:', error);
    res.status(500).json({ error: 'Error serving audio file' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const audioFiles = fs.existsSync(audioDir) ? fs.readdirSync(audioDir) : [];
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'Planyty API',
    uploads: {
      directory: uploadsDir,
      audio: {
        directory: audioDir,
        fileCount: audioFiles.length,
        files: audioFiles.map(f => {
          const filePath = path.join(audioDir, f);
          return {
            name: f,
            size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
            url: `http://localhost:5000/uploads/audio/${f}`,
            directUrl: `http://localhost:5000/audio/${f}`
          };
        })
      }
    }
  });
});

// Import routes
const uploadRoutes = require('./routes/upload.routes');
const taskRoutes = require('./routes/task.routes');
const projectRoutes = require('./routes/project.routes');
const meetingRoutes = require('./routes/meeting.routes');

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/invitations', require('./routes/invitation.routes'));
app.use('/api/workspaces', require('./routes/workspace.routes'));
app.use('/api', taskRoutes);
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api', require('./routes/company.routes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/projects', projectRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/meetings', require('./routes/meeting.routes'));

// 404 Handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = app;
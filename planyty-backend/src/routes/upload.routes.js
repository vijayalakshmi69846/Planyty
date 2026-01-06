// upload.routes.js - CORRECTED
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Match the paths from server.js
const projectRoot = path.resolve(__dirname, '..'); // Go up from routes to src
const uploadsDir = path.join(projectRoot, 'uploads'); // planyty-backend/src/uploads/
const audioDir = path.join(uploadsDir, 'audio');

console.log('📁 UPLOAD ROUTES - CORRECTED AUDIO DIRECTORY:');
console.log('Audio Dir:', audioDir);
console.log('Dir exists:', fs.existsSync(audioDir));

// Create directories if they don't exist
[uploadsDir, audioDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    console.log(`✅ Created: ${dir}`);
  }
});
// Clean up old format files on startup
if (fs.existsSync(audioDir)) {
  const files = fs.readdirSync(audioDir);
  files.forEach(file => {
    if (file.startsWith('audio-')) {
      const filePath = path.join(audioDir, file);
      console.log(`🗑️ Removing old format audio: ${file}`);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn(`⚠️ Could not delete ${file}:`, err.message);
      }
    }
  });
}

// Configure multer for audio uploads - ALWAYS use 'voice-' prefix
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000000000);
    // ALWAYS use 'voice-' prefix for consistency
    const filename = `voice-${timestamp}-${randomId}.webm`;
    console.log('🎤 Generated filename:', filename);
    cb(null, filename);
  }
});

const audioUpload = multer({
  storage: audioStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith('audio/') || 
        file.mimetype === 'audio/webm' ||
        file.mimetype === 'audio/wav' ||
        file.mimetype === 'audio/mpeg' ||
        file.mimetype === 'audio/ogg') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});
// In upload.routes.js - Update the audio upload endpoint:
router.post('/audio', audioUpload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file uploaded'
      });
    }

    const { duration, senderId, senderName, channelId } = req.body;
    
    console.log('✅ Audio uploaded successfully:', {
      filename: req.file.filename,
      size: req.file.size,
      duration: duration,
      senderId: senderId,
      senderName: senderName,
      channelId: channelId,
      mimetype: req.file.mimetype
    });

    // Return BOTH URLs for compatibility
    const staticUrl = `/uploads/audio/${req.file.filename}`;
    const directUrl = `/audio/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Audio uploaded successfully',
      filename: req.file.filename,
      audioUrl: staticUrl, // Use this for messages
      directUrl: directUrl, // Use this for playback
      size: req.file.size,
      duration: duration || 0,
      mimeType: req.file.mimetype
    });

  } catch (error) {
    console.error('❌ Audio upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});
// Health check for audio files
router.get('/audio-health', (req, res) => {
  try {
    const audioFiles = fs.existsSync(audioDir) 
      ? fs.readdirSync(audioDir).filter(f => f.endsWith('.webm'))
      : [];
    
    const filesWithInfo = audioFiles.map(filename => {
      const filePath = path.join(audioDir, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        size: stats.size,
        url: `http://localhost:5000/uploads/audio/${filename}`,
        directUrl: `http://localhost:5000/audio/${filename}`,
        created: stats.mtime,
        exists: true
      };
    });
    
    res.json({
      success: true,
      directory: audioDir,
      count: filesWithInfo.length,
      files: filesWithInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      directory: audioDir
    });
  }
});
// upload.routes.js - ADD THESE AFTER THE AUDIO ROUTES

// Configure multer for general file uploads
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = file.mimetype.split('/')[0];
    let uploadPath = uploadsDir;
    
    // Organize files by type
    switch(fileType) {
      case 'image':
        uploadPath = path.join(uploadsDir, 'images');
        break;
      case 'video':
        uploadPath = path.join(uploadsDir, 'videos');
        break;
      case 'audio':
        uploadPath = path.join(uploadsDir, 'audio');
        break;
      default:
        uploadPath = path.join(uploadsDir, 'documents');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    const safeName = originalName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}-${uniqueSuffix}${ext}`;
    console.log('📄 Generated filename:', filename);
    cb(null, filename);
  }
});

const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
      'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// File upload endpoint - MULTIPLE FILES
router.post('/files', fileUpload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const { channelId, senderId, senderName } = req.body;
    
    const uploadedFiles = req.files.map(file => {
      const fileType = file.mimetype.split('/')[0];
      const category = ['image', 'video', 'audio'].includes(fileType) ? fileType : 'document';
      
      return {
        name: file.originalname,
        type: category,
        size: file.size,
        path: file.path,
        filename: file.filename,
        mimetype: file.mimetype,
        url: `/uploads/${category}s/${file.filename}`,
        uploadedAt: new Date()
      };
    });

    console.log('✅ Files uploaded successfully:', {
      count: uploadedFiles.length,
      files: uploadedFiles.map(f => f.name)
    });

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
      channelId,
      senderId,
      senderName
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// Single file upload endpoint
router.post('/file', fileUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { channelId, senderId, senderName } = req.body;
    const file = req.file;
    const fileType = file.mimetype.split('/')[0];
    const category = ['image', 'video', 'audio'].includes(fileType) ? fileType : 'document';
    
    const uploadedFile = {
      name: file.originalname,
      type: category,
      size: file.size,
      path: file.path,
      filename: file.filename,
      mimetype: file.mimetype,
      url: `/uploads/${category}s/${file.filename}`,
      uploadedAt: new Date()
    };

    console.log('✅ File uploaded successfully:', uploadedFile.name);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: uploadedFile,
      channelId,
      senderId,
      senderName
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// File download endpoint
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const { category } = req.query;
  
  let filePath;
  
  if (category && ['images', 'videos', 'audio', 'documents'].includes(category)) {
    filePath = path.join(uploadsDir, category, filename);
  } else {
    // Search in all directories
    const directories = ['images', 'videos', 'audio', 'documents'];
    for (const dir of directories) {
      const potentialPath = path.join(uploadsDir, dir, filename);
      if (fs.existsSync(potentialPath)) {
        filePath = potentialPath;
        break;
      }
    }
  }
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
  
  res.download(filePath, (err) => {
    if (err) {
      console.error('❌ Download error:', err);
      res.status(500).json({
        success: false,
        error: 'Error downloading file'
      });
    }
  });
});

// File preview endpoint
router.get('/preview/:filename', (req, res) => {
  const { filename } = req.params;
  const { category } = req.query;
  
  let filePath;
  
  if (category && ['images', 'videos', 'audio', 'documents'].includes(category)) {
    filePath = path.join(uploadsDir, category, filename);
  } else {
    const directories = ['images', 'videos', 'audio', 'documents'];
    for (const dir of directories) {
      const potentialPath = path.join(uploadsDir, dir, filename);
      if (fs.existsSync(potentialPath)) {
        filePath = potentialPath;
        break;
      }
    }
  }
  
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
  
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain'
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', 'inline');
  res.sendFile(filePath);
});

// Get file info endpoint
router.get('/info/:filename', (req, res) => {
  const { filename } = req.params;
  
  const directories = ['images', 'videos', 'audio', 'documents'];
  let fileInfo = null;
  
  for (const dir of directories) {
    const filePath = path.join(uploadsDir, dir, filename);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      fileInfo = {
        name: filename,
        path: filePath,
        url: `/uploads/${dir}/${filename}`,
        downloadUrl: `/api/upload/download/${filename}?category=${dir}`,
        previewUrl: `/api/upload/preview/${filename}?category=${dir}`,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        category: dir.slice(0, -1), // Remove 's' from end
        exists: true
      };
      break;
    }
  }
  
  if (!fileInfo) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
  
  res.json({
    success: true,
    file: fileInfo
  });
});
// Delete old audio files endpoint (for cleanup)
router.post('/cleanup-audio', (req, res) => {
  try {
    const files = fs.readdirSync(audioDir);
    let deleted = 0;
    let errors = [];
    
    files.forEach(file => {
      if (file.startsWith('audio-')) {
        try {
          fs.unlinkSync(path.join(audioDir, file));
          deleted++;
          console.log(`🗑️ Deleted: ${file}`);
        } catch (err) {
          errors.push({ file, error: err.message });
        }
      }
    });
    
    res.json({
      success: true,
      deleted: deleted,
      errors: errors,
      message: `Deleted ${deleted} old audio files`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
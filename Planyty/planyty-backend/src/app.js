const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors({
  origin: /^http:\/\/localhost:\d+$/,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- ROUTES ---

// 1. Auth & Identity
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/invitations', require('./routes/invitation.routes'));

// 2. Core Business Logic (Specific Paths First)
// This ensures /api/workspaces correctly hits workspace.routes.js
app.use('/api/workspaces', require('./routes/workspace.routes')); 

app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/tasks', require('./routes/task.routes'));
app.use('/api', require('./routes/company.routes'));
app.use('/api/teams', require('./routes/teamRoutes'));

// 3. Utility & Health
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 4. Debugging Route (Optional)
app.get('/api/debug/workspace-controller', (req, res) => {
  const workspaceController = require('./controllers/workspace.controller');
  res.json({ 
    loaded: !!workspaceController.getAllWorkspaces,
    source: workspaceController.getAllWorkspaces.toString().substring(0, 200) 
  });
});

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
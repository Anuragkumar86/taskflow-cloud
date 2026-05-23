// File: taskflow-cloud/backend/src/app.js
// Purpose: Configure and export the Express application
// This is where all middleware and routes are registered

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const fileRoutes = require('./routes/file.routes');
const commentRoutes = require('./routes/comment.routes');

// Import error handler
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────

// helmet: Sets security-related HTTP headers
app.use(helmet());

// CORS: Allow requests from the frontend (Next.js on port 3000)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting: Max 100 requests per 15 minutes per IP
// Prevents brute-force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ─── Parsing Middleware ─────────────────────────────────────────────────────

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));
// Parse URL-encoded bodies (for forms)
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────────────────────────

// morgan: Logs every HTTP request
// In production, these logs go to CloudWatch
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// Health check endpoint — Load Balancer uses this to check if server is alive
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Serve locally uploaded files in development
// In production this won't be reached because files go to S3
if (process.env.NODE_ENV !== 'production') {
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  console.log('📁 Serving local uploads at /uploads');
} 

// API routes — all start with /api/
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/comments', commentRoutes);

// Dashboard summary endpoint
app.get('/api/dashboard', require('./middleware/auth').authenticateToken, async (req, res, next) => {
  try {
    const { query } = require('./config/database');

    const stats = await query(
      `SELECT
         (SELECT COUNT(*) FROM projects WHERE owner_id = $1) as total_projects,
         (SELECT COUNT(*) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.owner_id = $1) as total_tasks,
         (SELECT COUNT(*) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.owner_id = $1 AND t.status = 'done') as completed_tasks,
         (SELECT COUNT(*) FROM tasks t JOIN projects p ON t.project_id = p.id WHERE p.owner_id = $1 AND t.status = 'todo') as pending_tasks
      `,
      [req.user.id]
    );

    res.json({ success: true, data: stats.rows[0] });
  } catch (err) {
    next(err);
  }
});


// Fallback 404 handler for unmatched routes — attach without a path
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
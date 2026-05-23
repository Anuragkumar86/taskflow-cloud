// File: taskflow-cloud/backend/src/routes/auth.routes.js
// Purpose: Define URL routes for authentication
// Pattern: Route file defines URL, Controller file handles logic

const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');

// Public routes — no authentication needed
router.post('/register', register);    // POST /api/auth/register
router.post('/login', login);          // POST /api/auth/login

// Protected route — need valid JWT token
router.get('/me', authenticateToken, getProfile);  // GET /api/auth/me

module.exports = router; 
// File: taskflow-cloud/backend/src/controllers/auth.controller.js
// Purpose: Handle user registration, login, and profile
// Connects with: auth.routes.js → app.js → server.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// REGISTER
// POST /api/auth/register
// Body: { name, email, password }
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email and password are required.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters.' 
      });
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered.' 
      });
    }

    // Hash the password — never store plain text passwords
    // bcrypt adds a "salt" (random string) before hashing
    // 12 is the "cost factor" — higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user into database
    const result = await query(
      `INSERT INTO users (name, email, password) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, created_at`,
      [name.trim(), email.toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];

    // Create JWT token
    // The token contains the user's ID and expires in 7 days
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user, token },
    });
  } catch (err) {
    next(err); // Pass to error handler
  }
};

// LOGIN
// POST /api/auth/login
// Body: { email, password }
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }

    // Find user by email
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    const user = result.rows[0];

    // Compare entered password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      data: { user: userWithoutPassword, token },
    });
  } catch (err) {
    next(err);
  }
};

// GET PROFILE
// GET /api/auth/me
// Requires: Authentication token
const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile };
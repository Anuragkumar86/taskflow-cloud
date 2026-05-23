// File: taskflow-cloud/backend/src/middleware/auth.js
// Purpose: Protect routes — only logged-in users can access them
// How it works: Checks the JWT token in the request header
// Connects with: All protected routes (projects, tasks, files)

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    // The token is sent in the Authorization header as: "Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract the token part

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get the user from the database to make sure they still exist
    const result = await query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Attach the user to the request so controllers can use it
    req.user = result.rows[0];
    next(); // Move to the next middleware or controller
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please log in again.' 
      });
    }
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

module.exports = { authenticateToken };
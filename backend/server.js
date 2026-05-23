// File: taskflow-cloud/backend/server.js
// Purpose: Start the Express server
// This is the entry point — Node.js runs this file first

require('dotenv').config(); // Load .env file variables

const app = require('./src/app');
const { initializeDatabase } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Step 1: Connect to Redis
    await connectRedis();

    // Step 2: Initialize database tables
    await initializeDatabase();

    // Step 3: Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`
        ╔═══════════════════════════════════════╗
        ║     TaskFlow Cloud Backend Running    ║
        ║     Port: ${PORT}                        ║
        ║     Environment: ${process.env.NODE_ENV || 'development'}         ║
        ╚═══════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
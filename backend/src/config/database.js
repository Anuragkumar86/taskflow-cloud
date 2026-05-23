// File: taskflow-cloud/backend/src/config/database.js
// Purpose: Create and export a PostgreSQL connection pool
// How it connects: Every controller imports this pool to run SQL queries

const { Pool } = require('pg');

// Build pool config and validate environment values to avoid runtime type errors
const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  // Maximum number of connections in the pool
  max: 20,
  // Close a connection if idle for 30 seconds
  idleTimeoutMillis: 30000,
  // Wait max 2 seconds for a connection
  connectionTimeoutMillis: 2000,
  // SSL: allow explicit opt-in via DB_SSL=true. Keep default simple (no SSL)
  // For production with RDS, set DB_SSL=true in your environment.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Only set password if provided — ensure it's a string to satisfy pg SASL checks
if (typeof process.env.DB_PASSWORD !== 'undefined' && process.env.DB_PASSWORD !== null) {
  poolConfig.password = String(process.env.DB_PASSWORD);
}

const pool = new Pool(poolConfig);

// Test the connection when the app starts
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Helper function: run a query and return results
// Usage: const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
const query = (text, params) => pool.query(text, params);

// Helper function: get a single client from the pool (for transactions)
const getClient = () => pool.connect();

// Create all database tables if they don't exist
const initializeDatabase = async () => {
  // If no DB config is provided, skip initialization to allow local development
  if (!process.env.DB_HOST && !process.env.DATABASE_URL && !process.env.PGHOST && !process.env.DB_NAME) {
    console.warn('⚠️ No database configuration detected — skipping DB initialization');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(50) DEFAULT 'medium',
        deadline DATE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Files table (metadata only — actual file is in S3)
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(500) NOT NULL,
        original_name VARCHAR(500) NOT NULL,
        file_url VARCHAR(1000) NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { query, getClient, pool, initializeDatabase };
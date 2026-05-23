// File: taskflow-cloud/backend/src/config/redis.js
// Purpose: Connect to Redis for caching
// Why caching? Reduces database queries for frequently read data
// In production: connects to AWS ElastiCache

const redis = require('redis');

let client = null;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    client.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    await client.connect();
    return client;
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message);
    // Don't crash the app if Redis is unavailable
    // The app will still work, just without caching
    return null;
  }
};

// Cache a value with expiry time (in seconds)
const setCache = async (key, value, expireSeconds = 300) => {
  try {
    if (!client) return;
    await client.setEx(key, expireSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Cache set error:', err);
  }
};

// Get a cached value
const getCache = async (key) => {
  try {
    if (!client) return null;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
};

// Delete a cached value (called when data is updated)
const deleteCache = async (key) => {
  try {
    if (!client) return;
    await client.del(key);
  } catch (err) {
    console.error('Cache delete error:', err);
  }
};

module.exports = { connectRedis, setCache, getCache, deleteCache };
require('dotenv').config();

// Simple database connection for PostgreSQL (Neon)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
  ssl: { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 10000,
});

// Test connection
async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL Connected: Neon Database');
    client.release();
    return pool;
  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    // Don't exit, just continue without database
    console.log('Continuing without database connection...');
    return null;
  }
}

module.exports = { connectDB, pool };

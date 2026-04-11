require('dotenv').config();

// Database configuration based on environment
const usePostgreSQL = process.env.POSTGRES_URI;
const useMongoDB = process.env.MONGODB_URI;

let connectDB;

if (usePostgreSQL) {
  // PostgreSQL configuration
  const { Pool } = require('pg');
  
  connectDB = async () => {
    try {
      const pool = new Pool({
        connectionString: process.env.POSTGRES_URI,
        ssl: process.env.POSTGRES_URI.includes('aws.neon.tech') ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
      });
      
      // Test connection
      const client = await pool.connect();
      console.log('PostgreSQL Connected: Neon Database');
      client.release();
      
      return pool;
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      process.exit(1);
    }
  };
  
} else if (useMongoDB) {
  // MongoDB configuration (fallback)
  const mongoose = require('mongoose');
  
  connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nyumba360', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  };
  
} else {
  // No database configured
  connectDB = async () => {
    console.error('No database URI configured. Please set POSTGRES_URI or MONGODB_URI in .env');
    process.exit(1);
  };
}

module.exports = connectDB;

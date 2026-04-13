const bcrypt = require('bcryptjs');
const { pool } = require('../config/database-simple');

class UserSimple {
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async findByPhone(phone) {
    try {
      const query = 'SELECT * FROM users WHERE phone = $1';
      const result = await pool.query(query, [phone]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by phone:', error);
      return null;
    }
  }

  static async create(userData) {
    try {
      const { email, phone, password, first_name, last_name, user_type = 'landlord' } = userData;
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const query = `
        INSERT INTO users (email, phone, password, first_name, last_name, user_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [email, phone, hashedPassword, first_name, last_name, user_type];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  static async createUsersTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          display_name VARCHAR(255),
          user_type VARCHAR(50) DEFAULT 'landlord',
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          phone_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      await pool.query(query);
      console.log('Users table created or already exists');
    } catch (error) {
      console.error('Error creating users table:', error);
    }
  }
}

module.exports = UserSimple;

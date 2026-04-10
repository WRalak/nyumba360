const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, phone, password, first_name, last_name, user_type = 'landlord' } = userData;
    
    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const [user] = await db('users')
      .insert({
        email,
        phone,
        password_hash,
        first_name,
        last_name,
        user_type
      })
      .returning('*');
    
    // Remove password hash from response
    delete user.password_hash;
    return user;
  }

  static async findByEmail(email) {
    const user = await db('users').where({ email }).first();
    return user;
  }

  static async findByPhone(phone) {
    const user = await db('users').where({ phone }).first();
    return user;
  }

  static async findById(id) {
    const user = await db('users').where({ id }).first();
    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateProfile(id, userData) {
    const { first_name, last_name, email, phone } = userData;
    
    const [user] = await db('users')
      .where({ id })
      .update({
        first_name,
        last_name,
        email,
        phone,
        updated_at: new Date()
      })
      .returning('*');
    
    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  static async getLandlordProperties(landlordId) {
    return await db('properties')
      .where({ owner_id: landlordId, is_active: true })
      .orderBy('created_at', 'desc');
  }

  static async getPropertyStats(landlordId) {
    const stats = await db('properties')
      .select(
        db.raw('COUNT(*) as total_properties'),
        db.raw('SUM(total_units) as total_units'),
        db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_properties')
      )
      .where({ owner_id: landlordId })
      .first();
    
    return stats;
  }
}

module.exports = User;

const jwt = require('jsonwebtoken');
const UserSimple = require('../models/UserSimple');

class AuthControllerSimple {
  static async register(req, res) {
    try {
      const { email, phone, password, first_name, last_name, user_type = 'landlord' } = req.body;

      if (!email || !phone || !password || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be provided'
        });
      }

      // Check if user already exists
      const existingUser = await UserSimple.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const existingPhone = await UserSimple.findByPhone(phone);
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone number already exists'
        });
      }

      // Create new user
      const user = await UserSimple.create({
        email,
        phone,
        password,
        first_name,
        last_name,
        user_type
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, userType: user.user_type },
        process.env.JWT_SECRET || 'nyumba360_jwt_secret_key_development_2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await UserSimple.findByEmail(email);
      console.log('Login attempt - User found:', !!user);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await UserSimple.verifyPassword(password, user.password);
      console.log('Login attempt - Password valid:', isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, userType: user.user_type },
        process.env.JWT_SECRET || 'nyumba360_jwt_secret_key_development_2024',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }
}

module.exports = AuthControllerSimple;

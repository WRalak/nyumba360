require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true
}));

// JSON parsing with error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global JSON parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err);
    console.error('Raw body that failed to parse:', req.rawBody?.toString());
    console.error('Request headers:', req.headers);
    console.error('Content-Type:', req.headers['content-type']);
    
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      error: 'Request body contains invalid JSON',
      details: {
        receivedBody: req.rawBody?.toString(),
        contentType: req.headers['content-type'],
        originalError: err.message
      }
    });
  }
  next(err);
});

// Request logging middleware (sanitized)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  // Don't log sensitive headers or body data
  if (process.env.NODE_ENV === 'development') {
    const sanitizedHeaders = { ...req.headers };
    delete sanitizedHeaders.authorization;
    delete sanitizedHeaders.cookie;
    console.log('Headers:', sanitizedHeaders);
    
    if (req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      delete sanitizedBody.password;
      console.log('Body:', sanitizedBody);
    }
  }
  next();
});

// Console log API base URL
console.log('API Base URL: http://localhost:5002/api');

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Nyumba360 Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to Nyumba360 API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/auth/login',
      '/api/auth/register',
      '/api/properties',
      '/api/units',
      '/api/tenants',
      '/api/payments',
      '/api/maintenance',
      '/api/expenses',
      '/api/ai'
    ]
  });
});

// Simple in-memory user storage for now
const users = [];

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Login attempt for:', email);
    }
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Validate email format
    if (typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }
    
    // Validate password
    if (typeof password !== 'string' || password.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    // Find user in memory or create admin user
    let user = users.find(u => u.email === email);
    
    if (!user) {
      // Create admin user if it's the admin email
      if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = {
          id: users.length + 1,
          email,
          password: hashedPassword,
          firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
          lastName: process.env.ADMIN_LAST_NAME || 'User',
          userType: 'admin'
        };
        users.push(user);
        console.log('Admin user created:', email);
      } else {
        // Create regular user for testing
        const hashedPassword = await bcrypt.hash(password, 10);
        user = {
          id: users.length + 1,
          email,
          password: hashedPassword,
          firstName: email.split('@')[0],
          lastName: 'User',
          userType: 'user'
        };
        users.push(user);
        console.log('User created:', email);
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('Login successful for:', email);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
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
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    console.log('Register attempt:', { email, firstName, lastName });
    
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || '+254700000000',
      userType: 'user'
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, userType: newUser.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('Registration successful for:', email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        userType: newUser.userType
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
});

// Mock data endpoints
app.get('/api/properties', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Sunset Apartments',
        address: '123 Main St',
        type: 'apartment',
        units: 12,
        occupied: 10,
        monthlyRevenue: 120000
      }
    ]
  });
});

app.get('/api/tenants', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        property: 'Sunset Apartments',
        unit: 'A101',
        status: 'active'
      }
    ]
  });
});

app.get('/api/payments', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        tenant: 'John Doe',
        amount: 10000,
        date: '2024-01-01',
        status: 'paid'
      }
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`\n=== Nyumba360 Backend Server ===`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: In-Memory (for testing)`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  
  console.log(`\n Available endpoints:`);
  console.log(`  - GET /api/health - Health check`);
  console.log(`  - GET /api - API information`);
  console.log(`  - POST /api/auth/login - Login`);
  console.log(`  - POST /api/auth/register - Register`);
  
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    console.log(`\n Default Admin User:`);
    console.log(`  - Email: ${process.env.ADMIN_EMAIL}`);
    console.log(`  - Password: [SET IN ENV]`);
  }
  
  console.log(`\n Server is ready to handle requests!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

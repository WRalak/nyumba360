const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Mock authentication routes for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication - accept any credentials for now
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: '1',
        email: email,
        firstName: email.split('@')[0],
        lastName: 'User',
        userType: email === 'wallaceralak@gmail.com' ? 'admin' : 'user'
      },
      token: 'mock-jwt-token-' + Date.now()
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Mock registration - accept any credentials for now
  if (email && password && firstName && lastName) {
    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: '1',
        email: email,
        firstName: firstName,
        lastName: lastName,
        userType: 'user'
      },
      token: 'mock-jwt-token-' + Date.now()
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
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

// Create default admin user
async function createDefaultAdmin() {
  try {
    const User = require('./src/models/User');
    
    // Check if admin already exists
    const existingAdmin = await User.findByEmail('wallaceralak@gmail.com');
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Create default admin
    const adminUser = new User({
      email: 'wallaceralak@gmail.com',
      password: '2587',
      first_name: 'Wallace',
      last_name: 'Rak',
      user_type: 'admin',
      phone: '+254700000000'
    });
    
    await adminUser.save();
    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email: wallaceralak@gmail.com');
    console.log('🔑 Password: 2587');
  } catch (error) {
    console.log('⚠️  Error creating admin user:', error.message);
    console.log('⚠️  Server will continue without admin user creation');
  }
}

// Start server
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, async () => {
  console.log(`\n=== Nyumba360 Backend Server ===`);
  console.log(`Server running on: http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.MONGODB_URI ? 'MongoDB' : 'Not configured'}`);
  console.log(`API Health: http://${HOST}:${PORT}/api/health`);
  console.log(`\nServer started successfully!`);
  
  // Create default admin user
  await createDefaultAdmin();
  
  console.log('\n📝 Available endpoints:');
  console.log('  - GET /api/health - Health check');
  console.log('  - GET /api - API information');
  console.log('\n⚡ Server is ready to handle requests!');
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

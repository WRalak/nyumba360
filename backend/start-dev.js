require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { connectDB } = require('./src/config/database-simple');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to database
connectDB();

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

// Import Simple AuthController and User model
const AuthControllerSimple = require('./src/controllers/authControllerSimple');
const UserSimple = require('./src/models/UserSimple');

// Setup database tables
async function setupDatabase() {
  try {
    await UserSimple.createUsersTable();
    console.log('Database setup completed');
  } catch (error) {
    console.error('Database setup error:', error);
  }
}

// Authentication routes
app.post('/api/auth/login', AuthControllerSimple.login);
app.post('/api/auth/register', AuthControllerSimple.register);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Create default admin user
async function createDefaultAdmin() {
  try {
    const UserSimple = require('./src/models/UserSimple');
    
    // Check if admin already exists
    const existingAdmin = await UserSimple.findByEmail(process.env.ADMIN_EMAIL);
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Create default admin
    const adminUser = await UserSimple.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      first_name: process.env.ADMIN_FIRST_NAME || 'Admin',
      last_name: process.env.ADMIN_LAST_NAME || 'User',
      user_type: 'admin',
      phone: process.env.ADMIN_PHONE || '+254700000000'
    });
    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email:', process.env.ADMIN_EMAIL);
    console.log('🔑 Password: [SET IN ENV]');
  } catch (error) {
    console.log('⚠️  Error creating admin user:', error.message);
    console.log('⚠️  Server will continue without admin user creation');
  }
}

// Start server
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, HOST, async () => {
  console.log(`\n=== Nyumba360 Backend Server ===`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: PostgreSQL (Neon)`);
  console.log(`API Health: http://localhost:${PORT}/api/health`);
  
  console.log(`\n Available endpoints:`);
  console.log(`  - GET /api/health - Health check`);
  console.log(`  - GET /api - API information`);
  console.log(`  - POST /api/auth/login - Login`);
  console.log(`  - POST /api/auth/register - Register`);
  
  console.log(`\n Server is ready to handle requests!`);
  
  // Setup database and create default admin user
  await setupDatabase();
  await createDefaultAdmin();
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

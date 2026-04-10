const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const cluster = require('cluster');
const os = require('os');

// Import production middleware
const { generalLimiter, notificationLimiter, smsLimiter, emailLimiter, bulkLimiter, emergencyLimiter } = require('./src/middleware/rateLimiting');
const { connectionTracker, operationTracker } = require('./src/middleware/gracefulShutdown');
const healthMonitor = require('./src/middleware/healthMonitor');
const queueManager = require('./src/middleware/queueManager');
const UserContext = require('./src/middleware/userContext');

// Load environment variables
dotenv.config();

// Cluster mode for multi-core utilization
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running. Forking ${numCPUs} workers...`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
    console.log('Starting a new worker...');
    cluster.fork();
  });
  
} else {
  // Worker process
  const connectDB = require('./src/config/database');
  
  // Connect to MongoDB
  connectDB();
  
  const app = express();
  const PORT = process.env.PORT || 5001;
  
  // Trust proxy for rate limiting (if behind reverse proxy)
  app.set('trust proxy', 1);
  
  // Production middleware stack
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  
  app.use(compression());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));
  
  // Body parsing with limits
  app.use(express.json({ 
    limit: process.env.MAX_BODY_SIZE || '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: process.env.MAX_BODY_SIZE || '10mb' 
  }));
  
  // Production tracking middleware
  app.use(connectionTracker);
  app.use(operationTracker);
  app.use(healthMonitor.middleware());

  // Apply general rate limiting to all routes
  app.use(generalLimiter);

  // User context middleware (after auth)
  app.use('/api', UserContext.setUserContext);

  // Static files for uploads
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/health/detailed', healthMonitor.healthEndpoint());
app.get('/ready', healthMonitor.readinessEndpoint());
app.get('/live', healthMonitor.livenessEndpoint());

// System status endpoint
app.get('/api/system/status', async (req, res) => {
  try {
    const { getCircuitBreakerHealth } = require('./src/middleware/circuitBreaker');
    const { smsLoadBalancer, emailLoadBalancer } = require('./src/middleware/loadBalancer');
    const gracefulShutdown = require('./src/middleware/gracefulShutdown');
    
    const status = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      cluster: {
        isMaster: cluster.isMaster,
        workers: cluster.workers ? Object.keys(cluster.workers).length : 1
      },
      circuitBreakers: getCircuitBreakerHealth(),
      loadBalancers: {
        sms: smsLoadBalancer.getStats(),
        email: emailLoadBalancer.getStats()
      },
      queues: await queueManager.getAllStats(),
      gracefulShutdown: gracefulShutdown.getStatus(),
      health: healthMonitor.getHealthStatus()
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get system status',
      message: error.message
    });
  }
});

// Routes with specific rate limiting
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/auth', require('./src/routes/googleAuthRoutes'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/properties', require('./src/routes/properties'));
app.use('/api/units', require('./src/routes/units'));
app.use('/api/tenants', require('./src/routes/tenants'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/maintenance', require('./src/routes/maintenance'));
app.use('/api/expenses', require('./src/routes/expenses'));
app.use('/api/vacancies', require('./src/routes/vacancies'));
app.use('/api/rental-history', require('./src/routes/rentalHistory'));
app.use('/api/agents', require('./src/routes/agents'));
app.use('/api/ai', require('./src/routes/ai'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/revenue', require('./src/routes/revenue'));

// Notification routes with specific rate limiting
app.use('/api/notifications', notificationLimiter, require('./src/routes/notifications'));
app.use('/api/notifications/sms', smsLimiter);
app.use('/api/notifications/email', emailLimiter);
app.use('/api/notifications/bulk', bulkLimiter);
app.use('/api/notifications/emergency', emergencyLimiter);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Record error in health monitor
  healthMonitor.recordRequest(0, true);
  
  // Log detailed error
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'External service is not available'
    });
  }
  
  // Generic error
  res.status(err.status || 500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    requestId: req.id || 'unknown'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = require('./src/middleware/gracefulShutdown');

// Start server
const server = app.listen(PORT, () => {
  console.log(`Nyumba360 API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Worker: ${cluster.worker ? cluster.worker.id : 'master'}`);
  
  // Emit server ready event
  gracefulShutdown.emit('serverReady', server);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

// Handle worker process events
if (cluster.worker) {
  cluster.worker.on('disconnect', () => {
    console.log(`Worker ${cluster.worker.id} disconnected`);
  });
  
  cluster.worker.on('exit', (code, signal) => {
    console.log(`Worker ${cluster.worker.id} exited with code ${code} and signal ${signal}`);
  });
}

// Add cleanup tasks
gracefulShutdown.addCleanupTask('Close HTTP server', async () => {
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    console.log('HTTP server closed');
  }
});

gracefulShutdown.addCleanupTask('Close notification scheduler', async () => {
  const scheduler = require('./src/jobs/notificationScheduler');
  scheduler.stop();
  console.log('Notification scheduler stopped');
});

gracefulShutdown.addCleanupTask('Process remaining queue items', async () => {
  console.log('Processing remaining queue items...');
  // Give some time for queue processing
  await new Promise(resolve => setTimeout(resolve, 5000));
});

// Export for testing
module.exports = app;

} // End of worker process

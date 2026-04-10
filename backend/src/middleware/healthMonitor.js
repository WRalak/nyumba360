const EventEmitter = require('events');
const os = require('os');

class HealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.alertThresholds = {
      cpu: options.cpuThreshold || 80,
      memory: options.memoryThreshold || 85,
      disk: options.diskThreshold || 90,
      responseTime: options.responseTimeThreshold || 5000,
      errorRate: options.errorRateThreshold || 10
    };
    
    this.metrics = {
      cpu: 0,
      memory: 0,
      disk: 0,
      responseTime: 0,
      errorRate: 0,
      uptime: 0,
      activeConnections: 0,
      requestsPerSecond: 0
    };
    
    this.isHealthy = true;
    this.lastCheck = null;
    this.alerts = [];
    this.requestTimes = [];
    this.errorCount = 0;
    this.totalRequests = 0;
    
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
    
    console.log('Health monitoring started');
  }

  async performHealthCheck() {
    const startTime = Date.now();
    
    try {
      // Collect system metrics
      await this.collectSystemMetrics();
      
      // Collect application metrics
      this.collectApplicationMetrics();
      
      // Check service dependencies
      await this.checkDependencies();
      
      // Evaluate health status
      this.evaluateHealth();
      
      this.lastCheck = new Date();
      this.emit('healthCheck', this.getHealthStatus());
      
    } catch (error) {
      console.error('Health check error:', error);
      this.isHealthy = false;
      this.emit('healthCheckError', error);
    }
    
    const duration = Date.now() - startTime;
    this.metrics.checkDuration = duration;
  }

  async collectSystemMetrics() {
    // CPU Usage
    const cpuUsage = process.cpuUsage();
    this.metrics.cpu = this.calculateCPUUsage(cpuUsage);
    
    // Memory Usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    this.metrics.memory = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    // Disk Usage (simplified - you might want to use a proper disk monitoring library)
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      this.metrics.disk = 0; // Placeholder
    } catch (error) {
      this.metrics.disk = 0;
    }
    
    // Uptime
    this.metrics.uptime = process.uptime();
    
    // Load Average
    this.metrics.loadAverage = os.loadavg();
  }

  calculateCPUUsage(cpuUsage) {
    // Simple CPU calculation
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min((totalUsage / 1000000) * 100, 100); // Convert microseconds to percentage
  }

  collectApplicationMetrics() {
    // Response time (average of recent requests)
    if (this.requestTimes.length > 0) {
      const sum = this.requestTimes.reduce((a, b) => a + b, 0);
      this.metrics.responseTime = sum / this.requestTimes.length;
      
      // Keep only recent response times
      if (this.requestTimes.length > 100) {
        this.requestTimes = this.requestTimes.slice(-100);
      }
    }
    
    // Error rate
    const totalRequests = this.totalRequests;
    if (totalRequests > 0) {
      this.metrics.errorRate = (this.errorCount / totalRequests) * 100;
    }
    
    // Requests per second
    this.metrics.requestsPerSecond = this.calculateRequestsPerSecond();
    
    // Active connections
    const gracefulShutdown = require('./gracefulShutdown');
    const status = gracefulShutdown.getStatus();
    this.metrics.activeConnections = status.activeConnections;
  }

  calculateRequestsPerSecond() {
    // Simple calculation based on recent requests
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // This would need to be implemented with proper request tracking
    return 0; // Placeholder
  }

  async checkDependencies() {
    this.dependencies = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      sms: await this.checkSMS(),
      email: await this.checkEmail()
    };
  }

  async checkDatabase() {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        // Test database connectivity
        await mongoose.connection.db.admin().ping();
        return { status: 'healthy', responseTime: Date.now() };
      }
      return { status: 'disconnected', error: 'MongoDB not connected' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkRedis() {
    try {
      const Redis = require('ioredis');
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      
      const startTime = Date.now();
      await redis.ping();
      const responseTime = Date.now() - startTime;
      
      await redis.quit();
      
      return { status: 'healthy', responseTime };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkSMS() {
    try {
      const { smsCircuitBreaker } = require('./circuitBreaker');
      const state = smsCircuitBreaker.getState();
      
      if (state.state === 'OPEN') {
        return { status: 'unhealthy', error: 'SMS circuit breaker is open' };
      }
      
      return { status: 'healthy', responseTime: state.stats.averageResponseTime };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkEmail() {
    try {
      const { emailCircuitBreaker } = require('./circuitBreaker');
      const state = emailCircuitBreaker.getState();
      
      if (state.state === 'OPEN') {
        return { status: 'unhealthy', error: 'Email circuit breaker is open' };
      }
      
      return { status: 'healthy', responseTime: state.stats.averageResponseTime };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  evaluateHealth() {
    const alerts = [];
    let healthy = true;
    
    // Check CPU
    if (this.metrics.cpu > this.alertThresholds.cpu) {
      alerts.push({
        type: 'cpu',
        message: `High CPU usage: ${this.metrics.cpu.toFixed(2)}%`,
        severity: this.metrics.cpu > 95 ? 'critical' : 'warning'
      });
      healthy = false;
    }
    
    // Check Memory
    if (this.metrics.memory > this.alertThresholds.memory) {
      alerts.push({
        type: 'memory',
        message: `High memory usage: ${this.metrics.memory.toFixed(2)}%`,
        severity: this.metrics.memory > 95 ? 'critical' : 'warning'
      });
      healthy = false;
    }
    
    // Check Response Time
    if (this.metrics.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        message: `High response time: ${this.metrics.responseTime.toFixed(2)}ms`,
        severity: this.metrics.responseTime > 10000 ? 'critical' : 'warning'
      });
      healthy = false;
    }
    
    // Check Error Rate
    if (this.metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        message: `High error rate: ${this.metrics.errorRate.toFixed(2)}%`,
        severity: this.metrics.errorRate > 50 ? 'critical' : 'warning'
      });
      healthy = false;
    }
    
    // Check Dependencies
    Object.entries(this.dependencies).forEach(([service, status]) => {
      if (status.status !== 'healthy') {
        alerts.push({
          type: 'dependency',
          service,
          message: `${service} dependency unhealthy: ${status.error || status.status}`,
          severity: 'critical'
        });
        healthy = false;
      }
    });
    
    this.alerts = alerts;
    this.isHealthy = healthy;
    
    // Emit alerts if any
    if (alerts.length > 0) {
      this.emit('alerts', alerts);
    }
  }

  recordRequest(responseTime, isError = false) {
    this.requestTimes.push(responseTime);
    this.totalRequests++;
    
    if (isError) {
      this.errorCount++;
    }
    
    // Keep only recent data
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-100);
    }
  }

  getHealthStatus() {
    return {
      status: this.isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      lastCheck: this.lastCheck,
      metrics: { ...this.metrics },
      dependencies: { ...this.dependencies },
      alerts: [...this.alerts],
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  getDetailedMetrics() {
    return {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        loadAverage: os.loadavg()
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        version: process.version
      },
      application: {
        ...this.metrics,
        totalRequests: this.totalRequests,
        errorCount: this.errorCount
      },
      dependencies: this.dependencies
    };
  }

  // Middleware for Express
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        
        this.recordRequest(responseTime, isError);
      });
      
      next();
    };
  }

  // Health check endpoint
  healthEndpoint() {
    return (req, res) => {
      const detailed = req.query.detailed === 'true';
      const status = detailed ? this.getDetailedMetrics() : this.getHealthStatus();
      
      const statusCode = this.isHealthy ? 200 : 503;
      res.status(statusCode).json(status);
    };
  }

  // Readiness check (for Kubernetes)
  readinessEndpoint() {
    return (req, res) => {
      // Check if the application is ready to accept traffic
      const ready = this.isHealthy && this.dependencies.database.status === 'healthy';
      const statusCode = ready ? 200 : 503;
      
      res.status(statusCode).json({
        status: ready ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString()
      });
    };
  }

  // Liveness check (for Kubernetes)
  livenessEndpoint() {
    return (req, res) => {
      // Check if the application is still alive
      const alive = process.uptime() > 0;
      const statusCode = alive ? 200 : 503;
      
      res.status(statusCode).json({
        status: alive ? 'alive' : 'dead',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    };
  }
}

// Create global health monitor instance
const healthMonitor = new HealthMonitor({
  checkInterval: 30000,
  cpuThreshold: 80,
  memoryThreshold: 85,
  responseTimeThreshold: 5000,
  errorRateThreshold: 10
});

module.exports = healthMonitor;

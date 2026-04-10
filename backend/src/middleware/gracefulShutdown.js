const EventEmitter = require('events');

class GracefulShutdown extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.shutdownTimeout = options.shutdownTimeout || 30000; // 30 seconds
    this.isShuttingDown = false;
    this.activeConnections = new Set();
    this.pendingOperations = new Map();
    this.cleanupTasks = [];
    
    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`Received ${signal}, starting graceful shutdown...`);
        this.shutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.shutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.shutdown('unhandledRejection');
    });
  }

  async shutdown(reason) {
    if (this.isShuttingDown) {
      console.log('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    console.log(`Starting graceful shutdown (${reason})...`);
    
    try {
      // Set a timeout for the entire shutdown process
      const shutdownPromise = this.performShutdown();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Shutdown timeout')), this.shutdownTimeout);
      });

      await Promise.race([shutdownPromise, timeoutPromise]);
      
      console.log('Graceful shutdown completed successfully');
      process.exit(0);
      
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  async performShutdown() {
    const startTime = Date.now();
    
    // Step 1: Stop accepting new connections
    this.emit('shutdownStarted');
    console.log('Step 1: Stopping new connections...');
    await this.stopAcceptingConnections();
    
    // Step 2: Wait for active connections to finish
    console.log('Step 2: Waiting for active connections to finish...');
    await this.waitForActiveConnections();
    
    // Step 3: Wait for pending operations
    console.log('Step 3: Waiting for pending operations...');
    await this.waitForPendingOperations();
    
    // Step 4: Run cleanup tasks
    console.log('Step 4: Running cleanup tasks...');
    await this.runCleanupTasks();
    
    // Step 5: Close database connections
    console.log('Step 5: Closing database connections...');
    await this.closeDatabaseConnections();
    
    // Step 6: Close external service connections
    console.log('Step 6: Closing external service connections...');
    await this.closeExternalConnections();
    
    const endTime = Date.now();
    console.log(`Shutdown completed in ${endTime - startTime}ms`);
  }

  async stopAcceptingConnections() {
    // Emit event to stop accepting new connections
    this.emit('stopAcceptingConnections');
    
    // Give a moment for the event to be processed
    await this.sleep(1000);
  }

  async waitForActiveConnections() {
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (this.activeConnections.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      console.log(`Waiting for ${this.activeConnections.size} active connections...`);
      await this.sleep(1000);
    }
    
    if (this.activeConnections.size > 0) {
      console.warn(`Forcing shutdown with ${this.activeConnections.size} active connections remaining`);
    }
  }

  async waitForPendingOperations() {
    const maxWaitTime = 15000; // 15 seconds
    const startTime = Date.now();
    
    while (this.pendingOperations.size > 0 && (Date.now() - startTime) < maxWaitTime) {
      console.log(`Waiting for ${this.pendingOperations.size} pending operations...`);
      await this.sleep(1000);
    }
    
    if (this.pendingOperations.size > 0) {
      console.warn(`Forcing shutdown with ${this.pendingOperations.size} pending operations remaining`);
    }
  }

  async runCleanupTasks() {
    for (const task of this.cleanupTasks) {
      try {
        console.log(`Running cleanup task: ${task.name}`);
        await task.execute();
        console.log(`Completed cleanup task: ${task.name}`);
      } catch (error) {
        console.error(`Error in cleanup task ${task.name}:`, error);
      }
    }
  }

  async closeDatabaseConnections() {
    try {
      // Close MongoDB connection
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
      }
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }

    try {
      // Close Redis connection
      const redis = require('ioredis');
      // This would need to be implemented based on your Redis client
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }

  async closeExternalConnections() {
    this.emit('closeExternalConnections');
    
    // Give a moment for the event to be processed
    await this.sleep(1000);
  }

  addConnection(connectionId) {
    this.activeConnections.add(connectionId);
  }

  removeConnection(connectionId) {
    this.activeConnections.delete(connectionId);
  }

  addOperation(operationId, promise) {
    this.pendingOperations.set(operationId, promise);
    
    promise
      .finally(() => {
        this.pendingOperations.delete(operationId);
      });
    
    return promise;
  }

  addCleanupTask(name, executeFunction) {
    this.cleanupTasks.push({ name, execute: executeFunction });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      activeConnections: this.activeConnections.size,
      pendingOperations: this.pendingOperations.size,
      cleanupTasks: this.cleanupTasks.length
    };
  }
}

// Create global graceful shutdown instance
const gracefulShutdown = new GracefulShutdown({
  shutdownTimeout: 30000
});

// Add cleanup tasks
gracefulShutdown.addCleanupTask('Close notification queues', async () => {
  const queueManager = require('./queueManager');
  // Close all queues
  console.log('Closing notification queues...');
});

gracefulShutdown.addCleanupTask('Stop scheduled jobs', async () => {
  const scheduler = require('../jobs/notificationScheduler');
  scheduler.stop();
  console.log('Scheduled jobs stopped');
});

gracefulShutdown.addCleanupTask('Save metrics', async () => {
  // Save any pending metrics before shutdown
  console.log('Saving metrics...');
});

// Express middleware for tracking connections
const connectionTracker = (req, res, next) => {
  const connectionId = `${req.ip}_${Date.now()}_${Math.random()}`;
  gracefulShutdown.addConnection(connectionId);
  
  // Remove connection when response finishes
  res.on('finish', () => {
    gracefulShutdown.removeConnection(connectionId);
  });
  
  next();
};

// Middleware for tracking operations
const operationTracker = (req, res, next) => {
  const operationId = `op_${Date.now()}_${Math.random()}`;
  
  // Create a promise that resolves when the request finishes
  const operationPromise = new Promise((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
  });
  
  gracefulShutdown.addOperation(operationId, operationPromise);
  next();
};

module.exports = {
  GracefulShutdown,
  gracefulShutdown,
  connectionTracker,
  operationTracker
};

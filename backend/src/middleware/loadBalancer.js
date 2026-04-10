const { EventEmitter } = require('events');
const CircuitBreaker = require('./circuitBreaker');

class LoadBalancer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.instances = [];
    this.currentIndex = 0;
    this.strategy = options.strategy || 'round-robin'; // round-robin, least-connections, weighted
    this.healthCheckInterval = options.healthCheckInterval || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 3;
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
    
    this.startHealthChecks();
  }

  addInstance(instance) {
    const instanceWithStats = {
      ...instance,
      connections: 0,
      responseTimes: [],
      averageResponseTime: 0,
      successRate: 100,
      lastHealthCheck: null,
      healthy: true,
      weight: instance.weight || 1,
      circuitBreaker: new CircuitBreaker({
        failureThreshold: instance.failureThreshold || 3,
        resetTimeout: instance.resetTimeout || 60000
      })
    };
    
    this.instances.push(instanceWithStats);
    this.emit('instanceAdded', instanceWithStats);
  }

  removeInstance(instanceId) {
    const index = this.instances.findIndex(instance => instance.id === instanceId);
    if (index !== -1) {
      const removed = this.instances.splice(index, 1)[0];
      this.emit('instanceRemoved', removed);
    }
  }

  async execute(operation, ...args) {
    if (this.instances.length === 0) {
      throw new Error('No available instances');
    }

    const healthyInstances = this.getHealthyInstances();
    if (healthyInstances.length === 0) {
      throw new Error('No healthy instances available');
    }

    let lastError;
    let attempts = 0;

    while (attempts < this.maxRetries) {
      const instance = this.selectInstance(healthyInstances);
      
      try {
        const startTime = Date.now();
        this.stats.totalRequests++;
        instance.connections++;
        
        const result = await instance.circuitBreaker.execute(operation, ...args);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        this.updateInstanceStats(instance, responseTime, true);
        this.updateGlobalStats(responseTime, true);
        
        return result;
        
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        this.updateInstanceStats(instance, responseTime, false);
        this.updateGlobalStats(responseTime, false);
        
        lastError = error;
        attempts++;
        
        this.emit('requestFailed', {
          instance,
          error,
          attempts,
          responseTime
        });
        
        // If circuit breaker is open, try next instance
        if (error.message === 'Circuit breaker is OPEN') {
          continue;
        }
        
        // For other errors, also retry with next instance
        continue;
      } finally {
        instance.connections--;
      }
    }
    
    throw lastError;
  }

  selectInstance(instances) {
    switch (this.strategy) {
      case 'least-connections':
        return this.selectLeastConnections(instances);
      case 'weighted':
        return this.selectWeighted(instances);
      case 'round-robin':
      default:
        return this.selectRoundRobin(instances);
    }
  }

  selectRoundRobin(instances) {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex++;
    return instance;
  }

  selectLeastConnections(instances) {
    return instances.reduce((least, current) => 
      current.connections < least.connections ? current : least
    );
  }

  selectWeighted(instances) {
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }
    
    return instances[0];
  }

  getHealthyInstances() {
    return this.instances.filter(instance => 
      instance.healthy && 
      instance.circuitBreaker.getState().state !== 'OPEN'
    );
  }

  updateInstanceStats(instance, responseTime, success) {
    instance.responseTimes.push(responseTime);
    if (instance.responseTimes.length > 50) {
      instance.responseTimes.shift();
    }
    
    instance.averageResponseTime = instance.responseTimes.reduce((a, b) => a + b, 0) / instance.responseTimes.length;
    
    // Update success rate
    const recentRequests = 10;
    const recentSuccess = success ? 1 : 0;
    instance.successRate = ((instance.successRate * (recentRequests - 1)) + recentSuccess) / recentRequests;
  }

  updateGlobalStats(responseTime, success) {
    this.stats.responseTimes.push(responseTime);
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes.shift();
    }
    
    this.stats.averageResponseTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
    
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
  }

  async healthCheck(instance) {
    try {
      const startTime = Date.now();
      
      // Perform health check (ping operation)
      await instance.healthCheck();
      
      const responseTime = Date.now() - startTime;
      instance.lastHealthCheck = new Date();
      instance.healthy = true;
      
      this.emit('healthCheckPassed', { instance, responseTime });
      
    } catch (error) {
      instance.lastHealthCheck = new Date();
      instance.healthy = false;
      
      this.emit('healthCheckFailed', { instance, error });
    }
  }

  startHealthChecks() {
    setInterval(() => {
      this.instances.forEach(instance => {
        this.healthCheck(instance);
      });
    }, this.healthCheckInterval);
  }

  getStats() {
    return {
      instances: this.instances.map(instance => ({
        id: instance.id,
        url: instance.url,
        healthy: instance.healthy,
        connections: instance.connections,
        averageResponseTime: instance.averageResponseTime,
        successRate: instance.successRate,
        weight: instance.weight,
        circuitBreaker: instance.circuitBreaker.getState(),
        lastHealthCheck: instance.lastHealthCheck
      })),
      global: this.stats,
      strategy: this.strategy,
      healthyInstances: this.getHealthyInstances().length
    };
  }

  setStrategy(strategy) {
    if (['round-robin', 'least-connections', 'weighted'].includes(strategy)) {
      this.strategy = strategy;
      this.emit('strategyChanged', strategy);
    } else {
      throw new Error(`Invalid strategy: ${strategy}`);
    }
  }
}

// SMS Load Balancer (for multiple SMS providers)
const smsLoadBalancer = new LoadBalancer({
  strategy: 'round-robin',
  healthCheckInterval: 30000,
  maxRetries: 2
});

// Email Load Balancer (for multiple email providers)
const emailLoadBalancer = new LoadBalancer({
  strategy: 'least-connections',
  healthCheckInterval: 30000,
  maxRetries: 2
});

// Add default SMS instances
smsLoadBalancer.addInstance({
  id: 'africastalking-primary',
  url: 'https://api.africastalking.com',
  provider: 'africastalking',
  weight: 1,
  healthCheck: async () => {
    // Implement Africa's Talking health check
    const axios = require('axios');
    await axios.get('https://api.africastalking.com/version1/user', {
      headers: { 'apiKey': process.env.AFRICASTALKING_API_KEY }
    });
  }
});

// Add default email instances
emailLoadBalancer.addInstance({
  id: 'smtp-primary',
  url: process.env.EMAIL_HOST,
  provider: 'smtp',
  weight: 1,
  healthCheck: async () => {
    // Implement SMTP health check
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.verify();
  }
});

module.exports = {
  LoadBalancer,
  smsLoadBalancer,
  emailLoadBalancer
};

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.requestCount = 0;
    
    this.stats = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }

  async execute(operation, ...args) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    this.requestCount++;

    try {
      if (this.state === 'OPEN') {
        if (Date.now() - this.lastFailureTime > this.resetTimeout) {
          this.state = 'HALF_OPEN';
          this.successCount = 0;
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }

      const result = await operation(...args);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.onSuccess(responseTime);
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.onFailure(responseTime);
      throw error;
    }
  }

  onSuccess(responseTime) {
    this.stats.totalSuccesses++;
    this.successCount++;
    this.failureCount = 0;
    
    // Update response time stats
    this.stats.responseTimes.push(responseTime);
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes.shift();
    }
    this.stats.averageResponseTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;

    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  onFailure(responseTime) {
    this.stats.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // Update response time stats
    this.stats.responseTimes.push(responseTime);
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes.shift();
    }
    this.stats.averageResponseTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      stats: this.stats
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.requestCount = 0;
    this.stats = {
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }
}

// Circuit breaker for SMS service
const smsCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 120000, // 2 minutes
  monitoringPeriod: 30000 // 30 seconds
});

// Circuit breaker for email service
const emailCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  monitoringPeriod: 30000 // 30 seconds
});

// Circuit breaker for database operations
const databaseCircuitBreaker = new CircuitBreaker({
  failureThreshold: 10,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 15000 // 15 seconds
});

// Circuit breaker for external APIs
const externalApiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 90000, // 1.5 minutes
  monitoringPeriod: 30000 // 30 seconds
});

// Middleware to wrap operations with circuit breaker
const withCircuitBreaker = (circuitBreaker, operation) => {
  return async (...args) => {
    try {
      return await circuitBreaker.execute(operation, ...args);
    } catch (error) {
      if (error.message === 'Circuit breaker is OPEN') {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
      throw error;
    }
  };
};

// Health check for all circuit breakers
const getCircuitBreakerHealth = () => {
  return {
    sms: smsCircuitBreaker.getState(),
    email: emailCircuitBreaker.getState(),
    database: databaseCircuitBreaker.getState(),
    externalApi: externalApiCircuitBreaker.getState()
  };
};

// Reset all circuit breakers (for admin use)
const resetAllCircuitBreakers = () => {
  smsCircuitBreaker.reset();
  emailCircuitBreaker.reset();
  databaseCircuitBreaker.reset();
  externalApiCircuitBreaker.reset();
};

module.exports = {
  CircuitBreaker,
  smsCircuitBreaker,
  emailCircuitBreaker,
  databaseCircuitBreaker,
  externalApiCircuitBreaker,
  withCircuitBreaker,
  getCircuitBreakerHealth,
  resetAllCircuitBreakers
};

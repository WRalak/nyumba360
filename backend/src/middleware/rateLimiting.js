const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');

// Redis client for distributed rate limiting
let redisClient;
let redisAvailable = false;

// Initialize Redis with fallback
const initializeRedis = () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
      maxRetriesPerRequest: 0
    });

    redisClient.on('error', (err) => {
      console.log('Redis Client Error:', err.message);
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
      redisAvailable = true;
    });

    redisClient.on('close', () => {
      console.log('Redis Client Disconnected');
      redisAvailable = false;
    });

  } catch (error) {
    console.log('Redis initialization failed:', error.message);
    redisAvailable = false;
  }
};

initializeRedis();

// Custom Redis Store class for express-rate-limit v6
class RedisStore {
  constructor(options = {}) {
    this.client = options.client;
    this.prefix = options.prefix || 'rl:';
  }

  async increment(key) {
    const fullKey = this.prefix + key;
    try {
      const current = await this.client.incr(fullKey);
      if (current === 1) {
        await this.client.expire(fullKey, 60); // Default 60 seconds TTL
      }
      return {
        totalHits: current,
        resetTime: Date.now() + 60000
      };
    } catch (error) {
      console.log('Redis store increment error:', error.message);
      throw error;
    }
  }

  async decrement(key) {
    const fullKey = this.prefix + key;
    try {
      await this.client.decr(fullKey);
    } catch (error) {
      console.log('Redis store decrement error:', error.message);
    }
  }

  async resetKey(key) {
    const fullKey = this.prefix + key;
    try {
      await this.client.del(fullKey);
    } catch (error) {
      console.log('Redis store reset error:', error.message);
    }
  }
}

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for notifications
const notificationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 notifications per minute
  message: {
    error: 'Too many notification requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  });

// Very strict rate limiting for SMS (expensive)
const smsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each user to 20 SMS per minute
  message: {
    error: 'SMS rate limit exceeded, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Email rate limiting
const emailLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each user to 50 emails per minute
  message: {
    error: 'Email rate limit exceeded, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Bulk operation rate limiting
const bulkLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each user to 10 bulk operations per 5 minutes
  message: {
    error: 'Bulk operation rate limit exceeded, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Emergency alert rate limiting (bypass for admins)
const emergencyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each user to 5 emergency alerts per minute
  message: {
    error: 'Emergency alert rate limit exceeded.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user?.role === 'admin';
  }
});

module.exports = {
  generalLimiter,
  notificationLimiter,
  smsLimiter,
  emailLimiter,
  bulkLimiter,
  emergencyLimiter
};

const EventEmitter = require('events');
const Redis = require('ioredis');

class QueueManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.queues = new Map();
    this.processors = new Map();
    this.redis = null;
    this.maxConcurrency = options.maxConcurrency || 100;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 5000;
    this.deadLetterQueue = 'dead_letter_queue';
    
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      
      this.redis.on('error', (err) => {
        console.error('Redis Error:', err);
        this.emit('error', err);
      });
      
      this.redis.on('connect', () => {
        console.log('Redis connected for queue management');
        this.emit('connected');
      });
      
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      // Fallback to in-memory queue
      this.fallbackToMemory();
    }
  }

  fallbackToMemory() {
    console.log('Falling back to in-memory queue');
    this.memoryQueues = new Map();
    this.useMemoryQueue = true;
  }

  async createQueue(name, options = {}) {
    const queueConfig = {
      name,
      concurrency: options.concurrency || 10,
      maxRetries: options.maxRetries || this.retryAttempts,
      retryDelay: options.retryDelay || this.retryDelay,
      delay: options.delay || 0,
      priority: options.priority || 'normal',
      ...options
    };

    this.queues.set(name, queueConfig);
    
    if (!this.useMemoryQueue) {
      await this.redis.hset('queues', name, JSON.stringify(queueConfig));
    }

    this.emit('queueCreated', queueConfig);
    return queueConfig;
  }

  async add(queueName, job, options = {}) {
    const jobData = {
      id: this.generateJobId(),
      queue: queueName,
      data: job,
      options: {
        attempts: 0,
        maxRetries: options.maxRetries || this.retryAttempts,
        delay: options.delay || 0,
        priority: options.priority || 'normal',
        ...options
      },
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    if (this.useMemoryQueue) {
      return this.addToMemoryQueue(queueName, jobData);
    }

    try {
      // Add to Redis queue with score based on priority and delay
      const score = this.calculateScore(jobData);
      await this.redis.zadd(`queue:${queueName}`, score, JSON.stringify(jobData));
      
      this.emit('jobAdded', jobData);
      return jobData;
      
    } catch (error) {
      console.error('Failed to add job to queue:', error);
      throw error;
    }
  }

  async addToMemoryQueue(queueName, jobData) {
    if (!this.memoryQueues.has(queueName)) {
      this.memoryQueues.set(queueName, []);
    }
    
    const queue = this.memoryQueues.get(queueName);
    queue.push(jobData);
    
    this.emit('jobAdded', jobData);
    return jobData;
  }

  async process(queueName, processor) {
    this.processors.set(queueName, processor);
    
    // Start processing jobs
    this.startProcessor(queueName, processor);
    
    this.emit('processorStarted', queueName);
  }

  async startProcessor(queueName, processor) {
    const queueConfig = this.queues.get(queueName);
    if (!queueConfig) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const concurrency = queueConfig.concurrency;
    const processing = new Set();

    const processJob = async () => {
      while (true) {
        try {
          const job = await this.getNextJob(queueName);
          if (!job) {
            await this.sleep(1000); // Wait for new jobs
            continue;
          }

          if (processing.size >= concurrency) {
            await this.sleep(100);
            continue;
          }

          processing.add(job.id);
          
          // Process job in background
          this.processJobAsync(job, processor).finally(() => {
            processing.delete(job.id);
          });
          
        } catch (error) {
          console.error('Processor error:', error);
          await this.sleep(5000);
        }
      }
    };

    // Start multiple processors based on concurrency
    for (let i = 0; i < concurrency; i++) {
      processJob();
    }
  }

  async processJobAsync(job, processor) {
    try {
      job.status = 'processing';
      job.startedAt = new Date().toISOString();
      
      this.emit('jobStarted', job);
      
      await processor(job.data, job);
      
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      
      this.emit('jobCompleted', job);
      
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.failedAt = new Date().toISOString();
      job.options.attempts++;
      
      this.emit('jobFailed', job);
      
      if (job.options.attempts < job.options.maxRetries) {
        // Retry job with delay
        job.status = 'retrying';
        const retryDelay = job.options.retryDelay || this.retryDelay;
        
        setTimeout(async () => {
          await this.add(job.queue, job.data, job.options);
        }, retryDelay * Math.pow(2, job.options.attempts)); // Exponential backoff
        
      } else {
        // Move to dead letter queue
        await this.moveToDeadLetterQueue(job);
      }
    }
  }

  async getNextJob(queueName) {
    if (this.useMemoryQueue) {
      return this.getNextMemoryJob(queueName);
    }

    try {
      const now = Date.now();
      const result = await this.redis.zrangebyscore(
        `queue:${queueName}`,
        0,
        now,
        'WITHSCORES',
        'LIMIT',
        0,
        1
      );

      if (result.length === 0) {
        return null;
      }

      const [jobJson, score] = result;
      await this.redis.zrem(`queue:${queueName}`, jobJson);
      
      const job = JSON.parse(jobJson);
      return job;
      
    } catch (error) {
      console.error('Failed to get next job:', error);
      return null;
    }
  }

  async getNextMemoryJob(queueName) {
    const queue = this.memoryQueues.get(queueName);
    if (!queue || queue.length === 0) {
      return null;
    }

    return queue.shift();
  }

  async moveToDeadLetterQueue(job) {
    job.status = 'dead';
    job.deadAt = new Date().toISOString();
    
    if (this.useMemoryQueue) {
      if (!this.memoryQueues.has(this.deadLetterQueue)) {
        this.memoryQueues.set(this.deadLetterQueue, []);
      }
      this.memoryQueues.get(this.deadLetterQueue).push(job);
    } else {
      await this.redis.lpush(this.deadLetterQueue, JSON.stringify(job));
    }
    
    this.emit('jobDead', job);
  }

  calculateScore(jobData) {
    const now = Date.now();
    const delay = jobData.options.delay || 0;
    const priority = this.getPriorityValue(jobData.options.priority);
    
    return now + delay + (priority * 1000);
  }

  getPriorityValue(priority) {
    const priorities = {
      'low': 3000,
      'normal': 2000,
      'high': 1000,
      'critical': 0
    };
    
    return priorities[priority] || priorities.normal;
  }

  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getQueueStats(queueName) {
    if (this.useMemoryQueue) {
      const queue = this.memoryQueues.get(queueName) || [];
      return {
        name: queueName,
        pending: queue.length,
        processing: 0,
        completed: 0,
        failed: 0
      };
    }

    try {
      const pending = await this.redis.zcard(`queue:${queueName}`);
      
      return {
        name: queueName,
        pending,
        processing: 0, // Would need to track this separately
        completed: 0, // Would need to track this separately
        failed: 0     // Would need to track this separately
      };
      
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }

  async getAllStats() {
    const stats = {};
    
    for (const queueName of this.queues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }
    
    return stats;
  }

  async pauseQueue(queueName) {
    // Implement queue pausing
    this.emit('queuePaused', queueName);
  }

  async resumeQueue(queueName) {
    // Implement queue resuming
    this.emit('queueResumed', queueName);
  }

  async clearQueue(queueName) {
    if (this.useMemoryQueue) {
      this.memoryQueues.set(queueName, []);
    } else {
      await this.redis.del(`queue:${queueName}`);
    }
    
    this.emit('queueCleared', queueName);
  }
}

// Create global queue manager instance
const queueManager = new QueueManager({
  maxConcurrency: 100,
  retryAttempts: 3,
  retryDelay: 5000
});

// Create default queues
queueManager.createQueue('sms_notifications', {
  concurrency: 20,
  maxRetries: 3,
  priority: 'normal'
});

queueManager.createQueue('email_notifications', {
  concurrency: 50,
  maxRetries: 3,
  priority: 'normal'
});

queueManager.createQueue('bulk_notifications', {
  concurrency: 10,
  maxRetries: 3,
  priority: 'low'
});

queueManager.createQueue('urgent_notifications', {
  concurrency: 5,
  maxRetries: 5,
  priority: 'high'
});

module.exports = queueManager;

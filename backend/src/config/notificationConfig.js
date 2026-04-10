require('dotenv').config();

const notificationConfig = {
  // SMS Configuration
  sms: {
    provider: 'africastalking',
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: process.env.AFRICASTALKING_USERNAME,
    senderId: process.env.SMS_SENDER_ID || 'NYUMBA360',
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 1000
    }
  },

  // Email Configuration
  email: {
    provider: 'smtp',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    maxRetries: 3,
    retryDelay: 10000, // 10 seconds
    rateLimit: {
      requestsPerMinute: 50,
      requestsPerHour: 500
    }
  },

  // General Notification Settings
  general: {
    defaultChannels: ['email', 'sms'],
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    batchSize: 100, // For bulk operations
    maxBatchSize: 1000,
    queueRetentionDays: 30,
    enableTracking: true,
    enableWebhooks: false,
    webhookUrl: process.env.WEBHOOK_URL,
    webhookSecret: process.env.WEBHOOK_SECRET
  },

  // Template Settings
  templates: {
    companyName: 'Nyumba360',
    supportEmail: 'support@nyumba360.com',
    supportPhone: '+254700000000',
    logoUrl: `${process.env.FRONTEND_URL}/logo.png`,
    primaryColor: '#3498db',
    secondaryColor: '#2c3e50',
    accentColor: '#e74c3c'
  },

  // Notification Types and Priorities
  notificationTypes: {
    rent_reminder: {
      priority: 'high',
      channels: ['email', 'sms'],
      scheduleBefore: 3, // days before due date
      recurring: true,
      frequency: 'daily'
    },
    payment_confirmation: {
      priority: 'normal',
      channels: ['email', 'sms'],
      immediate: true
    },
    maintenance_update: {
      priority: 'normal',
      channels: ['email', 'sms'],
      immediate: true
    },
    lease_approval: {
      priority: 'high',
      channels: ['email', 'sms'],
      immediate: true
    },
    welcome: {
      priority: 'normal',
      channels: ['email'],
      immediate: true
    },
    password_reset: {
      priority: 'high',
      channels: ['email'],
      immediate: true,
      expiryHours: 1
    },
    monthly_statement: {
      priority: 'low',
      channels: ['email'],
      scheduleDay: 1, // first day of month
      scheduleTime: '09:00'
    },
    emergency: {
      priority: 'high',
      channels: ['email', 'sms'],
      immediate: true,
      bypassRateLimit: true
    }
  },

  // Rate Limiting by User/Recipient
  userRateLimits: {
    sms: {
      perMinute: 5,
      perHour: 20,
      perDay: 50
    },
    email: {
      perMinute: 10,
      perHour: 50,
      perDay: 100
    }
  },

  // Content Filtering
  contentFiltering: {
    enableSpamFilter: true,
    blockedWords: ['spam', 'scam', 'fraud'],
    maxMessageLength: {
      sms: 1600,
      email: 50000
    }
  },

  // Analytics and Monitoring
  analytics: {
    enableMetrics: true,
    metricsRetentionDays: 90,
    trackDelivery: true,
    trackOpens: true,
    trackClicks: true
  }
};

// Validation functions
notificationConfig.validate = function() {
  const errors = [];

  // Validate SMS config
  if (!this.sms.apiKey) {
    errors.push('AFRICASTALKING_API_KEY is required');
  }
  if (!this.sms.username) {
    errors.push('AFRICASTALKING_USERNAME is required');
  }

  // Validate Email config
  if (!this.email.auth.user) {
    errors.push('EMAIL_USER is required');
  }
  if (!this.email.auth.pass) {
    errors.push('EMAIL_PASS is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get configuration for specific notification type
notificationConfig.getNotificationConfig = function(type) {
  return this.notificationTypes[type] || {
    priority: 'normal',
    channels: this.general.defaultChannels,
    immediate: false
  };
};

// Get rate limits for user and channel
notificationConfig.getUserRateLimit = function(channel) {
  return this.userRateLimits[channel] || {
    perMinute: 10,
    perHour: 50,
    perDay: 100
  };
};

module.exports = notificationConfig;

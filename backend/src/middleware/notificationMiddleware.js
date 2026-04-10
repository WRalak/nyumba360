const Notification = require('../models/Notification');
const notificationConfig = require('../config/notificationConfig');

// Rate limiting middleware for notifications
const notificationRateLimit = (channel) => {
  const userLimits = notificationConfig.getUserRateLimit(channel);
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute ago
    const hourStart = now - 3600000; // 1 hour ago
    const dayStart = now - 86400000; // 24 hours ago

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);
    
    // Clean old requests
    const validRequests = userRequests.filter(timestamp => 
      timestamp > dayStart
    );
    requests.set(userId, validRequests);

    // Count requests in different time windows
    const minuteRequests = validRequests.filter(t => t > windowStart).length;
    const hourRequests = validRequests.filter(t > hourStart).length;
    const dayRequests = validRequests.length;

    // Check limits
    if (minuteRequests >= userLimits.perMinute) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Maximum ${userLimits.perMinute} ${channel} notifications per minute.`,
        retryAfter: 60
      });
    }

    if (hourRequests >= userLimits.perHour) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Maximum ${userLimits.perHour} ${channel} notifications per hour.`,
        retryAfter: 3600
      });
    }

    if (dayRequests >= userLimits.perDay) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Maximum ${userLimits.perDay} ${channel} notifications per day.`,
        retryAfter: 86400
      });
    }

    // Add current request
    validRequests.push(now);
    next();
  };
};

// Validate notification content
const validateNotificationContent = (req, res, next) => {
  const { message, htmlContent, subject } = req.body;
  const config = notificationConfig.contentFiltering;

  // Check message length
  if (message && message.length > config.maxMessageLength.sms) {
    return res.status(400).json({
      success: false,
      message: `Message too long. Maximum ${config.maxMessageLength.sms} characters for SMS.`
    });
  }

  if (htmlContent && htmlContent.length > config.maxMessageLength.email) {
    return res.status(400).json({
      success: false,
      message: `HTML content too long. Maximum ${config.maxMessageLength.email} characters for email.`
    });
  }

  // Check for blocked words (simple implementation)
  if (config.enableSpamFilter) {
    const contentToCheck = (message || '') + (htmlContent || '') + (subject || '');
    const lowerContent = contentToCheck.toLowerCase();
    
    for (const blockedWord of config.blockedWords) {
      if (lowerContent.includes(blockedWord.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Content contains prohibited word: ${blockedWord}`
        });
      }
    }
  }

  next();
};

// Check notification permissions
const checkNotificationPermission = (type) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Admins can send any notification
      if (user && user.role === 'admin') {
        return next();
      }

      // Check specific permissions based on notification type
      switch (type) {
        case 'emergency':
          // Only admins can send emergency alerts
          if (!user || user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Only administrators can send emergency alerts'
            });
          }
          break;

        case 'bulk':
          // Only admins and property managers can send bulk notifications
          if (!user || !['admin', 'property_manager'].includes(user.role)) {
            return res.status(403).json({
              success: false,
              message: 'Insufficient permissions for bulk notifications'
            });
          }
          break;

        case 'marketing':
          // Only admins can send marketing notifications
          if (!user || user.role !== 'admin') {
            return res.status(403).json({
              success: false,
              message: 'Only administrators can send marketing notifications'
            });
          }
          break;

        default:
          // For other types, check if user has general notification permission
          if (!user) {
            return res.status(401).json({
              success: false,
              message: 'Authentication required'
            });
          }
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Validate recipient format
const validateRecipients = (req, res, next) => {
  try {
    const { phoneNumber, email, phoneNumbers, emailAddresses, recipients } = req.body;

    // Validate single phone number
    if (phoneNumber) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
    }

    // Validate single email
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Validate phone numbers array
    if (phoneNumbers && Array.isArray(phoneNumbers)) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      for (const phone of phoneNumbers) {
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          return res.status(400).json({
            success: false,
            message: `Invalid phone number format: ${phone}`
          });
        }
      }
    }

    // Validate email addresses array
    if (emailAddresses && Array.isArray(emailAddresses)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emailAddresses) {
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: `Invalid email format: ${email}`
          });
        }
      }
    }

    // Validate recipients array for bulk email
    if (recipients && Array.isArray(recipients)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const recipient of recipients) {
        if (!recipient.email || !emailRegex.test(recipient.email)) {
          return res.status(400).json({
            success: false,
            message: `Invalid email format for recipient: ${recipient.email || 'missing'}`
          });
        }
      }
    }

    next();
  } catch (error) {
    console.error('Recipient validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check system status before sending notifications
const checkSystemStatus = async (req, res, next) => {
  try {
    // Check if notification services are configured
    const validation = notificationConfig.validate();
    if (!validation.isValid) {
      return res.status(503).json({
        success: false,
        message: 'Notification services not properly configured',
        errors: validation.errors
      });
    }

    // Check for system-wide notification disable flag
    const notificationsDisabled = process.env.NOTIFICATIONS_DISABLED === 'true';
    if (notificationsDisabled) {
      return res.status(503).json({
        success: false,
        message: 'Notification services are temporarily disabled'
      });
    }

    // Check recent failure rates (optional)
    const recentFailures = await Notification.countDocuments({
      status: 'failed',
      createdAt: { $gte: new Date(Date.now() - 3600000) } // Last hour
    });

    const totalRecent = await Notification.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 3600000) }
    });

    if (totalRecent > 0 && (recentFailures / totalRecent) > 0.5) {
      return res.status(503).json({
        success: false,
        message: 'High failure rate detected. Notifications temporarily paused'
      });
    }

    next();
  } catch (error) {
    console.error('System status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Log notification attempts
const logNotificationAttempt = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original res.json
  const originalJson = res.json;
  
  res.json = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log the notification attempt
    console.log('Notification Attempt:', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      endpoint: req.path,
      method: req.method,
      duration: `${duration}ms`,
      success: data.success,
      type: req.body.type || 'unknown',
      recipientCount: req.body.phoneNumbers?.length || req.body.emailAddresses?.length || req.body.recipients?.length || 1
    });
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  notificationRateLimit,
  validateNotificationContent,
  checkNotificationPermission,
  validateRecipients,
  checkSystemStatus,
  logNotificationAttempt
};

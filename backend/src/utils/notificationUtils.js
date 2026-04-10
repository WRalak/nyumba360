const moment = require('moment');
const Notification = require('../models/Notification');

class NotificationUtils {
  // Format phone number for different countries
  static formatPhoneNumber(phoneNumber, countryCode = 'KE') {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    switch (countryCode.toUpperCase()) {
      case 'KE': // Kenya
        if (cleaned.startsWith('254') && cleaned.length === 12) {
          return `+${cleaned}`;
        } else if (cleaned.startsWith('0') && cleaned.length === 10) {
          return `+254${cleaned.substring(1)}`;
        } else if (cleaned.startsWith('7') && cleaned.length === 9) {
          return `+254${cleaned}`;
        }
        break;
        
      case 'US': // United States
        if (cleaned.length === 10) {
          return `+1${cleaned}`;
        } else if (cleaned.startsWith('1') && cleaned.length === 11) {
          return `+${cleaned}`;
        }
        break;
        
      case 'GB': // United Kingdom
        if (cleaned.startsWith('44') && cleaned.length === 12) {
          return `+${cleaned}`;
        } else if (cleaned.startsWith('0') && cleaned.length === 11) {
          return `+44${cleaned.substring(1)}`;
        }
        break;
    }
    
    // Return original if no formatting rules match
    return phoneNumber;
  }

  // Validate email address
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate unique message ID
  static generateMessageId(prefix = 'MSG') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  // Calculate retry delay with exponential backoff
  static calculateRetryDelay(attempt, baseDelay = 1000, maxDelay = 60000) {
    const delay = baseDelay * Math.pow(2, attempt);
    return Math.min(delay, maxDelay);
  }

  // Format currency
  static formatCurrency(amount, currency = 'KES') {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Format date for notifications
  static formatDate(date, format = 'MMMM DD, YYYY') {
    return moment(date).format(format);
  }

  // Calculate days until due date
  static getDaysUntilDue(dueDate) {
    const today = moment().startOf('day');
    const due = moment(dueDate).startOf('day');
    return due.diff(today, 'days');
  }

  // Get appropriate reminder message based on days until due
  static getRentReminderMessage(daysUntil, amount, propertyName) {
    const formattedAmount = this.formatCurrency(amount);
    
    if (daysUntil < 0) {
      return `URGENT: Your rent of ${formattedAmount} for ${propertyName} is ${Math.abs(daysUntil)} days overdue. Please pay immediately to avoid penalties.`;
    } else if (daysUntil === 0) {
      return `REMINDER: Your rent of ${formattedAmount} for ${propertyName} is due today. Please make your payment now.`;
    } else if (daysUntil === 1) {
      return `REMINDER: Your rent of ${formattedAmount} for ${propertyName} is due tomorrow. Please ensure timely payment.`;
    } else if (daysUntil <= 3) {
      return `REMINDER: Your rent of ${formattedAmount} for ${propertyName} is due in ${daysUntil} days. Please plan your payment accordingly.`;
    } else if (daysUntil <= 7) {
      return `Friendly reminder: Your rent of ${formattedAmount} for ${propertyName} is due in ${daysUntil} days.`;
    } else {
      return `Your rent of ${formattedAmount} for ${propertyName} is due on ${this.formatDate(dueDate)}.`;
    }
  }

  // Truncate message for SMS
  static truncateForSMS(message, maxLength = 160) {
    if (message.length <= maxLength) return message;
    
    // Try to truncate at word boundary
    const truncated = message.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  // Extract plain text from HTML
  static extractTextFromHTML(html) {
    if (!html) return '';
    
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  // Generate notification summary
  static async generateNotificationSummary(startDate, endDate) {
    try {
      const stats = await Notification.getNotificationStats(startDate, endDate);
      
      const summary = {
        totalNotifications: 0,
        totalCost: 0,
        successRate: 0,
        byType: {},
        byStatus: {},
        byChannel: {
          sms: { sent: 0, failed: 0, cost: 0 },
          email: { sent: 0, failed: 0, cost: 0 }
        }
      };

      stats.forEach(stat => {
        const channel = stat._id;
        summary.totalNotifications += stat.totalCount;
        summary.totalCost += stat.totalCost || 0;
        
        summary.byChannel[channel] = {
          sent: 0,
          failed: 0,
          cost: stat.totalCost || 0
        };
        
        stat.stats.forEach(statusStat => {
          summary.byChannel[channel][statusStat.status] = statusStat.count;
          summary.byStatus[statusStat.status] = (summary.byStatus[statusStat.status] || 0) + statusStat.count;
        });
      });

      const totalSent = summary.byStatus.sent || 0;
      const totalFailed = summary.byStatus.failed || 0;
      const totalProcessed = totalSent + totalFailed;
      
      summary.successRate = totalProcessed > 0 ? (totalSent / totalProcessed) * 100 : 0;

      return summary;
    } catch (error) {
      console.error('Error generating notification summary:', error);
      return null;
    }
  }

  // Get notification trends
  static async getNotificationTrends(days = 30) {
    try {
      const startDate = moment().subtract(days, 'days').toDate();
      const endDate = new Date();
      
      const dailyStats = await Notification.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              type: "$type",
              status: "$status"
            },
            count: { $sum: 1 },
            cost: { $sum: "$metadata.cost" }
          }
        },
        {
          $group: {
            _id: "$_id.date",
            types: {
              $push: {
                type: "$_id.type",
                status: "$_id.status",
                count: "$count",
                cost: "$cost"
              }
            },
            totalCount: { $sum: "$count" },
            totalCost: { $sum: "$cost" }
          }
        },
        {
          $sort: { "_id": 1 }
        }
      ]);

      return dailyStats;
    } catch (error) {
      console.error('Error getting notification trends:', error);
      return [];
    }
  }

  // Clean up old notifications
  static async cleanupOldNotifications(daysToKeep = 90) {
    try {
      const cutoffDate = moment().subtract(daysToKeep, 'days').toDate();
      
      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: { $in: ['sent', 'delivered'] } // Only delete successful notifications
      });

      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return 0;
    }
  }

  // Get failed notifications for retry
  static async getFailedNotificationsForRetry(maxRetries = 3) {
    try {
      return await Notification.find({
        status: 'failed',
        'metadata.retryCount': { $lt: maxRetries },
        createdAt: { $gte: moment().subtract(1, 'hour').toDate() }
      }).sort({ createdAt: 1 });
    } catch (error) {
      console.error('Error getting failed notifications:', error);
      return [];
    }
  }

  // Validate notification template data
  static validateTemplateData(templateName, data) {
    const requiredFields = {
      rent_reminder: ['tenantName', 'propertyName', 'dueDate', 'amount'],
      payment_confirmation: ['tenantName', 'propertyName', 'amount', 'paymentDate'],
      maintenance_update: ['tenantName', 'propertyName', 'status'],
      lease_approval: ['tenantName', 'propertyName', 'startDate'],
      welcome: ['name', 'loginUrl'],
      password_reset: ['name', 'resetUrl'],
      monthly_statement: ['ownerName', 'properties', 'period'],
      emergency: ['message']
    };

    const fields = requiredFields[templateName] || [];
    const missing = [];

    for (const field of fields) {
      if (!data[field]) {
        missing.push(field);
      }
    }

    return {
      isValid: missing.length === 0,
      missing
    };
  }

  // Generate notification preview
  static generatePreview(type, data) {
    const previews = {
      rent_reminder: {
        sms: `Dear ${data.tenantName}, your rent of ${this.formatCurrency(data.amount)} for ${data.propertyName} is due on ${this.formatDate(data.dueDate)}.`,
        subject: `Rent Reminder - ${data.propertyName}`,
        preview: `Rent reminder notification for ${data.propertyName}`
      },
      payment_confirmation: {
        sms: `Dear ${data.tenantName}, payment of ${this.formatCurrency(data.amount)} for ${data.propertyName} received.`,
        subject: `Payment Confirmation - ${data.propertyName}`,
        preview: `Payment confirmation for ${data.propertyName}`
      },
      maintenance_update: {
        sms: `Dear ${data.tenantName}, maintenance update for ${data.propertyName}: ${data.status}.`,
        subject: `Maintenance Update - ${data.propertyName}`,
        preview: `Maintenance update for ${data.propertyName}`
      }
    };

    return previews[type] || {
      sms: 'Preview SMS message',
      subject: 'Preview Email Subject',
      preview: 'Preview notification'
    };
  }

  // Check if notification should be sent based on user preferences
  static shouldSendNotification(userPreferences, type, channel) {
    if (!userPreferences) return true;
    
    // Check if user has disabled all notifications
    if (userPreferences.disableAll) return false;
    
    // Check channel-specific preferences
    if (channel === 'sms' && userPreferences.disableSMS) return false;
    if (channel === 'email' && userPreferences.disableEmail) return false;
    
    // Check type-specific preferences
    if (userPreferences.disabledTypes && userPreferences.disabledTypes.includes(type)) {
      return false;
    }
    
    return true;
  }
}

module.exports = NotificationUtils;

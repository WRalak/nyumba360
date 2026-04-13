const cron = require('node-cron');
const notificationService = require('../services/notificationService');
const NotificationUtils = require('../utils/notificationUtils');
const Notification = require('../models/Notification');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const RentPayment = require('../models/RentPayment');
const moment = require('moment');

class NotificationScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start all scheduled jobs
  start() {
    if (this.isRunning) {
      console.log('Notification scheduler is already running');
      return;
    }

    console.log('Starting notification scheduler...');
    
    // Schedule rent reminders (every day at 9 AM)
    this.scheduleRentReminders();
    
    // Schedule monthly statements (1st of every month at 9 AM)
    this.scheduleMonthlyStatements();
    
    // Schedule cleanup of old notifications (every Sunday at 2 AM)
    this.scheduleCleanup();
    
    // Schedule retry of failed notifications (every 15 minutes)
    this.scheduleFailedNotificationRetries();
    
    // Schedule system health check (every hour)
    this.scheduleHealthCheck();
    
    this.isRunning = true;
    console.log('Notification scheduler started successfully');
  }

  // Stop all scheduled jobs
  stop() {
    console.log('Stopping notification scheduler...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('Notification scheduler stopped');
  }

  // Schedule rent reminders
  scheduleRentReminders() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('Running scheduled rent reminders...');
      await this.processRentReminders();
    }, {
      scheduled: false,
      timezone: 'Africa/Nairobi'
    });

    this.jobs.set('rentReminders', job);
    job.start();
    console.log('Scheduled rent reminders: Daily at 9:00 AM');
  }

  // Schedule monthly statements
  scheduleMonthlyStatements() {
    const job = cron.schedule('0 9 1 * *', async () => {
      console.log('Running scheduled monthly statements...');
      await this.processMonthlyStatements();
    }, {
      scheduled: false,
      timezone: 'Africa/Nairobi'
    });

    this.jobs.set('monthlyStatements', job);
    job.start();
    console.log('Scheduled monthly statements: 1st of every month at 9:00 AM');
  }

  // Schedule cleanup
  scheduleCleanup() {
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log('Running scheduled cleanup...');
      await this.processCleanup();
    }, {
      scheduled: false,
      timezone: 'Africa/Nairobi'
    });

    this.jobs.set('cleanup', job);
    job.start();
    console.log('Scheduled cleanup: Every Sunday at 2:00 AM');
  }

  // Schedule retry of failed notifications
  scheduleFailedNotificationRetries() {
    const job = cron.schedule('*/15 * * * *', async () => {
      console.log('Running failed notification retries...');
      await this.processFailedNotificationRetries();
    }, {
      scheduled: false,
      timezone: 'Africa/Nairobi'
    });

    this.jobs.set('failedRetries', job);
    job.start();
    console.log('Scheduled failed notification retries: Every 15 minutes');
  }

  // Schedule health check
  scheduleHealthCheck() {
    const job = cron.schedule('0 * * * *', async () => {
      console.log('Running system health check...');
      await this.processHealthCheck();
    }, {
      scheduled: false,
      timezone: 'Africa/Nairobi'
    });

    this.jobs.set('healthCheck', job);
    job.start();
    console.log('Scheduled health check: Every hour');
  }

  // Process rent reminders
  async processRentReminders() {
    try {
      const today = moment().startOf('day');
      const reminderDays = [7, 3, 1, 0]; // Days before due date to send reminders
      
      for (const days of reminderDays) {
        const dueDate = today.clone().add(days, 'days').toDate();
        
        // Find properties with rent due on this date
        const properties = await Property.find({
          rentDueDate: dueDate,
          status: 'occupied'
        }).populate('tenantId');

        for (const property of properties) {
          if (property.tenantId) {
            const tenant = property.tenantId;
            const amount = property.rentAmount;
            
            // Check if reminder was already sent today
            const existingNotification = await Notification.findOne({
              type: 'rent_reminder',
              'relatedEntity.entityId': property._id,
              createdAt: { $gte: today.toDate() }
            });

            if (!existingNotification) {
              await notificationService.sendRentReminder(tenant, property, dueDate, amount);
              console.log(`Rent reminder sent to ${tenant.name} for ${property.name}`);
            }
          }
        }
      }

      // Check for overdue rent
      const overdueProperties = await Property.find({
        rentDueDate: { $lt: today.toDate() },
        status: 'occupied'
      }).populate('tenantId');

      for (const property of overdueProperties) {
        if (property.tenantId) {
          const tenant = property.tenantId;
          const daysOverdue = NotificationUtils.getDaysUntilDue(property.rentDueDate);
          
          // Send overdue notice every 3 days
          if (Math.abs(daysOverdue) % 3 === 0) {
            const existingNotification = await Notification.findOne({
              type: 'rent_reminder',
              'relatedEntity.entityId': property._id,
              createdAt: { $gte: today.toDate() }
            });

            if (!existingNotification) {
              const message = NotificationUtils.getRentReminderMessage(daysOverdue, property.rentAmount, property.name);
              await notificationService.sendNotification({
                recipient: tenant.name,
                phoneNumber: tenant.phoneNumber,
                email: tenant.email,
                subject: `OVERDUE RENT - ${property.name}`,
                message,
                priority: 'high',
                type: 'rent_overdue',
                relatedEntity: {
                  entityType: 'property',
                  entityId: property._id
                }
              });
              console.log(`Overdue rent notice sent to ${tenant.name} for ${property.name}`);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error processing rent reminders:', error);
    }
  }

  // Process monthly statements
  async processMonthlyStatements() {
    try {
      const lastMonth = moment().subtract(1, 'month');
      const period = lastMonth.format('MMMM YYYY');
      const startDate = lastMonth.startOf('month').toDate();
      const endDate = lastMonth.endOf('month').toDate();

      // Find all property owners
      const owners = await Tenant.find({ role: 'property_owner' });
      
      for (const owner of owners) {
        // Find properties owned by this user
        const properties = await Property.find({ ownerId: owner._id });
        
        if (properties.length > 0) {
          const propertyStats = [];
          
          for (const property of properties) {
            // Calculate revenue for this property
            const payments = await Payment.find({
              propertyId: property._id,
              paymentDate: { $gte: startDate, $lte: endDate },
              status: 'completed'
            });

            const revenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
            const expenses = 0; // TODO: Calculate actual expenses
            const netIncome = revenue - expenses;

            propertyStats.push({
              name: property.name,
              revenue,
              expenses,
              netIncome
            });
          }

          await notificationService.sendMonthlyStatement(owner, propertyStats, period);
          console.log(`Monthly statement sent to ${owner.name} for ${period}`);
        }
      }

    } catch (error) {
      console.error('Error processing monthly statements:', error);
    }
  }

  // Process cleanup
  async processCleanup() {
    try {
      const deletedCount = await NotificationUtils.cleanupOldNotifications(90);
      console.log(`Cleanup completed: ${deletedCount} notifications deleted`);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Process failed notification retries
  async processFailedNotificationRetries() {
    try {
      const failedNotifications = await NotificationUtils.getFailedNotificationsForRetry(3);
      
      for (const notification of failedNotifications) {
        try {
          await notificationService.retryNotification(notification);
          console.log(`Retried notification: ${notification._id}`);
        } catch (error) {
          console.error(`Failed to retry notification ${notification._id}:`, error);
        }
      }

      if (failedNotifications.length > 0) {
        console.log(`Processed ${failedNotifications.length} failed notification retries`);
      }

    } catch (error) {
      console.error('Error processing failed notification retries:', error);
    }
  }

  // Process health check
  async processHealthCheck() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      // Get recent notification statistics
      const recentNotifications = await Notification.aggregate([
        {
          $match: {
            createdAt: { $gte: oneHourAgo }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const stats = {
        total: recentNotifications.reduce((sum, stat) => sum + stat.count, 0),
        sent: 0,
        failed: 0,
        pending: 0
      };

      recentNotifications.forEach(stat => {
        stats[stat._id] = stat.count;
      });

      const failureRate = stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;

      console.log('Notification Health Check:', {
        period: 'Last hour',
        total: stats.total,
        sent: stats.sent,
        failed: stats.failed,
        pending: stats.pending,
        failureRate: `${failureRate.toFixed(2)}%`
      });

      // Alert if failure rate is too high
      if (failureRate > 50 && stats.total > 10) {
        console.warn('High notification failure rate detected!');
        
        // TODO: Send alert to administrators
        // await this.sendAdminAlert('High notification failure rate detected', {
        //   failureRate,
        //   stats,
        //   timestamp: now
        // });
      }

    } catch (error) {
      console.error('Error during health check:', error);
    }
  }

  // Get job status
  getJobStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: []
    };

    this.jobs.forEach((job, name) => {
      status.jobs.push({
        name,
        running: job.running,
        nextDate: job.nextDate()?.toISOString(),
        lastDate: job.lastDate()?.toISOString()
      });
    });

    return status;
  }

  // Manually trigger a job
  async triggerJob(jobName) {
    const job = this.jobs.get(jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' not found`);
    }

    console.log(`Manually triggering job: ${jobName}`);
    
    switch (jobName) {
      case 'rentReminders':
        await this.processRentReminders();
        break;
      case 'monthlyStatements':
        await this.processMonthlyStatements();
        break;
      case 'cleanup':
        await this.processCleanup();
        break;
      case 'failedRetries':
        await this.processFailedNotificationRetries();
        break;
      case 'healthCheck':
        await this.processHealthCheck();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

// Create singleton instance
const scheduler = new NotificationScheduler();

// Auto-start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  scheduler.start();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down notification scheduler...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down notification scheduler...');
  scheduler.stop();
  process.exit(0);
});

module.exports = scheduler;

const smsService = require('./smsService');
const emailService = require('./emailService');
const Notification = require('../models/Notification');

class NotificationService {
  constructor() {
    this.defaultChannels = ['email', 'sms'];
  }

  // Send notification through specified channels
  async sendNotification(data) {
    const {
      recipient,
      channels = this.defaultChannels,
      subject,
      message,
      htmlContent,
      phoneNumber,
      email,
      priority = 'normal',
      type = 'general',
      relatedEntity = null,
      sentBy = null
    } = data;

    const results = {};

    // Send SMS
    if (channels.includes('sms') && phoneNumber) {
      const smsResult = await smsService.sendSMS(phoneNumber, message, priority);
      results.sms = smsResult;

      // Log to database
      await this.logNotification({
        type: 'sms',
        recipient: phoneNumber,
        message,
        status: smsResult.success ? 'sent' : 'failed',
        messageId: smsResult.messageId,
        error: smsResult.error,
        priority,
        type,
        relatedEntity,
        sentBy,
        cost: smsResult.cost
      });
    }

    // Send Email
    if (channels.includes('email') && email && (subject || htmlContent)) {
      const emailResult = await emailService.sendEmail(
        email,
        subject || 'Notification from Nyumba360',
        htmlContent || `<p>${message}</p>`,
        message
      );
      results.email = emailResult;

      // Log to database
      await this.logNotification({
        type: 'email',
        recipient: email,
        subject: subject || 'Notification from Nyumba360',
        message,
        status: emailResult.success ? 'sent' : 'failed',
        messageId: emailResult.messageId,
        error: emailResult.error,
        type,
        relatedEntity,
        sentBy
      });
    }

    return {
      success: Object.values(results).some(result => result.success),
      results
    };
  }

  // Automated rent reminder notification
  async sendRentReminder(tenant, property, dueDate, amount) {
    const data = {
      recipient: tenant.name,
      phoneNumber: tenant.phoneNumber,
      email: tenant.email,
      subject: `Rent Reminder - ${property.name}`,
      message: `Dear ${tenant.name}, this is a reminder that your rent of KES ${amount} for ${property.name} is due on ${dueDate}.`,
      htmlContent: this.getRentReminderHTML(tenant, property, dueDate, amount),
      priority: 'high',
      type: 'rent_reminder',
      relatedEntity: {
        entityType: 'property',
        entityId: property._id
      }
    };

    return this.sendNotification(data);
  }

  // Automated payment confirmation
  async sendPaymentConfirmation(tenant, property, payment) {
    const data = {
      recipient: tenant.name,
      phoneNumber: tenant.phoneNumber,
      email: tenant.email,
      subject: `Payment Confirmation - ${property.name}`,
      message: `Dear ${tenant.name}, we have received your payment of KES ${payment.amount} for ${property.name}.`,
      htmlContent: this.getPaymentConfirmationHTML(tenant, property, payment),
      type: 'payment_confirmation',
      relatedEntity: {
        entityType: 'payment',
        entityId: payment._id
      }
    };

    return this.sendNotification(data);
  }

  // Automated maintenance update
  async sendMaintenanceUpdate(tenant, property, maintenanceRequest) {
    const data = {
      recipient: tenant.name,
      phoneNumber: tenant.phoneNumber,
      email: tenant.email,
      subject: `Maintenance Update - ${property.name}`,
      message: `Dear ${tenant.name}, your maintenance request for ${property.name} has been updated. Status: ${maintenanceRequest.status}.`,
      htmlContent: this.getMaintenanceUpdateHTML(tenant, property, maintenanceRequest),
      type: 'maintenance_update',
      relatedEntity: {
        entityType: 'maintenance',
        entityId: maintenanceRequest._id
      }
    };

    return this.sendNotification(data);
  }

  // New lease approval notification
  async sendNewLeaseNotification(tenant, property, lease) {
    const data = {
      recipient: tenant.name,
      phoneNumber: tenant.phoneNumber,
      email: tenant.email,
      subject: `Lease Approved - ${property.name}`,
      message: `Congratulations ${tenant.name}! Your lease for ${property.name} has been approved.`,
      htmlContent: this.getNewLeaseHTML(tenant, property, lease),
      priority: 'high',
      type: 'lease_approval',
      relatedEntity: {
        entityType: 'lease',
        entityId: lease._id
      }
    };

    return this.sendNotification(data);
  }

  // Welcome email for new users
  async sendWelcomeEmail(user, loginUrl) {
    const data = {
      recipient: user.name,
      email: user.email,
      subject: 'Welcome to Nyumba360!',
      message: `Welcome to Nyumba360, ${user.name}! Your account has been created successfully.`,
      htmlContent: this.getWelcomeHTML(user, loginUrl),
      type: 'welcome'
    };

    return this.sendNotification(data);
  }

  // Password reset notification
  async sendPasswordReset(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const data = {
      recipient: user.name,
      email: user.email,
      subject: 'Password Reset - Nyumba360',
      message: `Hi ${user.name}, please use this link to reset your password: ${resetUrl}`,
      htmlContent: this.getPasswordResetHTML(user, resetUrl),
      priority: 'high',
      type: 'password_reset'
    };

    return this.sendNotification(data);
  }

  // Monthly statement for property owners
  async sendMonthlyStatement(owner, properties, period) {
    const data = {
      recipient: owner.name,
      email: owner.email,
      subject: `Monthly Statement - ${period}`,
      message: `Please find your monthly property management statement for ${period}.`,
      htmlContent: this.getMonthlyStatementHTML(owner, properties, period),
      type: 'monthly_statement'
    };

    return this.sendNotification(data);
  }

  // Emergency alert
  async sendEmergencyAlert(message, recipients) {
    const phoneNumbers = recipients.filter(r => r.phoneNumber).map(r => r.phoneNumber);
    const emailAddresses = recipients.filter(r => r.email).map(r => r.email);

    const results = {};

    if (phoneNumbers.length > 0) {
      results.sms = await smsService.sendEmergencyAlert(message, phoneNumbers);
    }

    if (emailAddresses.length > 0) {
      const subject = '🚨 EMERGENCY ALERT - Nyumba360';
      const htmlContent = this.getEmergencyAlertHTML(message);
      results.email = await emailService.sendEmail(emailAddresses, subject, htmlContent);
    }

    return {
      success: Object.values(results).some(result => result.success),
      results
    };
  }

  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const pendingNotifications = await Notification.findPendingNotifications();

      for (const notification of pendingNotifications) {
        // Resend failed notifications that can be retried
        if (notification.canRetry()) {
          await this.retryNotification(notification);
        }
      }

      return {
        success: true,
        processed: pendingNotifications.length
      };
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Retry failed notification
  async retryNotification(notification) {
    try {
      let result;

      if (notification.type === 'sms') {
        result = await smsService.sendSMS(notification.recipient, notification.message);
      } else if (notification.type === 'email') {
        result = await emailService.sendEmail(
          notification.recipient,
          notification.subject,
          notification.message
        );
      }

      if (result.success) {
        await notification.markAsSent(result.messageId, result.cost);
      } else {
        await notification.markAsFailed(result.error);
      }

      return result;
    } catch (error) {
      await notification.markAsFailed(error.message);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(startDate, endDate) {
    return Notification.getNotificationStats(startDate, endDate);
  }

  // Helper method to log notifications to database
  async logNotification(data) {
    try {
      await Notification.create(data);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // HTML Template Helpers
  getRentReminderHTML(tenant, property, dueDate, amount) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
          <h1>Rent Payment Reminder</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Dear ${tenant.name},</h2>
          <p>This is a friendly reminder that your rent payment is due soon.</p>
          <div style="background: #f8d7da; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <strong>Property:</strong> ${property.name}<br>
            <strong>Amount Due:</strong> KES ${amount.toLocaleString()}<br>
            <strong>Due Date:</strong> ${dueDate}
          </div>
          <a href="${process.env.FRONTEND_URL}/payments" style="display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 4px;">Pay Now</a>
        </div>
      </div>
    `;
  }

  getPaymentConfirmationHTML(tenant, property, payment) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #27ae60; color: white; padding: 20px; text-align: center;">
          <h1>Payment Confirmation</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Dear ${tenant.name},</h2>
          <div style="background: #d4edda; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <strong>✓ Payment Received Successfully!</strong>
          </div>
          <p><strong>Payment Details:</strong></p>
          <ul>
            <li><strong>Property:</strong> ${property.name}</li>
            <li><strong>Amount Paid:</strong> KES ${payment.amount.toLocaleString()}</li>
            <li><strong>Payment Date:</strong> ${payment.date}</li>
            <li><strong>Transaction ID:</strong> ${payment.transactionId}</li>
          </ul>
        </div>
      </div>
    `;
  }

  getMaintenanceUpdateHTML(tenant, property, maintenance) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f39c12; color: white; padding: 20px; text-align: center;">
          <h1>Maintenance Update</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Dear ${tenant.name},</h2>
          <p>Update regarding your maintenance request for <strong>${property.name}</strong>.</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <strong>Status:</strong> ${maintenance.status}<br>
            <strong>Description:</strong> ${maintenance.description}
          </div>
        </div>
      </div>
    `;
  }

  getNewLeaseHTML(tenant, property, lease) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #8e44ad; color: white; padding: 20px; text-align: center;">
          <h1>🎉 Congratulations!</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Dear ${tenant.name},</h2>
          <div style="background: #e8daef; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <strong>Your lease application has been approved!</strong>
          </div>
          <p><strong>Lease Details:</strong></p>
          <ul>
            <li><strong>Property:</strong> ${property.name}</li>
            <li><strong>Start Date:</strong> ${lease.startDate}</li>
            <li><strong>Status:</strong> Active</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #8e44ad; color: white; text-decoration: none; border-radius: 4px;">Access Dashboard</a>
        </div>
      </div>
    `;
  }

  getWelcomeHTML(user, loginUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3498db; color: white; padding: 20px; text-align: center;">
          <h1>Welcome to Nyumba360!</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Dear ${user.name},</h2>
          <p>Thank you for joining Nyumba360. Your account has been created successfully.</p>
          <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px;">Get Started</a>
        </div>
      </div>
    `;
  }

  getPasswordResetHTML(user, resetUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e74c3c; color: white; padding: 20px; text-align: center;">
          <h1>Password Reset</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Dear ${user.name},</h2>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
          <p><strong>Important:</strong> This link will expire in 1 hour.</p>
        </div>
      </div>
    `;
  }

  getMonthlyStatementHTML(owner, properties, period) {
    const propertiesList = properties.map(prop => `
      <tr>
        <td>${prop.name}</td>
        <td>KES ${prop.revenue.toLocaleString()}</td>
        <td>KES ${prop.expenses.toLocaleString()}</td>
        <td>KES ${prop.netIncome.toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1>Monthly Statement</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2>Dear ${owner.name},</h2>
          <p>Monthly statement for <strong>${period}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #34495e; color: white;">
                <th style="padding: 12px; text-align: left;">Property</th>
                <th style="padding: 12px; text-align: left;">Revenue</th>
                <th style="padding: 12px; text-align: left;">Expenses</th>
                <th style="padding: 12px; text-align: left;">Net Income</th>
              </tr>
            </thead>
            <tbody>
              ${propertiesList}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  getEmergencyAlertHTML(message) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ff4444; color: white; padding: 20px; text-align: center;">
          <h1>🚨 EMERGENCY ALERT</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <p><em>This is an emergency alert from Nyumba360 Property Management.</em></p>
        </div>
      </div>
    `;
  }
}

module.exports = new NotificationService();

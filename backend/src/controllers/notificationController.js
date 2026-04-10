const smsService = require('../services/smsService');
const emailService = require('../services/emailService');
const Notification = require('../models/Notification');

class NotificationController {
  // Send SMS notification
  async sendSMS(req, res) {
    try {
      const { phoneNumber, message, priority = 'normal' } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          message: 'Phone number and message are required'
        });
      }

      const result = await smsService.sendSMS(phoneNumber, message, priority);

      // Log notification to database
      if (result.success) {
        await Notification.create({
          type: 'sms',
          recipient: phoneNumber,
          message: message,
          status: 'sent',
          messageId: result.messageId,
          sentBy: req.user?.id || 'system'
        });
      } else {
        await Notification.create({
          type: 'sms',
          recipient: phoneNumber,
          message: message,
          status: 'failed',
          error: result.error,
          sentBy: req.user?.id || 'system'
        });
      }

      res.status(result.success ? 200 : 500).json(result);

    } catch (error) {
      console.error('SMS controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send bulk SMS
  async sendBulkSMS(req, res) {
    try {
      const { phoneNumbers, message, priority = 'normal' } = req.body;

      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0 || !message) {
        return res.status(400).json({
          success: false,
          message: 'Phone numbers array and message are required'
        });
      }

      const result = await smsService.sendBulkSMS(phoneNumbers, message, priority);

      // Log notifications to database
      if (result.success) {
        for (const recipient of result.recipients) {
          await Notification.create({
            type: 'sms',
            recipient: recipient.number,
            message: message,
            status: recipient.status,
            messageId: recipient.messageId,
            sentBy: req.user?.id || 'system'
          });
        }
      }

      res.status(result.success ? 200 : 500).json(result);

    } catch (error) {
      console.error('Bulk SMS controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send email notification
  async sendEmail(req, res) {
    try {
      const { to, subject, htmlContent, textContent, attachments } = req.body;

      if (!to || !subject || !htmlContent) {
        return res.status(400).json({
          success: false,
          message: 'Recipient email, subject, and HTML content are required'
        });
      }

      const result = await emailService.sendEmail(to, subject, htmlContent, textContent, attachments);

      // Log notification to database
      if (result.success) {
        await Notification.create({
          type: 'email',
          recipient: Array.isArray(to) ? to.join(', ') : to,
          subject: subject,
          message: textContent || emailService.stripHtml(htmlContent),
          status: 'sent',
          messageId: result.messageId,
          sentBy: req.user?.id || 'system'
        });
      } else {
        await Notification.create({
          type: 'email',
          recipient: Array.isArray(to) ? to.join(', ') : to,
          subject: subject,
          message: textContent || emailService.stripHtml(htmlContent),
          status: 'failed',
          error: result.error,
          sentBy: req.user?.id || 'system'
        });
      }

      res.status(result.success ? 200 : 500).json(result);

    } catch (error) {
      console.error('Email controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send bulk email
  async sendBulkEmail(req, res) {
    try {
      const { recipients, subject, htmlContent, textContent } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !subject || !htmlContent) {
        return res.status(400).json({
          success: false,
          message: 'Recipients array, subject, and HTML content are required'
        });
      }

      const results = await emailService.sendBulkEmail(recipients, subject, htmlContent, textContent);

      // Log notifications to database
      for (const result of results) {
        await Notification.create({
          type: 'email',
          recipient: result.email,
          subject: subject,
          message: textContent || emailService.stripHtml(htmlContent),
          status: result.success ? 'sent' : 'failed',
          error: result.error,
          messageId: result.messageId,
          sentBy: req.user?.id || 'system'
        });
      }

      res.json({
        success: true,
        message: 'Bulk email processing completed',
        results: results
      });

    } catch (error) {
      console.error('Bulk email controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send rent reminder (SMS + Email)
  async sendRentReminder(req, res) {
    try {
      const { 
        tenantEmail, 
        tenantName, 
        propertyName, 
        dueDate, 
        amount, 
        phoneNumber,
        sendSMS = true,
        sendEmail = true 
      } = req.body;

      if (!tenantName || !propertyName || !dueDate || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Tenant name, property name, due date, and amount are required'
        });
      }

      const results = {};

      // Send SMS
      if (sendSMS && phoneNumber) {
        results.sms = await smsService.sendRentReminder(tenantName, propertyName, dueDate, amount, phoneNumber);
      }

      // Send Email
      if (sendEmail && tenantEmail) {
        results.email = await emailService.sendRentReminder(tenantEmail, tenantName, propertyName, dueDate, amount);
      }

      const success = Object.values(results).some(result => result.success);

      res.status(success ? 200 : 500).json({
        success: success,
        message: success ? 'Rent reminders sent successfully' : 'Failed to send rent reminders',
        results: results
      });

    } catch (error) {
      console.error('Rent reminder controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send payment confirmation (SMS + Email)
  async sendPaymentConfirmation(req, res) {
    try {
      const { 
        tenantEmail, 
        tenantName, 
        propertyName, 
        amount, 
        paymentDate, 
        phoneNumber,
        receiptUrl,
        sendSMS = true,
        sendEmail = true 
      } = req.body;

      if (!tenantName || !propertyName || !amount || !paymentDate) {
        return res.status(400).json({
          success: false,
          message: 'Tenant name, property name, amount, and payment date are required'
        });
      }

      const results = {};

      // Send SMS
      if (sendSMS && phoneNumber) {
        results.sms = await smsService.sendPaymentConfirmation(tenantName, propertyName, amount, paymentDate, phoneNumber);
      }

      // Send Email
      if (sendEmail && tenantEmail) {
        results.email = await emailService.sendPaymentConfirmation(tenantEmail, tenantName, propertyName, amount, paymentDate, receiptUrl);
      }

      const success = Object.values(results).some(result => result.success);

      res.status(success ? 200 : 500).json({
        success: success,
        message: success ? 'Payment confirmations sent successfully' : 'Failed to send payment confirmations',
        results: results
      });

    } catch (error) {
      console.error('Payment confirmation controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send maintenance update (SMS + Email)
  async sendMaintenanceUpdate(req, res) {
    try {
      const { 
        tenantEmail, 
        tenantName, 
        propertyName, 
        status, 
        description,
        phoneNumber,
        sendSMS = true,
        sendEmail = true 
      } = req.body;

      if (!tenantName || !propertyName || !status) {
        return res.status(400).json({
          success: false,
          message: 'Tenant name, property name, and status are required'
        });
      }

      const results = {};

      // Send SMS
      if (sendSMS && phoneNumber) {
        results.sms = await smsService.sendMaintenanceUpdate(tenantName, propertyName, status, phoneNumber);
      }

      // Send Email
      if (sendEmail && tenantEmail) {
        results.email = await emailService.sendMaintenanceUpdate(tenantEmail, tenantName, propertyName, status, description);
      }

      const success = Object.values(results).some(result => result.success);

      res.status(success ? 200 : 500).json({
        success: success,
        message: success ? 'Maintenance updates sent successfully' : 'Failed to send maintenance updates',
        results: results
      });

    } catch (error) {
      console.error('Maintenance update controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send new lease notification (SMS + Email)
  async sendNewLeaseNotification(req, res) {
    try {
      const { 
        tenantEmail, 
        tenantName, 
        propertyName, 
        startDate, 
        phoneNumber,
        leaseUrl,
        sendSMS = true,
        sendEmail = true 
      } = req.body;

      if (!tenantName || !propertyName || !startDate) {
        return res.status(400).json({
          success: false,
          message: 'Tenant name, property name, and start date are required'
        });
      }

      const results = {};

      // Send SMS
      if (sendSMS && phoneNumber) {
        results.sms = await smsService.sendNewLeaseNotification(tenantName, propertyName, startDate, phoneNumber);
      }

      // Send Email
      if (sendEmail && tenantEmail) {
        results.email = await emailService.sendNewLeaseNotification(tenantEmail, tenantName, propertyName, startDate, leaseUrl);
      }

      const success = Object.values(results).some(result => result.success);

      res.status(success ? 200 : 500).json({
        success: success,
        message: success ? 'New lease notifications sent successfully' : 'Failed to send new lease notifications',
        results: results
      });

    } catch (error) {
      console.error('New lease notification controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get notification history
  async getNotificationHistory(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        status, 
        startDate, 
        endDate 
      } = req.query;

      const query = {};
      
      if (type) query.type = type;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Notification.countDocuments(query);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get notification history error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Get SMS delivery status
  async getSMSDeliveryStatus(req, res) {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required'
        });
      }

      const result = await smsService.getDeliveryStatus(messageId);

      res.status(result.success ? 200 : 500).json(result);

    } catch (error) {
      console.error('SMS delivery status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Send emergency alert
  async sendEmergencyAlert(req, res) {
    try {
      const { message, phoneNumbers, emailAddresses } = req.body;

      if (!message || (!phoneNumbers?.length && !emailAddresses?.length)) {
        return res.status(400).json({
          success: false,
          message: 'Message and at least one recipient (phone or email) are required'
        });
      }

      const results = {};

      // Send SMS to all phone numbers
      if (phoneNumbers?.length > 0) {
        results.sms = await smsService.sendEmergencyAlert(message, phoneNumbers);
      }

      // Send email to all email addresses
      if (emailAddresses?.length > 0) {
        const subject = '🚨 EMERGENCY ALERT - Nyumba360';
        const htmlContent = `
          <div style="background: #ff4444; color: white; padding: 20px; text-align: center;">
            <h1>🚨 EMERGENCY ALERT</h1>
          </div>
          <div style="padding: 20px;">
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <p><em>This is an emergency alert from Nyumba360 Property Management.</em></p>
          </div>
        `;
        
        results.email = await emailService.sendEmail(emailAddresses, subject, htmlContent);
      }

      const success = Object.values(results).some(result => result.success);

      res.status(success ? 200 : 500).json({
        success: success,
        message: success ? 'Emergency alerts sent successfully' : 'Failed to send emergency alerts',
        results: results
      });

    } catch (error) {
      console.error('Emergency alert controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();

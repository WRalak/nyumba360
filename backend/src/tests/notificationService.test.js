const request = require('supertest');
const app = require('../../server');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const notificationConfig = require('../config/notificationConfig');

describe('Notification Service', () => {
  beforeEach(async () => {
    await Notification.deleteMany({});
  });

  describe('SMS Service', () => {
    test('should send SMS successfully', async () => {
      const mockSMS = {
        success: true,
        messageId: 'ATXid_1234567890',
        status: 'Sent'
      };

      jest.spyOn(notificationService, 'sendNotification').mockResolvedValue({
        success: true,
        results: { sms: mockSMS }
      });

      const result = await notificationService.sendNotification({
        recipient: 'Test User',
        phoneNumber: '+254712345678',
        message: 'Test message',
        channels: ['sms']
      });

      expect(result.success).toBe(true);
      expect(result.results.sms.success).toBe(true);
    });

    test('should handle SMS failure', async () => {
      const mockSMS = {
        success: false,
        error: 'Invalid phone number'
      };

      jest.spyOn(notificationService, 'sendNotification').mockResolvedValue({
        success: false,
        results: { sms: mockSMS }
      });

      const result = await notificationService.sendNotification({
        recipient: 'Test User',
        phoneNumber: 'invalid',
        message: 'Test message',
        channels: ['sms']
      });

      expect(result.success).toBe(false);
      expect(result.results.sms.error).toBe('Invalid phone number');
    });
  });

  describe('Email Service', () => {
    test('should send email successfully', async () => {
      const mockEmail = {
        success: true,
        messageId: 'msg_1234567890'
      };

      jest.spyOn(notificationService, 'sendNotification').mockResolvedValue({
        success: true,
        results: { email: mockEmail }
      });

      const result = await notificationService.sendNotification({
        recipient: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        channels: ['email']
      });

      expect(result.success).toBe(true);
      expect(result.results.email.success).toBe(true);
    });

    test('should handle email failure', async () => {
      const mockEmail = {
        success: false,
        error: 'Invalid email address'
      };

      jest.spyOn(notificationService, 'sendNotification').mockResolvedValue({
        success: false,
        results: { email: mockEmail }
      });

      const result = await notificationService.sendNotification({
        recipient: 'Test User',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'Test message',
        channels: ['email']
      });

      expect(result.success).toBe(false);
      expect(result.results.email.error).toBe('Invalid email address');
    });
  });

  describe('Template Notifications', () => {
    test('should send rent reminder', async () => {
      const tenant = {
        name: 'John Doe',
        phoneNumber: '+254712345678',
        email: 'john@example.com'
      };

      const property = {
        _id: 'property123',
        name: 'Apartment 101',
        rentAmount: 15000
      };

      const mockResult = {
        success: true,
        results: {
          sms: { success: true },
          email: { success: true }
        }
      };

      jest.spyOn(notificationService, 'sendNotification').mockResolvedValue(mockResult);

      const result = await notificationService.sendRentReminder(
        tenant,
        property,
        '2024-01-05',
        15000
      );

      expect(result.success).toBe(true);
    });

    test('should send payment confirmation', async () => {
      const tenant = {
        name: 'John Doe',
        phoneNumber: '+254712345678',
        email: 'john@example.com'
      };

      const property = {
        _id: 'property123',
        name: 'Apartment 101'
      };

      const payment = {
        _id: 'payment123',
        amount: 15000,
        date: '2024-01-01'
      };

      const mockResult = {
        success: true,
        results: {
          sms: { success: true },
          email: { success: true }
        }
      };

      jest.spyOn(notificationService, 'sendNotification').mockResolvedValue(mockResult);

      const result = await notificationService.sendPaymentConfirmation(
        tenant,
        property,
        payment
      );

      expect(result.success).toBe(true);
    });
  });
});

describe('Notification API Endpoints', () => {
  let authToken;

  beforeEach(async () => {
    // Setup authentication token
    authToken = 'Bearer mock-jwt-token';
    await Notification.deleteMany({});
  });

  describe('POST /api/notifications/sms', () => {
    test('should send SMS successfully', async () => {
      const response = await request(app)
        .post('/api/notifications/sms')
        .set('Authorization', authToken)
        .send({
          phoneNumber: '+254712345678',
          message: 'Test SMS message'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notifications/sms')
        .set('Authorization', authToken)
        .send({
          message: 'Test SMS message'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/email', () => {
    test('should send email successfully', async () => {
      const response = await request(app)
        .post('/api/notifications/email')
        .set('Authorization', authToken)
        .send({
          to: 'test@example.com',
          subject: 'Test Email',
          htmlContent: '<h1>Test HTML Content</h1>'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notifications/email')
        .set('Authorization', authToken)
        .send({
          subject: 'Test Email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/notifications/rent-reminder', () => {
    test('should send rent reminder successfully', async () => {
      const response = await request(app)
        .post('/api/notifications/rent-reminder')
        .set('Authorization', authToken)
        .send({
          tenantName: 'John Doe',
          propertyName: 'Apartment 101',
          dueDate: '2024-01-05',
          amount: 15000,
          phoneNumber: '+254712345678',
          tenantEmail: 'john@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should validate rent reminder fields', async () => {
      const response = await request(app)
        .post('/api/notifications/rent-reminder')
        .set('Authorization', authToken)
        .send({
          tenantName: 'John Doe'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/notifications/history', () => {
    test('should get notification history', async () => {
      // Create a test notification
      await Notification.create({
        type: 'sms',
        recipient: '+254712345678',
        message: 'Test message',
        status: 'sent'
      });

      const response = await request(app)
        .get('/api/notifications/history')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should filter by type', async () => {
      await Notification.create({
        type: 'sms',
        recipient: '+254712345678',
        message: 'Test SMS',
        status: 'sent'
      });

      await Notification.create({
        type: 'email',
        recipient: 'test@example.com',
        message: 'Test Email',
        status: 'sent'
      });

      const response = await request(app)
        .get('/api/notifications/history?type=sms')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('sms');
    });
  });
});

describe('Notification Utils', () => {
  const NotificationUtils = require('../utils/notificationUtils');

  describe('Phone Number Formatting', () => {
    test('should format Kenyan phone numbers', () => {
      expect(NotificationUtils.formatPhoneNumber('0712345678', 'KE')).toBe('+254712345678');
      expect(NotificationUtils.formatPhoneNumber('254712345678', 'KE')).toBe('+254712345678');
      expect(NotificationUtils.formatPhoneNumber('712345678', 'KE')).toBe('+254712345678');
    });

    test('should format US phone numbers', () => {
      expect(NotificationUtils.formatPhoneNumber('1234567890', 'US')).toBe('+11234567890');
      expect(NotificationUtils.formatPhoneNumber('11234567890', 'US')).toBe('+11234567890');
    });
  });

  describe('Email Validation', () => {
    test('should validate email addresses', () => {
      expect(NotificationUtils.isValidEmail('test@example.com')).toBe(true);
      expect(NotificationUtils.isValidEmail('invalid-email')).toBe(false);
      expect(NotificationUtils.isValidEmail('test@')).toBe(false);
      expect(NotificationUtils.isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('Date Utilities', () => {
    test('should calculate days until due', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      expect(NotificationUtils.getDaysUntilDue(futureDate)).toBe(5);
    });

    test('should format currency', () => {
      expect(NotificationUtils.formatCurrency(15000)).toBe('KES 15,000');
      expect(NotificationUtils.formatCurrency(15000.50)).toBe('KES 15,001');
    });
  });

  describe('Message Utilities', () => {
    test('should truncate SMS messages', () => {
      const longMessage = 'This is a very long message that should be truncated because it exceeds the maximum length for SMS messages which is typically 160 characters';
      const truncated = NotificationUtils.truncateForSMS(longMessage, 50);
      
      expect(truncated.length).toBeLessThanOrEqual(53); // 50 + '...'
      expect(truncated.endsWith('...')).toBe(true);
    });

    test('should extract text from HTML', () => {
      const html = '<h1>Hello</h1><p>World &amp; Universe</p>';
      const text = NotificationUtils.extractTextFromHTML(html);
      
      expect(text).toBe('HelloWorld & Universe');
    });
  });
});

describe('Notification Configuration', () => {
  test('should validate configuration', () => {
    // Mock environment variables
    process.env.AFRICASTALKING_API_KEY = 'test-key';
    process.env.AFRICASTALKING_USERNAME = 'test-user';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-password';

    const validation = notificationConfig.validate();
    expect(validation.isValid).toBe(true);
  });

  test('should detect missing configuration', () => {
    delete process.env.AFRICASTALKING_API_KEY;
    
    const validation = notificationConfig.validate();
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('AFRICASTALKING_API_KEY is required');
  });

  test('should get notification config by type', () => {
    const config = notificationConfig.getNotificationConfig('rent_reminder');
    
    expect(config.priority).toBe('high');
    expect(config.channels).toEqual(['email', 'sms']);
  });
});

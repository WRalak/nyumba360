const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

// Middleware to protect routes (optional - remove if public access is needed)
router.use(auth);

// SMS Routes
router.post('/sms', [
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('priority').optional().isIn(['normal', 'high']).withMessage('Priority must be normal or high')
], notificationController.sendSMS);

router.post('/sms/bulk', [
  body('phoneNumbers').isArray({ min: 1 }).withMessage('Phone numbers array is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('priority').optional().isIn(['normal', 'high']).withMessage('Priority must be normal or high')
], notificationController.sendBulkSMS);

router.get('/sms/status/:messageId', notificationController.getSMSDeliveryStatus);

// Email Routes
router.post('/email', [
  body('to').notEmpty().withMessage('Recipient email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('htmlContent').notEmpty().withMessage('HTML content is required')
], notificationController.sendEmail);

router.post('/email/bulk', [
  body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('htmlContent').notEmpty().withMessage('HTML content is required')
], notificationController.sendBulkEmail);

// Combined Notification Routes
router.post('/rent-reminder', [
  body('tenantName').notEmpty().withMessage('Tenant name is required'),
  body('propertyName').notEmpty().withMessage('Property name is required'),
  body('dueDate').notEmpty().withMessage('Due date is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('phoneNumber').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('tenantEmail').optional().isEmail().withMessage('Valid tenant email is required'),
  body('sendSMS').optional().isBoolean().withMessage('sendSMS must be boolean'),
  body('sendEmail').optional().isBoolean().withMessage('sendEmail must be boolean')
], notificationController.sendRentReminder);

router.post('/payment-confirmation', [
  body('tenantName').notEmpty().withMessage('Tenant name is required'),
  body('propertyName').notEmpty().withMessage('Property name is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentDate').notEmpty().withMessage('Payment date is required'),
  body('phoneNumber').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('tenantEmail').optional().isEmail().withMessage('Valid tenant email is required'),
  body('sendSMS').optional().isBoolean().withMessage('sendSMS must be boolean'),
  body('sendEmail').optional().isBoolean().withMessage('sendEmail must be boolean')
], notificationController.sendPaymentConfirmation);

router.post('/maintenance-update', [
  body('tenantName').notEmpty().withMessage('Tenant name is required'),
  body('propertyName').notEmpty().withMessage('Property name is required'),
  body('status').notEmpty().withMessage('Status is required'),
  body('phoneNumber').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('tenantEmail').optional().isEmail().withMessage('Valid tenant email is required'),
  body('sendSMS').optional().isBoolean().withMessage('sendSMS must be boolean'),
  body('sendEmail').optional().isBoolean().withMessage('sendEmail must be boolean')
], notificationController.sendMaintenanceUpdate);

router.post('/new-lease', [
  body('tenantName').notEmpty().withMessage('Tenant name is required'),
  body('propertyName').notEmpty().withMessage('Property name is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('phoneNumber').optional().notEmpty().withMessage('Phone number cannot be empty'),
  body('tenantEmail').optional().isEmail().withMessage('Valid tenant email is required'),
  body('sendSMS').optional().isBoolean().withMessage('sendSMS must be boolean'),
  body('sendEmail').optional().isBoolean().withMessage('sendEmail must be boolean')
], notificationController.sendNewLeaseNotification);

// Emergency Alert Route
router.post('/emergency', [
  body('message').notEmpty().withMessage('Message is required'),
  body('phoneNumbers').optional().isArray().withMessage('Phone numbers must be an array'),
  body('emailAddresses').optional().isArray().withMessage('Email addresses must be an array')
], notificationController.sendEmergencyAlert);

// Notification History
router.get('/history', notificationController.getNotificationHistory);

module.exports = router;

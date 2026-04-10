const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const auth = require('../middleware/auth');
const DataIsolationMiddleware = require('../middleware/dataIsolationMiddleware');
const { body, query } = require('express-validator');

// Apply authentication to all profile routes
router.use(auth);

// Apply session validation to all routes
router.use(DataIsolationMiddleware.validateSession);

// Apply data access logging
router.use(DataIsolationMiddleware.logDataAccess);

// GET /api/profile - Get user profile
router.get('/', ProfileController.getProfile);

// PUT /api/profile - Update user profile
router.put('/', [
  body('first_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
  body('display_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Display name must be between 1 and 100 characters'),
  body('date_of_birth').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
  body('nationality').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Nationality must be between 2 and 50 characters'),
  body('address.street').optional().trim().isLength({ max: 200 }).withMessage('Street address too long'),
  body('address.city').optional().trim().isLength({ max: 100 }).withMessage('City name too long'),
  body('address.state').optional().trim().isLength({ max: 100 }).withMessage('State name too long'),
  body('address.postal_code').optional().trim().isLength({ max: 20 }).withMessage('Postal code too long'),
  body('address.country').optional().trim().isLength({ max: 50 }).withMessage('Country name too long'),
  body('preferences.email_notifications').optional().isBoolean().withMessage('Email notifications must be boolean'),
  body('preferences.sms_notifications').optional().isBoolean().withMessage('SMS notifications must be boolean'),
  body('preferences.marketing_emails').optional().isBoolean().withMessage('Marketing emails must be boolean'),
  body('preferences.language').optional().isIn(['en', 'sw']).withMessage('Invalid language'),
  body('preferences.timezone').optional().trim().isLength({ max: 50 }).withMessage('Invalid timezone'),
  body('preferences.currency').optional().isIn(['KES', 'USD', 'EUR', 'GBP']).withMessage('Invalid currency'),
  body('privacy.profile_visibility').optional().isIn(['public', 'private', 'contacts_only']).withMessage('Invalid profile visibility'),
  body('privacy.show_phone').optional().isBoolean().withMessage('Show phone must be boolean'),
  body('privacy.show_email').optional().isBoolean().withMessage('Show email must be boolean')
], ProfileController.updateProfile);

// POST /api/profile/upload-image - Upload profile image
router.post('/upload-image', upload.single('profile_image'), ProfileController.uploadProfileImage);

// GET /api/profile/public/:userId - Get public profile
router.get('/public/:userId', 
  DataIsolationMiddleware.enforceProfilePrivacy,
  ProfileController.getPublicProfile
);

// PUT /api/profile/notifications - Update notification preferences
router.put('/notifications', [
  body('email_notifications').optional().isBoolean().withMessage('Email notifications must be boolean'),
  body('sms_notifications').optional().isBoolean().withMessage('SMS notifications must be boolean'),
  body('marketing_emails').optional().isBoolean().withMessage('Marketing emails must be boolean'),
  body('language').optional().isIn(['en', 'sw']).withMessage('Invalid language'),
  body('timezone').optional().trim().isLength({ max: 50 }).withMessage('Invalid timezone'),
  body('currency').optional().isIn(['KES', 'USD', 'EUR', 'GBP']).withMessage('Invalid currency')
], ProfileController.updateNotificationPreferences);

// PUT /api/profile/privacy - Update privacy settings
router.put('/privacy', [
  body('profile_visibility').optional().isIn(['public', 'private', 'contacts_only']).withMessage('Invalid profile visibility'),
  body('show_phone').optional().isBoolean().withMessage('Show phone must be boolean'),
  body('show_email').optional().isBoolean().withMessage('Show email must be boolean')
], ProfileController.updatePrivacySettings);

// GET /api/profile/stats - Get user statistics
router.get('/stats', ProfileController.getUserStats);

// GET /api/profile/search - Search users
router.get('/search', [
  query('query').trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
  query('user_type').optional().isIn(['landlord', 'tenant', 'admin', 'property_manager']).withMessage('Invalid user type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], ProfileController.searchUsers);

// GET /api/profile/notifications - Get user notifications
router.get('/notifications', [
  query('type').optional().isIn(['sms', 'email', 'push']).withMessage('Invalid notification type'),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], ProfileController.getUserNotifications);

// DELETE /api/profile - Delete account
router.delete('/', [
  body('password').notEmpty().withMessage('Password is required to delete account')
], ProfileController.deleteAccount);

module.exports = router;

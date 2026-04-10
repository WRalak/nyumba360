const express = require('express');
const { body } = require('express-validator');
const TenantController = require('../controllers/tenantController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(landlordOnly);

// Validation rules
const createTenantValidation = [
  body('user_id').optional().isUUID().withMessage('Valid user ID is required'),
  body('id_number').trim().isLength({ min: 5 }).withMessage('ID number is required'),
  body('id_type').optional().isIn(['national_id', 'passport', 'alien_id']).withMessage('Invalid ID type'),
  body('phone').matches(/^07[0-9]{8}$/).withMessage('Valid Kenyan phone number required (07XXXXXXXX)'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('emergency_contact_name').optional().trim().isLength({ min: 2 }).withMessage('Emergency contact name must be at least 2 characters'),
  body('emergency_contact_phone').optional().matches(/^07[0-9]{8}$/).withMessage('Valid Kenyan emergency contact phone required')
];

const updateTenantValidation = [
  body('id_number').optional().trim().isLength({ min: 5 }).withMessage('ID number is required'),
  body('id_type').optional().isIn(['national_id', 'passport', 'alien_id']).withMessage('Invalid ID type'),
  body('phone').optional().matches(/^07[0-9]{8}$/).withMessage('Valid Kenyan phone number required (07XXXXXXXX)'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('emergency_contact_name').optional().trim().isLength({ min: 2 }).withMessage('Emergency contact name must be at least 2 characters'),
  body('emergency_contact_phone').optional().matches(/^07[0-9]{8}$/).withMessage('Valid Kenyan emergency contact phone required')
];

// Routes
router.post('/', createTenantValidation, TenantController.createTenant);
router.get('/', TenantController.getTenants);
router.get('/stats', TenantController.getTenantStats);
router.get('/arrears', TenantController.getArrearsReport);
router.get('/:id', TenantController.getTenant);
router.get('/:id/payment-history', TenantController.getPaymentHistory);
router.put('/:id', updateTenantValidation, TenantController.updateTenant);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^07[0-9]{8}$/).withMessage('Valid Kenyan phone number required (07XXXXXXXX)'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('first_name').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('last_name').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('user_type').optional().isIn(['landlord', 'tenant', 'property_manager']).withMessage('Invalid user type')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('first_name').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('last_name').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().matches(/^07[0-9]{8}$/).withMessage('Valid Kenyan phone number required (07XXXXXXXX)')
];

// Routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, updateProfileValidation, AuthController.updateProfile);
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;

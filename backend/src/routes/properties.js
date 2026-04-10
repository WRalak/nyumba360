const express = require('express');
const { body } = require('express-validator');
const PropertyController = require('../controllers/propertyController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(landlordOnly);

// Validation rules
const createPropertyValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Property name must be at least 2 characters'),
  body('address').trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
  body('county').trim().isLength({ min: 2 }).withMessage('County is required'),
  body('property_type').optional().isIn(['apartment', 'house', 'commercial']).withMessage('Invalid property type'),
  body('total_units').optional().isInt({ min: 0 }).withMessage('Total units must be a positive number')
];

const updatePropertyValidation = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Property name must be at least 2 characters'),
  body('address').optional().trim().isLength({ min: 5 }).withMessage('Address must be at least 5 characters'),
  body('county').optional().trim().isLength({ min: 2 }).withMessage('County is required'),
  body('property_type').optional().isIn(['apartment', 'house', 'commercial']).withMessage('Invalid property type'),
  body('total_units').optional().isInt({ min: 0 }).withMessage('Total units must be a positive number')
];

// Routes
router.post('/', createPropertyValidation, PropertyController.createProperty);
router.get('/', PropertyController.getProperties);
router.get('/:id', PropertyController.getProperty);
router.put('/:id', updatePropertyValidation, PropertyController.updateProperty);
router.delete('/:id', PropertyController.deleteProperty);
router.get('/:id/dashboard', PropertyController.getPropertyDashboard);

module.exports = router;

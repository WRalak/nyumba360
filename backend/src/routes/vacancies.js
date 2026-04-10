const express = require('express');
const { body } = require('express-validator');
const VacancyController = require('../controllers/vacancyController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(landlordOnly);

// Validation rules
const createListingValidation = [
  body('property_id').isUUID().withMessage('Valid property ID is required'),
  body('unit_id').isUUID().withMessage('Valid unit ID is required'),
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('monthly_rent').isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
  body('security_deposit').optional().isFloat({ min: 0 }).withMessage('Security deposit must be a positive number'),
  body('available_date').optional().isISO8601().withMessage('Available date must be a valid date'),
  body('is_featured').optional().isBoolean().withMessage('Featured status must be boolean'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('contact_info').optional().isObject().withMessage('Contact info must be an object')
];

const updateListingValidation = [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('monthly_rent').optional().isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
  body('security_deposit').optional().isFloat({ min: 0 }).withMessage('Security deposit must be a positive number'),
  body('available_date').optional().isISO8601().withMessage('Available date must be a valid date'),
  body('is_featured').optional().isBoolean().withMessage('Featured status must be boolean'),
  body('is_active').optional().isBoolean().withMessage('Active status must be boolean'),
  body('contact_info').optional().isObject().withMessage('Contact info must be an object')
];

const toggleFeaturedValidation = [
  body('is_featured').isBoolean().withMessage('Featured status must be boolean')
];

// Routes
router.post('/', createListingValidation, VacancyController.createListing);
router.get('/', VacancyController.getListings);
router.get('/:id', VacancyController.getListing);
router.put('/:id', updateListingValidation, VacancyController.updateListing);
router.delete('/:id', VacancyController.deleteListing);
router.put('/:id/featured', toggleFeaturedValidation, VacancyController.toggleFeatured);
router.get('/stats', VacancyController.getVacancyStats);

module.exports = router;

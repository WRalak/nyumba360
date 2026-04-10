const express = require('express');
const { body } = require('express-validator');
const UnitController = require('../controllers/unitController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(landlordOnly);

// Validation rules
const createUnitValidation = [
  body('property_id').isUUID().withMessage('Valid property ID is required'),
  body('unit_number').trim().isLength({ min: 1 }).withMessage('Unit number is required'),
  body('unit_type').isIn(['studio', 'bedsitter', '1br', '2br', '3br', '4br+']).withMessage('Invalid unit type'),
  body('monthly_rent').isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
  body('security_deposit').optional().isFloat({ min: 0 }).withMessage('Security deposit must be a positive number'),
  body('size_sqm').optional().isInt({ min: 0 }).withMessage('Size must be a positive number'),
  body('floor_number').optional().isInt({ min: 0 }).withMessage('Floor number must be a positive number')
];

const updateUnitValidation = [
  body('unit_number').optional().trim().isLength({ min: 1 }).withMessage('Unit number is required'),
  body('unit_type').optional().isIn(['studio', 'bedsitter', '1br', '2br', '3br', '4br+']).withMessage('Invalid unit type'),
  body('monthly_rent').optional().isFloat({ min: 0 }).withMessage('Monthly rent must be a positive number'),
  body('security_deposit').optional().isFloat({ min: 0 }).withMessage('Security deposit must be a positive number'),
  body('size_sqm').optional().isInt({ min: 0 }).withMessage('Size must be a positive number'),
  body('floor_number').optional().isInt({ min: 0 }).withMessage('Floor number must be a positive number'),
  body('is_vacant').optional().isBoolean().withMessage('Vacancy status must be boolean')
];

// Routes
router.post('/', createUnitValidation, UnitController.createUnit);
router.get('/', UnitController.getUnits);
router.get('/vacant', UnitController.getVacantUnits);
router.get('/occupied', UnitController.getOccupiedUnits);
router.get('/:id', UnitController.getUnit);
router.put('/:id', updateUnitValidation, UnitController.updateUnit);
router.delete('/:id', UnitController.deleteUnit);

module.exports = router;

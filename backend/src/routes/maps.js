const express = require('express');
const { query } = require('express-validator');
const MapController = require('../controllers/mapController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation rules
const locationValidation = [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  query('radius').optional().isFloat({ min: 0, max: 100 }).withMessage('Radius must be positive and max 100km')
];

const updateLocationValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
];

const geocodeValidation = [
  body('address').trim().isLength({ min: 5 }).withMessage('Address is required'),
  body('county').optional().trim().isLength({ min: 3 }).withMessage('County is optional')
];

// Routes
router.get('/property/:id/location', MapController.getPropertyLocation);
router.get('/all', MapController.getAllPropertiesMap);
router.get('/nearby', locationValidation, MapController.getNearbyProperties);
router.put('/property/:id/location', updateLocationValidation, MapController.updatePropertyLocation);
router.get('/county', MapController.getPropertiesByCounty);
router.get('/clusters', MapController.getPropertyClusters);
router.post('/geocode', geocodeValidation, MapController.geocodeAddress);

module.exports = router;

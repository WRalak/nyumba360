const express = require('express');
const { body, query } = require('express-validator');
const RevenueController = require('../controllers/revenueController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(landlordOnly);

// Validation rules
const dailyRevenueValidation = [
  query('property_id').isUUID().withMessage('Valid property ID is required'),
  query('date').optional().isISO8601().withMessage('Date must be valid ISO8601 format')
];

const millionDayValidation = [
  query('property_id').isUUID().withMessage('Valid property ID is required')
];

const revenueReportValidation = [
  query('property_id').isUUID().withMessage('Valid property ID is required'),
  query('date').optional().isISO8601().withMessage('Date must be valid ISO8601 format')
];

const setGoalsValidation = [
  body('property_id').isUUID().withMessage('Valid property ID is required'),
  body('daily_target').isFloat({ min: 0 }).withMessage('Daily target must be a positive number'),
  body('monthly_target').isFloat({ min: 0 }).withMessage('Monthly target must be a positive number'),
  body('million_day_enabled').optional().isBoolean().withMessage('Million day enabled must be boolean')
];

// Routes
router.get('/daily', dailyRevenueValidation, RevenueController.getDailyRevenue);
router.get('/million-day', millionDayValidation, RevenueController.getMillionDayTarget);
router.get('/optimization', millionDayValidation, RevenueController.getRevenueOptimization);
router.get('/report', revenueReportValidation, RevenueController.generateRevenueReport);
router.get('/portfolio', RevenueController.getPortfolioRevenue);
router.post('/goals', setGoalsValidation, RevenueController.setRevenueGoals);
router.get('/dashboard', millionDayValidation, RevenueController.getRevenueDashboard);

module.exports = router;

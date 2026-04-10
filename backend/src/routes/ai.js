const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');

// Expense Predictions
router.get('/predictions/expenses', AIController.getExpensePredictions);

// Maintenance Predictions
router.get('/predictions/maintenance', AIController.getMaintenancePredictions);

// Tenant Screening
router.post('/screening/tenant', AIController.getTenantScreening);

// Property Insights
router.get('/insights/property', AIController.getPropertyInsights);

// Portfolio Insights
router.get('/insights/portfolio', AIController.getPortfolioInsights);

// Market Analysis
router.get('/analysis/market', AIController.getMarketAnalysis);

// AI Recommendations
router.get('/recommendations', AIController.getAIRecommendations);

module.exports = router;

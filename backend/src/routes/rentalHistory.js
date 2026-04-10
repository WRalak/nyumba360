const express = require('express');
const router = express.Router();
const RentalHistoryController = require('../controllers/rentalHistoryController');

// Get rental history for a specific tenant (for landlords and admins)
router.get('/tenant/:tenant_id', RentalHistoryController.getRentalHistory);

// Get rental history summary for a specific tenant
router.get('/tenant/:tenant_id/summary', RentalHistoryController.getRentalHistorySummary);

// Download rental history as PDF
router.get('/tenant/:tenant_id/download/pdf', RentalHistoryController.downloadRentalHistoryPDF);

// Download rental history as CSV
router.get('/tenant/:tenant_id/download/csv', RentalHistoryController.downloadRentalHistoryCSV);

// Verify rental history with verification code
router.post('/tenant/:tenant_id/verify', RentalHistoryController.verifyRentalHistory);

// Share rental history
router.post('/tenant/:tenant_id/share', RentalHistoryController.shareRentalHistory);

// Get own rental history (for tenants)
router.get('/my-history', RentalHistoryController.getMyRentalHistory);

module.exports = router;

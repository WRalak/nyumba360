const express = require('express');
const { body } = require('express-validator');
const AdminController = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Admin access middleware
router.use((req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }
  next();
});

// Validation rules
const updateUserStatusValidation = [
  body('is_verified').isBoolean().withMessage('is_verified must be a boolean')
];

// Routes
router.get('/stats', AdminController.getSystemStats);
router.get('/users', AdminController.getAllUsers);
router.get('/properties', AdminController.getAllProperties);
router.get('/activity', AdminController.getSystemActivity);
router.get('/financials', AdminController.getFinancialOverview);
router.put('/users/:id/status', updateUserStatusValidation, AdminController.updateUserStatus);

module.exports = router;

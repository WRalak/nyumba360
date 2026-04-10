const express = require('express');
const { body } = require('express-validator');
const MaintenanceController = require('../controllers/maintenanceController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(landlordOnly);

// Validation rules
const createTicketValidation = [
  body('property_id').isUUID().withMessage('Valid property ID is required'),
  body('unit_id').isUUID().withMessage('Valid unit ID is required'),
  body('tenant_id').optional().isUUID().withMessage('Valid tenant ID is required'),
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('images').optional().isArray().withMessage('Images must be an array')
];

const updateTicketValidation = [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('assigned_to').optional().isUUID().withMessage('Valid assignee ID is required'),
  body('resolution_notes').optional().trim().isLength({ min: 5 }).withMessage('Resolution notes must be at least 5 characters'),
  body('images').optional().isArray().withMessage('Images must be an array')
];

// Routes
router.post('/', createTicketValidation, MaintenanceController.createTicket);
router.get('/', MaintenanceController.getTickets);
router.get('/stats', MaintenanceController.getMaintenanceStats);
router.get('/:id', MaintenanceController.getTicket);
router.put('/:id', updateTicketValidation, MaintenanceController.updateTicket);
router.delete('/:id', MaintenanceController.deleteTicket);

module.exports = router;

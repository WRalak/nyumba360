const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const AgentController = require('../controllers/agentController');

// Validation middleware
const agentProfileValidation = [
  body('agency_name').notEmpty().withMessage('Agency name is required'),
  body('license_number').notEmpty().withMessage('License number is required'),
  body('license_expiry').isISO8601().withMessage('Valid license expiry date is required'),
  body('commission_structure').isIn(['percentage', 'fixed', 'hybrid']).optional(),
  body('commission_rate').isFloat({ min: 0, max: 100 }).optional(),
  body('fixed_fee').isFloat({ min: 0 }).optional(),
  body('experience_years').isInt({ min: 0 }).optional()
];

const contractValidation = [
  body('landlord_id').notEmpty().withMessage('Landlord ID is required'),
  body('property_ids').isArray({ min: 1 }).withMessage('At least one property is required'),
  body('management_type').isIn(['full_management', 'tenant_find_only', 'rent_collection', 'maintenance_only']).withMessage('Valid management type is required'),
  body('commission_structure.type').isIn(['percentage', 'fixed', 'hybrid']).withMessage('Valid commission structure type is required')
];

// Agent Profile Management
router.post('/profile', agentProfileValidation, AgentController.createAgentProfile);
router.get('/profile', AgentController.getAgentProfile);
router.put('/profile', agentProfileValidation, AgentController.updateAgentProfile);
router.get('/stats', AgentController.getAgentStats);

// Agent Search and Discovery
router.get('/search', AgentController.searchAgents);
router.get('/top-performers', AgentController.getTopAgents);

// Management Contracts
router.post('/contracts', contractValidation, AgentController.createManagementContract);
router.get('/contracts', AgentController.getManagementContracts);
router.put('/contracts/:id', AgentController.updateManagementContract);
router.post('/contracts/:id/notes', AgentController.addNoteToContract);

// Managed Properties
router.get('/properties', AgentController.getManagedProperties);

module.exports = router;

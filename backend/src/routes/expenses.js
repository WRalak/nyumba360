const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ExpenseController = require('../controllers/expenseController');

// Validation middleware
const expenseValidation = [
  body('property_id').notEmpty().withMessage('Property ID is required'),
  body('expense_type').isIn([
    'repair', 'maintenance', 'utilities', 'insurance', 'rates', 
    'tax', 'management_fee', 'marketing', 'legal', 'cleaning',
    'security', 'landscaping', 'pest_control', 'painting', 'plumbing',
    'electrical', 'hvac', 'appliances', 'other'
  ]).withMessage('Invalid expense type'),
  body('category').isIn(['capital', 'operational', 'emergency', 'cosmetic']).optional(),
  body('description').notEmpty().withMessage('Description is required').isLength({ max: 1000 }),
  body('amount').isNumeric().withMessage('Amount must be numeric').isFloat({ min: 0 }),
  body('payment_method').isIn(['mpesa', 'bank_transfer', 'cash', 'cheque', 'card', 'mobile_money']).withMessage('Invalid payment method'),
  body('payment_status').isIn(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  body('is_recurring').isBoolean().optional(),
  body('recurring_frequency').isIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  body('tax_deductible').isBoolean().optional()
];

// CRUD routes
router.get('/', ExpenseController.getExpenses);
router.get('/summary', ExpenseController.getExpenseSummary);
router.get('/trends', ExpenseController.getExpenseTrends);
router.get('/vendor-analysis', ExpenseController.getVendorAnalysis);
router.get('/recurring', ExpenseController.getRecurringExpenses);
router.get('/roi-impact', ExpenseController.getROIImpact);
router.get('/:id', ExpenseController.getExpenseById);

router.post('/', expenseValidation, ExpenseController.createExpense);
router.put('/:id', expenseValidation, ExpenseController.updateExpense);
router.delete('/:id', ExpenseController.deleteExpense);

module.exports = router;

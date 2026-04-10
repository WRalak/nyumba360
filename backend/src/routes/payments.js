const express = require('express');
const { body } = require('express-validator');
const PaymentController = require('../controllers/paymentController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(landlordOnly);

// Validation rules
const initiatePaymentValidation = [
  body('tenant_id').isUUID().withMessage('Valid tenant ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('payment_method').optional().isIn(['mpesa', 'cash', 'bank_transfer']).withMessage('Invalid payment method')
];

const updatePaymentStatusValidation = [
  body('status').isIn(['pending', 'completed', 'failed']).withMessage('Invalid payment status'),
  body('additional_data').optional().isObject().withMessage('Additional data must be an object')
];

// Routes
router.post('/initiate', initiatePaymentValidation, PaymentController.initiatePayment);
router.get('/', PaymentController.getPayments);
router.get('/stats', PaymentController.getPaymentStats);
router.get('/:id', PaymentController.getPayment);
router.put('/:id/status', updatePaymentStatusValidation, PaymentController.updatePaymentStatus);
router.post('/mpesa/callback', PaymentController.mpesaCallback);

module.exports = router;

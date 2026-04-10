const { validationResult } = require('express-validator');
const RentPayment = require('../models/RentPayment');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const mpesaService = require('../services/mpesaService');

class PaymentController {
  static async initiatePayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { tenant_id, amount, payment_method = 'mpesa' } = req.body;

      // Get tenant and verify ownership
      const tenant = await Tenant.findById(tenant_id);
      if (!tenant || !tenant.current_lease) {
        return res.status(404).json({
          error: 'Tenant not found or no active lease'
        });
      }

      // Verify property ownership
      const property = await Property.findById(tenant.current_lease.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      let paymentResponse;

      if (payment_method === 'mpesa') {
        // Validate phone number
        const phoneNumber = mpesaService.validatePhoneNumber(tenant.phone);
        const formattedAmount = mpesaService.formatAmount(amount);

        // Initiate M-Pesa STK push
        paymentResponse = await mpesaService.initiateSTKPush(
          phoneNumber,
          formattedAmount,
          `Rent-${tenant.id}-${Date.now()}`,
          `Rent payment for ${property.name} - Unit ${tenant.current_lease.unit_number}`
        );

        if (!paymentResponse.success) {
          return res.status(400).json({
            error: 'M-Pesa payment initiation failed',
            details: paymentResponse.error
          });
        }

        // Create payment record with pending status
        const payment = await RentPayment.create({
          lease_id: tenant.current_lease.id,
          tenant_id: tenant.id,
          amount: amount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'mpesa',
          transaction_id: paymentResponse.data.CheckoutRequestID,
          payment_status: 'pending',
          mpesa_response: paymentResponse.data
        });

        res.status(201).json({
          message: 'M-Pesa payment initiated successfully',
          payment,
          mpesaResponse: paymentResponse.data
        });
      } else {
        // Manual payment recording
        const payment = await RentPayment.create({
          lease_id: tenant.current_lease.id,
          tenant_id: tenant.id,
          amount: amount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: payment_method,
          payment_status: 'completed'
        });

        res.status(201).json({
          message: 'Payment recorded successfully',
          payment
        });
      }
    } catch (error) {
      console.error('Initiate payment error:', error);
      res.status(500).json({
        error: 'Failed to initiate payment',
        message: error.message
      });
    }
  }

  static async getPayments(req, res) {
    try {
      const { property_id, tenant_id, status, start_date, end_date, limit = 50 } = req.query;

      let payments;

      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }

        payments = await RentPayment.getByProperty(
          property_id,
          start_date || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
          end_date || new Date().toISOString().split('T')[0]
        );
      } else if (tenant_id) {
        // Verify tenant belongs to landlord's property
        const tenant = await Tenant.findById(tenant_id);
        if (!tenant || !tenant.current_lease) {
          return res.status(404).json({
            error: 'Tenant not found or no active lease'
          });
        }

        const property = await Property.findById(tenant.current_lease.property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied'
          });
        }

        payments = await RentPayment.getByTenant(tenant_id, parseInt(limit));
      } else {
        // Get all payments for landlord's properties
        const properties = await Property.findByOwner(req.user.userId);
        let allPayments = [];

        for (const property of properties) {
          const propertyPayments = await RentPayment.getByProperty(
            property.id,
            start_date || new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
            end_date || new Date().toISOString().split('T')[0]
          );
          allPayments = allPayments.concat(propertyPayments);
        }

        payments = allPayments;
      }

      // Filter by status if provided
      if (status) {
        payments = payments.filter(payment => payment.payment_status === status);
      }

      // Sort by date (most recent first)
      payments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

      res.json({
        message: 'Payments retrieved successfully',
        payments: payments.slice(0, parseInt(limit))
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        error: 'Failed to retrieve payments',
        message: error.message
      });
    }
  }

  static async getPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await RentPayment.findById(id);

      if (!payment) {
        return res.status(404).json({
          error: 'Payment not found'
        });
      }

      // Verify payment belongs to landlord's property
      // This would require joining with lease_agreement and properties
      // For now, we'll simplify the check
      res.json({
        message: 'Payment retrieved successfully',
        payment
      });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({
        error: 'Failed to retrieve payment',
        message: error.message
      });
    }
  }

  static async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, additional_data = {} } = req.body;

      const payment = await RentPayment.findById(id);
      if (!payment) {
        return res.status(404).json({
          error: 'Payment not found'
        });
      }

      const updatedPayment = await RentPayment.updateStatus(id, status, additional_data);

      res.json({
        message: 'Payment status updated successfully',
        payment: updatedPayment
      });
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        error: 'Failed to update payment status',
        message: error.message
      });
    }
  }

  static async getPaymentStats(req, res) {
    try {
      const { property_id, year, month } = req.query;
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      let stats = {
        totalRevenue: 0,
        monthlyRevenue: 0,
        collectionRate: 0,
        pendingPayments: 0,
        completedPayments: 0
      };

      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }

        const monthlyStats = await RentPayment.getMonthlyStats(
          property_id,
          parseInt(year) || currentYear,
          parseInt(month) || currentMonth
        );

        stats = {
          totalRevenue: monthlyStats.total_amount || 0,
          monthlyRevenue: monthlyStats.total_amount || 0,
          collectionRate: 0, // Would need expected rent calculation
          pendingPayments: monthlyStats.pending_payments || 0,
          completedPayments: monthlyStats.completed_payments || 0
        };
      } else {
        // Get stats for all landlord properties
        const properties = await Property.findByOwner(req.user.userId);
        let totalRevenue = 0;
        let totalCompleted = 0;
        let totalPending = 0;

        for (const property of properties) {
          const propertyStats = await RentPayment.getMonthlyStats(
            property.id,
            parseInt(year) || currentYear,
            parseInt(month) || currentMonth
          );
          totalRevenue += propertyStats.total_amount || 0;
          totalCompleted += propertyStats.completed_payments || 0;
          totalPending += propertyStats.pending_payments || 0;
        }

        stats = {
          totalRevenue,
          monthlyRevenue: totalRevenue,
          collectionRate: 0, // Would need expected rent calculation
          pendingPayments: totalPending,
          completedPayments: totalCompleted
        };
      }

      res.json({
        message: 'Payment stats retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve payment stats',
        message: error.message
      });
    }
  }

  static async mpesaCallback(req, res) {
    try {
      const callbackData = req.body;
      console.log('M-Pesa callback received:', callbackData);

      const result = mpesaService.processCallback(callbackData);

      if (result.success) {
        // Update payment status in database
        const { CheckoutRequestID, amount, mpesaReceiptNumber } = result.transactionData;

        // Find payment by CheckoutRequestID
        // This would require adding transaction_id to the payments table query
        // For now, we'll log the success
        console.log('Payment successful:', result.transactionData);

        res.status(200).json({
          ResultCode: 0,
          ResultDesc: 'Success'
        });
      } else {
        console.error('Payment failed:', result.error);
        
        res.status(200).json({
          ResultCode: 1,
          ResultDesc: 'Failed'
        });
      }
    } catch (error) {
      console.error('M-Pesa callback error:', error);
      res.status(500).json({
        ResultCode: 1,
        ResultDesc: 'Server error'
      });
    }
  }
}

module.exports = PaymentController;

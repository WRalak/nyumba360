const { validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Property = require('../models/Property');
const Unit = require('../models/Unit');

class ExpenseController {
  static async createExpense(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const {
        property_id,
        unit_id,
        expense_type,
        category,
        description,
        amount,
        expense_date,
        vendor,
        payment_method,
        payment_status = 'paid',
        due_date,
        is_recurring = false,
        recurring_frequency,
        recurring_end_date,
        tax_deductible = false,
        tags,
        notes,
        attachments
      } = req.body;

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      // Verify unit if provided
      if (unit_id) {
        const unit = await Unit.findById(unit_id);
        if (!unit || unit.property_id.toString() !== property_id) {
          return res.status(400).json({
            error: 'Unit not found or does not belong to this property'
          });
        }
      }

      const expenseData = {
        property_id,
        unit_id,
        landlord_id: req.user.userId,
        expense_type,
        category,
        description,
        amount: parseFloat(amount),
        expense_date: expense_date || new Date(),
        vendor,
        payment_method,
        payment_status,
        due_date: due_date || (payment_status === 'pending' ? new Date() : null),
        paid_date: payment_status === 'paid' ? new Date() : null,
        is_recurring,
        recurring_frequency: is_recurring ? recurring_frequency : null,
        recurring_end_date: is_recurring ? recurring_end_date : null,
        tax_deductible,
        tags: tags || [],
        notes,
        attachments: attachments || []
      };

      const expense = new Expense(expenseData);
      await expense.save();

      // Populate related data for response
      await expense.populate([
        { path: 'property_id', select: 'property_name address' },
        { path: 'unit_id', select: 'unit_number unit_type' }
      ]);

      res.status(201).json({
        message: 'Expense created successfully',
        expense
      });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({
        error: 'Failed to create expense',
        details: error.message
      });
    }
  }

  static async getExpenses(req, res) {
    try {
      const {
        property_id,
        expense_type,
        category,
        payment_status,
        start_date,
        end_date,
        is_recurring,
        page = 1,
        limit = 20,
        sort_by = 'expense_date',
        sort_order = 'desc'
      } = req.query;

      // Build query
      const query = { landlord_id: req.user.userId };

      if (property_id) query.property_id = property_id;
      if (expense_type) query.expense_type = expense_type;
      if (category) query.category = category;
      if (payment_status) query.payment_status = payment_status;
      if (is_recurring !== undefined) query.is_recurring = is_recurring === 'true';

      // Date range filter
      if (start_date || end_date) {
        query.expense_date = {};
        if (start_date) query.expense_date.$gte = new Date(start_date);
        if (end_date) query.expense_date.$lte = new Date(end_date);
      }

      // Sort options
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'desc' ? -1 : 1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [expenses, total] = await Promise.all([
        Expense.find(query)
          .populate('property_id', 'property_name address')
          .populate('unit_id', 'unit_number unit_type')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        Expense.countDocuments(query)
      ]);

      res.json({
        expenses,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_records: total,
          records_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get expenses error:', error);
      res.status(500).json({
        error: 'Failed to fetch expenses',
        details: error.message
      });
    }
  }

  static async getExpenseById(req, res) {
    try {
      const { id } = req.params;

      const expense = await Expense.findOne({
        _id: id,
        landlord_id: req.user.userId
      })
        .populate('property_id', 'property_name address')
        .populate('unit_id', 'unit_number unit_type')
        .populate('approved_by', 'first_name last_name email');

      if (!expense) {
        return res.status(404).json({
          error: 'Expense not found'
        });
      }

      res.json({ expense });
    } catch (error) {
      console.error('Get expense error:', error);
      res.status(500).json({
        error: 'Failed to fetch expense',
        details: error.message
      });
    }
  }

  static async updateExpense(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Find expense and verify ownership
      const expense = await Expense.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!expense) {
        return res.status(404).json({
          error: 'Expense not found'
        });
      }

      // Verify property ownership if property_id is being updated
      if (updateData.property_id) {
        const property = await Property.findById(updateData.property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      // Verify unit if unit_id is being updated
      if (updateData.unit_id) {
        const unit = await Unit.findById(updateData.unit_id);
        if (!unit || unit.property_id.toString() !== (updateData.property_id || expense.property_id).toString()) {
          return res.status(400).json({
            error: 'Unit not found or does not belong to this property'
          });
        }
      }

      // Update paid_date if payment_status changes to paid
      if (updateData.payment_status === 'paid' && expense.payment_status !== 'paid') {
        updateData.paid_date = new Date();
      }

      // Update numeric fields
      if (updateData.amount) {
        updateData.amount = parseFloat(updateData.amount);
      }

      const updatedExpense = await Expense.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('property_id', 'property_name address')
        .populate('unit_id', 'unit_number unit_type');

      res.json({
        message: 'Expense updated successfully',
        expense: updatedExpense
      });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({
        error: 'Failed to update expense',
        details: error.message
      });
    }
  }

  static async deleteExpense(req, res) {
    try {
      const { id } = req.params;

      const expense = await Expense.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!expense) {
        return res.status(404).json({
          error: 'Expense not found'
        });
      }

      await Expense.findByIdAndDelete(id);

      res.json({
        message: 'Expense deleted successfully'
      });
    } catch (error) {
      console.error('Delete expense error:', error);
      res.status(500).json({
        error: 'Failed to delete expense',
        details: error.message
      });
    }
  }

  static async getExpenseSummary(req, res) {
    try {
      const { property_id, start_date, end_date } = req.query;

      // Verify property ownership if property_id is provided
      if (property_id) {
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      const startDate = start_date ? new Date(start_date) : new Date(new Date().setMonth(new Date().getMonth() - 12));
      const endDate = end_date ? new Date(end_date) : new Date();

      const summary = await Expense.getPropertyExpenseSummary(
        property_id,
        startDate,
        endDate
      );

      res.json({
        summary,
        period: {
          start_date: startDate,
          end_date: endDate
        }
      });
    } catch (error) {
      console.error('Get expense summary error:', error);
      res.status(500).json({
        error: 'Failed to fetch expense summary',
        details: error.message
      });
    }
  }

  static async getExpenseTrends(req, res) {
    try {
      const { property_id, months = 12 } = req.query;

      // Verify property ownership if property_id is provided
      if (property_id) {
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      const trends = await Expense.getMonthlyExpenseTrends(
        property_id,
        parseInt(months)
      );

      res.json({
        trends,
        months_analyzed: parseInt(months)
      });
    } catch (error) {
      console.error('Get expense trends error:', error);
      res.status(500).json({
        error: 'Failed to fetch expense trends',
        details: error.message
      });
    }
  }

  static async getVendorAnalysis(req, res) {
    try {
      const { property_id } = req.query;

      // Verify property ownership if property_id is provided
      if (property_id) {
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      const analysis = await Expense.getVendorAnalysis(property_id);

      res.json({
        vendor_analysis: analysis
      });
    } catch (error) {
      console.error('Get vendor analysis error:', error);
      res.status(500).json({
        error: 'Failed to fetch vendor analysis',
        details: error.message
      });
    }
  }

  static async getRecurringExpenses(req, res) {
    try {
      const { property_id } = req.query;

      // Verify property ownership if property_id is provided
      if (property_id) {
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      const recurringExpenses = await Expense.getRecurringExpenses(property_id);

      res.json({
        recurring_expenses: recurringExpenses
      });
    } catch (error) {
      console.error('Get recurring expenses error:', error);
      res.status(500).json({
        error: 'Failed to fetch recurring expenses',
        details: error.message
      });
    }
  }

  static async getROIImpact(req, res) {
    try {
      const { property_id, months = 12 } = req.query;

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      const roiImpact = await Expense.calculateROIImpact(
        property_id,
        parseInt(months)
      );

      res.json({
        roi_impact: roiImpact
      });
    } catch (error) {
      console.error('Get ROI impact error:', error);
      res.status(500).json({
        error: 'Failed to calculate ROI impact',
        details: error.message
      });
    }
  }
}

module.exports = ExpenseController;

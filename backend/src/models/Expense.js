const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  unit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalUnit',
    index: true
  },
  landlord_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expense_type: {
    type: String,
    enum: [
      'repair', 'maintenance', 'utilities', 'insurance', 'rates', 
      'tax', 'management_fee', 'marketing', 'legal', 'cleaning',
      'security', 'landscaping', 'pest_control', 'painting', 'plumbing',
      'electrical', 'hvac', 'appliances', 'other'
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['capital', 'operational', 'emergency', 'cosmetic'],
    default: 'operational'
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  expense_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  vendor: {
    name: String,
    phone: String,
    email: String,
    invoice_number: String
  },
  payment_method: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'card', 'mobile_money'],
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'paid'
  },
  due_date: Date,
  paid_date: Date,
  transaction_id: String,
  receipt_url: String,
  invoice_url: String,
  is_recurring: {
    type: Boolean,
    default: false
  },
  recurring_frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    default: null
  },
  recurring_end_date: Date,
  tax_deductible: {
    type: Boolean,
    default: false
  },
  depreciation_years: {
    type: Number,
    min: 1,
    max: 50
  },
  tags: [{
    type: String
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  attachments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['receipt', 'invoice', 'quote', 'warranty', 'other']
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_date: Date,
  is_capital_improvement: {
    type: Boolean,
    default: false
  },
  affects_rent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
expenseSchema.index({ property_id: 1, expense_date: -1 });
expenseSchema.index({ landlord_id: 1, expense_date: -1 });
expenseSchema.index({ expense_type: 1, expense_date: -1 });
expenseSchema.index({ payment_status: 1, due_date: 1 });
expenseSchema.index({ is_recurring: 1, recurring_frequency: 1 });

// Virtual for monthly average
expenseSchema.virtual('monthly_average').get(function() {
  if (this.is_recurring && this.recurring_frequency === 'monthly') {
    return this.amount;
  }
  return null;
});

// Static method to get expense summary by property
expenseSchema.statics.getPropertyExpenseSummary = async function(propertyId, startDate, endDate) {
  const matchCondition = {
    property_id: mongoose.Types.ObjectId(propertyId),
    expense_date: { $gte: startDate, $lte: endDate }
  };

  const summary = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: {
          expense_type: '$expense_type',
          category: '$category'
        },
        total_amount: { $sum: '$amount' },
        count: { $sum: 1 },
        avg_amount: { $avg: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.expense_type',
        categories: {
          $push: {
            category: '$_id.category',
            total_amount: '$total_amount',
            count: '$count',
            avg_amount: '$avg_amount'
          }
        },
        total_amount: { $sum: '$total_amount' },
        total_count: { $sum: '$count' }
      }
    },
    { $sort: { total_amount: -1 } }
  ]);

  return summary;
};

// Static method to get monthly expense trends
expenseSchema.statics.getMonthlyExpenseTrends = async function(propertyId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const trends = await this.aggregate([
    {
      $match: {
        property_id: mongoose.Types.ObjectId(propertyId),
        expense_date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$expense_date' },
          month: { $month: '$expense_date' }
        },
        total_expenses: { $sum: '$amount' },
        expense_count: { $sum: 1 },
        avg_expense: { $avg: '$amount' }
      }
    },
    {
      $project: {
        month: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: 1
          }
        },
        total_expenses: 1,
        expense_count: 1,
        avg_expense: 1
      }
    },
    { $sort: { month: 1 } }
  ]);

  return trends;
};

// Static method to get vendor analysis
expenseSchema.statics.getVendorAnalysis = async function(propertyId = null) {
  const matchCondition = propertyId ? 
    { property_id: mongoose.Types.ObjectId(propertyId) } : 
    {};

  const analysis = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$vendor.name',
        total_amount: { $sum: '$amount' },
        invoice_count: { $sum: 1 },
        avg_amount: { $avg: '$amount' },
        first_transaction: { $min: '$expense_date' },
        last_transaction: { $max: '$expense_date' },
        expense_types: { $addToSet: '$expense_type' }
      }
    },
    {
      $project: {
        vendor_name: '$_id',
        total_amount: 1,
        invoice_count: 1,
        avg_amount: 1,
        first_transaction: 1,
        last_transaction: 1,
        expense_types_count: { $size: '$expense_types' },
        expense_types: 1
      }
    },
    { $sort: { total_amount: -1 } }
  ]);

  return analysis;
};

// Static method to get recurring expenses
expenseSchema.statics.getRecurringExpenses = async function(propertyId = null) {
  const matchCondition = { is_recurring: true };
  if (propertyId) {
    matchCondition.property_id = mongoose.Types.ObjectId(propertyId);
  }

  return this.find(matchCondition)
    .populate('property_id', 'property_name')
    .populate('unit_id', 'unit_number')
    .sort({ recurring_frequency: 1, expense_date: -1 });
};

// Static method to calculate ROI impact
expenseSchema.statics.calculateROIImpact = async function(propertyId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const [totalExpenses, totalIncome] = await Promise.all([
    this.aggregate([
      {
        $match: {
          property_id: mongoose.Types.ObjectId(propertyId),
          expense_date: { $gte: startDate },
          payment_status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),
    mongoose.model('RentPayment').aggregate([
      {
        $lookup: {
          from: 'leaseagreements',
          localField: 'lease_id',
          foreignField: '_id',
          as: 'lease'
        }
      },
      {
        $lookup: {
          from: 'rentalunits',
          localField: 'lease.unit_id',
          foreignField: '_id',
          as: 'unit'
        }
      },
      { $unwind: '$lease' },
      { $unwind: '$unit' },
      {
        $match: {
          'unit.property_id': mongoose.Types.ObjectId(propertyId),
          payment_status: 'completed',
          payment_date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ])
  ]);

  const expenses = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
  const income = totalIncome.length > 0 ? totalIncome[0].total : 0;

  return {
    total_expenses: expenses,
    total_income: income,
    net_income: income - expenses,
    expense_ratio: income > 0 ? (expenses / income) * 100 : 0,
    months_analyzed: months
  };
};

module.exports = mongoose.model('Expense', expenseSchema);

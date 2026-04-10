const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema({
  lease_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaseAgreement',
    required: true
  },
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  unit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalUnit',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  payment_method: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'card'],
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transaction_id: String,
  mpesa_code: String,
  payment_month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  payment_year: {
    type: Number,
    required: true,
    min: 2020
  },
  due_date: {
    type: Date,
    required: true
  },
  late_fee: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  receipt_url: String,
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processed_at: Date,
  failure_reason: String
}, {
  timestamps: true
});

// Index for efficient queries
rentPaymentSchema.index({ lease_id: 1, payment_date: -1 });
rentPaymentSchema.index({ tenant_id: 1, payment_date: -1 });
rentPaymentSchema.index({ property_id: 1, payment_date: -1 });
rentPaymentSchema.index({ payment_status: 1, payment_date: -1 });
rentPaymentSchema.index({ payment_month: 1, payment_year: 1 });

// Static method to get monthly stats
rentPaymentSchema.statics.getMonthlyStats = async function(propertyId, year, month) {
  const stats = await this.aggregate([
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
        $expr: {
          $and: [
            { $eq: [{ $year: '$payment_date' }, year] },
            { $eq: [{ $month: '$payment_date' }, month] }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        total_payments: { $sum: 1 },
        total_amount: { $sum: '$amount' },
        completed_payments: {
          $sum: { $cond: [{ $eq: ['$payment_status', 'completed'] }, 1, 0] }
        },
        pending_payments: {
          $sum: { $cond: [{ $eq: ['$payment_status', 'pending'] }, 1, 0] }
        },
        failed_payments: {
          $sum: { $cond: [{ $eq: ['$payment_status', 'failed'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    total_payments: 0,
    total_amount: 0,
    completed_payments: 0,
    pending_payments: 0,
    failed_payments: 0
  };
};

// Static method to get arrears report
rentPaymentSchema.statics.getArrearsReport = async function(propertyId = null) {
  const matchCondition = { status: 'active' };
  if (propertyId) {
    matchCondition.property_id = mongoose.Types.ObjectId(propertyId);
  }
  
  const leases = await mongoose.model('LeaseAgreement').find(matchCondition)
    .populate('tenant_id', 'first_name last_name phone')
    .populate('unit_id', 'unit_number')
    .populate('property_id', 'property_name');
  
  const arrearsReport = [];
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  for (const lease of leases) {
    const dueDay = lease.rent_due_day;
    const today = new Date();
    const dueDate = new Date(currentYear, currentMonth - 1, dueDay);
    const isOverdue = today > dueDate;
    
    if (isOverdue) {
      const paidThisMonth = await this.aggregate([
        {
          $match: {
            lease_id: lease._id,
            payment_status: 'completed',
            $expr: {
              $and: [
                { $eq: [{ $year: '$payment_date' }, currentYear] },
                { $eq: [{ $month: '$payment_date' }, currentMonth] }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const amountPaid = paidThisMonth.length > 0 ? paidThisMonth[0].total : 0;
      const arrears = lease.monthly_rent - amountPaid;
      
      if (arrears > 0) {
        const lastPayment = await this.findOne({ 
          lease_id: lease._id, 
          payment_status: 'completed' 
        }).sort({ payment_date: -1 });
        
        arrearsReport.push({
          lease_id: lease._id,
          monthly_rent: lease.monthly_rent,
          rent_due_day: lease.rent_due_day,
          first_name: lease.tenant_id.first_name,
          last_name: lease.tenant_id.last_name,
          phone: lease.tenant_id.phone,
          unit_number: lease.unit_id.unit_number,
          property_name: lease.property_id.property_name,
          amount_paid: amountPaid,
          arrears_amount: arrears,
          months_overdue: 1,
          last_payment_date: lastPayment ? lastPayment.payment_date : null
        });
      }
    }
  }
  
  return arrearsReport;
};

// Static method to get collection rate
rentPaymentSchema.statics.getCollectionRate = async function(propertyId, startDate, endDate) {
  const expectedRent = await mongoose.model('LeaseAgreement').aggregate([
    {
      $lookup: {
        from: 'rentalunits',
        localField: 'unit_id',
        foreignField: '_id',
        as: 'unit'
      }
    },
    { $unwind: '$unit' },
    {
      $match: {
        'unit.property_id': mongoose.Types.ObjectId(propertyId),
        status: 'active'
      }
    },
    {
      $group: {
        _id: null,
        total_expected: { $sum: '$monthly_rent' }
      }
    }
  ]);
  
  const actualCollected = await this.aggregate([
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
        payment_date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total_collected: { $sum: '$amount' }
      }
    }
  ]);
  
  const expected = expectedRent.length > 0 ? expectedRent[0].total_expected : 0;
  const collected = actualCollected.length > 0 ? actualCollected[0].total_collected : 0;
  
  return expected > 0 ? Math.round((collected / expected) * 100) : 0;
};

module.exports = mongoose.model('RentPayment', rentPaymentSchema);

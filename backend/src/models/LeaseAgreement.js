const mongoose = require('mongoose');

const leaseAgreementSchema = new mongoose.Schema({
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
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  landlord_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lease_start_date: {
    type: Date,
    required: true
  },
  lease_end_date: {
    type: Date,
    required: true
  },
  monthly_rent: {
    type: Number,
    required: true,
    min: 0
  },
  security_deposit: {
    type: Number,
    required: true,
    min: 0
  },
  rent_due_day: {
    type: Number,
    required: true,
    min: 1,
    max: 31,
    default: 1
  },
  late_fee: {
    type: Number,
    default: 0
  },
  late_fee_percentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'terminated'],
    default: 'draft'
  },
  terms: {
    type: String,
    maxlength: 5000
  },
  utilities_included: [{
    type: String
  }],
  pet_policy: {
    allowed: {
      type: Boolean,
      default: false
    },
    fee: Number,
    deposit: Number
  },
  maintenance_responsibility: {
    landlord: [{
      type: String
    }],
    tenant: [{
      type: String
    }]
  },
  renewal_options: {
    can_renew: {
      type: Boolean,
      default: false
    },
    renewal_notice_period: Number, // days
    rent_increase_percentage: Number
  },
  documents: [{
    name: String,
    url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  signed_by_tenant: {
    type: Boolean,
    default: false
  },
  signed_by_landlord: {
    type: Boolean,
    default: false
  },
  tenant_signature_url: String,
  landlord_signature_url: String,
  signed_date: Date,
  termination_reason: String,
  termination_date: Date,
  terminated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Index for efficient queries
leaseAgreementSchema.index({ property_id: 1, status: 1 });
leaseAgreementSchema.index({ unit_id: 1, status: 1 });
leaseAgreementSchema.index({ tenant_id: 1, status: 1 });
leaseAgreementSchema.index({ lease_end_date: 1, status: 1 });

// Pre-save hook to update unit vacancy status
leaseAgreementSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'active') {
    await mongoose.model('RentalUnit').findByIdAndUpdate(this.unit_id, {
      is_vacant: false
    });
  }
  next();
});

// Post-remove hook to update unit vacancy status
leaseAgreementSchema.post('remove', async function() {
  await mongoose.model('RentalUnit').findByIdAndUpdate(this.unit_id, {
    is_vacant: true
  });
});

// Static method to find active leases
leaseAgreementSchema.statics.findActive = function() {
  return this.find({ status: 'active' })
    .populate('tenant_id', 'first_name last_name phone email')
    .populate('unit_id', 'unit_number unit_type monthly_rent')
    .populate('property_id', 'property_name address');
};

// Static method to find expiring leases
leaseAgreementSchema.statics.findExpiring = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    lease_end_date: { $lte: futureDate, $gte: new Date() }
  })
  .populate('tenant_id', 'first_name last_name phone email')
  .populate('unit_id', 'unit_number unit_type')
  .populate('property_id', 'property_name address');
};

// Static method to get lease statistics
leaseAgreementSchema.statics.getLeaseStats = async function(propertyId = null) {
  let matchCondition = {};
  if (propertyId) {
    matchCondition.property_id = mongoose.Types.ObjectId(propertyId);
  }
  
  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        total_leases: { $sum: 1 },
        active_leases: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        expired_leases: {
          $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
        },
        terminated_leases: {
          $sum: { $cond: [{ $eq: ['$status', 'terminated'] }, 1, 0] }
        },
        total_monthly_rent: { $sum: '$monthly_rent' },
        avg_rent: { $avg: '$monthly_rent' }
      }
    }
  ]);
  
  return stats[0] || {
    total_leases: 0,
    active_leases: 0,
    expired_leases: 0,
    terminated_leases: 0,
    total_monthly_rent: 0,
    avg_rent: 0
  };
};

module.exports = mongoose.model('LeaseAgreement', leaseAgreementSchema);

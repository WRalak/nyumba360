const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  id_number: {
    type: String,
    unique: true
  },
  date_of_birth: Date,
  nationality: {
    type: String,
    default: 'Kenyan'
  },
  occupation: String,
  employer: String,
  monthly_income: Number,
  emergency_contact: {
    name: String,
    phone: String,
    relationship: String
  },
  current_address: {
    street: String,
    city: String,
    county: String,
    postal_code: String
  },
  id_document_url: String,
  passport_photo_url: String,
  is_active: {
    type: Boolean,
    default: true
  },
  credit_score: Number,
  background_check_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Index for efficient searches
tenantSchema.index({ phone: 1 });
tenantSchema.index({ first_name: 1, last_name: 1 });
tenantSchema.index({ email: 1 });

// Virtual for current lease
tenantSchema.virtual('current_lease', {
  ref: 'LeaseAgreement',
  localField: '_id',
  foreignField: 'tenant_id',
  match: { status: 'active' }
});

// Virtual for payment history
tenantSchema.virtual('payment_history', {
  ref: 'RentPayment',
  localField: '_id',
  foreignField: 'tenant_id',
  options: { sort: { payment_date: -1 }, limit: 12 }
});

// Static method to get rent arrears
tenantSchema.statics.getRentArrears = async function(tenantId) {
  const lease = await mongoose.model('LeaseAgreement').findOne({
    tenant_id: tenantId,
    status: 'active'
  });
  
  if (!lease) return 0;
  
  // Calculate expected rent payments
  const currentDate = new Date();
  const leaseStart = new Date(lease.lease_start_date);
  const monthsPassed = Math.floor((currentDate - leaseStart) / (1000 * 60 * 60 * 24 * 30));
  
  // Get actual payments
  const paymentResult = await mongoose.model('RentPayment').aggregate([
    {
      $match: {
        tenant_id: mongoose.Types.ObjectId(tenantId),
        payment_status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const totalPaid = paymentResult.length > 0 ? paymentResult[0].total : 0;
  const expectedRent = monthsPassed * lease.monthly_rent;
  const arrears = expectedRent - totalPaid;
  
  return Math.max(0, arrears);
};

// Static method to get active tenants count
tenantSchema.statics.getActiveTenantsCount = async function(propertyId = null) {
  let matchCondition = { status: 'active' };
  
  if (propertyId) {
    matchCondition.property_id = mongoose.Types.ObjectId(propertyId);
  }
  
  const result = await mongoose.model('LeaseAgreement').aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        count: { $addToSet: '$tenant_id' }
      }
    },
    {
      $project: {
        count: { $size: '$count' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].count : 0;
};

// Static method to search tenants
tenantSchema.statics.searchTenants = function(searchTerm, landlordId) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return this.find({
    $or: [
      { first_name: searchRegex },
      { last_name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex }
    ]
  })
  .populate({
    path: 'current_lease',
    match: { status: 'active' },
    populate: [
      {
        path: 'property_id',
        match: { owner_id: mongoose.Types.ObjectId(landlordId) },
        select: 'property_name address'
      },
      {
        path: 'unit_id',
        select: 'unit_number unit_type'
      }
    ]
  })
  .sort({ last_name: 1 });
};

module.exports = mongoose.model('Tenant', tenantSchema);

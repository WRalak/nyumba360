const mongoose = require('mongoose');

const agentManagementSchema = new mongoose.Schema({
  agent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    index: true
  },
  landlord_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  property_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  management_type: {
    type: String,
    enum: ['full_management', 'tenant_find_only', 'rent_collection', 'maintenance_only'],
    required: true
  },
  start_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  end_date: Date,
  status: {
    type: String,
    enum: ['active', 'pending', 'terminated', 'expired'],
    default: 'pending'
  },
  commission_structure: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'hybrid'],
      required: true
    },
    percentage_rate: {
      type: Number,
      min: 0,
      max: 100
    },
    fixed_monthly_fee: {
      type: Number,
      min: 0
    },
    per_tenant_fee: {
      type: Number,
      min: 0
    },
    setup_fee: {
      type: Number,
      min: 0
    }
  },
  services_included: [{
    type: String,
    enum: [
      'tenant_screening', 'rent_collection', 'maintenance_coordination',
      'property_inspection', 'legal_compliance', 'accounting',
      'marketing', 'lease_management', 'eviction_support'
    ]
  }],
  responsibilities: {
    agent: [{
      task: String,
      frequency: String,
      description: String
    }],
    landlord: [{
      task: String,
      frequency: String,
      description: String
    }]
  },
  reporting: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    reports_required: [{
      type: String,
      enum: [
        'financial_summary', 'occupancy_report', 'maintenance_log',
        'tenant_satisfaction', 'property_inspection', 'rent_roll'
      ]
    }],
    delivery_method: {
      type: String,
      enum: ['email', 'portal', 'both'],
      default: 'email'
    }
  },
  termination_clause: {
    notice_period_days: {
      type: Number,
      default: 30
    },
    termination_fee: {
      type: Number,
      min: 0
    },
    reasons_for_termination: [String]
  },
  performance_targets: {
    occupancy_rate_target: {
      type: Number,
      min: 0,
      max: 100
    },
    rent_collection_rate_target: {
      type: Number,
      min: 0,
      max: 100
    },
    maintenance_response_time_target: {
      type: Number,
      default: 48 // hours
    },
    tenant_retention_rate_target: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  actual_performance: {
    occupancy_rate: {
      type: Number,
      min: 0,
      max: 100
    },
    rent_collection_rate: {
      type: Number,
      min: 0,
      max: 100
    },
    average_maintenance_response_time: {
      type: Number
    },
    tenant_retention_rate: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  communication_preferences: {
    preferred_contact_method: {
      type: String,
      enum: ['email', 'phone', 'sms', 'portal'],
      default: 'email'
    },
    meeting_frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    emergency_contact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['agreement', 'addendum', 'termination', 'report', 'other']
    },
    url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    content: String,
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    added_at: {
      type: Date,
      default: Date.now
    },
    is_internal: {
      type: Boolean,
      default: false
    }
  }],
  reviews: {
    landlord_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    landlord_review: String,
    agent_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    agent_review: String,
    review_date: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
agentManagementSchema.index({ agent_id: 1, status: 1 });
agentManagementSchema.index({ landlord_id: 1, status: 1 });
agentManagementSchema.index({ status: 1, end_date: 1 });
agentManagementSchema.index({ 'property_ids': 1 });

// Virtual for duration
agentManagementSchema.virtual('duration_months').get(function() {
  const start = new Date(this.start_date);
  const end = this.end_date ? new Date(this.end_date) : new Date();
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
});

// Virtual for is expiring soon
agentManagementSchema.virtual('is_expiring_soon').get(function() {
  if (!this.end_date || this.status !== 'active') return false;
  
  const now = new Date();
  const expiryDate = new Date(this.end_date);
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
});

// Static method to find active managements for an agent
agentManagementSchema.statics.findActiveByAgent = function(agentId) {
  return this.find({
    agent_id: agentId,
    status: 'active'
  })
    .populate('landlord_id', 'firstName lastName email phone')
    .populate('property_ids', 'property_name address')
    .sort({ createdAt: -1 });
};

// Static method to find active managements for a landlord
agentManagementSchema.statics.findActiveByLandlord = function(landlordId) {
  return this.find({
    landlord_id: landlordId,
    status: 'active'
  })
    .populate('agent_id', 'user_id agency_name license_number')
    .populate('property_ids', 'property_name address')
    .sort({ createdAt: -1 });
};

// Static method to get management statistics
agentManagementSchema.statics.getManagementStats = async function(agentId) {
  const stats = await this.aggregate([
    {
      $match: {
        agent_id: mongoose.Types.ObjectId(agentId)
      }
    },
    {
      $group: {
        _id: null,
        total_managements: { $sum: 1 },
        active_managements: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        total_properties: { $sum: { $size: '$property_ids' } },
        avg_commission_rate: { $avg: '$commission_structure.percentage_rate' },
        full_management_count: {
          $sum: { $cond: [{ $eq: ['$management_type', 'full_management'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    total_managements: 0,
    active_managements: 0,
    total_properties: 0,
    avg_commission_rate: 0,
    full_management_count: 0
  };
};

// Static method to update performance metrics
agentManagementSchema.statics.updatePerformanceMetrics = async function(managementId) {
  const management = await this.findById(managementId).populate('property_ids');
  
  if (!management) return;
  
  let totalOccupancyRate = 0;
  let totalCollectionRate = 0;
  let totalResponseTime = 0;
  let totalRetentionRate = 0;
  let propertyCount = 0;
  
  for (const property of management.property_ids) {
    propertyCount++;
    
    // Get property statistics
    const stats = await mongoose.model('Property').getPropertyStats(property._id);
    
    if (stats.total_units > 0) {
      totalOccupancyRate += (stats.occupied_units / stats.total_units) * 100;
    }
    
    // Get rent collection rate
    const collectionRate = await mongoose.model('RentPayment').getCollectionRate(
      property._id,
      new Date(new Date().setMonth(new Date().getMonth() - 1)),
      new Date()
    );
    
    totalCollectionRate += collectionRate;
    
    // Get maintenance response time (placeholder)
    totalResponseTime += 24; // hours
  }
  
  const avgOccupancyRate = propertyCount > 0 ? totalOccupancyRate / propertyCount : 0;
  const avgCollectionRate = propertyCount > 0 ? totalCollectionRate / propertyCount : 0;
  const avgResponseTime = propertyCount > 0 ? totalResponseTime / propertyCount : 0;
  
  await this.findByIdAndUpdate(managementId, {
    'actual_performance.occupancy_rate': avgOccupancyRate,
    'actual_performance.rent_collection_rate': avgCollectionRate,
    'actual_performance.average_maintenance_response_time': avgResponseTime
  });
};

// Static method to get expiring contracts
agentManagementSchema.statics.getExpiringContracts = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    end_date: { $lte: futureDate, $gte: new Date() }
  })
    .populate('agent_id', 'user_id agency_name')
    .populate('landlord_id', 'firstName lastName email')
    .sort({ end_date: 1 });
};

// Pre-save hook to validate dates
agentManagementSchema.pre('save', function(next) {
  if (this.end_date && this.end_date <= this.start_date) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('AgentManagement', agentManagementSchema);

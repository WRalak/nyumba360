const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  agency_name: {
    type: String,
    required: true,
    maxlength: 200
  },
  license_number: {
    type: String,
    required: true,
    unique: true
  },
  license_expiry: {
    type: Date,
    required: true
  },
  specialization: [{
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'land', 'property_management', 'valuation']
  }],
  service_areas: [{
    county: String,
    areas: [String]
  }],
  commission_structure: {
    type: String,
    enum: ['percentage', 'fixed', 'hybrid'],
    default: 'percentage'
  },
  commission_rate: {
    type: Number,
    min: 0,
    max: 100
  },
  fixed_fee: {
    type: Number,
    min: 0
  },
  bio: {
    type: String,
    maxlength: 2000
  },
  experience_years: {
    type: Number,
    min: 0
  },
  languages: [{
    type: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuing_body: String,
    issue_date: Date,
    expiry_date: Date
  }],
  professional_associations: [{
    name: String,
    membership_number: String,
    join_date: Date
  }],
  bank_details: {
    bank_name: String,
    account_name: String,
    account_number: String,
    branch_code: String,
    swift_code: String
  },
  rating: {
    average: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  verification_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending'
  },
  verification_documents: [{
    type: String,
    url: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  subscription_plan: {
    type: String,
    enum: ['basic', 'professional', 'enterprise'],
    default: 'basic'
  },
  subscription_expires: Date,
  managed_properties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  }],
  managed_landlords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  performance_metrics: {
    total_properties_managed: {
      type: Number,
      default: 0
    },
    total_tenants_managed: {
      type: Number,
      default: 0
    },
    total_revenue_generated: {
      type: Number,
      default: 0
    },
    average_occupancy_rate: {
      type: Number,
      default: 0
    },
    average_rent_collection_rate: {
      type: Number,
      default: 0
    },
    total_maintenance_requests: {
      type: Number,
      default: 0
    },
    average_response_time: {
      type: Number,
      default: 0
    }
  },
  settings: {
    auto_rent_reminders: {
      type: Boolean,
      default: true
    },
    auto_maintenance_notifications: {
      type: Boolean,
      default: true
    },
    monthly_reports: {
      type: Boolean,
      default: true
    },
    landlord_notifications: {
      type: Boolean,
      default: true
    },
    tenant_notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
agentSchema.index({ user_id: 1 });
agentSchema.index({ license_number: 1 });
agentSchema.index({ verification_status: 1 });
agentSchema.index({ is_active: 1 });
agentSchema.index({ 'service_areas.county': 1 });
agentSchema.index({ specialization: 1 });

// Virtual for license status
agentSchema.virtual('license_status').get(function() {
  const now = new Date();
  const expiryDate = new Date(this.license_expiry);
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 30) {
    return 'expiring_soon';
  } else {
    return 'valid';
  }
});

// Virtual for subscription status
agentSchema.virtual('subscription_status').get(function() {
  if (!this.subscription_expires) {
    return 'trial';
  }
  
  const now = new Date();
  const expiryDate = new Date(this.subscription_expires);
  
  if (expiryDate < now) {
    return 'expired';
  } else {
    return 'active';
  }
});

// Static method to find agents by service area
agentSchema.statics.findByServiceArea = function(county, area = null) {
  const query = {
    is_active: true,
    verification_status: 'verified',
    'service_areas.county': county
  };
  
  if (area) {
    query['service_areas.areas'] = area;
  }
  
  return this.find(query)
    .populate('user_id', 'firstName lastName email phone')
    .sort({ 'rating.average': -1 });
};

// Static method to find top performing agents
agentSchema.statics.findTopPerformers = function(limit = 10, county = null) {
  const matchCondition = {
    is_active: true,
    verification_status: 'verified'
  };
  
  if (county) {
    matchCondition['service_areas.county'] = county;
  }
  
  return this.find(matchCondition)
    .populate('user_id', 'firstName lastName email phone')
    .sort({ 'performance_metrics.total_revenue_generated': -1, 'rating.average': -1 })
    .limit(limit);
};

// Static method to update performance metrics
agentSchema.statics.updatePerformanceMetrics = async function(agentId) {
  const agent = await this.findById(agentId).populate('managed_properties');
  
  if (!agent) return;
  
  // Calculate metrics based on managed properties
  let totalProperties = 0;
  let totalTenants = 0;
  let totalRevenue = 0;
  let totalOccupancyRate = 0;
  let totalCollectionRate = 0;
  
  for (const property of agent.managed_properties) {
    totalProperties++;
    
    // Get property statistics
    const stats = await mongoose.model('Property').getPropertyStats(property._id);
    totalTenants += stats.occupied_units;
    totalRevenue += stats.current_monthly_rent;
    
    if (stats.total_units > 0) {
      totalOccupancyRate += (stats.occupied_units / stats.total_units) * 100;
    }
  }
  
  const avgOccupancyRate = totalProperties > 0 ? totalOccupancyRate / totalProperties : 0;
  
  // Update agent metrics
  await this.findByIdAndUpdate(agentId, {
    'performance_metrics.total_properties_managed': totalProperties,
    'performance_metrics.total_tenants_managed': totalTenants,
    'performance_metrics.total_revenue_generated': totalRevenue,
    'performance_metrics.average_occupancy_rate': avgOccupancyRate
  });
};

// Static method to get agent statistics
agentSchema.statics.getAgentStats = async function(agentId) {
  const agent = await this.findById(agentId)
    .populate('user_id', 'firstName lastName email')
    .populate('managed_properties', 'property_name address')
    .populate('managed_landlords', 'firstName lastName email');
  
  if (!agent) {
    throw new Error('Agent not found');
  }
  
  // Get recent activity
  const recentActivity = await this.getRecentActivity(agentId);
  
  return {
    agent_info: {
      name: `${agent.user_id.firstName} ${agent.user_id.lastName}`,
      email: agent.user_id.email,
      agency_name: agent.agency_name,
      license_number: agent.license_number,
      verification_status: agent.verification_status,
      rating: agent.rating
    },
    performance_metrics: agent.performance_metrics,
    managed_properties: agent.managed_properties,
    managed_landlords: agent.managed_landlords,
    recent_activity,
    license_status: agent.license_status,
    subscription_status: agent.subscription_status
  };
};

// Static method to get recent activity
agentSchema.statics.getRecentActivity = async function(agentId, limit = 10) {
  // This would typically query activity logs
  // For now, return placeholder data
  return [];
};

// Pre-save hook to validate license expiry
agentSchema.pre('save', function(next) {
  if (this.license_expiry && this.license_expiry <= new Date()) {
    return next(new Error('License expiry date must be in the future'));
  }
  next();
});

// Pre-save hook to validate commission structure
agentSchema.pre('save', function(next) {
  if (this.commission_structure === 'percentage' && (!this.commission_rate || this.commission_rate <= 0)) {
    return next(new Error('Commission rate is required for percentage-based commission'));
  }
  
  if (this.commission_structure === 'fixed' && (!this.fixed_fee || this.fixed_fee <= 0)) {
    return next(new Error('Fixed fee is required for fixed commission'));
  }
  
  next();
});

module.exports = mongoose.model('Agent', agentSchema);

const mongoose = require('mongoose');

const maintenanceTicketSchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  unit_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RentalUnit',
    required: true,
    index: true
  },
  tenant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    index: true
  },
  landlord_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: [
      'plumbing', 'electrical', 'hvac', 'appliances', 'structural',
      'pest_control', 'cleaning', 'landscaping', 'security', 'painting',
      'flooring', 'roofing', 'windows', 'doors', 'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  requested_date: {
    type: Date,
    default: Date.now
  },
  assigned_to: {
    name: String,
    phone: String,
    email: String,
    company: String,
    trade: String
  },
  assigned_date: Date,
  scheduled_date: Date,
  estimated_cost: {
    type: Number,
    min: 0
  },
  actual_cost: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  images: [{
    url: String,
    caption: String,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
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
  completion_notes: String,
  completion_date: Date,
  completion_images: [{
    url: String,
    caption: String,
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  tenant_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  tenant_feedback: String,
  landlord_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  landlord_feedback: String,
  warranty_period: {
    type: Number,
    min: 0
  },
  warranty_expires: Date,
  is_recurring_issue: {
    type: Boolean,
    default: false
  },
  previous_tickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceTicket'
  }],
  emergency_contact: {
    name: String,
    phone: String,
    relationship: String
  },
  access_instructions: String,
  pets_present: {
    type: Boolean,
    default: false
  },
  permission_to_enter: {
    type: Boolean,
    default: false
  },
  preferred_time: String,
  estimated_duration: String,
  materials_required: [{
    item: String,
    quantity: String,
    estimated_cost: Number
  }],
  labor_required: [{
    task: String,
    hours: Number,
    rate: Number
  }],
  invoice_number: String,
  invoice_url: String,
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'disputed'],
    default: 'pending'
  },
  paid_date: Date,
  tags: [{
    type: String
  }],
  source: {
    type: String,
    enum: ['tenant', 'landlord', 'inspection', 'emergency'],
    default: 'tenant'
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
maintenanceTicketSchema.index({ property_id: 1, status: 1 });
maintenanceTicketSchema.index({ unit_id: 1, status: 1 });
maintenanceTicketSchema.index({ tenant_id: 1, status: 1 });
maintenanceTicketSchema.index({ landlord_id: 1, status: 1 });
maintenanceTicketSchema.index({ priority: 1, status: 1 });
maintenanceTicketSchema.index({ category: 1, status: 1 });
maintenanceTicketSchema.index({ requested_date: -1 });
maintenanceTicketSchema.index({ scheduled_date: 1 });

// Virtual for time to resolution
maintenanceTicketSchema.virtual('resolution_time').get(function() {
  if (this.status === 'completed' && this.completion_date) {
    return Math.ceil((this.completion_date - this.requested_date) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for days open
maintenanceTicketSchema.virtual('days_open').get(function() {
  if (this.status === 'completed' && this.completion_date) {
    return Math.ceil((this.completion_date - this.requested_date) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((new Date() - this.requested_date) / (1000 * 60 * 60 * 24));
});

// Static method to get maintenance statistics
maintenanceTicketSchema.statics.getMaintenanceStats = async function(propertyId, startDate, endDate) {
  const matchCondition = {
    property_id: mongoose.Types.ObjectId(propertyId)
  };
  
  if (startDate && endDate) {
    matchCondition.requested_date = {
      $gte: startDate,
      $lte: endDate
    };
  }

  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        total_tickets: { $sum: 1 },
        open_tickets: {
          $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
        },
        in_progress_tickets: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        completed_tickets: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        urgent_tickets: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        },
        high_priority_tickets: {
          $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
        },
        total_cost: { $sum: '$actual_cost' },
        avg_resolution_time: {
          $avg: {
            $cond: [
              { $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$completion_date', null] }] },
              { $divide: [{ $subtract: ['$completion_date', '$requested_date'] }, 1000 * 60 * 60 * 24] },
              null
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    completed_tickets: 0,
    urgent_tickets: 0,
    high_priority_tickets: 0,
    total_cost: 0,
    avg_resolution_time: 0
  };
};

// Static method to get category breakdown
maintenanceTicketSchema.statics.getCategoryBreakdown = async function(propertyId, startDate, endDate) {
  const matchCondition = {
    property_id: mongoose.Types.ObjectId(propertyId)
  };
  
  if (startDate && endDate) {
    matchCondition.requested_date = {
      $gte: startDate,
      $lte: endDate
    };
  }

  const breakdown = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$category',
        total_tickets: { $sum: 1 },
        completed_tickets: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        total_cost: { $sum: '$actual_cost' },
        avg_cost: { $avg: '$actual_cost' },
        avg_resolution_time: {
          $avg: {
            $cond: [
              { $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$completion_date', null] }] },
              { $divide: [{ $subtract: ['$completion_date', '$requested_date'] }, 1000 * 60 * 60 * 24] },
              null
            ]
          }
        }
      }
    },
    { $sort: { total_tickets: -1 } }
  ]);

  return breakdown;
};

// Static method to get recurring issues
maintenanceTicketSchema.statics.getRecurringIssues = async function(propertyId) {
  const recurringIssues = await this.aggregate([
    {
      $match: {
        property_id: mongoose.Types.ObjectId(propertyId),
        is_recurring_issue: true
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          title: '$title'
        },
        occurrences: { $sum: 1 },
        unit_ids: { $addToSet: '$unit_id' },
        last_occurrence: { $max: '$requested_date' },
        total_cost: { $sum: '$actual_cost' }
      }
    },
    {
      $project: {
        category: '$_id.category',
        title: '$_id.title',
        occurrences: 1,
        affected_units: { $size: '$unit_ids' },
        unit_ids: 1,
        last_occurrence: 1,
        total_cost: 1,
        avg_cost_per_incident: { $divide: ['$total_cost', '$occurrences'] }
      }
    },
    { $sort: { occurrences: -1 } }
  ]);

  return recurringIssues;
};

// Static method to get vendor performance
maintenanceTicketSchema.statics.getVendorPerformance = async function(propertyId = null) {
  const matchCondition = {
    assigned_to: { $exists: true, $ne: null },
    status: 'completed'
  };
  
  if (propertyId) {
    matchCondition.property_id = mongoose.Types.ObjectId(propertyId);
  }

  const performance = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$assigned_to.name',
        total_jobs: { $sum: 1 },
        completed_jobs: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        total_cost: { $sum: '$actual_cost' },
        avg_cost: { $avg: '$actual_cost' },
        avg_resolution_time: {
          $avg: {
            $divide: [{ $subtract: ['$completion_date', '$requested_date'] }, 1000 * 60 * 60 * 24]
          }
        },
        avg_landlord_rating: { $avg: '$landlord_rating' },
        avg_tenant_rating: { $avg: '$tenant_rating' },
        categories: { $addToSet: '$category' },
        first_job: { $min: '$requested_date' },
        last_job: { $max: '$completion_date' }
      }
    },
    {
      $project: {
        vendor_name: '$_id',
        total_jobs: 1,
        completion_rate: { $multiply: [{ $divide: ['$completed_jobs', '$total_jobs'] }, 100] },
        total_cost: 1,
        avg_cost: 1,
        avg_resolution_time: 1,
        avg_landlord_rating: 1,
        avg_tenant_rating: 1,
        specialties_count: { $size: '$categories' },
        categories: 1,
        first_job: 1,
        last_job: 1
      }
    },
    { $sort: { total_jobs: -1 } }
  ]);

  return performance;
};

// Static method to get maintenance trends
maintenanceTicketSchema.statics.getMaintenanceTrends = async function(propertyId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const trends = await this.aggregate([
    {
      $match: {
        property_id: mongoose.Types.ObjectId(propertyId),
        requested_date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$requested_date' },
          month: { $month: '$requested_date' }
        },
        total_tickets: { $sum: 1 },
        completed_tickets: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        urgent_tickets: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        },
        total_cost: { $sum: '$actual_cost' },
        avg_resolution_time: {
          $avg: {
            $cond: [
              { $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$completion_date', null] }] },
              { $divide: [{ $subtract: ['$completion_date', '$requested_date'] }, 1000 * 60 * 60 * 24] },
              null
            ]
          }
        }
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
        total_tickets: 1,
        completed_tickets: 1,
        urgent_tickets: 1,
        total_cost: 1,
        avg_resolution_time: 1,
        completion_rate: {
          $multiply: [{ $divide: ['$completed_tickets', '$total_tickets'] }, 100]
        }
      }
    },
    { $sort: { month: 1 } }
  ]);

  return trends;
};

// Pre-save hook to validate dates
maintenanceTicketSchema.pre('save', function(next) {
  if (this.scheduled_date && this.scheduled_date < this.requested_date) {
    return next(new Error('Scheduled date cannot be before requested date'));
  }
  
  if (this.completion_date && this.completion_date < this.requested_date) {
    return next(new Error('Completion date cannot be before requested date'));
  }
  
  if (this.warranty_expires && this.completion_date && this.warranty_expires <= this.completion_date) {
    return next(new Error('Warranty expiry must be after completion date'));
  }
  
  next();
});

module.exports = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);

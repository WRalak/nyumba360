const mongoose = require('mongoose');

const vacancyListingSchema = new mongoose.Schema({
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
    maxlength: 3000
  },
  monthly_rent: {
    type: Number,
    required: true,
    min: 0
  },
  security_deposit: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  available_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  listing_type: {
    type: String,
    enum: ['standard', 'featured', 'premium'],
    default: 'standard'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  featured_until: Date,
  views_count: {
    type: Number,
    default: 0
  },
  inquiries_count: {
    type: Number,
    default: 0
  },
  contact_info: {
    name: String,
    phone: String,
    email: String,
    preferred_contact: {
      type: String,
      enum: ['phone', 'email', 'whatsapp', 'sms'],
      default: 'phone'
    },
    show_phone: {
      type: Boolean,
      default: true
    },
    show_email: {
      type: Boolean,
      default: false
    }
  },
  amenities: [{
    type: String
  }],
  images: [{
    url: String,
    caption: String,
    is_primary: {
      type: Boolean,
      default: false
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  virtual_tour_url: String,
  floor_plan_url: String,
  lease_terms: {
    minimum_lease_months: {
      type: Number,
      default: 6
    },
    maximum_lease_months: Number,
    lease_type: {
      type: String,
      enum: ['fixed_term', 'month_to_month', 'flexible'],
      default: 'fixed_term'
    }
  },
  utilities: {
    water_included: {
      type: Boolean,
      default: false
    },
    electricity_included: {
      type: Boolean,
      default: false
    },
    garbage_included: {
      type: Boolean,
      default: false
    },
    internet_included: {
      type: Boolean,
      default: false
    },
    other_utilities: [String]
  },
  parking: {
    available: {
      type: Boolean,
      default: false
    },
    spaces: {
      type: Number,
      min: 0
    },
    type: {
      type: String,
      enum: ['street', 'garage', 'driveway', 'covered', 'secure'],
      default: 'street'
    },
    cost: {
      type: Number,
      min: 0
    }
  },
  pet_policy: {
    allowed: {
      type: Boolean,
      default: false
    },
    types_allowed: [String],
    deposit: {
      type: Number,
      min: 0
    },
    monthly_fee: {
      type: Number,
      min: 0
    },
    restrictions: String
  },
  requirements: {
    minimum_income: {
      type: Number,
      min: 0
    },
    credit_score_minimum: Number,
    background_check_required: {
      type: Boolean,
      default: true
    },
    references_required: {
      type: Boolean,
      default: true
    },
    employment_verification: {
      type: Boolean,
      default: true
    },
    other_requirements: [String]
  },
  location_highlights: [{
    name: String,
    distance: String,
    type: {
      type: String,
      enum: ['school', 'hospital', 'shopping', 'transport', 'park', 'restaurant', 'other']
    }
  }],
  neighborhood_info: {
    description: String,
    walk_score: Number,
    transit_score: Number,
    crime_rating: String
  },
  show_address: {
    type: Boolean,
    default: true
  },
  exact_address: String,
  neighborhood_area: String,
  nearby_landmarks: [String],
  promotion: {
    is_promoted: {
      type: Boolean,
      default: false
    },
    promotion_type: {
      type: String,
      enum: ['boost', 'highlight', 'urgent'],
      default: null
    },
    promotion_until: Date,
    promotion_budget: {
      type: Number,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'rented'],
    default: 'draft'
  },
  published_at: Date,
  closed_at: Date,
  rented_at: Date,
  tenant_info: {
    name: String,
    phone: String,
    email: String,
    lease_start_date: Date,
    lease_end_date: Date
  },
  viewing_schedule: [{
    date: Date,
    time_slot: String,
    max_attendees: {
      type: Number,
      default: 5
    },
    current_attendees: {
      type: Number,
      default: 0
    },
    is_available: {
      type: Boolean,
      default: true
    }
  }],
  inquiries: [{
    name: String,
    phone: String,
    email: String,
    message: String,
    preferred_contact: String,
    inquiry_date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'viewing_scheduled', 'application_submitted', 'rejected', 'approved'],
      default: 'new'
    },
    notes: String
  }],
  analytics: {
    daily_views: [{
      date: Date,
      views: Number
    }],
    source_breakdown: [{
      source: String,
      count: Number
    }],
    conversion_rate: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  tags: [{
    type: String
  }],
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
vacancyListingSchema.index({ property_id: 1, status: 1 });
vacancyListingSchema.index({ unit_id: 1, status: 1 });
vacancyListingSchema.index({ landlord_id: 1, status: 1 });
vacancyListingSchema.index({ is_active: 1, is_featured: 1 });
vacancyListingSchema.index({ monthly_rent: 1 });
vacancyListingSchema.index({ available_date: 1 });
vacancyListingSchema.index({ location: '2dsphere' });
vacancyListingSchema.index({ 'amenities': 'text', 'description': 'text', 'title': 'text' });

// Virtual for days listed
vacancyListingSchema.virtual('days_listed').get(function() {
  const startDate = this.published_at || this.createdAt;
  return Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for cost per month (including utilities)
vacancyListingSchema.virtual('total_monthly_cost').get(function() {
  let total = this.monthly_rent;
  if (this.parking.cost) total += this.parking.cost;
  if (this.pet_policy.monthly_fee) total += this.pet_policy.monthly_fee;
  return total;
});

// Static method to get active listings
vacancyListingSchema.statics.getActiveListings = function(filters = {}) {
  const query = { 
    is_active: true, 
    status: 'active',
    available_date: { $lte: new Date() }
  };

  if (filters.property_id) query.property_id = filters.property_id;
  if (filters.landlord_id) query.landlord_id = filters.landlord_id;
  if (filters.min_rent) query.monthly_rent = { $gte: filters.min_rent };
  if (filters.max_rent) query.monthly_rent = { ...query.monthly_rent, $lte: filters.max_rent };
  if (filters.amenities && filters.amenities.length > 0) {
    query.amenities = { $in: filters.amenities };
  }

  return this.find(query)
    .populate('property_id', 'property_name address coordinates')
    .populate('unit_id', 'unit_number unit_type size_sqft bedrooms bathrooms')
    .sort({ is_featured: -1, featured_until: -1, published_at: -1 });
};

// Static method to get featured listings
vacancyListingSchema.statics.getFeaturedListings = function(limit = 10) {
  return this.find({
    is_active: true,
    status: 'active',
    is_featured: true,
    $or: [
      { featured_until: { $gte: new Date() } },
      { featured_until: null }
    ]
  })
    .populate('property_id', 'property_name address')
    .populate('unit_id', 'unit_number unit_type monthly_rent')
    .sort({ featured_until: -1, published_at: -1 })
    .limit(limit);
};

// Static method to search listings
vacancyListingSchema.statics.searchListings = function(searchTerm, filters = {}) {
  const query = {
    is_active: true,
    status: 'active',
    $text: { $search: searchTerm }
  };

  // Apply additional filters
  if (filters.property_id) query.property_id = filters.property_id;
  if (filters.min_rent) query.monthly_rent = { $gte: filters.min_rent };
  if (filters.max_rent) query.monthly_rent = { ...query.monthly_rent, $lte: filters.max_rent };
  if (filters.bedrooms) {
    // Need to populate unit to filter by bedrooms
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('property_id', 'property_name address')
    .populate('unit_id', 'unit_number unit_type size_sqft bedrooms bathrooms')
    .sort({ score: { $meta: 'textScore' } });
};

// Static method to get listing analytics
vacancyListingSchema.statics.getListingAnalytics = async function(landlordId, propertyId = null) {
  const matchCondition = { landlord_id: mongoose.Types.ObjectId(landlordId) };
  if (propertyId) {
    matchCondition.property_id = mongoose.Types.ObjectId(propertyId);
  }

  const analytics = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        total_listings: { $sum: 1 },
        active_listings: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        featured_listings: {
          $sum: { $cond: ['$is_featured', 1, 0] }
        },
        total_views: { $sum: '$views_count' },
        total_inquiries: { $sum: '$inquiries_count' },
        avg_monthly_rent: { $avg: '$monthly_rent' },
        listings_rented: {
          $sum: { $cond: [{ $eq: ['$status', 'rented'] }, 1, 0] }
        }
      }
    }
  ]);

  return analytics[0] || {
    total_listings: 0,
    active_listings: 0,
    featured_listings: 0,
    total_views: 0,
    total_inquiries: 0,
    avg_monthly_rent: 0,
    listings_rented: 0
  };
};

// Static method to get performance metrics
vacancyListingSchema.statics.getPerformanceMetrics = async function(landlordId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const metrics = await this.aggregate([
    {
      $match: {
        landlord_id: mongoose.Types.ObjectId(landlordId),
        published_at: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$published_at' },
          month: { $month: '$published_at' }
        },
        listings_published: { $sum: 1 },
        total_views: { $sum: '$views_count' },
        total_inquiries: { $sum: '$inquiries_count' },
        listings_rented: {
          $sum: { $cond: [{ $eq: ['$status', 'rented'] }, 1, 0] }
        },
        avg_rent: { $avg: '$monthly_rent' }
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
        listings_published: 1,
        total_views: 1,
        total_inquiries: 1,
        listings_rented: 1,
        avg_rent: 1,
        avg_views_per_listing: { $divide: ['$total_views', '$listings_published'] },
        conversion_rate: {
          $multiply: [
            { $divide: ['$listings_rented', '$listings_published'] },
            100
          ]
        }
      }
    },
    { $sort: { month: 1 } }
  ]);

  return metrics;
};

// Pre-save hook to validate dates
vacancyListingSchema.pre('save', function(next) {
  if (this.available_date && this.available_date < new Date()) {
    return next(new Error('Available date cannot be in the past'));
  }
  
  if (this.featured_until && this.featured_until <= new Date()) {
    this.is_featured = false;
  }
  
  if (this.promotion.promotion_until && this.promotion.promotion_until <= new Date()) {
    this.promotion.is_promoted = false;
  }
  
  next();
});

// Post-save hook to update unit vacancy status
vacancyListingSchema.post('save', async function() {
  if (this.status === 'rented') {
    await mongoose.model('RentalUnit').findByIdAndUpdate(this.unit_id, {
      is_vacant: false
    });
  } else if (this.status === 'active' || this.status === 'draft') {
    await mongoose.model('RentalUnit').findByIdAndUpdate(this.unit_id, {
      is_vacant: true
    });
  }
});

module.exports = mongoose.model('VacancyListing', vacancyListingSchema);

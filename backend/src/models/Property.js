const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Add index for faster queries
  },
  property_name: {
    type: String,
    required: true,
    trim: true
  },
  property_type: {
    type: String,
    enum: ['apartment', 'house', 'commercial', 'land', 'townhouse', 'studio'],
    required: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    county: {
      type: String,
      required: true
    },
    postal_code: String,
    country: {
      type: String,
      default: 'Kenya'
    }
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  total_units: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    maxlength: 2000
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
    }
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  management_fee: {
    type: Number,
    default: 0
  },
  maintenance_reserve: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for units
propertySchema.virtual('units', {
  ref: 'RentalUnit',
  localField: '_id',
  foreignField: 'property_id'
});

// Static method to get property stats
propertySchema.statics.getPropertyStats = async function(propertyId) {
  const stats = await mongoose.model('RentalUnit').aggregate([
    { $match: { property_id: mongoose.Types.ObjectId(propertyId), is_active: true } },
    {
      $group: {
        _id: null,
        total_units: { $sum: 1 },
        vacant_units: { $sum: { $cond: ['$is_vacant', 1, 0] } },
        occupied_units: { $sum: { $cond: ['$is_vacant', 0, 1] } },
        total_potential_rent: { $sum: '$monthly_rent' },
        current_monthly_rent: {
          $sum: { $cond: ['$is_vacant', 0, '$monthly_rent'] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    total_units: 0,
    vacant_units: 0,
    occupied_units: 0,
    total_potential_rent: 0,
    current_monthly_rent: 0
  };
};

// Static method to get occupancy rate
propertySchema.statics.getOccupancyRate = async function(propertyId) {
  const stats = await this.getPropertyStats(propertyId);
  if (!stats || stats.total_units === 0) return 0;
  
  return Math.round((stats.occupied_units / stats.total_units) * 100);
};

// Static method to get monthly income
propertySchema.statics.getMonthlyIncome = async function(propertyId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const income = await mongoose.model('RentPayment').aggregate([
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
        _id: {
          year: { $year: '$payment_date' },
          month: { $month: '$payment_date' }
        },
        total_income: { $sum: '$amount' },
        month: { $first: '$payment_date' }
      }
    },
    { $sort: { month: -1 } }
  ]);
  
  return income;
};

module.exports = mongoose.model('Property', propertySchema);

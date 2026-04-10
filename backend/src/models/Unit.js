const mongoose = require('mongoose');

const rentalUnitSchema = new mongoose.Schema({
  property_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  unit_number: {
    type: String,
    required: true,
    trim: true
  },
  unit_type: {
    type: String,
    enum: ['studio', '1-bedroom', '2-bedroom', '3-bedroom', '4-bedroom', 'penthouse', 'commercial'],
    required: true
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
  size_sqft: {
    type: Number,
    min: 0
  },
  bedrooms: {
    type: Number,
    min: 0,
    default: 0
  },
  bathrooms: {
    type: Number,
    min: 0,
    default: 0
  },
  floor_number: {
    type: Number,
    min: 0
  },
  is_vacant: {
    type: Boolean,
    default: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  amenities: [{
    type: String
  }],
  images: [{
    url: String,
    caption: String
  }],
  utilities_included: [{
    type: String
  }],
  parking_spaces: {
    type: Number,
    default: 0
  },
  pet_friendly: {
    type: Boolean,
    default: false
  },
  furnished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
rentalUnitSchema.index({ property_id: 1, unit_number: 1 });
rentalUnitSchema.index({ is_vacant: 1, is_active: 1 });

// Static method to update property unit count
rentalUnitSchema.statics.updatePropertyUnitCount = async function(propertyId) {
  const count = await this.countDocuments({ property_id: propertyId, is_active: true });
  await mongoose.model('Property').findByIdAndUpdate(propertyId, { 
    total_units: count,
    updated_at: new Date()
  });
};

// Post-save hook to update property unit count
rentalUnitSchema.post('save', async function() {
  await this.constructor.updatePropertyUnitCount(this.property_id);
});

// Post-remove hook to update property unit count
rentalUnitSchema.post('remove', async function() {
  await this.constructor.updatePropertyUnitCount(this.property_id);
});

// Static method to get vacant units
rentalUnitSchema.statics.getVacantUnits = function(propertyId = null) {
  let query = this.find({ is_vacant: true, is_active: true })
    .populate('property_id', 'property_name address');
  
  if (propertyId) {
    query = query.where({ property_id: propertyId });
  }
  
  return query.sort({ 'property_id.property_name': 1, unit_number: 1 });
};

// Static method to get occupied units
rentalUnitSchema.statics.getOccupiedUnits = function(propertyId = null) {
  let query = this.find({ is_vacant: false, is_active: true })
    .populate({
      path: 'property_id',
      select: 'property_name address'
    })
    .populate({
      path: 'current_lease',
      match: { status: 'active' },
      populate: {
        path: 'tenant_id',
        select: 'first_name last_name phone'
      }
    });
  
  if (propertyId) {
    query = query.where({ property_id: propertyId });
  }
  
  return query.sort({ 'property_id.property_name': 1, unit_number: 1 });
};

// Virtual for current lease
rentalUnitSchema.virtual('current_lease', {
  ref: 'LeaseAgreement',
  localField: '_id',
  foreignField: 'unit_id',
  match: { status: 'active' }
});

module.exports = mongoose.model('RentalUnit', rentalUnitSchema);

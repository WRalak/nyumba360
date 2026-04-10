const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Core Identity
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Basic Profile
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
  display_name: {
    type: String,
    trim: true
  },
  
  // User Role & Status
  user_type: {
    type: String,
    enum: ['landlord', 'tenant', 'admin', 'property_manager', 'maintenance', 'agent'],
    default: 'landlord'
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'user'],
    default: 'user'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_suspended: {
    type: Boolean,
    default: false
  },
  suspension_reason: {
    type: String
  },
  
  // Verification Status
  email_verified: {
    type: Boolean,
    default: false
  },
  phone_verified: {
    type: Boolean,
    default: false
  },
  identity_verified: {
    type: Boolean,
    default: false
  },
  verification_documents: [{
    type: String, // URLs to uploaded documents
    verified: {
      type: Boolean,
      default: false
    },
    document_type: {
      type: String,
      enum: ['id_card', 'passport', 'driving_license', 'utility_bill']
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Profile Information
  profile_image: {
    type: String
  },
  date_of_birth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  nationality: {
    type: String
  },
  
  // Location Information
  address: {
    street: String,
    city: String,
    state: String,
    postal_code: String,
    country: {
      type: String,
      default: 'Kenya'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Communication Preferences
  preferences: {
    email_notifications: {
      type: Boolean,
      default: true
    },
    sms_notifications: {
      type: Boolean,
      default: true
    },
    marketing_emails: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Africa/Nairobi'
    },
    currency: {
      type: String,
      default: 'KES'
    }
  },
  
  // Security Settings
  two_factor_enabled: {
    type: Boolean,
    default: false
  },
  two_factor_secret: {
    type: String
  },
  backup_codes: [String],
  last_login: {
    type: Date
  },
  login_attempts: {
    type: Number,
    default: 0
  },
  lock_until: {
    type: Date
  },
  
  // Social Authentication
  google_id: {
    type: String
  },
  facebook_id: {
    type: String
  },
  apple_id: {
    type: String
  },
  
  // Password Reset
  reset_password_token: {
    type: String
  },
  reset_password_expires: {
    type: Date
  },
  
  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    starts_at: Date,
    ends_at: Date,
    auto_renew: {
      type: Boolean,
      default: false
    }
  },
  
  // API Access
  api_keys: [{
    name: String,
    key: String,
    permissions: [String],
    created_at: {
      type: Date,
      default: Date.now
    },
    last_used: Date,
    is_active: {
      type: Boolean,
      default: true
    }
  }],
  
  // User Statistics
  stats: {
    total_properties: {
      type: Number,
      default: 0
    },
    total_units: {
      type: Number,
      default: 0
    },
    total_tenants: {
      type: Number,
      default: 0
    },
    total_revenue: {
      type: Number,
      default: 0
    },
    last_activity: {
      type: Date,
      default: Date.now
    }
  },
  
  // Privacy Settings
  privacy: {
    profile_visibility: {
      type: String,
      enum: ['public', 'private', 'contacts_only'],
      default: 'private'
    },
    show_phone: {
      type: Boolean,
      default: false
    },
    show_email: {
      type: Boolean,
      default: false
    }
  },
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'admin'],
      default: 'web'
    },
    referral_code: String,
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Virtual fields
userSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

userSchema.virtual('age').get(function() {
  if (!this.date_of_birth) return null;
  return Math.floor((Date.now() - this.date_of_birth) / (365.25 * 24 * 60 * 60 * 1000));
});

userSchema.virtual('is_locked').get(function() {
  return !!(this.lock_until && this.lock_until > Date.now());
});

userSchema.virtual('subscription_active').get(function() {
  if (!this.subscription) return false;
  return this.subscription.status === 'active' && 
         (!this.subscription.ends_at || this.subscription.ends_at > new Date());
});

// Update last activity on save
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.stats.last_activity = new Date();
  }
  next();
});

// Method to verify password
userSchema.methods.verifyPassword = async function(plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// Method to check if user can login
userSchema.methods.canLogin = function() {
  return this.is_active && 
         !this.is_suspended && 
         !this.is_locked;
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lock_until && this.lock_until < Date.now()) {
    return this.updateOne({
      $unset: { lock_until: 1 },
      $set: { login_attempts: 1 }
    });
  }
  
  const updates = { $inc: { login_attempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.login_attempts + 1 >= 5 && !this.is_locked) {
    updates.$set = { lock_until: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { login_attempts: 1, lock_until: 1 },
    $set: { last_login: new Date() }
  });
};

// Method to update user stats
userSchema.methods.updateStats = async function() {
  const Property = mongoose.model('Property');
  const Tenant = mongoose.model('Tenant');
  const Payment = mongoose.model('Payment');
  
  const [propertyCount, unitCount, tenantCount, revenue] = await Promise.all([
    Property.countDocuments({ owner_id: this._id, is_active: true }),
    Property.aggregate([
      { $match: { owner_id: this._id, is_active: true } },
      { $group: { _id: null, total: { $sum: '$total_units' } } }
    ]),
    Tenant.countDocuments({ landlord_id: this._id, is_active: true }),
    Payment.aggregate([
      { $match: { landlord_id: this._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);
  
  this.stats.total_properties = propertyCount;
  this.stats.total_units = unitCount[0]?.total || 0;
  this.stats.total_tenants = tenantCount;
  this.stats.total_revenue = revenue[0]?.total || 0;
  this.stats.last_activity = new Date();
  
  return this.save();
};

// Method to get user's notifications
userSchema.methods.getNotifications = function(options = {}) {
  const Notification = mongoose.model('Notification');
  const query = { 
    $or: [
      { recipient: this.email },
      { recipient: this.phone },
      { sentBy: this._id }
    ]
  };
  
  if (options.type) query.type = options.type;
  if (options.status) query.status = options.status;
  if (options.limit) query.limit = options.limit;
  
  return Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Method to get user's properties with data isolation
userSchema.methods.getProperties = function(options = {}) {
  const Property = mongoose.model('Property');
  const query = { owner_id: this._id };
  
  if (options.is_active !== undefined) query.is_active = options.is_active;
  if (options.status) query.status = options.status;
  
  return Property.find(query)
    .populate('units')
    .sort({ created_at: -1 });
};

// Method to get user's tenants
userSchema.methods.getTenants = function(options = {}) {
  const Tenant = mongoose.model('Tenant');
  const query = { landlord_id: this._id };
  
  if (options.is_active !== undefined) query.is_active = options.is_active;
  if (options.property_id) query.property_id = options.property_id;
  
  return Tenant.find(query)
    .populate('property_id')
    .sort({ created_at: -1 });
};

// Method to get user's payments
userSchema.methods.getPayments = function(options = {}) {
  const Payment = mongoose.model('Payment');
  const query = { landlord_id: this._id };
  
  if (options.status) query.status = options.status;
  if (options.property_id) query.property_id = options.property_id;
  if (options.tenant_id) query.tenant_id = options.tenant_id;
  if (options.date_from) query.payment_date = { $gte: options.date_from };
  if (options.date_to) query.payment_date = { ...query.payment_date, $lte: options.date_to };
  
  return Payment.find(query)
    .populate('tenant_id property_id')
    .sort({ payment_date: -1 });
};

// Method to get user's maintenance requests
userSchema.methods.getMaintenanceRequests = function(options = {}) {
  const Maintenance = mongoose.model('Maintenance');
  const query = { landlord_id: this._id };
  
  if (options.status) query.status = options.status;
  if (options.property_id) query.property_id = options.property_id;
  if (options.tenant_id) query.tenant_id = options.tenant_id;
  
  return Maintenance.find(query)
    .populate('tenant_id property_id')
    .sort({ created_at: -1 });
};

// Method to get user profile (public data)
userSchema.methods.getPublicProfile = function() {
  const publicData = {
    _id: this._id,
    display_name: this.display_name || this.full_name,
    profile_image: this.profile_image,
    user_type: this.user_type,
    stats: {
      total_properties: this.stats.total_properties,
      total_units: this.stats.total_units
    }
  };
  
  // Add contact info if privacy allows
  if (this.privacy.show_phone) {
    publicData.phone = this.phone;
  }
  if (this.privacy.show_email) {
    publicData.email = this.email;
  }
  
  return publicData;
};

// Method to update notification preferences
userSchema.methods.updateNotificationPreferences = async function(preferences) {
  Object.keys(preferences).forEach(key => {
    if (this.preferences.hasOwnProperty(key)) {
      this.preferences[key] = preferences[key];
    }
  });
  
  return this.save();
};

// Method to check subscription permissions
userSchema.methods.hasPermission = function(permission) {
  const permissions = {
    free: ['view_properties', 'create_tenant', 'view_payments'],
    basic: ['view_properties', 'create_tenant', 'view_payments', 'send_notifications'],
    premium: ['view_properties', 'create_tenant', 'view_payments', 'send_notifications', 'bulk_operations', 'advanced_analytics'],
    enterprise: ['*'] // All permissions
  };
  
  const userPermissions = permissions[this.subscription?.plan] || permissions.free;
  
  return userPermissions.includes('*') || userPermissions.includes(permission);
};

// Method to sanitize user data for output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.two_factor_secret;
  delete user.backup_codes;
  delete user.reset_password_token;
  delete user.reset_password_expires;
  delete user.api_keys;
  delete user.login_attempts;
  delete user.lock_until;
  
  return user;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by phone
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

// Static method to find by referral code
userSchema.statics.findByReferralCode = function(code) {
  return this.findOne({ 'metadata.referral_code': code });
};

// Static method to get user statistics
userSchema.statics.getUserStats = async function(userId) {
  const user = await this.findById(userId);
  if (!user) return null;
  
  await user.updateStats();
  return user.stats;
};

// Static method to search users (with privacy)
userSchema.statics.searchUsers = function(query, options = {}) {
  const searchQuery = {
    is_active: true,
    is_suspended: false,
    $or: [
      { first_name: { $regex: query, $options: 'i' } },
      { last_name: { $regex: query, $options: 'i' } },
      { display_name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  };
  
  if (options.user_type) {
    searchQuery.user_type = options.user_type;
  }
  
  return this.find(searchQuery)
    .select('display_name profile_image user_type stats')
    .limit(options.limit || 20);
};

// Static method to get landlord properties
userSchema.statics.getLandlordProperties = function(landlordId) {
  return mongoose.model('Property').find({ owner_id: landlordId, is_active: true })
    .sort({ created_at: -1 });
};

// Static method to get property stats
userSchema.statics.getPropertyStats = async function(landlordId) {
  const stats = await mongoose.model('Property').aggregate([
    { $match: { owner_id: mongoose.Types.ObjectId(landlordId) } },
    {
      $group: {
        _id: null,
        total_properties: { $sum: 1 },
        total_units: { $sum: '$total_units' },
        active_properties: {
          $sum: { $cond: ['$is_active', 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    total_properties: 0,
    total_units: 0,
    active_properties: 0
  };
};

module.exports = mongoose.model('User', userSchema);

const jwt = require('jsonwebtoken');
const User = require('../models/User');

class DataIsolationMiddleware {
  // Middleware to ensure user can only access their own data
  static async requireOwnership(req, res, next) {
    try {
      const user = req.user;
      const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
      
      // Admin can access all data
      if (user.role === 'admin' || user.role === 'super_admin') {
        return next();
      }
      
      // Users can only access their own data
      if (resourceUserId && resourceUserId !== user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own data'
        });
      }
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking data ownership',
        error: error.message
      });
    }
  }

  // Middleware to filter data by user ownership
  static async filterByUser(req, res, next) {
    try {
      const user = req.user;
      
      // Admin can see all data
      if (user.role === 'admin' || user.role === 'super_admin') {
        req.userFilter = {};
        return next();
      }
      
      // Regular users can only see their own data
      req.userFilter = {
        $or: [
          { owner_id: user._id },
          { landlord_id: user._id },
          { tenant_id: user._id },
          { user_id: user._id },
          { created_by: user._id }
        ]
      };
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error setting user filter',
        error: error.message
      });
    }
  }

  // Middleware to check if user has permission for specific resource
  static async checkResourcePermission(resourceType, action) {
    return async (req, res, next) => {
      try {
        const user = req.user;
        const resourceId = req.params.id || req.params.propertyId || req.params.tenantId;
        
        // Admin bypass
        if (user.role === 'admin' || user.role === 'super_admin') {
          return next();
        }
        
        // Check subscription-based permissions
        if (!user.hasPermission(action)) {
          return res.status(403).json({
            success: false,
            message: `Permission denied: ${action} requires ${action.replace('_', ' ')} subscription`
          });
        }
        
        // Check resource ownership based on type
        let resource;
        switch (resourceType) {
          case 'property':
            resource = await mongoose.model('Property').findById(resourceId);
            if (!resource || resource.owner_id.toString() !== user._id.toString()) {
              return res.status(404).json({
                success: false,
                message: 'Property not found or access denied'
              });
            }
            break;
            
          case 'tenant':
            resource = await mongoose.model('Tenant').findById(resourceId);
            if (!resource || resource.landlord_id.toString() !== user._id.toString()) {
              return res.status(404).json({
                success: false,
                message: 'Tenant not found or access denied'
              });
            }
            break;
            
          case 'payment':
            resource = await mongoose.model('Payment').findById(resourceId);
            if (!resource || resource.landlord_id.toString() !== user._id.toString()) {
              return res.status(404).json({
                success: false,
                message: 'Payment not found or access denied'
              });
            }
            break;
            
          case 'maintenance':
            resource = await mongoose.model('Maintenance').findById(resourceId);
            if (!resource || resource.landlord_id.toString() !== user._id.toString()) {
              return res.status(404).json({
                success: false,
                message: 'Maintenance request not found or access denied'
              });
            }
            break;
            
          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid resource type'
            });
        }
        
        req.resource = resource;
        next();
        
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error checking resource permission',
          error: error.message
        });
      }
    };
  }

  // Middleware to validate user access to notifications
  static async validateNotificationAccess(req, res, next) {
    try {
      const user = req.user;
      
      // Admin can access all notifications
      if (user.role === 'admin' || user.role === 'super_admin') {
        return next();
      }
      
      // Users can only access their own notifications
      const query = {
        $or: [
          { recipient: user.email },
          { recipient: user.phone },
          { sentBy: user._id }
        ]
      };
      
      // Add query to request for controllers to use
      req.notificationQuery = query;
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating notification access',
        error: error.message
      });
    }
  }

  // Middleware to ensure user profile privacy
  static async enforceProfilePrivacy(req, res, next) {
    try {
      const viewer = req.user;
      const targetUserId = req.params.userId || req.params.id;
      
      // If viewing own profile, allow full access
      if (targetUserId === viewer._id.toString()) {
        return next();
      }
      
      // Get target user
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check privacy settings
      if (targetUser.privacy.profile_visibility === 'private') {
        return res.status(403).json({
          success: false,
          message: 'This profile is private'
        });
      }
      
      if (targetUser.privacy.profile_visibility === 'contacts_only') {
        // Check if they are contacts (implement contact logic)
        const areContacts = await this.checkIfContacts(viewer._id, targetUserId);
        if (!areContacts) {
          return res.status(403).json({
            success: false,
            message: 'This profile is only visible to contacts'
          });
        }
      }
      
      // Filter sensitive data based on privacy settings
      req.filteredUserData = targetUser.getPublicProfile();
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error enforcing profile privacy',
        error: error.message
      });
    }
  }

  // Helper method to check if users are contacts
  static async checkIfContacts(userId1, userId2) {
    // Implement contact checking logic
    // This could check if they have properties together, payments, etc.
    try {
      const Property = mongoose.model('Property');
      const Tenant = mongoose.model('Tenant');
      
      // Check if they have landlord-tenant relationship
      const relationship = await Property.findOne({
        $or: [
          { owner_id: userId1, 'tenants.tenant_id': userId2 },
          { owner_id: userId2, 'tenants.tenant_id': userId1 }
        ]
      });
      
      return !!relationship;
    } catch (error) {
      return false;
    }
  }

  // Middleware to validate API key access
  static async validateApiKey(req, res, next) {
    try {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API key required'
        });
      }
      
      const user = await User.findOne({
        'api_keys.key': apiKey,
        'api_keys.is_active': true
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key'
        });
      }
      
      // Update last used timestamp
      await User.updateOne(
        { 'api_keys.key': apiKey },
        { 'api_keys.$.last_used': new Date() }
      );
      
      // Get the specific API key object
      const apiKeyObj = user.api_keys.find(key => key.key === apiKey);
      
      // Set user and permissions
      req.user = user;
      req.apiKey = apiKeyObj;
      req.isApiKeyRequest = true;
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating API key',
        error: error.message
      });
    }
  }

  // Middleware to check subscription limits
  static async checkSubscriptionLimits(resourceType) {
    return async (req, res, next) => {
      try {
        const user = req.user;
        
        // Get current usage
        const currentUsage = await this.getResourceUsage(user._id, resourceType);
        const limits = this.getSubscriptionLimits(user.subscription?.plan || 'free');
        const limit = limits[resourceType];
        
        if (limit !== -1 && currentUsage >= limit) {
          return res.status(429).json({
            success: false,
            message: `Subscription limit reached for ${resourceType}. Upgrade your plan to continue.`,
            currentUsage,
            limit
          });
        }
        
        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error checking subscription limits',
          error: error.message
        });
      }
    };
  }

  // Helper method to get resource usage
  static async getResourceUsage(userId, resourceType) {
    try {
      switch (resourceType) {
        case 'properties':
          return await mongoose.model('Property').countDocuments({ owner_id: userId });
        case 'tenants':
          return await mongoose.model('Tenant').countDocuments({ landlord_id: userId });
        case 'notifications':
          return await mongoose.model('Notification').countDocuments({
            $or: [
              { recipient: userId },
              { sentBy: userId }
            ],
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
          });
        case 'api_keys':
          const user = await User.findById(userId);
          return user.api_keys ? user.api_keys.filter(key => key.is_active).length : 0;
        default:
          return 0;
      }
    } catch (error) {
      return 0;
    }
  }

  // Helper method to get subscription limits
  static getSubscriptionLimits(plan) {
    const limits = {
      free: {
        properties: 5,
        tenants: 20,
        notifications: 100,
        api_keys: 1
      },
      basic: {
        properties: 20,
        tenants: 100,
        notifications: 1000,
        api_keys: 3
      },
      premium: {
        properties: 100,
        tenants: 500,
        notifications: 10000,
        api_keys: 10
      },
      enterprise: {
        properties: -1, // Unlimited
        tenants: -1,
        notifications: -1,
        api_keys: -1
      }
    };
    
    return limits[plan] || limits.free;
  }

  // Middleware to log data access for audit
  static async logDataAccess(req, res, next) {
    try {
      const user = req.user;
      const resource = req.originalUrl;
      const method = req.method;
      const isApiKeyRequest = req.isApiKeyRequest;
      
      // Log access (implement logging logic)
      console.log('Data Access Log:', {
        userId: user._id,
        email: user.email,
        resource,
        method,
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        isApiKeyRequest
      });
      
      next();
    } catch (error) {
      // Don't block the request for logging errors
      console.error('Logging error:', error);
      next();
    }
  }

  // Middleware to validate user session
  static async validateSession(req, res, next) {
    try {
      const user = req.user;
      
      // Check if user is still active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }
      
      // Check if user is suspended
      if (user.is_suspended) {
        return res.status(403).json({
          success: false,
          message: 'Account has been suspended',
          reason: user.suspension_reason
        });
      }
      
      // Check if account is locked
      if (user.is_locked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts'
        });
      }
      
      // Update last activity
      user.stats.last_activity = new Date();
      await user.save();
      
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error validating session',
        error: error.message
      });
    }
  }
}

module.exports = DataIsolationMiddleware;

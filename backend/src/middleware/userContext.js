const User = require('../models/User');

class UserContext {
  // Middleware to set user context for all requests
  static async setUserContext(req, res, next) {
    try {
      // Skip for non-authenticated routes
      if (!req.user) {
        return next();
      }

      // Get full user with updated stats
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check user status
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      if (user.is_suspended) {
        return res.status(403).json({
          success: false,
          message: 'Account has been suspended',
          reason: user.suspension_reason
        });
      }

      if (user.is_locked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked'
        });
      }

      // Set user context
      req.userContext = {
        id: user._id,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        role: user.role,
        subscription: user.subscription,
        permissions: this.getUserPermissions(user),
        dataScope: this.getDataScope(user),
        preferences: user.preferences,
        privacy: user.privacy
      };

      // Update last activity
      user.stats.last_activity = new Date();
      await user.save();

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error setting user context',
        error: error.message
      });
    }
  }

  // Get user permissions based on subscription and role
  static getUserPermissions(user) {
    const basePermissions = {
      free: ['view_profile', 'edit_profile', 'view_own_properties', 'create_property', 'view_own_tenants', 'create_tenant', 'view_own_payments'],
      basic: ['view_profile', 'edit_profile', 'view_own_properties', 'create_property', 'view_own_tenants', 'create_tenant', 'view_own_payments', 'send_notifications', 'basic_analytics'],
      premium: ['view_profile', 'edit_profile', 'view_own_properties', 'create_property', 'view_own_tenants', 'create_tenant', 'view_own_payments', 'send_notifications', 'basic_analytics', 'bulk_operations', 'advanced_analytics', 'export_data'],
      enterprise: ['*']
    };

    const rolePermissions = {
      super_admin: ['*'],
      admin: ['manage_users', 'view_all_data', 'system_settings', 'analytics'],
      manager: ['manage_properties', 'view_team_data', 'team_analytics'],
      user: []
    };

    const subscriptionPerms = basePermissions[user.subscription?.plan] || basePermissions.free;
    const rolePerms = rolePermissions[user.role] || [];

    // Combine permissions
    const allPermissions = new Set([...subscriptionPerms, ...rolePerms]);

    // Add role-specific overrides
    if (user.role === 'admin' || user.role === 'super_admin') {
      allPermissions.add('view_all_data');
      allPermissions.add('manage_users');
    }

    return Array.from(allPermissions);
  }

  // Get data scope for user
  static getDataScope(user) {
    if (user.role === 'admin' || user.role === 'super_admin') {
      return 'all';
    }

    if (user.role === 'manager') {
      return 'team';
    }

    return 'own';
  }

  // Middleware to check user permissions
  static requirePermission(permission) {
    return (req, res, next) => {
      try {
        const userContext = req.userContext;

        if (!userContext) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        if (!userContext.permissions.includes('*') && !userContext.permissions.includes(permission)) {
          return res.status(403).json({
            success: false,
            message: `Permission denied: ${permission} required`,
            requiredPermission: permission,
            userPermissions: userContext.permissions
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error checking permissions',
          error: error.message
        });
      }
    };
  }

  // Middleware to check data scope
  static requireDataScope(scope) {
    return (req, res, next) => {
      try {
        const userContext = req.userContext;

        if (!userContext) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        if (userContext.dataScope !== 'all' && userContext.dataScope !== scope) {
          return res.status(403).json({
            success: false,
            message: `Data scope denied: ${scope} required`,
            requiredScope: scope,
            userScope: userContext.dataScope
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error checking data scope',
          error: error.message
        });
      }
    };
  }

  // Middleware to filter queries by user context
  static filterQueryByUserContext(req, res, next) {
    try {
      const userContext = req.userContext;

      if (!userContext) {
        return next();
      }

      // Set query filter based on data scope
      switch (userContext.dataScope) {
        case 'all':
          // Admin can see all data
          req.queryFilter = {};
          break;
        case 'team':
          // Manager can see team data (implement team logic)
          req.queryFilter = {
            $or: [
              { owner_id: userContext.id },
              { team_members: userContext.id }
            ]
          };
          break;
        case 'own':
        default:
          // Regular users can only see their own data
          req.queryFilter = {
            $or: [
              { owner_id: userContext.id },
              { landlord_id: userContext.id },
              { tenant_id: userContext.id },
              { user_id: userContext.id },
              { created_by: userContext.id }
            ]
          };
          break;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error filtering query',
        error: error.message
      });
    }
  }

  // Middleware to validate subscription limits
  static validateSubscriptionLimits(resource) {
    return async (req, res, next) => {
      try {
        const userContext = req.userContext;

        if (!userContext) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Get current usage
        const currentUsage = await this.getResourceUsage(userContext.id, resource);
        const limits = this.getSubscriptionLimits(userContext.subscription?.plan || 'free');
        const limit = limits[resource];

        if (limit !== -1 && currentUsage >= limit) {
          return res.status(429).json({
            success: false,
            message: `Subscription limit reached for ${resource}. Upgrade your plan to continue.`,
            currentUsage,
            limit,
            subscriptionPlan: userContext.subscription?.plan
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error validating subscription limits',
          error: error.message
        });
      }
    };
  }

  // Helper method to get resource usage
  static async getResourceUsage(userId, resource) {
    try {
      const models = {
        properties: mongoose.model('Property'),
        tenants: mongoose.model('Tenant'),
        payments: mongoose.model('Payment'),
        notifications: mongoose.model('Notification'),
        api_keys: User
      };

      const Model = models[resource];
      if (!Model) return 0;

      let query = {};
      
      switch (resource) {
        case 'properties':
          query = { owner_id: userId };
          break;
        case 'tenants':
          query = { landlord_id: userId };
          break;
        case 'payments':
          query = { landlord_id: userId };
          break;
        case 'notifications':
          query = {
            $or: [
              { recipient: userId },
              { sentBy: userId }
            ],
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          };
          break;
        case 'api_keys':
          const user = await User.findById(userId);
          return user.api_keys ? user.api_keys.filter(key => key.is_active).length : 0;
        default:
          return 0;
      }

      return await Model.countDocuments(query);
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
        payments: 100,
        notifications: 100,
        api_keys: 1
      },
      basic: {
        properties: 20,
        tenants: 100,
        payments: 500,
        notifications: 1000,
        api_keys: 3
      },
      premium: {
        properties: 100,
        tenants: 500,
        payments: 2000,
        notifications: 10000,
        api_keys: 10
      },
      enterprise: {
        properties: -1, // Unlimited
        tenants: -1,
        payments: -1,
        notifications: -1,
        api_keys: -1
      }
    };

    return limits[plan] || limits.free;
  }

  // Middleware to validate user access to specific resource
  static validateResourceAccess(resourceType) {
    return async (req, res, next) => {
      try {
        const userContext = req.userContext;
        const resourceId = req.params.id || req.params.propertyId || req.params.tenantId;

        if (!userContext) {
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Admin can access all resources
        if (userContext.dataScope === 'all') {
          return next();
        }

        // Validate resource ownership
        const hasAccess = await this.checkResourceOwnership(userContext.id, resourceId, resourceType);
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Resource not found or access restricted',
            resourceType,
            resourceId
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Error validating resource access',
          error: error.message
        });
      }
    };
  }

  // Helper method to check resource ownership
  static async checkResourceOwnership(userId, resourceId, resourceType) {
    try {
      const models = {
        property: mongoose.model('Property'),
        tenant: mongoose.model('Tenant'),
        payment: mongoose.model('Payment'),
        maintenance: mongoose.model('Maintenance')
      };

      const Model = models[resourceType];
      if (!Model) return false;

      const resource = await Model.findById(resourceId);
      if (!resource) return false;

      // Check ownership based on resource type
      switch (resourceType) {
        case 'property':
          return resource.owner_id.toString() === userId.toString();
        case 'tenant':
          return resource.landlord_id.toString() === userId.toString();
        case 'payment':
          return resource.landlord_id.toString() === userId.toString();
        case 'maintenance':
          return resource.landlord_id.toString() === userId.toString();
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}

module.exports = UserContext;

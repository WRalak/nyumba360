const { validationResult } = require('express-validator');
const db = require('../config/database');

class AdminController {
  static async getSystemStats(req, res) {
    try {
      // Verify admin access
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required'
        });
      }

      const stats = await Promise.all([
        // User stats
        db('users').count('* as total_users'),
        db('users').where({ user_type: 'landlord' }).count('* as total_landlords'),
        db('users').where({ user_type: 'tenant' }).count('* as total_tenants'),
        
        // Property stats
        db('properties').count('* as total_properties'),
        db('properties').where({ is_active: true }).count('* as active_properties'),
        
        // Unit stats
        db('rental_units').count('* as total_units'),
        db('rental_units').where({ is_vacant: true }).count('* as vacant_units'),
        db('rental_units').where({ is_vacant: false }).count('* as occupied_units'),
        
        // Payment stats (current month)
        db('rent_payments')
          .where('payment_date', '>=', db.raw('DATE_TRUNC(\'month\', CURRENT_DATE)'))
          .where({ payment_status: 'completed' })
          .sum('amount as monthly_revenue'),
        
        db('rent_payments')
          .where('payment_date', '>=', db.raw('DATE_TRUNC(\'month\', CURRENT_DATE)'))
          .count('* as monthly_payments'),
        
        // Maintenance stats
        db('maintenance_tickets').count('* as total_tickets'),
        db('maintenance_tickets').where({ status: 'open' }).count('* as open_tickets'),
        db('maintenance_tickets').where({ status: 'resolved' }).count('* as resolved_tickets'),
      ]);

      const [
        userStats,
        landlordStats,
        tenantStats,
        propertyStats,
        activePropertyStats,
        unitStats,
        vacantUnitStats,
        occupiedUnitStats,
        revenueStats,
        paymentStats,
        ticketStats,
        openTicketStats,
        resolvedTicketStats
      ] = stats;

      const occupancyRate = unitStats[0].total_units > 0 
        ? Math.round((occupiedUnitStats[0].occupied_units / unitStats[0].total_units) * 100)
        : 0;

      const systemStats = {
        users: {
          total: userStats[0].total_users,
          landlords: landlordStats[0].total_landlords,
          tenants: tenantStats[0].total_tenants,
        },
        properties: {
          total: propertyStats[0].total_properties,
          active: activePropertyStats[0].active_properties,
        },
        units: {
          total: unitStats[0].total_units,
          vacant: vacantUnitStats[0].vacant_units,
          occupied: occupiedUnitStats[0].occupied_units,
          occupancy_rate: occupancyRate,
        },
        payments: {
          monthly_revenue: parseFloat(revenueStats[0].monthly_revenue) || 0,
          monthly_payments: paymentStats[0].monthly_payments,
        },
        maintenance: {
          total: ticketStats[0].total_tickets,
          open: openTicketStats[0].open_tickets,
          resolved: resolvedTicketStats[0].resolved_tickets,
        }
      };

      res.json({
        message: 'System stats retrieved successfully',
        stats: systemStats
      });
    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve system stats',
        message: error.message
      });
    }
  }

  static async getAllUsers(req, res) {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required'
        });
      }

      const { user_type, search, page = 1, limit = 20 } = req.query;
      
      let query = db('users')
        .select(
          'id',
          'email',
          'phone',
          'first_name',
          'last_name',
          'user_type',
          'is_verified',
          'created_at',
          'updated_at'
        )
        .orderBy('created_at', 'desc');

      // Apply filters
      if (user_type) {
        query = query.where({ user_type });
      }

      if (search) {
        query = query.where(function() {
          this.where('first_name', 'ILIKE', `%${search}%`)
              .orWhere('last_name', 'ILIKE', `%${search}%`)
              .orWhere('email', 'ILIKE', `%${search}%`)
              .orWhere('phone', 'ILIKE', `%${search}%`);
        });
      }

      // Get total count for pagination
      const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
      const [{ total }] = await countQuery;

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const users = await query;

      res.json({
        message: 'Users retrieved successfully',
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        error: 'Failed to retrieve users',
        message: error.message
      });
    }
  }

  static async getAllProperties(req, res) {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required'
        });
      }

      const { search, county, page = 1, limit = 20 } = req.query;
      
      let query = db('properties')
        .join('users', 'properties.owner_id', 'users.id')
        .select(
          'properties.*',
          'users.first_name as owner_first_name',
          'users.last_name as owner_last_name',
          'users.email as owner_email',
          'users.phone as owner_phone'
        )
        .orderBy('properties.created_at', 'desc');

      // Apply filters
      if (search) {
        query = query.where(function() {
          this.where('properties.name', 'ILIKE', `%${search}%`)
              .orWhere('properties.address', 'ILIKE', `%${search}%`)
              .orWhere('users.first_name', 'ILIKE', `%${search}%`)
              .orWhere('users.last_name', 'ILIKE', `%${search}%`);
        });
      }

      if (county) {
        query = query.where('properties.county', 'ILIKE', `%${county}%`);
      }

      // Get total count for pagination
      const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
      const [{ total }] = await countQuery;

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const properties = await query;

      // Get unit stats for each property
      for (const property of properties) {
        const unitStats = await db('rental_units')
          .where({ property_id: property.id })
          .select(
            db.raw('COUNT(*) as total_units'),
            db.raw('COUNT(CASE WHEN is_vacant = true THEN 1 END) as vacant_units'),
            db.raw('COUNT(CASE WHEN is_vacant = false THEN 1 END) as occupied_units')
          )
          .first();

        property.stats = unitStats;
      }

      res.json({
        message: 'Properties retrieved successfully',
        properties,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get all properties error:', error);
      res.status(500).json({
        error: 'Failed to retrieve properties',
        message: error.message
      });
    }
  }

  static async getSystemActivity(req, res) {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required'
        });
      }

      const { days = 30 } = req.query;
      
      // Get recent activity across the system
      const activity = await Promise.all([
        // Recent user registrations
        db('users')
          .select('id', 'first_name', 'last_name', 'email', 'user_type', 'created_at')
          .where('created_at', '>=', db.raw('CURRENT_DATE - INTERVAL ? DAY', [days]))
          .orderBy('created_at', 'desc')
          .limit(10),
        
        // Recent property additions
        db('properties')
          .join('users', 'properties.owner_id', 'users.id')
          .select(
            'properties.id',
            'properties.name',
            'properties.address',
            'properties.created_at',
            'users.first_name as owner_first_name',
            'users.last_name as owner_last_name'
          )
          .where('properties.created_at', '>=', db.raw('CURRENT_DATE - INTERVAL ? DAY', [days]))
          .orderBy('properties.created_at', 'desc')
          .limit(10),
        
        // Recent payments
        db('rent_payments')
          .join('tenants', 'rent_payments.tenant_id', 'tenants.id')
          .join('users', 'tenants.user_id', 'users.id')
          .select(
            'rent_payments.id',
            'rent_payments.amount',
            'rent_payments.payment_date',
            'rent_payments.payment_status',
            'users.first_name',
            'users.last_name'
          )
          .where('rent_payments.created_at', '>=', db.raw('CURRENT_DATE - INTERVAL ? DAY', [days]))
          .orderBy('rent_payments.created_at', 'desc')
          .limit(10),
        
        // Recent maintenance tickets
        db('maintenance_tickets')
          .join('properties', 'maintenance_tickets.property_id', 'properties.id')
          .select(
            'maintenance_tickets.id',
            'maintenance_tickets.title',
            'maintenance_tickets.priority',
            'maintenance_tickets.status',
            'maintenance_tickets.created_at',
            'properties.name as property_name'
          )
          .where('maintenance_tickets.created_at', '>=', db.raw('CURRENT_DATE - INTERVAL ? DAY', [days]))
          .orderBy('maintenance_tickets.created_at', 'desc')
          .limit(10),
      ]);

      const [newUsers, newProperties, recentPayments, recentTickets] = activity;

      res.json({
        message: 'System activity retrieved successfully',
        activity: {
          new_users: newUsers,
          new_properties: newProperties,
          recent_payments: recentPayments,
          recent_tickets: recentTickets,
        }
      });
    } catch (error) {
      console.error('Get system activity error:', error);
      res.status(500).json({
        error: 'Failed to retrieve system activity',
        message: error.message
      });
    }
  }

  static async updateUserStatus(req, res) {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { is_verified } = req.body;

      const [user] = await db('users')
        .where({ id })
        .update({
          is_verified,
          updated_at: new Date()
        })
        .returning('*');

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        message: 'User status updated successfully',
        user
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        error: 'Failed to update user status',
        message: error.message
      });
    }
  }

  static async getFinancialOverview(req, res) {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required'
        });
      }

      const { months = 12 } = req.query;

      // Get monthly revenue data
      const monthlyRevenue = await db('rent_payments')
        .select(
          db.raw('DATE_TRUNC(\'month\', payment_date) as month'),
          db.raw('SUM(CASE WHEN payment_status = \'completed\' THEN amount ELSE 0 END) as revenue'),
          db.raw('COUNT(CASE WHEN payment_status = \'completed\' THEN 1 END) as completed_payments'),
          db.raw('COUNT(*) as total_payments')
        )
        .where('payment_date', '>=', db.raw('CURRENT_DATE - INTERVAL ? MONTH', [months]))
        .groupByRaw('DATE_TRUNC(\'month\', payment_date)')
        .orderByRaw('DATE_TRUNC(\'month\', payment_date) DESC');

      // Get total platform revenue
      const totalRevenue = await db('rent_payments')
        .where({ payment_status: 'completed' })
        .sum('amount as total');

      // Get payment method breakdown
      const paymentMethods = await db('rent_payments')
        .select('payment_method', db.raw('COUNT(*) as count'), db.raw('SUM(amount) as total'))
        .where({ payment_status: 'completed' })
        .groupBy('payment_method');

      res.json({
        message: 'Financial overview retrieved successfully',
        financials: {
          monthly_revenue: monthlyRevenue,
          total_revenue: parseFloat(totalRevenue[0].total) || 0,
          payment_methods: paymentMethods,
        }
      });
    } catch (error) {
      console.error('Get financial overview error:', error);
      res.status(500).json({
        error: 'Failed to retrieve financial overview',
        message: error.message
      });
    }
  }
}

module.exports = AdminController;

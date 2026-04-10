const { validationResult } = require('express-validator');
const RevenueService = require('../services/revenueService');
const Property = require('../models/Property');

class RevenueController {
  static async getDailyRevenue(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id, date } = req.query;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const dailyRevenue = await RevenueService.calculateDailyRevenue(property_id, date);
      
      res.json({
        message: 'Daily revenue retrieved successfully',
        data: {
          property_id,
          date,
          daily_revenue: dailyRevenue
        }
      });
    } catch (error) {
      console.error('Get daily revenue error:', error);
      res.status(500).json({
        error: 'Failed to retrieve daily revenue',
        message: error.message
      });
    }
  }

  static async getMillionDayTarget(req, res) {
    try {
      const { property_id } = req.query;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const millionDayTarget = await RevenueService.getMillionDayTarget(property_id);
      
      res.json({
        message: 'Million day target retrieved successfully',
        data: millionDayTarget
      });
    } catch (error) {
      console.error('Get million day target error:', error);
      res.status(500).json({
        error: 'Failed to retrieve million day target',
        message: error.message
      });
    }
  }

  static async getRevenueOptimization(req, res) {
    try {
      const { property_id } = req.query;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const optimization = await RevenueService.optimizeForMillionDay(property_id);
      
      res.json({
        message: 'Revenue optimization retrieved successfully',
        data: optimization
      });
    } catch (error) {
      console.error('Get revenue optimization error:', error);
      res.status(500).json({
        error: 'Failed to retrieve revenue optimization',
        message: error.message
      });
    }
  }

  static async generateRevenueReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id, date } = req.query;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const report = await RevenueService.generateRevenueReport(property_id, date || new Date().toISOString().split('T')[0]);
      
      res.json({
        message: 'Revenue report generated successfully',
        data: report
      });
    } catch (error) {
      console.error('Generate revenue report error:', error);
      res.status(500).json({
        error: 'Failed to generate revenue report',
        message: error.message
      });
    }
  }

  static async getPortfolioRevenue(req, res) {
    try {
      // Get all properties for the user
      const properties = await Property.findByOwnerId(req.user.userId);
      
      const portfolioData = {
        total_properties: properties.length,
        daily_revenue: 0,
        monthly_revenue: 0,
        million_day_progress: 0,
        properties: []
      };

      for (const property of properties) {
        const dailyRevenue = await RevenueService.calculateDailyRevenue(property.id, new Date().toISOString().split('T')[0]);
        const millionTarget = await RevenueService.getMillionDayTarget(property.id);
        
        portfolioData.daily_revenue += dailyRevenue;
        portfolioData.properties.push({
          id: property.id,
          name: property.name,
          daily_revenue: dailyRevenue,
          million_day_target: millionTarget,
          progress: millionTarget ? (dailyRevenue / millionTarget.target) * 100 : 0
        });
      }

      // Calculate portfolio million day progress
      const totalMillionTarget = portfolioData.properties.reduce((sum, prop) => sum + (prop.million_day_target?.target || 0), 0);
      portfolioData.million_day_progress = totalMillionTarget > 0 ? (portfolioData.daily_revenue / totalMillionTarget) * 100 : 0;
      portfolioData.monthly_revenue = portfolioData.daily_revenue * 30;

      res.json({
        message: 'Portfolio revenue retrieved successfully',
        data: portfolioData
      });
    } catch (error) {
      console.error('Get portfolio revenue error:', error);
      res.status(500).json({
        error: 'Failed to retrieve portfolio revenue',
        message: error.message
      });
    }
  }

  static async setRevenueGoals(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id, daily_target, monthly_target, million_day_enabled } = req.body;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const goalData = {
        property_id,
        daily_target: parseFloat(daily_target),
        monthly_target: parseFloat(monthly_target),
        million_day_enabled: million_day_enabled || false,
        created_by: req.user.userId,
        updated_at: new Date()
      };

      // Upsert revenue goals
      const [goal] = await db('revenue_goals')
        .insert(goalData)
        .onConflict('property_id')
        .merge()
        .returning('*');

      res.json({
        message: 'Revenue goals set successfully',
        data: goal
      });
    } catch (error) {
      console.error('Set revenue goals error:', error);
      res.status(500).json({
        error: 'Failed to set revenue goals',
        message: error.message
      });
    }
  }

  static async getRevenueDashboard(req, res) {
    try {
      const { property_id } = req.query;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const dailyRevenue = await RevenueService.calculateDailyRevenue(property_id, today);
      const millionTarget = await RevenueService.getMillionDayTarget(property_id);
      const optimization = await RevenueService.optimizeForMillionDay(property_id);
      
      const dashboard = {
        today_revenue: dailyRevenue,
        million_day_target: millionTarget,
        optimization_strategies: optimization,
        quick_actions: [
          {
            title: 'Increase Occupancy',
            description: 'Fill vacant units to maximize revenue',
            potential_increase: optimization.increase_occupancy.potential_revenue
          },
          {
            title: 'Optimize Pricing',
            description: 'Adjust rent based on market conditions',
            potential_increase: optimization.optimize_pricing.potential_revenue
          },
          {
            title: 'Add Services',
            description: 'Generate additional revenue streams',
            potential_increase: optimization.add_services.potential_revenue
          }
        ]
      };

      res.json({
        message: 'Revenue dashboard retrieved successfully',
        data: dashboard
      });
    } catch (error) {
      console.error('Get revenue dashboard error:', error);
      res.status(500).json({
        error: 'Failed to retrieve revenue dashboard',
        message: error.message
      });
    }
  }
}

module.exports = RevenueController;

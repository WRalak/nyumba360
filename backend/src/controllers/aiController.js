const AIService = require('../services/aiService');
const Property = require('../models/Property');

class AIController {
  static async getExpensePredictions(req, res) {
    try {
      const { property_id, months = 12 } = req.query;

      if (!property_id) {
        return res.status(400).json({
          error: 'Property ID is required'
        });
      }

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      const predictions = await AIService.getExpensePredictions(property_id, parseInt(months));

      res.json({
        message: 'Expense predictions generated successfully',
        predictions
      });
    } catch (error) {
      console.error('Get expense predictions error:', error);
      res.status(500).json({
        error: 'Failed to generate expense predictions',
        details: error.message
      });
    }
  }

  static async getMaintenancePredictions(req, res) {
    try {
      const { property_id } = req.query;

      if (!property_id) {
        return res.status(400).json({
          error: 'Property ID is required'
        });
      }

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      const predictions = await AIService.getMaintenancePredictions(property_id);

      res.json({
        message: 'Maintenance predictions generated successfully',
        predictions
      });
    } catch (error) {
      console.error('Get maintenance predictions error:', error);
      res.status(500).json({
        error: 'Failed to generate maintenance predictions',
        details: error.message
      });
    }
  }

  static async getTenantScreening(req, res) {
    try {
      const tenantData = req.body;

      // Validate required fields
      const requiredFields = ['first_name', 'last_name', 'id_number', 'monthly_income', 'employment_years', 'age'];
      const missingFields = requiredFields.filter(field => !tenantData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          missing_fields: missingFields
        });
      }

      const screening = await AIService.getTenantScreening(tenantData);

      res.json({
        message: 'Tenant screening completed successfully',
        screening
      });
    } catch (error) {
      console.error('Tenant screening error:', error);
      res.status(500).json({
        error: 'Failed to complete tenant screening',
        details: error.message
      });
    }
  }

  static async getPropertyInsights(req, res) {
    try {
      const { property_id } = req.query;

      if (!property_id) {
        return res.status(400).json({
          error: 'Property ID is required'
        });
      }

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      const insights = await AIService.getPropertyInsights(property_id);

      res.json({
        message: 'Property insights generated successfully',
        insights
      });
    } catch (error) {
      console.error('Get property insights error:', error);
      res.status(500).json({
        error: 'Failed to generate property insights',
        details: error.message
      });
    }
  }

  static async getPortfolioInsights(req, res) {
    try {
      // Get all properties for the user
      const properties = await Property.find({ owner_id: req.user.userId });
      
      if (properties.length === 0) {
        return res.json({
          message: 'No properties found',
          portfolio_insights: {
            total_properties: 0,
            insights: []
          }
        });
      }

      // Generate insights for each property
      const propertyInsights = await Promise.all(
        properties.map(async (property) => {
          try {
            return await AIService.getPropertyInsights(property._id);
          } catch (error) {
            console.error(`Error getting insights for property ${property._id}:`, error);
            return null;
          }
        })
      );

      const validInsights = propertyInsights.filter(insight => insight !== null);

      // Generate portfolio-level insights
      const portfolioInsights = {
        total_properties: properties.length,
        total_value: properties.reduce((sum, p) => sum + (p.property_value || 0), 0),
        total_monthly_income: properties.reduce((sum, p) => sum + ((p.total_units || 1) * (p.average_rent || 0)), 0),
        average_occupancy_rate: validInsights.reduce((sum, insight) => sum + insight.operational_insights.occupancy_trends.current_occupancy_rate, 0) / validInsights.length,
        portfolio_recommendations: this.generatePortfolioRecommendations(validInsights),
        property_insights: validInsights
      };

      res.json({
        message: 'Portfolio insights generated successfully',
        portfolio_insights
      });
    } catch (error) {
      console.error('Get portfolio insights error:', error);
      res.status(500).json({
        error: 'Failed to generate portfolio insights',
        details: error.message
      });
    }
  }

  static generatePortfolioRecommendations(propertyInsights) {
    const recommendations = [];
    
    // Analyze overall portfolio performance
    const totalROI = propertyInsights.reduce((sum, insight) => sum + insight.financial_performance.roi_projection.annual_roi_percentage, 0) / propertyInsights.length;
    
    if (totalROI < 8) {
      recommendations.push({
        type: 'portfolio_optimization',
        priority: 'high',
        message: 'Portfolio ROI is below optimal. Consider property acquisitions or improvements.',
        action_items: ['Review underperforming properties', 'Consider property upgrades', 'Evaluate market opportunities']
      });
    }

    // Analyze maintenance risks across portfolio
    const highRiskProperties = propertyInsights.filter(insight => 
      insight.operational_insights.maintenance_risks.risk_level === 'high'
    ).length;

    if (highRiskProperties > propertyInsights.length * 0.3) {
      recommendations.push({
        type: 'maintenance_strategy',
        priority: 'medium',
        message: 'Multiple properties have high maintenance risks. Implement portfolio-wide maintenance strategy.',
        action_items: ['Standardize maintenance procedures', 'Consider bulk service contracts', 'Implement preventive maintenance schedules']
      });
    }

    // Analyze occupancy trends
    const lowOccupancyProperties = propertyInsights.filter(insight => 
      insight.operational_insights.occupancy_trends.current_occupancy_rate < 90
    ).length;

    if (lowOccupancyProperties > 0) {
      recommendations.push({
        type: 'occupancy_improvement',
        priority: 'high',
        message: `${lowOccupancyProperties} properties have low occupancy rates. Implement targeted marketing strategies.`,
        action_items: ['Enhance property listings', 'Review competitive pricing', 'Improve property amenities']
      });
    }

    return recommendations;
  }

  static async getMarketAnalysis(req, res) {
    try {
      const { county, property_type } = req.query;

      // Get market data (simplified - would integrate with real market data API)
      const marketData = await this.getMarketData(county, property_type);

      res.json({
        message: 'Market analysis completed successfully',
        market_analysis: marketData
      });
    } catch (error) {
      console.error('Get market analysis error:', error);
      res.status(500).json({
        error: 'Failed to generate market analysis',
        details: error.message
      });
    }
  }

  static async getMarketData(county, propertyType) {
    // Simulated market data - would integrate with real estate APIs
    const baseData = {
      average_rent_per_unit: 35000,
      average_occupancy_rate: 85,
      market_trend: 'stable',
      price_per_square_meter: 15000,
      average_yield: 8.5,
      market_sentiment: 'positive'
    };

    // Adjust based on county (simplified)
    const countyAdjustments = {
      'Nairobi': { rent_multiplier: 1.5, occupancy_multiplier: 1.1, yield_multiplier: 0.9 },
      'Mombasa': { rent_multiplier: 1.2, occupancy_multiplier: 1.0, yield_multiplier: 1.0 },
      'Kisumu': { rent_multiplier: 0.8, occupancy_multiplier: 0.9, yield_multiplier: 1.1 },
      'Nakuru': { rent_multiplier: 0.9, occupancy_multiplier: 0.95, yield_multiplier: 1.05 }
    };

    const adjustment = countyAdjustments[county] || { rent_multiplier: 1, occupancy_multiplier: 1, yield_multiplier: 1 };

    return {
      county: county || 'Kenya',
      property_type: propertyType || 'all',
      average_rent_per_unit: Math.round(baseData.average_rent_per_unit * adjustment.rent_multiplier),
      average_occupancy_rate: Math.round(baseData.average_occupancy_rate * adjustment.occupancy_multiplier),
      market_trend: baseData.market_trend,
      price_per_square_meter: Math.round(baseData.price_per_square_meter * adjustment.rent_multiplier),
      average_yield: (baseData.average_yield * adjustment.yield_multiplier).toFixed(1),
      market_sentiment: baseData.market_sentiment,
      recommendations: this.generateMarketRecommendations(county, propertyType, adjustment)
    };
  }

  static generateMarketRecommendations(county, propertyType, adjustment) {
    const recommendations = [];

    if (adjustment.rent_multiplier > 1.2) {
      recommendations.push({
        type: 'pricing',
        message: 'Market rates are high in this area. Consider premium positioning.',
        priority: 'medium'
      });
    }

    if (adjustment.occupancy_multiplier < 1) {
      recommendations.push({
        type: 'marketing',
        message: 'Occupancy rates are below average. Enhance marketing efforts.',
        priority: 'high'
      });
    }

    if (adjustment.yield_multiplier > 1.05) {
      recommendations.push({
        type: 'investment',
        message: 'This area shows strong rental yields. Consider property expansion.',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  static async getAIRecommendations(req, res) {
    try {
      const { category, property_id } = req.query;

      let recommendations = [];

      switch (category) {
        case 'financial':
          recommendations = await this.getFinancialRecommendations(req.user.userId, property_id);
          break;
        case 'operational':
          recommendations = await this.getOperationalRecommendations(req.user.userId, property_id);
          break;
        case 'growth':
          recommendations = await this.getGrowthRecommendations(req.user.userId);
          break;
        default:
          recommendations = await this.getAllRecommendations(req.user.userId, property_id);
      }

      res.json({
        message: 'AI recommendations generated successfully',
        category: category || 'all',
        recommendations
      });
    } catch (error) {
      console.error('Get AI recommendations error:', error);
      res.status(500).json({
        error: 'Failed to generate AI recommendations',
        details: error.message
      });
    }
  }

  static async getFinancialRecommendations(userId, propertyId) {
    const recommendations = [];

    // Get property insights for financial recommendations
    if (propertyId) {
      const insights = await AIService.getPropertyInsights(propertyId);
      recommendations.push(...insights.recommendations.filter(r => r.type === 'financial'));
    }

    // Add general financial recommendations
    recommendations.push({
      type: 'financial',
      priority: 'medium',
      message: 'Review expense categories quarterly to identify cost-saving opportunities.',
      action_items: ['Analyze expense trends', 'Compare vendor costs', 'Optimize maintenance schedules']
    });

    return recommendations;
  }

  static async getOperationalRecommendations(userId, propertyId) {
    const recommendations = [];

    // Get property insights for operational recommendations
    if (propertyId) {
      const insights = await AIService.getPropertyInsights(propertyId);
      recommendations.push(...insights.recommendations.filter(r => r.type === 'maintenance' || r.type === 'occupancy'));
    }

    return recommendations;
  }

  static async getGrowthRecommendations(userId) {
    const recommendations = [];

    recommendations.push({
      type: 'growth',
      priority: 'low',
      message: 'Consider expanding your portfolio in high-yield areas.',
      action_items: ['Research emerging markets', 'Evaluate financing options', 'Network with other investors']
    });

    return recommendations;
  }

  static async getAllRecommendations(userId, propertyId) {
    const financial = await this.getFinancialRecommendations(userId, propertyId);
    const operational = await this.getOperationalRecommendations(userId, propertyId);
    const growth = await this.getGrowthRecommendations(userId);

    return [...financial, ...operational, ...growth];
  }
}

module.exports = AIController;

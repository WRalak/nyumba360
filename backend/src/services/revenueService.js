const db = require('../config/database');
const moment = require('moment');

class RevenueService {
  static async calculateDailyRevenue(propertyId, date) {
    try {
      const revenue = await db('rent_payments')
        .join('lease_agreements', 'rent_payments.lease_id', 'lease_agreements.id')
        .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
        .where({
          'rental_units.property_id': propertyId,
          'rent_payments.payment_status': 'completed',
          'rent_payments.payment_date': date
        })
        .sum('amount as total_revenue');

      return parseFloat(revenue[0].total_revenue) || 0;
    } catch (error) {
      console.error('Calculate daily revenue error:', error);
      return 0;
    }
  }

  static async getRevenueProjection(propertyId, days = 30) {
    try {
      const historicalData = await db('rent_payments')
        .join('lease_agreements', 'rent_payments.lease_id', 'lease_agreements.id')
        .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
        .where({
          'rental_units.property_id': propertyId,
          'rent_payments.payment_status': 'completed'
        })
        .where('rent_payments.payment_date', '>=', moment().subtract(days, 'days').format('YYYY-MM-DD'))
        .select(
          db.raw('DATE(payment_date) as date'),
          db.raw('SUM(amount) as daily_revenue')
        )
        .groupByRaw('DATE(payment_date)')
        .orderByRaw('DATE(payment_date) ASC');

      const avgDailyRevenue = historicalData.reduce((sum, item) => sum + parseFloat(item.daily_revenue), 0) / historicalData.length;
      const projectedDailyRevenue = avgDailyRevenue * 1.1; // 10% growth projection
      
      return projectedDailyRevenue;
    } catch (error) {
      console.error('Get revenue projection error:', error);
      return 0;
    }
  }

  static async getMillionDayTarget(propertyId) {
    try {
      const currentRevenue = await this.calculateDailyRevenue(propertyId, moment().format('YYYY-MM-DD'));
      const projectedRevenue = await this.getRevenueProjection(propertyId);
      
      const millionDayTarget = 1000000; // 1 million KES
      const currentProgress = (currentRevenue / millionDayTarget) * 100;
      const projectedProgress = (projectedRevenue / millionDayTarget) * 100;
      
      return {
        target: millionDayTarget,
        current_revenue: currentRevenue,
        projected_revenue: projectedRevenue,
        current_progress: currentProgress,
        projected_progress: projectedProgress,
        needed_for_target: Math.max(0, millionDayTarget - currentRevenue),
        days_to_target: projectedRevenue > 0 ? Math.ceil((millionDayTarget - currentRevenue) / projectedRevenue) : null
      };
    } catch (error) {
      console.error('Get million day target error:', error);
      return null;
    }
  }

  static async optimizeForMillionDay(propertyId) {
    try {
      const property = await db('properties').where({ id: propertyId }).first();
      const units = await db('rental_units').where({ property_id: propertyId });
      
      const totalUnits = units.length;
      const occupiedUnits = units.filter(unit => !unit.is_vacant).length;
      const vacancyRate = (totalUnits - occupiedUnits) / totalUnits;
      
      const optimization = {
        increase_occupancy: {
          current_rate: (occupiedUnits / totalUnits) * 100,
          target_rate: 95,
          potential_revenue: 0
        },
        optimize_pricing: {
          current_avg_rent: 0,
          suggested_increase: 15,
          potential_revenue: 0
        },
        reduce_vacancy: {
          vacancy_days: 0,
          avg_rent_loss_per_day: 0,
          potential_revenue: 0
        },
        add_services: {
          suggested_services: ['parking', 'storage', 'laundry', 'wifi'],
          potential_revenue: 0
        }
      };

      // Calculate potential revenue from optimization
      const avgRent = units.reduce((sum, unit) => sum + (unit.monthly_rent || 0), 0) / units.length;
      const monthlyRevenue = occupiedUnits * avgRent;
      
      optimization.increase_occupancy.potential_revenue = (totalUnits * 0.95 - occupiedUnits) * avgRent * 12;
      optimization.optimize_pricing.potential_revenue = monthlyRevenue * 0.15 * 12;
      optimization.reduce_vacancy.potential_revenue = vacancyRate * avgRent * 365;
      optimization.add_services.potential_revenue = totalUnits * 5000 * 12; // KES 5000/month per unit

      return optimization;
    } catch (error) {
      console.error('Optimize for million day error:', error);
      return null;
    }
  }

  static async generateRevenueReport(propertyId, date) {
    try {
      const dailyRevenue = await this.calculateDailyRevenue(propertyId, date);
      const millionTarget = await this.getMillionDayTarget(propertyId);
      const optimization = await this.optimizeForMillionDay(propertyId);
      
      const report = {
        date,
        daily_revenue: dailyRevenue,
        million_day_target: millionTarget,
        optimization_strategies: optimization,
        recommendations: this.generateRecommendations(dailyRevenue, millionTarget, optimization)
      };

      return report;
    } catch (error) {
      console.error('Generate revenue report error:', error);
      return null;
    }
  }

  static generateRecommendations(currentRevenue, target, optimization) {
    const recommendations = [];
    
    if (currentRevenue < target.target * 0.5) {
      recommendations.push({
        priority: 'urgent',
        title: 'Dramatically Increase Occupancy',
        description: 'Current revenue is less than 50% of target. Focus on filling vacant units immediately.',
        action: 'Launch aggressive marketing campaign and offer move-in incentives'
      });
    }

    if (optimization.increase_occupancy.current_rate < 90) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Occupancy Rate',
        description: `Current occupancy rate is ${optimization.increase_occupancy.current_rate}%. Target 95% for maximum revenue.`,
        action: 'Reduce rent on vacant units and offer flexible lease terms'
      });
    }

    if (optimization.optimize_pricing.suggested_increase > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Optimize Pricing Strategy',
        description: `Consider increasing rent by ${optimization.optimize_pricing.suggested_increase}% based on market analysis.`,
        action: 'Implement gradual rent increases with proper notice periods'
      });
    }

    recommendations.push({
      priority: 'low',
      title: 'Add Value-Added Services',
      description: 'Generate additional revenue through premium services.',
      action: 'Offer parking, storage, and utility management services'
    });

    return recommendations;
  }
}

module.exports = RevenueService;

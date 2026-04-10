const db = require('../config/database');
const moment = require('moment');

class AnalyticsService {
  static async getDailyRevenue(propertyId, startDate, endDate) {
    try {
      const revenue = await db('rent_payments')
        .join('lease_agreements', 'rent_payments.lease_id', 'lease_agreements.unit_id', 'rental_units.id')
        .join('properties', 'lease_agreements.property_id', 'properties.id', 'properties.id')
        .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
        .where({
          'rental_units.property_id': propertyId,
          'rent_payments.payment_status': 'completed',
          'rent_payments.payment_date': '>=', startDate,
          'rent_payments.payment_date': '<=', endDate
        })
        .select(
          db.raw('DATE(payment_date) as date'),
          db.raw('SUM(amount) as daily_revenue'),
          db.raw('COUNT(*) as payment_count')
        )
        .groupByRaw('DATE(payment_date)')
        .orderByRaw('DATE(payment_date) DESC');

      return revenue.map(item => ({
        date: item.date,
        revenue: parseFloat(item.daily_revenue) || 0,
        payments: parseInt(item.payment_count) || 0
      }));
    } catch (error) {
      console.error('Get daily revenue error:', error);
      return [];
    }
  }

  static async getMonthlyRevenue(propertyId, months = 12) {
    try {
      const revenue = await db('rent_payments')
        .join('lease_agreements', 'rent_payments.lease_id', 'lease_agreements.unit_id', 'rental_units.id')
        .join('properties', 'lease_agreements.property_id', 'properties.id', 'properties.id')
        .join('rental_units', 'lease_agreements.unit_id', 'rental_units.id')
        .where({
          'rental_units.property_id': propertyId,
          'rent_payments.payment_status': 'completed',
          'rent_payments.payment_date': '>=', moment().subtract(months, 'months').startOf('day').format('YYYY-MM-DD'),
          'rent_payments.payment_date: '<=', moment().endOf('day').format('YYYY-MM-DD')
        })
        .select(
          db.raw('DATE_TRUNC(\'month\', payment_date) as month'),
          db.raw('SUM(amount) as monthly_revenue'),
          db.raw('COUNT(*) as payment_count'),
          db.raw('COUNT(CASE WHEN payment_status = \'completed\' THEN 1 END) as completed_payments'),
          db.raw('COUNT(*) as total_payments')
        )
        .groupByRaw('DATE_TRUNC(\'month\', payment_date)')
        .orderByRaw('DATE_TRUNC(\'month\', payment_date) DESC')
        .orderByRaw('DATE_TRUNC(\'month\', payment_date) DESC);

      return revenue.map(item => ({
        month: item.month,
        revenue: parseFloat(item.monthly_revenue) || 0,
        payments: parseInt(item.payment_count) || 0,
        completed_payments: parseInt(item.completed_payments) || 0,
        total_payments: parseInt(item.total_payments) || 0,
        success_rate: item.total_payments > 0 ? Math.round((item.completed_payments / item.total_payments) * 100) : 0
      }));
    } catch (error) {
      console.error('Get monthly revenue error:', error);
      return [];
    }
  }

  static async getPropertyPerformance(propertyId, months = 12) {
    try {
      const stats = await Property.getPropertyStats(propertyId);
      const monthlyRevenue = await this.getMonthlyRevenue(propertyId, months);
      const occupancyRate = stats.occupancy_rate || 0;
      
      const performance = {
        property_id: propertyId,
        occupancy_rate,
        monthly_revenue: monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0),
        payment_success_rate: monthlyRevenue.reduce((sum, item) => sum + (item.success_rate || 0), 0) / monthlyRevenue.length,
        total_payments: monthlyRevenue.reduce((sum, item) => sum + (item.total_payments || 0), 0),
        avg_rent_price: stats.total_units > 0 ? (stats.total_potential_rent / stats.total_units) : 0,
        vacancy_turnover: stats.vacant_units || 0,
        maintenance_requests: 0, // Would come from maintenance table
        late_payments: 0 // Would come from payments table
      };

      return performance;
    } catch (error) {
      console.error('Get property performance error:', error);
      return null;
    }
  }

  static async getMarketTrends(propertyId, months = 12) {
    try {
      const monthlyRevenue = await this.getMonthlyRevenue(propertyId, months);
      const occupancyRate = await Property.getOccupancyRate(propertyId);
      
      const trends = {
        revenue_trend: this.calculateTrend(monthlyRevenue),
        occupancy_trend: this.calculateTrend(occupancyRate),
        revenue_projection: this.projectRevenue(monthlyRevenue),
        occupancy_projection: this.projectOccupancyRate(occupancyRate)
      };

      return trends;
    } catch (error) {
      console.error('Get market trends error:', error);
      return null;
    }
  }

  static calculateTrend(data) {
    if (data.length < 2) return { trend: 'stable', change: 0 };
    
    const recent = data.slice(-3); // Last 3 months
    const older = data.slice(-6, -3); // Previous 3 months
    
    const recentAvg = recent.reduce((sum, item) => sum + item.revenue, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.revenue, 0) / older.length;
    
    const change = recentAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    
    return {
      trend: change > 5 ? 'growing' : change < -5 ? 'declining' : 'stable',
      change: Math.round(change),
      percentage: Math.round(change)
    };
  }

  static projectRevenue(data) {
    if (data.length === 0) return { projection: 0 };
    
    const avgRevenue = data.reduce((sum, item) => sum + item.revenue, 0) / data.length;
    const growthRate = this.calculateTrend(data);
    
    const projection = avgRevenue * (1 + (growthRate / 100));
    
    return Math.round(projection);
  }

  static projectOccupancyRate(currentRate) {
    if (currentRate >= 95) return 98;
    if (currentRate >= 90) return 95;
    if (currentRate >= 85) return 90;
    if (currentRate >= 80) return 85;
    return currentRate;
  }
}

module.exports = AnalyticsService;

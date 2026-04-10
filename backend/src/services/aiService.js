const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Maintenance = require('../models/Maintenance');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const RentPayment = require('../models/RentPayment');

class AIService {
  static async getExpensePredictions(propertyId, months = 12) {
    try {
      // Get historical expense data
      const expenses = await Expense.find({
        property_id: propertyId,
        expense_date: {
          $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last 12 months
        }
      }).sort({ expense_date: 1 });

      // Analyze patterns and predict future expenses
      const predictions = this.analyzeExpensePatterns(expenses, months);
      
      return {
        property_id: propertyId,
        predictions,
        confidence_score: this.calculateConfidenceScore(expenses),
        recommendations: this.generateExpenseRecommendations(predictions)
      };
    } catch (error) {
      console.error('Error generating expense predictions:', error);
      throw error;
    }
  }

  static analyzeExpensePatterns(expenses, months) {
    // Group expenses by category and month
    const monthlyData = {};
    const categories = {};
    
    expenses.forEach(expense => {
      const month = new Date(expense.expense_date).toISOString().slice(0, 7);
      const category = expense.expense_type;
      
      if (!monthlyData[month]) monthlyData[month] = {};
      if (!monthlyData[month][category]) monthlyData[month][category] = 0;
      
      monthlyData[month][category] += expense.amount;
      
      if (!categories[category]) categories[category] = [];
      categories[category].push({
        month,
        amount: expense.amount
      });
    });

    // Calculate trends and predictions
    const predictions = [];
    const currentDate = new Date();
    
    for (let i = 0; i < months; i++) {
      const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthKey = futureDate.toISOString().slice(0, 7);
      
      const monthlyPrediction = {
        month: monthKey,
        predicted_expenses: {},
        total_predicted: 0
      };

      // Predict for each category
      Object.keys(categories).forEach(category => {
        const categoryData = categories[category];
        const prediction = this.predictCategoryExpense(categoryData, futureDate);
        
        monthlyPrediction.predicted_expenses[category] = prediction;
        monthlyPrediction.total_predicted += prediction;
      });

      predictions.push(monthlyPrediction);
    }

    return predictions;
  }

  static predictCategoryExpense(categoryData, futureDate) {
    if (categoryData.length < 2) return 0;

    // Simple linear regression for prediction
    const sortedData = categoryData.sort((a, b) => new Date(a.month) - new Date(b.month));
    const amounts = sortedData.map(d => d.amount);
    
    // Calculate trend
    let trend = 0;
    for (let i = 1; i < amounts.length; i++) {
      trend += amounts[i] - amounts[i - 1];
    }
    trend /= (amounts.length - 1);
    
    // Calculate seasonal adjustment
    const month = futureDate.getMonth();
    const seasonalFactor = this.getSeasonalFactor(month);
    
    // Base prediction on last value plus trend
    const lastAmount = amounts[amounts.length - 1];
    const prediction = Math.max(0, (lastAmount + trend) * seasonalFactor);
    
    return Math.round(prediction);
  }

  static getSeasonalFactor(month) {
    // Seasonal factors for Kenyan climate
    const factors = {
      0: 1.2,  // January - Higher maintenance
      1: 1.1,  // February
      2: 1.0,  // March
      3: 0.9,  // April - Lower expenses
      4: 0.8,  // May - Rainy season
      5: 0.9,  // June
      6: 1.0,  // July
      7: 1.1,  // August
      8: 1.2,  // September
      9: 1.3,  // October - Pre-rainy season
      10: 1.2, // November
      11: 1.1  // December
    };
    return factors[month] || 1.0;
  }

  static calculateConfidenceScore(expenses) {
    if (expenses.length < 6) return 0.3; // Low confidence with little data
    if (expenses.length < 12) return 0.6; // Medium confidence
    return 0.85; // High confidence with sufficient data
  }

  static generateExpenseRecommendations(predictions) {
    const recommendations = [];
    const totalPredicted = predictions.reduce((sum, p) => sum + p.total_predicted, 0);
    const monthlyAverage = totalPredicted / predictions.length;

    // Analyze high-cost categories
    const categoryTotals = {};
    predictions.forEach(prediction => {
      Object.entries(prediction.predicted_expenses).forEach(([category, amount]) => {
        if (!categoryTotals[category]) categoryTotals[category] = 0;
        categoryTotals[category] += amount;
      });
    });

    // Generate recommendations based on analysis
    Object.entries(categoryTotals).forEach(([category, total]) => {
      if (total > monthlyAverage * 0.3) {
        recommendations.push({
          type: 'high_expense_category',
          category,
          message: `${category} expenses are projected to be high. Consider budget optimization or preventive maintenance.`,
          priority: 'high'
        });
      }
    });

    // Add general recommendations
    if (monthlyAverage > 50000) {
      recommendations.push({
        type: 'budget_alert',
        message: 'Monthly expenses are projected to be high. Review your budget and consider cost-saving measures.',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  static async getMaintenancePredictions(propertyId) {
    try {
      // Get maintenance history
      const maintenanceTickets = await Maintenance.find({
        property_id: propertyId,
        created_at: {
          $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      }).sort({ created_at: 1 });

      // Get property details
      const property = await Property.findById(propertyId);

      const predictions = this.analyzeMaintenancePatterns(maintenanceTickets, property);
      
      return {
        property_id: propertyId,
        predictions,
        risk_assessment: this.assessMaintenanceRisk(maintenanceTickets, property),
        recommendations: this.generateMaintenanceRecommendations(predictions)
      };
    } catch (error) {
      console.error('Error generating maintenance predictions:', error);
      throw error;
    }
  }

  static analyzeMaintenancePatterns(tickets, property) {
    const patterns = {
      frequent_issues: {},
      seasonal_trends: {},
      upcoming_maintenance: []
    };

    // Analyze frequent issues
    tickets.forEach(ticket => {
      const category = ticket.category;
      if (!patterns.frequent_issues[category]) {
        patterns.frequent_issues[category] = 0;
      }
      patterns.frequent_issues[category]++;
    });

    // Analyze seasonal trends
    tickets.forEach(ticket => {
      const month = new Date(ticket.created_at).getMonth();
      if (!patterns.seasonal_trends[month]) {
        patterns.seasonal_trends[month] = 0;
      }
      patterns.seasonal_trends[month]++;
    });

    // Predict upcoming maintenance based on patterns
    const currentDate = new Date();
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const riskScore = this.calculateMaintenanceRisk(futureDate, patterns, property);
      
      if (riskScore > 0.6) {
        patterns.upcoming_maintenance.push({
          month: futureDate.toISOString().slice(0, 7),
          risk_score: riskScore,
          likely_issues: this.predictLikelyIssues(futureDate, patterns)
        });
      }
    }

    return patterns;
  }

  static calculateMaintenanceRisk(date, patterns, property) {
    const month = date.getMonth();
    const seasonalRisk = (patterns.seasonal_trends[month] || 0) / Math.max(...Object.values(patterns.seasonal_trends));
    const ageRisk = property.property_age ? property.property_age / 50 : 0.5; // Normalize to 0-1
    
    return Math.min(1, seasonalRisk * 0.6 + ageRisk * 0.4);
  }

  static predictLikelyIssues(date, patterns) {
    const month = date.getMonth();
    const seasonalIssues = [];
    
    // Common seasonal maintenance needs in Kenya
    const seasonalCalendar = {
      0: ['electrical', 'plumbing'], // January - Post-holiday issues
      1: ['hvac', 'painting'],       // February
      2: ['plumbing', 'electrical'], // March
      3: ['roofing', 'gutters'],     // April - Rainy season prep
      4: ['roofing', 'drainage'],    // May - Heavy rain
      5: ['mold', 'water_damage'],   // June
      6: ['electrical', 'appliances'], // July
      7: ['hvac', 'ventilation'],    // August
      8: ['painting', 'flooring'],   // September
      9: ['roofing', 'gutters'],     // October - Pre-rainy
      10: ['roofing', 'drainage'],   // November
      11: ['electrical', 'plumbing']  // December
    };

    return seasonalCalendar[month] || ['general'];
  }

  static assessMaintenanceRisk(tickets, property) {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status !== 'completed').length;
    const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;
    
    let riskLevel = 'low';
    if (urgentTickets > 0) riskLevel = 'high';
    else if (openTickets > totalTickets * 0.3) riskLevel = 'medium';
    
    return {
      risk_level: riskLevel,
      open_tickets: openTickets,
      urgent_tickets: urgentTickets,
      average_resolution_time: this.calculateAverageResolutionTime(tickets)
    };
  }

  static calculateAverageResolutionTime(tickets) {
    const completedTickets = tickets.filter(t => t.status === 'completed' && t.completed_at);
    if (completedTickets.length === 0) return 0;
    
    const totalTime = completedTickets.reduce((sum, ticket) => {
      const resolutionTime = new Date(ticket.completed_at) - new Date(ticket.created_at);
      return sum + resolutionTime;
    }, 0);
    
    return Math.round(totalTime / completedTickets.length / (1000 * 60 * 60)); // Hours
  }

  static generateMaintenanceRecommendations(predictions) {
    const recommendations = [];
    
    // High-risk months
    predictions.upcoming_maintenance.forEach(maintenance => {
      if (maintenance.risk_score > 0.8) {
        recommendations.push({
          type: 'preventive_maintenance',
          month: maintenance.month,
          message: `High maintenance risk predicted for ${maintenance.month}. Schedule preventive maintenance for: ${maintenance.likely_issues.join(', ')}.`,
          priority: 'high'
        });
      }
    });

    // Frequent issues
    Object.entries(predictions.frequent_issues).forEach(([issue, count]) => {
      if (count > 3) {
        recommendations.push({
          type: 'recurring_issue',
          issue,
          message: `${issue} issues occur frequently. Consider upgrading equipment or addressing root cause.`,
          priority: 'medium'
        });
      }
    });

    return recommendations;
  }

  static async getTenantScreening(tenantData) {
    try {
      const screening = {
        tenant_data: tenantData,
        credit_score: await this.calculateCreditScore(tenantData),
        rental_history: await this.analyzeRentalHistory(tenantData.id_number),
        risk_assessment: this.assessTenantRisk(tenantData),
        recommendations: this.generateTenantRecommendations(tenantData)
      };

      return screening;
    } catch (error) {
      console.error('Error in tenant screening:', error);
      throw error;
    }
  }

  static async calculateCreditScore(tenantData) {
    // Simulated credit score calculation
    let score = 600; // Base score
    
    // Income factor
    if (tenantData.monthly_income >= 100000) score += 50;
    else if (tenantData.monthly_income >= 50000) score += 25;
    
    // Employment stability
    if (tenantData.employment_years >= 5) score += 30;
    else if (tenantData.employment_years >= 2) score += 15;
    
    // Age factor
    if (tenantData.age >= 30 && tenantData.age <= 60) score += 20;
    
    return Math.min(850, Math.max(300, score));
  }

  static async analyzeRentalHistory(idNumber) {
    try {
      // Check if tenant exists in system
      const tenant = await Tenant.findOne({ id_number: idNumber });
      
      if (!tenant) {
        return {
          found: false,
          message: 'No rental history found in our system'
        };
      }

      // Get rental payment history
      const payments = await RentPayment.find({
        tenant_id: tenant._id,
        payment_status: 'completed'
      }).sort({ payment_date: -1 });

      const onTimePayments = payments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        const dueDate = new Date(p.due_date);
        return paymentDate <= dueDate;
      }).length;

      const punctualityRate = payments.length > 0 ? (onTimePayments / payments.length) * 100 : 0;

      return {
        found: true,
        tenant_id: tenant._id,
        total_payments: payments.length,
        punctuality_rate: punctualityRate,
        total_amount_paid: payments.reduce((sum, p) => sum + p.amount, 0),
        average_rent: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0
      };
    } catch (error) {
      console.error('Error analyzing rental history:', error);
      return { found: false, error: 'Unable to verify rental history' };
    }
  }

  static assessTenantRisk(tenantData) {
    let riskLevel = 'low';
    let riskFactors = [];

    // Income assessment
    if (tenantData.monthly_income < 30000) {
      riskLevel = 'high';
      riskFactors.push('Low income relative to rent');
    } else if (tenantData.monthly_income < 60000) {
      riskLevel = 'medium';
      riskFactors.push('Moderate income level');
    }

    // Employment stability
    if (tenantData.employment_years < 1) {
      riskLevel = 'high';
      riskFactors.push('Recent employment change');
    }

    // Age assessment
    if (tenantData.age < 21 || tenantData.age > 65) {
      riskFactors.push('Age-related risk factor');
    }

    return {
      risk_level: riskLevel,
      risk_factors: riskFactors,
      recommended_rent_ratio: this.calculateRecommendedRentRatio(tenantData)
    };
  }

  static calculateRecommendedRentRatio(tenantData) {
    // Recommended rent should not exceed 30% of monthly income
    const recommendedMaxRent = tenantData.monthly_income * 0.3;
    return {
      recommended_max_rent: recommendedMaxRent,
      rent_to_income_ratio: (recommendedMaxRent / tenantData.monthly_income) * 100
    };
  }

  static generateTenantRecommendations(tenantData) {
    const recommendations = [];
    
    if (tenantData.monthly_income < 50000) {
      recommendations.push({
        type: 'financial',
        message: 'Consider requiring additional security deposit or guarantor.',
        priority: 'medium'
      });
    }

    if (tenantData.employment_years < 2) {
      recommendations.push({
        type: 'employment',
        message: 'Verify employment stability and consider shorter lease term.',
        priority: 'medium'
      });
    }

    recommendations.push({
      type: 'general',
      message: 'Conduct thorough background check and contact references.',
      priority: 'high'
    });

    return recommendations;
  }

  static async getPropertyInsights(propertyId) {
    try {
      const property = await Property.findById(propertyId);
      
      // Get performance data
      const [expenseData, maintenanceData, occupancyData] = await Promise.all([
        this.getExpensePredictions(propertyId),
        this.getMaintenancePredictions(propertyId),
        this.getOccupancyTrends(propertyId)
      ]);

      const insights = {
        property_id: propertyId,
        property_details: property,
        financial_performance: {
          expense_predictions: expenseData.predictions,
          roi_projection: this.calculateROIProjection(property, expenseData),
          market_comparison: this.getMarketComparison(property)
        },
        operational_insights: {
          maintenance_risks: maintenanceData.risk_assessment,
          occupancy_trends: occupancyData,
          optimization_opportunities: this.identifyOptimizationOpportunities(property, expenseData, maintenanceData)
        },
        recommendations: this.generatePropertyRecommendations(property, expenseData, maintenanceData, occupancyData)
      };

      return insights;
    } catch (error) {
      console.error('Error generating property insights:', error);
      throw error;
    }
  }

  static async getOccupancyTrends(propertyId) {
    const property = await Property.findById(propertyId);
    
    // Get current occupancy
    const currentOccupancy = await Property.getPropertyStats(propertyId);
    
    // Calculate trends (simplified)
    const trends = {
      current_occupancy_rate: currentOccupancy.occupancy_rate,
      average_occupancy_rate: currentOccupancy.occupancy_rate, // Would calculate from historical data
      trend_direction: 'stable', // Would analyze historical data
      vacancy_duration: 30 // Average days vacant
    };

    return trends;
  }

  static calculateROIProjection(property, expenseData) {
    const monthlyIncome = property.total_units * property.average_rent || 50000;
    const monthlyExpenses = expenseData.predictions.reduce((sum, p) => sum + p.total_predicted, 0) / 12;
    const monthlyProfit = monthlyIncome - monthlyExpenses;
    const annualROI = (monthlyProfit * 12) / property.property_value * 100;

    return {
      monthly_income: monthlyIncome,
      monthly_expenses: monthlyExpenses,
      monthly_profit: monthlyProfit,
      annual_roi_percentage: annualROI,
      projected_appreciation: 5 // 5% annual appreciation assumption
    };
  }

  static getMarketComparison(property) {
    // Simulated market comparison
    return {
      area_average_rent: property.average_rent * 1.1, // 10% above market average
      area_average_occupancy: 85,
      market_trend: 'increasing',
      competitiveness_score: 8.5
    };
  }

  static identifyOptimizationOpportunities(property, expenseData, maintenanceData) {
    const opportunities = [];

    // Expense optimization
    const highExpenseCategories = Object.entries(expenseData.predictions[0].predicted_expenses)
      .filter(([_, amount]) => amount > 10000)
      .map(([category]) => category);

    if (highExpenseCategories.length > 0) {
      opportunities.push({
        type: 'expense_optimization',
        categories: highExpenseCategories,
        potential_savings: '15-20%',
        recommendation: 'Review vendors and consider preventive maintenance'
      });
    }

    // Maintenance optimization
    if (maintenanceData.risk_assessment.risk_level === 'high') {
      opportunities.push({
        type: 'maintenance_optimization',
        issue: 'High maintenance risk detected',
        recommendation: 'Implement preventive maintenance schedule'
      });
    }

    return opportunities;
  }

  static generatePropertyRecommendations(property, expenseData, maintenanceData, occupancyData) {
    const recommendations = [];

    // Financial recommendations
    const roi = this.calculateROIProjection(property, expenseData);
    if (roi.annual_roi_percentage < 8) {
      recommendations.push({
        type: 'financial',
        priority: 'high',
        message: 'ROI is below optimal. Consider rent adjustments or expense optimization.',
        action_items: ['Review market rates', 'Analyze expense patterns', 'Consider value-added improvements']
      });
    }

    // Maintenance recommendations
    if (maintenanceData.risk_assessment.open_tickets > 5) {
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        message: 'Multiple open maintenance tickets. Address promptly to maintain tenant satisfaction.',
        action_items: ['Prioritize urgent tickets', 'Schedule regular maintenance', 'Consider preventive contracts']
      });
    }

    // Occupancy recommendations
    if (occupancyData.current_occupancy_rate < 90) {
      recommendations.push({
        type: 'occupancy',
        priority: 'high',
        message: 'Occupancy rate below optimal. Implement marketing strategies.',
        action_items: ['Enhance property marketing', 'Review rental rates', 'Improve property amenities']
      });
    }

    return recommendations;
  }
}

module.exports = AIService;

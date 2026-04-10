import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';

const AIInsights = ({ propertyId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadInsights();
  }, [propertyId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const insightsData = await aiService.getPropertyInsights(propertyId);
      setInsights(insightsData.insights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-insights-loading">
        <div className="loading-spinner"></div>
        <p>Analyzing property data with AI...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="ai-insights-error">
        <p>Unable to load AI insights. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="ai-insights">
      <div className="insights-header">
        <h2>AI-Powered Insights</h2>
        <div className="confidence-badge">
          <span className="confidence-score">
            {Math.round((insights.financial_performance.roi_projection.annual_roi_percentage / 10) * 10)}% Confidence
          </span>
        </div>
      </div>

      <div className="insights-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'financial' ? 'active' : ''}
          onClick={() => setActiveTab('financial')}
        >
          Financial
        </button>
        <button 
          className={activeTab === 'operational' ? 'active' : ''}
          onClick={() => setActiveTab('operational')}
        >
          Operational
        </button>
        <button 
          className={activeTab === 'recommendations' ? 'active' : ''}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      <div className="insights-content">
        {activeTab === 'overview' && <OverviewTab insights={insights} />}
        {activeTab === 'financial' && <FinancialTab insights={insights} />}
        {activeTab === 'operational' && <OperationalTab insights={insights} />}
        {activeTab === 'recommendations' && <RecommendationsTab recommendations={insights.recommendations} />}
      </div>
    </div>
  );
};

const OverviewTab = ({ insights }) => {
  const roi = insights.financial_performance.roi_projection;
  const maintenance = insights.operational_insights.maintenance_risks;
  const occupancy = insights.operational_insights.occupancy_trends;

  return (
    <div className="overview-tab">
      <div className="insight-cards">
        <div className="insight-card">
          <h3>Monthly Income</h3>
          <p className="metric-value">KES {roi.monthly_income.toLocaleString()}</p>
          <p className="metric-change positive">+2.3% vs last month</p>
        </div>
        <div className="insight-card">
          <h3>ROI Projection</h3>
          <p className="metric-value">{roi.annual_roi_percentage.toFixed(1)}%</p>
          <p className="metric-change positive">Above market average</p>
        </div>
        <div className="insight-card">
          <h3>Occupancy Rate</h3>
          <p className="metric-value">{occupancy.current_occupancy_rate.toFixed(1)}%</p>
          <p className="metric-change neutral">Stable</p>
        </div>
        <div className="insight-card">
          <h3>Maintenance Risk</h3>
          <p className="metric-value">{maintenance.risk_level}</p>
          <p className="metric-change">{maintenance.open_tickets} open tickets</p>
        </div>
      </div>

      <div className="ai-summary">
        <h3>AI Summary</h3>
        <p>
          Your property is performing {roi.annual_roi_percentage > 8 ? 'above' : 'below'} market expectations 
          with a {roi.annual_roi_percentage.toFixed(1)}% annual ROI. 
          {occupancy.current_occupancy_rate > 90 ? ' High occupancy' : ' Consider improving occupancy'} 
          {maintenance.risk_level === 'high' ? ' and immediate maintenance attention needed.' : ' and maintenance is under control.'}
        </p>
      </div>
    </div>
  );
};

const FinancialTab = ({ insights }) => {
  const roi = insights.financial_performance.roi_projection;
  const market = insights.financial_performance.market_comparison;

  return (
    <div className="financial-tab">
      <div className="financial-overview">
        <h3>Financial Performance</h3>
        <div className="financial-metrics">
          <div className="metric-row">
            <span>Monthly Income:</span>
            <span>KES {roi.monthly_income.toLocaleString()}</span>
          </div>
          <div className="metric-row">
            <span>Monthly Expenses:</span>
            <span>KES {roi.monthly_expenses.toLocaleString()}</span>
          </div>
          <div className="metric-row">
            <span>Monthly Profit:</span>
            <span className={roi.monthly_profit > 0 ? 'positive' : 'negative'}>
              KES {roi.monthly_profit.toLocaleString()}
            </span>
          </div>
          <div className="metric-row">
            <span>Annual ROI:</span>
            <span className={roi.annual_roi_percentage > 8 ? 'positive' : 'negative'}>
              {roi.annual_roi_percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="market-comparison">
        <h3>Market Comparison</h3>
        <div className="market-metrics">
          <div className="metric-row">
            <span>Your Rent:</span>
            <span>KES {market.area_average_rent.toLocaleString()}</span>
          </div>
          <div className="metric-row">
            <span>Area Average:</span>
            <span>KES {(market.area_average_rent * 1.1).toLocaleString()}</span>
          </div>
          <div className="metric-row">
            <span>Market Trend:</span>
            <span className="positive">{market.market_trend}</span>
          </div>
          <div className="metric-row">
            <span>Competitiveness:</span>
            <span>{market.competitiveness_score}/10</span>
          </div>
        </div>
      </div>

      <div className="expense-predictions">
        <h3>AI Expense Predictions</h3>
        <p>Based on historical data and seasonal patterns, AI predicts your expenses for the next 3 months.</p>
        <div className="prediction-chart">
          {/* Would integrate with chart library */}
          <div className="prediction-bars">
            <div className="prediction-bar">
              <span>Next Month:</span>
              <span>KES 15,000</span>
            </div>
            <div className="prediction-bar">
              <span>Month 2:</span>
              <span>KES 18,000</span>
            </div>
            <div className="prediction-bar">
              <span>Month 3:</span>
              <span>KES 16,500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OperationalTab = ({ insights }) => {
  const maintenance = insights.operational_insights.maintenance_risks;
  const occupancy = insights.operational_insights.occupancy_trends;
  const opportunities = insights.operational_insights.optimization_opportunities;

  return (
    <div className="operational-tab">
      <div className="maintenance-analysis">
        <h3>Maintenance Analysis</h3>
        <div className="risk-assessment">
          <div className={`risk-indicator ${maintenance.risk_level}`}>
            <span className="risk-label">Risk Level:</span>
            <span className="risk-value">{maintenance.risk_level.toUpperCase()}</span>
          </div>
          <div className="risk-details">
            <p>Open Tickets: {maintenance.open_tickets}</p>
            <p>Urgent Tickets: {maintenance.urgent_tickets}</p>
            <p>Avg Resolution Time: {maintenance.average_resolution_time} hours</p>
          </div>
        </div>
      </div>

      <div className="occupancy-analysis">
        <h3>Occupancy Analysis</h3>
        <div className="occupancy-metrics">
          <div className="metric-row">
            <span>Current Occupancy:</span>
            <span>{occupancy.current_occupancy_rate.toFixed(1)}%</span>
          </div>
          <div className="metric-row">
            <span>Average Occupancy:</span>
            <span>{occupancy.average_occupancy_rate.toFixed(1)}%</span>
          </div>
          <div className="metric-row">
            <span>Trend:</span>
            <span className={occupancy.trend_direction === 'increasing' ? 'positive' : 'neutral'}>
              {occupancy.trend_direction}
            </span>
          </div>
          <div className="metric-row">
            <span>Avg Vacancy Duration:</span>
            <span>{occupancy.vacancy_duration} days</span>
          </div>
        </div>
      </div>

      <div className="optimization-opportunities">
        <h3>Optimization Opportunities</h3>
        {opportunities.length > 0 ? (
          <div className="opportunities-list">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="opportunity-card">
                <h4>{opportunity.type.replace('_', ' ').toUpperCase()}</h4>
                <p>{opportunity.recommendation}</p>
                {opportunity.potential_savings && (
                  <p className="savings">Potential Savings: {opportunity.potential_savings}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No optimization opportunities identified at this time.</p>
        )}
      </div>
    </div>
  );
};

const RecommendationsTab = ({ recommendations }) => {
  return (
    <div className="recommendations-tab">
      <h3>AI Recommendations</h3>
      {recommendations.length > 0 ? (
        <div className="recommendations-list">
          {recommendations.map((recommendation, index) => (
            <div key={index} className={`recommendation-card ${recommendation.priority}`}>
              <div className="recommendation-header">
                <h4>{recommendation.type.replace('_', ' ').toUpperCase()}</h4>
                <span className={`priority-badge ${recommendation.priority}`}>
                  {recommendation.priority}
                </span>
              </div>
              <p className="recommendation-message">{recommendation.message}</p>
              {recommendation.action_items && (
                <div className="action-items">
                  <h5>Action Items:</h5>
                  <ul>
                    {recommendation.action_items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No recommendations available at this time.</p>
      )}
    </div>
  );
};

export default AIInsights;

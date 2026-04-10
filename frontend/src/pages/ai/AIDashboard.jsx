import React, { useState, useEffect } from 'react';
import { aiService } from '../../services/aiService';
import AIInsights from '../../components/ai/AIInsights';
import TenantScreening from '../../components/ai/TenantScreening';
import MarketAnalysis from '../../components/ai/MarketAnalysis';
import PortfolioInsights from '../../components/ai/PortfolioInsights';

const AIDashboard = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [portfolioData, setPortfolioData] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState('');

  useEffect(() => {
    if (activeTab === 'portfolio') {
      loadPortfolioData();
    }
    if (activeTab === 'market') {
      loadMarketData();
    }
  }, [activeTab]);

  const loadPortfolioData = async () => {
    try {
      const data = await aiService.getPortfolioInsights();
      setPortfolioData(data.portfolio_insights);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      const data = await aiService.getMarketAnalysis('Nairobi', 'apartment');
      setMarketData(data.market_analysis);
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  return (
    <div className="ai-dashboard">
      <div className="dashboard-header">
        <h1>AI-Powered Real Estate Intelligence</h1>
        <p>Get data-driven insights and predictions for your properties</p>
      </div>

      <div className="ai-tabs">
        <button 
          className={activeTab === 'insights' ? 'active' : ''}
          onClick={() => setActiveTab('insights')}
        >
          Property Insights
        </button>
        <button 
          className={activeTab === 'screening' ? 'active' : ''}
          onClick={() => setActiveTab('screening')}
        >
          Tenant Screening
        </button>
        <button 
          className={activeTab === 'portfolio' ? 'active' : ''}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio Analysis
        </button>
        <button 
          className={activeTab === 'market' ? 'active' : ''}
          onClick={() => setActiveTab('market')}
        >
          Market Analysis
        </button>
      </div>

      <div className="ai-content">
        {activeTab === 'insights' && (
          <div className="insights-container">
            <div className="property-selector">
              <label>Select Property:</label>
              <select 
                value={selectedProperty} 
                onChange={(e) => setSelectedProperty(e.target.value)}
              >
                <option value="">Choose a property...</option>
                {/* Would populate with user's properties */}
                <option value="property1">Apartment A - Kilimani</option>
                <option value="property2">House B - Westlands</option>
              </select>
            </div>
            {selectedProperty ? (
              <AIInsights propertyId={selectedProperty} />
            ) : (
              <div className="select-property-prompt">
                <h3>Select a Property to Get AI Insights</h3>
                <p>Choose a property from the dropdown above to see detailed AI analysis including expense predictions, maintenance risks, and optimization recommendations.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'screening' && <TenantScreening />}

        {activeTab === 'portfolio' && (
          <PortfolioInsights portfolioData={portfolioData} />
        )}

        {activeTab === 'market' && (
          <MarketAnalysis marketData={marketData} />
        )}
      </div>
    </div>
  );
};

export default AIDashboard;

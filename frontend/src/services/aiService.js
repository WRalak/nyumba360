import api from './api';

export const aiService = {
  // Get expense predictions
  getExpensePredictions: (propertyId, months = 12) => {
    const params = new URLSearchParams({ property_id: propertyId, months });
    return api.get(`/ai/predictions/expenses?${params}`);
  },

  // Get maintenance predictions
  getMaintenancePredictions: (propertyId) => {
    const params = new URLSearchParams({ property_id: propertyId });
    return api.get(`/ai/predictions/maintenance?${params}`);
  },

  // Tenant screening
  screenTenant: (tenantData) => api.post('/ai/screening/tenant', tenantData),

  // Get property insights
  getPropertyInsights: (propertyId) => {
    const params = new URLSearchParams({ property_id: propertyId });
    return api.get(`/ai/insights/property?${params}`);
  },

  // Get portfolio insights
  getPortfolioInsights: () => api.get('/ai/insights/portfolio'),

  // Get market analysis
  getMarketAnalysis: (county, propertyType) => {
    const params = new URLSearchParams({ county, property_type: propertyType });
    return api.get(`/ai/analysis/market?${params}`);
  },

  // Get AI recommendations
  getRecommendations: (category, propertyId) => {
    const params = new URLSearchParams({ category, property_id: propertyId });
    return api.get(`/ai/recommendations?${params}`);
  },
};

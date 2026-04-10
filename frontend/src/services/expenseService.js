import api from './api';

export const expenseService = {
  // Get expenses with filters
  getExpenses: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/expenses?${params}`);
  },

  // Create expense
  createExpense: (expenseData) => api.post('/expenses', expenseData),

  // Update expense
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),

  // Delete expense
  deleteExpense: (id) => api.delete(`/expenses/${id}`),

  // Get expense summary
  getExpenseSummary: (filters) => {
    const params = new URLSearchParams(filters);
    return api.get(`/expenses/summary?${params}`);
  },

  // Get expense trends
  getExpenseTrends: (filters) => {
    const params = new URLSearchParams(filters);
    return api.get(`/expenses/trends?${params}`);
  },

  // Get vendor analysis
  getVendorAnalysis: (filters) => {
    const params = new URLSearchParams(filters);
    return api.get(`/expenses/vendor-analysis?${params}`);
  },
};

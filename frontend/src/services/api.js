import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug: Log the API base URL
console.log('API Base URL:', API_BASE_URL);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  logout: () => api.post('/auth/logout'),
};

// Properties API
export const propertyAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (propertyData) => api.post('/properties', propertyData),
  update: (id, propertyData) => api.put(`/properties/${id}`, propertyData),
  delete: (id) => api.delete(`/properties/${id}`),
  getStats: (landlordId) => api.get(`/properties/stats/${landlordId}`),
};

// Units API
export const unitAPI = {
  getAll: (propertyId) => api.get(`/units?property_id=${propertyId}`),
  getById: (id) => api.get(`/units/${id}`),
  create: (unitData) => api.post('/units', unitData),
  update: (id, unitData) => api.put(`/units/${id}`, unitData),
  delete: (id) => api.delete(`/units/${id}`),
};

// Tenants API
export const tenantAPI = {
  getAll: (params) => api.get('/tenants', { params }),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (tenantData) => api.post('/tenants', tenantData),
  update: (id, tenantData) => api.put(`/tenants/${id}`, tenantData),
  delete: (id) => api.delete(`/tenants/${id}`),
};

// Payments API
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (paymentData) => api.post('/payments', paymentData),
  update: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  getStats: (params) => api.get('/payments/stats', { params }),
  initiateMpesa: (paymentData) => api.post('/payments/mpesa/initiate', paymentData),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (maintenanceData) => api.post('/maintenance', maintenanceData),
  update: (id, maintenanceData) => api.put(`/maintenance/${id}`, maintenanceData),
  delete: (id) => api.delete(`/maintenance/${id}`),
};

export default api;

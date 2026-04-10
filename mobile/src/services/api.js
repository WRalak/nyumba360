import axios from 'axios';
import { apiLogger } from '../utils/debug';

// API base URL - change this to your production URL
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api' // Use localhost for development
  : 'https://api.nyumba360.co.ke/api'; // Production URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error adding auth token:', error);
    }
    return apiLogger.request(config);
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => apiLogger.response(response),
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await clearAuthToken();
      // Navigate to login screen
      // This will be handled by the AuthContext
    }
    return apiLogger.error(error);
  }
);

// Storage functions (to be implemented with AsyncStorage)
const getAuthToken = async () => {
  try {
    const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const clearAuthToken = async () => {
  try {
    const { AsyncStorage } = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.removeItem('token');
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  googleSignIn: (googleData) => api.post('/auth/google-signin', googleData),
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
  getUnits: (propertyId) => api.get(`/properties/${propertyId}/units`),
};

// Units API
export const unitAPI = {
  getAll: (propertyId) => api.get('/units', { params: { property_id: propertyId } }),
  getById: (id) => api.get(`/units/${id}`),
  create: (unitData) => api.post('/units', unitData),
  update: (id, unitData) => api.put(`/units/${id}`, unitData),
  delete: (id) => api.delete(`/units/${id}`),
  getTenants: (unitId) => api.get(`/units/${unitId}/tenants`),
};

// Tenants API
export const tenantAPI = {
  getAll: (params) => api.get('/tenants', { params }),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (tenantData) => api.post('/tenants', tenantData),
  update: (id, tenantData) => api.put(`/tenants/${id}`, tenantData),
  delete: (id) => api.delete(`/tenants/${id}`),
  getLeaseInfo: (tenantId) => api.get(`/tenants/${tenantId}/lease`),
};

// Payments API
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (paymentData) => api.post('/payments', paymentData),
  update: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  getStats: (params) => api.get('/payments/stats', { params }),
  initiateMpesa: (paymentData) => api.post('/payments/mpesa/initiate', paymentData),
  getPaymentHistory: (tenantId) => api.get(`/payments/tenant/${tenantId}`),
  getRentStatus: (tenantId) => api.get(`/payments/rent-status/${tenantId}`),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (maintenanceData) => api.post('/maintenance', maintenanceData),
  update: (id, maintenanceData) => api.put(`/maintenance/${id}`, maintenanceData),
  delete: (id) => api.delete(`/maintenance/${id}`),
  getByProperty: (propertyId) => api.get(`/maintenance/property/${propertyId}`),
  getByTenant: (tenantId) => api.get(`/maintenance/tenant/${tenantId}`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (formData) => {
    const uploadApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return uploadApi.post('/upload/image', formData);
  },
  uploadDocument: (formData) => {
    const uploadApi = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return uploadApi.post('/upload/document', formData);
  },
};

// Notifications API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;

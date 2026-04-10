import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorHandler from './errorHandler';

class NetworkUtils {
  constructor() {
    this.baseURL = __DEV__ ? 'http://192.168.0.101:5001' : 'https://api.nyumba360.com';
    this.timeout = 10000;
    this.retryCount = 3;
    this.retryDelay = 1000;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get device-specific configuration
  static getDeviceConfig() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isWeb: Platform.OS === 'web',
      isMobile: Platform.OS !== 'web',
      userAgent: Platform.OS === 'web' ? navigator.userAgent : 'ReactNative'
    };
  }

  // Create optimized headers
  static createHeaders(customHeaders = {}) {
    const deviceConfig = this.getDeviceConfig();
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Platform': deviceConfig.platform,
      'X-Platform-Version': deviceConfig.version,
      'X-Client-Version': '1.0.0',
      'X-Device-ID': this.getDeviceId(),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...customHeaders
    };

    // Add authentication if available
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Get unique device ID
  static async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      return `fallback_device_${Date.now()}`;
    }
  }

  // Get authentication token
  static async getAuthToken() {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      return null;
    }
  }

  // Set authentication token
  static async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  // Clear authentication token
  static async clearAuthToken() {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  // Make network request with retry logic
  static async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: this.createHeaders(),
      timeout: this.timeout,
      ...options
    };

    // Add body for POST/PUT requests
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`Network request [${attempt}/${this.retryCount}]:`, url);
        
        const response = await this.makeRequest(url, config);
        
        // Handle response
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache successful GET requests
        if (config.method === 'GET' && data.success) {
          this.setCache(url, data);
        }
        
        return data;
        
      } catch (error) {
        lastError = error;
        console.error(`Request attempt ${attempt} failed:`, error.message);
        
        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          break;
        }
        
        // Wait before retry (except for last attempt)
        if (attempt < this.retryCount) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    // All attempts failed
    throw lastError;
  }

  // Make actual request based on platform
  static async makeRequest(url, config) {
    if (Platform.OS === 'web') {
      // Web fetch
      return fetch(url, config);
    } else {
      // React Native fetch
      return fetch(url, config);
    }
  }

  // Delay helper
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cache management
  static setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static getCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clearCache() {
    this.cache.clear();
  }

  // HTTP methods
  static async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    // Check cache first
    const cached = this.getCache(url);
    if (cached) {
      console.log('Cache hit for:', url);
      return cached;
    }
    
    return this.request(url);
  }

  static async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data
    });
  }

  static async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data
    });
  }

  static async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  // File upload
  static async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    
    // Add file
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'upload.jpg'
    });
    
    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
    
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...this.createHeaders({ 'Content-Type': undefined })
      },
      body: formData,
      timeout: 30000 // Longer timeout for uploads
    };
    
    return this.request(endpoint, config);
  }

  // Batch requests
  static async batchRequest(requests) {
    const promises = requests.map(request => {
      const { method, endpoint, data } = request;
      
      switch (method) {
        case 'GET':
          return this.get(endpoint, data);
        case 'POST':
          return this.post(endpoint, data);
        case 'PUT':
          return this.put(endpoint, data);
        case 'PATCH':
          return this.patch(endpoint, data);
        case 'DELETE':
          return this.delete(endpoint);
        default:
          return this.request(endpoint, data);
      }
    });
    
    try {
      const results = await Promise.allSettled(promises);
      
      return results.map((result, index) => ({
        index,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
      
    } catch (error) {
      throw new Error(`Batch request failed: ${error.message}`);
    }
  }

  // Network status check
  static async checkNetworkStatus() {
    try {
      // Simple ping to server
      const response = await this.request('/health');
      return {
        online: true,
        server: 'online',
        latency: Date.now()
      };
    } catch (error) {
      return {
        online: false,
        server: 'offline',
        error: error.message
      };
    }
  }

  // Download file
  static async downloadFile(endpoint, filename) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      // In React Native, we'd use FileSystem module
      if (Platform.OS !== 'web') {
        const FileSystem = require('expo-file-system');
        const fileUri = FileSystem.documentDirectory + filename;
        
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true });
        await FileSystem.writeAsStringAsync(fileUri, await response.text());
        
        return {
          success: true,
          uri: fileUri
        };
      } else {
        // Web download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        
        return {
          success: true,
          url
        };
      }
      
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  // API service methods for Nyumba360
  static async login(credentials) {
    return this.post('/api/auth/login', credentials);
  }

  static async register(userData) {
    return this.post('/api/auth/register', userData);
  }

  static async getProfile() {
    return this.get('/api/profile');
  }

  static async updateProfile(profileData) {
    return this.put('/api/profile', profileData);
  }

  static async getProperties() {
    return this.get('/api/properties');
  }

  static async createProperty(propertyData) {
    return this.post('/api/properties', propertyData);
  }

  static async updateProperty(id, propertyData) {
    return this.put(`/api/properties/${id}`, propertyData);
  }

  static async deleteProperty(id) {
    return this.delete(`/api/properties/${id}`);
  }

  static async getTenants() {
    return this.get('/api/tenants');
  }

  static async createTenant(tenantData) {
    return this.post('/api/tenants', tenantData);
  }

  static async updateTenant(id, tenantData) {
    return this.put(`/api/tenants/${id}`, tenantData);
  }

  static async getPayments() {
    return this.get('/api/payments');
  }

  static async createPayment(paymentData) {
    return this.post('/api/payments', paymentData);
  }

  static async getMaintenanceRequests() {
    return this.get('/api/maintenance');
  }

  static async createMaintenanceRequest(requestData) {
    return this.post('/api/maintenance', requestData);
  }

  static async sendNotification(notificationData) {
    return this.post('/api/notifications', notificationData);
  }

  // Image upload
  static async uploadProfileImage(image) {
    return this.uploadFile('/api/profile/upload-image', image);
  }

  static async uploadPropertyImage(propertyId, image) {
    return this.uploadFile(`/api/properties/${propertyId}/upload-image`, image);
  }

  // Search and filtering
  static async searchProperties(query) {
    return this.get('/api/properties/search', { q: query });
  }

  static async searchTenants(query) {
    return this.get('/api/tenants/search', { q: query });
  }

  // Statistics and analytics
  static async getDashboardStats() {
    return this.get('/api/profile/stats');
  }

  static async getPropertyStats(propertyId) {
    return this.get(`/api/properties/${propertyId}/stats`);
  }

  // Notification preferences
  static async updateNotificationPreferences(preferences) {
    return this.put('/api/profile/notifications', preferences);
  }

  // Error handling wrapper
  static async safeRequest(method, ...args) {
    try {
      return await this[method](...args);
    } catch (error) {
      ErrorHandler.handleError(error, `NetworkUtils.${method}`);
      throw error;
    }
  }

  // Initialize network utilities
  static initialize() {
    console.log('Network utils initialized');
    
    // Set up network status monitoring
    if (Platform.OS === 'web') {
      window.addEventListener('online', () => {
        console.log('Network connected');
      });
      
      window.addEventListener('offline', () => {
        console.log('Network disconnected');
      });
    }
    
    return this.getDeviceConfig();
  }
}

// Export singleton instance
export default new NetworkUtils();

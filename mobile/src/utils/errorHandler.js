import { Alert, Platform } from 'react-native';
import MobileOptimization from '../middleware/mobileOptimization';

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  // Handle different types of errors
  static handleError(error, context = '', showUserAlert = true) {
    const errorInfo = this.processError(error, context);
    
    // Log error for debugging
    console.error('Error Handler:', errorInfo);
    
    // Add to error log
    this.addToErrorLog(errorInfo);
    
    // Show user-friendly message
    if (showUserAlert) {
      this.showUserError(errorInfo);
    }
    
    // Send to monitoring service
    this.reportError(errorInfo);
    
    return errorInfo;
  }

  // Process and categorize errors
  static processError(error, context) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      context,
      platform: Platform.OS,
      
      // Error details
      message: error.message || 'Unknown error',
      stack: error.stack || '',
      code: error.code || '',
      status: error.status || '',
      
      // Categorization
      type: this.categorizeError(error),
      severity: this.getSeverity(error),
      recoverable: this.isRecoverable(error),
      
      // User info
      userMessage: this.getUserMessage(error),
      actionRequired: this.getActionRequired(error),
      
      // Device info
      deviceInfo: MobileOptimization.getDeviceInfo()
    };
    
    return errorInfo;
  }

  // Categorize error type
  static categorizeError(error) {
    const message = (error.message || '').toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    
    if (message.includes('timeout')) {
      return 'timeout';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    if (message.includes('storage') || message.includes('database')) {
      return 'storage';
    }
    
    if (message.includes('camera') || message.includes('photo')) {
      return 'camera';
    }
    
    if (message.includes('location') || message.includes('gps')) {
      return 'location';
    }
    
    if (message.includes('notification')) {
      return 'notification';
    }
    
    if (message.includes('authentication') || message.includes('login')) {
      return 'authentication';
    }
    
    return 'unknown';
  }

  // Get error severity
  static getSeverity(error) {
    const message = (error.message || '').toLowerCase();
    const status = error.status || 0;
    
    // Critical errors
    if (status >= 500 || message.includes('crash') || message.includes('fatal')) {
      return 'critical';
    }
    
    // High severity
    if (status >= 400 || message.includes('permission') || message.includes('authentication')) {
      return 'high';
    }
    
    // Medium severity
    if (message.includes('network') || message.includes('timeout') || message.includes('validation')) {
      return 'medium';
    }
    
    // Low severity
    return 'low';
  }

  // Check if error is recoverable
  static isRecoverable(error) {
    const message = (error.message || '').toLowerCase();
    const recoverableErrors = [
      'network',
      'timeout',
      'validation',
      'storage',
      'camera',
      'location',
      'notification'
    ];
    
    return recoverableErrors.some(type => message.includes(type));
  }

  // Get user-friendly error message
  static getUserMessage(error) {
    const message = error.message || '';
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    // Permission errors
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'Permission denied. Please check your app permissions and try again.';
    }
    
    // Authentication errors
    if (message.includes('authentication') || message.includes('login')) {
      return 'Authentication error. Please log in again.';
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Invalid information provided. Please check your input and try again.';
    }
    
    // Storage errors
    if (message.includes('storage') || message.includes('database')) {
      return 'Storage error. Please free up some space and try again.';
    }
    
    // Camera errors
    if (message.includes('camera') || message.includes('photo')) {
      return 'Camera error. Please check camera permissions and try again.';
    }
    
    // Location errors
    if (message.includes('location') || message.includes('gps')) {
      return 'Location error. Please check location permissions and try again.';
    }
    
    // Notification errors
    if (message.includes('notification')) {
      return 'Notification error. Please check notification permissions.';
    }
    
    // Server errors
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    // Default message
    return 'An unexpected error occurred. Please try again.';
  }

  // Get required action for error
  static getActionRequired(error) {
    const message = (error.message || '').toLowerCase();
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'Check internet connection';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'Check app permissions';
    }
    
    if (message.includes('authentication') || message.includes('login')) {
      return 'Log in again';
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Check input data';
    }
    
    if (message.includes('storage') || message.includes('database')) {
      return 'Free up storage space';
    }
    
    if (message.includes('camera') || message.includes('photo')) {
      return 'Enable camera access';
    }
    
    if (message.includes('location') || message.includes('gps')) {
      return 'Enable location access';
    }
    
    return 'Try again';
  }

  // Show user-friendly error alert
  static showUserError(errorInfo) {
    const title = this.getAlertTitle(errorInfo.severity);
    const message = errorInfo.userMessage;
    
    if (Platform.OS === 'web') {
      // Web alert
      window.alert(`${title}: ${message}`);
    } else {
      // React Native alert
      Alert.alert(
        title,
        message,
        [
          {
            text: 'OK',
            style: 'default'
          },
          ...(errorInfo.recoverable ? [{
            text: 'Retry',
            style: 'default',
            onPress: () => this.retryAction(errorInfo)
          }] : [])
        ],
        { cancelable: false }
      );
    }
  }

  // Get alert title based on severity
  static getAlertTitle(severity) {
    switch (severity) {
      case 'critical':
        return 'Critical Error';
      case 'high':
        return 'Error';
      case 'medium':
        return 'Warning';
      case 'low':
        return 'Notice';
      default:
        return 'Information';
    }
  }

  // Retry action for recoverable errors
  static retryAction(errorInfo) {
    console.log('Retrying action for error:', errorInfo.id);
    
    // Emit retry event
    if (this.onRetry) {
      this.onRetry(errorInfo);
    }
    
    // Could implement specific retry logic here
    switch (errorInfo.type) {
      case 'network':
        this.retryNetworkRequest(errorInfo);
        break;
      case 'timeout':
        this.retryWithDelay(errorInfo, 2000);
        break;
      case 'validation':
        this.retryValidation(errorInfo);
        break;
      default:
        this.retryGeneric(errorInfo);
    }
  }

  // Retry network request
  static retryNetworkRequest(errorInfo) {
    console.log('Retrying network request...');
    // Implementation would depend on specific request
  }

  // Retry with delay
  static retryWithDelay(errorInfo, delay) {
    setTimeout(() => {
      console.log('Retrying after delay...');
      this.retryGeneric(errorInfo);
    }, delay);
  }

  // Retry validation
  static retryValidation(errorInfo) {
    console.log('Retrying validation...');
    // Clear form and retry
  }

  // Generic retry
  static retryGeneric(errorInfo) {
    console.log('Generic retry...');
    // Generic retry implementation
  }

  // Add error to log
  static addToErrorLog(errorInfo) {
    this.errorLog.push(errorInfo);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  // Report error to monitoring service
  static async reportError(errorInfo) {
    try {
      if (!__DEV__) {
        // Only report in production
        await fetch('https://api.nyumba360.com/errors/mobile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorInfo)
        });
      }
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // Generate unique error ID
  static generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get error statistics
  static getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.slice(-10),
      platform: Platform.OS
    };
    
    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });
    
    return stats;
  }

  // Clear error log
  static clearErrorLog() {
    this.errorLog = [];
  }

  // Export error log
  static exportErrorLog() {
    return JSON.stringify(this.errorLog, null, 2);
  }

  // Handle async errors
  static handleAsyncError(error, context) {
    if (error instanceof Error) {
      return this.handleError(error, context);
    }
    
    // Handle promise rejections
    const errorObj = new Error(error?.message || 'Unknown async error');
    errorObj.stack = error?.stack;
    return this.handleError(errorObj, context);
  }

  // Wrap async functions with error handling
  static wrapAsync(asyncFn, context = '') {
    return async (...args) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        this.handleError(error, context);
        throw error; // Re-throw to allow caller to handle
      }
    };
  }

  // Global error handler setup
  static setupGlobalHandlers() {
    if (Platform.OS === 'web') {
      // Web error handlers
      window.addEventListener('error', (event) => {
        this.handleError(event.error, 'Global Error');
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.handleAsyncError(event.reason, 'Unhandled Promise Rejection');
      });
    }
    
    // React Native error boundaries would be set up in components
    console.log('Global error handlers setup complete');
  }

  // Create error boundary fallback
  static createErrorBoundaryFallback(error, errorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: 'Error Boundary'
    };
    
    return this.handleError(error, 'Error Boundary', false);
  }
}

// Export singleton instance
export default new ErrorHandler();

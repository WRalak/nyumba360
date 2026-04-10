import { Platform, Dimensions, StatusBar } from 'react-native';
import { Constants } from 'expo-constants';

// Device detection and optimization
class MobileOptimization {
  // Get device information
  static getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isAndroid: Platform.OS === 'android',
      isIOS: Platform.OS === 'ios',
      isWeb: Platform.OS === 'web',
      dimensions: Dimensions.get('window'),
      statusBarHeight: StatusBar.currentHeight || 0,
      constants: Constants
    };
  }

  // Responsive design utilities
  static getResponsiveValue(values) {
    const { width } = Dimensions.get('window');
    
    if (width < 360) return values.xsmall || values.small || values.medium || values.large;
    if (width < 600) return values.small || values.medium || values.large;
    if (width < 840) return values.medium || values.large;
    return values.large;
  }

  // Font sizing based on screen size
  static getFontSize(size) {
    const { width } = Dimensions.get('window');
    const baseWidth = 375; // iPhone X base width
    const scaleFactor = width / baseWidth;
    
    return Math.round(size * scaleFactor);
  }

  // Safe area insets for different devices
  static getSafeAreaInsets() {
    const deviceInfo = this.getDeviceInfo();
    
    if (deviceInfo.isIOS) {
      return {
        top: deviceInfo.statusBarHeight || 44,
        bottom: deviceInfo.constants?.statusBarHeight > 40 ? 34 : 0,
        left: 0,
        right: 0
      };
    }
    
    if (deviceInfo.isAndroid) {
      return {
        top: deviceInfo.statusBarHeight || 24,
        bottom: 0,
        left: 0,
        right: 0
      };
    }
    
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  // Platform-specific styling
  static getPlatformStyles(styles) {
    const deviceInfo = this.getDeviceInfo();
    
    return {
      ...styles,
      ...(deviceInfo.isIOS && styles.ios),
      ...(deviceInfo.isAndroid && styles.android),
      ...(deviceInfo.isWeb && styles.web)
    };
  }

  // Performance optimization
  static optimizeForPerformance() {
    return {
      // Enable flat list optimizations
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 50,
      initialNumToRender: 10,
      windowSize: 10,
      
      // Enable image optimizations
      fadeDuration: 300,
      
      // Enable animation optimizations
      useNativeDriver: true,
      disableVirtualization: false
    };
  }

  // Network optimization
  static optimizeNetworkRequests() {
    return {
      timeout: 10000,
      retryCount: 3,
      retryDelay: 1000,
      
      // Cache settings
      cacheEnabled: true,
      cacheTimeout: 300000, // 5 minutes
      
      // Compression
      compress: true,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': 'application/json'
      }
    };
  }

  // Memory management
  static optimizeMemoryUsage() {
    // Clear unused components
    if (Platform.OS === 'web') {
      // Web-specific memory cleanup
      if (window.gc) {
        window.gc();
      }
    }
    
    return {
      // Image memory optimization
      imageCacheSize: 100,
      imageCompression: 0.8,
      
      // Component unmounting
      unmountOnBlur: true,
      
      // State management
      statePersist: false
    };
  }

  // Error handling for mobile
  static handleMobileError(error, context = '') {
    console.error(`Mobile Error [${context}]:`, error);
    
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo()
    };
    
    // Log to monitoring service
    this.logError(errorInfo);
    
    // Return user-friendly error message
    return this.getErrorMessage(error);
  }

  // Get user-friendly error messages
  static getErrorMessage(error) {
    const errorMessages = {
      'Network request failed': 'Network connection error. Please check your internet connection.',
      'timeout': 'Request timed out. Please try again.',
      'abort': 'Request was cancelled. Please try again.',
      'permission denied': 'Permission denied. Please check your app permissions.',
      'not found': 'Resource not found. Please try again later.',
      'server error': 'Server error. Please try again later.',
      'authentication': 'Authentication error. Please log in again.',
      'validation': 'Invalid input. Please check your information.',
      'storage': 'Storage error. Please free up some space and try again.',
      'camera': 'Camera error. Please check camera permissions.',
      'location': 'Location error. Please check location permissions.',
      'notification': 'Notification error. Please check notification permissions.'
    };
    
    const lowerError = error.message.toLowerCase();
    
    for (const [key, message] of Object.entries(errorMessages)) {
      if (lowerError.includes(key.toLowerCase())) {
        return message;
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  // Log errors to monitoring service
  static async logError(errorInfo) {
    try {
      // Send to error tracking service
      await fetch('https://api.nyumba360.com/errors/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorInfo)
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Performance monitoring
  static monitorPerformance(componentName, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const performanceInfo = {
      component: componentName,
      duration,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo()
    };
    
    console.log(`Performance [${componentName}]: ${duration}ms`);
    
    // Log slow performance
    if (duration > 1000) {
      this.logPerformanceIssue(performanceInfo);
    }
    
    return duration;
  }

  // Log performance issues
  static async logPerformanceIssue(performanceInfo) {
    try {
      await fetch('https://api.nyumba360.com/performance/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(performanceInfo)
      });
    } catch (error) {
      console.error('Failed to log performance issue:', error);
    }
  }

  // Battery optimization
  static optimizeForBattery() {
    return {
      // Reduce animations
      animationDuration: 200,
      
      // Optimize updates
      updateInterval: 1000,
      
      // Background processing
      backgroundProcessing: false,
      
      // Network requests
      batchRequests: true,
      requestInterval: 5000
    };
  }

  // Accessibility optimization
  static optimizeForAccessibility() {
    return {
      // Screen reader support
      accessibilityLabel: true,
      accessibilityHint: true,
      accessibilityRole: true,
      
      // High contrast
      highContrast: true,
      
      // Large text
      scalableText: true,
      
      // Focus management
      focusable: true,
      tabIndex: 0
    };
  }

  // Debug mode utilities
  static enableDebugMode() {
    if (__DEV__) {
      // Enable debug logging
      console.log('Debug mode enabled');
      
      // Enable performance monitoring
      this.performanceMonitoring = true;
      
      // Enable error logging
      this.errorLogging = true;
      
      // Enable network debugging
      this.networkDebugging = true;
      
      return {
        debugInfo: this.getDeviceInfo(),
        performanceStats: this.getPerformanceStats(),
        errorLog: this.getErrorLog(),
        networkLog: this.getNetworkLog()
      };
    }
    
    return null;
  }

  // Get performance statistics
  static getPerformanceStats() {
    return {
      memory: this.getMemoryUsage(),
      network: this.getNetworkStats(),
      render: this.getRenderStats(),
      storage: this.getStorageStats()
    };
  }

  // Get memory usage
  static getMemoryUsage() {
    try {
      if (Platform.OS === 'web') {
        return {
          used: performance.memory?.usedJSHeapSize || 0,
          total: performance.memory?.totalJSHeapSize || 0,
          limit: performance.memory?.jsHeapSizeLimit || 0
        };
      }
      
      // React Native memory usage (simplified)
      return {
        used: 0,
        total: 0,
        limit: 0
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get network statistics
  static getNetworkStats() {
    return {
      online: navigator?.onLine || true,
      connection: navigator?.connection || null,
      effectiveType: navigator?.connection?.effectiveType || 'unknown'
    };
  }

  // Get render statistics
  static getRenderStats() {
    return {
      fps: 60, // Simplified
      drops: 0,
      totalTime: 0
    };
  }

  // Get storage statistics
  static getStorageStats() {
    try {
      return {
        used: 0, // Would need AsyncStorage implementation
        total: 0,
        available: 0
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Get error log
  static getErrorLog() {
    return this.errorLog || [];
  }

  // Get network log
  static getNetworkLog() {
    return this.networkLog || [];
  }

  // Initialize mobile optimization
  static initialize() {
    console.log('Mobile optimization initialized');
    
    // Set up error handlers
    if (Platform.OS === 'web') {
      window.addEventListener('error', this.handleWebError.bind(this));
      window.addEventListener('unhandledrejection', this.handleWebRejection.bind(this));
    }
    
    // Set up performance monitoring
    this.setupPerformanceMonitoring();
    
    // Set up network monitoring
    this.setupNetworkMonitoring();
    
    return this.getDeviceInfo();
  }

  // Handle web errors
  static handleWebError(event) {
    this.handleMobileError(event.error, 'Web Error');
  }

  // Handle web promise rejections
  static handleWebRejection(event) {
    this.handleMobileError(event.reason, 'Unhandled Promise Rejection');
  }

  // Set up performance monitoring
  static setupPerformanceMonitoring() {
    if (Platform.OS === 'web') {
      // Web performance monitoring
      if (window.performance) {
        window.addEventListener('load', () => {
          const perfData = performance.getEntriesByType('navigation')[0];
          this.monitorPerformance('Page Load', perfData.startTime);
        });
      }
    }
  }

  // Set up network monitoring
  static setupNetworkMonitoring() {
    if (Platform.OS === 'web' && navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        console.log('Network changed:', navigator.connection.effectiveType);
      });
    }
  }
}

export default MobileOptimization;

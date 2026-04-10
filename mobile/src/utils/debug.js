// Debug utilities for the mobile app

const DEBUG = __DEV__;

export const logger = {
  log: (...args) => {
    if (DEBUG) {
      console.log('[Nyumba360]', ...args);
    }
  },
  
  error: (...args) => {
    if (DEBUG) {
      console.error('[Nyumba360 ERROR]', ...args);
    }
  },
  
  warn: (...args) => {
    if (DEBUG) {
      console.warn('[Nyumba360 WARN]', ...args);
    }
  },
  
  info: (...args) => {
    if (DEBUG) {
      console.info('[Nyumba360 INFO]', ...args);
    }
  },
  
  debug: (...args) => {
    if (DEBUG) {
      console.debug('[Nyumba360 DEBUG]', ...args);
    }
  },
};

export const performance = {
  startTimer: (name) => {
    if (DEBUG) {
      console.time(`[Nyumba360 Timer] ${name}`);
    }
  },
  
  endTimer: (name) => {
    if (DEBUG) {
      console.timeEnd(`[Nyumba360 Timer] ${name}`);
    }
  },
  
  mark: (name) => {
    if (DEBUG && performance.mark) {
      performance.mark(`nyumba360-${name}`);
    }
  },
};

export const apiLogger = {
  request: (config) => {
    if (DEBUG) {
      logger.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }
    return config;
  },
  
  response: (response) => {
    if (DEBUG) {
      logger.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  
  error: (error) => {
    if (DEBUG) {
      logger.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return Promise.reject(error);
  },
};

export const storageLogger = {
  get: async (key) => {
    if (DEBUG) {
      logger.log(`Storage GET: ${key}`);
    }
    return key;
  },
  
  set: async (key, value) => {
    if (DEBUG) {
      logger.log(`Storage SET: ${key}`, value);
    }
    return [key, value];
  },
  
  remove: async (key) => {
    if (DEBUG) {
      logger.log(`Storage REMOVE: ${key}`);
    }
    return key;
  },
};

export const componentLogger = {
  mount: (componentName) => {
    if (DEBUG) {
      logger.log(`Component MOUNTED: ${componentName}`);
    }
  },
  
  unmount: (componentName) => {
    if (DEBUG) {
      logger.log(`Component UNMOUNTED: ${componentName}`);
    }
  },
  
  update: (componentName, props) => {
    if (DEBUG) {
      logger.log(`Component UPDATED: ${componentName}`, props);
    }
  },
};

export const navigationLogger = {
  navigate: (screen, params) => {
    if (DEBUG) {
      logger.log(`Navigation: ${screen}`, params);
    }
  },
  
  focus: (screen) => {
    if (DEBUG) {
      logger.log(`Screen FOCUSED: ${screen}`);
    }
  },
  
  blur: (screen) => {
    if (DEBUG) {
      logger.log(`Screen BLURRED: ${screen}`);
    }
  },
};

export const errorReporter = {
  report: (error, context) => {
    logger.error('Error Report:', { error, context });
    
    // In production, you would send this to a service like Sentry
    if (!DEBUG) {
      // Send to error reporting service
      console.error('Production Error:', error, context);
    }
  },
  
  reportAPIError: (error, requestInfo) => {
    errorReporter.report(error, {
      type: 'API_ERROR',
      url: requestInfo.url,
      method: requestInfo.method,
      timestamp: new Date().toISOString(),
    });
  },
  
  reportUserError: (error, userInfo) => {
    errorReporter.report(error, {
      type: 'USER_ERROR',
      userId: userInfo.userId,
      action: userInfo.action,
      timestamp: new Date().toISOString(),
    });
  },
};

export const debugUtils = {
  validateObject: (obj, schema) => {
    const errors = [];
    
    Object.keys(schema).forEach(key => {
      if (schema[key].required && !obj[key]) {
        errors.push(`${key} is required`);
      }
      
      if (obj[key] && schema[key].type && typeof obj[key] !== schema[key].type) {
        errors.push(`${key} must be of type ${schema[key].type}`);
      }
    });
    
    return errors;
  },
  
  cloneObject: (obj) => {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      logger.error('Failed to clone object:', error);
      return null;
    }
  },
  
  deepEqual: (obj1, obj2) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  },
  
  getObjectSize: (obj) => {
    return JSON.stringify(obj).length;
  },
};

export default {
  logger,
  performance,
  apiLogger,
  storageLogger,
  componentLogger,
  navigationLogger,
  errorReporter,
  debugUtils,
};

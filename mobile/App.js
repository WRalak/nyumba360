import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, LogBox } from 'expo-status-bar';
import { Platform } from 'react-native';
import AuthProvider from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
// import MobileOptimization from './src/middleware/mobileOptimization';
import ErrorHandler from './src/utils/errorHandler';
import NetworkStatus from './src/components/NetworkStatus';

// Import debug components conditionally
let DebugScreen;
if (__DEV__) {
  try {
    DebugScreen = require('./src/screens/DebugScreen').default;
  } catch (error) {
    console.log('DebugScreen not available:', error.message);
  }
}

const App = () => {
  // Initialize mobile optimization
  useEffect(() => {
    // MobileOptimization.initialize();
    ErrorHandler.setupGlobalHandlers();
    
    // Hide warnings in production
    if (!__DEV__) {
      LogBox.ignoreAllLogs();
    }
    
    // Log app start
    console.log('Nyumba360 Mobile App Started');
    console.log('Platform:', Platform.OS);
    console.log('Environment:', __DEV__ ? 'Development' : 'Production');
    
    // Performance monitoring
    const startTime = Date.now();
    return () => {
      const endTime = Date.now();
      // MobileOptimization.monitorPerformance('App Startup', startTime);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          
          {/* Network Status Indicator - Only show in development */}
          {__DEV__ && (
            <NetworkStatus 
              showDetailedStatus={__DEV__} 
              onConnectionChange={(status) => {
                console.log('Network status changed:', status);
              }}
            />
          )}
          
          {/* Main App Navigator */}
          <AppNavigator />
          
          {/* Debug Screen - Only in development */}
          {__DEV__ && DebugScreen && <DebugScreen />}
          
        </NavigationContainer>
      </AuthProvider>
    </ErrorBoundary>
  );
};

// Error boundary for unhandled errors
if (Platform.OS === 'web') {
  window.addEventListener('error', (event) => {
    ErrorHandler.handleError(event.error, 'Global Web Error');
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handleAsyncError(event.reason, 'Unhandled Promise Rejection');
  });
}

export default App;

# Mobile App Error Fixes & Solutions

## Overview

This guide provides comprehensive solutions for common mobile app errors in the Nyumba360 React Native application.

## Quick Fixes for Common Issues

### 1. **Metro Bundler Issues**

#### Problem: Metro bundler not starting or crashes
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear node_modules and reinstall
cd mobile
rm -rf node_modules
npm install

# Start Metro again
npx react-native start
```

#### Problem: Port already in use
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
npx react-native start --port 8082
```

### 2. **Import/Export Errors**

#### Problem: "Cannot read property of undefined" or "useContext" errors
```javascript
// Fix: Ensure proper exports in context files
// src/context/AuthContext.js
export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export default AuthProvider;

// Fix: Import correctly
import { useAuth } from '../context/AuthContext';
```

#### Problem: Module resolution errors
```javascript
// Add to babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@utils': './src/utils',
          '@services': './src/services'
        }
      }
    ]
  ]
};
```

### 3. **Navigation Errors**

#### Problem: "The action 'NAVIGATE' with payload..." errors
```javascript
// Fix: Ensure navigation structure is correct
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

// Wrap app with NavigationContainer
function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 4. **Async Storage Errors**

#### Problem: AsyncStorage not working
```javascript
// Fix: Install and configure AsyncStorage
npm install @react-native-async-storage/async-storage

// Use properly
import AsyncStorage from '@react-native-async-storage/async-storage';

// Always wrap in try-catch
try {
  const data = await AsyncStorage.getItem('key');
  console.log(data);
} catch (error) {
  console.error('AsyncStorage error:', error);
}
```

### 5. **Network/API Errors**

#### Problem: Network request failed
```javascript
// Fix: Check API URL and network configuration
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.0.101:5001'  // Your local IP
  : 'https://api.nyumba360.com';

// Add proper headers
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Handle network errors
try {
  const response = await fetch(`${API_BASE_URL}/api/endpoint`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
} catch (error) {
  console.error('Network error:', error);
  throw error;
}
```

### 6. **State Management Errors**

#### Problem: "Cannot update during render" warnings
```javascript
// Fix: Use useEffect for state updates
import React, { useState, useEffect } from 'react';

function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Update state in useEffect, not during render
    fetchData().then(setData);
  }, []);

  return <View>{/* ... */}</View>;
}
```

### 7. **Image/Asset Errors**

#### Problem: Images not loading
```javascript
// Fix: Use proper image imports and paths
import { Image } from 'react-native';

// Local images
import logo from '../assets/logo.png';
<Image source={logo} style={{ width: 100, height: 100 }} />

// Network images
<Image 
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 100, height: 100 }}
  defaultSource={require('../assets/placeholder.png')}
/>

// Check file paths in metro.config.js
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    transformer: {
      babelTransformerPath: require.resolve('react-native/package.json'),
    },
    resolver: {
      assetExts: [...assetExts, 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      sourceExts: [...sourceExts, 'jsx', 'js', 'ts', 'tsx', 'json'],
    },
  };
})();
```

## Platform-Specific Fixes

### iOS Errors

#### Problem: Build fails on iOS
```bash
# Clean iOS build
cd ios && xcodebuild clean

# Install pods
cd ios && pod install

# Rebuild
cd .. && npx react-native run-ios
```

#### Problem: Simulator not opening
```bash
# List available simulators
xcrun simctl list devices

# Open specific simulator
npx react-native run-ios --simulator="iPhone 14"

# Reset simulator
xcrun simctl erase all
```

### Android Errors

#### Problem: Gradle build fails
```bash
# Clean Android build
cd android && ./gradlew clean

# Clear Gradle cache
cd android && ./gradlew cleanBuildCache

# Rebuild
cd .. && npx react-native run-android
```

#### Problem: Emulator not starting
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd <avd_name>

# Cold boot emulator
emulator -avd <avd_name> -wipe-data
```

## Performance Fixes

### 1. **Slow App Startup**

#### Fix: Optimize app initialization
```javascript
// App.js
import React, { memo } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Use memo for expensive components
const AppContent = memo(() => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* Your app content */}
      </NavigationContainer>
    </SafeAreaProvider>
  );
});

export default function App() {
  return <AppContent />;
}
```

### 2. **Memory Leaks**

#### Fix: Proper cleanup in useEffect
```javascript
useEffect(() => {
  const subscription = someAPI.subscribe(data => {
    // Handle data
  });

  return () => {
    // Cleanup subscription
    subscription.unsubscribe();
  };
}, []);
```

### 3. **List Performance**

#### Fix: Optimize FlatList
```javascript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={item => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

## Debugging Tools

### 1. **React Native Debugger**

```bash
# Install Flipper
npm install -g flipper

# Start Flipper
flipper

# Connect app to Flipper
```

### 2. **React Native Logs**

```bash
# Install react-native-logs
npm install react-native-logs

# Usage
import { logger } from 'react-native-logs';
logger.info('Debug message');
```

### 3. **Performance Monitor**

```javascript
// Add to App.js
if (__DEV__) {
  import { performance } from 'react-native';
  
  performance.mark('app-start');
  // ... your app code
  performance.mark('app-end');
  
  performance.measure('app-startup', 'app-start', 'app-end');
}
```

## Environment Configuration

### 1. **Development vs Production**

```javascript
// config/environment.js
const ENV = {
  development: {
    API_URL: 'http://192.168.0.101:5001',
    DEBUG: true,
    LOG_LEVEL: 'debug'
  },
  production: {
    API_URL: 'https://api.nyumba360.com',
    DEBUG: false,
    LOG_LEVEL: 'error'
  }
};

export default ENV[__DEV__ ? 'development' : 'production'];
```

### 2. **Environment Variables**

```javascript
// Create .env file
API_URL=http://192.168.0.101:5001
DEBUG=true

// Install react-native-dotenv
npm install react-native-dotenv

// Use in babel.config.js
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module-resolver', {
      alias: {
        '@env': './.env'
      }
    }]
  ]
};
```

## Common Error Messages & Solutions

### "Cannot find module"
```bash
# Install missing dependency
npm install missing-package

# Or check if it's in package.json
npm list missing-package
```

### "ReferenceError: Can't find variable"
```javascript
// Fix: Import the variable or component
import React from 'react';
import { View } from 'react-native';
```

### "TypeError: undefined is not an object"
```javascript
// Fix: Add null checks
const user = data?.user;
if (user) {
  // Use user
}
```

### "Invariant Violation"
```javascript
// Fix: Check component props
function Component({ requiredProp }) {
  if (!requiredProp) {
    throw new Error('Required prop is missing');
  }
  
  return <View>{/* ... */}</View>;
}
```

## Testing Fixes

### 1. **Jest Configuration**

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-navigation)'
  ]
};
```

### 2. **Test Environment**

```javascript
// jest.setup.js
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});
```

## Build & Deployment Fixes

### 1. **APK Build Issues**

```bash
# Clean build
cd android && ./gradlew clean

# Build APK
cd android && ./gradlew assembleDebug

# Build release APK
cd android && ./gradlew assembleRelease
```

### 2. **iOS Build Issues**

```bash
# Clean and rebuild
cd ios && xcodebuild clean && pod install && cd .. && npx react-native run-ios

# Fix code signing
# Open Xcode project and configure signing
```

## Monitoring & Analytics

### 1. **Error Tracking**

```javascript
// Install Sentry
npm install @sentry/react-native

// Initialize Sentry
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
});
```

### 2. **Performance Monitoring**

```javascript
// Install react-native-performance
npm install react-native-performance

// Track performance
import { Performance } from 'react-native-performance';

const trace = new Performance.Trace('api_call');
trace.start();
// ... your code
trace.stop();
```

## Troubleshooting Checklist

### Before Starting
- [ ] Node.js version is compatible
- [ ] React Native CLI is installed globally
- [ ] Metro bundler is running
- [ ] Device/emulator is connected
- [ ] Environment variables are set

### Common Issues
- [ ] Check network connectivity
- [ ] Verify API endpoints are accessible
- [ ] Clear caches and restart
- [ ] Check for conflicting dependencies
- [ ] Verify platform-specific configurations

### Performance Issues
- [ ] Profile app with Flipper
- [ ] Check for memory leaks
- [ ] Optimize list rendering
- [ ] Reduce unnecessary re-renders
- [ ] Use proper image optimization

## Emergency Fixes

### App Crashes Immediately
```bash
# Reset everything
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

### Build Fails Completely
```bash
# Rebuild from scratch
rm -rf node_modules
rm -rf android/app/build
rm -rf ios/build
npm install
cd android && ./gradlew clean && cd ..
cd ios && xcodebuild clean && cd ..
```

### Network Issues
```bash
# Check network configuration
curl -I http://192.168.0.101:5001/api/health

# Check if backend is running
lsof -i :5001
```

## Support Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

### Community
- [React Native GitHub](https://github.com/facebook/react-native)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)
- [Discord Community](https://discord.gg/react-native)

### Tools
- [Flipper Debugger](https://fbflipper.com/)
- [Reactotron](https://github.com/infinitered/Reactotron)
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)

This comprehensive guide should help resolve most common mobile app errors in the Nyumba360 application.

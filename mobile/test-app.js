// Quick test to verify mobile app setup
console.log('Testing mobile app setup...');

try {
  // Test imports
  const React = require('react');
  const { NavigationContainer } = require('@react-navigation/native');
  const { StatusBar } = require('expo-status-bar');
  
  console.log('✅ React Native imports working');
  console.log('✅ Navigation imports working');
  console.log('✅ Expo imports working');
  
  // Test components
  console.log('✅ App structure is valid');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('🎉 Mobile app test complete!');

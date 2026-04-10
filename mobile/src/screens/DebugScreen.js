import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { logger, apiLogger } from '../utils/debug';

const DebugScreen = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState([]);
  const [debugEnabled, setDebugEnabled] = useState(__DEV__);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      // Get stored token
      const storedToken = await AsyncStorage.getItem('token');
      
      // Get app info
      const appInfo = {
        debugMode: __DEV__,
        platform: require('react-native').Platform.OS,
        version: '1.0.0',
        apiBaseUrl: __DEV__ ? 'http://localhost:5000/api' : 'https://api.nyumba360.co.ke/api',
      };

      setLogs([
        { type: 'info', message: 'App Info', data: appInfo },
        { type: 'info', message: 'Auth Status', data: { isAuthenticated, hasToken: !!token, hasStoredToken: !!storedToken } },
        { type: 'info', message: 'User Info', data: user },
      ]);
    } catch (error) {
      logger.error('Error loading debug info:', error);
    }
  };

  const testAPIConnection = async () => {
    try {
      logger.log('Testing API connection...');
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      
      setLogs(prev => [...prev, {
        type: 'success',
        message: 'API Connection Test',
        data: { status: response.status, response: data }
      }]);
      
      Alert.alert('Success', 'API connection is working!');
    } catch (error) {
      logger.error('API connection test failed:', error);
      
      setLogs(prev => [...prev, {
        type: 'error',
        message: 'API Connection Test Failed',
        data: { error: error.message }
      }]);
      
      Alert.alert('Error', 'API connection failed. Check if backend is running.');
    }
  };

  const clearStorage = async () => {
    Alert.alert(
      'Clear Storage',
      'This will remove all stored data including login tokens. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setLogs(prev => [...prev, { type: 'info', message: 'Storage cleared' }]);
              Alert.alert('Success', 'Storage cleared successfully');
            } catch (error) {
              logger.error('Error clearing storage:', error);
              Alert.alert('Error', 'Failed to clear storage');
            }
          },
        },
      ]
    );
  };

  const testStorage = async () => {
    try {
      const testData = { test: 'debug', timestamp: new Date().toISOString() };
      await AsyncStorage.setItem('debug_test', JSON.stringify(testData));
      const retrieved = await AsyncStorage.getItem('debug_test');
      
      setLogs(prev => [...prev, {
        type: 'success',
        message: 'Storage Test',
        data: { stored: testData, retrieved: JSON.parse(retrieved) }
      }]);
    } catch (error) {
      logger.error('Storage test failed:', error);
      setLogs(prev => [...prev, {
        type: 'error',
        message: 'Storage Test Failed',
        data: { error: error.message }
      }]);
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      case 'warn': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Panel</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Debug Mode</Text>
          <Switch
            value={debugEnabled}
            onValueChange={setDebugEnabled}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnostics</Text>
          
          <TouchableOpacity style={styles.button} onPress={testAPIConnection}>
            <Text style={styles.buttonText}>Test API Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testStorage}>
            <Text style={styles.buttonText}>Test Storage</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearStorage}>
            <Text style={styles.buttonText}>Clear All Storage</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Logs</Text>
          {logs.map((log, index) => (
            <View key={index} style={styles.logItem}>
              <Text style={[styles.logType, { color: getLogColor(log.type) }]}>
                {log.type.toUpperCase()}
              </Text>
              <Text style={styles.logMessage}>{log.message}</Text>
              {log.data && (
                <Text style={styles.logData}>
                  {JSON.stringify(log.data, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current State</Text>
          <Text style={styles.stateText}>
            Authenticated: {isAuthenticated ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.stateText}>
            Has Token: {token ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.stateText}>
            User: {user ? `${user.first_name} ${user.last_name}` : 'None'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  logItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
  },
  logType: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  stateText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
});

export default DebugScreen;

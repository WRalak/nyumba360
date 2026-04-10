import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import MobileOptimization from '../middleware/mobileOptimization';
import NetworkUtils from '../utils/networkUtils';

const NetworkStatus = ({ onConnectionChange, showDetailedStatus = false }) => {
  const netInfo = useNetInfo();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const deviceInfo = MobileOptimization.getDeviceInfo();
    
    const connectionInfo = {
      isConnected: netInfo.isConnected,
      connectionType: netInfo.type || 'unknown',
      isInternetReachable: netInfo.isInternetReachable,
      strength: getConnectionStrength(netInfo),
      lastChecked: new Date(),
      platform: deviceInfo.platform,
      effectiveType: netInfo.details?.effectiveType || 'unknown'
    };

    // Log network status changes
    if (__DEV__) {
      console.log('Network Status:', connectionInfo);
    }

    // Notify parent component
    if (onConnectionChange) {
      onConnectionChange(connectionInfo);
    }
  }, [netInfo, onConnectionChange]);

  const getConnectionStrength = (netInfoState) => {
    if (!netInfoState.isConnected) return 'offline';
    
    if (Platform.OS === 'ios') {
      // iOS doesn't provide signal strength in NetInfo
      return 'unknown';
    }
    
    if (netInfoState.details?.strength) {
      const strength = netInfoState.details.strength;
      if (strength <= 1) return 'poor';
      if (strength <= 2) return 'fair';
      if (strength <= 3) return 'good';
      return 'excellent';
    }
    
    return 'unknown';
  };

  const handleRetryConnection = async () => {
    setRetryCount(prev => prev + 1);
    
    try {
      // Test actual connectivity with API
      const response = await NetworkUtils.checkNetworkStatus();
      
      if (response.online) {
        setRetryCount(0);
      }
      
    } catch (error) {
      console.error('Retry connection failed:', error);
    }
  };

  const getStatusColor = () => {
    if (!netInfo.isConnected) return '#ef4444';
    if (!netInfo.isInternetReachable) return '#f59e0b';
    return '#10b981';
  };

  const getStatusText = () => {
    if (!netInfo.isConnected) return 'No Connection';
    if (!netInfo.isInternetReachable) return 'No Internet';
    return 'Connected';
  };

  const getConnectionTypeText = () => {
    const type = netInfo.type || 'unknown';
    const strength = getConnectionStrength(netInfo);
    
    if (!netInfo.isConnected) return 'Offline';
    
    const typeText = type.charAt(0).toUpperCase() + type.slice(1);
    
    if (strength !== 'unknown') {
      return `${typeText} (${strength})`;
    }
    
    return typeText;
  };

  const getNetworkIcon = () => {
    if (!networkState.isConnected) return 'wifi-off';
    if (!networkState.isInternetReachable) return 'wifi';
    if (networkState.connectionType === 'wifi') return 'wifi';
    if (networkState.connectionType === 'cellular') return 'signal';
    return 'check-circle';
  };

  if (!showDetailedStatus) {
    return (
      <View style={[styles.container, styles.minimal]}>
        <View style={[styles.indicator, { backgroundColor: getStatusColor() }]} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            <Text style={styles.connectionTypeText}>
              {getConnectionTypeText()}
            </Text>
          </View>
        </View>
        
        {!netInfo.isConnected && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetryConnection}
          >
            <Text style={styles.retryButtonText}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showDetailedStatus && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Platform:</Text>
            <Text style={styles.detailValue}>{Platform.OS}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Connection:</Text>
            <Text style={styles.detailValue}>{netInfo.type || 'unknown'}</Text>
          </View>
          
          {netInfo.details?.effectiveType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Speed:</Text>
              <Text style={styles.detailValue}>{netInfo.details.effectiveType}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Strength:</Text>
            <Text style={[styles.detailValue, { color: getStrengthColor() }]}>
              {getConnectionStrength(netInfo)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Check:</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleTimeString()}
            </Text>
          </View>
          
          {retryCount > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Retry Count:</Text>
              <Text style={[styles.detailValue, { color: '#f59e0b' }]}>
                {retryCount}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const getStrengthColor = (strength) => {
  switch (strength) {
    case 'excellent': return '#10b981';
    case 'good': return '#3b82f6';
    case 'fair': return '#f59e0b';
    case 'poor': return '#ef4444';
    default: return '#6b7280';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  minimal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    margin: 4,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    elevation: 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  statusTextContainer: {
    flex: 1
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  connectionTypeText: {
    fontSize: 12,
    color: '#6b7280'
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  details: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 'bold'
  }
});

export default NetworkStatus;

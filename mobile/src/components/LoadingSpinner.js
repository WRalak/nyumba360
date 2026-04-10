import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Animated, Platform } from 'react-native';
import MobileOptimization from '../middleware/mobileOptimization';

const LoadingSpinner = ({
  size = 'large',
  color = '#2563eb',
  text,
  overlay = false,
  timeout = 30000,
  onTimeout,
  showProgress = false,
  progress = 0,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Timeout handling
    const timeoutTimer = setTimeout(() => {
      setHasTimedOut(true);
      if (onTimeout) {
        onTimeout();
      }
    }, timeout);

    // Elapsed time counter
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1000);
    }, 1000);

    return () => {
      clearTimeout(timeoutTimer);
      clearInterval(interval);
    };
  }, [fadeAnim, timeout, onTimeout]);

  const getSize = () => {
    const deviceInfo = MobileOptimization.getDeviceInfo();
    const responsiveSize = MobileOptimization.getResponsiveValue({
      xsmall: 'small',
      small: 'small',
      medium: 'large',
      large: 'large'
    });

    return size || responsiveSize;
  };

  const getIndicatorSize = () => {
    const size = getSize();
    const sizes = {
      small: Platform.OS === 'ios' ? 20 : 24,
      large: Platform.OS === 'ios' ? 40 : 48
    };
    return sizes[size] || sizes.large;
  };

  const renderTimeoutMessage = () => {
    if (!hasTimedOut) return null;

    return (
      <View style={styles.timeoutContainer}>
        <Text style={styles.timeoutText}>Taking longer than expected...</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            // Handle retry logic
            setHasTimedOut(false);
            setElapsedTime(0);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProgress = () => {
    if (!showProgress) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${Math.min(progress, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    );
  };

  const renderElapsedTime = () => {
    if (elapsedTime < 5000) return null; // Only show after 5 seconds

    const seconds = Math.floor(elapsedTime / 1000);
    return (
      <Text style={styles.elapsedText}>
        Loading... {seconds}s
      </Text>
    );
  };

  const content = (
    <Animated.View 
      style={[
        styles.container, 
        overlay && styles.overlay,
        { opacity: fadeAnim }
      ]}
    >
      <ActivityIndicator 
        size={getIndicatorSize()} 
        color={color}
        animating={!hasTimedOut}
      />
      
      {text && <Text style={styles.text}>{text}</Text>}
      {renderElapsedTime()}
      {renderProgress()}
      {renderTimeoutMessage()}
    </Animated.View>
  );

  if (overlay) {
    return (
      <View style={styles.overlayContainer}>
        {content}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  timeoutContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  timeoutText: {
    fontSize: 14,
    color: '#f59e0b',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '80%',
    alignItems: 'center',
    marginTop: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  elapsedText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default LoadingSpinner;

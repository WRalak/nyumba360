import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Icon } from 'react-native-vector-icons/MaterialIcons';

const GoogleSignInButton = ({ onSignIn, loading = false }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      
      // For now, show a placeholder message
      // In production, you would integrate with Google OAuth here
      Alert.alert(
        'Google Sign-In',
        'Google Sign-In will be available soon!\n\nFor now, please use email registration.',
        [{ text: 'OK', onPress: () => setIsSigningIn(false) }]
      );
      
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, loading && styles.disabledButton]}
      onPress={handleGoogleSignIn}
      disabled={loading || isSigningIn}
    >
      {isSigningIn ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Icon name="google" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4285f4',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleSignInButton;

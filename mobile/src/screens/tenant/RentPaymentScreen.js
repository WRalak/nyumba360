import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const RentPaymentScreen = () => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'mpesa',
  });
  const [errors, setErrors] = useState({});
  const { api } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // This would initiate M-Pesa payment
      Alert.alert(
        'Payment Processing',
        'This feature will initiate M-Pesa payment for your rent. You will receive an STK push to complete the payment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (text) => {
    setPaymentData(prev => ({ ...prev, amount: text }));
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const handleMethodChange = (method) => {
    setPaymentData(prev => ({ ...prev, payment_method: method }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pay Rent</Text>
        <Text style={styles.subtitle}>
          Make your rent payment quickly and securely
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.currentLeaseInfo}>
          <Text style={styles.infoTitle}>Current Lease Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Property: Sample Property</Text>
            <Text style={styles.infoText}>Unit: A101</Text>
            <Text style={styles.infoText}>Monthly Rent: KES 15,000</Text>
            <Text style={styles.infoText}>Due Date: 1st of every month</Text>
          </View>
        </View>

        <View style={styles.paymentForm}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (KES)</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              value={paymentData.amount}
              onChangeText={handleAmountChange}
              placeholder="15000"
              keyboardType="numeric"
            />
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.methodContainer}>
              {['mpesa', 'cash', 'bank_transfer'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodOption,
                    paymentData.payment_method === method && styles.methodOptionSelected
                  ]}
                  onPress={() => handleMethodChange(method)}
                >
                  <Text style={[
                    styles.methodOptionText,
                    paymentData.payment_method === method && styles.methodOptionTextSelected
                  ]}>
                    {method === 'mpesa' ? 'M-Pesa' : method.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {paymentData.payment_method === 'mpesa' && (
            <View style={styles.mpesaInfo}>
              <Text style={styles.mpesaInfoTitle}>M-Pesa Payment</Text>
              <Text style={styles.mpesaInfoText}>
                You will receive an STK push on your phone to complete the payment.
              </Text>
              <Text style={styles.mpesaInfoText}>
                Ensure you have sufficient balance in your M-Pesa account.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.payButton, loading && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay KES {paymentData.amount || '0'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.paymentHistory}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          <View style={styles.historyCard}>
            <Text style={styles.historyEmpty}>No payment history available</Text>
            <Text style={styles.historyEmptyText}>
              Your payment history will appear here once you start making payments
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    padding: 20,
    gap: 24,
  },
  currentLeaseInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  paymentForm: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  methodContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  methodOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#d1d5db',
  },
  methodOptionSelected: {
    backgroundColor: '#2563eb',
  },
  methodOptionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  methodOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  mpesaInfo: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  mpesaInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d97706',
    marginBottom: 8,
  },
  mpesaInfoText: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 4,
  },
  payButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentHistory: {
    gap: 16,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  historyEmpty: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  historyEmptyText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default RentPaymentScreen;

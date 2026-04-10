import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const StatCard = ({ title, value, icon, color, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Icon name={icon} size={24} color="#fff" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </TouchableOpacity>
);

const TenantDashboardScreen = () => {
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { api } = useAuth();

  const fetchTenantData = async () => {
    try {
      // Fetch tenant profile and current lease
      const response = await api.get('/tenant/profile');
      setTenantData(response.data.tenant);
    } catch (error) {
      console.error('Fetch tenant data error:', error);
      Alert.alert('Error', 'Failed to load your information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenantData();
  };

  const handlePayRent = () => {
    // Navigate to rent payment screen
    Alert.alert('Coming Soon', 'Rent payment feature will be available soon');
  };

  const handleMaintenanceRequest = () => {
    // Navigate to maintenance request screen
    Alert.alert('Coming Soon', 'Maintenance request feature will be available soon');
  };

  const handleViewLease = () => {
    if (tenantData?.current_lease) {
      Alert.alert(
        'Lease Agreement',
        `Property: ${tenantData.current_lease.property_name}\nUnit: ${tenantData.current_lease.unit_number}\nRent: KES ${tenantData.current_lease.monthly_rent}\nLease Period: ${new Date(tenantData.current_lease.lease_start_date).toLocaleDateString()} - ${new Date(tenantData.current_lease.lease_end_date).toLocaleDateString()}`
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {tenantData?.first_name?.[0]?.toUpperCase()}{tenantData?.last_name?.[0]?.toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {tenantData?.first_name} {tenantData?.last_name}
            </Text>
            <Text style={styles.profileType}>Tenant</Text>
            <Text style={styles.profilePhone}>{tenantData?.phone}</Text>
          </View>
        </View>
      </View>

      {/* Current Lease */}
      {tenantData?.current_lease && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Lease</Text>
          <View style={styles.leaseCard}>
            <View style={styles.leaseInfo}>
              <View style={styles.leaseRow}>
                <Text style={styles.leaseLabel}>Property:</Text>
                <Text style={styles.leaseValue}>{tenantData.current_lease.property_name}</Text>
              </View>
              <View style={styles.leaseRow}>
                <Text style={styles.leaseLabel}>Unit:</Text>
                <Text style={styles.leaseValue}>{tenantData.current_lease.unit_number}</Text>
              </View>
              <View style={styles.leaseRow}>
                <Text style={styles.leaseLabel}>Monthly Rent:</Text>
                <Text style={styles.leaseValue}>KES {tenantData.current_lease.monthly_rent?.toLocaleString()}</Text>
              </View>
              <View style={styles.leaseRow}>
                <Text style={styles.leaseLabel}>Lease Period:</Text>
                <Text style={styles.leaseValue}>
                  {new Date(tenantData.current_lease.lease_start_date).toLocaleDateString()} - {' '}
                  {new Date(tenantData.current_lease.lease_end_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.leaseButton} onPress={handleViewLease}>
              <Text style={styles.leaseButtonText}>View Full Agreement</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handlePayRent}>
            <Icon name="payment" size={24} color="#2563eb" />
            <Text style={styles.actionText}>Pay Rent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleMaintenanceRequest}>
            <Icon name="build" size={24} color="#2563eb" />
            <Text style={styles.actionText}>Request Maintenance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Icon name="description" size={24} color="#2563eb" />
            <Text style={styles.actionText}>View Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Icon name="contact-support" size={24} color="#2563eb" />
            <Text style={styles.actionText}>Contact Landlord</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {tenantData?.payment_history && tenantData.payment_history.length > 0 ? (
          <View style={styles.paymentList}>
            {tenantData.payment_history.slice(0, 5).map((payment, index) => (
              <View key={index} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <View>
                    <Text style={styles.paymentAmount}>
                      KES {payment.amount?.toLocaleString()}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.paymentStatus, {
                    backgroundColor: payment.payment_status === 'completed' ? '#dcfce7' : '#fee2e2'
                  }]}>
                    <Text style={[
                      styles.paymentStatusText,
                      { color: payment.payment_status === 'completed' ? '#166534' : '#991b1b' }
                    ]}>
                      {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                    </Text>
                  </View>
                </View>
                {payment.transaction_id && (
                  <Text style={styles.paymentTransaction}>
                    Transaction: {payment.transaction_id}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="receipt" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Payment History</Text>
            <Text style={styles.emptyDescription}>Your payment history will appear here</Text>
          </View>
        )}
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Emergency Contact:</Text>
            <Text style={styles.contactValue}>
              {tenantData?.emergency_contact_name || 'Not provided'}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Emergency Phone:</Text>
            <Text style={styles.contactValue}>
              {tenantData?.emergency_contact_phone || 'Not provided'}
            </Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>Email:</Text>
            <Text style={styles.contactValue}>
              {tenantData?.email || 'Not provided'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    color: '#dbeafe',
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: '#dbeafe',
  },
  section: {
    margin: 20,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  leaseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaseInfo: {
    marginBottom: 16,
  },
  leaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaseLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  leaseValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  leaseButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaseButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '47%',
  },
  actionText: {
    fontSize: 12,
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  paymentList: {
    gap: 12,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  paymentDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  paymentStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentTransaction: {
    fontSize: 10,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  contactValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default TenantDashboardScreen;

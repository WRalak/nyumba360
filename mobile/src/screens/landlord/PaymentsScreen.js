import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PaymentCard = ({ payment, onPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity style={styles.paymentCard} onPress={onPress}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.tenantName}>
            {payment.first_name} {payment.last_name}
          </Text>
          <Text style={styles.propertyName}>{payment.property_name}</Text>
          <Text style={styles.unitNumber}>Unit {payment.unit_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.payment_status) }]}>
          <Text style={styles.statusText}>{getStatusText(payment.payment_status)}</Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text style={styles.amountValue}>KES {payment.amount?.toLocaleString()}</Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Payment Date:</Text>
          <Text style={styles.dateValue}>
            {new Date(payment.payment_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.methodRow}>
          <Text style={styles.methodLabel}>Method:</Text>
          <Text style={styles.methodValue}>{payment.payment_method?.toUpperCase()}</Text>
        </View>
      </View>

      {payment.transaction_id && (
        <View style={styles.transactionRow}>
          <Text style={styles.transactionLabel}>Transaction ID:</Text>
          <Text style={styles.transactionValue}>{payment.transaction_id}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const StatsCard = ({ title, value, icon, color }) => (
  <View style={styles.statsCard}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Icon name={icon} size={24} color="#fff" />
    </View>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsTitle}>{title}</Text>
  </View>
);

const PaymentsScreen = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completedPayments: 0,
    pendingPayments: 0,
    collectionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { api } = useAuth();

  const fetchData = async () => {
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/payments/stats'),
      ]);

      setPayments(paymentsRes.data.payments || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Fetch payments error:', error);
      Alert.alert('Error', 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderPayment = ({ item }) => (
    <PaymentCard
      payment={item}
      onPress={() => navigation.navigate('PaymentDetail', { paymentId: item.id })}
    />
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <StatsCard
        title="Total Revenue"
        value={`KES ${(stats.totalRevenue || 0).toLocaleString()}`}
        icon="payments"
        color="#2563eb"
      />
      <StatsCard
        title="Completed"
        value={stats.completedPayments || 0}
        icon="check-circle"
        color="#10b981"
      />
      <StatsCard
        title="Pending"
        value={stats.pendingPayments || 0}
        icon="clock"
        color="#f59e0b"
      />
      <StatsCard
        title="Collection Rate"
        value={`${stats.collectionRate || 0}%`}
        icon="trending-up"
        color="#8b5cf6"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rent Payments</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('RecordPayment')}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Record Payment</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderStats()}

        <View style={styles.paymentsHeader}>
          <Text style={styles.paymentsTitle}>Recent Payments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllPayments')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {payments.length > 0 ? (
          <View style={styles.listContainer}>
            {payments.slice(0, 10).map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onPress={() => navigation.navigate('PaymentDetail', { paymentId: payment.id })}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="receipt" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Payments</Text>
            <Text style={styles.emptyDescription}>
              Record your first rent payment to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => navigation.navigate('RecordPayment')}
            >
              <Text style={styles.emptyAddButtonText}>Record Payment</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statsCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  paymentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  paymentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  seeAllText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  unitNumber: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  paymentDetails: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  dateValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  methodValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionValue: {
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentsScreen;

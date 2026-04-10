import React, { useState } from 'react';
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

const ProgressRing = ({ value, size = 120, strokeWidth = 8, color = '#10b981' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: '#e5e7eb',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          transform: [{ rotate: '-90deg' }],
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
        }}
      />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color }}>
          {Math.round(value)}%
        </Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>of target</Text>
      </View>
    </View>
  );
};

const MillionDayCard = ({ data }) => {
  const progressColor = data.current_progress >= 100 ? '#10b981' : 
                        data.current_progress >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name="trending-up" size={24} color="#8b5cf6" />
        <Text style={styles.cardTitle}>Million Day Target</Text>
      </View>

      <View style={styles.progressContainer}>
        <ProgressRing value={data.current_progress} color={progressColor} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Current Revenue:</Text>
          <Text style={styles.statValue}>
            KES {(data.current_revenue || 0).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Projected Revenue:</Text>
          <Text style={styles.statValue}>
            KES {(data.projected_revenue || 0).toLocaleString()}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Needed for Target:</Text>
          <Text style={styles.statValue}>
            KES {(data.needed_for_target || 0).toLocaleString()}
          </Text>
        </View>

        {data.days_to_target && (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Days to Target:</Text>
            <Text style={styles.statValue}>{data.days_to_target}</Text>
          </View>
        )}
      </View>

      <View style={[styles.statusContainer, { backgroundColor: progressColor + '20' }]}>
        <Icon name="lightbulb-outline" size={20} color={progressColor} />
        <Text style={[styles.statusText, { color: progressColor }]}>
          {data.current_progress >= 100 
            ? "Congratulations! You've achieved your million day target!"
            : data.current_progress >= 50
            ? "You're on track! Keep optimizing your revenue streams."
            : "Focus on increasing occupancy and optimizing pricing strategies."}
        </Text>
      </View>
    </View>
  );
};

const QuickAction = ({ action, onPress }) => {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <Icon name="arrow-trending-up" size={24} color="#2563eb" />
      <Text style={styles.actionTitle}>{action.title}</Text>
      <Text style={styles.actionDescription}>{action.description}</Text>
      <View style={styles.actionFooter}>
        <Text style={styles.actionLabel}>Potential:</Text>
        <Text style={styles.actionValue}>
          KES {(action.potential_increase || 0).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const RevenueScreen = () => {
  const [selectedProperty, setSelectedProperty] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { api } = useAuth();

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleQuickAction = (action) => {
    Alert.alert(
      action.title,
      action.description,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Learn More', style: 'default' }
      ]
    );
  };

  const quickActions = [
    {
      title: 'Increase Occupancy',
      description: 'Fill vacant units to maximize revenue',
      potential_increase: 500000
    },
    {
      title: 'Optimize Pricing',
      description: 'Adjust rent based on market conditions',
      potential_increase: 300000
    },
    {
      title: 'Add Services',
      description: 'Generate additional revenue streams',
      potential_increase: 200000
    }
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Revenue Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Track your path to million day revenue
        </Text>
      </View>

      {/* Property Selector */}
      <View style={styles.propertySelector}>
        <Text style={styles.selectorLabel}>Select Property</Text>
        <TouchableOpacity style={styles.selectorButton}>
          <Text style={styles.selectorText}>Choose a property...</Text>
          <Icon name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Million Day Progress */}
      <MillionDayCard 
        data={{
          current_progress: 75,
          current_revenue: 750000,
          projected_revenue: 825000,
          needed_for_target: 250000,
          days_to_target: 5
        }} 
      />

      {/* Today's Revenue */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="attach-money" size={24} color="#10b981" />
          <Text style={styles.cardTitle}>Today's Revenue</Text>
        </View>
        <View style={styles.revenueContainer}>
          <Text style={styles.revenueAmount}>KES 750,000</Text>
          <Text style={styles.revenueLabel}>Daily earnings</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          {quickActions.map((action, index) => (
            <QuickAction
              key={index}
              action={action}
              onPress={() => handleQuickAction(action)}
            />
          ))}
        </View>
      </View>

      {/* Revenue Tips */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="tips-and-updates" size={24} color="#8b5cf6" />
          <Text style={styles.cardTitle}>Revenue Tips</Text>
        </View>
        <View style={styles.tipsContainer}>
          <View style={styles.tip}>
            <Icon name="check-circle" size={16} color="#10b981" />
            <Text style={styles.tipText}>
              Maintain 95%+ occupancy rate for maximum revenue
            </Text>
          </View>
          <View style={styles.tip}>
            <Icon name="check-circle" size={16} color="#10b981" />
            <Text style={styles.tipText}>
              Review market rates quarterly and adjust pricing
            </Text>
          </View>
          <View style={styles.tip}>
            <Icon name="check-circle" size={16} color="#10b981" />
            <Text style={styles.tipText}>
              Offer premium services to increase revenue per unit
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
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  propertySelector: {
    margin: 20,
    gap: 8,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  revenueContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10b981',
  },
  revenueLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    margin: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  tipsContainer: {
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});

export default RevenueScreen;

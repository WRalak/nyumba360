import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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

const PropertyCard = ({ property, onPress }) => (
  <TouchableOpacity style={styles.propertyCard} onPress={onPress}>
    <View style={styles.propertyHeader}>
      <Text style={styles.propertyName}>{property.name}</Text>
      <Text style={styles.propertyUnits}>{property.total_units} units</Text>
    </View>
    <Text style={styles.propertyAddress}>{property.address}</Text>
    <View style={styles.propertyStats}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Occupied</Text>
        <Text style={styles.statValue}>{property.stats?.occupied_units || 0}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Vacant</Text>
        <Text style={styles.statValue}>{property.stats?.vacant_units || 0}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Occupancy</Text>
        <Text style={styles.statValue}>
          {property.total_units > 0 
            ? Math.round(((property.stats?.occupied_units || 0) / property.total_units) * 100)
            : 0}%
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const LandlordDashboardScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { api } = useAuth();

  const fetchDashboardData = async () => {
    try {
      const [propertiesRes, statsRes] = await Promise.all([
        api.get('/properties'),
        api.get('/dashboard/stats')
      ]);

      setDashboardData({
        properties: propertiesRes.data.properties || [],
        stats: statsRes.data
      });
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const stats = dashboardData?.stats || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back!</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Properties"
          value={stats.totalProperties || 0}
          icon="apartment"
          color="#3b82f6"
          onPress={() => navigation.navigate('Properties')}
        />
        <StatCard
          title="Total Units"
          value={stats.totalUnits || 0}
          icon="home"
          color="#10b981"
          onPress={() => navigation.navigate('Properties')}
        />
        <StatCard
          title="Tenants"
          value={stats.totalTenants || 0}
          icon="people"
          color="#8b5cf6"
          onPress={() => navigation.navigate('Tenants')}
        />
        <StatCard
          title="Monthly Revenue"
          value={`KES ${(stats.monthlyRevenue || 0).toLocaleString()}`}
          icon="payments"
          color="#f59e0b"
          onPress={() => navigation.navigate('Payments')}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AddProperty')}
          >
            <Icon name="add" size={24} color="#2563eb" />
            <Text style={styles.actionText}>Add Property</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AddTenant')}
          >
            <Icon name="person-add" size={24} color="#2563eb" />
            <Text style={styles.actionText}>Add Tenant</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('RecordPayment')}
          >
            <Icon name="payment" size={24} color="#2563eb" />
            <Text style={styles.actionText}>Record Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Maintenance')}
          >
            <Icon name="build" size={24} color="#2563eb" />
            <Text style={styles.actionText}>Maintenance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Properties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Properties</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Properties')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {dashboardData?.properties?.length > 0 ? (
          dashboardData.properties.slice(0, 3).map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onPress={() => navigation.navigate('PropertyDetail', { propertyId: property.id })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="apartment" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No properties yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddProperty')}
            >
              <Text style={styles.addButtonText}>Add Your First Property</Text>
            </TouchableOpacity>
          </View>
        )}
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
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
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
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  seeAllText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
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
  actionText: {
    fontSize: 12,
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  propertyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  propertyUnits: {
    fontSize: 12,
    color: '#6b7280',
  },
  propertyAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LandlordDashboardScreen;

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
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TenantCard = ({ tenant, onPress }) => {
  return (
    <TouchableOpacity style={styles.tenantCard} onPress={onPress}>
      <View style={styles.tenantHeader}>
        <View style={styles.tenantInfo}>
          <Text style={styles.tenantName}>
            {tenant.first_name} {tenant.last_name}
          </Text>
          <Text style={styles.tenantPhone}>{tenant.phone}</Text>
          <Text style={styles.tenantUnit}>
            {tenant.unit_number} - {tenant.unit_type}
          </Text>
        </View>
        <View style={[styles.leaseStatus, tenant.lease_status === 'active' ? styles.activeLease : styles.inactiveLease]}>
          <Text style={styles.leaseStatusText}>
            {tenant.lease_status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.tenantStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Monthly Rent</Text>
          <Text style={styles.statValue}>KES {tenant.monthly_rent?.toLocaleString()}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Lease End</Text>
          <Text style={styles.statValue}>
            {new Date(tenant.lease_end_date).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TenantsScreen = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const { api } = useAuth();

  const fetchTenants = async (query = '') => {
    try {
      const response = await api.get('/tenants', {
        params: query ? { search: query } : {}
      });
      setTenants(response.data.tenants || []);
    } catch (error) {
      console.error('Fetch tenants error:', error);
      Alert.alert('Error', 'Failed to load tenants');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTenants(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenants(searchQuery);
  };

  const renderTenant = ({ item }) => (
    <TenantCard
      tenant={item}
      onPress={() => navigation.navigate('TenantDetail', { tenantId: item.id })}
    />
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
        <Text style={styles.headerTitle}>Tenants</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddTenant')}
        >
          <Icon name="person-add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Tenant</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {tenants.length > 0 ? (
        <FlatList
          data={tenants}
          renderItem={renderTenant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="people" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Tenants</Text>
          <Text style={styles.emptyDescription}>
            {searchQuery ? 'No tenants found matching your search' : 'Add your first tenant to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => navigation.navigate('AddTenant')}
            >
              <Text style={styles.emptyAddButtonText}>Add Tenant</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  tenantCard: {
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
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  tenantPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  tenantUnit: {
    fontSize: 12,
    color: '#9ca3af',
  },
  leaseStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeLease: {
    backgroundColor: '#dcfce7',
  },
  inactiveLease: {
    backgroundColor: '#fee2e2',
  },
  leaseStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  tenantStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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
    marginHorizontal: 40,
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

export default TenantsScreen;

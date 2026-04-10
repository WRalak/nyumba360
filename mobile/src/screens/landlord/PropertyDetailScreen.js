import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Icon } from 'react-native-vector-icons/MaterialIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { propertyAPI, unitAPI, tenantAPI, paymentAPI } from '../../services/api';
import PropertyCard from '../../components/PropertyCard';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';

const PropertyDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { api } = useAuth();
  const { propertyId } = route.params;

  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPropertyData();
  }, [propertyId]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      
      // Load property details
      const propertyResponse = await api.get(`/properties/${propertyId}`);
      setProperty(propertyResponse.data);
      
      // Load units
      const unitsResponse = await api.get('/units', { params: { property_id: propertyId } });
      setUnits(unitsResponse.data);
      
      // Load tenants
      const tenantsResponse = await api.get('/tenants', { params: { property_id: propertyId } });
      setTenants(tenantsResponse.data);
      
      // Load stats
      const statsResponse = await api.get(`/properties/stats/${propertyResponse.data.landlord_id}`);
      setStats(statsResponse.data);
      
    } catch (error) {
      console.error('Error loading property data:', error);
      Alert.alert('Error', 'Failed to load property data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPropertyData();
    setRefreshing(false);
  };

  const handleDeleteProperty = () => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/properties/${propertyId}`);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]
    );
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Icon name="apartment" size={24} color="#2563eb" />
          <Text style={styles.infoValue}>{units.length}</Text>
          <Text style={styles.infoLabel}>Total Units</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Icon name="people" size={24} color="#10b981" />
          <Text style={styles.infoValue}>{tenants.length}</Text>
          <Text style={styles.infoLabel}>Tenants</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Icon name="trending-up" size={24} color="#f59e0b" />
          <Text style={styles.infoValue}>
            {Math.round((tenants.length / units.length) * 100)}%
          </Text>
          <Text style={styles.infoLabel}>Occupancy</Text>
        </View>
        
        <View style={styles.infoCard}>
          <Icon name="payments" size={24} color="#8b5cf6" />
          <Text style={styles.infoValue}>
            KES {units.reduce((sum, unit) => sum + (unit.rent_amount || 0), 0).toLocaleString()}
          </Text>
          <Text style={styles.infoLabel}>Potential Rent</Text>
        </View>
      </View>
      
      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{property?.description || 'No description available'}</Text>
      </View>
      
      <View style={styles.addressSection}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.address}>{property?.address}</Text>
        <Text style={styles.city}>{property?.city}, {property?.county}</Text>
      </View>
    </View>
  );

  const renderUnits = () => (
    <View style={styles.unitsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Units ({units.length})</Text>
        <Button
          title="Add Unit"
          size="small"
          variant="outline"
          onPress={() => navigation.navigate('AddUnit', { propertyId })}
        />
      </View>
      
      {units.map((unit) => (
        <View key={unit.id} style={styles.unitCard}>
          <View style={styles.unitHeader}>
            <Text style={styles.unitTitle}>{unit.unit_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(unit.status) }]}>
              <Text style={styles.statusText}>{unit.status}</Text>
            </View>
          </View>
          
          <View style={styles.unitDetails}>
            <Text style={styles.unitType}>{unit.type}</Text>
            <Text style={styles.unitRent}>KES {unit.rent_amount?.toLocaleString()}/month</Text>
          </View>
          
          <View style={styles.unitFeatures}>
            <Text style={styles.unitFeature}>{unit.bedrooms} bed</Text>
            <Text style={styles.unitFeature}>{unit.bathrooms} bath</Text>
            <Text style={styles.unitFeature}>{unit.size} m²</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTenants = () => (
    <View style={styles.tenantsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tenants ({tenants.length})</Text>
        <Button
          title="Add Tenant"
          size="small"
          variant="outline"
          onPress={() => navigation.navigate('AddTenant', { propertyId })}
        />
      </View>
      
      {tenants.map((tenant) => (
        <View key={tenant.id} style={styles.tenantCard}>
          <View style={styles.tenantInfo}>
            <Text style={styles.tenantName}>
              {tenant.first_name} {tenant.last_name}
            </Text>
            <Text style={styles.tenantUnit}>Unit: {tenant.unit_number}</Text>
            <Text style={styles.tenantRent}>KES {tenant.monthly_rent?.toLocaleString()}/month</Text>
          </View>
          
          <View style={[styles.leaseStatus, { backgroundColor: getLeaseStatusColor(tenant.status) }]}>
            <Text style={styles.leaseStatusText}>{tenant.status}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#10b981';
      case 'occupied': return '#f59e0b';
      case 'maintenance': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getLeaseStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'expired': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading property details..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.scrollView}
      >
        {property && <PropertyCard property={property} onPress={() => {}} />}
        
        <View style={styles.tabContainer}>
          {['overview', 'units', 'tenants'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'units' && renderUnits()}
        {activeTab === 'tenants' && renderTenants()}
      </ScrollView>
      
      <View style={styles.actionButtons}>
        <Button
          title="Edit Property"
          variant="outline"
          onPress={() => navigation.navigate('EditProperty', { propertyId })}
        />
        <Button
          title="Delete Property"
          variant="secondary"
          onPress={handleDeleteProperty}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  overviewContainer: {
    padding: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  descriptionSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  addressSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  address: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  city: {
    fontSize: 14,
    color: '#6b7280',
  },
  unitsContainer: {
    padding: 16,
  },
  tenantsContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  unitCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
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
  unitDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  unitType: {
    fontSize: 14,
    color: '#6b7280',
  },
  unitRent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  unitFeatures: {
    flexDirection: 'row',
  },
  unitFeature: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 16,
  },
  tenantCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tenantUnit: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  tenantRent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  leaseStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaseStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default PropertyDetailScreen;

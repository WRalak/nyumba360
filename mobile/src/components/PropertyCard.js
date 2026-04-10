import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-vector-icons/MaterialIcons';

const PropertyCard = ({
  property,
  onPress,
  showStatus = true,
  compact = false,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#10b981';
      case 'occupied':
        return '#f59e0b';
      case 'maintenance':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity style={[styles.card, compact && styles.compactCard]} onPress={onPress}>
      {property.image ? (
        <Image source={{ uri: property.image }} style={[styles.image, compact && styles.compactImage]} />
      ) : (
        <View style={[styles.placeholderImage, compact && styles.compactImage]}>
          <Icon name="apartment" size={compact ? 24 : 40} color="#9ca3af" />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.title, compact && styles.compactTitle]} numberOfLines={1}>
          {property.title}
        </Text>
        
        <Text style={[styles.address, compact && styles.compactAddress]} numberOfLines={2}>
          {property.address}
        </Text>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Icon name="apartment" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{property.type}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Icon name="king-bed" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{property.total_units} units</Text>
          </View>
        </View>
        
        {showStatus && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) }]}>
            <Text style={styles.statusText}>{getStatusText(property.status)}</Text>
          </View>
        )}
        
        {property.rent_range && !compact && (
          <Text style={styles.price}>KES {property.rent_range}/mo</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  compactCard: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
  },
  compactImage: {
    width: 80,
    height: 80,
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  compactAddress: {
    fontSize: 12,
    marginBottom: 4,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
});

export default PropertyCard;

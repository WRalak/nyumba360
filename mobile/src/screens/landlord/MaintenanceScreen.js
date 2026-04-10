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

const MaintenanceCard = ({ ticket, onPress }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#ef4444';
      case 'in_progress':
        return '#f59e0b';
      case 'resolved':
        return '#10b981';
      case 'closed':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity style={styles.maintenanceCard} onPress={onPress}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketTitle} numberOfLines={1}>
            {ticket.title}
          </Text>
          <Text style={styles.propertyName}>{ticket.property_name}</Text>
          <Text style={styles.unitNumber}>Unit {ticket.unit_number}</Text>
        </View>
        <View style={styles.badgesContainer}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
            <Text style={styles.badgeText}>{getPriorityText(ticket.priority)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
            <Text style={styles.badgeText}>{getStatusText(ticket.status)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.ticketDescription} numberOfLines={2}>
        {ticket.description}
      </Text>

      <View style={styles.ticketFooter}>
        <View style={styles.tenantInfo}>
          {ticket.first_name && (
            <Text style={styles.tenantName}>
              {ticket.first_name} {ticket.last_name}
            </Text>
          )}
          {ticket.phone && <Text style={styles.tenantPhone}>{ticket.phone}</Text>}
        </View>
        <Text style={styles.createdDate}>
          {new Date(ticket.created_at).toLocaleDateString()}
        </Text>
      </View>
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

const MaintenanceScreen = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { api } = useAuth();

  const fetchData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/maintenance/stats'),
      ]);

      setTickets(ticketsRes.data.tickets || []);
      setStats(statsRes.data.stats || {});
    } catch (error) {
      console.error('Fetch maintenance error:', error);
      Alert.alert('Error', 'Failed to load maintenance tickets');
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

  const renderTicket = ({ item }) => (
    <MaintenanceCard
      ticket={item}
      onPress={() => navigation.navigate('MaintenanceDetail', { ticketId: item.id })}
    />
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <StatsCard
        title="Total Tickets"
        value={stats.totalTickets || 0}
        icon="build"
        color="#2563eb"
      />
      <StatsCard
        title="Open"
        value={stats.openTickets || 0}
        icon="error"
        color="#ef4444"
      />
      <StatsCard
        title="In Progress"
        value={stats.inProgressTickets || 0}
        icon="hourglass-empty"
        color="#f59e0b"
      />
      <StatsCard
        title="Resolved"
        value={stats.resolvedTickets || 0}
        icon="check-circle"
        color="#10b981"
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
        <Text style={styles.headerTitle}>Maintenance</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateTicket')}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>New Ticket</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderStats()}

        <View style={styles.ticketsHeader}>
          <Text style={styles.ticketsTitle}>Recent Tickets</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllTickets')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {tickets.length > 0 ? (
          <View style={styles.listContainer}>
            {tickets.slice(0, 10).map((ticket) => (
              <MaintenanceCard
                key={ticket.id}
                ticket={ticket}
                onPress={() => navigation.navigate('MaintenanceDetail', { ticketId: ticket.id })}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="build" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Maintenance Tickets</Text>
            <Text style={styles.emptyDescription}>
              Create your first maintenance ticket to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => navigation.navigate('CreateTicket')}
            >
              <Text style={styles.emptyAddButtonText}>Create Ticket</Text>
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
  ticketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ticketsTitle: {
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
  maintenanceCard: {
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
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketTitle: {
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
  badgesContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#fff',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  tenantPhone: {
    fontSize: 12,
    color: '#6b7280',
  },
  createdDate: {
    fontSize: 12,
    color: '#9ca3af',
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

export default MaintenanceScreen;

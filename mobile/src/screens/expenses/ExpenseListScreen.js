import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../services/api';

const ExpenseListScreen = ({ navigation }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses');
      setExpenses(response.expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderExpense = ({ item }) => (
    <TouchableOpacity 
      style={styles.expenseItem}
      onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item._id })}
    >
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseTitle}>{item.description}</Text>
        <Text style={styles.expenseAmount}>KES {item.amount.toLocaleString()}</Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseCategory}>{item.expense_type}</Text>
        <Text style={styles.expenseDate}>
          {new Date(item.expense_date).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.expenseStatus}>
        <Text style={[styles.statusBadge, { backgroundColor: item.status === 'paid' ? '#4CAF50' : '#FF9800' }]}>
          {item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  addButtonText: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  listContainer: { 
    padding: 16 
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  expenseTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#333', 
    flex: 1 
  },
  expenseAmount: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#007bff' 
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  expenseCategory: { 
    fontSize: 14, 
    color: '#666' 
  },
  expenseDate: { 
    fontSize: 14, 
    color: '#666' 
  },
  expenseStatus: {
    alignSelf: 'flex-start'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});

export default ExpenseListScreen;

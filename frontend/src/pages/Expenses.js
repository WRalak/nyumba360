import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  CalendarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const ExpenseCard = ({ expense, onView, onEdit, onDelete }) => {
  const getExpenseTypeColor = (type) => {
    const colors = {
      repairs: 'bg-red-100 text-red-800',
      maintenance: 'bg-orange-100 text-orange-800',
      insurance: 'bg-blue-100 text-blue-800',
      rates: 'bg-purple-100 text-purple-800',
      utilities: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <CurrencyDollarIcon className="h-5 w-5 text-red-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{expense.description}</h3>
            <p className="text-sm text-gray-500 mt-1">{expense.property_name}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getExpenseTypeColor(expense.expense_type)}`}>
          {expense.expense_type.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount:</span>
          <span className="text-lg font-bold text-gray-900">KES {expense.amount?.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Date:</span>
          <span className="text-sm text-gray-900">
            {new Date(expense.expense_date).toLocaleDateString()}
          </span>
        </div>

        {expense.created_by && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Recorded by:</span>
            <span className="text-sm text-gray-900">{expense.created_by}</span>
          </div>
        )}
      </div>

      {expense.receipt_url && (
        <div className="mb-4">
          <a
            href={expense.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            View Receipt
          </a>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => onView(expense)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </button>
        <button
          onClick={() => onEdit(expense)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
};

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const queryClient = useQueryClient();
  const { api } = useAuth();

  // Fetch expenses
  const { data: expensesData, isLoading } = useQuery(
    ['expenses', searchTerm, typeFilter],
    async () => {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (typeFilter) params.expense_type = typeFilter;
      
      const response = await api.get('/expenses', { params });
      return response.data;
    },
    {
      refetchInterval: 30000,
    }
  );

  // Fetch expense stats
  const { data: statsData } = useQuery(
    'expenseStats',
    async () => {
      const response = await api.get('/expenses/stats');
      return response.data;
    },
    {
      refetchInterval: 60000,
    }
  );

  const expenses = expensesData?.expenses || [];
  const stats = statsData?.stats || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Expenses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track and manage property-related expenses
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-lg p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                KES {(stats.totalExpenses || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Expenses</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-500 rounded-lg p-3">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalProperties || 0}</div>
              <div className="text-sm text-gray-600">Properties</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
              <CalendarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.monthlyExpenses || 0}</div>
              <div className="text-sm text-gray-600">This Month</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-lg p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                KES {(stats.averageExpense || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Average Expense</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Types</option>
            <option value="repairs">Repairs</option>
            <option value="maintenance">Maintenance</option>
            <option value="insurance">Insurance</option>
            <option value="rates">Rates</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Expenses Grid */}
      {expenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onView={(expense) => console.log('View expense:', expense)}
              onEdit={(expense) => setEditingExpense(expense)}
              onDelete={(expenseId) => console.log('Delete expense:', expenseId)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || typeFilter ? 'Try adjusting your filters' : 'Add your first expense to get started'}
          </p>
          {!searchTerm && !typeFilter && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Expense
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showAddModal && (
        <ExpenseModal
          expense={editingExpense}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries('expenses');
            queryClient.invalidateQueries('expenseStats');
          }}
        />
      )}
    </div>
  );
};

// Expense Modal Component
const ExpenseModal = ({ expense, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    property_id: expense?.property_id || '',
    expense_type: expense?.expense_type || 'repairs',
    description: expense?.description || '',
    amount: expense?.amount || '',
    expense_date: expense?.expense_date || new Date().toISOString().split('T')[0],
    receipt_url: expense?.receipt_url || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const { api } = useAuth();

  // Fetch properties
  React.useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await api.get('/properties');
        setProperties(response.data.properties || []);
      } catch (error) {
        console.error('Fetch properties error:', error);
      }
    };
    fetchProperties();
  }, [api]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.property_id) newErrors.property_id = 'Please select a property';
    if (!formData.expense_type) newErrors.expense_type = 'Please select an expense type';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.expense_date) newErrors.expense_date = 'Expense date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (expense) {
        await api.put(`/expenses/${expense.id}`, expenseData);
      } else {
        await api.post('/expenses', expenseData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Save expense error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save expense';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({...formData, property_id: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.property_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>{property.name}</option>
                ))}
              </select>
              {errors.property_id && <p className="text-red-500 text-xs mt-1">{errors.property_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
              <select
                value={formData.expense_type}
                onChange={(e) => setFormData({...formData, expense_type: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.expense_type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="repairs">Repairs</option>
                <option value="maintenance">Maintenance</option>
                <option value="insurance">Insurance</option>
                <option value="rates">Rates</option>
                <option value="utilities">Utilities</option>
                <option value="other">Other</option>
              </select>
              {errors.expense_type && <p className="text-red-500 text-xs mt-1">{errors.expense_type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Plumbing repair for kitchen sink"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5000"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.expense_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expense_date && <p className="text-red-500 text-xs mt-1">{errors.expense_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Receipt URL (Optional)</label>
              <input
                type="url"
                value={formData.receipt_url}
                onChange={(e) => setFormData({...formData, receipt_url: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/receipt.pdf"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (expense ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Expenses;

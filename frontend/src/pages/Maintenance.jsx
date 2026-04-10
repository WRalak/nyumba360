import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { maintenanceAPI } from '../services/api';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const MaintenanceCard = ({ ticket, onView, onEdit }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <WrenchScrewdriverIcon className="h-5 w-5 text-orange-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{ticket.property_name} - Unit {ticket.unit_number}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority}
          </span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ticket.description}</p>

      {ticket.first_name && (
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="font-medium">Reported by:</span>
          <span className="ml-1">{ticket.first_name} {ticket.last_name}</span>
          {ticket.phone && <span className="ml-2">({ticket.phone})</span>}
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
        {ticket.resolved_at && (
          <span>Resolved: {new Date(ticket.resolved_at).toLocaleDateString()}</span>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onView(ticket)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </button>
        <button
          onClick={() => onEdit(ticket)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <WrenchScrewdriverIcon className="h-4 w-4 mr-1" />
          Update
        </button>
      </div>
    </div>
  );
};

const Maintenance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const queryClient = useQueryClient();

  // Fetch maintenance tickets
  const { data: ticketsData, isLoading } = useQuery(
    ['maintenance', searchTerm, statusFilter, priorityFilter],
    () => {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      
      return maintenanceAPI.getAll(params);
    },
    {
      refetchInterval: 30000,
    }
  );

  // Fetch maintenance stats
  const { data: statsData } = useQuery(
    'maintenanceStats',
    () => maintenanceAPI.getAll({ stats: true }),
    {
      refetchInterval: 60000,
    }
  );

  const tickets = ticketsData?.tickets || [];
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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage maintenance requests and repairs
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTicket(null);
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Ticket
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
              <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalTickets || 0}</div>
              <div className="text-sm text-gray-600">Total Tickets</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-lg p-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.openTickets || 0}</div>
              <div className="text-sm text-gray-600">Open</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-lg p-3">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.inProgressTickets || 0}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-lg p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.resolvedTickets || 0}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Grid */}
      {tickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <MaintenanceCard
              key={ticket.id}
              ticket={ticket}
              onView={(ticket) => console.log('View ticket:', ticket)}
              onEdit={(ticket) => setEditingTicket(ticket)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance tickets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter || priorityFilter ? 'Try adjusting your filters' : 'Create your first maintenance ticket to get started'}
          </p>
          {!searchTerm && !statusFilter && !priorityFilter && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Ticket
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Ticket Modal */}
      {showAddModal && (
        <MaintenanceModal
          ticket={editingTicket}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries('maintenance');
            queryClient.invalidateQueries('maintenanceStats');
          }}
        />
      )}
    </div>
  );
};

// Maintenance Modal Component
const MaintenanceModal = ({ ticket, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    property_id: ticket?.property_id || '',
    unit_id: ticket?.unit_id || '',
    tenant_id: ticket?.tenant_id || '',
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: ticket?.priority || 'medium',
    status: ticket?.status || 'open',
    resolution_notes: ticket?.resolution_notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const { api } = useAuth();

  // Fetch properties, units, and tenants
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesRes, tenantsRes] = await Promise.all([
          api.get('/properties'),
          api.get('/tenants')
        ]);
        setProperties(propertiesRes.data.properties || []);
        setTenants(tenantsRes.data.tenants || []);
      } catch (error) {
        console.error('Fetch data error:', error);
      }
    };
    fetchData();
  }, [api]);

  // Fetch units when property is selected
  React.useEffect(() => {
    if (formData.property_id) {
      const fetchUnits = async () => {
        try {
          const response = await api.get('/units', { params: { property_id: formData.property_id } });
          setUnits(response.data.units || []);
        } catch (error) {
          console.error('Fetch units error:', error);
        }
      };
      fetchUnits();
    } else {
      setUnits([]);
    }
  }, [formData.property_id, api]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.property_id) newErrors.property_id = 'Please select a property';
    if (!formData.unit_id) newErrors.unit_id = 'Please select a unit';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (ticket) {
        await api.put(`/maintenance/${ticket.id}`, formData);
      } else {
        await api.post('/maintenance', formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Save ticket error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save ticket';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {ticket ? 'Update Maintenance Ticket' : 'Create Maintenance Ticket'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({...formData, property_id: e.target.value, unit_id: ''})}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit_id}
                onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                disabled={!formData.property_id}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unit_id ? 'border-red-500' : 'border-gray-300'
                } disabled:bg-gray-100`}
              >
                <option value="">Select unit...</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.unit_number} - {unit.unit_type}</option>
                ))}
              </select>
              {errors.unit_id && <p className="text-red-500 text-xs mt-1">{errors.unit_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant (Optional)</label>
              <select
                value={formData.tenant_id}
                onChange={(e) => setFormData({...formData, tenant_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select tenant...</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.first_name} {tenant.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Brief description of the issue"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="Detailed description of the maintenance issue"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {ticket && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              )}
            </div>

            {ticket && (formData.status === 'resolved' || formData.status === 'closed') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                <textarea
                  value={formData.resolution_notes}
                  onChange={(e) => setFormData({...formData, resolution_notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe how the issue was resolved"
                />
              </div>
            )}

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
                {loading ? 'Saving...' : (ticket ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

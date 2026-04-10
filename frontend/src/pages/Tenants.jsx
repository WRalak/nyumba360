import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tenantAPI } from '../services/api';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const TenantCard = ({ tenant, onView, onEdit }) => {
  const getLeaseStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'terminated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {tenant.first_name} {tenant.last_name}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <PhoneIcon className="h-4 w-4 mr-1" />
              {tenant.phone}
            </div>
            {tenant.email && (
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                {tenant.email}
              </div>
            )}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLeaseStatusColor(tenant.lease_status)}`}>
          {tenant.lease_status}
        </span>
      </div>

      {tenant.current_lease && (
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Property:</span>
            <span className="text-sm font-medium text-gray-900">{tenant.current_lease.property_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Unit:</span>
            <span className="text-sm font-medium text-gray-900">{tenant.current_lease.unit_number}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Monthly Rent:</span>
            <span className="text-sm font-medium text-gray-900">KES {tenant.current_lease.monthly_rent?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Lease Period:</span>
            <span className="text-sm font-medium text-gray-900">
              {new Date(tenant.current_lease.lease_start_date).toLocaleDateString()} - {new Date(tenant.current_lease.lease_end_date).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {tenant.arrears > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-red-800">Arrears:</span>
            <span className="text-sm font-bold text-red-900">KES {tenant.arrears.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex space-x-2">
        <Link
          to={`/tenants/${tenant.id}`}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </Link>
        <button
          onClick={() => onEdit(tenant)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </button>
      </div>
    </div>
  );
};

const Tenants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const queryClient = useQueryClient();

  // Fetch tenants
  const { data: tenantsData, isLoading } = useQuery(
    ['tenants', searchTerm],
    () => tenantAPI.getAll(searchTerm ? { search: searchTerm } : {}),
    {
      refetchInterval: 30000,
    }
  );

  const tenants = tenantsData?.tenants || [];

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
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your tenants and lease agreements
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTenant(null);
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Tenant
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tenants by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Tenants Grid */}
      {tenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onView={(tenant) => console.log('View tenant:', tenant)}
              onEdit={(tenant) => setEditingTenant(tenant)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first tenant'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Tenant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Tenant Modal */}
      {showAddModal && (
        <TenantModal
          tenant={editingTenant}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries('tenants');
          }}
        />
      )}
    </div>
  );
};

// Tenant Modal Component
const TenantModal = ({ tenant, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: tenant?.first_name || '',
    last_name: tenant?.last_name || '',
    phone: tenant?.phone || '',
    email: tenant?.email || '',
    id_number: tenant?.id_number || '',
    id_type: tenant?.id_type || 'national_id',
    emergency_contact_name: tenant?.emergency_contact_name || '',
    emergency_contact_phone: tenant?.emergency_contact_phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { api } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^07[0-9]{8}$/.test(formData.phone)) newErrors.phone = 'Valid Kenyan phone number required';
    if (!formData.id_number.trim()) newErrors.id_number = 'ID number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (tenant) {
        await api.put(`/tenants/${tenant.id}`, formData);
      } else {
        await api.post('/tenants', formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Save tenant error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save tenant';
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
            {tenant ? 'Edit Tenant' : 'Add New Tenant'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="John"
                />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0712345678"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
              <input
                type="text"
                value={formData.id_number}
                onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.id_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="12345678"
              />
              {errors.id_number && <p className="text-red-500 text-xs mt-1">{errors.id_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
              <select
                value={formData.id_type}
                onChange={(e) => setFormData({...formData, id_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="alien_id">Alien ID</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Emergency contact"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0712345678"
                />
              </div>
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
                {loading ? 'Saving...' : (tenant ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Tenants;

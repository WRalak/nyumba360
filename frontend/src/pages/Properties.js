import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const PropertyCard = ({ property, onDelete, onEdit }) => {
  const occupancyRate = property.total_units > 0 
    ? Math.round((property.stats?.occupied_units || 0) / property.total_units * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
          <p className="text-gray-600 text-sm">{property.address}</p>
          <p className="text-gray-500 text-xs mt-1">{property.county}, {property.estate_area}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${
          property.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {property.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-gray-900">{property.total_units}</div>
          <div className="text-xs text-gray-500">Total Units</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-blue-600">{property.stats?.occupied_units || 0}</div>
          <div className="text-xs text-gray-500">Occupied</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Occupancy Rate</span>
          <span className="font-medium">{occupancyRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${occupancyRate}%` }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
        <span>Monthly Revenue:</span>
        <span className="font-semibold text-gray-900">
          KES {(property.stats?.current_monthly_rent || 0).toLocaleString()}
        </span>
      </div>

      <div className="flex space-x-2">
        <Link
          to={`/properties/${property.id}`}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-1" />
          View
        </Link>
        <button
          onClick={() => onEdit(property)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </button>
        <button
          onClick={() => onDelete(property.id)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
};

const Properties = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const queryClient = useQueryClient();
  const { api } = useAuth();

  // Fetch properties
  const { data: propertiesData, isLoading } = useQuery(
    'properties',
    async () => {
      const response = await api.get('/properties');
      return response.data;
    }
  );

  // Delete property mutation
  const deletePropertyMutation = useMutation(
    async (propertyId) => {
      await api.delete(`/properties/${propertyId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('properties');
      }
    }
  );

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        await deletePropertyMutation.mutateAsync(propertyId);
      } catch (error) {
        console.error('Delete property error:', error);
        alert('Failed to delete property');
      }
    }
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowAddModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const properties = propertiesData?.properties || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your rental properties and units
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProperty(null);
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Property
        </button>
      </div>

      {/* Stats Overview */}
      {properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{properties.length}</div>
            <div className="text-sm text-gray-600">Total Properties</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {properties.reduce((sum, p) => sum + (p.total_units || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Units</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {properties.reduce((sum, p) => sum + (p.stats?.occupied_units || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Occupied Units</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              KES {properties.reduce((sum, p) => sum + (p.stats?.current_monthly_rent || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Monthly Revenue</div>
          </div>
        </div>
      )}

      {/* Properties Grid */}
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onDelete={handleDeleteProperty}
              onEdit={handleEditProperty}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first property.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Property
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Property Modal */}
      {showAddModal && (
        <PropertyModal
          property={editingProperty}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries('properties');
          }}
        />
      )}
    </div>
  );
};

// Property Modal Component
const PropertyModal = ({ property, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: property?.name || '',
    address: property?.address || '',
    county: property?.county || '',
    estate_area: property?.estate_area || '',
    property_type: property?.property_type || 'apartment',
    total_units: property?.total_units || '',
    description: property?.description || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { api } = useAuth();
  const queryClient = useQueryClient();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Property name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.county.trim()) newErrors.county = 'County is required';
    if (!formData.total_units || formData.total_units < 1) {
      newErrors.total_units = 'Total units must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (property) {
        await api.put(`/properties/${property.id}`, formData);
      } else {
        await api.post('/properties', formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Save property error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save property';
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
            {property ? 'Edit Property' : 'Add New Property'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Riverside Apartments"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={2}
                placeholder="e.g., Kaburu Drive, Nakuru"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County *
                </label>
                <input
                  type="text"
                  value={formData.county}
                  onChange={(e) => setFormData({...formData, county: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.county ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Nakuru"
                />
                {errors.county && <p className="text-red-500 text-xs mt-1">{errors.county}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estate/Area
                </label>
                <input
                  type="text"
                  value={formData.estate_area}
                  onChange={(e) => setFormData({...formData, estate_area: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Milimani"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({...formData, property_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Units *
                </label>
                <input
                  type="number"
                  value={formData.total_units}
                  onChange={(e) => setFormData({...formData, total_units: parseInt(e.target.value) || ''})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.total_units ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 12"
                  min="1"
                />
                {errors.total_units && <p className="text-red-500 text-xs mt-1">{errors.total_units}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional description of the property"
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
                {loading ? 'Saving...' : (property ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Properties;

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  BuildingOfficeIcon,
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  HomeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const UnitCard = ({ unit, onEdit, onDelete, onAddTenant }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Unit {unit.unit_number}</h3>
          <p className="text-sm text-gray-500">{unit.unit_type}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          unit.is_vacant 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {unit.is_vacant ? 'Vacant' : 'Occupied'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Monthly Rent:</span>
          <span className="text-sm font-medium text-gray-900">KES {unit.monthly_rent?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Security Deposit:</span>
          <span className="text-sm font-medium text-gray-900">KES {unit.security_deposit?.toLocaleString()}</span>
        </div>
        {unit.size_sqm && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Size:</span>
            <span className="text-sm font-medium text-gray-900">{unit.size_sqm} sqm</span>
          </div>
        )}
        {unit.floor_number && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Floor:</span>
            <span className="text-sm font-medium text-gray-900">{unit.floor_number}</span>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(unit)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
        >
          <PencilIcon className="h-4 w-4 mr-1" />
          Edit
        </button>
        <button
          onClick={() => onDelete(unit.id)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
        >
          <TrashIcon className="h-4 w-4 mr-1" />
          Delete
        </button>
        {unit.is_vacant && (
          <button
            onClick={() => onAddTenant(unit)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
          >
            <UserGroupIcon className="h-4 w-4 mr-1" />
            Add Tenant
          </button>
        )}
      </div>
    </div>
  );
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const queryClient = useQueryClient();
  const { api } = useAuth();

  // Fetch property details
  const { data: propertyData, isLoading } = useQuery(
    ['property', id],
    async () => {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    }
  );

  // Delete unit mutation
  const deleteUnitMutation = useMutation(
    async (unitId) => {
      await api.delete(`/units/${unitId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['property', id]);
      }
    }
  );

  const property = propertyData?.property;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Property not found</h3>
        <button
          onClick={() => navigate('/properties')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Properties
        </button>
      </div>
    );
  }

  const handleDeleteUnit = async (unitId) => {
    if (window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      try {
        await deleteUnitMutation.mutateAsync(unitId);
      } catch (error) {
        console.error('Delete unit error:', error);
        alert('Failed to delete unit');
      }
    }
  };

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setShowUnitModal(true);
  };

  const handleAddTenant = (unit) => {
    setSelectedUnit(unit);
    setShowTenantModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/properties')}
          className="mr-4 p-2 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-gray-600">{property.address}</p>
        </div>
      </div>

      {/* Property Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">County</p>
                <p className="font-medium text-gray-900">{property.county}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <HomeIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium text-gray-900 capitalize">{property.property_type}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Total Units</p>
                <p className="font-medium text-gray-900">{property.total_units}</p>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="font-medium text-gray-900">
                  KES {(property.stats?.current_monthly_rent || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">{property.stats?.total_units || 0}</div>
            <div className="text-sm text-blue-600">Total Units</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">{property.stats?.occupied_units || 0}</div>
            <div className="text-sm text-green-600">Occupied</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-900">{property.stats?.vacant_units || 0}</div>
            <div className="text-sm text-yellow-600">Vacant</div>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Occupancy Rate</span>
            <span className="text-sm font-medium text-gray-900">
              {property.total_units > 0 
                ? Math.round((property.stats?.occupied_units || 0) / property.total_units * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${property.total_units > 0 
                  ? (property.stats?.occupied_units || 0) / property.total_units * 100 
                  : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Units Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Units</h2>
            <button
              onClick={() => {
                setEditingUnit(null);
                setShowUnitModal(true);
              }}
              className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Unit
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {property.units && property.units.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {property.units.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  onEdit={handleEditUnit}
                  onDelete={handleDeleteUnit}
                  onAddTenant={handleAddTenant}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No units yet</h3>
              <p className="mt-1 text-sm text-gray-500">Add your first unit to get started</p>
              <button
                onClick={() => setShowUnitModal(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Unit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unit Modal */}
      {showUnitModal && (
        <UnitModal
          propertyId={property.id}
          unit={editingUnit}
          onClose={() => setShowUnitModal(false)}
          onSuccess={() => {
            setShowUnitModal(false);
            queryClient.invalidateQueries(['property', id]);
          }}
        />
      )}

      {/* Tenant Modal */}
      {showTenantModal && (
        <TenantModal
          unit={selectedUnit}
          onClose={() => setShowTenantModal(false)}
          onSuccess={() => {
            setShowTenantModal(false);
            queryClient.invalidateQueries(['property', id]);
          }}
        />
      )}
    </div>
  );
};

// Unit Modal Component (simplified)
const UnitModal = ({ propertyId, unit, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    unit_number: unit?.unit_number || '',
    unit_type: unit?.unit_type || '1br',
    monthly_rent: unit?.monthly_rent || '',
    security_deposit: unit?.security_deposit || '',
    size_sqm: unit?.size_sqm || '',
    floor_number: unit?.floor_number || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { api } = useAuth();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.unit_number.trim()) newErrors.unit_number = 'Unit number is required';
    if (!formData.monthly_rent || parseFloat(formData.monthly_rent) <= 0) {
      newErrors.monthly_rent = 'Monthly rent must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const unitData = {
        ...formData,
        property_id: propertyId,
        monthly_rent: parseFloat(formData.monthly_rent),
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
        size_sqm: formData.size_sqm ? parseInt(formData.size_sqm) : null,
        floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
      };

      if (unit) {
        await api.put(`/units/${unit.id}`, unitData);
      } else {
        await api.post('/units', unitData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Save unit error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save unit';
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
            {unit ? 'Edit Unit' : 'Add New Unit'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
              <input
                type="text"
                value={formData.unit_number}
                onChange={(e) => setFormData({...formData, unit_number: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unit_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., A101"
              />
              {errors.unit_number && <p className="text-red-500 text-xs mt-1">{errors.unit_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
              <select
                value={formData.unit_type}
                onChange={(e) => setFormData({...formData, unit_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="studio">Studio</option>
                <option value="bedsitter">Bedsitter</option>
                <option value="1br">1 Bedroom</option>
                <option value="2br">2 Bedrooms</option>
                <option value="3br">3 Bedrooms</option>
                <option value="4br+">4+ Bedrooms</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_rent}
                  onChange={(e) => setFormData({...formData, monthly_rent: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.monthly_rent ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="15000"
                />
                {errors.monthly_rent && <p className="text-red-500 text-xs mt-1">{errors.monthly_rent}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (KES)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.security_deposit}
                  onChange={(e) => setFormData({...formData, security_deposit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size (sqm)</label>
                <input
                  type="number"
                  value={formData.size_sqm}
                  onChange={(e) => setFormData({...formData, size_sqm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="45"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number</label>
                <input
                  type="number"
                  value={formData.floor_number}
                  onChange={(e) => setFormData({...formData, floor_number: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1"
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
                {loading ? 'Saving...' : (unit ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Tenant Modal Component (simplified)
const TenantModal = ({ unit, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { api } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Navigate to tenant creation with pre-selected unit
      onClose();
      // This would typically navigate to a tenant creation form
      console.log('Add tenant to unit:', unit);
    } catch (error) {
      console.error('Add tenant error:', error);
      alert('Failed to add tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Tenant</h3>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Adding tenant to Unit {unit?.unit_number} - {unit?.unit_type}
            </p>
            <p className="text-sm text-gray-600">
              Monthly Rent: KES {unit?.monthly_rent?.toLocaleString()}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
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
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  BuildingLibraryIcon,
  PlusIcon,
  EyeIcon,
  MapPinIcon,
  HomeIcon,
  CurrencyDollarIcon,
  StarIcon,
  SearchIcon
} from '@heroicons/react/24/outline';

const VacancyCard = ({ vacancy, onView, onEdit, onDelete, onToggleFeatured }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Images */}
      <div className="h-48 bg-gray-200 relative">
        {vacancy.images && vacancy.images.length > 0 ? (
          <img 
            src={vacancy.images[0]} 
            alt={vacancy.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BuildingLibraryIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {vacancy.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 text-xs font-semibold rounded-full">
            Featured
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Title and Location */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{vacancy.title}</h3>
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {vacancy.property_name} - Unit {vacancy.unit_number}
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <HomeIcon className="h-4 w-4 mr-1" />
            {vacancy.unit_type}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{vacancy.description}</p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Monthly Rent:</span>
            <span className="text-lg font-bold text-gray-900">KES {vacancy.monthly_rent?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Security Deposit:</span>
            <span className="text-sm font-medium text-gray-900">
              KES {vacancy.security_deposit?.toLocaleString()}
            </span>
          </div>
          {vacancy.available_date && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Available:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(vacancy.available_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onView(vacancy)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View
          </button>
          <button
            onClick={() => onEdit(vacancy)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onToggleFeatured(vacancy.id)}
            className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md transition-colors ${
              vacancy.is_featured 
                ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <StarIcon className="h-4 w-4 mr-1" />
            {vacancy.is_featured ? 'Unfeature' : 'Feature'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Vacancies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const queryClient = useQueryClient();
  const { api } = useAuth();

  // Fetch vacancies
  const { data: vacanciesData, isLoading } = useQuery(
    ['vacancies', searchTerm],
    async () => {
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await api.get('/vacancies', { params });
      return response.data;
    },
    {
      refetchInterval: 30000,
    }
  );

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation(
    async (vacancyId) => {
      // This would be an API call to toggle featured status
      console.log('Toggle featured:', vacancyId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vacancies');
      }
    }
  );

  const vacancies = vacanciesData?.vacancies || [];

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
          <h1 className="text-2xl font-bold text-gray-900">Vacancy Listings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your property listings and attract tenants
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVacancy(null);
            setShowAddModal(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Listing
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search vacancies by title, location, or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-lg p-3">
              <BuildingLibraryIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{vacancies.length}</div>
              <div className="text-sm text-gray-600">Total Listings</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-lg p-3">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                {vacancies.filter(v => v.is_featured).length}
              </div>
              <div className="text-sm text-gray-600">Featured</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-lg p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">
                KES {vacancies.reduce((sum, v) => sum + (v.monthly_rent || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Potential Rent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vacancies Grid */}
      {vacancies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.map((vacancy) => (
            <VacancyCard
              key={vacancy.id}
              vacancy={vacancy}
              onView={(vacancy) => console.log('View vacancy:', vacancy)}
              onEdit={(vacancy) => setEditingVacancy(vacancy)}
              onDelete={(vacancy) => console.log('Delete vacancy:', vacancy)}
              onToggleFeatured={() => toggleFeaturedMutation.mutateAsync(vacancy.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BuildingLibraryIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vacancy listings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first vacancy listing to attract tenants'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Listing
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Vacancy Modal */}
      {showAddModal && (
        <VacancyModal
          vacancy={editingVacancy}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries('vacancies');
          }}
        />
      )}
    </div>
  );
};

// Vacancy Modal Component
const VacancyModal = ({ vacancy, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    property_id: vacancy?.property_id || '',
    unit_id: vacancy?.unit_id || '',
    title: vacancy?.title || '',
    description: vacancy?.description || '',
    monthly_rent: vacancy?.monthly_rent || '',
    security_deposit: vacancy?.security_deposit || '',
    available_date: vacancy?.available_date || new Date().toISOString().split('T')[0],
    is_featured: vacancy?.is_featured || false,
    contact_info: vacancy?.contact_info || {},
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const { api } = useAuth();

  // Fetch properties and units
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const propertiesRes = await api.get('/properties');
        setProperties(propertiesRes.data.properties || []);
      } catch (error) {
        console.error('Fetch properties error:', error);
      }
    };
    fetchData();
  }, [api]);

  React.useEffect(() => {
    if (formData.property_id) {
      const fetchUnits = async () => {
        try {
          const response = await api.get('/units', { 
            params: { 
              property_id: formData.property_id,
              is_vacant: true 
            } 
          });
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
      const vacancyData = {
        ...formData,
        monthly_rent: parseFloat(formData.monthly_rent),
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
      };

      if (vacancy) {
        await api.put(`/vacancies/${vacancy.id}`, vacancyData);
      } else {
        await api.post('/vacancies', vacancyData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Save vacancy error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save vacancy listing';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {vacancy ? 'Edit Vacancy Listing' : 'Create Vacancy Listing'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_number} - {unit.unit_type}
                    </option>
                  ))}
                </select>
                {errors.unit_id && <p className="text-red-500 text-xs mt-1">{errors.unit_id}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Spacious 1BR apartment in Ruaka"
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
                placeholder="Beautiful 1 bedroom apartment with modern amenities, perfect for professionals or small families..."
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Date</label>
                <input
                  type="date"
                  value={formData.available_date}
                  onChange={(e) => setFormData({...formData, available_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                Feature this listing (KES 500/month)
              </label>
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
                {loading ? 'Saving...' : (vacancy ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Vacancies;

import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { KENYAN_COUNTIES, PROPERTY_TYPES } from '../../utils/constants';
import { validatePropertyName } from '../../utils/validators';

const PropertyForm = ({ property = null, onSave, onCancel }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    name: property?.name || '',
    address: property?.address || '',
    county: property?.county || '',
    estate_area: property?.estate_area || '',
    property_type: property?.property_type || PROPERTY_TYPES.APARTMENT,
    total_units: property?.total_units || '',
    description: property?.description || '',
    amenities: property?.amenities || '',
    is_active: property?.is_active ?? true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const nameError = validatePropertyName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.county) newErrors.county = 'County is required';
    if (!formData.total_units || formData.total_units < 1) {
      newErrors.total_units = 'Total units must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      onSave(formData);
      showSuccess(property ? 'Property updated successfully' : 'Property created successfully');
    } catch (error) {
      showError('Failed to save property');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Property Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Riverside Apartments"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
            Property Type *
          </label>
          <select
            id="property_type"
            name="property_type"
            value={formData.property_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(PROPERTY_TYPES).map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
            County *
          </label>
          <select
            id="county"
            name="county"
            value={formData.county}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.county ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select County</option>
            {KENYAN_COUNTIES.map(county => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
          {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county}</p>}
        </div>

        <div>
          <label htmlFor="total_units" className="block text-sm font-medium text-gray-700 mb-1">
            Total Units *
          </label>
          <input
            type="number"
            id="total_units"
            name="total_units"
            value={formData.total_units}
            onChange={handleChange}
            min="1"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.total_units ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 12"
          />
          {errors.total_units && <p className="text-red-500 text-sm mt-1">{errors.total_units}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Address *
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., 123 Main Street"
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>

      <div>
        <label htmlFor="estate_area" className="block text-sm font-medium text-gray-700 mb-1">
          Estate/Area
        </label>
        <input
          type="text"
          id="estate_area"
          name="estate_area"
          value={formData.estate_area}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Westlands"
        />
      </div>

      <div>
        <label htmlFor="amenities" className="block text-sm font-medium text-gray-700 mb-1">
          Amenities
        </label>
        <textarea
          id="amenities"
          name="amenities"
          rows={3}
          value={formData.amenities}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Swimming pool, gym, parking, security"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe the property..."
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
          Property is active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {property ? 'Update Property' : 'Create Property'}
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;

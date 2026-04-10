import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { UNIT_STATUS } from '../../utils/constants';

const UnitForm = ({ unit = null, onSave, onCancel }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    property_id: unit?.property_id || '',
    unit_number: unit?.unit_number || '',
    type: unit?.type || 'apartment',
    bedrooms: unit?.bedrooms || 1,
    bathrooms: unit?.bathrooms || 1,
    size: unit?.size || '',
    rent_amount: unit?.rent_amount || '',
    status: unit?.status || UNIT_STATUS.VACANT,
    description: unit?.description || '',
    amenities: unit?.amenities || [],
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
    
    if (!formData.property_id) newErrors.property_id = 'Property is required';
    if (!formData.unit_number.trim()) newErrors.unit_number = 'Unit number is required';
    if (!formData.rent_amount || formData.rent_amount <= 0) {
      newErrors.rent_amount = 'Rent amount must be greater than 0';
    }
    if (!formData.size || formData.size <= 0) {
      newErrors.size = 'Size must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      onSave(formData);
      showSuccess(unit ? 'Unit updated successfully' : 'Unit created successfully');
    } catch (error) {
      showError('Failed to save unit');
    }
  };

  const amenityOptions = [
    'balcony', 'parking', 'storage', 'gym', 'pool', 'air_conditioning', 'heating', 'laundry',
    'dishwasher', 'refrigerator', 'oven', 'microwave', 'security', 'elevator',
    'garden', 'terrace', 'fireplace', 'walk_in_closet', 'hardwood_floors'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 mb-1">
            Property *
          </label>
          <select
            id="property_id"
            name="property_id"
            value={formData.property_id}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.property_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Property</option>
            <option value="1">Riverside Apartments</option>
            <option value="2">Sunset Villas</option>
          </select>
          {errors.property_id && <p className="text-red-500 text-sm mt-1">{errors.property_id}</p>}
        </div>

        <div>
          <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700 mb-1">
            Unit Number *
          </label>
          <input
            type="text"
            id="unit_number"
            name="unit_number"
            value={formData.unit_number}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.unit_number ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., A-101, B-205"
          />
          {errors.unit_number && <p className="text-red-500 text-sm mt-1">{errors.unit_number}</p>}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Unit Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
            <option value="penthouse">Penthouse</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>

        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
            Bedrooms
          </label>
          <input
            type="number"
            id="bedrooms"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2"
          />
        </div>

        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
            Bathrooms
          </label>
          <input
            type="number"
            id="bathrooms"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 1"
          />
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
            Size (sq ft) *
          </label>
          <input
            type="number"
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            min="1"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.size ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 850"
          />
          {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
        </div>

        <div>
          <label htmlFor="rent_amount" className="block text-sm font-medium text-gray-700 mb-1">
            Rent Amount (KES) *
          </label>
          <input
            type="number"
            id="rent_amount"
            name="rent_amount"
            value={formData.rent_amount}
            onChange={handleChange}
            min="0"
            step="100"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.rent_amount ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 15000"
          />
          {errors.rent_amount && <p className="text-red-500 text-sm mt-1">{errors.rent_amount}</p>}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(UNIT_STATUS).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="amenities" className="block text-sm font-medium text-gray-700 mb-1">
          Amenities
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {amenityOptions.map((amenity) => (
            <label key={amenity} className="flex items-center">
              <input
                type="checkbox"
                name={amenity}
                checked={formData.amenities.includes(amenity)}
                onChange={(e) => {
                  const { name, checked } = e.target;
                  setFormData(prev => ({
                    ...prev,
                    amenities: checked
                      ? [...prev.amenities, name]
                      : prev.amenities.filter(a => a !== name)
                  }));
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {amenity.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
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
          placeholder="Describe the unit features, location benefits, etc."
        />
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
          {unit ? 'Update Unit' : 'Create Unit'}
        </button>
      </div>
    </form>
  );
};

export default UnitForm;

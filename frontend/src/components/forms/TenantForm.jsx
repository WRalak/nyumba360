import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { TENANT_STATUS, LEASE_STATUS } from '../../utils/constants';
import { isValidEmail, isValidKenyanPhone } from '../../utils/validators';

const TenantForm = ({ tenant = null, onSave, onCancel }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    first_name: tenant?.first_name || '',
    last_name: tenant?.last_name || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    id_number: tenant?.id_number || '',
    emergency_contact: tenant?.emergency_contact || '',
    emergency_phone: tenant?.emergency_phone || '',
    property_id: tenant?.property_id || '',
    unit_number: tenant?.unit_number || '',
    rent_amount: tenant?.rent_amount || '',
    lease_start: tenant?.lease_start || '',
    lease_end: tenant?.lease_end || '',
    lease_status: tenant?.lease_status || LEASE_STATUS.ACTIVE,
    status: tenant?.status || TENANT_STATUS.ACTIVE,
    notes: tenant?.notes || '',
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
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidKenyanPhone(formData.phone)) {
      newErrors.phone = 'Invalid Kenyan phone number';
    }
    
    if (!formData.rent_amount || formData.rent_amount <= 0) {
      newErrors.rent_amount = 'Rent amount must be greater than 0';
    }
    
    if (!formData.lease_start) newErrors.lease_start = 'Lease start date is required';
    if (!formData.lease_end) newErrors.lease_end = 'Lease end date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      onSave(formData);
      showSuccess(tenant ? 'Tenant updated successfully' : 'Tenant added successfully');
    } catch (error) {
      showError('Failed to save tenant');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.first_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.last_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="07XX XXX XXX or +254 XXX XXX XXX"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="id_number" className="block text-sm font-medium text-gray-700 mb-1">
            ID Number
          </label>
          <input
            type="text"
            id="id_number"
            name="id_number"
            value={formData.id_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Kenyan ID Number"
          />
        </div>

        <div>
          <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Contact
          </label>
          <input
            type="text"
            id="emergency_contact"
            name="emergency_contact"
            value={formData.emergency_contact}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Emergency contact name"
          />
        </div>

        <div>
          <label htmlFor="emergency_phone" className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Phone
          </label>
          <input
            type="tel"
            id="emergency_phone"
            name="emergency_phone"
            value={formData.emergency_phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Emergency contact phone"
          />
        </div>

        <div>
          <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700 mb-1">
            Unit Number
          </label>
          <input
            type="text"
            id="unit_number"
            name="unit_number"
            value={formData.unit_number}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., A-101"
          />
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
          <label htmlFor="lease_start" className="block text-sm font-medium text-gray-700 mb-1">
            Lease Start *
          </label>
          <input
            type="date"
            id="lease_start"
            name="lease_start"
            value={formData.lease_start}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lease_start ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lease_start && <p className="text-red-500 text-sm mt-1">{errors.lease_start}</p>}
        </div>

        <div>
          <label htmlFor="lease_end" className="block text-sm font-medium text-gray-700 mb-1">
            Lease End *
          </label>
          <input
            type="date"
            id="lease_end"
            name="lease_end"
            value={formData.lease_end}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lease_end ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lease_end && <p className="text-red-500 text-sm mt-1">{errors.lease_end}</p>}
        </div>

        <div>
          <label htmlFor="lease_status" className="block text-sm font-medium text-gray-700 mb-1">
            Lease Status
          </label>
          <select
            id="lease_status"
            name="lease_status"
            value={formData.lease_status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(LEASE_STATUS).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Tenant Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(TENANT_STATUS).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes about the tenant..."
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
          {tenant ? 'Update Tenant' : 'Add Tenant'}
        </button>
      </div>
    </form>
  );
};

export default TenantForm;

import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { PAYMENT_STATUS, PAYMENT_METHODS } from '../../utils/constants';

const PaymentForm = ({ payment = null, onSave, onCancel }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    tenant_id: payment?.tenant_id || '',
    property_id: payment?.property_id || '',
    amount: payment?.amount || '',
    payment_date: payment?.payment_date || new Date().toISOString().split('T')[0],
    payment_method: payment?.payment_method || PAYMENT_METHODS.MPESA,
    status: payment?.status || PAYMENT_STATUS.COMPLETED,
    transaction_id: payment?.transaction_id || '',
    notes: payment?.notes || '',
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
    
    if (!formData.tenant_id) newErrors.tenant_id = 'Tenant is required';
    if (!formData.property_id) newErrors.property_id = 'Property is required';
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.payment_date) newErrors.payment_date = 'Payment date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      onSave(formData);
      showSuccess(payment ? 'Payment updated successfully' : 'Payment recorded successfully');
    } catch (error) {
      showError('Failed to save payment');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="tenant_id" className="block text-sm font-medium text-gray-700 mb-1">
            Tenant *
          </label>
          <select
            id="tenant_id"
            name="tenant_id"
            value={formData.tenant_id}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.tenant_id ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Tenant</option>
            {/* This should be populated with actual tenants */}
            <option value="1">John Doe - Unit A-101</option>
            <option value="2">Jane Smith - Unit B-205</option>
          </select>
          {errors.tenant_id && <p className="text-red-500 text-sm mt-1">{errors.tenant_id}</p>}
        </div>

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
            {/* This should be populated with actual properties */}
            <option value="1">Riverside Apartments</option>
            <option value="2">Sunset Villas</option>
          </select>
          {errors.property_id && <p className="text-red-500 text-sm mt-1">{errors.property_id}</p>}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount (KES) *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            step="100"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.amount ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 15000"
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date *
          </label>
          <input
            type="date"
            id="payment_date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.payment_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.payment_date && <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>}
        </div>

        <div>
          <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(PAYMENT_METHODS).map(method => (
              <option key={method} value={method}>
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(PAYMENT_STATUS).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="transaction_id" className="block text-sm font-medium text-gray-700 mb-1">
            Transaction ID
          </label>
          <input
            type="text"
            id="transaction_id"
            name="transaction_id"
            value={formData.transaction_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="M-Pesa transaction ID or reference"
          />
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
          placeholder="Additional notes about this payment..."
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
          {payment ? 'Update Payment' : 'Record Payment'}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;

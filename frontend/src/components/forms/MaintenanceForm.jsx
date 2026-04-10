import React, { useState } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { MAINTENANCE_PRIORITY, MAINTENANCE_STATUS } from '../../utils/constants';

const MaintenanceForm = ({ ticket = null, onSave, onCancel }) => {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState({
    property_id: ticket?.property_id || '',
    unit_number: ticket?.unit_number || '',
    title: ticket?.title || '',
    description: ticket?.description || '',
    priority: ticket?.priority || MAINTENANCE_PRIORITY.MEDIUM,
    status: ticket?.status || MAINTENANCE_STATUS.PENDING,
    reported_by: ticket?.reported_by || '',
    assigned_to: ticket?.assigned_to || '',
    estimated_cost: ticket?.estimated_cost || '',
    actual_cost: ticket?.actual_cost || '',
    scheduled_date: ticket?.scheduled_date || '',
    completed_date: ticket?.completed_date || '',
    notes: ticket?.notes || '',
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
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      onSave(formData);
      showSuccess(ticket ? 'Maintenance ticket updated successfully' : 'Maintenance ticket created successfully');
    } catch (error) {
      showError('Failed to save maintenance ticket');
    }
  };

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
            {/* This should be populated with actual properties */}
            <option value="1">Riverside Apartments</option>
            <option value="2">Sunset Villas</option>
          </select>
          {errors.property_id && <p className="text-red-500 text-sm mt-1">{errors.property_id}</p>}
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
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Leaking faucet in bathroom"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(MAINTENANCE_PRIORITY).map(priority => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
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
            {Object.values(MAINTENANCE_STATUS).map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reported_by" className="block text-sm font-medium text-gray-700 mb-1">
            Reported By
          </label>
          <input
            type="text"
            id="reported_by"
            name="reported_by"
            value={formData.reported_by}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tenant name or staff"
          />
        </div>

        <div>
          <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
            Assigned To
          </label>
          <input
            type="text"
            id="assigned_to"
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Maintenance staff or contractor"
          />
        </div>

        <div>
          <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Cost (KES)
          </label>
          <input
            type="number"
            id="estimated_cost"
            name="estimated_cost"
            value={formData.estimated_cost}
            onChange={handleChange}
            min="0"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 5000"
          />
        </div>

        <div>
          <label htmlFor="actual_cost" className="block text-sm font-medium text-gray-700 mb-1">
            Actual Cost (KES)
          </label>
          <input
            type="number"
            id="actual_cost"
            name="actual_cost"
            value={formData.actual_cost}
            onChange={handleChange}
            min="0"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 4500"
          />
        </div>

        <div>
          <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
            Scheduled Date
          </label>
          <input
            type="date"
            id="scheduled_date"
            name="scheduled_date"
            value={formData.scheduled_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="completed_date" className="block text-sm font-medium text-gray-700 mb-1">
            Completed Date
          </label>
          <input
            type="date"
            id="completed_date"
            name="completed_date"
            value={formData.completed_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe the maintenance issue in detail..."
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional notes or updates..."
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
          {ticket ? 'Update Ticket' : 'Create Ticket'}
        </button>
      </div>
    </form>
  );
};

export default MaintenanceForm;

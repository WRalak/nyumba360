import React, { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../utils/formatters';

const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = 'Select date',
  className = '',
  disabled = false,
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  React.useEffect(() => {
    if (value) {
      setInputValue(formatDate(value));
    }
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Try to parse the date
    if (newValue) {
      const parsedDate = new Date(newValue);
      if (!isNaN(parsedDate.getTime())) {
        onChange(parsedDate.toISOString().split('T')[0]);
      }
    } else {
      onChange('');
    }
  };

  const handleDateSelect = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setInputValue(formatDate(date));
    onChange(formattedDate);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* Simple date picker implementation */}
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 p-4 bg-white border border-gray-300 rounded-md shadow-lg">
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleDateSelect(new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

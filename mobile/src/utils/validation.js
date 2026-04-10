import React, { useState } from 'react';
import { isValidEmail, isValidKenyanPhone, isValidKenyanId } from './helpers';

// Validation rules
export const validationRules = {
  required: (value) => {
    if (!value || value.toString().trim() === '') {
      return 'This field is required';
    }
    return null;
  },
  
  email: (value) => {
    if (!value) return 'Email is required';
    if (!isValidEmail(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  phone: (value) => {
    if (!value) return 'Phone number is required';
    if (!isValidKenyanPhone(value)) {
      return 'Please enter a valid Kenyan phone number';
    }
    return null;
  },
  
  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return null;
  },
  
  confirmPassword: (value, confirmValue) => {
    if (!value) return 'Please confirm your password';
    if (value !== confirmValue) {
      return 'Passwords do not match';
    }
    return null;
  },
  
  minLength: (min) => (value) => {
    if (!value) return 'This field is required';
    if (value.length < min) {
      return `This field must be at least ${min} characters long`;
    }
    return null;
  },
  
  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `This field must not exceed ${max} characters`;
    }
    return null;
  },
  
  number: (value) => {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return 'Please enter a valid number';
    }
    return null;
  },
  
  positiveNumber: (value) => {
    if (!value) return 'This field is required';
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return 'Please enter a positive number';
    }
    return null;
  },
  
  idNumber: (value) => {
    if (!value) return 'ID number is required';
    if (!isValidKenyanId(value)) {
      return 'Please enter a valid Kenyan ID number (8 digits)';
    }
    return null;
  },
  
  name: (value) => {
    if (!value) return 'This field is required';
    if (value.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return 'Name can only contain letters and spaces';
    }
    return null;
  },
};

// Form validation schemas
export const validationSchemas = {
  login: {
    email: [validationRules.required, validationRules.email],
    password: [validationRules.required],
  },
  
  register: {
    first_name: [validationRules.required, validationRules.name],
    last_name: [validationRules.required, validationRules.name],
    email: [validationRules.required, validationRules.email],
    phone: [validationRules.required, validationRules.phone],
    password: [validationRules.required, validationRules.password],
    confirm_password: [(value, formData) => 
      validationRules.confirmPassword(value, formData?.password)
    ],
    id_number: [validationRules.idNumber],
  },
  
  property: {
    title: [validationRules.required, validationRules.minLength(3)],
    description: [validationRules.required, validationRules.minLength(10)],
    address: [validationRules.required],
    city: [validationRules.required],
    type: [validationRules.required],
    total_units: [validationRules.required, validationRules.positiveNumber],
  },
  
  unit: {
    unit_number: [validationRules.required],
    type: [validationRules.required],
    rent_amount: [validationRules.required, validationRules.positiveNumber],
    deposit_amount: [validationRules.number],
    size: [validationRules.positiveNumber],
    bedrooms: [validationRules.number],
    bathrooms: [validationRules.number],
  },
  
  tenant: {
    first_name: [validationRules.required, validationRules.name],
    last_name: [validationRules.required, validationRules.name],
    email: [validationRules.required, validationRules.email],
    phone: [validationRules.required, validationRules.phone],
    id_number: [validationRules.idNumber],
    lease_start: [validationRules.required],
    lease_end: [validationRules.required],
    monthly_rent: [validationRules.required, validationRules.positiveNumber],
  },
  
  payment: {
    amount: [validationRules.required, validationRules.positiveNumber],
    payment_type: [validationRules.required],
    payment_method: [validationRules.required],
    payment_date: [validationRules.required],
  },
  
  maintenance: {
    title: [validationRules.required, validationRules.minLength(3)],
    description: [validationRules.required, validationRules.minLength(10)],
    category: [validationRules.required],
    priority: [validationRules.required],
  },
};

// Validate form data
export const validateForm = (data, schema) => {
  const errors = {};
  
  Object.keys(schema).forEach(field => {
    const fieldRules = schema[field];
    const value = data[field];
    
    for (const rule of fieldRules) {
      const error = rule(value, data);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Validate single field
export const validateSingleField = (value, rules, formData = {}) => {
  for (const rule of rules) {
    const error = rule(value, formData);
    if (error) {
      return error;
    }
  }
  return null;
};

// Validate field for external use
export const validateField = (value, rules, formData = {}) => {
  return validateSingleField(value, rules, formData);
};

// Real-time validation hook
export const useValidation = (schema, initialData = {}) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const fieldRules = schema[name];
    if (!fieldRules) return null;

    const error = validateSingleField(value, fieldRules, data);
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (name, value) => {
    setData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, data[name]);
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(schema).forEach(field => {
      const error = validateSingleField(data[field], schema[field], data);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(schema).reduce((acc, field) => ({ ...acc, [field]: true }), {}));
    
    return { isValid, errors: newErrors };
  };

  const resetForm = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    validateField,
    resetForm,
    isValid: Object.keys(errors).length === 0,
  };
};

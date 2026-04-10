// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation for Kenya
export const isValidKenyanPhone = (phone) => {
  const phoneRegex = /^(?:\+254|254|0)?[7]\d{8}$/;
  return phoneRegex.test(phone);
};

// ID number validation (Kenyan)
export const isValidIdNumber = (idNumber) => {
  // Basic validation - Kenyan ID numbers are 8 digits
  const idRegex = /^\d{8}$/;
  return idRegex.test(idNumber);
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Required field validation
export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

// Number validation
export const validateNumber = (value, fieldName, min = 0, max = Infinity) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (num > max) {
    return `${fieldName} must be at most ${max}`;
  }
  
  return null;
};

// Date validation
export const validateDate = (value, fieldName, minDate = null, maxDate = null) => {
  if (!value) {
    return `${fieldName} is required`;
  }
  
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  
  if (minDate && date < new Date(minDate)) {
    return `${fieldName} must be after ${minDate}`;
  }
  
  if (maxDate && date > new Date(maxDate)) {
    return `${fieldName} must be before ${maxDate}`;
  }
  
  return null;
};

// KRA PIN validation (Kenya Revenue Authority)
export const isValidKRAPin = (pin) => {
  // KRA PIN format: A/XXXXXZ or XXXXXXXXXXXXX (11 digits)
  const kraRegex = /^[A-Z]\/\d{5}[A-Z]$|^\d{11}$/;
  return kraRegex.test(pin);
};

// Rent amount validation
export const validateRentAmount = (amount) => {
  const num = parseFloat(amount);
  
  if (isNaN(num) || num <= 0) {
    return 'Rent amount must be a positive number';
  }
  
  if (num > 1000000) {
    return 'Rent amount seems too high';
  }
  
  return null;
};

// Validate property name
export const validatePropertyName = (name) => {
  if (!name || name.trim().length < 3) {
    return 'Property name must be at least 3 characters long';
  }
  
  if (name.trim().length > 100) {
    return 'Property name cannot exceed 100 characters';
  }
  
  return null;
};

import { Platform } from 'react-native';

// Format currency
export const formatCurrency = (amount, currency = 'KES') => {
  return `${currency} ${amount?.toLocaleString() || '0'}`;
};

// Format date
export const formatDate = (date, format = 'long') => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } else if (format === 'short') {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } else if (format === 'time') {
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return dateObj.toLocaleDateString();
};

// Calculate days until due date
export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Get status color
export const getStatusColor = (status) => {
  const colors = {
    // Payment status
    paid: '#10b981',
    pending: '#f59e0b',
    overdue: '#ef4444',
    failed: '#ef4444',
    
    // Property/Unit status
    available: '#10b981',
    occupied: '#f59e0b',
    maintenance: '#ef4444',
    unavailable: '#6b7280',
    
    // Lease status
    active: '#10b981',
    expired: '#ef4444',
    terminated: '#ef4444',
    pending: '#f59e0b',
    
    // Maintenance status
    reported: '#3b82f6',
    in_progress: '#f59e0b',
    completed: '#10b981',
    cancelled: '#ef4444',
    
    // User status
    active: '#10b981',
    inactive: '#6b7280',
    suspended: '#ef4444',
  };
  
  return colors[status] || '#6b7280';
};

// Get status text with proper formatting
export const getStatusText = (status) => {
  return status
    ? status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : 'Unknown';
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Kenya format)
export const isValidKenyanPhone = (phone) => {
  const phoneRegex = /^(?:\+254|0)?[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Format phone number to Kenya format
export const formatKenyanPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleanPhone.startsWith('254')) {
    return cleanPhone;
  } else if (cleanPhone.startsWith('0')) {
    return '254' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
    return '254' + cleanPhone;
  }
  
  return cleanPhone;
};

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Get rent status
export const getRentStatus = (dueDate, paidDate) => {
  if (!dueDate) return 'unknown';
  
  const today = new Date();
  const due = new Date(dueDate);
  const paid = paidDate ? new Date(paidDate) : null;
  
  if (paid && paid <= due) {
    return 'paid';
  } else if (today > due) {
    return 'overdue';
  } else {
    const daysUntilDue = getDaysUntilDue(due);
    if (daysUntilDue <= 7) {
      return 'due_soon';
    }
    return 'pending';
  }
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get file extension
export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Check if file is image
export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  return imageExtensions.includes(getFileExtension(filename));
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get platform specific styles
export const getPlatformStyles = (iosStyles, androidStyles) => {
  return Platform.OS === 'ios' ? iosStyles : androidStyles;
};

// Validate ID number (Kenya)
export const isValidKenyanId = (idNumber) => {
  // Kenyan ID numbers are 8 digits
  const idRegex = /^\d{8}$/;
  return idRegex.test(idNumber);
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Get month name
export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || 'Unknown';
};

// Get relative time (e.g., "2 hours ago", "3 days ago")
export const getRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date, 'short');
  }
};

// Sort array by property
export const sortByProperty = (array, property, order = 'asc') => {
  return array.sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (order === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    } else {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    }
  });
};

// Filter array by property
export const filterByProperty = (array, property, value) => {
  return array.filter(item => item[property] === value);
};

// Search in array of objects
export const searchInArray = (array, searchTerm, properties) => {
  if (!searchTerm) return array;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return properties.some(prop => {
      const value = item[prop];
      return value && value.toString().toLowerCase().includes(lowerSearchTerm);
    });
  });
};

// Property types
export const PROPERTY_TYPES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  COMMERCIAL: 'commercial',
  LAND: 'land',
  OFFICE: 'office',
  WAREHOUSE: 'warehouse',
  SHOP: 'shop',
  STUDIO: 'studio',
};

// Property status
export const PROPERTY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
  OCCUPIED: 'occupied',
  VACANT: 'vacant',
};

// Tenant status
export const TENANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EVICTED: 'evicted',
  MOVED_OUT: 'moved_out',
  PENDING: 'pending',
};

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment methods
export const PAYMENT_METHODS = {
  MPESA: 'mpesa',
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  CREDIT_CARD: 'credit_card',
};

// Maintenance priority
export const MAINTENANCE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Maintenance status
export const MAINTENANCE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
};

// Lease status
export const LEASE_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  TERMINATED: 'terminated',
  PENDING: 'pending',
  RENEWED: 'renewed',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  LANDLORD: 'landlord',
  MANAGER: 'manager',
  TENANT: 'tenant',
  AGENT: 'agent',
};

// Counties in Kenya
export const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kisii', 'Thika',
  'Kitale', 'Garissa', 'Kakamega', 'Nyeri', 'Meru', 'Bungoma', 'Machakos',
  'Lamu', 'Kilifi', 'Kwale', 'Tana River', 'Taita Taveta', 'Mandera',
  'Marsabit', 'Isiolo', 'Wajir', 'Garissa', 'Turkana', 'West Pokot',
  'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi',
  'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho',
  'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu',
  'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nyandarua', 'Muranga',
  'Kiambu', 'Kirinyaga', 'Embu', 'Tharaka Nithi', 'Meru', 'Isiolo'
];

// Currency options
export const CURRENCY_OPTIONS = [
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: 'â', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

// Notification types
export const NOTIFICATION_TYPES = {
  PAYMENT_DUE: 'payment_due',
  PAYMENT_OVERDUE: 'payment_overdue',
  LEASE_EXPIRING: 'lease_expiring',
  MAINTENANCE_REQUEST: 'maintenance_request',
  NEW_TENANT: 'new_tenant',
  PROPERTY_VACANT: 'property_vacant',
  SYSTEM_UPDATE: 'system_update',
};

// File upload types and limits
export const FILE_UPLOAD = {
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
  },
  PROPERTIES: '/properties',
  UNITS: '/units',
  TENANTS: '/tenants',
  PAYMENTS: '/payments',
  MAINTENANCE: '/maintenance',
  USERS: '/users',
  REPORTS: '/reports',
  NOTIFICATIONS: '/notifications',
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-ddTHH:mm:ss',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
};

// Theme colors
export const THEME_COLORS = {
  PRIMARY: '#2563eb',
  SECONDARY: '#64748b',
  SUCCESS: '#16a34a',
  WARNING: '#d97706',
  ERROR: '#dc2626',
  INFO: '#0891b2',
};

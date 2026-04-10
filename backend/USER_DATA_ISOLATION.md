# User Data Isolation & Profile Management

## Overview

The Nyumba360 system implements comprehensive user data isolation to ensure each user has complete control over their own data while maintaining strict privacy and security boundaries.

## Data Isolation Architecture

### **Multi-Layer Security**
```
Request Flow:
User Request -> Authentication -> User Context -> Permission Check -> Data Filter -> Resource Access
```

### **Data Ownership Model**
- **Strict Ownership**: Users can only access their own data
- **Role-Based Access**: Different access levels for different user types
- **Subscription Limits**: Usage limits based on subscription plans
- **Privacy Controls**: User-configurable privacy settings

## User Profile Features

### **Comprehensive User Model**
```javascript
// Core Identity
- email, phone, password
- first_name, last_name, display_name
- user_type, role, is_active, is_suspended

// Verification & Security
- email_verified, phone_verified, identity_verified
- two_factor_enabled, login_attempts, lock_until
- verification_documents

// Profile Information
- profile_image, date_of_birth, gender, nationality
- address (street, city, state, postal_code, country, coordinates)

// Preferences & Privacy
- notification preferences (email, sms, marketing)
- language, timezone, currency
- profile_visibility, show_phone, show_email

// Subscription & API
- subscription plan and status
- API keys with permissions
- Usage statistics
```

### **User Types & Roles**
- **Landlord**: Owns and manages properties
- **Tenant**: Rents properties
- **Admin**: System administration
- **Property Manager**: Manages properties for landlords
- **Maintenance**: Handles maintenance requests

### **Subscription Plans**
| Plan | Properties | Tenants | Notifications | API Keys | Features |
|------|------------|---------|---------------|----------|----------|
| Free | 5 | 20 | 100/month | 1 | Basic features |
| Basic | 20 | 100 | 1,000/month | 3 | Notifications |
| Premium | 100 | 500 | 10,000/month | 10 | Bulk operations, analytics |
| Enterprise | Unlimited | Unlimited | Unlimited | Unlimited | All features |

## Data Isolation Implementation

### **Middleware Stack**
1. **Authentication**: JWT token validation
2. **User Context**: Set user permissions and data scope
3. **Permission Check**: Validate user permissions
4. **Data Filtering**: Filter queries by user ownership
5. **Resource Validation**: Ensure resource ownership

### **User Context System**
```javascript
// User context includes:
{
  id: user._id,
  email: user.email,
  user_type: 'landlord',
  role: 'user',
  subscription: { plan: 'basic', status: 'active' },
  permissions: ['view_profile', 'create_property', 'send_notifications'],
  dataScope: 'own', // 'own', 'team', 'all'
  preferences: { email_notifications: true, sms_notifications: true },
  privacy: { profile_visibility: 'private', show_phone: false }
}
```

### **Data Scope Levels**
- **Own**: Users can only access their own data
- **Team**: Managers can access team data
- **All**: Admins can access all data

## API Endpoints

### **Profile Management**
```bash
# Get user profile
GET /api/profile

# Update profile
PUT /api/profile
{
  "first_name": "John",
  "last_name": "Doe",
  "display_name": "John Doe",
  "preferences": {
    "email_notifications": true,
    "sms_notifications": false
  }
}

# Upload profile image
POST /api/profile/upload-image
Content-Type: multipart/form-data

# Get public profile
GET /api/profile/public/:userId

# Update notification preferences
PUT /api/profile/notifications
{
  "email_notifications": true,
  "sms_notifications": true,
  "marketing_emails": false
}

# Update privacy settings
PUT /api/profile/privacy
{
  "profile_visibility": "private",
  "show_phone": false,
  "show_email": false
}

# Get user statistics
GET /api/profile/stats

# Search users (with privacy)
GET /api/profile/search?query=john&user_type=landlord

# Get user notifications
GET /api/profile/notifications?type=sms&status=sent

# Delete account
DELETE /api/profile
{
  "password": "current_password"
}
```

## Data Isolation Examples

### **Property Access**
```javascript
// User can only access their own properties
const userProperties = await Property.find({
  owner_id: userContext.id
});

// Admin can access all properties
if (userContext.dataScope === 'all') {
  const allProperties = await Property.find({});
}
```

### **Notification Filtering**
```javascript
// Users only see their own notifications
const notifications = await Notification.find({
  $or: [
    { recipient: user.email },
    { recipient: user.phone },
    { sentBy: user._id }
  ]
});
```

### **Payment History**
```javascript
// Landlords only see their payment history
const payments = await Payment.find({
  landlord_id: user._id
});
```

## Privacy Controls

### **Profile Visibility Levels**
- **Public**: Anyone can view basic profile
- **Private**: Only user can view profile
- **Contacts Only**: Only contacts can view profile

### **Contact Information**
```javascript
// User can control who sees their contact info
privacy: {
  profile_visibility: 'private',
  show_phone: false,
  show_email: false
}
```

### **Data Sharing**
- Users control what data is shared
- Opt-in for marketing communications
- Granular notification preferences
- Right to data deletion

## Security Features

### **Account Security**
- **Two-Factor Authentication**: Optional 2FA with backup codes
- **Login Attempt Limiting**: Lock after 5 failed attempts
- **Session Management**: Track and invalidate sessions
- **Password Requirements**: Minimum 6 characters with hashing

### **API Security**
- **API Keys**: User-generated API keys with permissions
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Request Validation**: Input validation and sanitization
- **Audit Logging**: Log all data access attempts

### **Data Protection**
- **Encryption**: Passwords and sensitive data encrypted
- **Data Minimization**: Only collect necessary data
- **Right to Deletion**: Users can delete their accounts
- **Data Portability**: Export user data on request

## Usage Examples

### **Creating a Property with Data Isolation**
```javascript
// POST /api/properties
{
  "property_name": "Sunset Apartments",
  "property_type": "apartment",
  "address": {
    "street": "123 Main St",
    "city": "Nairobi",
    "county": "Nairobi"
  },
  "total_units": 10
}

// Automatically filtered by user context
// Only accessible by property owner
```

### **Sending Notifications with User Preferences**
```javascript
// POST /api/notifications/rent-reminder
{
  "tenantName": "John Doe",
  "propertyName": "Apartment 101",
  "dueDate": "2024-01-05",
  "amount": 15000,
  "phoneNumber": "+254712345678",
  "tenantEmail": "john@example.com"
}

// Respects user notification preferences
// Only sends if user has enabled notifications
```

### **Accessing User Data**
```javascript
// GET /api/profile/stats
// Returns only user's own statistics
{
  "stats": {
    "total_properties": 5,
    "total_units": 25,
    "total_tenants": 18,
    "total_revenue": 450000
  },
  "recent": {
    "properties": [...],
    "tenants": [...],
    "payments": [...]
  }
}
```

## Monitoring & Auditing

### **Data Access Logging**
```javascript
// Every data access is logged
{
  "userId": "user_id",
  "email": "user@example.com",
  "resource": "/api/properties",
  "method": "GET",
  "timestamp": "2024-01-01T12:00:00Z",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "isApiKeyRequest": false
}
```

### **Subscription Monitoring**
```javascript
// Track subscription usage
{
  "userId": "user_id",
  "plan": "basic",
  "usage": {
    "properties": 15,
    "tenants": 50,
    "notifications": 800,
    "api_keys": 2
  },
  "limits": {
    "properties": 20,
    "tenants": 100,
    "notifications": 1000,
    "api_keys": 3
  }
}
```

### **Privacy Violation Detection**
```javascript
// Detect and prevent unauthorized data access
if (userContext.dataScope !== 'all' && 
    resource.owner_id !== userContext.id) {
  // Log security violation
  securityLogger.logViolation({
    userId: userContext.id,
    attemptedResource: resourceId,
    resourceType: 'property',
    timestamp: new Date()
  });
  
  return res.status(403).json({
    error: 'Access denied'
  });
}
```

## Best Practices

### **For Developers**
1. **Always use user context** for data filtering
2. **Validate permissions** before allowing operations
3. **Log all data access** for auditing
4. **Respect privacy settings** in all operations
5. **Implement rate limiting** for API endpoints

### **For Users**
1. **Use strong passwords** and enable 2FA
2. **Review privacy settings** regularly
3. **Monitor account activity** for suspicious behavior
4. **Keep contact information** up to date
5. **Use API keys responsibly**

### **For Administrators**
1. **Monitor system logs** for security issues
2. **Review user subscriptions** and usage
3. **Handle data requests** promptly
4. **Maintain data backups** with security
5. **Regular security audits**

## Compliance

### **Data Protection Regulations**
- **GDPR Compliant**: Right to access, rectification, erasure
- **Data Minimization**: Collect only necessary data
- **Consent Management**: Explicit consent for data processing
- **Breach Notification**: Prompt notification of data breaches

### **Privacy by Design**
- **Default Privacy**: Private settings by default
- **Granular Controls**: Fine-grained privacy settings
- **Transparency**: Clear data usage policies
- **Accountability**: Regular privacy audits

## Troubleshooting

### **Common Issues**

#### Access Denied Errors
```bash
# Check user permissions
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5001/api/profile/stats

# Response shows required permissions
{
  "error": "Permission denied",
  "requiredPermission": "view_analytics",
  "userPermissions": ["view_profile", "create_property"]
}
```

#### Subscription Limit Reached
```bash
# Check current usage
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5001/api/profile/stats

# Response shows usage vs limits
{
  "error": "Subscription limit reached",
  "resource": "properties",
  "currentUsage": 20,
  "limit": 20,
  "subscriptionPlan": "basic"
}
```

#### Privacy Settings Blocking Access
```bash
# Check profile visibility
curl http://localhost:5001/api/profile/public/userId

# Response shows privacy restriction
{
  "error": "This profile is private"
}
```

This comprehensive user data isolation system ensures that each user has complete control over their own data while maintaining strict security and privacy boundaries throughout the Nyumba360 platform.

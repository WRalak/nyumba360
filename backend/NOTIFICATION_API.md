# Nyumba360 Notification API Documentation

## Overview

The Nyumba360 Notification API provides comprehensive SMS and email notification services integrated with Africa's Talking (SMS) and Nodemailer (Email). The system supports both individual and bulk notifications, automated templates, and detailed tracking.

## Authentication

All notification endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
http://localhost:5001/api/notifications
```

## SMS Endpoints

### Send Single SMS
```http
POST /api/notifications/sms
```

**Request Body:**
```json
{
  "phoneNumber": "+254712345678",
  "message": "Your message here",
  "priority": "normal" // optional: "normal" or "high"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "ATXid_1234567890",
  "status": "Sent",
  "cost": "KES 1.00"
}
```

### Send Bulk SMS
```http
POST /api/notifications/sms/bulk
```

**Request Body:**
```json
{
  "phoneNumbers": ["+254712345678", "+254723456789"],
  "message": "Bulk message here",
  "priority": "normal"
}
```

### Get SMS Delivery Status
```http
GET /api/notifications/sms/status/:messageId
```

## Email Endpoints

### Send Single Email
```http
POST /api/notifications/email
```

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "htmlContent": "<h1>HTML Content</h1><p>Message here</p>",
  "textContent": "Plain text version (optional)",
  "attachments": [
    {
      "filename": "document.pdf",
      "path": "/path/to/file.pdf"
    }
  ]
}
```

### Send Bulk Email
```http
POST /api/notifications/email/bulk
```

**Request Body:**
```json
{
  "recipients": [
    {
      "email": "user1@example.com",
      "name": "John Doe"
    },
    {
      "email": "user2@example.com", 
      "name": "Jane Smith"
    }
  ],
  "subject": "Bulk Email Subject",
  "htmlContent": "<h1>Bulk HTML Content</h1>",
  "textContent": "Bulk plain text version"
}
```

## Combined Notification Templates

### Send Rent Reminder
```http
POST /api/notifications/rent-reminder
```

**Request Body:**
```json
{
  "tenantName": "John Doe",
  "propertyName": "Apartment 101",
  "dueDate": "2024-01-05",
  "amount": 15000,
  "phoneNumber": "+254712345678",
  "tenantEmail": "john@example.com",
  "sendSMS": true,
  "sendEmail": true
}
```

### Send Payment Confirmation
```http
POST /api/notifications/payment-confirmation
```

**Request Body:**
```json
{
  "tenantName": "John Doe",
  "propertyName": "Apartment 101", 
  "amount": 15000,
  "paymentDate": "2024-01-01",
  "phoneNumber": "+254712345678",
  "tenantEmail": "john@example.com",
  "receiptUrl": "https://example.com/receipt.pdf",
  "sendSMS": true,
  "sendEmail": true
}
```

### Send Maintenance Update
```http
POST /api/notifications/maintenance-update
```

**Request Body:**
```json
{
  "tenantName": "John Doe",
  "propertyName": "Apartment 101",
  "status": "In Progress",
  "description": "Plumbing repair scheduled for tomorrow",
  "phoneNumber": "+254712345678",
  "tenantEmail": "john@example.com",
  "sendSMS": true,
  "sendEmail": true
}
```

### Send New Lease Notification
```http
POST /api/notifications/new-lease
```

**Request Body:**
```json
{
  "tenantName": "John Doe",
  "propertyName": "Apartment 101",
  "startDate": "2024-02-01",
  "phoneNumber": "+254712345678",
  "tenantEmail": "john@example.com",
  "leaseUrl": "https://example.com/lease.pdf",
  "sendSMS": true,
  "sendEmail": true
}
```

### Send Emergency Alert
```http
POST /api/notifications/emergency
```

**Request Body:**
```json
{
  "message": "Emergency: Water outage scheduled for tomorrow 10AM-2PM",
  "phoneNumbers": ["+254712345678", "+254723456789"],
  "emailAddresses": ["user1@example.com", "user2@example.com"]
}
```

## Notification History

### Get Notification History
```http
GET /api/notifications/history
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by type ("sms", "email")
- `status` (optional): Filter by status ("sent", "failed", "delivered")
- `startDate` (optional): Filter start date (YYYY-MM-DD)
- `endDate` (optional): Filter end date (YYYY-MM-DD)

**Example:**
```http
GET /api/notifications/history?type=sms&status=sent&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6789012345",
      "type": "sms",
      "recipient": "+254712345678",
      "message": "Your message here",
      "status": "sent",
      "messageId": "ATXid_1234567890",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "metadata": {
        "priority": "normal",
        "sentAt": "2024-01-01T10:00:00.000Z",
        "cost": 1.0
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## Environment Variables

### SMS Configuration (Africa's Talking)
```env
AFRICASTALKING_API_KEY=your_africastalking_api_key
AFRICASTALKING_USERNAME=your_africastalking_username
SMS_SENDER_ID=NYUMBA360
```

### Email Configuration
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### General Configuration
```env
FRONTEND_URL=http://localhost:3000
```

## Phone Number Formatting

The SMS service automatically formats phone numbers for Kenya:
- `0712345678` → `+254712345678`
- `254712345678` → `+254712345678`
- `712345678` → `+254712345678`
- `+1234567890` (US format) → `+1234567890`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing JWT)
- `500`: Internal Server Error

## Rate Limits

- SMS: 100 messages per minute per phone number
- Email: 50 emails per minute per recipient
- Bulk operations are queued and processed sequentially

## Webhooks (Future Enhancement)

The system can be extended to support webhooks for:
- SMS delivery status updates
- Email open/click tracking
- Bounce handling

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Send SMS
const sendSMS = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/notifications/sms', {
      phoneNumber: '+254712345678',
      message: 'Test message',
      priority: 'high'
    }, {
      headers: {
        'Authorization': 'Bearer ' + jwtToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('SMS sent:', response.data);
  } catch (error) {
    console.error('Error sending SMS:', error.response.data);
  }
};

// Send rent reminder
const sendRentReminder = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/notifications/rent-reminder', {
      tenantName: 'John Doe',
      propertyName: 'Apartment 101',
      dueDate: '2024-01-05',
      amount: 15000,
      phoneNumber: '+254712345678',
      tenantEmail: 'john@example.com'
    }, {
      headers: {
        'Authorization': 'Bearer ' + jwtToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Rent reminder sent:', response.data);
  } catch (error) {
    console.error('Error sending rent reminder:', error.response.data);
  }
};
```

### cURL Examples
```bash
# Send SMS
curl -X POST http://localhost:5001/api/notifications/sms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "message": "Test message",
    "priority": "high"
  }'

# Send rent reminder
curl -X POST http://localhost:5001/api/notifications/rent-reminder \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "John Doe",
    "propertyName": "Apartment 101",
    "dueDate": "2024-01-05",
    "amount": 15000,
    "phoneNumber": "+254712345678",
    "tenantEmail": "john@example.com"
  }'
```

## Database Schema

The Notification model stores all notification history:

```javascript
{
  type: String, // 'sms', 'email'
  recipient: String,
  subject: String, // email only
  message: String,
  status: String, // 'pending', 'sent', 'delivered', 'failed', 'bounced'
  messageId: String,
  error: String,
  sentBy: ObjectId, // user who sent it
  relatedEntity: {
    entityType: String, // 'property', 'tenant', 'payment', etc.
    entityId: ObjectId
  },
  metadata: {
    priority: String, // 'low', 'normal', 'high'
    scheduledFor: Date,
    sentAt: Date,
    deliveredAt: Date,
    cost: Number,
    retryCount: Number
  }
}
```

## Automated Notifications

The system provides automated notification methods that can be triggered by business logic:

```javascript
const notificationService = require('./src/services/notificationService');

// Automated rent reminder
await notificationService.sendRentReminder(tenant, property, dueDate, amount);

// Automated payment confirmation
await notificationService.sendPaymentConfirmation(tenant, property, payment);

// Automated maintenance update
await notificationService.sendMaintenanceUpdate(tenant, property, maintenanceRequest);
```

## Support

For technical support or questions about the notification API:
- Email: support@nyumba360.com
- Documentation: Available in this file
- Issues: Report via the project repository

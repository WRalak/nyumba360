# Nyumba360 Notification System Setup Guide

## Overview

This guide covers the complete setup and configuration of the Nyumba360 notification system, including SMS (Africa's Talking), Email (SMTP), automated scheduling, and API integration.

## Prerequisites

- Node.js 16+ 
- MongoDB database
- Africa's Talking account (for SMS)
- SMTP email service (Gmail, SendGrid, etc.)

## Quick Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Copy and update the `.env` file:
```bash
cp .env.example .env
```

### 3. Configure Environment Variables
Update your `.env` file with the following:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nyumba360

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Africa's Talking SMS Configuration
AFRICASTALKING_API_KEY=your_africastalking_api_key
AFRICASTALKING_USERNAME=your_africastalking_username
SMS_SENDER_ID=NYUMBA360

# Email Configuration (Gmail Example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

# Application Configuration
FRONTEND_URL=http://localhost:3000
PORT=5001
NODE_ENV=development
```

### 4. Start the Application
```bash
# Development
npm run dev

# Production
npm start
```

## Detailed Configuration

### Africa's Talking SMS Setup

1. **Create Africa's Talking Account**
   - Visit [africastalking.com](https://africastalking.com)
   - Sign up and verify your account
   - Add funds to your account

2. **Get API Credentials**
   - Go to Dashboard > API Settings
   - Note your API Key and Username

3. **Configure Sender ID**
   - Request a custom sender ID (e.g., "NYUMBA360")
   - Or use the default shared number

### Email Service Setup

#### Gmail Configuration
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to Google Account > Security
   - App passwords > Generate new app password
   - Use this password in `EMAIL_PASS`

#### Other SMTP Providers
```env
# SendGrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key

# Mailgun
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASS=your_mailgun_password
```

## API Usage Examples

### Basic SMS Notification
```javascript
const axios = require('axios');

const sendSMS = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/notifications/sms', {
      phoneNumber: '+254712345678',
      message: 'Your rent payment is due tomorrow',
      priority: 'high'
    }, {
      headers: {
        'Authorization': 'Bearer ' + yourJwtToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('SMS sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

### Rent Reminder Template
```javascript
const sendRentReminder = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/notifications/rent-reminder', {
      tenantName: 'John Doe',
      propertyName: 'Apartment 101',
      dueDate: '2024-01-05',
      amount: 15000,
      phoneNumber: '+254712345678',
      tenantEmail: 'john@example.com',
      sendSMS: true,
      sendEmail: true
    }, {
      headers: {
        'Authorization': 'Bearer ' + yourJwtToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Rent reminder sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

### Bulk Notifications
```javascript
const sendBulkSMS = async () => {
  try {
    const response = await axios.post('http://localhost:5001/api/notifications/sms/bulk', {
      phoneNumbers: ['+254712345678', '+254723456789'],
      message: 'Emergency: Water maintenance scheduled for tomorrow 10AM-2PM',
      priority: 'high'
    }, {
      headers: {
        'Authorization': 'Bearer ' + yourJwtToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Bulk SMS sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

## Automated Notifications

The system includes automated notifications that run on schedules:

### Rent Reminders
- **Schedule**: Daily at 9:00 AM
- **Triggers**: 7 days, 3 days, 1 day before due date
- **Overdue**: Every 3 days after due date

### Monthly Statements
- **Schedule**: 1st of every month at 9:00 AM
- **Recipients**: Property owners
- **Content**: Revenue, expenses, net income per property

### Failed Notification Retries
- **Schedule**: Every 15 minutes
- **Max Retries**: 3 attempts per notification
- **Backoff**: Exponential delay between retries

### System Cleanup
- **Schedule**: Every Sunday at 2:00 AM
- **Action**: Delete notifications older than 90 days

## Integration with Existing Code

### Payment Processing
```javascript
// In your payment processing logic
const notificationService = require('./src/services/notificationService');

async function processPayment(paymentData) {
  // Process payment...
  
  // Send confirmation
  await notificationService.sendPaymentConfirmation(
    tenant, 
    property, 
    paymentData
  );
}
```

### Maintenance Updates
```javascript
// In your maintenance update logic
async function updateMaintenanceStatus(requestId, newStatus) {
  // Update maintenance request...
  
  // Send notification
  await notificationService.sendMaintenanceUpdate(
    tenant,
    property,
    maintenanceRequest
  );
}
```

### New Tenant Registration
```javascript
// In your tenant registration logic
async function registerTenant(tenantData) {
  // Register tenant...
  
  // Send welcome email
  await notificationService.sendWelcomeEmail(
    user,
    loginUrl
  );
}
```

## Monitoring and Analytics

### Notification History
```javascript
// Get notification history
const response = await axios.get('http://localhost:5001/api/notifications/history', {
  headers: { 'Authorization': 'Bearer ' + yourJwtToken },
  params: {
    type: 'sms',
    status: 'sent',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }
});
```

### System Statistics
```javascript
const NotificationUtils = require('./src/utils/notificationUtils');

// Get notification summary
const summary = await NotificationUtils.generateNotificationSummary(
  '2024-01-01', 
  '2024-01-31'
);

console.log('Summary:', summary);
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run notification tests specifically
npm test -- --testNamePattern="Notification"

# Run with coverage
npm test -- --coverage
```

### Test SMS Configuration
```bash
# Test SMS service
curl -X POST http://localhost:5001/api/notifications/sms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "message": "Test message from Nyumba360"
  }'
```

### Test Email Configuration
```bash
# Test email service
curl -X POST http://localhost:5001/api/notifications/email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email from Nyumba360",
    "htmlContent": "<h1>Test Email</h1><p>This is a test email.</p>"
  }'
```

## Troubleshooting

### Common Issues

#### SMS Not Sending
1. Check Africa's Talking API credentials
2. Verify account balance
3. Validate phone number format (+254712345678)
4. Check sender ID approval status

#### Email Not Sending
1. Verify SMTP credentials
2. Check app password (for Gmail)
3. Ensure correct port (587 for TLS, 465 for SSL)
4. Check firewall settings

#### Scheduled Jobs Not Running
1. Verify server timezone (Africa/Nairobi)
2. Check if scheduler is started
3. Review logs for errors
4. Ensure process is running continuously

### Debug Mode
Enable debug logging:
```env
NODE_ENV=development
DEBUG=notifications:*
```

### Health Check
Monitor system health:
```bash
curl http://localhost:5001/health
```

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
NOTIFICATIONS_DISABLED=false
WEBHOOK_URL=https://yourdomain.com/webhooks/notifications
WEBHOOK_SECRET=your_webhook_secret
```

### Process Management
Use PM2 for production:
```bash
npm install -g pm2
pm2 start server.js --name nyumba360-api
pm2 startup
pm2 save
```

### Monitoring
Set up monitoring for:
- API response times
- Notification delivery rates
- Error rates
- System resource usage

## Security Considerations

### API Security
- Always use HTTPS in production
- Implement rate limiting
- Validate all input data
- Use JWT authentication

### Data Protection
- Never log sensitive information
- Encrypt stored credentials
- Implement user consent for notifications
- Follow GDPR/CCPA guidelines

### SMS Security
- Verify phone numbers before sending
- Implement opt-out mechanisms
- Monitor for abuse
- Set spending limits

## Best Practices

### Message Content
- Keep SMS messages under 160 characters
- Use clear, concise language
- Include company name in all messages
- Provide opt-out instructions

### Email Design
- Use responsive templates
- Include plain text version
- Optimize for mobile viewing
- Test across email clients

### Performance
- Use bulk operations for multiple recipients
- Implement queuing for high volume
- Cache frequently used data
- Monitor and optimize delivery times

### User Experience
- Allow users to choose notification preferences
- Provide clear notification history
- Enable easy opt-out/opt-in
- Send notifications at appropriate times

## Support

For technical support:
- Check the API documentation: `NOTIFICATION_API.md`
- Review error logs in the console
- Test with the provided examples
- Contact support at: support@nyumba360.com

## Updates and Maintenance

### Regular Tasks
- Monitor Africa's Talking account balance
- Update email templates as needed
- Review notification performance metrics
- Clean up old notifications (automated)

### Feature Updates
- New notification templates
- Additional channels (push notifications)
- Advanced scheduling options
- Enhanced analytics dashboard

The notification system is now fully configured and ready for use!

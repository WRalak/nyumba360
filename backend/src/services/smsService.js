const axios = require('axios');
require('dotenv').config();

class SMSService {
  constructor() {
    this.apiKey = process.env.AFRICASTALKING_API_KEY;
    this.username = process.env.AFRICASTALKING_USERNAME;
    this.senderId = process.env.SMS_SENDER_ID || 'NYUMBA360';
    this.baseUrl = 'https://api.africastalking.com/version1/messaging';
  }

  async sendSMS(phoneNumber, message, priority = 'normal') {
    try {
      if (!this.apiKey || !this.username) {
        throw new Error('Africa\'s Talking API credentials not configured');
      }

      // Format phone number (ensure it starts with +254 for Kenya)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const payload = {
        username: this.username,
        to: [formattedPhone],
        message: message,
        from: this.senderId,
        priority: priority
      };

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'apiKey': this.apiKey
      };

      const response = await axios.post(this.baseUrl, payload, { headers });

      return {
        success: true,
        messageId: response.data.SMSMessageData.Recipients[0].messageId,
        status: response.data.SMSMessageData.Recipients[0].status,
        cost: response.data.SMSMessageData.Recipients[0].cost
      };

    } catch (error) {
      console.error('SMS sending failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async sendBulkSMS(phoneNumbers, message, priority = 'normal') {
    try {
      const formattedPhones = phoneNumbers.map(phone => this.formatPhoneNumber(phone));
      
      const payload = {
        username: this.username,
        to: formattedPhones,
        message: message,
        from: this.senderId,
        priority: priority,
        bulkSMSMode: true
      };

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'apiKey': this.apiKey
      };

      const response = await axios.post(this.baseUrl, payload, { headers });

      return {
        success: true,
        recipients: response.data.SMSMessageData.Recipients
      };

    } catch (error) {
      console.error('Bulk SMS sending failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getDeliveryStatus(messageId) {
    try {
      const url = `https://api.africastalking.com/version1/messaging/status/${messageId}`;
      
      const headers = {
        'Accept': 'application/json',
        'apiKey': this.apiKey
      };

      const response = await axios.get(url, { headers });

      return {
        success: true,
        status: response.data.SMSMessageData.Recipients[0].status,
        deliveryStatus: response.data.SMSMessageData.Recipients[0].deliveryStatus
      };

    } catch (error) {
      console.error('Status check failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+254${cleaned.substring(1)}`;
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      return `+254${cleaned}`;
    } else if (cleaned.startsWith('1') && cleaned.length === 10) {
      // US number format
      return `+${cleaned}`;
    }
    
    return phoneNumber;
  }

  // Template methods for different notification types
  async sendRentReminder(tenantName, propertyName, dueDate, amount, phoneNumber) {
    const message = `Dear ${tenantName}, this is a reminder that your rent of KES ${amount} for ${propertyName} is due on ${dueDate}. Please pay on time to avoid late fees. Thank you - Nyumba360`;
    return this.sendSMS(phoneNumber, message, 'high');
  }

  async sendPaymentConfirmation(tenantName, propertyName, amount, paymentDate, phoneNumber) {
    const message = `Dear ${tenantName}, we have received your payment of KES ${amount} for ${propertyName} on ${paymentDate}. Thank you for your payment - Nyumba360`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendMaintenanceUpdate(tenantName, propertyName, status, phoneNumber) {
    const message = `Dear ${tenantName}, the maintenance request for ${propertyName} has been updated. Status: ${status}. We will notify you of any further updates - Nyumba360`;
    return this.sendSMS(phoneNumber, message);
  }

  async sendNewLeaseNotification(tenantName, propertyName, startDate, phoneNumber) {
    const message = `Congratulations ${tenantName}! Your lease for ${propertyName} has been approved. Start date: ${startDate}. Welcome to Nyumba360!`;
    return this.sendSMS(phoneNumber, message, 'high');
  }

  async sendEmergencyAlert(message, phoneNumbers) {
    return this.sendBulkSMS(phoneNumbers, message, 'high');
  }
}

module.exports = new SMSService();

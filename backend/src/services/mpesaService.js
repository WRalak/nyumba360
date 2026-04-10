const axios = require('axios');
const crypto = require('crypto');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.callbackUrl = process.env.MPESA_CALLBACK_URL;
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${auth}`
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('M-Pesa access token error:', error);
      throw new Error('Failed to get M-Pesa access token');
    }
  }

  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const accessToken = await this.getAccessToken();
      
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, -3);
      const password = crypto.createHash('sha256')
        .update(`${this.shortcode}${this.passkey}${timestamp}`)
        .digest('base64');

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('M-Pesa STK Push error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async queryTransactionStatus(checkoutRequestId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, -3);
      const password = crypto.createHash('sha256')
        .update(`${this.shortcode}${this.passkey}${timestamp}`)
        .digest('base64');

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('M-Pesa query error:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  processCallback(callbackData) {
    try {
      const { Body } = callbackData;
      const { stkCallback } = Body;
      
      const {
        MerchantRequestID,
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
        CallbackMetadata
      } = stkCallback;

      if (ResultCode === 0) {
        // Transaction successful
        const metadata = CallbackMetadata.Item;
        const amount = metadata.find(item => item.Name === 'Amount')?.Value;
        const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
        const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

        return {
          success: true,
          transactionData: {
            MerchantRequestID,
            CheckoutRequestID,
            amount,
            mpesaReceiptNumber,
            transactionDate,
            phoneNumber,
            ResultDesc
          }
        };
      } else {
        // Transaction failed
        return {
          success: false,
          error: ResultDesc,
          resultCode: ResultCode
        };
      }
    } catch (error) {
      console.error('M-Pesa callback processing error:', error);
      return {
        success: false,
        error: 'Failed to process callback'
      };
    }
  }

  validatePhoneNumber(phone) {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Convert to Kenyan format (254...)
    if (cleanPhone.startsWith('07')) {
      return '254' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('254')) {
      return cleanPhone;
    } else if (cleanPhone.startsWith('+254')) {
      return cleanPhone.substring(1);
    }
    
    throw new Error('Invalid Kenyan phone number format');
  }

  formatAmount(amount) {
    // Ensure amount is in the correct format (no decimals for M-Pesa)
    return Math.round(parseFloat(amount));
  }
}

module.exports = new MpesaService();

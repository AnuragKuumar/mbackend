const axios = require('axios');

class SMSService {
  constructor() {
    // You can use services like Twilio, TextLocal, MSG91, or Fast2SMS
    // For demo, I'll use a generic SMS API structure
    this.apiKey = process.env.SMS_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID || 'MOBIRE';
    this.baseUrl = process.env.SMS_API_URL || 'https://www.fast2sms.com/dev/bulkV2';
  }

  async sendSMS(phoneNumber, message) {
    try {
      // Remove +91 if present and ensure 10 digits
      const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanPhone.length !== 10) {
        throw new Error('Invalid phone number format');
      }

      console.log(`📱 Sending SMS to ${cleanPhone}: ${message}`);

      // For demo purposes, we'll just log the SMS
      // In production, uncomment and configure with your SMS provider
      
      /*
      const response = await axios.post(this.baseUrl, {
        authorization: this.apiKey,
        sender_id: this.senderId,
        message: message,
        numbers: cleanPhone,
        route: 'v3'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.return) {
        console.log('✅ SMS sent successfully');
        return { success: true, messageId: response.data.request_id };
      } else {
        throw new Error('SMS sending failed');
      }
      */

      // Demo mode - just log and return success
      console.log('✅ SMS sent successfully (Demo Mode)');
      return { 
        success: true, 
        messageId: `demo_${Date.now()}`,
        phone: cleanPhone,
        message: message
      };

    } catch (error) {
      console.error('❌ SMS sending failed:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Predefined message templates
  getStatusMessage(customerName, deviceModel, status, businessName = 'Mobile Repair') {
    const messages = {
      'accepted': `Hi ${customerName}, your ${deviceModel} repair request has been accepted by ${businessName}. We'll start working on it soon. Track: ${businessName}`,
      
      'in-progress': `Hi ${customerName}, good news! Your ${deviceModel} repair is now in progress at ${businessName}. Our technician is working on it. Track: ${businessName}`,
      
      'completed': `🎉 Great news ${customerName}! Your ${deviceModel} repair is completed at ${businessName}. Please visit us to collect your device. Contact: 7407926912`,
      
      'cancelled': `Hi ${customerName}, unfortunately your ${deviceModel} repair request has been cancelled. Please contact ${businessName} at 7407926912 for details.`
    };

    return messages[status] || `Hi ${customerName}, your ${deviceModel} repair status has been updated to ${status}. Contact: 7407926912`;
  }

  // Send booking status update SMS
  async sendBookingStatusUpdate(booking, newStatus) {
    const customerName = booking.customerDetails.name;
    const deviceModel = `${booking.deviceBrand} ${booking.deviceModel}`;
    const phoneNumber = booking.customerDetails.phone;
    
    const message = this.getStatusMessage(customerName, deviceModel, newStatus);
    
    return await this.sendSMS(phoneNumber, message);
  }

  // Send custom message
  async sendCustomMessage(phoneNumber, customerName, message) {
    const personalizedMessage = `Hi ${customerName}, ${message} - Mobile Repair (7407926912)`;
    return await this.sendSMS(phoneNumber, personalizedMessage);
  }
}

module.exports = new SMSService();
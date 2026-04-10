const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service configuration error:', error);
        } else {
          console.log('Email service is ready to send messages');
        }
      });
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null, attachments = []) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: `"Nyumba360" <${this.fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent),
        attachments: attachments
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendBulkEmail(recipients, subject, htmlContent, textContent = null) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendEmail(
        recipient.email,
        subject,
        this.personalizeContent(htmlContent, recipient.name),
        this.personalizeContent(textContent, recipient.name)
      );
      results.push({
        email: recipient.email,
        ...result
      });
    }

    return results;
  }

  personalizeContent(content, name) {
    if (!content) return content;
    return content.replace(/\{\{name\}\}/g, name || 'Valued Customer');
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  // Template methods for different email types
  async sendRentReminder(tenantEmail, tenantName, propertyName, dueDate, amount) {
    const subject = `Rent Reminder - ${propertyName}`;
    const html = this.getRentReminderTemplate(tenantName, propertyName, dueDate, amount);
    return this.sendEmail(tenantEmail, subject, html);
  }

  async sendPaymentConfirmation(tenantEmail, tenantName, propertyName, amount, paymentDate, receiptUrl = null) {
    const subject = `Payment Confirmation - ${propertyName}`;
    const html = this.getPaymentConfirmationTemplate(tenantName, propertyName, amount, paymentDate);
    const attachments = receiptUrl ? [{ filename: 'receipt.pdf', path: receiptUrl }] : [];
    return this.sendEmail(tenantEmail, subject, html, null, attachments);
  }

  async sendMaintenanceUpdate(tenantEmail, tenantName, propertyName, status, description) {
    const subject = `Maintenance Update - ${propertyName}`;
    const html = this.getMaintenanceUpdateTemplate(tenantName, propertyName, status, description);
    return this.sendEmail(tenantEmail, subject, html);
  }

  async sendNewLeaseNotification(tenantEmail, tenantName, propertyName, startDate, leaseUrl = null) {
    const subject = `Lease Approved - ${propertyName}`;
    const html = this.getNewLeaseTemplate(tenantName, propertyName, startDate);
    const attachments = leaseUrl ? [{ filename: 'lease-agreement.pdf', path: leaseUrl }] : [];
    return this.sendEmail(tenantEmail, subject, html, null, attachments);
  }

  async sendWelcomeEmail(userEmail, userName, loginUrl) {
    const subject = 'Welcome to Nyumba360!';
    const html = this.getWelcomeTemplate(userName, loginUrl);
    return this.sendEmail(userEmail, subject, html);
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const subject = 'Password Reset - Nyumba360';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = this.getPasswordResetTemplate(userName, resetUrl);
    return this.sendEmail(userEmail, subject, html);
  }

  async sendMonthlyStatement(propertyOwnerEmail, ownerName, properties, period) {
    const subject = `Monthly Statement - ${period}`;
    const html = this.getMonthlyStatementTemplate(ownerName, properties, period);
    return this.sendEmail(propertyOwnerEmail, subject, html);
  }

  // Email Templates
  getRentReminderTemplate(tenantName, propertyName, dueDate, amount) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rent Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .highlight { background: #e74c3c; color: white; padding: 10px; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyumba360</h1>
            <p>Rent Payment Reminder</p>
          </div>
          <div class="content">
            <h2>Dear ${tenantName},</h2>
            <p>This is a friendly reminder that your rent payment is due soon.</p>
            
            <div class="highlight">
              <strong>Property:</strong> ${propertyName}<br>
              <strong>Amount Due:</strong> KES ${amount.toLocaleString()}<br>
              <strong>Due Date:</strong> ${dueDate}
            </div>
            
            <p>Please ensure your payment is made on or before the due date to avoid late fees.</p>
            <a href="${process.env.FRONTEND_URL}/payments" class="btn">Pay Now</a>
            
            <p>If you have already made the payment, please disregard this reminder.</p>
            
            <p>Thank you for choosing Nyumba360 for your rental needs.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyumba360. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentConfirmationTemplate(tenantName, propertyName, amount, paymentDate) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 10px 0; border: 1px solid #c3e6cb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyumba360</h1>
            <p>Payment Confirmation</p>
          </div>
          <div class="content">
            <h2>Dear ${tenantName},</h2>
            
            <div class="success">
              <strong>✓ Payment Received Successfully!</strong>
            </div>
            
            <p>We are pleased to confirm that we have received your payment.</p>
            
            <p><strong>Payment Details:</strong></p>
            <ul>
              <li><strong>Property:</strong> ${propertyName}</li>
              <li><strong>Amount Paid:</strong> KES ${amount.toLocaleString()}</li>
              <li><strong>Payment Date:</strong> ${paymentDate}</li>
              <li><strong>Transaction ID:</strong> ${Date.now()}</li>
            </ul>
            
            <p>Thank you for your prompt payment. Your account has been updated accordingly.</p>
            
            <p>You can view your payment history and download receipts from your dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyumba360. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getMaintenanceUpdateTemplate(tenantName, propertyName, status, description) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Maintenance Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f39c12; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .status { background: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin: 10px 0; border: 1px solid #ffeaa7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyumba360</h1>
            <p>Maintenance Update</p>
          </div>
          <div class="content">
            <h2>Dear ${tenantName},</h2>
            
            <div class="status">
              <strong>Update:</strong> ${status}
            </div>
            
            <p>There is an update regarding your maintenance request for <strong>${propertyName}</strong>.</p>
            
            <p><strong>Details:</strong></p>
            <p>${description}</p>
            
            <p>We will continue to keep you informed of any further developments.</p>
            
            <p>If you have any questions or concerns, please contact our maintenance team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyumba360. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getNewLeaseTemplate(tenantName, propertyName, startDate) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lease Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8e44ad; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .congrats { background: #e8daef; color: #6c3483; padding: 15px; border-radius: 4px; margin: 10px 0; border: 1px solid #d7bde2; }
          .btn { display: inline-block; padding: 12px 24px; background: #8e44ad; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyumba360</h1>
            <p>Congratulations!</p>
          </div>
          <div class="content">
            <h2>Dear ${tenantName},</h2>
            
            <div class="congrats">
              <strong>🎉 Your Lease Application Has Been Approved!</strong>
            </div>
            
            <p>We are delighted to inform you that your lease application for <strong>${propertyName}</strong> has been approved.</p>
            
            <p><strong>Lease Details:</strong></p>
            <ul>
              <li><strong>Property:</strong> ${propertyName}</li>
              <li><strong>Start Date:</strong> ${startDate}</li>
              <li><strong>Status:</strong> Active</li>
            </ul>
            
            <p>Welcome to the Nyumba360 family! We are excited to have you as our tenant.</p>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Access Your Dashboard</a>
            
            <p>Please log in to your dashboard to review your lease agreement and complete any remaining documentation.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyumba360. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate(userName, loginUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Nyumba360</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3498db; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .welcome { background: #d6eaf8; color: #2874a6; padding: 15px; border-radius: 4px; margin: 10px 0; border: 1px solid #aed6f1; }
          .btn { display: inline-block; padding: 12px 24px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyumba360</h1>
            <p>Welcome!</p>
          </div>
          <div class="content">
            <h2>Dear ${userName},</h2>
            
            <div class="welcome">
              <strong>🏠 Welcome to Nyumba360!</strong>
            </div>
            
            <p>Thank you for joining Nyumba360, your trusted partner in property management.</p>
            
            <p>Your account has been successfully created, and you're now ready to:</p>
            <ul>
              <li>Browse available properties</li>
              <li>Submit rental applications</li>
              <li>Manage your lease agreements</li>
              <li>Make secure online payments</li>
              <li>Track maintenance requests</li>
            </ul>
            
            <a href="${loginUrl}" class="btn">Get Started</a>
            
            <p>If you have any questions, our support team is here to help you.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyumba360. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(userName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
          .alert { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin: 10px 0; border: 1px solid #f5c6cb; }
          .btn { display: inline-block; padding: 12px 24px; background: #e74c3c; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyumba360</h1>
            <p>Password Reset</p>
          </div>
          <div class="content">
            <h2>Dear ${userName},</h2>
            
            <div class="alert">
              <strong>Password Reset Request</strong>
            </div>
            
            <p>We received a request to reset your password for your Nyumba360 account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="btn">Reset Password</a>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire in 1 hour for security reasons</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
            
            <p>If you have any concerns about your account security, please contact our support team immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyumba360. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getMonthlyStatementTemplate(ownerName, properties, period) {
    const propertiesList = properties.map(prop => `
      <tr>
        <td>${prop.name}</td>
        <td>KES ${prop.revenue.toLocaleString()}</td>
        <td>KES ${prop.expenses.toLocaleString()}</td>
        <td>KES ${prop.netIncome.toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Monthly Statement</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { background: #34495e; color: white; padding: 15px; text-align: center; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #34495e; color: white; }
          .summary { background: #ecf0f1; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nyumba360</h1>
            <p>Monthly Statement</p>
          </div>
          <div class="content">
            <h2>Dear ${ownerName},</h2>
            
            <p>Please find your monthly property management statement for <strong>${period}</strong>.</p>
            
            <table>
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Net Income</th>
                </tr>
              </thead>
              <tbody>
                ${propertiesList}
              </tbody>
            </table>
            
            <div class="summary">
              <h3>Summary</h3>
              <p><strong>Total Revenue:</strong> KES ${properties.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}</p>
              <p><strong>Total Expenses:</strong> KES ${properties.reduce((sum, p) => sum + p.expenses, 0).toLocaleString()}</p>
              <p><strong>Total Net Income:</strong> KES ${properties.reduce((sum, p) => sum + p.netIncome, 0).toLocaleString()}</p>
            </div>
            
            <p>Detailed reports and individual property statements are available in your dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Nyumba360. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();

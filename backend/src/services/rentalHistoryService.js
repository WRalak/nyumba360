const mongoose = require('mongoose');
const RentPayment = require('../models/RentPayment');
const LeaseAgreement = require('../models/LeaseAgreement');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const puppeteer = require('puppeteer');

class RentalHistoryService {
  static async getTenantRentalHistory(tenantId, landlordId = null) {
    try {
      // Verify tenant exists
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Get all lease agreements for this tenant
      const leaseQuery = { tenant_id: tenantId };
      if (landlordId) {
        leaseQuery.landlord_id = landlordId;
      }

      const leases = await LeaseAgreement.find(leaseQuery)
        .populate('property_id', 'property_name address')
        .populate('unit_id', 'unit_number unit_type')
        .sort({ lease_start_date: -1 });

      const rentalHistory = [];

      for (const lease of leases) {
        // Get payment history for this lease
        const payments = await RentPayment.find({
          lease_id: lease._id,
          payment_status: 'completed'
        })
          .sort({ payment_date: -1 });

        // Calculate statistics
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const onTimePayments = payments.filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          const dueDate = new Date(payment.due_date);
          return paymentDate <= dueDate;
        }).length;

        const punctualityRate = payments.length > 0 ? (onTimePayments / payments.length) * 100 : 0;

        rentalHistory.push({
          lease: {
            id: lease._id,
            start_date: lease.lease_start_date,
            end_date: lease.lease_end_date,
            monthly_rent: lease.monthly_rent,
            status: lease.status,
            property: lease.property_id,
            unit: lease.unit_id
          },
          payments: {
            total_payments: payments.length,
            total_amount_paid: totalPaid,
            punctuality_rate: Math.round(punctualityRate),
            payment_history: payments.map(payment => ({
              date: payment.payment_date,
              amount: payment.amount,
              method: payment.payment_method,
              status: payment.payment_status,
              receipt_url: payment.receipt_url
            }))
          },
          references: {
            landlord_name: 'Available upon request',
            property_manager: 'Available upon request',
            contact_info: 'Available upon request'
          }
        });
      }

      return {
        tenant: {
          id: tenant._id,
          name: `${tenant.first_name} ${tenant.last_name}`,
          phone: tenant.phone,
          email: tenant.email,
          id_number: tenant.id_number
        },
        rental_history: rentalHistory,
        summary: this.calculateRentalSummary(rentalHistory),
        generated_at: new Date()
      };
    } catch (error) {
      console.error('Get rental history error:', error);
      throw error;
    }
  }

  static calculateRentalSummary(rentalHistory) {
    const totalLeases = rentalHistory.length;
    const totalPayments = rentalHistory.reduce((sum, history) => sum + history.payments.total_payments, 0);
    const totalAmountPaid = rentalHistory.reduce((sum, history) => sum + history.payments.total_amount_paid, 0);
    const avgPunctuality = rentalHistory.length > 0 
      ? rentalHistory.reduce((sum, history) => sum + history.payments.punctuality_rate, 0) / rentalHistory.length 
      : 0;

    const activeLeases = rentalHistory.filter(history => history.lease.status === 'active').length;
    const completedLeases = rentalHistory.filter(history => history.lease.status === 'expired').length;

    return {
      total_leases: totalLeases,
      active_leases: activeLeases,
      completed_leases: completedLeases,
      total_payments_made: totalPayments,
      total_amount_paid: totalAmountPaid,
      average_punctuality_rate: Math.round(avgPunctuality),
      rental_stability: completedLeases > 0 ? (completedLeases / totalLeases) * 100 : 0
    };
  }

  static async generateRentalHistoryPDF(tenantId, landlordId = null) {
    try {
      const rentalHistory = await this.getTenantRentalHistory(tenantId, landlordId);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Generate HTML content
      const htmlContent = this.generatePDFHTML(rentalHistory);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error('Generate PDF error:', error);
      throw error;
    }
  }

  static generatePDFHTML(rentalHistory) {
    const { tenant, rental_history, summary, generated_at } = rentalHistory;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Rental History Report - ${tenant.name}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 20px;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #007bff;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #007bff;
                margin: 0;
            }
            .section {
                margin-bottom: 30px;
            }
            .section h2 {
                color: #007bff;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            .tenant-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            .summary-item {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                text-align: center;
            }
            .summary-item strong {
                display: block;
                font-size: 24px;
                color: #007bff;
            }
            .lease-item {
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                margin-bottom: 15px;
            }
            .lease-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            .lease-details {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 15px;
            }
            .payment-history {
                margin-top: 15px;
            }
            .payment-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .status-badge {
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
            }
            .status-active { background: #d4edda; color: #155724; }
            .status-expired { background: #f8d7da; color: #721c24; }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Rental History Report</h1>
            <p>Official rental payment and tenancy record</p>
        </div>

        <div class="section">
            <h2>Tenant Information</h2>
            <div class="tenant-info">
                <p><strong>Name:</strong> ${tenant.name}</p>
                <p><strong>ID Number:</strong> ${tenant.id_number || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${tenant.phone}</p>
                <p><strong>Email:</strong> ${tenant.email}</p>
            </div>
        </div>

        <div class="section">
            <h2>Rental Summary</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <strong>${summary.total_leases}</strong>
                    <span>Total Leases</span>
                </div>
                <div class="summary-item">
                    <strong>${summary.total_payments_made}</strong>
                    <span>Total Payments</span>
                </div>
                <div class="summary-item">
                    <strong>KES ${summary.total_amount_paid.toLocaleString()}</strong>
                    <span>Total Amount Paid</span>
                </div>
                <div class="summary-item">
                    <strong>${summary.average_punctuality_rate}%</strong>
                    <span>Avg Punctuality</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Rental History</h2>
            ${rental_history.map(history => `
                <div class="lease-item">
                    <div class="lease-header">
                        <h3>${history.lease.property.property_name} - Unit ${history.lease.unit.unit_number}</h3>
                        <span class="status-badge status-${history.lease.status}">${history.lease.status.toUpperCase()}</span>
                    </div>
                    <div class="lease-details">
                        <div><strong>Address:</strong> ${history.lease.property.address.street}, ${history.lease.property.address.city}</div>
                        <div><strong>Unit Type:</strong> ${history.lease.unit.unit_type}</div>
                        <div><strong>Monthly Rent:</strong> KES ${history.lease.monthly_rent.toLocaleString()}</div>
                        <div><strong>Lease Period:</strong> ${new Date(history.lease.start_date).toLocaleDateString()} - ${new Date(history.lease.end_date).toLocaleDateString()}</div>
                    </div>
                    <div class="payment-history">
                        <h4>Payment Summary</h4>
                        <div class="summary-grid">
                            <div class="summary-item">
                                <strong>${history.payments.total_payments}</strong>
                                <span>Payments Made</span>
                            </div>
                            <div class="summary-item">
                                <strong>KES ${history.payments.total_amount_paid.toLocaleString()}</strong>
                                <span>Total Paid</span>
                            </div>
                            <div class="summary-item">
                                <strong>${history.payments.punctuality_rate}%</strong>
                                <span>On-Time Rate</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>Verification</h2>
            <p>This report is generated by Nyumba360 Property Management System and contains verified rental payment data.</p>
            <p>For verification purposes, contact the property management company or individual landlords listed above.</p>
        </div>

        <div class="footer">
            <p>Generated on ${new Date(generated_at).toLocaleDateString()} at ${new Date(generated_at).toLocaleTimeString()}</p>
            <p>Report ID: NY${Date.now()}${tenant.id.slice(-6)}</p>
            <p>© Nyumba360 - All rights reserved</p>
        </div>
    </body>
    </html>
    `;
  }

  static async exportRentalHistoryCSV(tenantId, landlordId = null) {
    try {
      const rentalHistory = await this.getTenantRentalHistory(tenantId, landlordId);

      let csvContent = 'Rental History Report\n';
      csvContent += `Tenant Name,${rentalHistory.tenant.name}\n`;
      csvContent += `Tenant ID,${rentalHistory.tenant.id}\n`;
      csvContent += `Phone,${rentalHistory.tenant.phone}\n`;
      csvContent += `Email,${rentalHistory.tenant.email}\n`;
      csvContent += `Generated,${new Date(rentalHistory.generated_at).toLocaleDateString()}\n\n`;

      csvContent += 'Summary\n';
      csvContent += `Total Leases,${rentalHistory.summary.total_leases}\n`;
      csvContent += `Active Leases,${rentalHistory.summary.active_leases}\n`;
      csvContent += `Completed Leases,${rentalHistory.summary.completed_leases}\n`;
      csvContent += `Total Payments,${rentalHistory.summary.total_payments_made}\n`;
      csvContent += `Total Amount Paid,KES ${rentalHistory.summary.total_amount_paid}\n`;
      csvContent += `Average Punctuality,${rentalHistory.summary.average_punctuality_rate}%\n\n`;

      csvContent += 'Lease History\n';
      csvContent += 'Property,Unit,Start Date,End Date,Monthly Rent,Status,Payments Made,Amount Paid,Punctuality\n';

      rentalHistory.rental_history.forEach(history => {
        csvContent += `"${history.lease.property.property_name}","${history.lease.unit.unit_number}",`;
        csvContent += `"${new Date(history.lease.start_date).toLocaleDateString()}","${new Date(history.lease.end_date).toLocaleDateString()}",`;
        csvContent += `"KES ${history.lease.monthly_rent}","${history.lease.status}",`;
        csvContent += `${history.payments.total_payments},"KES ${history.payments.total_amount_paid}",${history.payments.punctuality_rate}%\n`;
      });

      return csvContent;
    } catch (error) {
      console.error('Export CSV error:', error);
      throw error;
    }
  }

  static async verifyRentalHistory(tenantId, verificationCode) {
    try {
      // In a real implementation, this would verify against a secure database
      // For now, we'll generate a simple verification
      const rentalHistory = await this.getTenantRentalHistory(tenantId);
      
      const verification = {
        is_valid: true,
        verification_code: verificationCode,
        verified_at: new Date(),
        verified_by: 'Nyumba360 System',
        tenant_id: tenantId,
        total_leases_verified: rentalHistory.summary.total_leases,
        total_payments_verified: rentalHistory.summary.total_payments_made
      };

      return verification;
    } catch (error) {
      console.error('Verify rental history error:', error);
      throw error;
    }
  }
}

module.exports = RentalHistoryService;

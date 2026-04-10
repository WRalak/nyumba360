const RentalHistoryService = require('../services/rentalHistoryService');
const Tenant = require('../models/Tenant');

class RentalHistoryController {
  static async getRentalHistory(req, res) {
    try {
      const { tenant_id } = req.params;
      
      // Verify tenant exists and user has access
      const tenant = await Tenant.findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      // Check if user is the tenant, landlord, or has admin access
      const isTenant = req.user.userId === tenant_id;
      const isLandlord = req.user.role === 'landlord';
      const isAdmin = req.user.role === 'admin';

      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const rentalHistory = await RentalHistoryService.getTenantRentalHistory(
        tenant_id,
        isLandlord ? req.user.userId : null
      );

      res.json({
        rental_history: rentalHistory
      });
    } catch (error) {
      console.error('Get rental history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve rental history',
        details: error.message
      });
    }
  }

  static async downloadRentalHistoryPDF(req, res) {
    try {
      const { tenant_id } = req.params;
      
      // Verify tenant exists and user has access
      const tenant = await Tenant.findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      // Check permissions
      const isTenant = req.user.userId === tenant_id;
      const isLandlord = req.user.role === 'landlord';
      const isAdmin = req.user.role === 'admin';

      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const pdfBuffer = await RentalHistoryService.generateRentalHistoryPDF(
        tenant_id,
        isLandlord ? req.user.userId : null
      );

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rental_history_${tenant.first_name}_${tenant.last_name}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Download rental history PDF error:', error);
      res.status(500).json({
        error: 'Failed to generate rental history PDF',
        details: error.message
      });
    }
  }

  static async downloadRentalHistoryCSV(req, res) {
    try {
      const { tenant_id } = req.params;
      
      // Verify tenant exists and user has access
      const tenant = await Tenant.findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      // Check permissions
      const isTenant = req.user.userId === tenant_id;
      const isLandlord = req.user.role === 'landlord';
      const isAdmin = req.user.role === 'admin';

      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const csvContent = await RentalHistoryService.exportRentalHistoryCSV(
        tenant_id,
        isLandlord ? req.user.userId : null
      );

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="rental_history_${tenant.first_name}_${tenant.last_name}.csv"`);

      res.send(csvContent);
    } catch (error) {
      console.error('Download rental history CSV error:', error);
      res.status(500).json({
        error: 'Failed to export rental history CSV',
        details: error.message
      });
    }
  }

  static async verifyRentalHistory(req, res) {
    try {
      const { tenant_id } = req.params;
      const { verification_code } = req.body;

      if (!verification_code) {
        return res.status(400).json({
          error: 'Verification code is required'
        });
      }

      // Verify tenant exists
      const tenant = await Tenant.findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      const verification = await RentalHistoryService.verifyRentalHistory(
        tenant_id,
        verification_code
      );

      res.json({
        verification
      });
    } catch (error) {
      console.error('Verify rental history error:', error);
      res.status(500).json({
        error: 'Failed to verify rental history',
        details: error.message
      });
    }
  }

  static async getMyRentalHistory(req, res) {
    try {
      // Tenants can only get their own rental history
      const tenant_id = req.user.userId;
      
      const rentalHistory = await RentalHistoryService.getTenantRentalHistory(tenant_id);

      res.json({
        rental_history: rentalHistory
      });
    } catch (error) {
      console.error('Get my rental history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve your rental history',
        details: error.message
      });
    }
  }

  static async shareRentalHistory(req, res) {
    try {
      const { tenant_id } = req.params;
      const { recipient_email, message, include_pdf = false } = req.body;

      if (!recipient_email) {
        return res.status(400).json({
          error: 'Recipient email is required'
        });
      }

      // Verify tenant exists and user has access
      const tenant = await Tenant.findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      // Check permissions
      const isTenant = req.user.userId === tenant_id;
      const isLandlord = req.user.role === 'landlord';
      const isAdmin = req.user.role === 'admin';

      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Get rental history data
      const rentalHistory = await RentalHistoryService.getTenantRentalHistory(
        tenant_id,
        isLandlord ? req.user.userId : null
      );

      // Generate verification code
      const verificationCode = `NY${Date.now()}${tenant_id.slice(-6)}`;

      // In a real implementation, you would send an email here
      // For now, we'll just return the sharing information
      const shareInfo = {
        shared_with: recipient_email,
        shared_by: req.user.userId,
        shared_at: new Date(),
        verification_code: verificationCode,
        message: message || '',
        include_pdf: include_pdf,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      res.json({
        message: 'Rental history shared successfully',
        share_info
      });
    } catch (error) {
      console.error('Share rental history error:', error);
      res.status(500).json({
        error: 'Failed to share rental history',
        details: error.message
      });
    }
  }

  static async getRentalHistorySummary(req, res) {
    try {
      const { tenant_id } = req.params;
      
      // Verify tenant exists and user has access
      const tenant = await Tenant.findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      // Check permissions
      const isTenant = req.user.userId === tenant_id;
      const isLandlord = req.user.role === 'landlord';
      const isAdmin = req.user.role === 'admin';

      if (!isTenant && !isLandlord && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const rentalHistory = await RentalHistoryService.getTenantRentalHistory(
        tenant_id,
        isLandlord ? req.user.userId : null
      );

      // Return only the summary, not full history
      res.json({
        tenant_info: rentalHistory.tenant,
        summary: rentalHistory.summary,
        lease_count: rentalHistory.rental_history.length
      });
    } catch (error) {
      console.error('Get rental history summary error:', error);
      res.status(500).json({
        error: 'Failed to retrieve rental history summary',
        details: error.message
      });
    }
  }
}

module.exports = RentalHistoryController;

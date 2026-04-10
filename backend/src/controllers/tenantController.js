const { validationResult } = require('express-validator');
const Tenant = require('../models/Tenant');
const Unit = require('../models/Unit');
const Property = require('../models/Property');

class TenantController {
  static async createTenant(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const tenantData = req.body;
      const tenant = await Tenant.create(tenantData);

      res.status(201).json({
        message: 'Tenant created successfully',
        tenant
      });
    } catch (error) {
      console.error('Create tenant error:', error);
      res.status(500).json({
        error: 'Failed to create tenant',
        message: error.message
      });
    }
  }

  static async getTenants(req, res) {
    try {
      const { property_id, search } = req.query;
      let tenants;

      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
        tenants = await Tenant.findByProperty(property_id);
      } else if (search) {
        tenants = await Tenant.searchTenants(search, req.user.userId);
      } else {
        // Get all tenants for landlord's properties
        tenants = await Tenant.searchTenants('', req.user.userId);
      }

      res.json({
        message: 'Tenants retrieved successfully',
        tenants
      });
    } catch (error) {
      console.error('Get tenants error:', error);
      res.status(500).json({
        error: 'Failed to retrieve tenants',
        message: error.message
      });
    }
  }

  static async getTenant(req, res) {
    try {
      const { id } = req.params;
      const tenant = await Tenant.findById(id);

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      // Verify tenant belongs to landlord's property
      if (tenant.current_lease) {
        const property = await Property.findById(tenant.current_lease.property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied'
          });
        }
      }

      // Calculate arrears
      tenant.arrears = await Tenant.getRentArrears(id);

      res.json({
        message: 'Tenant retrieved successfully',
        tenant
      });
    } catch (error) {
      console.error('Get tenant error:', error);
      res.status(500).json({
        error: 'Failed to retrieve tenant',
        message: error.message
      });
    }
  }

  static async updateTenant(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const tenant = await Tenant.findById(id);

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      // Verify tenant belongs to landlord's property
      if (tenant.current_lease) {
        const property = await Property.findById(tenant.current_lease.property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied'
          });
        }
      }

      const updatedTenant = await Tenant.update(id, req.body);

      res.json({
        message: 'Tenant updated successfully',
        tenant: updatedTenant
      });
    } catch (error) {
      console.error('Update tenant error:', error);
      res.status(500).json({
        error: 'Failed to update tenant',
        message: error.message
      });
    }
  }

  static async getTenantStats(req, res) {
    try {
      const { property_id } = req.query;
      let stats;

      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
        stats = {
          totalTenants: await Tenant.getActiveTenantsCount(property_id),
          propertyId
        };
      } else {
        // Get stats for all landlord properties
        const properties = await Property.findByOwner(req.user.userId);
        let totalTenants = 0;
        
        for (const property of properties) {
          totalTenants += await Tenant.getActiveTenantsCount(property.id);
        }
        
        stats = {
          totalTenants,
          totalProperties: properties.length
        };
      }

      res.json({
        message: 'Tenant stats retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Get tenant stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve tenant stats',
        message: error.message
      });
    }
  }

  static async getPaymentHistory(req, res) {
    try {
      const { id } = req.params;
      const { limit = 12 } = req.query;
      
      const tenant = await Tenant.findById(id);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found'
        });
      }

      // Verify tenant belongs to landlord's property
      if (tenant.current_lease) {
        const property = await Property.findById(tenant.current_lease.property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied'
          });
        }
      }

      const paymentHistory = await Tenant.getPaymentHistory(id, parseInt(limit));

      res.json({
        message: 'Payment history retrieved successfully',
        paymentHistory
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        error: 'Failed to retrieve payment history',
        message: error.message
      });
    }
  }

  static async getArrearsReport(req, res) {
    try {
      const { property_id } = req.query;
      let arrearsReport;

      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
        arrearsReport = await RentPayment.getArrearsReport(property_id);
      } else {
        // Get arrears for all landlord properties
        const properties = await Property.findByOwner(req.user.userId);
        let allArrears = [];
        
        for (const property of properties) {
          const propertyArrears = await RentPayment.getArrearsReport(property.id);
          allArrears = allArrears.concat(propertyArrears);
        }
        
        arrearsReport = allArrears;
      }

      res.json({
        message: 'Arrears report retrieved successfully',
        arrears: arrearsReport
      });
    } catch (error) {
      console.error('Get arrears report error:', error);
      res.status(500).json({
        error: 'Failed to retrieve arrears report',
        message: error.message
      });
    }
  }
}

module.exports = TenantController;

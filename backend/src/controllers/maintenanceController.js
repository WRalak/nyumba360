const { validationResult } = require('express-validator');
const db = require('../config/database');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');

class MaintenanceController {
  static async createTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id, unit_id, tenant_id, title, description, priority = 'medium', images } = req.body;

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      // Verify tenant if provided
      if (tenant_id) {
        const tenant = await Tenant.findById(tenant_id);
        if (!tenant || !tenant.current_lease || tenant.current_lease.property_id !== property_id) {
          return res.status(400).json({
            error: 'Invalid tenant for this property'
          });
        }
      }

      const ticketData = {
        property_id,
        unit_id,
        tenant_id,
        title,
        description,
        priority,
        images: images || [],
        status: 'open'
      };

      const [ticket] = await db('maintenance_tickets')
        .insert(ticketData)
        .returning('*');

      res.status(201).json({
        message: 'Maintenance ticket created successfully',
        ticket
      });
    } catch (error) {
      console.error('Create maintenance ticket error:', error);
      res.status(500).json({
        error: 'Failed to create maintenance ticket',
        message: error.message
      });
    }
  }

  static async getTickets(req, res) {
    try {
      const { property_id, status, priority, tenant_id, limit = 50 } = req.query;
      let query = db('maintenance_tickets')
        .join('properties', 'maintenance_tickets.property_id', 'properties.id')
        .join('rental_units', 'maintenance_tickets.unit_id', 'rental_units.id')
        .leftJoin('tenants', 'maintenance_tickets.tenant_id', 'tenants.id')
        .select(
          'maintenance_tickets.*',
          'properties.name as property_name',
          'properties.address as property_address',
          'rental_units.unit_number',
          'rental_units.unit_type',
          'tenants.first_name',
          'tenants.last_name',
          'tenants.phone'
        )
        .where('properties.owner_id', req.user.userId)
        .orderBy('maintenance_tickets.created_at', 'desc')
        .limit(parseInt(limit));

      // Apply filters
      if (property_id) {
        query = query.where('maintenance_tickets.property_id', property_id);
      }
      if (status) {
        query = query.where('maintenance_tickets.status', status);
      }
      if (priority) {
        query = query.where('maintenance_tickets.priority', priority);
      }
      if (tenant_id) {
        query = query.where('maintenance_tickets.tenant_id', tenant_id);
      }

      const tickets = await query;

      res.json({
        message: 'Maintenance tickets retrieved successfully',
        tickets
      });
    } catch (error) {
      console.error('Get maintenance tickets error:', error);
      res.status(500).json({
        error: 'Failed to retrieve maintenance tickets',
        message: error.message
      });
    }
  }

  static async getTicket(req, res) {
    try {
      const { id } = req.params;
      
      const ticket = await db('maintenance_tickets')
        .join('properties', 'maintenance_tickets.property_id', 'properties.id')
        .join('rental_units', 'maintenance_tickets.unit_id', 'rental_units.id')
        .leftJoin('tenants', 'maintenance_tickets.tenant_id', 'tenants.id')
        .select(
          'maintenance_tickets.*',
          'properties.name as property_name',
          'properties.address as property_address',
          'rental_units.unit_number',
          'rental_units.unit_type',
          'tenants.first_name',
          'tenants.last_name',
          'tenants.phone'
        )
        .where({
          'maintenance_tickets.id': id,
          'properties.owner_id': req.user.userId
        })
        .first();

      if (!ticket) {
        return res.status(404).json({
          error: 'Maintenance ticket not found'
        });
      }

      res.json({
        message: 'Maintenance ticket retrieved successfully',
        ticket
      });
    } catch (error) {
      console.error('Get maintenance ticket error:', error);
      res.status(500).json({
        error: 'Failed to retrieve maintenance ticket',
        message: error.message
      });
    }
  }

  static async updateTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;

      // Verify ticket exists and belongs to landlord
      const existingTicket = await db('maintenance_tickets')
        .join('properties', 'maintenance_tickets.property_id', 'properties.id')
        .where({
          'maintenance_tickets.id': id,
          'properties.owner_id': req.user.userId
        })
        .first();

      if (!existingTicket) {
        return res.status(404).json({
          error: 'Maintenance ticket not found'
        });
      }

      // Add updated_at timestamp
      updates.updated_at = new Date();

      // If status is being changed to resolved, add resolved_at timestamp
      if (updates.status === 'resolved' && existingTicket.status !== 'resolved') {
        updates.resolved_at = new Date();
      }

      const [ticket] = await db('maintenance_tickets')
        .where({ id })
        .update(updates)
        .returning('*');

      res.json({
        message: 'Maintenance ticket updated successfully',
        ticket
      });
    } catch (error) {
      console.error('Update maintenance ticket error:', error);
      res.status(500).json({
        error: 'Failed to update maintenance ticket',
        message: error.message
      });
    }
  }

  static async deleteTicket(req, res) {
    try {
      const { id } = req.params;

      // Verify ticket exists and belongs to landlord
      const existingTicket = await db('maintenance_tickets')
        .join('properties', 'maintenance_tickets.property_id', 'properties.id')
        .where({
          'maintenance_tickets.id': id,
          'properties.owner_id': req.user.userId
        })
        .first();

      if (!existingTicket) {
        return res.status(404).json({
          error: 'Maintenance ticket not found'
        });
      }

      await db('maintenance_tickets')
        .where({ id })
        .del();

      res.json({
        message: 'Maintenance ticket deleted successfully'
      });
    } catch (error) {
      console.error('Delete maintenance ticket error:', error);
      res.status(500).json({
        error: 'Failed to delete maintenance ticket',
        message: error.message
      });
    }
  }

  static async getMaintenanceStats(req, res) {
    try {
      const { property_id } = req.query;
      let whereClause = { 'properties.owner_id': req.user.userId };

      if (property_id) {
        whereClause['maintenance_tickets.property_id'] = property_id;
      }

      const stats = await db('maintenance_tickets')
        .join('properties', 'maintenance_tickets.property_id', 'properties.id')
        .where(whereClause)
        .select(
          db.raw('COUNT(*) as total_tickets'),
          db.raw('COUNT(CASE WHEN status = \'open\' THEN 1 END) as open_tickets'),
          db.raw('COUNT(CASE WHEN status = \'in_progress\' THEN 1 END) as in_progress_tickets'),
          db.raw('COUNT(CASE WHEN status = \'resolved\' THEN 1 END) as resolved_tickets'),
          db.raw('COUNT(CASE WHEN priority = \'urgent\' THEN 1 END) as urgent_tickets'),
          db.raw('COUNT(CASE WHEN priority = \'high\' THEN 1 END) as high_tickets')
        )
        .first();

      // Calculate average resolution time
      const avgResolutionTime = await db('maintenance_tickets')
        .join('properties', 'maintenance_tickets.property_id', 'properties.id')
        .where({
          ...whereClause,
          'maintenance_tickets.status': 'resolved'
        })
        .whereNotNull('resolved_at')
        .select(
          db.raw('AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) as avg_days')
        )
        .first();

      res.json({
        message: 'Maintenance stats retrieved successfully',
        stats: {
          ...stats,
          avgResolutionDays: Math.round(avgResolutionTime?.avg_days || 0)
        }
      });
    } catch (error) {
      console.error('Get maintenance stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve maintenance stats',
        message: error.message
      });
    }
  }
}

module.exports = MaintenanceController;

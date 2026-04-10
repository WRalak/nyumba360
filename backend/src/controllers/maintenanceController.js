const { validationResult } = require('express-validator');
const MaintenanceTicket = require('../models/Maintenance');
const Property = require('../models/Property');
const Tenant = require('../models/Tenant');
const Unit = require('../models/Unit');

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

      const { 
        property_id, 
        unit_id, 
        tenant_id, 
        title, 
        description, 
        category, 
        priority = 'medium', 
        images,
        access_instructions,
        permission_to_enter,
        preferred_time,
        emergency_contact
      } = req.body;

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      // Verify unit
      const unit = await Unit.findById(unit_id);
      if (!unit || unit.property_id.toString() !== property_id) {
        return res.status(400).json({
          error: 'Unit not found or does not belong to this property'
        });
      }

      // Verify tenant if provided
      if (tenant_id) {
        const tenant = await Tenant.findById(tenant_id);
        if (!tenant) {
          return res.status(400).json({
            error: 'Tenant not found'
          });
        }
      }

      const ticketData = {
        property_id,
        unit_id,
        tenant_id,
        landlord_id: req.user.userId,
        title,
        description,
        category,
        priority,
        images: images || [],
        access_instructions,
        permission_to_enter: permission_to_enter || false,
        preferred_time,
        emergency_contact,
        status: 'open'
      };

      const ticket = new MaintenanceTicket(ticketData);
      await ticket.save();

      // Populate related data for response
      await ticket.populate([
        { path: 'property_id', select: 'property_name address' },
        { path: 'unit_id', select: 'unit_number unit_type' },
        { path: 'tenant_id', select: 'first_name last_name phone' }
      ]);

      res.status(201).json({
        message: 'Maintenance ticket created successfully',
        ticket
      });
    } catch (error) {
      console.error('Create maintenance ticket error:', error);
      res.status(500).json({
        error: 'Failed to create maintenance ticket',
        details: error.message
      });
    }
  }

  static async getTickets(req, res) {
    try {
      const {
        property_id,
        status,
        priority,
        tenant_id,
        category,
        page = 1,
        limit = 20,
        sort_by = 'requested_date',
        sort_order = 'desc'
      } = req.query;

      // Build query
      const query = { landlord_id: req.user.userId };

      if (property_id) query.property_id = property_id;
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (tenant_id) query.tenant_id = tenant_id;
      if (category) query.category = category;

      // Sort options
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'desc' ? -1 : 1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [tickets, total] = await Promise.all([
        MaintenanceTicket.find(query)
          .populate('property_id', 'property_name address')
          .populate('unit_id', 'unit_number unit_type')
          .populate('tenant_id', 'first_name last_name phone')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        MaintenanceTicket.countDocuments(query)
      ]);

      res.json({
        tickets,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_records: total,
          records_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get maintenance tickets error:', error);
      res.status(500).json({
        error: 'Failed to retrieve maintenance tickets',
        details: error.message
      });
    }
  }

  static async getTicket(req, res) {
    try {
      const { id } = req.params;

      const ticket = await MaintenanceTicket.findOne({
        _id: id,
        landlord_id: req.user.userId
      })
        .populate('property_id', 'property_name address')
        .populate('unit_id', 'unit_number unit_type')
        .populate('tenant_id', 'first_name last_name phone')
        .populate('assigned_to.name', 'first_name last_name');

      if (!ticket) {
        return res.status(404).json({
          error: 'Maintenance ticket not found'
        });
      }

      res.json({ ticket });
    } catch (error) {
      console.error('Get maintenance ticket error:', error);
      res.status(500).json({
        error: 'Failed to retrieve maintenance ticket',
        details: error.message
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
      const updateData = req.body;

      // Find ticket and verify ownership
      const ticket = await MaintenanceTicket.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!ticket) {
        return res.status(404).json({
          error: 'Maintenance ticket not found'
        });
      }

      // Update completion date if status changes to completed
      if (updateData.status === 'completed' && ticket.status !== 'completed') {
        updateData.completion_date = new Date();
      }

      // Update assigned date if being assigned
      if (updateData.assigned_to && !ticket.assigned_date) {
        updateData.assigned_date = new Date();
      }

      // Update numeric fields
      if (updateData.estimated_cost) {
        updateData.estimated_cost = parseFloat(updateData.estimated_cost);
      }
      if (updateData.actual_cost) {
        updateData.actual_cost = parseFloat(updateData.actual_cost);
      }

      const updatedTicket = await MaintenanceTicket.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('property_id', 'property_name address')
        .populate('unit_id', 'unit_number unit_type')
        .populate('tenant_id', 'first_name last_name phone');

      res.json({
        message: 'Maintenance ticket updated successfully',
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Update maintenance ticket error:', error);
      res.status(500).json({
        error: 'Failed to update maintenance ticket',
        details: error.message
      });
    }
  }

  static async deleteTicket(req, res) {
    try {
      const { id } = req.params;

      const ticket = await MaintenanceTicket.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!ticket) {
        return res.status(404).json({
          error: 'Maintenance ticket not found'
        });
      }

      await MaintenanceTicket.findByIdAndDelete(id);

      res.json({
        message: 'Maintenance ticket deleted successfully'
      });
    } catch (error) {
      console.error('Delete maintenance ticket error:', error);
      res.status(500).json({
        error: 'Failed to delete maintenance ticket',
        details: error.message
      });
    }
  }

  static async getMaintenanceStats(req, res) {
    try {
      const { property_id, start_date, end_date } = req.query;

      // Verify property ownership if property_id is provided
      if (property_id) {
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      const startDate = start_date ? new Date(start_date) : new Date(new Date().setMonth(new Date().getMonth() - 12));
      const endDate = end_date ? new Date(end_date) : new Date();

      const stats = await MaintenanceTicket.getMaintenanceStats(
        property_id,
        startDate,
        endDate
      );

      res.json({
        maintenance_stats: stats,
        period: {
          start_date: startDate,
          end_date: endDate
        }
      });
    } catch (error) {
      console.error('Get maintenance stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve maintenance stats',
        details: error.message
      });
    }
  }

  static async getMaintenanceTrends(req, res) {
    try {
      const { property_id, months = 12 } = req.query;

      // Verify property ownership if property_id is provided
      if (property_id) {
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      const trends = await MaintenanceTicket.getMaintenanceTrends(
        property_id,
        parseInt(months)
      );

      res.json({
        trends,
        months_analyzed: parseInt(months)
      });
    } catch (error) {
      console.error('Get maintenance trends error:', error);
      res.status(500).json({
        error: 'Failed to fetch maintenance trends',
        details: error.message
      });
    }
  }

  static async getCategoryBreakdown(req, res) {
    try {
      const { property_id, start_date, end_date } = req.query;

      // Verify property ownership if property_id is provided
      if (property_id) {
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      const startDate = start_date ? new Date(start_date) : new Date(new Date().setMonth(new Date().getMonth() - 12));
      const endDate = end_date ? new Date(end_date) : new Date();

      const breakdown = await MaintenanceTicket.getCategoryBreakdown(
        property_id,
        startDate,
        endDate
      );

      res.json({
        category_breakdown: breakdown,
        period: {
          start_date: startDate,
          end_date: endDate
        }
      });
    } catch (error) {
      console.error('Get category breakdown error:', error);
      res.status(500).json({
        error: 'Failed to fetch category breakdown',
        details: error.message
      });
    }
  }

  static async getVendorPerformance(req, res) {
    try {
      const { property_id } = req.query;

      // Verify property ownership if property_id is provided
      if (property_id) {
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
      }

      const performance = await MaintenanceTicket.getVendorPerformance(property_id);

      res.json({
        vendor_performance: performance
      });
    } catch (error) {
      console.error('Get vendor performance error:', error);
      res.status(500).json({
        error: 'Failed to fetch vendor performance',
        details: error.message
      });
    }
  }

  static async addNote(req, res) {
    try {
      const { id } = req.params;
      const { content, is_internal = false } = req.body;

      const ticket = await MaintenanceTicket.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!ticket) {
        return res.status(404).json({
          error: 'Maintenance ticket not found'
        });
      }

      const note = {
        content,
        added_by: req.user.userId,
        is_internal
      };

      const updatedTicket = await MaintenanceTicket.findByIdAndUpdate(
        id,
        { $push: { notes: note } },
        { new: true }
      ).populate('notes.added_by', 'first_name last_name');

      res.json({
        message: 'Note added successfully',
        note: updatedTicket.notes[updatedTicket.notes.length - 1]
      });
    } catch (error) {
      console.error('Add note error:', error);
      res.status(500).json({
        error: 'Failed to add note',
        details: error.message
      });
    }
  }
}

module.exports = MaintenanceController;

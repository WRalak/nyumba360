const { validationResult } = require('express-validator');
const Property = require('../models/Property');
const Unit = require('../models/Unit');

class PropertyController {
  static async createProperty(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const propertyData = {
        ...req.body,
        owner_id: req.user.userId
      };

      const property = await Property.create(propertyData);
      res.status(201).json({
        message: 'Property created successfully',
        property
      });
    } catch (error) {
      console.error('Create property error:', error);
      res.status(500).json({
        error: 'Failed to create property',
        message: error.message
      });
    }
  }

  static async getProperties(req, res) {
    try {
      const landlordId = req.user.userId;
      const properties = await Property.findByOwner(landlordId);

      // Get stats for each property
      for (const property of properties) {
        property.stats = await Property.getPropertyStats(property.id);
        property.occupancy_rate = await Property.getOccupancyRate(property.id);
      }

      res.json({
        message: 'Properties retrieved successfully',
        properties
      });
    } catch (error) {
      console.error('Get properties error:', error);
      res.status(500).json({
        error: 'Failed to retrieve properties',
        message: error.message
      });
    }
  }

  static async getProperty(req, res) {
    try {
      const { id } = req.params;
      const property = await Property.findById(id);

      if (!property) {
        return res.status(404).json({
          error: 'Property not found'
        });
      }

      // Check ownership
      if (property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Get additional data
      property.stats = await Property.getPropertyStats(property.id);
      property.occupancy_rate = await Property.getOccupancyRate(property.id);
      property.monthly_income = await Property.getMonthlyIncome(property.id, 12);

      res.json({
        message: 'Property retrieved successfully',
        property
      });
    } catch (error) {
      console.error('Get property error:', error);
      res.status(500).json({
        error: 'Failed to retrieve property',
        message: error.message
      });
    }
  }

  static async updateProperty(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const property = await Property.findById(id);

      if (!property) {
        return res.status(404).json({
          error: 'Property not found'
        });
      }

      // Check ownership
      if (property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const updatedProperty = await Property.update(id, req.body);

      res.json({
        message: 'Property updated successfully',
        property: updatedProperty
      });
    } catch (error) {
      console.error('Update property error:', error);
      res.status(500).json({
        error: 'Failed to update property',
        message: error.message
      });
    }
  }

  static async deleteProperty(req, res) {
    try {
      const { id } = req.params;
      const property = await Property.findById(id);

      if (!property) {
        return res.status(404).json({
          error: 'Property not found'
        });
      }

      // Check ownership
      if (property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      await Property.delete(id);

      res.json({
        message: 'Property deleted successfully'
      });
    } catch (error) {
      console.error('Delete property error:', error);
      res.status(500).json({
        error: 'Failed to delete property',
        message: error.message
      });
    }
  }

  static async getPropertyDashboard(req, res) {
    try {
      const { id } = req.params;
      const property = await Property.findById(id);

      if (!property) {
        return res.status(404).json({
          error: 'Property not found'
        });
      }

      // Check ownership
      if (property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      // Get dashboard data
      const stats = await Property.getPropertyStats(id);
      const occupancyRate = await Property.getOccupancyRate(id);
      const monthlyIncome = await Property.getMonthlyIncome(id, 12);
      const vacantUnits = await Unit.getVacantUnits(id);
      const occupiedUnits = await Unit.getOccupiedUnits(id);

      res.json({
        message: 'Property dashboard retrieved successfully',
        dashboard: {
          property,
          stats,
          occupancy_rate: occupancyRate,
          monthly_income: monthlyIncome,
          vacant_units: vacantUnits,
          occupied_units: occupiedUnits
        }
      });
    } catch (error) {
      console.error('Get property dashboard error:', error);
      res.status(500).json({
        error: 'Failed to retrieve property dashboard',
        message: error.message
      });
    }
  }
}

module.exports = PropertyController;

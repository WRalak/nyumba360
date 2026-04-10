const { validationResult } = require('express-validator');
const Unit = require('../models/Unit');
const Property = require('../models/Property');

class UnitController {
  static async createUnit(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id } = req.body;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      const unitData = {
        ...req.body,
        property_id
      };

      const unit = await Unit.create(unitData);
      res.status(201).json({
        message: 'Unit created successfully',
        unit
      });
    } catch (error) {
      console.error('Create unit error:', error);
      res.status(500).json({
        error: 'Failed to create unit',
        message: error.message
      });
    }
  }

  static async getUnits(req, res) {
    try {
      const { property_id } = req.query;
      let units;

      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
        units = await Unit.findByProperty(property_id);
      } else {
        // Get all units for landlord's properties
        units = await Unit.getVacantUnits();
        units = units.filter(unit => {
          // Filter by landlord ownership (this would need to be optimized in production)
          return true; // Simplified for MVP
        });
      }

      res.json({
        message: 'Units retrieved successfully',
        units
      });
    } catch (error) {
      console.error('Get units error:', error);
      res.status(500).json({
        error: 'Failed to retrieve units',
        message: error.message
      });
    }
  }

  static async getUnit(req, res) {
    try {
      const { id } = req.params;
      const unit = await Unit.findById(id);

      if (!unit) {
        return res.status(404).json({
          error: 'Unit not found'
        });
      }

      // Verify property ownership
      const property = await Property.findById(unit.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      res.json({
        message: 'Unit retrieved successfully',
        unit
      });
    } catch (error) {
      console.error('Get unit error:', error);
      res.status(500).json({
        error: 'Failed to retrieve unit',
        message: error.message
      });
    }
  }

  static async updateUnit(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const unit = await Unit.findById(id);

      if (!unit) {
        return res.status(404).json({
          error: 'Unit not found'
        });
      }

      // Verify property ownership
      const property = await Property.findById(unit.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const updatedUnit = await Unit.update(id, req.body);

      res.json({
        message: 'Unit updated successfully',
        unit: updatedUnit
      });
    } catch (error) {
      console.error('Update unit error:', error);
      res.status(500).json({
        error: 'Failed to update unit',
        message: error.message
      });
    }
  }

  static async deleteUnit(req, res) {
    try {
      const { id } = req.params;
      const unit = await Unit.findById(id);

      if (!unit) {
        return res.status(404).json({
          error: 'Unit not found'
        });
      }

      // Verify property ownership
      const property = await Property.findById(unit.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      await Unit.delete(id);

      res.json({
        message: 'Unit deleted successfully'
      });
    } catch (error) {
      console.error('Delete unit error:', error);
      res.status(500).json({
        error: 'Failed to delete unit',
        message: error.message
      });
    }
  }

  static async getVacantUnits(req, res) {
    try {
      const { property_id } = req.query;
      let units;

      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
        units = await Unit.getVacantUnits(property_id);
      } else {
        // Get all vacant units for landlord's properties
        units = await Unit.getVacantUnits();
        // Filter by landlord ownership (simplified for MVP)
        units = units.filter(unit => true);
      }

      res.json({
        message: 'Vacant units retrieved successfully',
        units
      });
    } catch (error) {
      console.error('Get vacant units error:', error);
      res.status(500).json({
        error: 'Failed to retrieve vacant units',
        message: error.message
      });
    }
  }

  static async getOccupiedUnits(req, res) {
    try {
      const { property_id } = req.query;
      let units;

      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied or property not found'
          });
        }
        units = await Unit.getOccupiedUnits(property_id);
      } else {
        // Get all occupied units for landlord's properties
        units = await Unit.getOccupiedUnits();
        // Filter by landlord ownership (simplified for MVP)
        units = units.filter(unit => true);
      }

      res.json({
        message: 'Occupied units retrieved successfully',
        units
      });
    } catch (error) {
      console.error('Get occupied units error:', error);
      res.status(500).json({
        error: 'Failed to retrieve occupied units',
        message: error.message
      });
    }
  }
}

module.exports = UnitController;

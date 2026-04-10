const { validationResult } = require('express-validator');
const MapService = require('../services/mapService');
const Property = require('../models/Property');

class MapController {
  static async getPropertyLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id } = req.params;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const location = await MapService.getPropertyLocation(property_id);
      
      res.json({
        message: 'Property location retrieved successfully',
        location
      });
    } catch (error) {
      console.error('Get property location error:', error);
      res.status(500).json({
        error: 'Failed to retrieve property location',
        message: error.message
      });
    }
  }

  static async getAllPropertiesMap(req, res) {
    try {
      const properties = await MapService.getAllPropertiesMap();
      
      res.json({
        message: 'Properties map retrieved successfully',
        properties
      });
    } catch (error) {
      console.error('Get all properties map error:', error);
      res.status(500).json({
        error: 'Failed to retrieve properties map',
        message: error.message
      });
    }
  }

  static async getNearbyProperties(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { latitude, longitude, radius = 5 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          error: 'Latitude and longitude are required'
        });
      }

      const nearbyProperties = await MapService.getNearbyProperties(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius)
      );
      
      res.json({
        message: 'Nearby properties retrieved successfully',
        properties: nearbyProperties
      });
    } catch (error) {
      console.error('Get nearby properties error:', error);
      res.status(500).json({
        error: 'Failed to retrieve nearby properties',
        message: error.message
      });
    }
  }

  static async updatePropertyLocation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id } = req.params;
      const { latitude, longitude } = req.body;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const result = await MapService.updatePropertyLocation(property_id, latitude, longitude);
      
      if (result.success) {
        res.json({
          message: 'Property location updated successfully'
        });
      } else {
        res.status(500).json({
          error: 'Failed to update property location',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Update property location error:', error);
      res.status(500).json({
        error: 'Failed to update property location',
        message: error.message
      });
    }
  }

  static async getPropertiesByCounty(req, res) {
    try {
      const { county } = req.query;
      
      if (!county) {
        return res.status(400).json({
          error: 'County is required'
        });
      }

      const properties = await MapService.getPropertiesByCounty(county);
      
      res.json({
        message: 'Properties by county retrieved successfully',
        properties
      });
    } catch (error) {
      console.error('Get properties by county error:', error);
      res.status(500).json({
        error: 'Failed to retrieve properties by county',
        message: error.message
      });
    }
  }

  static async getPropertyClusters(req, res) {
    try {
      const clusters = await MapService.getPropertyClusters();
      
      res.json({
        message: 'Property clusters retrieved successfully',
        clusters
      });
    } catch (error) {
      console.error('Get property clusters error:', error);
      res.status(500).json({
        error: 'Failed to retrieve property clusters',
        message: error.message
      });
    }
  }

  static async geocodeAddress(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { address, county } = req.body;
      
      if (!address) {
        return res.status(400).json({
          error: 'Address is required'
        });
      }

      const location = await MapService.geocodeAddress(address, county);
      
      res.json({
        message: 'Address geocoded successfully',
        location
      });
    } catch (error) {
      console.error('Geocode address error:', error);
      res.status(500).json({
        error: 'Failed to geocode address',
        message: error.message
      });
    }
  }
}

module.exports = MapController;

const { validationResult } = require('express-validator');
const MediaService = require('../services/mediaService');
const Property = require('../models/Property');
const Unit = require('../models/Unit');

class MediaController {
  static async uploadPropertyImage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id } = req.params;
      const { description } = req.body;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided'
        });
      }

      const result = await MediaService.uploadPropertyImage(property_id, req.file, description);
      
      res.status(201).json({
        message: 'Property image uploaded successfully',
        ...result
      });
    } catch (error) {
      console.error('Upload property image error:', error);
      res.status(500).json({
        error: 'Failed to upload property image',
        message: error.message
      });
    }
  }

  static async uploadUnitImage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { unit_id } = req.params;
      const { description } = req.body;
      
      // Verify unit ownership
      const unit = await Unit.findById(unit_id);
      if (!unit) {
        return res.status(404).json({
          error: 'Unit not found'
        });
      }

      const property = await Property.findById(unit.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided'
        });
      }

      const result = await MediaService.uploadUnitImage(unit_id, req.file, description);
      
      res.status(201).json({
        message: 'Unit image uploaded successfully',
        ...result
      });
    } catch (error) {
      console.error('Upload unit image error:', error);
      res.status(500).json({
        error: 'Failed to upload unit image',
        message: error.message
      });
    }
  }

  static async getPropertyImages(req, res) {
    try {
      const { property_id } = req.params;
      
      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const images = await MediaService.getPropertyImages(property_id);
      
      res.json({
        message: 'Property images retrieved successfully',
        images
      });
    } catch (error) {
      console.error('Get property images error:', error);
      res.status(500).json({
        error: 'Failed to retrieve property images',
        message: error.message
      });
    }
  }

  static async getUnitImages(req, res) {
    try {
      const { unit_id } = req.params;
      
      // Verify unit ownership
      const unit = await Unit.findById(unit_id);
      if (!unit) {
        return res.status(404).json({
          error: 'Unit not found'
        });
      }

      const property = await Property.findById(unit.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const images = await MediaService.getUnitImages(unit_id);
      
      res.json({
        message: 'Unit images retrieved successfully',
        images
      });
    } catch (error) {
      console.error('Get unit images error:', error);
      res.status(500).json({
        error: 'Failed to retrieve unit images',
        message: error.message
      });
    }
  }

  static async setPrimaryImage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { media_id, type = req.body;
      
      // Verify ownership of the associated property/unit
      let media;
      if (type === 'property') {
        media = await db('property_media')
          .join('properties', 'property_media.property_id', 'properties.id')
          .where({
            'property_media.id': media_id,
            'properties.owner_id': req.user.userId
          })
          .first();
      } else {
        media = await db('unit_media')
          .join('rental_units', 'unit_media.unit_id', 'rental_units.id')
          .join('properties', 'rental_units.property_id', 'properties.id')
          .where({
            'unit_media.id': media_id,
            'properties.owner_id': req.user.userId
          })
          .first();
      }

      if (!media) {
        return res.status(404).json({
          error: 'Media not found or access denied'
        });
      }

      const result = await MediaService.setPrimaryImage(media_id, type);
      
      res.json({
        message: 'Primary image set successfully',
        ...result
      });
    } catch (error) {
      console.error('Set primary image error:', error);
      res.status(500).json({
        error: 'Failed to set primary image',
        message: error.message
      });
    }
  }

  static async deleteMedia(req, res) {
    try {
      const { media_id, type } = req.params;
      
      // Verify ownership of the associated property/unit
      let media;
      if (type === 'property') {
        media = await db('property_media')
          .join('properties', 'property_media.property_id', 'properties.id')
          .where({
            'property_media.id': media_id,
            'properties.owner_id': req.user.userId
          })
          .first();
      } else {
        media = await db('unit_media')
          .join('rental_units', 'unit_media.unit_id', 'rental_units.id')
          .join('properties', 'rental_units.property_id', 'properties.id')
          .where({
            'unit_media.id': media_id,
            'properties.owner_id': req.user.userId
          })
          .first();
      }

      if (!media) {
        return res.status(404).json({
          error: 'Media not found or access denied'
        });
      }

      const result = await MediaService.deleteMedia(media_id, type);
      
      res.json({
        message: 'Media deleted successfully',
        ...result
      });
    } catch (error) {
      console.error('Delete media error:', error);
      res.status(500).json({
        error: 'Failed to delete media',
        message: error.message
      });
    }
  }

  static async uploadVacancyImage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { vacancy_id } = req.params;
      const { description } = req.body;
      
      // Verify vacancy ownership through property
      const vacancy = await db('vacancy_listings')
        .join('properties', 'vacancy_listings.property_id', 'properties.id')
        .where({
          'vacancy_listings.id': vacancy_id,
          'properties.owner_id': req.user.userId
        })
        .first();

      if (!vacancy) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided'
        });
      }

      const result = await MediaService.uploadVacancyImage(vacancy_id, req.file, description);
      
      res.status(201).json({
        message: 'Vacancy image uploaded successfully',
        ...result
      });
    } catch (error) {
      console.error('Upload vacancy image error:', error);
      res.status(500).json({
        error: 'Failed to upload vacancy image',
        message: error.message
      });
    }
  }

  static async getVacancyImages(req, res) {
    try {
      const { vacancy_id } = req.params;
      
      // Verify vacancy ownership through property
      const vacancy = await db('vacancy_listings')
        .join('properties', 'vacancy_listings.property_id', 'properties.id')
        .where({
          'vacancy_listings.id': vacancy_id,
          'properties.owner_id': req.user.userId
        })
        .first();

      if (!vacancy) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const images = await MediaService.getVacancyImages(vacancy_id);
      
      res.json({
        message: 'Vacancy images retrieved successfully',
        images
      });
    } catch (error) {
      console.error('Get vacancy images error:', error);
      res.status(500).json({
        error: 'Failed to retrieve vacancy images',
        message: error.message
      });
    }
  }

  static async getMediaStats(req, res) {
    try {
      const { property_id } = req.query;
      
      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied'
          });
        }
      }

      const stats = await MediaService.getMediaStats(property_id);
      
      res.json({
        message: 'Media stats retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Get media stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve media stats',
        message: error.message
      });
    }
  }
}

module.exports = MediaController;

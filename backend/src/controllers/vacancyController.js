const { validationResult } = require('express-validator');
const db = require('../config/database');
const Property = require('../models/Property');
const Unit = require('../models/Unit');

class VacancyController {
  static async createListing(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { property_id, unit_id, title, description, monthly_rent, security_deposit, available_date, is_featured, images, contact_info } = req.body;

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      // Verify unit exists and is vacant
      const unit = await Unit.findById(unit_id);
      if (!unit || unit.property_id !== property_id) {
        return res.status(400).json({
          error: 'Unit not found or does not belong to this property'
        });
      }

      if (!unit.is_vacant) {
        return res.status(400).json({
          error: 'Unit is not available for listing'
        });
      }

      const listingData = {
        property_id,
        unit_id,
        title,
        description,
        monthly_rent: parseFloat(monthly_rent),
        security_deposit: security_deposit ? parseFloat(security_deposit) : null,
        available_date: available_date || new Date().toISOString().split('T')[0],
        is_featured: is_featured || false,
        is_active: true,
        images: images || [],
        contact_info: contact_info || {},
        created_by: req.user.userId
      };

      const [listing] = await db('vacancy_listings')
        .insert(listingData)
        .returning('*');

      res.status(201).json({
        message: 'Vacancy listing created successfully',
        listing
      });
    } catch (error) {
      console.error('Create vacancy listing error:', error);
      res.status(500).json({
        error: 'Failed to create vacancy listing',
        message: error.message
      });
    }
  }

  static async getListings(req, res) {
    try {
      const { search, property_id, featured, limit = 50 } = req.query;
      let query = db('vacancy_listings')
        .join('properties', 'vacancy_listings.property_id', 'properties.id')
        .join('rental_units', 'vacancy_listings.unit_id', 'rental_units.id')
        .select(
          'vacancy_listings.*',
          'properties.name as property_name',
          'properties.address as property_address',
          'rental_units.unit_number',
          'rental_units.unit_type',
          'properties.county'
        )
        .where({ 'vacancy_listings.is_active': true })
        .orderBy('vacancy_listings.created_at', 'desc');

      // Apply filters
      if (property_id) {
        query = query.where('vacancy_listings.property_id', property_id);
      }

      if (featured !== undefined) {
        query = query.where('vacancy_listings.is_featured', featured === 'true');
      }

      if (search) {
        query = query.where(function() {
          this.where('vacancy_listings.title', 'ILIKE', `%${search}%`)
              .orWhere('vacancy_listings.description', 'ILIKE', `%${search}%`)
              .orWhere('properties.name', 'ILIKE', `%${search}%`);
        });
      }

      // Get total count for pagination
      const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
      const [{ total }] = await countQuery;

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const listings = await query;

      res.json({
        message: 'Vacancy listings retrieved successfully',
        listings,
        pagination: {
          page: 1,
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get vacancy listings error:', error);
      res.status(500).json({
        error: 'Failed to retrieve vacancy listings',
        message: error.message
      });
    }
  }

  static async getListing(req, res) {
    try {
      const { id } = req.params;
      
      const listing = await db('vacancy_listings')
        .join('properties', 'vacancy_listings.property_id', 'properties.id')
        .join('rental_units', 'vacancy_listings.unit_id', 'rental_units.id')
        .select(
          'vacancy_listings.*',
          'properties.name as property_name',
          'properties.address as property_address',
          'properties.county',
          'rental_units.unit_number',
          'rental_units.unit_type',
          'rental_units.monthly_rent',
          'rental_units.security_deposit',
          'rental_units.size_sqm',
          'rental_units.floor_number'
        )
        .where({ 'vacancy_listings.id': id })
        .first();

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      // Verify property ownership
      const property = await Property.findById(listing.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      res.json({
        message: 'Vacancy listing retrieved successfully',
        listing
      });
    } catch (error) {
      console.error('Get vacancy listing error:', error);
      res.status(500).({
        error: 'Failed to retrieve vacancy listing',
        message: error.message
      });
    }
  }

  static async updateListing(req, res) {
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

      const listing = await db('vacancy_listings')
        .where({ id })
        .first();

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      // Verify property ownership
      const property = await Property.findById(listing.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const updatedListing = await db('vacancy_listings')
        .where({ id })
        .update({
          ...updates,
          updated_at: new Date()
        })
        .returning('*');

      res.json({
        message: 'Vacancy listing updated successfully',
        listing: updatedListing
      });
    } catch (error) {
      console.error('Update vacancy listing error:', error);
      res.status(500).json({
        error: 'Failed to update vacancy listing',
        message: error.message
      });
    }
  }

  static async deleteListing(req, res) {
    try {
      const { id } = req.params;

      const listing = await db('vacancy_listings')
        .where({ id })
        .first();

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      // Verify property ownership
      const property = await Property.findById(listing.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      await db('vacancy_listings')
        .where({ id })
        .update({
          is_active: false,
          updated_at: new Date()
        });

      res.json({
        message: 'Vacancy listing deleted successfully'
      });
    } catch (error) {
      console.error('Delete vacancy listing error:', error);
      res.status(500).json({
        error: 'Failed to delete vacancy listing',
        message: error.message
      });
    }
  }

  static async toggleFeatured(req, res) {
    try {
      const { id } = req.params;
      const { is_featured } = req.body;

      const listing = await db('vacancy_listings')
        .where({ id })
        .first();

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      // Verify property ownership
      const property = await Property.findById(listing.property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      const [updatedListing] = await db('vacancy_listings')
        .where({ id })
        .update({
          is_featured,
          updated_at: new Date()
        })
        .returning('*');

      res.json({
        message: `Listing ${is_featured ? 'featured' : 'unfeatured'} successfully`,
        listing: updatedListing
      });
    } catch (error) {
      console.error('Toggle featured error:', error);
      res.status(500).json({
        error: 'Failed to toggle featured status',
        message: error.message
      });
    }
  }

  static async getVacancyStats(req, res) {
    try {
      const { property_id } = req.query;
      
      let whereClause = { 'vacancy_listings.is_active': true };
      
      if (property_id) {
        // Verify property ownership
        const property = await Property.findById(property_id);
        if (!property || property.owner_id !== req.user.userId) {
          return res.status(403).json({
            error: 'Access denied'
          });
        }
        whereClause['vacancy_listings.property_id'] = property_id;
      }

      const stats = await db('vacancy_listings')
        .where(whereClause)
        .select(
          db.raw('COUNT(*) as total_listings'),
          db.raw('COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_listings'),
          db.raw('SUM(monthly_rent) as total_potential_rent')
        )
        .first();

      res.json({
        message: 'Vacancy stats retrieved successfully',
        stats
      });
    } catch (error) {
      console.error('Get vacancy stats error:', error);
      res.status(500).json({
        error: 'Failed to retrieve vacancy stats',
        message: error.message
      });
    }
  }
}

module.exports = VacancyController;

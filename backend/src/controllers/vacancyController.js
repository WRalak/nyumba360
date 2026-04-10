const { validationResult } = require('express-validator');
const VacancyListing = require('../models/Vacancy');
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

      const {
        property_id,
        unit_id,
        title,
        description,
        monthly_rent,
        security_deposit,
        available_date,
        amenities,
        images,
        contact_info,
        lease_terms,
        utilities,
        parking,
        pet_policy,
        requirements,
        location_highlights,
        show_address = true,
        tags
      } = req.body;

      // Verify property ownership
      const property = await Property.findById(property_id);
      if (!property || property.owner_id !== req.user.userId) {
        return res.status(403).json({
          error: 'Access denied or property not found'
        });
      }

      // Verify unit exists and is vacant
      const unit = await Unit.findById(unit_id);
      if (!unit || unit.property_id.toString() !== property_id) {
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
        landlord_id: req.user.userId,
        title,
        description,
        monthly_rent: parseFloat(monthly_rent),
        security_deposit: security_deposit ? parseFloat(security_deposit) : null,
        available_date: available_date ? new Date(available_date) : new Date(),
        amenities: amenities || [],
        images: images || [],
        contact_info: contact_info || {
          name: req.user.firstName + ' ' + req.user.lastName,
          phone: req.user.phone,
          email: req.user.email
        },
        lease_terms: lease_terms || {},
        utilities: utilities || {},
        parking: parking || {},
        pet_policy: pet_policy || {},
        requirements: requirements || {},
        location_highlights: location_highlights || [],
        show_address,
        exact_address: show_address ? property.address : null,
        tags: tags || [],
        status: 'draft'
      };

      // Set featured status
      if (listingData.is_featured) {
        listingData.featured_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }

      const listing = new VacancyListing(listingData);
      await listing.save();

      // Populate related data for response
      await listing.populate([
        { path: 'property_id', select: 'property_name address' },
        { path: 'unit_id', select: 'unit_number unit_type size_sqft bedrooms bathrooms' }
      ]);

      res.status(201).json({
        message: 'Vacancy listing created successfully',
        listing
      });
    } catch (error) {
      console.error('Create vacancy listing error:', error);
      res.status(500).json({
        error: 'Failed to create vacancy listing',
        details: error.message
      });
    }
  }

  static async getListings(req, res) {
    try {
      const {
        search,
        property_id,
        featured,
        status,
        min_rent,
        max_rent,
        amenities,
        page = 1,
        limit = 20,
        sort_by = 'published_at',
        sort_order = 'desc'
      } = req.query;

      // Build filters
      const filters = {};
      if (property_id) filters.property_id = property_id;
      if (status) filters.status = status;
      if (min_rent) filters.min_rent = parseFloat(min_rent);
      if (max_rent) filters.max_rent = parseFloat(max_rent);
      if (amenities) {
        const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
        filters.amenities = amenityArray;
      }

      let listings;
      let total;

      if (search) {
        // Use text search
        const searchResults = await VacancyListing.searchListings(search, filters);
        listings = searchResults;
        total = searchResults.length;
      } else {
        // Use regular query
        listings = await VacancyListing.getActiveListings(filters)
          .populate('property_id', 'property_name address coordinates')
          .populate('unit_id', 'unit_number unit_type size_sqft bedrooms bathrooms')
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit));
        
        total = await VacancyListing.countDocuments({
          is_active: true,
          status: 'active',
          ...filters
        });
      }

      // Apply featured filter if specified
      if (featured !== undefined) {
        const isFeatured = featured === 'true';
        listings = listings.filter(listing => listing.is_featured === isFeatured);
      }

      res.json({
        listings,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_records: total,
          records_per_page: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get vacancy listings error:', error);
      res.status(500).json({
        error: 'Failed to retrieve vacancy listings',
        details: error.message
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
      res.status(500).json({
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

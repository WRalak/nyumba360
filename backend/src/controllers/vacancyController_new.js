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
          name: `${req.user.firstName} ${req.user.lastName}`,
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
        limit = 20
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

      const listing = await VacancyListing.findOne({
        _id: id,
        landlord_id: req.user.userId
      })
        .populate('property_id', 'property_name address coordinates')
        .populate('unit_id', 'unit_number unit_type size_sqft bedrooms bathrooms amenities');

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      res.json({ listing });
    } catch (error) {
      console.error('Get vacancy listing error:', error);
      res.status(500).json({
        error: 'Failed to retrieve vacancy listing',
        details: error.message
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
      const updateData = req.body;

      // Find listing and verify ownership
      const listing = await VacancyListing.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      // Update numeric fields
      if (updateData.monthly_rent) {
        updateData.monthly_rent = parseFloat(updateData.monthly_rent);
      }
      if (updateData.security_deposit) {
        updateData.security_deposit = parseFloat(updateData.security_deposit);
      }

      // Handle status changes
      if (updateData.status === 'active' && listing.status !== 'active') {
        updateData.published_at = new Date();
      } else if (updateData.status === 'rented' && listing.status !== 'rented') {
        updateData.rented_at = new Date();
        updateData.closed_at = new Date();
      } else if (updateData.status === 'closed' && listing.status !== 'closed') {
        updateData.closed_at = new Date();
      }

      // Handle featured status
      if (updateData.is_featured && !listing.is_featured) {
        updateData.featured_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      const updatedListing = await VacancyListing.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('property_id', 'property_name address')
        .populate('unit_id', 'unit_number unit_type size_sqft bedrooms bathrooms');

      res.json({
        message: 'Vacancy listing updated successfully',
        listing: updatedListing
      });
    } catch (error) {
      console.error('Update vacancy listing error:', error);
      res.status(500).json({
        error: 'Failed to update vacancy listing',
        details: error.message
      });
    }
  }

  static async deleteListing(req, res) {
    try {
      const { id } = req.params;

      const listing = await VacancyListing.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      await VacancyListing.findByIdAndDelete(id);

      res.json({
        message: 'Vacancy listing deleted successfully'
      });
    } catch (error) {
      console.error('Delete vacancy listing error:', error);
      res.status(500).json({
        error: 'Failed to delete vacancy listing',
        details: error.message
      });
    }
  }

  static async publishListing(req, res) {
    try {
      const { id } = req.params;

      const listing = await VacancyListing.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      if (listing.status === 'active') {
        return res.status(400).json({
          error: 'Listing is already active'
        });
      }

      const updatedListing = await VacancyListing.findByIdAndUpdate(
        id,
        {
          status: 'active',
          is_active: true,
          published_at: new Date()
        },
        { new: true }
      )
        .populate('property_id', 'property_name address')
        .populate('unit_id', 'unit_number unit_type');

      res.json({
        message: 'Vacancy listing published successfully',
        listing: updatedListing
      });
    } catch (error) {
      console.error('Publish vacancy listing error:', error);
      res.status(500).json({
        error: 'Failed to publish vacancy listing',
        details: error.message
      });
    }
  }

  static async getFeaturedListings(req, res) {
    try {
      const { limit = 10 } = req.query;

      const listings = await VacancyListing.getFeaturedListings(parseInt(limit));

      res.json({
        featured_listings: listings
      });
    } catch (error) {
      console.error('Get featured listings error:', error);
      res.status(500).json({
        error: 'Failed to retrieve featured listings',
        details: error.message
      });
    }
  }

  static async getMyListings(req, res) {
    try {
      const {
        status,
        page = 1,
        limit = 20,
        sort_by = 'createdAt',
        sort_order = 'desc'
      } = req.query;

      // Build query
      const query = { landlord_id: req.user.userId };
      if (status) query.status = status;

      // Sort options
      const sortOptions = {};
      sortOptions[sort_by] = sort_order === 'desc' ? -1 : 1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [listings, total] = await Promise.all([
        VacancyListing.find(query)
          .populate('property_id', 'property_name address')
          .populate('unit_id', 'unit_number unit_type monthly_rent')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        VacancyListing.countDocuments(query)
      ]);

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
      console.error('Get my listings error:', error);
      res.status(500).json({
        error: 'Failed to retrieve your listings',
        details: error.message
      });
    }
  }

  static async addInquiry(req, res) {
    try {
      const { id } = req.params;
      const { name, phone, email, message, preferred_contact } = req.body;

      const listing = await VacancyListing.findOne({
        _id: id,
        is_active: true,
        status: 'active'
      });

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found or not active'
        });
      }

      const inquiry = {
        name,
        phone,
        email,
        message,
        preferred_contact,
        inquiry_date: new Date()
      };

      const updatedListing = await VacancyListing.findByIdAndUpdate(
        id,
        {
          $push: { inquiries: inquiry },
          $inc: { inquiries_count: 1 }
        },
        { new: true }
      );

      res.json({
        message: 'Inquiry submitted successfully',
        inquiry: updatedListing.inquiries[updatedListing.inquiries.length - 1]
      });
    } catch (error) {
      console.error('Add inquiry error:', error);
      res.status(500).json({
        error: 'Failed to submit inquiry',
        details: error.message
      });
    }
  }

  static async getListingAnalytics(req, res) {
    try {
      const { property_id } = req.query;

      const analytics = await VacancyListing.getListingAnalytics(
        req.user.userId,
        property_id
      );

      res.json({
        listing_analytics: analytics
      });
    } catch (error) {
      console.error('Get listing analytics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve listing analytics',
        details: error.message
      });
    }
  }

  static async getPerformanceMetrics(req, res) {
    try {
      const { months = 12 } = req.query;

      const metrics = await VacancyListing.getPerformanceMetrics(
        req.user.userId,
        parseInt(months)
      );

      res.json({
        performance_metrics: metrics,
        months_analyzed: parseInt(months)
      });
    } catch (error) {
      console.error('Get performance metrics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve performance metrics',
        details: error.message
      });
    }
  }

  static async promoteListing(req, res) {
    try {
      const { id } = req.params;
      const { promotion_type, promotion_budget, duration_days = 30 } = req.body;

      const listing = await VacancyListing.findOne({
        _id: id,
        landlord_id: req.user.userId
      });

      if (!listing) {
        return res.status(404).json({
          error: 'Vacancy listing not found'
        });
      }

      const promotionUntil = new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000);

      const updatedListing = await VacancyListing.findByIdAndUpdate(
        id,
        {
          'promotion.is_promoted': true,
          'promotion.promotion_type': promotion_type,
          'promotion.promotion_until': promotionUntil,
          'promotion.promotion_budget': promotion_budget ? parseFloat(promotion_budget) : 0
        },
        { new: true }
      );

      res.json({
        message: 'Listing promoted successfully',
        listing: updatedListing
      });
    } catch (error) {
      console.error('Promote listing error:', error);
      res.status(500).json({
        error: 'Failed to promote listing',
        details: error.message
      });
    }
  }

  static async incrementViews(req, res) {
    try {
      const { id } = req.params;

      await VacancyListing.findByIdAndUpdate(
        id,
        { $inc: { views_count: 1 } }
      );

      res.json({
        message: 'View count incremented'
      });
    } catch (error) {
      console.error('Increment views error:', error);
      res.status(500).json({
        error: 'Failed to increment view count',
        details: error.message
      });
    }
  }
}

module.exports = VacancyController;

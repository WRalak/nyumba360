const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

class ProfileController {
  // Get user profile
  static async getProfile(req, res) {
    try {
      const user = req.user;
      
      // Update user stats
      await user.updateStats();
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching profile',
        error: error.message
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const user = req.user;
      const updates = req.body;
      
      // Fields that can be updated
      const allowedUpdates = [
        'first_name',
        'last_name',
        'display_name',
        'date_of_birth',
        'gender',
        'nationality',
        'address',
        'preferences',
        'privacy'
      ];
      
      // Filter updates to only allowed fields
      const filteredUpdates = {};
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });
      
      // Handle address updates
      if (updates.address) {
        filteredUpdates.address = {
          ...user.address,
          ...updates.address
        };
      }
      
      // Handle preferences updates
      if (updates.preferences) {
        filteredUpdates.preferences = {
          ...user.preferences,
          ...updates.preferences
        };
      }
      
      // Handle privacy updates
      if (updates.privacy) {
        filteredUpdates.privacy = {
          ...user.privacy,
          ...updates.privacy
        };
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        filteredUpdates,
        { new: true, runValidators: true }
      );
      
      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: error.message
      });
    }
  }

  // Upload profile image
  static async uploadProfileImage(req, res) {
    try {
      const user = req.user;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      // Delete old profile image if exists
      if (user.profile_image) {
        try {
          const oldImagePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profile_image));
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.log('Old profile image not found:', error.message);
        }
      }
      
      // Update user with new profile image
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      user.profile_image = imageUrl;
      await user.save();
      
      res.json({
        success: true,
        data: {
          profile_image: imageUrl
        },
        message: 'Profile image uploaded successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error uploading profile image',
        error: error.message
      });
    }
  }

  // Get public profile
  static async getPublicProfile(req, res) {
    try {
      const { userId } = req.params;
      const viewer = req.user;
      
      // Get target user
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check privacy settings
      if (targetUser.privacy.profile_visibility === 'private') {
        return res.status(403).json({
          success: false,
          message: 'This profile is private'
        });
      }
      
      if (targetUser.privacy.profile_visibility === 'contacts_only') {
        // Check if they are contacts
        const areContacts = await ProfileController.checkIfContacts(viewer._id, userId);
        if (!areContacts) {
          return res.status(403).json({
            success: false,
            message: 'This profile is only visible to contacts'
          });
        }
      }
      
      // Get public profile data
      const publicProfile = targetUser.getPublicProfile();
      
      res.json({
        success: true,
        data: publicProfile
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching public profile',
        error: error.message
      });
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(req, res) {
    try {
      const user = req.user;
      const preferences = req.body;
      
      await user.updateNotificationPreferences(preferences);
      
      res.json({
        success: true,
        data: user.preferences,
        message: 'Notification preferences updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating notification preferences',
        error: error.message
      });
    }
  }

  // Update privacy settings
  static async updatePrivacySettings(req, res) {
    try {
      const user = req.user;
      const privacySettings = req.body;
      
      // Validate privacy settings
      const allowedSettings = ['profile_visibility', 'show_phone', 'show_email'];
      const filteredSettings = {};
      
      allowedSettings.forEach(setting => {
        if (privacySettings[setting] !== undefined) {
          filteredSettings[setting] = privacySettings[setting];
        }
      });
      
      // Update privacy settings
      user.privacy = {
        ...user.privacy,
        ...filteredSettings
      };
      
      await user.save();
      
      res.json({
        success: true,
        data: user.privacy,
        message: 'Privacy settings updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating privacy settings',
        error: error.message
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      const user = req.user;
      
      // Update stats first
      await user.updateStats();
      
      // Get additional statistics
      const Property = require('../models/Property');
      const Tenant = require('../models/Tenant');
      const Payment = require('../models/Payment');
      const Maintenance = require('../models/Maintenance');
      
      const [
        recentProperties,
        recentTenants,
        recentPayments,
        pendingMaintenance,
        monthlyRevenue
      ] = await Promise.all([
        Property.find({ owner_id: user._id }).sort({ created_at: -1 }).limit(5),
        Tenant.find({ landlord_id: user._id }).sort({ created_at: -1 }).limit(5),
        Payment.find({ landlord_id: user._id, status: 'completed' }).sort({ payment_date: -1 }).limit(5),
        Maintenance.find({ landlord_id: user._id, status: 'pending' }).sort({ created_at: -1 }).limit(5),
        ProfileController.getMonthlyRevenue(user._id)
      ]);
      
      res.json({
        success: true,
        data: {
          stats: user.stats,
          recent: {
            properties: recentProperties,
            tenants: recentTenants,
            payments: recentPayments,
            maintenance: pendingMaintenance
          },
          monthlyRevenue
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics',
        error: error.message
      });
    }
  }

  // Search users (with privacy)
  static async searchUsers(req, res) {
    try {
      const { query, user_type, limit = 20 } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      
      const users = await User.searchUsers(query, {
        user_type,
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching users',
        error: error.message
      });
    }
  }

  // Get user notifications
  static async getUserNotifications(req, res) {
    try {
      const user = req.user;
      const { type, status, limit = 50 } = req.query;
      
      const notifications = await user.getNotifications({
        type,
        status,
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching notifications',
        error: error.message
      });
    }
  }

  // Delete account
  static async deleteAccount(req, res) {
    try {
      const user = req.user;
      const { password } = req.body;
      
      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }
      
      // Soft delete (deactivate account)
      user.is_active = false;
      user.email = `deleted_${Date.now()}_${user.email}`;
      user.phone = `deleted_${Date.now()}_${user.phone}`;
      
      await user.save();
      
      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting account',
        error: error.message
      });
    }
  }

  // Helper method to check if users are contacts
  static async checkIfContacts(userId1, userId2) {
    try {
      const Property = require('../models/Property');
      
      const relationship = await Property.findOne({
        $or: [
          { owner_id: userId1, 'tenants.tenant_id': userId2 },
          { owner_id: userId2, 'tenants.tenant_id': userId1 }
        ]
      });
      
      return !!relationship;
    } catch (error) {
      return false;
    }
  }

  // Helper method to get monthly revenue
  static async getMonthlyRevenue(userId) {
    try {
      const Payment = require('../models/Payment');
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const revenue = await Payment.aggregate([
        {
          $match: {
            landlord_id: userId,
            status: 'completed',
            payment_date: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$payment_date' },
              month: { $month: '$payment_date' }
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);
      
      return revenue.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        revenue: item.revenue,
        count: item.count
      }));
    } catch (error) {
      return [];
    }
  }
}

module.exports = ProfileController;

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const usePostgreSQL = process.env.POSTGRES_URI;
const useMongoDB = process.env.MONGODB_URI;

let pool;

if (usePostgreSQL) {
  pool = new Pool({
    connectionString: process.env.POSTGRES_URI,
    ssl: process.env.POSTGRES_URI.includes('aws.neon.tech') ? { rejectUnauthorized: false } : false,
    max: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
  });
}

class MediaService {
  static async uploadPropertyImage(propertyId, file, description = '') {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads/properties');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const uniqueFilename = crypto.randomBytes(16).toString('hex') + fileExtension;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Save to database
      let mediaRecord;
      
      if (usePostgreSQL) {
        // PostgreSQL implementation
        const insertQuery = `
          INSERT INTO property_media (property_id, media_type, file_name, file_path, file_size, description, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `;
        
        const result = await pool.query(insertQuery, [
          propertyId, 'image', file.name, uniqueFilename, file.size, description
        ]);
        
        mediaRecord = result.rows[0];
      } else {
        // MongoDB fallback
        const mongoose = require('mongoose');
        const MediaModel = mongoose.model('Media', new mongoose.Schema({
          property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
          media_type: { type: String, required: true },
          file_name: { type: String, required: true },
          file_path: { type: String, required: true },
          file_size: { type: Number, required: true },
          description: { type: String },
          created_at: { type: Date, default: Date.now }
        }));
        
        mediaRecord = await MediaModel.create({
          property_id: propertyId,
          media_type: 'image',
          file_name: file.name,
          file_path: `/uploads/properties/${uniqueFilename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          description,
          is_primary: false,
          created_at: new Date()
        });
      }

      return {
        success: true,
        message: 'Property image uploaded successfully',
        data: {
          media_id: mediaRecord._id || mediaRecord.id,
          file_name: file.name,
          file_path: `/uploads/properties/${uniqueFilename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          description
        }
      };
    } catch (error) {
      console.error('Upload property image error:', error);
      throw error;
    }
  }

  static async uploadUnitImage(unitId, file, description = '') {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads/units');
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generate unique filename
      const fileExtension = path.extname(file.name);
      const uniqueFilename = crypto.randomBytes(16).toString('hex') + fileExtension;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Save to database
      let mediaRecord;
      
      if (usePostgreSQL) {
        // PostgreSQL implementation
        const insertQuery = `
          INSERT INTO unit_media (unit_id, media_type, file_name, file_path, file_size, description, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `;
        
        const result = await pool.query(insertQuery, [
          unitId, 'image', file.name, uniqueFilename, file.size, description
        ]);
        
        mediaRecord = result.rows[0];
      } else {
        // MongoDB fallback
        const mongoose = require('mongoose');
        const MediaModel = mongoose.model('Media', new mongoose.Schema({
          unit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
          media_type: { type: String, required: true },
          file_name: { type: String, required: true },
          file_path: { type: String, required: true },
          file_size: { type: Number, required: true },
          description: { type: String },
          created_at: { type: Date, default: Date.now }
        }));
        
        mediaRecord = await MediaModel.create({
          unit_id: unitId,
          media_type: 'image',
          file_name: file.name,
          file_path: `/uploads/units/${uniqueFilename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          description,
          is_primary: false,
          created_at: new Date()
        });
      }

      return {
        success: true,
        message: 'Unit image uploaded successfully',
        data: {
          media_id: mediaRecord._id || mediaRecord.id,
          file_name: file.name,
          file_path: `/uploads/units/${uniqueFilename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          description
        }
      };
    } catch (error) {
      console.error('Upload unit image error:', error);
      throw error;
    }
  }

  static async getPropertyImages(propertyId) {
    try {
      let images;
      
      if (usePostgreSQL) {
        // PostgreSQL implementation
        const query = `
          SELECT pm.*, p.property_name, p.property_address
          FROM property_media pm
          JOIN properties p ON pm.property_id = p.id
          WHERE pm.property_id = $1 AND pm.media_type = 'image'
          ORDER BY pm.created_at DESC
        `;
        
        const result = await pool.query(query, [propertyId]);
        images = result.rows;
      } else {
        // MongoDB fallback
        const mongoose = require('mongoose');
        const Property = mongoose.model('Property');
        const Media = mongoose.model('Media');
        
        const property = await Property.findById(propertyId);
        if (!property) return [];
        
        images = await Media.find({ property_id: propertyId, media_type: 'image' })
          .sort({ created_at: -1 })
          .populate({
            path: 'property_id',
            select: 'property_name property_address'
          });
      }

      return images;
    } catch (error) {
      console.error('Get property images error:', error);
      throw error;
    }
  }

  static async getUnitImages(unitId) {
    try {
      let images;
      
      if (usePostgreSQL) {
        // PostgreSQL implementation
        const query = `
          SELECT um.*, u.unit_number, u.unit_type
          FROM unit_media um
          JOIN units u ON um.unit_id = u.id
          WHERE um.unit_id = $1 AND um.media_type = 'image'
          ORDER BY um.created_at DESC
        `;
        
        const result = await pool.query(query, [unitId]);
        images = result.rows;
      } else {
        // MongoDB fallback
        const mongoose = require('mongoose');
        const Unit = mongoose.model('Unit');
        const Media = mongoose.model('Media');
        
        const unit = await Unit.findById(unitId);
        if (!unit) return [];
        
        images = await Media.find({ unit_id: unitId, media_type: 'image' })
          .sort({ created_at: -1 })
          .populate({
            path: 'unit_id',
            select: 'unit_number unit_type'
          });
      }

      return images;
    } catch (error) {
      console.error('Get unit images error:', error);
      throw error;
    }
  }

  static async deleteMedia(mediaId) {
    try {
      let result;
      
      if (usePostgreSQL) {
        // PostgreSQL implementation
        const query = `
          DELETE FROM property_media WHERE id = $1
        `;
        result = await pool.query(query, [mediaId]);
      } else {
        // MongoDB fallback
        const mongoose = require('mongoose');
        const Media = mongoose.model('Media');
        result = await Media.findByIdAndDelete(mediaId);
      }

      return {
        success: true,
        message: 'Media deleted successfully'
      };
    } catch (error) {
      console.error('Delete media error:', error);
      throw error;
    }
  }
}

module.exports = MediaService;

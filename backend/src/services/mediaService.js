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
} else if (useMongoDB) {
  const mongoose = require('mongoose');
  // MongoDB fallback if needed
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

      return {
        success: true,
        media: mediaRecord,
        url: `/uploads/properties/${uniqueFilename}`
      };
    } catch (error) {
      console.error('Upload property image error:', error);
      throw new Error('Failed to upload property image');
    }
  }

  static async uploadUnitImage(unitId, file, description = '') {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      const uploadsDir = path.join(__dirname, '../../uploads/units');
      await fs.mkdir(uploadsDir, { recursive: true });

      const fileExtension = path.extname(file.name);
      const uniqueFilename = crypto.randomBytes(16).toString('hex') + fileExtension;
      const filePath = path.join(uploadsDir, uniqueFilename);

      await fs.writeFile(filePath, file.buffer);

      const [mediaRecord] = await db('unit_media')
        .insert({
          unit_id,
          media_type: 'image',
          file_name: file.name,
          file_path: `/uploads/units/${uniqueFilename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          description,
          is_primary: false,
          created_at: new Date()
        })
        .returning('*');

      return {
        success: true,
        media: mediaRecord,
        url: `/uploads/units/${uniqueFilename}`
      };
    } catch (error) {
      console.error('Upload unit image error:', error);
      throw new Error('Failed to upload unit image');
    }
  }

  static async getPropertyImages(propertyId) {
    try {
      const images = await db('property_media')
        .where({ property_id, media_type: 'image' })
        .orderBy('is_primary', 'desc')
        .orderBy('created_at', 'desc');

      return images.map(image => ({
        ...image,
        url: image.file_path
      }));
    } catch (error) {
      console.error('Get property images error:', error);
      return [];
    }
  }

  static async getUnitImages(unitId) {
    try {
      const images = await db('unit_media')
        .where({ unit_id, media_type: 'image' })
        .orderBy('is_primary', 'desc')
        .orderBy('created_at', 'desc');

      return images.map(image => ({
        ...image,
        url: image.file_path
      }));
    } catch (error) {
      console.error('Get unit images error:', error);
      return [];
    }
  }

  static async setPrimaryImage(mediaId, type = 'property') {
    try {
      const table = type === 'property' ? 'property_media' : 'unit_media';
      const idField = type === 'property' ? 'property_id' : 'unit_id';

      // Get the media record to find the associated ID
      const media = await db(table).where({ id: mediaId }).first();
      
      if (!media) {
        throw new Error('Media not found');
      }

      // Remove primary status from other images of the same property/unit
      await db(table)
        .where({ [idField]: media[idField] })
        .update({ is_primary: false });

      // Set primary status on the selected image
      await db(table)
        .where({ id: mediaId })
        .update({ is_primary: true, updated_at: new Date() });

      return { success: true };
    } catch (error) {
      console.error('Set primary image error:', error);
      throw new Error('Failed to set primary image');
    }
  }

  static async deleteMedia(mediaId, type = 'property') {
    try {
      const table = type === 'property' ? 'property_media' : 'unit_media';
      
      // Get media record to delete file
      const media = await db(table).where({ id: mediaId }).first();
      
      if (!media) {
        throw new Error('Media not found');
      }

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../..', media.file_path);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.warn('File not found, may have been already deleted:', filePath);
      }

      // Delete from database
      await db(table).where({ id: mediaId }).del();

      return { success: true };
    } catch (error) {
      console.error('Delete media error:', error);
      throw new Error('Failed to delete media');
    }
  }

  static async uploadVacancyImage(vacancyId, file, description = '') {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      const uploadsDir = path.join(__dirname, '../../uploads/vacancies');
      await fs.mkdir(uploadsDir, { recursive: true });

      const fileExtension = path.extname(file.name);
      const uniqueFilename = crypto.randomBytes(16).toString('hex') + fileExtension;
      const filePath = path.join(uploadsDir, uniqueFilename);

      await fs.writeFile(filePath, file.buffer);

      const [mediaRecord] = await db('vacancy_media')
        .insert({
          vacancy_id,
          media_type: 'image',
          file_name: file.name,
          file_path: `/uploads/vacancies/${uniqueFilename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          description,
          created_at: new Date()
        })
        .returning('*');

      return {
        success: true,
        media: mediaRecord,
        url: `/uploads/vacancies/${uniqueFilename}`
      };
    } catch (error) {
      console.error('Upload vacancy image error:', error);
      throw new Error('Failed to upload vacancy image');
    }
  }

  static async getVacancyImages(vacancyId) {
    try {
      const images = await db('vacancy_media')
        .where({ vacancy_id, media_type: 'image' })
        .orderBy('created_at', 'desc');

      return images.map(image => ({
        ...image,
        url: image.file_path
      }));
    } catch (error) {
      console.error('Get vacancy images error:', error);
      return [];
    }
  }

  static async optimizeImage(filePath) {
    try {
      // In production, this would use image optimization libraries
      // For now, just return the original path
      return filePath;
    } catch (error) {
      console.error('Optimize image error:', error);
      return filePath;
    }
  }

  static async generateImageThumbnail(filePath, thumbnailPath) {
    try {
      // In production, this would generate actual thumbnails
      // For now, just return the original path
      return filePath;
    } catch (error) {
      console.error('Generate thumbnail error:', error);
      return filePath;
    }
  }

  static async getMediaStats(propertyId = null) {
    try {
      let stats = {
        total_images: 0,
        total_size: 0,
        by_type: {}
      };

      if (propertyId) {
        // Get stats for specific property
        const propertyImages = await db('property_media')
          .where({ property_id, media_type: 'image' });

        stats.total_images = propertyImages.length;
        stats.total_size = propertyImages.reduce((sum, img) => sum + (img.file_size || 0), 0);
        stats.by_type.property = propertyImages.length;
      } else {
        // Get global stats
        const propertyImages = await db('property_media').where({ media_type: 'image' });
        const unitImages = await db('unit_media').where({ media_type: 'image' });
        const vacancyImages = await db('vacancy_media').where({ media_type: 'image' });

        stats.total_images = propertyImages.length + unitImages.length + vacancyImages.length;
        stats.total_size = propertyImages.reduce((sum, img) => sum + (img.file_size || 0), 0) +
                          unitImages.reduce((sum, img) => sum + (img.file_size || 0), 0) +
                          vacancyImages.reduce((sum, img) => sum + (img.file_size || 0), 0);
        stats.by_type = {
          property: propertyImages.length,
          unit: unitImages.length,
          vacancy: vacancyImages.length
        };
      }

      return stats;
    } catch (error) {
      console.error('Get media stats error:', error);
      return {
        total_images: 0,
        total_size: 0,
        by_type: {}
      };
    }
  }
}

module.exports = MediaService;

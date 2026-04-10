const express = require('express');
const { body } = require('express-validator');
const MediaController = require('../controllers/mediaController');
const { authMiddleware, landlordOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Validation rules
const descriptionValidation = [
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

// Routes
router.post('/property/:id/images', upload.single('image'), descriptionValidation, MediaController.uploadPropertyImage);
router.post('/unit/:id/images', upload.single('image'), descriptionValidation, MediaController.uploadUnitImage);
router.get('/property/:id/images', MediaController.getPropertyImages);
router.get('/unit/:id/images', MediaController.getUnitImages);
router.put('/primary', MediaController.setPrimaryImage);
router.delete('/:type/:id', MediaController.deleteMedia);

// Vacancy image routes
router.post('/vacancy/:id/images', upload.single('image'), descriptionValidation, MediaController.uploadVacancyImage);
router.get('/vacancy/:id/images', MediaController.getVacancyImages);

// Stats route
router.get('/stats', MediaController.getMediaStats);

module.exports = router;

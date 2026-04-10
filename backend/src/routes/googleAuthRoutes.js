const express = require('express');
const { googleSignIn } = require('../controllers/googleAuthController');

const router = express.Router();

// Google Sign-In route
router.post('/google-signin', googleSignIn);

module.exports = router;

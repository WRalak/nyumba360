const User = require('../models/User');

// Google Sign-In controller
const googleSignIn = async (req, res) => {
  try {
    const { email, first_name, last_name, picture, google_id } = req.body;

    // Check if user already exists
    let user = await User.findByEmail(email);
    
    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        email,
        first_name,
        last_name,
        user_type: 'tenant', // Default to tenant, can be updated later
        profile_picture: picture,
        google_id,
        is_verified: true,
        registration_method: 'google'
      });
    } else {
      // Update existing user with Google info
      await User.update(user.id, {
        google_id,
        profile_picture: picture,
        is_verified: true
      });
    }

    // Generate JWT token
    const token = User.generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Google sign-in successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        profile_picture: user.profile_picture,
        is_verified: user.is_verified
      },
      token
    });

  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sign in with Google',
      message: error.message
    });
  }
};

module.exports = {
  googleSignIn
};

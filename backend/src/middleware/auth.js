const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token. User not found.'
      });
    }

    req.user = decoded;
    req.userData = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired.'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Server error in authentication.'
    });
  }
};

const landlordOnly = (req, res, next) => {
  if (req.user.userType !== 'landlord' && req.user.userType !== 'property_manager') {
    return res.status(403).json({
      error: 'Access denied. Landlords only.'
    });
  }
  next();
};

const tenantOnly = (req, res, next) => {
  if (req.user.userType !== 'tenant') {
    return res.status(403).json({
      error: 'Access denied. Tenants only.'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  landlordOnly,
  tenantOnly
};

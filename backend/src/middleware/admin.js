const adminMiddleware = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required'
    });
  }
  next();
};

module.exports = { adminMiddleware };

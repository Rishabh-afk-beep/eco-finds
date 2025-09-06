const jwt = require('jsonwebtoken');
const { dbGet } = require('../database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await dbGet(
      'SELECT id, username, email, full_name, avatar_url, eco_points, onboarded FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication middleware (user might or might not be logged in)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await dbGet(
      'SELECT id, username, email, full_name, avatar_url, eco_points, onboarded FROM users WHERE id = ?',
      [decoded.userId]
    );

    req.user = user || null;
    next();
  } catch (error) {
    // If there's an error, continue without user (optional auth)
    req.user = null;
    next();
  }
};

// Middleware to check if user owns a resource
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      let query = '';
      switch (resourceType) {
        case 'product':
          query = 'SELECT seller_id FROM products WHERE id = ?';
          break;
        case 'order':
          query = 'SELECT buyer_id, seller_id FROM orders WHERE id = ?';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type'
          });
      }

      const resource = await dbGet(query, [id]);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceType} not found`
        });
      }

      // Check ownership based on resource type
      let isOwner = false;
      if (resourceType === 'product') {
        isOwner = resource.seller_id === userId;
      } else if (resourceType === 'order') {
        isOwner = resource.buyer_id === userId || resource.seller_id === userId;
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not own this resource'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token (longer expiration)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkResourceOwnership,
  generateToken,
  generateRefreshToken
};
// src/middleware/auth.middleware.js (FINALIZED & CORRECTED)

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Use environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_super_secret_key'; 
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/* =====================================================
   JWT GENERATION
===================================================== */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Use 'id' to match the controller logic
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRY }
  );
};

/* =====================================================
   JWT VERIFICATION (Middleware: protect)
===================================================== */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("RAW AUTH HEADER:", req.headers.authorization);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Not authorized, no token provided.' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by decoded ID
    const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
    });
    
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        message: 'Not authorized, user not found or inactive.' 
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    return res.status(401).json({ message: 'Not authorized, token failed.' });
  }
};

/* =====================================================
   ROLE-BASED AUTHORIZATION (Middleware: authorize)
===================================================== */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // req.user is set by the protect middleware
    if (!req.user) {
      return res.status(403).json({ message: 'Authorization failed: User data missing' });
    }
    
    // Check if the user's role is included in the allowed roles array
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden. User role '${req.user.role}' is not authorized to access this resource.` 
      });
    }

    next();
  };
};

module.exports = { 
    protect, // Renamed 'authenticate' to 'protect'
    authorize, 
    generateToken 
    // optionalAuth is not used by controller, can be excluded or renamed.
};
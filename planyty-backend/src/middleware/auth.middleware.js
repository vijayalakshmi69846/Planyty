// auth.middleware.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'access_secret_123';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret_456';
const ACCESS_EXPIRY = '24h'; // Increased from 15m to 24h
const REFRESH_EXPIRY = '7d';  // Long-lived

/* =====================================================
   TOKEN GENERATION
===================================================== */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
};

/* =====================================================
   PROTECT MIDDLEWARE (Access Token) - WITH REFRESH LOGIC
===================================================== */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token.' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      
      if (!user || !user.is_active) {
        return res.status(401).json({ message: 'User not found or inactive.' });
      }

      req.user = user;
      next();
    } catch (error) {
      // Token expired or invalid, try to refresh
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        // Check for refresh token
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
          try {
            // Verify refresh token
            const decodedRefresh = jwt.verify(refreshToken, REFRESH_SECRET);
            const user = await User.findByPk(decodedRefresh.id, { attributes: { exclude: ['password'] } });
            
            if (!user || !user.is_active || user.refresh_token !== refreshToken) {
              return res.status(401).json({ message: 'Session expired. Please login again.' });
            }
            
            // Generate new tokens
            const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
            
            // Update refresh token in DB
            user.refresh_token = newRefreshToken;
            await user.save();
            
            // Set new refresh token cookie
            res.cookie('refreshToken', newRefreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
              maxAge: 7 * 24 * 60 * 60 * 1000
            });
            
            // Attach user and new token to request
            req.user = user;
            req.newAccessToken = accessToken;
            
            next();
          } catch (refreshError) {
            console.error('Refresh token error:', refreshError);
            return res.status(401).json({ message: 'Session expired. Please login again.' });
          }
        } else {
          return res.status(401).json({ message: 'Token expired. Please login again.' });
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed.' });
  }
};

const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }
    next();
  };
};

module.exports = { protect, authorize, generateTokens, REFRESH_SECRET };
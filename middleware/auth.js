const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Check for token in multiple places
    let token = req.header('x-auth-token') || 
                req.header('Authorization')?.replace('Bearer ', '') ||
                req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        console.warn(`[SECURITY] Non-admin user ${req.user.email} attempted to access admin endpoint: ${req.path}`);
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      
      console.log(`[ADMIN] Admin ${req.user.email} accessed ${req.method} ${req.path}`);
      next();
    });
  } catch (error) {
    console.error('[ADMIN AUTH ERROR]', error.message);
    res.status(401).json({ message: 'Authorization failed' });
  }
};

// Optional: Token blacklist functionality (implement with Redis in production)
const blacklistedTokens = new Set();

const blacklistToken = (token) => {
  blacklistedTokens.add(token);
  // In production, store in Redis with expiration
};

const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
  // In production, check Redis
};

module.exports = { auth, adminAuth, blacklistToken, isTokenBlacklisted };
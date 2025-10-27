// middleware/authMiddleware.js - FIXED
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // FIX: Ensure user object has all required properties
    req.user = {
      id: decoded.id || decoded._id,
      _id: decoded._id || decoded.id,
      role: decoded.role,
      roles: decoded.roles || [decoded.role],
      teamId: decoded.teamId || 1,
      email: decoded.email || 'user@example.com', // Fallback 
      name: decoded.name || decoded.email?.split('@')[0] || 'User' // Fallback name
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const hrMiddleware = (req, res, next) => {
  try {
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    if (userRole !== 'admin' && userRole !== 'hr' && userRole !== 'employer') {
      return res.status(403).json({ message: 'Access denied. HR/Admin role required.' });
    }
    next();
  } catch (error) {
    console.error('HR middleware error:', error);
    res.status(403).json({ message: 'Access denied' });
  }
};

module.exports = { authMiddleware, hrMiddleware };
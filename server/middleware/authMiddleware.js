// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Check if 2FA verification is still valid
    if (decoded.twoFactorExpiresAt && Date.now() > decoded.twoFactorExpiresAt) {
      // 2FA verification has expired
      return res.status(401).json({ 
        success: false, 
        message: 'Two-factor authentication verification has expired. Please verify again.',
        code: '2FA_EXPIRED'
      });
    }

    // ✅ Backfill employeeId from User when missing
    if (!decoded.employeeId && decoded.id) {
      try {
        const userDoc = await User.findById(decoded.id).select('employeeId email name');
        if (userDoc?.employeeId) decoded.employeeId = userDoc.employeeId;
        if (!decoded.email && userDoc?.email) decoded.email = userDoc.email;
        if (!decoded.name && userDoc?.name) decoded.name = userDoc.name;
      } catch { /* ignore backfill errors */ }
    }

    req.user = {
      id: decoded.id || decoded._id,
      _id: decoded._id || decoded.id,
      role: decoded.role,
      roles: decoded.roles || [decoded.role],
      teamId: decoded.teamId || 1,
      email: decoded.email || 'user@example.com',
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
      employeeId: decoded.employeeId || null,
      twoFactorVerified: decoded.twoFactorVerifiedAt ? true : false,
      twoFactorExpiresAt: decoded.twoFactorExpiresAt || null
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired, please login again', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
    }
    if (error.message === '2FA_EXPIRED') {
      return res.status(401).json({ success: false, message: 'Two-factor authentication verification has expired', code: '2FA_EXPIRED' });
    }
    res.status(401).json({ success: false, message: 'Token is not valid', code: 'AUTH_ERROR' });
  }
};

const hrMiddleware = (req, res, next) => {
  try {
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const allowedRoles = ['admin', 'hr', 'employer'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied. HR/Admin role required.' });
    }
    next();
  } catch (error) {
    console.error('HR middleware error:', error);
    res.status(403).json({ success: false, message: 'Access denied' });
  }
};

module.exports = { authMiddleware, hrMiddleware };
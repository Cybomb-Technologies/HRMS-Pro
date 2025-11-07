const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Check multiple possible token locations
    let token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Also check cookies
      token = req.cookies?.token;
    }
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    req.user = {
      id: decoded.id || decoded._id,
      _id: decoded._id || decoded.id,
      role: decoded.role,
      roles: decoded.roles || [decoded.role],
      teamId: decoded.teamId || 1,
      email: decoded.email || 'user@example.com',
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
      employeeId: decoded.employeeId
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired, please login again',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid',
      code: 'AUTH_ERROR'
    });
  }
};

const hrMiddleware = (req, res, next) => {
  try {
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const allowedRoles = ['admin', 'hr', 'employer'];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. HR/Admin role required.' 
      });
    }
    next();
  } catch (error) {
    console.error('HR middleware error:', error);
    res.status(403).json({ 
      success: false,
      message: 'Access denied' 
    });
  }
};

module.exports = { authMiddleware, hrMiddleware };
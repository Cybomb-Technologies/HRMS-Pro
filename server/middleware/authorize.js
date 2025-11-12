// middleware/authorize.js
const authorize = (module, action) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user || !user.role) {
        return res.status(403).json({ message: 'Access denied. No role assigned.' });
      }

      // Admin has all access
      if (user.role === 'admin') {
        return next();
      }

      // For HR and Employer roles, check permissions from database
      if (['hr', 'employer', 'employee'].includes(user.role)) {
        // Get role permissions from database
        const { Role } = require('../models/Settings');
        Role.findOne({ name: user.role, organization: req.user.organization })
          .then(roleDoc => {
            if (!roleDoc) {
              return res.status(403).json({ message: 'Access denied. Role not configured.' });
            }

            const permissions = roleDoc.permissions;
            
            if (!permissions) {
              return res.status(403).json({ message: 'Access denied. No permissions configured.' });
            }

            const modulePermission = permissions[module];
            
            if (!modulePermission) {
              return res.status(403).json({ message: `Access denied for ${module} module.` });
            }

            // Check permission based on action
            switch (action) {
              case 'crud':
                if (modulePermission !== 'crud') {
                  return res.status(403).json({ message: `Full access required for ${module} module.` });
                }
                break;
              case 'read':
                if (!['crud', 'read', 'read-self'].includes(modulePermission)) {
                  return res.status(403).json({ message: `Read access required for ${module} module.` });
                }
                break;
              case 'write':
                if (modulePermission !== 'crud') {
                  return res.status(403).json({ message: `Write access required for ${module} module.` });
                }
                break;
              case 'read-self':
                if (!['crud', 'read', 'read-self'].includes(modulePermission)) {
                  return res.status(403).json({ message: `Read access required for ${module} module.` });
                }
                break;
              default:
                return res.status(403).json({ message: 'Invalid permission action.' });
            }

            next();
          })
          .catch(error => {
            console.error('Error fetching role permissions:', error);
            res.status(500).json({ message: 'Authorization error', error: error.message });
          });
      } else {
        return res.status(403).json({ message: 'Access denied. Invalid role.' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Authorization error', error: error.message });
    }
  };
};

module.exports = authorize;
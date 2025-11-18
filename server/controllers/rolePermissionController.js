const RolePermission = require('../models/RolePermissionModel');

// Get all roles with user counts
exports.getRoles = async (req, res) => {
  try {
    const roles = await RolePermission.find({ isActive: true })
      .select('name permissions userCount description')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error.message
    });
  }
};

// Get specific role permissions
exports.getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await RolePermission.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: {
        role: {
          _id: role._id,
          name: role.name,
          description: role.description,
          userCount: role.userCount
        },
        permissions: role.permissions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching role permissions',
      error: error.message
    });
  }
};

// Update role permissions
exports.updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;

    const role = await RolePermission.findById(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Update permissions
    role.permissions = permissions;
    await role.save();

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating permissions',
      error: error.message
    });
  }
};

// Initialize default roles (run once)
exports.initializeDefaultRoles = async (req, res) => {
  try {
    await RolePermission.initializeDefaultRoles();
    
    res.json({
      success: true,
      message: 'Default roles initialized successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error initializing default roles',
      error: error.message
    });
  }
};
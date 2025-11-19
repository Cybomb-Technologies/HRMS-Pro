const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRolePermissions,
  updateRolePermissions,
  initializeDefaultRoles
} = require('../controllers/rolePermissionController');

// Get all roles
router.get('/roles', getRoles);

// Get specific role permissions
router.get('/roles/:roleId/permissions', getRolePermissions);

// Update role permissions
router.put('/roles/:roleId/permissions', updateRolePermissions);

// Initialize default roles (one-time setup)
router.post('/roles/initialize', initializeDefaultRoles);

module.exports = router;
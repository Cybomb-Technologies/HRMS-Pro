const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/hrms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const permissionSchema = new mongoose.Schema({
  module: String,
  accessLevel: String
});

const roleSchema = new mongoose.Schema({
  name: String,
  permissions: [permissionSchema],
  userCount: { type: Number, default: 0 }
});

const RolePermission = mongoose.model('RolePermission', roleSchema, 'rolePermissions');

async function setupDefaults() {
  try {
    console.log('🔧 Setting up default permissions...');
    
    // Clear existing
    await RolePermission.deleteMany({});
    
    // Default modules for Admin & HR
    const allModules = [
      'dashboard', 'profile', 'announcements', 'organization', 'teams',
      'employees', 'onboarding', 'offboarding', 'leave_management', 'attendance',
      'payroll', 'reports', 'approvals', 'hr_letters', 'settings'
    ].map(module => ({ module, accessLevel: 'crud' }));

    // Employee limited permissions
    const employeeModules = [
      { module: 'dashboard', accessLevel: 'read' },
      { module: 'profile', accessLevel: 'crud' },
      { module: 'announcements', accessLevel: 'read' },
      { module: 'organization', accessLevel: 'read' },
      { module: 'teams', accessLevel: 'read' },
      { module: 'employees', accessLevel: 'read' },
      { module: 'onboarding', accessLevel: 'read' },
      { module: 'leave_management', accessLevel: 'crud' },
      { module: 'attendance', accessLevel: 'crud' },
      { module: 'payroll', accessLevel: 'read' },
      { module: 'reports', accessLevel: 'read' },
      { module: 'approvals', accessLevel: 'read' },
      { module: 'hr_letters', accessLevel: 'read' },
      { module: 'settings', accessLevel: 'read' }
    ];

    const roles = await RolePermission.create([
      { name: 'admin', permissions: allModules },
      { name: 'hr', permissions: allModules },
      { name: 'employee', permissions: employeeModules }
    ]);

    console.log('✅ Default permissions created:');
    roles.forEach(role => {
      console.log(`   ${role.name}: ${role.permissions.length} permissions`);
    });

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupDefaults();
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['none', 'read', 'read-self', 'crud', 'custom'],
    default: 'none'
  }
});

const rolePermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'hr', 'employee']
  },
  description: {
    type: String,
    required: true
  },
  permissions: [permissionSchema],
  userCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static method to initialize default roles
rolePermissionSchema.statics.initializeDefaultRoles = async function() {
  const defaultRoles = [
    {
      name: 'admin',
      description: 'Full system access with all permissions',
      permissions: [
        // { module: 'dashboard', accessLevel: 'crud' },
        // { module: 'EmployeesProfile', accessLevel: 'crud' },
        // { module: 'employees', accessLevel: 'crud' },
         { module: 'Teams', accessLevel: 'crud' },
         { module: 'Announcements', accessLevel: 'crud' },
         { module: 'Organization', accessLevel: 'crud' },
         { module: 'Employee-Management', accessLevel: 'crud' },
         { module: 'Employee-Onboarding', accessLevel: 'crud' },
          { module: 'Employee-Offboarding', accessLevel: 'crud' },
          { module: 'Leave-Management', accessLevel: 'crud' },
          { module: 'Payroll-Management', accessLevel: 'crud' },
          { module: 'Timesheet-Reports', accessLevel: 'crud' },
           { module: 'Attendance', accessLevel: 'crud' },
           { module: 'Leave-Approvals', accessLevel: 'crud' },
           { module: 'HR-Letters', accessLevel: 'crud' }
        // { module: 'attendance', accessLevel: 'crud' },
        // { module: 'payroll', accessLevel: 'crud' },
        // { module: 'reports', accessLevel: 'crud' },
        // { module: 'settings', accessLevel: 'crud' }
      ]
    },
    {
      name: 'hr',
      description: 'Human Resources management access',
      permissions: [
        // { module: 'dashboard', accessLevel: 'crud' },
        // { module: 'EmployeesProfile', accessLevel: 'crud' },
        // { module: 'employees', accessLevel: 'crud' },
        { module: 'Teams', accessLevel: 'crud' },
        { module: 'Announcements', accessLevel: 'crud' },
        { module: 'Organization', accessLevel: 'crud' },
         { module: 'Employee-Management', accessLevel: 'crud' },
         { module: 'Employee-Onboarding', accessLevel: 'crud' },
          { module: 'Employee-Offboarding', accessLevel: 'crud' },
          { module: 'Leave-Management', accessLevel: 'crud' },
          { module: 'Payroll-Management', accessLevel: 'crud' },
          { module: 'Timesheet-Reports', accessLevel: 'crud' },
           { module: 'Attendance', accessLevel: 'crud' },
           { module: 'Leave-Approvals', accessLevel: 'crud' },
           { module: 'HR-Letters', accessLevel: 'crud' }
        // { module: 'attendance', accessLevel: 'crud' },
        // { module: 'payroll', accessLevel: 'read' },
        // { module: 'reports', accessLevel: 'crud' },
        // { module: 'settings', accessLevel: 'read' }
      ]
    },
    {
      name: 'employee',
      description: 'Basic employee self-service access',
      permissions: [
        // { module: 'dashboard', accessLevel: 'read' },
        // { module: 'EmployeesProfile', accessLevel: 'read' },
        // { module: 'employees', accessLevel: 'read-self' },
         { module: 'Teams', accessLevel: 'crud' },
         { module: 'Announcements', accessLevel: 'crud' },
         { module: 'Organization', accessLevel: 'crud' },
         { module: 'Employee-Management', accessLevel: 'crud' },
         { module: 'Employee-Onboarding', accessLevel: 'crud' },
          { module: 'Employee-Offboarding', accessLevel: 'crud' },
          { module: 'Leave-Management', accessLevel: 'crud' },
          { module: 'Payroll-Management', accessLevel: 'crud' },
          { module: 'Timesheet-Reports', accessLevel: 'crud' },
          { module: 'Attendance', accessLevel: 'crud' },
          { module: 'Leave-Approvals', accessLevel: 'crud' },
          { module: 'HR-Letters', accessLevel: 'crud' }
        // { module: 'attendance', accessLevel: 'read-self' },
        // { module: 'payroll', accessLevel: 'read-self' },
        // { module: 'reports', accessLevel: 'none' },
        // { module: 'settings', accessLevel: 'none' }
      ]
    }
  ];

  for (const roleData of defaultRoles) {
    const existingRole = await this.findOne({ name: roleData.name });
    if (!existingRole) {
      await this.create(roleData);
      console.log(`✅ Created default role: ${roleData.name}`);
    } else {
      // Update existing role with any missing modules
      let updated = false;
      for (const newPerm of roleData.permissions) {
        const exists = existingRole.permissions.some(p => p.module === newPerm.module);
        if (!exists) {
          existingRole.permissions.push(newPerm);
          updated = true;
        }
      }
      if (updated) {
        await existingRole.save();
        console.log(`✅ Updated role: ${roleData.name}`);
      }
    }
  }
};

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
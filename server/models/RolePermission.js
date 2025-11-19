const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: ['dashboard', 'profile', 'announcements', 'employees', 'attendance', 'leaves', 'payroll', 'performance', 'recruitment', 'training', 'reports', 'settings', 'helpdesk', 'projects', 'clients']
  },
  accessLevel: {
    type: String,
    required: true,
    enum: ['none', 'read', 'read-self', 'write', 'create', 'delete', 'crud', 'custom']
  }
});

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['admin', 'hr', 'employee']
  },
  permissions: [permissionSchema],
  userCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Static method to initialize default roles
roleSchema.statics.initializeDefaultRoles = async function() {
  const defaultPermissions = {
    admin: [
      { module: 'dashboard', accessLevel: 'crud' },
      { module: 'profile', accessLevel: 'crud' },
      { module: 'announcements', accessLevel: 'crud' },
      { module: 'employees', accessLevel: 'crud' },
      { module: 'attendance', accessLevel: 'crud' },
      { module: 'leaves', accessLevel: 'crud' },
      { module: 'payroll', accessLevel: 'crud' },
      { module: 'performance', accessLevel: 'crud' },
      { module: 'recruitment', accessLevel: 'crud' },
      { module: 'training', accessLevel: 'crud' },
      { module: 'reports', accessLevel: 'crud' },
      { module: 'settings', accessLevel: 'crud' },
      { module: 'helpdesk', accessLevel: 'crud' },
      { module: 'projects', accessLevel: 'crud' },
      { module: 'clients', accessLevel: 'crud' }
    ],
    hr: [
      { module: 'dashboard', accessLevel: 'crud' },
      { module: 'profile', accessLevel: 'crud' },
      { module: 'announcements', accessLevel: 'crud' },
      { module: 'employees', accessLevel: 'crud' },
      { module: 'attendance', accessLevel: 'crud' },
      { module: 'leaves', accessLevel: 'crud' },
      { module: 'payroll', accessLevel: 'read' },
      { module: 'performance', accessLevel: 'crud' },
      { module: 'recruitment', accessLevel: 'crud' },
      { module: 'training', accessLevel: 'crud' },
      { module: 'reports', accessLevel: 'read' },
      { module: 'settings', accessLevel: 'read' },
      { module: 'helpdesk', accessLevel: 'crud' },
      { module: 'projects', accessLevel: 'read' },
      { module: 'clients', accessLevel: 'read' }
    ],
    employee: [
      { module: 'dashboard', accessLevel: 'read' },
      { module: 'profile', accessLevel: 'crud' },
      { module: 'announcements', accessLevel: 'read' },
      { module: 'employees', accessLevel: 'read' },
      { module: 'attendance', accessLevel: 'read-self' },
      { module: 'leaves', accessLevel: 'read-self' },
      { module: 'payroll', accessLevel: 'read-self' },
      { module: 'performance', accessLevel: 'read-self' },
      { module: 'recruitment', accessLevel: 'none' },
      { module: 'training', accessLevel: 'read' },
      { module: 'reports', accessLevel: 'none' },
      { module: 'settings', accessLevel: 'none' },
      { module: 'helpdesk', accessLevel: 'read-self' },
      { module: 'projects', accessLevel: 'read' },
      { module: 'clients', accessLevel: 'read' }
    ]
  };

  for (const [roleName, permissions] of Object.entries(defaultPermissions)) {
    await this.findOneAndUpdate(
      { name: roleName },
      { 
        name: roleName, 
        permissions: permissions,
        userCount: 0
      },
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('Role', roleSchema);
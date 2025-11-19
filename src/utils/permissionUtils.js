// utils/permissionUtils.js

// Simple permission check
export const checkPermission = (user, module, action) => {
  if (!user || !user.role || !user.role.permissions) return false;

  const modulePermission = user.role.permissions.find(p => p.module === module);
  if (!modulePermission) return false;

  const accessLevel = modulePermission.accessLevel;
  
  if (action === 'read') return accessLevel !== 'none';
  if (action === 'write' || action === 'create' || action === 'delete') {
    return accessLevel === 'crud' || accessLevel === 'custom';
  }
  
  return false;
};

// Profile specific permissions
export const canViewProfile = (user) => checkPermission(user, 'EmployeesProfile', 'read');
export const canEditProfile = (user, profileEmployeeId) => {
  if (user.role === 'admin' || user.role === 'hr') {
    return checkPermission(user, 'EmployeesProfile', 'write');
  }
  
  if (user.role === 'employee') {
    const currentUserId = user.employeeId || user.email;
    return currentUserId === profileEmployeeId && checkPermission(user, 'EmployeesProfile', 'write');
  }
  
  return false;
};

// Sensitive data - Admin/HR only
export const canViewSensitiveInfo = (user) => {
  return user.role === 'admin' || user.role === 'hr';
};
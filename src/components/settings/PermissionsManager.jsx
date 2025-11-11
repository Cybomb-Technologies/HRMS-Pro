// components/settings/PermissionsManager.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettings } from '@/contexts/SettingsContext';
import { Shield, Users, Save, RefreshCw } from 'lucide-react';

const PermissionsManager = () => {
  const { apiRequest, roles, modules } = useSettings();
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const permissionLevels = [
    { value: 'none', label: 'No Access', color: 'bg-gray-100 text-gray-600' },
    { value: 'read-self', label: 'Read Self', color: 'bg-blue-100 text-blue-700' },
    { value: 'read', label: 'Read Only', color: 'bg-green-100 text-green-700' },
    { value: 'crud', label: 'Full Access', color: 'bg-purple-100 text-purple-700' }
  ];

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
      initializePermissions(roles[0]);
    }
  }, [roles, selectedRole]);

  const initializePermissions = (role) => {
    const initialPermissions = {};
    modules.forEach(module => {
      const existingPermission = role.permissions?.find(p => p.module === module.module);
      initialPermissions[module.module] = existingPermission?.accessLevel || 'none';
    });
    setPermissions(initialPermissions);
  };

  const handleRoleChange = (roleId) => {
    const role = roles.find(r => r._id === roleId);
    setSelectedRole(role);
    initializePermissions(role);
    setSuccess(null);
    setError(null);
  };

  const handlePermissionChange = (module, accessLevel) => {
    setPermissions(prev => ({
      ...prev,
      [module]: accessLevel
    }));
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      setError(null);

      const permissionsArray = Object.entries(permissions).map(([module, accessLevel]) => ({
        module,
        accessLevel
      }));

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';

      const response = await apiRequest(`${baseUrl}/api/settings/roles/${selectedRole._id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: permissionsArray })
      });

      if (response.success) {
        setSuccess('Permissions updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to save permissions');
      }
    } catch (err) {
      setError(err.message || 'Failed to save permissions');
      console.error('Error saving permissions:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getPermissionColor = (level) => {
    const permission = permissionLevels.find(p => p.value === level);
    return permission ? permission.color : 'bg-gray-100 text-gray-600';
  };

  const getPermissionLabel = (level) => {
    const permission = permissionLevels.find(p => p.value === level);
    return permission ? permission.label : 'No Access';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading permissions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Role Permissions Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Messages */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg border border-green-200">
            {success}
          </div>
        )}

        {/* Role Selection */}
        <div className="space-y-2">
          <Label htmlFor="role-select">Select Role</Label>
          <Select 
            value={selectedRole?._id} 
            onValueChange={handleRoleChange}
            disabled={roles.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={roles.length === 0 ? "No roles available" : "Choose a role"} />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role._id} value={role._id}>
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{role.name}</span>
                    <div className="flex items-center gap-2 ml-2">
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          System
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {role.userCount || 0} users
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Permissions Grid */}
        {selectedRole && modules.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Permissions for {selectedRole.name}
                </h3>
                {selectedRole.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedRole.description}
                  </p>
                )}
              </div>
              <Button 
                onClick={savePermissions} 
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Permissions'}
              </Button>
            </div>

            <div className="grid gap-4">
              {modules.map(module => (
                <div key={module.module} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold capitalize">{module.label}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {module.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {module.pages.map(page => (
                          <Badge key={page.path} variant="outline" className="text-xs">
                            {page.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Select
                      value={permissions[module.module] || 'none'}
                      onValueChange={(value) => handlePermissionChange(module.module, value)}
                    >
                      <SelectTrigger className={`w-40 ${getPermissionColor(permissions[module.module] || 'none')}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${level.color.split(' ')[0]}`} />
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className={`mt-3 p-2 rounded text-sm ${getPermissionColor(permissions[module.module] || 'none')}`}>
                    Current: {getPermissionLabel(permissions[module.module] || 'none')}
                    {permissions[module.module] === 'none' && ' - No access to this module'}
                    {permissions[module.module] === 'read-self' && ' - Can only view their own data'}
                    {permissions[module.module] === 'read' && ' - Can view all data but cannot modify'}
                    {permissions[module.module] === 'crud' && ' - Full access: create, read, update, and delete'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!selectedRole || modules.length === 0) && (
          <div className="text-center p-6 text-muted-foreground">
            {roles.length === 0 ? 'No roles available' : 'No modules available for permissions'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PermissionsManager;
// components/settings/RoleDialog.jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettings } from '../../contexts/SettingsContext';

const RoleDialog = ({ isOpen, onClose, role, onSuccess, availablePages = [] }) => {
  const { apiRequest } = useSettings();

  // Create empty permissions from available pages
  const getEmptyPermissions = () => {
    const modules = [...new Set(availablePages.map(page => page.module))];
    return modules.reduce((acc, module) => {
      acc[module] = 'none';
      return acc;
    }, {});
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: getEmptyPermissions(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const permissionLevels = [
    { value: 'crud', label: 'Full Access', description: 'Create, read, update, delete' },
    { value: 'read', label: 'Read Only', description: 'View data only' },
    { value: 'read-self', label: 'Read Self', description: 'View own data only' },
    { value: 'none', label: 'No Access', description: 'No access to this module' }
  ];

  // Group pages by module
  const groupedPages = availablePages.reduce((acc, page) => {
    if (!acc[page.module]) {
      acc[page.module] = [];
    }
    acc[page.module].push(page);
    return acc;
  }, {});

  // populate form when editing a role
  useEffect(() => {
    if (isOpen) {
      if (role) {
        setFormData({
          name: role.name || '',
          description: role.description || '',
          permissions: { ...getEmptyPermissions(), ...(role.permissions || {}) }
        });
      } else {
        setFormData({ 
          name: '', 
          description: '', 
          permissions: getEmptyPermissions() 
        });
      }
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, role]);

  const handlePermissionChange = (module, level) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [module]: level }
    }));
  };

  const validate = () => {
    if (!formData.name || formData.name.trim().length < 2) {
      setError('Role name is required (min 2 characters)');
      return false;
    }
    
    // Check if name contains only allowed characters
    if (!/^[a-zA-Z0-9-_ ]+$/.test(formData.name)) {
      setError('Role name can only contain letters, numbers, spaces, hyphens, and underscores');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    try {
      setLoading(true);

      const url = role ? `http://localhost:5000/api/settings/roles/${encodeURIComponent(role._id)}` : 'http://localhost:5000/api/settings/roles';
      const method = role ? 'PUT' : 'POST';

      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (!response) throw new Error('No response from server');

      const success = response.success === true || response.status === 'ok';
      const savedRole = response.data || response.role || response;

      if (!success) {
        const msg = response.message || 'Failed to save role';
        throw new Error(msg);
      }

      if (onSuccess) onSuccess(savedRole);
    } catch (err) {
      console.error('Error saving role:', err);
      setError(err.message || 'Unexpected error saving role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            {role?.isSystem 
              ? 'Editing system role permissions. System roles are automatically created from user accounts.'
              : 'Define the role and its permissions across the system.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., manager, supervisor, team-lead"
                disabled={!!(role && role.isSystem)}
              />
              {role?.isSystem && (
                <p className="text-xs text-muted-foreground">
                  System role name cannot be changed
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of this role"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Page Permissions</Label>
            <p className="text-sm text-muted-foreground">
              Set permissions for each module. All pages within a module will share the same permission level.
            </p>
            
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              {Object.entries(groupedPages).map(([module, pages]) => (
                <div key={module} className="bg-background rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold capitalize">{module}</h4>
                      <p className="text-xs text-muted-foreground">
                        {pages.length} page{pages.length !== 1 ? 's' : ''}: {pages.map(p => p.label).join(', ')}
                      </p>
                    </div>

                    <Select
                      value={formData.permissions[module] || 'none'}
                      onValueChange={(value) => handlePermissionChange(module, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{level.label}</span>
                              <span className="text-xs text-muted-foreground">{level.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDialog;
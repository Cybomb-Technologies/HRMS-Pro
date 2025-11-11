// components/settings/RoleManager.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Shield,
  Building,
  User,
  RefreshCw
} from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const RoleManager = () => {
  const { roles, apiRequest, fetchSettingsData } = useSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getRoleIcon = (roleName) => {
    if (!roleName) return <Users className="w-4 h-4" />;
    
    switch(roleName.toLowerCase()) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'hr': return <Users className="w-4 h-4" />;
      case 'employee': return <User className="w-4 h-4" />;
      case 'employer': return <Building className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getAccessLevels = (permissions = []) => {
    const levels = {
      crud: 0,
      read: 0,
      'read-self': 0,
      none: 0
    };

    permissions.forEach(permission => {
      if (permission.accessLevel in levels) {
        levels[permission.accessLevel]++;
      }
    });

    return levels;
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';

      const response = await apiRequest(`${baseUrl}/api/settings/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        // Refresh the roles list
        await fetchSettingsData();
      } else {
        throw new Error(response.message || 'Failed to delete role');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err.message || 'Failed to delete role');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading roles...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Role Management</span>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Add Role
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-4">
            {error}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Access Levels</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              roles.map(role => {
                const accessLevels = getAccessLevels(role.permissions);
                
                return (
                  <TableRow key={role._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-muted rounded-lg">
                          {getRoleIcon(role.name)}
                        </div>
                        <span className="font-medium capitalize">{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isSystem ? "default" : "secondary"}>
                        {role.isSystem ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {role.userCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {accessLevels.crud > 0 && (
                          <Badge className="bg-purple-100 text-purple-700">Full: {accessLevels.crud}</Badge>
                        )}
                        {accessLevels.read > 0 && (
                          <Badge className="bg-green-100 text-green-700">Read: {accessLevels.read}</Badge>
                        )}
                        {accessLevels['read-self'] > 0 && (
                          <Badge className="bg-blue-100 text-blue-700">Self: {accessLevels['read-self']}</Badge>
                        )}
                        {Object.values(accessLevels).every(count => count === 0) && (
                          <Badge variant="outline">No permissions</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!role.isSystem && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteRole(role._id, role.name)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RoleManager;
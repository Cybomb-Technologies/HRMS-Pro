// components/settings/sections/RolesPermissions.jsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PermissionsManager from './PermissionsManager';
import RoleManager from './RoleManager';

const RolesPermissions = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Manage user roles and their access permissions across the system
        </p>
      </div>

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="permissions">Permissions Management</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions">
          <PermissionsManager />
        </TabsContent>
        
        <TabsContent value="roles">
          <RoleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RolesPermissions;
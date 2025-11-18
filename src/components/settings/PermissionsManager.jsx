// components/settings/PermissionsManager.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Save, RefreshCw, Users, CheckCircle, XCircle } from "lucide-react";

const PermissionsManager = () => {
  // Default modules data
  const defaultModules = [
    {
      module: "dashboard",
      label: "Dashboard",
      description: "Access to main dashboard and analytics"
    },
    {
      module: "EmployeesProfile",
      label: "EmployeesProfile",
      description: "Manage employee profiles and personal information" // ✅ FIX DESCRIPTION"
    },
    {
      module: "employees",
      label: "Employees",
      description: "Manage employee records"
    },
     {
      module: "Teams",
      label: "Teams",
      description: "Manage Teams records and profiles"
    },
    {
      module: "attendance",
      label: "Attendance",
      description: "Track and manage attendance records"
    },
    {
      module: "payroll",
      label: "Payroll",
      description: "Process and manage payroll data"
    },
    {
      module: "reports",
      label: "Reports",
      description: "Generate and view system reports"
    },
    {
      module: "settings",
      label: "Settings",
      description: "Configure system settings"
    }
  ];

  // Default roles data (will be replaced with API data)
  const defaultRoles = [
    {
      _id: "1",
      name: "admin",
      description: "Full system access with all permissions",
      permissions: [],
      userCount: 3
    },
    {
      _id: "2", 
      name: "hr",
      description: "Human Resources management access",
      permissions: [],
      userCount: 5
    },
    {
      _id: "3",
      name: "employee", 
      description: "Basic employee self-service access",
      permissions: [],
      userCount: 45
    }
  ];

  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState(defaultModules);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const accessTypes = [
    { key: "read", label: "Read", color: "blue" },
    { key: "write", label: "Write", color: "orange" },
    { key: "create", label: "Create", color: "green" },
    { key: "delete", label: "Delete", color: "red" }
  ];

  // API request function
  const apiRequest = async (url, method = 'GET', data = null) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong');
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  const convertAccessToFlags = (level) => {
    switch (level) {
      case "read":
        return { read: true, write: false, create: false, delete: false };
      case "read-self":
        return { read: true, write: false, create: false, delete: false };
      case "crud":
        return { read: true, write: true, create: true, delete: true };
      default:
        return { read: false, write: false, create: false, delete: false };
    }
  };

  const convertFlagsToAccess = (flags) => {
    if (!flags.read && !flags.write && !flags.create && !flags.delete) return "none";
    if (flags.read && !flags.write && !flags.create && !flags.delete) return "read";
    if (flags.read && flags.write && flags.create && flags.delete) return "crud";
    return "custom";
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case "none": return "gray";
      case "read": return "blue";
      case "read-self": return "purple";
      case "crud": return "green";
      case "custom": return "orange";
      default: return "gray";
    }
  };

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('http://localhost:5000/api/settings/roles/roles');
      setRoles(response.data || defaultRoles);
      
      // Select first role by default
      if (response.data && response.data.length > 0) {
        setSelectedRole(response.data[0]);
        initializePermissions(response.data[0]);
      } else {
        // Fallback to default roles
        setRoles(defaultRoles);
        setSelectedRole(defaultRoles[0]);
        initializePermissions(defaultRoles[0]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Fallback to default roles if API fails
      setRoles(defaultRoles);
      setSelectedRole(defaultRoles[0]);
      initializePermissions(defaultRoles[0]);
    } finally {
      setLoading(false);
    }
  };

  const initializePermissions = (role) => {
    const initial = {};
    modules.forEach((m) => {
      const found = role.permissions?.find((p) => p.module === m.module);
      const level = found?.accessLevel || "none";
      initial[m.module] = convertAccessToFlags(level);
    });
    setPermissions(initial);
    setError(null);
    setSuccess(null);
  };

  const handleCheckbox = (module, field) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [field]: !prev[module][field],
        // Automatically enable read if any other permission is enabled
        ...(field !== "read" && !prev[module][field] ? { read: true } : {}),
      },
    }));
  };

  const savePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      setError(null);

      const permissionsArray = Object.entries(permissions).map(
        ([module, flags]) => ({
          module,
          accessLevel: convertFlagsToAccess(flags),
        })
      );

      // API call to update permissions
      await apiRequest(
        `http://localhost:5000/api/settings/roles/roles/${selectedRole._id}/permissions`, 
        'PUT', 
        { permissions: permissionsArray }
      );

      setSuccess('Permissions updated successfully!');
      
      // Refresh roles data
      fetchRoles();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err.message || 'Failed to save permissions';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    initializePermissions(role);
  };

  // Load roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" />
            <span className="text-lg">Loading permissions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* LEFT SIDEBAR - ROLES LIST */}
      <div className="w-full lg:w-64 flex-shrink-0">
        <Card className="sticky top-6">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              Roles
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="space-y-1 py-2">
              {roles.map((role) => (
                <button
                  key={role._id}
                  onClick={() => handleRoleChange(role)}
                  className={`w-full text-left p-4 transition-all duration-200 ${
                    selectedRole?._id === role._id
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600 font-semibold shadow-sm"
                      : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium">{role.name}</span>
                    {selectedRole?._id === role._id && (
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Users className="w-3 h-3" />
                    <span>{role.userCount || 0} users</span>
                  </div>

                  <p className="text-xs text-gray-400 mt-1 text-left">
                    {role.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT CONTENT - PERMISSIONS */}
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span className="capitalize text-blue-600">{selectedRole?.name}</span>
                </CardTitle>
                {/* <p className="text-sm text-gray-500 mt-1">
                  Configure access permissions for this role across all system modules
                </p> */}
              </div>

              <Button 
                onClick={savePermissions} 
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                size="lg"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving Changes..." : "Save Permissions"}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Status Messages */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-6 flex items-center gap-3">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 mb-6 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Success</p>
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            )}

            {/* Permissions Grid */}
            <div className="space-y-6">
              {modules.map((module) => {
                const modulePermissions = permissions[module.module] || {
                  read: false,
                  write: false,
                  create: false,
                  delete: false,
                };

                const accessLevel = convertFlagsToAccess(modulePermissions);
                const accessColor = getAccessLevelColor(accessLevel);

                return (
                  <div key={module.module} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg capitalize text-gray-900">
                          {module.label}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                      </div>

                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium capitalize ${
                          accessLevel === 'none' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                          accessLevel === 'read' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          accessLevel === 'crud' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        {accessLevel} Access
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {accessTypes.map((access) => (
                        <label
                          key={access.key}
                          className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                            modulePermissions[access.key]
                              ? access.key === 'read' ? 'border-blue-300 bg-blue-50' :
                                access.key === 'write' ? 'border-orange-300 bg-orange-50' :
                                access.key === 'create' ? 'border-green-300 bg-green-50' :
                                'border-red-300 bg-red-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={modulePermissions[access.key]}
                            onChange={() => handleCheckbox(module.module, access.key)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            disabled={access.key !== "read" && !modulePermissions.read}
                          />
                          <span className={`font-medium ${
                            modulePermissions[access.key] 
                              ? access.key === 'read' ? 'text-blue-700' :
                                access.key === 'write' ? 'text-orange-700' :
                                access.key === 'create' ? 'text-green-700' :
                                'text-red-700'
                              : 'text-gray-700'
                          }`}>
                            {access.label}
                          </span>
                          {access.key !== "read" && !modulePermissions.read && (
                            <span className="text-xs text-gray-400 ml-auto">(Read required)</span>
                          )}
                        </label>
                      ))}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPermissions(prev => ({
                            ...prev,
                            [module.module]: { read: true, write: false, create: false, delete: false }
                          }));
                        }}
                        className="text-xs"
                      >
                        Read Only
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPermissions(prev => ({
                            ...prev,
                            [module.module]: { read: true, write: true, create: true, delete: true }
                          }));
                        }}
                        className="text-xs"
                      >
                        Full Access
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPermissions(prev => ({
                            ...prev,
                            [module.module]: { read: false, write: false, create: false, delete: false }
                          }));
                        }}
                        className="text-xs"
                      >
                        No Access
                      </Button>
                    </div>
                  </div>
                );
              })}

              {modules.length === 0 && (
                <div className="text-center p-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium">No modules available</p>
                  <p className="text-sm mt-1">System modules will appear here once configured.</p>
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-2">Permission Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {modules.map(module => {
                  const level = convertFlagsToAccess(permissions[module.module] || {});
                  return (
                    <div key={module.module} className="flex items-center justify-between">
                      <span className="capitalize text-gray-600">{module.label}:</span>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {level}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PermissionsManager;
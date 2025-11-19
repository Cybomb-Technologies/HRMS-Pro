import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Plus,
  Target,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Clock,
  User,
  Eye,
  Search,
  Shield,
  UserCheck,
  Building,
  MapPinned,
  Activity
} from 'lucide-react';

const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null;
  if (profilePicture.startsWith('http')) return profilePicture;
  return `http://localhost:5000${profilePicture}`;
};

// Timezone utility functions
const getTimezones = () => {
  if (typeof Intl !== 'undefined' && Intl.supportedValuesOf) {
    try {
      const timeZones = Intl.supportedValuesOf('timeZone');
      return timeZones.map(zone => {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: zone,
          timeZoneName: 'shortOffset'
        });
        const offset = formatter.formatToParts(date)
          .find(part => part.type === 'timeZoneName')?.value || 'UTC';
        return {
          value: zone,
          label: `(${offset}) ${zone.replace(/_/g, ' ').replace('/', ' / ')}`,
        };
      }).sort((a, b) => a.label.localeCompare(b.label));
    } catch (err) {
      return [{ value: 'UTC', label: 'UTC' }];
    }
  }
  return [{ value: 'UTC', label: 'UTC' }];
};

const OrganizationForm = ({ item, type, employees, departments, onSave, onCancel }) => {
  const [formData, setFormData] = useState(item || {});
  const [loading, setLoading] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');

  // Generate timezones list
  const allTimezones = useMemo(getTimezones, []);
  
  // Filter timezones based on search input
  const filteredTimezones = allTimezones.filter(tz => 
    tz.label.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Employees state updated:', employees);
  }, [employees]);

  const renderFields = () => {
    switch (type) {
      case 'departments':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="departmentId">Department ID *</Label>
              <Input 
                id="departmentId" 
                name="departmentId" 
                value={formData.departmentId || ''} 
                onChange={handleChange} 
                required 
                placeholder="e.g., DEV, HR, FIN"
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                required 
                placeholder="Enter department name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="head">Department Head</Label>
              <select
                id="head"
                name="head"
                value={formData.head || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department Head</option>
                {console.log('Employees data:', employees)}
                {employees.map(employee => {
                  const employeeName = employee.name || employee.fullName || employee.employeeName || 'Unknown';
                  const employeeId = employee.employeeId || employee.id || employee._id || 'N/A';
                  const employeeDesignation = employee.designation || employee.role || employee.title || 'N/A';
                  
                  return (
                    <option key={employee._id || employee.id} value={employeeId}>
                      {employeeName} - {employeeId} ({employeeDesignation})
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500">
                Select an employee by their Employee ID
              </p>
            </div>
           
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                name="description" 
                value={formData.description || ''} 
                onChange={handleChange} 
                placeholder="Enter department description"
              />
            </div>
          </>
        );
      case 'designations':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Designation Title *</Label>
              <Input 
                id="title" 
                name="title" 
                value={formData.title || ''} 
                onChange={handleChange} 
                required 
                placeholder="Enter designation title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level *</Label>
              <Input 
                id="level" 
                name="level" 
                value={formData.level || ''} 
                onChange={handleChange} 
                required 
                placeholder="e.g., Junior, Senior, Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                name="department"
                value={formData.department || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept.departmentId}>
                    {dept.departmentId} - {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                name="description" 
                value={formData.description || ''} 
                onChange={handleChange} 
                placeholder="Enter designation description"
              />
            </div>
          </>
        );
      case 'locations':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name || ''} 
                onChange={handleChange} 
                required 
                placeholder="Enter location name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                name="address" 
                value={formData.address || ''} 
                onChange={handleChange} 
                placeholder="Enter full address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city || ''} 
                  onChange={handleChange} 
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={formData.state || ''} 
                  onChange={handleChange} 
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={formData.country || ''} 
                  onChange={handleChange} 
                  placeholder="Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input 
                  id="postalCode" 
                  name="postalCode" 
                  value={formData.postalCode || ''} 
                  onChange={handleChange} 
                  placeholder="Postal code"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={formData.timezone || 'UTC'}
                onValueChange={(value) => handleSelectChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="p-2 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search timezone..."
                        className="pl-8"
                        value={timezoneSearch}
                        onChange={(e) => setTimezoneSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <SelectGroup>
                    {filteredTimezones.length > 0 ? (
                      filteredTimezones.map((tz) => (
                        <SelectItem 
                          key={tz.value} 
                          value={tz.value}
                        >
                          {tz.label}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No timezones found.
                      </div>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderFields()}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const EmployeeListModal = ({ type, item, employees, onClose }) => {
  if (!item || !employees) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Employees in {type === 'department' ? `${item.departmentId} - ${item.name}` : item}
          </DialogTitle>
          <DialogDescription>
            {employees.length} employee(s) found
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {employees.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No employees are assigned to this {type}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((employee, index) => (
                <motion.div
                  key={employee._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {employee.profilePicture || employee.profilePhoto ? (
                          <img
                            src={getProfilePictureUrl(employee.profilePicture || employee.profilePhoto)}
                            alt={employee.name}
                            className="w-12 h-12 rounded-xl object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {employee.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {employee.employeeId}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {employee.designation} {employee.department && `• ${employee.department}`}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const OrganizationSection = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [viewingEmployees, setViewingEmployees] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  // ✅ NEW: Role-based permission states
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);

  // JWT token decode function
  const decodeJWT = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  // ✅ NEW: Get current user role and permissions
  useEffect(() => {
    const initializeUserPermissions = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        if (token) {
          const decoded = decodeJWT(token);
          console.log("🔐 Decoded user data:", decoded);
          
          if (decoded && decoded.role) {
            setCurrentUserRole(decoded.role);
            await fetchUserPermissions(decoded.role);
          } else {
            setCurrentUserRole('employee');
          }
        } else {
          setCurrentUserRole('employee');
        }
      } catch (error) {
        console.error("Error initializing permissions:", error);
        setCurrentUserRole('employee');
      }
    };

    initializeUserPermissions();
  }, []);

  const fetchUserPermissions = async (role) => {
    try {
      console.log("🔍 Fetching permissions for role:", role);
      const res = await fetch('http://localhost:5000/api/settings/roles/roles');
      
      if (res.ok) {
        const data = await res.json();
        console.log("📋 All roles data:", data.data);
        
        const userRoleData = data.data.find(r => r.name === role);
        console.log("🎯 User role data:", userRoleData);
        
        if (userRoleData) {
          const organizationPermission = userRoleData.permissions.find(p => p.module === 'Organization');
          console.log("🏢 Organization permission:", organizationPermission);
          setUserPermissions(userRoleData.permissions);
        } else {
          console.log("❌ Role not found in database:", role);
          setUserPermissions([]);
        }
      } else {
        console.log("❌ API failed, using default permissions");
        setUserPermissions(getDefaultPermissions(role));
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setUserPermissions(getDefaultPermissions(role));
    }
  };

  // Fallback permissions if API fails
  const getDefaultPermissions = (role) => {
    const defaults = {
      admin: [{ module: 'Organization', accessLevel: 'crud' }],
      hr: [{ module: 'Organization', accessLevel: 'crud' }],
      employee: [{ module: 'Organization', accessLevel: 'read' }]
    };
    return defaults[role] || [];
  };

  // ✅ UPDATED: Correct Permission check function
  const hasPermission = (action) => {
    // Admin ku full access
    if (currentUserRole === 'admin') return true;
    
    // Find Organization module permission
    const organizationPermission = userPermissions.find(p => p.module === 'Organization');
    if (!organizationPermission) {
      console.log("❌ No Organization permission found for role:", currentUserRole);
      return false;
    }

    const accessLevel = organizationPermission.accessLevel;
    console.log(`🔐 Checking ${action} permission for ${currentUserRole}:`, accessLevel);
    
    // ✅ UPDATED CORRECT LOGIC:
    switch (action) {
      case 'read':
        // Read access for: read, custom, crud
        return ['read', 'custom', 'crud'].includes(accessLevel);
      case 'create':
        // Create access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      case 'update':
        // Update access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      case 'delete':
        // Delete access ONLY for crud (custom la delete illa)
        return accessLevel === 'crud';
      case 'view_employees':
        // View employees access for: read, custom, crud
        return ['read', 'custom', 'crud'].includes(accessLevel);
      default:
        return false;
    }
  };

  // ✅ Check read permission on component load
  useEffect(() => {
    if (currentUserRole && !hasPermission('read')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to view organization data" 
      });
      setItems([]);
    }
  }, [currentUserRole, userPermissions]);

  // Get token with better error handling
  const getToken = () => {
    try {
      const token = localStorage.getItem('hrms_token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  };

  // Enhanced fetch with better error handling
  const apiFetch = async (url, options = {}) => {
    const token = getToken();
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
      localStorage.removeItem('hrms_token');
      window.location.href = '/login';
      throw new Error('Authentication failed. Please login again.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/employees');
      
      if (!res.ok) {
        throw new Error(`Failed to fetch employees: ${res.status}`);
      }
      
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch employees',
        variant: 'destructive'
      });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchEmployees(); 
  }, []);

  // Fetch departments list
  const fetchDepartments = async () => {
    try {
      const result = await apiFetch('http://localhost:5000/api/organization/departments');
      if (result.success) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // In OrganizationSection.jsx - Update fetchItems function
  const fetchItems = async () => {
    // Check read permission before fetching
    if (!hasPermission('read')) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const result = await apiFetch(`http://localhost:5000/api/organization/${activeTab}`);
      if (result.success) {
        // For departments, ensure headcount is calculated
        if (activeTab === 'departments') {
          const departmentsWithHeadcount = await Promise.all(
            result.data.map(async (dept) => {
              try {
                // Fetch employees for this department to get accurate count
                const empResult = await apiFetch(`http://localhost:5000/api/organization/departments/${dept.departmentId}/employees`);
                return {
                  ...dept,
                  headcount: empResult.success ? empResult.data.employees.length : 0
                };
              } catch (error) {
                console.error(`Error fetching employees for department ${dept.departmentId}:`, error);
                return { ...dept, headcount: 0 };
              }
            })
          );
          setItems(departmentsWithHeadcount);
        } else {
          setItems(result.data);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: `Failed to load ${activeTab}: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeList = async (type, id) => {
    // Check view_employees permission
    if (!hasPermission('view_employees')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to view employee lists" 
      });
      return;
    }

    setLoadingEmployees(true);
    try {
      let url = '';
      if (type === 'department') {
        url = `http://localhost:5000/api/organization/departments/${id}/employees`;
      } else if (type === 'designation') {
        url = `http://localhost:5000/api/organization/designations/${id}/employees`;
      } else if (type === 'location') {
        url = `http://localhost:5000/api/organization/locations/${id}/employees`;
      }

      const result = await apiFetch(url);
      if (result.success) {
        setEmployeeList(result.data.employees || []);
        setViewingEmployees({ type, item: result.data.department || id });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: `Failed to load employees: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [activeTab, currentUserRole, userPermissions]);

  const handleAddNew = () => {
    // Check create permission
    if (!hasPermission('create')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to create organization data" 
      });
      return;
    }
    setEditingItem({});
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    // Check update permission
    if (!hasPermission('update')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to edit organization data" 
      });
      return;
    }
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = (item) => {
    // Check delete permission
    if (!hasPermission('delete')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to delete organization data" 
      });
      return;
    }
    setDeletingItem(item);
  };

  const handleViewEmployees = (item) => {
    // Check view_employees permission
    if (!hasPermission('view_employees')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to view employee lists" 
      });
      return;
    }

    if (activeTab === 'departments') {
      fetchEmployeeList('department', item.departmentId);
    } else if (activeTab === 'designations') {
      fetchEmployeeList('designation', item.title);
    } else if (activeTab === 'locations') {
      fetchEmployeeList('location', item.name);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      const result = await apiFetch(
        `http://localhost:5000/api/organization/${activeTab}/${deletingItem._id}`,
        { method: 'DELETE' }
      );
      
      if (result.success) {
        toast({ 
          title: 'Success', 
          description: `${activeTab.slice(0, -1)} deleted successfully.` 
        });
        fetchItems();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: `Failed to delete ${activeTab.slice(0, -1)}: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setDeletingItem(null);
    }
  };

  const handleSave = async (itemData) => {
    try {
      const url = itemData._id 
        ? `http://localhost:5000/api/organization/${activeTab}/${itemData._id}`
        : `http://localhost:5000/api/organization/${activeTab}`;
      
      const method = itemData._id ? 'PUT' : 'POST';

      const result = await apiFetch(url, {
        method,
        body: JSON.stringify(itemData)
      });
      
      if (result.success) {
        toast({ 
          title: 'Success', 
          description: `${activeTab.slice(0, -1)} ${itemData._id ? 'updated' : 'created'} successfully.` 
        });
        setModalOpen(false);
        setEditingItem(null);
        fetchItems();
        if (activeTab === 'departments') {
          fetchDepartments(); // Refresh departments list
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: 'Error',
        description: `Failed to save ${activeTab.slice(0, -1)}: ${error.message}`,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const renderDepartments = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map((dept, index) => (
        <motion.div 
          key={dept._id} 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="p-6 card-hover border-l-4 border-l-blue-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {dept.departmentId}
                    </Badge>
                    <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {dept.headDetails 
                      ? `Head: ${dept.headDetails.name} (${dept.head})`
                      : dept.head 
                      ? `Head ID: ${dept.head}`
                      : 'No head assigned'
                    }
                  </p>
                </div>
              </div>
              <ItemMenu 
                onEdit={() => handleEdit(dept)} 
                onDelete={() => handleDelete(dept)}
                onViewEmployees={() => handleViewEmployees(dept)}
                hasUpdatePermission={hasPermission('update')}
                hasDeletePermission={hasPermission('delete')}
                hasViewEmployeesPermission={hasPermission('view_employees')}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Employees</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleViewEmployees(dept)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  disabled={!hasPermission('view_employees')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">
                    {dept.headcount || 0}
                  </span>
                </Button>
              </div>
              {dept.description && (
                <p className="text-sm text-gray-600 mt-2">{dept.description}</p>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderDesignations = () => (
    <div className="space-y-4">
      {items.map((designation, index) => (
        <motion.div 
          key={designation._id} 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{designation.title}</h3>
                  <p className="text-sm text-gray-500">
                    Level {designation.level}
                    {designation.departmentDetails && ` • ${designation.departmentDetails.departmentId} - ${designation.departmentDetails.name}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleViewEmployees(designation)}
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                  disabled={!hasPermission('view_employees')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  View Employees
                </Button>
                <ItemMenu 
                  onEdit={() => handleEdit(designation)} 
                  onDelete={() => handleDelete(designation)}
                  hasUpdatePermission={hasPermission('update')}
                  hasDeletePermission={hasPermission('delete')}
                  hasViewEmployeesPermission={hasPermission('view_employees')}
                />
              </div>
            </div>
            {designation.description && (
              <p className="text-sm text-gray-600 mt-3">{designation.description}</p>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderLocations = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((location, index) => (
        <motion.div 
          key={location._id} 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card className="p-6 card-hover border-l-4 border-l-green-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{location.name}</h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{location.timezone || 'UTC'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleViewEmployees(location)}
                  className="text-green-600 hover:text-green-800 hover:bg-green-50"
                  disabled={!hasPermission('view_employees')}
                >
                  <Users className="w-4 h-4 mr-1" />
                </Button>
                <ItemMenu 
                  onEdit={() => handleEdit(location)} 
                  onDelete={() => handleDelete(location)}
                  hasUpdatePermission={hasPermission('update')}
                  hasDeletePermission={hasPermission('delete')}
                  hasViewEmployeesPermission={hasPermission('view_employees')}
                />
              </div>
            </div>
            <div className="space-y-2">
              {location.address && (
                <p className="text-sm text-gray-600">{location.address}</p>
              )}
              {(location.city || location.state) && (
                <p className="text-sm text-gray-600">
                  {[location.city, location.state].filter(Boolean).join(', ')}
                  {location.country && `, ${location.country}`}
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const ItemMenu = ({ 
    onEdit, 
    onDelete, 
    onViewEmployees, 
    hasUpdatePermission, 
    hasDeletePermission, 
    hasViewEmployeesPermission 
  }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {onViewEmployees && hasViewEmployeesPermission && (
          <DropdownMenuItem onClick={onViewEmployees}>
            <Eye className="mr-2 h-4 w-4" /> View Employees
          </DropdownMenuItem>
        )}
        {hasUpdatePermission && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </DropdownMenuItem>
        )}
        {hasDeletePermission && (
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        )}
        {!hasUpdatePermission && !hasDeletePermission && !hasViewEmployeesPermission && (
          <DropdownMenuItem disabled>
            <Shield className="mr-2 h-4 w-4" /> No Actions Available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderContent = () => {
    if (!hasPermission('read')) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">
              You don't have permission to view organization data.
            </p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'departments':
        return renderDepartments();
      case 'designations':
        return renderDesignations();
      case 'locations':
        return renderLocations();
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    if (editingItem?._id) {
      return `Edit ${activeTab.slice(0, -1)}`;
    }
    return `Add New ${activeTab.slice(0, -1)}`;
  };

  return (
    <>
      <Helmet>
        <title>Organization - HRMS Pro</title>
        <meta name="description" content="Manage departments, designations, locations, and company communications with HRMS Pro organization tools" />
      </Helmet>

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization</h1>
            <p className="text-gray-600 mt-2">
              Manage departments, designations, and locations across your organization
            </p>
          </div>
          
          {/* ✅ Permission-based Add New Button */}
          {hasPermission('create') && (
            <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['departments', 'designations', 'locations'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Employee List Modal */}
        {viewingEmployees && (
          <EmployeeListModal
            type={viewingEmployees.type}
            item={viewingEmployees.item}
            employees={employeeList}
            onClose={() => {
              setViewingEmployees(null);
              setEmployeeList([]);
            }}
          />
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{getModalTitle()}</DialogTitle>
              <DialogDescription>
                {editingItem?._id 
                  ? `Update the ${activeTab.slice(0, -1)} information below.`
                  : `Create a new ${activeTab.slice(0, -1)} by filling in the details below.`
                }
              </DialogDescription>
            </DialogHeader>
            <OrganizationForm
              item={editingItem}
              type={activeTab}
              employees={employees}
              departments={departments}
              onSave={handleSave}
              onCancel={() => {
                setModalOpen(false);
                setEditingItem(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the {activeTab.slice(0, -1)} 
                {deletingItem && ` "${deletingItem.name || deletingItem.title}"`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>

        {/* ✅ Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs">
            <div className="font-bold mb-2">🔐 Permission Debug</div>
            <div>Role: {currentUserRole}</div>
            <div>Organization Access: {userPermissions.find(p => p.module === 'Organization')?.accessLevel || 'none'}</div>
            <div className="mt-1">
              <div>Read: {hasPermission('read').toString()}</div>
              <div>Create: {hasPermission('create').toString()}</div>
              <div>Edit: {hasPermission('update').toString()}</div>
              <div>Delete: {hasPermission('delete').toString()}</div>
              <div>View Employees: {hasPermission('view_employees').toString()}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrganizationSection;
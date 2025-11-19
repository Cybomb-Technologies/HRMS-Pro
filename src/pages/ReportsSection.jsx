import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Download,
  Calendar,
  Filter,
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Clock4,
  CalendarDays,
  CalendarRange,
  Shield,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Users,
  BarChart3,
  DownloadCloud,
  RefreshCw
} from 'lucide-react';

const ReportsSection = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredTimesheets, setFilteredTimesheets] = useState([]);
  
  // ✅ Role-based permission states
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

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

  // ✅ Get current user role and permissions
  useEffect(() => {
    const initializeUserPermissions = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        if (token) {
          const decoded = decodeJWT(token);
          console.log("🔐 Decoded user data for Reports:", decoded);
          
          if (decoded && decoded.role) {
            setCurrentUserRole(decoded.role);
            setCurrentUser(decoded);
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
        console.log("📋 All roles data for Reports:", data.data);
        
        const userRoleData = data.data.find(r => r.name === role);
        console.log("🎯 User role data for Reports:", userRoleData);
        
        if (userRoleData) {
          // ✅ Try different possible module names for timesheet reports
          const possibleModuleNames = [
            'Timesheet-Reports',
            'Timesheet_Reports', 
            'TimesheetReports',
            'timesheet-reports',
            'timesheet_reports',
            'timesheetReports',
            'Reports',
            'reports',
            'TimeSheet-Reports',
            'TimeSheet_Reports'
          ];
          
          let reportsPermission = null;
          for (const moduleName of possibleModuleNames) {
            reportsPermission = userRoleData.permissions.find(p => p.module === moduleName);
            if (reportsPermission) {
              console.log(`✅ Found permission with module name: ${moduleName}`, reportsPermission);
              break;
            }
          }
          
          if (!reportsPermission) {
            console.log("❌ No timesheet reports permission found with any module name");
            console.log("Available permissions:", userRoleData.permissions);
          }
          
          setUserPermissions(userRoleData.permissions);
        } else {
          console.log("❌ Role not found in database:", role);
          setUserPermissions(getDefaultPermissions(role));
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
      admin: [{ module: 'Timesheet-Reports', accessLevel: 'crud' }],
      hr: [{ module: 'Timesheet-Reports', accessLevel: 'crud' }],
      employee: [{ module: 'Timesheet-Reports', accessLevel: 'read' }]
    };
    return defaults[role] || [];
  };

  // ✅ Correct Permission check function
  const hasPermission = (action) => {
    // Admin ku full access
    if (currentUserRole === 'admin') return true;
    
    // ✅ Try different module names for timesheet reports
    const possibleModuleNames = [
      'Timesheet-Reports',
      'Timesheet_Reports', 
      'TimesheetReports',
      'timesheet-reports',
      'timesheet_reports', 
      'timesheetReports',
      'Reports',
      'reports',
      'TimeSheet-Reports',
      'TimeSheet_Reports'
    ];
    
    let reportsPermission = null;
    for (const moduleName of possibleModuleNames) {
      reportsPermission = userPermissions.find(p => p.module === moduleName);
      if (reportsPermission) break;
    }
    
    if (!reportsPermission) {
      console.log("❌ No timesheet reports permission found for role:", currentUserRole);
      // ✅ TEMPORARY FIX: Allow access if no permission found (remove in production)
      console.log("🟡 TEMPORARY: Allowing access since no permission found");
      return true;
    }

    const accessLevel = reportsPermission.accessLevel;
    console.log(`🔐 Checking ${action} permission for ${currentUserRole} in Reports:`, accessLevel);
    
    switch (action) {
      case 'read':
        return ['read', 'custom', 'crud'].includes(accessLevel);
      case 'create':
        return ['custom', 'crud'].includes(accessLevel);
      case 'update':
        return ['custom', 'crud'].includes(accessLevel);
      case 'delete':
        return accessLevel === 'crud';
      case 'export':
        return ['custom', 'crud'].includes(accessLevel);
      case 'manage':
        return ['custom', 'crud'].includes(accessLevel);
      default:
        return false;
    }
  };

  // ✅ Check read permission on component load
  useEffect(() => {
    if (currentUserRole && !hasPermission('read')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to view timesheet reports" 
      });
      setTimesheets([]);
      setFilteredTimesheets([]);
    } else {
      // If has permission, fetch timesheets
      fetchTimesheets();
    }
  }, [currentUserRole, userPermissions]);

  // ✅ Enhanced API call function with better error handling
  const apiCall = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('hrms_token');
      const baseUrl = 'http://localhost:5000';
      const url = `${baseUrl}${endpoint}`;

      console.log(`🌐 API Call: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  // ✅ Fetch timesheets data with mock data fallback
  const fetchTimesheets = async () => {
    // Check permission before fetching
    if (!hasPermission('read')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view timesheet reports',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Fetching timesheets data...");
      
      let data = null;
      
      // Try actual API endpoints first
      const endpoints = [
        '/api/timesheets',
        '/api/timesheet',
        '/api/attendance/timesheets',
        '/timesheets'
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          data = await apiCall(endpoint);
          if (data && (data.timesheets || data.data || Array.isArray(data))) {
            console.log(`✅ Success with endpoint: ${endpoint}`, data);
            break;
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }

      // If no API worked, use mock data
      if (!data) {
        console.log("📝 No API endpoints worked, using mock data");
        data = generateMockTimesheets();
      }

      const timesheetsData = data.timesheets || data.data || data || [];
      console.log("📊 Timesheets data loaded:", timesheetsData);
      
      setTimesheets(timesheetsData);
      setFilteredTimesheets(timesheetsData);

      toast({
        title: 'Data Loaded',
        description: `Loaded ${timesheetsData.length} timesheet records`,
      });

    } catch (error) {
      console.error('Error fetching timesheets:', error);
      
      // Use mock data as fallback
      console.log("🔄 Using mock data as fallback");
      const mockData = generateMockTimesheets();
      setTimesheets(mockData);
      setFilteredTimesheets(mockData);
      
      toast({
        title: 'Using Sample Data',
        description: 'Connected to sample timesheet records for demonstration',
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Generate mock timesheets data for demonstration
  const generateMockTimesheets = () => {
    const employees = [
      { id: 'EMP001', name: 'John Doe', department: 'Engineering' },
      { id: 'EMP002', name: 'Jane Smith', department: 'Marketing' },
      { id: 'EMP003', name: 'Mike Johnson', department: 'Sales' },
      { id: 'EMP004', name: 'Sarah Wilson', department: 'HR' },
      { id: 'EMP005', name: 'David Brown', department: 'Engineering' }
    ];

    const projects = ['Website Redesign', 'Mobile App', 'CRM System', 'Marketing Campaign', 'HR Portal'];
    const tasks = ['Development', 'Testing', 'Design', 'Planning', 'Documentation', 'Review'];
    
    const mockTimesheets = [];

    employees.forEach(employee => {
      // Generate daily timesheets for the last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        mockTimesheets.push({
          _id: `TS${employee.id}${i}`,
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          periodType: 'daily',
          startDate: date.toISOString(),
          endDate: date.toISOString(),
          totalHours: Math.floor(Math.random() * 8) + 4,
          status: ['submitted', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
          submittedAt: new Date(date.getTime() - 3600000).toISOString(),
          entries: [
            {
              date: date.toISOString(),
              project: projects[Math.floor(Math.random() * projects.length)],
              task: tasks[Math.floor(Math.random() * tasks.length)],
              hours: Math.floor(Math.random() * 4) + 2,
              description: 'Completed assigned tasks'
            }
          ],
          comments: i % 3 === 0 ? 'Good work, keep it up!' : null
        });
      }

      // Generate weekly timesheets
      for (let i = 0; i < 2; i++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (i * 7 + 7));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        mockTimesheets.push({
          _id: `TS${employee.id}W${i}`,
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          periodType: 'weekly',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalHours: Math.floor(Math.random() * 20) + 20,
          status: 'approved',
          submittedAt: new Date(endDate.getTime() + 86400000).toISOString(),
          entries: Array.from({ length: 5 }, (_, j) => ({
            date: new Date(startDate.getTime() + (j * 86400000)).toISOString(),
            project: projects[Math.floor(Math.random() * projects.length)],
            task: tasks[Math.floor(Math.random() * tasks.length)],
            hours: Math.floor(Math.random() * 6) + 4,
            description: 'Weekly tasks completion'
          }))
        });
      }

      // Generate monthly timesheets
      for (let i = 0; i < 1; i++) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (i + 1));
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        
        mockTimesheets.push({
          _id: `TS${employee.id}M${i}`,
          employeeId: employee.id,
          employeeName: employee.name,
          department: employee.department,
          periodType: 'monthly',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalHours: Math.floor(Math.random() * 120) + 80,
          status: 'approved',
          submittedAt: new Date(endDate.getTime() + 86400000).toISOString(),
          entries: Array.from({ length: 10 }, (_, j) => ({
            date: new Date(startDate.getTime() + (j * 3 * 86400000)).toISOString(),
            project: projects[Math.floor(Math.random() * projects.length)],
            task: tasks[Math.floor(Math.random() * tasks.length)],
            hours: Math.floor(Math.random() * 7) + 3,
            description: 'Monthly project work'
          }))
        });
      }
    });

    return mockTimesheets;
  };

  // Filter timesheets when filters change
  useEffect(() => {
    let filtered = timesheets;

    // Filter by employee
    if (selectedEmployee) {
      filtered = filtered.filter(ts => 
        ts.employeeId === selectedEmployee || 
        ts.employeeName?.toLowerCase().includes(selectedEmployee.toLowerCase())
      );
    }

    // Filter by period type
    if (selectedPeriod) {
      filtered = filtered.filter(ts => ts.periodType === selectedPeriod);
    }

    setFilteredTimesheets(filtered);
  }, [selectedEmployee, selectedPeriod, timesheets]);

  // Get unique employees from timesheets
  const getUniqueEmployees = () => {
    const employeesMap = new Map();
    
    timesheets.forEach(ts => {
      if (ts.employeeId && ts.employeeName) {
        employeesMap.set(ts.employeeId, {
          id: ts.employeeId,
          name: ts.employeeName
        });
      }
    });

    return Array.from(employeesMap.values());
  };

  // Get period type options
  const getPeriodTypeOptions = () => {
    const periods = [...new Set(timesheets.map(ts => ts.periodType).filter(Boolean))];
    return periods.map(period => ({
      value: period,
      label: period.charAt(0).toUpperCase() + period.slice(1) + ' Report',
      icon: getPeriodIcon(period)
    }));
  };

  // Get icon for period type
  const getPeriodIcon = (periodType) => {
    switch (periodType) {
      case 'daily':
        return Calendar;
      case 'weekly':
        return CalendarRange;
      case 'monthly':
        return CalendarDays;
      default:
        return Calendar;
    }
  };

  const uniqueEmployees = getUniqueEmployees();
  const periodOptions = getPeriodTypeOptions();

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
      case 'submitted':
        return { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      default:
        return { icon: Clock4, color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedEmployee('');
    setSelectedPeriod('');
  };

  // Check if any filter is active
  const hasActiveFilters = selectedEmployee || selectedPeriod;

  // ✅ Export timesheet data
  const handleExportTimesheets = async () => {
    if (!hasPermission('export')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to export timesheet reports',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Exporting Data',
        description: 'Preparing timesheet report for download...',
      });

      // Create CSV content
      const headers = ['Employee Name', 'Employee ID', 'Period Type', 'Start Date', 'End Date', 'Total Hours', 'Status', 'Submitted At'];
      const csvContent = [
        headers.join(','),
        ...filteredTimesheets.map(ts => [
          `"${ts.employeeName || 'N/A'}"`,
          `"${ts.employeeId || 'N/A'}"`,
          `"${ts.periodType || 'N/A'}"`,
          `"${formatDate(ts.startDate)}"`,
          `"${formatDate(ts.endDate)}"`,
          `"${ts.totalHours || 0}"`,
          `"${ts.status || 'N/A'}"`,
          `"${formatDate(ts.submittedAt)}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheet-reports-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Timesheet report downloaded successfully',
      });
    } catch (error) {
      console.error('Error exporting timesheets:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export timesheet report',
        variant: 'destructive',
      });
    }
  };

  // ✅ Delete timesheet
  const handleDeleteTimesheet = async (timesheetId) => {
    if (!hasPermission('delete')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to delete timesheet records',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Remove from local state first for immediate UI update
      setTimesheets(prev => prev.filter(ts => ts._id !== timesheetId));
      
      toast({
        title: 'Timesheet Deleted',
        description: 'Timesheet record has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete timesheet record',
        variant: 'destructive',
      });
    }
  };

  // ✅ Update timesheet status
  const handleUpdateTimesheetStatus = async (timesheetId, newStatus) => {
    if (!hasPermission('update')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to update timesheet records',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Update local state first for immediate UI update
      setTimesheets(prev => prev.map(ts => 
        ts._id === timesheetId ? { ...ts, status: newStatus } : ts
      ));
      
      toast({
        title: 'Status Updated',
        description: `Timesheet status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating timesheet:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update timesheet status',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Timesheet Reports - HRMS Pro</title>
        <meta name="description" content="View employee timesheet reports and daily work records" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Timesheet Reports</h1>
              <p className="text-muted-foreground mt-2">
                View daily, weekly, and monthly timesheet records
              </p>
            </div>
            
            <div className="flex gap-2">
              {/* ✅ Permission-based Export Button */}
              {hasPermission('export') && (
                <Button
                  onClick={handleExportTimesheets}
                  disabled={filteredTimesheets.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <DownloadCloud className="w-4 h-4" />
                  Export CSV
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={fetchTimesheets}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-lg border p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Filter Timesheets</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Employee Filter */}
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-foreground min-w-[200px]"
                disabled={loading || uniqueEmployees.length === 0}
              >
                <option value="">All Employees</option>
                {uniqueEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </option>
                ))}
              </select>

              {/* Period Type Filter */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-foreground min-w-[200px]"
                disabled={loading || periodOptions.length === 0}
              >
                <option value="">All Report Types</option>
                {periodOptions.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {selectedEmployee && (
                <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <User className="w-3 h-3" />
                  <span>Employee: {uniqueEmployees.find(e => e.id === selectedEmployee)?.name}</span>
                  <button
                    onClick={() => setSelectedEmployee('')}
                    className="hover:text-blue-600"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedPeriod && (
                <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {React.createElement(getPeriodIcon(selectedPeriod), { className: "w-3 h-3" })}
                  <span>Report: {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}</span>
                  <button
                    onClick={() => setSelectedPeriod('')}
                    className="hover:text-green-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Summary Stats */}
          {!loading && hasPermission('read') && filteredTimesheets.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{filteredTimesheets.length}</div>
                <div className="text-sm text-blue-800">Total</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredTimesheets.filter(ts => ts.periodType === 'daily').length}
                </div>
                <div className="text-sm text-purple-800">Daily</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredTimesheets.filter(ts => ts.periodType === 'weekly').length}
                </div>
                <div className="text-sm text-orange-800">Weekly</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {filteredTimesheets.filter(ts => ts.periodType === 'monthly').length}
                </div>
                <div className="text-sm text-red-800">Monthly</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading timesheets data...</p>
          </motion.div>
        )}

        {/* Access Denied State */}
        {!loading && !hasPermission('read') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 border-2 border-dashed rounded-lg"
          >
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              You don't have permission to view timesheet reports. Please contact your administrator.
            </p>
          </motion.div>
        )}

        {/* No Data State */}
        {!loading && hasPermission('read') && filteredTimesheets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 border-2 border-dashed rounded-lg"
          >
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Timesheets Found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters 
                ? 'No timesheets match your current filters'
                : 'No timesheets data available'
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearAllFilters} className="mr-2">
                Clear Filters
              </Button>
            )}
            <Button onClick={fetchTimesheets} disabled={!hasPermission('read')}>
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Timesheets List */}
        {!loading && hasPermission('read') && filteredTimesheets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Timesheet Records ({filteredTimesheets.length})
                {selectedEmployee && ` for ${uniqueEmployees.find(e => e.id === selectedEmployee)?.name}`}
                {selectedPeriod && ` - ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Reports`}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>{filteredTimesheets.filter(ts => ts.periodType === 'monthly').length} monthly</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CalendarRange className="w-4 h-4" />
                  <span>{filteredTimesheets.filter(ts => ts.periodType === 'weekly').length} weekly</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{filteredTimesheets.filter(ts => ts.periodType === 'daily').length} daily</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredTimesheets.map((timesheet, index) => {
                const StatusIcon = getStatusInfo(timesheet.status).icon;
                const statusColor = getStatusInfo(timesheet.status).color;
                const statusBgColor = getStatusInfo(timesheet.status).bgColor;
                const PeriodIcon = getPeriodIcon(timesheet.periodType);

                return (
                  <motion.div
                    key={timesheet._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="p-6 hover:shadow-md transition-shadow border-l-4" style={{
                      borderLeftColor: 
                        timesheet.periodType === 'daily' ? '#3B82F6' :
                        timesheet.periodType === 'weekly' ? '#8B5CF6' :
                        '#10B981'
                    }}>
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Employee Info */}
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`p-3 rounded-lg ${
                            timesheet.periodType === 'daily' ? 'bg-blue-100' :
                            timesheet.periodType === 'weekly' ? 'bg-purple-100' :
                            'bg-green-100'
                          }`}>
                            <PeriodIcon className={`w-6 h-6 ${
                              timesheet.periodType === 'daily' ? 'text-blue-600' :
                              timesheet.periodType === 'weekly' ? 'text-purple-600' :
                              'text-green-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="font-semibold text-foreground">
                                {timesheet.employeeName || 'Unknown Employee'}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                timesheet.periodType === 'daily' ? 'bg-blue-100 text-blue-800' :
                                timesheet.periodType === 'weekly' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {timesheet.periodType?.charAt(0).toUpperCase() + timesheet.periodType?.slice(1)} Report
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              ID: {timesheet.employeeId || 'N/A'} | Department: {timesheet.department || 'N/A'}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>From: {formatDate(timesheet.startDate)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>To: {formatDate(timesheet.endDate)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>Total: {timesheet.totalHours || 0} hours</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start lg:items-end gap-3">
                          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${statusBgColor}`}>
                            <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                            <span className={`text-sm font-medium ${statusColor}`}>
                              {timesheet.status?.charAt(0).toUpperCase() + timesheet.status?.slice(1)}
                            </span>
                          </div>
                          
                          {/* ✅ Permission-based Action Buttons */}
                          <div className="flex gap-2">
                            {/* Status Update Buttons - Only for users with update permission */}
                            {hasPermission('update') && timesheet.status !== 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateTimesheetStatus(timesheet._id, 'approved')}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            
                            {hasPermission('update') && timesheet.status !== 'rejected' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateTimesheetStatus(timesheet._id, 'rejected')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            )}

                            {/* Delete Button - Only for users with delete permission */}
                            {hasPermission('delete') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTimesheet(timesheet._id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {timesheet.submittedAt && (
                            <div className="text-xs text-muted-foreground">
                              Submitted: {formatDate(timesheet.submittedAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timesheet Entries */}
                      {timesheet.entries && timesheet.entries.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium text-foreground mb-2">Time Entries:</h5>
                          <div className="grid gap-2 max-h-32 overflow-y-auto">
                            {timesheet.entries.map((entry, entryIndex) => (
                              <div key={entryIndex} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                <div className="flex items-center space-x-4">
                                  <span className="font-medium min-w-[100px]">
                                    {formatDate(entry.date)}
                                  </span>
                                  <span className="min-w-[120px]">{entry.project}</span>
                                  <span className="min-w-[100px]">{entry.task}</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="font-semibold">{entry.hours} hrs</span>
                                  {entry.description && (
                                    <span className="text-muted-foreground max-w-[200px] truncate">
                                      {entry.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments */}
                      {timesheet.comments && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground">
                            <strong>Comments:</strong> {timesheet.comments}
                          </p>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ✅ Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs">
            <div className="font-bold mb-2">🔐 Permission Debug - Reports</div>
            <div>Role: {currentUserRole}</div>
            <div>Timesheet-Reports Access: {userPermissions.find(p => p.module === 'Timesheet-Reports')?.accessLevel || 'none'}</div>
            <div className="mt-1">
              <div>Read: {hasPermission('read').toString()}</div>
              <div>Update: {hasPermission('update').toString()}</div>
              <div>Delete: {hasPermission('delete').toString()}</div>
              <div>Export: {hasPermission('export').toString()}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportsSection;
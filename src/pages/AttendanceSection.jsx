import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useAdminAttendance } from '@/contexts/AdminAttendanceContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  Plus,
  Check,
  X,
  User,
  CalendarDays,
  LogIn,
  LogOut,
  AlertCircle,
  Loader2,
  Users,
  Settings,
  Download,
  Eye,
  BarChart3,
  Filter,
  Shield,
  Edit,
  Trash2
} from 'lucide-react';

// Import components from the correct paths
import PhotoViewer from '../components/PhotoViewer';
import LocationViewer from '../components/LocationViewer';
import AttendanceDetailsModal from '../components/AttendanceDetailsModal';
import ShiftManagement from '../components/ShiftManagement';

const getStatusColor = (status) => {
  const colors = {
    present: { backgroundColor: '#10b981', textColor: '#ffffff' },
    absent: { backgroundColor: '#ef4444', textColor: '#ffffff' },
    late: { backgroundColor: '#f59e0b', textColor: '#ffffff' },
    'half-day': { backgroundColor: '#3b82f6', textColor: '#ffffff' },
    weekend: { backgroundColor: '#6b7280', textColor: '#ffffff' }
  };
  return colors[status] || { backgroundColor: '#6b7280', textColor: '#ffffff' };
};

const AdminAttendanceSection = () => {
  const { 
    user, 
    hasAdminAccess, 
    attendanceData,
    dashboardStats,
    employees,
    loading,
    filters,
    updateFilters,
    fetchAttendanceData,
    exportAttendanceData,
    refreshData,
    isAuthenticated
  } = useAdminAttendance();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState('');
  
  // ✅ NEW: Role-based permission states
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ NEW: JWT token decode function
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
          console.log("🔐 Decoded user data for Attendance:", decoded);
          
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

  // ✅ NEW: Fetch user permissions
  const fetchUserPermissions = async (role) => {
    try {
      console.log("🔍 Fetching permissions for role:", role);
      const res = await fetch('http://localhost:5000/api/settings/roles/roles');
      
      if (res.ok) {
        const data = await res.json();
        console.log("📋 All roles data for Attendance:", data.data);
        
        const userRoleData = data.data.find(r => r.name === role);
        console.log("🎯 User role data for Attendance:", userRoleData);
        
        if (userRoleData) {
          const attendancePermission = userRoleData.permissions.find(p => p.module === 'Attendance');
          console.log("⏰ Attendance permission:", attendancePermission);
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

  // ✅ NEW: Fallback permissions if API fails
  const getDefaultPermissions = (role) => {
    const defaults = {
      admin: [{ module: 'Attendance', accessLevel: 'crud' }],
      hr: [{ module: 'Attendance', accessLevel: 'crud' }],
      employee: [{ module: 'Attendance', accessLevel: 'read' }]
    };
    return defaults[role] || [];
  };

  // ✅ NEW: Correct Permission check function
  const hasPermission = (action) => {
    // Admin ku full access
    if (currentUserRole === 'admin') return true;
    
    // Find Attendance module permission
    const attendancePermission = userPermissions.find(p => p.module === 'Attendance');
    if (!attendancePermission) {
      console.log("❌ No Attendance permission found for role:", currentUserRole);
      return false;
    }

    const accessLevel = attendancePermission.accessLevel;
    console.log(`🔐 Checking ${action} permission for ${currentUserRole} in Attendance:`, accessLevel);
    
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
      case 'export':
        // Export access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      case 'manage':
        // Manage access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      default:
        return false;
    }
  };

  // ✅ NEW: Check read permission on component load
  useEffect(() => {
    if (currentUserRole && !hasPermission('read')) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to view attendance data" 
      });
    }
  }, [currentUserRole, userPermissions]);

  // Authentication check - run once on mount
  useEffect(() => {
    if (!isAuthenticated || !hasAdminAccess()) {
      toast({ 
        title: 'Access Denied', 
        description: 'You do not have permission to access this section',
        variant: 'destructive' 
      });
    }

    // ⭐ CRITICAL FIX: Manually initialize filters with a date string on mount
    const initialDateString = selectedDate.toISOString().split('T')[0];
    updateFilters({ date: initialDateString, employeeId: employeeFilter }); 

  }, []); // Empty dependency array - runs only once

  // Data fetching - run when tab or date changes
  useEffect(() => {
    if (isAuthenticated && hasAdminAccess() && hasPermission('read')) {
      fetchDataForTab();
    }
  }, [activeTab, selectedDate]); // Remove isAuthenticated from dependencies

  // Wrap fetchDataForTab with useCallback
  const fetchDataForTab = useCallback(async () => {
    if (!isAuthenticated || !hasAdminAccess() || !hasPermission('read')) return;

    try {
      switch (activeTab) {
        case 'overview':
          // Fetch dashboard stats and attendance data for the selected date
          await refreshData();
          break;
        case 'shifts':
          // ShiftManagement component handles its own data fetching
          break;
        case 'reports':
          // Reports tab doesn't need initial data fetch
          break;
      }
    } catch (error) {
      console.error('Error fetching data for tab:', error);
    }
  }, [isAuthenticated, hasAdminAccess, activeTab, refreshData, hasPermission]);

  const handleViewDetails = (record) => {
    if (!hasPermission('read')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view attendance details',
        variant: 'destructive',
      });
      return;
    }
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

// In AttendanceSection.jsx - Update the handleExportData function
const handleExportData = async (type) => {
  if (!hasPermission('export')) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to export attendance data',
      variant: 'destructive',
    });
    return;
  }

  try {
    let params = {
      format: 'csv',
      includeAbsent: 'true' // Default to including absent employees for comprehensive reports
    };

    switch (type) {
      case 'daily':
        params.startDate = selectedDate.toISOString().split('T')[0];
        params.endDate = selectedDate.toISOString().split('T')[0];
        break;
      case 'weekly':
        const weekStart = new Date(selectedDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        params.startDate = weekStart.toISOString().split('T')[0];
        params.endDate = weekEnd.toISOString().split('T')[0];
        break;
      case 'monthly':
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        params.startDate = monthStart.toISOString().split('T')[0];
        params.endDate = monthEnd.toISOString().split('T')[0];
        break;
      case 'comprehensive':
        // Last 30 days comprehensive report
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = endDate.toISOString().split('T')[0];
        params.includeAbsent = 'true';
        break;
      case 'custom':
        params.startDate = reportFilters.startDate;
        params.endDate = reportFilters.endDate;
        if (reportFilters.department !== 'all') {
          params.department = reportFilters.department;
        }
        if (reportFilters.employee && reportFilters.employee !== 'all') {
          params.employeeId = reportFilters.employee;
        }
        params.includeAbsent = reportFilters.includeAbsent ? 'true' : 'false';
        params.includeDetails = reportFilters.includeDetails ? 'true' : 'false';
        break;
      default:
        params.startDate = selectedDate.toISOString().split('T')[0];
        params.endDate = selectedDate.toISOString().split('T')[0];
    }

    console.log('Exporting with params:', params);
    await exportAttendanceData(params);
    
    toast({
      title: 'Export started',
      description: 'Your report is being generated and will download shortly.',
      variant: 'default'
    });
    
  } catch (error) {
    console.error('Export error:', error);
    toast({
      title: 'Export failed',
      description: error.message || 'Failed to export data',
      variant: 'destructive'
    });
  }
};

  const handleDateChange = (date) => {
    if (!hasPermission('read')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to view attendance data',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedDate(date);
    // CRITICAL FIX: Convert the Date object to an ISO string before passing to updateFilters
    const dateString = date.toISOString().split('T')[0];
    updateFilters({ date: dateString, employeeId: employeeFilter }); 
    // Refresh attendance data when date changes
    if (activeTab === 'overview') {
      fetchAttendanceData();
    }
  };

  const handleReportFilterChange = (key, value) => {
    setReportFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefreshData = async () => {
    if (!hasPermission('read')) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to refresh attendance data',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Re-fetch everything
      await refreshData(); 
      toast({
        title: 'Data refreshed',
        description: 'Latest data has been loaded'
      });
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

// ✅ FIXED: Update employee filter function
const updateEmployeeFilter = (employeeId) => {
  if (!hasPermission('read')) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to filter attendance data',
      variant: 'destructive',
    });
    return;
  }

  let newEmployeeId = employeeId === 'all' ? '' : employeeId;
  setEmployeeFilter(newEmployeeId);
  // Update filters with employeeId
  updateFilters({ 
    employeeId: newEmployeeId, 
    date: selectedDate.toISOString().split('T')[0] 
  }); 
};

// Helper function to extract employee ID from record
const getEmployeeId = (record) => {
  // Now employeeId is directly the EMP003 string
  return record.employeeId || 'N/A';
};

// Helper function to get employee name
const getEmployeeName = (record) => {
  if (record.employeeName) return record.employeeName;
  if (record.employee && typeof record.employee === 'string') return record.employee;
  if (record.employee && typeof record.employee === 'object' && record.employee.name) return record.employee.name;
  return 'Unknown Employee';
};

// Helper function to find employee details for display
const getEmployeeDetails = (record) => {
  const employeeId = getEmployeeId(record);
  const employee = employees.find(emp => emp.employeeId === employeeId);
  
  return {
    name: employee?.name || getEmployeeName(record),
    department: employee?.department || record.employeeDepartment || 'No Department',
    email: employee?.email || record.employeeEmail || 'N/A'
  };
};

// In AttendanceSection.jsx - Update the reportFilters initial state
const [reportFilters, setReportFilters] = useState({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  department: 'all',
  employee: 'all',
  includeAbsent: true,
  includeDetails: false
});

  const renderOverview = () => (
  <div className="space-y-6">
    {/* Employee Filter Section - ADDED */}
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filter by Employee:</span>
      </div>
      <Select 
        value={employeeFilter || 'all'} 
        onValueChange={updateEmployeeFilter}
        disabled={!hasPermission('read')}
      >
        <SelectTrigger className="w-60">
          <SelectValue placeholder="All employees" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Employees</SelectItem>
          {employees && employees
            .filter(employee => employee.employeeId && employee.employeeId.trim() !== '') // Filter out employees with empty employeeIds
            .map(employee => (
              <SelectItem 
                key={employee._id} 
                value={employee.employeeId} // Use employee.employeeId (EMP003) as the value
              >
                {employee.name} - {employee.department || 'No Department'} ({employee.employeeId})
              </SelectItem>
            ))
          }
        </SelectContent>
      </Select>
      {employeeFilter && employeeFilter !== 'all' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => updateEmployeeFilter('all')}
          disabled={!hasPermission('read')}
        >
          Clear Filter
        </Button>
      )}
    </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {loading.dashboard ? <Loader2 className="w-6 h-6 animate-spin" /> : dashboardStats.totalEmployees || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Present Today</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {loading.dashboard ? <Loader2 className="w-6 h-6 animate-spin" /> : dashboardStats.presentToday || 0}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Absent Today</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {loading.dashboard ? <Loader2 className="w-6 h-6 animate-spin" /> : dashboardStats.absentToday || 0}
                </p>
              </div>
              <X className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Late Today</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {loading.dashboard ? <Loader2 className="w-6 h-6 animate-spin" /> : dashboardStats.lateToday || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Today's Attendance - {selectedDate.toLocaleDateString()}</span>
            <div className="flex space-x-2">
              {/* ✅ Permission-based Export Button */}
              {hasPermission('export') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExportData('daily')}
                  disabled={loading.attendance}
                >
                  {loading.attendance ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshData}
                disabled={loading.dashboard || loading.attendance || !hasPermission('read')}
              >
                <Loader2 className={`w-4 h-4 mr-2 ${loading.attendance ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasPermission('read') ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to view attendance data.
              </p>
            </div>
          ) : loading.attendance ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2">Loading attendance data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Photos</TableHead>
                  
                </TableRow>
              </TableHeader>
<TableBody>
  {attendanceData && attendanceData.length > 0 ? (
    attendanceData.map((record) => {
      const employeeDetails = getEmployeeDetails(record);
      
      return (
        <TableRow key={record._id}>
          <TableCell className="font-mono text-xs">
            {getEmployeeId(record)}
          </TableCell>
          <TableCell className="font-medium">
            {employeeDetails.name}
            <p className="text-xs text-muted-foreground">
              {employeeDetails.department}
            </p>
          </TableCell>
          <TableCell>
            {new Date(record.date).toLocaleDateString()}
          </TableCell>
          {/* Check In Column - FIXED */}
          <TableCell>
            <div className="flex items-center space-x-2">
              <span>
                {record.checkIn ? 
                  (typeof record.checkIn === 'string' ? record.checkIn : new Date(record.checkIn).toLocaleTimeString()) 
                  : '-'}
              </span>
              {record.checkInLocation && (
                <LocationViewer location={record.checkInLocation} type="Check-in" />
              )}
            </div>
          </TableCell>
          {/* Check Out Column - FIXED */}
          <TableCell>
            <div className="flex items-center space-x-2">
              <span>
                {record.checkOut ? 
                  (typeof record.checkOut === 'string' ? record.checkOut : new Date(record.checkOut).toLocaleTimeString()) 
                  : '-'}
              </span>
              {record.checkOutLocation && (
                <LocationViewer location={record.checkOutLocation} type="Check-out" />
              )}
            </div>
          </TableCell>
          <TableCell>{record.duration || '0h 0m'}</TableCell>
          <TableCell>
            <Badge 
              className="text-xs capitalize"
              style={{ 
                backgroundColor: getStatusColor(record.status).backgroundColor,
                color: getStatusColor(record.status).textColor
              }}
            >
              {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'Absent'}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex space-x-2">
              <PhotoViewer 
                src={record.checkInPhoto} 
                alt={`Check-in photo for ${getEmployeeName(record)}`}
              />
              <PhotoViewer 
                src={record.checkOutPhoto} 
                alt={`Check-out photo for ${getEmployeeName(record)}`}
              />
            </div>
          </TableCell>
          
        </TableRow>
      );
    })
  ) : (
    <TableRow>
      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
        No attendance records found for {selectedDate.toLocaleDateString()}
        {employeeFilter && ` for employee ID ${employeeFilter}`}
      </TableCell>
    </TableRow>
  )}
</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

// In AttendanceSection.jsx - Update the renderReports function
const renderReports = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Attendance Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quick Export Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {hasPermission('export') && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleExportData('daily')}
                disabled={loading.attendance}
              >
                {loading.attendance ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Daily Report
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportData('weekly')}
                disabled={loading.attendance}
              >
                {loading.attendance ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Weekly Report
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportData('monthly')}
                disabled={loading.attendance}
              >
                {loading.attendance ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Monthly Report
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportData('comprehensive')}
                disabled={loading.attendance}
              >
                {loading.attendance ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Full Report
              </Button>
            </>
          )}
        </div>

        {/* Enhanced Report Filters */}
        {hasPermission('export') && (
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium">Advanced Report Generator</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={reportFilters.startDate}
                  onChange={(e) => handleReportFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  value={reportFilters.endDate}
                  onChange={(e) => handleReportFilterChange('endDate', e.target.value)}
                />
              </div>
              <div>
                <Label>Department</Label>
                <Select 
                  value={reportFilters.department}
                  onValueChange={(value) => handleReportFilterChange('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {employees && employees
                      .filter(emp => emp.department && emp.department.trim() !== '')
                      .map(emp => emp.department)
                      .filter((dept, index, arr) => arr.indexOf(dept) === index)
                      .sort()
                      .map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employee</Label>
                <Select 
                  value={reportFilters.employee || 'all'}
                  onValueChange={(value) => handleReportFilterChange('employee', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees && employees
                      .filter(employee => employee.employeeId && employee.employeeId.trim() !== '')
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(employee => (
                        <SelectItem 
                          key={employee._id} 
                          value={employee.employeeId}
                        >
                          {employee.name} ({employee.employeeId})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeAbsent"
                  checked={reportFilters.includeAbsent}
                  onChange={(e) => handleReportFilterChange('includeAbsent', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="includeAbsent" className="text-sm">
                  Include Absent Employees
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeDetails"
                  checked={reportFilters.includeDetails}
                  onChange={(e) => handleReportFilterChange('includeDetails', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="includeDetails" className="text-sm">
                  Include Detailed Information
                </Label>
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full"
                  onClick={() => handleExportData('custom')}
                  disabled={loading.attendance}
                >
                  {loading.attendance ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="w-4 h-4 mr-2" />
                  )}
                  Generate Custom Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Department Reports */}
        {hasPermission('export') && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Quick Department Reports</h4>
            <div className="flex flex-wrap gap-2">
              {employees && employees
                .filter(emp => emp.department && emp.department.trim() !== '')
                .map(emp => emp.department)
                .filter((dept, index, arr) => arr.indexOf(dept) === index)
                .sort()
                .map(dept => (
                  <Button
                    key={dept}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReportFilters(prev => ({
                        ...prev,
                        department: dept,
                        startDate: new Date().toISOString().split('T')[0],
                        endDate: new Date().toISOString().split('T')[0],
                        includeAbsent: true
                      }));
                      setTimeout(() => handleExportData('custom'), 100);
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    {dept} Report
                  </Button>
                ))
              }
            </div>
          </div>
        )}

        {/* Access Denied Message for Reports */}
        {!hasPermission('export') && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Export Permission Required</h3>
            <p className="text-muted-foreground">
              You don't have permission to export attendance reports. Please contact your administrator.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

  const tabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: BarChart3 },
    { id: 'shifts', label: 'Shift Management', icon: Settings },
    { id: 'reports', label: 'Reports & Analytics', icon: Download }
  ];

  // Show access denied message if user doesn't have permission
  if (!isAuthenticated || !hasAdminAccess() || !hasPermission('read')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-muted-foreground text-center">
          You do not have permission to access the Admin Attendance section.
          <br />
          Please contact your administrator if you believe this is an error.
        </p>
        
        {/* ✅ Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-800 text-white rounded-lg text-xs max-w-xs">
            <div className="font-bold mb-2">🔐 Permission Debug - Attendance</div>
            <div>Role: {currentUserRole}</div>
            <div>Attendance Access: {userPermissions.find(p => p.module === 'Attendance')?.accessLevel || 'none'}</div>
            <div className="mt-1">
              <div>Read: {hasPermission('read').toString()}</div>
              <div>Export: {hasPermission('export').toString()}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Admin Attendance - HRMS Pro</title></Helmet>

      {/* Attendance Details Modal */}
      <AttendanceDetailsModal
        record={selectedRecord}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRecord(null);
        }}
      />

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Attendance</h1>
            <p className="text-muted-foreground mt-2">
              Monitor employee attendance, manage shifts, and generate reports
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={handleRefreshData}
              disabled={!hasPermission('read')}
            >
              <Loader2 className={`w-4 h-4 mr-2 ${loading.dashboard || loading.attendance ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </motion.div>

        {/* Date Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Viewing Date:</span>
          </div>
          <Input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => handleDateChange(new Date(e.target.value))}
            className="w-40"
            disabled={!hasPermission('read')}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                // ✅ Hide Reports tab if no export permission
                if (tab.id === 'reports' && !hasPermission('export')) {
                  return null;
                }
                return (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                  >
                    <Icon className="w-4 h-4" /><span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'shifts' && <ShiftManagement />}
          {activeTab === 'reports' && renderReports()}
        </motion.div>

        {/* ✅ Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs">
            <div className="font-bold mb-2">🔐 Permission Debug - Attendance</div>
            <div>Role: {currentUserRole}</div>
            <div>Attendance Access: {userPermissions.find(p => p.module === 'Attendance')?.accessLevel || 'none'}</div>
            <div className="mt-1">
              <div>Read: {hasPermission('read').toString()}</div>
              <div>Export: {hasPermission('export').toString()}</div>
              <div>Update: {hasPermission('update').toString()}</div>
              <div>Delete: {hasPermission('delete').toString()}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminAttendanceSection;
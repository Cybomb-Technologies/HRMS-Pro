import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';
import axios from 'axios';

const AdminAttendanceContext = createContext();

export const useAdminAttendance = () => {
  const context = useContext(AdminAttendanceContext);
  if (!context) {
    throw new Error('useAdminAttendance must be used within an AdminAttendanceProvider');
  }
  return context;
};

export const AdminAttendanceProvider = ({ children }) => {
  const { user, isAuthenticated, can } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employeeAssignments, setEmployeeAssignments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState({
    dashboard: false,
    attendance: false,
    shifts: false,
    assignments: false,
    employees: false
  });
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0], // Start with string format
    employeeId: '', // ✅ ADDED: Employee filter
    department: 'all',
    status: 'all'
  });

  // API base URL
  const API_BASE = 'http://localhost:5000/api';
  const hasFetchedInitialData = useRef(false);

  // Helper function for API calls
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('hrms_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  };

  // Check if user has admin attendance permissions
  const hasAdminAccess = useCallback(() => {
    if (!isAuthenticated || !user) return false;
    return can('view:all_attendance') || ['hr', 'employer', 'admin'].includes(user.role);
  }, [isAuthenticated, user, can]);

// In AdminAttendanceContext.jsx - Add debugging to fetchDashboardStats
const fetchDashboardStats = useCallback(async () => {
  if (!hasAdminAccess()) return;

  setLoading(prev => ({ ...prev, dashboard: true }));
  try {
    console.log('🔄 Fetching dashboard stats from /admin/dashboard/stats...');
    const stats = await apiCall('/admin/dashboard/stats');
    console.log('📊 Dashboard stats received:', stats);
    
    // Check if stats are valid
    if (!stats || typeof stats.totalEmployees === 'undefined') {
      console.warn('❌ Invalid stats response:', stats);
      // Fallback: Use metadata from attendance data if available
      if (attendanceData.length > 0) {
        console.log('🔄 Using fallback stats from attendance data');
        const presentCount = attendanceData.filter(record => 
          record.status === 'present' || record.status === 'late' || record.status === 'half-day'
        ).length;
        const absentCount = attendanceData.filter(record => record.status === 'absent').length;
        
        setDashboardStats({
          totalEmployees: employees.length,
          presentToday: presentCount,
          absentToday: absentCount,
          lateToday: attendanceData.filter(record => record.status === 'late').length,
          pendingRequests: 0
        });
        return;
      }
    }
    
    setDashboardStats({
      totalEmployees: stats.totalEmployees || 0,
      presentToday: stats.presentToday || 0,
      absentToday: stats.absentToday || 0,
      lateToday: stats.lateToday || 0,
      pendingRequests: stats.pendingRequests || 0,
      ...stats
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    // Set default stats on error
    setDashboardStats({
      totalEmployees: employees.length || 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      pendingRequests: 0
    });
  } finally {
    setLoading(prev => ({ ...prev, dashboard: false }));
  }
}, [hasAdminAccess, attendanceData, employees]);

  // ✅ FIXED: Fetch attendance data with proper employee filtering
  const fetchAttendanceData = useCallback(async (params = {}) => {
    if (!hasAdminAccess()) return;

    setLoading(prev => ({ ...prev, attendance: true }));
    try {
      // Safe date handling
      let dateValue;
      if (filters.date instanceof Date) {
        dateValue = filters.date.toISOString().split('T')[0];
      } else if (typeof filters.date === 'string') {
        dateValue = filters.date;
      } else {
        dateValue = new Date().toISOString().split('T')[0];
      }

      // ✅ FIX: Build query params with ALL current filters
      const queryParams = new URLSearchParams({
        date: dateValue,
        includeAbsent: 'true',
        ...params
      });

      // ✅ FIX: Add employee filter if specified
      if (filters.employeeId && filters.employeeId.trim() !== '') {
        queryParams.append('employeeId', filters.employeeId);
      }

      // ✅ FIX: Add department filter if specified
      if (filters.department && filters.department !== 'all') {
        queryParams.append('department', filters.department);
      }

      // ✅ FIX: Add status filter if specified
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }

      console.log('Fetching attendance with params:', Object.fromEntries(queryParams));
      const data = await apiCall(`/admin/attendance/data?${queryParams}`);
      console.log('Attendance data received:', data);
      
      // Process data to ensure proper employee names
      let processedData = [];
      
      if (data && data.attendance && Array.isArray(data.attendance)) {
        processedData = data.attendance.map(record => {
          // ✅ IMPROVED: Better employee lookup logic
          let employee = null;
          
          // Try to find employee by employeeId string (EMP003)
          if (record.employeeId) {
            employee = employees.find(emp => 
              emp.employeeId === record.employeeId
            );
          }
          
          // If not found, try by _id
          if (!employee && record.employeeId && typeof record.employeeId === 'object') {
            employee = employees.find(emp => 
              emp._id === record.employeeId._id
            );
          }
          
          // If still not found, try by record._id (for absent records)
          if (!employee && record._id && record._id.startsWith('absent-')) {
            const employeeIdFromRecord = record._id.split('-')[1];
            employee = employees.find(emp => 
              emp.employeeId === employeeIdFromRecord
            );
          }

          const employeeName = employee?.name || record.employeeName || record.employee || 'Unknown Employee';
          
          return {
            ...record,
            employeeId: record.employeeId?._id || record.employeeId,
            employeeName: employeeName,
            employee: employeeName,
            employeeDepartment: employee?.department || record.employeeDepartment || 'No Department'
          };
        });
      } else {
        console.warn('Unexpected API response format:', data);
        processedData = [];
      }
      
      setAttendanceData(processedData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Failed to load attendance data",
        description: error.message,
        variant: "destructive"
      });
      setAttendanceData([]);
    } finally {
      setLoading(prev => ({ ...prev, attendance: false }));
    }
  }, [hasAdminAccess, filters.date, filters.employeeId, filters.department, filters.status, employees]);

  // Fetch detailed attendance record
  const fetchAttendanceDetails = useCallback(async (attendanceId) => {
    if (!hasAdminAccess()) {
      throw new Error('No permission to fetch attendance details');
    }

    try {
      // Check if it's an absent record ID format
      if (attendanceId.startsWith('absent-')) {
        // Extract employee ID and date from absent record ID
        const parts = attendanceId.split('-');
        const employeeId = parts[1];
        const date = parts.slice(2).join('-');
        
        // Find employee by employeeId string (EMP003)
        const employee = employees.find(emp => 
          emp.employeeId === employeeId
        );
        if (!employee) {
          throw new Error('Employee not found');
        }

        // Return absent record structure
        return {
          _id: attendanceId,
          employeeId: employee.employeeId,
          employeeName: employee.name,
          employee: employee,
          date: date,
          checkIn: null,
          checkOut: null,
          status: 'absent',
          checkInPhoto: null,
          checkOutPhoto: null,
          checkInLocation: null,
          checkOutLocation: null,
          duration: '0h 0m',
          shiftName: 'General Shift',
          notes: 'Employee was absent'
        };
      }

      // Fetch actual attendance record from API
      const response = await apiCall(`/admin/attendance/${attendanceId}`);
      return response;
    } catch (error) {
      console.error('Error fetching attendance details:', error);
      
      // Fallback: try to find in existing attendance data
      const existingRecord = attendanceData.find(record => record._id === attendanceId);
      if (existingRecord) {
        return existingRecord;
      }
      
      throw new Error('Attendance record not found');
    }
  }, [hasAdminAccess, employees, attendanceData]);

  // Fetch shifts
  const fetchShifts = useCallback(async () => {
    if (!hasAdminAccess()) return;

    setLoading(prev => ({ ...prev, shifts: true }));
    try {
      const shiftsData = await apiCall('/admin/shifts');
      setShifts(shiftsData.shifts || shiftsData || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast({
        title: "Failed to load shifts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, shifts: false }));
    }
  }, [hasAdminAccess]);

  // Fetch employee assignments
  const fetchEmployeeAssignments = useCallback(async () => {
    if (!hasAdminAccess()) return;

    setLoading(prev => ({ ...prev, assignments: true }));
    try {
      const assignments = await apiCall('/admin/shifts/assignments');
      setEmployeeAssignments(assignments.assignments || assignments || []);
    } catch (error) {
      console.error('Error fetching employee assignments:', error);
      toast({
        title: "Failed to load employee assignments",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
  }, [hasAdminAccess]);

  // ✅ FIXED: Fetch employees from correct endpoint
  const fetchEmployees = useCallback(async () => {
    if (!hasAdminAccess()) return;

    setLoading(prev => ({ ...prev, employees: true }));
    try {
      console.log('Fetching employees...');
      // ✅ FIX: Use the correct admin endpoint for employees
      const employeesData = await apiCall('/admin/employees');
      console.log('Employees data received:', employeesData);
      
      if (employeesData && employeesData.employees) {
        setEmployees(employeesData.employees);
      } else if (Array.isArray(employeesData)) {
        setEmployees(employeesData);
      } else {
        console.warn('Unexpected employees response format:', employeesData);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Try fallback endpoint
      try {
        const fallbackData = await apiCall('/employees');
        if (fallbackData && fallbackData.employees) {
          setEmployees(fallbackData.employees);
        } else if (Array.isArray(fallbackData)) {
          setEmployees(fallbackData);
        } else {
          setEmployees([]);
        }
      } catch (fallbackError) {
        console.error('Fallback employees fetch also failed:', fallbackError);
        toast({
          title: "Failed to load employees",
          description: error.message,
          variant: "destructive"
        });
        setEmployees([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, employees: false }));
    }
  }, [hasAdminAccess]);

  // Create shift
  const createShift = useCallback(async (shiftData) => {
    if (!hasAdminAccess()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create shifts",
        variant: "destructive"
      });
      return;
    }

    try {
      const newShift = await apiCall('/admin/shifts', {
        method: 'POST',
        body: shiftData
      });
      
      setShifts(prev => [...prev, newShift]);
      toast({
        title: "Shift created successfully",
        description: `${shiftData.name} has been created`
      });
      return newShift;
    } catch (error) {
      console.error('Error creating shift:', error);
      toast({
        title: "Failed to create shift",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [hasAdminAccess]);

  // Update shift
  const updateShift = useCallback(async (shiftId, shiftData) => {
    if (!hasAdminAccess()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update shifts",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedShift = await apiCall(`/admin/shifts/${shiftId}`, {
        method: 'PUT',
        body: shiftData
      });
      
      setShifts(prev => prev.map(shift => 
        shift._id === shiftId ? { ...shift, ...updatedShift } : shift
      ));
      toast({
        title: "Shift updated successfully",
        description: `${shiftData.name} has been updated`
      });
      return updatedShift;
    } catch (error) {
      console.error('Error updating shift:', error);
      toast({
        title: "Failed to update shift",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [hasAdminAccess]);

  // Delete shift
  const deleteShift = useCallback(async (shiftId) => {
    if (!hasAdminAccess()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete shifts",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiCall(`/admin/shifts/${shiftId}`, {
        method: 'DELETE'
      });
      
      setShifts(prev => prev.filter(shift => shift._id !== shiftId));
      toast({
        title: "Shift deleted successfully",
        description: "Shift has been removed"
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast({
        title: "Failed to delete shift",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [hasAdminAccess]);

  // Assign shift to employee
  const assignShiftToEmployee = useCallback(async (assignmentData) => {
    if (!hasAdminAccess()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to assign shifts",
        variant: "destructive"
      });
      return;
    }

    try {
      const newAssignment = await apiCall('/admin/shifts/assign', {
        method: 'POST',
        body: assignmentData
      });
      
      setEmployeeAssignments(prev => [...prev, newAssignment]);
      toast({
        title: "Shift assigned successfully",
        description: "Employee has been assigned to shift"
      });
      return newAssignment;
    } catch (error) {
      console.error('Error assigning shift:', error);
      toast({
        title: "Failed to assign shift",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [hasAdminAccess]);

  // Update employee assignment
  const updateEmployeeAssignment = useCallback(async (assignmentId, updateData) => {
    if (!hasAdminAccess()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update assignments",
        variant: "destructive"
      });
      return;
    }

    setLoading(prev => ({ ...prev, assignments: true }));
    try {
      const updatedAssignment = await apiCall(`/admin/shifts/assignments/${assignmentId}`, {
        method: 'PUT',
        body: updateData
      });
      
      setEmployeeAssignments(prev => prev.map(assignment => {
        if (assignment._id === assignmentId) {
          return { 
            ...assignment, 
            ...updatedAssignment,
            employeeId: updatedAssignment.employeeId || assignment.employeeId,
            shiftId: updatedAssignment.shiftId || assignment.shiftId
          };
        }
        return assignment;
      }));
      
      toast({
        title: "Assignment updated successfully",
        description: "Shift assignment has been updated"
      });
      
      return updatedAssignment;
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Failed to update assignment",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
  }, [hasAdminAccess]);

  // Remove employee assignment
  const removeEmployeeAssignment = useCallback(async (assignmentId) => {
    if (!hasAdminAccess()) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to remove assignments",
        variant: "destructive"
      });
      return;
    }

    setLoading(prev => ({ ...prev, assignments: true }));
    try {
      await apiCall(`/admin/shifts/assignments/${assignmentId}`, {
        method: 'DELETE'
      });
      
      setEmployeeAssignments(prev => prev.filter(assignment => assignment._id !== assignmentId));
      toast({
        title: "Assignment removed successfully",
        description: "Shift assignment has been removed"
      });
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Failed to remove assignment",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
  }, [hasAdminAccess]);

  // Export attendance data
  const exportAttendanceData = async (params = {}) => {
    try {
      const token = localStorage.getItem('hrms_token');
      
      const queryParams = new URLSearchParams();
      
      Object.keys(params).forEach(key => {
        if (params[key]) {
          queryParams.append(key, params[key]);
        }
      });

      const response = await fetch(`http://localhost:5000/api/admin/attendance/export?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Server returned HTML error page. Please check if backend is running.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Export failed with status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const filename = `attendance-${params.startDate}-to-${params.endDate}.csv`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export Successful',
        description: `Data exported to ${filename}`,
        variant: 'default'
      });

    } catch (error) {
      console.error('Export error:', error);
      
      let errorMessage = error.message || 'Failed to export data';
      
      if (error.message.includes('HTML error page')) {
        errorMessage = 'Backend server is not responding. Please make sure the server is running on localhost:5000';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Export endpoint not found. Please check server routes.';
      }
      
      toast({
        title: 'Export Failed',
        description: errorMessage,
        variant: 'destructive'
      });
      throw error;
    }
  };

  // ✅ FIXED: Update filters with proper employee filter handling
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      
      // Ensure date is always in string format
      if (updated.date instanceof Date) {
        updated.date = updated.date.toISOString().split('T')[0];
      }
      
      return updated;
    });
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    if (!hasAdminAccess()) return;
    
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchAttendanceData(),
        fetchShifts(),
        fetchEmployeeAssignments(),
        fetchEmployees()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [hasAdminAccess, fetchDashboardStats, fetchAttendanceData, fetchShifts, fetchEmployeeAssignments, fetchEmployees]);

  // ✅ FIXED: Effect to fetch initial data when component mounts
  useEffect(() => {
    if (hasAdminAccess() && !hasFetchedInitialData.current) {
      hasFetchedInitialData.current = true;
      console.log('Initializing admin attendance data...');
      
      // Fetch all data in sequence to avoid dependencies
      const initializeData = async () => {
        try {
          await fetchEmployees();
          await fetchDashboardStats();
          await fetchAttendanceData();
          await fetchShifts();
          await fetchEmployeeAssignments();
        } catch (error) {
          console.error('Error initializing admin data:', error);
        }
      };
      
      initializeData();
    }
  }, [isAuthenticated, hasAdminAccess]);

  // ✅ FIXED: Effect to refetch attendance data when filters change
  useEffect(() => {
    if (hasAdminAccess() && hasFetchedInitialData.current) {
      console.log('Filters changed, refetching attendance data:', filters);
      fetchAttendanceData();
    }
  }, [filters.date, filters.employeeId, filters.department, filters.status, hasAdminAccess, fetchAttendanceData]);

  // ✅ FIXED: Effect to refetch dashboard stats when date changes
  useEffect(() => {
    if (hasAdminAccess() && hasFetchedInitialData.current) {
      console.log('Date changed, refetching dashboard stats');
      fetchDashboardStats();
    }
  }, [filters.date, hasAdminAccess, fetchDashboardStats]);

  const value = {
    // State
    attendanceData,
    shifts,
    employeeAssignments,
    dashboardStats,
    employees,
    loading,
    filters,
    
    // Actions
    fetchAttendanceData,
    fetchAttendanceDetails,
    fetchShifts,
    fetchEmployeeAssignments,
    fetchEmployees,
    createShift,
    updateShift,
    deleteShift,
    assignShiftToEmployee,
    updateEmployeeAssignment,
    removeEmployeeAssignment,
    exportAttendanceData,
    updateFilters,
    refreshData,
    
    // Permissions
    hasAdminAccess,
    canManageShifts: hasAdminAccess(),
    canViewReports: hasAdminAccess(),
    
    // User info
    currentUser: user,
    isAuthenticated
  };

  return (
    <AdminAttendanceContext.Provider value={value}>
      {children}
    </AdminAttendanceContext.Provider>
  );
};
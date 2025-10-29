import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, User } from 'lucide-react';

const TimelogsTab = () => {
  const { user, isAuthenticated } = useAuth();
  const [timelogs, setTimelogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Fetch employee data from backend (similar to AttendanceTab)
  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      const storedUser = localStorage.getItem('hrms_user');
      
      let fetchedEmployeeId = user?.employeeId;
      let fetchedEmployeeName = user?.name;

      // If user context doesn't have employeeId, try to fetch from localStorage or API
      if (!fetchedEmployeeId && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          fetchedEmployeeId = parsedUser.employeeId;
          fetchedEmployeeName = parsedUser.name || parsedUser.employeeName;
        } catch (parseError) {
          console.error('Error parsing stored user:', parseError);
        }
      }

      // If still no employeeId, try to fetch from employee profile API
      if (!fetchedEmployeeId) {
        try {
          const employeeProfile = await fetchEmployeeProfile();
          if (employeeProfile) {
            fetchedEmployeeId = employeeProfile.employeeId;
            fetchedEmployeeName = employeeProfile.employeeName;
          }
        } catch (profileError) {
          console.error('Error fetching employee profile:', profileError);
        }
      }

      if (!fetchedEmployeeId) {
        throw new Error('Unable to retrieve employee information');
      }

      setEmployeeId(fetchedEmployeeId);
      setEmployeeInfo({
        employeeId: fetchedEmployeeId,
        employeeName: fetchedEmployeeName || 'Employee'
      });

      return fetchedEmployeeId;

    } catch (err) {
      console.error('Error fetching employee data:', err);
      setError(err.message);
      return null;
    }
  };

  // Fetch employee profile from backend API
  const fetchEmployeeProfile = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      
      // Try to get employeeId from various sources
      let empId = user?.employeeId;
      if (!empId) {
        const storedUser = localStorage.getItem('hrms_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          empId = parsedUser.employeeId;
        }
      }

      if (!empId) {
        return null;
      }

      const response = await fetch(`http://localhost:5000/api/employee-profiles/${empId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        const employeeData = responseData.data?.employee || responseData.employee || responseData;
        
        return {
          employeeId: employeeData.employeeId || empId,
          employeeName: employeeData.name || employeeData.employeeName || employeeData.fullName,
          department: employeeData.department,
          position: employeeData.designation || employeeData.position,
          ...employeeData
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      return null;
    }
  };

  // Fetch attendance data using employeeId
  const fetchAttendanceData = async (empId) => {
    if (!empId) {
      setError('Employee ID is not available.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching attendance for employee:", empId);
      
      const response = await fetch(`http://localhost:5000/api/attendance?employeeId=${empId}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view attendance data');
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else {
          throw new Error(`Failed to fetch attendance data: ${response.statusText || response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('Fetched attendance data:', data);
      
      setTimelogs(data);
      
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load all data when component mounts
  useEffect(() => {
    const loadAllData = async () => {
      if (isAuthenticated) {
        setAuthChecked(true);
        
        try {
          const empId = await fetchEmployeeData();
          if (empId) {
            await fetchAttendanceData(empId);
          }
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      } else {
        setAuthChecked(true);
      }
    };

    loadAllData();
  }, [isAuthenticated, user]);

  // Refresh both employee and attendance data
  const handleRefresh = async () => {
    const empId = await fetchEmployeeData();
    if (empId) {
      await fetchAttendanceData(empId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      case 'half-day': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const formatTime = (time) => {
    if (!time || time === 'N/A') return 'N/A';
    
    if (time.includes('AM') || time.includes('PM')) {
      return time;
    }
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (error) {
      return time;
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex space-x-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
        </div>
      ))}
    </div>
  );

  // Authentication and loading states
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to view your timelogs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Timelogs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5}>
                    <LoadingSkeleton />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Timelogs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Make sure you're logged in</p>
              <p>• Check your internet connection</p>
              <p>• Contact support if the issue persists</p>
            </div>
            <Button onClick={handleRefresh} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Timelogs</CardTitle>
          {employeeInfo && (
            <p className="text-sm text-muted-foreground mt-1">
              Employee: {employeeInfo.employeeName} ({employeeInfo.employeeId})
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {timelogs.length} records found
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timelogs.length > 0 ? (
                timelogs.map(log => (
                  <TableRow key={log._id || log.id}>
                    <TableCell className="font-medium">
                      {formatDate(log.date)}
                    </TableCell>
                    <TableCell>{formatTime(log.checkIn)}</TableCell>
                    <TableCell>{formatTime(log.checkOut)}</TableCell>
                    <TableCell>{log.duration || '0h 0m'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(log.status)}>
                        {formatStatus(log.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No attendance records found
                    <p className="text-sm mt-2">
                      Your attendance data will appear here once you start checking in.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        
        {/* Summary Stats */}
        {timelogs.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {timelogs.filter(log => log.status === 'present').length}
              </div>
              <div className="text-muted-foreground">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {timelogs.filter(log => log.status === 'late').length}
              </div>
              <div className="text-muted-foreground">Late</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {timelogs.filter(log => log.status === 'absent').length}
              </div>
              <div className="text-muted-foreground">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {timelogs.filter(log => log.status === 'half-day').length}
              </div>
              <div className="text-muted-foreground">Half Day</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelogsTab;
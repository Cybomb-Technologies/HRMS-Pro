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
  
} from 'lucide-react';

const ReportsSection = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredTimesheets, setFilteredTimesheets] = useState([]);

  // Enhanced API call function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('hrms_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const baseUrl = 'http://localhost:5000';
      const url = `${baseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        if (text.includes('<!doctype') || text.includes('<html')) {
          throw new Error(`Server returned HTML instead of JSON. Check if endpoint exists: ${endpoint}`);
        }
      }

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

  // Fetch timesheets data
  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      
      // Try different possible endpoints
      const endpoints = [
        '/api/timesheets',
        '/timesheets',
        '/api/timesheet'
      ];

      let data = null;
      for (const endpoint of endpoints) {
        try {
          data = await apiCall(endpoint);
          if (data && (data.timesheets || data.success)) {
            break;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed, trying next...`);
          continue;
        }
      }

      if (!data) {
        throw new Error('No valid timesheets endpoint found');
      }

      const timesheetsData = data.timesheets || data.data || [];
      setTimesheets(timesheetsData);
      setFilteredTimesheets(timesheetsData);

      toast({
        title: 'Data Loaded',
        description: `Loaded ${timesheetsData.length} timesheet records`,
      });

    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load timesheets data',
        variant: 'destructive',
      });
      // Set empty arrays to avoid further errors
      setTimesheets([]);
      setFilteredTimesheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

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
          <h1 className="text-3xl font-bold text-foreground">Timesheet Reports</h1>
          <p className="text-muted-foreground mt-2">
            View daily, weekly, and monthly timesheet records
          </p>
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
                <Button 
                  variant="outline" 
                  onClick={fetchTimesheets}
                  disabled={loading}
                >
                  Refresh
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
          {!loading && (
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

        {/* No Data State */}
        {!loading && filteredTimesheets.length === 0 && (
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
            <Button onClick={fetchTimesheets}>
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Timesheets List */}
        {!loading && filteredTimesheets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Timesheet Records
                {selectedEmployee && ` for ${uniqueEmployees.find(e => e.id === selectedEmployee)?.name}`}
                {selectedPeriod && ` - ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Reports`}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>
                  Showing {filteredTimesheets.length} of {timesheets.length} records
                </span>
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
                              ID: {timesheet.employeeId || 'N/A'}
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
      </div>
    </>
  );
};

export default ReportsSection;
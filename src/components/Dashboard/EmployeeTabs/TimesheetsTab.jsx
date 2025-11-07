// TimesheetsTab.jsx - DYNAMIC DATA ONLY (UPDATED)
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Send, 
  Edit, // Added Edit icon
  Download, 
  BarChart3,
  RefreshCw,
  Eye,
  Trash2 // Added for optional removal (not used but imported previously)
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const API_BASE_URL = 'http://localhost:5000/api';

const TimesheetsTab = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // State for Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Master dialog state for create/edit
  const [showViewTimesheet, setShowViewTimesheet] = useState(false);
  
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [stats, setStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // New state to track if we are editing

  // Utility to get user info from local storage
  const getUserData = () => {
    try {
      return JSON.parse(localStorage.getItem('hrms_user'));
    } catch (e) {
      return {};
    }
  };

  // Helper function for date calculations (Moved up for use in resetTimesheetState)
  const calculatePeriodDates = (periodType) => {
    const today = new Date();
    let startDate, endDate;

    if (periodType === 'daily') {
      startDate = new Date(today);
      endDate = new Date(today);
    } else if (periodType === 'weekly') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today);
      startDate.setDate(diff);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    // Ensure dates are formatted as 'YYYY-MM-DD' strings
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const [newTimesheet, setNewTimesheet] = useState(resetTimesheetState());

  function resetTimesheetState() {
    const initialDates = calculatePeriodDates('weekly'); // Set initial dates based on default period
    return {
      _id: null, // Used for identifying if we are editing
      periodType: 'weekly',
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      entries: [{ date: '', project: '', task: '', hours: '', description: '' }],
      comments: ''
    };
  }

  // TimesheetsTab.jsx - Enhanced API call function
  const apiCall = async (endpoint, options = {}) => {
    try {
      const token = localStorage.getItem('hrms_token');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      toast({ 
        title: 'API Error', 
        description: error.message || 'An unexpected error occurred.', 
        variant: 'destructive' 
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchTimesheets();
    fetchStats();
  }, []);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/timesheets');
      if (data.success) {
        setTimesheets(data.timesheets || []);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      // Error handled in apiCall, just updating state here
    } finally {
      setLoading(false);
    }
  };

  // FETCH STATS: Now pulls dynamic status breakdown
  const fetchStats = async () => {
    try {
      const data = await apiCall('/timesheets/stats');
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      // Error handled in apiCall
    }
  };

  // Handler for both Create and Update
  const handleSaveTimesheet = async () => {
    const isUpdating = !!newTimesheet._id;
    const method = isUpdating ? 'PUT' : 'POST';
    const endpoint = isUpdating ? `/timesheets/${newTimesheet._id}` : '/timesheets';
    const actionText = isUpdating ? 'Updating' : 'Creating';

    try {
      setSubmitting(true);
      
      // Validate entries
      const validEntries = newTimesheet.entries
        .filter(entry => entry.date && entry.project && entry.task && Number(entry.hours) > 0)
        .map(entry => ({
          ...entry,
          hours: parseFloat(entry.hours)
        }));

      if (validEntries.length === 0) {
        toast({ 
          title: 'Error', 
          description: 'Please add at least one valid time entry with hours > 0', 
          variant: 'destructive' 
        });
        return;
      }
      
      const user = getUserData();
      
      // Data payload
      const timesheetData = {
        entries: validEntries,
        comments: newTimesheet.comments,
        employeeName: user?.name || 'Unknown Employee',
        // Only include dates/period type for CREATE. For daily, startDate and endDate must be the same.
        ...(isUpdating ? {} : {
          periodType: newTimesheet.periodType,
          startDate: newTimesheet.startDate,
          endDate: newTimesheet.endDate,
        })
      };

      const data = await apiCall(endpoint, {
        method,
        body: JSON.stringify(timesheetData)
      });

      if (data.success) {
        toast({ title: 'Success', description: data.message });
        setIsDialogOpen(false);
        setIsEditing(false);
        setNewTimesheet(resetTimesheetState());
        fetchTimesheets();
        fetchStats();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      // Error handled in apiCall
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTimesheet = async (timesheetId) => {
    try {
      setSubmitting(true);
      const data = await apiCall(`/timesheets/${timesheetId}/submit`, {
        method: 'PUT'
      });

      if (data.success) {
        toast({ title: 'Success', description: data.message });
        fetchTimesheets();
        fetchStats();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      // Error handled in apiCall
    } finally {
      setSubmitting(false);
    }
  };

  // NEW: Handler to open the dialog in EDIT mode
  const handleEditTimesheet = (timesheet) => {
    setIsEditing(true);
    setNewTimesheet({
      _id: timesheet._id,
      periodType: timesheet.periodType,
      startDate: timesheet.startDate.split('T')[0], // Ensure date format for input
      endDate: timesheet.endDate.split('T')[0], // Ensure date format for input
      entries: timesheet.entries.map(entry => ({
        ...entry,
        date: entry.date.split('T')[0], // Ensure date format for input
        hours: String(entry.hours), // Ensure hours are strings for input field
      })),
      comments: timesheet.comments || ''
    });
    setIsDialogOpen(true);
  };

  const handleCreateNewTimesheet = () => {
    setIsEditing(false);
    // Ensure we calculate the current period dates when creating new
    setNewTimesheet(resetTimesheetState());
    setIsDialogOpen(true);
  };

  const handleViewTimesheet = async (timesheetId) => {
    try {
      const data = await apiCall(`/timesheets/${timesheetId}`);
      if (data.success) {
        setSelectedTimesheet(data.timesheet);
        setShowViewTimesheet(true);
      }
    } catch (error) {
      // Error handled in apiCall
    }
  };

  const addEntry = () => {
    setNewTimesheet(prev => ({
      ...prev,
      entries: [...prev.entries, { date: '', project: '', task: '', hours: '', description: '' }]
    }));
  };

  // FIX: Ensure 'hours' is stored as a string for the input type="number"
  const updateEntry = (index, field, value) => {
    const updatedEntries = [...newTimesheet.entries];
    updatedEntries[index][field] = value;
    setNewTimesheet(prev => ({ ...prev, entries: updatedEntries }));
  };

  const removeEntry = (index) => {
    const updatedEntries = newTimesheet.entries.filter((_, i) => i !== index);
    setNewTimesheet(prev => ({ ...prev, entries: updatedEntries }));
  };

  // NOTE: calculatePeriodDates function is moved up to be accessible by resetTimesheetState

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // FIX: Added Employee Name and ID to CSV export and fixed the header row
  const exportTimesheet = (timesheet) => {
    const user = getUserData();
    const employeeId = user?.employeeId || timesheet.employeeId || 'N/A';
// Assuming employeeId is present in timesheet object or user data

    const csvData = [
      [`Employee Name: ${timesheet.employeeName || user.name || 'N/A'}`],
      [`Employee ID: ${employeeId}`],
      [`Period: ${formatDate(timesheet.startDate)} - ${formatDate(timesheet.endDate)}`],
      [''], // Empty line for separation
      // FIX: Ensure header is correct and matches mapped data
      ['Date', 'Project', 'Task', 'Hours', 'Description'], 
      ...timesheet.entries.map(entry => [
        formatDate(entry.date),
        entry.project,
        entry.task,
        entry.hours,
        entry.description || ''
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => 
      // Basic CSV sanitization (wrapping fields containing comma or quotes)
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${timesheet.employeeName || 'timesheet'}_${timesheet.startDate}_to_${timesheet.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // FIX: Correctly calculates total hours using Number() conversion
  const totalHours = newTimesheet.entries.reduce((sum, entry) => sum + Number(entry.hours || 0), 0);
  
  // Helper to find count by status
  const getStatusCount = (status) => {
    return stats?.statusBreakdown?.find(s => s._id === status)?.count || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading timesheets...
      </div>
    );
  }

  // Determine if we are in a multi-day period (Weekly or Monthly)
  const isMultiDayPeriod = newTimesheet.periodType !== 'daily';

  return (
    <div className="space-y-6">
   

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Timesheets</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handleCreateNewTimesheet} disabled={submitting}>
              <Plus className="mr-2 h-4 w-4" /> 
              New Timesheet
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {timesheets.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No timesheets found.</p>
              <p className="text-sm">Create your first timesheet to get started.</p>
            </div>
          ) : (
            timesheets.map(sheet => (
              <div key={sheet._id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">
                      {formatDate(sheet.startDate)} - {formatDate(sheet.endDate)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {sheet.periodType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total Hours: {sheet.totalHours} • {sheet.entries?.length || 0} entries
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Badge className={getStatusColor(sheet.status)}>
                    {sheet.status?.charAt(0).toUpperCase() + sheet.status?.slice(1)}
                  </Badge>
                  
                  {/* View Details Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewTimesheet(sheet._id)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Download CSV Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportTimesheet(sheet)}
                    title="Download CSV"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {/* EDIT Button (Visible only if status is 'draft') */}
                  {sheet.status === 'draft' && (
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={() => handleEditTimesheet(sheet)}
                      title="Edit Timesheet"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Submit Button (Visible only if status is 'draft') */}
                  {sheet.status === 'draft' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSubmitTimesheet(sheet._id)}
                      disabled={submitting}
                      title="Submit Timesheet"
                    >
                      <Send className="mr-2 h-4 w-4" /> Submit
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT TIMESHEET DIALOG (Consolidated) */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
              setNewTimesheet(resetTimesheetState());
              setIsEditing(false);
          }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Timesheet' : 'Create New Timesheet'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Period Selection and Hours */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Period Type (Disabled when editing) */}
              <div>
                <Label>Period Type *</Label>
                <Select 
                  value={newTimesheet.periodType} 
                  onValueChange={(value) => {
                    const dates = calculatePeriodDates(value);
                    setNewTimesheet(prev => ({
                      ...prev,
                      periodType: value,
                      startDate: dates.startDate,
                      endDate: dates.endDate
                    }));
                  }}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Total Hours (Display) */}
              <div>
                <Label>Total Hours</Label>
                <Input value={totalHours.toFixed(1)} disabled />
              </div>
              
              {/* === Start Date / Single Date (Conditional) === */}
              <div className={isMultiDayPeriod ? 'col-span-1' : 'col-span-1 md:col-span-2'}>
                <Label>{isMultiDayPeriod ? 'Start Date *' : 'Date *'}</Label>
                <Input 
                  type="date" 
                  value={newTimesheet.startDate}
                  onChange={(e) => setNewTimesheet(prev => ({ 
                      ...prev, 
                      startDate: e.target.value,
                      // If daily, set both start and end date to the same value
                      ...(!isMultiDayPeriod && { endDate: e.target.value })
                  }))}
                  required
                  disabled={isEditing}
                />
              </div>
              
              {/* === End Date (Conditional) === */}
              {isMultiDayPeriod && (
                <div>
                  <Label>End Date *</Label>
                  <Input 
                    type="date" 
                    value={newTimesheet.endDate}
                    onChange={(e) => setNewTimesheet(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                    disabled={isEditing}
                  />
                </div>
              )}
            </div>

            {/* Time Entries Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">Time Entries *</Label>
                <Button type="button" onClick={addEntry} size="sm">
                  <Plus className="h-4 w-4" /> Add Entry
                </Button>
              </div>
              
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {newTimesheet.entries.map((entry, index) => (
                  <div key={index} className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 border rounded-lg bg-secondary/10">
                    <div>
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <Input
                        type="date"
                        value={entry.date}
                        onChange={(e) => updateEntry(index, 'date', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Project</Label>
                      <Input
                        value={entry.project}
                        onChange={(e) => updateEntry(index, 'project', e.target.value)}
                        placeholder="Project name"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Task</Label>
                      <Input
                        value={entry.task}
                        onChange={(e) => updateEntry(index, 'task', e.target.value)}
                        placeholder="Task details"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={entry.hours}
                        onChange={(e) => updateEntry(index, 'hours', e.target.value)}
                        placeholder="0.0"
                        required
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Input
                        value={entry.description}
                        onChange={(e) => updateEntry(index, 'description', e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                    <div className="flex items-end col-span-2 sm:col-span-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeEntry(index)}
                        disabled={newTimesheet.entries.length === 1}
                        className="h-10 w-full"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Comments */}
            <div>
                <Label>Comments</Label>
                <Textarea
                    value={newTimesheet.comments}
                    onChange={(e) => setNewTimesheet(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Add comments for your approver (optional)"
                />
            </div>

            {/* Footer Buttons */}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTimesheet}
                disabled={submitting || totalHours === 0}
              >
                {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Timesheet')}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* View Timesheet Dialog (Assuming this component is available elsewhere) */}
      {/* The view dialog logic remains the same as provided in previous context */}
      {/* ... (Existing View Dialog JSX below) ... */}
<Dialog open={showViewTimesheet} onOpenChange={setShowViewTimesheet}>
  <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Timesheet Details</DialogTitle>
    </DialogHeader>
    {selectedTimesheet && (
      <div className="space-y-6">
        
        {/* === Header Information Panel === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-muted/50 rounded-lg border">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Period</Label>
            <p className="font-semibold text-base">
              {formatDate(selectedTimesheet.startDate)} - {formatDate(selectedTimesheet.endDate)}
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Type</Label>
            <p className="font-semibold text-base capitalize">{selectedTimesheet.periodType}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <div className="mt-1">
              <Badge className={`${getStatusColor(selectedTimesheet.status)} text-sm font-medium`}>
                {selectedTimesheet.status?.charAt(0).toUpperCase() + selectedTimesheet.status?.slice(1)}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Total Hours</Label>
            <p className="font-bold text-base text-primary">{selectedTimesheet.totalHours}</p>
          </div>
        </div>

        {/* === Comments Section === */}
        {selectedTimesheet.comments && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Comments</Label>
            <div className="p-3 border rounded-lg bg-background shadow-inner">
              <p className="text-sm whitespace-pre-wrap break-words">
                {selectedTimesheet.comments}
              </p>
            </div>
          </div>
        )}

        {/* === Time Entries List === */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Time Entries ({selectedTimesheet.entries?.length || 0})</Label>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2"> 
            
            {/* Timesheet Entries Header (Simulated Table Header for Desktop) */}
            <div className="hidden lg:grid grid-cols-[1fr_1.5fr_2fr_0.5fr_2fr] gap-4 font-medium text-xs text-muted-foreground uppercase pb-1 border-b">
                <span>Date</span>
                <span>Project</span>
                <span>Task</span>
                <span>Hours</span>
                <span>Description</span>
            </div>

            {selectedTimesheet.entries?.map((entry, index) => (
              <div key={index} className="p-4 border rounded-lg bg-card shadow-sm hover:border-blue-300 transition-colors">
                
                {/* Time Entry Row (Responsive Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.5fr_2fr_0.5fr_2fr] gap-4">
                  
                  {/* Date */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium lg:hidden">Date</Label>
                    <p className="text-sm">{formatDate(entry.date)}</p>
                  </div>
                  
                  {/* Project */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium lg:hidden">Project</Label>
                    <p className="text-sm font-medium text-primary/80">{entry.project}</p>
                  </div>
                  
                  {/* Task */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium lg:hidden">Task</Label>
                    <p className="text-sm break-words">{entry.task}</p>
                  </div>
                  
                  {/* Hours */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium lg:hidden">Hours</Label>
                    <p className="text-sm font-bold text-green-600">{entry.hours}</p>
                  </div>
                  
                  {/* Description - Spans the remaining space */}
                  <div className="space-y-1 md:col-span-2 lg:col-span-1">
                    <Label className="text-xs font-medium lg:hidden">Description</Label>
                    <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                      {entry.description || 'No description'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === Additional Information (Approver/Submitted At) === */}
        {(selectedTimesheet.approverName || selectedTimesheet.submittedAt) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {selectedTimesheet.approverName && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Approved By</Label>
                <p className="text-sm font-medium">{selectedTimesheet.approverName}</p>
              </div>
            )}
            {selectedTimesheet.submittedAt && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Submitted At</Label>
                <p className="text-sm">{formatDate(selectedTimesheet.submittedAt)}</p> 
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
};

export default TimesheetsTab;

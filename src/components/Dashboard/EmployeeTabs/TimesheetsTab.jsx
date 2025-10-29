// TimesheetsTab.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Send, 
  Edit, 
  Download, 
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

const TimesheetsTab = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [showNewTimesheet, setShowNewTimesheet] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [stats, setStats] = useState(null);

  // New timesheet form state
  const [newTimesheet, setNewTimesheet] = useState({
    periodType: 'weekly',
    startDate: '',
    endDate: '',
    entries: [{ date: '', project: '', task: '', hours: 0, description: '' }]
  });

  useEffect(() => {
    fetchTimesheets();
    fetchStats();
  }, []);

  const fetchTimesheets = async () => {
    try {
      const response = await fetch('/api/timesheets');
      const data = await response.json();
      if (response.ok) {
        setTimesheets(data.timesheets || []);
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch timesheets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/timesheets/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateTimesheet = async () => {
    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTimesheet)
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Success', description: data.message });
        setShowNewTimesheet(false);
        setNewTimesheet({
          periodType: 'weekly',
          startDate: '',
          endDate: '',
          entries: [{ date: '', project: '', task: '', hours: 0, description: '' }]
        });
        fetchTimesheets();
        fetchStats();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create timesheet', variant: 'destructive' });
    }
  };

  const handleSubmitTimesheet = async (timesheetId) => {
    try {
      const response = await fetch(`/api/timesheets/${timesheetId}/submit`, {
        method: 'PUT'
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Success', description: data.message });
        fetchTimesheets();
        fetchStats();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit timesheet', variant: 'destructive' });
    }
  };

  const handleApproveReject = async (timesheetId, status) => {
    try {
      const response = await fetch(`/api/timesheets/${timesheetId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'Success', description: data.message });
        fetchTimesheets();
        fetchStats();
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update timesheet', variant: 'destructive' });
    }
  };

  const addEntry = () => {
    setNewTimesheet(prev => ({
      ...prev,
      entries: [...prev.entries, { date: '', project: '', task: '', hours: 0, description: '' }]
    }));
  };

  const updateEntry = (index, field, value) => {
    const updatedEntries = [...newTimesheet.entries];
    updatedEntries[index][field] = value;
    setNewTimesheet(prev => ({ ...prev, entries: updatedEntries }));
  };

  const removeEntry = (index) => {
    const updatedEntries = newTimesheet.entries.filter((_, i) => i !== index);
    setNewTimesheet(prev => ({ ...prev, entries: updatedEntries }));
  };

  const calculatePeriodDates = (periodType) => {
    const today = new Date();
    let startDate, endDate;

    if (periodType === 'weekly') {
      // Start from Monday
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today.setDate(diff));
      endDate = new Date(today.setDate(startDate.getDate() + 6));
    } else {
      // Monthly
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportTimesheet = (timesheet) => {
    const csvContent = [
      ['Date', 'Project', 'Task', 'Hours', 'Description'],
      ...timesheet.entries.map(entry => [
        formatDate(entry.date),
        entry.project,
        entry.task,
        entry.hours,
        entry.description
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet-${timesheet.startDate}-to-${timesheet.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8">Loading timesheets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Timesheet Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.totalTimesheets}</div>
                <div className="text-sm text-muted-foreground">Total Timesheets</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{stats.totalHours}</div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.statusBreakdown.find(s => s._id === 'submitted')?.count || 0}
                </div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.statusBreakdown.find(s => s._id === 'approved')?.count || 0}
                </div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Timesheets</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={showNewTimesheet} onOpenChange={setShowNewTimesheet}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Timesheet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Timesheet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Period Type</Label>
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
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Total Hours</Label>
                      <Input 
                        value={newTimesheet.entries.reduce((sum, entry) => sum + Number(entry.hours), 0)} 
                        disabled 
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input 
                        type="date" 
                        value={newTimesheet.startDate}
                        onChange={(e) => setNewTimesheet(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input 
                        type="date" 
                        value={newTimesheet.endDate}
                        onChange={(e) => setNewTimesheet(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Time Entries</Label>
                      <Button type="button" onClick={addEntry} size="sm">
                        <Plus className="h-4 w-4" /> Add Entry
                      </Button>
                    </div>
                    
                    {newTimesheet.entries.map((entry, index) => (
                      <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 border rounded-lg">
                        <Input
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateEntry(index, 'date', e.target.value)}
                          placeholder="Date"
                        />
                        <Input
                          value={entry.project}
                          onChange={(e) => updateEntry(index, 'project', e.target.value)}
                          placeholder="Project"
                        />
                        <Input
                          value={entry.task}
                          onChange={(e) => updateEntry(index, 'task', e.target.value)}
                          placeholder="Task"
                        />
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={entry.hours}
                          onChange={(e) => updateEntry(index, 'hours', parseFloat(e.target.value) || 0)}
                          placeholder="Hours"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={entry.description}
                            onChange={(e) => updateEntry(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEntry(index)}
                            disabled={newTimesheet.entries.length === 1}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewTimesheet(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTimesheet}>
                      Create Timesheet
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {timesheets.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No timesheets found. Create your first timesheet to get started.
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
                    Total Hours: {sheet.totalHours} • {sheet.entries.length} entries
                  </p>
                  {sheet.comments && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Comments: {sheet.comments}
                    </p>
                  )}
                  {sheet.approverName && (
                    <p className="text-sm text-muted-foreground">
                      Approved by: {sheet.approverName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Badge className={getStatusColor(sheet.status)}>
                    {sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)}
                  </Badge>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportTimesheet(sheet)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  {sheet.status === 'draft' && (
                    <>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleSubmitTimesheet(sheet._id)}
                      >
                        <Send className="mr-2 h-4 w-4" /> Submit
                      </Button>
                    </>
                  )}

                  {/* Admin actions */}
                  {sheet.status === 'submitted' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleApproveReject(sheet._id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleApproveReject(sheet._id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimesheetsTab;
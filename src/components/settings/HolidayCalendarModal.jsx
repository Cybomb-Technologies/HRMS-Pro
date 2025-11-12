// HolidayCalendarModal.jsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';

// Fallback initial holidays for UI until backend responds
const initialHolidays = [
  { id: 1, date: new Date(new Date().getFullYear(), 11, 25), name: 'Christmas Day' },
  { id: 2, date: new Date(new Date().getFullYear(), 0, 1), name: "New Year's Day" },
];

const HolidayCalendarModal = () => {
  const { apiRequest } = useSettings();
  const [holidays, setHolidays] = useState(initialHolidays.sort((a, b) => a.date - b.date));
  const [newDate, setNewDate] = useState(null);
  const [newName, setNewName] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);

  // Convert server holiday objects into {id, date: Date, name}
  const normalizeFromServer = (arr = []) => {
    return arr
      .map((h) => ({
        id: h.id || h._id || `temp-${Date.now()}-${Math.random()}`,
        date: h.date ? new Date(h.date) : new Date(),
        name: h.name || 'Unnamed Holiday',
      }))
      .sort((a, b) => a.date - b.date);
  };

  // Convert to server format
  const normalizeToServer = (arr = []) => {
    return arr.map(h => ({
      id: h.id,
      name: h.name,
      date: h.date.toISOString()
    }));
  };

  // Load current holidays from backend when modal opens
  const loadHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';

      const response = await apiRequest(`${baseUrl}/api/settings/company/holidays`);
      
      if (response.success) {
        const serverHolidays = response.data.holidays || [];
        if (serverHolidays.length > 0) {
          setHolidays(normalizeFromServer(serverHolidays));
        } else {
          setHolidays(initialHolidays);
        }
      } else {
        throw new Error(response.message || 'Failed to load holidays');
      }
    } catch (err) {
      console.error('Error loading holidays:', err);
      setError(err.message || 'Failed to load holidays');
      // Keep the initial holidays as fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadHolidays();
    }
  }, [open]);

  const addHoliday = () => {
    if (newDate && newName.trim()) {
      const newEntry = {
        id: `temp-${Date.now()}`,
        date: newDate,
        name: newName.trim(),
      };
      setHolidays((prev) => [...prev, newEntry].sort((a, b) => a.date - b.date));
      setNewDate(null);
      setNewName('');
      setIsPopoverOpen(false);
      setError(null);
    }
  };

  const removeHoliday = (id) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  // Save holidays to backend (dates sent as ISO strings)
  const saveCalendar = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        holidays: normalizeToServer(holidays)
      };

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin 
        : 'http://localhost:5000';

      const response = await apiRequest(`${baseUrl}/api/settings/company/holidays`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (response.success) {
        // Reload holidays to get the server-normalized data
        await loadHolidays();
        setOpen(false);
      } else {
        throw new Error(response.message || 'Failed to save holidays');
      }
    } catch (err) {
      console.error('Error saving holidays:', err);
      setError(err.message || 'Failed to save holiday calendar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Calendars</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Manage Company Holiday Calendar</DialogTitle>
          <p className="text-muted-foreground">Define the days your company observes as paid holidays.</p>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-semibold mb-2">Holiday Picker</h3>
            <div className="flex flex-col md:flex-row gap-6 p-4 border rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex-shrink-0">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  className="rounded-xl border shadow-lg bg-white dark:bg-gray-800"
                  modifiers={{ highlighted: holidays.map((h) => h.date) }}
                  modifiersStyles={{
                    highlighted: {
                      backgroundColor: 'hsl(142.1 76.2% 36.3%)',
                      color: 'white',
                      borderRadius: '0.375rem',
                    },
                  }}
                />
              </div>

              <div className="flex-grow space-y-4">
                <h4 className="font-semibold text-lg border-b pb-2">New Entry</h4>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-full justify-start text-left font-normal', !newDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newDate ? newDate.toLocaleDateString() : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={newDate} 
                        onSelect={setNewDate} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holidayName">Holiday Name</Label>
                  <Input
                    id="holidayName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Thanksgiving Break"
                    maxLength={50}
                  />
                </div>

                <Button 
                  onClick={addHoliday} 
                  disabled={!newDate || !newName.trim()} 
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Holiday
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">
              Configured Holidays ({holidays.length})
              {loading && <RefreshCw className="w-4 h-4 ml-2 animate-spin inline" />}
            </h3>

            <div className="space-y-1 max-h-96 overflow-y-auto border rounded-xl p-3 shadow-inner bg-white dark:bg-gray-800">
              {loading ? (
                <p className="text-sm text-center py-4">Loading holidays...</p>
              ) : holidays.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-4">
                  No holidays configured yet. Add one!
                </p>
              ) : (
                holidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/70 transition-colors">
                    <span className="text-sm font-medium truncate">
                      <span className="text-muted-foreground mr-2">
                        {h.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}:
                      </span>
                      {h.name}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeHoliday(h.id)} 
                      className="text-red-500 hover:bg-red-500/10" 
                      title="Remove Holiday"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button 
              className="w-full mt-4" 
              onClick={saveCalendar} 
              disabled={saving || loading}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save Calendar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HolidayCalendarModal;
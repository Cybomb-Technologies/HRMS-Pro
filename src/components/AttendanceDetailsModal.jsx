import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAdminAttendance } from '@/contexts/AdminAttendanceContext';
import { Clock, LogOut, Loader2, Calendar } from 'lucide-react';
import PhotoViewer from './PhotoViewer';
import LocationViewer from './LocationViewer';

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

const AttendanceDetailsModal = ({ record, isOpen, onClose }) => {
  const [detailedRecord, setDetailedRecord] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const { fetchAttendanceDetails } = useAdminAttendance();

  // Fetch detailed data and shift information when modal opens
  useEffect(() => {
    const fetchDetailedData = async () => {
      if (isOpen && record && record._id) {
        setLoading(true);
        setShiftLoading(true);
        try {
          // Fetch detailed attendance data
          const detailedData = await fetchAttendanceDetails(record._id);
          setDetailedRecord(detailedData);

          // Fetch current shift data dynamically
          await fetchCurrentShift(record.employeeId || detailedData.employeeId);
        } catch (error) {
          console.error('Error fetching attendance details:', error);
          // If API fails, use the basic record data as fallback
          setDetailedRecord(record);
          // Still try to fetch shift data
          if (record.employeeId) {
            await fetchCurrentShift(record.employeeId);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDetailedData();
  }, [isOpen, record]);

  // Fetch current shift data dynamically
  const fetchCurrentShift = async (employeeId) => {
    if (!employeeId) {
      console.log('No employeeId provided for shift fetch');
      setShiftLoading(false);
      return;
    }

    try {
      setShiftLoading(true);
      const token = localStorage.getItem('hrms_token');
      
      console.log('Fetching current shift for employeeId:', employeeId);
      
      const response = await fetch(`http://localhost:5000/api/employees/employeesShifts?employeeId=${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Shift API Response for modal:', data);
        
        if (data.success && data.assignments && data.assignments.length > 0) {
          // Get the most recent active shift assignment
          const sortedAssignments = data.assignments.sort((a, b) => 
            new Date(b.effectiveDate) - new Date(a.effectiveDate)
          );
          
          const currentShift = sortedAssignments[0];
          setCurrentShift(currentShift);
          console.log('Current shift set in modal:', currentShift);
        } else {
          console.log('No active shift assignment found');
          setCurrentShift(null);
        }
      } else {
        console.error('Failed to fetch shift assignments:', response.status);
        setCurrentShift(null);
      }
    } catch (error) {
      console.error('Error fetching shift data in modal:', error);
      setCurrentShift(null);
    } finally {
      setShiftLoading(false);
    }
  };

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDetailedRecord(null);
      setCurrentShift(null);
      setLoading(false);
      setShiftLoading(false);
    }
  }, [isOpen]);

  const displayRecord = detailedRecord || record;
  if (!displayRecord) return null;

  // Get shift data - prioritize dynamic data over static record data
  const getShiftData = () => {
    // If we have dynamically fetched shift data, use it
    if (currentShift) {
      return {
        shiftName: currentShift.shiftName,
        startTime: currentShift.startTime,
        endTime: currentShift.endTime,
        breakDuration: currentShift.breakDuration,
        effectiveDate: currentShift.effectiveDate,
        isActive: currentShift.isActive
      };
    }
    
    // Fallback to record data
    return {
      shiftName: displayRecord.shiftName || displayRecord.shift,
      startTime: displayRecord.shiftStart,
      endTime: displayRecord.shiftEnd,
      breakDuration: displayRecord.breakDuration
    };
  };

  const shiftData = getShiftData();

  // Helper function to format time
  const formatTime = (time) => {
    if (!time) return '-';
    if (typeof time === 'string') return time;
    if (time instanceof Date) return time.toLocaleTimeString('en-US', { hour12: true });
    return '-';
  };

  // Helper function to format date
  const formatDate = (date) => {
    if (!date) return '-';
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    return '-';
  };

  // Helper function to get location details
  const getLocationDetails = (location) => {
    if (!location) return null;
    
    if (typeof location === 'string') {
      return { address: location };
    }
    
    if (typeof location === 'object') {
      return {
        address: location.address || location.formattedAddress || 'Location recorded',
        latitude: location.latitude || location.lat,
        longitude: location.longitude || location.lng,
        accuracy: location.accuracy
      };
    }
    
    return null;
  };

  const checkInLocation = getLocationDetails(displayRecord.checkInLocation);
  const checkOutLocation = getLocationDetails(displayRecord.checkOutLocation);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Attendance Details
            {(loading || shiftLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            Detailed information for {displayRecord.employee || displayRecord.employeeName || displayRecord.employee?.name || 'Unknown Employee'}'s attendance
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Employee Information */}
            <div>
              <h4 className="font-semibold mb-3 text-base">Employee Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                    {displayRecord.employeeName || displayRecord.employee?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                    {formatDate(displayRecord.date)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge 
                      className="text-xs capitalize"
                      style={{ 
                        backgroundColor: getStatusColor(displayRecord.status).backgroundColor,
                        color: getStatusColor(displayRecord.status).textColor
                      }}
                    >
                      {displayRecord.status ? displayRecord.status.charAt(0).toUpperCase() + displayRecord.status.slice(1) : 'Absent'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Employee ID</Label>
                  <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                    {displayRecord.employeeId || 'N/A'}
                  </p>
                </div>
                {displayRecord.teamId && (
                  <div>
                    <Label className="text-sm font-medium">Team ID</Label>
                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                      {displayRecord.teamId}
                    </p>
                  </div>
                )}
                {displayRecord.duration && (
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                      {displayRecord.duration}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Shift Information */}
            <div>
              <h4 className="font-semibold mb-3 text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Shift Information
                {shiftLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </h4>
              {shiftData.shiftName ? (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label className="text-sm font-medium text-blue-800">Shift Name</Label>
                    <p className="text-sm mt-1 font-medium">
                      {shiftData.shiftName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-800">Schedule</Label>
                    <p className="text-sm mt-1">
                      {shiftData.startTime || '09:00'} - {shiftData.endTime || '17:00'}
                      {shiftData.breakDuration ? ` • Break: ${shiftData.breakDuration}m` : ''}
                    </p>
                  </div>
                  {shiftData.effectiveDate && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-blue-800">Effective Date</Label>
                      <p className="text-sm mt-1">
                        {formatDate(shiftData.effectiveDate)}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        shiftData.isActive 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {shiftData.isActive ? 'Active Shift' : 'Inactive Shift'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Calendar className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800">No shift assignment found</p>
                  <p className="text-xs text-yellow-700 mt-1">Contact HR for shift assignment</p>
                </div>
              )}
            </div>

            {/* Check-in Information */}
            <div>
              <h4 className="font-semibold mb-3 text-base">Check-in Details</h4>
              {displayRecord.checkIn ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Time</Label>
                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                      {formatTime(displayRecord.checkIn)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <div className="mt-1">
                      {checkInLocation ? (
                        <LocationViewer location={checkInLocation} type="Check-in" />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded text-muted-foreground">
                          No location data
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Verification Photo</Label>
                    <div className="mt-2">
                      <PhotoViewer 
                        src={displayRecord.checkInPhoto} 
                        alt={`Check-in photo for ${displayRecord.employeeName || 'Employee'}`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-800">No check-in recorded</p>
                </div>
              )}
            </div>

            {/* Check-out Information */}
            <div>
              <h4 className="font-semibold mb-3 text-base">Check-out Details</h4>
              {displayRecord.checkOut ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Time</Label>
                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                      {formatTime(displayRecord.checkOut)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <div className="mt-1">
                      {checkOutLocation ? (
                        <LocationViewer location={checkOutLocation} type="Check-out" />
                      ) : (
                        <p className="text-sm p-2 bg-gray-50 rounded text-muted-foreground">
                          No location data
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Verification Photo</Label>
                    <div className="mt-2">
                      <PhotoViewer 
                        src={displayRecord.checkOutPhoto} 
                        alt={`Check-out photo for ${displayRecord.employeeName || 'Employee'}`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <LogOut className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-800">No check-out recorded yet</p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            {(displayRecord.notes || displayRecord.remarks) && (
              <div>
                <h4 className="font-semibold mb-3 text-base">Additional Information</h4>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm">{displayRecord.notes || displayRecord.remarks}</p>
                </div>
              </div>
            )}

          
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDetailsModal;
const Attendance = require('../models/Attendance');
const Timesheet = require('../models/Timesheet');
const ManualRequest = require('../models/ManualRequest');
const mongoose = require('mongoose');
// In attendanceController.js - Updated checkIn function with late detection
const checkIn = async (req, res) => {
  try {
    const { 
      employeeId,
      employee, 
      checkInTime, 
      latitude, 
      longitude, 
      address, 
      accuracy,
      photo,
      teamId,
      faceVerified, 
      faceMatchDistance 
    } = req.body;

    console.log('Received check-in request:', { employeeId, employee });

    // Validate that employee exists by employeeId
    const Employee = require('../models/Employee');
    const employeeExists = await Employee.findOne({ employeeId: employeeId });

    if (!employeeExists) {
      console.log('Employee not found with employeeId:', employeeId);
      return res.status(400).json({
        message: 'Employee not found. Please check employee ID.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: employeeId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        message: 'Already checked in for today'
      });
    }

    // Get employee's current shift to check for late check-in
    const EmployeeShift = require('../models/attendance/EmployeeShift');
    const currentShift = await EmployeeShift.findOne({
      employeeId: employeeId,
      isActive: true
    }).populate('shiftId').lean();

    let status = 'present';
    let isLate = false;
    let lateMinutes = 0;

    // Check if check-in is late
    if (currentShift && currentShift.shiftId) {
      const shiftStartTime = currentShift.shiftId.startTime; // Format: "09:00"
      const checkInTimeObj = new Date(`${today.toDateString()} ${checkInTime}`);
      
      // Parse shift start time
      const [shiftHours, shiftMinutes] = shiftStartTime.split(':').map(Number);
      const shiftStartTimeObj = new Date(today);
      shiftStartTimeObj.setHours(shiftHours, shiftMinutes, 0, 0);

      // Calculate if check-in is late
      if (checkInTimeObj > shiftStartTimeObj) {
        isLate = true;
        lateMinutes = Math.floor((checkInTimeObj - shiftStartTimeObj) / (1000 * 60));
        status = 'late';
        
        console.log(`Late check-in detected: ${lateMinutes} minutes late`);
      }
    }

    let attendance;
    
    if (existingAttendance) {
      // Update existing record
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        {
          checkIn: checkInTime,
          checkInLocation: { latitude, longitude, address, accuracy },
          checkInPhoto: photo,
          status: status,
          isLate: isLate,
          lateMinutes: lateMinutes
        },
        { new: true }
      );
    } else {
      // Create new record
      attendance = new Attendance({
        employeeId: employeeId,
        employee: employeeExists.name,
        date: today,
        checkIn: checkInTime,
        checkInLocation: { latitude, longitude, address, accuracy },
        checkInPhoto: photo,
        status: status,
        isLate: isLate,
        lateMinutes: lateMinutes,
        teamId,
        location: address || 'Office',
        faceVerified: faceVerified || false, 
        faceMatchDistance: faceMatchDistance || null 
      });
      await attendance.save();
    }

    res.status(200).json({
      message: isLate ? `Checked in successfully (${lateMinutes} minutes late)` : 'Checked in successfully',
      attendance,
      isLate,
      lateMinutes
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// In attendanceController.js - Updated checkOut function with break deduction
const checkOut = async (req, res) => {
  try {
    const { 
      employeeId, 
      checkOutTime, 
      latitude, 
      longitude, 
      address, 
      accuracy,
      photo 
    } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({
        message: 'No check-in record found for today'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: 'Already checked out for today'
      });
    }

    // Get shift details for break duration
    const EmployeeShift = require('../models/attendance/EmployeeShift');
    const currentShift = await EmployeeShift.findOne({
      employeeId: employeeId,
      isActive: true
    }).populate('shiftId').lean();

    const breakDuration = currentShift?.shiftId?.breakDuration || 60; // Default 60 minutes

    // Calculate duration with break deduction
    const checkInTime = new Date(`${today.toDateString()} ${attendance.checkIn}`);
    const checkOutTimeObj = new Date(`${today.toDateString()} ${checkOutTime}`);
    
    // Calculate total minutes worked
    const totalMinutes = Math.floor((checkOutTimeObj - checkInTime) / (1000 * 60));
    
    // Subtract break duration (convert to minutes)
    const workingMinutes = Math.max(0, totalMinutes - breakDuration);
    
    const hours = Math.floor(workingMinutes / 60);
    const minutes = workingMinutes % 60;
    const duration = `${hours}h ${minutes}m`;

    // Update status if it was late check-in
    let finalStatus = attendance.status;
    if (attendance.isLate && finalStatus === 'late') {
      // Keep as late even after check-out
      finalStatus = 'late';
    }

    // Update attendance record
    attendance.checkOut = checkOutTime;
    attendance.checkOutLocation = { latitude, longitude, address, accuracy };
    attendance.checkOutPhoto = photo;
    attendance.duration = duration;
    attendance.status = finalStatus;
    attendance.workingMinutes = workingMinutes;
    attendance.totalMinutes = totalMinutes;
    attendance.breakDuration = breakDuration;

    await attendance.save();

    res.status(200).json({
      message: 'Checked out successfully',
      attendance,
      breakDeducted: `${breakDuration}m`,
      netWorkingHours: duration
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// controllers/attendanceController.js - Updated getAttendance function
const getAttendance = async (req, res) => {
  try {
    const { date, employeeId, teamId, status, startDate, endDate } = req.query;
    let filter = {};

    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      filter.date = {
        $gte: targetDate,
        $lt: nextDay
      };
    }

    if (employeeId) {
      filter.employeeId = employeeId; // Now using EMP003 directly
    }

    if (teamId) {
      filter.teamId = parseInt(teamId);
    }

    if (status) {
      filter.status = status;
    }

    console.log('Attendance filter:', filter);

    const attendance = await Attendance.find(filter)
      .sort({ date: -1, checkIn: -1 })
      .select('-checkInPhoto -checkOutPhoto')
      .lean();

    console.log(`Found ${attendance.length} attendance records`);

    // Get shift data for all records
    const formattedAttendance = await Promise.all(
      attendance.map(async (record) => {
        try {
          // Get current shift assignment for this employee
          let shiftData = {
            shift: 'General Shift',
            shiftName: 'General Shift', 
            shiftStart: '09:00',
            shiftEnd: '17:00'
          };

          const EmployeeShift = require('../models/attendance/EmployeeShift');
          const currentShift = await EmployeeShift.findOne({
            employeeId: record.employeeId, // Use EMP003
            isActive: true
          }).populate('shiftId').lean();

          if (currentShift && currentShift.shiftId) {
            shiftData = {
              shift: currentShift.shiftId.name || 'General Shift',
              shiftName: currentShift.shiftId.name || 'General Shift',
              shiftStart: currentShift.shiftId.startTime || '09:00',
              shiftEnd: currentShift.shiftId.endTime || '17:00'
            };
          }

          return {
            _id: record._id,
            employeeId: record.employeeId, // EMP003
            employee: record.employee,
            date: record.date,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            status: record.status,
            duration: record.duration,
            location: record.location,
            teamId: record.teamId,
            ...shiftData,
            checkInPhoto: record.checkInPhoto,
            checkOutPhoto: record.checkOutPhoto
          };
        } catch (error) {
          console.error(`Error processing attendance record ${record._id}:`, error);
          return {
            _id: record._id,
            employeeId: record.employeeId,
            employee: record.employee,
            date: record.date,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            status: record.status,
            duration: record.duration,
            location: record.location,
            teamId: record.teamId,
            shift: 'General Shift',
            shiftName: 'General Shift',
            shiftStart: '09:00',
            shiftEnd: '17:00'
          };
        }
      })
    );

    res.json(formattedAttendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific attendance photo
const getAttendancePhoto = async (req, res) => {
  try {
    const { id, type } = req.params; // type: 'checkin' or 'checkout'
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const photo = type === 'checkin' ? attendance.checkInPhoto : attendance.checkOutPhoto;
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Return photo data (assuming base64)
    res.json({ photo });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// In attendanceController.js - Fix getTodayAttendance function
const getTodayAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    console.log('getTodayAttendance called with employeeId:', employeeId);
    
    // Validate employeeId
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('Looking for attendance with:', {
      employeeId: employeeId,
      date: today
    });

    // FIX: Directly query by employeeId string (EMP003) without population
    const attendance = await Attendance.findOne({
      employeeId: employeeId, // Use the string directly (EMP003)
      date: today
    });

    console.log('Found attendance record:', attendance);

    if (!attendance) {
      console.log('No attendance record found for today');
      return res.json(null);
    }

    // Get shift data separately without population
    let shiftData = {
      shift: 'General Shift',
      shiftName: 'General Shift',
      shiftStart: '09:00',
      shiftEnd: '17:00'
    };

    try {
      const EmployeeShift = require('../models/attendance/EmployeeShift');
      const currentShift = await EmployeeShift.findOne({
        employeeId: employeeId, // Use string directly
        isActive: true
      }).populate('shiftId').lean();

      if (currentShift && currentShift.shiftId) {
        shiftData = {
          shift: currentShift.shiftId.name || 'General Shift',
          shiftName: currentShift.shiftId.name || 'General Shift',
          shiftStart: currentShift.shiftId.startTime || '09:00',
          shiftEnd: currentShift.shiftId.endTime || '17:00'
        };
      }
    } catch (shiftError) {
      console.error('Error fetching shift data:', shiftError);
      // Continue with default shift data
    }

    const formattedAttendance = {
      ...attendance.toObject(),
      ...shiftData
    };

    console.log('Returning formatted attendance:', formattedAttendance);
    res.json(formattedAttendance);

  } catch (error) {
    console.error('Get today attendance error:', error);
    
    // More specific error messages
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid employee ID format',
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// In attendanceController.js - FIXED createManualRequest
const createManualRequest = async (req, res) => {
  try {
    const { date, requestedIn, requestedOut, reason } = req.body;

    // FIX: Use safe fallbacks for all user data
    const manualRequest = new ManualRequest({
      employeeId: req.user.id || req.user._id, // Use either id or _id
      employee: req.user.name || req.user.email?.split('@')[0] || 'Employee', // Multiple fallbacks
      date: new Date(date),
      requestedIn,
      requestedOut,
      reason,
      teamId: req.user.teamId || 1 // Default team ID
    });

    await manualRequest.save();

    res.status(201).json({
      message: 'Manual attendance request submitted',
      request: manualRequest
    });
  } catch (error) {
    console.error('Manual request error:', error);
    
    // Handle duplicate request error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'You already have a pending request for this date' 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getAttendancePhoto,
  getTodayAttendance,
  createManualRequest
};
// controllers/adminAttendanceController.js
const Attendance = require('../models/Attendance');
const Timesheet = require('../models/Timesheet');
const ManualRequest = require('../models/ManualRequest');
const Shift = require('../models/attendance/Shift');
const EmployeeShift = require('../models/attendance/EmployeeShift');
const AttendanceReport = require('../models/attendance/AttendanceReport');
const Employee = require('../models/Employee');
// Add to adminAttendanceController.js
const debugEmployeeData = async (req, res) => {
  try {
    const employees = await Employee.find({ status: 'active' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.find({
      date: { $gte: today }
    });
    
    res.json({
      totalEmployees: employees.length,
      employeeIds: employees.map(e => e.employeeId),
      attendanceCount: attendance.length,
      attendanceRecords: attendance.map(a => ({
        employeeId: a.employeeId,
        status: a.status
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active employees
    const activeEmployees = await Employee.find({ status: 'active' })
      .select('_id name email department employeeId')
      .lean();

    const totalEmployees = activeEmployees.length;

    // Get today's attendance records
    const todayAttendance = await Attendance.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).lean();

    // Count status from actual records
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;

    todayAttendance.forEach(record => {
      switch (record.status) {
        case 'present':
          presentCount++;
          break;
        case 'late':
          lateCount++;
          break;
        case 'half-day':
          halfDayCount++;
          break;
      }
    });

    // Calculate absent count (employees without any attendance record)
    const employeesWithAttendance = new Set(
      todayAttendance.map(record => record.employeeId)
    );

    const absentCount = activeEmployees.filter(employee => 
      !employeesWithAttendance.has(employee.employeeId)
    ).length;

    // Get pending requests
    const pendingRequests = await ManualRequest.countDocuments({
      status: 'pending'
    });

    const stats = {
      totalEmployees,
      presentToday: presentCount + lateCount + halfDayCount,
      absentToday: absentCount,
      lateToday: lateCount,
      onLeave: 0,
      pendingRequests,
      pendingTimesheets: 0
    };

    console.log('Dashboard Stats:', stats);

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// controllers/adminAttendanceController.js - Update getAttendanceData function
const getAttendanceData = async (req, res) => {
  try {
    const { 
      date, 
      employeeId, // This is now EMP003 (String), not ObjectId
      teamId, 
      status, 
      department,
      includeAbsent = 'false',
      page = 1, 
      limit = 100 
    } = req.query;

    const skip = (page - 1) * limit;
    const shouldIncludeAbsent = includeAbsent === 'true';

    // Date filter - default to today if no date provided
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get all active employees
    let activeEmployeesFilter = { status: 'active' };
    if (department) activeEmployeesFilter.department = department;

    const activeEmployees = await Employee.find(activeEmployeesFilter)
      .select('_id name email department designation employeeId') // Add employeeId field
      .lean();

    // Build base filter for attendance records
    let attendanceFilter = {
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    };

    // Apply additional filters - now using employeeId as String
    if (employeeId) {
      attendanceFilter.employeeId = employeeId; // Direct string comparison
    }
    if (teamId) attendanceFilter.teamId = parseInt(teamId);
    // Status filter is applied later if includeAbsent is true
    // if (status) attendanceFilter.status = status;

    // Get existing attendance records - NO population needed since employeeId is String
    const existingAttendance = await Attendance.find(attendanceFilter)
      .sort({ date: -1, checkIn: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log('Found attendance records:', existingAttendance.length);
    console.log('Sample record:', existingAttendance[0]);

    // Create a map of employee IDs to employee data for quick lookup
    const employeeMap = new Map();
    activeEmployees.forEach(emp => {
      // Map by employeeId (EMP003) for attendance lookup
      employeeMap.set(emp.employeeId, emp);
      // Also map by _id for fallback
      employeeMap.set(emp._id.toString(), emp);
    });

    // Process records to ensure consistent employee data
    const correctedAttendance = existingAttendance.map(record => {
      // Get employee data using employeeId (EMP003)
      const employeeData = employeeMap.get(record.employeeId);
      
      if (!employeeData) {
        console.warn(`No employee found for employeeId: ${record.employeeId} in record: ${record._id}`);
      }

      return {
        ...record,
        employeeId: record.employeeId, // Keep the EMP003
        employee: employeeData?.name || record.employee || 'Unknown Employee',
        employeeName: employeeData?.name || record.employee || 'Unknown Employee',
        employeeEmail: employeeData?.email,
        employeeDepartment: employeeData?.department,
        employeeObjectId: employeeData?._id // Add ObjectId for reference
      };
    });

    let finalAttendanceData = correctedAttendance;

    // If includeAbsent is true, create records for employees without attendance
    if (shouldIncludeAbsent) {
      const employeesWithAttendance = new Set(
        correctedAttendance.map(record => record.employeeId)
      );

      // Find employees without attendance records
      let employeesWithoutAttendance = activeEmployees.filter(employee => 
        !employeesWithAttendance.has(employee.employeeId)
      );

      // Apply employee filter to absent records if specified
      if (employeeId) {
        employeesWithoutAttendance = employeesWithoutAttendance.filter(employee => 
          employee.employeeId === employeeId
        );
      }
      
      // Apply department filter to absent records if specified
      if (department) {
        employeesWithoutAttendance = employeesWithoutAttendance.filter(employee => 
          employee.department === department
        );
      }

      // Create absent records for employees without attendance
      const absentRecords = employeesWithoutAttendance.map(employee => ({
        _id: `absent-${employee.employeeId}-${targetDate.toISOString().split('T')[0]}`,
        employeeId: employee.employeeId, // Use EMP003
        employee: employee.name,
        employeeName: employee.name,
        employeeEmail: employee.email,
        employeeDepartment: employee.department,
        employeeObjectId: employee._id,
        date: targetDate,
        checkIn: null,
        checkOut: null,
        checkInTime: null,
        checkOutTime: null,
        totalHours: 0,
        duration: '0h 0m',
        status: 'absent',
        location: null,
        checkInLocation: null,
        checkOutLocation: null,
        checkInPhoto: null,
        checkOutPhoto: null,
        shift: 'General Shift',
        shiftName: 'General Shift',
        notes: 'Employee was absent',
        isAbsentRecord: true
      }));

      // Combine existing attendance with absent records
      finalAttendanceData = [...correctedAttendance, ...absentRecords];

      // Apply status filter if specified
      if (status) {
        finalAttendanceData = finalAttendanceData.filter(record => record.status === status);
      }
    } else {
        // Apply status filter to *only* existing attendance if includeAbsent is false
        if (status) {
          finalAttendanceData = finalAttendanceData.filter(record => record.status === status);
        }
    }
    
    // Manual pagination after combining and filtering
    const paginatedData = finalAttendanceData.slice(skip, skip + parseInt(limit));
    const total = finalAttendanceData.length;


    res.json({
      attendance: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      metadata: {
        date: targetDate.toISOString().split('T')[0],
        includeAbsent: shouldIncludeAbsent,
        totalEmployees: activeEmployees.length,
        presentCount: correctedAttendance.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'half-day').length,
        absentCount: finalAttendanceData.filter(r => r.status === 'absent').length
      }
    });
  } catch (error) {
    console.error('Get attendance data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// In adminAttendanceController.js - Update getAttendanceDetails function
const getAttendanceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // ⚠️ Add validation for ObjectId format
    if (id === 'export' || id === 'data' || id === 'stats') {
      return res.status(400).json({ 
        message: 'Invalid attendance record ID',
        details: 'The provided ID matches a route name, not a valid record ID'
      });
    }

    // Check if it's an absent record ID format
    if (id.startsWith('absent-')) {
      // Extract employee ID and date from absent record ID
      const parts = id.split('-');
      // parts[0] is 'absent'
      // parts[1] is the employeeId string (e.g., EMP003)
      // parts[2] onwards is the date string
      const employeeId = parts[1];
      const date = parts.slice(2).join('-');

      // Find employee
      // NOTE: employeeId from the URL for absent records is the string EMP003, 
      // not the Mongoose ObjectId. We must find by the employeeId field.
      const Employee = require('../models/Employee');
      const employee = await Employee.findOne({ employeeId: employeeId })
        .select('_id name email department designation employeeId')
        .lean();

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // Return absent record structure
      const absentRecord = {
        _id: id,
        employeeId: employee.employeeId, // Use the string ID
        employee: employee.name,
        employeeName: employee.name,
        date: new Date(date),
        checkIn: null,
        checkOut: null,
        checkInTime: null,
        checkOutTime: null,
        totalHours: 0,
        duration: '0h 0m',
        status: 'absent',
        location: null,
        checkInLocation: null,
        checkOutLocation: null,
        checkInPhoto: null,
        checkOutPhoto: null,
        shift: 'General Shift',
        shiftName: 'General Shift',
        notes: 'Employee was absent',
        isAbsentRecord: true
      };

      return res.json(absentRecord);
    }

    // Regular attendance record lookup
    const attendanceRecord = await Attendance.findById(id)
      .populate('employeeId', 'name email department designation employeeId') // Add employeeId to population
      .lean();

    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Flatten employee data for the client (as it was populated)
    if (attendanceRecord.employeeId && typeof attendanceRecord.employeeId === 'object') {
        attendanceRecord.employeeName = attendanceRecord.employeeId.name;
        attendanceRecord.employeeEmail = attendanceRecord.employeeId.email;
        attendanceRecord.employeeDepartment = attendanceRecord.employeeId.department;
        // The original employeeId field in the attendance record holds the string EMP003
        // If the population succeeds, the root employeeId is the ObjectId.
        // We'll trust the string employeeId field for consistency if available, otherwise use the populated one.
        attendanceRecord.employeeIdString = attendanceRecord.employeeId.employeeId || attendanceRecord.employeeId;
    }


    res.json(attendanceRecord);
  } catch (error) {
    console.error('Get attendance details error:', error);
    
    // Handle CastError specifically
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid attendance record ID format',
        error: `Cannot cast "${error.value}" to ObjectId`
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// In adminAttendanceController.js - Update getEmployees function
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ status: 'active' })
      .select('_id name email department designation status employeeId') // Add employeeId
      .sort({ name: 1 });

    res.json({
      employees: employees || []
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// In adminAttendanceController.js - Update exportAttendanceData function
const exportAttendanceData = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      teamId, 
      department,
      employeeId, // Add employeeId filter
      includeAbsent = 'true',
      includeDetails = 'false',
      format = 'csv' 
    } = req.query;

    const shouldIncludeAbsent = includeAbsent === 'true';
    const shouldIncludeDetails = includeDetails === 'true';

    console.log('Export request with filters:', {
      startDate, endDate, department, employeeId, includeAbsent, includeDetails
    });

    // ✅ SAFELY handle user data with fallbacks
    const userId = req.user?.id || req.user?._id || 'system-export';
    const userName = req.user?.name || req.user?.email || 'System User';

    // Date range filter
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Validate date range
    if (start > end) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }

    // Get all active employees for reference, applying filters
    let employeeFilter = { status: 'active' };
    if (department && department !== 'all') employeeFilter.department = department;
    if (employeeId && employeeId !== 'all') employeeFilter.employeeId = employeeId;

    const activeEmployees = await Employee.find(employeeFilter)
      .select('_id name email department designation employeeId')
      .lean();

    console.log(`Found ${activeEmployees.length} active employees matching filters`);

    // Build attendance filter
    let attendanceFilter = {
      date: {
        $gte: start,
        $lte: end
      }
    };

    // Apply employee filter to attendance records
    if (employeeId && employeeId !== 'all') {
      attendanceFilter.employeeId = employeeId;
    }

    if (teamId) attendanceFilter.teamId = parseInt(teamId);

    // Get existing attendance records
    const existingAttendance = await Attendance.find(attendanceFilter)
      .sort({ date: 1, employeeId: 1 })
      .lean();

    console.log(`Found ${existingAttendance.length} attendance records`);

    // Create employee map for lookup
    const employeeMap = new Map();
    activeEmployees.forEach(emp => {
      employeeMap.set(emp.employeeId, emp);
    });

    // Process attendance records with employee data
    const processedAttendance = existingAttendance.map(record => {
      const employeeData = employeeMap.get(record.employeeId);
      return {
        ...record,
        employeeName: employeeData?.name || record.employee,
        employeeEmail: employeeData?.email,
        employeeDepartment: employeeData?.department,
        employeeDesignation: employeeData?.designation
      };
    });

    let finalData = processedAttendance;

    // Include absent employees if requested
    if (shouldIncludeAbsent) {
      const dateRange = getDatesInRange(start, end);
      const absentRecords = [];

      for (const date of dateRange) {
        const attendanceForDate = processedAttendance.filter(record => 
          new Date(record.date).toDateString() === date.toDateString()
        );

        const employeesWithAttendance = new Set(
          attendanceForDate.map(record => record.employeeId)
        );

        // Employees who are active, match filters, and have no attendance on this date
        const employeesWithoutAttendance = activeEmployees.filter(employee => 
          !employeesWithAttendance.has(employee.employeeId)
        );

        // Create absent records for this date
        absentRecords.push(...employeesWithoutAttendance.map(employee => ({
          _id: `absent-${employee.employeeId}-${date.toISOString().split('T')[0]}`,
          employeeId: employee.employeeId,
          employee: employee.name,
          employeeName: employee.name,
          employeeEmail: employee.email,
          employeeDepartment: employee.department,
          employeeDesignation: employee.designation,
          date: date,
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          duration: '0h 0m',
          status: 'absent',
          location: null,
          checkInLocation: null,
          checkOutLocation: null,
          checkInPhoto: null,
          checkOutPhoto: null,
          shift: 'General Shift',
          shiftName: 'General Shift',
          notes: 'Employee was absent',
          isAbsentRecord: true,
          isLate: false,
          lateMinutes: 0,
          workingMinutes: 0
        })));
      }

      finalData = [...processedAttendance, ...absentRecords].sort((a, b) => 
        new Date(a.date) - new Date(b.date) || a.employeeName.localeCompare(b.employeeName)
      );
    }

    // ✅ Create report record
    const report = new AttendanceReport({
      reportType: 'custom',
      title: `Attendance Export - ${startDate} to ${endDate}`,
      startDate: start,
      endDate: end,
      filters: { 
        department: department || 'all',
        employeeId: employeeId || 'all',
        includeAbsent: shouldIncludeAbsent,
        includeDetails: shouldIncludeDetails
      },
      generatedBy: userId,
      generatedByName: userName,
      data: { recordCount: finalData.length }
    });

    await report.save();

    if (format === 'csv') {
      const csvData = convertToCSV(finalData, shouldIncludeDetails);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${startDate}-to-${endDate}.csv`);
      return res.send(csvData);
    }

    res.json({
      message: 'Export successful',
      reportId: report._id,
      data: finalData,
      metadata: {
        recordCount: finalData.length,
        dateRange: `${startDate} to ${endDate}`,
        department: department || 'all',
        employeeId: employeeId || 'all',
        includeAbsent: shouldIncludeAbsent,
        generatedBy: userName
      }
    });

  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enhanced CSV converter with more details
const convertToCSV = (data, includeDetails = false) => {
  if (!data.length) return 'No data available';
  
  // Basic columns
  let headers = [
    'Employee ID', 
    'Employee Name', 
    'Email', 
    'Department', 
    'Designation',
    'Date', 
    'Check In', 
    'Check Out', 
    'Duration', 
    'Status', 
    'Shift'
  ];

  // Add detailed columns if requested
  if (includeDetails) {
    headers.push(
      'Location',
      'Check In Location',
      'Check Out Location', 
      'Late Minutes',
      'Working Minutes',
      'Is Late',
      'Notes'
    );
  }

  let csv = headers.join(',') + '\n';
  
  data.forEach(item => {
    const baseRow = [
      `"${item.employeeId || 'N/A'}"`,
      `"${item.employeeName || item.employee || 'Unknown'}"`,
      `"${item.employeeEmail || 'N/A'}"`,
      `"${item.employeeDepartment || 'N/A'}"`,
      `"${item.employeeDesignation || 'N/A'}"`,
      `"${new Date(item.date).toISOString().split('T')[0]}"`,
      `"${item.checkIn ? (typeof item.checkIn === 'string' ? item.checkIn : new Date(item.checkIn).toLocaleTimeString()) : 'N/A'}"`,
      `"${item.checkOut ? (typeof item.checkOut === 'string' ? item.checkOut : new Date(item.checkOut).toLocaleTimeString()) : 'N/A'}"`,
      `"${item.duration || '0h 0m'}"`,
      `"${item.status}"`,
      `"${item.shiftName || item.shift || 'General Shift'}"`
    ];

    let detailedRow = baseRow;

    if (includeDetails) {
      const location = item.location || 'N/A';
      const checkInLocation = item.checkInLocation ? 
        `${item.checkInLocation.latitude},${item.checkInLocation.longitude}` : 'N/A';
      const checkOutLocation = item.checkOutLocation ? 
        `${item.checkOutLocation.latitude},${item.checkOutLocation.longitude}` : 'N/A';

      detailedRow = [
        ...baseRow,
        `"${location}"`,
        `"${checkInLocation}"`,
        `"${checkOutLocation}"`,
        `"${item.lateMinutes || 0}"`,
        `"${item.workingMinutes || 0}"`,
        `"${item.isLate ? 'Yes' : 'No'}"`,
        `"${item.notes || ''}"`
      ];
    }

    csv += detailedRow.join(',') + '\n';
  });
  
  return csv;
};
// Helper function to get all dates in a range
const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};


module.exports = {
  getDashboardStats,
  getAttendanceData,
  getAttendanceDetails, // Add this new function
  exportAttendanceData,
  getEmployees,
  debugEmployeeData
};
// controllers/timesheetController.js
const Timesheet = require('../models/Timesheet');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Get timesheets with advanced filtering
const getTimesheets = async (req, res) => {
  try {
    const { 
      employeeId, 
      periodType, 
      status, 
      startDate, 
      endDate,
      page = 1,
      limit = 10
    } = req.query;
    
    let filter = {};

    // Role-based filtering with null checks - UPDATED to use req.user
    const userRole = req.user?.role || (req.user?.roles && req.user.roles[0]);
    const isAdmin = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    
    if (!isAdmin) {
      filter.employeeId = req.user?.id;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (periodType) filter.periodType = periodType;
    if (status) filter.status = status;

    // Date range filtering
    if (startDate || endDate) {
      filter.$and = [];
      if (startDate) {
        filter.$and.push({ startDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        filter.$and.push({ endDate: { $lte: new Date(endDate) } });
      }
    }

    const timesheets = await Timesheet.find(filter)
      // Populating employeeId to get employee details for the frontend
      .populate('employeeId', 'name email employeeId') 
      .populate('approverId', 'name email')
      .sort({ startDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Timesheet.countDocuments(filter);

    res.json({
      success: true,
      timesheets,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get timesheets error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching timesheets', 
      error: error.message 
    });
  }
};

const createTimesheet = async (req, res) => {
  try {
    const { periodType, startDate, endDate, entries, employeeName, comments } = req.body;
    
    // Validate required fields
    if (!periodType || !startDate || !endDate || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: periodType, startDate, endDate, entries' 
      });
    }

    // Validate period type
    if (!['daily', 'weekly', 'monthly'].includes(periodType)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid period type. Must be daily, weekly, or monthly' 
      });
    }

    // Validate entries
    const validEntries = entries.filter(entry => 
      entry.date && entry.project && entry.task && entry.hours > 0
    );

    if (validEntries.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'At least one valid time entry is required' 
      });
    }

    // Get employee ID from req.user (set by your middleware)
    const employeeId = req.user?.id || req.user?._id;
    
    if (!employeeId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check if timesheet already exists for this period
    const existingTimesheet = await Timesheet.findOne({
      employeeId: employeeId,
      periodType,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    if (existingTimesheet) {
      return res.status(400).json({ 
        success: false,
        message: 'Timesheet already exists for this period' 
      });
    }

    let employee = null;
    
    // Try finding by ID first (assuming req.user.id is the User/Employee ID)
    if (mongoose.Types.ObjectId.isValid(employeeId)) {
      employee = await Employee.findById(employeeId);
    }
    
    // Fallback if employee is not found in Employee collection
    if (!employee) {
      // Use basic user info from auth token if Employee record isn't found
      const timesheet = new Timesheet({
        employeeId: employeeId, // Use the ID from auth
        employeeName: employeeName || req.user.name || 'Unknown Employee',
        periodType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        entries: validEntries,
        comments: comments,
        status: 'draft'
      });

      await timesheet.save();
      
      const populatedTimesheet = await Timesheet.findById(timesheet._id)
        .populate('employeeId', 'name email employeeId')
        .populate('approverId', 'name email');

      return res.status(201).json({ 
        success: true,
        message: 'Timesheet created successfully', 
        timesheet: populatedTimesheet 
      });
    }

    // Original flow if employee is found
    const timesheet = new Timesheet({
      employeeId: employee._id,
      employeeName: employeeName || employee.name || `Employee ${employee.employeeId}`,
      periodType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      entries: validEntries,
      teamId: employee.teamId && mongoose.Types.ObjectId.isValid(employee.teamId) ? employee.teamId : undefined,
      comments: comments,
      status: 'draft'
    });

    await timesheet.save();
    
    const populatedTimesheet = await Timesheet.findById(timesheet._id)
      .populate('employeeId', 'name email employeeId')
      .populate('approverId', 'name email');

    res.status(201).json({ 
      success: true,
      message: 'Timesheet created successfully', 
      timesheet: populatedTimesheet 
    });
  } catch (error) {
    console.error('Create timesheet error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating timesheet', 
      error: error.message 
    });
  }
};

// Update timesheet (Used for editing drafts)
const updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { entries, comments } = req.body; // Only entries and comments are expected for edit

    const timesheet = await Timesheet.findById(id);
    
    if (!timesheet) {
      return res.status(404).json({ 
        success: false,
        message: 'Timesheet not found' 
      });
    }

    // Check ownership or admin access
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const isAdmin = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    const isOwner = timesheet.employeeId.toString() === (req.user.id).toString();
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    // Only allow updates to draft timesheets (Admin can override, but usually not ideal)
    if (timesheet.status !== 'draft' && !isAdmin) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot update timesheet with status: ${timesheet.status}. Only 'draft' timesheets can be edited.`
      });
    }

    // Update Entries
    if (entries && Array.isArray(entries)) {
      const validEntries = entries.filter(entry => 
        entry.date && entry.project && entry.task && entry.hours > 0
      );
      
      if (validEntries.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'At least one valid time entry is required' 
        });
      }
      
      timesheet.entries = validEntries;
    }
    
    // Update Comments
    if (comments !== undefined) timesheet.comments = comments;

    await timesheet.save(); // pre('save') hook recalculates totalHours
    
    const updatedTimesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email employeeId')
      .populate('approverId', 'name email');

    res.json({ 
      success: true,
      message: 'Timesheet updated successfully', 
      timesheet: updatedTimesheet 
    });
  } catch (error) {
    console.error('Update timesheet error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating timesheet', 
      error: error.message 
    });
  }
};

// Submit timesheet
const submitTimesheet = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id);
    
    if (!timesheet) {
      return res.status(404).json({ 
        success: false,
        message: 'Timesheet not found' 
      });
    }

    // Check ownership
    const isOwner = timesheet.employeeId.toString() === (req.user.id).toString();
    if (!isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    if (timesheet.status !== 'draft') {
      return res.status(400).json({ 
        success: false,
        message: 'Timesheet already submitted' 
      });
    }

    // Validate minimum hours requirement
    if (timesheet.totalHours < 0.5) { // Adjusted minimum hours for flexibility
      return res.status(400).json({ 
        success: false,
        message: 'Timesheet must have at least 0.5 hours of work to submit' 
      });
    }

    timesheet.status = 'submitted';
    timesheet.submittedAt = new Date();
    await timesheet.save();

    const updatedTimesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email employeeId')
      .populate('approverId', 'name email');

    res.json({ 
      success: true,
      message: 'Timesheet submitted successfully', 
      timesheet: updatedTimesheet 
    });
  } catch (error) {
    console.error('Submit timesheet error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while submitting timesheet', 
      error: error.message 
    });
  }
};

// Approve/reject timesheet (No changes needed here based on the request)
const updateTimesheetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    // Check if employee has permission to approve/reject
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const canApprove = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    
    if (!canApprove) {
      return res.status(403).json({ 
        success: false,
        message: 'Insufficient permissions' 
      });
    }

    const timesheet = await Timesheet.findById(id);
    
    if (!timesheet) {
      return res.status(404).json({ 
        success: false,
        message: 'Timesheet not found' 
      });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }

    // FIX: Get approver details properly
    let approver = null;
    
    // Try multiple ways to find the approver
    const approverId = req.user?.id || req.user?._id;
    
    if (mongoose.Types.ObjectId.isValid(approverId)) {
      approver = await Employee.findById(approverId);
    }

    timesheet.status = status;
    timesheet.approverId = approver ? approver._id : req.user.id;
    timesheet.approverName = approver?.name || req.user.name || 'Admin';
    
    if (status === 'approved') {
      timesheet.approvedAt = new Date();
      timesheet.rejectedAt = null;
    } else if (status === 'rejected') {
      timesheet.rejectedAt = new Date();
      timesheet.approvedAt = null;
    }
    
    if (comments) timesheet.comments = comments;
    
    await timesheet.save();

    const updatedTimesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email employeeId')
      .populate('approverId', 'name email');

    res.json({ 
      success: true,
      message: `Timesheet ${status} successfully`, 
      timesheet: updatedTimesheet 
    });
  } catch (error) {
    console.error('Update timesheet status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating timesheet status', 
      error: error.message 
    });
  }
};

// Get timesheet statistics - UPDATED for dynamic status counting
const getTimesheetStats = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    let filter = {};
    
    // Role-based filtering
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const isAdmin = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    
    if (!isAdmin) {
      filter.employeeId = req.user.id;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    // Date range filtering
    if (startDate || endDate) {
      filter.$and = [];
      if (startDate) {
        filter.$and.push({ startDate: { $gte: new Date(startDate) } });
      }
      if (endDate) {
        filter.$and.push({ endDate: { $lte: new Date(endDate) } });
      }
    }

    const stats = await Timesheet.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          // Also sum totalHours per status group for richer data (optional but useful)
          // totalHoursGroup: { $sum: '$totalHours' } 
        }
      }
    ]);

    const totalTimesheets = await Timesheet.countDocuments(filter);
    
    // Calculate total hours across all timesheets in the filter
    const totalHoursResult = await Timesheet.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalHours' } } }
    ]);

    res.json({
      success: true,
      statusBreakdown: stats, // This provides dynamic status counts
      totalTimesheets,
      totalHours: totalHoursResult[0]?.total || 0
    });
  } catch (error) {
    console.error('Get timesheet stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching statistics', 
      error: error.message 
    });
  }
};

// Get timesheet by ID (No changes needed here based on the request)
const getTimesheetById = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email employeeId')
      .populate('approverId', 'name email');

    if (!timesheet) {
      return res.status(404).json({ 
        success: false,
        message: 'Timesheet not found' 
      });
    }

    // Check access rights
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const isAdmin = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    const isOwner = timesheet.employeeId._id.toString() === (req.user.id).toString();
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      timesheet
    });
  } catch (error) {
    console.error('Get timesheet by ID error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching timesheet', 
      error: error.message 
    });
  }
};

module.exports = {
  getTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  submitTimesheet,
  updateTimesheetStatus,
  getTimesheetStats
};

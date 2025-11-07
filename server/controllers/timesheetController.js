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

    // Role-based filtering with null checks - use employeeId STRING
    const userRole = req.user?.role || (req.user?.roles && req.user.roles[0]);
    const isAdmin = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    
    if (!isAdmin) {
      filter.employeeId = req.user?.employeeId; // <-- string like EMPID1001
    } else if (employeeId) {
      filter.employeeId = employeeId; // allow admin filter by string EMPID
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
      .populate('approverId', 'name email') // keep approver population
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

    // Get employee ID (string like "EMPID1001") from auth middleware
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return res.status(401).json({ 
        success: false,
        message: 'Employee ID not found in user data' 
      });
    }

    // Ensure uniqueness per employee/period
    const existingTimesheet = await Timesheet.findOne({
      employeeId,
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

    // Create timesheet (employeeId is a STRING now)
    const timesheet = new Timesheet({
      employeeId, // string ID like EMPID1001
      employeeName: employeeName || req.user.name || 'Unknown Employee',
      periodType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      entries: validEntries,
      comments,
      status: 'draft'
    });

    await timesheet.save();
      
    const populatedTimesheet = await Timesheet.findById(timesheet._id)
      .populate('approverId', 'name email');

    return res.status(201).json({ 
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
    const isOwner = timesheet.employeeId === req.user.employeeId; // string compare
    
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

    // Check ownership (string compare)
    const isOwner = timesheet.employeeId === req.user.employeeId;
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
    if (timesheet.totalHours < 0.5) {
      return res.status(400).json({ 
        success: false,
        message: 'Timesheet must have at least 0.5 hours of work to submit' 
      });
    }

    timesheet.status = 'submitted';
    timesheet.submittedAt = new Date();
    await timesheet.save();

    const updatedTimesheet = await Timesheet.findById(id)
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

// Approve/reject timesheet
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

    // Get approver details properly (approverId stays ObjectId)
    let approver = null;
    const approverId = req.user?.id || req.user?._id;
    if (approverId && mongoose.Types.ObjectId.isValid(approverId)) {
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

// Get timesheet statistics
const getTimesheetStats = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    let filter = {};
    
    // Role-based filtering
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const isAdmin = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    
    if (!isAdmin) {
      filter.employeeId = req.user.employeeId; // string
    } else if (employeeId) {
      filter.employeeId = employeeId; // string
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
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const totalTimesheets = await Timesheet.countDocuments(filter);
    
    // Calculate total hours across all timesheets in the filter
    const totalHoursResult = await Timesheet.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalHours' } } }
    ]);

    res.json({
      success: true,
      statusBreakdown: stats,
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

// Get timesheet by ID
const getTimesheetById = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id)
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
    const isOwner = timesheet.employeeId === req.user.employeeId; // string
    
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

// controllers/timesheetController.js
const Timesheet = require('../models/Timesheet');
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

    // Role-based filtering
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const isAdmin = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    
    if (!isAdmin) {
      filter.employeeId = req.user.id || req.user._id;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (periodType) filter.periodType = periodType;
    if (status) filter.status = status;

    // Date range filtering
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const timesheets = await Timesheet.find(filter)
      .populate('employeeId', 'name email')
      .populate('approverId', 'name')
      .sort({ startDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Timesheet.countDocuments(filter);

    res.json({
      timesheets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get timesheets error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new timesheet
const createTimesheet = async (req, res) => {
  try {
    const { periodType, startDate, endDate, entries, teamId } = req.body;
    
    // Check if timesheet already exists for this period
    const existingTimesheet = await Timesheet.findOne({
      employeeId: req.user.id || req.user._id,
      periodType,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    if (existingTimesheet) {
      return res.status(400).json({ 
        message: 'Timesheet already exists for this period' 
      });
    }

    const timesheet = new Timesheet({
      employeeId: req.user.id || req.user._id,
      employeeName: req.user.name,
      periodType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      entries,
      teamId: teamId || req.user.teamId,
      status: 'draft'
    });

    await timesheet.save();
    
    // Populate the saved timesheet
    const populatedTimesheet = await Timesheet.findById(timesheet._id)
      .populate('employeeId', 'name email')
      .populate('approverId', 'name');

    res.status(201).json({ 
      message: 'Timesheet created successfully', 
      timesheet: populatedTimesheet 
    });
  } catch (error) {
    console.error('Create timesheet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update timesheet
const updateTimesheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { entries, comments } = req.body;

    const timesheet = await Timesheet.findById(id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check ownership or admin access
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const isAdmin = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    const isOwner = timesheet.employeeId.toString() === (req.user.id || req.user._id).toString();
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow updates to draft timesheets
    if (timesheet.status !== 'draft' && !isAdmin) {
      return res.status(400).json({ 
        message: 'Cannot update submitted timesheet' 
      });
    }

    timesheet.entries = entries || timesheet.entries;
    if (comments !== undefined) timesheet.comments = comments;
    timesheet.updatedAt = new Date();

    await timesheet.save();
    
    const updatedTimesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email')
      .populate('approverId', 'name');

    res.json({ 
      message: 'Timesheet updated successfully', 
      timesheet: updatedTimesheet 
    });
  } catch (error) {
    console.error('Update timesheet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit timesheet
const submitTimesheet = async (req, res) => {
  try {
    const { id } = req.params;

    const timesheet = await Timesheet.findById(id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Check ownership
    const isOwner = timesheet.employeeId.toString() === (req.user.id || req.user._id).toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (timesheet.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Timesheet already submitted' 
      });
    }

    // Validate minimum hours requirement
    if (timesheet.totalHours < 1) {
      return res.status(400).json({ 
        message: 'Timesheet must have at least 1 hour of work' 
      });
    }

    timesheet.status = 'submitted';
    timesheet.submittedAt = new Date();
    await timesheet.save();

    const updatedTimesheet = await Timesheet.findById(id)
      .populate('employeeId', 'name email')
      .populate('approverId', 'name');

    res.json({ 
      message: 'Timesheet submitted successfully', 
      timesheet: updatedTimesheet 
    });
  } catch (error) {
    console.error('Submit timesheet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/reject timesheet
const updateTimesheetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    // Check if user has permission to approve/reject
    const userRole = req.user.role || (req.user.roles && req.user.roles[0]);
    const canApprove = ['admin', 'hr', 'manager', 'employer'].includes(userRole);
    
    if (!canApprove) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const timesheet = await Timesheet.findById(id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    timesheet.status = status;
    timesheet.approverId = req.user.id || req.user._id;
    timesheet.approverName = req.user.name;
    
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
      .populate('employeeId', 'name email')
      .populate('approverId', 'name');

    res.json({ 
      message: `Timesheet ${status} successfully`, 
      timesheet: updatedTimesheet 
    });
  } catch (error) {
    console.error('Update timesheet status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
      filter.employeeId = req.user.id || req.user._id;
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    // Date range filtering
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const stats = await Timesheet.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    const totalTimesheets = await Timesheet.countDocuments(filter);
    const totalHours = await Timesheet.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalHours' } } }
    ]);

    res.json({
      statusBreakdown: stats,
      totalTimesheets,
      totalHours: totalHours[0]?.total || 0
    });
  } catch (error) {
    console.error('Get timesheet stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTimesheets,
  createTimesheet,
  updateTimesheet,
  submitTimesheet,
  updateTimesheetStatus,
  getTimesheetStats
};
// routes/timesheetRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware'); // Add this import
const {
  getTimesheets,
  getTimesheetById,
  createTimesheet,
  updateTimesheet,
  submitTimesheet,
  updateTimesheetStatus,
  getTimesheetStats
} = require('../controllers/timesheetController');

// Apply authMiddleware to ALL timesheet routes
router.use(authMiddleware); // This will apply to all routes below

// GET /api/timesheets - Get all timesheets
router.get('/', getTimesheets);

// GET /api/timesheets/stats - Get timesheet statistics
router.get('/stats', getTimesheetStats);

// GET /api/timesheets/:id - Get timesheet by ID
router.get('/:id', getTimesheetById);

// POST /api/timesheets - Create new timesheet
router.post('/', createTimesheet);

// PUT /api/timesheets/:id - Update timesheet
router.put('/:id', updateTimesheet);

// PUT /api/timesheets/:id/submit - Submit timesheet
router.put('/:id/submit', submitTimesheet);

// PUT /api/timesheets/:id/status - Approve/reject timesheet (admin only)
router.put('/:id/status', updateTimesheetStatus);

module.exports = router;
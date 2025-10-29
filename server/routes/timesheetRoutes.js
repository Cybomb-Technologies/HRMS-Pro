// routes/timesheetRoutes.js
const express = require('express');
const router = express.Router();
const {
  getTimesheets,
  createTimesheet,
  updateTimesheet,
  submitTimesheet,
  updateTimesheetStatus,
  getTimesheetStats
} = require('../controllers/timesheetController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getTimesheets)
  .post(createTimesheet);

router.route('/stats')
  .get(getTimesheetStats);

router.route('/:id')
  .put(updateTimesheet);

router.route('/:id/submit')
  .put(submitTimesheet);

router.route('/:id/status')
  .put(updateTimesheetStatus);

module.exports = router;
const express = require('express');
const {
  checkIn,
  checkOut,
  getAttendance,
  getAttendancePhoto,
  getTodayAttendance,
  createManualRequest
} = require('../controllers/attendanceController');
const {
  getTimesheets,
  submitTimesheet,
  updateTimesheetStatus
} = require('../controllers/timesheetController');
const {
  getManualRequests,
  approveManualRequest,
  getEmployeeManualRequests,
   deleteManualRequest,
    updateManualRequest,
  rejectManualRequest
} = require('../controllers/manualRequestController');


const router = express.Router();

// Attendance routes
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/', getAttendance);
router.get('/photo/:id/:type', getAttendancePhoto);
router.get('/today/:employeeId', getTodayAttendance);
router.post('/manual-request', createManualRequest);


// Timesheet routes
router.get('/timesheets', getTimesheets);
router.post('/timesheets/submit', submitTimesheet);
router.put('/timesheets/:id/status', updateTimesheetStatus);

// attendanceRoutes.js - Updated section
// Manual request routes
router.get('/manual-requests',  getManualRequests);
router.get('/manual-requests/employee/:employeeId', getEmployeeManualRequests);
router.put('/manual-requests/:id/approve',  approveManualRequest);
router.put('/manual-requests/:id/reject',  rejectManualRequest);
router.put('/manual-requests/:id', updateManualRequest);
router.delete('/manual-requests/:id', deleteManualRequest);

module.exports = router;
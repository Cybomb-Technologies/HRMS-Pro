// routes/adminAttendanceRoutes.js
const express = require('express');
const {
  getDashboardStats,
  getAttendanceData,
  getAttendanceDetails,
  exportAttendanceData,
  getEmployees,
  debugEmployeeData,
} = require('../controllers/adminAttendanceController');

const {
  createShift,
  getShifts,
  updateShift,
  deleteShift,
  assignShiftToEmployee,
  getEmployeeAssignments,
  updateEmployeeAssignment
} = require('../controllers/shiftController');

// ✅ CORRECTED IMPORTS - Match your actual file names
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminAttendanceMiddleware');

const router = express.Router();

// ✅ Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);
// Debug route to test if routes are working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Admin routes are working!', 
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/attendance/data', getAttendanceData);
router.get('/debug/employees', debugEmployeeData);

// ✅ Export route MUST come before parameterized routes
router.get('/attendance/export', exportAttendanceData);

// ✅ Parameterized routes come AFTER specific routes
router.get('/attendance/:id', getAttendanceDetails);

// Employee routes
router.get('/employees', getEmployees);

// Shift management routes
router.post('/shifts', createShift);
router.get('/shifts', getShifts);
router.put('/shifts/:id', updateShift);
router.delete('/shifts/:id', deleteShift);

// Employee shift assignment routes
router.post('/shifts/assign', assignShiftToEmployee);
router.get('/shifts/assignments', getEmployeeAssignments);
router.put('/shifts/assignments/:id', updateEmployeeAssignment);

module.exports = router;
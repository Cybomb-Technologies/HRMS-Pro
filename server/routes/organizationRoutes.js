// routes/organizationRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, hrMiddleware } = require('../middleware/authMiddleware');
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  getDesignationEmployees,
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationEmployees,
  updateAllHeadcounts
} = require('../controllers/organizationController');


// Public GET routes (for dropdowns)
router.get('/departments', getDepartments);
router.get('/designations', getDesignations);
router.get('/locations', getLocations);

// Employee list routes (public)
router.get('/departments/:id/employees', getDepartmentEmployees);
router.get('/designations/:id/employees', getDesignationEmployees);
router.get('/locations/:id/employees', getLocationEmployees);

// Apply auth middleware to all other routes
router.use(authMiddleware);
router.use(hrMiddleware);

// Protected routes
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

router.post('/designations', createDesignation);
router.put('/designations/:id', updateDesignation);
router.delete('/designations/:id', deleteDesignation);

router.post('/locations', createLocation);
router.put('/locations/:id', updateLocation);
router.delete('/locations/:id', deleteLocation);

// Admin routes for headcount management
router.post('/headcounts/update', updateAllHeadcounts);

module.exports = router;
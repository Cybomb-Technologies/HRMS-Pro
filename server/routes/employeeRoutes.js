const express = require('express');
const router = express.Router();
const {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  uploadDocuments,
  downloadDocument,
  deleteDocument,
  getEmployeeDocuments
} = require('../controllers/employeeController.js');
const { getEmployeeShiftAssignments } = require("../controllers/employeeShiftController.js");
const upload = require('../middleware/uploadMiddleware');

// Existing routes
router.get('/', getEmployees);
router.post('/', addEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);
router.get('/employeesShifts', getEmployeeShiftAssignments);

// New document routes - FIXED: Handle both empId and section
router.post('/documents', 
  // Custom middleware to ensure empId and section are available
  (req, res, next) => {
    // Get empId and section from query params
    const empId = req.query.empId;
    const section = req.query.section;
    
    console.log('Middleware received:', { empId, section }); // Debug log
    
    if (!empId || !section) {
      return res.status(400).json({
        error: 'Employee ID and section are required',
        received: { empId, section }
      });
    }
    
    // Add empId and section to req for multer and controller to access
    req.empId = empId;
    req.section = section;
    next();
  },
  upload.array('files', 10),
  uploadDocuments
);

router.get('/documents/:docId', downloadDocument);
router.delete('/documents/:docId', deleteDocument);
router.get('/:empId/documents', getEmployeeDocuments);

module.exports = router;
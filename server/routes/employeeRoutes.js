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
  getEmployeeDocuments,
  deleteEmployeeDocument,
  downloadEmployeeDocument,
  getEmployeeById 
} = require('../controllers/employeeController.js');
const { getEmployeeShiftAssignments } = require("../controllers/employeeShiftController.js");
const upload = require('../middleware/uploadMiddleware');

// Existing routes
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', addEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);
router.get('/employeesShifts', getEmployeeShiftAssignments);

// Document routes - FIXED and consistent
router.post('/documents', 
  (req, res, next) => {
    const empId = req.query.empId;
    const section = req.query.section;
    
    console.log('Middleware received:', { empId, section });
    
    if (!empId || !section) {
      return res.status(400).json({
        error: 'Employee ID and section are required',
        received: { empId, section }
      });
    }
    
    req.empId = empId;
    req.section = section;
    next();
  },
  upload.array('files', 10),
  uploadDocuments
);

// Consistent document routes using the same path structure
router.get('/:id/documents', getEmployeeDocuments); // Get all documents for employee
router.get('/:id/documents/:docId/download', downloadEmployeeDocument); // Download specific document
router.delete('/:id/documents/:docId', deleteEmployeeDocument); // Delete specific document

// Legacy routes (you can remove these if not used elsewhere)
router.get('/documents/:docId', downloadDocument);
router.delete('/documents/:docId', deleteDocument);

module.exports = router;
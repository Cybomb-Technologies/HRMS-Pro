const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const {
  getAllOffboarding,
  getOffboardingByEmployeeId,
  startOffboarding,
  updateOffboardingStatus,
  completeStep,
  updateStepNotes,
  addAsset,
  returnAsset,
  updateFinalSettlement,
  completeOffboarding,
  deleteOffboarding,
  getOffboardingStats,
  uploadDocument,
  deleteDocument,
  debugEmployeeStatus,
  forceUpdateEmployeeStatus
} = require('../controllers/offboardingController');

// Get all offboarding records
router.get('/', getAllOffboarding);

// Get offboarding statistics
router.get('/stats', getOffboardingStats);

// Get offboarding by employee ID
router.get('/:employeeId', getOffboardingByEmployeeId);

// Debug routes
router.get('/:employeeId/debug-status', debugEmployeeStatus);
router.put('/:employeeId/force-inactive', forceUpdateEmployeeStatus);

// Start new offboarding process
router.post('/', startOffboarding);

// Update offboarding status
router.put('/:employeeId', updateOffboardingStatus);

// Complete a step
router.put('/:employeeId/step', completeStep);

// Update step notes
router.put('/:employeeId/step/:stepId/notes', updateStepNotes);

// Upload document - FIXED: Use multer middleware
router.post('/:employeeId/documents', upload.single('document'), uploadDocument);

// Delete document
router.delete('/:employeeId/documents/:documentId', deleteDocument);

// Add asset to recovery
router.post('/:employeeId/assets', addAsset);

// Mark asset as returned
router.put('/:employeeId/assets/:assetId/return', returnAsset);

// Update final settlement
router.put('/:employeeId/settlement', updateFinalSettlement);

// Complete offboarding process
router.put('/:employeeId/complete', completeOffboarding);

// Delete offboarding record
router.delete('/:employeeId', deleteOffboarding);

module.exports = router;
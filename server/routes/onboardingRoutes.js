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
  getAllOnboarding,
  getOnboardingByEmployeeId,
  startOnboarding,
  updateOnboardingStatus,
  completeStep,
  updateStepNotes,
  deleteOnboarding,
  getOnboardingStats,
  uploadDocument,
  deleteDocument
} = require('../controllers/onboardingController');

// Get all onboarding records
router.get('/', getAllOnboarding);

// Get onboarding statistics
router.get('/stats', getOnboardingStats);

// Get onboarding by employee ID
router.get('/:employeeId', getOnboardingByEmployeeId);

// Start new onboarding process
router.post('/', startOnboarding);

// Update onboarding status
router.put('/:employeeId', updateOnboardingStatus);

// Complete a step
router.put('/:employeeId/step', completeStep);

// Update step notes
router.put('/:employeeId/step/:stepId/notes', updateStepNotes);

// Upload document - FIXED: Use multer middleware
router.post('/:employeeId/documents', upload.single('document'), uploadDocument);

// Delete document
router.delete('/:employeeId/documents/:documentId', deleteDocument);

// Delete onboarding record
router.delete('/:employeeId', deleteOnboarding);

module.exports = router;
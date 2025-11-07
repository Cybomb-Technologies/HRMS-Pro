const express = require('express');
const router = express.Router();
const hrLettersController = require('../controllers/hrLettersController');
const { authMiddleware, hrMiddleware } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Generate new HR letter - require HR role
router.post('/generate', hrMiddleware, hrLettersController.generateLetter);

// Update and regenerate letter - require HR role
router.put('/:id/regenerate', hrMiddleware, hrLettersController.updateAndRegenerate);

// Get all letters with pagination and filtering
router.get('/', hrLettersController.getAllLetters);

// Get letter statistics
router.get('/statistics', hrLettersController.getStatistics);

// Get single letter by ID
router.get('/:id', hrLettersController.getLetterById);

// Download PDF
router.get('/download/:id', hrLettersController.downloadPDF);

// Preview HTML
router.get('/preview/:id', hrLettersController.previewHTML);

// Delete letter - require HR role
router.delete('/:id', hrMiddleware, hrLettersController.deleteLetter);

module.exports = router;
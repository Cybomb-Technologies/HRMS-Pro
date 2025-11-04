const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplate,
  createTemplate,
  uploadWordTemplate,
  generateOfferLetter,
  updateTemplate,
  deleteTemplate,
  getGeneratedLetters,
  getGeneratedLetter,
  updateGeneratedLetter,
  deleteGeneratedLetter,
  downloadPDF,
  sendOfferLetter,
  getOfferLetterStats,
  upload,
  handleUploadError
} = require('../controllers/offerLetterController');
const { authMiddleware, hrMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Template routes
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplate);
router.post('/templates', hrMiddleware, createTemplate);
router.put('/templates/:id', hrMiddleware, updateTemplate);
router.delete('/templates/:id', hrMiddleware, deleteTemplate);

// Word upload route with error handling
router.post('/upload-word', 
  hrMiddleware, 
  upload.single('wordFile'),
  handleUploadError,
  uploadWordTemplate
);

// Generation routes
router.post('/generate/:templateId', hrMiddleware, generateOfferLetter);

// Generated letters routes
router.get('/generated', hrMiddleware, getGeneratedLetters);
router.get('/generated/:id', hrMiddleware, getGeneratedLetter);
router.put('/generated/:id', hrMiddleware, updateGeneratedLetter);
router.delete('/generated/:id', hrMiddleware, deleteGeneratedLetter);

// PDF and email routes
router.get('/download/:id', hrMiddleware, downloadPDF);
router.post('/send/:id', hrMiddleware, sendOfferLetter);

// Stats route
router.get('/stats', hrMiddleware, getOfferLetterStats);

module.exports = router;
// routes/offerLetterRoutes.js
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
  upload
} = require('../controllers/offerLetterController');
const { authMiddleware, hrMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// GET /api/offer-letters - Get all templates
router.get('/', getTemplates);

// GET /api/offer-letters/generated/all - Get all generated letters
router.get('/generated/all', hrMiddleware, getGeneratedLetters);

// GET /api/offer-letters/generated/:id - Get single generated letter
router.get('/generated/:id', hrMiddleware, getGeneratedLetter);

// PUT /api/offer-letters/generated/:id - Update generated letter
router.put('/generated/:id', hrMiddleware, updateGeneratedLetter);

// DELETE /api/offer-letters/generated/:id - Delete generated letter
router.delete('/generated/:id', hrMiddleware, deleteGeneratedLetter);

// POST /api/offer-letters/upload-word - Upload Word document as template
router.post('/upload-word', hrMiddleware, upload.single('wordFile'), uploadWordTemplate);

// GET /api/offer-letters/:id - Get single template
router.get('/:id', getTemplate);

// POST /api/offer-letters - Create new template (HR/Admin only)
router.post('/', hrMiddleware, createTemplate);

// POST /api/offer-letters/:id/generate - Generate offer letter (HR/Admin only)
router.post('/:id/generate', hrMiddleware, generateOfferLetter);

// PUT /api/offer-letters/:id - Update template (HR/Admin only)
router.put('/:id', hrMiddleware, updateTemplate);

// DELETE /api/offer-letters/:id - Delete template (HR/Admin only)
router.delete('/:id', hrMiddleware, deleteTemplate);

// GET /api/offer-letters/download/:id - Download PDF
router.get('/download/:id', hrMiddleware, downloadPDF);

// POST /api/offer-letters/send/:id - Send offer letter via email
router.post('/send/:id', hrMiddleware, sendOfferLetter);

module.exports = router;
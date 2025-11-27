const express = require('express');
const router = express.Router();
const {
  // Template controllers
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  downloadTemplateFile,
  getTemplateFileInfo,
  
  // Category controllers
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/letterTemplateController');

// Import your actual middleware
const { authMiddleware } = require('../middleware/authMiddleware');

// ==================== TEMPLATE ROUTES ====================

// Template CRUD routes
router.route('/')
  .get(authMiddleware, getTemplates)
  .post(authMiddleware, createTemplate); // ← ADD authMiddleware HERE

// Template file management routes
router.route('/:id/download')
  .get(authMiddleware, downloadTemplateFile);

router.route('/:id/file-info')
  .get(authMiddleware, getTemplateFileInfo);

// Template CRUD routes with ID
router.route('/:id')
  .put(authMiddleware, updateTemplate)
  .delete(authMiddleware, deleteTemplate);

// ==================== CATEGORY ROUTES ====================

// Category CRUD routes
router.route('/categories')
  .get(authMiddleware, getCategories)
  .post(authMiddleware, createCategory);

// Category CRUD routes with ID
router.route('/categories/:id')
  .put(authMiddleware, updateCategory)
  .delete(authMiddleware, deleteCategory);

module.exports = router;
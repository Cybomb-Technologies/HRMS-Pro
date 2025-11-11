// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware'); // ✅ Change from 'protect' to 'authMiddleware'

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/me', authMiddleware, authController.getUserProfile); // ✅ Use authMiddleware instead of protect

module.exports = router;
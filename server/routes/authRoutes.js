// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, hrMiddleware } = require('../middleware/authMiddleware');

// Register user
router.post('/register', authController.registerUser);

// Login user
router.post('/login', authController.loginUser);

// Get user profile
router.get('/me', authMiddleware, authController.getUserProfile);

// Change password
router.post('/change-password', authMiddleware, authController.changePassword);

// Password reset routes
router.post('/password/reset/initiate', authController.initiatePasswordReset);
router.post('/password/reset/verify-2fa', authController.verifyTwoFactorForReset);
router.post('/password/reset', authController.resetPassword);

// 2FA Routes
router.post('/2fa/setup', authMiddleware, authController.setupTwoFactor);
router.post('/2fa/verify', authMiddleware, authController.verifyTwoFactor);
router.post('/2fa/verify-setup', authController.verifyTwoFactorSetup); // Remove authMiddleware for setup
router.post('/2fa/disable', authMiddleware, hrMiddleware, authController.disableTwoFactor);
router.post('/2fa/verify-login', authController.verifyTwoFactorLogin);

// 2FA Requirement Routes
router.get('/2fa/requirement', authController.getTwoFactorRequirement);
router.get('/2fa/check-requirement', authMiddleware, authController.checkTwoFactorRequirement);

module.exports = router;
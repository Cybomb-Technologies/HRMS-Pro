// controllers/authController.js
const User = require('../models/User.js');
const Employee = require('../models/Employee.js');
const Offboarding = require('../models/offboardingModel');
const { CompanySettings } = require('../models/Settings');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate token with 2FA expiry information
const signToken = (user, twoFactorVerified = false) => {
  const payload = {
    id: user._id.toString(),
    role: user.role,
    employeeId: user.employeeId || null,
    email: user.email,
    name: user.name || user.email?.split('@')[0],
    twoFactorEnabled: user.twoFactorEnabled || false,
    twoFactorSetupCompleted: user.twoFactorSetupCompleted || false,
  };

  // Add 2FA verification expiry if 2FA was verified
  if (twoFactorVerified && user.twoFactorEnabled && user.twoFactorSetupCompleted) {
    payload.twoFactorVerifiedAt = Date.now();
    payload.twoFactorExpiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days
  }

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '3d' }
  );
};

// Helper function to check if 2FA is required
const isTwoFactorRequired = async (user, tokenPayload = null) => {
  try {
    // Check if user needs to complete 2FA setup
    if (user.twoFactorEnabled && !user.twoFactorSetupCompleted) {
      return {
        required: true,
        reason: 'Two-factor authentication setup required. Please complete 2FA setup to continue.',
        requiresTwoFactorSetup: true
      };
    }
    
    // Check if 2FA verification is required for login
    if (user.twoFactorEnabled && user.twoFactorSetupCompleted) {
      // Check if we have a valid 2FA verification in the token
      if (tokenPayload && tokenPayload.twoFactorVerifiedAt && tokenPayload.twoFactorExpiresAt) {
        const now = Date.now();
        if (now < tokenPayload.twoFactorExpiresAt) {
          // 2FA verification is still valid
          return { 
            required: false,
            twoFactorVerified: true,
            expiresAt: tokenPayload.twoFactorExpiresAt
          };
        }
      }
      
      // 2FA verification required
      return {
        required: true,
        reason: 'Two-factor authentication verification required.',
        requiresTwoFactorSetup: false
      };
    }
    
    return { required: false };
  } catch (error) {
    console.error('Error checking 2FA requirement:', error);
    return { required: false };
  }
};

// Generate temporary token for password reset
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// CHANGE PASSWORD FUNCTION
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, twoFactorCode } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // If 2FA is enabled and setup completed, verify the code
    if (user.twoFactorEnabled && user.twoFactorSetupCompleted) {
      if (!twoFactorCode) {
        return res.status(400).json({
          success: false,
          requiresTwoFactor: true,
          message: 'Two-factor authentication code is required'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid two-factor authentication code'
        });
      }
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// REGISTER USER - WITH 2FA SETUP REQUIRED
exports.registerUser = async (req, res) => {
  const { email, password, name, role, employeeId, adminId, hrId } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user with 2FA enabled but setup not completed
    const user = new User({
      email,
      password,
      name,
      role: role || 'employee',
      employeeId,
      adminId,
      hrId,
      twoFactorEnabled: true, // Enable 2FA by default
      twoFactorSetupCompleted: false // Setup not completed yet
    });

    // Generate 2FA secret for the user
    const secret = speakeasy.generateSecret({
      name: `HRMS Pro (${user.email})`,
      issuer: 'HRMS Pro'
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate QR code for initial setup
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please set up 2FA using the QR code.',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        adminId: user.adminId,
        hrId: user.hrId,
        name: user.name,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSetupCompleted: user.twoFactorSetupCompleted
      },
      twoFactorSetup: {
        secret: secret.base32,
        qrCodeDataURL: qrCodeDataURL,
        requiresVerification: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server Error during registration', 
      error: error.message 
    });
  }
};

// LOGIN USER - WITH PROPER 2FA FLOW AND 3-DAY EXPIRY
exports.loginUser = async (req, res) => {
  const { email, password, twoFactorCode, setupTwoFactor } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: 'Your account is inactive. Please contact administrator.' 
      });
    }

    // Check 2FA requirement
    const twoFactorRequirement = await isTwoFactorRequired(user);
    
    // If user needs to setup 2FA (first time login after registration)
    if (twoFactorRequirement.required && twoFactorRequirement.requiresTwoFactorSetup && !twoFactorCode && !setupTwoFactor) {
      // Generate new secret and QR code if not exists
      if (!user.twoFactorSecret) {
        const secret = speakeasy.generateSecret({
          name: `HRMS Pro (${user.email})`,
          issuer: 'HRMS Pro'
        });
        user.twoFactorSecret = secret.base32;
        await user.save();
      }

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(speakeasy.otpauthURL({
        secret: user.twoFactorSecret,
        label: `HRMS Pro (${user.email})`,
        issuer: 'HRMS Pro',
        encoding: 'base32'
      }));

      return res.status(200).json({
        requiresTwoFactor: true,
        requiresTwoFactorSetup: true,
        message: 'Two-factor authentication setup required',
        twoFactorSetup: {
          secret: user.twoFactorSecret,
          qrCodeDataURL: qrCodeDataURL,
          requiresVerification: true
        }
      });
    }

    // Handle 2FA setup verification during login
    if (setupTwoFactor && twoFactorCode) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ 
          message: 'Invalid two-factor authentication code' 
        });
      }

      // Enable 2FA and mark setup as completed
      user.twoFactorEnabled = true;
      user.twoFactorSetupCompleted = true;
      await user.save();
    }

    // If 2FA code is provided for regular login (user already completed setup)
    if (twoFactorCode && !setupTwoFactor && user.twoFactorEnabled && user.twoFactorSetupCompleted) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ 
          message: 'Invalid two-factor authentication code' 
        });
      }
    }

    // If user has completed 2FA setup but no code provided
    if (user.twoFactorEnabled && user.twoFactorSetupCompleted && !twoFactorCode && !setupTwoFactor) {
      return res.status(200).json({
        requiresTwoFactor: true,
        requiresTwoFactorSetup: false,
        message: 'Two-factor authentication verification required'
      });
    }

    // If user doesn't have 2FA setup completed, force setup
    if (user.twoFactorEnabled && !user.twoFactorSetupCompleted && !twoFactorCode && !setupTwoFactor) {
      // Generate QR code for setup
      const qrCodeDataURL = await QRCode.toDataURL(speakeasy.otpauthURL({
        secret: user.twoFactorSecret,
        label: `HRMS Pro (${user.email})`,
        issuer: 'HRMS Pro',
        encoding: 'base32'
      }));

      return res.status(200).json({
        requiresTwoFactor: true,
        requiresTwoFactorSetup: true,
        message: 'Two-factor authentication setup required',
        twoFactorSetup: {
          secret: user.twoFactorSecret,
          qrCodeDataURL: qrCodeDataURL,
          requiresVerification: true
        }
      });
    }

    // If employee, validate status with offboarding support
    if (user.role === 'employee') {
      if (!user.employeeId) return res.status(400).json({ message: 'Employee ID not linked with user' });
      
      const employee = await Employee.findOne({ employeeId: user.employeeId });
      if (!employee) return res.status(400).json({ message: 'Employee record not found' });
      
      if (employee.status === 'inactive') {
        return res.status(403).json({ message: 'Your account is inactive. Please contact admin.' });
      }
      
      const offboarding = await Offboarding.findOne({ employeeId: user.employeeId });
      const isInOffboarding = offboarding && offboarding.status !== 'completed';
      
      user.offboardingInProgress = isInOffboarding;
      user.employeeStatus = employee.status;
    }

    // Generate token with 2FA verification status
    const twoFactorWasVerified = (twoFactorCode && !setupTwoFactor) || (setupTwoFactor && twoFactorCode);
    const token = signToken(user, twoFactorWasVerified);

    // Enhanced response with offboarding information and 2FA expiry
    const responseData = {
      _id: user._id,
      email: user.email,
      role: user.role,
      adminId: user.adminId || null,
      hrId: user.hrId || null,
      employeeId: user.employeeId || null,
      token,
      twoFactorEnabled: user.twoFactorEnabled || false,
      twoFactorSetupCompleted: user.twoFactorSetupCompleted || false,
      offboardingInProgress: user.offboardingInProgress || false,
      employeeStatus: user.employeeStatus || 'active',
      name: user.name || user.email.split('@')[0]
    };

    // Add 2FA expiry information if 2FA was verified
    if (twoFactorWasVerified) {
      responseData.twoFactorVerified = true;
      responseData.twoFactorExpiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// VERIFY 2FA SETUP (Separate endpoint for setup verification)
exports.verifyTwoFactorSetup = async (req, res) => {
  try {
    const { email, code, secret } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification code are required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 6-digit code' 
      });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: secret || user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please try again.' 
      });
    }

    // Mark 2FA setup as completed
    user.twoFactorSetupCompleted = true;
    await user.save();

    // Generate new token with updated 2FA status and verification
    const token = signToken(user, true);

    res.json({
      success: true,
      message: 'Two-factor authentication has been setup successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSetupCompleted: user.twoFactorSetupCompleted,
        name: user.name || user.email.split('@')[0]
      },
      twoFactorVerified: true,
      twoFactorExpiresAt: Date.now() + (3 * 24 * 60 * 60 * 1000) // 3 days
    });

  } catch (error) {
    console.error('2FA setup verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying two-factor authentication setup',
      error: error.message 
    });
  }
};

// VERIFY 2FA FOR LOGIN (standalone endpoint)
exports.verifyTwoFactorLogin = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and verification code are required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if 2FA setup is completed
    if (!user.twoFactorSetupCompleted) {
      return res.status(403).json({ 
        success: false, 
        message: 'Two-factor authentication setup not completed. Please complete 2FA setup first.',
        requiresTwoFactorSetup: true
      });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code' 
      });
    }

    // Generate token for successful login with 2FA verification
    const token = signToken(user, true);

    res.json({
      success: true,
      message: 'Two-factor authentication verified successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSetupCompleted: user.twoFactorSetupCompleted,
        name: user.name || user.email.split('@')[0]
      },
      twoFactorVerified: true,
      twoFactorExpiresAt: Date.now() + (3 * 24 * 60 * 60 * 1000) // 3 days
    });

  } catch (error) {
    console.error('2FA login verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying two-factor authentication',
      error: error.message 
    });
  }
};

// CHECK 2FA REQUIREMENT STATUS
exports.checkTwoFactorRequirement = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({
        requiresTwoFactor: true,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        requiresTwoFactor: true,
        message: 'User not found'
      });
    }

    // Check 2FA requirement with token payload
    const twoFactorRequirement = await isTwoFactorRequired(user, decoded);

    res.json({
      requiresTwoFactor: twoFactorRequirement.required,
      requiresTwoFactorSetup: twoFactorRequirement.requiresTwoFactorSetup || false,
      twoFactorVerified: twoFactorRequirement.twoFactorVerified || false,
      twoFactorExpiresAt: twoFactorRequirement.expiresAt || null,
      message: twoFactorRequirement.reason || 'Two-factor authentication status'
    });

  } catch (error) {
    console.error('Check 2FA requirement error:', error);
    res.json({
      requiresTwoFactor: true,
      message: 'Error checking 2FA requirement'
    });
  }
};

// SETUP 2FA
exports.setupTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a secret key
    const secret = speakeasy.generateSecret({
      name: `HRMS Pro (${user.email})`,
      issuer: 'HRMS Pro'
    });

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret to user (but don't mark setup as completed until verified)
    user.twoFactorSecret = secret.base32;
    user.twoFactorSetupCompleted = false;
    await user.save();

    res.json({
      success: true,
      secret: secret.base32,
      qrCodeDataURL: qrCodeDataURL,
      requiresVerification: true
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error setting up two-factor authentication',
      error: error.message 
    });
  }
};

// VERIFY 2FA (for existing users)
exports.verifyTwoFactor = async (req, res) => {
  try {
    const { code, secret } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 6-digit code' 
      });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: secret || user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code. Please try again.' 
      });
    }

    // Enable 2FA and mark setup as completed
    user.twoFactorEnabled = true;
    user.twoFactorSetupCompleted = true;
    await user.save();

    res.json({
      success: true,
      message: 'Two-factor authentication has been enabled successfully'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying two-factor authentication',
      error: error.message 
    });
  }
};

// DISABLE 2FA (Admin only)
exports.disableTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Only admins can disable 2FA
    if (!['admin', 'employer'].includes(user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only administrators can disable two-factor authentication' 
      });
    }

    user.twoFactorSecret = null;
    user.twoFactorEnabled = false;
    user.twoFactorSetupCompleted = false;
    await user.save();

    res.json({
      success: true,
      message: 'Two-factor authentication has been disabled'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error disabling two-factor authentication',
      error: error.message 
    });
  }
};

// ENHANCED INITIATE PASSWORD RESET WITH 2FA
exports.initiatePasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists or not for security
      return res.json({
        success: true,
        message: 'If the email exists, a reset process has been initiated',
        requiresTwoFactor: false
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: 'Your account is inactive. Please contact administrator.' 
      });
    }

    // Generate reset token and expiry
    const resetToken = generateResetToken();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    res.json({
      success: true,
      message: 'If the email exists, a reset process has been initiated',
      requiresTwoFactor: user.twoFactorEnabled && user.twoFactorSetupCompleted,
      resetToken: resetToken // Send token for immediate use in non-2FA cases
    });

  } catch (error) {
    console.error('Password reset initiation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error initiating password reset',
      error: error.message 
    });
  }
};

// ENHANCED VERIFY 2FA FOR PASSWORD RESET
exports.verifyTwoFactorForReset = async (req, res) => {
  // resetToken is not expected in this body, as it's passed from the front-end state
  const { email, twoFactorCode } = req.body; 

  if (!email || !twoFactorCode) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and verification code are required' 
    });
  }

  try {
    // Find user by email and an *active* reset token
    const user = await User.findOne({ 
      email,
      resetPasswordToken: { $exists: true }, // We just need *a* token to be present and active
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset process' 
      });
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid two-factor authentication code' 
      });
    }

    // Generate a secure token for password reset (this is the actual reset token)
    const secureResetToken = generateResetToken();
    user.resetPasswordToken = secureResetToken;
    user.resetPasswordExpires = Date.now() + 900000; // 15 minutes for actual reset
    await user.save();

    res.json({
      success: true,
      message: 'Two-factor authentication verified',
      resetToken: secureResetToken
    });

  } catch (error) {
    console.error('2FA verification for reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying two-factor authentication',
      error: error.message 
    });
  }
};

// ENHANCED RESET PASSWORD WITH 2FA VERIFICATION
exports.resetPassword = async (req, res) => {
  const { email, newPassword, resetToken, twoFactorCode } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and new password are required' 
    });
  }

  try {
    const user = await User.findOne({ 
      email,
      resetPasswordToken: resetToken, // Check against the secure token from state
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // If 2FA is enabled and setup completed, verify the code
    if (user.twoFactorEnabled && user.twoFactorSetupCompleted) {
      if (!twoFactorCode) {
        return res.status(400).json({ 
          success: false, 
          message: 'Two-factor authentication code is required' 
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid two-factor authentication code' 
        });
      }
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error resetting password',
      error: error.message 
    });
  }
};

// GET PASSWORD RESET STATUS
exports.getPasswordResetStatus = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  try {
    const user = await User.findOne({ 
      email,
      resetPasswordToken: { $exists: true },
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active reset process found' 
      });
    }

    res.json({
      success: true,
      requiresTwoFactor: user.twoFactorEnabled && user.twoFactorSetupCompleted,
      resetToken: user.resetPasswordToken,
      expiresAt: user.resetPasswordExpires
    });

  } catch (error) {
    console.error('Get password reset status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking reset status',
      error: error.message 
    });
  }
};

// CANCEL PASSWORD RESET
exports.cancelPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Clear reset tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset process cancelled'
    });

  } catch (error) {
    console.error('Cancel password reset error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error cancelling password reset',
      error: error.message 
    });
  }
};

// GET 2FA REQUIREMENT STATUS
exports.getTwoFactorRequirement = async (req, res) => {
  try {
    // 2FA is now always required by default
    res.json({
      success: true,
      requireTwoFactorAuth: true,
      message: 'Two-factor authentication is required for all users'
    });
  } catch (error) {
    console.error('Error getting 2FA requirement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting 2FA requirement status',
      error: error.message 
    });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let offboardingInProgress = false;
    let employeeStatus = 'active';

    if (user.role === 'employee' && user.employeeId) {
      const employee = await Employee.findOne({ employeeId: user.employeeId });
      if (employee) {
        employeeStatus = employee.status;
        const offboarding = await Offboarding.findOne({ employeeId: user.employeeId });
        offboardingInProgress = offboarding && offboarding.status !== 'completed';
      }
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      adminId: user.adminId,
      hrId: user.hrId,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorSetupCompleted: user.twoFactorSetupCompleted,
      offboardingInProgress,
      employeeStatus,
      name: user.name
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
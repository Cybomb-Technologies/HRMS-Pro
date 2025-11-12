// src/pages/LoginPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff, Building2, Shield, Globe, Key, ArrowLeft, AlertTriangle, QrCode, Copy, Check, Lock, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Memoized ForgotPasswordForm component
const ForgotPasswordForm = React.memo(({
  formData,
  handleChange,
  handleTwoFactorCodeChange,
  resetRequires2FA,
  resetLoading,
  currentResetStep,
  resetEmail,
  handleForgotPassword,
  handlePasswordReset,
  backToLogin,
  showNewPassword,
  showConfirmPassword,
  setShowNewPassword,
  setShowConfirmPassword
}) => {
  // Initial step - request password reset (Enter Email)
  if (currentResetStep === 'initiate') {
    return (
      <div className="space-y-6"> 
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-50 rounded-full">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Reset Your Password</h3>
          <p className="text-sm text-gray-600 mt-2">
            Enter your email address to begin the password reset process
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="h-12"
              disabled={resetLoading}
              autoFocus
            />
          </div>
        </div>

        <Button
          type="button" 
          onClick={handleForgotPassword} 
          disabled={resetLoading || !formData.email}
          className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Starting Reset Process...</span>
            </div>
          ) : (
            'Continue to Reset'
          )}
        </Button>

        <Button
          type="button"
          onClick={backToLogin}
          variant="outline"
          className="w-full gap-2"
          disabled={resetLoading}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Button>
      </div>
    );
  }

  // Password reset form (final step)
  if (currentResetStep === 'reset_password') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-50 rounded-full">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Create New Password</h3>
          <p className="text-sm text-gray-600 mt-2">
            Enter your new password below for <span className="font-medium">{resetEmail || formData.email}</span>
          </p>
          {/* Show 2FA requirement warning if necessary */}
          {resetRequires2FA && (
            <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-700 flex items-center justify-center">
                <Shield className="w-4 h-4 mr-2" />
                Two-factor authentication is required to complete this step.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                required
                className="h-12 pr-12"
                disabled={resetLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={resetLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
                className="h-12 pr-12"
                disabled={resetLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={resetLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Show 2FA input if required */}
          {resetRequires2FA && (
            <div className="space-y-2">
              <Label htmlFor="twoFactorCodeReset" className="text-sm font-medium">
                Two-Factor Authentication Code
              </Label>
              <Input
                id="twoFactorCodeReset"
                name="twoFactorCode"
                type="text"
                value={formData.twoFactorCode}
                onChange={handleTwoFactorCodeChange}
                placeholder="000000"
                maxLength={6}
                className="h-12 text-center text-lg tracking-widest font-mono"
                disabled={resetLoading}
              />
              <p className="text-xs text-gray-500">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handlePasswordReset}
          disabled={resetLoading || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword || (resetRequires2FA && formData.twoFactorCode.length !== 6)}
          className="w-full h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Resetting Password...</span>
            </div>
          ) : (
            'Reset Password'
          )}
        </Button>

        <Button
          type="button"
          onClick={backToLogin}
          variant="outline"
          className="w-full gap-2"
          disabled={resetLoading}
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel Reset
        </Button>
      </div>
    );
  }

  return null;
});

// Memoized EmailPasswordForm component
const EmailPasswordForm = React.memo(({ 
  formData, 
  handleChange, 
  showPassword, 
  setShowPassword, 
  loading, 
  setShowForgotPassword 
}) => (
  <>
    <div className="space-y-2">
      <Label htmlFor="email">Email Address</Label>
      <Input
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter your email"
        required
        className="h-12"
        disabled={loading}
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="password">Password</Label>
      <div className="relative">
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          className="h-12 pr-12"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={loading}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>

    <div className="text-right">
      <Button
        type="button"
        onClick={() => setShowForgotPassword(true)}
        variant="link"
        className="text-blue-600 hover:text-blue-700 text-sm p-0"
      >
        <Lock className="w-3 h-3 mr-1" />
        Forgot Password?
      </Button>
    </div>

    <Button
      type="submit"
      disabled={loading}
      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Signing in...</span>
        </div>
      ) : (
        'Sign In'
      )}
    </Button>
  </>
));

// Memoized TwoFactorVerification component
const TwoFactorVerification = React.memo(({ 
  formData, 
  handleTwoFactorCodeChange, 
  twoFactorLoading, 
  verifyTwoFactor 
}) => (
  <div className="space-y-4 text-center">
    <div className="flex justify-center mb-2">
      <div className="p-3 bg-blue-50 rounded-full">
        <Key className="w-8 h-8 text-blue-600" />
      </div>
    </div>
    
    <div>
      <h3 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h3>
      <p className="text-sm text-gray-600 mt-1">
        Enter the 6-digit code from your authenticator app
      </p>
      <p className="text-xs text-gray-500 mt-1">
        For account: <span className="font-medium">{formData.email}</span>
      </p>
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="twoFactorCode" className="text-sm font-medium">
        Verification Code
      </Label>
      <Input
        id="twoFactorCode"
        name="twoFactorCode"
        type="text"
        value={formData.twoFactorCode}
        onChange={handleTwoFactorCodeChange}
        placeholder="000000"
        maxLength={6}
        required
        className="h-12 text-center text-lg tracking-widest font-mono"
        disabled={twoFactorLoading}
        autoFocus
      />
    </div>

    <Button
      onClick={verifyTwoFactor}
      disabled={twoFactorLoading || formData.twoFactorCode.length !== 6}
      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {twoFactorLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Verifying...</span>
        </div>
      ) : (
        'Verify & Login'
      )}
    </Button>
  </div>
));

const LoginPage = () => {
  const { 
    login, 
    isAuthenticated, 
    requiresTwoFactor, 
    requiresTwoFactorSetup,
    verifyTwoFactorLogin, 
    setupTwoFactorLogin,
    verifyTwoFactorSetup,
    cancelTwoFactor,
    pendingEmail,
    twoFactorSetupData,
    // Password reset functions
    initiatePasswordReset,
    verifyTwoFactorForReset,
    resetPassword,
    cancelPasswordReset,
    passwordResetStep,
    resetToken,
    resetEmail
  } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentResetStep, setCurrentResetStep] = useState('initiate'); // initiate, reset_password

  // FIX: New state for 2FA requirement
  const [resetRequires2FA, setResetRequires2FA] = useState(false); 

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // Update form data when pending email changes (from 2FA flow)
  useEffect(() => {
    if (requiresTwoFactor && pendingEmail) {
      setFormData(prev => ({ ...prev, email: pendingEmail }));
    }
  }, [requiresTwoFactor, pendingEmail]);

  // Sync with AuthContext password reset step - MODIFIED to only track 'reset_password'
  useEffect(() => {
    if (passwordResetStep === 'reset_password') {
      setCurrentResetStep('reset_password');
    } else if (passwordResetStep === null) {
      setCurrentResetStep('initiate');
    }
  }, [passwordResetStep]);

  // FIXED: Stable callback for form data changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setError('');
  }, []); // Empty dependency array makes this stable

  // FIXED: Stable callback for two-factor code changes
  const handleTwoFactorCodeChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, twoFactorCode: value }));
    setError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (requiresTwoFactor) {
      if (requiresTwoFactorSetup) {
        await setupTwoFactor();
      } else {
        await verifyTwoFactor();
      }
      return;
    }

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.requiresTwoFactor) {
        console.log('2FA required, showing code input');
      } else if (result.requiresTwoFactorSetup) {
        console.log('2FA setup required, QR data:', result.twoFactorSetup);
      } else if (result.success) {
        const user = JSON.parse(localStorage.getItem('hrms_user'));
        const role = user?.role;

        if (role === 'employer' || role === 'hr' || role === 'employee') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!formData.twoFactorCode || formData.twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setTwoFactorLoading(true);
    setError('');

    try {
      const result = await verifyTwoFactorLogin(formData.twoFactorCode);

      if (result.success) {
        const user = JSON.parse(localStorage.getItem('hrms_user'));
        const role = user?.role;

        if (role === 'employer' || role === 'hr' || role === 'employee') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setError('Failed to verify two-factor authentication. Please try again.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const setupTwoFactor = async () => {
    if (!formData.twoFactorCode || formData.twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setTwoFactorLoading(true);
    setError('');

    try {
      let result;
      
      if (twoFactorSetupData?.secret) {
        result = await verifyTwoFactorSetup(
          formData.twoFactorCode, 
          twoFactorSetupData.secret
        );
      } else {
        result = await setupTwoFactorLogin(
          formData.twoFactorCode, 
          formData.email, 
          formData.password
        );
      }

      if (result.success) {
        const user = JSON.parse(localStorage.getItem('hrms_user'));
        const role = user?.role;

        if (role === 'employer' || role === 'hr' || role === 'employee') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('2FA setup error:', err);
      setError('Failed to setup two-factor authentication. Please try again.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Password Reset Functions
  const handleForgotPassword = async (e) => {
    // Prevent default form submission if it's an event
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault(); 
    }
    
    if (currentResetStep !== 'initiate') return; 

    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setError('');

    try {
      const result = await initiatePasswordReset(formData.email);

      if (result.success) {
        setShowForgotPassword(true);
        
        // FIX: Set 2FA status directly
        setResetRequires2FA(result.requiresTwoFactor);
        
        // Always go directly to the password reset form
        setCurrentResetStep('reset_password');
        
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Failed to initiate password reset. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setResetLoading(true);
    setError('');

    try {
      let twoFactorCodeForReset = null; // Changed to null for clarity
      
      // Use the local state variable to check if 2FA is required
      if (resetRequires2FA) {
        if (!formData.twoFactorCode || formData.twoFactorCode.length !== 6) {
          setError('Please enter your two-factor authentication code');
          setResetLoading(false);
          return;
        }
        twoFactorCodeForReset = formData.twoFactorCode;
      }
      
      // Use the token set in the AuthContext state after initiation
      const result = await resetPassword(
        formData.newPassword, 
        twoFactorCodeForReset,
        resetToken // Use the token from AuthContext state
      );

      if (result.success) {
        setShowForgotPassword(false);
        setCurrentResetStep('initiate');
        
        // Clear local reset state
        setResetRequires2FA(false);
        
        setFormData(prev => ({ 
          ...prev, 
          newPassword: '', 
          confirmPassword: '',
          twoFactorCode: '' 
        }));
        
        // Show success message
        toast({
          title: "Password Reset Successful",
          description: "You can now login with your new password",
        });
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const backToLogin = () => {
    setShowForgotPassword(false);
    setCurrentResetStep('initiate');
    
    // Clear local and context reset state
    setResetRequires2FA(false);
    cancelPasswordReset();
    
    setFormData(prev => ({ 
      ...prev, 
      newPassword: '', 
      confirmPassword: '',
      twoFactorCode: '' 
    }));
    setError('');
  };

  const backToEmailPassword = () => {
    cancelTwoFactor();
    setFormData(prev => ({ ...prev, twoFactorCode: '' }));
    setError('');
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const TwoFactorSetup = () => {
    if (!twoFactorSetupData) {
      return (
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading QR code...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <QrCode className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Setup Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600 mt-2">
            Scan the QR code with your authenticator app to get started
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3 text-sm">Step 1: Scan QR Code</h4>
            <p className="text-sm text-gray-600 mb-3">
              Open your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.) and scan this QR code:
            </p>
            <div className="flex justify-center">
              <img 
                src={twoFactorSetupData.qrCodeDataURL} 
                alt="QR Code for 2FA Setup" 
                className="w-48 h-48 border rounded-lg bg-white p-2"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 text-sm">Step 2: Or Enter Secret Key Manually</h4>
            <p className="text-sm text-gray-600 mb-2">
              If you can't scan the QR code, enter this secret key manually:
            </p>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono flex-1 break-all">
                {twoFactorSetupData.secret}
              </code>
              <Button
                onClick={() => copyToClipboard(twoFactorSetupData.secret)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 text-sm">Step 3: Enter Verification Code</h4>
            <p className="text-sm text-gray-600 mb-3">
              Enter the 6-digit code from your authenticator app to verify setup:
            </p>
            <div className="space-y-2">
              <Label htmlFor="twoFactorCode" className="text-sm font-medium">
                Verification Code
              </Label>
              <Input
                id="twoFactorCode"
                name="twoFactorCode"
                type="text"
                value={formData.twoFactorCode}
                onChange={handleTwoFactorCodeChange}
                placeholder="000000"
                maxLength={6}
                className="h-12 text-center text-lg tracking-widest font-mono"
                disabled={twoFactorLoading}
                autoFocus
              />
            </div>
          </div>
        </div>

        <Button
          onClick={setupTwoFactor}
          disabled={twoFactorLoading || formData.twoFactorCode.length !== 6}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {twoFactorLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Setting up 2FA...</span>
            </div>
          ) : (
            'Complete 2FA Setup'
          )}
        </Button>
      </div>
    );
  };

  // The main form handles standard login (with 2FA) and defers to ForgotPasswordForm for reset flow
  const renderCurrentForm = () => {
    if (showForgotPassword) {
      return (
        <ForgotPasswordForm
          formData={formData}
          handleChange={handleChange}
          handleTwoFactorCodeChange={handleTwoFactorCodeChange}
          resetRequires2FA={resetRequires2FA}
          resetLoading={resetLoading}
          currentResetStep={currentResetStep}
          resetEmail={resetEmail}
          handleForgotPassword={handleForgotPassword}
          handlePasswordReset={handlePasswordReset}
          backToLogin={backToLogin}
          showNewPassword={showNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowNewPassword={setShowNewPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />
      );
    } else if (!requiresTwoFactor) {
      // If no 2FA is required, show the standard login form
      return (
        <EmailPasswordForm
          formData={formData}
          handleChange={handleChange}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          loading={loading}
          setShowForgotPassword={setShowForgotPassword}
        />
      );
    } else if (requiresTwoFactorSetup) {
      // If 2FA setup is required, show the setup form
      return <TwoFactorSetup />;
    } else {
      // If 2FA verification is required, show the verification form
      return (
        <TwoFactorVerification
          formData={formData}
          handleTwoFactorCodeChange={handleTwoFactorCodeChange}
          twoFactorLoading={twoFactorLoading}
          verifyTwoFactor={verifyTwoFactor}
        />
      );
    }
  }

  return (
    <>
      <Helmet>
        <title>Login - HRMS Pro</title>
        <meta name="description" content="Secure login to HRMS Pro" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4"
            >
              <Building2 className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HRMS Pro
            </h1>
            <p className="text-gray-600 mt-2">Human Resource Management System</p>
          </div>

          {/* Login Card */}
          <Card className="p-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            {/* The main form is only used for the primary login flow */}
            <form onSubmit={!showForgotPassword ? handleSubmit : undefined} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 rounded-lg text-sm ${
                    requiresTwoFactorSetup || currentResetStep === 'reset_password'
                      ? 'bg-amber-50 border border-amber-200 text-amber-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  <div className="flex items-center">
                    {(requiresTwoFactorSetup || currentResetStep === 'reset_password') && <AlertTriangle className="w-4 h-4 mr-2" />}
                    {error}
                  </div>
                </motion.div>
              )}

              {/* Render the appropriate form based on the state */}
              {renderCurrentForm()}
              
              {/* Back button for 2FA flow (only when NOT in password reset) */}
              {requiresTwoFactor && !showForgotPassword && (
                <Button
                  type="button"
                  onClick={backToEmailPassword}
                  variant="outline"
                  className="w-full gap-2"
                  disabled={twoFactorLoading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Email/Password
                </Button>
              )}

              {/* Additional Help Text for 2FA */}
              {requiresTwoFactor && !requiresTwoFactorSetup && !showForgotPassword && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-xs text-gray-500 pt-2"
                >
                  <p>Having trouble? Make sure your authenticator app time is synchronized</p>
                </motion.div>
              )}
            </form>
          </Card>

          {/* Security Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 grid grid-cols-3 gap-4 text-center"
          >
            <div className="flex flex-col items-center space-y-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-xs text-gray-600">2FA Required</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Globe className="w-6 h-6 text-purple-600" />
              <span className="text-xs text-gray-600">Multi-Country</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <span className="text-xs text-gray-600">Enterprise</span>
            </div>
          </motion.div>

          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mt-8 text-xs text-gray-500"
          >
            <p>© 2025 HRMS Pro. All rights reserved.</p>
            <p className="mt-1">Secure enterprise human resource management</p>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
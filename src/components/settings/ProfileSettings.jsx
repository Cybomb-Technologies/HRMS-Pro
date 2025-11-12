// components/settings/sections/ProfileSettings.jsx
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Download, Eye, EyeOff, ArrowLeft, Shield, Check, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const PasswordChangeForm = ({ onCancel, onSuccess }) => {
  const { 
    changePassword, 
    user,
    cancelTwoFactor 
  } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorCode: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('password'); // 'password', 'twoFactor'
  const [passwordChangeData, setPasswordChangeData] = useState(null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  const handleTwoFactorCodeChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, twoFactorCode: value }));
    setError('');
  }, []);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const result = await changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully",
        });
        onSuccess();
      } else if (result.requiresTwoFactor) {
        // Store the password data for after 2FA verification
        setPasswordChangeData({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });
        setStep('twoFactor');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Password change error:', err);
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.twoFactorCode || formData.twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setTwoFactorLoading(true);
    setError('');

    try {
      // Complete the password change with 2FA code
      const result = await changePassword(
        passwordChangeData.currentPassword,
        passwordChangeData.newPassword,
        formData.twoFactorCode
      );

      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully",
        });
        onSuccess();
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

  const backToPassword = () => {
    setStep('password');
    setFormData(prev => ({ 
      ...prev, 
      twoFactorCode: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    setError('');
    setPasswordChangeData(null);
  };

  const cancelAndClose = () => {
    backToPassword();
    onCancel();
  };

  if (step === 'twoFactor') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-50 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Two-Factor Authentication Required</h3>
          <p className="text-sm text-gray-600 mt-2">
            Enter the 6-digit code from your authenticator app to confirm password change
          </p>
          {user?.email && (
            <p className="text-xs text-gray-500 mt-1">
              For account: <span className="font-medium">{user.email}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="space-y-4">
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
            <p className="text-xs text-gray-500 text-center">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={backToPassword}
            variant="outline"
            className="flex-1 gap-2"
            disabled={twoFactorLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleTwoFactorSubmit}
            disabled={twoFactorLoading || formData.twoFactorCode.length !== 6}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {twoFactorLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Confirm Change'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Change Your Password</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={cancelAndClose}
          className="h-8 w-8 p-0"
        >
          ×
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        Update your account password. You'll be logged out of other sessions.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              required
              className="h-12 pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

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
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={cancelAndClose}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Updating...</span>
              </div>
            ) : (
              'Change Password'
            )}
          </Button>
        </div>
      </form>

      {user?.twoFactorEnabled && user?.twoFactorSetupCompleted && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              Two-factor authentication is enabled. You'll need to enter a verification code.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileSettings = () => {
  const { handleAction } = useSettings();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState(null);

  const profileItems = [
    {
      icon: Lock,
      title: 'Change Password',
      description: 'Update your account password',
      action: 'Change Password'
    },
    {
      icon: Mail,
      title: 'Manage Email Notifications',
      description: 'Choose which emails you want to receive',
      action: 'Manage Email Notifications'
    },
  ];

  const handleItemAction = (action) => {
    if (action === 'Change Password') {
      setActiveModal('password');
    } else {
      handleAction(action);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handlePasswordChangeSuccess = () => {
    closeModal();
  };

  return (
    <>
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl font-semibold">My Profile Settings</CardTitle>
          <p className="text-muted-foreground">Manage your personal account settings and preferences</p>
        </CardHeader>
        <CardContent className="px-0 space-y-6">
          {profileItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="space-y-1">
                  <h4 className="font-medium flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {item.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Button variant="outline" onClick={() => handleItemAction(item.action)}>
                  {item.action}
                </Button>
              </div>
            );
          })}

          {/* 2FA Status Display */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-muted-foreground">
                  {user?.twoFactorEnabled && user?.twoFactorSetupCompleted 
                    ? "2FA is enabled for your account"
                    : "2FA is not enabled for your account"
                  }
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                user?.twoFactorEnabled && user?.twoFactorSetupCompleted
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {user?.twoFactorEnabled && user?.twoFactorSetupCompleted ? "Enabled" : "Not Enabled"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      {activeModal === 'password' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <PasswordChangeForm 
              onCancel={closeModal} 
              onSuccess={handlePasswordChangeSuccess}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSettings;
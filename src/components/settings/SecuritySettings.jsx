// components/settings/sections/SecuritySettings.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Save, QrCode, Key, Copy, Check, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const SecuritySettings = () => {
  const { settingsData, updateSettings, saveSettings, loading } = useSettings();
  const { user } = useAuth();
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const setup2FA = async () => {
    try {
      setSetupLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hrms_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setQrCodeDataURL(data.qrCodeDataURL);
        setSecret(data.secret);
        setShowSetup(true);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to setup 2FA",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('2FA setup error:', error);
      toast({
        title: "Error",
        description: "Failed to setup 2FA",
        variant: "destructive"
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Secret key copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit code",
        variant: "destructive"
      });
      return;
    }

    try {
      setSetupLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hrms_token')}`
        },
        body: JSON.stringify({ code: verificationCode, secret })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Two-factor authentication has been enabled"
        });
        setShowSetup(false);
        setVerificationCode('');
        // Update settings to reflect 2FA status
        updateSettings({
          security: { ...settingsData.security, twoFactorAuth: true }
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast({
        title: "Error",
        description: "Failed to verify 2FA code",
        variant: "destructive"
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const disable2FA = async () => {
    try {
      setSetupLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hrms_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Two-factor authentication has been disabled"
        });
        updateSettings({
          security: { ...settingsData.security, twoFactorAuth: false }
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to disable 2FA",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('2FA disable error:', error);
      toast({
        title: "Error",
        description: "Failed to disable 2FA",
        variant: "destructive"
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSave = async () => {
    await saveSettings('Security');
  };

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold">Security Settings</CardTitle>
        <p className="text-muted-foreground">Configure security policies and authentication methods</p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {/* Security Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Enhanced Security</h4>
              <p className="text-sm text-blue-700 mt-1">
                Two-factor authentication is required for all users by default. 
                This ensures maximum security for your HRMS Pro account.
              </p>
            </div>
          </div>
        </div>

        {/* Personal 2FA Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Two-Factor Authentication (2FA)
              </h4>
              <p className="text-sm text-muted-foreground">
                {settingsData.security?.twoFactorAuth 
                  ? "2FA is currently enabled for your account" 
                  : "Add an extra layer of security to your account"
                }
              </p>
              <div className="flex items-center text-blue-600 text-sm mt-1">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span>2FA is required for all users</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!settingsData.security?.twoFactorAuth ? (
                <Button 
                  onClick={setup2FA} 
                  disabled={setupLoading}
                  variant="default"
                  size="sm"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {setupLoading ? 'Setting up...' : 'Enable 2FA'}
                </Button>
              ) : (
                <Button 
                  onClick={disable2FA} 
                  disabled={setupLoading || !['admin', 'employer'].includes(user?.role)}
                  variant="outline"
                  size="sm"
                >
                  {setupLoading ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              )}
            </div>
          </div>

          {/* 2FA Setup Modal */}
          {showSetup && (
            <div className="p-6 border rounded-lg bg-blue-50 space-y-6">
              <h4 className="font-medium text-lg flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                Setup Two-Factor Authentication
              </h4>
              
              <div className="space-y-6">
                <div>
                  <h5 className="font-medium mb-3">Step 1: Scan QR Code</h5>
                  <p className="text-sm text-muted-foreground mb-4">
                    Open Microsoft Authenticator app and scan this QR code:
                  </p>
                  
                  {qrCodeDataURL ? (
                    <div className="flex justify-center">
                      <img 
                        src={qrCodeDataURL} 
                        alt="QR Code for 2FA Setup" 
                        className="w-48 h-48 border rounded-lg bg-white p-2"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <div className="bg-white p-8 rounded-lg border flex items-center justify-center w-48 h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium mb-3">Step 2: Or Enter Secret Key Manually</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    If you can't scan the QR code, enter this secret key manually:
                  </p>
                  
                  {secret && (
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono flex-1">
                        {secret}
                      </code>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium mb-3">Step 3: Verify Setup</h5>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter the 6-digit code from your authenticator app to verify:
                  </p>
                  
                  <div className="space-y-3">
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <Input
                      id="verificationCode"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="text-center text-lg tracking-widest font-mono"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-2">
                  <Button 
                    onClick={verify2FA} 
                    disabled={setupLoading || verificationCode.length !== 6}
                    className="flex-1"
                  >
                    {setupLoading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </Button>
                  <Button 
                    onClick={() => setShowSetup(false)} 
                    variant="outline"
                    disabled={setupLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
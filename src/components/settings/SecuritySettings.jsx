// components/settings/sections/SecuritySettings.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Save } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const SecuritySettings = () => {
  const { settingsData, updateSettings, saveSettings, loading } = useSettings();

  const handleSave = () => {
    saveSettings('Security');
  };

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold">Security Settings</CardTitle>
        <p className="text-muted-foreground">Configure security policies and authentication methods</p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <h4 className="font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Two-Factor Authentication (2FA)
            </h4>
            <p className="text-sm text-muted-foreground">Require a second factor for all users</p>
          </div>
          <Switch 
            checked={settingsData.security?.twoFactorAuth || false}
            onCheckedChange={(checked) => updateSettings({
              security: { ...settingsData.security, twoFactorAuth: checked }
            })}
          />
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
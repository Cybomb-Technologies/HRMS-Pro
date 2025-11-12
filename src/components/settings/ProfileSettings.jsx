// components/settings/sections/ProfileSettings.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Mail, Download } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const ProfileSettings = () => {
  const { handleAction } = useSettings();

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
    {
      icon: Download,
      title: 'Export My Data',
      description: 'Download a copy of your personal data',
      action: 'Export Data'
    }
  ];

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold">My Profile Settings</CardTitle>
        <p className="text-muted-foreground">Manage your personal account settings and preferences</p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {profileItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium flex items-center">
                  <Icon className="w-4 h-4 mr-2" />
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Button variant="outline" onClick={() => handleAction(item.action)}>
                {item.action}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
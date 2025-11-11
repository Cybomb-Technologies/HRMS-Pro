// components/settings/sections/NotificationsSettings.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const NotificationsSettings = () => {
  const { handleAction } = useSettings();

  const notificationItems = [
    { title: 'Onboarding Notifications', description: 'Welcome emails and onboarding updates' },
    { title: 'Leave Approval Notifications', description: 'Leave request and approval alerts' },
    { title: 'Payslip Ready Notifications', description: 'Payroll completion and payslip alerts' },
    { title: 'Attendance Alerts', description: 'Late arrivals and absence notifications' },
    { title: 'Announcement Broadcasts', description: 'Company-wide announcement delivery' }
  ];

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold">Notification Settings</CardTitle>
        <p className="text-muted-foreground">Configure email and system notification templates</p>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {notificationItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors">
            <div className="space-y-1">
              <h4 className="font-medium flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Button variant="outline" onClick={() => handleAction(`Manage ${item.title}`)}>
              Manage Templates
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotificationsSettings;
// components/settings/sections/PayrollSettings.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const PayrollSettings = () => {
  const { settingsData, updateSettings, saveSettings, loading, handleAction } = useSettings();

  const handleSave = () => {
    saveSettings('Payroll');
  };

  const payrollItems = [
    {
      title: 'Earning & Deduction Catalogs',
      description: 'Manage earning types and deductions',
      button: 'Manage Catalogs'
    },
    {
      title: 'Tax Configuration',
      description: 'Configure tax brackets and withholding rules',
      button: 'Configure Taxes'
    },
    {
      title: 'GL Mapping',
      description: 'Map payroll items to your chart of accounts',
      button: 'Configure GL Mapping'
    }
  ];

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold">Payroll Settings</CardTitle>
        <p className="text-muted-foreground">Configure payroll schedules and financial settings</p>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="paySchedule">Default Pay Schedule</Label>
          <Select 
            value={settingsData.paySchedule}
            onValueChange={(value) => updateSettings({ paySchedule: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
              <SelectItem value="Semi-Monthly">Semi-Monthly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {payrollItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Button variant="outline" onClick={() => handleAction(item.button)}>
              {item.button}
            </Button>
          </div>
        ))}
        
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

export default PayrollSettings;
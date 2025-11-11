// components/settings/sections/SimpleSettings.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const SimpleSettings = ({ title, description = "Settings for this module can be configured here." }) => {
  const { handleAction } = useSettings();

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl font-semibold">{title} Settings</CardTitle>
        <p className="text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <ListChecks className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{description}</p>
            <Button onClick={() => handleAction(`Configure ${title}`)}>
              Configure {title}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleSettings;
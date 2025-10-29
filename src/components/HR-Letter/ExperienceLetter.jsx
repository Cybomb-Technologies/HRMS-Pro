import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Edit } from 'lucide-react';

const ExperienceLetter = () => (
  <div>
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Experience Letter</h3>
          <p className="text-sm text-gray-500">Offboarding</p>
        </div>
      </div>
    </div>
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Version</span>
        <span className="text-sm font-medium text-gray-900">v1.2</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Last Updated</span>
        <span className="text-sm font-medium text-gray-900">2023-11-01</span>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <Button size="sm">Generate</Button>
      <Button size="sm" variant="outline"><Edit className="w-4 h-4 mr-2" />Edit</Button>
    </div>
  </div>
);

export default ExperienceLetter;

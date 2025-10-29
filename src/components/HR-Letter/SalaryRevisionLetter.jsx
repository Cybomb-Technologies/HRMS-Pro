import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Edit } from 'lucide-react';

const SalaryRevisionLetter = () => (
  <div>
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Salary Revision Letter</h3>
          <p className="text-sm text-gray-500">Compensation</p>
        </div>
      </div>
    </div>
    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Version</span>
        <span className="text-sm font-medium text-gray-900">v3.0</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Last Updated</span>
        <span className="text-sm font-medium text-gray-900">2024-01-20</span>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <Button size="sm">Generate</Button>
      <Button size="sm" variant="outline"><Edit className="w-4 h-4 mr-2" />Edit</Button>
    </div>
  </div>
);

export default SalaryRevisionLetter;

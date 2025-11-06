// src/components/HR-Letter/WordUploadModal.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const WordUploadModal = ({ onClose, onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Custom'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['.doc', '.docx'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a Word document (.doc or .docx)',
          variant: 'destructive'
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
      
      // Auto-fill name if empty
      if (!formData.name) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setFormData(prev => ({
          ...prev,
          name: fileName
        }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a Word document to upload',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Template Name Required',
        description: 'Please enter a name for your template',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('hrms_token');
      const uploadData = new FormData();
      uploadData.append('wordFile', selectedFile);
      uploadData.append('name', formData.name);
      uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);

      const response = await fetch('http://localhost:5000/api/offer-letters/upload-word', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: 'Template Uploaded',
          description: 'Your Word document has been successfully converted to a template',
          variant: 'default'
        });

        onSuccess();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload Word document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload Word Template</h2>
              <p className="text-sm text-gray-600">Convert your Word document into a reusable template</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <Label htmlFor="wordFile" className="text-sm font-medium text-gray-700 mb-2 block">
              Select Word Document *
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="wordFile"
                accept=".doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="wordFile" className="cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click to upload Word document</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports .doc and .docx files (max 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Template Details */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Template Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Sales Offer Template"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this template"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Category
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Custom">Custom</SelectItem>
                  <SelectItem value="Full-Time">Full-Time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Executive">Executive</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Using Placeholders in Your Word Document</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use <code className="bg-blue-100 px-1 rounded">{"{{candidate_name}}"}</code> for dynamic fields</li>
                  <li>• Use <code className="bg-blue-100 px-1 rounded">{"{{designation}}"}</code> for job title</li>
                  <li>• Use <code className="bg-blue-100 px-1 rounded">{"{{ctc}}"}</code> for compensation</li>
                  <li>• Any field can be made dynamic with <code className="bg-blue-100 px-1 rounded">{"{{field_name}}"}</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose} variant="outline" disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Template
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WordUploadModal;
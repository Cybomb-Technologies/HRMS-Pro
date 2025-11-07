// src/components/HR-Letter/OfferLetterForm.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, FileText, Shield, Eye, Upload, FileCheck, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const OfferLetterForm = ({
  templates,
  selectedTemplate,
  formData,
  loading,
  onTemplateChange,
  onInputChange,
  onGenerate,
  onReset,
  onClose,
  isPopup,
  editingLetter,
  onShowPrivacyPolicy
}) => {
  const [useWordFile, setUseWordFile] = useState(false);
  const [wordFile, setWordFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const handleTemplateSelect = (value) => {
    onTemplateChange(value);
    setUseWordFile(false); // Reset to template mode when selecting a template
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t._id === selectedTemplate) || templates[0];
  };

  const handleWordFileSelect = (e) => {
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

      setWordFile(file);
      
      // Auto-fill template name if empty
      if (!templateName) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setTemplateName(fileName);
      }
    }
  };

  const uploadAndUseWordTemplate = async () => {
    if (!wordFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a Word document to upload',
        variant: 'destructive'
      });
      return;
    }

    if (!templateName.trim()) {
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
      uploadData.append('wordFile', wordFile);
      uploadData.append('name', templateName);
      uploadData.append('description', templateDescription);
      uploadData.append('category', 'Custom');

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

        // Use the newly created template
        onTemplateChange(result.template._id);
        setUseWordFile(false);
        
        // Refresh templates list (you might want to add a callback prop for this)
        window.dispatchEvent(new Event('templatesUpdated'));
        
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

  const removeWordFile = () => {
    setWordFile(null);
    setTemplateName('');
    setTemplateDescription('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editingLetter ? 'Edit Offer Letter' : 'Create Offer Letter'}
            </h2>
            <p className="text-sm text-gray-600">
              {editingLetter ? 'Update the offer letter details' : 'Fill in the details to generate an offer letter'}
            </p>
          </div>
        </div>
        {isPopup && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Template Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Template</h3>
            
            {/* Template Selection Toggle */}
            <div className="flex space-x-4 mb-4">
              <Button
                type="button"
                variant={!useWordFile ? "default" : "outline"}
                onClick={() => setUseWordFile(false)}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Use Existing Template
              </Button>
              <Button
                type="button"
                variant={useWordFile ? "default" : "outline"}
                onClick={() => setUseWordFile(true)}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Word Document
              </Button>
            </div>

            {!useWordFile ? (
              // Existing Template Selection
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template" className="text-sm font-medium text-gray-700">
                    Choose a Template
                  </Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          <div className="flex items-center space-x-2">
                            <FileText className={`w-4 h-4 ${
                              template.templateType === 'word_upload' ? 'text-green-600' : 'text-blue-600'
                            }`} />
                            <span>{template.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({template.category})
                              {template.templateType === 'word_upload' && ' - Word'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTemplate && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900">
                          {getSelectedTemplate().name}
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {getSelectedTemplate().description}
                        </p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {getSelectedTemplate().category}
                          </span>
                          {getSelectedTemplate().templateType === 'word_upload' && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Word Upload
                            </span>
                          )}
                        </div>
                        {getSelectedTemplate().variables && getSelectedTemplate().variables.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-blue-800 mb-1">Available Fields:</p>
                            <div className="flex flex-wrap gap-1">
                              {getSelectedTemplate().variables.slice(0, 5).map((variable, index) => (
                                <span key={index} className="text-xs bg-white text-blue-600 px-2 py-1 rounded border border-blue-200">
                                  {variable}
                                </span>
                              ))}
                              {getSelectedTemplate().variables.length > 5 && (
                                <span className="text-xs bg-white text-blue-600 px-2 py-1 rounded border border-blue-200">
                                  +{getSelectedTemplate().variables.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Word File Upload Section
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label htmlFor="wordFile" className="text-sm font-medium text-gray-700 mb-2 block">
                    Upload Word Document *
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      id="wordFile"
                      accept=".doc,.docx"
                      onChange={handleWordFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="wordFile" className="cursor-pointer">
                      {wordFile ? (
                        <div className="flex items-center justify-center space-x-3">
                          <FileCheck className="w-8 h-8 text-green-500" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{wordFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(wordFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={removeWordFile}
                            className="ml-4"
                          >
                            Change
                          </Button>
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
                    <Label htmlFor="templateName" className="text-sm font-medium text-gray-700">
                      Template Name *
                    </Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g., Sales Offer Template"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="templateDescription" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <Textarea
                      id="templateDescription"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Brief description of this template"
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Using Placeholders in Your Word Document</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Use <code className="bg-blue-100 px-1 rounded">{"{{candidate_name}}"}</code> for candidate name</li>
                        <li>• Use <code className="bg-blue-100 px-1 rounded">{"{{designation}}"}</code> for job title</li>
                        <li>• Use <code className="bg-blue-100 px-1 rounded">{"{{ctc}}"}</code> for compensation</li>
                        <li>• Use <code className="bg-blue-100 px-1 rounded">{"{{date_of_joining}}"}</code> for joining date</li>
                        <li>• Any field can be made dynamic with <code className="bg-blue-100 px-1 rounded">{"{{field_name}}"}</code></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Upload Button */}
                <Button
                  onClick={uploadAndUseWordTemplate}
                  disabled={uploading || !wordFile || !templateName.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading & Converting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Use This Template
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Candidate Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="candidate_name" className="text-sm font-medium text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="candidate_name"
                  name="candidate_name"
                  value={formData.candidate_name}
                  onChange={onInputChange}
                  placeholder="Enter candidate's full name"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={onInputChange}
                  placeholder="candidate@example.com"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={onInputChange}
                  placeholder="+91 98765 43210"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="candidate_address" className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <Input
                  id="candidate_address"
                  name="candidate_address"
                  value={formData.candidate_address}
                  onChange={onInputChange}
                  placeholder="Enter candidate's address"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="designation" className="text-sm font-medium text-gray-700">
                  Designation *
                </Label>
                <Input
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={onInputChange}
                  placeholder="e.g., Software Engineer"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department
                </Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={onInputChange}
                  placeholder="e.g., Engineering"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date_of_joining" className="text-sm font-medium text-gray-700">
                  Date of Joining *
                </Label>
                <Input
                  id="date_of_joining"
                  name="date_of_joining"
                  type="date"
                  value={formData.date_of_joining}
                  onChange={onInputChange}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="work_location" className="text-sm font-medium text-gray-700">
                  Work Location
                </Label>
                <Input
                  id="work_location"
                  name="work_location"
                  value={formData.work_location}
                  onChange={onInputChange}
                  placeholder="e.g., Chennai (Hybrid)"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Compensation Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ctc" className="text-sm font-medium text-gray-700">
                  Annual CTC (Cost to Company)
                </Label>
                <Input
                  id="ctc"
                  name="ctc"
                  value={formData.ctc}
                  onChange={onInputChange}
                  placeholder="e.g., ₹8,00,000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="basic_salary" className="text-sm font-medium text-gray-700">
                  Basic Salary
                </Label>
                <Input
                  id="basic_salary"
                  name="basic_salary"
                  value={formData.basic_salary}
                  onChange={onInputChange}
                  placeholder="e.g., ₹4,00,000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="allowances" className="text-sm font-medium text-gray-700">
                  Allowances
                </Label>
                <Input
                  id="allowances"
                  name="allowances"
                  value={formData.allowances}
                  onChange={onInputChange}
                  placeholder="e.g., ₹2,00,000"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="net_salary" className="text-sm font-medium text-gray-700">
                  Net Salary (Calculated)
                </Label>
                <Input
                  id="net_salary"
                  name="net_salary"
                  value={formData.net_salary}
                  readOnly
                  className="mt-1 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Company & Additional Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company & Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">
                  Company Name
                </Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={onInputChange}
                  placeholder="Company name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hr_name" className="text-sm font-medium text-gray-700">
                  HR Name
                </Label>
                <Input
                  id="hr_name"
                  name="hr_name"
                  value={formData.hr_name}
                  onChange={onInputChange}
                  placeholder="HR representative name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="probation_period" className="text-sm font-medium text-gray-700">
                  Probation Period
                </Label>
                <Input
                  id="probation_period"
                  name="probation_period"
                  value={formData.probation_period}
                  onChange={onInputChange}
                  placeholder="e.g., 3 months"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notice_period" className="text-sm font-medium text-gray-700">
                  Notice Period
                </Label>
                <Input
                  id="notice_period"
                  name="notice_period"
                  value={formData.notice_period}
                  onChange={onInputChange}
                  placeholder="e.g., 60 days"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Privacy Policy Consent */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="privacy_consent"
                name="privacy_consent"
                checked={formData.privacy_consent}
                onChange={onInputChange}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required
              />
              <div className="flex-1">
                <Label htmlFor="privacy_consent" className="text-sm font-medium text-gray-700">
                  Privacy Policy Consent *
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  I acknowledge that I have read and understood the{' '}
                  <button
                    type="button"
                    onClick={onShowPrivacyPolicy}
                    className="text-blue-600 hover:text-blue-800 underline font-medium flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Privacy Policy
                  </button>
                  {' '}and consent to the collection and processing of candidate data for the purpose 
                  of generating and managing this offer letter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-3">
          <Button onClick={onReset} variant="outline" disabled={loading || uploading}>
            Reset Form
          </Button>
        </div>
        <div className="flex space-x-3">
          {isPopup && (
            <Button onClick={onClose} variant="outline" disabled={loading || uploading}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={onGenerate} 
            disabled={loading || uploading || !formData.privacy_consent || (!useWordFile && !selectedTemplate)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                {editingLetter ? 'Update Letter' : 'Generate Offer Letter'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OfferLetterForm;
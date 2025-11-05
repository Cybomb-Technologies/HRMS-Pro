// src/components/HR-Letter/OfferLetterForm.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, FileText, Shield, Upload, FileCheck, AlertCircle, Loader2, Building, User, Briefcase, DollarSign, Clock, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// --- DUMMY TEMPLATE DATA ---
const commonVariables = [
  'company_name', 'company_address', 'company_email', 'company_contact', 'offer_date',
  'candidate_name', 'candidate_address', 'email', 'phone', 'designation', 'department',
  'employment_type', 'reporting_manager', 'work_location', 'date_of_joining', 'ctc',
  'basic_salary', 'allowances', 'bonus', 'deductions', 'net_salary', 'working_hours', 
  'probation_period', 'notice_period', 'benefits', 'offer_expiry_date',
  'hr_name', 'hr_designation',
];

const DUMMY_TEMPLATES = [
  { 
    _id: 'default-offer', 
    name: 'Standard Employment Offer', 
    description: 'Standard full-time employment terms.', 
    category: 'Full-Time', 
    variables: commonVariables, 
    icon: '👔', 
    color: 'blue' 
  },
  { 
    _id: 'executive-offer', 
    name: 'Executive Leadership Offer', 
    description: 'Offer for C-level and senior management with equity and severance.', 
    category: 'Executive', 
    variables: [...commonVariables, 'title', 'annual_base_salary', 'target_bonus_percentage', 'equity_grants', 'severance_details', 'reporting_to', 'hr_contact'], 
    icon: '💼', 
    color: 'purple' 
  },
  { 
    _id: 'contract-offer', 
    name: 'Independent Contractor Agreement', 
    description: 'Fixed-term, project-based contract with payment and IP details.', 
    category: 'Contract', 
    variables: ['company_name', 'company_address', 'offer_date', 'contractor_name', 'contractor_address', 'project_name', 'fixed_fee', 'payment_schedule', 'start_date', 'end_date', 'deliverables_summary', 'ip_rights', 'project_manager', 'company_email', 'company_contact'], 
    icon: '📝', 
    color: 'amber' 
  },
];

const OfferLetterForm = ({
  templates = DUMMY_TEMPLATES, 
  selectedTemplate: initialSelectedTemplate = DUMMY_TEMPLATES[0]._id,
  formData = {},
  loading = false,
  onTemplateChange = () => {},
  onInputChange = () => {},
  onGenerate = () => {},
  onReset = () => {},
  onClose = () => {},
  isPopup = false,
  editingLetter = false,
  onShowPrivacyPolicy = () => {}
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(initialSelectedTemplate);
  const [useWordFile, setUseWordFile] = useState(false);
  const [wordFile, setWordFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleTemplateSelect = (value) => {
    setSelectedTemplate(value);
    onTemplateChange(value);
    setUseWordFile(false);
  };
  
  useEffect(() => {
    if (initialSelectedTemplate) {
      setSelectedTemplate(initialSelectedTemplate);
    }
  }, [initialSelectedTemplate]);

  const getSelectedTemplate = () => {
    return templates.find(t => t._id === selectedTemplate) || templates[0];
  };

  const currentTemplate = useMemo(getSelectedTemplate, [templates, selectedTemplate]);

  // --- Dynamic Field Logic ---
  const HARDCODED_KEYS = useMemo(() => new Set([
    'company_name', 'company_address', 'company_email', 'company_contact', 'offer_date', 'offer_expiry_date',
    'candidate_name', 'candidate_address', 'contractor_name', 'contractor_address', 'email', 'phone',
    'designation', 'title', 'project_name', 'start_date', 'end_date', 'date_of_joining', 'department', 
    'employment_type', 'reporting_manager', 'work_location',
    'ctc', 'basic_salary', 'allowances', 'net_salary', 'bonus', 'deductions', 'probation_period', 
    'notice_period', 'benefits', 'working_hours', 'hr_name', 'hr_designation', 'hr_contact',
  ]), []);
  
  const getCleanLabel = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const dynamicTemplateFields = useMemo(() => {
    if (!currentTemplate || !currentTemplate.variables) return [];

    const dynamicFields = currentTemplate.variables
      .filter(key => !HARDCODED_KEYS.has(key))
      .map(key => ({
        key,
        label: getCleanLabel(key),
        type: key.includes('date') ? 'date' : 
              key.includes('salary') || key.includes('ctc') || key.includes('fee') ? 'text' : 
              'text',
        required: key.includes('required') || key.includes('mandatory') || key === 'fixed_fee',
        group: 'Template Specific',
      }));

    return dynamicFields;
  }, [currentTemplate, HARDCODED_KEYS]);

  // --- FIXED: Utility to map keys to explicit input types ---
  const getInputType = (key) => {
    // Date fields first (be specific to avoid false matches)
    if (key === 'date_of_joining' || key === 'offer_date' || key === 'offer_expiry_date' || key === 'start_date' || key === 'end_date') return 'date';
    
    // Email fields
    if (key.includes('email')) return 'email';
    
    // Phone/contact fields
    if (key.includes('phone') || key.includes('contact')) return 'tel';
    
    // Default to text for ALL other fields, including names, addresses, salaries, and titles.
    return 'text';
  };

  // Helper component to render a single field with enhanced UI
  const RenderInputField = ({ field, defaultType = 'text', groupName = 'Default' }) => {
    const isTextarea = field.key.includes('details') || field.key.includes('description') || field.key.includes('summary') || field.key.includes('clause') || field.key.includes('scope') || field.key === 'benefits';
    
    // *** THE FIXED TYPE DETERMINATION ***
    const inputType = getInputType(field.key); 
    // *** END FIXED TYPE DETERMINATION ***

    const inputProps = {
      id: field.key,
      name: field.key,
      value: formData[field.key] || '',
      onChange: onInputChange,
      placeholder: `Enter ${field.label.toLowerCase()}`,
      className: "mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      required: field.required || (groupName === 'Company' || groupName === 'Recipient' || groupName === 'Core Employment'),
      type: inputType,
    };

    const getFieldIcon = () => {
      if (field.key.includes('name')) return <User className="w-4 h-4 text-gray-400" />;
      if (field.key.includes('email')) return <span className="text-gray-400">@</span>;
      if (field.key.includes('phone') || field.key.includes('contact')) return <span className="text-gray-400">📞</span>;
      if (field.key.includes('date')) return <Clock className="w-4 h-4 text-gray-400" />;
      if (field.key.includes('salary') || field.key.includes('ctc') || field.key.includes('fee')) return <DollarSign className="w-4 h-4 text-gray-400" />;
      if (field.key.includes('address')) return <span className="text-gray-400">📍</span>;
      return <FileText className="w-4 h-4 text-gray-400" />;
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={field.key} className="text-sm font-medium text-gray-700 flex items-center">
          {field.label} {(field.required || inputProps.required) && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {getFieldIcon()}
          </div>
          {isTextarea ? (
            <Textarea {...inputProps} rows={3} className="pl-10 pr-4 py-3" />
          ) : (
            <Input {...inputProps} className="pl-10 pr-4 py-3" />
          )}
        </div>
      </div>
    );
  };

  // Section header component
  const SectionHeader = ({ icon: Icon, title, description, color = "blue" }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      amber: 'bg-amber-100 text-amber-600',
      purple: 'bg-purple-100 text-purple-600'
    };

    return (
      <div className="flex items-start space-x-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      </div>
    );
  };

  // Template badge component
  const TemplateBadge = ({ template }) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[template.color] || colorMap.blue}`}>
        {template.icon} {template.category}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-md">
            <FileText className="w-6 h-6 text-white" />
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
          <Button onClick={onClose} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-200">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* 1. Template Selection */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <SectionHeader 
              icon={FileText} 
              title="Select Template" 
              description="Choose from existing templates or upload your own Word document"
              color="blue"
            />
            
            {/* Template Selection Toggle */}
            <div className="flex space-x-4 mb-6">
              <Button
                type="button"
                variant={!useWordFile ? "default" : "outline"}
                onClick={() => setUseWordFile(false)}
                className={`flex-1 transition-all duration-200 ${!useWordFile ? 'shadow-md' : ''}`}
              >
                <FileText className="w-4 h-4 mr-2" /> Use Existing Template
              </Button>
              <Button
                type="button"
                variant={useWordFile ? "default" : "outline"}
                onClick={() => setUseWordFile(true)}
                className={`flex-1 transition-all duration-200 ${useWordFile ? 'shadow-md' : ''}`}
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Word Document
              </Button>
            </div>

            {!useWordFile ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template" className="text-sm font-medium text-gray-700 mb-2 block">
                    Choose a Template
                  </Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="w-full mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 shadow-lg">
                      {templates.map((template) => (
                        <SelectItem key={template._id} value={template._id} className="py-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{template.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{template.name}</span>
                                <TemplateBadge template={template} />
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTemplate && currentTemplate && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{currentTemplate.icon}</span>
                      <div>
                        <h4 className="font-semibold text-blue-900">{currentTemplate.name}</h4>
                        <p className="text-sm text-blue-700 mt-1">{currentTemplate.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Upload Word Document</p>
                  <p className="text-sm text-gray-500 mb-4">Drag and drop your .docx file here, or click to browse</p>
                  <Button variant="outline" className="bg-white">
                    Browse Files
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 2. COMMON LETTER FIELDS */}
          {selectedTemplate && !useWordFile && (
            <>
              {/* Company & Offer Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <SectionHeader 
                  icon={Building} 
                  title="Company & Offer Details" 
                  description="Basic information about your company and the offer"
                  color="blue"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <RenderInputField field={{ key: 'company_name', label: 'Company Name', required: true }} groupName="Company" />
                  <RenderInputField field={{ key: 'company_address', label: 'Company Address' }} groupName="Company" />
                  <RenderInputField field={{ key: 'company_email', label: 'Company Email', type: 'email' }} groupName="Company" />
                  <RenderInputField field={{ key: 'company_contact', label: 'Company Phone', type: 'tel' }} groupName="Company" />
                  <RenderInputField field={{ key: 'offer_date', label: 'Offer Date', type: 'date', required: true }} groupName="Company" />
                  <RenderInputField field={{ key: 'offer_expiry_date', label: 'Offer Expiry Date', type: 'date' }} groupName="Company" />
                </div>
              </div>

              {/* Recipient Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <SectionHeader 
                  icon={User} 
                  title="Recipient Details" 
                  description="Information about the candidate or contractor receiving the offer"
                  color="green"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {currentTemplate._id === 'contract-offer' ? (
                    <>
                      <RenderInputField field={{ key: 'contractor_name', label: 'Contractor Name', required: true }} groupName="Recipient" />
                      <RenderInputField field={{ key: 'contractor_address', label: 'Contractor Address' }} groupName="Recipient" />
                    </>
                  ) : (
                    <>
                      <RenderInputField field={{ key: 'candidate_name', label: 'Candidate Name', required: true }} groupName="Recipient" />
                      <RenderInputField field={{ key: 'candidate_address', label: 'Candidate Address' }} groupName="Recipient" />
                    </>
                  )}
                  <RenderInputField field={{ key: 'email', label: 'Email Address', type: 'email', required: true }} groupName="Recipient" />
                  <RenderInputField field={{ key: 'phone', label: 'Phone Number', type: 'tel' }} groupName="Recipient" />
                </div>
              </div>

              {/* Core Employment/Project Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <SectionHeader 
                  icon={Briefcase} 
                  title={currentTemplate._id === 'contract-offer' ? 'Project & Term Details' : 'Core Employment Details'}
                  description={currentTemplate._id === 'contract-offer' ? 'Project specifications and contract duration' : 'Employment terms and conditions'}
                  color="amber"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {currentTemplate._id === 'executive-offer' && (
                    <RenderInputField field={{ key: 'title', label: 'Executive Title', required: true }} groupName="Core Employment" />
                  )}
                  {currentTemplate._id !== 'contract-offer' && (
                    <RenderInputField field={{ key: 'designation', label: 'Designation', required: true }} groupName="Core Employment" />
                  )}
                  {currentTemplate._id === 'contract-offer' && (
                    <>
                      <RenderInputField field={{ key: 'project_name', label: 'Project Name', required: true }} groupName="Core Employment" />
                      <RenderInputField field={{ key: 'project_manager', label: 'Project Manager' }} groupName="Core Employment" />
                    </>
                  )}
                  <RenderInputField field={{ key: 'date_of_joining', label: currentTemplate._id === 'contract-offer' ? 'Start Date' : 'Date of Joining', type: 'date', required: true }} groupName="Core Employment" />
                  
                  {currentTemplate._id === 'contract-offer' && (
                    <RenderInputField field={{ key: 'end_date', label: 'End Date', type: 'date', required: true }} groupName="Core Employment" />
                  )}
                  {currentTemplate._id !== 'contract-offer' && (
                    <>
                      <RenderInputField field={{ key: 'department', label: 'Department' }} groupName="Core Employment" />
                      <RenderInputField field={{ key: 'employment_type', label: 'Employment Type' }} groupName="Core Employment" />
                      <RenderInputField field={{ key: 'reporting_manager', label: 'Reporting Manager' }} groupName="Core Employment" />
                      <RenderInputField field={{ key: 'work_location', label: 'Work Location' }} groupName="Core Employment" />
                    </>
                  )}
                </div>
              </div>

              {/* Compensation & Signature */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <SectionHeader 
                  icon={DollarSign} 
                  title={currentTemplate._id === 'contract-offer' ? 'Fee & Payment' : 'Compensation & Terms'}
                  description={currentTemplate._id === 'contract-offer' ? 'Contract fee structure and payment schedule' : 'Salary breakdown and employment terms'}
                  color="green"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentTemplate._id === 'contract-offer' ? (
                    <>
                      <RenderInputField field={{ key: 'fixed_fee', label: 'Fixed Total Fee', required: true }} groupName="Compensation" />
                      <RenderInputField field={{ key: 'payment_schedule', label: 'Payment Schedule Details' }} groupName="Compensation" />
                    </>
                  ) : (
                    <>
                      <RenderInputField field={{ key: 'ctc', label: 'Annual CTC', required: true }} groupName="Compensation" />
                      <RenderInputField field={{ key: 'basic_salary', label: 'Basic Salary (Monthly)' }} groupName="Compensation" />
                      <RenderInputField field={{ key: 'allowances', label: 'Allowances (Monthly)' }} groupName="Compensation" />
                      <RenderInputField field={{ key: 'net_salary', label: 'Net Salary (Monthly)' }} groupName="Compensation" />
                      <RenderInputField field={{ key: 'bonus', label: 'Bonus/Incentives' }} groupName="Compensation" />
                      <RenderInputField field={{ key: 'deductions', label: 'Deductions (Monthly)' }} groupName="Compensation" />
                      <RenderInputField field={{ key: 'probation_period', label: 'Probation Period' }} groupName="Compensation" />
                      <RenderInputField field={{ key: 'notice_period', label: 'Notice Period' }} groupName="Compensation" />
                    </>
                  )}
                  
                  {/* Signature fields */}
                  {currentTemplate._id === 'executive-offer' ? (
                    <RenderInputField field={{ key: 'hr_contact', label: 'HR Contact (for Signature)' }} groupName="Signature" />
                  ) : (
                    <>
                      <RenderInputField field={{ key: 'hr_name', label: 'HR Name (for Signature)' }} groupName="Signature" />
                      <RenderInputField field={{ key: 'hr_designation', label: 'HR Designation (for Signature)' }} groupName="Signature" />
                    </>
                  )}
                  
                  {currentTemplate._id !== 'contract-offer' && (
                    <div className="md:col-span-2">
                      <RenderInputField field={{ key: 'benefits', label: 'Benefits & Perks Details', required: true }} groupName="Compensation" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 3. DYNAMIC TEMPLATE FIELDS SECTION */}
          {selectedTemplate && !useWordFile && dynamicTemplateFields.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <SectionHeader 
                icon={FileText} 
                title="Template Specific Details" 
                description="Additional fields specific to your selected template"
                color="purple"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dynamicTemplateFields.map(field => (
                  <RenderInputField key={field.key} field={field} groupName="Template Specific" />
                ))}
              </div>
            </div>
          )}

          {/* Privacy Policy Consent */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  id="privacy_consent"
                  name="privacy_consent"
                  checked={formData.privacy_consent || false}
                  onChange={onInputChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors duration-200"
                  required
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="privacy_consent" className="text-sm font-medium text-gray-700 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                  Privacy Policy Consent *
                </Label>
                <p className="text-sm text-gray-600 mt-2">
                  I acknowledge that I have read and understood the{' '}
                  <button
                    type="button"
                    onClick={onShowPrivacyPolicy}
                    className="text-blue-600 hover:text-blue-800 underline font-medium inline-flex items-center transition-colors duration-200"
                  >
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
      <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white shadow-sm">
        <div className="flex space-x-3">
          <Button 
            onClick={onReset} 
            variant="outline" 
            disabled={loading || uploading}
            className="border-gray-300 hover:bg-gray-50 transition-colors duration-200"
          >
            Reset Form
          </Button>
        </div>
        <div className="flex space-x-3">
          {isPopup && (
            <Button 
              onClick={onClose} 
              variant="outline" 
              disabled={loading || uploading}
              className="border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={onGenerate} 
            disabled={loading || uploading || !formData.privacy_consent || (!useWordFile && !selectedTemplate)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
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
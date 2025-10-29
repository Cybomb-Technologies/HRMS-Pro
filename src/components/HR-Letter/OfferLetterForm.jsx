// src/components/HR-Letter/OfferLetterForm.jsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';

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
  isPopup = false
}) => {
  return (
    <div className={`${isPopup ? 'h-full flex flex-col' : 'max-w-7xl mx-auto p-6'}`}>
      {/* Header for Popup */}
      {isPopup && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Offer Letter</h2>
              <p className="text-sm text-gray-600">Fill in the details to generate an offer letter</p>
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
      )}

      {/* Content */}
      <div className={`${isPopup ? 'flex-1 overflow-y-auto p-6' : ''}`}>
        {!isPopup && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Offer Letter Generator</h2>
                <p className="text-sm text-gray-600">Create professional offer letters for new hires</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={onReset} size="sm" variant="outline" className="border-gray-300">
                Reset Form
              </Button>
              <Button 
                onClick={onGenerate} 
                size="sm" 
                disabled={loading}
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
                    Generate Offer Letter
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Template Selection */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => onTemplateChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {templates.map(template => (
              <option key={template._id} value={template._id}>
                {template.name} - {template.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            {templates.find(t => t._id === selectedTemplate)?.description || 'Professional offer letter template'}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column - Candidate & Job Details */}
          <div className="space-y-6">
            {/* Candidate Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-200">Candidate Information</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="candidate_name"
                    placeholder="Enter candidate's full name"
                    value={formData.candidate_name}
                    onChange={onInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    name="candidate_address"
                    placeholder="Enter complete address"
                    value={formData.candidate_address}
                    onChange={onInputChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-200">Job Details</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
                    <input
                      type="text"
                      name="designation"
                      placeholder="e.g., Frontend Developer"
                      value={formData.designation}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      name="department"
                      placeholder="e.g., Engineering"
                      value={formData.department}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                    <select
                      name="employment_type"
                      value={formData.employment_type}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Permanent">Permanent</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                    <input
                      type="text"
                      name="work_location"
                      value={formData.work_location}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    name="reporting_manager"
                    placeholder="Manager's name"
                    value={formData.reporting_manager}
                    onChange={onInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Important Dates */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-200">Important Dates</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer Date</label>
                    <input
                      type="date"
                      name="offer_date"
                      value={formData.offer_date}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining *</label>
                    <input
                      type="date"
                      name="date_of_joining"
                      value={formData.date_of_joining}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer Expiry Date</label>
                    <input
                      type="date"
                      name="offer_expiry_date"
                      value={formData.offer_expiry_date}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Probation Period</label>
                    <input
                      type="text"
                      name="probation_period"
                      placeholder="e.g., 3 months"
                      value={formData.probation_period}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Compensation & Company Details */}
          <div className="space-y-6">
            {/* Compensation Details */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-200">Compensation Details</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual CTC (Cost to Company)</label>
                  <input
                    type="text"
                    name="ctc"
                    placeholder="e.g., ₹6,00,000 per annum"
                    value={formData.ctc}
                    onChange={onInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (Monthly)</label>
                    <input
                      type="text"
                      name="basic_salary"
                      placeholder="e.g., ₹25,000"
                      value={formData.basic_salary}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allowances (Monthly)</label>
                    <input
                      type="text"
                      name="allowances"
                      placeholder="e.g., ₹5,000"
                      value={formData.allowances}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonus/Incentives</label>
                  <input
                    type="text"
                    name="bonus"
                    placeholder="e.g., Performance-based bonus"
                    value={formData.bonus}
                    onChange={onInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deductions</label>
                  <input
                    type="text"
                    name="deductions"
                    placeholder="e.g., PF, ESI, Professional Tax"
                    value={formData.deductions}
                    onChange={onInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary (Monthly)</label>
                  <input
                    type="text"
                    name="net_salary"
                    value={formData.net_salary}
                    readOnly
                    className="w-full p-3 border border-green-300 bg-green-50 rounded-lg font-semibold text-green-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">Calculated automatically from Basic + Allowances</p>
                </div>
              </div>
            </div>

            {/* Company & HR Details */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-200">Company & HR Details</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HR Name</label>
                    <input
                      type="text"
                      name="hr_name"
                      value={formData.hr_name}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                  <input
                    type="text"
                    name="company_address"
                    value={formData.company_address}
                    onChange={onInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
                    <input
                      type="email"
                      name="company_email"
                      value={formData.company_email}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Contact</label>
                    <input
                      type="text"
                      name="company_contact"
                      value={formData.company_contact}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HR Designation</label>
                  <input
                    type="text"
                    name="hr_designation"
                    value={formData.hr_designation}
                    onChange={onInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b border-gray-200">Additional Information</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                    <input
                      type="text"
                      name="working_hours"
                      value={formData.working_hours}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
                    <input
                      type="text"
                      name="notice_period"
                      value={formData.notice_period}
                      onChange={onInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Benefits & Perks</label>
                  <textarea
                    name="benefits"
                    value={formData.benefits}
                    onChange={onInputChange}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Quick Tips</h4>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>Fill in all required fields marked with *</li>
            <li>Net salary is automatically calculated from Basic + Allowances</li>
            <li>Preview the offer letter before downloading or printing</li>
            <li>You can edit any field and regenerate the letter</li>
          </ul>
        </div>

        {/* Action Buttons for Popup */}
        {isPopup && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button onClick={onReset} variant="outline" className="border-gray-300">
              Reset Form
            </Button>
            <Button 
              onClick={onGenerate} 
              disabled={loading}
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
                  Generate Offer Letter
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferLetterForm;
// components/hr-letters/LetterForm.jsx
import React from 'react';

const LetterForm = ({ formData, onFormChange, letterType }) => {
  const handleInputChange = (field, value) => {
    onFormChange({
      ...formData,
      [field]: value
    });
  };

  const handleSalaryChange = (field, value) => {
    onFormChange({
      ...formData,
      salary: {
        ...formData.salary,
        [field]: value ? parseFloat(value) : 0
      }
    });
  };

  const handleCompanyDetailChange = (field, value) => {
    onFormChange({
      ...formData,
      companyDetails: {
        ...formData.companyDetails,
        [field]: value
      }
    });
  };

  const handleCompanyAddressChange = (field, value) => {
    onFormChange({
      ...formData,
      companyDetails: {
        ...formData.companyDetails,
        address: {
          ...formData.companyDetails?.address,
          [field]: value
        }
      }
    });
  };

  const calculateTotalSalary = () => {
    const basic = parseFloat(formData.salary?.basic) || 0;
    const hra = parseFloat(formData.salary?.hra) || 0;
    const specialAllowance = parseFloat(formData.salary?.specialAllowance) || 0;
    return basic + hra + specialAllowance;
  };

  // Update total salary when salary components change
  React.useEffect(() => {
    if (formData.salary) {
      const total = calculateTotalSalary();
      if (formData.salary.total !== total) {
        handleSalaryChange('total', total);
      }
    }
  }, [formData.salary?.basic, formData.salary?.hra, formData.salary?.specialAllowance]);

  // Initialize company details if not present
  React.useEffect(() => {
    if (!formData.companyDetails) {
      onFormChange({
        ...formData,
        companyDetails: {
          name: 'Cybomb Technologies LLP',
          address: {
            line1: '',
            line2: '',
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '',
            country: 'India'
          },
          phone: '',
          email: '',
          website: '',
          hrManagerName: 'HR Manager'
        }
      });
    }
  }, []);

  // Dynamic field configuration for each letter type
  const getLetterTypeFields = () => {
    const commonFields = {
      candidateName: { type: 'text', label: 'Candidate Name *', required: true },
      candidateEmail: { type: 'email', label: 'Candidate Email *', required: true },
      candidateAddress: { type: 'textarea', label: 'Candidate Address', required: false },
      designation: { type: 'text', label: 'Designation *', required: true },
      department: { type: 'text', label: 'Department', required: false }
    };

    const letterTypeSpecificFields = {
      offer: {
        joiningDate: { type: 'date', label: 'Joining Date *', required: true },
        salary: { type: 'salary', label: 'Salary Details', required: true }
      },
      appointment: {
        joiningDate: { type: 'date', label: 'Joining Date *', required: true },
        salary: { type: 'salary', label: 'Salary Details', required: true },
        workLocation: { type: 'text', label: 'Work Location', required: false },
        reportingManager: { type: 'text', label: 'Reporting Manager', required: false }
      },
      hike: {
        effectiveDate: { type: 'date', label: 'Effective Date *', required: true },
        salary: { type: 'salary', label: 'Revised Salary Details', required: true },
        previousSalary: { type: 'salary', label: 'Previous Salary Details', required: false },
        hikePercentage: { type: 'number', label: 'Hike Percentage %', required: false }
      },
      promotion: {
        effectiveDate: { type: 'date', label: 'Effective Date *', required: true },
        salary: { type: 'salary', label: 'New Salary Details', required: true },
        previousDesignation: { type: 'text', label: 'Previous Designation', required: false },
        promotionReason: { type: 'textarea', label: 'Promotion Reason', required: false }
      },
      termination: {
        effectiveDate: { type: 'date', label: 'Termination Date *', required: true },
        reason: { type: 'textarea', label: 'Reason for Termination *', required: true },
        noticePeriod: { type: 'text', label: 'Notice Period', required: false },
        lastWorkingDay: { type: 'date', label: 'Last Working Day', required: false }
      },
      experience: {
        joiningDate: { type: 'date', label: 'Joining Date *', required: true },
        effectiveDate: { type: 'date', label: 'Leaving Date *', required: true },
        duration: { type: 'text', label: 'Employment Duration', required: false },
        responsibilities: { type: 'textarea', label: 'Key Responsibilities', required: false },
        achievements: { type: 'textarea', label: 'Key Achievements', required: false }
      }
    };

    return {
      ...commonFields,
      ...(letterTypeSpecificFields[letterType] || {})
    };
  };

  const renderSalaryFields = (label = 'Salary Details') => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-lg font-medium text-gray-900 mb-3">{label}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Basic Salary (₹)
          </label>
          <input
            type="number"
            value={formData.salary?.basic || ''}
            onChange={(e) => handleSalaryChange('basic', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HRA (₹)
          </label>
          <input
            type="number"
            value={formData.salary?.hra || ''}
            onChange={(e) => handleSalaryChange('hra', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Allowance (₹)
          </label>
          <input
            type="number"
            value={formData.salary?.specialAllowance || ''}
            onChange={(e) => handleSalaryChange('specialAllowance', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total CTC (₹)
          </label>
          <input
            type="number"
            value={calculateTotalSalary()}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md font-semibold"
          />
        </div>
      </div>
    </div>
  );

  const renderPreviousSalaryFields = () => (
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h4 className="text-lg font-medium text-gray-900 mb-3">Previous Salary Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Previous Basic (₹)
          </label>
          <input
            type="number"
            value={formData.previousSalary?.basic || ''}
            onChange={(e) => handleInputChange('previousSalary', {
              ...formData.previousSalary,
              basic: parseFloat(e.target.value) || 0
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Previous HRA (₹)
          </label>
          <input
            type="number"
            value={formData.previousSalary?.hra || ''}
            onChange={(e) => handleInputChange('previousSalary', {
              ...formData.previousSalary,
              hra: parseFloat(e.target.value) || 0
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Previous Allowance (₹)
          </label>
          <input
            type="number"
            value={formData.previousSalary?.specialAllowance || ''}
            onChange={(e) => handleInputChange('previousSalary', {
              ...formData.previousSalary,
              specialAllowance: parseFloat(e.target.value) || 0
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Previous Total (₹)
          </label>
          <input
            type="number"
            value={formData.previousSalary?.total || ''}
            onChange={(e) => handleInputChange('previousSalary', {
              ...formData.previousSalary,
              total: parseFloat(e.target.value) || 0
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderCompanyDetails = () => (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="text-lg font-medium text-gray-900 mb-3">Company Details</h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyDetails?.name || ''}
            onChange={(e) => handleCompanyDetailChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              value={formData.companyDetails?.address?.line1 || ''}
              onChange={(e) => handleCompanyAddressChange('line1', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.companyDetails?.address?.line2 || ''}
              onChange={(e) => handleCompanyAddressChange('line2', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.companyDetails?.address?.city || ''}
              onChange={(e) => handleCompanyAddressChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <input
              type="text"
              value={formData.companyDetails?.address?.state || ''}
              onChange={(e) => handleCompanyAddressChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN Code
            </label>
            <input
              type="text"
              value={formData.companyDetails?.address?.pincode || ''}
              onChange={(e) => handleCompanyAddressChange('pincode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="text"
              value={formData.companyDetails?.phone || ''}
              onChange={(e) => handleCompanyDetailChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.companyDetails?.email || ''}
              onChange={(e) => handleCompanyDetailChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HR Manager Name
            </label>
            <input
              type="text"
              value={formData.companyDetails?.hrManagerName || ''}
              onChange={(e) => handleCompanyDetailChange('hrManagerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="text"
            value={formData.companyDetails?.website || ''}
            onChange={(e) => handleCompanyDetailChange('website', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </div>
      </div>
    </div>
  );

  const renderField = (fieldName, fieldConfig) => {
    const { type, label, required } = fieldConfig;
    const value = formData[fieldName] || '';

    switch (type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={required}
            />
          </div>
        );

      case 'date':
        return (
          <div key={fieldName}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type="date"
              value={value}
              onChange={(e) => handleInputChange(fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={required}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderDynamicFields = () => {
    const fieldsConfig = getLetterTypeFields();
    const commonFields = ['candidateName', 'candidateEmail', 'candidateAddress', 'designation', 'department'];
    
    return (
      <div className="space-y-4">
        {/* Common fields in grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commonFields.map(fieldName => 
            fieldsConfig[fieldName] && renderField(fieldName, fieldsConfig[fieldName])
          )}
        </div>

        {/* Special fields */}
        {fieldsConfig.joiningDate && renderField('joiningDate', fieldsConfig.joiningDate)}
        {fieldsConfig.effectiveDate && renderField('effectiveDate', fieldsConfig.effectiveDate)}
        {fieldsConfig.reason && renderField('reason', fieldsConfig.reason)}
        {fieldsConfig.duration && renderField('duration', fieldsConfig.duration)}
        {fieldsConfig.workLocation && renderField('workLocation', fieldsConfig.workLocation)}
        {fieldsConfig.reportingManager && renderField('reportingManager', fieldsConfig.reportingManager)}
        {fieldsConfig.hikePercentage && renderField('hikePercentage', fieldsConfig.hikePercentage)}
        {fieldsConfig.previousDesignation && renderField('previousDesignation', fieldsConfig.previousDesignation)}
        {fieldsConfig.promotionReason && renderField('promotionReason', fieldsConfig.promotionReason)}
        {fieldsConfig.noticePeriod && renderField('noticePeriod', fieldsConfig.noticePeriod)}
        {fieldsConfig.lastWorkingDay && renderField('lastWorkingDay', fieldsConfig.lastWorkingDay)}
        {fieldsConfig.responsibilities && renderField('responsibilities', fieldsConfig.responsibilities)}
        {fieldsConfig.achievements && renderField('achievements', fieldsConfig.achievements)}
      </div>
    );
  };

  if (!letterType) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select a letter type to show the form
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderDynamicFields()}
      
      {/* Company Details - Always shown */}
      {renderCompanyDetails()}
      
      {/* Salary Fields */}
      {getLetterTypeFields().salary && renderSalaryFields(getLetterTypeFields().salary.label)}
      
      {/* Previous Salary Fields for Hike Letters */}
      {letterType === 'hike' && formData.previousSalary && renderPreviousSalaryFields()}
    </div>
  );
};

export default LetterForm;
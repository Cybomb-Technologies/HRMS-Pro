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

  const renderCommonFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Candidate Name *
          </label>
          <input
            type="text"
            value={formData.candidateName || ''}
            onChange={(e) => handleInputChange('candidateName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Candidate Email *
          </label>
          <input
            type="email"
            value={formData.candidateEmail || ''}
            onChange={(e) => handleInputChange('candidateEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Candidate Address
        </label>
        <textarea
          value={formData.candidateAddress || ''}
          onChange={(e) => handleInputChange('candidateAddress', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Designation *
          </label>
          <input
            type="text"
            value={formData.designation || ''}
            onChange={(e) => handleInputChange('designation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            type="text"
            value={formData.department || ''}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </>
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

  const renderSalaryFields = () => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-lg font-medium text-gray-900 mb-3">Salary Details</h4>
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

  const renderDateFields = () => {
    switch (letterType) {
      case 'offer':
      case 'appointment':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Joining Date *
            </label>
            <input
              type="date"
              value={formData.joiningDate || ''}
              onChange={(e) => handleInputChange('joiningDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        );
      
      case 'hike':
      case 'promotion':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date *
            </label>
            <input
              type="date"
              value={formData.effectiveDate || ''}
              onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        );
      
      case 'termination':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Termination Date *
              </label>
              <input
                type="date"
                value={formData.effectiveDate || ''}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Termination
              </label>
              <textarea
                value={formData.reason || ''}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the reason for termination..."
              />
            </div>
          </>
        );
      
      case 'experience':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joining Date *
                </label>
                <input
                  type="date"
                  value={formData.joiningDate || ''}
                  onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leaving Date *
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate || ''}
                  onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employment Duration Description
              </label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2 years and 6 months"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
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
      {renderCommonFields()}
      
      {/* Company Details - Always shown */}
      {renderCompanyDetails()}
      
      {(letterType === 'offer' || letterType === 'appointment' || 
        letterType === 'hike' || letterType === 'promotion') && 
        renderSalaryFields()
      }
      
      {renderDateFields()}
    </div>
  );
};

export default LetterForm;
// src/components/HR-Letter/OfferLetter.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import OfferLetterForm from './OfferLetterForm';
import OfferLetterPreview from './OfferLetterPreview';

const OfferLetter = ({ isPopup = false, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateData, setTemplateData] = useState({});
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [generatedLetters, setGeneratedLetters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Candidate Information
    candidate_name: '',
    candidate_address: '',
    email: '',
    phone: '',
    
    // Company Information
    company_name: 'Cybomb Technologies LLP',
    company_address: 'Prime Plaza, Chennai',
    company_email: 'hr@cybomb.com',
    company_contact: '+91 12345 67890',
    hr_name: 'Mr. Rahul Kumar',
    hr_designation: 'HR Manager',
    
    // Job Details
    designation: '',
    department: '',
    employment_type: 'Permanent',
    role: 'Team Member',
    reporting_manager: '',
    
    // Dates
    date_of_joining: '',
    offer_date: new Date().toISOString().split('T')[0],
    probation_period: '3 months',
    offer_expiry_date: '',
    
    // Compensation Details
    ctc: '',
    basic_salary: '',
    allowances: '',
    bonus: '',
    deductions: 'Provident Fund, Professional Tax',
    net_salary: '',
    
    // Additional Info
    working_hours: '9:30 AM to 6:30 PM',
    work_location: 'Chennai (Hybrid)',
    notice_period: '60 days',
    benefits: 'Health Insurance, Paid Leaves, Provident Fund'
  });

  // Fetch templates and existing letters on component mount
  useEffect(() => {
    fetchTemplates();
    loadGeneratedLetters();
    
    // Set up storage event listener to sync between components
    const handleStorageChange = (e) => {
      if (e.key === 'generatedLetters') {
        loadGeneratedLetters();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Also listen for custom events from GeneratedLetters component
  useEffect(() => {
    const handleLettersUpdated = () => {
      loadGeneratedLetters();
    };
    
    window.addEventListener('offerLettersUpdated', handleLettersUpdated);
    
    return () => {
      window.removeEventListener('offerLettersUpdated', handleLettersUpdated);
    };
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/offer-letters', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]._id);
          setTemplateData(data[0]);
        }
      } else {
        // If no templates from backend, use default template
        setTemplates([{
          _id: 'default',
          name: 'Standard Employment Offer Letter',
          description: 'Professional offer letter template for full-time employees'
        }]);
        setSelectedTemplate('default');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fallback to default template
      setTemplates([{
        _id: 'default',
        name: 'Standard Employment Offer Letter',
        description: 'Professional offer letter template for full-time employees'
      }]);
      setSelectedTemplate('default');
    }
  };

  const loadGeneratedLetters = () => {
    try {
      const savedLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
      // Sort by creation date, newest first
      const sortedLetters = savedLetters.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setGeneratedLetters(sortedLetters);
    } catch (error) {
      console.error('Error loading generated letters:', error);
      setGeneratedLetters([]);
    }
  };

  const refreshLetters = async () => {
    setRefreshing(true);
    try {
      // Try to fetch from backend first
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/offer-letters/generated/all?status=all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.letters && data.letters.length > 0) {
          setGeneratedLetters(data.letters);
          // Also update localStorage for consistency
          localStorage.setItem('generatedLetters', JSON.stringify(data.letters));
        } else {
          loadGeneratedLetters(); // Fallback to localStorage
        }
      } else {
        loadGeneratedLetters(); // Fallback to localStorage
      }
    } catch (error) {
      console.error('Error refreshing letters:', error);
      loadGeneratedLetters(); // Fallback to localStorage
    } finally {
      setRefreshing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openCreateForm = () => {
    resetForm();
    setShowFormPopup(true);
  };

  const closeFormPopup = () => {
    setShowFormPopup(false);
    setPreviewMode(false);
    if (onClose) {
      onClose();
    }
  };

  const generateOfferLetter = async () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    // Validate required fields
    if (!formData.candidate_name || !formData.designation || !formData.date_of_joining) {
      alert('Please fill in all required fields: Candidate Name, Designation, and Date of Joining');
      return;
    }

    setLoading(true);
    
    try {
      if (selectedTemplate === 'default') {
        // Use client-side template generation for default template
        const generatedHtml = generateDefaultTemplate(formData);
        setGeneratedLetter(generatedHtml);
        setPreviewMode(true);
        
        // For default template, we can't save to backend, so we'll store in localStorage
        const localLetter = {
          id: Date.now().toString(),
          templateName: 'Standard Employment Offer Letter',
          candidateName: formData.candidate_name,
          candidateEmail: formData.email,
          designation: formData.designation,
          htmlContent: generatedHtml,
          formData: { ...formData },
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Save to localStorage for demo
        const existingLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
        const updatedLetters = [localLetter, ...existingLetters];
        localStorage.setItem('generatedLetters', JSON.stringify(updatedLetters));
        setGeneratedLetters(updatedLetters);
        
        // Trigger custom event to notify other components
        window.dispatchEvent(new Event('offerLettersUpdated'));
        
        toast({
          title: 'Letter Generated',
          description: 'Offer letter has been generated and saved successfully',
          variant: 'default'
        });
        
      } else {
        // Use backend API for other templates
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/offer-letters/${selectedTemplate}/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const data = await response.json();
          setGeneratedLetter(data.html);
          setPreviewMode(true);
          
          // Refresh letters to include the new one
          refreshLetters();
          
          // Show success message
          toast({
            title: 'Letter Generated',
            description: 'Offer letter has been generated and saved successfully',
            variant: 'default'
          });
        } else {
          const error = await response.json();
          alert(error.message || 'Error generating offer letter');
        }
      }
    } catch (error) {
      console.error('Error generating offer letter:', error);
      alert('Error generating offer letter');
    } finally {
      setLoading(false);
    }
  };

  // Default template generator function
  const generateDefaultTemplate = (data) => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Offer Letter - ${data.company_name}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            color: #2c5aa0;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
        }
        .company-address {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }
        .date {
            text-align: right;
            margin-bottom: 20px;
            color: #666;
            font-style: italic;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            color: #2c5aa0;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 5px;
        }
        .candidate-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2c5aa0;
        }
        .signature-section {
            margin-top: 60px;
        }
        .signature-line {
            border-top: 1px solid #333;
            width: 300px;
            margin-top: 80px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .highlight {
            background-color: #e3f2fd;
            padding: 4px 8px;
            font-weight: bold;
            border-radius: 4px;
        }
        .compensation-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        .compensation-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        .compensation-table td:first-child {
            font-weight: bold;
            width: 40%;
        }
        .terms-list {
            list-style-type: none;
            padding: 0;
        }
        .terms-list li {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="company-name">${data.company_name}</h1>
        <p class="company-address">${data.company_address}</p>
        <p class="company-address">Email: ${data.company_email} | Phone: ${data.company_contact}</p>
    </div>

    <div class="date">
        Date: ${data.offer_date}
    </div>

    <div class="candidate-info">
        <p><strong>${data.candidate_name}</strong></p>
        <p>${data.candidate_address}</p>
        <p>Email: ${data.email} | Phone: ${data.phone}</p>
    </div>

    <div class="section">
        <div class="section-title">OFFER OF EMPLOYMENT</div>
        <p>Dear <strong>${data.candidate_name}</strong>,</p>
        <p>We are delighted to offer you the position of <span class="highlight">${data.designation}</span> at ${data.company_name}. This letter outlines the terms and conditions of your employment, and we are confident that you will make valuable contributions to our organization.</p>
    </div>

    <div class="section">
        <div class="section-title">1. POSITION DETAILS</div>
        <table class="compensation-table">
            <tr><td>Designation:</td><td>${data.designation}</td></tr>
            <tr><td>Department:</td><td>${data.department}</td></tr>
            <tr><td>Employment Type:</td><td>${data.employment_type}</td></tr>
            <tr><td>Reporting Manager:</td><td>${data.reporting_manager}</td></tr>
            <tr><td>Work Location:</td><td>${data.work_location}</td></tr>
            <tr><td>Date of Joining:</td><td><strong>${data.date_of_joining}</strong></td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. COMPENSATION PACKAGE</div>
        <table class="compensation-table">
            <tr><td>Annual CTC:</td><td>${data.ctc}</td></tr>
            <tr><td>Basic Salary:</td><td>${data.basic_salary} per month</td></tr>
            <tr><td>Allowances:</td><td>${data.allowances} per month</td></tr>
            ${data.bonus ? `<tr><td>Bonus:</td><td>${data.bonus}</td></tr>` : ''}
            <tr><td>Deductions:</td><td>${data.deductions}</td></tr>
            <tr><td>Net Salary:</td><td><strong>${data.net_salary} per month</strong> (after deductions)</td></tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. TERMS & CONDITIONS</div>
        <ul class="terms-list">
            <li><strong>Working Hours:</strong> ${data.working_hours}</li>
            <li><strong>Probation Period:</strong> ${data.probation_period}</li>
            <li><strong>Notice Period:</strong> ${data.notice_period}</li>
            <li><strong>Benefits:</strong> ${data.benefits}</li>
        </ul>
    </div>

    <div class="section">
        <p>We are excited about the prospect of you joining our team and believe that your skills and experience will be valuable assets to our organization.</p>
        <p>Please sign and return this letter by <strong>${data.offer_expiry_date}</strong> to indicate your acceptance of this offer.</p>
        <p>We look forward to welcoming you to ${data.company_name} and are confident that this will be the beginning of a long and mutually rewarding association.</p>
    </div>

    <div class="signature-section">
        <p>Yours sincerely,</p>
        <br><br><br>
        <div class="signature-line"></div>
        <p><strong>${data.hr_name}</strong><br>
        ${data.hr_designation}<br>
        ${data.company_name}</p>
    </div>

    <div class="footer">

        <p>${data.company_name} | ${data.company_address} | ${data.company_email}</p>
    </div>
</body>
</html>`;
  };

   const resetForm = () => {
    setFormData({
      candidate_name: '',
      candidate_address: '',
      email: '',
      phone: '',
      company_name: 'Cybomb Technologies LLP',
      company_address: 'Prime Plaza, Chennai',
      company_email: 'hr@cybomb.com',
      company_contact: '+91 12345 67890',
      hr_name: 'Mr. Rahul Kumar',
      hr_designation: 'HR Manager',
      designation: '',
      department: '',
      employment_type: 'Permanent',
      role: 'Team Member',
      reporting_manager: '',
      date_of_joining: '',
      offer_date: new Date().toISOString().split('T')[0],
      probation_period: '3 months',
      offer_expiry_date: '',
      ctc: '',
      basic_salary: '',
      allowances: '',
      bonus: '',
      deductions: 'Provident Fund, Professional Tax',
      net_salary: '',
      working_hours: '9:30 AM to 6:30 PM',
      work_location: 'Chennai (Hybrid)',
      notice_period: '60 days',
      benefits: 'Health Insurance, Paid Leaves, Provident Fund'
    });
    setGeneratedLetter('');
    setPreviewMode(false);
  };

  // Calculate net salary automatically
  useEffect(() => {
    const basic = parseFloat(formData.basic_salary) || 0;
    const allowance = parseFloat(formData.allowances) || 0;
    const net = basic + allowance;
    if (!isNaN(net) && net > 0) {
      setFormData(prev => ({
        ...prev,
        net_salary: `₹${net.toLocaleString('en-IN')}`
      }));
    }
  }, [formData.basic_salary, formData.allowances]);

  const viewGeneratedLetter = (letter) => {
    setGeneratedLetter(letter.htmlContent);
    setFormData(letter.formData);
    setPreviewMode(true);
    setShowFormPopup(true);
  };

  // If in popup mode and showing preview
  if (previewMode && isPopup) {
    return (
      <OfferLetterPreview
        generatedLetter={generatedLetter}
        formData={formData}
        onBack={() => setPreviewMode(false)}
        onClose={closeFormPopup}
        isPopup={true}
      />
    );
  }

  // If in popup mode, show only the form (no dashboard) - with proper scrolling container
  if (isPopup) {
    return (
      <div className="h-full flex flex-col">
        <OfferLetterForm
          templates={templates}
          selectedTemplate={selectedTemplate}
          formData={formData}
          loading={loading}
          onTemplateChange={setSelectedTemplate}
          onInputChange={handleInputChange}
          onGenerate={generateOfferLetter}
          onReset={resetForm}
          onClose={closeFormPopup}
          isPopup={true}
        />
      </div>
    );
  }

  // Regular dashboard view (when not in popup mode)
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Offer Letters</h2>
            <p className="text-sm text-gray-600">Manage and create employment offer letters</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={refreshLetters}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={openCreateForm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Offer Letter
          </Button>
        </div>
      </div>

      {/* Recent Generated Letters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Offer Letters</h3>
          <span className="text-sm text-gray-500">
            {generatedLetters.length} letter{generatedLetters.length !== 1 ? 's' : ''}
          </span>
        </div>
        {generatedLetters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedLetters.slice(0, 6).map((letter) => (
              <div 
                key={letter.id || letter._id} 
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => viewGeneratedLetter(letter)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate flex-1 mr-2">
                    {letter.candidateName}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                    letter.status === 'sent' ? 'bg-green-100 text-green-800' : 
                    letter.status === 'accepted' ? 'bg-blue-100 text-blue-800' : 
                    letter.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {letter.status || 'draft'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1 truncate">{letter.designation}</p>
                <p className="text-xs text-gray-500 truncate">{letter.candidateEmail}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">
                    {new Date(letter.createdAt).toLocaleDateString()}
                  </p>
                  {letter.updatedAt && letter.updatedAt !== letter.createdAt && (
                    <p className="text-xs text-gray-400" title={`Updated: ${new Date(letter.updatedAt).toLocaleString()}`}>
                      Edited
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No offer letters generated yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first offer letter to get started</p>
          </div>
        )}
      </div>

      {/* Templates Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div 
              key={template._id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                setSelectedTemplate(template._id);
                openCreateForm();
              }}
            >
              <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Popup */}
      {showFormPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <OfferLetterForm
              templates={templates}
              selectedTemplate={selectedTemplate}
              formData={formData}
              loading={loading}
              onTemplateChange={setSelectedTemplate}
              onInputChange={handleInputChange}
              onGenerate={generateOfferLetter}
              onReset={resetForm}
              onClose={closeFormPopup}
              isPopup={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLetter;
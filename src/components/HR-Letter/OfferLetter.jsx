// src/components/HR-Letter/OfferLetter.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus, RefreshCw, Edit, Send, Download, Upload, Shield } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import OfferLetterForm from './OfferLetterForm';
import OfferLetterPreview from './OfferLetterPreview';
import TemplatePreview from './TemplatePreview';
import PrivacyPolicy from './PrivacyPolicy';
import WordUploadModal from './WordUploadModal';

// Helper function to safely parse/calculate Net Salary
const calculateNetSalary = (basic, allowances) => {
  const basicValue = parseFloat(String(basic).replace(/[^0-9.]/g, '')) || 0;
  const allowanceValue = parseFloat(String(allowances).replace(/[^0-9.]/g, '')) || 0;
  const net = basicValue + allowanceValue;
  
  if (net >= 0) {
    return `₹${net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return '';
};

const OfferLetter = ({ isPopup = false, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [generatedLetters, setGeneratedLetters] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingLetter, setEditingLetter] = useState(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showWordUpload, setShowWordUpload] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
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
    working_hours: '9:30 AM to 6:30 PM',
    work_location: 'Chennai (Hybrid)',
    notice_period: '60 days',
    benefits: 'Health Insurance, Paid Leaves, Provident Fund',
    privacy_consent: false
  });
  
  const displayNetSalary = calculateNetSalary(formData.basic_salary, formData.allowances);
  
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);
  
  useEffect(() => {
    fetchTemplates();
    loadGeneratedLetters();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      
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
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load templates',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      });
    }
  };

  const loadGeneratedLetters = async () => {
    try {
      const token = localStorage.getItem('hrms_token');
      
      const response = await fetch('http://localhost:5000/api/offer-letters/generated/all?status=all&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedLetters(data.letters || []);
      } else {
        setGeneratedLetters([]);
      }
    } catch (error) {
      console.error('Error loading generated letters:', error);
      setGeneratedLetters([]);
    }
  };

  const refreshLetters = async () => {
    setRefreshing(true);
    await loadGeneratedLetters();
    setRefreshing(false);
  };

  const openCreateForm = useCallback((templateId = null) => {
    resetForm();
    setEditingLetter(null);
    if (templateId) {
      setSelectedTemplate(templateId);
    }
    setShowFormPopup(true);
  }, []);

  const closeFormPopup = useCallback(() => {
    setShowFormPopup(false);
    setPreviewMode(false);
    setEditingLetter(null);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const previewTemplate = (template) => {
    setSelectedTemplatePreview(template);
    setShowTemplatePreview(true);
  };

  const generateOfferLetter = async () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (!formData.candidate_name || !formData.designation || !formData.date_of_joining) {
      alert('Please fill in all required fields: Candidate Name, Designation, and Date of Joining');
      return;
    }

    if (!formData.privacy_consent) {
      alert('Please accept the Privacy Policy to continue');
      return;
    }

    const finalFormData = {
        ...formData,
        net_salary: calculateNetSalary(formData.basic_salary, formData.allowances)
    };
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('hrms_token');
      
      const response = await fetch(`http://localhost:5000/api/offer-letters/${selectedTemplate}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalFormData)
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedLetter(data.html);
        setPreviewMode(true);
        await refreshLetters();
        
        toast({
          title: 'Letter Generated',
          description: 'Offer letter has been generated and saved successfully',
          variant: 'default'
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Error generating offer letter');
      }
    } catch (error) {
      console.error('Error generating offer letter:', error);
      alert('Error generating offer letter');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (letterId) => {
    try {
      const token = localStorage.getItem('hrms_token');
      const response = await fetch(`http://localhost:5000/api/offer-letters/download/${letterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `offer-letter-${letterId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: 'Download Started',
          description: 'PDF download has started',
          variant: 'default'
        });
      } else {
        throw new Error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download PDF',
        variant: 'destructive'
      });
    }
  };

  const sendOfferLetter = async (letterId) => {
    try {
      const token = localStorage.getItem('hrms_token');
      const response = await fetch(`http://localhost:5000/api/offer-letters/send/${letterId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        await refreshLetters();
        
        toast({
          title: 'Email Sent',
          description: 'Offer letter has been sent successfully',
          variant: 'default'
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send error:', error);
      toast({
        title: 'Send Failed',
        description: error.message || 'Failed to send offer letter',
        variant: 'destructive'
      });
    }
  };

  const editGeneratedLetter = useCallback((letter) => {
    const cleanFormData = {
        candidate_name: letter.formData?.candidate_name || letter.candidateName || '',
        candidate_address: letter.formData?.candidate_address || '',
        email: letter.formData?.email || letter.candidateEmail || '',
        phone: letter.formData?.phone || '',
        company_name: letter.formData?.company_name || 'Cybomb Technologies LLP',
        company_address: letter.formData?.company_address || 'Prime Plaza, Chennai',
        company_email: letter.formData?.company_email || 'hr@cybomb.com',
        company_contact: letter.formData?.company_contact || '+91 12345 67890',
        hr_name: letter.formData?.hr_name || 'Mr. Rahul Kumar',
        hr_designation: letter.formData?.hr_designation || 'HR Manager',
        designation: letter.formData?.designation || letter.designation || '',
        department: letter.formData?.department || '',
        employment_type: letter.formData?.employment_type || 'Permanent',
        role: letter.formData?.role || 'Team Member',
        reporting_manager: letter.formData?.reporting_manager || '',
        date_of_joining: letter.formData?.date_of_joining || '',
        offer_date: letter.formData?.offer_date || new Date().toISOString().split('T')[0],
        probation_period: letter.formData?.probation_period || '3 months',
        offer_expiry_date: letter.formData?.offer_expiry_date || '',
        ctc: letter.formData?.ctc || '',
        basic_salary: letter.formData?.basic_salary || '',
        allowances: letter.formData?.allowances || '',
        bonus: letter.formData?.bonus || '',
        deductions: letter.formData?.deductions || 'Provident Fund, Professional Tax',
        working_hours: letter.formData?.working_hours || '9:30 AM to 6:30 PM',
        work_location: letter.formData?.work_location || 'Chennai (Hybrid)',
        notice_period: letter.formData?.notice_period || '60 days',
        benefits: letter.formData?.benefits || 'Health Insurance, Paid Leaves, Provident Fund',
        privacy_consent: true
    };
  
    setFormData(cleanFormData);
    setGeneratedLetter(letter.htmlContent);
    setEditingLetter(letter);
    setShowFormPopup(true);
    setPreviewMode(false);
  
    if (letter.templateId) {
      setSelectedTemplate(letter.templateId._id || letter.templateId);
    }
  }, []);

  const updateGeneratedLetter = async () => {
    if (!editingLetter) return;

    const finalFormData = {
        ...formData,
        net_salary: calculateNetSalary(formData.basic_salary, formData.allowances)
    };

    setLoading(true);
    try {
      const token = localStorage.getItem('hrms_token');
      const response = await fetch(`http://localhost:5000/api/offer-letters/generated/${editingLetter._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: finalFormData,
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedLetter(result.letter.htmlContent);
        setPreviewMode(true);
        await refreshLetters();
        
        toast({
          title: 'Letter Updated',
          description: 'Offer letter has been updated successfully',
          variant: 'default'
        });
      } else {
        throw new Error('Failed to update letter');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
      working_hours: '9:30 AM to 6:30 PM',
      work_location: 'Chennai (Hybrid)',
      notice_period: '60 days',
      benefits: 'Health Insurance, Paid Leaves, Provident Fund',
      privacy_consent: false
    });
    setGeneratedLetter('');
    setPreviewMode(false);
    setEditingLetter(null);
  };

  const handleWordUploadSuccess = () => {
    fetchTemplates(); // Refresh templates list
    setShowWordUpload(false);
  };

  if (previewMode && isPopup) {
    return (
      <OfferLetterPreview
        generatedLetter={generatedLetter}
        formData={{...formData, net_salary: displayNetSalary}}
        onBack={() => setPreviewMode(false)}
        onClose={closeFormPopup}
        isPopup={true}
        onDownload={() => editingLetter?._id && downloadPDF(editingLetter._id)}
        onSend={() => editingLetter?._id && sendOfferLetter(editingLetter._id)}
        editingLetter={editingLetter}
      />
    );
  }

  if (isPopup) {
    return (
      <div className="h-full flex flex-col">
        <OfferLetterForm
          templates={templates}
          selectedTemplate={selectedTemplate}
          formData={{...formData, net_salary: displayNetSalary}}
          loading={loading}
          onTemplateChange={setSelectedTemplate}
          onInputChange={handleInputChange}
          onGenerate={editingLetter ? updateGeneratedLetter : generateOfferLetter}
          onReset={resetForm}
          onClose={closeFormPopup}
          isPopup={true}
          editingLetter={editingLetter}
          onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
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
            onClick={() => setShowPrivacyPolicy(true)}
            variant="outline"
            className="flex items-center"
          >
            <Shield className="w-4 h-4 mr-2" />
            Privacy Policy
          </Button>
          <Button 
            onClick={refreshLetters}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowWordUpload(true)}
            variant="outline"
            className="flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Word Template
          </Button>
          <Button 
            onClick={() => openCreateForm()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Offer Letter
          </Button>
        </div>
      </div>

      {/* Professional Templates Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Professional Templates</h3>
            <p className="text-sm text-gray-600">Choose from default templates or use your own Word documents</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {templates.length} templates available
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div 
              key={template._id}
              className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white group cursor-pointer"
              onClick={() => openCreateForm(template._id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  template.templateType === 'word_upload' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  <FileText className={`w-5 h-5 ${
                    template.templateType === 'word_upload' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex space-x-1">
                  {template.templateType === 'word_upload' && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Uploaded
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mb-2">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-2">
                  {template.category || 'General'}
                </span>
                <h4 className="font-semibold text-gray-900 text-lg mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-xs text-gray-500">
                  <span className="font-medium">Dynamic Fields:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(template.variables || []).slice(0, 3).map((variable, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {variable}
                    </span>
                  ))}
                  {(template.variables || []).length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{(template.variables || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Use Template
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Generated Letters Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                key={letter._id} 
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
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
                <p className="text-xs text-gray-400 mt-1">
                  Template: {letter.templateId?.name}
                  {letter.templateType === 'word_upload' && ' (Word)'}
                </p>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editGeneratedLetter(letter)}
                      className="h-8 px-2"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPDF(letter._id)}
                      className="h-8 px-2"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendOfferLetter(letter._id)}
                      disabled={letter.status === 'sent'}
                      className="h-8 px-2"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(letter.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No offer letters generated yet</p>
            <p className="text-sm text-gray-400">Select a template above to create your first offer letter</p>
          </div>
        )}
      </div>

      {/* Word Upload Modal */}
      {showWordUpload && (
        <WordUploadModal
          onClose={() => setShowWordUpload(false)}
          onSuccess={handleWordUploadSuccess}
        />
      )}

      {/* Template Preview Modal */}
      {showTemplatePreview && (
        <TemplatePreview
          template={selectedTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
        />
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <PrivacyPolicy
          onClose={() => setShowPrivacyPolicy(false)}
        />
      )}

      {/* Form Popup */}
      {showFormPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <OfferLetterForm
              templates={templates}
              selectedTemplate={selectedTemplate}
              formData={{...formData, net_salary: displayNetSalary}}
              loading={loading}
              onTemplateChange={setSelectedTemplate}
              onInputChange={handleInputChange}
              onGenerate={editingLetter ? updateGeneratedLetter : generateOfferLetter}
              onReset={resetForm}
              onClose={closeFormPopup}
              isPopup={true}
              editingLetter={editingLetter}
              onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLetter;
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus, RefreshCw, Edit, Send, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import OfferLetterForm from './OfferLetterForm';
import OfferLetterPreview from './OfferLetterPreview';

// Helper function to safely parse/calculate Net Salary (Outside the component for stability)
const calculateNetSalary = (basic, allowances) => {
    // Strip non-numeric/non-decimal characters
    const basicValue = parseFloat(String(basic).replace(/[^0-9.]/g, '')) || 0;
    const allowanceValue = parseFloat(String(allowances).replace(/[^0-9.]/g, '')) || 0;
    const net = basicValue + allowanceValue;
    
    if (net >= 0) {
        // Format to Indian locale for display
        return `₹${net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return '';
};


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
  const [editingLetter, setEditingLetter] = useState(null);

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
    benefits: 'Health Insurance, Paid Leaves, Provident Fund'
  });
  
  // Calculate derived net_salary for display
  const displayNetSalary = calculateNetSalary(formData.basic_salary, formData.allowances);
  
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  useEffect(() => {
    fetchTemplates();
    loadGeneratedLetters();
    
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
      // FIX: Use correct token key 'hrms_token'
      const token = localStorage.getItem('hrms_token');
      
      if (!token) {
        console.warn('Authentication token not found. Skipping API call.');
        setTemplates([{
          _id: 'default',
          name: 'Standard Employment Offer Letter',
          description: 'Professional offer letter template for full-time employees'
        }]);
        setSelectedTemplate('default');
        return; 
      }
      
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
        setTemplates([{
          _id: 'default',
          name: 'Standard Employment Offer Letter',
          description: 'Professional offer letter template for full-time employees'
        }]);
        setSelectedTemplate('default');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([{
        _id: 'default',
        name: 'Standard Employment Offer Letter',
        description: 'Professional offer letter template for full-time employees'
      }]);
      setSelectedTemplate('default');
    }
  };

  const loadGeneratedLetters = async () => {
    try {
      // FIX: Use correct token key 'hrms_token'
      const token = localStorage.getItem('hrms_token');
      
      if (!token) {
        console.warn('Authentication token not found. Loading letters from localStorage fallback.');
        const savedLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
        const sortedLetters = savedLetters.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setGeneratedLetters(sortedLetters);
        return;
      }
      
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
        const savedLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
        const sortedLetters = savedLetters.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setGeneratedLetters(sortedLetters);
      }
    } catch (error) {
      console.error('Error loading generated letters:', error);
      const savedLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
      setGeneratedLetters(savedLetters);
    }
  };

  const refreshLetters = async () => {
    setRefreshing(true);
    await loadGeneratedLetters();
    setRefreshing(false);
  };

  const openCreateForm = useCallback(() => {
    resetForm();
    setEditingLetter(null);
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

  const generateOfferLetter = async () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (!formData.candidate_name || !formData.designation || !formData.date_of_joining) {
      alert('Please fill in all required fields: Candidate Name, Designation, and Date of Joining');
      return;
    }

    // Inject calculated net_salary into data just before use
    const finalFormData = {
        ...formData,
        net_salary: calculateNetSalary(formData.basic_salary, formData.allowances)
    };
    
    setLoading(true);
    
    try {
      if (selectedTemplate === 'default') {
        const generatedHtml = generateDefaultTemplate(finalFormData);
        setGeneratedLetter(generatedHtml);
        setPreviewMode(true);
        
        const localLetter = {
          id: Date.now().toString(),
          templateName: 'Standard Employment Offer Letter',
          candidateName: finalFormData.candidate_name,
          candidateEmail: finalFormData.email,
          designation: finalFormData.designation,
          htmlContent: generatedHtml,
          formData: { ...finalFormData },
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const existingLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
        const updatedLetters = [localLetter, ...existingLetters];
        localStorage.setItem('generatedLetters', JSON.stringify(updatedLetters));
        setGeneratedLetters(updatedLetters);
        
        window.dispatchEvent(new Event('offerLettersUpdated'));
        
        toast({
          title: 'Letter Generated',
          description: 'Offer letter has been generated and saved successfully (Locally)',
          variant: 'default'
        });
        
      } else {
        // This path is for backend storage/generation
        // FIX: Use correct token key 'hrms_token'
        const token = localStorage.getItem('hrms_token');
        if (!token) {
            alert('Authentication required to use backend templates. Please log in.');
            setLoading(false);
            return;
        }

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
            description: 'Offer letter has been generated and saved successfully (Backend)',
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

  const downloadPDF = async (letterId) => {
    try {
      // Logic for local storage letters (no _id) would need to generate PDF client-side or prompt to regenerate/save
      if (!letterId) {
          alert('Local letters cannot be downloaded as PDF. Generate using a backend template.');
          return;
      }

      // FIX: Use correct token key 'hrms_token'
      const token = localStorage.getItem('hrms_token');
      if (!token) {
            alert('Authentication required to download PDF from backend. Please log in.');
            return;
        }
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
      // FIX: Use correct token key 'hrms_token'
      const token = localStorage.getItem('hrms_token');
      if (!token) {
            alert('Authentication required to send email via backend. Please log in.');
            return;
        }
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
      benefits: letter.formData?.benefits || 'Health Insurance, Paid Leaves, Provident Fund'
    };
  
  // Update state with letter's form data
  setFormData(cleanFormData);
  setGeneratedLetter(letter.htmlContent);
  setEditingLetter(letter);
  setShowFormPopup(true);
  setPreviewMode(false);
  

    if (letter.templateId) {
      setSelectedTemplate(letter.templateId);
    }
  }, []);

const updateGeneratedLetter = async () => {
  if (!editingLetter) return;

  // Inject calculated net_salary into data just before use
    const finalFormData = {
        ...formData,
        net_salary: calculateNetSalary(formData.basic_salary, formData.allowances)
    };

  setLoading(true);
  try {
    
    let updatedHtmlContent;
    
    if (selectedTemplate === 'default') {
      updatedHtmlContent = generateDefaultTemplate(finalFormData);
    } else {
      // FIX: Use correct token key 'hrms_token'
      const token = localStorage.getItem('hrms_token');
        if (!token) {
            alert('Authentication required to use backend templates. Please log in.');
            setLoading(false);
            return;
        }

      // For backend templates, fetch the template and regenerate
      const templateResponse = await fetch(`http://localhost:5000/api/offer-letters/${selectedTemplate}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (templateResponse.ok) {
        const template = await templateResponse.json();
        updatedHtmlContent = template.template;
        
        // Replace all placeholders with current formData
        Object.keys(finalFormData).forEach(key => {
          const placeholder = `{{${key}}}`;
          const value = finalFormData[key] || '';
          updatedHtmlContent = updatedHtmlContent.replace(new RegExp(placeholder, 'g'), value);
        });
        
        // Clean up any unreplaced placeholders
        updatedHtmlContent = updatedHtmlContent.replace(/{{(\w+)}}/g, '');
      } else {
        // Fallback to existing content if template fetch fails
        updatedHtmlContent = editingLetter.htmlContent;
      }
    }

    if (editingLetter._id) {
      // Backend letter - update via API
      // FIX: Use correct token key 'hrms_token'
      const token = localStorage.getItem('hrms_token');
      const response = await fetch(`http://localhost:5000/api/offer-letters/generated/${editingLetter._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formData: finalFormData,
          htmlContent: updatedHtmlContent
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedLetter(result.letter.htmlContent);
        setPreviewMode(true);
        await refreshLetters();
        
        toast({
          title: 'Letter Updated',
          description: 'Offer letter has been updated successfully (Backend)',
          variant: 'default'
        });
      } else {
        throw new Error('Failed to update letter');
      }
    } else {
      // Local storage letter
      const updatedLetter = {
        ...editingLetter,
        formData: finalFormData,
        htmlContent: updatedHtmlContent,
        candidateName: finalFormData.candidate_name,
        candidateEmail: finalFormData.email,
        designation: finalFormData.designation,
        updatedAt: new Date().toISOString()
      };

      const existingLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
      const updatedLetters = existingLetters.map(letter => 
        letter.id === editingLetter.id ? updatedLetter : letter
      );
      
      localStorage.setItem('generatedLetters', JSON.stringify(updatedLetters));
      setGeneratedLetters(updatedLetters);
      setGeneratedLetter(updatedHtmlContent);
      setPreviewMode(true);
      
      window.dispatchEvent(new Event('offerLettersUpdated'));
      
      toast({
        title: 'Letter Updated',
        description: 'Offer letter has been updated successfully (Locally)',
        variant: 'default'
      });
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
// In the OfferLetter component, update the generateDefaultTemplate function
const generateDefaultTemplate = (data) => {
  // Ensure all data fields have proper fallbacks
 const safeData = {};
 const fields = [
    'candidate_name', 'candidate_address', 'email', 'phone',
    'company_name', 'company_address', 'company_email', 'company_contact',
    'hr_name', 'hr_designation', 'designation', 'department',
    'employment_type', 'reporting_manager', 'work_location', 'date_of_joining',
    'offer_date', 'ctc', 'basic_salary', 'allowances', 'bonus',
    'deductions', 'net_salary', 'working_hours', 'probation_period',
    'notice_period', 'benefits', 'offer_expiry_date', 'role'
  ];
    fields.forEach(field => {
    safeData[field] = data[field] || getDefaultValue(field);
  });

 function getDefaultValue(field) {
    const defaults = {
      candidate_name: 'Candidate Name',
      candidate_address: 'Address not provided',
      email: 'Email not provided',
      phone: 'Phone not provided',
      company_name: 'Cybomb Technologies LLP',
      company_address: 'Prime Plaza, Chennai',
      company_email: 'hr@cybomb.com',
      company_contact: '+91 12345 67890',
      hr_name: 'Mr. Rahul Kumar',
      hr_designation: 'HR Manager',
      designation: 'Position',
      department: 'Department',
      employment_type: 'Permanent',
      reporting_manager: 'Reporting Manager',
      work_location: 'Work Location',
      date_of_joining: 'Date of Joining',
      offer_date: new Date().toISOString().split('T')[0],
      ctc: 'CTC not specified',
      basic_salary: 'Basic salary not specified',
      allowances: 'Allowances not specified',
      bonus: 'Bonus not specified',
      deductions: 'Standard deductions apply',
      net_salary: 'Net salary not calculated',
      working_hours: 'Working hours not specified',
      probation_period: 'Probation period not specified',
      notice_period: 'Notice period not specified',
      benefits: 'Standard benefits apply',
      offer_expiry_date: 'Offer expiry date not specified',
      role: 'Team Member'
    };
    return defaults[field] || '';
  }

  // Return the template with all placeholders properly replaced
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Offer Letter - ${safeData.company_name}</title>
    <style>
        /* Your existing CSS styles */
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2c5aa0; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { color: #2c5aa0; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase; }
        .date { text-align: right; margin-bottom: 20px; color: #666; font-style: italic; }
        .section { margin-bottom: 25px; }
        .section-title { color: #2c5aa0; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #2c5aa0; padding-bottom: 5px; }
        .candidate-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2c5aa0; }
        .signature-section { margin-top: 60px; }
        .signature-line { border-top: 1px solid #333; width: 300px; margin-top: 80px; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        .highlight { background-color: #e3f2fd; padding: 4px 8px; font-weight: bold; border-radius: 4px; }
        .compensation-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .compensation-table td { padding: 8px; border-bottom: 1px solid #ddd; }
        .compensation-table td:first-child { font-weight: bold; width: 40%; }
        .terms-list { list-style-type: none; padding: 0; }
        .terms-list li { padding: 5px 0; border-bottom: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="company-name">${safeData.company_name}</h1>
        <p class="company-address">${safeData.company_address}</p>
        <p class="company-address">Email: ${safeData.company_email} | Phone: ${safeData.company_contact}</p>
    </div>

    <div class="date">Date: ${safeData.offer_date}</div>

    <div class="candidate-info">
        <p><strong>${safeData.candidate_name}</strong></p>
        <p>${safeData.candidate_address}</p>
        <p>Email: ${safeData.email} | Phone: ${safeData.phone}</p>
    </div>

    <div class="section">
        <div class="section-title">OFFER OF EMPLOYMENT</div>
        <p>Dear <strong>${safeData.candidate_name}</strong>,</p>
        <p>We are delighted to offer you the position of <span class="highlight">${safeData.designation}</span> at ${safeData.company_name}. This letter outlines the terms and conditions of your employment, and we are confident that you will make valuable contributions to our organization.</p>
    </div>

    <div class="section">
        <div class="section-title">1. POSITION DETAILS</div>
        <table class="compensation-table">
            <tr><td>Designation:</td><td>${safeData.designation}</td></tr>
            <tr><td>Department:</td><td>${safeData.department}</td></tr>
            <tr><td>Employment Type:</td><td>${safeData.employment_type}</td></tr>
            <tr><td>Reporting Manager:</td><td>${safeData.reporting_manager}</td></tr>
            <tr><td>Work Location:</td><td>${safeData.work_location}</td></tr>
            <tr><td>Date of Joining:</td><td><strong>${safeData.date_of_joining}</strong></td></tr>
            <tr><td>Probation Period:</td><td>${safeData.probation_period}</td></tr>
            <tr><td>Working Hours:</td><td>${safeData.working_hours}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <div class="section-title">2. COMPENSATION AND BENEFITS</div>
        <p>Your annual cost to company (CTC) will be <strong>${safeData.ctc}</strong>.</p>
        <p>Your monthly salary breakdown is as follows:</p>
        <table class="compensation-table">
            <tr><td>Basic Salary:</td><td>${safeData.basic_salary}</td></tr>
            <tr><td>Allowances:</td><td>${safeData.allowances}</td></tr>
            <tr><td>**Estimated Net Monthly Salary:**</td><td>**${safeData.net_salary}**</td></tr>
            <tr><td>Bonus/Incentives:</td><td>${safeData.bonus}</td></tr>
            <tr><td>Standard Deductions:</td><td>${safeData.deductions}</td></tr>
        </table>
        <p>You will also be eligible for benefits including: <span class="highlight">${safeData.benefits}</span>.</p>
    </div>

    <div class="section">
        <div class="section-title">3. TERMS AND CONDITIONS</div>
        <ul class="terms-list">
            <li><strong>Notice Period:</strong> The notice period for termination of employment by either party is ${safeData.notice_period}.</li>
            <li><strong>Offer Expiry:</strong> This offer is valid until <strong>${safeData.offer_expiry_date}</strong>. You are required to sign and return a copy of this letter by this date.</li>
            <li><strong>Governing Law:</strong> This employment shall be governed by the laws of India.</li>
        </ul>
    </div>

    <div class="section signature-section">
        <p>Please sign below to indicate your acceptance of this offer and the terms and conditions outlined herein.</p>
        <br>
        <p>Sincerely,</p>
        <p>For <strong>${safeData.company_name}</strong></p>
        <br><br><br>
        <div class="signature-line"></div>
        <p><strong>${safeData.hr_name}</strong></p>
        <p>${safeData.hr_designation}</p>
    </div>

    <div class="section signature-section">
        <p>I accept the offer of employment as set forth above:</p>
        <br><br><br>
        <div class="signature-line" style="margin-top: 10px;"></div>
        <p><strong>${safeData.candidate_name}</strong></p>
        <p>Date: ___________</p>
    </div>

    <div class="footer">
        <p>${safeData.company_name} | ${safeData.company_address}</p>
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
      working_hours: '9:30 AM to 6:30 PM',
      work_location: 'Chennai (Hybrid)',
      notice_period: '60 days',
      benefits: 'Health Insurance, Paid Leaves, Provident Fund'
    });
    setGeneratedLetter('');
    setPreviewMode(false);
    setEditingLetter(null);
  };

  const viewGeneratedLetter = (letter) => {
    setGeneratedLetter(letter.htmlContent);
    const { net_salary, ...restFormData } = letter.formData; 
    setFormData(restFormData);
    setPreviewMode(true);
    setShowFormPopup(true);
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
                    {letter._id && (
                      <>
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
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(letter.createdAt).toLocaleDateString()}
                  </p>
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
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferLetter;
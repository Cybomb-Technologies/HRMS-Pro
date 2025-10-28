// src/components/HR-Letter/GeneratedLetters.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Edit, 
  Download, 
  Printer, 
  Mail, 
  Trash2,
  Eye,
  Calendar,
  User,
  Building,
  Save,
  X,
  FileText
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const GeneratedLetters = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingLetter, setEditingLetter] = useState(null);
  const [previewLetter, setPreviewLetter] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchGeneratedLetters();
  }, [statusFilter]);

  const fetchGeneratedLetters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/offer-letters/generated/all?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLetters(data.letters || []);
      } else {
        // Fallback to localStorage for demo
        const localLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
        setLetters(localLetters);
      }
    } catch (error) {
      console.error('Error fetching generated letters:', error);
      // Fallback to localStorage for demo
      const localLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
      setLetters(localLetters);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', label: 'Draft' },
      sent: { variant: 'default', label: 'Sent' },
      accepted: { variant: 'success', label: 'Accepted' },
      rejected: { variant: 'destructive', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Function to regenerate HTML content with updated form data
  const regenerateHtmlContent = (templateHtml, formData) => {
    let html = templateHtml;
    
    // Replace all template variables with actual data
    const replacements = {
      candidate_name: formData.candidate_name || '',
      candidate_address: formData.candidate_address || '',
      email: formData.email || '',
      phone: formData.phone || '',
      company_name: formData.company_name || '',
      company_address: formData.company_address || '',
      company_email: formData.company_email || '',
      company_contact: formData.company_contact || '',
      hr_name: formData.hr_name || '',
      hr_designation: formData.hr_designation || '',
      designation: formData.designation || '',
      department: formData.department || '',
      employment_type: formData.employment_type || '',
      role: formData.role || '',
      reporting_manager: formData.reporting_manager || '',
      date_of_joining: formData.date_of_joining || '',
      offer_date: formData.offer_date || '',
      probation_period: formData.probation_period || '',
      offer_expiry_date: formData.offer_expiry_date || '',
      ctc: formData.ctc || '',
      basic_salary: formData.basic_salary || '',
      allowances: formData.allowances || '',
      bonus: formData.bonus || '',
      deductions: formData.deductions || '',
      net_salary: formData.net_salary || '',
      working_hours: formData.working_hours || '',
      work_location: formData.work_location || '',
      notice_period: formData.notice_period || '',
      benefits: formData.benefits || ''
    };

    // Replace all occurrences of each variable
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, replacements[key]);
    });

    // Also replace any remaining template syntax with actual values
    html = html.replace(/\${data\.(\w+)}/g, (match, key) => {
      return formData[key] || '';
    });

    return html;
  };

  const handleEdit = (letter) => {
    setEditingLetter(letter);
    setEditFormData({
      candidateName: letter.candidateName,
      candidateEmail: letter.candidateEmail,
      designation: letter.designation,
      formData: { ...letter.formData }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLetter) return;

    try {
      const token = localStorage.getItem('token');
      
      // Prepare updated form data
      const updatedFormData = {
        ...editFormData.formData,
        candidate_name: editFormData.candidateName,
        email: editFormData.candidateEmail,
        designation: editFormData.designation
      };

      // Calculate net salary if basic salary or allowances are updated
      if (updatedFormData.basic_salary || updatedFormData.allowances) {
        const basic = parseFloat(updatedFormData.basic_salary) || 0;
        const allowance = parseFloat(updatedFormData.allowances) || 0;
        const net = basic + allowance;
        if (!isNaN(net) && net > 0) {
          updatedFormData.net_salary = `₹${net.toLocaleString('en-IN')}`;
        }
      }

      if (editingLetter._id) {
        // Backend update - send formData to regenerate HTML
        const response = await fetch(`http://localhost:5000/api/offer-letters/generated/${editingLetter._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            formData: updatedFormData
          })
        });

        if (response.ok) {
          const result = await response.json();
          toast({
            title: 'Letter Updated',
            description: 'Offer letter has been updated successfully',
            variant: 'default'
          });
          setEditingLetter(null);
          setEditFormData({});
          
          // Update the letters list with the updated letter
          setLetters(prevLetters => 
            prevLetters.map(letter => 
              letter._id === editingLetter._id ? result.letter : letter
            )
          );
          
          // If preview is open for this letter, update it too
          if (previewLetter && (previewLetter._id === editingLetter._id || previewLetter.id === editingLetter.id)) {
            setPreviewLetter(result.letter);
          }
        } else {
          throw new Error('Failed to update letter');
        }
      } else {
        // Local storage update for demo - regenerate HTML with updated data
        const localLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
        const originalLetter = localLetters.find(letter => letter.id === editingLetter.id);
        
        if (!originalLetter) {
          throw new Error('Letter not found in local storage');
        }

        // Regenerate HTML content with updated form data
        const regeneratedHtml = regenerateHtmlContent(originalLetter.htmlContent, updatedFormData);

        const updatedLetter = {
          ...originalLetter,
          candidateName: editFormData.candidateName,
          candidateEmail: editFormData.candidateEmail,
          designation: editFormData.designation,
          formData: updatedFormData,
          htmlContent: regeneratedHtml,
          updatedAt: new Date().toISOString()
        };

        const updatedLetters = localLetters.map(letter => 
          letter.id === editingLetter.id ? updatedLetter : letter
        );
        
        localStorage.setItem('generatedLetters', JSON.stringify(updatedLetters));
        
        // Update state
        setLetters(updatedLetters);
        
        // Update preview if it's open for this letter
        if (previewLetter && previewLetter.id === editingLetter.id) {
          setPreviewLetter(updatedLetter);
        }
        
        window.dispatchEvent(new Event('offerLettersUpdated'));
        
        toast({
          title: 'Letter Updated',
          description: 'Offer letter has been updated successfully',
          variant: 'default'
        });
        setEditingLetter(null);
        setEditFormData({});
      }
    } catch (error) {
      console.error('Error updating letter:', error);
      toast({
        title: 'Error',
        description: 'Failed to update letter',
        variant: 'destructive'
      });
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormDataChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value
      }
    }));
  };

  const handlePreview = (letter) => {
    setPreviewLetter(letter);
  };

  const handleDownload = (letter) => {
    // Use the current letter's htmlContent which should be updated after edits
    const blob = new Blob([letter.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offer-letter-${letter.candidateName.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download Started',
      description: 'Offer letter download has started',
      variant: 'default'
    });
  };

  const handlePrint = (letter) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Offer Letter - ${letter.candidateName}</title>
        </head>
        <body>
          ${letter.htmlContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSend = async (letter) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/offer-letters/generated/${letter._id || letter.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'sent' })
      });

      if (response.ok) {
        const result = await response.json();
        // Update the letter in state
        setLetters(prevLetters => 
          prevLetters.map(l => 
            l._id === letter._id || l.id === letter.id ? result.letter : l
          )
        );
        
        toast({
          title: 'Letter Sent',
          description: `Offer letter sent to ${letter.candidateName}`,
          variant: 'default'
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error sending letter:', error);
      toast({
        title: 'Error',
        description: 'Failed to send letter',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (letter) => {
    if (!confirm(`Are you sure you want to delete the letter for ${letter.candidateName}?`)) {
      return;
    }

    try {
      if (letter._id) {
        // Backend deletion
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/offer-letters/generated/${letter._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Local storage deletion for demo
        const localLetters = JSON.parse(localStorage.getItem('generatedLetters') || '[]');
        const updatedLetters = localLetters.filter(l => l.id !== letter.id);
        localStorage.setItem('generatedLetters', JSON.stringify(updatedLetters));
      }
      
      // Remove from state
      setLetters(prevLetters => prevLetters.filter(l => 
        (l._id && l._id !== letter._id) || (l.id && l.id !== letter.id)
      ));
      
      // Close preview if it's open for this letter
      if (previewLetter && (previewLetter._id === letter._id || previewLetter.id === letter.id)) {
        setPreviewLetter(null);
      }
      window.dispatchEvent(new Event('offerLettersUpdated'));

      toast({
        title: 'Letter Deleted',
        description: 'Offer letter has been deleted successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error deleting letter:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete letter',
        variant: 'destructive'
      });
    }
  };

  const filteredLetters = letters.filter(letter =>
    letter.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    letter.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    letter.candidateEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Edit Modal Component
  const EditModal = () => {
    if (!editingLetter) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Edit Offer Letter</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingLetter(null);
                setEditFormData({});
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Candidate Name *
                  </label>
                  <Input
                    value={editFormData.candidateName || ''}
                    onChange={(e) => handleInputChange('candidateName', e.target.value)}
                    placeholder="Enter candidate name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Candidate Email *
                  </label>
                  <Input
                    type="email"
                    value={editFormData.candidateEmail || ''}
                    onChange={(e) => handleInputChange('candidateEmail', e.target.value)}
                    placeholder="Enter candidate email"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Designation *
                </label>
                <Input
                  value={editFormData.designation || ''}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  placeholder="Enter designation"
                  required
                />
              </div>

              {/* Salary Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Basic Salary (Monthly)
                  </label>
                  <Input
                    type="text"
                    value={editFormData.formData?.basic_salary || ''}
                    onChange={(e) => handleFormDataChange('basic_salary', e.target.value)}
                    placeholder="e.g., ₹25,000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Allowances (Monthly)
                  </label>
                  <Input
                    type="text"
                    value={editFormData.formData?.allowances || ''}
                    onChange={(e) => handleFormDataChange('allowances', e.target.value)}
                    placeholder="e.g., ₹5,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Annual CTC
                  </label>
                  <Input
                    type="text"
                    value={editFormData.formData?.ctc || ''}
                    onChange={(e) => handleFormDataChange('ctc', e.target.value)}
                    placeholder="e.g., ₹6,00,000 per annum"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Date of Joining *
                  </label>
                  <Input
                    type="date"
                    value={editFormData.formData?.date_of_joining || ''}
                    onChange={(e) => handleFormDataChange('date_of_joining', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Work Location
                  </label>
                  <Input
                    type="text"
                    value={editFormData.formData?.work_location || ''}
                    onChange={(e) => handleFormDataChange('work_location', e.target.value)}
                    placeholder="e.g., Chennai (Hybrid)"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Reporting Manager
                  </label>
                  <Input
                    type="text"
                    value={editFormData.formData?.reporting_manager || ''}
                    onChange={(e) => handleFormDataChange('reporting_manager', e.target.value)}
                    placeholder="Manager's name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Candidate Address
                </label>
                <Input
                  type="text"
                  value={editFormData.formData?.candidate_address || ''}
                  onChange={(e) => handleFormDataChange('candidate_address', e.target.value)}
                  placeholder="Enter complete address"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={editFormData.formData?.phone || ''}
                  onChange={(e) => handleFormDataChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Department
                </label>
                <Input
                  type="text"
                  value={editFormData.formData?.department || ''}
                  onChange={(e) => handleFormDataChange('department', e.target.value)}
                  placeholder="e.g., Engineering"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Offer Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={editFormData.formData?.offer_expiry_date || ''}
                    onChange={(e) => handleFormDataChange('offer_expiry_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Probation Period
                  </label>
                  <Input
                    type="text"
                    value={editFormData.formData?.probation_period || ''}
                    onChange={(e) => handleFormDataChange('probation_period', e.target.value)}
                    placeholder="e.g., 3 months"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Working Hours
                  </label>
                  <Input
                    type="text"
                    value={editFormData.formData?.working_hours || ''}
                    onChange={(e) => handleFormDataChange('working_hours', e.target.value)}
                    placeholder="e.g., 9:30 AM to 6:30 PM"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Notice Period
                  </label>
                  <Input
                    type="text"
                    value={editFormData.formData?.notice_period || ''}
                    onChange={(e) => handleFormDataChange('notice_period', e.target.value)}
                    placeholder="e.g., 60 days"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Benefits & Perks
                </label>
                <Input
                  type="text"
                  value={editFormData.formData?.benefits || ''}
                  onChange={(e) => handleFormDataChange('benefits', e.target.value)}
                  placeholder="e.g., Health Insurance, Paid Leaves, Provident Fund"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingLetter(null);
                    setEditFormData({});
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Preview Modal Component
  const PreviewModal = () => {
    if (!previewLetter) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Preview Offer Letter</h2>
                <p className="text-sm text-gray-500">For {previewLetter.candidateName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handleDownload(previewLetter)}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => handlePrint(previewLetter)}
                size="sm"
                variant="outline"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewLetter(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-white shadow-inner">
              <div 
                dangerouslySetInnerHTML={{ __html: previewLetter.htmlContent }}
                className="offer-letter-preview"
              />
            </div>
          </div>
          
          <div className="flex justify-end p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={() => setPreviewLetter(null)}
              className="mr-2"
            >
              Close Preview
            </Button>
            <Button
              onClick={() => {
                handleDownload(previewLetter);
                setPreviewLetter(null);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download & Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      <EditModal />

      {/* Preview Modal */}
      <PreviewModal />

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by candidate name, email, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Letters Grid */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading generated letters...</p>
        </div>
      ) : filteredLetters.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium">No generated letters found</p>
          <p className="text-sm">Generate your first offer letter to see it here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredLetters.map((letter, index) => (
            <Card key={letter._id || letter.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {letter.candidateName}
                      </h3>
                      <p className="text-gray-600 text-sm">{letter.candidateEmail}</p>
                    </div>
                    {getStatusBadge(letter.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{letter.designation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(letter.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  {letter.templateName && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Template: {letter.templateName}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(letter)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(letter)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(letter)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  
                  {letter.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => handleSend(letter)}
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Send
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(letter)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneratedLetters;
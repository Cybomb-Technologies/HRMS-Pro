import React, { useState, useEffect, useCallback } from 'react';
import { hrLettersAPI } from '../utils/api';

// Import components
import LetterTypeSelector from '../components/hr-letters/LetterTypeSelector';
import LetterForm from '../components/hr-letters/LetterForm';
import LetterPreviewModal from '../components/hr-letters/LetterPreviewModal';
import LetterTable from '../components/hr-letters/LetterTable';

const HRLetters = () => {
  // State management
  const [letterType, setLetterType] = useState('');
  const [formData, setFormData] = useState({});
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [letters, setLetters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [editingLetter, setEditingLetter] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ NEW: Role-based permission states
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState([]);

  // JWT token decode function
  const decodeJWT = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error("Error decoding JWT:", error);
      return null;
    }
  };

  // ✅ NEW: Get current user role and permissions
  useEffect(() => {
    const initializeUserPermissions = async () => {
      try {
        const token = localStorage.getItem("hrms_token");
        if (token) {
          const decoded = decodeJWT(token);
          console.log("🔐 HR-Letters - Decoded user data:", decoded);
          
          if (decoded && decoded.role) {
            setCurrentUserRole(decoded.role);
            await fetchUserPermissions(decoded.role);
          } else {
            setCurrentUserRole('employee');
          }
        } else {
          setCurrentUserRole('employee');
        }
      } catch (error) {
        console.error("Error initializing permissions:", error);
        setCurrentUserRole('employee');
      }
    };

    initializeUserPermissions();
  }, []);

  const fetchUserPermissions = async (role) => {
    try {
      console.log("🔍 HR-Letters - Fetching permissions for role:", role);
      const res = await fetch('http://localhost:5000/api/settings/roles/roles');
      
      if (res.ok) {
        const data = await res.json();
        console.log("📋 HR-Letters - All roles data:", data.data);
        
        const userRoleData = data.data.find(r => r.name === role);
        console.log("🎯 HR-Letters - User role data:", userRoleData);
        
        if (userRoleData) {
          const hrLettersPermission = userRoleData.permissions.find(p => p.module === 'HR-Letters');
          console.log("📝 HR-Letters permission:", hrLettersPermission);
          setUserPermissions(userRoleData.permissions);
        } else {
          console.log("❌ HR-Letters - Role not found in database:", role);
          setUserPermissions([]);
        }
      } else {
        console.log("❌ HR-Letters - API failed, using default permissions");
        setUserPermissions(getDefaultPermissions(role));
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setUserPermissions(getDefaultPermissions(role));
    }
  };

  // Fallback permissions if API fails
  const getDefaultPermissions = (role) => {
    const defaults = {
      admin: [{ module: 'HR-Letters', accessLevel: 'crud' }],
      hr: [{ module: 'HR-Letters', accessLevel: 'crud' }],
      employee: [{ module: 'HR-Letters', accessLevel: 'read-self' }]
    };
    return defaults[role] || [];
  };

  // ✅ NEW: Correct Permission check function
  const hasPermission = (action) => {
    // Admin has full access
    if (currentUserRole === 'admin') return true;
    
    // Find HR-Letters module permission
    const hrLettersPermission = userPermissions.find(p => p.module === 'HR-Letters');
    if (!hrLettersPermission) {
      console.log("❌ No HR-Letters permission found for role:", currentUserRole);
      return false;
    }

    const accessLevel = hrLettersPermission.accessLevel;
    console.log(`🔐 HR-Letters - Checking ${action} permission for ${currentUserRole}:`, accessLevel);
    
    // ✅ UPDATED CORRECT LOGIC:
    switch (action) {
      case 'read':
        // Read access for: read, read-self, custom, crud
        return ['read', 'read-self', 'custom', 'crud'].includes(accessLevel);
      case 'read_self':
        // Read-self access only for read-self
        return accessLevel === 'read-self';
      case 'create':
        // Create access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      case 'update':
        // Update access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      case 'delete':
        // Delete access ONLY for crud (custom la delete illa)
        return accessLevel === 'crud';
      case 'generate_letter':
        // Generate letter access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      case 'download_letter':
        // Download letter access for: read, read-self, custom, crud
        return ['read', 'read-self', 'custom', 'crud'].includes(accessLevel);
      case 'edit_letter':
        // Edit letter access for: custom, crud
        return ['custom', 'crud'].includes(accessLevel);
      default:
        return false;
    }
  };

  // ✅ Check read permission on component load
  useEffect(() => {
    if (currentUserRole && !hasPermission('read')) {
      showToast("You don't have permission to view HR letters", 'error');
      setLetters([]);
    }
  }, [currentUserRole, userPermissions]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Fetch letters from API
  const fetchLetters = useCallback(async () => {
    if (!hasPermission('read')) {
      return;
    }

    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { letterType: filterType })
      };

      const response = await hrLettersAPI.getAllLetters(params);
      if (response.success) {
        setLetters(response.data);
        setTotalPages(response.pagination.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
      showToast('Failed to fetch letters', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filterType]);

  // Load letters on component mount and when filters change
  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  // Handle form reset when letter type changes
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        salary: {
          basic: 0,
          hra: 0,
          specialAllowance: 0,
          total: 0
        },
        companyDetails: {
          name: 'Cybomb Technologies Pvt Ltd.',
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
  }, [letterType, isEditing]);

  // Generate preview content
  const generatePreview = async () => {
    if (!hasPermission('generate_letter')) {
      showToast("You don't have permission to generate letters", 'error');
      return;
    }

    if (!letterType) {
      showToast('Please select a letter type first', 'error');
      return;
    }

    // Basic validation
    if (!formData.candidateName || !formData.candidateEmail || !formData.designation) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsPreviewLoading(true);
    try {
      const letterData = {
        letterType,
        ...formData,
        ...(isEditing && editingLetter && { 
          originalLetterId: editingLetter._id,
          isRegeneration: true 
        })
      };

      console.log('Generating letter with data:', letterData);
      const response = await hrLettersAPI.generateLetter(letterData);
      
      if (response.success) {
        const letterId = response.data.id;
        
        console.log('Letter generated successfully with ID:', letterId);
        
        try {
          const previewHTML = await hrLettersAPI.previewHTML(letterId);
          setPreviewContent(previewHTML);
          setPreviewModalOpen(true);
          showToast(
            isEditing ? 'Letter updated successfully! PDF is ready for download.' : 'Letter generated successfully! PDF is ready for download.', 
            'success'
          );
        } catch (previewError) {
          console.error('Preview fetch error:', previewError);
          showToast('Letter generated but preview failed: ' + previewError.message, 'warning');
        }
        
        fetchLetters();
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      showToast('Failed to generate letter: ' + error.message, 'error');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Handle edit and regenerate
  const handleEditAndRegenerate = async (letter) => {
    if (!hasPermission('edit_letter')) {
      showToast("You don't have permission to edit letters", 'error');
      return;
    }

    setIsEditing(true);
    setEditingLetter(letter);
    setLetterType(letter.letterType);
    
    // Populate form with letter data including all dynamic fields
    setFormData({
      candidateName: letter.candidateName,
      candidateEmail: letter.candidateEmail,
      candidateAddress: letter.candidateAddress,
      designation: letter.designation,
      department: letter.department,
      salary: letter.salary || {
        basic: 0,
        hra: 0,
        specialAllowance: 0,
        total: 0
      },
      previousSalary: letter.previousSalary || null,
      joiningDate: letter.joiningDate ? new Date(letter.joiningDate).toISOString().split('T')[0] : '',
      effectiveDate: letter.effectiveDate ? new Date(letter.effectiveDate).toISOString().split('T')[0] : '',
      lastWorkingDay: letter.lastWorkingDay ? new Date(letter.lastWorkingDay).toISOString().split('T')[0] : '',
      reason: letter.reason || '',
      duration: letter.duration || '',
      workLocation: letter.workLocation || '',
      reportingManager: letter.reportingManager || '',
      hikePercentage: letter.hikePercentage || 0,
      previousDesignation: letter.previousDesignation || '',
      promotionReason: letter.promotionReason || '',
      noticePeriod: letter.noticePeriod || '',
      responsibilities: letter.responsibilities || '',
      achievements: letter.achievements || '',
      companyDetails: letter.companyDetails || {
        name: 'Cybomb Technologies Pvt Ltd.',
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

    showToast('Letter data loaded for editing. Make changes and click "Update & Regenerate".', 'info');
  };

  // Generate and save letter (for final generation after preview)
  const generateAndSaveLetter = async () => {
    if (!hasPermission('generate_letter')) {
      showToast("You don't have permission to generate letters", 'error');
      return;
    }

    setIsGenerating(true);
    try {
      showToast('Letter saved successfully! You can now download the PDF.', 'success');
      setPreviewModalOpen(false);
      
      // Reset form
      setLetterType('');
      setFormData({});
      setIsEditing(false);
      setEditingLetter(null);
      
      // Refresh the list to show the new letter
      fetchLetters();
    } catch (error) {
      console.error('Error generating letter:', error);
      showToast('Failed to generate letter: ' + error.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle filter
  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingLetter(null);
    setLetterType('');
    setFormData({});
    showToast('Edit mode cancelled', 'info');
  };

  // Handle download letter
  const handleDownloadLetter = async (id) => {
    if (!hasPermission('download_letter')) {
      showToast("You don't have permission to download letters", 'error');
      return;
    }

    try {
      await hrLettersAPI.downloadPDF(id);
      showToast('PDF downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to download PDF', 'error');
    }
  };

  // Handle delete letter
  const handleDeleteLetter = async (id) => {
    if (!hasPermission('delete')) {
      showToast("You don't have permission to delete letters", 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this letter? This action cannot be undone.')) {
      return;
    }

    try {
      await hrLettersAPI.deleteLetter(id);
      showToast('Letter deleted successfully', 'success');
      fetchLetters();
    } catch (error) {
      showToast('Failed to delete letter', 'error');
    }
  };

  // Permission-based quick action handlers
  const handleQuickAction = (type) => {
    if (!hasPermission('generate_letter')) {
      showToast("You don't have permission to create letters", 'error');
      return;
    }
    
    setLetterType(type);
    let message = '';
    switch (type) {
      case 'offer':
        message = 'Offer letter form loaded';
        break;
      case 'appointment':
        message = 'Appointment letter form loaded';
        break;
      case 'experience':
        message = 'Experience letter form loaded';
        break;
      default:
        message = 'Letter form loaded';
    }
    showToast(message, 'info');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit HR Letter' : 'HR Letter Automation'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isEditing 
              ? 'Edit the letter details and regenerate with updated data' 
              : 'Generate, manage, and track HR letters for candidates and employees'
            }
          </p>
          {isEditing && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800 text-sm">
                <strong>Editing Mode:</strong> You are editing "{editingLetter?.candidateName}"'s {editingLetter?.letterType} letter. 
                Make your changes and click "Update & Regenerate" to create an updated version.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Edit Letter Details' : 'Generate New Letter'}
                </h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Letter Type Selector */}
                <LetterTypeSelector
                  selectedType={letterType}
                  onTypeChange={setLetterType}
                  disabled={isEditing || !hasPermission('generate_letter')}
                />

                {/* Dynamic Form */}
                <LetterForm
                  formData={formData}
                  onFormChange={setFormData}
                  letterType={letterType}
                  disabled={!hasPermission('generate_letter')}
                />

                {/* Action Buttons */}
                {hasPermission('generate_letter') && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Cancel Edit
                        </button>
                        <button
                          type="button"
                          onClick={generatePreview}
                          disabled={!letterType || isPreviewLoading}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPreviewLoading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </span>
                          ) : (
                            'Update & Regenerate'
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setLetterType('');
                            setFormData({});
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Clear Form
                        </button>
                        <button
                          type="button"
                          onClick={generatePreview}
                          disabled={!letterType || isPreviewLoading}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPreviewLoading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating...
                            </span>
                          ) : (
                            'Generate Letter'
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Statistics & Info */}
          <div className="space-y-6">
            {/* Statistics Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{letters.length}</div>
                  <div className="text-sm text-blue-600">Total Letters</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {letters.filter(l => l.letterType === 'offer').length}
                  </div>
                  <div className="text-sm text-green-600">Offer Letters</div>
                </div>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">How to Use</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Select a letter type from dropdown</li>
                <li>Fill in the candidate details</li>
                <li>Click "Generate Letter" to create</li>
                <li>Preview and download PDF</li>
                <li>Manage from the table below</li>
                {isEditing && (
                  <li className="font-semibold text-blue-600">
                    Edit Mode: Make changes and click "Update & Regenerate"
                  </li>
                )}
                {!hasPermission('generate_letter') && (
                  <li className="font-semibold text-red-600">
                    ⚠️ You have read-only access to HR Letters
                  </li>
                )}
              </ol>
            </div>

            {/* Quick Actions Card */}
            {hasPermission('generate_letter') && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickAction('offer')}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    📄 Create Offer Letter
                  </button>
                  <button
                    onClick={() => handleQuickAction('appointment')}
                    className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  >
                    📋 Create Appointment Letter
                  </button>
                  <button
                    onClick={() => handleQuickAction('experience')}
                    className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                  >
                    🏆 Create Experience Letter
                  </button>
                </div>
              </div>
            )}

            {/* Permission Info Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Your Permissions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">View Letters:</span>
                  <span className={`font-medium ${hasPermission('read') ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPermission('read') ? '✓ Allowed' : '✗ Denied'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Create Letters:</span>
                  <span className={`font-medium ${hasPermission('generate_letter') ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPermission('generate_letter') ? '✓ Allowed' : '✗ Denied'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Edit Letters:</span>
                  <span className={`font-medium ${hasPermission('edit_letter') ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPermission('edit_letter') ? '✓ Allowed' : '✗ Denied'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delete Letters:</span>
                  <span className={`font-medium ${hasPermission('delete') ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPermission('delete') ? '✓ Allowed' : '✗ Denied'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Download PDF:</span>
                  <span className={`font-medium ${hasPermission('download_letter') ? 'text-green-600' : 'text-red-600'}`}>
                    {hasPermission('download_letter') ? '✓ Allowed' : '✗ Denied'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Letters Table Section */}
        {hasPermission('read') && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                  <h2 className="text-lg font-medium text-gray-900">Generated Letters</h2>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={filterType}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="offer">Offer Letters</option>
                      <option value="appointment">Appointment Letters</option>
                      <option value="hike">Salary Hike</option>
                      <option value="promotion">Promotion Letters</option>
                      <option value="termination">Termination</option>
                      <option value="experience">Experience Letters</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <LetterTable
                  letters={letters}
                  onLetterUpdate={fetchLetters}
                  isLoading={isLoading}
                  onEditLetter={handleEditAndRegenerate}
                  onDownloadLetter={handleDownloadLetter}
                  onDeleteLetter={handleDeleteLetter}
                  canEdit={hasPermission('edit_letter')}
                  canDelete={hasPermission('delete')}
                  canDownload={hasPermission('download_letter')}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show message if no read permission */}
        {!hasPermission('read') && (
          <div className="mt-8 bg-white shadow rounded-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to view HR Letters. Please contact your administrator.
            </p>
            <div className="text-sm text-gray-500">
              Current Role: <span className="font-medium">{currentUserRole}</span> | 
              HR-Letters Access: <span className="font-medium">
                {userPermissions.find(p => p.module === 'HR-Letters')?.accessLevel || 'none'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <LetterPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        previewContent={previewContent}
        onGenerate={generateAndSaveLetter}
        isLoading={isGenerating}
        onDownload={async () => {
          if (!hasPermission('download_letter')) {
            showToast("You don't have permission to download letters", 'error');
            return;
          }

          try {
            if (editingLetter) {
              await hrLettersAPI.downloadPDF(editingLetter._id);
              showToast('PDF downloaded successfully', 'success');
            }
          } catch (error) {
            showToast('Failed to download PDF', 'error');
          }
        }}
        canDownload={hasPermission('download_letter')}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
          toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
          toast.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' :
          'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <div className="flex items-center">
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: '', type: '' })}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ✅ Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs">
          <div className="font-bold mb-2">🔐 HR-Letters Permission Debug</div>
          <div>Role: {currentUserRole}</div>
          <div>HR-Letters Access: {userPermissions.find(p => p.module === 'HR-Letters')?.accessLevel || 'none'}</div>
          <div className="mt-1">
            <div>Read: {hasPermission('read').toString()}</div>
            <div>Read Self: {hasPermission('read_self').toString()}</div>
            <div>Create: {hasPermission('create').toString()}</div>
            <div>Edit: {hasPermission('update').toString()}</div>
            <div>Delete: {hasPermission('delete').toString()}</div>
            <div>Generate: {hasPermission('generate_letter').toString()}</div>
            <div>Download: {hasPermission('download_letter').toString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLetters;